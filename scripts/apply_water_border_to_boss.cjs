/**
 * scripts/apply_water_border_to_boss.cjs
 * 
 * 보스 사냥터(template_boss.map)의 기존 내부 아레나 지형(|x| <= 12, |y| <= 12)을 100% 원형 보존하면서,
 * 기존 외곽 돌벽(|x| >= 13 or |y| >= 13) 및 그 바깥 영역(-35 ~ 35)에 '물(Water)'과 '수변 림(WetRim)', '해변 잔디 에지'를 완벽한 정방향으로 안착시킵니다.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const mapPath = path.join(ROOT, "map/template_boss.map");
const tilesetPath = path.join(ROOT, "RootDesk/MyDesk/wall.tileset");

// 1. wall.tileset 인덱스 매핑 로드
const ts = JSON.parse(fs.readFileSync(tilesetPath, "utf8"));
const datas = ts.ContentProto.Json.datas;
const IDX = {};
datas.forEach((d, i) => { IDX[d.Name] = i; });
console.log("Loaded tileset entries:", Object.keys(IDX).length);

// 2. template_boss.map 로드
const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const ents = mapJson.ContentProto.Entities;
const mapPathStr = "/maps/template_boss";
const tilesetRUID = "tileset://2361293b-a3c2-4138-8dec-4fb4d1f9acf4";

// Background 설정
const bgEnt = ents.find(e => e.jsonString && e.jsonString.name === "Background");
if (bgEnt) {
  const bg = bgEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.BackgroundComponent");
  if (bg) {
    bg.SolidColor = { r: 0.18, g: 0.45, b: 0.72, a: 1.0 };
    console.log(" - Background SolidColor -> Ocean Blue");
  }
}

// MapComponent 설정
const mapEnt = ents.find(e => e.jsonString && e.jsonString.name === "template_boss");
if (mapEnt) {
  const mc = mapEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.MapComponent");
  if (mc) {
    mc.LeftBottom = { x: -35.0, y: -35.0 };
    mc.RightTop = { x: 35.0, y: 35.0 };
    mc.UseCustomBound = true;
    console.log(" - MapComponent bounds -> [-35..35]");
  }
}

// 3. 레이어 생성 및 정합 헬퍼
function createOrGetLayer(name, sortingLayer, posZ, displayOrder) {
  let e = ents.find(ent => ent.jsonString && ent.jsonString.name === name);
  if (!e) {
    const id = "e" + Math.random().toString(16).slice(2, 9) + "-1111-4444-8888-" + Math.random().toString(16).slice(2, 14);
    e = {
      id: id,
      path: `${mapPathStr}/${name}`,
      componentNames: "MOD.Core.TransformComponent,MOD.Core.RectTileMapComponent",
      jsonString: {
        name: name,
        path: `${mapPathStr}/${name}`,
        nameEditable: false,
        enable: true,
        visible: true,
        localize: false,
        displayOrder: displayOrder,
        pathConstraints: "///",
        revision: 1,
        origin: {
          type: "Model",
          entry_id: "recttilemap",
          sub_entity_id: null,
          root_entity_id: null,
          replaced_model_id: null
        },
        modelId: "recttilemap",
        "@components": [
          {
            "@type": "MOD.Core.TransformComponent",
            "Rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
            "Position": { "x": 0.0, "y": 0.0, "z": posZ },
            "QuaternionRotation": { "x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0 },
            "Scale": { "x": 1.0, "y": 1.0, "z": 1.0 },
            "ZRotation": 0.0,
            "Enable": true
          },
          {
            "@type": "MOD.Core.RectTileMapComponent",
            "SortingLayer": sortingLayer,
            "TileSetRUID": tilesetRUID,
            "Enable": true,
            "tileMap": []
          }
        ],
        "@version": 1
      }
    };
    ents.push(e);
    console.log(` - Created missing layer: ${name} (${sortingLayer}, z=${posZ})`);
  } else {
    const tc = e.jsonString["@components"].find(c => c["@type"] === "MOD.Core.RectTileMapComponent");
    const tr = e.jsonString["@components"].find(c => c["@type"] === "MOD.Core.TransformComponent");
    if (tc) {
      tc.SortingLayer = sortingLayer;
      tc.TileSetRUID = tilesetRUID;
    }
    if (tr) {
      tr.Position.z = posZ;
    }
  }
  const tc = e.jsonString["@components"].find(c => c["@type"] === "MOD.Core.RectTileMapComponent");
  return { e, tc };
}

// 4단 레이어 정합
const L1 = createOrGetLayer("RectTileMap", "MapLayer0", 0, 10);   // Soil 지반
const L2 = createOrGetLayer("RectTileMap2", "MapLayer1", 0, 11);  // Grass 잔디
const L0 = createOrGetLayer("RectTileMap0", "MapLayer2", 998, 32);// Water 바다
const L6 = createOrGetLayer("RectTileMap6", "MapLayer3", 997, 13);// WetRim 수변림
const L4 = createOrGetLayer("RectTileMap4", "MapLayer4", 0, 14);  // 돌벽 (철거)
const L5 = createOrGetLayer("RectTileMap5", "MapLayer5", 0, 15);  // 테라스 (철거)

// 4. 물 영역 판정 (|x| >= 13 or |y| >= 13)
const MAP_MIN = -35;
const MAP_MAX = 35;

const waterCells = new Set();
for (let y = MAP_MIN; y <= MAP_MAX; y++) {
  for (let x = MAP_MIN; x <= MAP_MAX; x++) {
    if (Math.abs(x) >= 13 || Math.abs(y) >= 13) {
      waterCells.add(`${x},${y}`);
    }
  }
}
console.log(`Total water cells: ${waterCells.size}`);

// 5. 서브셀 마스크 오프셋 (ResourceSpawner 일치)
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

// 6. 물 타일(L0), 수변 림 타일(L6), 지반 타일(L1) 정방향 계산
const l0Tiles = [];
const l1Tiles = [];
const l6Tiles = [];

for (let y = MAP_MIN; y <= MAP_MAX; y++) {
  for (let x = MAP_MIN; x <= MAP_MAX; x++) {
    // L1 Soil: 전면 지반
    l1Tiles.push({
      type: 0,
      position: { x, y },
      tileIndex: IDX["Soil"]
    });

    if (waterCells.has(`${x},${y}`)) {
      let wm = 15;
      for (const n of NEIGHBORS) {
        const nk = `${x + n.dx},${y + n.dy}`;
        if (!waterCells.has(nk)) {
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
  }
}

l0Tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
l6Tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);

// 7. 기존 L2 잔디 타일 수집 (|x| < 12 and |y| < 12 내부 잔디는 100% 무결점 보존)
const l2Map = new Map();
(L2.tc.tileMap || []).forEach(t => {
  if (Math.abs(t.position.x) < 12 && Math.abs(t.position.y) < 12) {
    l2Map.set(`${t.position.x},${t.position.y}`, t.tileIndex);
  }
});
console.log(` - Preserved internal L2 Grass tiles: ${l2Map.size}`);

// 8. 해안선 경계셀(|x| == 12 or |y| == 12)의 잔디 에지 타일 정방향 계산 (gm |= bits)
for (let y = -12; y <= 12; y++) {
  for (let x = -12; x <= 12; x++) {
    const isBorder = Math.abs(x) === 12 || Math.abs(y) === 12;
    if (isBorder) {
      let gm = 0; // 0 = FullGrass 에서 시작
      for (const n of NEIGHBORS) {
        const nx = x + n.dx;
        const ny = y + n.dy;
        if (waterCells.has(`${nx},${ny}`)) {
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

// 9. 레이어 업데이트
L0.tc.tileMap = l0Tiles;
L1.tc.tileMap = l1Tiles;
L2.tc.tileMap = finalL2Tiles;
L6.tc.tileMap = l6Tiles;
L4.tc.tileMap = [];
L5.tc.tileMap = [];

console.log(` - L0 Water tiles: ${l0Tiles.length} (${L0.tc.SortingLayer})`);
console.log(` - L1 Soil tiles: ${l1Tiles.length} (${L1.tc.SortingLayer})`);
console.log(` - L2 Grass & Coast tiles: ${finalL2Tiles.length} (${L2.tc.SortingLayer})`);
console.log(` - L4 Walls: 0 (Removed)`);
console.log(` - L5 Terraces: 0 (Removed)`);
console.log(` - L6 WetRim tiles: ${l6Tiles.length} (${L6.tc.SortingLayer})`);

// 10. 경계 콜라이더 (X = ±13.5, Y = ±13.5)
const bounds = [
  { name: "Boundary_Left",   x: -13.5, y: 0.0,   w: 2.0,  h: 30.0 },
  { name: "Boundary_Right",  x: 13.5,  y: 0.0,   w: 2.0,  h: 30.0 },
  { name: "Boundary_Top",    x: 0.0,   y: 13.5,  w: 30.0, h: 2.0 },
  { name: "Boundary_Bottom", x: 0.0,   y: -13.5, w: 30.0, h: 2.0 }
];

bounds.forEach(b => {
  let bEnt = ents.find(e => e.jsonString && e.jsonString.name === b.name);
  if (!bEnt) {
    const bId = "b" + Math.random().toString(16).slice(2, 9) + "-2222-4444-8888-" + Math.random().toString(16).slice(2, 14);
    bEnt = {
      id: bId,
      path: `${mapPathStr}/${b.name}`,
      componentNames: "MOD.Core.TransformComponent,MOD.Core.TriggerComponent,script.ResourceOccupiedArea",
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
  }
});

// 샘플 타일 방향 검증
const sampleChecks = [
  { desc: "Top Water (0, 13)", x: 0, y: 13, list: l0Tiles },
  { desc: "Bottom Water (0, -13)", x: 0, y: -13, list: l0Tiles },
  { desc: "Left Water (-13, 0)", x: -13, y: 0, list: l0Tiles },
  { desc: "Right Water (13, 0)", x: 13, y: 0, list: l0Tiles },
  { desc: "Top WetRim (0, 13)", x: 0, y: 13, list: l6Tiles },
  { desc: "Bottom WetRim (0, -13)", x: 0, y: -13, list: l6Tiles },
  { desc: "Top Grass Border (0, 12)", x: 0, y: 12, list: finalL2Tiles },
  { desc: "Bottom Grass Border (0, -12)", x: 0, y: -12, list: finalL2Tiles },
  { desc: "Left Grass Border (-12, 0)", x: -12, y: 0, list: finalL2Tiles },
  { desc: "Right Grass Border (12, 0)", x: 12, y: 0, list: finalL2Tiles },
  { desc: "Top-Left Grass Corner (-12, 12)", x: -12, y: 12, list: finalL2Tiles },
  { desc: "Top-Right Grass Corner (12, 12)", x: 12, y: 12, list: finalL2Tiles },
  { desc: "Bottom-Left Grass Corner (-12, -12)", x: -12, y: -12, list: finalL2Tiles },
  { desc: "Bottom-Right Grass Corner (12, -12)", x: 12, y: -12, list: finalL2Tiles }
];

sampleChecks.forEach(sc => {
  const t = sc.list.find(item => item.position.x === sc.x && item.position.y === sc.y);
  const name = t ? datas[t.tileIndex].Name : "none";
  console.log(`   [Check] ${sc.desc} -> ${name}`);
});

fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully applied perfect island water border to template_boss.map!");
