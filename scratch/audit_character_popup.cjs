"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = path.resolve(__dirname, "../ui/PopupGroup.ui");
const b = UIBuilder.load(UI);
const UT = "MOD.Core.UITransformComponent";

function ut(p) {
  const e = b.find(p);
  if (!e) return null;
  const c = (e.jsonString["@components"] || []).find((x) => x["@type"] === UT);
  const xy = (v, fb) => [Number(v?.x ?? fb), Number(v?.y ?? fb)];
  return {
    path: p,
    name: e.jsonString.name,
    do: Number(e.jsonString.displayOrder ?? 0),
    pos: xy(c.anchoredPosition, 0),
    size: xy(c.RectSize, 0),
    pivot: xy(c.Pivot, 0.5),
    mn: xy(c.AnchorsMin, 0.5),
    mx: xy(c.AnchorsMax, 0.5),
    omin: xy(c.OffsetMin, 0),
    omax: xy(c.OffsetMax, 0),
  };
}

function localBox(child, parent) {
  const pSize = parent.size;
  const pPivot = parent.pivot;
  const ax = (child.mn[0] + child.mx[0]) / 2;
  const ay = (child.mn[1] + child.mx[1]) / 2;
  const stretchX = child.mn[0] !== child.mx[0];
  const stretchY = child.mn[1] !== child.mx[1];
  const originX = (ax - pPivot[0]) * pSize[0];
  const originY = (ay - pPivot[1]) * pSize[1];
  const cx = originX + child.pos[0];
  const cy = originY + child.pos[1];
  const w = stretchX ? (child.mx[0] - child.mn[0]) * pSize[0] + (child.omax[0] - child.omin[0]) : child.size[0];
  const h = stretchY ? (child.mx[1] - child.mn[1]) * pSize[1] + (child.omax[1] - child.omin[1]) : child.size[1];
  return { l: cx - child.pivot[0] * w, r: cx - child.pivot[0] * w + w, b: cy - child.pivot[1] * h, t: cy - child.pivot[1] * h + h, w, h, cx, cy };
}

function boxVs(name, box, parentBox, parentName) {
  const dxL = parentBox.l - box.l;
  const dxR = box.r - parentBox.r;
  const dyB = parentBox.b - box.b;
  const dyT = box.t - parentBox.t;
  const issues = [];
  if (dxL > 0.5) issues.push(`left ${dxL.toFixed(1)}px past ${parentName}`);
  if (dxR > 0.5) issues.push(`right ${dxR.toFixed(1)}px past ${parentName}`);
  if (dyB > 0.5) issues.push(`bottom ${dyB.toFixed(1)}px past ${parentName}`);
  if (dyT > 0.5) issues.push(`top ${dyT.toFixed(1)}px past ${parentName}`);
  const line = `${name} AABB [${box.l.toFixed(0)},${box.b.toFixed(0)}]-[${box.r.toFixed(0)},${box.t.toFixed(0)}] ${issues.length ? "ISSUE " + issues.join("; ") : "ok"}`;
  console.log(line);
  return issues;
}

function dump(p) {
  const e = ut(p);
  const a = e.mn[0] === e.mx[0] && e.mn[1] === e.mx[1] ? `fix(${e.mn[0]},${e.mn[1]})` : `stretch ${e.mn}->${e.mx}`;
  console.log(`${p} pos=${e.pos} size=${e.size} pivot=${e.pivot} ${a} omin=${e.omin} omax=${e.omax} dOrd=${e.do}`);
  return e;
}

const root = dump("CharacterPopup");
const rootBox = { l: -root.size[0] * root.pivot[0], r: root.size[0] * (1 - root.pivot[0]), b: -root.size[1] * root.pivot[1], t: root.size[1] * (1 - root.pivot[1]) };
console.log("CharacterPopup local", rootBox);
console.log("");

const kids = [
  "CharacterPopup/Bg",
  "CharacterPopup/Paper",
  "CharacterPopup/Title",
  "CharacterPopup/BtnClose",
  "CharacterPopup/EquipPanel",
  "CharacterPopup/StatsPanel",
];
const by = { CharacterPopup: { e: root, box: rootBox } };
for (const p of kids) {
  const e = dump(p);
  const box = localBox(e, root);
  by[p] = { e, box };
  boxVs(p, box, rootBox, "CharacterPopup");
}

console.log("\n=== EquipPanel children vs EquipPanel ===");
const equipKids = [
  "CharacterPopup/EquipPanel/Silhouette",
  "CharacterPopup/EquipPanel/SlotArmor",
  "CharacterPopup/EquipPanel/SlotGloves",
  "CharacterPopup/EquipPanel/SlotHelmet",
  "CharacterPopup/EquipPanel/SlotShield",
  "CharacterPopup/EquipPanel/SlotShoes",
  "CharacterPopup/EquipPanel/SlotWeapon",
];
for (const p of equipKids) {
  const e = dump(p);
  const box = localBox(e, by["CharacterPopup/EquipPanel"].e);
  boxVs(p, box, by["CharacterPopup/EquipPanel"].box, "EquipPanel");
  // also vs popup in popup space
  const inPopup = {
    l: by["CharacterPopup/EquipPanel"].box.l + (box.l - (-by["CharacterPopup/EquipPanel"].e.size[0] * by["CharacterPopup/EquipPanel"].e.pivot[0])),
    r: by["CharacterPopup/EquipPanel"].box.l + (box.r - (-by["CharacterPopup/EquipPanel"].e.size[0] * by["CharacterPopup/EquipPanel"].e.pivot[0])),
    b: by["CharacterPopup/EquipPanel"].box.b + (box.b - (-by["CharacterPopup/EquipPanel"].e.size[1] * by["CharacterPopup/EquipPanel"].e.pivot[1])),
    t: by["CharacterPopup/EquipPanel"].box.b + (box.t - (-by["CharacterPopup/EquipPanel"].e.size[1] * by["CharacterPopup/EquipPanel"].e.pivot[1])),
  };
  boxVs(p + " inPopup", inPopup, rootBox, "CharacterPopup");
}

const iconPaths = [
  "CharacterPopup/EquipPanel/SlotArmor/Icon",
  "CharacterPopup/EquipPanel/SlotArmor/Label",
  "CharacterPopup/EquipPanel/SlotWeapon/Icon",
  "CharacterPopup/EquipPanel/Silhouette/Text",
];
console.log("\n=== slot icons/labels vs slot ===");
for (const p of iconPaths) {
  const parentPath = p.slice(0, p.lastIndexOf("/"));
  const pe = ut(parentPath);
  const e = dump(p);
  const box = localBox(e, pe);
  const pbox = localBox(pe, by["CharacterPopup/EquipPanel"].e);
  boxVs(p, box, { l: -pe.size[0] * pe.pivot[0], r: pe.size[0] * (1 - pe.pivot[0]), b: -pe.size[1] * pe.pivot[1], t: pe.size[1] * (1 - pe.pivot[1]) }, parentPath.split("/").pop());
}

console.log("\n=== StatsPanel children vs StatsPanel + popup ===");
const statKids = [
  "CharacterPopup/StatsPanel/Name",
  "CharacterPopup/StatsPanel/HP",
  "CharacterPopup/StatsPanel/Stamina",
  "CharacterPopup/StatsPanel/XP",
  "CharacterPopup/StatsPanel/AtkLabel",
  "CharacterPopup/StatsPanel/AtkVal",
  "CharacterPopup/StatsPanel/DefLabel",
  "CharacterPopup/StatsPanel/DefVal",
  "CharacterPopup/StatsPanel/GatherLabel",
  "CharacterPopup/StatsPanel/GatherVal",
  "CharacterPopup/StatsPanel/MoveLabel",
  "CharacterPopup/StatsPanel/MoveVal",
  "CharacterPopup/StatsPanel/BtnPermission",
];
const statsE = by["CharacterPopup/StatsPanel"].e;
const statsLocalOrigin = {
  l: -statsE.size[0] * statsE.pivot[0],
  b: -statsE.size[1] * statsE.pivot[1],
};
for (const p of statKids) {
  const e = dump(p);
  const box = localBox(e, statsE);
  boxVs(p, box, { l: -statsE.size[0] * statsE.pivot[0], r: statsE.size[0] * (1 - statsE.pivot[0]), b: -statsE.size[1] * statsE.pivot[1], t: statsE.size[1] * (1 - statsE.pivot[1]) }, "StatsPanel");
  const inPopup = {
    l: by["CharacterPopup/StatsPanel"].box.l + (box.l - statsLocalOrigin.l),
    r: by["CharacterPopup/StatsPanel"].box.l + (box.r - statsLocalOrigin.l),
    b: by["CharacterPopup/StatsPanel"].box.b + (box.b - statsLocalOrigin.b),
    t: by["CharacterPopup/StatsPanel"].box.b + (box.t - statsLocalOrigin.b),
  };
  boxVs(p + " inPopup", inPopup, rootBox, "CharacterPopup");
}
