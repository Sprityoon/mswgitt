/**
 * 팝업 13창 크롬/z/겹침 감사 (읽기 전용).
 * 정책: design-policy §5 — 닫기 dOrd 20(스킬 30), Title > TopBar.
 */
const path = require("path");
const { UIBuilder } = require(path.resolve(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const b = UIBuilder.read("ui/PopupGroup.ui");
const TF = "MOD.Core.UITransformComponent";
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const TG = "MOD.Core.TextGUIRendererComponent";
const TL = "MOD.Core.TextComponent";

const PAPER = ["InventoryPopup", "CraftingPopup", "CollectionPopup", "QuestPopup", "CharacterPopup"];
const CARDS = [
  { name: "RequestPopup", close: "Bg/BtnClose", title: "Bg/Title", want: [15, 16, 17, 20] },
  { name: "ResearchPopup", close: "Bg/BtnClose", title: "Bg/Title", want: [15, 16, 17, 20] },
  { name: "ShopPopup", close: "Bg/BtnClose", title: "Bg/Title", want: [15, 16, 17, 20] },
  { name: "WarpPopup", close: "Bg/BtnClose", title: "Bg/Title", want: [15, 16, 17, 20] },
  { name: "PermissionPopup", close: "Bg/BtnClose", title: "Bg/Title", want: [15, 16, 17, 20] },
  { name: "ChestPopup", close: "Bg/BtnClose", title: "Bg/Title", want: [15, 16, 17, 20] },
  { name: "FurnacePopup", close: "Bg/BtnClose", title: "Bg/Title", want: [15, 16, 17, 20] },
  { name: "SkillTreePopup", close: "Bg/BtnClose", title: "Bg/Title", want: [25, 26, 27, 30] },
];

function dord(p) {
  const f = b.find(p);
  return f && f.jsonString ? Number(f.jsonString.displayOrder) : null;
}
function tf(p) {
  return b.getComponent(p, TF);
}
function ruid(p) {
  const s = b.getComponent(p, SPR);
  if (!s || !s.ImageRUID) return "";
  return typeof s.ImageRUID === "object" ? s.ImageRUID.DataId || "" : String(s.ImageRUID);
}
function txt(p) {
  const g = b.getComponent(p, TG);
  const l = b.getComponent(p, TL);
  return (g && g.Text) || (l && l.Text) || "";
}
function color(p) {
  const s = b.getComponent(p, SPR);
  if (!s || !s.Color) return null;
  const c = s.Color;
  return [c.r, c.g, c.b, c.a].map((n) => Number(n).toFixed(2)).join(",");
}
function localBox(p) {
  const t = tf(p);
  if (!t || !t.anchoredPosition || !t.RectSize) return null;
  const px = t.Pivot ? t.Pivot.x : 0.5;
  const py = t.Pivot ? t.Pivot.y : 0.5;
  const x = t.anchoredPosition.x;
  const y = t.anchoredPosition.y;
  const w = t.RectSize.x;
  const h = t.RectSize.y;
  return { l: x - px * w, r: x + (1 - px) * w, b: y - py * h, t: y + (1 - py) * h, w, h, x, y };
}
function overlap(a, c) {
  if (!a || !c) return false;
  return a.l < c.r && a.r > c.l && a.b < c.t && a.t > c.b;
}
function overflowParent(childPath, parentPath) {
  const c = localBox(childPath);
  const p = localBox(parentPath);
  if (!c || !p) return null;
  // child is in parent-local space; parent box is also parent-local around its own pivot.
  // Compare child extents to parent half-size in parent local (center-ish).
  const halfW = p.w / 2;
  const halfH = p.h / 2;
  const out = [];
  if (c.l < -halfW - 1) out.push("left+" + ( -halfW - c.l).toFixed(1));
  if (c.r > halfW + 1) out.push("right+" + (c.r - halfW).toFixed(1));
  if (c.b < -halfH - 1) out.push("bottom+" + (-halfH - c.b).toFixed(1));
  if (c.t > halfH + 1) out.push("top+" + (c.t - halfH).toFixed(1));
  return out.length ? out.join(",") : null;
}

const issues = [];
function issue(msg) {
  issues.push(msg);
  console.log("ISSUE  " + msg);
}

console.log("=== PAPER ===");
for (const name of PAPER) {
  const close = name + "/BtnClose";
  const title = name + "/Title";
  const closeD = dord(close);
  const titleD = dord(title);
  const t = tf(close);
  console.log(name, "close dOrd=" + closeD, "size=" + (t && t.RectSize && t.RectSize.x), "ruid=" + ruid(close).slice(0, 8), "title=" + JSON.stringify(txt(title)), "titleD=" + titleD);
  if (closeD == null || closeD < 20) issue(name + " BtnClose dOrd=" + closeD + " < 20");
  if (t && t.RectSize && (t.RectSize.x !== 88 || t.RectSize.y !== 88)) issue(name + " BtnClose size not 88x88");
  if (ruid(close).slice(0, 8) !== "221e0368") issue(name + " BtnClose ruid " + ruid(close).slice(0, 8));
}

const craftClose = localBox("CraftingPopup/BtnClose");
for (const bar of ["CraftingPopup/TierBar", "CraftingPopup/CategoryBar"]) {
  const barD = dord(bar);
  const closeD = dord("CraftingPopup/BtnClose");
  const ov = overlap(craftClose, localBox(bar));
  console.log("craft", bar, "dOrd=" + barD, "overlapClose=" + ov);
  if (ov && barD != null && closeD != null && barD >= closeD) issue(bar + " covers BtnClose (dOrd " + barD + ">=" + closeD + ")");
}

console.log("\n=== CARDS ===");
for (const card of CARDS) {
  const top = card.name + "/Bg/TopBar";
  const acc = card.name + "/Bg/AccentLine";
  const title = card.name + "/" + card.title;
  const close = card.name + "/" + card.close;
  const [wt, wa, wti, wc] = card.want;
  console.log(card.name, "TopBar=" + dord(top), "Accent=" + dord(acc), "Title=" + dord(title), "Close=" + dord(close), "want", card.want.join("/"), "bgCol=" + color(card.name + "/Bg"), "title=" + JSON.stringify(txt(title)));
  if (dord(title) != null && dord(top) != null && dord(title) <= dord(top)) {
    issue(card.name + " Title dOrd " + dord(title) + " <= TopBar " + dord(top));
  }
  if (dord(close) != null && dord(top) != null && dord(close) <= dord(top)) {
    issue(card.name + " Close dOrd " + dord(close) + " <= TopBar " + dord(top));
  }
  if (dord(close) != null && dord(close) < wc) issue(card.name + " Close dOrd=" + dord(close) + " < " + wc);
  if (dord(title) != null && dord(title) < wti) issue(card.name + " Title dOrd=" + dord(title) + " < " + wti);
}

const innerChecks = [
  ["CollectionPopup/Bg/Inner", "CollectionPopup/ListScroll"],
  ["CollectionPopup/Bg/Inner", "CollectionPopup/CategoryBar"],
  ["QuestPopup/Bg/Inner", "QuestPopup/ListScroll"],
  ["QuestPopup/Bg/Inner", "QuestPopup/Details"],
  ["CraftingPopup", "CraftingPopup/TierBar"],
  ["CraftingPopup", "CraftingPopup/CategoryBar"],
  ["CraftingPopup", "CraftingPopup/List"],
  ["InventoryPopup", "InventoryPopup/TabAll"],
  ["InventoryPopup", "InventoryPopup/TabEquip"],
];
console.log("\n=== OVERFLOW vs parent ===");
for (const [parent, child] of innerChecks) {
  if (!b.find(parent) || !b.find(child)) continue;
  const ov = overflowParent(child, parent);
  console.log(child, "vs", parent, ov || "ok");
  if (ov) issue(child + " overflows " + parent + " " + ov);
}

const questHint = localBox("QuestPopup/Details/DetailHint");
const questSlot = localBox("QuestPopup/Details/RewardSlot1");
if (overlap(questHint, questSlot)) issue("Quest DetailHint overlaps RewardSlot1");
const icon = tf("QuestPopup/Details/RewardSlot1/Icon");
if (icon && icon.anchoredPosition && (icon.anchoredPosition.x !== 0 || icon.anchoredPosition.y !== 0)) {
  issue("Quest reward Icon not at (0,0)");
}

console.log("\n=== SUMMARY issues=" + issues.length + " ===");
issues.forEach((m, i) => console.log(String(i + 1) + ". " + m));
