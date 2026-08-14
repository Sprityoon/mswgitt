"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const UI = path.resolve(__dirname, "../ui/PopupGroup.ui");
function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}
function xy(v, fb = 0) {
  const o = v && typeof v === "object" ? v : {};
  return [Number(o.x ?? fb), Number(o.y ?? fb)];
}
const b = UIBuilder.load(UI);
for (const p of [
  "/ui/PopupGroup/CraftingPopup",
  "/ui/PopupGroup/CraftingPopup/Bg",
  "/ui/PopupGroup/CraftingPopup/Paper",
  "/ui/PopupGroup/CraftingPopup/Title",
  "/ui/PopupGroup/CraftingPopup/BtnClose",
  "/ui/PopupGroup/CraftingPopup/TierBar",
  "/ui/PopupGroup/CraftingPopup/CategoryBar",
  "/ui/PopupGroup/CraftingPopup/List",
  "/ui/PopupGroup/CraftingPopup/Details",
]) {
  const e = b.find(p);
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  console.log(p.replace("/ui/PopupGroup/CraftingPopup", "."));
  console.log("  do", e.jsonString.displayOrder, "pos", ut.anchoredPosition, "size", ut.RectSize);
  console.log("  anc", ut.AnchorsMin, ut.AnchorsMax, "piv", ut.Pivot);
}
