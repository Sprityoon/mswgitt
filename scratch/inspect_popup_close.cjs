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
    path: row.path,
    name: js.name,
    enable: js.enable !== false,
    do: Number(js.displayOrder ?? 0),
    ut, text, spr, btn,
    pos: xy(ut?.anchoredPosition),
    size: xy(ut?.RectSize),
    pivot: xy(ut?.Pivot, 0.5),
    mn: xy(ut?.AnchorsMin, 0.5),
    mx: xy(ut?.AnchorsMax, 0.5),
    offMin: xy(ut?.OffsetMin),
    offMax: xy(ut?.OffsetMax),
    preserve: spr?.PreserveSprite,
    sprType: spr?.Type,
    sprColor: spr?.Color,
    ruid: ruid(spr),
    ray: spr?.RaycastTarget,
    textVal: text?.Text || "",
    fontSize: text?.FontSize,
    textColor: text?.FontColor,
    hAlign: text?.HorizontalAlignment,
    types: (js["@components"] || []).map((c) => String(c["@type"]).replace("MOD.Core.", "")),
  };
});

console.log("=== BTN CLOSE CHILDREN ===");
for (const e of ents.filter((x) => x.path.includes("BtnClose"))) {
  console.log(
    `${e.enable ? "on " : "OFF"} ${e.path} ${e.size[0]}x${e.size[1]} "${e.textVal}" ${e.fontSize || ""} ${hex(e.textColor)}` +
      ` spr=${hex(e.sprColor)} ruid=${(e.ruid || "").slice(0, 8)} types=${e.types.join(",")}`
  );
}

console.log("\n=== GRID / STRETCH ===");
for (const e of ents.filter((x) => x.mn[0] !== x.mx[0] || x.mn[1] !== x.mx[1])) {
  console.log(
    `${e.path} anc=(${e.mn[0]},${e.mn[1]})-(${e.mx[0]},${e.mx[1]}) pos=(${e.pos[0].toFixed(1)},${e.pos[1].toFixed(1)})` +
      ` size=${e.size[0].toFixed(1)}x${e.size[1].toFixed(1)} offMin=(${e.offMin[0].toFixed(1)},${e.offMin[1].toFixed(1)}) offMax=(${e.offMax[0].toFixed(1)},${e.offMax[1].toFixed(1)})`
  );
}

console.log("\n=== CLOSE vs PARENT BG EDGE ===");
function find(p) { return ents.find((e) => e.path === p); }
const closes = ents.filter((e) => e.name === "BtnClose");
for (const c of closes) {
  const parentPath = c.path.slice(0, c.path.lastIndexOf("/"));
  const parent = find(parentPath);
  if (!parent) continue;
  const halfW = parent.size[0] / 2;
  const halfH = parent.size[1] / 2;
  const ax = (c.mn[0] + c.mx[0]) / 2;
  const ay = (c.mn[1] + c.mx[1]) / 2;
  const originX = (ax - 0.5) * parent.size[0];
  const originY = (ay - 0.5) * parent.size[1];
  const cx = originX + c.pos[0];
  const cy = originY + c.pos[1];
  const l = cx - c.pivot[0] * c.size[0];
  const r = cx + (1 - c.pivot[0]) * c.size[0];
  const btm = cy - c.pivot[1] * c.size[1];
  const top = cy + (1 - c.pivot[1]) * c.size[1];
  const overflowR = r - halfW;
  const overflowL = -halfW - l;
  const overflowT = top - halfH;
  const overflowB = -halfH - btm;
  const msgs = [];
  if (overflowR > 1) msgs.push(`RIGHT+${overflowR.toFixed(0)}`);
  if (overflowL > 1) msgs.push(`LEFT+${overflowL.toFixed(0)}`);
  if (overflowT > 1) msgs.push(`TOP+${overflowT.toFixed(0)}`);
  if (overflowB > 1) msgs.push(`BOTTOM+${overflowB.toFixed(0)}`);
  console.log(`${c.path} box=[${l.toFixed(0)}..${r.toFixed(0)}, ${btm.toFixed(0)}..${top.toFixed(0)}] parent=${parent.size[0]}x${parent.size[1]} ${msgs.join(" ") || "inside"}`);
}

console.log("\n=== L023 remaining from lint (Crafting etc) ===");
const lintPairs = [
  "CraftingPopup/Title",
  "ShopPopup/Bg/Title",
  "SkillTreePopup/Bg/Title",
  "CollectionPopup/Title",
  "RequestPopup/Bg/Title",
  "ResearchPopup/Bg/Title",
];
for (const p of lintPairs) {
  const e = find("/ui/PopupGroup/" + p);
  if (e) console.log(p, `"${e.textVal}"`, e.size[0] + "x" + e.size[1]);
}
