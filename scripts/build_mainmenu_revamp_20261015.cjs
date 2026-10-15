"use strict";
// 시작 화면 UI 개편 (docs/design/ui/maplecraft_start_ui_spec.md, 2026-10-15).
// - 대상: ui/MainMenuGroup.ui (타이틀 / 캐릭터 선택 / 삭제 확인 / 캐릭터 만들기)
// - 이미지: docs/design/ui/maplecraft_start_ui_assets/4_Final_MSW_PNG/mc_*.png
//   제작자가 Maker [가져오기]로 등록하면 RootDesk 아래 mc_*.sprite 가 생긴다 → 여기서 이름으로 RUID 를 모은다.
//   아직 등록되지 않은 이미지는 기본 스프라이트 + 임시 색으로 대체하고 목록을 출력한다(등록 후 다시 실행하면 교체).
// - 몇 번 실행해도 결과가 같다(경로 기준 upsert / patch).
// - 좌표: 1920×1080 캔버스, 중앙 원점. 책(notebook_menu_frame_ui 1024px)은 1.1배 = 1126px, 중심 (0,-20).
//   종이 영역(측정): 왼쪽 페이지 x -409~-46, 오른쪽 페이지 x 86~427, 위 y≈+290 / 아래 y≈-326 (화면 좌표).
// 사용: node scripts/build_mainmenu_revamp_20261015.cjs   → 이후 Maker refresh
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { UIBuilder } = require(path.join(ROOT, ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const UI_PATH = "ui/MainMenuGroup.ui";
const MLUA = "RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua";
const DEFAULT_SPRITE = "2860136c06ab075439721c027de365af";
const PREVIEW_OUT = path.join(ROOT, "docs", "design", "ui", "maplecraft_start_ui_assets", "layout_preview.json");

const ASSETS = [
  "mc_modal_parchment", "mc_header_plaque", "mc_bookmark_back", "mc_preview_pedestal", "mc_input_recessed",
  "mc_arrow_left", "mc_arrow_right", "mc_title_btn_primary", "mc_title_btn_plank", "mc_slot_card", "mc_row_card",
  "mc_tab_active", "mc_tab_inactive", "mc_btn_olive_m", "mc_btn_olive_l", "mc_btn_red_s", "mc_btn_red_m", "mc_btn_gray_m",
];

// ── RUID 수집 ──────────────────────────────────────────────
function collectRuids() {
  const found = {};
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".sprite")) {
        let js;
        try { js = JSON.parse(fs.readFileSync(p, "utf8")).ContentProto.Json; } catch { continue; }
        if (js && ASSETS.includes(js.name)) found[js.name] = js.resource_guid;
      }
    }
  })(path.join(ROOT, "RootDesk"));
  return found;
}
const RUID = collectRuids();
const missing = ASSETS.filter((n) => !RUID[n]);
console.log(`registered ${ASSETS.length - missing.length}/${ASSETS.length}`);
if (missing.length) console.log("not registered yet (placeholder used):", missing.join(", "));

// 이미지 스프라이트 값: 등록됐으면 원본 색(흰색), 아니면 기본 스프라이트 + 임시 색
const FALLBACK_TINT = {
  mc_modal_parchment: "#F3E3C3", mc_header_plaque: "#6B4423", mc_bookmark_back: "#D9B480", mc_preview_pedestal: "#6E9E3A",
  mc_input_recessed: "#FAF3E3", mc_arrow_left: "#C88A4B", mc_arrow_right: "#C88A4B", mc_title_btn_primary: "#E2A846",
  mc_title_btn_plank: "#E6C9A0", mc_slot_card: "#F2D9A8", mc_row_card: "#F2D9A8", mc_tab_active: "#58B832",
  mc_tab_inactive: "#8A7F70", mc_btn_olive_m: "#8C8C2C", mc_btn_olive_l: "#8C8C2C", mc_btn_red_s: "#8C3B2B",
  mc_btn_red_m: "#8C3B2B", mc_btn_gray_m: "#8A7F70",
};
function img(name, alpha = 1) {
  const r = RUID[name];
  const hex = r ? "#FFFFFF" : FALLBACK_TINT[name];
  const c = { r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255, a: alpha };
  return { ImageRUID: { DataId: r || DEFAULT_SPRITE }, Color: c, Type: 0 };
}

// ── 공통 헬퍼 ──────────────────────────────────────────────
const b = UIBuilder.load(UI_PATH);
const G = "MainMenuGroup";
const preview = []; // 오프라인 미리보기용: { screen, abs:[x,y], size:[w,h], image, text, ... }
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const TXT = "MOD.Core.TextGUIRendererComponent";
const BTN = "MOD.Core.ButtonComponent";

const col = (hex, a = 1) => ({ r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255, a });
const DARK = "#3B2314";

function place(p, pos, size) {
  b.patch(p, { anchor: "middle-center", pos, rect_size: size, pivot: [0.5, 0.5] });
}
function setImage(p, name, alpha = 1, raycast = null) {
  const upd = img(name, alpha);
  if (raycast !== null) upd.RaycastTarget = raycast;
  b.patchComponent(p, SPR, upd);
}
function setText(p, text, size, hex, opts = {}) {
  const upd = { FontSize: size, FontColor: col(hex, opts.alpha ?? 1), FontStyle: opts.bold === false ? 0 : 1 };
  if (text !== null) upd.Text = text;
  if (opts.outline !== undefined) { upd.OutlineWidth = opts.outline; upd.FaceDilate = opts.outline; upd.OutlineColor = col(opts.outlineColor || "#2A1608"); }
  if (opts.align) upd.HorizontalAlignment = opts.align; // 1=Left 2=Center 4=Right
  if (opts.padLeft !== undefined) upd.Padding = { left: opts.padLeft, right: 8, top: 0, bottom: opts.padBottom || 0 };
  if (opts.font) upd.Font = opts.font;
  b.patchComponent(p, TXT, upd);
}
// 화면 좌표 계산용: 부모 중심 누적
const centers = {};
function rec(screen, p, abs, size, image, text, extra = {}) {
  preview.push(Object.assign({ screen, path: p, abs, size, image, text }, extra));
}

// ── 1) 타이틀 ──────────────────────────────────────────────
// 빈 판자 2장이 그려진 5단 간판 이미지를 끄고, 버튼 3개에 판자 이미지를 직접 입힌다.
// 버섯집 출입구·연못의 주황버섯/슬라임을 가리지 않도록 길(가운데) 위쪽에 모은다. 간격 14px.
b.patch("TitlePanel/SignBoard", { enable: false });
// 2026-10-15 제작자: 새로하기·이어하기를 [시작하기]로 통합, 가운데 [환경설정]은 SettingsGroup을 연다.
// 엔티티 이름(BtnNew/BtnContinue)은 컨트롤러 바인딩 UUID 를 유지하려고 그대로 둔다.
const titleBtns = [
  ["TitlePanel/BtnNew", "시작하기", "mc_title_btn_primary", -40, 44, [380, 380 * 168 / 600]],
  ["TitlePanel/BtnContinue", "환경설정", "mc_title_btn_plank", -138, 0],
  ["TitlePanel/BtnQuit", "종료하기", "mc_title_btn_plank", -236, 0],
];
// 2026-10-15 제작자 피드백: 목업(3_Screen_Mockups/Ref_01_MainTitle.jpg) 비율로 로고 확대 + 버튼 확대·재배치.
// 2026-10-15 캡처 피드백: 글자는 유지하고 판을 380×100으로 확대. 아래 버섯/슬라임 위로 128px 간격 배치.
titleBtns[0][3] = -72; titleBtns[1][3] = -200; titleBtns[2][3] = -328;
for (const [p, label, asset, y, padL, size = [380, 100]] of titleBtns) {
  // 이전 FontSize=26은 BestFit 상한 80으로 자동 확대되고 있었다. 실제 캡처 기준 고정 64로 보정.
  // 글자색은 UIMainMenuController.BindTransparentTitleBtn 이 런타임에 흰색/호버 금색으로 다시 넣는다.
  // 시작하기 프레임은 등록 PNG 600×168의 원본 비율을 유지한다(380×106.4).
  place(p, [0, y], size);
  setImage(p, asset);
  setText(p, label, 64, "#FFFFFF", { padLeft: padL ? 64 : 0, font: "Bazzi", outline: 0.32, outlineColor: "#4A2B10" });
  // 기존 BestFit=true/MaxSize=80이 FontSize를 무시하고 판 크기까지 글자를 키웠다.
  b.patchComponent(p, TXT, { BestFit: false, MinSize: 64, MaxSize: 64, SizeFit: false });
  // 미리보기의 맑은 고딕은 게임 Bazzi와 글리프 크기가 달라 근사값 사용. 실제 Maker 캡처가 기준.
  rec("title", p, [0, y], size, asset, label, { padLeft: padL ? 64 : 0, fontSize: 42, color: "#FFFFFF", outlineColor: "#4A2B10", outlinePixels: 2 });
}
// 로고 PNG 원본 비율 유지: 793×443 → 920×514(약 16%). 상단 여백을 남기도록 중심 y270.
const LOGO = { pos: [0, 270], size: [920, 514] };
place("TitlePanel/Logo", LOGO.pos, LOGO.size);
// 🔴 Logo 의 SpriteGUIRenderer.LocalScale 이 (2,2)로 저장돼 있어 RectSize 의 2배로 그려졌다(Play 캡처로 확인).
// RectSize 만 보면 정상이라 놓치기 쉽다 → 1 로 되돌리고 RectSize 로만 크기를 정한다.
b.patchComponent("TitlePanel/Logo", SPR, { LocalScale: { x: 1, y: 1 } });

// ── 2) 캐릭터 선택 ─────────────────────────────────────────
const BOOK = { pos: [0, -20], size: [1126, 1126] };
place("SlotPanel/Notebook", BOOK.pos, BOOK.size);
b.patchComponent("SlotPanel/Notebook", SPR, { Type: 0, Color: col("#FFFFFF") });
rec("select", "SlotPanel/Notebook", BOOK.pos, BOOK.size, "book", null);
// 헤더: 검은 반투명 바 → 나무 현판
place("SlotPanel/SubtitlePlate", [0, 392], [440, 112]);
setImage("SlotPanel/SubtitlePlate", "mc_header_plaque");
place("SlotPanel/Subtitle", [0, 396], [360, 50]);
setText("SlotPanel/Subtitle", "캐릭터 선택", 30, "#FFF3D6", { outline: 0.25 });
rec("select", "SlotPanel/SubtitlePlate", [0, 392], [440, 112], "mc_header_plaque", null);
rec("select", "SlotPanel/Subtitle", [0, 396], [360, 50], null, "캐릭터 선택", { color: "#FFF3D6", fontSize: 30 });
// 뒤로: 하늘에 떠 있던 버튼 → 책 왼쪽 위 모서리에 걸친 책갈피.
// 2026-10-15 제작자: 눈에 안 띈다 → 60×156 → 84×218(위 끝은 그대로 y≈345) + 세로 "뒤로" 글자. 에셋(120×311)보다 작아 재등록 불필요.
// 2차(Play 캡처): 황토 책갈피가 종이색에 묻혀 여전히 안 보인다 → 96×250 + 붉은 리본 틴트(곱연산) + 크림 글자.
const BACK_SIZE = [96, 250];
// 3차(제작자): 붉은 틴트는 어색 → 원래 황토색으로 되돌리고, 글자를 환경설정 목업처럼 진한 고동색 굵은 글씨로.
const BACK_TEXT = "#2B1608";
function styleBack(p) {
  setImage(p, "mc_bookmark_back");
  b.patchComponent(p, TXT, { Text: "뒤\n로", FontSize: 26, FontColor: col(BACK_TEXT), FontStyle: 1, OutlineWidth: 0, FaceDilate: 0,
    HorizontalAlignment: 2, VerticalAlignment: 512, Padding: { left: 0, right: 0, top: 36, bottom: 0 } });
}
// 위 끝(y≈345)은 그대로 두고 아래로 늘인다: 중심 y = 345 - 125.
place("SlotPanel/BtnBack", [-472, 220], BACK_SIZE);
styleBack("SlotPanel/BtnBack");
rec("select", "SlotPanel/BtnBack", [-472, 220], BACK_SIZE, "mc_bookmark_back", "뒤\n로", { fontSize: 26, color: BACK_TEXT });

// 슬롯: 왼쪽 페이지 1~3, 오른쪽 페이지 4~5 + 잠금 6. 제본선·책갈피 끈을 비운다.
const SLOT_SIZE = [330, 140];
const slotPos = { 1: [-228, 205], 2: [-228, 49], 3: [-228, -107], 4: [256, 205], 5: [256, 49], 6: [256, -107] };
for (let i = 1; i <= 5; i++) {
  const s = `SlotPanel/Slot${i}`;
  place(s, slotPos[i], SLOT_SIZE);
  setImage(s, "mc_slot_card");
  const [sx, sy] = slotPos[i];
  rec("select", s, [sx, sy], SLOT_SIZE, "mc_slot_card", null);
  // 채워진 슬롯: 아바타 · 닉네임(굵게) · Lv·직업 · [이어하기][삭제]
  place(`${s}/Avatar`, [-108, 6], [96, 108]);
  rec("select", `${s}/Avatar`, [sx - 108, sy + 6], [96, 108], "avatar", null);
  place(`${s}/Title`, [48, 34], [200, 34]);
  setText(`${s}/Title`, null, 24, "#2A1608", { align: 1 });
  rec("select", `${s}/Title`, [sx + 48, sy + 34], [200, 34], null, i <= 3 ? "닉네임" : null, { align: "left", fontSize: 24, color: "#2A1608" });
  place(`${s}/Info`, [48, 4], [200, 26]);
  setText(`${s}/Info`, null, 18, "#5C3D24", { align: 1, bold: false });
  rec("select", `${s}/Info`, [sx + 48, sy + 4], [200, 26], null, i <= 3 ? "Lv.25 · 트래퍼" : null, { align: "left", fontSize: 18, color: "#5C3D24" });
  place(`${s}/BtnSelect`, [20, -40], [130, 44]);
  setImage(`${s}/BtnSelect`, "mc_btn_olive_m");
  setText(`${s}/BtnSelect`, "이어하기", 20, "#FFFDF4", { outline: 0.25, padLeft: 0, padBottom: 4 });
  place(`${s}/BtnDelete`, [126, -40], [70, 44]);
  setImage(`${s}/BtnDelete`, "mc_btn_red_s");
  setText(`${s}/BtnDelete`, "삭제", 20, "#FFFDF4", { outline: 0.25, padLeft: 0, padBottom: 4 });
  if (i <= 3) {
    rec("select", `${s}/BtnSelect`, [sx + 20, sy - 40], [130, 44], "mc_btn_olive_m", "이어하기", { fontSize: 20, color: "#FFFDF4" });
    rec("select", `${s}/BtnDelete`, [sx + 126, sy - 40], [70, 44], "mc_btn_red_s", "삭제", { fontSize: 20, color: "#FFFDF4" });
  }
  // 빈 슬롯: 작은 "슬롯 N" + [+ 새 캐릭터 생성] — 새로하기/이어하기 어느 경로든 여기서 바로 생성 화면으로.
  b.text(`${s}/EmptyLabel`, `슬롯 ${i}`, { size: 20, color: "#6B4A2E", anchor: "middle-center", pos: [0, 38], rect_size: [280, 30], pivot: [0.5, 0.5], enable: false });
  b.button(`${s}/BtnCreate`, "+ 새 캐릭터 생성", { anchor: "middle-center", pos: [0, -14], rect_size: [220, 56], pivot: [0.5, 0.5], font_size: 22, color: "#FFFDF4", enable: false });
  setImage(`${s}/BtnCreate`, "mc_btn_olive_l", 1, true);
  setText(`${s}/BtnCreate`, null, 22, "#FFFDF4", { outline: 0.25, padLeft: 0, padBottom: 4 });
  if (i > 3) {
    rec("select", `${s}/EmptyLabel`, [sx, sy + 38], [280, 30], null, `슬롯 ${i}`, { fontSize: 20, color: "#6B4A2E" });
    rec("select", `${s}/BtnCreate`, [sx, sy - 14], [220, 56], "mc_btn_olive_l", "+ 새 캐릭터 생성", { fontSize: 22, color: "#FFFDF4" });
  }
}
// 슬롯 6: 추후 확장용 잠금 칸(스크립트 없음)
b.sprite("SlotPanel/Slot6", { anchor: "middle-center", pos: slotPos[6], rect_size: SLOT_SIZE, pivot: [0.5, 0.5], sprite_type: 0 });
setImage("SlotPanel/Slot6", "mc_slot_card", 0.55);
b.text("SlotPanel/Slot6/Label", "슬롯 6\n추후 확장 예정", { size: 20, color: "#7A6650", anchor: "middle-center", pos: [0, 0], rect_size: [280, 70], pivot: [0.5, 0.5] });
rec("select", "SlotPanel/Slot6", slotPos[6], SLOT_SIZE, "mc_slot_card", null, { alpha: 0.55 });
rec("select", "SlotPanel/Slot6/Label", slotPos[6], [280, 70], null, "슬롯 6\n추후 확장 예정", { fontSize: 20, color: "#7A6650" });

// ── 3) 삭제 확인 모달 ──────────────────────────────────────
// NamePrompt 자신 = 화면 전체 딤(클릭 차단). 그 위에 단일 양피지 모달(제본선 없음).
place("NamePrompt", [0, 0], [3840, 2160]);
b.patchComponent("NamePrompt", SPR, { ImageRUID: { DataId: DEFAULT_SPRITE }, Color: col("#000000", 0.58), Type: 0, RaycastTarget: true });
b.sprite("NamePrompt/Modal", { anchor: "middle-center", pos: [0, 0], rect_size: [540, 360], pivot: [0.5, 0.5], sprite_type: 0, raycast: true });
setImage("NamePrompt/Modal", "mc_modal_parchment", 1, true);
const promptOrder = ["Modal", "TitlePlate", "Title", "Error", "Input", "BtnOk", "BtnCancel"];
promptOrder.forEach((n, i) => b.patch(`NamePrompt/${n}`, { display_order: i }));
b.patch("NamePrompt/TitlePlate", { enable: false });
place("NamePrompt/Title", [0, 118], [400, 44]);
setText("NamePrompt/Title", "삭제 확인", 32, DARK, { outline: 0 });
place("NamePrompt/Error", [0, 66], [470, 34]);
setText("NamePrompt/Error", null, 20, "#B83227", { outline: 0 });
place("NamePrompt/Input", [0, 8], [360, 52]);
setImage("NamePrompt/Input", "mc_input_recessed", 1, true);
setText("NamePrompt/Input", null, 22, DARK, { bold: false, align: 1, padLeft: 60, outline: 0 });
b.patchComponent("NamePrompt/Input", "MOD.Core.TextGUIRendererInputComponent", { PlaceHolder: "닉네임 입력" });
place("NamePrompt/BtnOk", [-92, -96], [160, 52]);
setImage("NamePrompt/BtnOk", "mc_btn_red_m");
setText("NamePrompt/BtnOk", "삭제", 24, "#FFFDF4", { outline: 0.25, padLeft: 0, padBottom: 4 });
place("NamePrompt/BtnCancel", [92, -96], [160, 52]);
setImage("NamePrompt/BtnCancel", "mc_btn_gray_m");
setText("NamePrompt/BtnCancel", "취소", 24, "#FFFDF4", { outline: 0.25, padLeft: 0, padBottom: 4 });
rec("delete", "NamePrompt", [0, 0], [1920, 1080], "dim", null);
rec("delete", "NamePrompt/Modal", [0, 0], [540, 360], "mc_modal_parchment", null);
rec("delete", "NamePrompt/Title", [0, 118], [400, 44], null, "삭제 확인", { fontSize: 32, color: DARK });
rec("delete", "NamePrompt/Error", [0, 66], [470, 34], null, "삭제하려면 아래에 'eeee'을(를) 입력하세요", { fontSize: 20, color: "#B83227" });
rec("delete", "NamePrompt/Input", [0, 8], [360, 52], "mc_input_recessed", "닉네임 입력", { fontSize: 22, color: "#9A8A74", align: "left", padLeft: 60 });
rec("delete", "NamePrompt/BtnOk", [-92, -96], [160, 52], "mc_btn_red_m", "삭제", { fontSize: 24, color: "#FFFDF4", alpha: 0.45 });
rec("delete", "NamePrompt/BtnCancel", [92, -96], [160, 52], "mc_btn_gray_m", "취소", { fontSize: 24, color: "#FFFDF4" });

// ── 4) 캐릭터 만들기 ───────────────────────────────────────
// Frame(투명 컨테이너) 중심 = 책 중심 (0,-20). 아래 좌표는 Frame 기준(화면 y = 로컬 y - 20).
const F = "CustomizePanel/Frame";
const FY = -20;
place(F, [0, FY], BOOK.size);
place(`${F}/Notebook`, [0, 0], BOOK.size);
rec("create", `${F}/Notebook`, [0, FY], BOOK.size, "book", null);
place(`${F}/TitlePlate`, [0, 412], [440, 112]);
setImage(`${F}/TitlePlate`, "mc_header_plaque");
place(`${F}/Title`, [0, 416], [360, 50]);
setText(`${F}/Title`, "캐릭터 만들기", 30, "#FFF3D6", { outline: 0.25 });
rec("create", `${F}/TitlePlate`, [0, 412 + FY], [440, 112], "mc_header_plaque", null);
rec("create", `${F}/Title`, [0, 416 + FY], [360, 50], null, "캐릭터 만들기", { fontSize: 30, color: "#FFF3D6" });
place(`${F}/BtnBack`, [-472, 240], BACK_SIZE);
styleBack(`${F}/BtnBack`);
rec("create", `${F}/BtnBack`, [-472, 240 + FY], BACK_SIZE, "mc_bookmark_back", "뒤\n로", { fontSize: 26, color: BACK_TEXT });
// 왼쪽 페이지: 잔디 단상 위 프리뷰 + 모드 라디오 탭
b.sprite(`${F}/Notebook/Pedestal`, { anchor: "middle-center", pos: [-228, -10], rect_size: [230, 139], pivot: [0.5, 0.5], sprite_type: 0 });
setImage(`${F}/Notebook/Pedestal`, "mc_preview_pedestal");
rec("create", `${F}/Notebook/Pedestal`, [-228, -10 + FY], [230, 139], "mc_preview_pedestal", null);
place(`${F}/Preview`, [-228, 130], [240, 300]);
rec("create", `${F}/Preview`, [-228, 130 + FY], [240, 300], "avatar", null);
place(`${F}/BtnLookAccount`, [-228, -118], [190, 56]);
place(`${F}/BtnLookCustom`, [-228, -184], [190, 56]);
setImage(`${F}/BtnLookAccount`, "mc_tab_active");
setImage(`${F}/BtnLookCustom`, "mc_tab_inactive");
setText(`${F}/BtnLookAccount`, null, 22, "#FFFFFF", { outline: 0.3, outlineColor: "#235212", padLeft: 0, padBottom: 4 });
setText(`${F}/BtnLookCustom`, null, 22, "#D8D0C5", { outline: 0, padLeft: 0, padBottom: 4 });
rec("create", `${F}/BtnLookAccount`, [-228, -118 + FY], [190, 56], "mc_tab_active", "내 캐릭터 유지", { fontSize: 22, color: "#FFFFFF" });
rec("create", `${F}/BtnLookCustom`, [-228, -184 + FY], [190, 56], "mc_tab_inactive", "외형 꾸미기", { fontSize: 22, color: "#D8D0C5" });
// 오른쪽 페이지: [라벨 64][< 40][값 170][> 40] 행 4개 — 종이 폭 안(중심 x 256, 폭 330)
const RX = 256;
const rows = [["Hair", "헤어", 250], ["Face", "얼굴", 186], ["Body", "피부", 122], ["Coat", "상의", 58]];
for (const [key, label, y] of rows) {
  place(`${F}/${key}NamePlate`, [RX, y], [330, 56]);
  setImage(`${F}/${key}NamePlate`, "mc_row_card");
  place(`${F}/${key}Label`, [RX - 132, y], [64, 40]);
  setText(`${F}/${key}Label`, null, 20, DARK, { outline: 0 });
  place(`${F}/Btn${key}Prev`, [RX - 74, y], [40, 40]);
  setImage(`${F}/Btn${key}Prev`, "mc_arrow_left");
  b.patchComponent(`${F}/Btn${key}Prev`, TXT, { Text: "" });
  place(`${F}/${key}Name`, [RX + 35, y], [170, 40]);
  setText(`${F}/${key}Name`, null, 20, DARK, { bold: false, outline: 0 });
  place(`${F}/Btn${key}Next`, [RX + 144, y], [40, 40]);
  setImage(`${F}/Btn${key}Next`, "mc_arrow_right");
  b.patchComponent(`${F}/Btn${key}Next`, TXT, { Text: "" });
  rec("create", `${F}/${key}NamePlate`, [RX, y + FY], [330, 56], "mc_row_card", null);
  rec("create", `${F}/${key}Label`, [RX - 132, y + FY], [64, 40], null, label, { fontSize: 20, color: DARK });
  rec("create", `${F}/Btn${key}Prev`, [RX - 74, y + FY], [40, 40], "mc_arrow_left", null);
  rec("create", `${F}/${key}Name`, [RX + 35, y + FY], [170, 40], null, key === "Hair" ? "(계정 외형)" : "-", { fontSize: 20, color: DARK });
  rec("create", `${F}/Btn${key}Next`, [RX + 144, y + FY], [40, 40], "mc_arrow_right", null);
}
// 닉네임 입력: 행 배너와 다른 오목한 크림 입력창, 깃펜 아이콘 오른쪽부터 글자 시작
place(`${F}/NameInput`, [RX, -12], [340, 52]);
setImage(`${F}/NameInput`, "mc_input_recessed", 1, true);
setText(`${F}/NameInput`, null, 22, DARK, { bold: false, align: 1, padLeft: 60, outline: 0 });
rec("create", `${F}/NameInput`, [RX, -12 + FY], [340, 52], "mc_input_recessed", "닉네임 (2~15글자)", { fontSize: 22, color: "#9A8A74", align: "left", padLeft: 60 });
place(`${F}/ErrorPlate`, [RX, -62], [340, 40]);
place(`${F}/Error`, [RX, -62], [330, 34]);
place(`${F}/BtnStart`, [RX, -120], [220, 56]);
setImage(`${F}/BtnStart`, "mc_btn_olive_l");
setText(`${F}/BtnStart`, "모험 시작", 24, "#FFFDF4", { outline: 0.25, padLeft: 0, padBottom: 4 });
rec("create", `${F}/BtnStart`, [RX, -120 + FY], [220, 56], "mc_btn_olive_l", "모험 시작", { fontSize: 24, color: "#FFFDF4" });

// ── 저장 + 바인딩 ─────────────────────────────────────────
b.write(UI_PATH, { lint_verbose: true });

// 탭 이미지 RUID 를 컨트롤러 기본값에 기록(외형 모드 전환 시 이미지 교체에 쓴다). 미등록이면 "".
let src = fs.readFileSync(path.join(ROOT, MLUA), "utf8");
for (const [prop, name] of [["tabActiveRuid", "mc_tab_active"], ["tabInactiveRuid", "mc_tab_inactive"]]) {
  const re = new RegExp(`(property string ${prop} = )"[^"]*"`);
  if (!re.test(src)) throw new Error(`${MLUA} 에 property string ${prop} 선언이 없다`);
  src = src.replace(re, `$1"${RUID[name] || ""}"`);
}
fs.writeFileSync(path.join(ROOT, MLUA), src, "utf8");

fs.writeFileSync(PREVIEW_OUT, JSON.stringify({ ruids: RUID, items: preview }, null, 1));
console.log(`wrote ${UI_PATH}, ${MLUA} (tab ruids), layout_preview.json (${preview.length} items)`);
