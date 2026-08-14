"use strict";

const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FRAME = "25e9e89579644202805f535d038a9edb";
const PAPER = "c24adedc9faa457daf4e4aae7cd663bb";
const CHIP = "4fea64a3307cda641809ad8be0d4890b";

const INK = { r: 0.306, g: 0.114, b: 0.047, a: 1 };
const INK_BODY = { r: 0.243, g: 0.153, b: 0.137, a: 1 };
const INK_MUTED = { r: 0.42, g: 0.28, b: 0.18, a: 1 };
const GOLD = { r: 0.72, g: 0.42, b: 0.08, a: 1 };
const CREAM = { r: 0.941, g: 0.91, b: 0.75, a: 1 };

const b = UIBuilder.load("ui/PopupGroup.ui");

if (b.find("QuestPopup/Paper")) b.remove("QuestPopup/Paper");

b.patchComponent("QuestPopup/Bg", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: FRAME },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 0,
});
b.patch("QuestPopup/Bg", { rect_size: [960, 740] });

b.patchComponent("QuestPopup/Bg/Inner", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: PAPER },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 0,
});

b.patch("QuestPopup/Title", { pos: [0, -28], rect_size: [400, 48], display_order: 2 });
b.patchComponent("QuestPopup/Title", "MOD.Core.TextGUIRendererComponent", {
  FontColor: CREAM,
  OutlineWidth: 0,
  FontSize: 32,
});

b.patch("QuestPopup/BtnClose", { pos: [-36, -28], rect_size: [88, 88], display_order: 20 });
b.patchComponent("QuestPopup/BtnClose", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: CHIP },
  Color: { r: 0.35, g: 0.18, b: 0.14, a: 0.95 },
  Type: 0,
});

for (const [name, x] of [
  ["TabProgress", -220],
  ["TabReady", 0],
  ["TabDone", 220],
]) {
  b.patch(`QuestPopup/${name}`, {
    anchor: "top-center",
    pos: [x, -90],
    rect_size: [180, 44],
    display_order: 3,
  });
  b.patchComponent(`QuestPopup/${name}`, "MOD.Core.SpriteGUIRendererComponent", {
    ImageRUID: { DataId: CHIP },
    Color: { r: 0.18, g: 0.2, b: 0.16, a: 1 },
    Type: 0,
  });
  b.patchComponent(`QuestPopup/${name}`, "MOD.Core.TextGUIRendererComponent", {
    FontSize: 22,
    FontColor: CREAM,
  });
}

b.patch("QuestPopup/ListScroll", { pos: [-230, -40], rect_size: [420, 500] });
b.patchComponent("QuestPopup/ListScroll", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: FRAME },
  Color: { r: 0.08, g: 0.09, b: 0.07, a: 0.35 },
});

b.patch("QuestPopup/Details", { pos: [230, -40], rect_size: [420, 500] });
b.patchComponent("QuestPopup/Details", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: PAPER },
  Color: { r: 1, g: 1, b: 1, a: 0 },
  Type: 0,
});

const texts = [
  ["DetailName", INK, 26],
  ["DetailDesc", INK_BODY, 18],
  ["DetailHint", INK_MUTED, 16],
  ["GoalLabel", GOLD, 18],
  ["DetailGoal", INK, 18],
  ["RewardLabel", GOLD, 18],
];
for (const [name, color, size] of texts) {
  b.patchComponent(`QuestPopup/Details/${name}`, "MOD.Core.TextGUIRendererComponent", {
    FontColor: color,
    OutlineWidth: 0,
    FontSize: size,
  });
}

b.patch("QuestPopup/Details/DetailName", {
  anchor: "top-left",
  pos: [16, -16],
  rect_size: [388, 40],
  pivot: [0, 1],
});
b.patch("QuestPopup/Details/DetailDesc", {
  anchor: "top-left",
  pos: [16, -60],
  rect_size: [388, 72],
  pivot: [0, 1],
});
b.patchComponent("QuestPopup/Details/DetailDesc", "MOD.Core.TextGUIRendererComponent", {
  Overflow: 2,
});
b.patch("QuestPopup/Details/DetailHint", {
  anchor: "top-left",
  pos: [16, -138],
  rect_size: [388, 36],
  pivot: [0, 1],
});
b.patch("QuestPopup/Details/GoalLabel", {
  anchor: "top-left",
  pos: [16, -180],
  rect_size: [200, 26],
  pivot: [0, 1],
});
b.patch("QuestPopup/Details/DetailGoal", {
  anchor: "top-left",
  pos: [16, -208],
  rect_size: [388, 56],
  pivot: [0, 1],
});
b.patch("QuestPopup/Details/RewardLabel", {
  anchor: "top-left",
  pos: [16, -272],
  rect_size: [200, 26],
  pivot: [0, 1],
});

const slotXs = [42, 130, 218, 306];
for (let i = 1; i <= 4; i += 1) {
  b.patch(`QuestPopup/Details/RewardSlot${i}`, {
    anchor: "top-left",
    pos: [slotXs[i - 1], -304],
    rect_size: [72, 72],
    pivot: [0, 1],
  });
}

b.patch("QuestPopup/Details/BtnAbandon", {
  anchor: "bottom-center",
  pos: [0, 16],
  rect_size: [200, 88],
});

b.write("ui/PopupGroup.ui", { lint_verbose: false });
console.log("quest chrome matched to collection tabs + crafting ink");
