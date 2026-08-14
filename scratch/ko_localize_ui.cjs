"use strict";
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const ROOT = path.resolve(__dirname, "..");

const TEXT = {
  BAG: "가방",
  CRAFT: "제작",
  INFO: "정보",
  INTERACT: "상호작용",
  JUMP: "점프",
  "MINE/ATTACK": "채광/공격",
  Avatar: "아바타",
  Armor: "갑옷",
  Gloves: "장갑",
  Helmet: "투구",
  Shield: "방패",
  Shoes: "신발",
  Weapon: "무기",
  Attack: "공격",
  "15 (+5 from Weapon)": "15",
  Defense: "방어",
  "10 (+8 from Armor)": "10",
  "Gather Speed": "채집 속도",
  "Move Speed": "이동 속도",
  "Lv. 12 Explorer Minho": "Lv. 12 탐험가 민호",
  "Character Info": "캐릭터 정보",
  all: "전체",
  All: "전체",
  "CRAFT (Space)": "제작 (스페이스)",
  "A sturdy tool for mining ores.": "광석을 캐는 단단한 도구입니다.",
  "Stone Pickaxe": "돌 곡괭이",
  "Crafting Table": "제작대",
  "Fuel: 0.0s": "연료: 0.0초",
  Furnace: "화로",
  "0 / 24 items": "0 / 24개",
  Equipment: "장비",
  Resources: "자원",
  Inventory: "가방",
  "Guest Name": "손님 이름",
};

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}

function patchFile(rel) {
  const file = path.join(ROOT, rel);
  const b = UIBuilder.load(file);
  let n = 0;
  for (const row of b.listEntities()) {
    const e = b.find(row.path);
    const tgr = findComp(e, "MOD.Core.TextGUIRendererComponent");
    const tc = findComp(e, "MOD.Core.TextComponent");
    const raw = (tgr?.Text || tc?.Text || "").trim();
    const next = TEXT[raw];
    if (!next || next === raw) continue;
    const ident = row.path.replace(/^\/ui\/[^/]+\//, "");
    if (tgr) b.patchComponent(ident, "MOD.Core.TextGUIRendererComponent", { Text: next });
    if (tc) b.patchComponent(ident, "MOD.Core.TextComponent", { Text: next });
    n++;
    console.log(rel, ident, JSON.stringify(raw), "→", JSON.stringify(next));
  }
  if (n === 0) {
    console.log(rel, "no text patches");
    return;
  }
  b.write(file);
  console.log(rel, "patched=" + n);
}

patchFile("ui/PopupGroup.ui");
patchFile("ui/HUDGroup.ui");
console.log("ui done");
