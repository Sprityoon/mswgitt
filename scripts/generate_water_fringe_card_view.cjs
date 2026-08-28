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

function main() {
  const TILES = [
    { name: "WaterLT", label: "WaterLT (TL Edge)" },
    { name: "WaterT", label: "WaterT (Top Edge)" },
    { name: "WaterRT", label: "WaterRT (TR Edge)" },
    { name: "FullWater", label: "FullWater (Center)" },
    { name: "WaterL", label: "WaterL (Left Edge)" },
    { name: "WaterLTCorner", label: "WaterLTCorner (TL Corner)" },
    { name: "WaterRTCorner", label: "WaterRTCorner (TR Corner)" },
    { name: "WaterR", label: "WaterR (Right Edge)" },
    { name: "WaterLDCorner", label: "WaterLDCorner (BL Corner)" },
    { name: "WaterD", label: "WaterD (Bottom Edge)" },
    { name: "WaterRDCorner", label: "WaterRDCorner (BR Corner)" },
    { name: "WaterLD", label: "WaterLD (BL Edge)" },
    { name: "WaterRD", label: "WaterRD (BR Edge)" }
  ];

  const CARD_W = 190;
  const CARD_H = 100;
  const COLS = 4;
  const ROWS = 4;
  const GAP = 14;
  const PAD = 20;

  const canvasW = PAD * 2 + COLS * CARD_W + (COLS - 1) * GAP;
  const canvasH = PAD * 2 + ROWS * CARD_H + (ROWS - 1) * GAP;
  const canvas = Buffer.alloc(canvasW * canvasH * 4);

  // Background: Rich Dark Slate #0f172a
  for (let i = 0; i < canvasW * canvasH; i++) {
    canvas[i * 4] = 15;
    canvas[i * 4 + 1] = 23;
    canvas[i * 4 + 2] = 42;
    canvas[i * 4 + 3] = 255;
  }

  TILES.forEach((t, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const cardX = PAD + col * (CARD_W + GAP);
    const cardY = PAD + row * (CARD_H + GAP);

    // Card background #1e293b with border #334155
    for (let y = 0; y < CARD_H; y++) {
      for (let x = 0; x < CARD_W; x++) {
        const isBorder = x === 0 || x === CARD_W - 1 || y === 0 || y === CARD_H - 1;
        const dstIdx = ((cardY + y) * canvasW + (cardX + x)) * 4;
        if (isBorder) {
          canvas[dstIdx] = 51;
          canvas[dstIdx + 1] = 65;
          canvas[dstIdx + 2] = 85;
          canvas[dstIdx + 3] = 255;
        } else {
          canvas[dstIdx] = 30;
          canvas[dstIdx + 1] = 41;
          canvas[dstIdx + 2] = 59;
          canvas[dstIdx + 3] = 255;
        }
      }
    }

    // Checkerboard behind tile (64x64) at cardX + 16, cardY + 18
    const tileX = cardX + 16;
    const tileY = cardY + 18;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const check = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) ? 60 : 45;
        const dstIdx = ((tileY + y) * canvasW + (tileX + x)) * 4;
        canvas[dstIdx] = check;
        canvas[dstIdx + 1] = check + 5;
        canvas[dstIdx + 2] = check + 15;
        canvas[dstIdx + 3] = 255;
      }
    }

    // Tile image
    const tileImg = decodePngRgba(fs.readFileSync(path.join(TILEIMG, `${t.name}.png`)));
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const srcIdx = (y * 64 + x) * 4;
        const dstIdx = ((tileY + y) * canvasW + (tileX + x)) * 4;
        blendPixel(
          canvas,
          dstIdx,
          tileImg.data[srcIdx],
          tileImg.data[srcIdx + 1],
          tileImg.data[srcIdx + 2],
          tileImg.data[srcIdx + 3]
        );
      }
    }
  });

  const outPath = path.join(TILEIMG, "water_fringe_12tiles_card_view.png");
  fs.writeFileSync(outPath, encodePngRgba(canvasW, canvasH, canvas));
  console.log(`Saved card view to ${outPath}`);
}

main();
