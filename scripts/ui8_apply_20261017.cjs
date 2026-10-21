// UI 개편 ui8 (2026-10-17) — 커스텀 에셋 팩(조각 스킨)을 전 화면에 적용한다.
// 기준: docs/design/ui/ui_refinement_complete_with_assets_v7 지침서·목업 + msw_custom_ui_assets_pack.
// 재실행 가능(멱등): Skin 자식은 매번 지우고 다시 만들고, 나머지는 같은 값으로 덮어쓴다.
// 첫 실행 전 원본은 scratch/ui-before-ui8-20261017/ 에 백업한다.
// 디자인 언어:
//   창 = ui8_popup_frame(갈색 머리·바닥 + 양피지 몸통), 밝은 글자가 들어가는 안쪽 판 = ui8_fish_board(진한 나무 판)
//   목록 줄 = ui8_row(_wide) / 선택 = _sel, 버튼 = amber(주행동)·oak(보조)·green(수락)·red(삭제·거절)·disabled
//   탭 = ui8_tab_on/off, 아이템 칸 = ui8_slot, 닫기 = ui8_btn_close
//   양피지 위 글자 = 진한 갈색(INK), 머리띠 위 제목 = 크림(CREAM)
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const K = require("./ui8_kit.cjs");

const root = path.join(__dirname, "..");
const UI = (f) => path.join(root, "ui", f);
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const TXT = "MOD.Core.TextGUIRendererComponent";
const LEG = "MOD.Core.TextComponent";
const UIT_ = "MOD.Core.UITransformComponent";

const FILES = ["PopupGroup.ui", "HUDGroup.ui", "DialogGroup.ui", "NamingGroup.ui", "AnvilGroup.ui", "TransitionGroup.ui", "TooltipGroup.ui"];
const backupDir = path.join(root, "scratch", "ui-before-ui8-20261017");
fs.mkdirSync(backupDir, { recursive: true });
for (const f of FILES) {
  const dst = path.join(backupDir, f);
  if (!fs.existsSync(dst)) fs.copyFileSync(UI(f), dst);
}

const rgba = (r, g, b, a = 1) => ({ r, g, b, a });
const INK = rgba(0.24, 0.14, 0.07);
const INK_SOFT = rgba(0.43, 0.31, 0.2);
const INK_ACCENT = rgba(0.6, 0.33, 0.04);
const INK_RED = rgba(0.7, 0.16, 0.12);
const CREAM = rgba(1, 0.94, 0.8);
const ON_AMBER = rgba(0.27, 0.13, 0.04);
const STA_TINT = rgba(0.86, 0.66, 0.3);

// ───────── 공통 헬퍼 ─────────
function textComp(b, p) {
  if (b.hasComponent(p, TXT)) return TXT;
  if (b.hasComponent(p, LEG)) return LEG;
  return null;
}
function color(b, p, c) {
  const t = textComp(b, p);
  if (!t) throw new Error("글자 없음: " + p);
  b.patchComponent(p, t, { FontColor: c });
}
function textSet(b, p, upd) {
  const t = textComp(b, p);
  if (!t) throw new Error("글자 없음: " + p);
  const m = { ...upd };
  if (t === LEG && "FontStyle" in m) { m.Bold = m.FontStyle === 1; delete m.FontStyle; }
  // 구형 TextComponent 외곽선은 UseOutLine + 픽셀 두께
  if (t === LEG && "OutlineWidth" in m) { m.UseOutLine = true; m.OutlineWidth = 2; }
  b.patchComponent(p, t, m);
}
const ink = (b, ...ps) => ps.forEach((p) => color(b, p, INK));
const inkSoft = (b, ...ps) => ps.forEach((p) => color(b, p, INK_SOFT));
const inkAccent = (b, ...ps) => ps.forEach((p) => color(b, p, INK_ACCENT));
function hide(b, ...ps) {
  for (const p of ps) if (b.find(p)) K.hideOwn(b, p);
}
function frame(b, p, opt) { K.skin9(b, p, "ui8_popup_frame", opt); }
function board(b, p) {
  const [W, H] = K.rectOf(b, p);
  const k = Math.min(1, (W - 4) / 56, (H - 4) / 56);
  K.skin9(b, p, "ui8_fish_board", { k });
}
// 스크롤 목록(ScrollLayoutGroup) 상자: 자식으로 넣은 Skin 을 레이아웃이 첫 항목으로 배치해 첫 줄 위에
// 조각이 끼어 보였다(2026-10-20 제작자 보고) → 판을 목록 바로 앞 형제(<이름>_Back)로 깐다. 목록은 움직이지 않는다.
function chipBar(b, p) { K.skin3(b, p, "ui8_gauge_track"); }
function boardBack(b, p) {
  const sp = K.rel(b.find(p).path) + "/Skin";
  if (b.find(sp)) b.remove(sp);
  const [W, H] = K.rectOf(b, p);
  const k = Math.min(1, (W - 4) / 56, (H - 4) / 56);
  K.backdrop(b, p, (q) => K.skin9(b, q, "ui8_fish_board", { k }));
}
function darkPanel(b, p) {
  const [W, H] = K.rectOf(b, p);
  const k = Math.min(0.75, (W - 4) / 84, (H - 4) / 84);
  K.skin9(b, p, "ui8_darkwood_filigree", { k });
}
// 자기 글자를 쓰는 엔티티인지(글자 컴포넌트가 있고 크기가 1보다 큼 — 템플릿의 fs1 빈 글자는 제외)
function ownsText(b, p) {
  const t = textComp(b, p);
  if (!t) return false;
  return Number(b.getComponent(p, t).FontSize || 0) > 1;
}
// 버튼·탭은 통째 그림(자기 글자를 덮지 않게). variant = amber | oak | green | olive | red | disabled
// 나무 버튼 그림은 아래 테두리가 두꺼워 앞면 중심이 칸 중심보다 약 4.6% 위다 → 글자 영역 아래를 9% 깎아 같이 올린다
function liftText(b, p, ratio) {
  const t = textComp(b, p);
  if (!t) return;
  const [, H] = K.rectOf(b, p);
  b.patchComponent(p, t, { Padding: { left: 0, right: 0, top: 0, bottom: Math.round(H * ratio) } });
}
function btn(b, p, variant) {
  K.full(b, p, "ui8_btn_" + variant);
  if (textComp(b, p)) color(b, p, variant === "amber" ? ON_AMBER : CREAM);
  liftText(b, p, 0.09);
}
function tab(b, p, on) {
  K.full(b, p, on ? "ui8_tab_on" : "ui8_tab_off");
  if (textComp(b, p)) color(b, p, on ? ON_AMBER : CREAM);
  liftText(b, p, 0.08);
}
// 목록 줄: 내용이 자식이면 조각, 자기 글자가 있으면 통째
function row(b, p, sel = false) {
  const [W] = K.rectOf(b, p);
  const asset = "ui8_row" + (W > 470 ? "_wide" : "") + (sel ? "_sel" : "");
  if (ownsText(b, p)) K.full(b, p, asset);
  else K.skin3(b, p, asset);
}
// 글자를 가진 고정 상자: 앞 형제로 줄 배경을 깐다
function stripBack(b, p) {
  const [W] = K.rectOf(b, p);
  K.backdrop(b, p, (q) => K.skin3(b, q, W > 470 ? "ui8_row_wide" : "ui8_row"));
}
function slot(b, p) { K.simple(b, p, "ui8_slot"); }
// 닫기: 머리띠 안 오른쪽 위. 그림 72×74 → 50×52
function close(b, p) {
  b.patch(p, { anchor: "top-right", pivot: [1, 1], pos: [-14, -3], rect_size: [50, 52] });
  K.simple(b, p, "ui8_btn_close");
  if (textComp(b, p)) textSet(b, p, { Text: "" });
}
function title(b, p) { textSet(b, p, { FontColor: CREAM }); }
function find(b, p) { return !!b.find(p); }
function each(b, prefix, fn) {
  // prefix + 숫자 로 끝나는 형제 전부(Slot1, Slot2 …)
  const re = new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\d+$");
  for (const e of b.listEntities()) {
    const r = K.rel(e.path);
    if (re.test(r)) fn(r);
  }
}

// ───────── PopupGroup ─────────
{
  const b = UIBuilder.load(UI("PopupGroup.ui"));

  // 종이 큰창 5종: 나무 프레임(25e9e895) + 종이 속지 → ui8 창 하나로
  for (const pop of ["InventoryPopup", "CraftingPopup", "CollectionPopup", "QuestPopup", "CharacterPopup"]) {
    frame(b, pop + "/Bg");
    hide(b, pop + "/Paper", pop + "/Bg/Inner");
    title(b, pop + "/Title");
    // 제목 기준점이 윗변(pivot y=1)이라 -28 이면 중심이 -52 로 쳐진다 → 중심을 머리띠(0~58) 가운데로
    b.patch(pop + "/Title", { pos: [0, -5] });
    close(b, pop + "/BtnClose");
  }

  // 가방
  for (const t of ["TabAll", "TabRes", "TabEquip"]) tab(b, "InventoryPopup/" + t, t === "TabAll");
  // 하단 "보유 품목 / 보유 코인": 아래 기준점에서 30 이면 바닥 나무띠(약 49px) 경계에 걸쳐 떠 보인다 → 띠 가운데(아래 8~42)
  b.patch("InventoryPopup/CapacityText", { pos: [60, 8] });
  b.patch("InventoryPopup/CoinText", { pos: [-60, 8] });
  slot(b, "InventoryPopup/Grid/ItemSlot");
  board(b, "InventoryPopup/Tooltip/Bg");
  btn(b, "InventoryPopup/Tooltip/BtnDiscard", "red");
  // 버리기 모달 = 작은 창
  {
    const c = "InventoryPopup/DiscardPopup/Card";
    frame(b, c);
    b.patch(c + "/TitleText", { pos: [0, 137] });
    title(b, c + "/TitleText");
    inkAccent(b, c + "/ItemText");
    ink(b, c + "/CountText");
    btn(b, c + "/BtnCancel", "oak");
    b.patch(c + "/BtnCancel", { pos: [0, -106] });
    btn(b, c + "/BtnDelete", "red");
    btn(b, c + "/BtnDrop", "green");
    btn(b, c + "/BtnMin", "oak");
    btn(b, c + "/BtnMax", "oak");
    for (const [n, img] of [["BtnMinus", "ui8_btn_minus"], ["BtnPlus", "ui8_btn_plus"]]) {
      b.patch(c + "/" + n, { rect_size: [60, 62] });
      K.simple(b, c + "/" + n, img);
      textSet(b, c + "/" + n, { Text: "" });
    }
  }

  // 제작대
  // 칩 줄(높이 44) 바탕: 큰 나무판을 0.7배로 줄이면 겹테두리가 뭉개져 "((" 처럼 지저분했다(2026-10-20)
  // → 원래 높이 42 인 알약 트랙을 거의 1:1 로 쓴다
  chipBar(b, "CraftingPopup/CategoryBar/Bg");
  chipBar(b, "CraftingPopup/TierBar/Bg");
  tab(b, "CraftingPopup/CategoryBar/ChipTemplate", false);
  tab(b, "CraftingPopup/TierBar/ChipTemplate", false);
  boardBack(b, "CraftingPopup/List");
  row(b, "CraftingPopup/List/RecipeTemplate");
  btn(b, "CraftingPopup/Details/BtnCraft", "amber");
  each(b, "CraftingPopup/Details/Slot", (s) => slot(b, s + "/Bg"));

  // 도감
  chipBar(b, "CollectionPopup/CategoryBar/Bg");
  tab(b, "CollectionPopup/CategoryBar/ChipTemplate", false);
  for (const t of ["TabItem", "TabMonster", "TabAchv"]) tab(b, "CollectionPopup/" + t, t === "TabItem");
  boardBack(b, "CollectionPopup/ListScroll");
  row(b, "CollectionPopup/ListScroll/RowTemplate");

  // 퀘스트
  for (const t of ["TabProgress", "TabReady", "TabDone"]) tab(b, "QuestPopup/" + t, t === "TabProgress");
  boardBack(b, "QuestPopup/ListScroll");
  row(b, "QuestPopup/ListScroll/RowTemplate");
  btn(b, "QuestPopup/Details/BtnAbandon", "red");
  btn(b, "QuestPopup/Details/BtnTrack", "green");
  each(b, "QuestPopup/Details/RewardSlot", (s) => slot(b, s));

  // 캐릭터
  board(b, "CharacterPopup/Profile");
  board(b, "CharacterPopup/Stat/Power");
  btn(b, "CharacterPopup/Stat/BtnPermission", "oak");
  for (const [n, kind] of [["Hp", "hp"], ["Mp", "mp"], ["Sta", "st"], ["Xp", "exp"]]) {
    K.skin3(b, "CharacterPopup/Stat/" + n + "/Bar", "ui8_gauge_track");
    K.skin3(b, "CharacterPopup/Stat/" + n + "/Bar/Fill", "ui8_gauge_" + kind);
    // 수치 글자가 진한 빈 트랙 위에서 묻힘 → 굵게 + 검은 외곽선
    // (FontSize 18 + 외곽선 0.4 는 글자가 아예 사라졌다 — Play 실측. 16 + 0.25 유지)
    textSet(b, "CharacterPopup/Stat/" + n + "/Bar/Val", { FontColor: rgba(1, 0.98, 0.94), FontSize: 16, FontStyle: 1, OutlineWidth: 0.25, OutlineColor: rgba(0, 0, 0, 1) });
    if (kind === "st") tintSkin(b, "CharacterPopup/Stat/" + n + "/Bar/Fill", STA_TINT);
  }  for (const s of ["armor", "gloves", "helmet", "shield", "shoes", "weapon"]) slot(b, "CharacterPopup/Gear/Slot_" + s);
  for (const r of ["STR", "DEX", "INT", "SPI", "VIT"]) {
    const p = "CharacterPopup/Ability/Row_" + r + "/BtnPlus";
    b.patch(p, { rect_size: [64, 66] });
    K.simple(b, p, "ui8_btn_plus");
    textSet(b, p, { Text: "" });
  }

  // 카드형 창: 어두운 판(4fea64a3) + 머리띠 + 금줄 → ui8 창. 머리띠·금줄은 숨긴다.
  const cards = {
    ShopPopup: "Bg", RequestPopup: "Bg", ResearchPopup: "Bg", WarpPopup: "Bg", PermissionPopup: "Bg",
    BossContentsPopup: "Bg", ChestPopup: "Bg", FurnacePopup: "Bg", RaidDifficultyPopup: "Bg", SkillTreePopup: "Bg",
    EstateInvitePopup: "Card", PlayerInteractPopup: "Card",
  };
  for (const [pop, bg] of Object.entries(cards)) {
    const p = pop + "/" + bg;
    if (pop === "ShopPopup") b.patch(p, { rect_size: [600, 640] });
    if (pop === "EstateInvitePopup") b.patch(p, { rect_size: [440, 320] });
    frame(b, p);
    hide(b, p + "/TopBar", p + "/AccentLine", p + "/BgInner");
    title(b, p + "/Title");
    if (pop === "WarpPopup") {
      // 포탈 창은 UIWarpController 가 닫기를 가운데 기준 좌표로 재배치한다 → 기준점은 가운데 그대로, 그림·크기만
      b.patch(p + "/BtnClose", { anchor: "middle-center", pivot: [0.5, 0.5], rect_size: [50, 52] });
      K.simple(b, p + "/BtnClose", "ui8_btn_close");
      textSet(b, p + "/BtnClose", { Text: "" });
    } else if (find(b, p + "/BtnClose")) close(b, p + "/BtnClose");
    else {
      // 상점은 닫기가 금줄의 자식이다 → 금줄(투명)을 머리띠 크기로 키워 기준 상자로 쓴다
      const [W] = K.rectOf(b, p);
      b.patch(p + "/AccentLine", { pos: [0, 0], rect_size: [W, 57] });
      close(b, p + "/AccentLine/BtnClose");
    }
  }

  // 상점
  {
    const s = "ShopPopup/Bg";
    tab(b, s + "/BtnTabBuy", true);
    tab(b, s + "/BtnTabSell", false);
    each(b, s + "/Chip", (c) => tab(b, c, c.endsWith("Chip1")));
    btn(b, s + "/BtnSort", "oak");
    for (const n of ["BtnPrevPage", "BtnNextPage"]) { btn(b, s + "/" + n, "oak"); b.patch(s + "/" + n, { pos: [n === "BtnPrevPage" ? -130 : 130, -236] }); }
    b.patch(s + "/PageText", { pos: [0, -236] });
    each(b, s + "/Slot", (c) => {
      row(b, c);
      // 구형 TextComponent 자식 글자가 ui8 줄 위에서 그려지지 않음(Play 실측) → 신형 TextGUIRenderer 로 교체(id 유지)
      for (const [n, fs, col] of [["ItemName", 18, rgba(0.96, 0.94, 0.9)], ["PriceText", 16, rgba(0.99, 0.84, 0.4)]]) {
        const q = c + "/" + n;
        if (!b.hasComponent(q, LEG)) continue;
        const t = b.getComponent(q, UIT_);
        b.text(q, "", { size: fs, color: col, alignment: 3, anchor: "middle-center", pos: [Number(t.anchoredPosition.x), Number(t.anchoredPosition.y)], rect_size: [Number(t.RectSize.x), Number(t.RectSize.y)] });
      }
    });
    inkAccent(b, s + "/CoinText", s + "/PageText");
  }

  // 의뢰 게시판
  {
    const s = "RequestPopup/Bg";
    board(b, s + "/List/ListBg");
    row(b, s + "/List/RequestTemplate", false);
    if (find(b, s + "/List/RequestTemplate/BtnDeliver")) btn(b, s + "/List/RequestTemplate/BtnDeliver", "amber");
    inkAccent(b, s + "/DayText");
    inkSoft(b, s + "/HintText");
  }

  // 연구소
  {
    const s = "ResearchPopup/Bg";
    board(b, s + "/List/ListBg");
    board(b, s + "/Details/DetBg");
    row(b, s + "/List/ResearchTemplate");
    btn(b, s + "/Details/BtnStart", "amber");
    slot(b, s + "/Details/Slot1");
  }

  // 포탈 목록 — 제목·닫기 위치는 UIWarpController 가 런타임 재배치
  {
    const s = "WarpPopup/Bg";
    each(b, s + "/Slot", (c) => btn(b, c, "oak"));
    each(b, s + "/Header", (c) => inkAccent(b, c));
    each(b, s + "/RegionLabel", (c) => ink(b, c));
    // 지역 줄 바이옴 아이콘 풀(UIWarpController.RegionIcon*, 데이터 = PortalDestinationDataSet.IconRUID)
    for (let i = 1; i <= 6; i++) {
      b.sprite(s + "/RegionIcon" + i, { anchor: "middle-center", pos: [0, 0], rect_size: [38, 38], image_ruid: K.ruid("ui8_icon_biome_field"), color: "#FFFFFF", sprite_type: 0, raycast: false, enable: false });
      b.patchComponent(s + "/RegionIcon" + i, SPR, { PreserveSprite: 1 });
    }
  }

  // 영지 권한
  {
    const s = "PermissionPopup/Bg";
    inkSoft(b, s + "/Notice", s + "/EmptyHint");
    b.patch(s + "/Notice", { pos: [0, -140] });
    each(b, s + "/Row", (r) => {
      ink(b, r + "/Name");
      // ON/OFF 스위치 그림(UIPermissionController 가 권한 여부로 toggle_on/off 전환, 글자 비움)
      K.full(b, r + "/BtnToggle", "ui8_toggle_off");
      textSet(b, r + "/BtnToggle", { Text: "" });
    });
  }

  // 보스 컨텐츠
  {
    const s = "BossContentsPopup/Bg";
    // "주요 보상" 줄을 정보 패널 아래에 넣는다 → 창을 118 늘리고 안내·주간·입장을 그만큼 내린다(재실행해도 같은 값)
    b.patch(s, { rect_size: [760, 850], pos: [0, 40] }); // 늘어난 만큼 위로 — 아래 퀵슬롯과 겹치지 않게
    b.patch(s + "/HintBox", { pos: [0, -660] });
    b.patch(s + "/WeeklyBox", { pos: [-200, -712] });
    b.patch(s + "/BtnEnter", { pos: [170, -712] });
    {
      // 진한 나무 판 + 알약 라벨 + 나무 칸 3개(아이콘은 UIBossContentsController.RefreshRewards 가 드롭 표로 채움)
      const rr = s + "/RewardRow";
      b.sprite(rr, { anchor: "top-center", pos: [0, -556], rect_size: [720, 92], color: { r: 1, g: 1, b: 1, a: 0 }, sprite_type: 0, raycast: false });
      board(b, rr);
      b.sprite(rr + "/Label", { anchor: "middle-left", pos: [22, 0], rect_size: [150, 40], image_ruid: K.ruid("ui8_pill_badge"), color: "#FFFFFF", sprite_type: 0, raycast: false,
        text: "주요 보상", text_size: 22, text_color: "#FFE7B0", text_bold: true });
      for (let k = 1; k <= 3; k++) {
        if (find(b, rr + "/RewardSlot" + k)) b.remove(rr + "/RewardSlot" + k); // 첫 이름(퀘스트 창과 충돌) 정리
        const sl = rr + "/BossRewardSlot" + k;
        b.sprite(sl, { anchor: "middle-left", pos: [200 + (k - 1) * 84, 0], rect_size: [70, 70], image_ruid: K.ruid("ui8_slot"), color: "#FFFFFF", sprite_type: 0, raycast: false });
        b.sprite(sl + "/Icon", { anchor: "middle-center", pos: [0, 0], rect_size: [48, 48], image_ruid: K.ruid("ui8_icon_coin_gold"), color: "#FFFFFF", sprite_type: 0, raycast: false, enable: false });
        // 가방 칸과 같은 방식(Simple·None·가운데). AspectOnly 면 하단 피벗 드롭 아이콘이 칸 위로 밀린다(pitfalls 규칙 — 퀘스트 보상칸 사고)
        b.patchComponent(sl + "/Icon", SPR, { PreserveSprite: 0 });
      }
    }
    for (const n of ["BossList", "Detail"]) board(b, s + "/" + n);
    for (const n of ["HintBox", "WeeklyBox"]) stripBack(b, s + "/" + n);
    each(b, s + "/BossList/Slot", (c) => row(b, c, c.endsWith("Slot1")));
    btn(b, s + "/BtnEnter", "amber");
    inkAccent(b, s + "/HeadList", s + "/HeadDetail");
  }

  // 보관함 · 화로
  each(b, "ChestPopup/Bg/Slot", (c) => slot(b, c));
  {
    const s = "FurnacePopup/Bg";
    for (const n of ["InputSlot", "FuelSlot", "OutputSlot"]) slot(b, s + "/" + n);
    ink(b, s + "/InputLabel", s + "/FuelLabel", s + "/OutputLabel");
    inkAccent(b, s + "/FuelText");
    // 진행 막대 → 나무 화살표(빈 화살표 바탕 + 가로로 차오르는 채움 화살표). 슬라이더 채움은 숨긴다(늘리면 화살표가 찌그러짐).
    // 채움량은 UIFurnaceController 가 ArrowFill.FillAmount 로 넘긴다.
    const pb = s + "/ProgressBar";
    b.patch(pb, { rect_size: [156, 47] });
    b.patchComponent(pb, SPR, { ImageRUID: { DataId: K.ruid("ui8_furnace_arrow_empty") }, Color: rgba(1, 1, 1, 1), Type: 0 });
    b.patchComponent(pb, "MOD.Core.SliderComponent", { FillRectColor: rgba(1, 1, 1, 0) });
    b.sprite(pb + "/ArrowFill", { anchor: "stretch", pos: [0, 0], rect_size: [156, 47], image_ruid: K.ruid("ui8_furnace_arrow_fill"), color: "#FFFFFF", sprite_type: 3, fill_method: 0, raycast: false });
    b.patchComponent(pb + "/ArrowFill", SPR, { FillOrigin: 0, FillAmount: 0 });
  }

  // 난이도
  {
    const s = "RaidDifficultyPopup/Bg";
    board(b, s + "/DiffList");
    for (const n of ["HintBox", "WeeklyBox"]) stripBack(b, s + "/" + n);
    each(b, s + "/DiffList/Chip", (c) => row(b, c, false));
    btn(b, s + "/BtnEnter", "amber");
    inkAccent(b, s + "/NameBox");
  }

  // 영지 초대 · 플레이어 메뉴
  {
    const s = "EstateInvitePopup/Card";
    b.patch(s + "/Message", { pos: [0, -104] });
    ink(b, s + "/Message");
    btn(b, s + "/BtnAccept", "green");
    btn(b, s + "/BtnDecline", "red");
    b.patch(s + "/BtnAccept", { pos: [-100, 60] });
    b.patch(s + "/BtnDecline", { pos: [100, 60] });
    const q = "PlayerInteractPopup/Card";
    ink(b, q + "/TargetName");
    inkSoft(b, q + "/Hint");
    btn(b, q + "/BtnInvite", "green");
    btn(b, q + "/BtnWhisper", "oak");
    b.patch(q + "/BtnInvite", { pos: [0, 56] });
    b.patch(q + "/BtnWhisper", { pos: [0, 128] });
  }

  // 스킬트리
  {
    const s = "SkillTreePopup/Bg";
    tab(b, s + "/TabCommon", true);
    tab(b, s + "/TabJob", false);
    tab(b, s + "/CatTabs/CatTab_1", false);
    board(b, s + "/EquipBar/Bg");
    board(b, s + "/SkillDetailPanel/Bg");
    hide(b, s + "/SkillDetailPanel/HeaderBar");
    board(b, s + "/SkillList");
    btn(b, s + "/EquipBar/BtnLevelUp", "green");
    for (const k of ["Q", "W", "E", "R"]) slot(b, s + "/EquipBar/Btn" + k);
    // 정보 줄(트래퍼 · Lv) = 머리띠(0~58) 바로 아래 62~92. -82 는 아래 탭(104~)과 겹쳐 쳐져 보였다(2026-10-20)
    b.patch(s + "/SPText", { pos: [0, -62] });
    inkAccent(b, s + "/SPText");
    inkSoft(b, s + "/JobHint");
  }

  K.normalizeOrder(b).write(UI("PopupGroup.ui"));
}

// 노란 기력 채움은 너무 밝아 흰 수치 글자가 묻힌다 → 조각에 호박색 틴트(STA_TINT, Play 실측으로 고른 값)
function tintSkin(b, p, c) {
  const base = K.rel(b.find(p).path) + "/Skin";
  for (const k of ["l", "c", "r"]) b.patchComponent(base + "/" + k, SPR, { Color: c });
}

// 게이지: 빈 트랙(3조각) + 색 채움(3조각). 채움은 컨트롤러가 폭을 바꾸고 조각이 따라 늘어난다.
function gauge(b, track, fill, kind) {
  K.skin3(b, track, "ui8_gauge_track");
  K.skin3(b, fill, "ui8_gauge_" + kind);
}

// ───────── HUDGroup ─────────
{
  const b = UIBuilder.load(UI("HUDGroup.ui"));

  // 좌상단 프로필: 어떤 바닥 타일 위에서도 읽히게 진한 나무 판
  board(b, "UIMyInfo");
  for (const [n, kind] of [["Hp", "hp"], ["Mp", "mp"], ["Sta", "st"], ["Exp", "exp"]]) {
    gauge(b, "UIMyInfo/info_bottom/" + n + "/img_background", "UIMyInfo/info_bottom/" + n + "/img_bar", kind);
    if (kind === "st") tintSkin(b, "UIMyInfo/info_bottom/" + n + "/img_bar", STA_TINT);
    textSet(b, "UIMyInfo/info_bottom/" + n + "/text_value", { FontColor: rgba(1, 0.98, 0.94), FontStyle: 1, OutlineWidth: 0.25, OutlineColor: rgba(0, 0, 0, 1) });
  }

  // 우측 텍스트 버튼 3개
  for (const n of ["BtnCollection", "BtnSkillTree", "BtnBossRaid"]) btn(b, n, "oak");

  // 모바일 조작 버튼: 아이콘이 그려진 나무 버튼 그림으로, 기존 아이콘은 숨긴다(글자 라벨은 유지)
  for (const [n, img] of [["BtnBag", "ui8_hud_bag"], ["BtnCraft", "ui8_hud_craft"], ["BtnInfo", "ui8_hud_info"],
    ["BtnInteract", "ui8_hud_interact"], ["BtnJump", "ui8_hud_jump"], ["BtnMine", "ui8_hud_attack"]]) {
    const p = "MobileUI/" + n;
    K.simple(b, p, img);
    hide(b, p + "/Icon");
    textSet(b, p + "/Label", { FontColor: CREAM, OutlineWidth: 0.2, OutlineColor: rgba(0.17, 0.09, 0.04, 1) });
  }

  // 단축키 배지(PC 전용): 버튼 왼쪽 위 모서리. 키는 PlayerController.OnKeyDown 실측(2026-10-18).
  // 글자는 배지 그림과 같은 엔티티에 얹는다(pitfalls #50), 클릭은 막지 않는다.
  for (const [btnPath, key] of [["MobileUI/BtnInfo", "H"], ["MobileUI/BtnCraft", "C"], ["MobileUI/BtnBag", "I"],
    ["MobileUI/BtnInteract", "F"], ["MobileUI/BtnJump", "Alt"], ["MobileUI/BtnMine", "Ctrl"],
    ["BtnCollection", "J"], ["BtnSkillTree", "K"], ["BtnBossRaid", "B"]]) {
    const p = btnPath + "/KeyBadge";
    const w = key.length === 1 ? 34 : 58;
    b.sprite(p, { anchor: "top-left", pos: [4, -4], rect_size: [w, 30], image_ruid: K.ruid("ui8_pill_badge"), color: "#FFFFFF", sprite_type: 0, raycast: false,
      text: key, text_size: 20, text_color: "#FFF4DC", text_bold: true });
    b.patchComponent(p, "MOD.Core.UITransformComponent", { ActivePlatform: 1 });
  }

  // 스킬 칸(Q W E R)
  each(b, "SkillBar/SkillSlot", (s) => slot(b, s));

  // 퀵슬롯: 바깥 크기는 그대로, 단축키·수량 글자만 키운다(지침서 §1.1)
  each(b, "QuickSlots/Slot", (s) => {
    textSet(b, s + "/Count", { FontSize: 24, FontStyle: 1, OutlineWidth: 0.25, OutlineColor: rgba(0, 0, 0, 1) });
    textSet(b, s + "/Number", { FontSize: 22, FontStyle: 1, FontColor: rgba(1, 0.97, 0.93, 1), OutlineWidth: 0.25, OutlineColor: rgba(0, 0, 0, 1) });
  });

  // 퀘스트 추적·채팅·스킬 툴팁 = 금빛 모서리 진한 나무 판
  darkPanel(b, "QuestTracker/Bg");
  darkPanel(b, "ChatPanel");
  for (const t of ["TabAll", "TabWhisper", "TabSystem"]) tab(b, "ChatPanel/" + t, t === "TabAll");
  btn(b, "ChatPanel/BtnSend", "oak");
  btn(b, "ChatPanel/BtnToggle", "oak");
  darkPanel(b, "SkillTooltip/Bg");
  hide(b, "SkillTooltip/BgInner");

  // 퀘스트 완료 토스트 = 나뭇잎 초록 배너
  K.skin3(b, "QuestToast/Bg", "ui8_toast_leaf");

  // 낚시: 나무 보드 + 단색 캡슐 바(트랙 3조각, 채움은 Filled 통째 그림 — 컨트롤러가 FillAmount 와 그림을 바꾼다)
  board(b, "FishingGauge/Panel");
  for (const [bg, fill, img] of [["ProgressBg", "ProgressFill", "ui8_fish_fill_amber"], ["TensionBg", "TensionFill", "ui8_fish_fill_cream"]]) {
    K.skin3(b, "FishingGauge/Panel/" + bg, "ui8_fish_track");
    const f = "FishingGauge/Panel/" + bg + "/" + fill;
    b.patchComponent(f, SPR, { ImageRUID: { DataId: K.ruid(img) }, Color: rgba(1, 1, 1, 1) });
  }

  // 쓰러짐: 나무 보드, 마을에서 깨어나기 = 주행동(앰버), 부활권 = 보조(없으면 UIButtonStyle 이 비활성)
  board(b, "DownedPanel/Bg");
  btn(b, "DownedPanel/Bg/BtnTown", "amber");
  btn(b, "DownedPanel/Bg/BtnRevive", "oak");

  // 전경 탐색 안내·닫기, 레이드 귀환 타이머 (켜고 끄는 글자 상자라 통째 그림)
  K.full(b, "FullViewGuide", "ui8_row_wide");
  close(b, "FullViewCloseBtn");
  b.patch("FullViewCloseBtn", { anchor: "top-center", pivot: [0.5, 1], pos: [390, -22], rect_size: [52, 54] });
  K.full(b, "RaidReturnTimer", "ui8_row_wide");

  K.normalizeOrder(b).write(UI("HUDGroup.ui"));
}

// ───────── DialogGroup: 남색 대화창 → 양피지 대화창 ─────────
{
  const b = UIBuilder.load(UI("DialogGroup.ui"));
  const w = "DialogWindow";
  K.skin9(b, w + "/Frame", "ui8_dialog_frame");
  K.skin3(b, w + "/NamePlate", "ui8_dialog_nameplate");
  color(b, w + "/NamePlate/NameText", CREAM);
  ink(b, w + "/BodyText");
  btn(b, w + "/BtnAccept", "green");
  btn(b, w + "/BtnDecline", "red");
  btn(b, w + "/BtnClose", "oak");
  btn(b, w + "/BtnNext", "amber");
  // NPC 초상화 액자 + UI 아바타(UIDialogController.ApplyPortrait 가 NPC 의상을 복사해 켠다, 기본 꺼짐)
  {
    const pp = w + "/Portrait";
    b.sprite(pp, { anchor: "middle-left", pos: [24, 6], rect_size: [210, 210], image_ruid: K.ruid("ui8_portrait_frame"), color: "#FFFFFF", sprite_type: 0, raycast: false, enable: false });
    // 마을 NPC 는 스프라이트(애니메이션 클립) 기반이라 아바타가 아닌 UI 스프라이트로 그린다(UIDialogController 가 RUID 를 넣음)
    if (find(b, pp + "/Avatar")) b.remove(pp + "/Avatar");
    b.sprite(pp + "/Art", { anchor: "middle-center", pos: [0, -4], rect_size: [160, 160], image_ruid: K.ruid("ui8_icon_quest_star"), color: "#FFFFFF", sprite_type: 0, raycast: false });
    b.patchComponent(pp + "/Art", SPR, { PreserveSprite: 1 });
  }
  K.normalizeOrder(b).write(UI("DialogGroup.ui"));
}

// ───────── NamingGroup: 밝은 양피지 입력창 + 갈색 글자 ─────────
{
  const b = UIBuilder.load(UI("NamingGroup.ui"));
  const w = "Modal/Window";
  frame(b, w);
  hide(b, w + "/TopBar", w + "/AccentLine", w + "/Inner", w + "/Message");
  title(b, w + "/TopBar");
  ink(b, w + "/Message");
  K.simple(b, w + "/NameInput", "ui8_input");
  color(b, w + "/NameInput", INK);
  color(b, w + "/ErrorText", INK_RED);
  btn(b, w + "/BtnOk", "amber");
  btn(b, w + "/BtnCancel", "oak");
  K.normalizeOrder(b).write(UI("NamingGroup.ui"));
}

// ───────── AnvilGroup ─────────
{
  const b = UIBuilder.load(UI("AnvilGroup.ui"));
  const s = "AnvilPopup/Bg";
  frame(b, s);
  hide(b, s + "/TopBar", s + "/AccentLine");
  title(b, s + "/Title");
  close(b, s + "/BtnClose");
  board(b, s + "/LeftPanel");
  board(b, s + "/RightPanel");
  // 2026-10-20 마크식 개편: 왼쪽 "장착 6칸 + 손 도구" 줄 목록 → 가방 격자(강화·주문 가능한 장비만).
  // 칸을 누르면 오른쪽 강화 칸(ItemIcon_Back)에 올라가고, 강화 칸을 누르면 내린다. 서버 요청은 아이템 키 그대로.
  for (let i = 1; i <= 7; i++) if (find(b, s + "/Slot_" + i)) b.remove(s + "/Slot_" + i);
  b.text(s + "/BagTitle", "가방 · 강화할 장비", { size: 19, bold: true, color: CREAM, anchor: "middle-center", pos: [-240, 264], rect_size: [210, 30] });
  b.gridView(s + "/BagGrid", {
    anchor: "middle-center", pos: [-240, -42], rect_size: [216, 566],
    cell_size: [64, 64], fixed_count: 3, fixed_type: 0, spacing: [10, 10], padding: [2, 2, 4, 4],
    use_scroll: true, scroll_bar_visible: 1, scroll_bar_thickness: 6,
  });
  b.patchComponent(s + "/BagGrid", "MOD.Core.GridViewComponent", {
    BackgroundColor: rgba(0, 0, 0, 0), HandleColor: rgba(0.45, 0.33, 0.2, 0.8),
  });
  const cell = s + "/BagGrid/BagCell";
  b.button(cell, "", { anchor: "middle-center", pos: [0, 0], rect_size: [64, 64], font_size: 1, bg_color: "#FFFFFF" });
  slot(b, cell);
  b.sprite(cell + "/Icon", { anchor: "middle-center", pos: [0, 0], rect_size: [46, 46], color: "#FFFFFF", sprite_type: 0 });
  b.patchComponent(cell + "/Icon", SPR, { PreserveSprite: 1 });
  b.text(cell + "/Lv", "", { size: 15, bold: true, color: CREAM, alignment: 8, outline: true, outline_color: rgba(0.16, 0.09, 0.04), outline_width: 0.25, anchor: "stretch", rect_size: [64, 64] });
  b.patchComponent(cell + "/Lv", "MOD.Core.TextGUIRendererComponent", { Padding: { left: 0, right: 5, top: 0, bottom: 3 } });
  b.sprite(cell + "/Badge", { anchor: "top-left", pos: [3, -3], rect_size: [22, 22], color: rgba(0.8, 0.55, 0.1), sprite_type: 0, text: "장", text_size: 13, text_bold: true, text_color: "#FFFFFF" });
  b.patch(cell, { enable: false });
  b.text(s + "/BagEmpty", "강화할 수 있는 장비가\n가방에 없습니다", { size: 17, color: rgba(0.86, 0.78, 0.62), anchor: "middle-center", pos: [-240, 40], rect_size: [210, 60] });
  // 강화 칸(누르면 내리기): 장비 아이콘을 칸의 "자식"으로 둔다 — 자식은 항상 부모 위에 그려진다.
  // 형제(ItemIcon_Back)로 깔았더니 기존 엔티티 사이 형제 순서가 런타임에 안 바뀌어 칸이 아이콘을 덮었다(2026-10-20).
  if (find(b, s + "/ItemIcon_Back")) b.remove(s + "/ItemIcon_Back");
  if (find(b, s + "/ItemIcon")) b.remove(s + "/ItemIcon");
  b.button(s + "/TargetSlot", "", { anchor: "middle-center", pos: [-42, 236], rect_size: [76, 76], font_size: 1, bg_color: "#FFFFFF" });
  slot(b, s + "/TargetSlot");
  b.sprite(s + "/TargetSlot/ItemIcon", { anchor: "middle-center", pos: [0, 0], rect_size: [54, 54], color: "#FFFFFF", sprite_type: 0 });
  b.patchComponent(s + "/TargetSlot/ItemIcon", SPR, { PreserveSprite: 1 });
  b.patch(s + "/ItemName", { pos: [180, 260], rect_size: [320, 40] });
  b.patch(s + "/ItemStat", { pos: [180, 224], rect_size: [320, 32] });
  for (let i = 1; i <= 3; i++) row(b, s + "/Ench_" + i, false);
  K.full(b, s + "/PartName", "ui8_row");
  textSet(b, s + "/EnchantTitle", { Text: "부여할 슬롯을 선택하시오" });
  textSet(b, s + "/PartName", { Text: "주문 파츠가 없습니다.\n(눌러서 얻는 법 보기)", Overflow: 0 });
  // 파츠 칸: 올리거나(PC) 누르면(모바일) "주문 파츠 얻는 법" 툴팁 — 버튼 + 터치 수신(호버 상태 이벤트용)
  b.patchComponent(s + "/PartName", SPR, { RaycastTarget: true });
  if (!b.hasComponent(s + "/PartName", "MOD.Core.ButtonComponent")) b.addComponent(s + "/PartName", "MOD.Core.ButtonComponent");
  if (!b.hasComponent(s + "/PartName", "MOD.Core.UITouchReceiveComponent")) b.addComponent(s + "/PartName", "MOD.Core.UITouchReceiveComponent");
  textSet(b, s + "/BtnEnchant", { Text: "주문 부여" });
  btn(b, s + "/PartPrev", "oak");
  btn(b, s + "/PartNext", "oak");
  btn(b, s + "/BtnEnhance", "amber");
  btn(b, s + "/BtnEnchant", "amber");
  K.normalizeOrder(b).write(UI("AnvilGroup.ui"));
}

// ───────── TransitionGroup: 출발·도착 배지 + 모험 팁 현판 ─────────
{
  const b = UIBuilder.load(UI("TransitionGroup.ui"));
  const m = "Cover/MapContainer";
  K.full(b, m + "/StartPoint", "ui8_badge_left");
  K.full(b, m + "/EndPoint", "ui8_badge_right");
  // 현판 132 높이: 제목 1줄 + 본문 2줄. 글자 상자 높이가 글자보다 작으면 말줄임 모드에서 아예 안 그려진다(제목 사라짐, 2026-10-20).
  // 본문은 폭 780 을 넘으면 자동 줄바꿈 → 가장 긴 팁(약 48자)도 24 크기 2줄. 3줄이 넘으면 22까지 자동 축소, 그래도 넘치면 말줄임.
  b.patch("Cover/TipPlate", { rect_size: [840, 132] });
  K.skin3(b, "Cover/TipPlate", "ui8_tip_plaque");
  textSet(b, "Cover/TipPlate/TipBadge", { FontSize: 22, BestFit: false });
  b.patch("Cover/TipPlate/TipBadge", { pos: [0, 40], rect_size: [320, 36] });
  textSet(b, "Cover/TipPlate/TipContent", { FontSize: 24, BestFit: true, MinSize: 22, MaxSize: 24 });
  b.patch("Cover/TipPlate/TipContent", { pos: [0, -14], rect_size: [780, 68] });
  K.normalizeOrder(b).write(UI("TransitionGroup.ui"));
}

// ───────── TooltipGroup: 공용 툴팁 = 금빛 모서리 진한 나무 판 ─────────
{
  const b = UIBuilder.load(UI("TooltipGroup.ui"));
  darkPanel(b, "Tip");
  K.normalizeOrder(b).write(UI("TooltipGroup.ui"));
}

// ───────── UI8Skin 변형 표 생성 ─────────
{
  const p = path.join(root, "RootDesk", "MyDesk", "UI", "Scripts", "UI8Skin.mlua");
  const src = fs.readFileSync(p, "utf8");
  const a = src.indexOf("-- [UI8-VARIANTS-BEGIN]");
  const z = src.indexOf("\t\t-- [UI8-VARIANTS-END]");
  if (a < 0 || z < 0) throw new Error("UI8Skin 표시 없음");
  const out = src.slice(0, a) + "-- [UI8-VARIANTS-BEGIN]\n" + K.luaVariantTable() + "\n" + src.slice(z);
  fs.writeFileSync(p, out, "utf8");
  console.log("UI8Skin variants injected");
  K.injectLuaBlock(p, "UI8-BLEED", K.luaBleedTable());
  console.log("UI8Skin bleed table injected");
}
