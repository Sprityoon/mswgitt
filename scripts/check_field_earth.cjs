// F1 1차 배치 검증: node scripts/check_field_earth.cjs
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '..'));
const { MapBuilder } = require('../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs');
const field = MapBuilder.read('map/field_earth.map');
const shared = MapBuilder.read('map/template_field.map');
assert.equal(field.getTileMapMode(), 1);
const entities = field.listEntities();
const ids = new Set();
const paths = new Set(entities.map(e => e.path));
const sourceIds = new Set(shared.listEntities().map(e => e.id));
for (const e of entities) {
  assert.match(e.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  assert(!ids.has(e.id) && !sourceIds.has(e.id), 'duplicate/shared UUID: ' + e.name);
  ids.add(e.id);
  const record = field.find(e.path);
  const body = record.jsonString;
  assert.equal(typeof body, 'object');
  assert.equal(body.path, e.path);
  assert.equal(record.componentNames, body['@components'].map(c => c['@type']).join(','));
  if (e.name !== 'field_earth') assert(paths.has(e.path.slice(0, e.path.lastIndexOf('/'))));
  if (body.origin?.type === 'Model') {
    assert.equal(body.origin.entry_id, body.modelId);
    // Maker-saved inherited instances may have a null root id; new placements must bind it.
    if (body.origin.root_entity_id == null) {
      const source = shared.find(e.name);
      assert(source && source.jsonString.origin?.root_entity_id == null, 'unexpected null model root');
    } else assert.equal(body.origin.root_entity_id, e.id);
  }
}
const layerNames = ['RectTileMap', 'RectTileMap0', 'RectTileMap2', 'RectTileMap3', 'RectTileMap4', 'RectTileMap5', 'RectTileMap6'];
const tileDefs = JSON.parse(fs.readFileSync('RootDesk/MyDesk/wall.tileset', 'utf8')).ContentProto.Json.datas;
for (const layer of layerNames) {
  const c = field.component(layer, 'MOD.Core.RectTileMapComponent');
  assert.deepEqual(c, shared.component(layer, 'MOD.Core.RectTileMapComponent'), 'unexpected terrain change: ' + layer);
  assert(!c.tileMap.some(t => t.position.x >= -12 && t.position.x <= 15 && t.position.y >= -1 && t.position.y <= 1 && tileDefs[t.tileIndex]?.IsCollidable), 'blocked main route: ' + layer);
}
assert.deepEqual(field.component('Portal', 'MOD.Core.TransformComponent').Position, { x: -12, y: 0, z: 0 });
assert.equal(field.component('Portal', 'script.PortalGate').TargetMapName, 'Home');
assert.equal(field.component('PortalToHunt02', 'script.PortalGate').TargetMapName, 'hunt02');
const landmarks = ['F1_ExpeditionSign', 'F1_RestBench', 'F1_HomeLamp', 'F1_ForwardLamp'];
for (const name of landmarks) {
  assert(!shared.find(name), 'landmark leaked into shared template');
  const tr = field.component(name, 'MOD.Core.TransformComponent');
  const sr = field.component(name, 'MOD.Core.SpriteRendererComponent');
  const box = field.component(name, 'MOD.Core.TriggerComponent');
  assert.equal(tr.Scale.x, 2);
  assert(sr.SpriteRUID && sr.SortingLayer === 'MapLayer5');
  // 실제 Scale을 적용한 트리거 하단도 주동선 y=-1..1 밖에 있어야 한다.
  assert(tr.Position.y + box.ColliderOffset.y * tr.Scale.y - box.BoxSize.y * tr.Scale.y / 2 > 1);
  const inClearZone = (Math.abs(tr.Position.x) <= 5 && Math.abs(tr.Position.y) <= 5)
    || [-12, 15].some(x => Math.hypot(tr.Position.x - x, tr.Position.y) <= 5);
  assert(inClearZone, 'landmark outside existing resource exclusion: ' + name);
}
const rows = fs.readFileSync('RootDesk/MyDesk/Furniture/DataSets/PortalDestinationDataSet.csv', 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(l => l.split(','));
const header = rows.shift();
const data = rows.map(row => Object.fromEntries(header.map((key, i) => [key, row[i]])));
const f1 = data.find(r => r.DestinationId === 'hunt01');
assert.equal(f1.MapName, 'hunt01');
assert.equal(f1.TemplateMap, 'field_earth');
assert.equal(f1.Biome, 'earth_field');
assert.equal(f1.ArriveX, '-3');
assert.equal(f1.ArriveY, '0');
for (const id of ['hunt02', 'hunt03']) assert.equal(data.find(r => r.DestinationId === id).TemplateMap, 'template_field');
assert.equal(entities.length, shared.listEntities().length + landmarks.length);
console.log('PASS: F1 UUID/path/component consistency, unchanged terrain, clear static main route, 4 landmarks, portal/data links.');
