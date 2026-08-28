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

function blendPixel(dst, dstIdx, sr, sg, sb, sa) {
  if (sa === 0) return;
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
  // Standard 12-tile order matching Soil* and WetRim*
  const TILES_12 = [
    "WaterLT", "WaterT", "WaterRT",
    "WaterL", "WaterR",
    "WaterLD", "WaterD", "WaterRD",
    "WaterLTCorner", "WaterRTCorner",
    "WaterLDCorner", "WaterRDCorner"
  ];

  const TILE_SIZE = 64;

  // 1. Generate 12-Tile Horizontal Strip (768 x 64 px)
  const stripW = TILES_12.length * TILE_SIZE;
  const stripH = TILE_SIZE;
  const stripBuf = Buffer.alloc(stripW * stripH * 4);

  TILES_12.forEach((name, i) => {
    const tileImg = decodePngRgba(fs.readFileSync(path.join(TILEIMG, `${name}.png`)));
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const srcIdx = (y * TILE_SIZE + x) * 4;
        const dstIdx = (y * stripW + (i * TILE_SIZE + x)) * 4;
        stripBuf[dstIdx] = tileImg.data[srcIdx];
        stripBuf[dstIdx + 1] = tileImg.data[srcIdx + 1];
        stripBuf[dstIdx + 2] = tileImg.data[srcIdx + 2];
        stripBuf[dstIdx + 3] = tileImg.data[srcIdx + 3];
      }
    }
  });

  const stripPath = path.join(TILEIMG, "water_fringe_12tiles_strip.png");
  fs.writeFileSync(stripPath, encodePngRgba(stripW, stripH, stripBuf));
  console.log(`Saved 12-tile strip (768x64): ${stripPath}`);

  // 2. Generate 13-Tile Strip (with FullWater, 832 x 64 px)
  const TILES_13 = ["FullWater", ...TILES_12];
  const strip13W = TILES_13.length * TILE_SIZE;
  const strip13H = TILE_SIZE;
  const strip13Buf = Buffer.alloc(strip13W * strip13H * 4);

  TILES_13.forEach((name, i) => {
    const tileImg = decodePngRgba(fs.readFileSync(path.join(TILEIMG, `${name}.png`)));
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const srcIdx = (y * TILE_SIZE + x) * 4;
        const dstIdx = (y * strip13W + (i * TILE_SIZE + x)) * 4;
        strip13Buf[dstIdx] = tileImg.data[srcIdx];
        strip13Buf[dstIdx + 1] = tileImg.data[srcIdx + 1];
        strip13Buf[dstIdx + 2] = tileImg.data[srcIdx + 2];
        strip13Buf[dstIdx + 3] = tileImg.data[srcIdx + 3];
      }
    }
  });

  const strip13Path = path.join(TILEIMG, "water_fringe_13tiles_strip.png");
  fs.writeFileSync(strip13Path, encodePngRgba(strip13W, strip13H, strip13Buf));
  console.log(`Saved 13-tile strip (832x64): ${strip13Path}`);

  // 3. Generate 4x4 Grid View (256x256 px) with dark checkerboard background
  const gridW = 4 * TILE_SIZE;
  const gridH = 4 * TILE_SIZE;
  const gridBuf = Buffer.alloc(gridW * gridH * 4);

  // Checkerboard background
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const idx = (y * gridW + x) * 4;
      const c = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) ? 42 : 32;
      gridBuf[idx] = c;
      gridBuf[idx + 1] = c + 8;
      gridBuf[idx + 2] = c + 18;
      gridBuf[idx + 3] = 255;
    }
  }

  const GRID_LAYOUT = [
    "WaterLT", "WaterT", "WaterRT", "FullWater",
    "WaterL", "WaterLTCorner", "WaterRTCorner", "WaterR",
    "WaterLDCorner", "WaterD", "WaterRDCorner", "WaterLD",
    "WaterRD", null, null, null
  ];

  GRID_LAYOUT.forEach((name, idx) => {
    if (!name) return;
    const r = Math.floor(idx / 4);
    const c = idx % 4;
    const tileImg = decodePngRgba(fs.readFileSync(path.join(TILEIMG, `${name}.png`)));
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const srcIdx = (y * TILE_SIZE + x) * 4;
        const dstIdx = ((r * TILE_SIZE + y) * gridW + (c * TILE_SIZE + x)) * 4;
        blendPixel(
          gridBuf,
          dstIdx,
          tileImg.data[srcIdx],
          tileImg.data[srcIdx + 1],
          tileImg.data[srcIdx + 2],
          tileImg.data[srcIdx + 3]
        );
      }
    }
  });

  const gridPath = path.join(TILEIMG, "water_fringe_12tiles_grid.png");
  fs.writeFileSync(gridPath, encodePngRgba(gridW, gridH, gridBuf));
  console.log(`Saved 4x4 grid (256x256): ${gridPath}`);
}

main();
