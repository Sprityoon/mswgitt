/**
 * 팝업 크롬 통일 (⚖️ 2026-08-14 제작자 확정: "큰창=인벤 종이 / 작은카드=의뢰 나무")
 *
 * 두 패밀리 표준:
 *  [종이 큰창 5] Inventory(기준)·Crafting·Collection·Quest·Character
 *   - 나무 프레임(25e9e895) 풀블리드(루트 크기) + 종이(c24adedc) 속지
 *   - Title (0,-28) 400×48 fs32 fc(0.9,0.9,0.8) · 닫기 = 흰 X 스프라이트(221e0368) (-35,-35) dOrd20
 *  [나무 카드 8] Request(기준)·Research·Shop·Warp·Permission·Chest·Furnace·SkillTree
 *   - 카드 Bg = 4fea64a3 t0 c(0.2,0.1,0.1) + TopBar(카드폭×56, 0.1/0.1/0.1) + AccentLine(골드 3px)
 *   - Title 탑바 위 (0,-8) fs26 fc(1,0.9,0.7) · 닫기 = 흰 X (-12,-12) 카드 안쪽 dOrd20
 *   - dOrd: TopBar15/Accent16/Title17/Close20 (SkillTree는 콘텐츠가 20까지라 25/26/27/30)
 *
 * 예외 (실측 근거):
 *  - Warp: UIWarpController가 Title/BtnClose를 "중앙 앵커" 좌표계로 런타임 재배치(totalH/2-40)
 *    → 앵커를 바꾸면 날아감. 색/스킨/x만 조정, TopBar·Accent는 top-anchored라 리사이즈 추종.
 *  - Inventory 탭: 컨트롤러가 색을 만지지 않아 선택 피드백 회귀 위험 없음 → 배치만 도감 규격
 *    (180×44 중앙 3분할)으로, 스킨은 현행 유지.
 *  - Collection Title "📖 도감" → "도감" (이모지 글리프 금지 규약).
 */
const path = require("path");
const SKILL = path.resolve(__dirname, "..", ".claude", "skills", "msw-ui-system");
const { UIBuilder } = require(path.join(SKILL, "scripts", "msw_ui_builder.cjs"));

const UI = "ui/PopupGroup.ui";
const b = UIBuilder.load(UI);

const SPR = "MOD.Core.SpriteGUIRendererComponent";
const TL = "MOD.Core.TextComponent"; // legacy
const TG = "MOD.Core.TextGUIRendererComponent";

// 레퍼런스에서 RUID 실측 복사 (프리픽스 추정 금지)
const X_REF = b.getComponent("CraftingPopup/BtnClose", SPR); // 221e0368…
const CHIP_REF = b.getComponent("RequestPopup/Bg", SPR); // 4fea64a3…
const WOOD_REF = b.getComponent("InventoryPopup/Bg", SPR); // 25e9e895…
if (!X_REF || !CHIP_REF || !WOOD_REF) throw new Error("reference sprites missing");
const X_RUID = X_REF.ImageRUID;
const CHIP_RUID = CHIP_REF.ImageRUID;
const WOOD_RUID = WOOD_REF.ImageRUID;
const chipStr = (typeof CHIP_RUID === "object" ? CHIP_RUID.DataId : CHIP_RUID) || "";
const woodStr = (typeof WOOD_RUID === "object" ? WOOD_RUID.DataId : WOOD_RUID) || "";

const WHITE = { r: 1, g: 1, b: 1, a: 1 };
const CARD_BG = { r: 0.2, g: 0.1, b: 0.1, a: 1 };
const DARK_BAND = { r: 0.1, g: 0.1, b: 0.1, a: 1 };
const GOLD = { r: 0.9, g: 0.7, b: 0.2, a: 1 };
const PAPER_TITLE = { r: 0.9, g: 0.9, b: 0.8, a: 1 };
const CARD_TITLE = { r: 1, g: 0.9, b: 0.7, a: 1 };

function whiteClose(popupPath, pos, dOrd) {
  // 닫기 통일: 흰 X 스프라이트 + 글리프 제거 + 최상단 z
  b.patch(popupPath, { anchor: "top-right", pos, rect_size: [88, 88], pivot: [1, 1], display_order: dOrd });
  b.patchComponent(popupPath, SPR, { ImageRUID: X_RUID, Color: WHITE, Type: 0 });
  if (b.getComponent(popupPath, TL)) b.patchComponent(popupPath, TL, { Text: "" });
  if (b.getComponent(popupPath, TG)) b.patchComponent(popupPath, TG, { Text: "" });
}

function cardChrome(card, cardW, ord) {
  // card = "ShopPopup/Bg" 형태. ord = [topbar, accent, title, close]
  const topBar = card + "/TopBar";
  const accent = card + "/AccentLine";
  if (b.find(topBar)) {
    b.patch(topBar, { anchor: "top-center", pos: [0, 0], rect_size: [cardW, 56], pivot: [0.5, 1], display_order: ord[0] });
  } else {
    b.sprite(topBar, { anchor: "top-center", pos: [0, 0], rect_size: [cardW, 56], pivot: [0.5, 1], image_ruid: chipStr, color: DARK_BAND, sprite_type: 0, raycast: false });
    b.patch(topBar, { display_order: ord[0] });
  }
  b.patchComponent(topBar, SPR, { ImageRUID: CHIP_RUID, Color: DARK_BAND, Type: 0 });
  if (b.find(accent)) {
    b.patch(accent, { anchor: "top-center", pos: [0, -56], rect_size: [cardW, 3], pivot: [0.5, 1], display_order: ord[1] });
  } else {
    b.sprite(accent, { anchor: "top-center", pos: [0, -56], rect_size: [cardW, 3], pivot: [0.5, 1], image_ruid: chipStr, color: GOLD, sprite_type: 0, raycast: false });
    b.patch(accent, { display_order: ord[1] });
  }
  b.patchComponent(accent, SPR, { ImageRUID: CHIP_RUID, Color: GOLD, Type: 0 });
}

function cardTitle(titlePath, w, ord) {
  b.patch(titlePath, { anchor: "top-center", pos: [0, -8], rect_size: [w, 40], pivot: [0.5, 1], display_order: ord });
  b.patchComponent(titlePath, TL, { FontSize: 26, FontColor: CARD_TITLE });
}

// ═══════════ 종이 큰창 5 ═══════════
// Collection — 프레임 풀블리드 + 종이 불투명 + 흰 X + 이모지 제거
b.patch("CollectionPopup/Bg", { anchor: "stretch", pos: [0, 0], rect_size: [1000, 780], pivot: [0.5, 0.5] });
b.patchComponent("CollectionPopup/Bg/Inner", SPR, { Color: { r: 1, g: 1, b: 1, a: 1 } });
b.patchComponent("CollectionPopup/Title", TL, { Text: "도감", FontColor: PAPER_TITLE });
whiteClose("CollectionPopup/BtnClose", [-35, -35], 20);

// Quest — 프레임 풀블리드 (Inner·Title·X스킨은 정합 2차에서 완료) + 닫기 위치/z
b.patch("QuestPopup/Bg", { anchor: "stretch", pos: [0, 0], rect_size: [1000, 780], pivot: [0.5, 0.5] });
b.patch("QuestPopup/BtnClose", { anchor: "top-right", pos: [-35, -35], rect_size: [88, 88], pivot: [1, 1], display_order: 20 });
if (b.getComponent("QuestPopup/BtnClose", TG)) b.patchComponent("QuestPopup/BtnClose", TG, { FontColor: PAPER_TITLE });

// Inventory — 제목선 -28 + 탭 도감 규격(배치만) + 닫기 z
b.patch("InventoryPopup/Title", { anchor: "top-center", pos: [0, -28], rect_size: [400, 48], pivot: [0.5, 1] });
b.patchComponent("InventoryPopup/Title", TL, { FontColor: PAPER_TITLE });
b.patch("InventoryPopup/BtnClose", { display_order: 20 });
b.patch("InventoryPopup/TabAll", { anchor: "top-center", pos: [-220, -90], rect_size: [180, 44], pivot: [0.5, 1] });
b.patch("InventoryPopup/TabRes", { anchor: "top-center", pos: [0, -90], rect_size: [180, 44], pivot: [0.5, 1] });
b.patch("InventoryPopup/TabEquip", { anchor: "top-center", pos: [220, -90], rect_size: [180, 44], pivot: [0.5, 1] });

// Crafting — 제목 글꼴/색 통일 (좌표·X·dOrd는 정합 2차에서 완료)
b.patchComponent("CraftingPopup/Title", TL, { FontSize: 32, FontColor: PAPER_TITLE });

// Character — 나무 프레임 신설(유일하게 프레임이 없던 창) + 제목선 + 닫기 z
if (!b.find("CharacterPopup/Bg")) {
  b.sprite("CharacterPopup/Bg", { anchor: "stretch", pos: [0, 0], rect_size: [850, 700], image_ruid: woodStr, color: WHITE, sprite_type: 1, raycast: false });
  b.patch("CharacterPopup/Bg", { display_order: 0 });
}
b.patch("CharacterPopup/Title", { anchor: "top-center", pos: [0, -28], rect_size: [400, 48], pivot: [0.5, 1] });
b.patchComponent("CharacterPopup/Title", TL, { FontColor: PAPER_TITLE });
b.patch("CharacterPopup/BtnClose", { display_order: 20 });

// ═══════════ 나무 카드 8 ═══════════
const STD = [15, 16, 17, 20];

// Request(기준) — 앵커만 표준화
cardChrome("RequestPopup/Bg", 680, STD);
cardTitle("RequestPopup/Bg/Title", 360, STD[2]);
whiteClose("RequestPopup/Bg/BtnClose", [-12, -12], STD[3]);

// Research — TopBar 64→56 표준화
cardChrome("ResearchPopup/Bg", 860, STD);
cardTitle("ResearchPopup/Bg/Title", 320, STD[2]);
whiteClose("ResearchPopup/Bg/BtnClose", [-12, -12], STD[3]);

// Shop
b.patchComponent("ShopPopup/Bg", SPR, { ImageRUID: CHIP_RUID, Color: CARD_BG, Type: 0 });
cardChrome("ShopPopup/Bg", 600, STD);
cardTitle("ShopPopup/Bg/Title", 280, STD[2]);
whiteClose("ShopPopup/Bg/BtnClose", [-12, -12], STD[3]);

// Permission
b.patchComponent("PermissionPopup/Bg", SPR, { ImageRUID: CHIP_RUID, Color: CARD_BG, Type: 0 });
cardChrome("PermissionPopup/Bg", 380, STD);
cardTitle("PermissionPopup/Bg/Title", 280, STD[2]);
whiteClose("PermissionPopup/Bg/BtnClose", [-12, -12], STD[3]);

// Chest (인벤 옆 우측 오프셋 카드 — Bg 위치는 유지)
b.patchComponent("ChestPopup/Bg", SPR, { ImageRUID: CHIP_RUID, Color: CARD_BG, Type: 0 });
cardChrome("ChestPopup/Bg", 340, STD);
cardTitle("ChestPopup/Bg/Title", 280, STD[2]);
whiteClose("ChestPopup/Bg/BtnClose", [-12, -12], STD[3]);

// Furnace
b.patchComponent("FurnacePopup/Bg", SPR, { ImageRUID: CHIP_RUID, Color: CARD_BG, Type: 0 });
cardChrome("FurnacePopup/Bg", 600, STD);
cardTitle("FurnacePopup/Bg/Title", 340, STD[2]);
whiteClose("FurnacePopup/Bg/BtnClose", [-12, -12], STD[3]);

// SkillTree — 콘텐츠 dOrd가 20까지라 상단 밴드 25~30
const SKT = [25, 26, 27, 30];
b.patchComponent("SkillTreePopup/Bg", SPR, { ImageRUID: CHIP_RUID, Color: CARD_BG, Type: 0 });
cardChrome("SkillTreePopup/Bg", 680, SKT);
cardTitle("SkillTreePopup/Bg/Title", 360, SKT[2]);
whiteClose("SkillTreePopup/Bg/BtnClose", [-12, -12], SKT[3]);

// Warp — 특례: Title/BtnClose 앵커 불변(컨트롤러가 중앙 좌표계로 재배치). 색·스킨·x만.
b.patchComponent("WarpPopup/Bg", SPR, { ImageRUID: CHIP_RUID, Color: CARD_BG, Type: 0 });
cardChrome("WarpPopup/Bg", 380, STD);
b.patchComponent("WarpPopup/Bg/Title", TL, { FontSize: 26, FontColor: CARD_TITLE });
b.patch("WarpPopup/Bg/Title", { display_order: STD[2] });
b.patch("WarpPopup/Bg/BtnClose", { pos: [134, 130], display_order: STD[3] }); // 카드 안쪽(190-12-44). y는 런타임이 재계산
b.patchComponent("WarpPopup/Bg/BtnClose", SPR, { ImageRUID: X_RUID, Color: WHITE, Type: 0 });
if (b.getComponent("WarpPopup/Bg/BtnClose", TL)) b.patchComponent("WarpPopup/Bg/BtnClose", TL, { Text: "" });

b.write(UI);
console.log("✓ popup chrome unified (paper×5 + card×8)");
