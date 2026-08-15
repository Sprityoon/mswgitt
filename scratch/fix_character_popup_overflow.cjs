/**
 * CharacterPopup overflow — 장착 아이콘 400px + StatsPanel 자식 x=180(top-left)만 수정.
 * 크롬/창 크기/워프/다른 팝업은 건드리지 않는다.
 */
const path = require("path");
const { UIBuilder } = require(path.resolve(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const UI = "ui/PopupGroup.ui";
const b = UIBuilder.load(UI);

function must(p) {
  if (!b.find(p)) throw new Error("missing " + p);
}

// 장착칸 아이콘: 런타임 ImageRUID가 400×48 전체를 채워 창 왼쪽으로 나감
for (const p of [
  "CharacterPopup/EquipPanel/SlotArmor/Icon",
  "CharacterPopup/EquipPanel/SlotWeapon/Icon",
]) {
  must(p);
  b.patch(p, { pos: [0, 0], rect_size: [48, 48], pivot: [0.5, 0.5] });
}

must("CharacterPopup/EquipPanel/SlotHelmet/Label");
b.patch("CharacterPopup/EquipPanel/SlotHelmet/Label", { pos: [0, -42], rect_size: [80, 20], pivot: [0.5, 0.5] });

must("CharacterPopup/EquipPanel/Silhouette/Text");
b.patch("CharacterPopup/EquipPanel/Silhouette/Text", { pos: [0, 0], rect_size: [150, 34], pivot: [0.5, 0.5] });

// Name과 같은 top-left(0,1) + x=20. 기존 x=180은 중심 좌표로 오인
const bars = [
  ["CharacterPopup/StatsPanel/HP", -90],
  ["CharacterPopup/StatsPanel/Stamina", -130],
  ["CharacterPopup/StatsPanel/XP", -170],
];
for (const [p, y] of bars) {
  must(p);
  b.patch(p, { pos: [20, y], rect_size: [320, 24], pivot: [0, 1] });
}

for (const p of [
  "CharacterPopup/StatsPanel/HP/Text",
  "CharacterPopup/StatsPanel/Stamina/Text",
  "CharacterPopup/StatsPanel/XP/Text",
]) {
  must(p);
  b.patch(p, { pos: [0, 0], rect_size: [320, 24], pivot: [0.5, 0.5] });
}

must("CharacterPopup/StatsPanel/BtnPermission");
b.patch("CharacterPopup/StatsPanel/BtnPermission", { pos: [0, -420], rect_size: [240, 46], pivot: [0.5, 1] });

b.write(UI);
console.log("character popup overflow patched");
