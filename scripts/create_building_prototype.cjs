'use strict';

// 시험 맵만 생성한다. 기존 맵/타일셋/세이브/테스트 진입 설정은 수정하지 않는다.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { MapBuilder } = require('../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs');
const { ModelBuilder, vector2, vector3 } = require('../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs');

const root = path.resolve(__dirname, '..');
const templates = path.join(root, '.agents/skills/msw-general/models');
const mapPath = path.join(root, 'map/building_test.map');
const modelDir = path.join(root, 'RootDesk/MyDesk/Building/Models');
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const palette = name => readJson(path.join(root, `RootDesk/MyDesk/${name}.tileset`));
const wall = palette('wall');
const floor = palette('tile1');
assert.equal(readJson(path.join(root, 'Environment/config')).CoreVersion, '26.7.0.0');
assert.equal(wall.ContentProto.Json.datas.find(t => t.Name === 'Big Wall')?.IsCollidable, true);
assert.equal(wall.ContentProto.Json.datas.find(t => t.Name === 'FullGrass')?.IsCollidable, false);
assert.equal(floor.ContentProto.Json.datas.find(t => t.Name === 'Baram_167')?.IsCollidable, false);
const nativeTile = 'MOD.Core.RectTileMapComponent';

function validate(b) {
  assert.equal(b.getTileMapMode(), 1);
  const entities = b.listEntities();
  assert.equal(new Set(entities.map(e => e.id)).size, entities.length);
  const ctrl = b.component('building_test', 'script.BuildingRoomPrototype');
  for (const [field, name] of Object.entries({ GroundLayer: 'RectTileMap', FloorLayer: 'RectTileMap3', WallLayer: 'RectTileMap4', DoorVisual: 'PrototypeDoor' })) {
    assert.equal(ctrl[field], b.find(name).id, `${field} binding`);
  }
  const tiles = entities.filter(e => e.componentNames.includes(nativeTile));
  assert.equal(tiles.length, 6);
  for (const e of tiles) {
    const c = b.component(e.name, nativeTile);
    const layer = entities.find(l => b.component(l.name, 'MOD.Core.MapLayerComponent')?.LayerSortOrder === Number(c.SortingLayer.replace('MapLayer', '')));
    assert.ok(layer, `layer for ${e.name}`);
    assert.equal(layer.displayOrder + 1, e.displayOrder);
    assert.equal(c.GridSize.x, 1);
    assert.equal(c.GridSize.y, 1);
  }
  assert.equal(b.component('RectTileMap3', nativeTile).TileSetRUID, floor.EntryKey);
  assert.equal(b.component('RectTileMap4', nativeTile).TileSetRUID, wall.EntryKey);
  assert.equal(b.component('building_test', 'MOD.Core.PhysicsSimulatorComponent').Gravity.y, 0);
  const doorPos = b.component('PrototypeDoor', 'MOD.Core.TransformComponent').Position;
  assert.equal(doorPos.x, 0.5);
  assert.equal(doorPos.y, -2.5);
  assert.equal(entities.filter(e => e.componentNames.includes('script.BuildingRoomPrototype')).length, 1);
  assert.equal(entities.some(e => /script.PlaceableFurniture|script.ResourceOccupiedArea/.test(e.componentNames)), false);
  const source = fs.readFileSync(path.join(root, 'RootDesk/MyDesk/Building/Scripts/BuildingRoomPrototype.mlua'), 'utf8');
  assert.doesNotMatch(source, /method\s+void\s+OnUpdate|_SpawnService|_DataStorageService|_PersistenceManager|_ResourceSpawner|_TimerService/);
  assert.match(source, /IsMakerPlay\(\)/);
  assert.match(source, /GetUserEntityByUserId\(senderUserId\)/);
  assert.match(source, /player\.CurrentMap ~= self\.Entity/);
  console.log('[BUILD-PROTOTYPE] structural checks passed', { entities: entities.length, tilemaps: tiles.length, map: 'building_test' });
}

if (process.argv.includes('--check')) {
  validate(MapBuilder.read(mapPath));
} else {
  // 재실행으로 제작자 편집 내용을 덮어쓰지 않는다.
  assert.ok(!fs.existsSync(mapPath), 'building_test exists; use --check, do not recreate');
  const b = MapBuilder.fromTemplate(MapBuilder.templatePath('rect'), 'building_test');
  assert.equal(b.getTileMapMode(), 1); // mode 변경이 아닌 검증된 RectTile 템플릿 복제
  const tileModel = path.join(modelDir, 'BuildingPrototypeTileLayer.model');
  const layerModel = path.join(modelDir, 'BuildingPrototypeMapLayer.model');
  const doorModel = path.join(modelDir, 'BuildingPrototypeDoor.model');
  for (const p of [tileModel, layerModel, doorModel]) assert.ok(!fs.existsSync(p), `refuse overwrite: ${p}`);
  ModelBuilder.fromTemplate(path.join(templates, 'RectTileMap.model'), 'BuildingPrototypeTileLayer')
    .value(nativeTile, 'GridSize', vector2(1, 1), 'vector2')
    .value(nativeTile, 'TileSetRUID', wall.EntryKey, 'string')
    .value(nativeTile, 'OrderInLayer', 1, 'int')
    .write(tileModel);
  ModelBuilder.fromTemplate(path.join(templates, 'MapleMapLayer.model'), 'BuildingPrototypeMapLayer').write(layerModel);
  ModelBuilder.fromTemplate(path.join(templates, 'TransformOnly.model'), 'BuildingPrototypeDoor')
    .child('Panel', ['MOD.Core.TransformComponent', 'MOD.Core.SpriteRendererComponent'])
    // 공식 나무판자 sprite 32×24, pivot(-1,-2), 2배 -> 64×48px 임시 표식.
    .childValue('Panel', 'MOD.Core.TransformComponent', 'Position', vector3(-0.34, -0.28, 0), 'vector3')
    .childValue('Panel', 'MOD.Core.TransformComponent', 'Scale', vector3(2, 2, 1), 'vector3')
    .childValue('Panel', 'MOD.Core.SpriteRendererComponent', 'SpriteRUID', '222a3bc317844763ab817f9f0553a26e', 'string')
    .childValue('Panel', 'MOD.Core.SpriteRendererComponent', 'SortingLayer', 'MapLayer5', 'string')
    .childValue('Panel', 'MOD.Core.SpriteRendererComponent', 'IgnoreMapLayerCheck', true, 'bool')
    .childValue('Panel', 'MOD.Core.SpriteRendererComponent', 'OrderInLayer', 2, 'int')
    .write(doorModel);
  // 템플릿의 예제 배치만 제거한다. 새 방의 타일 배열을 파일에 쓰지 않는다.
  for (const name of ['MapleMapLayer', 'RectTileMap', 'SpawnLocation']) b.remove(name);
  b.patchComponent('building_test', 'MOD.Core.MapComponent', {
    Gravity: 0, UseCustomBound: true, LeftBottom: { x: -9, y: -9 }, RightTop: { x: 9, y: 9 },
  }).upsertComponent('building_test', 'MOD.Core.PhysicsSimulatorComponent', {
    Gravity: { x: 0, y: 0 }, Paused: false, WorldBounds: { x: 10000, y: 10000 }, Enable: true,
  });
  const names = ['RectTileMap', 'RectTileMap2', 'RectTileMap0', 'RectTileMap3', 'RectTileMap4', 'RectTileMap5'];
  for (let i = 0; i < names.length; i++) {
    b.placeModel(`PrototypeLayer${i}`, layerModel);
    b.patch(`PrototypeLayer${i}`, { displayOrder: 2 + i * 2 });
    b.patchComponent(`PrototypeLayer${i}`, 'MOD.Core.MapLayerComponent', {
      MapLayerName: `Layer${i + 1}`, LayerSortOrder: i, IsVisible: true, Locked: false,
    });
    b.placeModel(names[i], tileModel);
    b.patch(names[i], { displayOrder: 3 + i * 2 });
    b.patchComponent(names[i], nativeTile, { SortingLayer: `MapLayer${i}`, TileSetRUID: i === 3 ? floor.EntryKey : wall.EntryKey });
  }
  b.placeModel('PrototypeDoor', doorModel, { pos: [0.5, -2.5, 0] });
  b.patch('PrototypeDoor', { displayOrder: 14 });
  b.upsertComponent('building_test', 'script.BuildingRoomPrototype', {
    GroundLayer: b.find('RectTileMap').id,
    FloorLayer: b.find('RectTileMap3').id,
    WallLayer: b.find('RectTileMap4').id,
    DoorVisual: b.find('PrototypeDoor').id,
    GroundTileName: 'FullGrass', FloorTileName: 'Baram_167', WallTileName: 'Big Wall',
    GroundHalfSize: 8, RoomHalfSize: 3, InteractDistance: 2.5, CloseSafetyPadding: 0.3, ToggleCooldown: 0.25,
  });
  validate(b);
  b.write(mapPath);
  validate(MapBuilder.read(mapPath));
}
