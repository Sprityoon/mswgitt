"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));
for (const p of ["Bg", "Bg/Art", "TitlePanel"]) {
  const e = b.find(p);
  if (!e) {
    console.log(p, "MISSING");
    continue;
  }
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  const mask = findComp(e, "MOD.Core.MaskComponent");
  console.log("===", p, "===");
  console.log("  origin", e.jsonString.origin);
  console.log("  do", e.jsonString.displayOrder);
  if (ut) {
    console.log("  pos", ut.anchoredPosition);
    console.log("  size", ut.RectSize);
    console.log("  anchors", ut.AnchorsMin, ut.AnchorsMax);
    console.log("  pivot", ut.Pivot);
    console.log("  scale", ut.localScale || ut.Scale);
  }
  if (spr) {
    console.log("  ImageRUID", spr.ImageRUID);
    console.log("  Color", spr.Color);
    console.log("  Type", spr.Type, "PreserveSprite", spr.PreserveSprite, "ray", spr.RaycastTarget);
    console.log("  FilterMode", spr.FilterMode, "Mip", spr.MipMap, "PixelsPerUnit", spr.PixelsPerUnit);
    console.log("  keys", Object.keys(spr).join(","));
  }
  if (mask) console.log("  MASK", mask);
}
