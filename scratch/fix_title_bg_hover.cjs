"use strict";
/**
 * MainMenuGroup:
 *  - Bg/Art 이중 스프라이트 정리 (16:9 키아트는 Bg 한 장)
 *  - 타이틀 버튼: 깨진 ImageRUID → 9-slice + 불투명 칩 (ColorTint가 보이게)
 */
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const b = UIBuilder.load(UI);

const SPR = "MOD.Core.SpriteGUIRendererComponent";
const TXT = "MOD.Core.TextGUIRendererComponent";
const BTN = "MOD.Core.ButtonComponent";
const SLICE = "2860136c06ab075439721c027de365af";
const WOOD = { r: 0.55, g: 0.40, b: 0.26, a: 0.92 };
const CREAM = { r: 1, g: 0.96, b: 0.88, a: 1 };
const HOVER_COLORS = {
  NormalColor: { r: 1, g: 1, b: 1, a: 1 },
  HighlightedColor: { r: 1, g: 0.82, b: 0.38, a: 1 },
  PressedColor: { r: 0.62, g: 0.55, b: 0.42, a: 1 },
  SelectedColor: { r: 1, g: 1, b: 1, a: 1 },
  DisabledColor: { r: 0.78, g: 0.78, b: 0.78, a: 0.5 },
  ColorMultiplier: 1,
  FadeDuration: 0.08,
};

function dataId(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return String(ref.DataId || ref.Value || "");
}

const artSpr = b.hasComponent("Bg/Art", SPR) ? b.getComponent("Bg/Art", SPR) : null;
const bgSpr = b.getComponent("Bg", SPR);
const keyart = dataId(artSpr && artSpr.ImageRUID) || dataId(bgSpr && bgSpr.ImageRUID);
if (!keyart) throw new Error("Bg keyart RUID missing");

b.patchComponent("Bg", SPR, {
  ImageRUID: { DataId: keyart },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 0,
  PreserveSprite: 0,
  RaycastTarget: false,
});
b.patch("Bg", { display_order: 0 });

if (b.find("Bg/Art")) {
  b.remove("Bg/Art");
}
if (b.hasComponent("Bg", "MOD.Core.MaskComponent")) {
  b.removeComponent("Bg", "MOD.Core.MaskComponent");
}

for (const key of ["New", "Continue", "Quit"]) {
  const id = `TitlePanel/Btn${key}`;
  b.patchComponent(id, SPR, {
    ImageRUID: { DataId: SLICE },
    Color: WOOD,
    Type: 1,
    PreserveSprite: 0,
    RaycastTarget: true,
  });
  b.patchComponent(id, BTN, {
    Transition: 1,
    Colors: HOVER_COLORS,
  });
  b.patchComponent(id, TXT, {
    FontColor: CREAM,
    HorizontalAlignment: 2,
    VerticalAlignment: 512,
  });
}

b.write(UI);

const after = UIBuilder.load(UI);
function dump(p) {
  const e = after.find(p);
  const spr = (e.jsonString["@components"] || []).find((c) => c["@type"] === SPR);
  const mask = after.hasComponent(p, "MOD.Core.MaskComponent");
  console.log(p, "ruid=" + dataId(spr && spr.ImageRUID), "a=" + (spr && spr.Color && spr.Color.a), "ray=" + (spr && spr.RaycastTarget), "mask=" + mask, "art=" + !!after.find("Bg/Art"));
}
dump("Bg");
dump("TitlePanel/BtnNew");
dump("TitlePanel/BtnContinue");
dump("TitlePanel/BtnQuit");
