"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function hex(c) {
  if (!c) return "-";
  const h = (n) => Math.round(Number(n ?? 0) * 255).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)} a=${Number(c.a ?? 0).toFixed(2)}`;
}

const files = [
  "ui/MainMenuGroup.ui",
  "ui/HUDGroup.ui",
  "ui/PopupGroup.ui",
  "ui/DialogGroup.ui",
  "ui/PreviewTool.ui",
];

for (const rel of files) {
  const b = UIBuilder.load(path.join(__dirname, "..", rel));
  const rows = [];
  for (const row of b.listEntities()) {
    const e = b.find(row.path);
    const btn = (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === "MOD.Core.ButtonComponent");
    if (!btn) continue;
    const spr = (e.jsonString["@components"] || []).find((c) => c["@type"] === "MOD.Core.SpriteGUIRendererComponent");
    const col = btn.Colors || {};
    rows.push({
      path: row.path,
      tr: btn.Transition,
      sel: btn.Selectable,
      n: hex(col.NormalColor),
      h: hex(col.HighlightedColor),
      p: hex(col.PressedColor),
      s: hex(col.SelectedColor),
      d: hex(col.DisabledColor),
      mul: col.ColorMultiplier,
      fade: col.FadeDuration,
      spr: spr ? hex(spr.Color) : "-",
      ray: spr ? spr.RaycastTarget : null,
    });
  }
  console.log("\n===", rel, "buttons=", rows.length, "===");
  for (const r of rows) {
    console.log(
      r.path,
      `T=${r.tr} Sel=${r.sel} fade=${r.fade} mul=${r.mul}`,
      `N=${r.n} H=${r.h} P=${r.p}`,
      `spr=${r.spr} ray=${r.ray}`
    );
  }
}
