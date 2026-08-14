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
console.log("=== CustomizePanel/Frame ===");
for (const row of b.listEntities()) {
  if (!/CustomizePanel\/Frame/.test(row.path || "")) continue;
  const e = b.find(row.path);
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  const pos = ut?.anchoredPosition || {};
  const size = ut?.RectSize || {};
  console.log(
    `${e.jsonString.name} do=${e.jsonString.displayOrder}` +
      ` pos=${Number(pos.x)},${Number(pos.y)} size=${Number(size.x)}x${Number(size.y)}` +
      (text ? ` text="${text.Text}" size=${text.FontSize} H=${text.HorizontalAlignment} color=${hex(text.FontColor)}` : "") +
      (spr ? ` spr=${hex(spr.Color)}` : "")
  );
}
