/**
 * apply_water_overlay_to_map.cjs — 4단 지형 오버레이 구조를 맵 파일에 적용
 *
 * 구조:
 *   L1 RectTileMap (MapLayer1): Soil (전면 흙 지반 보존)
 *   L2 RectTileMap2 (MapLayer2): FullGrass / Grass* (순수 지상 잔디/길)
 *   L0 RectTileMap0 (MapLayer3): Water (내부) + Water* 12종 (수면 프린지 오버레이)
 *   L6 RectTileMap6 (MapLayer3): WetRim* 12종 (수변 윤슬 오버레이)
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const mapPath = path.join(ROOT, "map/map01.map");

// Load wall.tileset index
const ts = JSON.parse(fs.readFileSync(path.join(ROOT, "RootDesk/MyDesk/wall.tileset"), "utf8"));
const datas = ts.ContentProto.Json.datas;
const IDX = {};
datas.forEach((d, i) => { IDX[d.Name] = i; });

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
const L6 = findLayer("RectTileMap6");

if (!L0 || !L1 || !L2 || !L6) {
  console.error("Missing required tilemap layers in map01.map");
  process.exit(1);
}

// 1. Identify all water cell positions
// In map01, water is located in the pond area.
// Let's collect all water cells currently in L0 or L1 or L6.
const waterCells = new Set();
(L0.tc.tileMap || []).forEach(t => {
  waterCells.add(`${t.position.x},${t.position.y}`);
});
(L6.tc.tileMap || []).forEach(t => {
  waterCells.add(`${t.position.x},${t.position.y}`);
});

console.log(`Found ${waterCells.size} water cells in map01.map`);

// 2. Subcell mask offsets (ResourceSpawner mirror)
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
  if (mask === 3) return "WaterD";
  if (mask === 5) return "WaterL";
  if (mask === 10) return "WaterR";
  if (mask === 13) return "WaterLT";
  if (mask === 14) return "WaterRT";
  if (mask === 7) return "WaterLD";
  if (mask === 11) return "WaterRD";
  if (mask === 4) return "WaterLTCorner";
  if (mask === 8) return "WaterRTCorner";
  if (mask === 1) return "WaterLDCorner";
  if (mask === 2) return "WaterRDCorner";
  if (mask === 6) return "WaterLTRD";
  if (mask === 9) return "WaterRTLD";
  return "Water";
}

function maskToWetRimTileName(mask) {
  if (mask == null || mask === 0 || mask === 15) return null;
  if (mask === 12) return "WetRimT";
  if (mask === 3) return "WetRimD";
  if (mask === 5) return "WetRimL";
  if (mask === 10) return "WetRimR";
  if (mask === 13) return "WetRimLT";
  if (mask === 14) return "WetRimRT";
  if (mask === 7) return "WetRimLD";
  if (mask === 11) return "WetRimRD";
  if (mask === 4) return "WetRimLTCorner";
  if (mask === 8) return "WetRimRTCorner";
  if (mask === 1) return "WetRimLDCorner";
  if (mask === 2) return "WetRimRDCorner";
  return null;
}

// 3. Compute L0 (Water + Water*) and L6 (WetRim*)
const l0Tiles = [];
const l6Tiles = [];

for (const key of waterCells) {
  const [x, y] = key.split(",").map(Number);
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

l0Tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
l6Tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);

// 4. Layer Configuration & Z-Fighting Prevention:
// Assign dedicated SortingLayers to each layer so that the engine never has depth-fighting:
//   L1 (RectTileMap, Soil base):        MapLayer0 (Z: 1000)
//   L2 (RectTileMap2, Grass/Path):      MapLayer1 (Z: 999)
//   L0 (RectTileMap0, Water Overlay):    MapLayer2 (Z: 998)
//   L6 (RectTileMap6, Wet Rim/Glint):   MapLayer3 (Z: 997)

L1.tc.SortingLayer = "MapLayer0";
if (L1.tr) L1.tr.Position = { x: 0, y: 0, z: 1000 };

L2.tc.SortingLayer = "MapLayer1";
if (L2.tr) L2.tr.Position = { x: 0, y: 0, z: 999 };

// Set L0 layer props
L0.tc.SortingLayer = "MapLayer2";
L0.tr.Position = { x: 0, y: 0, z: 998 };
L0.tc.tileMap = l0Tiles;
L0.js.revision = (L0.js.revision || 1) + 1;
L0.e.jsonString = L0.js;

// Set L6 layer props
L6.tc.SortingLayer = "MapLayer3";
L6.tr.Position = { x: 0, y: 0, z: 997 };
L6.tc.tileMap = l6Tiles;
L6.js.revision = (L6.js.revision || 1) + 1;
L6.e.jsonString = L6.js;

// Ensure L1 has Soil for all water cells
const l1Map = new Map();
(L1.tc.tileMap || []).forEach(t => {
  l1Map.set(`${t.position.x},${t.position.y}`, t.tileIndex);
});
const soilIdx = IDX["Soil"];
for (const key of waterCells) {
  l1Map.set(key, soilIdx);
}
const l1Tiles = [];
for (const [key, idx] of l1Map) {
  const [x, y] = key.split(",").map(Number);
  l1Tiles.push({ type: 0, position: { x, y }, tileIndex: idx });
}
l1Tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
L1.tc.tileMap = l1Tiles;
L1.js.revision = (L1.js.revision || 1) + 1;
L1.e.jsonString = L1.js;

// Ensure L4 and L5 have correct SortingLayers (MapLayer4, MapLayer5)
const L4 = findLayer("RectTileMap4");
const L5 = findLayer("RectTileMap5");
if (L4) { L4.tc.SortingLayer = "MapLayer4"; if (L4.tr) L4.tr.Position = { x: 0, y: 0, z: 996 }; }
if (L5) { L5.tc.SortingLayer = "MapLayer5"; if (L5.tr) L5.tr.Position = { x: 0, y: 0, z: 995 }; }

// 5. Ensure Entity Draw Order: L0 (Water) must render BEFORE L6 (WetRim)
const l0Index = ents.findIndex(e => e.jsonString && e.jsonString.name === "RectTileMap0");
const l6LayerIndex = ents.findIndex(e => e.jsonString && (e.jsonString.name === "MapleMapLayer6" || e.jsonString.name === "RectTileMap6"));

if (l0Index !== -1 && l6LayerIndex !== -1 && l0Index > l6LayerIndex) {
  // Move RectTileMap0 to just before MapleMapLayer6 / RectTileMap6
  const [l0Ent] = ents.splice(l0Index, 1);
  const targetPos = ents.findIndex(e => e.jsonString && (e.jsonString.name === "MapleMapLayer6" || e.jsonString.name === "RectTileMap6"));
  ents.splice(targetPos, 0, l0Ent);
  console.log(`Reordered RectTileMap0 (moved from index ${l0Index} to ${targetPos}) before RectTileMap6.`);
}

// Save map01.map
fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log(`Successfully updated map01.map:`);
console.log(`- L0 RectTileMap0 (MapLayer3): ${l0Tiles.length} tiles (Water & Water* fringes)`);
console.log(`- L6 RectTileMap6 (MapLayer3): ${l6Tiles.length} tiles (WetRim* fringes)`);
console.log(`- L1 RectTileMap (MapLayer1): ${l1Tiles.length} tiles (Soil base)`);
