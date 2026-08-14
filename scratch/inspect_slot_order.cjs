"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));
for (const p of [
  "SlotPanel/Subtitle",
  "SlotPanel/SubtitlePlate",
  "SlotPanel/Notebook",
  "CustomizePanel/Frame/Title",
  "CustomizePanel/Frame/TitlePlate",
]) {
  const e = b.find(p);
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  console.log("\n" + p + " do=" + e.jsonString.displayOrder);
  if (text) {
    console.log("  text OrderInLayer=" + text.OrderInLayer + " OverrideSorting=" + text.OverrideSorting);
  }
  if (spr) {
    console.log("  spr OrderInLayer=" + spr.OrderInLayer + " OverrideSorting=" + spr.OverrideSorting + " Preserve=" + spr.PreserveSprite);
  }
}
