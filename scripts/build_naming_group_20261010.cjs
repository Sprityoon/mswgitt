// 동물 이름짓기 팝업 ui/NamingGroup.ui 생성 (2026-10-10).
// 나무 카드 계열 크롬(design-policy §5: Bg 4fea64a3 (0.2,0.1,0.1) + TopBar 56 (0.1,0.1,0.1) + 골드 AccentLine 3px + 제목 fs26 크림).
// 글자는 스프라이트 엔티티에 직접 얹는다(pitfalls #50), 배경을 먼저 만들어 글자를 덮지 않게 한다(#47),
// 모달은 .ui 에서 Enable=false(#30), 전체화면 덮개는 3840×2160(#43), Mask 미사용(#49).
// 실행: node scripts/build_naming_group_20261010.cjs  (저장소 루트에서)
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const WOOD = "4fea64a3307cda641809ad8be0d4890b";
const OUT = path.join(__dirname, "..", "ui", "NamingGroup.ui");
const MLUA = path.join(__dirname, "..", "RootDesk", "MyDesk", "UI", "Scripts", "UINamingLogic.mlua");

// 그룹 순서 9: Popup 3 · Anvil 4 · Dialog 5 · Tooltip 6 · Transition 7 · MainMenu 8 보다 위.
const b = new UIBuilder("NamingGroup", 9, true);

b.empty("Modal", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], enable: false });
b.sprite("Modal/Dimmer", { anchor: "middle-center", rect_size: [3840, 2160], color: "#000000", alpha: 0.55, raycast: true });
b.sprite("Modal/Window", {
  anchor: "middle-center", rect_size: [600, 400], image_ruid: WOOD, sprite_type: 0,
  color: { r: 0.2, g: 0.1, b: 0.1, a: 1 }, raycast: true,
});
b.sprite("Modal/Window/Inner", {
  anchor: "middle-center", pos: [0, -28], rect_size: [572, 316], image_ruid: WOOD, sprite_type: 0,
  color: { r: 0.2275, g: 0.2, b: 0.1686, a: 1 },
});
b.sprite("Modal/Window/TopBar", {
  anchor: "top-center", pos: [0, 0], rect_size: [600, 56], image_ruid: WOOD, sprite_type: 0,
  color: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
  text: "이름 짓기", text_size: 26, text_color: { r: 1, g: 0.9, b: 0.7, a: 1 }, text_alignment: 4,
});
b.sprite("Modal/Window/AccentLine", {
  anchor: "top-center", pos: [0, -56], rect_size: [600, 3], image_ruid: WOOD, sprite_type: 0,
  color: { r: 0.9, g: 0.7, b: 0.2, a: 1 },
});
b.sprite("Modal/Window/Message", {
  anchor: "top-center", pos: [0, -84], rect_size: [540, 48], image_ruid: WOOD, sprite_type: 0,
  color: { r: 0.141, g: 0.122, b: 0.102, a: 0.6 },
  text: "새 친구에게 이름을 지어 주세요 (8자까지)", text_size: 24,
  text_color: { r: 0.79, g: 0.75, b: 0.70, a: 1 }, text_alignment: 4,
});
b.textInput("Modal/Window/NameInput", {
  placeholder: "이름 (최대 8자)", char_limit: 8, content_type: 0, line_type: 0, font_size: 30, color: "#FFFFFF",
  bg_color: { r: 0.141, g: 0.122, b: 0.102, a: 0.95 }, image_ruid: WOOD, sprite_type: 0,
  anchor: "middle-center", pos: [0, -6], rect_size: [440, 76],
});
b.button("Modal/Window/BtnOk", "확인", {
  anchor: "bottom-center", pos: [-115, 26], rect_size: [200, 88], font_size: 28,
  color: { r: 0.118, g: 0.102, b: 0.086, a: 1 }, bg_color: { r: 0.941, g: 0.659, b: 0.188, a: 1 },
  image_ruid: WOOD, sprite_type: 0,
});
b.button("Modal/Window/BtnCancel", "취소", {
  anchor: "bottom-center", pos: [115, 26], rect_size: [200, 88], font_size: 28,
  color: { r: 0.96, g: 0.94, b: 0.9, a: 1 }, bg_color: { r: 0.35, g: 0.3, b: 0.25, a: 1 },
  image_ruid: WOOD, sprite_type: 0,
});

b.write(OUT, {
  lint_verbose: true,
  bind: {
    mlua: MLUA,
    props: {
      modal: "Modal",
      titleText: "Modal/Window/TopBar",
      messageText: "Modal/Window/Message",
      nameInput: "Modal/Window/NameInput",
      btnOk: "Modal/Window/BtnOk",
      btnCancel: "Modal/Window/BtnCancel",
    },
  },
});
console.log("NamingGroup written");
