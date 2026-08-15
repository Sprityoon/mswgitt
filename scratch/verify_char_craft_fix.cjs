"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.load(path.resolve(__dirname, "../ui/PopupGroup.ui"));

console.log("silhouette", !!b.find("CharacterPopup/EquipPanel/Silhouette"));
console.log("slots", ["SlotArmor","SlotWeapon","SlotHelmet","SlotGloves","SlotShield","SlotShoes"].map((n) => n + "=" + !!b.find("CharacterPopup/EquipPanel/"+n)).join(" "));

const UT = "MOD.Core.UITransformComponent";
function ut(p) {
  const e = b.find(p);
  const c = (e.jsonString["@components"] || []).find((x) => x["@type"] === UT);
  const xy = (v, fb) => [Number(v?.x ?? fb), Number(v?.y ?? fb)];
  return { pos: xy(c.anchoredPosition, 0), size: xy(c.RectSize, 0), pivot: xy(c.Pivot, 0.5), mn: xy(c.AnchorsMin, 0.5), mx: xy(c.AnchorsMax, 0.5), do: Number(e.jsonString.displayOrder ?? 0) };
}
function localBox(child, parent) {
  const ax = (child.mn[0] + child.mx[0]) / 2;
  const ay = (child.mn[1] + child.mx[1]) / 2;
  const originX = (ax - parent.pivot[0]) * parent.size[0];
  const originY = (ay - parent.pivot[1]) * parent.size[1];
  const cx = originX + child.pos[0];
  const cy = originY + child.pos[1];
  const w = child.mn[0] !== child.mx[0] ? (child.mx[0] - child.mn[0]) * parent.size[0] : child.size[0];
  const h = child.mn[1] !== child.mx[1] ? (child.mx[1] - child.mn[1]) * parent.size[1] : child.size[1];
  return { l: cx - child.pivot[0] * w, r: cx - child.pivot[0] * w + w, b: cy - child.pivot[1] * h, t: cy - child.pivot[1] * h + h };
}
function overlap(a, b) {
  const ox = Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l));
  const oy = Math.max(0, Math.min(a.t, b.t) - Math.max(a.b, b.b));
  return ox > 0.5 && oy > 0.5 ? [ox, oy] : null;
}

const popup = ut("CraftingPopup");
popup.size = [1000, 780];
const title = ut("CraftingPopup/Title");
const tier = ut("CraftingPopup/TierBar");
const cat = ut("CraftingPopup/CategoryBar");
const list = ut("CraftingPopup/List");
const details = ut("CraftingPopup/Details");
const tBox = localBox(title, popup);
const tierBox = localBox(tier, popup);
const catBox = localBox(cat, popup);
const listBox = localBox(list, popup);
console.log("title dOrd", title.do, "AABB", tBox);
console.log("tier AABB", tierBox, "overlap title", overlap(tBox, tierBox));
console.log("cat AABB", catBox, "overlap title", overlap(tBox, catBox), "overlap list", overlap(catBox, listBox));

const det = ut("CraftingPopup/Details");
const name = ut("CraftingPopup/Details/Name");
const icon = ut("CraftingPopup/Details/Icon");
const desc = ut("CraftingPopup/Details/Desc");
const s1 = ut("CraftingPopup/Details/Slot1");
const btn = ut("CraftingPopup/Details/BtnCraft");
const hint = ut("CraftingPopup/Details/UnlockHint");
const nB = localBox(name, det);
const iB = localBox(icon, det);
const dB = localBox(desc, det);
const sB = localBox(s1, det);
const bB = localBox(btn, det);
const hB = localBox(hint, det);
console.log("name", nB, "icon", iB, "desc", dB, "slot1", sB, "btn", bB, "hint", hB);
console.log("name∩icon", overlap(nB, iB), "icon∩desc", overlap(iB, dB), "desc∩slot", overlap(dB, sB), "desc∩btn", overlap(dB, bB), "hint∩slot", overlap(hB, sB), "slot∩btn", overlap(sB, bB));
console.log("desc dOrd", desc.do, "slot dOrd", s1.do);
