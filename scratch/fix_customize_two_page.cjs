"use strict";
/**
 * CustomizePanel — 공책 스프링을 축으로 좌/우 페이지 재배치
 *  - 왼쪽: 미리보기 + 룩 모드 + 뒤로
 *  - 오른쪽: 헤어/얼굴/피부/상의 선택 행(슬롯과 같은 크림 칩) + 닉네임 + 모험 시작
 *  - NamePlate를 행 전체 칩으로 키워 선택이 눈에 띄게
 */
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const b = UIBuilder.load(UI);

const TXT = "MOD.Core.TextGUIRendererComponent";
const SPR = "MOD.Core.SpriteGUIRendererComponent";

const INK = { r: 0.22, g: 0.15, b: 0.09, a: 1 };
const INK_SOFT = { r: 0.40, g: 0.31, b: 0.22, a: 1 };
const INK_RED = { r: 0.62, g: 0.16, b: 0.13, a: 1 };
const PAPER = { r: 0.97, g: 0.93, b: 0.85, a: 0.92 };
const WOOD = { r: 0.55, g: 0.40, b: 0.26, a: 1 };
const CREAM = { r: 1, g: 0.96, b: 0.88, a: 1 };
const SLICE = "2860136c06ab075439721c027de365af";
const F = "CustomizePanel/Frame";

function paperText(p, { size, color = INK, h = 2, v = 512 } = {}) {
  b.patchComponent(p, TXT, {
    HorizontalAlignment: h,
    VerticalAlignment: v,
    FontColor: color,
    OutlineWidth: 0,
    Overflow: 1,
    ...(size ? { FontSize: size, MaxSize: size, MinSize: Math.max(12, Math.round(size * 0.7)) } : {}),
  });
}

function woodBtn(p, fontSize) {
  b.patchComponent(p, SPR, { Color: WOOD, Type: 1 });
  b.patchComponent(p, TXT, {
    FontColor: CREAM,
    HorizontalAlignment: 2,
    VerticalAlignment: 512,
    ...(fontSize ? { FontSize: fontSize, MaxSize: fontSize, MinSize: Math.max(16, fontSize - 8) } : {}),
  });
}

// 스프링 틈: 좌 페이지 우끝 ≈ -50, 우 페이지 좌끝 ≈ +55
b.sprite(`${F}/LeftPageTint`, {
  pos: [-225, 10],
  rect_size: [350, 490],
  color: "#2e1f14",
  alpha: 0.32,
  sprite_type: 1,
  raycast: false,
  image_ruid: SLICE,
});
b.patch(`${F}/LeftPageTint`, { display_order: 2 });
b.patch(`${F}/PageTint`, { pos: [245, 10], rect_size: [380, 490], display_order: 2 });

// 제목은 책 위 바깥 — 위치/스타일 유지, 순서만 고정
b.patch(`${F}/TitlePlate`, { display_order: 1 });
b.patch(`${F}/Title`, { display_order: 4 });

// ── 왼쪽 페이지 ──
b.patch(`${F}/Preview`, { pos: [-225, 125], rect_size: [250, 300], display_order: 10 });
b.patch(`${F}/BtnLookAccount`, { pos: [-225, -50], rect_size: [250, 56], display_order: 11 });
b.patch(`${F}/BtnLookCustom`, { pos: [-225, -118], rect_size: [250, 56], display_order: 12 });
b.patch(`${F}/BtnBack`, { pos: [-225, -228], rect_size: [200, 64], display_order: 13 });

for (const p of [`${F}/BtnLookAccount`, `${F}/BtnLookCustom`]) {
  b.patchComponent(p, TXT, {
    FontColor: CREAM,
    HorizontalAlignment: 2,
    VerticalAlignment: 512,
    FontSize: 24,
    MaxSize: 24,
    MinSize: 16,
  });
}

// ── 오른쪽 페이지 — 파츠 4행 (칩 360×62 @ x=245) ──
// 칩 안: Label 72 | 6 | Prev 56 | 6 | Name 148 | 6 | Next 56
const PARTS = [
  { key: "Hair", y: 198 },
  { key: "Face", y: 126 },
  { key: "Body", y: 54 },
  { key: "Coat", y: -18 },
];
let ord = 20;
for (const part of PARTS) {
  const k = part.key;
  const y = part.y;
  b.patch(`${F}/${k}NamePlate`, { pos: [245, y], rect_size: [360, 62], display_order: ord++ });
  b.patchComponent(`${F}/${k}NamePlate`, SPR, { Color: PAPER, Type: 1 });

  b.patch(`${F}/${k}Label`, { pos: [109, y], rect_size: [72, 40], display_order: ord++ });
  paperText(`${F}/${k}Label`, { size: 24, color: INK, h: 2 });

  b.patch(`${F}/Btn${k}Prev`, { pos: [179, y], rect_size: [56, 56], display_order: ord++ });
  b.patch(`${F}/${k}Name`, { pos: [287, y], rect_size: [148, 44], display_order: ord++ });
  paperText(`${F}/${k}Name`, { size: 22 });
  b.patch(`${F}/Btn${k}Next`, { pos: [395, y], rect_size: [56, 56], display_order: ord++ });

  woodBtn(`${F}/Btn${k}Prev`, 32);
  woodBtn(`${F}/Btn${k}Next`, 32);
}

b.patch(`${F}/NameInput`, { pos: [245, -95], rect_size: [360, 56], display_order: 40 });
b.patch(`${F}/ErrorPlate`, { pos: [245, -148], rect_size: [372, 46], display_order: 41 });
b.patch(`${F}/Error`, { pos: [245, -148], rect_size: [348, 38], display_order: 42 });
paperText(`${F}/Error`, { size: 20, color: INK_RED });
b.patch(`${F}/BtnStart`, { pos: [245, -228], rect_size: [200, 64], display_order: 43 });

b.write(UI);

const after = UIBuilder.load(UI);
function dump(name) {
  const e = after.find(`${F}/${name}`);
  const ut = e.jsonString["@components"].find((c) => c["@type"] === "MOD.Core.UITransformComponent");
  const pos = ut.anchoredPosition;
  const size = ut.RectSize;
  console.log(
    name.padEnd(16),
    `do=${e.jsonString.displayOrder}`,
    `pos=${Number(pos.x)},${Number(pos.y)}`,
    `size=${Number(size.x)}x${Number(size.y)}`
  );
}
[
  "LeftPageTint",
  "PageTint",
  "Preview",
  "BtnLookAccount",
  "BtnLookCustom",
  "BtnBack",
  "HairNamePlate",
  "HairLabel",
  "BtnHairPrev",
  "HairName",
  "BtnHairNext",
  "NameInput",
  "BtnStart",
].forEach(dump);
