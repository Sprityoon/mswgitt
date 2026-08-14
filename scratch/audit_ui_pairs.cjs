"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}
function xy(v, fb = 0) {
  const o = v && typeof v === "object" ? v : {};
  return [Number(o.x ?? fb), Number(o.y ?? fb)];
}
function hex(c) {
  if (!c) return "-";
  const h = (n) => Math.round(Number(n ?? 0) * 255).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)} a=${Number(c.a ?? 0).toFixed(2)}`;
}

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));
const pairs = [
  ["CustomizePanel/Frame/Title", "CustomizePanel/Frame/TitlePlate"],
  ["CustomizePanel/Frame/HairName", "CustomizePanel/Frame/HairNamePlate"],
  ["CustomizePanel/Frame/FaceName", "CustomizePanel/Frame/FaceNamePlate"],
  ["CustomizePanel/Frame/BodyName", "CustomizePanel/Frame/BodyNamePlate"],
  ["CustomizePanel/Frame/CoatName", "CustomizePanel/Frame/CoatNamePlate"],
  ["CustomizePanel/Frame/Error", "CustomizePanel/Frame/ErrorPlate"],
  ["NamePrompt/Title", "NamePrompt/TitlePlate"],
  ["SlotPanel/Subtitle", "SlotPanel/SubtitlePlate"],
  ["TitlePanel/Hint", "TitlePanel/HintPlate"],
  ["TitlePanel/Logo", null],
  ["TitlePanel/SignBoard", null],
  ["TitlePanel/BtnNew", null],
  ["CustomizePanel/Frame", null],
  ["SlotPanel/Notebook", null],
];

console.log("=== paired plate vs text ===");
for (const [textPath, platePath] of pairs) {
  const te = b.find(textPath);
  if (!te) {
    console.log(`MISSING ${textPath}`);
    continue;
  }
  const tjs = te.jsonString;
  const text = findComp(te, "MOD.Core.TextGUIRendererComponent");
  const sprite = findComp(te, "MOD.Core.SpriteGUIRendererComponent");
  const ut = findComp(te, "MOD.Core.UITransformComponent");
  console.log(
    `TEXT ${textPath} do=${tjs.displayOrder} ${xy(ut.RectSize).join("x")} @${JSON.stringify(xy(ut.anchoredPosition))}` +
      (text ? ` color=${hex(text.FontColor)}` : "") +
      (sprite ? ` spr=${hex(sprite.Color)} preserve=${sprite.PreserveSprite}` : "")
  );
  if (!platePath) continue;
  const pe = b.find(platePath);
  if (!pe) {
    console.log(`  MISSING plate ${platePath}`);
    continue;
  }
  const pjs = pe.jsonString;
  const ps = findComp(pe, "MOD.Core.SpriteGUIRendererComponent");
  const put = findComp(pe, "MOD.Core.UITransformComponent");
  const cover = Number(pjs.displayOrder) > Number(tjs.displayOrder);
  console.log(
    `  PLATE ${platePath} do=${pjs.displayOrder} ${xy(put.RectSize).join("x")} @${JSON.stringify(xy(put.anchoredPosition))}` +
      ` spr=${hex(ps?.Color)} ${cover ? "COVERS TEXT" : "behind text"}`
  );
}

const hud = UIBuilder.load(path.join(__dirname, "..", "ui/HUDGroup.ui"));
const myinfo = [
  "UIMyInfo/info_top/text_name",
  "UIMyInfo/info_top/text_level",
  "UIMyInfo/info_bottom/Hp/text_value",
  "UIMyInfo/info_bottom/Mp/text_value",
  "UIMyInfo/info_bottom/Exp/text_value",
  "UIMyInfo/info_bottom/Hp/img_bar",
];
console.log("\n=== HUD UIMyInfo component types ===");
for (const p of myinfo) {
  const e = hud.find(p);
  if (!e) {
    console.log(`MISSING ${p}`);
    continue;
  }
  console.log(`${p}: ${(e.jsonString["@components"] || []).map((c) => c["@type"]).join(", ")}`);
}

const pop = UIBuilder.load(path.join(__dirname, "..", "ui/PopupGroup.ui"));
console.log("\n=== PopupGroup top-level enable ===");
for (const row of pop.listEntities().filter((r) => r.depth <= 1)) {
  const e = pop.find(row.path);
  console.log(`${e.jsonString.enable === false ? "OFF" : "on "} ${row.path} do=${e.jsonString.displayOrder}`);
}

const dlg = UIBuilder.load(path.join(__dirname, "..", "ui/DialogGroup.ui"));
console.log("\n=== Dialog NamePlate/Body ===");
for (const p of ["DialogWindow/NamePlate", "DialogWindow/NamePlate/NameText", "DialogWindow/BodyText", "DialogWindow/Frame"]) {
  const e = dlg.find(p);
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  console.log(`${p} types=${(e.jsonString["@components"] || []).map((c) => c["@type"].replace("MOD.Core.", "")).join(",")}` +
    (text ? ` font=${text.Font} H=${text.HorizontalAlignment} V=${text.VerticalAlignment} color=${hex(text.FontColor)}` : "") +
    (spr ? ` spr=${hex(spr.Color)}` : ""));
}

console.log("\n=== customParts / Preview entity ===");
for (const name of ["CustomizePanel/Frame/Preview", "CustomizePanel/Parts", "CustomizePanel/Frame/Parts", "customParts"]) {
  const e = b.find(name);
  console.log(`${name}: ${e ? e.id + " " + e.jsonString.path : "ABSENT"}`);
}
