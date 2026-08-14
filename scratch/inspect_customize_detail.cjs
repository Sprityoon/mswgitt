"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}
function hex(c) {
  if (!c) return "-";
  const h = (n) => Math.round(Number(n ?? 0) * 255).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)} a=${Number(c.a ?? 0).toFixed(2)}`;
}
function dump(b, p) {
  const e = b.find(p);
  if (!e) return console.log("MISSING " + p);
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const input = findComp(e, "MOD.Core.TextGUIRendererInputComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  console.log("\n== " + p + " ==");
  console.log("  do=" + e.jsonString.displayOrder + " enable=" + e.jsonString.enable);
  if (ut) {
    console.log("  pos=" + JSON.stringify(ut.anchoredPosition) + " size=" + JSON.stringify(ut.RectSize));
    console.log("  pivot=" + JSON.stringify(ut.Pivot) + " amin=" + JSON.stringify(ut.AnchorsMin) + " amax=" + JSON.stringify(ut.AnchorsMax));
  }
  if (text) {
    console.log("  TEXT='" + text.Text + "' size=" + text.FontSize + " font=" + text.Font);
    console.log("  color=" + hex(text.FontColor) + " H=" + text.HorizontalAlignment + " V=" + text.VerticalAlignment);
    console.log("  overflow=" + text.Overflow + " bestfit=" + text.BestFit);
  }
  if (input) {
    console.log("  INPUT placeholder='" + input.Placeholder + "' limit=" + input.CharacterLimit);
    console.log("  phColor=" + hex(input.PlaceholderColor) + " keys=" + Object.keys(input).join(","));
  }
  if (spr) {
    console.log("  SPR color=" + hex(spr.Color) + " preserve=" + spr.PreserveSprite + " type=" + spr.Type);
  }
}

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));
const paths = [
  "CustomizePanel/Frame/Title",
  "CustomizePanel/Frame/TitlePlate",
  "CustomizePanel/Frame/HairLabel",
  "CustomizePanel/Frame/FaceLabel",
  "CustomizePanel/Frame/BodyLabel",
  "CustomizePanel/Frame/CoatLabel",
  "CustomizePanel/Frame/HairName",
  "CustomizePanel/Frame/HairNamePlate",
  "CustomizePanel/Frame/NameInput",
  "NamePrompt/Title",
  "NamePrompt/TitlePlate",
  "NamePrompt/Input",
  "NamePrompt/Error",
  "SlotPanel/Subtitle",
  "SlotPanel/SubtitlePlate",
];
for (const p of paths) dump(b, p);
