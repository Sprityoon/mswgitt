"use strict";

const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const CHIP = "4fea64a3307cda641809ad8be0d4890b";
const PAPER = "c24adedc9faa457daf4e4aae7cd663bb";

const b = UIBuilder.load("ui/PopupGroup.ui");

// Wooden frame hole was Inner a=0.08 — world bled through cream text.
b.patchComponent("QuestPopup/Bg/Inner", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: PAPER },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 1,
});

if (!b.find("QuestPopup/Paper")) {
  b.sprite("QuestPopup/Paper", {
    image_ruid: PAPER,
    color: { r: 1, g: 1, b: 1, a: 1 },
    sprite_type: 1,
    pos: [0, 0],
    rect_size: [920, 700],
  });
}
b.patch("QuestPopup/Paper", { display_order: 1 });

b.patch("QuestPopup/Title", { pos: [0, -22], rect_size: [400, 44] });
b.patch("QuestPopup/Title", { display_order: 5 });

b.patch("QuestPopup/TabProgress", { pos: [-220, -78], rect_size: [200, 88] });
b.patch("QuestPopup/TabReady", { pos: [0, -78], rect_size: [200, 88] });
b.patch("QuestPopup/TabDone", { pos: [220, -78], rect_size: [200, 88] });
b.patch("QuestPopup/TabProgress", { display_order: 5 });
b.patch("QuestPopup/TabReady", { display_order: 5 });
b.patch("QuestPopup/TabDone", { display_order: 5 });

b.patch("QuestPopup/ListScroll", { pos: [-230, -40], rect_size: [420, 500] });
b.patchComponent("QuestPopup/ListScroll", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: CHIP },
  Color: { r: 0.08, g: 0.09, b: 0.07, a: 0.72 },
});

b.patch("QuestPopup/Details", { pos: [230, -40], rect_size: [420, 500] });
b.patchComponent("QuestPopup/Details", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: CHIP },
  Color: { r: 0.16, g: 0.18, b: 0.15, a: 0.96 },
});

b.patch("QuestPopup/Details/DetailName", {
  anchor: "top-left",
  pos: [16, -14],
  rect_size: [388, 36],
});
b.patch("QuestPopup/Details/DetailDesc", {
  anchor: "top-left",
  pos: [16, -54],
  rect_size: [388, 64],
});
b.patch("QuestPopup/Details/DetailHint", {
  anchor: "top-left",
  pos: [16, -122],
  rect_size: [388, 40],
});
b.patch("QuestPopup/Details/GoalLabel", {
  anchor: "top-left",
  pos: [16, -168],
  rect_size: [200, 26],
});
b.patch("QuestPopup/Details/DetailGoal", {
  anchor: "top-left",
  pos: [16, -196],
  rect_size: [388, 56],
});
b.patch("QuestPopup/Details/RewardLabel", {
  anchor: "top-left",
  pos: [16, -258],
  rect_size: [200, 26],
});

const slotXs = [42, 130, 218, 306];
for (let i = 1; i <= 4; i += 1) {
  b.patch(`QuestPopup/Details/RewardSlot${i}`, {
    anchor: "top-left",
    pos: [slotXs[i - 1], -292],
    rect_size: [72, 72],
  });
}

b.patch("QuestPopup/Details/BtnAbandon", {
  anchor: "bottom-center",
  pos: [0, 16],
  rect_size: [200, 88],
});

b.write("ui/PopupGroup.ui", { lint_verbose: false });
console.log("quest popup paper + layout patched");
