/**
 * scripts/convert_all_maps_to_island.cjs
 * 
 * town.map, template_field.map, template_boss.map 전 맵을
 * 영지(map01)와 동일한 4단 수역-해안선-섬(4-Layer Island Water-Rim) 아키텍처로 변환합니다.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const tilesetPath = path.join(ROOT, "RootDesk/MyDesk/wall.tileset");

// 1. wall.tileset 인덱스 매핑 로드
const ts = JSON.parse(fs.readFileSync(tilesetPath, "utf8"));
const datas = ts.ContentProto.Json.datas;
const IDX = {};
datas.forEach((d, i) => { IDX[d.Name] = i; });
console.log("Loaded tileset entries:", Object.keys(IDX).length);

// 2. 타일 매핑 마스크 함수
const NEIGHBORS = [
  { dx: 0, dy: 1, bits: 12 },   // N: TL|TR (12)
  { dx: 0, dy: -1, bits: 3 },   // S: BL|BR (3)
  { dx: 1, dy: 0, bits: 10 },   // E: TR|BR (10)
  { dx: -1, dy: 0, bits: 5 },   // W: TL|BL (5)
  { dx: 1, dy: 1, bits: 8 },    // NE: TR (8)
  { dx: -1, dy: 1, bits: 4 },   // NW: TL (4)
  { dx: 1, dy: -1, bits: 2 },   // SE: BR (2)
  { dx: -1, dy: -1, bits: 1 },  // SW: BL (1)
];

function maskToWaterTileName(mask) {
  if (mask == null || mask === 0 || mask === 15) return "Water";
  if (mask === 12) return "WaterT";
  if (mask === 3)  return "WaterD";
  if (mask === 5)  return "WaterL";
  if (mask === 10) return "WaterR";
  if (mask === 13) return "WaterLT";
  if (mask === 14) return "WaterRT";
  if (mask === 7)  return "WaterLD";
  if (mask === 11) return "WaterRD";
  if (mask === 4)  return "WaterLTCorner";
  if (mask === 8)  return "WaterRTCorner";
  if (mask === 1)  return "WaterLDCorner";
  if (mask === 2)  return "WaterRDCorner";
  if (mask === 6)  return "WaterLTRD";
  if (mask === 9)  return "WaterRTLD";
  return "Water";
}

function maskToWetRimTileName(mask) {
  if (mask == null || mask === 0 || mask === 15) return null;
  if (mask === 12) return "WetRimT";
  if (mask === 3)  return "WetRimD";
  if (mask === 5)  return "WetRimL";
  if (mask === 10) return "WetRimR";
  if (mask === 13) return "WetRimLT";
  if (mask === 14) return "WetRimRT";
  if (mask === 7)  return "WetRimLD";
  if (mask === 11) return "WetRimRD";
  if (mask === 4)  return "WetRimLTCorner";
  if (mask === 8)  return "WetRimRTCorner";
  if (mask === 1)  return "WetRimLDCorner";
  if (mask === 2)  return "WetRimRDCorner";
  if (mask === 6)  return "WetRimLTRD";
  if (mask === 9)  return "WetRimRTLD";
  return null;
}

function maskToGrassTileName(mask) {
  if (mask == null || mask === 0) return null;
  if (mask === 15) return "FullGrass";
  if (mask === 12) return "GrassT";
  if (mask === 3)  return "GrassD";
  if (mask === 5)  return "GrassL";
  if (mask === 10) return "GrassR";
  if (mask === 13) return "GrassLT";
  if (mask === 14) return "GrassRT";
  if (mask === 7)  return "GrassLD";
  if (mask === 11) return "GrassRD";
  if (mask === 4)  return "GrassLTCorner";
  if (mask === 8)  return "GrassRTCorner";
  if (mask === 1)  return "GrassLDCorner";
  if (mask === 2)  return "GrassRDCorner";
  if (mask === 6)  return "GrassLTRD";
  if (mask === 9)  return "GrassRTLD";
  return "FullGrass";
}

// 3. 레이어 템플릿 생성 헬퍼
function createTilemapEntity(mapPathStr, layerName, sortingLayer) {
  const uuid = "e" + Math.random().toString(16).slice(2, 10) + "-1111-4444-8888-" + Math.random().toString(16).slice(2, 14);
  return {
    id: uuid,
    path: `${mapPathStr}/${layerName}`,
    componentNames: "MOD.Core.TransformComponent,MOD.Core.RectTileMapComponent",
    jsonString: {
      name: layerName,
      path: `${mapPathStr}/${layerName}`,
      nameEditable: true,
      enable: true,
      visible: true,
      localize: false,
      displayOrder: 0,
      pathConstraints: "///",
      revision: 0,
      modelId: null,
      "@components": [
        {
          "@type": "MOD.Core.TransformComponent",
          "Rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
          "Position": { "x": 0.0, "y": 0.0, "z": 0.0 },
          "QuaternionRotation": { "x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0 },
          "Scale": { "x": 1.0, "y": 1.0, "z": 1.0 },
          "ZRotation": 0.0,
          "Enable": true
        },
        {
          "@type": "MOD.Core.RectTileMapComponent",
          "SortingLayer": sortingLayer,
          "TileSetRUID": "237937397e744d038318ca4a95ea81b0",
          "Enable": true,
          "tileMap": []
        }
      ],
      "@version": 1
    }
  };
}

// 4. 개별 맵 변환 함수
function convertMap(mapFileRel, config) {
  const mapPath = path.join(ROOT, mapFileRel);
  console.log(`\n========================================`);
  console.log(`Processing Map: ${mapFileRel}`);
  console.log(`========================================`);

  const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const ents = mapJson.ContentProto.Entities;
  const mapPathStr = `/maps/${config.mapName}`;

  // 1) Background & MapComponent
  const bgEnt = ents.find(e => e.jsonString && e.jsonString.name === "Background");
  if (bgEnt) {
    const bg = bgEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.BackgroundComponent");
    if (bg) {
      bg.SolidColor = { r: 0.18, g: 0.45, b: 0.72, a: 1 };
      console.log(" - Updated Background SolidColor to Ocean Blue");
    }
  }

  const mapEnt = ents.find(e => e.jsonString && e.jsonString.name === config.mapName);
  if (mapEnt) {
    const mc = mapEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.MapComponent");
    if (mc) {
      mc.LeftBottom = { x: config.minGrid, y: config.minGrid };
      mc.RightTop = { x: config.maxGrid, y: config.maxGrid };
      mc.UseCustomBound = true;
      console.log(` - Updated MapComponent bounds: [${config.minGrid}..${config.maxGrid}]`);
    }
  }

  // 2) 레이어 확보
  function getOrAddLayer(layerName, sortingLayer) {
    let e = ents.find(ent => ent.jsonString && ent.jsonString.name === layerName);
    if (!e) {
      e = createTilemapEntity(mapPathStr, layerName, sortingLayer);
      ents.push(e);
      console.log(` - Created missing layer: ${layerName} (${sortingLayer})`);
    }
    const tc = e.jsonString["@components"].find(c => c["@type"] === "MOD.Core.RectTileMapComponent");
    const tr = e.jsonString["@components"].find(c => c["@type"] === "MOD.Core.TransformComponent");
    return { e, tc, tr };
  }

  const L0 = getOrAddLayer("RectTileMap0", "MapLayer0");
  const L1 = getOrAddLayer("RectTileMap", "MapLayer1");
  const L2 = getOrAddLayer("RectTileMap2", "MapLayer2");
  const L3 = getOrAddLayer("RectTileMap3", "MapLayer3");
  const L4 = getOrAddLayer("RectTileMap4", "MapLayer4");
  const L5 = getOrAddLayer("RectTileMap5", "MapLayer5");
  const L6 = getOrAddLayer("RectTileMap6", "MapLayer6");

  // 3) 지형 마스크 구성 (Water Grid)
  const waterGrid = new Map();
  for (let y = config.minGrid; y <= config.maxGrid; y++) {
    for (let x = config.minGrid; x <= config.maxGrid; x++) {
      waterGrid.set(`${x},${y}`, config.isWater(x, y));
    }
  }

  function getWater(x, y) {
    const key = `${x},${y}`;
    if (waterGrid.has(key)) return waterGrid.get(key);
    return true; // 맵 밖은 바다
  }

  // 4) 타일 생성
  const l0Tiles = [];
  const l1Tiles = [];
  const l2Tiles = [];
  const l6Tiles = [];

  for (let y = config.minGrid; y <= config.maxGrid; y++) {
    for (let x = config.minGrid; x <= config.maxGrid; x++) {
      const isW = getWater(x, y);

      // L1 Soil: 전면 지반
      if (IDX["Soil"] !== undefined) {
        l1Tiles.push({
          position: { x, y },
          name: "Soil",
          itemIndex: IDX["Soil"]
        });
      }

      if (isW) {
        // 물 타일: 8방향 이웃 육지 검사로 수변 물 프린지 마스크 계산
        let mask = 0;
        for (const n of NEIGHBORS) {
          const nx = x + n.dx;
          const ny = y + n.dy;
          if (!getWater(nx, ny)) {
            // 이웃이 육지이면 해당 비트 ON
            mask |= n.bits;
          }
        }

        const waterName = maskToWaterTileName(mask);
        if (IDX[waterName] !== undefined) {
          l0Tiles.push({
            position: { x, y },
            name: waterName,
            itemIndex: IDX[waterName]
          });
        }

        // 수변 림 (WetRim) 오버레이
        const wetName = maskToWetRimTileName(mask);
        if (wetName && IDX[wetName] !== undefined) {
          l6Tiles.push({
            position: { x, y },
            name: wetName,
            itemIndex: IDX[wetName]
          });
        }
      } else {
        // 육지 잔디 타일: 8방향 이웃 바다 검사로 해안선 잔디 프린지 계산
        let mask = 15; // 기본 FullGrass
        for (const n of NEIGHBORS) {
          const nx = x + n.dx;
          const ny = y + n.dy;
          if (getWater(nx, ny)) {
            // 이웃이 바다면 해당 비트 OFF
            mask &= (~n.bits & 15);
          }
        }

        const grassName = maskToGrassTileName(mask);
        if (grassName && IDX[grassName] !== undefined) {
          l2Tiles.push({
            position: { x, y },
            name: grassName,
            itemIndex: IDX[grassName]
          });
        }
      }
    }
  }

  // 5) 레이어에 타일 배열 적용 및 돌벽 제거
  L0.tc.tileMap = l0Tiles;
  L1.tc.tileMap = l1Tiles;
  L2.tc.tileMap = l2Tiles;
  L4.tc.tileMap = []; // 돌벽 완전 철거
  L5.tc.tileMap = []; // 돌벽 테라스 완전 철거
  L6.tc.tileMap = l6Tiles;

  console.log(` - L0 Water tiles: ${l0Tiles.length}`);
  console.log(` - L1 Soil tiles: ${l1Tiles.length}`);
  console.log(` - L2 Grass tiles: ${l2Tiles.length}`);
  console.log(` - L4 Walls: 0 (Removed)`);
  console.log(` - L5 Terraces: 0 (Removed)`);
  console.log(` - L6 WetRim tiles: ${l6Tiles.length}`);

  // 6) 외곽 보이지 않는 경계 콜라이더 (Boundary Colliders)
  // 기존 경계 콜라이더 정리 후 신규 생성
  const bounds = [
    { name: "Boundary_Left",   x: config.landMin - 1, y: 0,                   w: 2,                  h: (config.landMax - config.landMin + 4) },
    { name: "Boundary_Right",  x: config.landMax + 1, y: 0,                   w: 2,                  h: (config.landMax - config.landMin + 4) },
    { name: "Boundary_Top",    x: 0,                  y: config.landMax + 1,  w: (config.landMax - config.landMin + 4), h: 2 },
    { name: "Boundary_Bottom", x: 0,                  y: config.landMin - 1,  w: (config.landMax - config.landMin + 4), h: 2 }
  ];

  bounds.forEach(b => {
    let bEnt = ents.find(e => e.jsonString && e.jsonString.name === b.name);
    if (!bEnt) {
      const bUuid = "b" + Math.random().toString(16).slice(2, 10) + "-2222-4444-8888-" + Math.random().toString(16).slice(2, 14);
      bEnt = {
        id: bUuid,
        path: `${mapPathStr}/${b.name}`,
        componentNames: "MOD.Core.TransformComponent,MOD.Core.TriggerComponent",
        jsonString: {
          name: b.name,
          path: `${mapPathStr}/${b.name}`,
          nameEditable: true,
          enable: true,
          visible: true,
          localize: false,
          displayOrder: 0,
          pathConstraints: "///",
          revision: 0,
          modelId: null,
          "@components": [
            {
              "@type": "MOD.Core.TransformComponent",
              "Position": { "x": b.x, "y": b.y, "z": 0.0 },
              "Scale": { "x": 1.0, "y": 1.0, "z": 1.0 },
              "Rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
              "QuaternionRotation": { "x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0 },
              "ZRotation": 0.0,
              "Enable": true
            },
            {
              "@type": "MOD.Core.TriggerComponent",
              "BoxSize": { "x": b.w, "y": b.h },
              "ColliderOffset": { "x": 0.0, "y": 0.0 },
              "Enable": true
            },
            {
              "@type": "script.ResourceOccupiedArea",
              "BlocksMovement": true,
              "OffsetXMin": -Math.floor(b.w / 2),
              "OffsetXMax": Math.floor(b.w / 2),
              "OffsetYMin": -Math.floor(b.h / 2),
              "OffsetYMax": Math.floor(b.h / 2),
              "Enable": true
            }
          ],
          "@version": 1
        }
      };
      ents.push(bEnt);
      console.log(` - Created Boundary Collider: ${b.name}`);
    } else {
      const tr = bEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.TransformComponent");
      const tg = bEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.TriggerComponent");
      if (tr) tr.Position = { x: b.x, y: b.y, z: 0.0 };
      if (tg) tg.BoxSize = { x: b.w, y: b.h };
    }
  });

  // 7) 맵별 특화 엔티티 (선착장 부두 및 출항 나룻배)
  if (config.hasDock) {
    const dockX = config.dockX || 0;
    const dockY = config.dockY || -24;

    // Furniture_Pier
    let pierEnt = ents.find(e => e.jsonString && (e.jsonString.name === "Furniture_Pier" || e.jsonString.name === "Pier"));
    if (!pierEnt) {
      const pierUuid = "p" + Math.random().toString(16).slice(2, 10) + "-3333-4444-8888-" + Math.random().toString(16).slice(2, 14);
      pierEnt = {
        id: pierUuid,
        path: `${mapPathStr}/Furniture_Pier`,
        componentNames: "MOD.Core.TransformComponent,MOD.Core.SpriteRendererComponent,script.PlaceableFurniture",
        jsonString: {
          name: "Furniture_Pier",
          path: `${mapPathStr}/Furniture_Pier`,
          nameEditable: true,
          enable: true,
          visible: true,
          localize: false,
          displayOrder: 0,
          pathConstraints: "///",
          revision: 0,
          modelId: "furniture_pier",
          "@components": [
            {
              "@type": "MOD.Core.TransformComponent",
              "Position": { "x": dockX, "y": dockY + 1.2, "z": 0.0 },
              "Scale": { "x": 0.25, "y": 0.25, "z": 1.0 },
              "Rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
              "QuaternionRotation": { "x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0 },
              "ZRotation": 0.0,
              "Enable": true
            },
            {
              "@type": "MOD.Core.SpriteRendererComponent",
              "SortingLayer": "MapLayer5",
              "OrderInLayer": 2,
              "SpriteRUID": "8d356cf966cd47a3a972e5bcf952c51c",
              "IgnoreMapLayerCheck": true,
              "Color": { "r": 1, "g": 1, "b": 1, "a": 1 },
              "Enable": true
            },
            {
              "@type": "script.PlaceableFurniture",
              "ItemId": "Pier",
              "BlocksMovement": false,
              "IsWalkable": true,
              "Enable": true
            }
          ],
          "@version": 1
        }
      };
      ents.push(pierEnt);
      console.log(` - Created Furniture_Pier at (${dockX}, ${dockY + 1.2})`);
    } else {
      const tr = pierEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.TransformComponent");
      const sp = pierEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.SpriteRendererComponent");
      const pf = pierEnt.jsonString["@components"].find(c => c["@type"] === "script.PlaceableFurniture");
      if (tr) tr.Position = { x: dockX, y: dockY + 1.2, z: 0.0 };
      if (sp) { sp.SortingLayer = "MapLayer5"; sp.OrderInLayer = 2; sp.SpriteRUID = "8d356cf966cd47a3a972e5bcf952c51c"; }
      if (pf) { pf.BlocksMovement = false; pf.IsWalkable = true; }
    }

    // Furniture_Boat (Departure Portal)
    let boatEnt = ents.find(e => e.jsonString && (e.jsonString.name === "Furniture_Boat" || e.jsonString.name === "Boat" || e.jsonString.name === "PortalToHome"));
    if (!boatEnt) {
      const boatUuid = "b" + Math.random().toString(16).slice(2, 10) + "-5555-4444-8888-" + Math.random().toString(16).slice(2, 14);
      boatEnt = {
        id: boatUuid,
        path: `${mapPathStr}/Furniture_Boat`,
        componentNames: "MOD.Core.TransformComponent,MOD.Core.SpriteRendererComponent,MOD.Core.TriggerComponent,script.PortalGate,script.PlaceableFurniture",
        jsonString: {
          name: "Furniture_Boat",
          path: `${mapPathStr}/Furniture_Boat`,
          nameEditable: true,
          enable: true,
          visible: true,
          localize: false,
          displayOrder: 0,
          pathConstraints: "///",
          revision: 0,
          modelId: "furniture_boat",
          "@components": [
            {
              "@type": "MOD.Core.TransformComponent",
              "Position": { "x": dockX, "y": dockY - 0.8, "z": 0.0 },
              "Scale": { "x": 0.8, "y": 0.8, "z": 1.0 },
              "Rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
              "QuaternionRotation": { "x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0 },
              "ZRotation": 0.0,
              "Enable": true
            },
            {
              "@type": "MOD.Core.SpriteRendererComponent",
              "SortingLayer": "MapLayer5",
              "OrderInLayer": 15,
              "SpriteRUID": "d1e1d2b20a104e17950d35ec8860c349",
              "IgnoreMapLayerCheck": true,
              "Color": { "r": 1, "g": 1, "b": 1, "a": 1 },
              "Enable": true
            },
            {
              "@type": "MOD.Core.TriggerComponent",
              "BoxSize": { "x": 2.5, "y": 2.0 },
              "ColliderOffset": { "x": 0.0, "y": 0.0 },
              "Enable": true
            },
            {
              "@type": "script.PortalGate",
              "DestinationGroup": config.portalGroup || "home",
              "PortalColor": "white",
              "TargetMapName": config.targetMapName || "home",
              "TargetPosition": { "x": 0.0, "y": -22.0 },
              "Enable": true
            },
            {
              "@type": "script.PlaceableFurniture",
              "ItemId": "Boat",
              "BlocksMovement": false,
              "Enable": true
            }
          ],
          "@version": 1
        }
      };
      ents.push(boatEnt);
      console.log(` - Created Furniture_Boat at (${dockX}, ${dockY - 0.8})`);
    } else {
      boatEnt.jsonString.name = "Furniture_Boat";
      const tr = boatEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.TransformComponent");
      const sp = boatEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.SpriteRendererComponent");
      const tg = boatEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.TriggerComponent");
      const pg = boatEnt.jsonString["@components"].find(c => c["@type"] === "script.PortalGate");
      const pf = boatEnt.jsonString["@components"].find(c => c["@type"] === "script.PlaceableFurniture");
      if (tr) {
        tr.Position = { x: dockX, y: dockY - 0.8, z: 0.0 };
        tr.Scale = { x: 0.8, y: 0.8, z: 1.0 };
      }
      if (sp) {
        sp.SortingLayer = "MapLayer5";
        sp.OrderInLayer = 15;
        sp.SpriteRUID = "d1e1d2b20a104e17950d35ec8860c349";
      }
      if (tg) tg.BoxSize = { x: 2.5, y: 2.0 };
      if (pg) {
        pg.DestinationGroup = config.portalGroup || "home";
        pg.PortalColor = "white";
        pg.TargetMapName = config.targetMapName || "home";
        pg.TargetPosition = { "x": 0.0, "y": -22.0 };
      }
      if (pf) pf.BlocksMovement = false;
    }
  }

  // 8) 파일 저장
  fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
  console.log(`Successfully converted ${mapFileRel} to Island theme!`);
}

// =========================================================================
// 맵별 세부 설정 실행
// =========================================================================

// 1. town.map (공동 마을 섬)
convertMap("map/town.map", {
  mapName: "town",
  minGrid: -55,
  maxGrid: 55,
  landMin: -27,
  landMax: 27,
  hasDock: true,
  dockX: 10,
  dockY: -24,
  portalGroup: "home",
  targetMapName: "home",
  isWater: (x, y) => {
    // 남쪽 선착장 통로 (X: 9~11, Y: -25~-24)
    if (x >= 9 && x <= 11 && y >= -25 && y <= -24) return false;
    // 기본 외곽 바다 경계 (|x| >= 27 또는 |y| >= 27)
    if (Math.abs(x) >= 27 || Math.abs(y) >= 27) return true;
    // 4개 모서리 라운딩 (둥근 섬 실루엣)
    const cornerX = Math.max(0, Math.abs(x) - 20);
    const cornerY = Math.max(0, Math.abs(y) - 20);
    if (cornerX + cornerY >= 9) return true;
    return false;
  }
});

// 2. template_field.map (사냥터 섬)
convertMap("map/template_field.map", {
  mapName: "template_field",
  minGrid: -55,
  maxGrid: 55,
  landMin: -25,
  landMax: 25,
  hasDock: true,
  dockX: -3,
  dockY: -22,
  portalGroup: "town",
  targetMapName: "town",
  isWater: (x, y) => {
    // 남쪽 선착장 통로 (X: -4~-2, Y: -23~-22)
    if (x >= -4 && x <= -2 && y >= -23 && y <= -22) return false;
    // 기본 외곽 바다 경계 (|x| >= 25 || |y| >= 25)
    if (Math.abs(x) >= 25 || Math.abs(y) >= 25) return true;
    // 4개 모서리 라운딩
    const cornerX = Math.max(0, Math.abs(x) - 18);
    const cornerY = Math.max(0, Math.abs(y) - 18);
    if (cornerX + cornerY >= 8) return true;
    return false;
  }
});

// 3. template_boss.map (보스 아레나 섬)
convertMap("map/template_boss.map", {
  mapName: "template_boss",
  minGrid: -35,
  maxGrid: 35,
  landMin: -14,
  landMax: 14,
  hasDock: true,
  dockX: 0,
  dockY: -12,
  portalGroup: "town",
  targetMapName: "town",
  isWater: (x, y) => {
    // 남쪽 선착장 통로 (X: -1~1, Y: -13~-12)
    if (x >= -1 && x <= 1 && y >= -13 && y <= -12) return false;
    // 기본 외곽 바다 경계 (|x| >= 14 || |y| >= 14)
    if (Math.abs(x) >= 14 || Math.abs(y) >= 14) return true;
    // 원형 아레나 라운딩
    const cornerX = Math.max(0, Math.abs(x) - 9);
    const cornerY = Math.max(0, Math.abs(y) - 9);
    if (cornerX + cornerY >= 6) return true;
    return false;
  }
});
