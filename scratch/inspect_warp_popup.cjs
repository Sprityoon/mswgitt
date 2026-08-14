"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const UI = path.resolve(__dirname, "../ui/PopupGroup.ui");
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
const b = UIBuilder.load(UI);
const rows = b.listEntities().filter((r) => r.path.includes("WarpPopup"));
for (const row of rows) {
  const e = b.find(row.path);
  const js = e.jsonString;
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  const tc = findComp(e, "MOD.Core.TextComponent");
  const pos = xy(ut?.anchoredPosition);
  const size = xy(ut?.RectSize);
  const pivot = xy(ut?.Pivot, 0.5);
  const mn = xy(ut?.AnchorsMin, 0.5);
  const mx = xy(ut?.AnchorsMax, 0.5);
  console.log(
    `${js.enable === false ? "OFF" : "on "} do=${js.displayOrder ?? 0} ${row.path}` +
      ` pos=(${pos[0]},${pos[1]}) size=${size[0]}x${size[1]} piv=(${pivot[0]},${pivot[1]})` +
      ` anc=(${mn[0]},${mn[1]})-(${mx[0]},${mx[1]})` +
      (spr ? ` spr=${hex(spr.Color)}` : "") +
      (text ? ` TGUI="${text.Text || ""}" ${text.FontSize}px` : "") +
      (tc ? ` TC="${tc.Text || ""}"` : "")
  );
}
