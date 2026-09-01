/**
 * scripts/fix_water_border_directions_town.cjs
 * 
 * town.map의 물(Water*)과 수변 림(WetRim*) 마스크 연산을 ResourceSpawner 규약에 맞춰
 * wm = 15 에서 시작하여 육지 방향 비트를 빼는(wm - (wm & n.bits)) 정상적인 정방향으로 교정합니다.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const mapPath = path.join(ROOT, "map/town.map");
const tilesetPath = path.join(ROOT, "RootDesk/MyDesk/wall.tileset");

// 1. wall.tileset 인덱스 매핑 로드
const ts = JSON.parse(fs.readFileSync(tilesetPath, "utf8"));
const datas = ts.ContentProto.Json.datas;
const IDX = {};
datas.forEach((d, i) => { IDX[d.Name] = i; });
console.log("Loaded tileset entries:", Object.keys(IDX).length);

// 2. town.map 로드
const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const ents = mapJson.ContentProto.Entities;
const mapPathStr = "/maps/town";
const tilesetRUID = "tileset://2361293b-a3c2-4138-8dec-4fb4d1f9acf4";

function getLayer(name) {
  const e = ents.find(ent => ent.jsonString && ent.jsonString.name === name);
  if (!e) return null;
  const tc = e.jsonString["@components"].find(c => c["@type"] === "MOD.Core.RectTileMapComponent");
  return { e, tc };
}

const L0 = getLayer("RectTileMap0");
const L1 = getLayer("RectTileMap");
const L2 = getLayer("RectTileMap2");
const L6 = getLayer("RectTileMap6");
const L4 = getLayer("RectTileMap4");
const L5 = getLayer("RectTileMap5");

// 3. 물 영역 정의 (|x| >= 33 or |y| >= 33)
const MAP_MIN = -55;
const MAP_MAX = 55;

const waterCells = new Set();
for (let y = MAP_MIN; y <= MAP_MAX; y++) {
  for (let x = MAP_MIN; x <= MAP_MAX; x++) {
    if (Math.abs(x) >= 33 || Math.abs(y) >= 33) {
      waterCells.add(`${x},${y}`);
    }
  }
}
console.log(`Total water cells: ${waterCells.size}`);

// 4. 서브셀 마스크 오프셋 (ResourceSpawner 일치)
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
  if (mask == null || mask === 15) return "Water";
  if (mask === 0) return "Water";
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

// 5. 물 타일(L0) 및 수변 림 타일(L6) 정확한 정방향 계산
const l0Tiles = [];
const l6Tiles = [];

for (const key of waterCells) {
  const [x, y] = key.split(",").map(Number);
  let wm = 15;
  for (const n of NEIGHBORS) {
    const nk = `${x + n.dx},${y + n.dy}`;
    if (!waterCells.has(nk)) {
      // 육지 이웃 방향의 비트 제거!
      wm = wm - (wm & n.bits);
    }
  }

  // L0 Water
  const wName = maskToWaterTileName(wm);
  const wIdx = IDX[wName];
  if (wIdx !== undefined) {
    l0Tiles.push({ type: 0, position: { x, y }, tileIndex: wIdx });
  }

  // L6 WetRim
  const rName = maskToWetRimTileName(wm);
  if (rName) {
    const rIdx = IDX[rName];
    if (rIdx !== undefined) {
      l6Tiles.push({ type: 0, position: { x, y }, tileIndex: rIdx });
    }
  }
}

l0Tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
l6Tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);

// 6. 육지 가장자리 해안선 잔디 프린지 보강 (|x| == 32 or |y| == 32)
// 기존 L2 내부 잔디를 가져온 후, 바다와 맞닿은 경계셀의 잔디가 자연스러운 해변 에지가 되도록 정합
const l2Map = new Map();
(L2.tc.tileMap || []).forEach(t => {
  if (Math.abs(t.position.x) <= 32 && Math.abs(t.position.y) <= 32) {
    l2Map.set(`${t.position.x},${t.position.y}`, t.tileIndex);
  }
});

// 경계셀(|x| == 32 or |y| == 32)의 에지 계산
for (let y = -32; y <= 32; y++) {
  for (let x = -32; x <= 32; x++) {
    const isBorder = Math.abs(x) === 32 || Math.abs(y) === 32;
    if (isBorder) {
      let gm = 15;
      for (const n of NEIGHBORS) {
        const nx = x + n.dx;
        const ny = y + n.dy;
        if (waterCells.has(`${nx},${ny}`)) {
          gm = gm - (gm & n.bits);
        }
      }
      // 마스크에 맞는 잔디 에지 타일
      let gName = "FullGrass";
      if (gm === 12) gName = "GrassT";
      else if (gm === 3) gName = "GrassD";
      else if (gm === 5) gName = "GrassL";
      else if (gm === 10) gName = "GrassR";
      else if (gm === 13) gName = "GrassLT";
      else if (gm === 14) gName = "GrassRT";
      else if (gm === 7) gName = "GrassLD";
      else if (gm === 11) gName = "GrassRD";
      else if (gm === 4) gName = "GrassLTCorner";
      else if (gm === 8) gName = "GrassRTCorner";
      else if (gm === 1) gName = "GrassLDCorner";
      else if (gm === 2) gName = "GrassRDCorner";

      if (IDX[gName] !== undefined) {
        l2Map.set(`${x},${y}`, IDX[gName]);
      }
    }
  }
}

const finalL2Tiles = [];
for (const [k, tileIndex] of l2Map.entries()) {
  const [x, y] = k.split(",").map(Number);
  finalL2Tiles.push({ type: 0, position: { x, y }, tileIndex });
}
finalL2Tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);

// 7. 레이어 업데이트
L0.tc.tileMap = l0Tiles;
L2.tc.tileMap = finalL2Tiles;
L6.tc.tileMap = l6Tiles;
L4.tc.tileMap = [];
L5.tc.tileMap = [];

console.log(` - L0 Water tiles: ${l0Tiles.length}`);
console.log(` - L2 Grass & Coast tiles: ${finalL2Tiles.length}`);
console.log(` - L6 WetRim tiles: ${l6Tiles.length}`);

// 샘플 타일명 확인 (상단, 하단, 좌측, 우측)
const sampleTiles = [
  { desc: "Top Water (0, 33)", key: "0,33", map: l0Tiles },
  { desc: "Bottom Water (0, -33)", key: "0,-33", map: l0Tiles },
  { desc: "Left Water (-33, 0)", key: "-33,0", map: l0Tiles },
  { desc: "Right Water (33, 0)", key: "33,0", map: l0Tiles },
  { desc: "Top WetRim (0, 33)", key: "0,33", map: l6Tiles },
  { desc: "Bottom WetRim (0, -33)", key: "0,-33", map: l6Tiles },
  { desc: "Left WetRim (-33, 0)", key: "-33,0", map: l6Tiles },
  { desc: "Right WetRim (33, 0)", key: "33,0", map: l6Tiles }
];

sampleTiles.forEach(st => {
  const t = st.map.find(item => `${item.position.x},${item.position.y}` === st.key);
  const name = t ? datas[t.tileIndex].Name : "none";
  console.log(`   [Check] ${st.desc} -> ${name}`);
});

fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully fixed water & rim border directions in town.map!");
