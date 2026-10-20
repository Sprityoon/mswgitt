// UI 버그·로직 정리 (2026-10-16) — 외부 에이전트 UI 리팩토링 지시서 중 "코드에서 실제로 확인된 항목"만 반영한다.
// 에셋 교체·업로드는 하지 않는다(pitfalls #45). 재실행해도 같은 결과(멱등).
//  PopupGroup : 플레이어 메뉴·영지 초대 크기 / 영지 권한 빈 상태 안내 / 연구소 글자 칸 / 퀘스트 보상 수량 /
//               가방 장착 배지·버리기 수량 최소·최대 / 포탈 지역 라벨·너비 / 상점 2열 카드 · 페이지 대칭 /
//               화로 라벨·진행 막대 색 / 의뢰 게시판 목록 위치 / 캐릭터창 게이지(HUD 와 같은 9-slice 바)
//  HUDGroup   : 프로필 뒤판 / 퀘스트 완료 토스트 위치 / 채팅 탭 글자 칸
//  NamingGroup: 입력창 대비 · 플레이스홀더 · 오류 문구 별도 줄
// MaskComponent 는 빌더로 붙이지 않는다(pitfalls #49) — 목록은 줄 간격 조정으로 해결.
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const root = path.join(__dirname, "..");
const UI = (f) => path.join(root, "ui", f);
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const TXT = "MOD.Core.TextGUIRendererComponent";
const LEG = "MOD.Core.TextComponent";
const SLIDER = "MOD.Core.SliderComponent";
const DEFAULT_SKIN = "2860136c06ab075439721c027de365af";

const backupDir = path.join(root, "scratch", "ui-before-uifix-20261016");
fs.mkdirSync(backupDir, { recursive: true });
for (const f of ["PopupGroup.ui", "HUDGroup.ui", "NamingGroup.ui"]) {
  const dst = path.join(backupDir, f);
  if (!fs.existsSync(dst)) fs.copyFileSync(UI(f), dst);
}

const rgba = (r, g, b, a = 1) => ({ r, g, b, a });
const ref = (ruid) => ({ DataId: ruid });
// 레거시/신형 텍스트 둘 다 지원하는 패치.
function patchText(b, p, upd) {
  if (b.hasComponent(p, TXT)) b.patchComponent(p, TXT, upd);
  else if (b.hasComponent(p, LEG)) {
    const m = { ...upd };
    b.patchComponent(p, LEG, m);
  } else throw new Error("no text component: " + p);
}

// ───────────────────────── PopupGroup ─────────────────────────
{
  const b = UIBuilder.load(UI("PopupGroup.ui"));

  // 1) 플레이어 메뉴 카드: 힌트 두 줄 + 닫기 X 가 제목·본문을 덮지 않게(다른 카드 팝업과 같은 ~40px)
  b.patch("PlayerInteractPopup/Card", { rect_size: [340, 344] });
  b.patch("PlayerInteractPopup/Card/Hint", { pos: [0, -116], rect_size: [316, 64] });
  b.patchComponent("PlayerInteractPopup/Card/Hint", TXT, { Overflow: 0, BestFit: false });
  b.patch("PlayerInteractPopup/Card/BtnClose", { rect_size: [40, 40] });

  // 2) 영지 초대 수신 카드: 닫기 X 축소(수락/거절이 본 동작)
  b.patch("EstateInvitePopup/Card/BtnClose", { rect_size: [40, 40] });

  // 3) 영지 권한: 빈 본문 안내 문구(컨트롤러가 Bg/EmptyHint 를 켜고 끈다)
  b.sprite("PermissionPopup/Bg/EmptyHint", {
    anchor: "middle-center", pos: [0, 20], rect_size: [340, 130], alpha: 0, raycast: false, enable: false,
    text: "", text_size: 20, text_color: "#C9BFB2", text_alignment: 4, text_overflow: 0,
  });

  // 4) 연구소: 설명·진행 문구 칸을 키우고 말줄임을 끈다(줄바꿈은 코드에서 직접)
  b.patch("ResearchPopup/Bg/Details/Desc", { pos: [0, 24], rect_size: [340, 90] });
  patchText(b, "ResearchPopup/Bg/Details/Desc", { FontSize: 20, Overflow: 0 });
  b.patch("ResearchPopup/Bg/Details/ProgressText", { pos: [0, -114], rect_size: [340, 52] });
  patchText(b, "ResearchPopup/Bg/Details/ProgressText", { FontSize: 20, Overflow: 0 });

  // 5) 퀘스트 보상 수량: 칸 아래 경계선에 걸려 잘리던 글자를 6px 올리고 검은 외곽선
  for (let i = 1; i <= 4; i++) {
    const c = `QuestPopup/Details/RewardSlot${i}/Count`;
    b.patch(c, { pos: [0, 12] });
    b.patchComponent(c, TXT, { OutlineWidth: 0.25, FaceDilate: 0.25, OutlineColor: rgba(0, 0, 0, 1) });
  }

  // 6) 가방: 장착 배지(E/장) — 수량 글자와 분리. 버리기 수량 [최소][-][수량][+][최대]
  b.sprite("InventoryPopup/Grid/ItemSlot/EquipBadge", {
    anchor: "top-left", pos: [4, -4], rect_size: [24, 24], color: "#0F9D73", alpha: 1, raycast: false, enable: false,
    image_ruid: DEFAULT_SKIN, sprite_type: 1,
    text: "E", text_size: 16, text_color: "#FFFFFF", text_bold: true, text_alignment: 4, text_overflow: 0,
  });
  {
    const minus = "InventoryPopup/DiscardPopup/Card/BtnMinus";
    const s = b.getComponent(minus, SPR);
    const ruid = (s.ImageRUID && (s.ImageRUID.DataId || s.ImageRUID)) || DEFAULT_SKIN;
    const t = b.getComponent(minus, LEG) || b.getComponent(minus, TXT);
    const fc = t && t.FontColor ? t.FontColor : rgba(1, 1, 1, 1);
    b.patch(minus, { pos: [-77, 25], rect_size: [52, 64] });
    b.patch("InventoryPopup/DiscardPopup/Card/CountText", { pos: [0, 25], rect_size: [88, 64] });
    b.patch("InventoryPopup/DiscardPopup/Card/BtnPlus", { pos: [77, 25], rect_size: [52, 64] });
    for (const [name, label, x] of [["BtnMin", "최소", -140], ["BtnMax", "최대", 140]]) {
      b.button(`InventoryPopup/DiscardPopup/Card/${name}`, label, {
        anchor: "middle-center", pos: [x, 25], rect_size: [60, 64], font_size: 18, sprite_type: s.Type ?? 0,
        image_ruid: String(ruid), bg_color: s.Color ? { ...s.Color } : null, color: { ...fc },
      });
    }
  }

  // 7) 포탈: 지역 한 줄 레이아웃용 너비 440 + 지역 라벨 6개(왼쪽 정렬) + 버튼 글자 20
  b.patch("WarpPopup/Bg", { rect_size: [440, 360] });
  b.patch("WarpPopup/Bg/TopBar", { rect_size: [440, 56] });
  b.patch("WarpPopup/Bg/AccentLine", { rect_size: [440, 3] });
  for (let i = 1; i <= 13; i++) patchText(b, `WarpPopup/Bg/Slot${i}`, { FontSize: 20 });
  for (let i = 1; i <= 6; i++) {
    b.sprite(`WarpPopup/Bg/RegionLabel${i}`, {
      anchor: "middle-center", pos: [0, 0], rect_size: [130, 44], alpha: 0, raycast: false, enable: false,
      text: "", text_size: 22, text_color: "#F5E6C8", text_alignment: 3, text_overflow: 0,
    });
  }

  // 8) 상점: 2열×3행 와이드 카드(글자 12~13px → 16~18px), 보유 수량 줄, 페이지 버튼 좌우 대칭
  {
    const cols = [-138, 138];
    const rows = [34, -62, -158];
    for (let i = 1; i <= 6; i++) {
      const s = `ShopPopup/Bg/Slot${i}`;
      const x = cols[(i - 1) % 2];
      const y = rows[Math.floor((i - 1) / 2)];
      b.patch(s, { pos: [x, y], rect_size: [268, 88] });
      b.patch(`${s}/Icon`, { pos: [-92, 0], rect_size: [56, 56] });
      b.patch(`${s}/ItemName`, { pos: [30, 20], rect_size: [170, 26] });
      patchText(b, `${s}/ItemName`, { FontSize: 18 });
      b.patch(`${s}/PriceText`, { pos: [30, -6], rect_size: [170, 22] });
      patchText(b, `${s}/PriceText`, { FontSize: 16, FontColor: rgba(0.99, 0.84, 0.4, 1) });
      b.sprite(`${s}/OwnText`, {
        anchor: "middle-center", pos: [30, -30], rect_size: [170, 22], alpha: 0, raycast: false,
        text: "", text_size: 15, text_color: "#C9BFB2", text_alignment: 4, text_overflow: 0,
      });
    }
    b.patch("ShopPopup/Bg/BtnPrevPage", { pos: [-130, -244], rect_size: [140, 52] });
    b.patch("ShopPopup/Bg/PageText", { pos: [0, -244], rect_size: [120, 40] });
    b.patch("ShopPopup/Bg/BtnNextPage", { pos: [130, -244], rect_size: [140, 52] });
    b.patchComponent("ShopPopup/Bg/BtnPrevPage", TXT, { Text: "< 이전" });
    b.patchComponent("ShopPopup/Bg/BtnNextPage", TXT, { Text: "다음 >" });
  }

  // 9) 화로: 슬롯 라벨 + 진행 막대(흰 막대 → 어두운 트랙 + 주황 채움)
  for (const [name, label, x, y] of [["InputLabel", "재료", -140, 118], ["FuelLabel", "연료", -140, 0], ["OutputLabel", "결과물", 140, 64]]) {
    b.sprite(`FurnacePopup/Bg/${name}`, {
      anchor: "middle-center", pos: [x, y], rect_size: [120, 24], alpha: 0, raycast: false,
      text: label, text_size: 18, text_color: "#E8D5B0", text_alignment: 4, text_overflow: 0,
    });
  }
  b.patch("FurnacePopup/Bg/ProgressBar", { rect_size: [132, 26] });
  b.patchComponent("FurnacePopup/Bg/ProgressBar", SPR, { Color: rgba(0.10, 0.08, 0.07, 1) });
  b.patchComponent("FurnacePopup/Bg/ProgressBar", SLIDER, {
    FillRectColor: rgba(0.98, 0.45, 0.09, 1), FillRectPadding: { left: 3, right: 3, top: 3, bottom: 3 },
  });

  // 10) 의뢰 게시판: 목록 컨테이너를 24px 내려 부제 줄이 첫 의뢰에 가리지 않게
  b.patch("RequestPopup/Bg/List", { pos: [0, -64] });

  // 11) 캐릭터창 게이지: HUD 프로필 바와 같은 9-slice 바 + 폭 조절 채움(찌그러진 원형 이미지 교체)
  {
    const hud = UIBuilder.load(UI("HUDGroup.ui"));
    const dataId = (p) => {
      const c = hud.getComponent(p, SPR);
      return c.ImageRUID.DataId || c.ImageRUID;
    };
    const bgRuid = dataId("UIMyInfo/info_bottom/Hp/img_background");
    const barRuid = dataId("UIMyInfo/info_bottom/Hp/img_bar");
    for (const k of ["Hp", "Mp", "Sta", "Xp"]) {
      const bar = `CharacterPopup/Stat/${k}/Bar`;
      const fill = `${bar}/Fill`;
      b.patchComponent(bar, SPR, { ImageRUID: ref(bgRuid), Type: 1, Color: rgba(1, 1, 1, 1) });
      b.patch(fill, { anchor: "middle-left", pos: [2, 0], pivot: [0, 0.5], rect_size: [284, 22] });
      b.patchComponent(fill, SPR, { ImageRUID: ref(barRuid), Type: 1, FillAmount: 1 });
    }
  }

  b.write(UI("PopupGroup.ui"));
}

// ───────────────────────── HUDGroup ─────────────────────────
{
  const b = UIBuilder.load(UI("HUDGroup.ui"));

  // 프로필 뒤판: 밝은 모래·잔디 위에서 글자가 묻히지 않게 어두운 반투명(부모 렌더러라 자식 아래에 그려진다)
  b.patchComponent("UIMyInfo", SPR, { ImageRUID: ref(DEFAULT_SKIN), Type: 1, Color: rgba(0.059, 0.09, 0.165, 0.55) });

  // 퀘스트 완료 토스트: 좌측 퀘스트 추적창(오른쪽 끝 x=741, 아래 끝 y=185)과 겹치지 않게 아래로
  b.patch("QuestToast", { pos: [0, -200] });

  // 채팅 탭: 라벨 칸이 20~30px 이라 글자 단위로 줄바꿈되던 문제 → 탭 폭에 맞춘 가운데 정렬 칸
  for (const t of ["TabAll", "TabWhisper", "TabSystem"]) {
    const l = `ChatPanel/${t}/Label`;
    b.patch(l, { anchor: "middle-center", pos: [0, 0], pivot: [0.5, 0.5], rect_size: [100, 40] });
    b.patchComponent(l, TXT, { HorizontalAlignment: 2, Overflow: 0, BestFit: false });
  }

  b.write(UI("HUDGroup.ui"));
}

// ───────────────────────── NamingGroup ─────────────────────────
{
  const b = UIBuilder.load(UI("NamingGroup.ui"));
  const input = "Modal/Window/NameInput";
  b.patchComponent(input, SPR, { Color: rgba(0.071, 0.055, 0.047, 0.98) });
  b.patchComponent(input, "MOD.Core.TextGUIRendererInputComponent", { PlaceHolderColor: rgba(0.612, 0.639, 0.686, 1) });
  // 오류 문구는 안내 줄을 덮어쓰지 않고 입력창 바로 아래 별도 줄에(컨트롤러가 ErrorText 를 켜고 끈다)
  b.sprite("Modal/Window/ErrorText", {
    anchor: "middle-center", pos: [0, -66], rect_size: [540, 30], alpha: 0, raycast: false, enable: false,
    text: "", text_size: 20, text_color: "#F87171", text_alignment: 4, text_overflow: 0,
  });
  b.write(UI("NamingGroup.ui"));
}

console.log("done");
