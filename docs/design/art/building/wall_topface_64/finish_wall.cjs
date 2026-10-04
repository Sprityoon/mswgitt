// Rebuild the generated draft on the exact 64px tile grid; edit native PXG, not MSW files.
// Run from project root: node docs/design/art/building/wall_topface_64/finish_wall.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const text = fs.readFileSync(path.join(root, 'draft.pxg'), 'utf8');
const lines = text.trimEnd().split(/\r?\n/);
const split = lines.indexOf('grid');
const header = lines.slice(0, split + 1);
const draft = lines.slice(split + 1).map(line => [...line]);
const palette = new Map(header.slice(2, -1).filter(line => !line.startsWith('//')).map(line => line.split(' ')));
const rgb = key => palette.get(key).slice(1, 7).match(/../g).map(v => parseInt(v, 16));
const colors = [...palette.keys()].filter(key => palette.get(key).startsWith('#'));
const nearest = color => colors.reduce((best, key) => {
  const distance = rgb(key).reduce((sum, value, i) => sum + (value - color[i]) ** 2, 0);
  return distance < best.distance ? { key, distance } : best;
}, {key: colors[0], distance: Infinity}).key;
if (draft.length !== 256 || draft.some(row => row.length !== 256)) throw new Error('Draft must be 256x256.');

// Full-connected tile supplies the dark material; a two-pixel periodic boundary removes seams.
const counts = new Map();
for (let y = 196; y < 252; y++) for (let x = 196; x < 252; x++) {
  const key = draft[y][x]; counts.set(key, (counts.get(key) || 0) + 1);
}
const base = [...counts].sort((a, b) => b[1] - a[1])[0][0];
const baseRgb = rgb(base);
const top = Array.from({length: 64}, (_, y) => Array.from({length: 64}, (_, x) => {
  if (x < 2 || x > 61 || y < 2 || y > 61) return base;
  const sample = rgb(draft[196 + Math.floor(y * 56 / 64)][196 + Math.floor(x * 56 / 64)]);
  return nearest(sample.map((value, i) => Math.round(baseRgb[i] + (value - baseRgb[i]) * 0.4)));
}));

// One shared face: lip 6px, plaster 19px, stone 9px, bottom outline 1px.
// Sample the center of row 3 column 4: its face has no exterior posts.
const band = (start, height, outputHeight) => Array.from({length: outputHeight}, (_, y) =>
  Array.from({length: 64}, (_, x) => draft[128 + start + Math.floor(y * height / outputHeight)][194 + Math.floor(x * 60 / 64)]));
const lip = band(31, 6, 6);
const plaster = band(38, 14, 19);
const stone = band(53, 10, 9);
const outline = nearest([66, 42, 26]);
const face = [...lip, ...plaster, ...stone, Array(64).fill(outline)];
// Periodic endpoints have the same material at every height, with no vertical joint line.
for (const row of face) {
  const edge = row[16];
  row[0] = row[1] = row[62] = row[63] = edge;
}
const trim = Array.from({length: 3}, (_, y) => Array.from({length: 64}, (_, x) =>
  draft[1 + y][8 + Math.floor(x * 48 / 64)]));
for (const row of trim) row[0] = row[63] = row[1];

const tiles = Array.from({length: 16}, (_, mask) => {
  const tile = top.map(row => [...row]);
  const topHeight = mask & 4 ? 64 : 29;
  if (!(mask & 4)) for (let y = 0; y < 35; y++) tile[y + 29] = [...face[y]];
  if (!(mask & 1)) for (let y = 0; y < 3; y++) tile[y] = [...trim[y]];
  if (!(mask & 8)) for (let y = 0; y < topHeight; y++) for (let x = 0; x < 3; x++) tile[y][x] = trim[x][y];
  if (!(mask & 2)) for (let y = 0; y < topHeight; y++) for (let x = 0; x < 3; x++) tile[y][63 - x] = trim[2 - x][y];
  if (!(mask & 4)) for (let y = 29; y < 64; y++) {
    if (!(mask & 8)) tile[y][0] = outline;
    if (!(mask & 2)) tile[y][63] = outline;
  }
  return tile;
});
const sheet = Array.from({length: 256}, (_, y) => Array.from({length: 256}, (_, x) =>
  tiles[Math.floor(y / 64) * 4 + Math.floor(x / 64)][y % 64][x % 64]));
fs.writeFileSync(path.join(root, 'wall_16_64.pxg'), header.join('\n') + '\n' + sheet.map(row => row.join('')).join('\n') + '\n');

const assert = (value, description) => { if (!value) throw new Error(description); };
let horizontalChecks = 0, verticalChecks = 0;
for (let mask = 0; mask < 16; mask++) {
  const tile = tiles[mask];
  assert(tile.length === 64 && tile.every(row => row.length === 64), 'Tile dimensions');
  assert(tile.every(row => row.every(key => palette.get(key) !== 'transparent' && palette.get(key) !== '#FF00FF')), 'Full wall coverage');
  const hasFace = !(mask & 4);
  if (hasFace) {
    for (let y = 29; y < 64; y++) for (let x = 1; x < 63; x++) assert(tile[y][x] === face[y - 29][x], 'Common face alignment');
  } else {
    for (let y = 3; y < 64; y++) for (let x = 3; x < 61; x++) assert(tile[y][x] === top[y][x], 'S-connected tile must have no face');
  }
  if (mask & 2) for (let other = 0; other < 16; other++) {
    if (!(other & 8) || (mask & 5) !== (other & 5)) continue;
    for (let y = 0; y < 64; y++) assert(tile[y][63] === tiles[other][y][0], 'Horizontal shared edge');
    horizontalChecks++;
  }
  if (mask & 4) for (let other = 0; other < 16; other++) {
    if (!(other & 1) || (mask & 10) !== (other & 10)) continue;
    for (let x = 3; x < 61; x++) assert(tile[63][x] === tiles[other][0][x], 'Vertical shared dark edge');
    verticalChecks++;
  }
}
const report = {
  sheet: [256, 256], tile: [64, 64], order: 'N1 E2 S4 W8 masks 0..15 row-major',
  frontFaceMasks: [0, 1, 2, 3, 8, 9, 10, 11], frontFaceY: [29, 63],
  bands: {lip:[29,34], plaster:[35,53], stone:[54,62], bottom:[63,63]},
  trimWidth: 3, horizontalCompatibleEdgePairs: horizontalChecks,
  verticalCompatibleDarkEdgePairs: verticalChecks, opaquePixels: 65536,
  unusedMagentaPixels: 0, note: 'All tiles fully occupied as requested; no unused areas.',
  makerRefresh: 'refresh 검증 보류(MCP 미연결)', runtime: '런타임 검증 보류(제작자 수행)',
};
fs.writeFileSync(path.join(root, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
