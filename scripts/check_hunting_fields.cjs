// 사냥터 재설계 산출물 검증: node scripts/check_hunting_fields.cjs
// (구 check_field_earth.cjs 대체 — 2026-09-17 지형·포탈·소품 재설계 이후의 불변식)
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '..'));
const { MapBuilder } = require('../.claude/skills/msw-general/scripts/map/msw_map_builder.cjs');
const { ModelBuilder } = require('../.claude/skills/msw-general/scripts/model/msw_model_builder.cjs');

const tileDefs = JSON.parse(fs.readFileSync('RootDesk/MyDesk/wall.tileset', 'utf8')).ContentProto.Json.datas;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXPECT = {
  field_earth: { portals: { Portal: 'Home', PortalForward: '' }, forbid: ['PortalBack', 'PortalToHunt02'] },
  template_field: { portals: { Portal: 'Home', PortalBack: '', PortalForward: '' }, forbid: ['PortalToHunt02'] },
};

for (const [mapName, exp] of Object.entries(EXPECT)) {
  const m = MapBuilder.read(`map/${mapName}.map`);
  assert.equal(m.getTileMapMode(), 1, mapName + ' TileMapMode');
  const ents = m.listEntities();
  const ids = new Set();
  const paths = new Set(ents.map(e => e.path));
  for (const e of ents) {
    assert.match(e.id, UUID, 'uuid ' + e.path);
    assert(!ids.has(e.id), 'dup uuid ' + e.path);
    ids.add(e.id);
    const rec = m.find(e.path);
    assert.equal(typeof rec.jsonString, 'object', 'jsonString object ' + e.path);
    assert.equal(rec.jsonString.path, e.path);
    assert.equal(rec.componentNames, rec.jsonString['@components'].map(c => c['@type']).join(','), 'componentNames ' + e.path);
    if (e.name !== mapName) assert(paths.has(e.path.slice(0, e.path.lastIndexOf('/'))), 'parent ' + e.path);
    assert(!/^F1_/.test(e.name), '구 F1 소품 잔존 ' + e.name);
  }
  // 레이어 ↔ 타일맵 교차 순서(pitfalls 규칙 40)
  const order = ents.filter(e => /^(MapleMapLayer\d?|RectTileMap\d?)$/.test(e.name)).sort((a, b) => m.find(a.path).jsonString.displayOrder - m.find(b.path).jsonString.displayOrder).map(e => e.name);
  for (let i = 0; i < order.length; i++) if (/^RectTileMap[2-6]?$/.test(order[i]) && order[i] !== 'RectTileMap0') assert(/^MapleMapLayer/.test(order[i - 1] || ''), `${mapName} layer order ${order.join('>')}`);
  // 타일: type 0, 유효 인덱스, 물(Water)만 충돌
  for (const L of ['RectTileMap', 'RectTileMap0', 'RectTileMap2', 'RectTileMap6']) {
    const c = m.component(L, 'MOD.Core.RectTileMapComponent');
    for (const t of c.tileMap) {
      assert.equal(t.type, 0, `${mapName}/${L} type`);
      assert(tileDefs[t.tileIndex], `${mapName}/${L} index ${t.tileIndex}`);
    }
  }
  // 흙(L2 홀) ↔ 온전한 잔디(FullGrass)가 프린지 없이 직접 맞닿는 경계 금지 — 도로 ½셀 마진 누락 회귀 방지
  {
    const name = (L) => new Map(m.component(L, 'MOD.Core.RectTileMapComponent').tileMap.map(t => [t.position.x + ',' + t.position.y, tileDefs[t.tileIndex].Name]));
    const l2 = name('RectTileMap2'), l0 = name('RectTileMap0');
    let hard = 0;
    for (let x = -27; x <= 27; x++) for (let y = -27; y <= 27; y++) {
      const k = x + ',' + y;
      if (l0.has(k) || l2.has(k)) continue; // 물이거나 잔디가 있는 셀
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (l2.get((x + dx) + ',' + (y + dy)) === 'FullGrass') hard++;
    }
    assert.equal(hard, 0, `${mapName} 프린지 없는 흙/잔디 경계 ${hard}곳`);
  }
  // 포탈
  for (const [name, target] of Object.entries(exp.portals)) {
    const pg = m.component(name, 'script.PortalGate');
    assert(pg, `${mapName} ${name} PortalGate`);
    assert.equal(pg.TargetMapName, target, `${mapName} ${name} TargetMapName`);
    assert(m.component(name, 'MOD.Core.SpriteRendererComponent').SpriteRUID, `${mapName} ${name} sprite`);
    assert.equal(m.component(name, 'MOD.Core.TransformComponent').Scale.x, 2, `${mapName} ${name} scale`);
  }
  for (const name of exp.forbid) assert(!m.find(name), `${mapName} 구 포탈 이름 잔존 ${name}`);
  const a = m.component('Portal', 'MOD.Core.TransformComponent').Position, b = m.component('PortalForward', 'MOD.Core.TransformComponent').Position;
  const dist = Math.hypot(a.x - b.x, a.y - b.y);
  assert(a.x < 0 && a.y < 0 && b.x > 0 && b.y > 0, `${mapName} 입구=왼쪽 아래 · 출구=오른쪽 위`);
  assert(dist > 50, `${mapName} 포탈 거리 ${dist}`);
  // 소품: 모델 인스턴스 + 스프라이트
  const decos = ents.filter(e => /^D\d+_Deco_/.test(e.name));
  assert(decos.length >= 30, mapName + ' deco count');
  for (const d of decos) {
    const j = m.find(d.path).jsonString;
    assert.equal(j.origin?.type, 'Model');
    assert.equal(j.origin.root_entity_id, d.id);
    assert(m.component(d.path, 'MOD.Core.SpriteRendererComponent').SpriteRUID, 'deco sprite ' + d.name);
  }
  console.log(`PASS ${mapName}: entities=${ents.length} decos=${decos.length} portalDist=${dist.toFixed(1)}`);
}

for (const f of fs.readdirSync('RootDesk/MyDesk/MapObjects/Models').filter(f => /^Deco_.*\.model$/.test(f))) {
  const b = ModelBuilder.read('RootDesk/MyDesk/MapObjects/Models/' + f);
  const s = b.snapshot();
  const name = f.replace(/\.model$/, '');
  assert.equal(s.name, name);
  assert.notEqual(s.model_id, 'prop_signpost', 'model id not renamed ' + f);
  assert(b.getValue('MOD.Core.SpriteRendererComponent', 'SpriteRUID'), 'ruid ' + f);
  assert.deepEqual(b.listComponents(), ['MOD.Core.TransformComponent', 'MOD.Core.SpriteRendererComponent', 'MOD.Core.TriggerComponent', 'script.YSortSprite']);
}
const csv = fs.readFileSync('RootDesk/MyDesk/Furniture/DataSets/PortalDestinationDataSet.csv', 'utf8').replace(/^﻿/, '');
assert.match(csv, /^hunt01,hunt01,[^,]*,-19,-22,/m, 'hunt01 arrive');
assert.match(csv, /^hunt02,hunt02,[^,]*,-21,-23,/m, 'hunt02 arrive');
assert.match(csv, /^hunt03,hunt03,[^,]*,-21,-23,/m, 'hunt03 arrive');
console.log('PASS: Deco 모델·도착 좌표');
