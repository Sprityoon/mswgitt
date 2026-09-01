/**
 * scripts/fix_grass_border_directions_town.cjs
 * 
 * town.map의 L2 잔디 해안선 에지 타일(Grass*)을 완벽한 정방향 공식(gm |= bits)으로 교정합니다.
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

function getLayer(name) {
  const e = ents.find(ent => ent.jsonString && ent.jsonString.name === name);
  if (!e) return null;
  const tc = e.jsonString["@components"].find(c => c["@type"] === "MOD.Core.RectTileMapComponent");
  return { e, tc };
}

const L2 = getLayer("RectTileMap2");

// 물 영역 판정
function isWaterCoord(x, y) {
  return Math.abs(x) >= 33 || Math.abs(y) >= 33;
}

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
  return "FullGrass";
}

// 3. 기존 L2 잔디 타일 맵 구성 (|x| < 32 and |y| < 32 내부 잔디는 100% 보존)
const l2Map = new Map();
(L2.tc.tileMap || []).forEach(t => {
  if (Math.abs(t.position.x) < 32 && Math.abs(t.position.y) < 32) {
    l2Map.set(`${t.position.x},${t.position.y}`, t.tileIndex);
  }
});

// 4. 경계선(|x| == 32 or |y| == 32)의 잔디 에지 타일 정방향 계산
for (let y = -32; y <= 32; y++) {
  for (let x = -32; x <= 32; x++) {
    const isBorder = Math.abs(x) === 32 || Math.abs(y) === 32;
    if (isBorder) {
      let gm = 0; // 0 = FullGrass 에서 시작
      for (const n of NEIGHBORS) {
        const nx = x + n.dx;
        const ny = y + n.dy;
        if (isWaterCoord(nx, ny)) {
          // 바다 이웃 방향의 비트를 더함!
          gm |= n.bits;
        }
      }

      const gName = maskToGrassTileName(gm);
      if (gName && IDX[gName] !== undefined) {
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

L2.tc.tileMap = finalL2Tiles;
console.log(` - L2 Grass & Coast tiles: ${finalL2Tiles.length}`);

// 샘플 잔디 에지 확인
const sampleChecks = [
  { desc: "Top Grass Border (0, 32)", x: 0, y: 32 },
  { desc: "Bottom Grass Border (0, -32)", x: 0, y: -32 },
  { desc: "Left Grass Border (-32, 0)", x: -32, y: 0 },
  { desc: "Right Grass Border (32, 0)", x: 32, y: 0 },
  { desc: "Top-Left Corner (-32, 32)", x: -32, y: 32 },
  { desc: "Top-Right Corner (32, 32)", x: 32, y: 32 },
  { desc: "Bottom-Left Corner (-32, -32)", x: -32, y: -32 },
  { desc: "Bottom-Right Corner (32, -32)", x: 32, y: -32 }
];

sampleChecks.forEach(sc => {
  const key = `${sc.x},${sc.y}`;
  const t = finalL2Tiles.find(item => item.position.x === sc.x && item.position.y === sc.y);
  const name = t ? datas[t.tileIndex].Name : "none";
  console.log(`   [Check] ${sc.desc} -> ${name}`);
});

fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully fixed grass border edge directions in town.map!");
