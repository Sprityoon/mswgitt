/**
 * Character: EquipPanel/Silhouette 삭제 (슬롯 사이 플레이스홀더 박스).
 * Crafting: 제목↔티어바 겹침, 설명↔재료슬롯 겹침 해소.
 */
const path = require("path");
const { UIBuilder } = require(path.resolve(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const UI = "ui/PopupGroup.ui";
const b = UIBuilder.load(UI);

function must(p) {
  if (!b.find(p)) throw new Error("missing " + p);
}

must("CharacterPopup/EquipPanel/Silhouette");
b.remove("CharacterPopup/EquipPanel/Silhouette");

// 제목 dOrd 2 < TierBar 5 → 어두운 바가 "제작대"를 덮음. 기하 겹침도 20px.
must("CraftingPopup/Title");
b.patch("CraftingPopup/Title", { display_order: 10 });
must("CraftingPopup/TierBar");
b.patch("CraftingPopup/TierBar", { pos: [-60, -80] });
must("CraftingPopup/CategoryBar");
b.patch("CraftingPopup/CategoryBar", { pos: [-60, -128] });
must("CraftingPopup/List");
b.patch("CraftingPopup/List", { pos: [-230, -56] });
must("CraftingPopup/Details");
b.patch("CraftingPopup/Details", { pos: [230, -56] });

// Details 로컬: Name[166,210] / Icon[54,154] / Desc[-38,42] / Slot[-150,-50] / Btn[-226,-166]
must("CraftingPopup/Details/Icon");
b.patch("CraftingPopup/Details/Icon", { pos: [0, -96], rect_size: [100, 100], pivot: [0.5, 1] });
must("CraftingPopup/Details/Desc");
b.patch("CraftingPopup/Details/Desc", { pos: [0, -208], rect_size: [360, 80], pivot: [0.5, 1], display_order: 5 });
must("CraftingPopup/Details/Slot1");
b.patch("CraftingPopup/Details/Slot1", { pos: [-70, 100] });
must("CraftingPopup/Details/Slot2");
b.patch("CraftingPopup/Details/Slot2", { pos: [70, 100] });
must("CraftingPopup/Details/BtnCraft");
b.patch("CraftingPopup/Details/BtnCraft", { pos: [0, 24] });
must("CraftingPopup/Details/UnlockHint");
b.patch("CraftingPopup/Details/UnlockHint", { anchor: "top-center", pos: [0, -250], rect_size: [360, 36], pivot: [0.5, 1] });

b.write(UI);
console.log("silhouette removed; crafting title/desc unobscured");
