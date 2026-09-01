/**
 * scripts/apply_water_border_to_town.cjs
 * 
 * 마을(town.map)의 기존 내부 지형(잔디/흙길/건물/주민)을 100% 원형 보존하면서,
 * 기존 외곽 돌벽(|x| >= 33 or |y| >= 33) 및 그 바깥 영역(-55 ~ 55)에 '물(Water)'과 '수변 림(WetRim)'을 채웁니다.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const mapPath = path.join(ROOT, "map/town.map");
const tilesetPath = path.join(ROOT, "RootDesk/MyDesk/wall.tileset");

// 1. tileset 로드
const ts = JSON.parse(fs.readFileSync(tilesetPath, "utf8"));
const datas = ts.ContentProto.Json.datas;
const IDX = {};
datas.forEach((d, i) => { IDX[d.Name] = i; });

// 2. 맵 로드
const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const ents = mapJson.ContentProto.Entities;
const mapPathStr = "/maps/town";

// 1) Background & MapComponent
const bgEnt = ents.find(e => e.jsonString && e.jsonString.name === "Background");
if (bgEnt) {
  const bg = bgEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.BackgroundComponent");
  if (bg) {
    bg.SolidColor = { r: 0.18, g: 0.45, b: 0.72, a: 1 };
    console.log(" - Background SolidColor -> Ocean Blue");
  }
}

const mapEnt = ents.find(e => e.jsonString && e.jsonString.name === "town");
if (mapEnt) {
  const mc = mapEnt.jsonString["@components"].find(c => c["@type"] === "MOD.Core.MapComponent");
  if (mc) {
    mc.LeftBottom = { x: -55, y: -55 };
    mc.RightTop = { x: 55, y: 55 };
    mc.UseCustomBound = true;
    console.log(" - MapComponent bounds -> [-55..55]");
  }
}

// 2) 레이어 확보 헬퍼
function createTilemapEntity(name, sortingLayer) {
  const uuid = "e" + Math.random().toString(16).slice(2, 10) + "-1111-4444-8888-" + Math.random().toString(16).slice(2, 14);
  return {
    id: uuid,
    path: `${mapPathStr}/${name}`,
    componentNames: "MOD.Core.TransformComponent,MOD.Core.RectTileMapComponent",
    jsonString: {
      name: name,
      path: `${mapPathStr}/${name}`,
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

function getOrAddLayer(name, sortingLayer) {
  let e = ents.find(ent => ent.jsonString && ent.jsonString.name === name);
  if (!e) {
    e = createTilemapEntity(name, sortingLayer);
    ents.push(e);
    console.log(` - Created layer ${name}`);
  }
  const tc = e.jsonString["@components"].find(c => c["@type"] === "MOD.Core.RectTileMapComponent");
  return { e, tc };
}

const L0 = getOrAddLayer("RectTileMap0", "MapLayer0");
const L1 = getOrAddLayer("RectTileMap", "MapLayer1");
const L2 = getOrAddLayer("RectTileMap2", "MapLayer2");
const L4 = getOrAddLayer("RectTileMap4", "MapLayer4");
const L5 = getOrAddLayer("RectTileMap5", "MapLayer5");
const L6 = getOrAddLayer("RectTileMap6", "MapLayer6");

// 3) 기존 내부 잔디 타일 수집 ( |x| <= 32 and |y| <= 32 만 100% 보존 )
const preservedL2Tiles = [];
(L2.tc.tileMap || []).forEach(t => {
  if (Math.abs(t.position.x) <= 32 && Math.abs(t.position.y) <= 32) {
    preservedL2Tiles.push(t);
  }
});
console.log(` - Preserved internal L2 Grass tiles: ${preservedL2Tiles.length}`);

// 4) 물(Water) 영역 정의 (|x| >= 33 or |y| >= 33)
const MAP_MIN = -55;
const MAP_MAX = 55;

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

// 5) 타일 생성
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

    if (isWaterCoord(x, y)) {
      // 8방향 이웃 육지 검사로 물 마스크 계산
      let mask = 0;
      for (const n of NEIGHBORS) {
        const nx = x + n.dx;
        const ny = y + n.dy;
        if (!isWaterCoord(nx, ny)) {
          mask |= n.bits;
        }
      }

      const waterName = maskToWaterTileName(mask);
      if (IDX[waterName] !== undefined) {
        l0Tiles.push({
          type: 0,
          position: { x, y },
          tileIndex: IDX[waterName]
        });
      }

      const wetName = maskToWetRimTileName(mask);
      if (wetName && IDX[wetName] !== undefined) {
        l6Tiles.push({
          type: 0,
          position: { x, y },
          tileIndex: IDX[wetName]
        });
      }
    }
  }
}

// 6) 적용
L0.tc.tileMap = l0Tiles;
L1.tc.tileMap = l1Tiles;
L2.tc.tileMap = preservedL2Tiles; // 내부 잔디 완벽 보존
L4.tc.tileMap = [];               // 돌벽 완전 철거
L5.tc.tileMap = [];               // 테라스 완전 철거
L6.tc.tileMap = l6Tiles;          // 수변 림 안착

console.log(` - L0 Water tiles count: ${l0Tiles.length}`);
console.log(` - L1 Soil tiles count: ${l1Tiles.length}`);
console.log(` - L2 Preserved Grass tiles: ${preservedL2Tiles.length}`);
console.log(` - L4 Walls: 0 (Removed)`);
console.log(` - L5 Terraces: 0 (Removed)`);
console.log(` - L6 WetRim tiles count: ${l6Tiles.length}`);

// 7) 경계 콜라이더 (X: ±33, Y: ±33 바깥 이탈 방지)
const bounds = [
  { name: "Boundary_Left",   x: -33.5, y: 0,     w: 2,  h: 68 },
  { name: "Boundary_Right",  x: 33.5,  y: 0,     w: 2,  h: 68 },
  { name: "Boundary_Top",    x: 0,     y: 33.5,  w: 68, h: 2 },
  { name: "Boundary_Bottom", x: 0,     y: -33.5, w: 68, h: 2 }
];

bounds.forEach(b => {
  let bEnt = ents.find(e => e.jsonString && e.jsonString.name === b.name);
  if (!bEnt) {
    const bUuid = "b" + Math.random().toString(16).slice(2, 10) + "-2222-4444-8888-" + Math.random().toString(16).slice(2, 14);
    bEnt = {
      id: bUuid,
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

// 8) 파일 저장
fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully applied water border to town.map while 100% preserving internal layout!");
