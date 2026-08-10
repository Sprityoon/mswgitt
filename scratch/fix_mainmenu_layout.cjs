/**
 * MainMenuGroup.ui 레이아웃 정합 패치 (2026-08-10)
 *
 * 배경:
 *  - 수첩 아트(59a330fa, notebook_menu_frame_ui.png)는 1024x1024 "정사각" 이미지이고
 *    PreserveSprite=AspectOnly(1)이라 RectSize 1700x820을 줘도 실제로는 820x820 정사각으로만 그려진다.
 *    → 슬롯 카드 5장(폭 1330)이 수첩 밖으로 완전히 튀어나가 있었다 = "슬롯 모양이 이상하다".
 *  - *Plate(글자 뒤 판) 들이 displayOrder가 글자보다 높아서 글자를 "가리고" 있었고,
 *    슬롯 카드의 Title/Info Plate는 좌표까지 250px 어긋나 버튼 위를 덮고 있었다.
 *  - 거의 모든 텍스트가 Left(1)/Top(256) 정렬이라 박스 좌상단에 붙어 있었다 = "글자 배치가 이상하다".
 *
 * 방침:
 *  - 아트를 늘려서(=찌그러뜨려서) 맞추지 않는다. 정사각 페이지에 맞춰 레이아웃을 다시 짠다.
 *    · 슬롯: 세로 카드 5장 → 수첩 줄공책에 맞는 "가로 행 5줄" 리스트
 *    · 커스텀: 왼쪽 페이지=미리보기+룩 모드, 오른쪽 페이지=파츠 4행+닉네임
 *  - 종이(크림색) 위 글자는 진한 갈색으로. 키아트 위 글자만 밝은 색 + 어두운 Plate 유지.
 *
 * 좌표 산출 기준 (아트 실측):
 *  - 책 외곽    : 원본 1024px 기준 x 55~975, y 175~845
 *  - 페이지 안쪽: 원본 1024px 기준 x 120~905, y 215~790  (나무 모서리 안쪽)
 *  - 제본선     : 원본 1024px 기준 x 490~570
 */
const path = require("path");
const SKILL = path.resolve(__dirname, "..", ".claude", "skills", "msw-ui-system");
const { UIBuilder } = require(path.join(SKILL, "scripts", "msw_ui_builder.cjs"));

const UI = "ui/MainMenuGroup.ui";
const b = UIBuilder.load(UI);

const TXT = "MOD.Core.TextGUIRendererComponent";
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const INP = "MOD.Core.TextGUIRendererInputComponent";

// 종이 위 글자색 / 키아트 위 글자색
const INK = { r: 0.22, g: 0.15, b: 0.09, a: 1 };
const INK_SOFT = { r: 0.40, g: 0.31, b: 0.22, a: 1 };
const INK_RED = { r: 0.62, g: 0.16, b: 0.13, a: 1 };
const PAPER = { r: 0.97, g: 0.93, b: 0.85, a: 0.90 };
const FIELD = { r: 0.74, g: 0.64, b: 0.49, a: 0.40 };
const WOOD = { r: 0.55, g: 0.40, b: 0.26, a: 1 };
const CREAM = { r: 1, g: 0.96, b: 0.88, a: 1 };
const PLATE_DARK = { r: 0.18, g: 0.12, b: 0.08, a: 0.65 };

/** 종이 위 텍스트: 가운데/중앙 정렬 + 잉크색 + 아웃라인 제거 */
function paperText(p, { size, color = INK, h = 2, v = 512, outline = 0 } = {}) {
  b.patchComponent(p, TXT, {
    HorizontalAlignment: h,
    VerticalAlignment: v,
    FontColor: color,
    OutlineWidth: outline,
    Overflow: 1, // Ellipsis
    ...(size ? { FontSize: size, MaxSize: size, MinSize: Math.max(12, Math.round(size * 0.7)) } : {}),
  });
}

// ─────────────────────────────────────────────────────────────
// 0. TitlePanel — 힌트 문구가 Plate에 가려지던 문제 + 로고/표지판 순서
// ─────────────────────────────────────────────────────────────
b.patch("TitlePanel/SignBoard", { display_order: 0 }); // 장식은 맨 뒤
b.patch("TitlePanel/Logo", { display_order: 1 });
b.patch("TitlePanel/HintPlate", { anchor: "bottom-center", pos: [0, 42], rect_size: [760, 48], pivot: [0.5, 0], display_order: 5 });
b.patch("TitlePanel/Hint", { anchor: "bottom-center", pos: [0, 46], rect_size: [720, 40], pivot: [0.5, 0], display_order: 6 });
b.patchComponent("TitlePanel/Hint", TXT, { HorizontalAlignment: 2, VerticalAlignment: 512, Overflow: 0 });

// ─────────────────────────────────────────────────────────────
// 1. SlotPanel — 정사각 수첩 + 가로 행 5줄
//    수첩 960x960 @ (0,-40)  →  페이지 안쪽 x -367~368 / y -300~238
// ─────────────────────────────────────────────────────────────
b.patch("SlotPanel/Notebook", { anchor: "middle-center", pos: [0, -40], rect_size: [960, 960], pivot: [0.5, 0.5], display_order: 0 });

b.patch("SlotPanel/SubtitlePlate", { anchor: "middle-center", pos: [0, 380], rect_size: [620, 60], pivot: [0.5, 0.5], display_order: 1 });
b.patchComponent("SlotPanel/SubtitlePlate", SPR, { Color: PLATE_DARK, Type: 1 });
b.patch("SlotPanel/Subtitle", { anchor: "middle-center", pos: [0, 380], rect_size: [580, 48], pivot: [0.5, 0.5], display_order: 2 });
b.patchComponent("SlotPanel/Subtitle", TXT, { HorizontalAlignment: 2, VerticalAlignment: 512, Overflow: 0 });

b.patch("SlotPanel/BtnBack", { anchor: "middle-center", pos: [-560, 380], rect_size: [170, 64], pivot: [0.5, 0.5], display_order: 3 });

// 5행: 위→아래. 행 700x96, 간격 10
const ROW_Y = [181, 75, -31, -137, -243];
for (let i = 1; i <= 5; i++) {
  const s = `SlotPanel/Slot${i}`;
  b.patch(s, { anchor: "middle-center", pos: [0, ROW_Y[i - 1]], rect_size: [700, 96], pivot: [0.5, 0.5], display_order: 3 + i });
  b.patchComponent(s, SPR, { Color: PAPER, Type: 1 });

  // 카드 자체가 판(plate) 역할 → 어긋나 있던 Plate 2종은 제거
  b.remove(`${s}/TitlePlate`);
  b.remove(`${s}/InfoPlate`);

  b.patch(`${s}/Avatar`, { anchor: "middle-center", pos: [-292, 2], rect_size: [84, 88], pivot: [0.5, 0.5], display_order: 0 });
  b.patch(`${s}/Title`, { anchor: "middle-center", pos: [-100, 24], rect_size: [280, 34], pivot: [0.5, 0.5], display_order: 1 });
  paperText(`${s}/Title`, { size: 26, h: 1 });
  b.patch(`${s}/Info`, { anchor: "middle-center", pos: [-100, -20], rect_size: [280, 30], pivot: [0.5, 0.5], display_order: 2 });
  paperText(`${s}/Info`, { size: 20, h: 1, color: INK_SOFT });

  b.patch(`${s}/BtnSelect`, { anchor: "middle-center", pos: [150, 0], rect_size: [180, 64], pivot: [0.5, 0.5], display_order: 3 });
  b.patchComponent(`${s}/BtnSelect`, SPR, { Color: WOOD, Type: 1 });
  b.patchComponent(`${s}/BtnSelect`, TXT, { FontColor: CREAM, HorizontalAlignment: 2, VerticalAlignment: 512 });

  b.patch(`${s}/BtnDelete`, { anchor: "middle-center", pos: [295, 0], rect_size: [96, 56], pivot: [0.5, 0.5], display_order: 4 });
  b.patchComponent(`${s}/BtnDelete`, SPR, { Color: { r: 0.52, g: 0.25, b: 0.21, a: 1 }, Type: 1 });
  b.patchComponent(`${s}/BtnDelete`, TXT, { FontColor: CREAM, HorizontalAlignment: 2, VerticalAlignment: 512 });
}

// ─────────────────────────────────────────────────────────────
// 2. CustomizePanel — 정사각 수첩 (왼 페이지=미리보기, 오른 페이지=파츠)
//    Frame 960x960 @ (0,-20)  →  페이지 안쪽 x -367~368 / y -281~258
//    Frame Rect 자체는 y -500~460 이므로 y>300 영역은 책 바깥(키아트 위)
// ─────────────────────────────────────────────────────────────
b.patch("CustomizePanel/Frame", { anchor: "middle-center", pos: [0, -20], rect_size: [960, 960], pivot: [0.5, 0.5], display_order: 0 });

// 제목은 책 위쪽 바깥(키아트 위) → 어두운 Plate + 밝은 글자 유지
b.patch("CustomizePanel/Frame/TitlePlate", { anchor: "middle-center", pos: [0, 370], rect_size: [520, 62], pivot: [0.5, 0.5], display_order: 1 });
b.patchComponent("CustomizePanel/Frame/TitlePlate", SPR, { Color: PLATE_DARK, Type: 1 });
b.patch("CustomizePanel/Frame/Title", { anchor: "middle-center", pos: [0, 370], rect_size: [480, 50], pivot: [0.5, 0.5], display_order: 2 });
b.patchComponent("CustomizePanel/Frame/Title", TXT, { HorizontalAlignment: 2, VerticalAlignment: 512, FontSize: 34, MaxSize: 34, MinSize: 22, Overflow: 0 });

// 왼쪽 페이지
b.patch("CustomizePanel/Frame/Preview", { anchor: "middle-center", pos: [-235, 105], rect_size: [230, 290], pivot: [0.5, 0.5], display_order: 3 });
b.patch("CustomizePanel/Frame/BtnLookAccount", { anchor: "middle-center", pos: [-235, -95], rect_size: [250, 56], pivot: [0.5, 0.5], display_order: 4 });
b.patch("CustomizePanel/Frame/BtnLookCustom", { anchor: "middle-center", pos: [-235, -165], rect_size: [250, 56], pivot: [0.5, 0.5], display_order: 5 });
for (const p of ["CustomizePanel/Frame/BtnLookAccount", "CustomizePanel/Frame/BtnLookCustom"]) {
  b.patchComponent(p, SPR, { Type: 1 });
  b.patchComponent(p, TXT, { FontColor: CREAM, HorizontalAlignment: 2, VerticalAlignment: 512, FontSize: 24, MaxSize: 24, MinSize: 16 });
}

// 오른쪽 페이지 — 파츠 4행
const PARTS = [
  { key: "Hair", label: "Hair", y: 210 },
  { key: "Face", label: "Face", y: 140 },
  { key: "Body", label: "Body", y: 70 },
  { key: "Coat", label: "Coat", y: 0 },
];
let ord = 6;
for (const part of PARTS) {
  const F = "CustomizePanel/Frame";
  const k = part.key;
  const y = part.y;
  // 값 배경(필드) → 반드시 글자보다 낮은 displayOrder
  b.patch(`${F}/${k}NamePlate`, { anchor: "middle-center", pos: [200, y], rect_size: [190, 46], pivot: [0.5, 0.5], display_order: ord++ });
  b.patchComponent(`${F}/${k}NamePlate`, SPR, { Color: FIELD, Type: 1 });

  b.patch(`${F}/${k}Label`, { anchor: "middle-center", pos: [-12, y], rect_size: [96, 34], pivot: [0.5, 0.5], display_order: ord++ });
  paperText(`${F}/${k}Label`, { size: 22, h: 4, color: INK_SOFT });

  b.patch(`${F}/Btn${k}Prev`, { anchor: "middle-center", pos: [66, y], rect_size: [52, 52], pivot: [0.5, 0.5], display_order: ord++ });
  b.patch(`${F}/${k}Name`, { anchor: "middle-center", pos: [200, y], rect_size: [178, 40], pivot: [0.5, 0.5], display_order: ord++ });
  paperText(`${F}/${k}Name`, { size: 21 });
  b.patch(`${F}/Btn${k}Next`, { anchor: "middle-center", pos: [338, y], rect_size: [52, 52], pivot: [0.5, 0.5], display_order: ord++ });

  for (const p of [`${F}/Btn${k}Prev`, `${F}/Btn${k}Next`]) {
    b.patchComponent(p, SPR, { Color: WOOD, Type: 1 });
    b.patchComponent(p, TXT, { FontColor: CREAM, HorizontalAlignment: 2, VerticalAlignment: 512 });
  }
}

// 닉네임 입력 / 오류 / 하단 버튼
b.patch("CustomizePanel/Frame/NameInput", { anchor: "middle-center", pos: [150, -80], rect_size: [430, 60], pivot: [0.5, 0.5], display_order: ord++ });
b.patchComponent("CustomizePanel/Frame/NameInput", SPR, { Color: { r: 0.99, g: 0.97, b: 0.91, a: 0.95 }, Type: 1 });
b.patchComponent("CustomizePanel/Frame/NameInput", TXT, { FontColor: INK, HorizontalAlignment: 1, VerticalAlignment: 512, FontSize: 24, MaxSize: 24, MinSize: 18 });
b.patchComponent("CustomizePanel/Frame/NameInput", INP, { CharacterLimit: 15, PlaceHolder: "닉네임 (2~15글자)" });

b.patch("CustomizePanel/Frame/ErrorPlate", { anchor: "middle-center", pos: [150, -145], rect_size: [430, 44], pivot: [0.5, 0.5], display_order: ord++ });
b.patchComponent("CustomizePanel/Frame/ErrorPlate", SPR, { Color: FIELD, Type: 1 });
b.patch("CustomizePanel/Frame/Error", { anchor: "middle-center", pos: [150, -145], rect_size: [410, 38], pivot: [0.5, 0.5], display_order: ord++ });
paperText("CustomizePanel/Frame/Error", { size: 20, color: INK_RED });

b.patch("CustomizePanel/Frame/BtnBack", { anchor: "middle-center", pos: [30, -225], rect_size: [200, 64], pivot: [0.5, 0.5], display_order: ord++ });
b.patch("CustomizePanel/Frame/BtnStart", { anchor: "middle-center", pos: [250, -225], rect_size: [200, 64], pivot: [0.5, 0.5], display_order: ord++ });
b.patchComponent("CustomizePanel/Frame/BtnBack", SPR, { Color: { r: 0.42, g: 0.36, b: 0.30, a: 1 }, Type: 1 });
b.patchComponent("CustomizePanel/Frame/BtnStart", SPR, { Color: { r: 0.36, g: 0.52, b: 0.29, a: 1 }, Type: 1 });
for (const p of ["CustomizePanel/Frame/BtnBack", "CustomizePanel/Frame/BtnStart"]) {
  b.patchComponent(p, TXT, { FontColor: CREAM, HorizontalAlignment: 2, VerticalAlignment: 512 });
}

// ─────────────────────────────────────────────────────────────
// 3. NamePrompt (삭제 확인) — 640x640 정사각. 페이지 안쪽 x -245~246 / y -174~186
// ─────────────────────────────────────────────────────────────
b.patch("NamePrompt", { anchor: "middle-center", pos: [0, 0], rect_size: [640, 640], pivot: [0.5, 0.5] });
b.patch("NamePrompt/TitlePlate", { anchor: "middle-center", pos: [0, 140], rect_size: [420, 52], pivot: [0.5, 0.5], display_order: 0 });
b.patchComponent("NamePrompt/TitlePlate", SPR, { Color: FIELD, Type: 1 });
b.patch("NamePrompt/Title", { anchor: "middle-center", pos: [0, 140], rect_size: [400, 44], pivot: [0.5, 0.5], display_order: 1 });
paperText("NamePrompt/Title", { size: 30 });
b.patch("NamePrompt/Error", { anchor: "middle-center", pos: [0, 62], rect_size: [440, 40], pivot: [0.5, 0.5], display_order: 2 });
paperText("NamePrompt/Error", { size: 20, color: INK_RED });
b.patch("NamePrompt/Input", { anchor: "middle-center", pos: [0, -10], rect_size: [420, 60], pivot: [0.5, 0.5], display_order: 3 });
b.patchComponent("NamePrompt/Input", SPR, { Color: { r: 0.99, g: 0.97, b: 0.91, a: 0.95 }, Type: 1 });
b.patchComponent("NamePrompt/Input", TXT, { FontColor: INK, HorizontalAlignment: 1, VerticalAlignment: 512, FontSize: 24, MaxSize: 24, MinSize: 18 });
b.patchComponent("NamePrompt/Input", INP, { CharacterLimit: 15 });
b.patch("NamePrompt/BtnOk", { anchor: "middle-center", pos: [-110, -105], rect_size: [180, 60], pivot: [0.5, 0.5], display_order: 4 });
b.patch("NamePrompt/BtnCancel", { anchor: "middle-center", pos: [110, -105], rect_size: [180, 60], pivot: [0.5, 0.5], display_order: 5 });
b.patchComponent("NamePrompt/BtnOk", SPR, { Color: { r: 0.52, g: 0.25, b: 0.21, a: 1 }, Type: 1 });
b.patchComponent("NamePrompt/BtnCancel", SPR, { Color: { r: 0.42, g: 0.36, b: 0.30, a: 1 }, Type: 1 });
for (const p of ["NamePrompt/BtnOk", "NamePrompt/BtnCancel"]) {
  b.patchComponent(p, TXT, { FontColor: CREAM, HorizontalAlignment: 2, VerticalAlignment: 512 });
}

b.write(UI);
console.log("✓ MainMenuGroup.ui layout patched");
