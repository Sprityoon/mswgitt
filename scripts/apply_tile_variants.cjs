/**
 * apply_tile_variants.cjs — 정적 맵(.map)의 L2 잔디 타일을 TileVariantDataSet 무작위 변형으로 다시 칠한다.
 *
 * 사용:
 *   node scripts/apply_tile_variants.cjs                    # 전 맵 dry-run (기본)
 *   node scripts/apply_tile_variants.cjs map/map01.map      # 지정 맵 dry-run
 *   node scripts/apply_tile_variants.cjs --apply            # 전 맵 적용
 *
 * 규칙 (런타임 ResourceSpawner.ResolveTileVariant 와 같아야 한다):
 *   - 데이터: RootDesk/MyDesk/MapObjects/DataSets/TileVariantDataSet.csv (BaseTile, VariantTile, Enabled)
 *   - 셀 (x,y) 의 타일 이름 → 원본 이름(변형이면 역변환) → [원본, Enabled 변형...] 중 variantHash(x,y) % (n+1)
 *   - Enabled=false 로 되돌리면 이 스크립트가 변형을 원본으로 되돌린다(같은 마스크라 지형은 불변).
 *
 * 안전장치:
 *   - Enabled 변형 이름이 wall.tileset 에 없으면 중단 (Maker 등록 전 실행 방지).
 *   - L2(RectTileMap2) 의 tileMap 배열만, 원문 텍스트에서 "tileIndex" 숫자만 치환 — Maker 저장 형식(CRLF·실수 표기) 보존.
 *     파싱한 배열과 원문 항목의 개수·좌표·순서가 하나라도 다르면 그 맵은 건너뛴다.
 *   - 쓰기 후 다시 파싱해 L2 밖 내용·좌표·마스크가 그대로인지 검사한다.
 *   - ⚠️ Maker 가 맵을 열어 둔 채 저장하면 이 변경이 되돌려진다(pitfalls 규칙 11) — Maker 저장 후 실행 → refresh.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TILESET = path.join(ROOT, "RootDesk/MyDesk/wall.tileset");
const CSV = path.join(ROOT, "RootDesk/MyDesk/MapObjects/DataSets/TileVariantDataSet.csv");
const L2_NAME = "RectTileMap2";

function mod(v, m) { return ((v % m) + m) % m; }

// ResourceSpawner.TileVariantHash 와 같은 수식
function variantHash(x, y) {
  const a = mod(x * 7919 + y * 104729 + 12345, 65521);
  const b = mod(a * a + x * 31 + y * 17, 65521);
  return Math.floor(b / 7);
}

function loadTileset() {
  const ts = JSON.parse(fs.readFileSync(TILESET, "utf8"));
  const datas = ts.ContentProto.Json.datas;
  const idxByName = {};
  const nameByIdx = {};
  datas.forEach((d, i) => { idxByName[d.Name] = i; nameByIdx[i] = d.Name; });
  return { ruid: ts.EntryKey, idxByName, nameByIdx };
}

function loadVariants() {
  const text = fs.readFileSync(CSV, "utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const head = lines[0].split(",");
  const col = (n) => head.indexOf(n);
  const list = {};
  const reverse = {};
  for (const line of lines.slice(1)) {
    const c = line.split(",");
    const base = (c[col("BaseTile")] || "").trim();
    const variant = (c[col("VariantTile")] || "").trim();
    const enabled = (c[col("Enabled")] || "").trim().toLowerCase() === "true";
    if (!base || !variant) continue;
    reverse[variant] = base;
    if (enabled) (list[base] = list[base] || []).push(variant);
  }
  return { list, reverse };
}

function resolve(baseName, x, y, list) {
  const v = list[baseName];
  if (!v || v.length === 0) return baseName;
  const pick = variantHash(x, y) % (v.length + 1);
  return pick === 0 ? baseName : v[pick - 1];
}

function entJson(e) { return typeof e.jsonString === "string" ? JSON.parse(e.jsonString) : e.jsonString; }

function processMap(mapPath, TS, VAR, apply) {
  const raw = fs.readFileSync(mapPath, "utf8");
  const json = JSON.parse(raw);
  let l2 = null;
  for (const e of json.ContentProto.Entities) {
    const js = entJson(e);
    if (js && js.name === L2_NAME) {
      const tc = (js["@components"] || []).find((c) => c["@type"] === "MOD.Core.RectTileMapComponent");
      if (tc) l2 = tc;
    }
  }
  const rel = path.relative(ROOT, mapPath).replace(/\\/g, "/");
  if (!l2) return { rel, skipped: "L2 없음" };
  if (l2.TileSetRUID !== TS.ruid) return { rel, skipped: `L2 타일셋이 wall 아님 (${l2.TileSetRUID})` };

  // 원하는 인덱스 계산
  const want = [];
  const stats = {};
  let changes = 0;
  for (const t of l2.tileMap || []) {
    const name = TS.nameByIdx[t.tileIndex];
    const base = VAR.reverse[name] || name;
    let next = t.tileIndex;
    if (VAR.list[base] || VAR.reverse[name]) {
      const target = resolve(base, t.position.x, t.position.y, VAR.list);
      next = TS.idxByName[target];
      if (next === undefined) throw new Error(`tileset 에 없는 이름: ${target}`);
      const s = (stats[base] = stats[base] || {});
      s[target] = (s[target] || 0) + 1;
    }
    if (next !== t.tileIndex) changes++;
    want.push({ x: t.position.x, y: t.position.y, from: t.tileIndex, to: next });
  }
  if (changes === 0) return { rel, changes, stats };

  // 원문에서 L2 tileMap 구간 찾기: L2 엔티티 이름 표식 뒤 첫 "tileMap" 배열
  const nameMark = raw.indexOf(`"name": "${L2_NAME}"`);
  if (nameMark < 0 || raw.indexOf(`"name": "${L2_NAME}"`, nameMark + 1) >= 0) {
    return { rel, skipped: "원문에서 L2 이름 표식이 0개 또는 2개 이상" };
  }
  const arrStart = raw.indexOf('"tileMap": [', nameMark);
  if (arrStart < 0) return { rel, skipped: "원문에서 L2 tileMap 을 못 찾음" };
  // 대괄호 짝 맞추기
  let depth = 0, i = raw.indexOf("[", arrStart), arrEnd = -1;
  for (; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "[") depth++;
    else if (ch === "]") { depth--; if (depth === 0) { arrEnd = i; break; } }
  }
  if (arrEnd < 0) return { rel, skipped: "tileMap 배열 끝을 못 찾음" };
  const span = raw.slice(arrStart, arrEnd + 1);
  const re = /"position":\s*\{\s*"x":\s*(-?\d+),\s*"y":\s*(-?\d+)\s*\},\s*"tileIndex":\s*(\d+)/g;
  const found = [...span.matchAll(re)];
  if (found.length !== want.length) return { rel, skipped: `원문 항목 수 ${found.length} ≠ 파싱 ${want.length}` };
  for (let k = 0; k < found.length; k++) {
    const m = found[k];
    if (+m[1] !== want[k].x || +m[2] !== want[k].y || +m[3] !== want[k].from) {
      return { rel, skipped: `원문/파싱 불일치 #${k}` };
    }
  }
  let k = 0;
  const newSpan = span.replace(re, (all, x, y, idx) => {
    const w = want[k++];
    return w.to === +idx ? all : all.replace(/("tileIndex":\s*)\d+$/, `$1${w.to}`);
  });
  const out = raw.slice(0, arrStart) + newSpan + raw.slice(arrEnd + 1);

  // 검사: 다시 파싱 → L2 좌표 동일 · 마스크(원본 이름) 동일 · L2 밖 동일
  const check = JSON.parse(out);
  let l2b = null;
  for (const e of check.ContentProto.Entities) {
    const js = entJson(e);
    if (js && js.name === L2_NAME) l2b = (js["@components"] || []).find((c) => c["@type"] === "MOD.Core.RectTileMapComponent");
  }
  const before = l2.tileMap, after = l2b.tileMap;
  if (before.length !== after.length) throw new Error(rel + ": 검사 실패 — 타일 수 변화");
  for (let q = 0; q < before.length; q++) {
    const a = before[q], b = after[q];
    if (a.position.x !== b.position.x || a.position.y !== b.position.y) throw new Error(rel + ": 검사 실패 — 좌표 변화");
    const na = TS.nameByIdx[a.tileIndex], nb = TS.nameByIdx[b.tileIndex];
    if ((VAR.reverse[na] || na) !== (VAR.reverse[nb] || nb)) throw new Error(rel + `: 검사 실패 — 마스크 변화 ${na}→${nb}`);
  }
  if (raw.slice(0, arrStart) !== out.slice(0, arrStart) || raw.slice(arrEnd + 1) !== out.slice(arrStart + newSpan.length)) {
    throw new Error(rel + ": 검사 실패 — L2 밖 변화");
  }
  if (apply) fs.writeFileSync(mapPath, out);
  return { rel, changes, stats, written: apply };
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const maps = args.filter((a) => !a.startsWith("--"));
  const targets = maps.length
    ? maps.map((m) => (path.isAbsolute(m) ? m : path.join(ROOT, m)))
    : fs.readdirSync(path.join(ROOT, "map")).filter((f) => f.endsWith(".map")).map((f) => path.join(ROOT, "map", f));

  const TS = loadTileset();
  const VAR = loadVariants();
  const enabled = Object.values(VAR.list).flat();
  const missing = enabled.filter((n) => TS.idxByName[n] === undefined);
  if (missing.length) {
    console.error("중단: Enabled 변형이 wall.tileset 에 없음 →", missing.join(", "), "(Maker 에서 먼저 등록)");
    process.exit(1);
  }
  console.log(`변형 Enabled: ${enabled.length ? enabled.join(", ") : "(없음 — 칠해진 변형은 원본으로 되돌림)"}  모드: ${apply ? "적용" : "dry-run"}`);
  for (const t of targets) {
    const r = processMap(t, TS, VAR, apply);
    if (r.skipped) console.log(`- ${r.rel}: 건너뜀 (${r.skipped})`);
    else console.log(`- ${r.rel}: 변경 ${r.changes}칸${r.written ? " (저장)" : ""}  ${JSON.stringify(r.stats)}`);
  }
}

main();
