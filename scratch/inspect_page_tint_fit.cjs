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

function dump(prefix) {
  console.log("\n=== " + prefix + " ===");
  for (const row of b.listEntities()) {
    if (!(row.path || "").includes(prefix)) continue;
    const e = b.find(row.path);
    const ut = findComp(e, "MOD.Core.UITransformComponent");
    const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
    const pos = ut?.anchoredPosition || {};
    const size = ut?.RectSize || {};
    const x0 = Number(pos.x) - Number(size.x) / 2;
    const x1 = Number(pos.x) + Number(size.x) / 2;
    const y0 = Number(pos.y) - Number(size.y) / 2;
    const y1 = Number(pos.y) + Number(size.y) / 2;
    console.log(
      `${e.jsonString.name} do=${e.jsonString.displayOrder}` +
        ` pos=${Number(pos.x)},${Number(pos.y)} size=${Number(size.x)}x${Number(size.y)}` +
        ` box=[${x0.toFixed(0)},${y0.toFixed(0)}..${x1.toFixed(0)},${y1.toFixed(0)}]` +
        (spr ? ` spr=${hex(spr.Color)}` : "")
    );
  }
}

dump("SlotPanel");
dump("CustomizePanel");
