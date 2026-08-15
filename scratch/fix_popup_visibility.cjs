/**
 * 팝업 가시성 복구 — displayOrder + 의뢰/연구 Bg 틴트만.
 * 워프 Title/Close 좌표·앵커는 건드리지 않는다.
 */
const path = require("path");
const { UIBuilder } = require(path.resolve(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const UI = "ui/PopupGroup.ui";
const b = UIBuilder.load(UI);
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const CARD_BG = { r: 0.2, g: 0.1, b: 0.1, a: 1 };

function setDord(p, n) {
  if (!b.find(p)) throw new Error("missing " + p);
  b.patch(p, { display_order: n });
}

for (const name of ["InventoryPopup", "CraftingPopup", "CollectionPopup", "QuestPopup", "CharacterPopup"]) {
  setDord(name + "/BtnClose", 20);
}

const STD = [15, 16, 17, 20];
const cards = [
  ["RequestPopup", STD],
  ["ResearchPopup", STD],
  ["ShopPopup", STD],
  ["WarpPopup", STD],
  ["PermissionPopup", STD],
  ["ChestPopup", STD],
  ["FurnacePopup", STD],
  ["SkillTreePopup", [25, 26, 27, 30]],
];
for (const [name, ord] of cards) {
  setDord(name + "/Bg/TopBar", ord[0]);
  setDord(name + "/Bg/AccentLine", ord[1]);
  setDord(name + "/Bg/Title", ord[2]);
  setDord(name + "/Bg/BtnClose", ord[3]);
}

b.patchComponent("RequestPopup/Bg", SPR, { Color: CARD_BG });
b.patchComponent("ResearchPopup/Bg", SPR, { Color: CARD_BG });

b.write(UI);
console.log("patched close/title/topbar z + request/research tint");
