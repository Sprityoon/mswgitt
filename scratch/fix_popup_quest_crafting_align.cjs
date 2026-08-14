/**
 * 퀘스트·크래프팅 팝업 정합 패치 (2026-08-14)
 *
 * 기준 크롬 = CollectionPopup(도감): Bg 960×740 + Inner 900×640 @(0,-10) + Title 400×48 @(0,-28)
 *            + 탭 180×44 @y=-90 + 좌우 컬럼 420×500 @(±230,-40)
 *
 * 실측 결함 (dump_popup_chrome.cjs, 2026-08-14):
 *  [크래프팅]
 *   - TierBar/CategoryBar 컨테이너는 820×44 @x=-60로 옮겨졌는데 안쪽 Bg가 940×44 그대로
 *     → 왼쪽으로 창 밖 30px 돌출(-530 < 창 -500), 오른쪽으로 BtnClose(x 377~465)와 겹침.
 *   - BtnClose displayOrder=6 < CategoryBar=7 → 카테고리 바가 닫기 버튼 왼아래를 덮음
 *     (tasks.md의 "displayOrder 20 즉시 수정"이 파일에 없음 — 부분 적용/재직렬화 소실).
 *   - List 420×480 @(-220,-40) 무마스크·무배경 → 퀘스트/도감(420·880×500·460, 다크 인셋+Mask)과 이질.
 *   - RecipeTemplate 240×60(Name 160) → 420 리스트에서 오른쪽이 비고 레시피명 넘침.
 *   - Title (0,-24) 400×45 — 같은 1000×780 창(도감·퀘스트 -28)과 어긋남.
 *  [퀘스트]
 *   - Bg/Inner 종이가 (6.6,-14.7) 886.8×630.6 소수점 드리프트 → 왼 컬럼이 종이 왼쪽 밖 3.2px 돌출.
 *   - Title x=10 드리프트.
 *   - BtnClose가 ✕ 글리프(2d183f2a) — 제작대 X 스프라이트(221e0368) 대비 약함 (tasks.md 기지 항목).
 *   - 루트 enable=on (다른 12개 팝업은 전부 off).
 */
const path = require("path");
const SKILL = path.resolve(__dirname, "..", ".claude", "skills", "msw-ui-system");
const { UIBuilder } = require(path.join(SKILL, "scripts", "msw_ui_builder.cjs"));

const UI = "ui/PopupGroup.ui";
const b = UIBuilder.load(UI);

const SPR = "MOD.Core.SpriteGUIRendererComponent";

// 레퍼런스 엔티티에서 정확한 RUID를 읽어온다 (8자 프리픽스 추정 금지)
const xClose = b.getComponent("CraftingPopup/BtnClose", SPR); // X 스프라이트 (221e0368…)
const listBackdrop = b.getComponent("QuestPopup/ListScroll", SPR); // 다크 인셋 (25e9e895…)
if (!xClose || !listBackdrop) throw new Error("reference sprites not found");
const X_RUID = xClose.ImageRUID; // DataRef 그대로 복사
const INSET_RUID = listBackdrop.ImageRUID;

// ── 크래프팅 ──────────────────────────────────────────────
// 1. 바 안쪽 Bg를 컨테이너와 동일 크기로 (940 → 820)
b.patch("CraftingPopup/TierBar/Bg", { anchor: "middle-center", pos: [0, 0], rect_size: [820, 44], pivot: [0.5, 0.5] });
b.patch("CraftingPopup/CategoryBar/Bg", { anchor: "middle-center", pos: [0, 0], rect_size: [820, 44], pivot: [0.5, 0.5] });

// 2. 닫기 버튼을 바 위로 (소실된 즉시 수정 재적용)
b.patch("CraftingPopup/BtnClose", { display_order: 20 });

// 3. 좌우 컬럼을 퀘스트/도감과 동일 좌표계로 (±230, -40 / 420×500)
b.patch("CraftingPopup/List", { anchor: "middle-center", pos: [-230, -40], rect_size: [420, 500], pivot: [0.5, 0.5] });
b.patch("CraftingPopup/Details", { anchor: "middle-center", pos: [230, -40], rect_size: [420, 500], pivot: [0.5, 0.5] });

// 4. 리스트에 퀘스트/도감과 같은 다크 인셋 배경 + Mask (스크롤 넘침 클립)
b.upsertComponent("CraftingPopup/List", SPR, {
  "@type": SPR,
  ImageRUID: INSET_RUID,
  Color: { r: 0.1, g: 0.1, b: 0.1, a: 0.4 },
  Type: 1,
  RaycastTarget: false,
  Enable: true,
});
if (!b.hasComponent("CraftingPopup/List", "MOD.Core.MaskComponent")) {
  b.addComponent("CraftingPopup/List", "MOD.Core.MaskComponent", { "@type": "MOD.Core.MaskComponent", Shape: 0, Enable: true });
}

// 5. 레시피 행이 리스트 폭을 채우게 (240→400) + 이름 칸 확장 (160→300, 넘침 해소)
b.patch("CraftingPopup/List/RecipeTemplate", { rect_size: [400, 60] });
b.patch("CraftingPopup/List/RecipeTemplate/Name", { rect_size: [300, 30] });

// 6. 제목 정렬을 도감·퀘스트와 통일
b.patch("CraftingPopup/Title", { anchor: "top-center", pos: [0, -28], rect_size: [400, 48], pivot: [0.5, 1] });

// ── 퀘스트 ────────────────────────────────────────────────
// 7. 파일 기본값 off (다른 팝업 전부 off; 켜는 건 HUD 트래커)
b.patch("QuestPopup", { enable: false });

// 8. 종이 소수점 드리프트 제거 → 도감 Inner와 동일 기하 (불투명 a=1은 가시성 결정 유지)
b.patch("QuestPopup/Bg/Inner", { anchor: "middle-center", pos: [0, -10], rect_size: [900, 640], pivot: [0.5, 0.5] });

// 9. 제목 중앙 정렬 + y를 도감과 통일
b.patch("QuestPopup/Title", { anchor: "top-center", pos: [0, -28], rect_size: [400, 48], pivot: [0.5, 1] });

// 10. 닫기 버튼: ✕ 글리프 → 제작대와 같은 X 스프라이트
b.patchComponent("QuestPopup/BtnClose", SPR, { ImageRUID: X_RUID, Color: { r: 1, g: 1, b: 1, a: 1 } });
b.patchComponent("QuestPopup/BtnClose", "MOD.Core.TextGUIRendererComponent", { Text: "" });

b.write(UI);

// ── 검증 출력: 패치 후 경계 재계산 ──────────────────────────
const chk = UIBuilder.read(UI);
function edges(p, halfW, halfH) {
  const tf = (chk.find(p).jsonString["@components"] || []).find((c) => c["@type"] === "MOD.Core.UITransformComponent");
  return { pos: tf.anchoredPosition, size: tf.RectSize };
}
const tier = edges("CraftingPopup/TierBar/Bg");
console.log("TierBar/Bg  =", JSON.stringify(tier));
const cat = edges("CraftingPopup/CategoryBar/Bg");
console.log("CategoryBar/Bg =", JSON.stringify(cat));
// 바 우측 끝 = 컨테이너중심(-60)+410 = 350 < 닫기 왼끝 377 → 겹침 해소 확인용
console.log("bar right edge = " + (-60 + tier.size.x / 2) + " (< 377 required)");
console.log("bar left edge  = " + (-60 - tier.size.x / 2) + " (>= -490 required)");
console.log("quest inner =", JSON.stringify(edges("QuestPopup/Bg/Inner")));
console.log("✓ popup quest/crafting alignment patched");
