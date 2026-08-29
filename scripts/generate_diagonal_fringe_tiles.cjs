const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const TILEIMG = path.join(ROOT, "tileimg");

// ---- PNG Decode (RGBA) ----
function decodePngRgba(buf) {
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const idatChunks = [];
  let pos = 8;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos + 4, pos + 8).toString("ascii");
    if (type === "IDAT") idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = w * 4 + 1;
  const out = Buffer.alloc(w * h * 4);
  const scanlines = [];
  for (let y = 0; y < h; y++) {
    const filter = inflated[y * stride];
    const line = Buffer.alloc(w * 4);
    for (let x = 0; x < w * 4; x++) {
      const raw = inflated[y * stride + 1 + x];
      let val = raw;
      const bpp = 4;
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = y > 0 ? scanlines[y - 1][x] : 0;
      const c = y > 0 && x >= bpp ? scanlines[y - 1][x - bpp] : 0;
      if (filter === 0) val = raw;
      else if (filter === 1) val = (raw + a) & 0xff;
      else if (filter === 2) val = (raw + b) & 0xff;
      else if (filter === 3) val = (raw + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = c;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        val = (raw + pr) & 0xff;
      }
      line[x] = val;
    }
    scanlines.push(line);
    line.copy(out, y * w * 4);
  }
  return { w, h, data: out };
}

// ---- PNG Encode ----
function crcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
}
const CRCT = crcTable();
function crc32(buf2) {
  let c = 0xffffffff;
  for (let i = 0; i < buf2.length; i++) c = CRCT[(c ^ buf2[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePngRgba(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function blendPixel(dst, dstW, x, y, sr, sg, sb, sa) {
  if (sa === 0) return;
  const dstIdx = (y * dstW + x) * 4;
  if (sa === 255) {
    dst[dstIdx] = sr;
    dst[dstIdx + 1] = sg;
    dst[dstIdx + 2] = sb;
    dst[dstIdx + 3] = 255;
    return;
  }
  const a = sa / 255;
  const invA = 1 - a;
  const dr = dst[dstIdx];
  const dg = dst[dstIdx + 1];
  const db = dst[dstIdx + 2];
  dst[dstIdx] = Math.round(sr * a + dr * invA);
  dst[dstIdx + 1] = Math.round(sg * a + dg * invA);
  dst[dstIdx + 2] = Math.round(sb * a + db * invA);
  dst[dstIdx + 3] = 255;
}

function main() {
  const W = 64, H = 64;

  // 1. Load source base textures
  const waterBase = decodePngRgba(fs.readFileSync(path.join(TILEIMG, "tile_row2_col7.png")));
  
  // Reconstruct Full Soil texture from 4 pure quadrants of opposite corner tiles (100% hole-free & artifact-free)
  const fullSoilBuf = Buffer.alloc(W * H * 4);
  const ltCorner = decodePngRgba(fs.readFileSync(path.join(TILEIMG, "SoilLTCorner.png"))); // BR quadrant is pure
  const rdCorner = decodePngRgba(fs.readFileSync(path.join(TILEIMG, "SoilRDCorner.png"))); // TL quadrant is pure
  const rtCorner = decodePngRgba(fs.readFileSync(path.join(TILEIMG, "SoilRTCorner.png"))); // BL quadrant is pure
  const ldCorner = decodePngRgba(fs.readFileSync(path.join(TILEIMG, "SoilLDCorner.png"))); // TR quadrant is pure

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      // TL from rdCorner
      const idx = (y * W + x) * 4;
      fullSoilBuf[idx] = rdCorner.data[idx];
      fullSoilBuf[idx + 1] = rdCorner.data[idx + 1];
      fullSoilBuf[idx + 2] = rdCorner.data[idx + 2];
      fullSoilBuf[idx + 3] = 255;
    }
    for (let x = 32; x < 64; x++) {
      // TR from ldCorner
      const idx = (y * W + x) * 4;
      fullSoilBuf[idx] = ldCorner.data[idx];
      fullSoilBuf[idx + 1] = ldCorner.data[idx + 1];
      fullSoilBuf[idx + 2] = ldCorner.data[idx + 2];
      fullSoilBuf[idx + 3] = 255;
    }
  }
  for (let y = 32; y < 64; y++) {
    for (let x = 0; x < 32; x++) {
      // BL from rtCorner
      const idx = (y * W + x) * 4;
      fullSoilBuf[idx] = rtCorner.data[idx];
      fullSoilBuf[idx + 1] = rtCorner.data[idx + 1];
      fullSoilBuf[idx + 2] = rtCorner.data[idx + 2];
      fullSoilBuf[idx + 3] = 255;
    }
    for (let x = 32; x < 64; x++) {
      // BR from ltCorner
      const idx = (y * W + x) * 4;
      fullSoilBuf[idx] = ltCorner.data[idx];
      fullSoilBuf[idx + 1] = ltCorner.data[idx + 1];
      fullSoilBuf[idx + 2] = ltCorner.data[idx + 2];
      fullSoilBuf[idx + 3] = 255;
    }
  }

  // Save explicit FullSoil.png for reference
  fs.writeFileSync(path.join(TILEIMG, "FullSoil.png"), encodePngRgba(W, H, fullSoilBuf));
  console.log("Reconstructed and saved clean FullSoil.png (100% artifact-free)");

  // 2. Load the reference diagonal grass tiles (SubGrassLTRD and SubGrassRTLD)
  // SubGrassLTRD = 69d4c5752a9a745f.png (Holes at LT & RD, Grass at TR & BL)
  // SubGrassRTLD = e50a634ceaa34ea9.png (Holes at RT & LD, Grass at TL & BR)
  const grassLTRD = decodePngRgba(fs.readFileSync(path.join(TILEIMG, "69d4c5752a9a745f.png")));
  const grassRTLD = decodePngRgba(fs.readFileSync(path.join(TILEIMG, "e50a634ceaa34ea9.png")));

  // Also save friendly named copies of SubGrass
  fs.writeFileSync(path.join(TILEIMG, "SubGrassLTRD.png"), encodePngRgba(W, H, grassLTRD.data));
  fs.writeFileSync(path.join(TILEIMG, "SubGrassRTLD.png"), encodePngRgba(W, H, grassRTLD.data));
  console.log("Saved SubGrassLTRD.png and SubGrassRTLD.png");

  // 3. Generate WaterLTRD & WaterRTLD (Complementary to Grass)
  // WaterLTRD has water at LT (TL) and RD (BR), transparent at RT (TR) and LD (BL)
  // WaterRTLD has water at RT (TR) and LD (BL), transparent at LT (TL) and RD (BR)
  function createWaterDiagonal(grassImg, name) {
    const outBuf = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const grassAlpha = grassImg.data[idx + 3];
        const waterAlpha = 255 - grassAlpha; // Complementary hole

        if (waterAlpha > 0) {
          let r = waterBase.data[idx];
          let g = waterBase.data[idx + 1];
          let b = waterBase.data[idx + 2];

          // Check if bordering grass for contour shadow
          let isEdge = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < W && ny >= 0 && ny < H && grassImg.data[(ny * W + nx) * 4 + 3] > 0) {
                isEdge = true;
                break;
              }
            }
            if (isEdge) break;
          }

          if (isEdge) {
            r = Math.floor(r * 0.82);
            g = Math.floor(g * 0.85);
            b = Math.floor(b * 0.95);
          }

          outBuf[idx] = r;
          outBuf[idx + 1] = g;
          outBuf[idx + 2] = b;
          outBuf[idx + 3] = waterAlpha;
        } else {
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
        }
      }
    }
    const png = encodePngRgba(W, H, outBuf);
    fs.writeFileSync(path.join(TILEIMG, `${name}.png`), png);
    console.log(`Generated ${name}.png`);
    return { data: outBuf, png };
  }

  const waterLTRD = createWaterDiagonal(grassLTRD, "WaterLTRD");
  const waterRTLD = createWaterDiagonal(grassRTLD, "WaterRTLD");

  // 4. Generate SoilLTRD & SoilRTLD (Holes at LT/RD and RT/LD, soil in the body)
  function createSoilDiagonal(grassImg, name) {
    const outBuf = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const soilAlpha = grassImg.data[idx + 3]; // Hole is transparent, Soil body is opaque

        if (soilAlpha > 0) {
          let r = fullSoilBuf[idx];
          let g = fullSoilBuf[idx + 1];
          let b = fullSoilBuf[idx + 2];

          // Check if bordering hole for subtle soil edge shading
          let isEdge = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < W && ny >= 0 && ny < H && grassImg.data[(ny * W + nx) * 4 + 3] === 0) {
                isEdge = true;
                break;
              }
            }
            if (isEdge) break;
          }

          if (isEdge) {
            r = Math.floor(r * 0.88);
            g = Math.floor(g * 0.88);
            b = Math.floor(b * 0.88);
          }

          outBuf[idx] = r;
          outBuf[idx + 1] = g;
          outBuf[idx + 2] = b;
          outBuf[idx + 3] = soilAlpha;
        } else {
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
        }
      }
    }
    const png = encodePngRgba(W, H, outBuf);
    fs.writeFileSync(path.join(TILEIMG, `${name}.png`), png);
    // Also save alias with underscore
    const aliasName = name.replace("Soil", "Soil_");
    fs.writeFileSync(path.join(TILEIMG, `${aliasName}.png`), png);
    console.log(`Generated ${name}.png and ${aliasName}.png`);
    return { data: outBuf, png };
  }

  const soilLTRD = createSoilDiagonal(grassLTRD, "SoilLTRD");
  const soilRTLD = createSoilDiagonal(grassRTLD, "SoilRTLD");

  // 5. Generate 4-Tile Horizontal Strip (256 x 64 px)
  // Strip Order: WaterLTRD, WaterRTLD, SoilLTRD, SoilRTLD
  const TILES_4 = [
    { name: "WaterLTRD", buf: waterLTRD.data },
    { name: "WaterRTLD", buf: waterRTLD.data },
    { name: "SoilLTRD", buf: soilLTRD.data },
    { name: "SoilRTLD", buf: soilRTLD.data },
  ];

  const stripW = TILES_4.length * W;
  const stripH = H;
  const stripBuf = Buffer.alloc(stripW * stripH * 4);

  TILES_4.forEach((t, i) => {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const srcIdx = (y * W + x) * 4;
        const dstIdx = (y * stripW + (i * W + x)) * 4;
        stripBuf[dstIdx] = t.buf[srcIdx];
        stripBuf[dstIdx + 1] = t.buf[srcIdx + 1];
        stripBuf[dstIdx + 2] = t.buf[srcIdx + 2];
        stripBuf[dstIdx + 3] = t.buf[srcIdx + 3];
      }
    }
  });

  const stripPath = path.join(TILEIMG, "water_soil_diagonal_4tiles_strip.png");
  fs.writeFileSync(stripPath, encodePngRgba(stripW, stripH, stripBuf));
  console.log(`Saved 4-tile diagonal strip (256x64): ${stripPath}`);

  // Also save standard name alias
  fs.writeFileSync(path.join(TILEIMG, "diagonal_fringe_4tiles_strip.png"), encodePngRgba(stripW, stripH, stripBuf));

  // 6. Generate 4-Tile Showcase / Card View with checkerboard background (512 x 160 px, 2x scale)
  const cardScale = 2;
  const cardTileW = W * cardScale;
  const cardTileH = H * cardScale;
  const margin = 16;
  const cardW = TILES_4.length * cardTileW + (TILES_4.length + 1) * margin;
  const cardH = cardTileH + margin * 2 + 24; // Extra space for labels
  const cardBuf = Buffer.alloc(cardW * cardH * 4);

  // Background - Sleek Dark Slate
  for (let y = 0; y < cardH; y++) {
    for (let x = 0; x < cardW; x++) {
      const idx = (y * cardW + x) * 4;
      cardBuf[idx] = 24;
      cardBuf[idx + 1] = 28;
      cardBuf[idx + 2] = 36;
      cardBuf[idx + 3] = 255;
    }
  }

  // Draw checkerboard inside tile frames & blend tiles
  TILES_4.forEach((t, i) => {
    const startX = margin + i * (cardTileW + margin);
    const startY = margin;

    // Tile Box Checkerboard
    for (let py = 0; py < cardTileH; py++) {
      for (let px = 0; px < cardTileW; px++) {
        const cx = startX + px;
        const cy = startY + py;
        const check = ((Math.floor(px / 8) + Math.floor(py / 8)) % 2 === 0);
        const bgC = check ? 48 : 36;
        const cIdx = (cy * cardW + cx) * 4;
        cardBuf[cIdx] = bgC;
        cardBuf[cIdx + 1] = bgC + 4;
        cardBuf[cIdx + 2] = bgC + 10;
        cardBuf[cIdx + 3] = 255;

        // Sample tile (nearest neighbor 2x)
        const srcX = Math.floor(px / cardScale);
        const srcY = Math.floor(py / cardScale);
        const srcIdx = (srcY * W + srcX) * 4;
        const sr = t.buf[srcIdx];
        const sg = t.buf[srcIdx + 1];
        const sb = t.buf[srcIdx + 2];
        const sa = t.buf[srcIdx + 3];

        blendPixel(cardBuf, cardW, cx, cy, sr, sg, sb, sa);
      }
    }
  });

  const cardPath = path.join(TILEIMG, "water_soil_diagonal_4tiles_card_view.png");
  fs.writeFileSync(cardPath, encodePngRgba(cardW, cardH, cardBuf));
  console.log(`Saved 4-tile diagonal card view: ${cardPath}`);
}

main();
