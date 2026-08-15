"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.load(path.resolve(__dirname, "../ui/PopupGroup.ui"));
const UT = "MOD.Core.UITransformComponent";
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const TXT = "MOD.Core.TextGUIRendererComponent";
const TXT2 = "MOD.Core.TextComponent";

function dump(prefix) {
  const rows = b.listEntities().filter((e) => e.path.includes(prefix));
  for (const row of rows) {
    const e = b.find(row.path);
    const comps = e.jsonString["@components"] || [];
    const ut = comps.find((c) => c["@type"] === UT);
    const spr = comps.find((c) => c["@type"] === SPR);
    const t1 = comps.find((c) => c["@type"] === TXT);
    const t2 = comps.find((c) => c["@type"] === TXT2);
    const text = t1 || t2;
    const ruid = spr && spr.ImageRUID;
    const rid = typeof ruid === "string" ? ruid : (ruid && (ruid.DataId || ruid.Value)) || "";
    const col = spr && spr.Color;
    const ca = col ? `${Number(col.r).toFixed(2)},${Number(col.g).toFixed(2)},${Number(col.b).toFixed(2)},${Number(col.a).toFixed(2)}` : "-";
    const tv = text ? JSON.stringify(text.Text || "") : "";
    const fc = text && (text.FontColor || text.Color);
    const fcs = fc ? `${Number(fc.r).toFixed(2)},${Number(fc.g).toFixed(2)},${Number(fc.b).toFixed(2)},${Number(fc.a).toFixed(2)}` : "";
    console.log(
      `${row.path.replace("/ui/PopupGroup/", "")} d=${e.jsonString.displayOrder} pos=${ut.anchoredPosition.x},${ut.anchoredPosition.y} sz=${ut.RectSize.x}x${ut.RectSize.y} pv=${ut.Pivot.x},${ut.Pivot.y} mn=${ut.AnchorsMin.x},${ut.AnchorsMin.y} mx=${ut.AnchorsMax.x},${ut.AnchorsMax.y}` +
        (spr ? ` spr T${spr.Type} a=${ca} ruid=${rid.slice(0, 8)}` : "") +
        (text ? ` txt ${tv} fs=${text.FontSize} fc=${fcs}` : "")
    );
  }
}

console.log("=== EQUIP ===");
dump("CharacterPopup/EquipPanel");
console.log("\n=== CRAFT ===");
dump("CraftingPopup");
