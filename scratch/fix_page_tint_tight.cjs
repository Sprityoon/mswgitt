"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const uiPath = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const b = UIBuilder.load(uiPath);

const TINT = {
  color: "#2e1f14",
  alpha: 0.32,
  sprite_type: 1,
  raycast: false,
  image_ruid: "2860136c06ab075439721c027de365af",
};

// Slot rows: x -350..350, y -291..229 → pad 14
b.patch("SlotPanel/PageTint", { pos: [0, -31], rect_size: [728, 548] });

// Customize content (Frame-local): x -360..420, y -257..236 → pad 14
b.sprite("CustomizePanel/Frame/PageTint", {
  pos: [30, -11],
  rect_size: [808, 521],
  ...TINT,
});
b.patch("CustomizePanel/Frame/PageTint", { display_order: 0 });

b.write(uiPath);

const after = UIBuilder.load(uiPath);
for (const p of ["SlotPanel/PageTint", "CustomizePanel/Frame/PageTint"]) {
  const e = after.find(p);
  const ut = e.jsonString["@components"].find((c) => c["@type"] === "MOD.Core.UITransformComponent");
  console.log(p, "do=" + e.jsonString.displayOrder, JSON.stringify(ut.anchoredPosition), JSON.stringify(ut.RectSize));
}
