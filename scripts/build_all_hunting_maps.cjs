"use strict";
// build_all_hunting_maps.cjs — 4대 사냥터 바이옴 맵 생성 및 타일셋 연동 스크립트
//
// 대상 맵:
//   F1 field_earth.map   : 흙 벌판 (Grass + Soil 기반)
//   F2 field_rocky.map   : 바위 고원 (Rock + Rock* 13종 기반)
//   F3 field_desert.map  : 모래 언덕 (Sand + Sand* 13종 기반)
//   F4 field_snow.map    : 만년설원 (Snow + Snow* 13종 기반)
//
// 포탈 체인:
//   hunt01 (field_earth)  : Portal(Home), PortalForward(hunt02)
//   hunt02 (field_rocky)  : Portal(Home), PortalBack(hunt01), PortalForward(hunt03)
//   hunt03 (field_desert) : Portal(Home), PortalBack(hunt02), PortalForward(hunt04)
//   hunt04 (field_snow)   : Portal(Home), PortalBack(hunt03) [종점]

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
process.chdir(ROOT);
const { MapBuilder } = require(path.join(ROOT, ".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));
const { ModelBuilder, vector2, vector3 } = require(path.join(ROOT, ".claude/skills/msw-general/scripts/model/msw_model_builder.cjs"));

const WRITE = process.argv.includes("--write");
const LAND = 27; // 섬 육지 범위 |x|,|y| <= 27

// ---------- tileset ----------
const TILE_DEFS = JSON.parse(fs.readFileSync("RootDesk/MyDesk/wall.tileset", "utf8")).ContentProto.Json.datas;
const IDX = {};
TILE_DEFS.forEach((d, i) => { IDX[d.Name] = i; });

const SUFFIX = {
  12: "T", 3: "D", 5: "L", 10: "R",
  13: "LT", 14: "RT", 7: "LD", 11: "RD",
  4: "LTCorner", 8: "RTCorner", 1: "LDCorner", 2: "RDCorner"
};

function fringeTileName(prefix, voidMask) {
  if (prefix === "Grass") {
    if (voidMask === 0) return "FullGrass";
    if (voidMask === 15) return null;
    if (voidMask === 6) return "SubGrassLTRD";
    if (voidMask === 9) return "SubGrassRTLD";
    return "Grass" + SUFFIX[voidMask];
  }
  // Rock / Sand / Snow
  if (voidMask === 15) return null;
  if (voidMask === 0) return prefix; // 64x64 베이스 (Rock, Sand, Snow)
  const suff = SUFFIX[voidMask];
  if (suff && IDX[prefix + suff] !== undefined) return prefix + suff;
  if (voidMask === 6 && IDX[prefix + "LDCorner"] !== undefined) return prefix + "LDCorner";
  if (voidMask === 9 && IDX[prefix + "RTCorner"] !== undefined) return prefix + "RTCorner";
  return prefix;
}

function waterNames(waterMask) {
  if (waterMask === 15) return { water: "Water", rim: null };
  if (waterMask === 6) return { water: "WaterLTRD", rim: "WetRimLTRD" };
  if (waterMask === 9) return { water: "WaterRTLD", rim: "WetRimRTLD" };
  return { water: "Water" + SUFFIX[waterMask], rim: "WetRim" + SUFFIX[waterMask] };
}

const NEIGHBOR_BITS = [
  [0, 1, 12], [0, -1, 3], [1, 0, 10], [-1, 0, 5],
  [1, 1, 8], [-1, 1, 4], [1, -1, 2], [-1, -1, 1],
];

// ---------- 레이아웃 DSL ----------
function makeLayout() {
  const water = new Set();
  const dirt = new Set();
  const plazas = [];
  const roads = [];
  const rect = (set, x0, x1, y0, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) set.add(x + "," + y); };
  const sub = (sx0, sx1, sy0, sy1) => { for (let sx = sx0; sx <= sx1; sx++) for (let sy = sy0; sy <= sy1; sy++) dirt.add(sx + "," + sy); };
  return {
    water, dirt, plazas, roads,
    pond(x0, x1, y0, y1) { rect(water, x0, x1, y0, y1); },
    cove(x0, x1, y0, y1) { rect(water, x0, x1, y0, y1); },
    plaza(name, x0, x1, y0, y1) { plazas.push({ name, x0, x1, y0, y1 }); sub(2 * x0 - 1, 2 * x1 + 2, 2 * y0 - 1, 2 * y1 + 2); },
    road(points) {
      roads.push(points);
      for (let i = 1; i < points.length; i++) {
        const [ax, ay] = points[i - 1], [bx, by] = points[i];
        if (ax !== bx && ay !== by) throw new Error("road: 수평/수직 구간만 가능 " + JSON.stringify([points[i - 1], points[i]]));
        const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx), y0 = Math.min(ay, by), y1 = Math.max(ay, by);
        sub(2 * x0 - 1, 2 * x1 + 4, 2 * y0 - 1, 2 * y1 + 4);
      }
    },
  };
}

function isWater(L, x, y) {
  if (Math.abs(x) > LAND || Math.abs(y) > LAND) return true;
  return L.water.has(x + "," + y);
}

function computeTiles(L, extent, prefix) {
  const l0 = [], l2 = [], l6 = [];
  const cellInfo = new Map();
  const subBits = [[0, 0, 1], [1, 0, 2], [0, 1, 4], [1, 1, 8]];
  for (let y = -extent; y <= extent; y++) {
    for (let x = -extent; x <= extent; x++) {
      let dirtBits = 0;
      for (const [ox, oy, bit] of subBits) if (L.dirt.has((2 * x + ox) + "," + (2 * y + oy))) dirtBits |= bit;
      const g = fringeTileName(prefix, dirtBits);
      if (isWater(L, x, y)) {
        let landBits = 0;
        for (const [dx, dy, bits] of NEIGHBOR_BITS) if (!isWater(L, x + dx, y + dy)) landBits |= bits;
        const n = waterNames(15 & ~landBits);
        l0.push({ x, y, name: n.water });
        if (n.rim) l6.push({ x, y, name: n.rim });
        if (n.water !== "Water" && g) l2.push({ x, y, name: g });
        cellInfo.set(x + "," + y, { water: true, full: n.water === "Water" });
      } else {
        if (g) l2.push({ x, y, name: g });
        cellInfo.set(x + "," + y, { water: false, grass: g, voidBits: dirtBits });
      }
    }
  }
  return { l0, l2, l6, cellInfo };
}

// ---------- 바이옴별 레이아웃 ----------

// F1 흙 벌판 (field_earth)
function layoutEarth() {
  const L = makeLayout();
  L.cove(-27, -26, -6, -1); L.cove(6, 12, 25, 27); L.cove(25, 27, -16, -11); L.cove(-11, -5, -27, -26);
  L.cove(-27, -24, 22, 27); L.cove(24, 27, -27, -24);
  L.pond(-13, -8, -18, -14); L.pond(7, 9, 2, 5); L.pond(16, 21, -11, -6); L.pond(-14, -12, 13, 16); L.pond(18, 23, 5, 9);
  L.plaza("Entry", -24, -17, -24, -19);
  L.plaza("WestClearing", -24, -18, 4, 10);
  L.plaza("CenterCrossing", -5, 3, -5, 1);
  L.plaza("SouthEastPocket", 8, 15, -22, -17);
  L.plaza("NorthMeadow", -8, -2, 15, 20);
  L.plaza("Exit", 16, 24, 18, 24);
  L.road([[-21, -18], [-21, -11], [-2, -11], [-2, -6]]);
  L.road([[4, -2], [12, -2], [12, 8], [-5, 8], [-5, 14]]);
  L.road([[-1, 17], [8, 17], [8, 21], [15, 21]]);
  L.road([[-6, -2], [-14, -2], [-14, 7], [-17, 7]]);
  L.road([[-2, -11], [5, -11], [5, -19], [7, -19]]);
  return {
    L,
    prefix: "Grass",
    portals: {
      Portal: { pos: [-23, -21] },
      PortalForward: { pos: [21, 22] },
    },
    arrive: [-19, -22],
    theme: "earth",
  };
}

// F2 바위 고원 (field_rocky)
function layoutRocky() {
  const L = makeLayout();
  L.cove(-27, -25, -11, -5); L.cove(-3, 4, -27, -25); L.cove(25, 27, -1, 5); L.cove(2, 9, 25, 27);
  L.cove(25, 27, -27, -25); L.cove(-27, -26, 26, 27);
  L.pond(-6, 5, -4, 5); L.pond(-3, 3, 6, 7); L.pond(6, 7, -2, 2); L.pond(-3, 1, -6, -5);
  L.pond(-25, -20, 0, 5); L.pond(15, 21, -5, 0); L.pond(-6, 1, -20, -15);
  L.plaza("Entry", -24, -17, -24, -18);
  L.plaza("Exit", 16, 24, 18, 24);
  L.plaza("SouthEastPocket", 16, 23, -21, -14);
  L.plaza("NorthWestPocket", -24, -17, 15, 22);
  L.road([[-21, -18], [-21, -11], [-11, -11]]);
  L.road([[-11, -11], [10, -11], [10, 10], [-11, 10], [-11, -11]]);
  L.road([[10, 10], [20, 10], [20, 16]]);
  L.road([[10, -11], [10, -18], [15, -18]]);
  L.road([[-11, 10], [-20, 10], [-20, 13]]);
  return {
    L,
    prefix: "Rock",
    portals: {
      Portal: { pos: [-23, -20] },
      PortalBack: { pos: [-18, -20] },
      PortalForward: { pos: [22, 23] },
    },
    arrive: [-21, -23],
    theme: "rocky",
  };
}

// F3 모래 언덕 (field_desert)
function layoutDesert() {
  const L = makeLayout();
  L.cove(-27, -24, -8, -2); L.cove(5, 14, -27, -25); L.cove(24, 27, 4, 12); L.cove(-15, -8, 25, 27);
  L.cove(23, 27, -27, -23); L.cove(-27, -23, 23, 27);
  // 오아시스 (마른 우물터 주변)
  L.pond(-4, 4, -4, 4); L.pond(14, 19, 6, 11); L.pond(-20, -15, -10, -5);
  L.plaza("Entry", -24, -17, -24, -18);
  L.plaza("Exit", 16, 24, 18, 24);
  L.plaza("OasisPlaza", -7, 7, -7, 7);
  L.plaza("EastDune", 15, 22, -18, -12);
  L.plaza("NorthDune", -22, -15, 14, 20);
  L.road([[-21, -18], [-21, -11], [-7, -11], [-7, -7]]);
  L.road([[7, 0], [15, 0], [15, 15], [18, 15], [18, 18]]);
  L.road([[7, -7], [15, -7], [15, -12]]);
  L.road([[-7, 7], [-15, 7], [-15, 14]]);
  return {
    L,
    prefix: "Sand",
    portals: {
      Portal: { pos: [-23, -20] },
      PortalBack: { pos: [-18, -20] },
      PortalForward: { pos: [22, 23] },
    },
    arrive: [-21, -23],
    theme: "desert",
  };
}

// F4 만년설원 (field_snow)
function layoutSnow() {
  const L = makeLayout();
  L.cove(-27, -25, -15, -9); L.cove(-8, 2, -27, -24); L.cove(24, 27, -8, 0); L.cove(0, 8, 24, 27);
  L.cove(-27, -24, 22, 27); L.cove(24, 27, 22, 27);
  // 얼어붙은 빙하 호수
  L.pond(-8, 2, -3, 6); L.pond(-5, 0, 7, 9); L.pond(12, 17, -16, -10); L.pond(-22, -16, 8, 13);
  L.plaza("Entry", -24, -17, -24, -18);
  L.plaza("ExitCamp", 16, 24, 18, 24);
  L.plaza("GlacierCenter", 2, 9, -2, 5);
  L.plaza("SouthSnowPocket", 10, 18, -22, -16);
  L.plaza("NorthPeak", -20, -13, 16, 22);
  L.road([[-21, -18], [-21, -10], [-9, -10], [-9, -4]]);
  L.road([[2, 1], [2, 12], [14, 12], [14, 18]]);
  L.road([[9, 1], [14, 1], [14, -16]]);
  L.road([[-9, 6], [-16, 6], [-16, 16]]);
  return {
    L,
    prefix: "Snow",
    portals: {
      Portal: { pos: [-23, -20] },
      PortalBack: { pos: [-18, -20] },
      // snow01→02→03 체인 전진 / snow03 에서는 스노우맨 대기실 포탈로 쓰인다 (ExitCamp 광장).
      PortalForward: { pos: [22, 23] },
    },
    arrive: [-21, -23],
    theme: "snow",
  };
}

// ---------- 소품 테마 ----------
const DECOS = {
  Deco_BushTwin:        { ruid: "3e79cbf6ae7643bc91d2a527a6b35ff3", w: 132, h: 96, px: 65, py: 25 },
  Deco_BushMushroom:    { ruid: "2d93a94442c747b7a53bd849ad757f61", w: 112, h: 76, px: 54, py: 17 },
  Deco_FlowerBushYellow:{ ruid: "675880ddceac406d8bc9b101cc32e6fb", w: 232, h: 88, px: 115, py: 44 },
  Deco_PinkFlowers:     { ruid: "10758e807d204a75bb0510f3791671ec", w: 72, h: 40, px: 34, py: 20 },
  Deco_GrassTuft:       { ruid: "e21be15260d1499b83ed22c8711ebf32", w: 104, h: 40, px: 50, py: 19 },
  Deco_MushroomCluster: { ruid: "e2b9717421a7486192c5821b70cdb1de", w: 176, h: 60, px: 87, py: 30 },
  Deco_Stump:           { ruid: "6e941d36a4714cf0bf6f9937184efae0", w: 76, h: 40, px: 37, py: 20 },
  Deco_LogPile:         { ruid: "c50c8fbdb6d04e42b16e7341092d9139", w: 124, h: 44, px: 62, py: 22 },
  Deco_Cattail:         { ruid: "55250c705312434287c73b58bf2a2fd0", w: 56, h: 64, px: 28, py: 32 },
  Deco_LilyPads:        { ruid: "66d88b9a7fa549629643b9eb7ec6810f", w: 256, h: 84, px: 128, py: 41 },
  Deco_FlowerRock:      { ruid: "ca74d61c9c134eb9b723ac53e9871c58", w: 116, h: 60, px: 57, py: 29 },
  Deco_MossRocks:       { ruid: "c94c422adc3b41d1ba45690bb232c381", w: 132, h: 64, px: 65, py: 31 },
  Deco_DryBush:         { ruid: "e3f3ef8bfa394344a7b8fa2820f688a4", w: 96, h: 68, px: 46, py: 33 },
  Deco_DryGrass:        { ruid: "606e16f4ad0f40c3887d06ce922d2b89", w: 84, h: 40, px: 42, py: 19 },
  Deco_LogFence:        { ruid: "d53a41842a8e430b89377c73832194de", w: 164, h: 72, px: 82, py: 36 },
};

const THEMES = {
  earth: {
    plazaCorner: ["Deco_BushTwin", "Deco_MushroomCluster", "Deco_Stump", "Deco_FlowerBushYellow", "Deco_LogPile", "Deco_BushMushroom"],
    roadside: ["Deco_PinkFlowers", "Deco_GrassTuft", "Deco_PinkFlowers", "Deco_FlowerRock", "Deco_GrassTuft", "Deco_BushMushroom"],
    pondEdge: ["Deco_Cattail", "Deco_GrassTuft"],
    meadow: ["Deco_PinkFlowers", "Deco_GrassTuft", "Deco_BushTwin", "Deco_PinkFlowers", "Deco_FlowerBushYellow", "Deco_GrassTuft"],
  },
  rocky: {
    plazaCorner: ["Deco_MossRocks", "Deco_DryBush", "Deco_Stump", "Deco_LogPile", "Deco_FlowerRock", "Deco_DryGrass"],
    roadside: ["Deco_DryGrass", "Deco_MossRocks", "Deco_DryBush", "Deco_DryGrass", "Deco_Stump"],
    pondEdge: ["Deco_Cattail", "Deco_DryGrass"],
    meadow: ["Deco_DryGrass", "Deco_MossRocks", "Deco_DryBush", "Deco_DryGrass", "Deco_FlowerRock"],
  },
  desert: {
    plazaCorner: ["Deco_DryBush", "Deco_FlowerRock", "Deco_Stump", "Deco_DryGrass"],
    roadside: ["Deco_DryGrass", "Deco_FlowerRock", "Deco_DryBush"],
    pondEdge: ["Deco_Cattail", "Deco_DryGrass"],
    meadow: ["Deco_DryGrass", "Deco_DryBush", "Deco_FlowerRock"],
  },
  snow: {
    plazaCorner: ["Deco_FlowerRock", "Deco_LogPile", "Deco_LogFence", "Deco_MossRocks"],
    roadside: ["Deco_FlowerRock", "Deco_DryGrass", "Deco_LogFence"],
    pondEdge: ["Deco_FlowerRock"],
    meadow: ["Deco_FlowerRock", "Deco_MossRocks", "Deco_LogPile"],
  },
};

function planDecos(design, tiles) {
  const out = [];
  const portalPts = Object.values(design.portals).map(p => p.pos);
  const theme = THEMES[design.theme];
  const cell = (x, y) => tiles.cellInfo.get(x + "," + y);
  const ok = (x, y, allowWater) => {
    const c = cell(Math.floor(x), Math.floor(y));
    if (!c) return false;
    if (c.water && !allowWater) return false;
    if (Math.abs(x) > LAND - 1 || Math.abs(y) > LAND - 1) return false;
    if (portalPts.some(([px, py]) => Math.hypot(px - x, py - y) < 4)) return false;
    if (out.some(d => Math.hypot(d.x - x, d.y - y) < 3)) return false;
    return true;
  };
  const add = (name, x, y, allowWater) => { if (ok(x, y, allowWater)) { out.push({ name, x, y }); return true; } return false; };
  let k = 0;
  const pick = arr => arr[(k++) % arr.length];

  for (const p of design.L.plazas) {
    const corners = [[p.x0 - 1, p.y1 + 1.5], [p.x1 + 2, p.y1 + 1.5], [p.x0 - 1, p.y0 - 0.5], [p.x1 + 2, p.y0 - 0.5]];
    for (const [x, y] of corners) add(pick(theme.plazaCorner), x, y, false);
  }

  const ponds = clusters(design.L.water);
  for (const pc of ponds) {
    if (pc.x0 <= -LAND || pc.x1 >= LAND || pc.y0 <= -LAND || pc.y1 >= LAND) continue;
    const cx = (pc.x0 + pc.x1 + 1) / 2, cy = (pc.y0 + pc.y1 + 1) / 2;
    if (pc.x1 - pc.x0 >= 4 && pc.y1 - pc.y0 >= 3 && design.theme === "earth") add("Deco_LilyPads", cx, cy, true);
    add(pick(theme.pondEdge), pc.x0 - 0.5, pc.y1 + 1.5, false);
    add(pick(theme.pondEdge), pc.x1 + 1.5, pc.y0 - 0.5, false);
  }

  for (const pts of design.L.roads) {
    let side = 1;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const len = Math.abs(bx - ax) + Math.abs(by - ay);
      for (let t = 3; t < len - 2; t += 7) {
        const f = t / len;
        const lx = ax + 1 + (bx - ax) * f, ly = ay + 1 + (by - ay) * f;
        const horizontal = ay === by;
        const x = horizontal ? lx : lx + 2.5 * side, y = horizontal ? ly + 2.5 * side : ly;
        add(pick(theme.roadside), x, y, false);
        side = -side;
      }
    }
  }

  for (let gx = -24; gx <= 24; gx += 8) {
    for (let gy = -24; gy <= 24; gy += 8) {
      const x = gx + (((gx * 7 + gy * 13) % 3) + 3) % 3 - 1 + 0.5, y = gy + (((gx * 11 + gy * 5) % 3) + 3) % 3 - 1 + 0.5;
      let clear = true;
      for (let dx = -2; dx <= 2 && clear; dx++) for (let dy = -2; dy <= 2; dy++) {
        const c = cell(Math.floor(x) + dx, Math.floor(y) + dy);
        if (!c || c.water || c.voidBits !== 0) { clear = false; break; }
      }
      if (clear) add(pick(theme.meadow), x, y, false);
    }
  }
  return out;
}

function clusters(set) {
  const seen = new Set(), res = [];
  for (const key of set) {
    if (seen.has(key)) continue;
    const q = [key]; seen.add(key);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    while (q.length) {
      const [x, y] = q.pop().split(",").map(Number);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = (x + dx) + "," + (y + dy);
        if (set.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
      }
    }
    res.push({ x0, x1, y0, y1 });
  }
  return res;
}

// ---------- 쓰기 ----------
const DECO_DIR = "RootDesk/MyDesk/MapObjects/Models";

function writeMap(mapName, design, tiles, decos) {
  const file = "map/" + mapName + ".map";
  let m;
  if (fs.existsSync(file)) {
    m = MapBuilder.read(file);
  } else {
    console.log(`[create] from template_field.map -> ${file}`);
    m = MapBuilder.fromTemplate("map/template_field.map", mapName);
  }

  const toTileMap = arr => arr.map(t => ({ type: 0, position: { x: t.x, y: t.y }, tileIndex: IDX[t.name] }));
  m.patchComponent("RectTileMap0", "MOD.Core.RectTileMapComponent", { tileMap: toTileMap(tiles.l0) });
  m.patchComponent("RectTileMap2", "MOD.Core.RectTileMapComponent", { tileMap: toTileMap(tiles.l2) });
  m.patchComponent("RectTileMap6", "MOD.Core.RectTileMapComponent", { tileMap: toTileMap(tiles.l6) });

  // 구 장식 철거
  for (const e of m.listEntities()) {
    const n = e.path.split("/").pop();
    if (/^F1_/.test(n) || /^Deco\d*_/.test(n) || /^D\d+_Deco_/.test(n)) m.remove(e.path);
  }

  // 포탈 배치
  if (m.find("PortalToHunt02") && !m.find("PortalForward")) m.rename("PortalToHunt02", "PortalForward");
  const portalTemplate = m.find("Portal") ? m.find("Portal").jsonString["@components"] : null;

  for (const [name, p] of Object.entries(design.portals)) {
    if (!m.find(name)) {
      m.placeModel(name, "RootDesk/MyDesk/Furniture/Models/Furniture_Portal.model", { pos: [p.pos[0], p.pos[1], 0] });
      if (portalTemplate) {
        for (const c of portalTemplate) if (c["@type"] !== "MOD.Core.TransformComponent") m.upsertComponent(name, c["@type"], JSON.parse(JSON.stringify(c)));
      }
      m.patchComponent(name, "MOD.Core.TransformComponent", { Scale: { x: 2, y: 2, z: 1 } });
    }
    m.patch(name, { pos: [p.pos[0], p.pos[1], 0] });
    if (name !== "Portal") {
      m.patchComponent(name, "script.PortalGate", { TargetMapName: "", TargetPosition: { x: 0, y: 0 }, DestinationGroup: "hunt", PortalColor: "white" });
    }
  }

  // 사용하지 않는 포탈 제거
  if (!design.portals.PortalBack && m.find("PortalBack")) m.remove("PortalBack");
  if (!design.portals.PortalForward && m.find("PortalForward")) m.remove("PortalForward");

  decos.forEach((d, i) => {
    m.placeModel(`D${String(i + 1).padStart(2, "0")}_${d.name}`, path.join(DECO_DIR, d.name + ".model").replace(/\\/g, "/"), { pos: [+d.x.toFixed(2), +d.y.toFixed(2), 0] });
  });

  // 직렬화 무결성 점검
  for (const e of m.listEntities()) {
    const rec = m.find(e.path);
    if (typeof rec.jsonString !== "object") throw new Error("jsonString 문자열화 " + e.path);
  }
  m.write(file);
  console.log(`[write] ${file}: entities=${m.listEntities().length}, decos=${decos.length}`);
}

function writeDecoModels(used) {
  for (const name of used) {
    const file = path.join(DECO_DIR, name + ".model");
    if (fs.existsSync(file)) continue;
    const d = DECOS[name];
    if (!d) continue;
    const id = name.replace(/^Deco_/, "deco_").replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
    const b = ModelBuilder.read(path.join(DECO_DIR, "Prop_Signpost.model"));
    b.renameModel(name, id);
    const bottom = -d.py / 100;
    b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", d.ruid, "string")
      .value("MOD.Core.TriggerComponent", "BoxSize", vector2(+(d.w * 0.5 / 100).toFixed(3), 0.3), "vector2")
      .value("MOD.Core.TriggerComponent", "ColliderOffset", vector2(+((d.w / 2 - d.px) / 100).toFixed(3), +(bottom + 0.15).toFixed(3)), "vector2")
      .value("MOD.Core.TransformComponent", "Scale", vector3(2, 2, 2), "vector3")
      .write(file);
    console.log(`[deco] created ${file}`);
  }
}

// ---------- Main ----------
const plans = [
  { mapName: "field_earth", label: "초보 벌판 1구역 (field_earth)", design: layoutEarth() },
  { mapName: "template_field", label: "초보 벌판 2/3구역 템플릿 (template_field)", design: layoutRocky(), overridePrefix: "Grass", overrideTheme: "earth" },
  { mapName: "template_rocky", label: "바위 고원 템플릿 (template_rocky)", design: layoutRocky() },
  { mapName: "template_desert", label: "모래 사막 템플릿 (template_desert)", design: layoutDesert() },
  { mapName: "template_snow", label: "만년 설원 템플릿 (template_snow)", design: layoutSnow() },
];

const usedDecos = new Set();
for (const p of plans) {
  const prefix = p.overridePrefix || p.design.prefix;
  const theme = p.overrideTheme || p.design.theme;
  const design = { ...p.design, prefix, theme };
  p.design = design;
  p.tiles = computeTiles(design.L, 55, prefix);
  p.decos = planDecos(design, p.tiles);
  p.decos.forEach(d => usedDecos.add(d.name));
  console.log(`[plan] ${p.label}: L0=${p.tiles.l0.length} L2=${p.tiles.l2.length} L6=${p.tiles.l6.length}, decos=${p.decos.length}`);
}

if (!WRITE) {
  console.log("\nPreview mode only. Run with --write to generate maps.");
  process.exit(0);
}

writeDecoModels(usedDecos);
for (const p of plans) {
  writeMap(p.mapName, p.design, p.tiles, p.decos);
}

console.log("\nAll hunting ground template maps successfully built!");


console.log("\nAll 4 hunting maps successfully built!");
