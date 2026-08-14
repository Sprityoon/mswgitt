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
function ruid(spr) {
  const v = spr?.ImageRUID;
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.DataId || v.Value || JSON.stringify(v);
}

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));
console.log("=== TitlePanel + Bg/Art + title buttons ===");
for (const row of b.listEntities()) {
  const p = row.path || "";
  if (!/TitlePanel|\/Bg|Art|BtnNew|BtnContinue|BtnQuit|SignBoard|Logo/.test(p)) continue;
  const e = b.find(row.path);
  const js = e.jsonString;
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  const btn = findComp(e, "MOD.Core.ButtonComponent");
  const touch = findComp(e, "MOD.Core.UITouchReceiveComponent");
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const types = (js["@components"] || []).map((c) => String(c["@type"]).replace("MOD.Core.", "")).join(",");
  const pos = ut?.anchoredPosition || {};
  const size = ut?.RectSize || {};
  const ancMin = ut?.AnchorsMin || {};
  const ancMax = ut?.AnchorsMax || {};
  console.log(
    p,
    "do=" + js.displayOrder,
    "enable=" + js.enable,
    "origin=" + (js.origin && (js.origin.entry_id || js.origin.modelId)),
    `pos=${Number(pos.x)},${Number(pos.y)} size=${Number(size.x)}x${Number(size.y)}`,
    `anchor=${Number(ancMin.x)},${Number(ancMin.y)}-${Number(ancMax.x)},${Number(ancMax.y)}`,
    "comps=" + types,
    spr
      ? `spr=${hex(spr.Color)} ray=${spr.RaycastTarget} type=${spr.Type} preserve=${spr.PreserveSprite} ruid=${ruid(spr).slice(0, 32)}`
      : "",
    btn
      ? `btnT=${btn.Transition} H=${hex(btn.Colors && btn.Colors.HighlightedColor)}`
      : "",
    touch ? "TOUCH" : "",
    text ? `text="${text.Text}"` : ""
  );
}
