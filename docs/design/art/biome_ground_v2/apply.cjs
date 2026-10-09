"use strict";
// Only registered sprite GUIDs may be written into wall.tileset.
// Default is a reviewable dry run; --apply is an explicit local write.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '../../../..');
function patchTileset(before, manifest, mapping) {
  const parsed = JSON.parse(before), tiles = parsed.ContentProto.Json.datas;
  assert.equal(tiles.length,261,'Palette size changed; review before replacement');
  const expected = new Set(manifest.tiles.map(t=>t.name));
  assert.equal(expected.size,26,'Expected 26 replacement tiles');
  assert.deepEqual(Object.keys(mapping).sort(),[...expected].sort(),'Supply exactly the 26 manifest names');
  assert.equal(new Set(Object.values(mapping)).size,26,'Each tile needs a distinct sprite GUID');
  let after = before;
  const changes = [];
  for (const t of manifest.tiles) {
    const entry = tiles[t.index], id = mapping[t.name];
    assert.equal(entry.Name,t.name,'Palette order/name changed');
    assert.equal(entry.IsCollidable,false,'Collision flag changed');
    assert.match(id,/^[0-9a-f]{32}$/i,'Expected registered 32-hex sprite RUID: '+t.name);
    if(entry.Id===id) continue;
    assert.equal(entry.Id,t.oldRuid,'Current tile RUID changed; review '+t.name);
    const pattern = new RegExp('("Id"\\s*:\\s*")'+t.oldRuid+'(")','g');
    assert.equal([...after.matchAll(pattern)].length,1,'Resource ID is not unique in palette: '+t.name);
    after = after.replace(pattern,(_,a,b)=>a+id+b);
    changes.push({name:t.name,index:t.index,oldRuid:t.oldRuid,newRuid:id});
  }
  const updated=JSON.parse(after);
  const restored=structuredClone(updated);
  for(const t of manifest.tiles) restored.ContentProto.Json.datas[t.index].Id=tiles[t.index].Id;
  assert.deepEqual(restored,parsed,'Unexpected non-target change');
  return {after,changes};
}
function main() {
  const args=process.argv.slice(2), apply=args.includes('--apply'), file=args.find(x=>!x.startsWith('--'));
  if(!file) throw Error('Usage: node docs/design/art/biome_ground_v2/apply.cjs registered-ruids.json [--apply]');
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
  const mapping=JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
  const target=path.join(ROOT,manifest.tileset), before=fs.readFileSync(target,'utf8');
  const {after,changes}=patchTileset(before,manifest,mapping);
  console.log(JSON.stringify({mode:apply?'apply':'dry-run',target:manifest.tileset,changes},null,2));
  if(apply&&changes.length) {
    const backup=path.join(__dirname,'wall.before-'+Date.now()+'.tileset');
    fs.writeFileSync(backup,before,{flag:'wx'});
    fs.writeFileSync(target,after,'utf8');
    assert.equal(fs.readFileSync(target,'utf8'),after,'Readback mismatch');
    console.log('Saved palette; backup: '+path.relative(ROOT,backup));
  }
}
if(require.main===module)main();
module.exports={patchTileset};
