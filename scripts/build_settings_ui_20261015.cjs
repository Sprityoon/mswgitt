"use strict";
// 환경설정 UI (docs/design/ui/maplecraft_settings_ui_only/maplecraft_settings_ui_spec.md, 2026-10-15).
// - 결과: ui/SettingsGroup.ui (UIGroup 순서 10 — 메인메뉴 8·이름짓기 9 위) + UISettingsLogic 바인딩 주입.
// - 이미지: 책·현판·책갈피·행 카드는 시작 화면에서 등록한 mc_*.sprite, 환경설정 전용은 mc_set_*.sprite
//   (docs/design/ui/maplecraft_settings_ui_only/4_Final_MSW_PNG). 미등록 이미지는 임시 색으로 대체하고 목록을 출력한다.
// - 좌표: 1920×1080 중앙 원점. 책은 시작 화면과 같은 1126px @ (0,-20). 종이: 왼쪽 x -409~-46 · 오른쪽 x 86~427.
// - 재실행 가능: 매번 그룹을 새로 만든다. 단 기존 파일이 있으면 같은 경로의 UUID 를 이어받아 바인딩이 흔들리지 않게 한다.
// 사용: node scripts/build_settings_ui_20261015.cjs → Maker refresh
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { UIBuilder } = require(path.join(ROOT, ".agents", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const UI_PATH = "ui/SettingsGroup.ui";
const MLUA = "RootDesk/MyDesk/UI/Scripts/UISettingsLogic.mlua";
const PREVIEW_OUT = path.join(ROOT, "docs", "design", "ui", "maplecraft_settings_ui_only", "layout_preview.json");
const DEFAULT_SPRITE = "2860136c06ab075439721c027de365af";
const BOOK_RUID = "59a330fa4cd44a5583d05d2109cd7f14"; // notebook_menu_frame_ui

const ASSETS = [
  "mc_header_plaque", "mc_bookmark_back", "mc_row_card",
  "mc_set_slider_track", "mc_set_slider_fill", "mc_set_slider_knob", "mc_set_sound_on", "mc_set_sound_mute",
  "mc_set_switch_on", "mc_set_switch_off", "mc_set_keycap_sq", "mc_set_keycap_wide", "mc_set_btn_gray", "mc_set_btn_olive",
  "mc_btn_gray_m", "mc_btn_olive_m",
];
const FALLBACK = {
  mc_header_plaque: "#6B4423", mc_bookmark_back: "#D9B480", mc_row_card: "#F2D9A8",
  mc_set_slider_track: "#5A3420", mc_set_slider_fill: "#6DB224", mc_set_slider_knob: "#C88A4B",
  mc_set_sound_on: "#C88A4B", mc_set_sound_mute: "#8A7F70", mc_set_switch_on: "#58B832", mc_set_switch_off: "#8A7F70",
  mc_set_keycap_sq: "#F4E8CC", mc_set_keycap_wide: "#F4E8CC", mc_set_btn_gray: "#8A7F70", mc_set_btn_olive: "#8C8C2C",
};

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

// 등록 전에도 저장/초기화 버튼은 같은 계열의 기존 에셋을 쓴다.
const alias = { mc_set_btn_gray: "mc_btn_gray_m", mc_set_btn_olive: "mc_btn_olive_m" };
const ruidOf = (name) => RUID[name] || RUID[alias[name]] || DEFAULT_SPRITE;
const tintOf = (name) => (RUID[name] || RUID[alias[name]] ? "#FFFFFF" : FALLBACK[name]);
const DARK = "#3B2314";
const preview = [];
const rec = (p, abs, size, image, text, extra = {}) => preview.push(Object.assign({ screen: "settings", path: p, abs, size, image, text }, extra));

const G = "SettingsGroup";
// 경로 upsert 자체가 UUID를 보존한다. build() 결과나 .ui JSON을 직접 고치지 않는다.
const b = fs.existsSync(UI_PATH) ? UIBuilder.read(UI_PATH) : new UIBuilder(G, 10, true);
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const TXT = "MOD.Core.TextGUIRendererComponent";

// 글자는 렌더러와 같은 엔티티에 얹는다(pitfalls #50). 배경 → 글자 순서로 만든다(#47).
function label(p, text, pos, size, o = {}) {
  b.sprite(p, { anchor: "middle-center", pos, rect_size: size, pivot: [0.5, 0.5], alpha: 0, sprite_type: 0,
    text, text_size: o.size || 20, text_color: o.color || DARK, text_bold: o.bold !== false, text_alignment: o.align ?? 4 });
  if (o.padLeft) b.patchComponent(p, TXT, { Padding: { left: o.padLeft, right: 8, top: 0, bottom: 0 } });
}
function art(p, name, pos, size, o = {}) {
  b.sprite(p, { anchor: "middle-center", pos, rect_size: size, pivot: [0.5, 0.5], sprite_type: 0,
    image_ruid: ruidOf(name), color: tintOf(name), raycast: !!o.raycast,
    ...(o.text ? { text: o.text, text_size: o.size || 20, text_color: o.color || DARK, text_bold: o.bold !== false, text_alignment: o.align ?? 4 } : {}) });
  if (o.padLeft) b.patchComponent(p, TXT, { Padding: { left: o.padLeft, right: 8, top: 0, bottom: 0 } });
  if (o.outline) b.patchComponent(p, TXT, { OutlineWidth: o.outline, FaceDilate: o.outline, OutlineColor: hex(o.outlineColor || "#2A1608") });
}
function btn(p, name, pos, size, text, o = {}) {
  const small = size[0] < 88 || size[1] < 88;
  b.button(p, small ? "" : text || "", { anchor: "middle-center", pos,
    rect_size: size.map(v => Math.max(88, v)), pivot: [0.5, 0.5], sprite_type: 0,
    image_ruid: ruidOf(name), bg_color: small ? { r: 1, g: 1, b: 1, a: 0 } : tintOf(name),
    font_size: o.size || 22, color: o.color || "#FFFDF4" });
  const visual = small ? `${p}/Visual` : p;
  if (small) art(visual, name, [0, 0], size, { text: text || " ", size: o.size || 22, color: o.color || "#FFFDF4" });
  b.patchComponent(visual, TXT, { FontStyle: 1, OutlineWidth: o.outline ?? 0, FaceDilate: o.outline ?? 0, OutlineColor: hex(o.outlineColor || "#2A1608"),
    Padding: { left: 0, right: 0, top: o.padTop || 0, bottom: o.padBottom || 0 } });
  b.patchComponent(p, "MOD.Core.ButtonComponent", { KeyCode: 0, Selectable: false });
}
function hex(h, a = 1) {
  return { r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255, a };
}

// ── 덮개 · 창 ───────────────────────────────────────────
// 덮개: 클릭 차단용(3840×2160, #43). 색 알파는 열 때 정한다(타이틀 0 / 인게임 0.45).
b.sprite("Dimmer", { anchor: "middle-center", pos: [0, 0], rect_size: [3840, 2160], pivot: [0.5, 0.5], color: "#000000", alpha: 0.45, raycast: true, enable: false });
b.empty("Window", { anchor: "middle-center", pos: [0, 0], rect_size: [1920, 1080], pivot: [0.5, 0.5], enable: false });
b.sprite("Window/Book", { anchor: "middle-center", pos: [0, -20], rect_size: [1126, 1126], pivot: [0.5, 0.5], sprite_type: 0, image_ruid: BOOK_RUID, color: "#FFFFFF", raycast: true });
rec("Window/Book", [0, -20], [1126, 1126], "book", null);
art("Window/Header", "mc_header_plaque", [0, 392], [440, 112], { text: "환경설정", size: 30, color: "#FFF3D6", outline: 0.25 });
rec("Window/Header", [0, 392], [440, 112], "mc_header_plaque", "환경설정", { fontSize: 30, color: "#FFF3D6" });
btn("Window/BtnBack", "mc_bookmark_back", [-472, 220], [96, 250], "뒤\n로", { size: 26, color: "#2B1608", padTop: 36 });
rec("Window/BtnBack", [-472, 220], [96, 250], "mc_bookmark_back", "뒤\n로", { fontSize: 26, color: "#2B1608" });

// ── 왼쪽 페이지: 사운드 · 화면 ──────────────────────────
const LX = -228;
label("Window/SoundTitle", "사운드 설정", [LX, 250], [300, 44], { size: 28 });
rec("Window/SoundTitle", [LX, 250], [300, 44], null, "사운드 설정", { fontSize: 28, color: DARK });
for (const [key, text, y] of [["Bgm", "배경음", 182], ["Sfx", "효과음", 86]]) {
  const row = `Window/${key}Row`;
  art(row, "mc_row_card", [LX, y], [330, 66]);
  btn(`${row}/Mute`, "mc_set_sound_on", [-137, 0], [40, 40], RUID.mc_set_sound_on ? "" : "ON", { size: 15, color: DARK });
  label(`${row}/Label`, text, [-82, 0], [64, 32], { size: 20 });
  b.slider(`${row}/Slider`, {
    anchor: "middle-center", pos: [17, 0], rect_size: [124, 22], pivot: [0.5, 0.5], min_val: 0, max_val: 1, value: 1,
    use_handle: true, image_ruid: ruidOf("mc_set_slider_track"), bg_color: tintOf("mc_set_slider_track"), sprite_type: 0,
  });
  // 옵션명 추정 대신 실제 SliderComponent 필드로 설정한다.
  b.patchComponent(`${row}/Slider`, "MOD.Core.SliderComponent", {
    FillRectImageRUID: { DataId: ruidOf("mc_set_slider_fill") }, FillRectColor: hex(tintOf("mc_set_slider_fill")),
    FillRectPadding: { left: 7, right: 7, top: 5, bottom: 5 },
    HandleImageRUID: { DataId: ruidOf("mc_set_slider_knob") }, HandleColor: hex(tintOf("mc_set_slider_knob")),
    HandleSize: { x: 30, y: 32 },
  });
  // 최대값 100%가 한 줄에 들어가도록 수치 칸을 넓힌다. 트랙과는 7px 간격을 유지한다.
  label(`${row}/Pct`, "100%", [122, 0], [72, 36], { size: 18, align: 5 });
  rec(row, [LX, y], [330, 66], "mc_row_card", null);
  rec(`${row}/Mute`, [LX - 137, y], [40, 40], "mc_set_sound_on", null);
  rec(`${row}/Label`, [LX - 82, y], [64, 32], null, text, { fontSize: 20, color: DARK });
  rec(`${row}/Slider`, [LX + 17, y], [124, 22], "slider", null, { value: 1 });
  rec(`${row}/Pct`, [LX + 122, y], [72, 36], null, "100%", { fontSize: 18, color: DARK, align: "right" });
}
label("Window/ScreenTitle", "화면 설정", [LX, 22], [300, 44], { size: 28 });
rec("Window/ScreenTitle", [LX, 22], [300, 44], null, "화면 설정", { fontSize: 28, color: DARK });
// 화면 흔들림(몬스터·보스 충격) / 퀘스트 길 안내(발밑 화살표 + 화면 테두리 뱃지). 목업의 "채집 알림"은 화면 알림 기능이 없어 대체.
for (const [key, text, y] of [["Shake", "화면 흔들림", -46], ["Guide", "퀘스트 길 안내", -142]]) {
  const row = `Window/${key}Row`;
  art(row, "mc_row_card", [LX, y], [330, 64], { text, size: 20, align: 3, padLeft: 22 });
  btn(`${row}/Switch`, "mc_set_switch_on", [110, 0], [84, 45], "ON", { size: 16, color: "#FFFDF4", outline: 0.15 });
  b.patchComponent(`${row}/Switch/Visual`, TXT, { Padding: { left: 3, right: 32, top: 0, bottom: 0 } });
  rec(row, [LX, y], [330, 64], "mc_row_card", text, { fontSize: 20, color: DARK, align: "left", padLeft: 22 });
  rec(`${row}/Switch`, [LX + 110, y], [84, 45], "mc_set_switch_on", null);
  rec(`${row}/Switch/State`, [LX + 95, y], [40, 45], null, "ON", { fontSize: 16, color: "#FFFDF4" });
}

// ── 오른쪽 페이지: 조작키(읽기 전용) · 저장 ──────────────
const RX = 256;
label("Window/KeyTitle", "조작키 설정", [RX, 250], [300, 44], { size: 28 });
rec("Window/KeyTitle", [RX, 250], [300, 44], null, "조작키 설정", { fontSize: 28, color: DARK });
// 실제 키는 PlayerController.OnKeyDown 기준(2026-10-15). 키 변경 기능을 붙일 때 이 표를 데이터로 옮긴다.
const KEY_ROWS = [
  ["이동", [["방향키", "w"]]],
  ["점프", [["Alt", "w"]]],
  ["공격 / 채집", [["Ctrl", "w"]]],
  ["상호작용", [["F", "s"]]],
  ["스킬 슬롯", [["Q", "s"], ["W", "s"], ["E", "s"], ["R", "s"]]],
  ["퀵슬롯", [["1 ~ 0", "w"]]],
  ["가방 / 제작 / 정보", [["I", "s"], ["C", "s"], ["H", "s"]]],
  ["스킬 / 도감 / 보스", [["K", "s"], ["J", "s"], ["B", "s"]]],
];
b.empty("Window/KeyRows", { anchor: "middle-center", pos: [0, 0], rect_size: [1920, 1080], pivot: [0.5, 0.5] });
b.patchComponent("Window/KeyRows", "MOD.Core.UITransformComponent", { ActivePlatform: 1 });
KEY_ROWS.forEach(([text, keys], i) => {
  const y = 190 - i * 52;
  const row = `Window/KeyRows/Row${i + 1}`;
  art(row, "mc_row_card", [RX, y], [330, 46], { text, size: 18, align: 3, padLeft: 16 });
  rec(row, [RX, y], [330, 46], "mc_row_card", text, { fontSize: 18, color: DARK, align: "left", padLeft: 16 });
  let right = 153;
  for (let k = keys.length - 1; k >= 0; k--) {
    const [cap, kind] = keys[k];
    const w = kind === "w" ? 84 : 34;
    const x = right - w / 2;
    const asset = kind === "w" ? "mc_set_keycap_wide" : "mc_set_keycap_sq";
    art(`${row}/Key${k + 1}`, asset, [x, 1], [w, 34], { text: cap, size: kind === "w" ? 16 : 17, color: DARK });
    b.patchComponent(`${row}/Key${k + 1}`, TXT, { Padding: { left: 0, right: 0, top: 0, bottom: 3 } });
    rec(`${row}/Key${k + 1}`, [RX + x, y + 1], [w, 34], asset, cap, { fontSize: kind === "w" ? 16 : 17, color: DARK });
    right -= w + 5;
  }
});
art("Window/MobileNotice", "mc_row_card", [RX, 40], [330, 180], { text: "모바일 조작키 설정은\n준비중입니다!", size: 24, color: DARK });
b.patch("Window/MobileNotice", { enable: false });
b.patchComponent("Window/MobileNotice", "MOD.Core.UITransformComponent", { ActivePlatform: 2 });
label("Window/KeyRows/Hint", "현재 기본 조작키 · 키 변경 준비 중", [RX, -215], [330, 32], { size: 16, bold: false });
rec("Window/KeyRows/Hint", [RX, -215], [330, 32], null, "현재 기본 조작키 · 키 변경 준비 중", { fontSize: 16, color: DARK });

art("Window/Status", "mc_row_card", [LX, -245], [330, 58], { text: " ", size: 16, bold: false });
b.patchComponent("Window/Status", TXT, { Text: "" });
b.patch("Window/Status", { enable: false });
rec("Window/Status", [LX, -245], [330, 58], "mc_row_card", "설정을 저장했습니다.", { fontSize: 16, color: DARK });
btn("Window/BtnReset", "mc_set_btn_gray", [RX - 86, -262], [156, 52], "초기화", { size: 20, outline: 0.20, padBottom: 4 });
btn("Window/BtnSave", "mc_set_btn_olive", [RX + 86, -262], [156, 52], "설정 저장", { size: 20, outline: 0.20, padBottom: 4 });
rec("Window/BtnReset", [RX - 86, -262], [156, 52], "mc_set_btn_gray", "초기화", { fontSize: 20, color: "#FFFDF4" });
rec("Window/BtnSave", [RX + 86, -262], [156, 52], "mc_set_btn_olive", "설정 저장", { fontSize: 20, color: "#FFFDF4" });

// 컨트롤러는 별도 @Logic(UISettingsLogic) — 그룹 안에 스크립트 엔티티를 두지 않는다.

// ── 저장 + 바인딩 ─────────────────────────────────────────
const BIND = {
  window: "Window", dimmer: "Dimmer",
  sliderBgm: "Window/BgmRow/Slider", sliderSfx: "Window/SfxRow/Slider",
  bgmPct: "Window/BgmRow/Pct", sfxPct: "Window/SfxRow/Pct",
  btnBgmMute: "Window/BgmRow/Mute", btnSfxMute: "Window/SfxRow/Mute",
  btnShake: "Window/ShakeRow/Switch", btnGuide: "Window/GuideRow/Switch",
  btnReset: "Window/BtnReset", btnSave: "Window/BtnSave", btnBack: "Window/BtnBack",
  keyRows: "Window/KeyRows", mobileNotice: "Window/MobileNotice", status: "Window/Status",
};
b.write(UI_PATH, { lint_verbose: true, bind: { mlua: MLUA, props: BIND } });

let src = fs.readFileSync(path.join(ROOT, MLUA), "utf8");
for (const [prop, name] of [["soundOnRuid", "mc_set_sound_on"], ["soundMuteRuid", "mc_set_sound_mute"], ["switchOnRuid", "mc_set_switch_on"], ["switchOffRuid", "mc_set_switch_off"]]) {
  const re = new RegExp(`(property string ${prop} = )"[^"]*"`);
  if (!re.test(src)) throw new Error(`${MLUA} 에 property string ${prop} 선언이 없다`);
  src = src.replace(re, `$1"${RUID[name] || ""}"`);
}
fs.writeFileSync(path.join(ROOT, MLUA), src, "utf8");
fs.writeFileSync(PREVIEW_OUT, JSON.stringify({ ruids: RUID, items: preview }, null, 1));
console.log(`wrote ${UI_PATH}, ${MLUA} (bindings + ruids), layout_preview.json (${preview.length} items)`);
