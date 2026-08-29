/**
 * convert_map01_to_island.cjs
 * 
 * map01.map을 돌벽/절벽 형태에서 바다로 둘러싸인 "초록 섬(Green Island)"으로 변환합니다.
 * 
 * 1. 맵 전체 그리드 범위를 -55 ~ 55로 대폭 확장하여 화면 가장자리 갈색 여백을 완벽 차단.
 * 2. BackgroundComponent의 SolidColor를 갈색 -> 푸른 바다색(Deep Blue)으로 변경.
 * 3. 공식 4단 지형 서브셀 마스크 표준(ResourceSpawner.mlua 일치):
 *    - L1 Soil: 전면 지반 (-55 ~ 55)
 *    - L0 Water: 외곽 전체 바다 + 해안선 프린지 (Water*)
 *    - L6 WetRim: 해안선 수변 림 (WetRim*)
 *    - L2 Grass: 섬 내부 잔디 (FullGrass) + 해안선 에지 (Grass*)
 *    - L4 Wall, L5 Terrace: [] (돌벽 제거)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const mapPath = path.join(ROOT, "map/map01.map");
const tilesetPath = path.join(ROOT, "RootDesk/MyDesk/wall.tileset");

// 1. wall.tileset 인덱스 매핑 로드
const ts = JSON.parse(fs.readFileSync(tilesetPath, "utf8"));
const datas = ts.ContentProto.Json.datas;
const IDX = {};
datas.forEach((d, i) => { IDX[d.Name] = i; });

console.log("Loaded tileset entries:", Object.keys(IDX).length);

// 2. 맵 파일 로드
const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const ents = mapJson.ContentProto.Entities;

function findLayer(name) {
  const e = ents.find((ent) => ent.jsonString && ent.jsonString.name === name);
  if (!e) return null;
  const comps = e.jsonString["@components"] || [];
  const tc = comps.find((c) => c["@type"] === "MOD.Core.RectTileMapComponent");
  const tr = comps.find((c) => c["@type"] === "MOD.Core.TransformComponent");
  return { e, js: e.jsonString, tc, tr };
}

const L0 = findLayer("RectTileMap0");
const L1 = findLayer("RectTileMap");
const L2 = findLayer("RectTileMap2");
const L4 = findLayer("RectTileMap4");
const L5 = findLayer("RectTileMap5");
const L6 = findLayer("RectTileMap6");

if (!L0 || !L1 || !L2 || !L4 || !L5 || !L6) {
  console.error("Missing required tilemap layers in map01.map");
  process.exit(1);
}

// Background & MapComponent 튜닝 (갈색 여백 원천 차단)
const bgEnt = ents.find(e => e.jsonString && e.jsonString.name === "Background");
if (bgEnt) {
  const bg = bgEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.BackgroundComponent");
  if (bg) {
    // 깊고 맑은 바다 톤 (Ocean Blue)
    bg.SolidColor = { r: 0.18, g: 0.45, b: 0.72, a: 1 };
  }
}

const mapEnt = ents.find(e => e.jsonString && e.jsonString.name === "map01");
if (mapEnt) {
  const mc = mapEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.MapComponent");
  if (mc) {
    mc.LeftBottom = { x: -55, y: -55 };
    mc.RightTop = { x: 55, y: 55 };
  }
}

// 3. 지형 마스크 정의 (Water vs Land)
// -55 ~ 55 범위로 확장 (111 x 111 그리드)
const MAP_MIN = -55;
const MAP_MAX = 55;
const waterGrid = new Map();

function isWaterCoord(x, y) {
  // 남쪽 선착장 보행 통로 (X: -1~1, Y: -25~-24)
  if (x >= -1 && x <= 1 && y >= -25 && y <= -24) {
    return false;
  }
  
  // 기본 외곽 바다 경계 (|x| >= 24 또는 |y| >= 24)
  if (Math.abs(x) >= 24 || Math.abs(y) >= 24) {
    return true;
  }
  
  // 4개 모서리 라운딩 (둥근 섬 실루엣)
  const cornerX = Math.max(0, Math.abs(x) - 18);
  const cornerY = Math.max(0, Math.abs(y) - 18);
  if (cornerX + cornerY >= 8) {
    return true;
  }
  
  return false;
}

// 기존 연못 셀 수집
(L0.tc.tileMap || []).forEach(t => {
  if (Math.abs(t.position.x) < 22 && Math.abs(t.position.y) < 22) {
    waterGrid.set(`${t.position.x},${t.position.y}`, true);
  }
});

for (let y = MAP_MIN; y <= MAP_MAX; y++) {
  for (let x = MAP_MIN; x <= MAP_MAX; x++) {
    const key = `${x},${y}`;
    if (!waterGrid.has(key)) {
      waterGrid.set(key, isWaterCoord(x, y));
    }
  }
}

function getWater(x, y) {
  const key = `${x},${y}`;
  if (waterGrid.has(key)) return waterGrid.get(key);
  return true; // 맵 밖은 바다
}

// 4. 공식 서브셀 마스크 표준 매핑 (ResourceSpawner.mlua 일치)
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
  return null;
}

function maskToGrassTileName(mask) {
  if (mask == null || mask === 0) return "FullGrass";
  if (mask === 15) return null;
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
  if (mask === 6)  return "SubGrassLTRD";
  if (mask === 9)  return "SubGrassRTLD";
  return "FullGrass";
}

// 5. 4단 타일 데이터 생성 (-55 ~ 55)
const l0Tiles = [];
const l6Tiles = [];
const l1Tiles = [];
const l2Tiles = [];

console.log(`Generating extended Island tiles across ${MAP_MIN}~${MAP_MAX} grid (111x111)...`);

for (let y = MAP_MIN; y <= MAP_MAX; y++) {
  for (let x = MAP_MIN; x <= MAP_MAX; x++) {
    const pos = { x, y };
    
    // 1) L1 Soil: 전면 지반
    l1Tiles.push({ type: 0, position: pos, tileIndex: IDX["Soil"] });
    
    if (getWater(x, y)) {
      // 2) 물 셀: wm 계산
      let wm = 15;
      for (const n of NEIGHBORS) {
        if (!getWater(x + n.dx, y + n.dy)) {
          wm = wm - (wm & n.bits);
        }
      }
      
      const wName = maskToWaterTileName(wm);
      if (wName && IDX[wName] !== undefined) {
        l0Tiles.push({ type: 0, position: pos, tileIndex: IDX[wName] });
      }
      
      const rName = maskToWetRimTileName(wm);
      if (rName && IDX[rName] !== undefined) {
        l6Tiles.push({ type: 0, position: pos, tileIndex: IDX[rName] });
      }
    } else {
      // 3) 육지 셀: gm 계산
      let gm = 0;
      for (const n of NEIGHBORS) {
        if (getWater(x + n.dx, y + n.dy)) {
          gm = gm | n.bits;
        }
      }
      
      const gName = maskToGrassTileName(gm);
      if (gName && IDX[gName] !== undefined) {
        l2Tiles.push({ type: 0, position: pos, tileIndex: IDX[gName] });
      }
    }
  }
}

console.log(`Generated: L1 Soil=${l1Tiles.length}, L0 Water=${l0Tiles.length}, L6 WetRim=${l6Tiles.length}, L2 Grass=${l2Tiles.length}`);

// 6. 32개 엔티티 보존 및 레이어 프로퍼티 적용
L1.tc.tileMap = l1Tiles;
L1.tc.SortingLayer = "MapLayer0";
L1.tr.Position.z = 1000;

L2.tc.tileMap = l2Tiles;
L2.tc.SortingLayer = "MapLayer1";
L2.tr.Position.z = 999;

L0.tc.tileMap = l0Tiles;
L0.tc.SortingLayer = "MapLayer2";
L0.tr.Position.z = 998;

L6.tc.tileMap = l6Tiles;
L6.tc.SortingLayer = "MapLayer3";
L6.tr.Position.z = 997;

L4.tc.tileMap = [];
L4.tc.SortingLayer = "MapLayer4";
L4.tr.Position.z = 996;

L5.tc.tileMap = [];
L5.tc.SortingLayer = "MapLayer5";
L5.tr.Position.z = 995;

fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully expanded ocean water coverage across entire viewport!");
