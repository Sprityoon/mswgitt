/**
 * fix_water_fringe.cjs — L1 Water 셀 둘레 L2 잔디 프린지 보정 (범용)
 *
 * 사용:
 *   node scripts/fix_water_fringe.cjs map/map01.map --dry-run
 *   node scripts/fix_water_fringe.cjs map/map01.map            # 적용
 *
 * 재사용: build_maps.cjs 의 loadWallTileIndex / cellTile 을 소스 추출로 로드
 *   (파일 상단 --force 가드 + paintMap 본문이 require를 막음 — 구조상 직접 require 불가).
 * 프린지 비트: ResourceSpawner.GetTerrainFringeTable / digHole 과 동일 (½셀 마진).
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

const VALID_GRASS = new Set([
  "FullGrass",
  "GrassT", "GrassRT", "GrassR", "GrassRD", "GrassD", "GrassLD", "GrassL", "GrassLT",
  "GrassLTCorner", "GrassRTCorner", "GrassLDCorner", "GrassRDCorner",
  "SubGrassLTRD", "SubGrassRTLD",
]);

function tileNameToMask(name) {
  if (name == null || name === "") return 15; // L2 홀
  const map = {
    FullGrass: 0,
    GrassT: 12, GrassD: 3, GrassL: 5, GrassR: 10,
    GrassLT: 13, GrassRT: 14, GrassLD: 7, GrassRD: 11,
    GrassLTCorner: 4, GrassRTCorner: 8, GrassLDCorner: 1, GrassRDCorner: 2,
    SubGrassLTRD: 6, SubGrassRTLD: 9,
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
  const L1 = findLayer(ents, "RectTileMap");
  const L2 = findLayer(ents, "RectTileMap2");
  if (!L1 || !L2) {
    console.error("RectTileMap / RectTileMap2 not found");
    process.exit(1);
  }

  const l1 = tileMapToMaps(L1.tc, IDX);
  const l2Before = tileMapToMaps(L2.tc, IDX);

  const water = new Set();
  const warnings = [];
  for (const [key, idx] of l1.byKey) {
    const name = indexToName(IDX, idx);
    if (name === "Water") water.add(key);
    else if (name === "Name44") {
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

  // digHole-equivalent fringe: water already hole; OR fringe bits onto neighbors
  const newMask = new Map();
  for (const key of affected) {
    newMask.set(key, getMask(key));
  }
  for (const key of water) {
    newMask.set(key, 15);
    const [x, y] = key.split(",").map(Number);
    for (const f of FRINGE) {
      const nk = `${x + f.dx},${y + f.dy}`;
      if (water.has(nk)) continue; // stay hole
      let nm = newMask.has(nk) ? newMask.get(nk) : getMask(nk);
      if (nm < 0) continue;
      nm = nm | f.bits;
      newMask.set(nk, nm);
    }
  }

  // Build new L2 map: start from full copy, patch affected
  const l2After = new Map(l2Before.byKey);
  const changes = [];
  let clearedWaterL2 = 0;

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

    if (water.has(key)) {
      if (l2After.has(key)) {
        l2After.delete(key);
        clearedWaterL2++;
      }
      if (oldIdx != null) {
        changes.push({ key, from: oldName, to: "(hole)", reason: "water-hole" });
      }
      continue;
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
        changes.push({ key, from: oldName, to: newName, reason: "fringe" });
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

  // Water cells must have no L2
  let waterWithL2 = 0;
  for (const key of water) {
    if (l2After.has(key)) waterWithL2++;
  }

  console.log(`Affected cells (water∪8-neigh): ${affected.size}`);
  console.log(`L2 changes planned: ${changes.length}`);
  console.log(`Water L2 clears: ${clearedWaterL2}`);
  console.log(`Outside-affected L2 diff: ${outsideDiff}`);
  console.log(`Water cells still with L2 after: ${waterWithL2}`);

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

  if (outsideDiff !== 0 || waterWithL2 !== 0) {
    console.error("FAIL: locality or water-hole check");
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
  // Also bump entity componentNames sync? tileMap only change — jsonString updated in writeTileMap
  fs.writeFileSync(mapPath, JSON.stringify(json, null, 2));
  console.log(`SAVED ${mapRel} — L2 changes=${changes.length}`);
}

main();
