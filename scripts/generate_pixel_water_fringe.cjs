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

// Generate Water* by filling the complementary empty space (Hole) of Grass*
function main() {
  const waterBase = decodePngRgba(fs.readFileSync(path.join(TILEIMG, "tile_row2_col7.png")));
  const W = 64, H = 64;

  const TILES = [
    { water: "WaterT", src: "GrassT" },
    { water: "WaterD", src: "GrassD" },
    { water: "WaterL", src: "GrassL" },
    { water: "WaterR", src: "GrassR" },
    { water: "WaterLT", src: "GrassLT" },
    { water: "WaterRT", src: "GrassRT", altSrc: "GrassRt" },
    { water: "WaterLD", src: "GrassLD" },
    { water: "WaterRD", src: "GrassRD" },
    { water: "WaterLTCorner", src: "GrassLTCorner" },
    { water: "WaterRTCorner", src: "GrassRTCorner" },
    { water: "WaterLDCorner", src: "GrassLDCorner" },
    { water: "WaterRDCorner", src: "GrassRDCorner" },
  ];

  // 1. FullWater (Full 100% Water)
  const fullWaterBuf = Buffer.alloc(W * H * 4);
  waterBase.data.copy(fullWaterBuf);
  fs.writeFileSync(path.join(TILEIMG, "FullWater.png"), encodePngRgba(W, H, fullWaterBuf));
  console.log("Saved FullWater.png");

  // 2. 12 Water* Fringe Tiles — filling the empty (hole) space of each Grass* tile
  for (const t of TILES) {
    let srcFile = path.join(TILEIMG, `${t.src}.png`);
    if (!fs.existsSync(srcFile) && t.altSrc) {
      srcFile = path.join(TILEIMG, `${t.altSrc}.png`);
    }
    const srcImg = decodePngRgba(fs.readFileSync(srcFile));
    const outBuf = Buffer.alloc(W * H * 4);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const grassAlpha = srcImg.data[idx + 3];

        // Water fills the inverse (the empty hole where grass is not)
        const waterAlpha = 255 - grassAlpha;

        if (waterAlpha > 0) {
          let r = waterBase.data[idx];
          let g = waterBase.data[idx + 1];
          let b = waterBase.data[idx + 2];

          // Check if bordering grass edge for subtle water depth contour
          let isEdge = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < W && ny >= 0 && ny < H && srcImg.data[(ny * W + nx) * 4 + 3] > 0) {
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

    const pngData = encodePngRgba(W, H, outBuf);
    fs.writeFileSync(path.join(TILEIMG, `${t.water}.png`), pngData);
    console.log(`Generated complementary ${t.water}.png from ${t.src}`);
  }
}

main();
