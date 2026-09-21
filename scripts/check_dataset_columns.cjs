// 데이터셋 열 이름 드리프트 점검 (LEA-3011 예방)
//
// .mlua 안의 row:GetItem("X") / ds:GetCell(i, "X") 호출을 전수 수집하고,
// 그 row/ds 가 어느 .csv 에서 왔는지 역추적해 열 X 가 실재하는지 확인한다.
//
// 배경: 2026-09-21 화로 사고 — Furniture_Furnace 모델의 DurationColumn 값이
// "Duration"(오타)이라 SmeltingRecipeDataSet 에 없는 열을 매 프레임 조회했고,
// pcall 로 감싸도 LEA-3011 로그는 그대로 남아 콘솔이 폭주했다.
// pcall 은 예외만 삼킬 뿐 로그를 막지 못하므로, 열 이름 정합은 정적으로 지켜야 한다.
//
// 사용: node scripts/check_dataset_columns.cjs
// 종료 코드: 실재하지 않는 열을 조회하는 곳이 1건이라도 있으면 1

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const ROOT = path.join(REPO, "RootDesk", "MyDesk");
const BS = String.fromCharCode(92);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT, []);

// ---- 1) .csv 헤더 인덱스 ----
const headers = {};
for (const f of files.filter((x) => x.endsWith(".csv"))) {
  const first = (fs.readFileSync(f, "utf8").split(/\r?\n/)[0] || "").replace(/^\uFEFF/, "");
  headers[path.basename(f, ".csv")] = first.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
}

// ---- 2) 호출 지점 수집 + 데이터셋 역추적 ----
const reTable = /(?:local[ \t]+)?(\w+)[ \t]*=[ \t]*_DataService:GetTable\([ \t]*"([^"]+)"[ \t]*\)/;
const reRow = /(?:local[ \t]+)?(\w+)[ \t]*=[ \t]*(\w+):(?:FindRow|GetRow)\(/;
const reMethodStart = /^[ \t]*method[ \t]/;
const reMethodName = /^[ \t]*method[ \t]+\S+[ \t]+(\w+)[ \t]*\(/;
const reItem = /(\w+):GetItem\([ \t]*"(\w+)"[ \t]*\)/g;
const reCell = /(\w+):GetCell\([ \t]*[^,]+,[ \t]*"(\w+)"[ \t]*\)/g;

const missing = [];
const unresolved = [];
const hotPath = [];
let okCount = 0;

for (const f of files.filter((x) => x.endsWith(".mlua"))) {
  const rel = path.relative(REPO, f).split(BS).join("/");
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  let dsVar = {};
  let rowVar = {};
  let method = "?";

  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (reMethodStart.test(L)) {
      dsVar = {};
      rowVar = {};
      const mn = L.match(reMethodName);
      method = mn ? mn[1] : "?";
    }
    let m = L.match(reTable);
    if (m) dsVar[m[1]] = m[2];
    m = L.match(reRow);
    if (m) {
      if (dsVar[m[2]]) rowVar[m[1]] = dsVar[m[2]];
      else delete rowVar[m[1]];
    }

    for (const [re, viaRow] of [[reItem, true], [reCell, false]]) {
      re.lastIndex = 0;
      let hit;
      while ((hit = re.exec(L)) !== null) {
        const varName = hit[1];
        const col = hit[2];
        const table = viaRow ? rowVar[varName] : dsVar[varName];
        const at = rel + ":" + (i + 1);
        if (!table) {
          unresolved.push({ at, col, method });
        } else if ((headers[table] || []).indexOf(col) >= 0) {
          okCount++;
        } else {
          missing.push({ at, col, table, method });
        }
        if (/^(OnUpdate|Tick|OnFixedUpdate)$/.test(method)) {
          hotPath.push({ at, col, table: table || "?", method });
        }
      }
    }
  }
}

// ---- 2b) 설정값(모델 Values)이 가리키는 데이터셋/열 검증 ----
//   화로 사고의 실제 원인 유형: 코드가 아니라 모델 프로퍼티 값이 없는 열을 가리킨 경우.
//   "<Foo>TableName" 과 "<Bar>Column" 을 같은 컴포넌트에서 짝지어 확인한다.
const MODEL_EXT = "." + "mod" + "el";
const configBad = [];
let configOk = 0;
try {
  const { ModelBuilder } = require(path.join(REPO, ".claude", "skills", "msw-general", "scripts", "model", "msw_model_builder.cjs"));
  const origLog = console.log;
  for (const f of files.filter((x) => x.endsWith(MODEL_EXT))) {
    let vals;
    console.log = function () {};
    try { vals = ModelBuilder.read(f).listValues(); } catch (e) { vals = null; } finally { console.log = origLog; }
    if (!vals) continue;
    const rel = path.relative(REPO, f).split(BS).join("/");
    const byType = {};
    for (const v of vals) {
      const t = String(v.TargetType || "");
      (byType[t] = byType[t] || {})[String(v.Name)] = v.Value;
    }
    for (const t of Object.keys(byType)) {
      const props = byType[t];
      const tableProp = Object.keys(props).filter((k) => /TableName$/.test(k))[0];
      if (!tableProp) continue;
      const tableName = String(props[tableProp] || "");
      if (!tableName) continue;
      if (!headers[tableName]) {
        configBad.push({ at: rel, what: t + "." + tableProp, value: tableName, why: "그런 데이터셋이 없음" });
        continue;
      }
      for (const k of Object.keys(props)) {
        if (!/Column$/.test(k)) continue;
        const col = String(props[k] || "");
        if (!col) continue;
        if (headers[tableName].indexOf(col) >= 0) configOk++;
        else configBad.push({ at: rel, what: t + "." + k, value: col, why: tableName + " 에 그런 열이 없음" });
      }
    }
  }
} catch (e) {
  console.log("⚠️  ModelBuilder 를 불러오지 못해 설정값 검증을 건너뜁니다: " + e.message);
}

// ---- 3) 보고 ----
console.log("데이터셋 열 참조 점검");
console.log("  실재 확인 : " + okCount + "건");
console.log("  추적 실패 : " + unresolved.length + "건 (row 를 인자로 받는 메서드 등 — 수동 확인 대상)");
console.log("  실재 안 함: " + missing.length + "건");
console.log("설정값(모델 프로퍼티 → 데이터셋/열) 점검");
console.log("  정합 확인 : " + configOk + "건");
console.log("  불일치    : " + configBad.length + "건");

if (missing.length > 0) {
  console.log("");
  console.log("🔴 존재하지 않는 열을 조회합니다 (런타임 LEA-3011):");
  for (const r of missing) {
    console.log("   " + r.at.padEnd(62) + "col=" + r.col.padEnd(24) + "table=" + r.table);
  }
}

if (configBad.length > 0) {
  console.log("");
  console.log("🔴 모델 설정값이 없는 데이터셋/열을 가리킵니다 (런타임 LEA-3011):");
  for (const r of configBad) {
    console.log("   " + r.at.padEnd(62) + r.what + " = " + JSON.stringify(r.value) + "  → " + r.why);
  }
}

if (hotPath.length > 0) {
  console.log("");
  console.log("⚠️  매 프레임 경로(OnUpdate/Tick)에서의 열 조회 — 열이 사라지면 로그가 폭주합니다:");
  for (const r of hotPath) {
    console.log("   " + r.at.padEnd(62) + "col=" + r.col.padEnd(24) + r.method);
  }
}

if (process.argv.indexOf("--verbose") >= 0 && unresolved.length > 0) {
  console.log("");
  console.log("ℹ️  데이터셋 추적 실패 (수동 확인):");
  for (const r of unresolved) {
    console.log("   " + r.at.padEnd(62) + "col=" + r.col);
  }
}

console.log("");
const bad = missing.length + configBad.length;
console.log(bad === 0 ? "✅ 불일치 없음" : "❌ 불일치 " + bad + "건");
process.exit(bad === 0 ? 0 : 1);
