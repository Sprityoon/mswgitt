"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.load(path.resolve(__dirname, "../ui/PopupGroup.ui"));

const paths = [
  "CharacterPopup/EquipPanel/SlotArmor/Icon",
  "CharacterPopup/EquipPanel/SlotWeapon/Icon",
  "CharacterPopup/EquipPanel/SlotHelmet/Bg",
  "CharacterPopup/EquipPanel/Silhouette/Text",
  "CharacterPopup/StatsPanel/HP",
  "CharacterPopup/StatsPanel/HP/Fill",
  "CharacterPopup/StatsPanel/HP/Text",
  "CharacterPopup/StatsPanel/Stamina/Fill",
  "CharacterPopup/StatsPanel/Stamina/Text",
  "CharacterPopup/StatsPanel/XP/Fill",
  "CharacterPopup/StatsPanel/XP/Text",
  "InventoryPopup/Grid/ItemSlot/Icon",
];

for (const p of paths) {
  const e = b.find(p);
  if (!e) {
    console.log("MISSING", p);
    continue;
  }
  const comps = e.jsonString["@components"] || [];
  console.log("\n==", p);
  for (const c of comps) {
    const t = c["@type"].replace("MOD.Core.", "");
    if (t.includes("Transform")) {
      console.log(t, "pos", c.anchoredPosition, "size", c.RectSize, "pivot", c.Pivot, "mn", c.AnchorsMin, "mx", c.AnchorsMax);
    } else if (t.includes("Sprite")) {
      const r = c.ImageRUID;
      const rid = typeof r === "string" ? r : (r && (r.DataId || r.Value)) || "";
      console.log(t, "Type", c.Type, "Preserve", c.PreserveSprite, "RUID", rid, "Color", c.Color, "FillAmount", c.FillAmount, "FillMethod", c.FillMethod);
    } else if (t.includes("Text")) {
      console.log(t, "Text", JSON.stringify(c.Text), "FontSize", c.FontSize, "Overflow", c.Overflow, "H", c.HorizontalAlignment, "V", c.VerticalAlignment);
    } else {
      console.log(t);
    }
  }
}

// inventory slot path may differ
const inv = b.listEntities().filter((e) => e.path.includes("InventoryPopup") && e.name === "Icon").slice(0, 3);
console.log("\ninv icons", inv.map((e) => e.path + " " + JSON.stringify(e.size)));
