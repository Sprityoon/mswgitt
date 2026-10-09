// "..." 일괄 처리(ui_text_ellipsis_20261007.cjs) 보정 (2026-10-07).
// 칸 높이가 한 줄 높이에 빠듯한 글자(높이 < 글자크기×1.5)는 Ellipsis/Truncate 모드에서 "한 줄도 다 안 들어간다"고 판단되어
// 글자가 통째로 사라졌다(실측: 프로필 이름 326×42/fs30 · 레벨 120×38/fs30). 그런 칸만 원래 값(백업 .ui 의 Overflow)으로 되돌린다.
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const root = path.join(__dirname, "..");
const backupDir = path.join(root, "scratch", "ui-before-textoverflow-20261007");
const log = console.log;
console.log = () => {};
const TYPES = ["MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent"];
const RATIO = 1.5;
let total = 0;
for (const f of fs.readdirSync(path.join(root, "ui")).filter((f) => f.endsWith(".ui"))) {
  const bk = path.join(backupDir, f);
  if (!fs.existsSync(bk)) continue;
  const uiPath = path.join(root, "ui", f);
  const b = UIBuilder.read(uiPath);
  const old = UIBuilder.read(bk);
  let n = 0;
  const names = [];
  for (const e of b.listEntities()) {
    if (!old.find(e.path)) continue;
    for (const type of TYPES) {
      const cur = b.getComponent(e.path, type);
      const prev = old.getComponent(e.path, type);
      if (!cur || !prev) continue;
      if (Number(prev.Overflow || 0) !== 0 || Number(cur.Overflow || 0) === 0) continue; // 이번 일괄 처리로 바뀐 것만
      const t = b.getComponent(e.path, "MOD.Core.UITransformComponent");
      const fsz = Number(cur.FontSize || 20);
      if (t && t.RectSize.y < fsz * RATIO) {
        b.patchComponent(e.path, type, { Overflow: 0 });
        n++;
        names.push(e.path.replace(/^\/ui\/[^/]+\//, ""));
      }
    }
  }
  if (n > 0) b.write(uiPath);
  log(`${f}: reverted ${n}${n ? "  e.g. " + names.slice(0, 6).join(", ") : ""}`);
  total += n;
}
log(`total reverted ${total}`);
