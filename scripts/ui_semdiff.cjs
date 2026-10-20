// .ui 의미 비교 — 백업본과 현재 파일을 UIBuilder 로 읽어 엔티티(경로) 단위로 달라진 것만 센다.
// UIBuilder 로 쓴 .ui 는 Maker 와 직렬화 형식이 달라(Maker = 실수 `1.0`, 빌더 = `1`) 줄 단위 git diff 가 수만 줄로 부풀기 때문에,
// "의도한 엔티티만 바뀌었는가 / 사라진 엔티티·바뀐 ID 는 없는가" 는 이 도구로 확인한다.
// 사용: node scripts/ui_semdiff.cjs <그룹명> <백업 폴더(.ui 들이 든 곳)> [v]
//   예) node scripts/ui_semdiff.cjs PopupGroup scratch/ui-before-uifix-20261016 v
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const [, , group, backupDir, verbose] = process.argv;
if (!group || !backupDir) {
  console.error("usage: node scripts/ui_semdiff.cjs <Group> <backupDir> [v]");
  process.exit(2);
}
const root = path.join(__dirname, "..");
const oldB = UIBuilder.load(path.join(root, backupDir, group + ".ui"));
const newB = UIBuilder.load(path.join(root, "ui", group + ".ui"));
const toMap = (b) => new Map(b.build().ContentProto.Entities.map((e) => [e.path, e]));
const sortKeys = (v) =>
  JSON.stringify(v, (k, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([p], [q]) => (p < q ? -1 : 1)))
      : x
  );
const a = toMap(oldB);
const c = toMap(newB);
const changed = [], added = [], removed = [];
for (const [p, e] of c) {
  if (!a.has(p)) { added.push(p); continue; }
  const o = a.get(p);
  if (o.id !== e.id) changed.push(p + "  [ID 변경!]");
  else if (sortKeys(o.jsonString) !== sortKeys(e.jsonString) || o.componentNames !== e.componentNames) changed.push(p);
}
for (const p of a.keys()) if (!c.has(p)) removed.push(p);
console.log(`${group}: old=${a.size} new=${c.size} changed=${changed.length} added=${added.length} removed=${removed.length}`);
if (verbose === "v") {
  const short = (x) => x.replace("/ui/" + group + "/", "");
  console.log("-- changed"); changed.forEach((x) => console.log("  " + short(x)));
  console.log("-- added"); added.forEach((x) => console.log("  " + short(x)));
  console.log("-- removed"); removed.forEach((x) => console.log("  " + x));
}
