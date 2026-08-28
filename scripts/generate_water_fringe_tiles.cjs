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

// ---- Organic Shoreline Contour Masks ----
// A natural water fringe should have rounded corners, gentle sinusoidal wave curves along straight edges,
// and smooth fillets in inner corners.

function getWaterAlphaMask(tileType, w, h) {
  const mask = Buffer.alloc(w * h); // 0 (transparent land) to 255 (full water)

  // Gentle wave offset function: ~2 to 3 px organic wave amplitude
  function wave(t) {
    return Math.sin(t * Math.PI * 2) * 2.5 + Math.sin(t * Math.PI * 4) * 1.0;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      let isWater = 0; // 0..255

      const u = x / (w - 1);
      const v = y / (h - 1);

      switch (tileType) {
        case "FullWater":
          isWater = 255;
          break;

        // Straight edges (water on one half, with wavy shoreline around y=24 or x=24)
        case "WaterT": {
          // Land is Top, Water is Bottom. Shoreline around y = 20 + wave(u)
          const shoreY = 20 + wave(u);
          if (y >= shoreY) {
            const dist = y - shoreY;
            isWater = Math.min(255, Math.floor(dist * 60 + 50));
          }
          break;
        }
        case "WaterD": {
          // Land is Bottom, Water is Top. Shoreline around y = 44 + wave(u)
          const shoreY = 44 + wave(u);
          if (y <= shoreY) {
            const dist = shoreY - y;
            isWater = Math.min(255, Math.floor(dist * 60 + 50));
          }
          break;
        }
        case "WaterL": {
          // Land is Left, Water is Right. Shoreline around x = 20 + wave(v)
          const shoreX = 20 + wave(v);
          if (x >= shoreX) {
            const dist = x - shoreX;
            isWater = Math.min(255, Math.floor(dist * 60 + 50));
          }
          break;
        }
        case "WaterR": {
          // Land is Right, Water is Left. Shoreline around x = 44 + wave(v)
          const shoreX = 44 + wave(v);
          if (x <= shoreX) {
            const dist = shoreX - x;
            isWater = Math.min(255, Math.floor(dist * 60 + 50));
          }
          break;
        }

        // Convex Outer Corners (water in one corner, rounded arc of shoreline)
        case "WaterLT": {
          // Water in Bottom-Right (x >= 20, y >= 20) with rounded arc connecting (20, 63) to (63, 20)
          // Center of corner arc around (63, 63), radius approx 44
          const dx = 63 - x;
          const dy = 63 - y;
          const distFromCorner = Math.sqrt(dx * dx + dy * dy);
          const maxR = 44 + wave((Math.atan2(dy, dx) / (Math.PI / 2)));
          if (distFromCorner <= maxR) {
            const d = maxR - distFromCorner;
            isWater = Math.min(255, Math.floor(d * 50 + 60));
          }
          break;
        }
        case "WaterRT": {
          // Water in Bottom-Left (x <= 44, y >= 20) with rounded arc
          const dx = x;
          const dy = 63 - y;
          const distFromCorner = Math.sqrt(dx * dx + dy * dy);
          const maxR = 44 + wave((Math.atan2(dy, dx) / (Math.PI / 2)));
          if (distFromCorner <= maxR) {
            const d = maxR - distFromCorner;
            isWater = Math.min(255, Math.floor(d * 50 + 60));
          }
          break;
        }
        case "WaterLD": {
          // Water in Top-Right (x >= 20, y <= 44) with rounded arc
          const dx = 63 - x;
          const dy = y;
          const distFromCorner = Math.sqrt(dx * dx + dy * dy);
          const maxR = 44 + wave((Math.atan2(dy, dx) / (Math.PI / 2)));
          if (distFromCorner <= maxR) {
            const d = maxR - distFromCorner;
            isWater = Math.min(255, Math.floor(d * 50 + 60));
          }
          break;
        }
        case "WaterRD": {
          // Water in Top-Left (x <= 44, y <= 44) with rounded arc
          const dx = x;
          const dy = y;
          const distFromCorner = Math.sqrt(dx * dx + dy * dy);
          const maxR = 44 + wave((Math.atan2(dy, dx) / (Math.PI / 2)));
          if (distFromCorner <= maxR) {
            const d = maxR - distFromCorner;
            isWater = Math.min(255, Math.floor(d * 50 + 60));
          }
          break;
        }

        // Concave Inner Corners (land in one corner, water fills the other 3 quadrants with rounded fillet)
        case "WaterLTCorner": {
          // Land is Top-Left corner (x <= 20, y <= 20) with rounded cutout
          const dx = x;
          const dy = y;
          const distFromOrigin = Math.sqrt(dx * dx + dy * dy);
          const cutR = 24 + wave((Math.atan2(dy, dx) / (Math.PI / 2)));
          if (distFromOrigin >= cutR) {
            const d = distFromOrigin - cutR;
            isWater = Math.min(255, Math.floor(d * 50 + 60));
          }
          break;
        }
        case "WaterRTCorner": {
          // Land is Top-Right corner (x >= 44, y <= 20)
          const dx = 63 - x;
          const dy = y;
          const distFromOrigin = Math.sqrt(dx * dx + dy * dy);
          const cutR = 24 + wave((Math.atan2(dy, dx) / (Math.PI / 2)));
          if (distFromOrigin >= cutR) {
            const d = distFromOrigin - cutR;
            isWater = Math.min(255, Math.floor(d * 50 + 60));
          }
          break;
        }
        case "WaterLDCorner": {
          // Land is Bottom-Left corner (x <= 20, y >= 44)
          const dx = x;
          const dy = 63 - y;
          const distFromOrigin = Math.sqrt(dx * dx + dy * dy);
          const cutR = 24 + wave((Math.atan2(dy, dx) / (Math.PI / 2)));
          if (distFromOrigin >= cutR) {
            const d = distFromOrigin - cutR;
            isWater = Math.min(255, Math.floor(d * 50 + 60));
          }
          break;
        }
        case "WaterRDCorner": {
          // Land is Bottom-Right corner (x >= 44, y >= 44)
          const dx = 63 - x;
          const dy = 63 - y;
          const distFromOrigin = Math.sqrt(dx * dx + dy * dy);
          const cutR = 24 + wave((Math.atan2(dy, dx) / (Math.PI / 2)));
          if (distFromOrigin >= cutR) {
            const d = distFromOrigin - cutR;
            isWater = Math.min(255, Math.floor(d * 50 + 60));
          }
          break;
        }
      }

      mask[idx] = isWater;
    }
  }

  return mask;
}

function main() {
  const basePath = path.join(TILEIMG, "tile_row2_col7.png");
  const baseImg = decodePngRgba(fs.readFileSync(basePath));
  const { w, h, data } = baseImg;
  console.log(`Loaded base water tile: ${w}x${h}`);

  const TILE_NAMES = [
    "FullWater",
    "WaterT", "WaterD", "WaterL", "WaterR",
    "WaterLT", "WaterRT", "WaterLD", "WaterRD",
    "WaterLTCorner", "WaterRTCorner", "WaterLDCorner", "WaterRDCorner"
  ];

  for (const name of TILE_NAMES) {
    const alphaMask = getWaterAlphaMask(name, w, h);
    const outBuf = Buffer.alloc(w * h * 4);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const maskVal = alphaMask[y * w + x];

        if (maskVal > 0) {
          outBuf[idx] = data[idx];         // R
          outBuf[idx + 1] = data[idx + 1]; // G
          outBuf[idx + 2] = data[idx + 2]; // B
          outBuf[idx + 3] = maskVal;       // A (soft alpha edge)
        } else {
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
        }
      }
    }

    const pngData = encodePngRgba(w, h, outBuf);
    const outName = `${name}.png`;
    fs.writeFileSync(path.join(TILEIMG, outName), pngData);
    console.log(`Generated organic tileimg/${outName}`);
  }
}

main();
