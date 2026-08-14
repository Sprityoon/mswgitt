"use strict";
/**
 * 전 UI 버튼 ColorTint 호버/누름 대비 강화.
 * 원인: HighlightedColor=#f5f5f5 (Normal 대비 4%) → 나무/그린 버튼에서 안 보임.
 * 호버=메이플 골드 틴트, 누름=어둡게. Normal은 1이라 평소 색은 그대로.
 */
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const HOVER_COLORS = {
  NormalColor: { r: 1, g: 1, b: 1, a: 1 },
  HighlightedColor: { r: 1, g: 0.82, b: 0.38, a: 1 },
  PressedColor: { r: 0.62, g: 0.55, b: 0.42, a: 1 },
  SelectedColor: { r: 1, g: 1, b: 1, a: 1 },
  DisabledColor: { r: 0.78, g: 0.78, b: 0.78, a: 0.5 },
  ColorMultiplier: 1,
  FadeDuration: 0.08,
};

const FILES = [
  "ui/MainMenuGroup.ui",
  "ui/HUDGroup.ui",
  "ui/PopupGroup.ui",
  "ui/DialogGroup.ui",
  "ui/PreviewTool.ui",
];

for (const rel of FILES) {
  const uiPath = path.join(__dirname, "..", rel);
  const b = UIBuilder.load(uiPath);
  let n = 0;
  for (const row of b.listEntities()) {
    const e = b.find(row.path);
    const hasBtn = (e?.jsonString?.["@components"] || []).some(
      (c) => c["@type"] === "MOD.Core.ButtonComponent"
    );
    if (!hasBtn) continue;
    b.patchComponent(row.path, "MOD.Core.ButtonComponent", {
      Transition: 1,
      Colors: HOVER_COLORS,
    });
    n += 1;
  }
  b.write(uiPath);
  console.log("patched", rel, "buttons=", n);
}
