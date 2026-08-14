"use strict";

const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const CHIP = "4fea64a3307cda641809ad8be0d4890b";
const FRAME = "25e9e89579644202805f535d038a9edb";
const INNER = "c24adedc9faa457daf4e4aae7cd663bb";
const CREAM = "#f0e8bf";
const INK = "#2b2418";
const MUTED = "#c9bfb2";

const HOVER_COLORS = {
  NormalColor: { r: 1, g: 1, b: 1, a: 1 },
  HighlightedColor: { r: 1, g: 0.82, b: 0.38, a: 1 },
  PressedColor: { r: 0.62, g: 0.55, b: 0.42, a: 1 },
  SelectedColor: { r: 1, g: 1, b: 1, a: 1 },
  DisabledColor: { r: 0.78, g: 0.78, b: 0.78, a: 0.5 },
  ColorMultiplier: 1,
  FadeDuration: 0.08,
};

function applyHover(b, path) {
  b.patchComponent(path, "MOD.Core.ButtonComponent", { Colors: HOVER_COLORS });
}

const b = UIBuilder.load("ui/PopupGroup.ui");
if (b.find("QuestPopup")) {
  b.remove("QuestPopup");
}

b.script("QuestPopup", "script.UIQuestLogController", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [1000, 780],
  enable: false,
});
b.patch("QuestPopup", { display_order: 11 });

b.sprite("QuestPopup/Bg", {
  image_ruid: FRAME,
  color: { r: 1, g: 1, b: 1, a: 1 },
  rect_size: [960, 740],
  pos: [0, 0],
});
b.sprite("QuestPopup/Bg/Inner", {
  image_ruid: INNER,
  color: { r: 1, g: 1, b: 1, a: 0.08 },
  rect_size: [900, 640],
  pos: [0, -10],
});

b.text("QuestPopup/Title", "퀘스트", {
  size: 32,
  color: CREAM,
  bold: true,
  alignment: 4,
  outline: true,
  outline_color: "#1a140d",
  outline_width: 1,
  anchor: "top-center",
  pos: [0, -28],
  rect_size: [400, 48],
});

b.button("QuestPopup/BtnClose", "✕", {
  image_ruid: CHIP,
  bg_color: { r: 0.35, g: 0.18, b: 0.14, a: 0.95 },
  color: CREAM,
  font_size: 24,
  anchor: "top-right",
  pos: [-36, -28],
  rect_size: [88, 88],
});
b.patch("QuestPopup/BtnClose", { display_order: 20 });
applyHover(b, "QuestPopup/BtnClose");

const tabSpec = [
  ["TabProgress", "진행 중", -220],
  ["TabReady", "완료 가능", 0],
  ["TabDone", "완료", 220],
];
for (const [name, label, x] of tabSpec) {
  const path = `QuestPopup/${name}`;
  b.button(path, label, {
    image_ruid: CHIP,
    bg_color: { r: 0.18, g: 0.2, b: 0.16, a: 1 },
    color: CREAM,
    font_size: 22,
    anchor: "top-center",
    pos: [x, -90],
    rect_size: [200, 48],
  });
  applyHover(b, path);
}

b.mask("QuestPopup/ListScroll", {
  image_ruid: CHIP,
  alpha: 0.0,
  pos: [-230, -50],
  rect_size: [420, 500],
});
const srcScroll = b.getComponent("CollectionPopup/ListScroll", "MOD.Core.ScrollLayoutGroupComponent");
const scroll = JSON.parse(JSON.stringify(srcScroll));
scroll.CellSize = { x: 400, y: 88 };
scroll.Spacing = 8;
scroll.Padding = { left: 8, right: 12, top: 8, bottom: 8 };
scroll.UseScroll = true;
scroll.ScrollBarVisible = 1;
scroll.Type = 1;
b.addComponent("QuestPopup/ListScroll", "MOD.Core.ScrollLayoutGroupComponent", scroll);

b.button("QuestPopup/ListScroll/RowTemplate", "", {
  image_ruid: CHIP,
  bg_color: { r: 0.18, g: 0.2, b: 0.16, a: 1 },
  color: CREAM,
  font_size: 1,
  pos: [0, 0],
  rect_size: [400, 88],
  enable: false,
});
applyHover(b, "QuestPopup/ListScroll/RowTemplate");
b.sprite("QuestPopup/ListScroll/RowTemplate/Chip", {
  image_ruid: CHIP,
  color: { r: 0.94, g: 0.66, b: 0.19, a: 1 },
  text: "서브",
  text_size: 14,
  text_color: INK,
  text_alignment: 4,
  anchor: "middle-left",
  pos: [12, 18],
  rect_size: [72, 28],
});
b.text("QuestPopup/ListScroll/RowTemplate/Name", "퀘스트 이름", {
  size: 20,
  color: CREAM,
  alignment: 3,
  anchor: "middle-left",
  pos: [92, 16],
  rect_size: [290, 32],
});
b.text("QuestPopup/ListScroll/RowTemplate/Progress", "0/1", {
  size: 16,
  color: MUTED,
  alignment: 3,
  anchor: "middle-left",
  pos: [92, -18],
  rect_size: [290, 28],
});

b.sprite("QuestPopup/Details", {
  image_ruid: INNER,
  color: { r: 1, g: 1, b: 1, a: 0.12 },
  pos: [230, -50],
  rect_size: [420, 500],
});
b.text("QuestPopup/Details/DetailName", "퀘스트를 선택하세요", {
  size: 26,
  color: CREAM,
  bold: true,
  alignment: 3,
  outline: true,
  outline_color: "#1a140d",
  outline_width: 1,
  anchor: "top-left",
  pos: [16, -16],
  rect_size: [388, 40],
});
b.text("QuestPopup/Details/DetailDesc", "", {
  size: 18,
  color: MUTED,
  alignment: 0,
  anchor: "top-left",
  pos: [16, -64],
  rect_size: [388, 90],
});
b.text("QuestPopup/Details/GoalLabel", "목표", {
  size: 18,
  color: "#f0a830",
  bold: true,
  alignment: 3,
  anchor: "top-left",
  pos: [16, -164],
  rect_size: [200, 28],
});
b.text("QuestPopup/Details/DetailGoal", "", {
  size: 18,
  color: CREAM,
  alignment: 0,
  anchor: "top-left",
  pos: [16, -196],
  rect_size: [388, 80],
});
b.text("QuestPopup/Details/RewardLabel", "보상", {
  size: 18,
  color: "#f0a830",
  bold: true,
  alignment: 3,
  anchor: "top-left",
  pos: [16, -286],
  rect_size: [200, 28],
});

for (let i = 1; i <= 4; i += 1) {
  const slot = `QuestPopup/Details/RewardSlot${i}`;
  const x = 52 + (i - 1) * 88;
  b.sprite(slot, {
    image_ruid: CHIP,
    color: { r: 0.18, g: 0.2, b: 0.16, a: 1 },
    anchor: "top-left",
    pos: [x, -322],
    rect_size: [72, 72],
    enable: false,
  });
  b.sprite(`${slot}/Icon`, {
    image_ruid: CHIP,
    color: { r: 1, g: 1, b: 1, a: 1 },
    preserve_sprite: 1,
    rect_size: [48, 48],
    pos: [0, 8],
  });
  b.text(`${slot}/Count`, "x1", {
    size: 14,
    color: CREAM,
    alignment: 4,
    anchor: "bottom-center",
    pos: [0, 6],
    rect_size: [68, 20],
  });
}

b.text("QuestPopup/Details/DetailHint", "", {
  size: 16,
  color: MUTED,
  alignment: 4,
  anchor: "bottom-center",
  pos: [0, 108],
  rect_size: [388, 40],
});
b.button("QuestPopup/Details/BtnAbandon", "포기", {
  image_ruid: CHIP,
  bg_color: { r: 0.35, g: 0.18, b: 0.14, a: 0.95 },
  color: CREAM,
  font_size: 22,
  anchor: "bottom-center",
  pos: [0, 48],
  rect_size: [200, 88],
  enable: false,
});
applyHover(b, "QuestPopup/Details/BtnAbandon");

b.write("ui/PopupGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/UI/Scripts/UIQuestLogController.mlua",
    props: {
      btnClose: "QuestPopup/BtnClose",
      tabProgress: "QuestPopup/TabProgress",
      tabReady: "QuestPopup/TabReady",
      tabDone: "QuestPopup/TabDone",
      listScroll: "QuestPopup/ListScroll",
      rowTemplate: "QuestPopup/ListScroll/RowTemplate",
      detailName: "QuestPopup/Details/DetailName",
      detailDesc: "QuestPopup/Details/DetailDesc",
      detailGoal: "QuestPopup/Details/DetailGoal",
      detailHint: "QuestPopup/Details/DetailHint",
      rewardSlot1: "QuestPopup/Details/RewardSlot1",
      rewardSlot2: "QuestPopup/Details/RewardSlot2",
      rewardSlot3: "QuestPopup/Details/RewardSlot3",
      rewardSlot4: "QuestPopup/Details/RewardSlot4",
      btnAbandon: "QuestPopup/Details/BtnAbandon",
    },
  },
  lint_verbose: true,
});

const h = UIBuilder.load("ui/HUDGroup.ui");
if (h.find("QuestTracker/BtnOpen")) {
  h.remove("QuestTracker/BtnOpen");
}
h.button("QuestTracker/BtnOpen", "", {
  image_ruid: CHIP,
  bg_color: { r: 1, g: 1, b: 1, a: 0.02 },
  color: { r: 1, g: 1, b: 1, a: 0 },
  font_size: 1,
  pos: [0, 0],
  rect_size: [340, 170],
});
h.patch("QuestTracker/BtnOpen", { display_order: 10 });
applyHover(h, "QuestTracker/BtnOpen");
h.write("ui/HUDGroup.ui", { lint_verbose: true });

console.log("quest popup + tracker button written");
