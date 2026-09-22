"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "..");
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

const TILES_12 = [
  "SoilLT", "SoilT", "SoilRT",
  "SoilL", "SoilR",
  "SoilLD", "SoilD", "SoilRD",
  "SoilLTCorner", "SoilRTCorner",
  "SoilLDCorner", "SoilRDCorner"
];

const W = 64;
const H = 64;

// Load 12 Soil masks
const masks = TILES_12.map(name => {
  const p = path.join(TILEIMG, `${name}.png`);
  const img = decodePngRgba(fs.readFileSync(p));
  const alphaBuf = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) {
    alphaBuf[i] = img.data[i * 4 + 3];
  }
  return alphaBuf;
});

// Helper to generate 12-strip for a biome from its 64x64 base PNG
function generateBiomeStrip(biomeName) {
  const baseImg = decodePngRgba(fs.readFileSync(path.join(TILEIMG, `${biomeName}.png`)));
  const stripW = 12 * W;
  const stripBuf = Buffer.alloc(stripW * H * 4);

  for (let t = 0; t < 12; t++) {
    const mask = masks[t];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const srcIdx = (y * W + x) * 4;
        const dstIdx = (y * stripW + (t * W + x)) * 4;
        const alpha = mask[y * W + x];

        stripBuf[dstIdx] = baseImg.data[srcIdx];
        stripBuf[dstIdx + 1] = baseImg.data[srcIdx + 1];
        stripBuf[dstIdx + 2] = baseImg.data[srcIdx + 2];
        stripBuf[dstIdx + 3] = alpha;
      }
    }
  }

  const stripPath = path.join(TILEIMG, `${biomeName}_fringe_12tiles_strip.png`);
  fs.writeFileSync(stripPath, encodePngRgba(stripW, H, stripBuf));
  console.log(`Saved ${biomeName}_fringe_12tiles_strip.png (768x64)`);
}

generateBiomeStrip("rock");
generateBiomeStrip("sand");
generateBiomeStrip("snow");

console.log("All biome 12-tile strips generated successfully from NanoBanana assets!");
