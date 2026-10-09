// 퀘스트창 상세(설명·힌트·목표)를 세로 스크롤 영역으로 옮긴다 (2026-10-07).
// 고정 높이 칸에 긴 설명이 넘쳐 아래 줄과 겹치던 문제 → 내용 높이만큼 늘리고 휠로 스크롤.
// 높이는 UIQuestLogController.LayoutDetailScroll 이 GetPreferredHeight 로 맞춘다.
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const root = path.join(__dirname, "..");
const uiPath = path.join(root, "ui", "PopupGroup.ui");
const backupDir = path.join(root, "scratch", "ui-before-textoverflow-20261007");
fs.mkdirSync(backupDir, { recursive: true });
if (!fs.existsSync(path.join(backupDir, "PopupGroup.ui"))) fs.copyFileSync(uiPath, path.join(backupDir, "PopupGroup.ui"));

const b = UIBuilder.read(uiPath);
const D = "QuestPopup/Details";
const SCROLL = `${D}/InfoScroll`;
const INNER_W = 376;

if (!b.find(SCROLL)) {
  b.scrollLayout(SCROLL, { layout_type: 1, spacing: 6, use_scroll: true, padding: [0, 12, 2, 4], v_scroll_dir: 2, anchor: "top-left", pos: [16, -60], rect_size: [392, 204], pivot: [0, 1] });
  const listScroll = b.getComponent("QuestPopup/ListScroll", "MOD.Core.ScrollLayoutGroupComponent");
  b.patchComponent(SCROLL, "MOD.Core.ScrollLayoutGroupComponent", {
    ScrollBarVisible: 1, ScrollBarThickness: 8,
    ScrollBarHandleColor: listScroll.ScrollBarHandleColor, ScrollBarBackgroundColor: listScroll.ScrollBarBackgroundColor,
    ChildAlignment: 0, Padding: { left: 0, right: 12, top: 2, bottom: 4 },
  });
  if (!b.hasComponent(SCROLL, "MOD.Core.MaskComponent")) b.addComponent(SCROLL, "MOD.Core.MaskComponent", { "@type": "MOD.Core.MaskComponent", Shape: 0, Enable: true });
  if (!b.hasComponent(SCROLL, "MOD.Core.SpriteGUIRendererComponent")) b.addComponent(SCROLL, "MOD.Core.SpriteGUIRendererComponent");
  b.patchComponent(SCROLL, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0, g: 0, b: 0, a: 0 }, RaycastTarget: true });
}

// 순서 = 스크롤 안의 위→아래: 설명 → 힌트 → "목표" → 목표 내용
const order = ["DetailDesc", "DetailHint", "GoalLabel", "DetailGoal"];
for (const name of order) {
  const oldPath = `${D}/${name}`;
  const newPath = `${SCROLL}/${name}`;
  if (!b.find(oldPath)) continue;
  const comps = b.find(oldPath).jsonString["@components"].filter((c) => c["@type"] !== "MOD.Core.UITransformComponent");
  const h = b.getComponent(oldPath, "MOD.Core.UITransformComponent").RectSize.y;
  b.remove(oldPath);
  b.empty(newPath, { anchor: "top-left", pos: [0, 0], rect_size: [INNER_W, h], pivot: [0, 1] });
  for (const c of comps) b.upsertComponent(newPath, c["@type"], JSON.parse(JSON.stringify(c)));
  const g = b.getComponent(newPath, "MOD.Core.TextGUIRendererComponent");
  if (g) b.patchComponent(newPath, "MOD.Core.TextGUIRendererComponent", { Overflow: 0, VerticalAlignment: 256 });
}
// "목표"·"보상" 라벨 위치: 보상 라벨은 스크롤 아래 그대로(-272) 둔다.
b.write(uiPath, {
  bind: {
    mlua: path.join(root, "RootDesk", "MyDesk", "UI", "Scripts", "UIQuestLogController.mlua"),
    props: { detailDesc: `${SCROLL}/DetailDesc`, detailGoal: `${SCROLL}/DetailGoal`, detailHint: `${SCROLL}/DetailHint` },
  },
});
const check = UIBuilder.read(uiPath);
for (const name of order) {
  const p = `${SCROLL}/${name}`;
  const t = check.getComponent(p, "MOD.Core.UITransformComponent");
  process.stdout.write(`${name}: ${check.find(p) ? "ok" : "MISSING"} ${t ? Math.round(t.RectSize.x) + "x" + Math.round(t.RectSize.y) : ""}\n`);
}
