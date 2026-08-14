"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const uiPath = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const mluaPath = path.join(__dirname, "..", "RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua");

const b = UIBuilder.load(uiPath);

b.patch("SlotPanel/SubtitlePlate", { display_order: 1 });
b.patch("SlotPanel/Subtitle", { display_order: 20 });
b.patchComponent("SlotPanel/Subtitle", "MOD.Core.TextGUIRendererComponent", {
  FontColor: { r: 1, g: 0.9098039, b: 0.6392157, a: 1 },
});

b.patch("CustomizePanel/Frame/Error", { enable: false });
b.patch("CustomizePanel/Frame/ErrorPlate", { enable: false });

b.write(uiPath, {
  bind: {
    mlua: mluaPath,
    props: {
      customErrorPlate: "CustomizePanel/Frame/ErrorPlate",
    },
  },
});

const after = UIBuilder.load(uiPath);
const sub = after.find("SlotPanel/Subtitle");
const plate = after.find("SlotPanel/SubtitlePlate");
const err = after.find("CustomizePanel/Frame/Error");
const errPlate = after.find("CustomizePanel/Frame/ErrorPlate");
const text = sub.jsonString["@components"].find((c) => c["@type"] === "MOD.Core.TextGUIRendererComponent");
console.log("Subtitle do=" + sub.jsonString.displayOrder + " plate do=" + plate.jsonString.displayOrder);
console.log("Subtitle color", text.FontColor);
console.log("Error enable=" + err.jsonString.enable + " ErrorPlate enable=" + errPlate.jsonString.enable + " id=" + errPlate.id);
