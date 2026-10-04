'use strict';
// Generated illustration supplies material pixels; this pass authors the exact 64px tile grammar.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = __dirname;
const lines = fs.readFileSync(path.join(root, 'generated_source.pxg'), 'utf8').trim().split(/\r?\n/);
const start = lines.indexOf('grid');
assert.equal(lines[1], 'size 256 256');
const palette = new Map(lines.slice(2, start).map(s => { const i = s.indexOf(' '); return [s.slice(0, i), s.slice(i + 1)]; }));
const src = lines.slice(start + 1).map(s => [...s]);
assert.equal(src.length, 256);
assert.ok(src.every(r => r.length === 256));
assert.ok(!palette.has('~'));
palette.set('~', '#FF00FF');
palette.set('^', '#402411');
palette.set('`', '#E5AF6B');
const magenta = key => { const c = palette.get(key); if (!c || c === 'transparent') return true; const n = parseInt(c.slice(1, 7), 16); return (n >> 16) > 180 && ((n >> 8) & 255) < 90 && (n & 255) > 170; };
const sample = (x, y) => { const k = src[y][x]; assert.ok(!magenta(k), `material sample on magenta ${x},${y}`); return k; };
// Horizontal straight (row 3, column 3): sample its interior, never its image-generated edge outlines.
const hx = x => 128 + 2 + Math.round((x % 64) * 59 / 63);
function face(x, y) {
  let sy;
  if (y <= 17) sy = 144 + Math.round((y - 13) * 3 / 4);
  else if (y <= 25) sy = 148 + Math.round((y - 18) * 5 / 7);
  else if (y <= 49) sy = 155 + Math.round((y - 26) * 13 / 23);
  else sy = 170 + Math.round((y - 50) * 12 / 13);
  return sample(hx(x === 63 ? 0 : x), sy);
}
// Hand-authored vertical cross section: 42px, wood sides, cream panel between.
// Material rows repeat over the overhead run, with identical north/south connector rows.
function overhead(x, y) {
  const v = x - 11;
  const phase = y === 63 ? 0 : y;
  if (v === 0 || v === 41) return '^';
  if (v === 1) return '`';
  if (v < 10 || v > 31) return sample(137 + ((v < 10 ? v : v - 24) % 8), 15 + Math.round(phase * 27 / 63));
  return sample(134 + ((v - 10) * 2 % 48), 158 + (phase % 8));
}
const tiles = [];
for (let mask = 0; mask < 16; mask++) {
  const n = !!(mask & 1), e = !!(mask & 2), s = !!(mask & 4), w = !!(mask & 8);
  const grid = Array.from({ length: 64 }, () => Array(64).fill('~'));
  const rect = (x0, y0, x1, y1, paint) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = paint(x, y); };
  if (e || w) rect(w ? 0 : (n || s ? 11 : 28), 13, e ? 63 : (n || s ? 52 : 35), 63, face);
  if (n) rect(11, 0, 52, e || w ? 12 : 31, overhead);
  if (s) rect(11, n ? 0 : 26, 52, 63, overhead);
  if (!s && n && !e && !w) {
    // A north run ends in a short front face, with its stone course exactly on row63.
    rect(11, 32, 52, 63, (x, y) => face(x, 13 + Math.round((y - 32) * 50 / 31)));
    for (let y = 32; y < 64; y++) { grid[y][11] = '^'; grid[y][52] = '^'; }
  }
  if (mask === 0) {
    rect(23, 29, 40, 63, (x, y) => face(x, 13 + Math.round((y - 29) * 50 / 34)));
    for (let y = 29; y < 64; y++) { grid[y][23] = '^'; grid[y][40] = '^'; }
  }
  if (mask === 4) {
    // South-only end cap lies at the start of the column, not across the south connector.
    rect(11, 13, 52, 25, face);
    for (let x = 11; x <= 52; x++) grid[13][x] = '^';
  }
  if ((e || w) && mask !== 10) {
    // Exactly one post at the joint. Continue into the overhead south arm, not a stone foot, when S exists.
    rect(28, 13, 35, 49, (x, y) => sample(137 + (x - 28), 15 + Math.round((y - 13) * 27 / 36)));
    if (s) for (let x = 11; x <= 52; x++) grid[63][x] = overhead(x, 63);
  }
  // No outline, terminal post, or gap may cover an outgoing cross section.
  if (n) for (let x = 11; x <= 52; x++) grid[0][x] = overhead(x, 0);
  if (s) for (let x = 11; x <= 52; x++) grid[63][x] = overhead(x, 63);
  if (w) for (let y = 13; y < 64; y++) grid[y][0] = face(0, y);
  if (e) for (let y = 13; y < 64; y++) grid[y][63] = face(0, y);
  assert.ok(grid[63].some(k => k !== '~'), `bottom alignment ${mask}`);
  const north = grid[0].slice(11, 53), south = grid[63].slice(11, 53);
  if (n) assert.deepEqual(north, Array.from({ length: 42 }, (_, x) => overhead(11 + x, 0)));
  if (s) assert.deepEqual(south, Array.from({ length: 42 }, (_, x) => overhead(11 + x, 0)));
  if (!n) assert.ok(grid[0].every(k => k === '~'), `unexpected north arm ${mask}`);
  for (let y = 13; y < 64; y++) {
    assert.equal(grid[y][0] !== '~', w, `west ${mask}/${y}`);
    assert.equal(grid[y][63] !== '~', e, `east ${mask}/${y}`);
  }
  tiles.push(grid);
}
// All present connectors use one shared cross section, regardless of corner/T/cross variants.
const sheet = Array.from({ length: 256 }, (_, y) => {
  const row = [];
  for (let col = 0; col < 4; col++) row.push(...tiles[Math.floor(y / 64) * 4 + col][y % 64]);
  return row.join('');
});
const emit = ['PXG 1', 'size 256 256', ...[...palette].map(([k, c]) => `${k} ${c}`), 'grid', ...sheet].join('\n') + '\n';
fs.writeFileSync(path.join(root, 'wall_16.pxg'), emit);
console.log('PASS: 16 masks, 64px cells, 42px vertical cross section, shared N/S and E/W connectors, bottom-row feet, magenta background.');
