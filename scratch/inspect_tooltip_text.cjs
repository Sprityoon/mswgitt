"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const UI = path.resolve(__dirname, "../ui/PopupGroup.ui");
function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}
const b = UIBuilder.load(UI);
for (const p of [
  "/ui/PopupGroup/InventoryPopup/Tooltip/Name",
  "/ui/PopupGroup/InventoryPopup/Tooltip/Count",
  "/ui/PopupGroup/FurnacePopup/Bg/Title",
  "/ui/PopupGroup/SkillTreePopup/Bg/SkillDetailPanel/DGate",
  "/ui/PopupGroup/SkillTreePopup/Bg/SkillDetailPanel/DCost",
]) {
  const e = b.find(p);
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const tc = findComp(e, "MOD.Core.TextComponent");
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  console.log(p);
  console.log("  size", ut?.RectSize, "pos", ut?.anchoredPosition);
  console.log("  TGUI", text && { Text: text.Text, Overflow: text.Overflow, FontSize: text.FontSize, H: text.HorizontalAlignment });
  console.log("  TC", tc && { Text: tc.Text, Overflow: tc.Overflow, FontSize: tc.FontSize, Alignment: tc.Alignment });
}
