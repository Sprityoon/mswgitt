"use strict";
/**
 * 키아트 화질: Bg Stretch(None) 되돌림.
 * 원본 1376x768 을 1920x1080에 None으로 늘리면 X/Y 배율이 달라지고 업스케일됨.
 * 보이는 장은 Art(AspectOnly) 한 장. Bg는 Mask 껍데기(alpha 0).
 */
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const KEYART = "2e3ad17de2564d12a28d102912edbfca";
const SPR = "MOD.Core.SpriteGUIRendererComponent";

const b = UIBuilder.load(UI);

b.patchComponent("Bg", SPR, {
  ImageRUID: { DataId: KEYART },
  Color: { r: 1, g: 1, b: 1, a: 0 },
  Type: 0,
  PreserveSprite: 0,
  RaycastTarget: false,
});
b.patch("Bg", { display_order: 0 });

if (!b.hasComponent("Bg", "MOD.Core.MaskComponent")) {
  b.addComponent("Bg", "MOD.Core.MaskComponent", {
    "@type": "MOD.Core.MaskComponent",
    Shape: 0,
    Padding: { left: 0, right: 0, top: 0, bottom: 0 },
    Softness: { x: 0, y: 0 },
    Enable: true,
  });
}

b.sprite("Bg/Art", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [2100, 2100],
  image_ruid: KEYART,
  sprite_type: 0,
  preserve_sprite: 1,
  color: "#FFFFFF",
  alpha: 1,
  raycast: false,
});
b.patch("Bg/Art", { display_order: 0 });

b.write(UI);

const after = UIBuilder.load(UI);
function dump(p) {
  const e = after.find(p);
  if (!e) {
    console.log(p, "MISSING");
    return;
  }
  const spr = e.jsonString["@components"].find((c) => c["@type"] === SPR);
  const ut = e.jsonString["@components"].find((c) => c["@type"] === "MOD.Core.UITransformComponent");
  console.log(
    p,
    "size=" + ut.RectSize.x + "x" + ut.RectSize.y,
    "preserve=" + spr.PreserveSprite,
    "a=" + spr.Color.a,
    "ray=" + spr.RaycastTarget,
    "mask=" + after.hasComponent(p, "MOD.Core.MaskComponent")
  );
}
dump("Bg");
dump("Bg/Art");
