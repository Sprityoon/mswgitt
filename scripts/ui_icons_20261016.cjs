// UI 아이콘 부착 (2026-10-16) — 외부 지시서의 "이모지 대체 아이콘"을 업로드 없이 **공식 스프라이트**로 해결한다.
// 패키지 SVG 아이콘(평면 벡터)은 쓰지 않는다: 같은 의미의 메이플 공식 리소스가 있고(pitfalls #45, 프리셋 우선),
// 코인은 게임 안 Coin 아이템 아이콘과 같은 RUID 라 가방·상점 표기가 일치한다.
// 재실행 가능(멱등). 수정 전 백업: scratch/ui-before-uiicons-20261016/
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const root = path.join(__dirname, "..");
const UI = (f) => path.join(root, "ui", f);
const TXT = "MOD.Core.TextGUIRendererComponent";
const LEG = "MOD.Core.TextComponent";

// 공식 스프라이트 (msw-search 로 확인, 2026-10-16)
const ICON = {
  coin: "02a489cccff24a139a6c3582a5871f58", // 금색 메소 28×24 (item_dataset Coin.IconRUID 와 동일)
  lock: "ad4e2e559ba9434698e8c7f2a45d7850", // 자물쇠 36×44
  warn: "5f39b25ce1a9432e826954c359982b91", // 주황 느낌표 상자 32×32
  fire: "c2934aa225d340b9b1a75f5f27fdf425", // 불꽃 48×56
};

const backupDir = path.join(root, "scratch", "ui-before-uiicons-20261016");
fs.mkdirSync(backupDir, { recursive: true });
for (const f of ["PopupGroup.ui", "HUDGroup.ui"]) {
  const dst = path.join(backupDir, f);
  if (!fs.existsSync(dst)) fs.copyFileSync(UI(f), dst);
}

const icon = (b, p, ruid, opts) =>
  b.sprite(p, { image_ruid: ruid, color: "#FFFFFF", sprite_type: 0, raycast: false, ...opts });

// ───────────────────────── PopupGroup ─────────────────────────
{
  const b = UIBuilder.load(UI("PopupGroup.ui"));

  // 1) 상점 카드: 글자 열을 왼쪽 정렬로 맞추고 가격 앞에 코인 아이콘
  //    카드 268×88 · 아이콘 칸 x -120~-64 · 글자 열 x -52~116
  for (let i = 1; i <= 6; i++) {
    const s = `ShopPopup/Bg/Slot${i}`;
    b.patch(`${s}/ItemName`, { pos: [32, 20], rect_size: [168, 26] });
    b.patchComponent(`${s}/ItemName`, LEG, { Alignment: 3 });
    b.patch(`${s}/PriceText`, { pos: [44, -6], rect_size: [144, 22] });
    b.patchComponent(`${s}/PriceText`, LEG, { Alignment: 3 });
    b.patch(`${s}/OwnText`, { pos: [32, -30], rect_size: [168, 22] });
    b.patchComponent(`${s}/OwnText`, TXT, { HorizontalAlignment: 1 });
    icon(b, `${s}/CoinIcon`, ICON.coin, { anchor: "middle-center", pos: [-41, -6], rect_size: [21, 18] });
  }

  // 2) 영지 권한 빈 상태: 안내문 위 자물쇠(EmptyHint 자식이라 함께 켜지고 꺼진다)
  icon(b, "PermissionPopup/Bg/EmptyHint/Lock", ICON.lock, { anchor: "middle-center", pos: [0, 72], rect_size: [32, 39] });

  // 3) 화로 연료 칸: 비었을 때 보이는 흐린 불꽃(연료가 들어오면 컨트롤러가 끈다)
  icon(b, "FurnacePopup/Bg/FuelSlot/Watermark", ICON.fire, {
    anchor: "middle-center", pos: [0, 0], rect_size: [40, 47], color: { r: 1, g: 1, b: 1, a: 0.35 },
  });

  // 4) 포탈: 잠긴 목적지 버튼 오른쪽 위 모서리 자물쇠 배지(컨트롤러가 잠김일 때만 켠다)
  for (let i = 1; i <= 13; i++) {
    icon(b, `WarpPopup/Bg/Slot${i}/Lock`, ICON.lock, {
      anchor: "top-right", pos: [3, 3], pivot: [1, 1], rect_size: [15, 18], enable: false,
    });
  }

  b.write(UI("PopupGroup.ui"));
}

// ───────────────────────── HUDGroup ─────────────────────────
{
  const b = UIBuilder.load(UI("HUDGroup.ui"));
  // 5) 낚시 위험 문구: 글리프 "※" 대신 느낌표 아이콘(WarnText 자식이라 점멸도 함께)
  const warn = "FishingGauge/Panel/WarnText";
  b.patchComponent(warn, LEG, { Text: "위험! 손을 떼세요!" });
  icon(b, `${warn}/Icon`, ICON.warn, { anchor: "middle-center", pos: [-122, 0], rect_size: [26, 26] });
  b.write(UI("HUDGroup.ui"));
}

console.log("done");
