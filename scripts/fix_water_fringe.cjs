/**
 * fix_water_fringe.cjs — L1 Water 셀 둘레 L2 잔디 프린지 보정 (범용)
 *
 * 사용:
 *   node scripts/fix_water_fringe.cjs map/map01.map --dry-run
 *   node scripts/fix_water_fringe.cjs map/map01.map            # 적용
 *
 * 재사용: build_maps.cjs 의 loadWallTileIndex / cellTile 을 소스 추출로 로드
 *   (파일 상단 --force 가드 + paintMap 본문이 require를 막음 — 구조상 직접 require 불가).
 *
 * ⚠️ 2026-08-06 규칙 반전 — "잔디가 물을 덮는다"
 *   구 규칙(광장/밭 문법 그대로 차용): 물 셀 = L2 홀, 이웃 잔디 셀에 ½셀 프린지를 켠다.
 *     → 프린지가 뚫는 것은 **이웃 셀 자신의 L1**이고 그건 `Soil`이라, 연못 둘레에 흙 후광이 생겼다.
 *       (Grass{dir}.png 의 흙 쪽은 alpha=0 투명 — 실측: GrassD 하단 59.7% 투명. 즉 L1이 그대로 비친다.)
 *   신 규칙: 프린지를 **물 셀 안쪽으로** 넣는다.
 *     · 경계 물 셀 = 마스크 15에서 "잔디로 덮인 이웃" 방향 비트를 제거 → 그 방향 ½셀이 잔디로 덮임.
 *       투명 구멍으로는 그 셀의 L1 = Water 가 비쳐 물가가 자연스럽다.
 *     · 이웃 잔디 셀 = 물 유래 비트를 되돌려 FullGrass 복귀 (광장/길 유래 비트는 보존).
 *   결과: 흙 후광 소멸, 잔디 둔치가 물 위로 ½셀 걸침. **L1은 건드리지 않는다**(제작자 Maker 페인팅 보존).
 *
 * ⛔ build_maps.cjs 수정 금지 · --force 금지 · AutotileGrassLayer 금지.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.join(__dirname, "..");

function loadBuildMapsHelpers() {
  const srcPath = path.join(__dirname, "build_maps.cjs");
  let src = fs.readFileSync(srcPath, "utf8");
  // --force 가드 제거
  src = src.replace(
    /if\s*\(!process\.argv\.includes\("--force"\)\)\s*\{[\s\S]*?process\.exit\(1\);\s*\}/,
    "/* force-guard stripped for helper import */"
  );
  // 맵별 paintMap 호출부 제거
  const cut = src.search(/\/\/\s*={5,}\s*맵별 디자인/);
  if (cut < 0) throw new Error("build_maps.cjs: paint section marker not found");
  src =
    src.slice(0, cut) +
    "\nmodule.exports = { loadWallTileIndex, makeDirt, cellTile, loadMap, entJson, tileComp, ROOT, WALL_TILESET_RUID };\n";
  const filename = path.join(__dirname, "_build_maps_helpers_virtual.cjs");
  const m = new Module(filename, module);
  m.filename = filename;
  m.paths = Module._nodeModulePaths(__dirname);
  m._compile(src, filename);
  return m.exports;
}

const {
  loadWallTileIndex,
  cellTile,
  entJson,
  tileComp,
} = loadBuildMapsHelpers();

// digHole ½셀 프린지 — ResourceSpawner.GetTerrainFringeTable 미러 (단일 의미)
// 의미: 홀 셀 H 기준, H+(dx,dy) 위치의 이웃 셀에서 켜지는 흙 비트.
const FRINGE = [
  { dx: 0, dy: 1, bits: 3 }, // N: BL|BR
  { dx: 0, dy: -1, bits: 12 }, // S: TL|TR
  { dx: 1, dy: 0, bits: 5 }, // E: BL|TL
  { dx: -1, dy: 0, bits: 10 }, // W: BR|TR
  { dx: 1, dy: 1, bits: 1 }, // NE: BL
  { dx: -1, dy: 1, bits: 2 }, // NW: BR
  { dx: 1, dy: -1, bits: 4 }, // SE: TL
  { dx: -1, dy: -1, bits: 8 }, // SW: TR
];

// 같은 방향에서 "물 셀 자신"의 이웃 쪽 절반에 해당하는 비트 (FRINGE.bits 의 상하/좌우 반전).
// 물 셀에서 이 비트를 지우면 그 방향 ½셀이 잔디로 덮인다 = 잔디 둔치가 물 위로 걸침.
const SELF_SIDE = {
  3: 12, // N 이웃 → 물 셀의 위쪽 절반 TL|TR
  12: 3, // S 이웃 → 아래쪽 BL|BR
  5: 10, // E 이웃 → 오른쪽 BR|TR
  10: 5, // W 이웃 → 왼쪽 BL|TL
  1: 8, // NE 이웃 → TR
  2: 4, // NW 이웃 → TL
  4: 2, // SE 이웃 → BR
  8: 1, // SW 이웃 → BL
};

const VALID_GRASS = new Set([
  "FullGrass",
  "GrassT", "GrassRT", "GrassR", "GrassRD", "GrassD", "GrassLD", "GrassL", "GrassLT",
  "GrassLTCorner", "GrassRTCorner", "GrassLDCorner", "GrassRDCorner",
  "SubGrassLTRD", "SubGrassRTLD",
  "WetRimT", "WetRimRT", "WetRimR", "WetRimRD", "WetRimD", "WetRimLD", "WetRimL", "WetRimLT",
  "WetRimLTCorner", "WetRimRTCorner", "WetRimLDCorner", "WetRimRDCorner",
  "WetRim_T", "WetRim_RT", "WetRim_R", "WetRim_RD", "WetRim_D", "WetRim_LD", "WetRim_L", "WetRim_LT",
  "WetRim_LTCorner", "WetRim_RTCorner", "WetRim_LDCorner", "WetRim_RDCorner",
]);

function tileNameToMask(name) {
  if (name == null || name === "") return 15; // L2 홀
  const map = {
    FullGrass: 0,
    GrassT: 12, GrassD: 3, GrassL: 5, GrassR: 10,
    GrassLT: 13, GrassRT: 14, GrassLD: 7, GrassRD: 11,
    GrassLTCorner: 4, GrassRTCorner: 8, GrassLDCorner: 1, GrassRDCorner: 2,
    SubGrassLTRD: 6, SubGrassRTLD: 9,
    WetRimT: 12, WetRimD: 3, WetRimL: 5, WetRimR: 10,
    WetRimLT: 13, WetRimRT: 14, WetRimLD: 7, WetRimRD: 11,
    WetRimLTCorner: 4, WetRimRTCorner: 8, WetRimLDCorner: 1, WetRimRDCorner: 2,
    WetRim_T: 12, WetRim_D: 3, WetRim_L: 5, WetRim_R: 10,
    WetRim_LT: 13, WetRim_RT: 14, WetRim_LD: 7, WetRim_RD: 11,
    WetRim_LTCorner: 4, WetRim_RTCorner: 8, WetRim_LDCorner: 1, WetRim_RDCorner: 2,
  };
  if (map[name] === undefined) return -1;
  return map[name];
}

function maskToDirtSet(x, y, mask) {
  const dirt = new Set();
  if (mask & 1) dirt.add(`${2 * x},${2 * y}`);
  if (mask & 2) dirt.add(`${2 * x + 1},${2 * y}`);
  if (mask & 4) dirt.add(`${2 * x},${2 * y + 1}`);
  if (mask & 8) dirt.add(`${2 * x + 1},${2 * y + 1}`);
  return dirt;
}

function maskToTileIndex(IDX, x, y, mask) {
  if (mask === 15) return null; // hole
  if (mask === 6) return IDX["SubGrassLTRD"];
  if (mask === 9) return IDX["SubGrassRTLD"];
  const dirt = maskToDirtSet(x, y, mask);
  const t = cellTile(IDX, dirt, x, y);
  if (t === undefined) {
    throw new Error(`invalid diagonal mask ${mask} at (${x},${y}) after SubGrass check`);
  }
  return t;
}

function maskToWaterTileIndex(IDX, x, y, mask) {
  if (mask === 15 || mask <= 0) return null; // hole
  const waterMap = {
    12: "WetRimT",
    3: "WetRimD",
    5: "WetRimL",
    10: "WetRimR",
    13: "WetRimLT",
    14: "WetRimRT",
    7: "WetRimLD",
    11: "WetRimRD",
    4: "WetRimLTCorner",
    8: "WetRimRTCorner",
    1: "WetRimLDCorner",
    2: "WetRimRDCorner",
  };
  const name = waterMap[mask];
  if (name && IDX[name] !== undefined) {
    return IDX[name];
  }
  const altName = name ? name.replace("WetRim", "WetRim_") : null;
  if (altName && IDX[altName] !== undefined) {
    return IDX[altName];
  }
  return maskToTileIndex(IDX, x, y, mask);
}

function indexToName(IDX, tileIndex) {
  if (tileIndex == null) return "";
  for (const [name, idx] of Object.entries(IDX)) {
    if (idx === tileIndex) return name;
  }
  return `?#${tileIndex}`;
}

function findLayer(ents, name) {
  for (const e of ents) {
    const js = entJson(e);
    if (js.name === name && tileComp(js)) return { e, js, tc: tileComp(js) };
  }
  return null;
}

function tileMapToMaps(tc, IDX) {
  // returns { byKey: Map "x,y" -> tileIndex|null(missing), nameByKey }
  const byKey = new Map();
  const nameByKey = new Map();
  const inv = {};
  for (const [n, i] of Object.entries(IDX)) inv[i] = n;
  for (const t of tc.tileMap || []) {
    const key = `${t.position.x},${t.position.y}`;
    byKey.set(key, t.tileIndex);
    nameByKey.set(key, inv[t.position.tileIndex] || inv[t.tileIndex] || `?#${t.tileIndex}`);
  }
  // fix name lookup
  for (const [key, idx] of byKey) {
    nameByKey.set(key, indexToName(IDX, idx));
  }
  return { byKey, nameByKey };
}

function writeTileMap(slot, byKey) {
  const arr = [];
  for (const [key, tileIndex] of byKey) {
    if (tileIndex == null) continue;
    const [x, y] = key.split(",").map(Number);
    arr.push({ type: 0, position: { x, y }, tileIndex });
  }
  arr.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
  slot.tc.tileMap = arr;
  slot.js.revision = (slot.js.revision || 1) + 1;
  // Maker expects nested JObject — never stringify into a JSON string field
  slot.e.jsonString = slot.js;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const mapArg = args.find((a) => !a.startsWith("--"));
  if (!mapArg) {
    console.error("Usage: node scripts/fix_water_fringe.cjs <map/foo.map> [--dry-run]");
    process.exit(2);
  }
  const mapRel = mapArg.replace(/\\/g, "/");
  const mapPath = path.isAbsolute(mapRel) ? mapRel : path.join(ROOT, mapRel);
  if (!fs.existsSync(mapPath)) {
    console.error("map not found:", mapPath);
    process.exit(2);
  }

  const IDX = loadWallTileIndex();
  const waterIdx = IDX["Water"];
  const name44Idx = IDX["Name44"];
  const soilIdx = IDX["Soil"];

  const json = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const ents = json.ContentProto.Entities;
  const L0 = findLayer(ents, "RectTileMap0");
  const L1 = findLayer(ents, "RectTileMap");
  const L2 = findLayer(ents, "RectTileMap2");
  const L6 = findLayer(ents, "RectTileMap6");
  if (!L1 || !L2) {
    console.error("RectTileMap / RectTileMap2 not found");
    process.exit(1);
  }

  const l0 = L0 ? tileMapToMaps(L0.tc, IDX) : { byKey: new Map(), nameByKey: new Map() };
  const l1 = tileMapToMaps(L1.tc, IDX);
  const l2Before = tileMapToMaps(L2.tc, IDX);

  const water = new Set();
  const warnings = [];

  // Read water from L0 if present, else from L1
  for (const [key, idx] of l0.byKey) {
    const name = indexToName(IDX, idx);
    if (name === "Water") water.add(key);
  }
  for (const [key, idx] of l1.byKey) {
    const name = indexToName(IDX, idx);
    if (name === "Water") {
      water.add(key);
    } else if (name === "Name44") {
      warnings.push(`L1 Name44 오배치 at (${key}) — 스킵(제작자 Maker 복구). Water 인덱스=${waterIdx}, Name44 인덱스=${name44Idx}`);
    }
  }

  console.log(`## ${mapRel}`);
  console.log(`Water cells: ${water.size}`);
  for (const w of warnings) console.warn("WARN:", w);

  if (water.size === 0) {
    console.log("No Water tiles — nothing to do.");
    process.exit(0);
  }

  // affected = water ∪ 8-neighbors
  const affected = new Set(water);
  for (const key of water) {
    const [x, y] = key.split(",").map(Number);
    for (const f of FRINGE) {
      affected.add(`${x + f.dx},${y + f.dy}`);
    }
  }

  // Snapshot L2 outside affected for locality check
  const outsideBefore = new Map();
  for (const [key, idx] of l2Before.byKey) {
    if (!affected.has(key)) outsideBefore.set(key, idx);
  }

  // Current masks for all cells we might touch
  function getMask(key) {
    if (water.has(key)) return 15;
    if (!l2Before.byKey.has(key)) {
      // L2 hole — if L1 has Soil/Water treat as 15
      const l1idx = l1.byKey.get(key);
      if (l1idx !== undefined) return 15;
      return -1;
    }
    const name = l2Before.nameByKey.get(key);
    return tileNameToMask(name);
  }

  // 잔디가 물을 덮는다 (2026-08-06 규칙 반전)
  //  ① 경계 물 셀: 15에서 "잔디로 덮인 이웃" 방향의 자기 절반 비트를 제거 → 잔디 ½셀 오버행
  //  ② 이웃 잔디 셀: 물 유래 비트를 제거하고, 광장/길(비-물 홀) 유래 비트는 되살린다
  const isL2Hole = (k) => !l2Before.byKey.has(k);
  const isGrassCovered = (k) => l2Before.byKey.has(k); // L2 타일 존재 = 잔디 패밀리

  const newMask = new Map();
  for (const key of affected) {
    newMask.set(key, getMask(key));
  }

  const degenerate = [];
  for (const key of water) {
    const [x, y] = key.split(",").map(Number);
    let wm = 15;
    for (const f of FRINGE) {
      const nk = `${x + f.dx},${y + f.dy}`;
      if (water.has(nk)) continue; // 물끼리 — 경계 아님
      if (!isGrassCovered(nk)) continue; // 홀(광장/길 흙) — 덮을 잔디가 없다
      wm = wm & ~SELF_SIDE[f.bits];
    }
    if (wm === 0) {
      // 사방이 잔디인 1셀 연못 — 전부 덮으면 물이 사라진다. 홀 유지.
      degenerate.push(key);
      wm = 15;
    }
    newMask.set(key, wm);
  }

  for (const key of affected) {
    if (water.has(key)) continue;
    const base = getMask(key);
    if (base < 0) continue;
    const [x, y] = key.split(",").map(Number);
    let waterBits = 0;
    let otherBits = 0;
    for (const f of FRINGE) {
      // f.bits 는 "홀이 key-(dx,dy) 에 있을 때 key 에서 켜지는 비트"
      const sk = `${x - f.dx},${y - f.dy}`;
      if (water.has(sk)) waterBits |= f.bits;
      else if (isL2Hole(sk)) otherBits |= f.bits;
    }
    // 🔴 물 우선 (2026-08-06) — ResourceSpawner.RefreshWaterAreaRect와 동일 규칙.
    //    흙 홀과 물이 같은 서브셀을 주장할 때 흙을 나중에 얹으면 물에 붙은 흙 조각이 남는다.
    //    물을 마지막에 지워 잔디가 흙과 물 사이를 가르게 한다.
    //    물과 무관한 셀(waterBits=0)은 손대지 않는다.
    if (waterBits !== 0) {
      newMask.set(key, (base | otherBits) & ~waterBits);
    } else {
      newMask.set(key, base);
    }
  }

  if (degenerate.length > 0) {
    console.warn(
      `WARN: 사방이 잔디인 단일 물 셀 ${degenerate.length}건은 홀 유지(오버행 시 물이 사라짐): ${degenerate.join(" ")}`
    );
  }

  // Build new L2 map: start from full copy, patch affected
  const l2After = new Map(l2Before.byKey);
  const changes = [];

  for (const [key, mask] of newMask) {
    const [x, y] = key.split(",").map(Number);
    let newIdx;
    try {
      newIdx = maskToTileIndex(IDX, x, y, mask);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    const oldIdx = l2Before.byKey.has(key) ? l2Before.byKey.get(key) : null;
    const oldName = oldIdx == null ? "(hole)" : indexToName(IDX, oldIdx);
    const newName = newIdx == null ? "(hole)" : indexToName(IDX, newIdx);

    if (newIdx != null && !VALID_GRASS.has(newName) && newName !== "") {
      console.error(`FAIL: invalid L2 tile ${newName} at (${key})`);
      process.exit(1);
    }

    if (newIdx == null) {
      if (l2After.has(key)) {
        l2After.delete(key);
        changes.push({ key, from: oldName, to: "(hole)", reason: "fringe" });
      }
    } else {
      const prev = l2After.has(key) ? l2After.get(key) : null;
      if (prev !== newIdx) {
        l2After.set(key, newIdx);
        changes.push({
          key,
          from: oldName,
          to: newName,
          reason: water.has(key) ? "water-overhang" : "fringe",
        });
      }
    }
  }

  // Locality: outside affected must be identical
  let outsideDiff = 0;
  for (const [key, idx] of outsideBefore) {
    const after = l2After.has(key) ? l2After.get(key) : null;
    if (after !== idx) outsideDiff++;
  }
  for (const [key, idx] of l2After) {
    if (!affected.has(key) && !outsideBefore.has(key)) outsideDiff++;
  }

  // 신 규칙 자가검사
  //  ① 물 셀 중 잔디로 완전히 덮인(=마스크 0 → FullGrass) 셀이 있으면 물이 사라진 것 → FAIL
  //  ② 링(비-물) 셀에 물 유래 흙이 남아 있으면 흙 후광이 남은 것 → 보고
  let waterFullyCovered = 0;
  let waterOverhang = 0;
  for (const key of water) {
    if (!l2After.has(key)) continue;
    const nm = indexToName(IDX, l2After.get(key));
    if (nm === "FullGrass") waterFullyCovered++;
    else waterOverhang++;
  }
  let ringStillDirty = 0;
  for (const key of affected) {
    if (water.has(key)) continue;
    if (!l2After.has(key)) continue; // 광장/길 홀은 원래 흙 — 대상 아님
    const nm = indexToName(IDX, l2After.get(key));
    if (nm !== "FullGrass") ringStillDirty++;
  }

  console.log(`Affected cells (water∪8-neigh): ${affected.size}`);
  console.log(`L2 changes planned: ${changes.length}`);
  console.log(`Water cells with grass overhang: ${waterOverhang}`);
  console.log(`Water cells fully covered (FAIL 조건): ${waterFullyCovered}`);
  console.log(`Ring cells still showing dirt: ${ringStillDirty}`);
  console.log(`Outside-affected L2 diff: ${outsideDiff}`);

  // Coordinate summary: group by new tile name
  const byTo = {};
  for (const c of changes) {
    byTo[c.to] = byTo[c.to] || [];
    byTo[c.to].push(c.key);
  }
  console.log("--- change summary by target tile ---");
  for (const [name, keys] of Object.entries(byTo).sort((a, b) => b[1].length - a[1].length)) {
    const sample = keys.slice(0, 12).join(" ");
    console.log(`  ${name}: ${keys.length}  e.g. ${sample}${keys.length > 12 ? " ..." : ""}`);
  }

  if (outsideDiff !== 0 || waterFullyCovered !== 0) {
    console.error("FAIL: locality 위반이거나 물 셀이 잔디로 완전히 덮임");
    process.exit(1);
  }

  if (dryRun) {
    console.log("DRY-RUN: no file written.");
    // emit machine-readable summary for report
    const outPath = path.join(ROOT, "scratch", "t98_water_fringe_dryrun.json");
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          map: mapRel,
          water: water.size,
          affected: affected.size,
          changes: changes.length,
          outsideDiff,
          warnings,
          byTo: Object.fromEntries(Object.entries(byTo).map(([k, v]) => [k, v.length])),
          changeSample: changes.slice(0, 40),
        },
        null,
        2
      )
    );
    console.log("Wrote", path.relative(ROOT, outPath));
    return;
  }

  writeTileMap(L2, l2After);
  if (L6) {
    const l6RimMap = new Map();
    for (const [key, mask] of newMask) {
      if (water.has(key) && mask > 0 && mask < 15) {
        const rimIdx = maskToWaterTileIndex(IDX, 0, 0, mask);
        if (rimIdx != null) l6RimMap.set(key, rimIdx);
      }
    }
    L6.tc.SortingLayer = "MapLayer3";
    writeTileMap(L6, l6RimMap);
    console.log(`SAVED L6 RectTileMap6 (MapLayer3) — WetRim tiles=${l6RimMap.size}`);
  }
  // Also bump entity componentNames sync? tileMap only change — jsonString updated in writeTileMap
  fs.writeFileSync(mapPath, JSON.stringify(json, null, 2));
  console.log(`SAVED ${mapRel} — L2 changes=${changes.length}`);
}

main();
