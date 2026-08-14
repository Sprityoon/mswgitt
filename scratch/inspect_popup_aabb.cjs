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
    parent: row.path.includes("/") ? row.path.slice(0, row.path.lastIndexOf("/")) : "",
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
    ray: spr?.RaycastTarget,
    textRay: text?.RaycastTarget,
    font: text?.Font,
    fontSize: text?.FontSize,
    textVal: text?.Text || "",
    textColor: text?.FontColor,
    hAlign: text?.HorizontalAlignment,
    vAlign: text?.VerticalAlignment,
  };
});
const byPath = new Map(ents.map((e) => [e.path, e]));

function localBox(e) {
  // child's rect in parent-local space (parent origin = parent pivot)
  const parent = byPath.get(e.parent);
  const pSize = parent ? parent.size : [1920, 1080];
  const pPivot = parent ? parent.pivot : [0.5, 0.5];
  const ax = (e.mn[0] + e.mx[0]) / 2;
  const ay = (e.mn[1] + e.mx[1]) / 2;
  const stretchX = e.mn[0] !== e.mx[0];
  const stretchY = e.mn[1] !== e.mx[1];
  const originX = (ax - pPivot[0]) * pSize[0];
  const originY = (ay - pPivot[1]) * pSize[1];
  const cx = originX + e.pos[0];
  const cy = originY + e.pos[1];
  const w = stretchX ? (e.mx[0] - e.mn[0]) * pSize[0] + e.size[0] : e.size[0];
  const h = stretchY ? (e.mx[1] - e.mn[1]) * pSize[1] + e.size[1] : e.size[1];
  return {
    l: cx - e.pivot[0] * w,
    r: cx + (1 - e.pivot[0]) * w,
    b: cy - e.pivot[1] * h,
    t: cy + (1 - e.pivot[1]) * h,
    cx, cy, w, h,
    stretchX, stretchY,
    ax, ay,
  };
}

function dump(e, tag = "") {
  if (!e) return console.log("  MISSING", tag);
  const box = localBox(e);
  console.log(
    `  ${e.enable ? "on " : "OFF"} do=${e.do} ${e.path}` +
      ` pos=(${e.pos[0].toFixed(1)},${e.pos[1].toFixed(1)}) size=${e.size[0].toFixed(1)}x${e.size[1].toFixed(1)}` +
      ` pivot=(${e.pivot[0].toFixed(2)},${e.pivot[1].toFixed(2)})` +
      ` anc=(${e.mn[0].toFixed(2)},${e.mn[1].toFixed(2)})-(${e.mx[0].toFixed(2)},${e.mx[1].toFixed(2)})` +
      ` box=[${box.l.toFixed(0)}..${box.r.toFixed(0)}, ${box.b.toFixed(0)}..${box.t.toFixed(0)}]` +
      (e.spr ? ` spr=${hex(e.sprColor)} type=${e.sprType} ray=${e.ray} ruid=${(e.ruid || "").slice(0, 8)}` : "") +
      (e.text ? ` "${e.textVal}" ${e.fontSize}px ${hex(e.textColor)} H=${e.hAlign} textRay=${e.textRay}` : "") +
      (e.btn ? " BTN" : "") +
      tag
  );
}

const pairs = [
  ["CharacterPopup/Title", "CharacterPopup/BtnClose"],
  ["CollectionPopup/Title", "CollectionPopup/BtnClose"],
  ["CraftingPopup/Title", "CraftingPopup/BtnClose"],
  ["InventoryPopup/Title", "InventoryPopup/BtnClose"],
  ["FurnacePopup/Bg/Title", "FurnacePopup/Bg/BtnClose"],
  ["ChestPopup/Bg/Title", "ChestPopup/Bg/BtnClose"],
  ["PermissionPopup/Bg/Title", "PermissionPopup/Bg/BtnClose"],
  ["WarpPopup/Bg/Title", "WarpPopup/Bg/BtnClose"],
  ["ShopPopup/Bg/Title", "ShopPopup/Bg/BtnClose"],
  ["SkillTreePopup/Bg/Title", "SkillTreePopup/Bg/BtnClose"],
  ["RequestPopup/Bg/Title", "RequestPopup/Bg/BtnClose"],
  ["ResearchPopup/Bg/Title", "ResearchPopup/Bg/BtnClose"],
  ["InventoryPopup/CapacityText", "InventoryPopup/CoinText"],
  ["InventoryPopup/Tooltip/Count", "InventoryPopup/Tooltip/BtnDiscard"],
  ["CharacterPopup/StatsPanel/GatherLabel", "CharacterPopup/StatsPanel/GatherVal"],
  ["CharacterPopup/StatsPanel/MoveLabel", "CharacterPopup/StatsPanel/MoveVal"],
];

console.log("=== TITLE vs CLOSE (parent-local AABB with anchors) ===\n");
for (const [a, c] of pairs) {
  const ea = byPath.get("/ui/PopupGroup/" + a);
  const ec = byPath.get("/ui/PopupGroup/" + c);
  dump(ea);
  dump(ec);
  if (ea && ec) {
    const A = localBox(ea);
    const C = localBox(ec);
    const ox = Math.max(0, Math.min(A.r, C.r) - Math.max(A.l, C.l));
    const oy = Math.max(0, Math.min(A.t, C.t) - Math.max(A.b, C.b));
    if (ox > 1 && oy > 1) console.log(`  >> OVERLAP ${ox.toFixed(0)}x${oy.toFixed(0)}  (titleRay=${ea.ray}/${ea.textRay} closeRay=${ec.ray})\n`);
    else console.log(`  >> gap dx=${(C.l - A.r).toFixed(0)} dy=${(C.b - A.t).toFixed(0)}\n`);
  }
}

console.log("=== INVENTORY TITLE / TABS / GRID ===");
for (const p of [
  "InventoryPopup/Title",
  "InventoryPopup/TabAll",
  "InventoryPopup/TabRes",
  "InventoryPopup/TabEquip",
  "InventoryPopup/Grid",
  "InventoryPopup/CapacityText",
  "InventoryPopup/CoinText",
]) dump(byPath.get("/ui/PopupGroup/" + p));

console.log("\n=== CLOSE BUTTON STYLES ===");
for (const e of ents.filter((x) => x.name === "BtnClose")) dump(e);

console.log("\n=== ALL TITLES ===");
for (const e of ents.filter((x) => x.name === "Title" || x.name === "TitleText")) dump(e);
