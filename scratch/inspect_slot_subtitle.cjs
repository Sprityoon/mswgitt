"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}
function hex(c) {
  if (!c) return "-";
  const h = (n) => Math.round(Number(n ?? 0) * 255).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)} a=${Number(c.a ?? 0).toFixed(2)}`;
}

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));
console.log("=== SlotPanel tree ===");
for (const row of b.listEntities()) {
  const p = row.path || "";
  if (!/SlotPanel/.test(p)) continue;
  const e = b.find(row.path);
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  console.log(
    `${e.jsonString.name} do=${e.jsonString.displayOrder} enable=${e.jsonString.enable}` +
      ` pos=${JSON.stringify(ut?.anchoredPosition)} size=${JSON.stringify(ut?.RectSize)}` +
      (text ? ` text="${text.Text}" color=${hex(text.FontColor)} H=${text.HorizontalAlignment} V=${text.VerticalAlignment} size=${text.FontSize}` : "") +
      (spr ? ` spr=${hex(spr.Color)} preserve=${spr.PreserveSprite}` : "")
  );
}

for (const p of ["CustomizePanel/Frame/Error", "CustomizePanel/Frame/ErrorPlate"]) {
  const e = b.find(p);
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  console.log("\n== " + p + " do=" + e.jsonString.displayOrder + " enable=" + e.jsonString.enable);
  if (text) console.log("  text='" + text.Text + "' color=" + hex(text.FontColor));
  if (spr) console.log("  spr=" + hex(spr.Color));
}
