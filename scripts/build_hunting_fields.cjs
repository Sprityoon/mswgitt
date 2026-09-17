// build_hunting_fields.cjs — 사냥터 2종(field_earth = hunt01 / template_field = hunt02·hunt03) 지형·포탈·소품 재설계 (2026-09-17)
//
// 실행:
//   node scripts/build_hunting_fields.cjs            # 미리보기(ASCII) + 검증만, 파일 쓰기 없음
//   node scripts/build_hunting_fields.cjs --write    # Deco_* 모델 생성 + 두 맵 재작성
//
// ⚠️ 대상 맵의 L0(RectTileMap0) / L2(RectTileMap2) / L6(RectTileMap6) 타일을 이 스크립트가 전부 재계산해 덮어쓴다.
//    L1(Soil 전면)·L3·L4·L5 는 건드리지 않는다. Maker에서 두 맵 지형을 손편집했다면 실행 전에 반드시 확인할 것.
//
// ── 타일 문법 (field_earth 실측으로 확인한 규칙 — docs/tile-scheme.md 와 동일) ─────────────────
//   셀당 2×2 서브셀 마스크 비트: TL=4 TR=8 BL=1 BR=2.
//   · 육지 셀 L2  : "잔디가 없는" 서브셀 마스크(흙길/광장 + 물 쪽 절반) → 0 FullGrass / 15 홀(L1 Soil 노출)
//                  12 T · 3 D · 5 L · 10 R · 13 LT · 14 RT · 7 LD · 11 RD · 4 LTCorner · 8 RTCorner · 1 LDCorner · 2 RDCorner
//                  · 6 SubGrassLTRD · 9 SubGrassRTLD      (접미사 = 잔디가 빠진 쪽)
//   · 물 셀 L0/L6 : "물이 있는" 서브셀 마스크(15 − 육지 이웃 쪽 비트). 15 → Water(충돌) / 그 외 → Water{접미사} + WetRim{접미사}
//   길(walk)은 셀 경계 좌표 폴리라인, 광장(plaza)은 셀 사각형 + ½셀 마진 — build_maps.cjs 문법과 같다.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
process.chdir(ROOT);
const { MapBuilder } = require(path.join(ROOT, ".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));
const { ModelBuilder, vector2, vector3 } = require(path.join(ROOT, ".claude/skills/msw-general/scripts/model/msw_model_builder.cjs"));

const WRITE = process.argv.includes("--write");
const LAND = 27; // 섬 육지 범위 |x|,|y| <= 27 (ResourceSpawner.MapRadius 30 / WallThickness 3 과 일치)

// ---------- tileset ----------
const TILE_DEFS = JSON.parse(fs.readFileSync("RootDesk/MyDesk/wall.tileset", "utf8")).ContentProto.Json.datas;
const IDX = {};
TILE_DEFS.forEach((d, i) => { IDX[d.Name] = i; });
const SUFFIX = { 12: "T", 3: "D", 5: "L", 10: "R", 13: "LT", 14: "RT", 7: "LD", 11: "RD", 4: "LTCorner", 8: "RTCorner", 1: "LDCorner", 2: "RDCorner" };
function grassName(voidMask) {
  if (voidMask === 0) return "FullGrass";
  if (voidMask === 15) return null;
  if (voidMask === 6) return "SubGrassLTRD";
  if (voidMask === 9) return "SubGrassRTLD";
  return "Grass" + SUFFIX[voidMask];
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
  const water = new Set();      // 물 셀 "x,y"
  const dirt = new Set();       // 흙 서브셀 "sx,sy"
  const plazas = [];
  const roads = [];
  const rect = (set, x0, x1, y0, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) set.add(x + "," + y); };
  const sub = (sx0, sx1, sy0, sy1) => { for (let sx = sx0; sx <= sx1; sx++) for (let sy = sy0; sy <= sy1; sy++) dirt.add(sx + "," + sy); };
  return {
    water, dirt, plazas, roads,
    pond(x0, x1, y0, y1) { rect(water, x0, x1, y0, y1); },
    cove(x0, x1, y0, y1) { rect(water, x0, x1, y0, y1); },
    plaza(name, x0, x1, y0, y1) { plazas.push({ name, x0, x1, y0, y1 }); sub(2 * x0 - 1, 2 * x1 + 2, 2 * y0 - 1, 2 * y1 + 2); },
    // 폭 2셀 도로: 셀 경계 좌표 폴리라인. 수평/수직 구간만.
    // 흙 = 경계 양옆 2셀 전체 + 바깥 ½셀 마진(광장과 같은 문법) → 이웃 잔디 셀에 Grass{dir} 프린지가 붙는다.
    // (2026-09-17 2차: 마진 없이 셀 전체만 칠해 도로 경계가 프린지 없이 직선으로 잘리던 결함 수정)
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

function computeTiles(L, extent) {
  // 레이어 독립 (런타임 ResourceSpawner:RefreshWaterAreaRect 와 동일한 4단 오버레이 체계):
  //   L2 잔디 = 흙길·광장 마스크만으로 결정 — 물과 무관. 물가 육지도, 물 프린지 셀 밑도 잔디가 그대로 깔린다.
  //   L0 물 / L6 물가 = 물 셀의 "물이 있는" 서브셀 마스크. 투명한 부분으로 아래 잔디가 비친다(잔디밭 연못).
  const l0 = [], l2 = [], l6 = [];
  const cellInfo = new Map();
  const subBits = [[0, 0, 1], [1, 0, 2], [0, 1, 4], [1, 1, 8]];
  for (let y = -extent; y <= extent; y++) {
    for (let x = -extent; x <= extent; x++) {
      let dirtBits = 0;
      for (const [ox, oy, bit] of subBits) if (L.dirt.has((2 * x + ox) + "," + (2 * y + oy))) dirtBits |= bit;
      const g = grassName(dirtBits);
      if (isWater(L, x, y)) {
        let landBits = 0;
        for (const [dx, dy, bits] of NEIGHBOR_BITS) if (!isWater(L, x + dx, y + dy)) landBits |= bits;
        const n = waterNames(15 & ~landBits);
        l0.push({ x, y, name: n.water });
        if (n.rim) l6.push({ x, y, name: n.rim });
        if (n.water !== "Water" && g) l2.push({ x, y, name: g }); // 프린지 투명부 밑 잔디 (완전 수면 밑은 불필요)
        cellInfo.set(x + "," + y, { water: true, full: n.water === "Water" });
      } else {
        if (g) l2.push({ x, y, name: g });
        cellInfo.set(x + "," + y, { water: false, grass: g, voidBits: dirtBits });
      }
    }
  }
  return { l0, l2, l6, cellInfo };
}

// ---------- 맵별 설계 ----------
// hunt01 흙 벌판: 남서 입구 → S자 대로 → 중앙 교차 광장(이슬 웅덩이) → 북쪽 초원 → 북동 출구.
function layoutEarth() {
  const L = makeLayout();
  // 해안 만(灣) — 직선 해안선을 끊는다.
  L.cove(-27, -26, -6, -1); L.cove(6, 12, 25, 27); L.cove(25, 27, -16, -11); L.cove(-11, -5, -27, -26);
  L.cove(-27, -24, 22, 27); L.cove(24, 27, -27, -24);
  // 검은 이슬 웅덩이
  L.pond(-13, -8, -18, -14); L.pond(7, 9, 2, 5); L.pond(16, 21, -11, -6); L.pond(-14, -12, 13, 16); L.pond(18, 23, 5, 9);
  // 광장·공터
  L.plaza("Entry", -24, -17, -24, -19);
  L.plaza("WestClearing", -24, -18, 4, 10);
  L.plaza("CenterCrossing", -5, 3, -5, 1);
  L.plaza("SouthEastPocket", 8, 15, -22, -17);
  L.plaza("NorthMeadow", -8, -2, 15, 20);
  L.plaza("Exit", 16, 24, 18, 24);
  // 도로 (셀 경계 좌표)
  L.road([[-21, -18], [-21, -11], [-2, -11], [-2, -6]]);                 // 입구 → 중앙
  L.road([[4, -2], [12, -2], [12, 8], [-5, 8], [-5, 14]]);                 // 중앙 → 동쪽 굽이 → 북쪽 초원
  L.road([[-1, 17], [8, 17], [8, 21], [15, 21]]);                          // 초원 → 출구
  L.road([[-6, -2], [-14, -2], [-14, 7], [-17, 7]]);                       // 중앙 → 서쪽 공터(샛길)
  L.road([[-2, -11], [5, -11], [5, -19], [7, -19]]);                       // 남동 포켓(보물상자 샛길)
  return {
    L,
    portals: {
      Portal: { pos: [-23, -21] },            // 홈 귀환 (입구)
      PortalForward: { pos: [21, 22] },       // → hunt02 (북동 끝)
    },
    arrive: [-19, -22],                         // 워프 목록/테스트 도착점 (입구 광장)
    chest: [11, -20],
    theme: "earth",
  };
}

// hunt02·hunt03 공용(바위/모래 바이옴 틴트): 남서 입구 → 중앙 호수를 두르는 순환로 → 북동 출구. 북서·남동 포켓.
// (2026-09-17 2차: 모든 사냥터가 "왼쪽 아래 입구 → 오른쪽 위 출구"로 흐르도록 1차안을 상하 반전)
function layoutRing() {
  const L = makeLayout();
  L.cove(-27, -25, -11, -5); L.cove(-3, 4, -27, -25); L.cove(25, 27, -1, 5); L.cove(2, 9, 25, 27);
  L.cove(25, 27, -27, -25); L.cove(-27, -26, 26, 27);
  // 중앙 호수
  L.pond(-6, 5, -4, 5); L.pond(-3, 3, 6, 7); L.pond(6, 7, -2, 2); L.pond(-3, 1, -6, -5);
  // 작은 연못
  L.pond(-25, -20, 0, 5); L.pond(15, 21, -5, 0); L.pond(-6, 1, -20, -15);
  L.plaza("Entry", -24, -17, -24, -18);
  L.plaza("Exit", 16, 24, 18, 24);
  L.plaza("SouthEastPocket", 16, 23, -21, -14);
  L.plaza("NorthWestPocket", -24, -17, 15, 22);
  L.road([[-21, -18], [-21, -11], [-11, -11]]);                            // 입구 → 순환로
  L.road([[-11, -11], [10, -11], [10, 10], [-11, 10], [-11, -11]]);        // 호수 순환로
  L.road([[10, 10], [20, 10], [20, 16]]);                                  // 순환로 → 출구
  L.road([[10, -11], [10, -18], [15, -18]]);                               // 남동 포켓
  L.road([[-11, 10], [-20, 10], [-20, 13]]);                               // 북서 포켓
  return {
    L,
    portals: {
      Portal: { pos: [-23, -20] },            // 홈 귀환
      PortalBack: { pos: [-18, -20] },        // ← 이전 구역
      PortalForward: { pos: [22, 23] },       // → 다음 구역 / hunt03 에선 보스 대기실
    },
    arrive: [-21, -23],
    chests: { hunt02: [19, -18], hunt03: [-21, 18] },
    theme: "ring",
  };
}

// ---------- 소품 ----------
// sprite RUID 는 msw_resource_api 로 찾아 썸네일로 육안 확인한 공식 object 스프라이트 (2026-09-17).
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
const DECO_SCALE = 2; // design-policy: 프롭 2.0배
const THEMES = {
  earth: {
    plazaCorner: ["Deco_BushTwin", "Deco_MushroomCluster", "Deco_Stump", "Deco_FlowerBushYellow", "Deco_LogPile", "Deco_BushMushroom"],
    roadside: ["Deco_PinkFlowers", "Deco_GrassTuft", "Deco_PinkFlowers", "Deco_FlowerRock", "Deco_GrassTuft", "Deco_BushMushroom"],
    pondEdge: ["Deco_Cattail", "Deco_GrassTuft"],
    meadow: ["Deco_PinkFlowers", "Deco_GrassTuft", "Deco_BushTwin", "Deco_PinkFlowers", "Deco_FlowerBushYellow", "Deco_GrassTuft"],
  },
  ring: {
    plazaCorner: ["Deco_MossRocks", "Deco_DryBush", "Deco_Stump", "Deco_LogPile", "Deco_FlowerRock", "Deco_DryGrass"],
    roadside: ["Deco_DryGrass", "Deco_MossRocks", "Deco_DryBush", "Deco_DryGrass", "Deco_Stump"],
    pondEdge: ["Deco_Cattail", "Deco_DryGrass"],
    meadow: ["Deco_DryGrass", "Deco_MossRocks", "Deco_DryBush", "Deco_DryGrass", "Deco_FlowerRock"],
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
  // 광장 네 모서리 바깥 대각(잔디 쪽) — 광장 윤곽을 살린다.
  for (const p of design.L.plazas) {
    const corners = [[p.x0 - 1, p.y1 + 1.5], [p.x1 + 2, p.y1 + 1.5], [p.x0 - 1, p.y0 - 0.5], [p.x1 + 2, p.y0 - 0.5]];
    for (const [x, y] of corners) add(pick(theme.plazaCorner), x, y, false);
  }
  // 연못: 넓으면 가운데 연잎, 북쪽·남쪽 물가에 부들/풀
  const ponds = clusters(design.L.water);
  for (const pc of ponds) {
    if (pc.x0 <= -LAND || pc.x1 >= LAND || pc.y0 <= -LAND || pc.y1 >= LAND) continue; // 해안 만 제외
    const cx = (pc.x0 + pc.x1 + 1) / 2, cy = (pc.y0 + pc.y1 + 1) / 2;
    if (pc.x1 - pc.x0 >= 4 && pc.y1 - pc.y0 >= 3) add("Deco_LilyPads", cx, cy, true);
    add(pick(theme.pondEdge), pc.x0 - 0.5, pc.y1 + 1.5, false);
    add(pick(theme.pondEdge), pc.x1 + 1.5, pc.y0 - 0.5, false);
  }
  // 도로변: 구간마다 약 7칸 간격, 좌우 번갈아 도로 중심선에서 2.5 떨어진 잔디에
  for (const pts of design.L.roads) {
    let side = 1;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const len = Math.abs(bx - ax) + Math.abs(by - ay);
      for (let t = 3; t < len - 2; t += 7) {
        const f = t / len;
        const lx = ax + 1 + (bx - ax) * f, ly = ay + 1 + (by - ay) * f; // 경계선 중심 → 월드 좌표
        const horizontal = ay === by;
        const x = horizontal ? lx : lx + 2.5 * side, y = horizontal ? ly + 2.5 * side : ly;
        add(pick(theme.roadside), x, y, false);
        side = -side;
      }
    }
  }
  // 넓은 초원: 8칸 격자(결정적 지터)에서 반경 2 안이 전부 온전한 잔디인 자리에만 — 도로·물가를 침범하지 않는다.
  for (let gx = -24; gx <= 24; gx += 8) {
    for (let gy = -24; gy <= 24; gy += 8) {
      const x = gx + (((gx * 7 + gy * 13) % 3) + 3) % 3 - 1 + 0.5, y = gy + (((gx * 11 + gy * 5) % 3) + 3) % 3 - 1 + 0.5;
      let clear = true;
      for (let dx = -2; dx <= 2 && clear; dx++) for (let dy = -2; dy <= 2; dy++) { const c = cell(Math.floor(x) + dx, Math.floor(y) + dy); if (!c || c.water || c.voidBits !== 0) { clear = false; break; } }
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

// ---------- 검증 ----------
function validate(label, design, tiles) {
  const errs = [];
  for (const t of [...tiles.l0, ...tiles.l2, ...tiles.l6]) if (IDX[t.name] === undefined) errs.push("tileset에 없는 타일 " + t.name + " @" + t.x + "," + t.y);
  // 흙 서브셀은 육지 셀 안에만 (물 위 흙 금지)
  for (const key of design.L.dirt) {
    const [sx, sy] = key.split(",").map(Number);
    const cx = Math.floor(sx / 2), cy = Math.floor(sy / 2);
    if (isWater(design.L, cx, cy)) errs.push("물 셀 위 흙 서브셀 " + key);
    else if (Math.abs(cx) > LAND - 2 || Math.abs(cy) > LAND - 2) errs.push("해안 2칸 안쪽 흙 " + key);
  }
  // 흙과 물 사이 잔디 최소 1칸 — 물(L0/L6)은 잔디·흙(L2)과 독립 레이어라 타일은 깨지지 않지만, 흙길이 물에 바로 닿지 않게 한다.
  for (const key of design.L.water) {
    const [x, y] = key.split(",").map(Number);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const nx = x + dx, ny = y + dy;
      if (isWater(design.L, nx, ny)) continue;
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (design.L.dirt.has((2 * nx + ox) + "," + (2 * ny + oy))) { errs.push("물 " + key + " 에 흙 셀 " + nx + "," + ny + " 이 맞닿음"); break; }
    }
  }
  // 연못은 2×2 이상 (1칸 물은 오버행 불성립 — tile-scheme §4-bis)
  for (const c of clusters(design.L.water)) if (c.x1 - c.x0 < 1 || c.y1 - c.y0 < 1) errs.push("2×2 미만 수역 " + JSON.stringify(c));
  // 포탈: 육지 + 도착점(포탈 y−2.5)도 육지이고 충돌 물이 아님
  const walk = (x, y) => { const c = tiles.cellInfo.get(Math.floor(x) + "," + Math.floor(y)); return c && !(c.water && c.full); };
  for (const [name, p] of Object.entries(design.portals)) {
    const [x, y] = p.pos;
    if (!walk(x, y) || !walk(x, y - 2.5)) errs.push("포탈/도착점이 통행 불가 " + name);
  }
  if (!walk(...design.arrive)) errs.push("워프 도착점 통행 불가");
  // 연결성: 입구 Portal → PortalForward 가 충돌 물(Water)을 피해 이어지는가 + 도로를 따르는 거리
  const start = design.portals.Portal.pos.map(Math.floor), goal = design.portals.PortalForward.pos.map(Math.floor);
  const dist = bfs(tiles, start, goal, () => true);
  if (dist < 0) errs.push("입구→출구 연결 끊김");
  const straight = Math.hypot(goal[0] - start[0], goal[1] - start[1]);
  console.log(`[${label}] tiles L0=${tiles.l0.length} L2=${tiles.l2.length} L6=${tiles.l6.length} | 포탈 직선거리 ${straight.toFixed(1)} · 최단보행 ${dist}칸 · 오류 ${errs.length}`);
  return errs;
}
function bfs(tiles, [sx, sy], [gx, gy]) {
  const seen = new Map([[sx + "," + sy, 0]]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    const d = seen.get(x + "," + y);
    if (x === gx && y === gy) return d;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = nx + "," + ny;
      const c = tiles.cellInfo.get(key);
      if (!c || (c.water && c.full) || seen.has(key)) continue;
      seen.set(key, d + 1); q.push([nx, ny]);
    }
  }
  return -1;
}

function preview(label, design, tiles, decos) {
  const rows = [];
  const decoCells = new Set(decos.map(d => Math.floor(d.x) + "," + Math.floor(d.y)));
  const portalCells = new Map(Object.entries(design.portals).map(([n, p]) => [p.pos.join(","), n === "Portal" ? "H" : n === "PortalBack" ? "B" : "F"]));
  for (let y = LAND + 2; y >= -LAND - 2; y--) {
    let r = String(y).padStart(4) + " ";
    for (let x = -LAND - 2; x <= LAND + 2; x++) {
      const key = x + "," + y, c = tiles.cellInfo.get(key);
      let ch = "?";
      if (portalCells.has(key)) ch = portalCells.get(key);
      else if (decoCells.has(key)) ch = "*";
      else if (c.water) ch = c.full ? "~" : "w";
      else ch = c.grass === null ? ":" : c.grass === "FullGrass" ? "." : ",";
      r += ch;
    }
    rows.push(r);
  }
  console.log(`\n== ${label} (H 홈포탈 · B 이전구역 · F 다음구역 · * 소품 · : 흙 · , 잔디프린지 · . 잔디 · w 물가 · ~ 물)\n` + rows.join("\n"));
}

// ---------- 쓰기 ----------
const DECO_DIR = "RootDesk/MyDesk/MapObjects/Models";
function writeDecoModels(used) {
  for (const name of used) {
    const d = DECOS[name];
    const id = name.replace(/^Deco_/, "deco_").replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
    const b = ModelBuilder.read(path.join(DECO_DIR, "Prop_Signpost.model")); // 검증된 프롭 구성(Transform·Sprite·Trigger·YSortSprite) 복제
    b.renameModel(name, id);
    const bottom = -d.py / 100;
    b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", d.ruid, "string")
      .value("MOD.Core.TriggerComponent", "BoxSize", vector2(+(d.w * 0.5 / 100).toFixed(3), 0.3), "vector2")
      .value("MOD.Core.TriggerComponent", "ColliderOffset", vector2(+((d.w / 2 - d.px) / 100).toFixed(3), +(bottom + 0.15).toFixed(3)), "vector2")
      .value("MOD.Core.TransformComponent", "Scale", vector3(DECO_SCALE, DECO_SCALE, DECO_SCALE), "vector3")
      .write(path.join(DECO_DIR, name + ".model"));
  }
}

function writeMap(mapName, design, tiles, decos, chestInfo) {
  const file = "map/" + mapName + ".map";
  const m = MapBuilder.read(file);
  if (m.getTileMapMode() !== 1) throw new Error(file + " TileMapMode != 1");
  const toTileMap = arr => arr.map(t => ({ type: 0, position: { x: t.x, y: t.y }, tileIndex: IDX[t.name] }));
  m.patchComponent("RectTileMap0", "MOD.Core.RectTileMapComponent", { tileMap: toTileMap(tiles.l0) });
  m.patchComponent("RectTileMap2", "MOD.Core.RectTileMapComponent", { tileMap: toTileMap(tiles.l2) });
  m.patchComponent("RectTileMap6", "MOD.Core.RectTileMapComponent", { tileMap: toTileMap(tiles.l6) });

  // 구 장식(F1_*) · 이전 실행의 Deco 인스턴스 철거
  for (const e of m.listEntities()) {
    const n = e.path.split("/").pop();
    if (/^F1_/.test(n) || /^Deco\d*_/.test(n) || /^D\d+_Deco_/.test(n)) m.remove(e.path);
  }

  // 포탈: 구 이름 → 규약 이름
  if (m.find("PortalToHunt02") && !m.find("PortalForward")) m.rename("PortalToHunt02", "PortalForward");
  const portalTemplate = m.find("PortalForward").jsonString["@components"];
  for (const [name, p] of Object.entries(design.portals)) {
    if (!m.find(name)) {
      m.placeModel(name, "RootDesk/MyDesk/Furniture/Models/Furniture_Portal.model", { pos: [p.pos[0], p.pos[1], 0] });
      for (const c of portalTemplate) if (c["@type"] !== "MOD.Core.TransformComponent") m.upsertComponent(name, c["@type"], JSON.parse(JSON.stringify(c)));
      m.patchComponent(name, "MOD.Core.TransformComponent", { Scale: { x: 2, y: 2, z: 1 } });
    }
    m.patch(name, { pos: [p.pos[0], p.pos[1], 0] });
    if (name !== "Portal") {
      // 목적지는 런타임(ResourceSpawner.EnsureHuntingGroundMaps)이 인스턴스별로 채운다 — 공유 템플릿이라 에디터 값을 비워 둔다.
      m.patchComponent(name, "script.PortalGate", { TargetMapName: "", TargetPosition: { x: 0, y: 0 }, DestinationGroup: "hunt", PortalColor: "white" });
    }
  }
  if (!design.portals.PortalBack && m.find("PortalBack")) m.remove("PortalBack");

  decos.forEach((d, i) => {
    m.placeModel(`D${String(i + 1).padStart(2, "0")}_${d.name}`, path.join(DECO_DIR, d.name + ".model").replace(/\\/g, "/"), { pos: [+d.x.toFixed(2), +d.y.toFixed(2), 0] });
  });

  // 직렬화 무결성 (pitfalls 규칙 16)
  for (const e of m.listEntities()) {
    const rec = m.find(e.path);
    if (typeof rec.jsonString !== "object") throw new Error("jsonString 문자열화 " + e.path);
  }
  m.write(file);
  console.log(`[write] ${file}: entities=${m.listEntities().length}, decos=${decos.length}`);
}

// ---------- main ----------
const plans = [
  { mapName: "field_earth", label: "hunt01 흙 벌판 (field_earth)", design: layoutEarth() },
  { mapName: "template_field", label: "hunt02·03 공용 (template_field)", design: layoutRing() },
];
let totalErr = 0;
const usedDecos = new Set();
for (const p of plans) {
  p.tiles = computeTiles(p.design.L, 55);
  p.decos = planDecos(p.design, p.tiles);
  p.decos.forEach(d => usedDecos.add(d.name));
  preview(p.label, p.design, p.tiles, p.decos);
  const errs = validate(p.label, p.design, p.tiles);
  errs.slice(0, 20).forEach(e => console.log("  ✖ " + e));
  totalErr += errs.length;
  const counts = {};
  p.decos.forEach(d => { counts[d.name] = (counts[d.name] || 0) + 1; });
  console.log("  소품 " + p.decos.length + "개: " + JSON.stringify(counts));
}
if (totalErr > 0) { console.error(`\n검증 실패 ${totalErr}건 — 쓰기 중단`); process.exit(1); }
const dumpIdx = process.argv.indexOf("--dump");
if (dumpIdx > 0) {
  fs.writeFileSync(process.argv[dumpIdx + 1], JSON.stringify(plans.map(p => ({
    mapName: p.mapName, l0: p.tiles.l0, l2: p.tiles.l2, l6: p.tiles.l6, decos: p.decos, portals: p.design.portals,
    tileIds: Object.fromEntries(TILE_DEFS.map(d => [d.Name, d.Id])), decoDefs: DECOS, decoScale: DECO_SCALE,
  }))));
}
if (!WRITE) { console.log("\n미리보기만 수행 (쓰기는 --write)"); process.exit(0); }
writeDecoModels(usedDecos);
for (const p of plans) writeMap(p.mapName, p.design, p.tiles, p.decos);
console.log("완료 — Maker refresh 필요");
