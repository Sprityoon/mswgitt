"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));
const frame = b.find("CustomizePanel/Frame");
const spr = findComp(frame, "MOD.Core.SpriteGUIRendererComponent");
const ut = findComp(frame, "MOD.Core.UITransformComponent");
console.log("Frame sprite", JSON.stringify(spr, null, 2));
console.log("Frame ut", JSON.stringify({ pos: ut.anchoredPosition, size: ut.RectSize, preserve: spr.PreserveSprite }));
const tint = b.find("CustomizePanel/Frame/PageTint");
console.log("PageTint enable", tint.jsonString.enable, "do", tint.jsonString.displayOrder);
const slotNb = b.find("SlotPanel/Notebook");
const slotSpr = findComp(slotNb, "MOD.Core.SpriteGUIRendererComponent");
console.log("Slot Notebook ruid", JSON.stringify(slotSpr.ImageRUID), "preserve", slotSpr.PreserveSprite);
