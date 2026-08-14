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
function ruid(spr) {
  const v = spr?.ImageRUID;
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.DataId || v.Value || "";
}

const b = UIBuilder.load(UI);
const pops = [
  "CraftingPopup",
  "InventoryPopup",
  "CharacterPopup",
  "CollectionPopup",
  "ShopPopup",
  "ChestPopup",
  "FurnacePopup",
  "WarpPopup",
  "SkillTreePopup",
  "PermissionPopup",
  "RequestPopup",
  "ResearchPopup",
];

for (const pop of pops) {
  const prefix = `/ui/PopupGroup/${pop}`;
  const rows = b.listEntities().filter((r) => r.path === prefix || r.path.startsWith(prefix + "/"));
  console.log(`\n======== ${pop} (${rows.length}) ========`);
  for (const row of rows) {
    if (row.depth > 3) continue;
    const e = b.find(row.path);
    const js = e.jsonString;
    const ut = findComp(e, "MOD.Core.UITransformComponent");
    const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
    const tc = findComp(e, "MOD.Core.TextComponent");
    const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
    const btn = findComp(e, "MOD.Core.ButtonComponent");
    const pos = xy(ut?.anchoredPosition);
    const size = xy(ut?.RectSize);
    const label = (text?.Text || tc?.Text || "").slice(0, 24);
    console.log(
      `  d=${row.depth} do=${String(js.displayOrder ?? 0).padStart(2)} ${js.enable === false ? "OFF" : "on "} ${row.path.replace(prefix, ".")}` +
        ` pos=(${pos[0].toFixed(0)},${pos[1].toFixed(0)}) ${size[0].toFixed(0)}x${size[1].toFixed(0)}` +
        (spr ? ` spr=${hex(spr.Color)} p=${spr.PreserveSprite} doSpr? ruid=${(ruid(spr) || "").slice(0, 8)} ray=${spr.RaycastTarget}` : "") +
        (btn ? " BTN" : "") +
        (label ? ` "${label}"` : "")
    );
  }
}
