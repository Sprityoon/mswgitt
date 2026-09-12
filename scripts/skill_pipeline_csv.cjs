'use strict';
// Small CSV reader shared by the skill/quest authoring checks (quoted Korean text included).
const fs = require('node:fs');
function read(path) {
  const text = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const records = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (c === ',' || c === '\n')) { row.push(cell.replace(/\r$/, '')); cell = ''; if (c === '\n') { records.push(row); row = []; } }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); records.push(row); }
  if (quoted) throw Error('Unclosed quote: ' + path);
  const headers = records.shift();
  return { headers, rows: records.filter(r => r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] || '']))) };
}
function write(path, data) {
  const quote = v => /[",\r\n]/.test(String(v ?? '')) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v ?? '');
  fs.writeFileSync(path, '\uFEFF' + [data.headers, ...data.rows.map(r => data.headers.map(h => r[h]))].map(r => r.map(quote).join(',')).join('\r\n') + '\r\n');
}
module.exports = { read, write };
