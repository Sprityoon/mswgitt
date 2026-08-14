"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const uiPath = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const b = UIBuilder.load(uiPath);

b.sprite("SlotPanel/PageTint", {
  pos: [0, -40],
  rect_size: [780, 620],
  color: "#f7edd9",
  alpha: 0.42,
  sprite_type: 1,
  raycast: false,
  image_ruid: "2860136c06ab075439721c027de365af",
});
b.patch("SlotPanel/PageTint", { display_order: 2 });

b.write(uiPath);

const after = UIBuilder.load(uiPath);
const e = after.find("SlotPanel/PageTint");
const ut = e.jsonString["@components"].find((c) => c["@type"] === "MOD.Core.UITransformComponent");
const spr = e.jsonString["@components"].find((c) => c["@type"] === "MOD.Core.SpriteGUIRendererComponent");
console.log(
  "PageTint do=" + e.jsonString.displayOrder +
    " size=" + JSON.stringify(ut.RectSize) +
    " pos=" + JSON.stringify(ut.anchoredPosition) +
    " a=" + spr.Color.a
);
