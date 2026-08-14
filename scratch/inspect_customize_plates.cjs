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

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));

console.log("=== Customize + NamePrompt tree ===");
for (const row of b.listEntities()) {
  const p = row.path || "";
  if (!/CustomizePanel|NamePrompt/.test(p)) continue;
  const e = b.find(row.path);
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  const name = e.jsonString.name;
  console.log(
    `${row.path} name=${name} do=${e.jsonString.displayOrder} enable=${e.jsonString.enable}` +
      ` size=${xy(ut?.RectSize).join("x")} pos=${JSON.stringify(xy(ut?.anchoredPosition))}` +
      (text ? ` text="${String(text.Text ?? "").slice(0, 24)}"` : "") +
      (spr ? ` sprA=${Number(spr.Color?.a ?? 0).toFixed(2)}` : "")
  );
}
