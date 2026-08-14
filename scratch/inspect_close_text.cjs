"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const UI = path.resolve(__dirname, "../ui/PopupGroup.ui");
function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}
const b = UIBuilder.load(UI);
for (const row of b.listEntities().filter((r) => /BtnClose$/.test(r.path))) {
  const e = b.find(row.path);
  const textC = findComp(e, "MOD.Core.TextComponent");
  const textG = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  console.log(row.path);
  console.log("  TextComponent", textC ? JSON.stringify(textC) : "none");
  console.log("  TextGUI", textG ? { Text: textG.Text, FontSize: textG.FontSize } : "none");
  console.log("  Sprite", { ImageRUID: spr?.ImageRUID, Color: spr?.Color, Type: spr?.Type, Preserve: spr?.PreserveSprite });
}
