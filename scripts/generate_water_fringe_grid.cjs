const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const TILEIMG = path.join(ROOT, "tileimg");

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

// 4x4 Grid view of Water* tiles over a dark checkerboard background
function main() {
  const TILES = [
    "WaterLT", "WaterT", "WaterRT", "FullWater",
    "WaterL", "WaterLTCorner", "WaterRTCorner", "WaterR",
    "WaterLDCorner", "WaterD", "WaterRDCorner", "WaterLD",
    "WaterRD", null, null, null
  ];

  const COLS = 4;
  const ROWS = 4;
  const TILE_SIZE = 64;
  const PADDING = 12;
  const CELL_W = TILE_SIZE + PADDING * 2;
  const canvasW = COLS * CELL_W;
  const canvasH = ROWS * CELL_W;
  const canvas = Buffer.alloc(canvasW * canvasH * 4);

  // Background: Dark Slate #1e293b
  for (let i = 0; i < canvasW * canvasH; i++) {
    canvas[i * 4] = 30;
    canvas[i * 4 + 1] = 41;
    canvas[i * 4 + 2] = 59;
    canvas[i * 4 + 3] = 255;
  }

  TILES.forEach((tileName, idx) => {
    if (!tileName) return;
    const r = Math.floor(idx / COLS);
    const c = idx % COLS;
    const originX = c * CELL_W + PADDING;
    const originY = r * CELL_W + PADDING;

    // Checkerboard under tile
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const check = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) ? 60 : 45;
        const dstIdx = ((originY + y) * canvasW + (originX + x)) * 4;
        canvas[dstIdx] = check;
        canvas[dstIdx + 1] = check + 5;
        canvas[dstIdx + 2] = check + 15;
        canvas[dstIdx + 3] = 255;
      }
    }

    // Tile image
    const tImg = decodePngRgba(fs.readFileSync(path.join(TILEIMG, `${tileName}.png`)));
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const srcIdx = (y * TILE_SIZE + x) * 4;
        const dstIdx = ((originY + y) * canvasW + (originX + x)) * 4;
        blendPixel(
          canvas,
          dstIdx,
          tImg.data[srcIdx],
          tImg.data[srcIdx + 1],
          tImg.data[srcIdx + 2],
          tImg.data[srcIdx + 3]
        );
      }
    }
  });

  const outPath = path.join(TILEIMG, "water_fringe_12tiles_grid.png");
  fs.writeFileSync(outPath, encodePngRgba(canvasW, canvasH, canvas));
  console.log(`Saved grid preview to ${outPath}`);
}

main();
