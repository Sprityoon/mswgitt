"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const uiPath = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const b = UIBuilder.load(uiPath);

// Frame 자체 스프라이트가 자식을 덮음 → 슬롯과 같이 Notebook 자식 + 틴트 형제
b.sprite("CustomizePanel/Frame/Notebook", {
  pos: [0, 0],
  rect_size: [960, 960],
  image_ruid: "59a330fa4cd44a5583d05d2109cd7f14",
  sprite_type: 0,
  color: "#FFFFFF",
  alpha: 1,
  raycast: false,
});
b.patch("CustomizePanel/Frame/Notebook", { display_order: 0 });
b.patchComponent("CustomizePanel/Frame/Notebook", "MOD.Core.SpriteGUIRendererComponent", {
  PreserveSprite: 1,
});

b.patchComponent("CustomizePanel/Frame", "MOD.Core.SpriteGUIRendererComponent", {
  Color: { r: 1, g: 1, b: 1, a: 0 },
});

b.patch("CustomizePanel/Frame/PageTint", { display_order: 1 });
b.patch("CustomizePanel/Frame/Preview", { display_order: 2 });

b.write(uiPath);

const after = UIBuilder.load(uiPath);
function info(p) {
  const e = after.find(p);
  const spr = e.jsonString["@components"].find((c) => c["@type"] === "MOD.Core.SpriteGUIRendererComponent");
  console.log(p, "do=" + e.jsonString.displayOrder, "a=" + (spr && spr.Color && spr.Color.a));
}
info("CustomizePanel/Frame");
info("CustomizePanel/Frame/Notebook");
info("CustomizePanel/Frame/PageTint");
info("CustomizePanel/Frame/Preview");
