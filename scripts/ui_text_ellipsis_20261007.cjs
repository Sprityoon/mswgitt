// 모든 .ui 글자 칸: 넘치면 겹쳐 그리지 말고 "..." 로 줄인다 (2026-10-07 제작자 요청).
// TextGUIRendererComponent.Overflow = Ellipsis(1) · TextComponent(구형).Overflow = ellipsis(2).
// 제외: 입력창 · 런타임이 글자 높이에 맞춰 크기를 정하는 칸 · 채팅 로그 · NPC 대화 본문 · 이미 넘침 방식이 정해진 칸 · BestFit/SizeFit · 글자 크기 1 컨테이너.
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const root = path.join(__dirname, "..");
const log = console.log;
console.log = () => {};
const EXCLUDE = [
  /\/ChatPanel\/TextLog$/,
  /\/DialogWindow\/BodyText$/,
  /\/SkillDetailPanel\//,
  /\/QuestPopup\/Details\/InfoScroll\//,
  /\/InventoryPopup\/Tooltip\//,
  /^\/ui\/TooltipGroup\//,
];
const backupDir = path.join(root, "scratch", "ui-before-textoverflow-20261007");
fs.mkdirSync(backupDir, { recursive: true });
let total = 0;
for (const f of fs.readdirSync(path.join(root, "ui")).filter((f) => f.endsWith(".ui"))) {
  const uiPath = path.join(root, "ui", f);
  if (!fs.existsSync(path.join(backupDir, f))) fs.copyFileSync(uiPath, path.join(backupDir, f));
  const b = UIBuilder.read(uiPath);
  let n = 0;
  for (const e of b.listEntities()) {
    if (EXCLUDE.some((r) => r.test(e.path))) continue;
    if (b.hasComponent(e.path, "MOD.Core.TextGUIRendererInputComponent")) continue;
    for (const [type, ellipsis] of [["MOD.Core.TextGUIRendererComponent", 1], ["MOD.Core.TextComponent", 2]]) {
      const c = b.getComponent(e.path, type);
      if (!c) continue;
      if (c.BestFit || c.SizeFit) continue;
      if (Number(c.Overflow || 0) !== 0) continue;
      if (Number(c.FontSize || 20) <= 1) continue;
      const t = b.getComponent(e.path, "MOD.Core.UITransformComponent");
      if (t && (t.RectSize.y < Number(c.FontSize || 20) * 0.9 || t.RectSize.x < 24)) continue; // 칸이 글자보다 작다 = 넘침에 기대는 배치
      b.patchComponent(e.path, type, { Overflow: ellipsis });
      n++;
    }
  }
  if (n > 0) b.write(uiPath);
  log(`${f}: ellipsis ${n}`);
  total += n;
}
log(`total ${total}`);
