"use strict";
/**
 * PopupGroup 정합성 — 고신뢰 결함만.
 * 1) X 스프라이트(221e0368) 위에 레거시 TextComponent "X"가 또 그려짐 → 글자 비움
 * 2) Furnace 제목 500px가 닫기 버튼을 덮음 → 340
 * 3) 인벤 툴팁 Name/Count 400px가 240px 카드 밖으로 넘침 → 220
 */
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = path.join(__dirname, "..", "ui/PopupGroup.ui");
const X_SPRITE = "221e0368e59b4a5981903eb78ac7513d";
const b = UIBuilder.load(UI);

function ruidOf(e) {
  const spr = (e?.jsonString?.["@components"] || []).find(
    (c) => c["@type"] === "MOD.Core.SpriteGUIRendererComponent"
  );
  const v = spr?.ImageRUID;
  if (!v) return "";
  return typeof v === "string" ? v : v.DataId || v.Value || "";
}
function textOf(e) {
  const tc = (e?.jsonString?.["@components"] || []).find(
    (c) => c["@type"] === "MOD.Core.TextComponent"
  );
  return tc?.Text || "";
}

let cleared = 0;
for (const row of b.listEntities()) {
  if (!/BtnClose$/.test(row.path)) continue;
  const e = b.find(row.path);
  if (ruidOf(e) !== X_SPRITE) continue;
  if (textOf(e) === "") continue;
  b.patchComponent(row.path, "MOD.Core.TextComponent", { Text: "" });
  cleared += 1;
  console.log("cleared X text", row.path);
}

b.patch("/ui/PopupGroup/FurnacePopup/Bg/Title", { rect_size: [340, 50] });
b.patch("/ui/PopupGroup/InventoryPopup/Tooltip/Name", { rect_size: [220, 38] });
b.patch("/ui/PopupGroup/InventoryPopup/Tooltip/Count", { rect_size: [220, 32] });

b.write(UI);
console.log("done cleared=", cleared);
