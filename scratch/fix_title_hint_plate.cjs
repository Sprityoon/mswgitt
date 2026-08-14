"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const uiPath = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const mluaPath = path.join(__dirname, "..", "RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua");

const b = UIBuilder.load(uiPath);
const plate = b.find("TitlePanel/HintPlate");
if (!plate) throw new Error("HintPlate missing");

b.patch("TitlePanel/HintPlate", { enable: false, display_order: 4 });
b.patch("TitlePanel/Hint", { enable: false, display_order: 5 });

b.write(uiPath, {
  bind: {
    mlua: mluaPath,
    props: {
      titleHintPlate: "TitlePanel/HintPlate",
    },
  },
});

const after = UIBuilder.load(uiPath).find("TitlePanel/HintPlate");
console.log("HintPlate id=" + after.id + " enable=" + after.jsonString.enable + " do=" + after.jsonString.displayOrder);
