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
function aabb(e) {
  const [x, y] = e.pos;
  const [w, h] = e.size;
  return { l: x - w / 2, r: x + w / 2, b: y - h / 2, t: y + h / 2, x, y, w, h };
}

const b = UIBuilder.load(UI);
const rows = b.listEntities();
const ents = rows.map((row) => {
  const e = b.find(row.path);
  const js = e.jsonString;
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  const btn = findComp(e, "MOD.Core.ButtonComponent");
  return {
    id: e.id,
    path: row.path,
    depth: row.depth,
    name: js.name,
    enable: js.enable !== false,
    do: Number(js.displayOrder ?? 0),
    ut, text, spr, btn,
    pos: xy(ut?.anchoredPosition),
    size: xy(ut?.RectSize),
    pivot: xy(ut?.Pivot, 0.5),
    mn: xy(ut?.AnchorsMin, 0.5),
    mx: xy(ut?.AnchorsMax, 0.5),
    preserve: spr?.PreserveSprite,
    sprType: spr?.Type,
    sprColor: spr?.Color,
    ruid: ruid(spr),
    font: text?.Font,
    fontSize: text?.FontSize,
    textVal: text?.Text || "",
    textColor: text?.FontColor,
    hAlign: text?.HorizontalAlignment,
    vAlign: text?.VerticalAlignment,
    overflow: text?.Overflow,
  };
});

function dump(e, extra = "") {
  if (!e) {
    console.log("  MISSING");
    return;
  }
  const box = aabb(e);
  console.log(
    `  ${e.enable ? "on " : "OFF"} do=${e.do} ${e.path}` +
      ` pos=(${e.pos[0].toFixed(1)},${e.pos[1].toFixed(1)}) size=${e.size[0]}x${e.size[1]}` +
      ` pivot=(${e.pivot[0].toFixed(2)},${e.pivot[1].toFixed(2)})` +
      ` box=[${box.l.toFixed(0)}..${box.r.toFixed(0)}, ${box.b.toFixed(0)}..${box.t.toFixed(0)}]` +
      (e.spr ? ` spr=${hex(e.sprColor)} type=${e.sprType} p=${e.preserve} ruid=${(e.ruid || "").slice(0, 8)}` : "") +
      (e.text ? ` "${e.textVal}" ${e.fontSize}px ${hex(e.textColor)} H=${e.hAlign} V=${e.vAlign}` : "") +
      extra
  );
}

const pops = ents.filter((e) => e.depth === 1);
console.log("=== TITLE / CLOSE / BG GEOMETRY ===\n");
for (const pop of pops) {
  console.log(`\n## ${pop.path} parent ${pop.size[0]}x${pop.size[1]} enable=${pop.enable} do=${pop.do}`);
  const kids = ents.filter((k) => k.path.startsWith(pop.path + "/") && k.depth <= pop.depth + 3);
  const bg = kids.find((k) => /\/Bg$/.test(k.path));
  const title = kids.find((k) => /(^|\/)Title$/.test(k.path) || /TitleText$/.test(k.path));
  const close = kids.find((k) => /BtnClose$/.test(k.path));
  dump(bg, " [BG]");
  dump(title, " [TITLE]");
  dump(close, " [CLOSE]");
  if (title && close) {
    const a = aabb(title);
    const c = aabb(close);
    const ox = Math.max(0, Math.min(a.r, c.r) - Math.max(a.l, c.l));
    const oy = Math.max(0, Math.min(a.t, c.t) - Math.max(a.b, c.b));
    if (ox > 0 && oy > 0) console.log(`  OVERLAP title∩close = ${ox.toFixed(0)}x${oy.toFixed(0)}`);
    else console.log(`  gap title.r=${a.r.toFixed(0)} close.l=${c.l.toFixed(0)} dx=${(c.l - a.r).toFixed(0)}`);
  }
}

const interest = [
  "/ui/PopupGroup/InventoryPopup/CapacityText",
  "/ui/PopupGroup/InventoryPopup/CoinText",
  "/ui/PopupGroup/InventoryPopup/Grid",
  "/ui/PopupGroup/InventoryPopup/Tooltip",
  "/ui/PopupGroup/InventoryPopup/Tooltip/Count",
  "/ui/PopupGroup/InventoryPopup/Tooltip/BtnDiscard",
  "/ui/PopupGroup/InventoryPopup/Tooltip/Name",
  "/ui/PopupGroup/CharacterPopup/StatsPanel/GatherLabel",
  "/ui/PopupGroup/CharacterPopup/StatsPanel/GatherVal",
  "/ui/PopupGroup/CharacterPopup/StatsPanel/MoveLabel",
  "/ui/PopupGroup/CharacterPopup/StatsPanel/MoveVal",
  "/ui/PopupGroup/CraftingPopup/Details/BtnCraft",
  "/ui/PopupGroup/CraftingPopup/Details/BtnCraft/Text",
];
console.log("\n=== INTEREST ===");
for (const p of interest) dump(ents.find((e) => e.path === p));

console.log("\n=== PLATES ===");
for (const e of ents.filter((x) => /Plate/i.test(x.name))) dump(e);

console.log("\n=== TITLE TEXTS ALL ===");
for (const e of ents.filter((x) => x.text && /Title/i.test(x.name))) dump(e);

console.log("\n=== BG SPRITE STYLES ===");
for (const e of ents.filter((x) => /\/Bg$/.test(x.path))) dump(e);

console.log("\n=== SKILL TREE NODES ===");
for (const e of ents.filter((x) => /SkillTreePopup\/Bg\/(Node|Link|Title|EquipBar)/.test(x.path) && x.depth <= 4)) {
  dump(e);
}
