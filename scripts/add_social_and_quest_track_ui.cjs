// Phase 23-B UI 구축 (UIBuilder 전용 — .ui 직접 편집 금지)
//  1) QuestPopup 상세 하단에 [추적] 토글 버튼 추가 (+ 기존 [포기] 버튼 좌측 재배치)
//  2) PlayerInteractPopup — 타 유저 클릭 인터랙션 메뉴 (귓속말 / 내 영지로 초대)
//  3) EstateInvitePopup  — 영지 초대 수신 팝업 (수락 / 거절)
//
// 크롬은 design-policy.md §5 "나무 카드" 계열을 따른다:
//   Bg 4fea64a3 (0.2,0.1,0.1) + TopBar 카드폭×56 (0.1,0.1,0.1) + 골드 AccentLine 3px
//   + 제목 (0,-8) fs26 크림(1,0.9,0.7) + 닫기 흰 X(221e0368) 88×88 (-12,-12) dOrd 20
"use strict";

const path = require("path");
const BUILDER = path.join(
  __dirname,
  "..",
  ".claude",
  "skills",
  "msw-ui-system",
  "scripts",
  "msw_ui_builder.cjs"
);
const { UIBuilder } = require(BUILDER);

const UI_PATH = path.join(__dirname, "..", "ui", "PopupGroup.ui");

const WOOD = "4fea64a3307cda641809ad8be0d4890b"; // 나무 카드 배경
const CLOSE_X = "221e0368e59b4a5981903eb78ac7513d"; // 공통 흰 X 닫기

const CARD_BG = { r: 0.2, g: 0.1, b: 0.1, a: 1 };
const TOPBAR_BG = { r: 0.1, g: 0.1, b: 0.1, a: 1 };
const ACCENT = { r: 0.9, g: 0.7, b: 0.2, a: 1 };
const TITLE_COLOR = "#FFE6B3"; // 크림 (1, 0.9, 0.7)
const BODY_COLOR = "#F0E8BF"; // 본문 크림 (0.94, 0.91, 0.75)
const HINT_COLOR = "#C9C0B4";

const BTN_BROWN = { r: 0.35, g: 0.18, b: 0.14, a: 0.95 };
const BTN_GREEN = { r: 0.2, g: 0.3, b: 0.18, a: 0.95 };

// 기존 팝업 버튼(BtnAbandon)과 동일한 골드 호버 ColorTint (design-policy "버튼 호버")
const BTN_COLORS = {
  NormalColor: { r: 1, g: 1, b: 1, a: 1 },
  HighlightedColor: { r: 1, g: 0.82, b: 0.38, a: 1 },
  PressedColor: { r: 0.62, g: 0.55, b: 0.42, a: 1 },
  SelectedColor: { r: 1, g: 1, b: 1, a: 1 },
  DisabledColor: { r: 0.78, g: 0.78, b: 0.78, a: 0.5 },
  ColorMultiplier: 1,
  FadeDuration: 0.08,
};

const b = UIBuilder.load(UI_PATH);

function styleButton(p) {
  b.patchComponent(p, "MOD.Core.ButtonComponent", {
    Colors: BTN_COLORS,
    Transition: 1,
  });
}

/** 나무 카드 크롬(TopBar + AccentLine + 제목 + 닫기)을 한 카드에 붙인다. */
function woodCardChrome(cardPath, width, title) {
  b.sprite(`${cardPath}/TopBar`, {
    anchor: "top-center",
    pos: [0, 0],
    rect_size: [width, 56],
    image_ruid: WOOD,
    sprite_type: 0,
    color: TOPBAR_BG,
  });
  b.sprite(`${cardPath}/AccentLine`, {
    anchor: "top-center",
    pos: [0, -56],
    rect_size: [width, 3],
    image_ruid: WOOD,
    sprite_type: 0,
    color: ACCENT,
  });
  b.text(`${cardPath}/Title`, title, {
    anchor: "top-center",
    pos: [0, -8],
    rect_size: [width - 60, 40],
    size: 26,
    bold: true,
    color: TITLE_COLOR,
    alignment: 4,
  });
  b.button(`${cardPath}/BtnClose`, "", {
    anchor: "top-right",
    pos: [-12, -12],
    rect_size: [88, 88],
    image_ruid: CLOSE_X,
    sprite_type: 0,
    bg_color: { r: 1, g: 1, b: 1, a: 1 },
  });
  b.patch(`${cardPath}/BtnClose`, { display_order: 20 });
  styleButton(`${cardPath}/BtnClose`);
}

// ─────────────────────────────────────────────────────────────
// 1) 퀘스트 로그 상세 — [포기] 좌 / [추적] 우
// ─────────────────────────────────────────────────────────────
b.patch("QuestPopup/Details/BtnAbandon", { pos: [-105, 16] });
b.button("QuestPopup/Details/BtnTrack", "추적", {
  anchor: "bottom-center",
  pos: [105, 16],
  rect_size: [200, 88],
  pivot: [0.5, 0],
  font_size: 22,
  color: BODY_COLOR,
  bg_color: BTN_GREEN,
  sprite_type: 1,
  image_ruid: WOOD,
  enable: false,
});
b.patch("QuestPopup/Details/BtnTrack", { display_order: 11 });
styleButton("QuestPopup/Details/BtnTrack");

// ─────────────────────────────────────────────────────────────
// 2) 타 유저 클릭 인터랙션 메뉴
//    루트는 항상 Enable (화면 터치 리스너 유지), 표시는 Card 토글.
// ─────────────────────────────────────────────────────────────
b.script("PlayerInteractPopup", "script.UIPlayerInteractController", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [800, 700],
});
b.patch("PlayerInteractPopup", { display_order: 13 });

b.panel("PlayerInteractPopup/Card", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [340, 380],
  image_ruid: WOOD,
  sprite_type: 0,
  color: CARD_BG,
  raycast: true,
  enable: false,
});
woodCardChrome("PlayerInteractPopup/Card", 340, "플레이어");

b.text("PlayerInteractPopup/Card/TargetName", "", {
  anchor: "top-center",
  pos: [0, -76],
  rect_size: [300, 36],
  size: 24,
  bold: true,
  color: BODY_COLOR,
  alignment: 4,
});
b.text("PlayerInteractPopup/Card/Hint", "", {
  anchor: "top-center",
  pos: [0, -116],
  rect_size: [300, 48],
  size: 18,
  color: HINT_COLOR,
  alignment: 4,
});
b.button("PlayerInteractPopup/Card/BtnWhisper", "귓속말", {
  anchor: "bottom-center",
  pos: [0, 116],
  rect_size: [280, 88],
  font_size: 22,
  color: BODY_COLOR,
  bg_color: BTN_BROWN,
  sprite_type: 1,
  image_ruid: WOOD,
});
styleButton("PlayerInteractPopup/Card/BtnWhisper");
b.button("PlayerInteractPopup/Card/BtnInvite", "내 영지로 초대", {
  anchor: "bottom-center",
  pos: [0, 20],
  rect_size: [280, 88],
  font_size: 22,
  color: BODY_COLOR,
  bg_color: BTN_GREEN,
  sprite_type: 1,
  image_ruid: WOOD,
});
styleButton("PlayerInteractPopup/Card/BtnInvite");

// ─────────────────────────────────────────────────────────────
// 3) 영지 초대 수신 팝업
// ─────────────────────────────────────────────────────────────
b.script("EstateInvitePopup", "script.UIEstateInviteController", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [800, 700],
});
b.patch("EstateInvitePopup", { display_order: 14 });

b.panel("EstateInvitePopup/Card", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [440, 300],
  image_ruid: WOOD,
  sprite_type: 0,
  color: CARD_BG,
  raycast: true,
  enable: false,
});
woodCardChrome("EstateInvitePopup/Card", 440, "영지 초대");

b.text("EstateInvitePopup/Card/Message", "", {
  anchor: "top-center",
  pos: [0, -84],
  rect_size: [400, 88],
  size: 20,
  color: BODY_COLOR,
  alignment: 4,
});
b.button("EstateInvitePopup/Card/BtnAccept", "수락", {
  anchor: "bottom-center",
  pos: [-100, 24],
  rect_size: [180, 88],
  font_size: 22,
  color: BODY_COLOR,
  bg_color: BTN_GREEN,
  sprite_type: 1,
  image_ruid: WOOD,
});
styleButton("EstateInvitePopup/Card/BtnAccept");
b.button("EstateInvitePopup/Card/BtnDecline", "거절", {
  anchor: "bottom-center",
  pos: [100, 24],
  rect_size: [180, 88],
  font_size: 22,
  color: BODY_COLOR,
  bg_color: BTN_BROWN,
  sprite_type: 1,
  image_ruid: WOOD,
});
styleButton("EstateInvitePopup/Card/BtnDecline");

b.write(UI_PATH);
console.log("[OK] PopupGroup.ui updated (BtnTrack + PlayerInteractPopup + EstateInvitePopup)");
