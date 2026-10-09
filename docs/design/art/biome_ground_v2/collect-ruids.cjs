"use strict";
// Maker 에 tiles/ PNG 26장을 등록하면 워크스페이스에 <name>.sprite 가 생긴다.
// 그 파일의 name·resource_guid 를 읽어 registered-ruids.json 을 만든다 (RUID 수동 전달 불필요).
// 사용: node docs/design/art/biome_ground_v2/collect-ruids.cjs  → 이후 apply.cjs 로 dry-run / --apply
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../../..');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const wanted = new Set(manifest.tiles.map(t => t.name));

const found = {};
const dupes = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.sprite')) {
      let js;
      try { js = JSON.parse(fs.readFileSync(p, 'utf8')).ContentProto.Json; } catch { continue; }
      if (!js || !wanted.has(js.name)) continue;
      if (found[js.name] && found[js.name] !== js.resource_guid) dupes.push(js.name);
      found[js.name] = js.resource_guid;
    }
  }
})(path.join(ROOT, 'RootDesk'));

const missing = [...wanted].filter(n => !found[n]);
console.log(`found ${Object.keys(found).length}/26`);
if (dupes.length) console.log('duplicate names (re-registered?):', dupes.join(', '));
if (missing.length) {
  console.log('missing:', missing.join(', '));
  process.exit(1);
}
const out = {};
for (const t of manifest.tiles) out[t.name] = found[t.name];
fs.writeFileSync(path.join(__dirname, 'registered-ruids.json'), JSON.stringify(out, null, 2) + '\n');
console.log('wrote registered-ruids.json');
