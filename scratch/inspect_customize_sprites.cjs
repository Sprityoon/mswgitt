"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));
const paths = [
  "SlotPanel/Slot1",
  "SlotPanel/PageTint",
  "CustomizePanel/Frame/HairNamePlate",
  "CustomizePanel/Frame/HairLabel",
  "CustomizePanel/Frame/PageTint",
  "CustomizePanel/Frame/BtnHairPrev",
  "CustomizePanel/Frame/NameInput",
];
for (const p of paths) {
  const e = b.find(p);
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  const ruid = spr?.ImageRUID;
  const id = ruid && (ruid.DataId || ruid.Value || ruid);
  console.log(p, "Type=" + spr?.Type, "ruid=" + JSON.stringify(id), "color=", spr?.Color);
}
