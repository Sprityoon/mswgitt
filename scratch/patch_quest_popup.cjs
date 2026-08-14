"use strict";

const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const CHIP = "4fea64a3307cda641809ad8be0d4890b";
const HOVER_COLORS = {
  NormalColor: { r: 1, g: 1, b: 1, a: 1 },
  HighlightedColor: { r: 1, g: 0.82, b: 0.38, a: 1 },
  PressedColor: { r: 0.62, g: 0.55, b: 0.42, a: 1 },
  SelectedColor: { r: 1, g: 1, b: 1, a: 1 },
  DisabledColor: { r: 0.78, g: 0.78, b: 0.78, a: 0.5 },
  ColorMultiplier: 1,
  FadeDuration: 0.08,
};

const b = UIBuilder.load("ui/PopupGroup.ui");
for (const [name, x] of [["TabProgress", -220], ["TabReady", 0], ["TabDone", 220]]) {
  b.patch(`QuestPopup/${name}`, {
    anchor: "top-center",
    pos: [x, -84],
    rect_size: [200, 88],
  });
}
b.patch("QuestPopup/ListScroll", { pos: [-230, -70], rect_size: [420, 480] });
b.patch("QuestPopup/Details", { pos: [230, -70], rect_size: [420, 480] });
b.patch("QuestPopup/Details/DetailHint", {
  anchor: "bottom-center",
  pos: [0, 150],
  rect_size: [388, 36],
});
const slotXs = [42, 130, 218, 306];
for (let i = 1; i <= 4; i += 1) {
  b.patch(`QuestPopup/Details/RewardSlot${i}`, {
    anchor: "top-left",
    pos: [slotXs[i - 1], -322],
    rect_size: [72, 72],
  });
}
b.write("ui/PopupGroup.ui", { lint_verbose: false });

const h = UIBuilder.load("ui/HUDGroup.ui");
if (h.find("QuestTracker/BtnOpen")) h.remove("QuestTracker/BtnOpen");
h.sprite("QuestTracker/BtnOpen", {
  image_ruid: CHIP,
  color: { r: 1, g: 1, b: 1, a: 0.02 },
  raycast: true,
  pos: [0, 0],
  rect_size: [340, 170],
});
const btnSrc = b.getComponent("QuestPopup/BtnClose", "MOD.Core.ButtonComponent");
const btn = JSON.parse(JSON.stringify(btnSrc));
btn.Colors = HOVER_COLORS;
h.addComponent("QuestTracker/BtnOpen", "MOD.Core.ButtonComponent", btn);
h.patch("QuestTracker/BtnOpen", { display_order: 10 });
h.write("ui/HUDGroup.ui", { lint_verbose: false });
console.log("patched quest popup tabs/slots + tracker overlay");
