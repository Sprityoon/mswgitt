// 모바일 UI 보정 (2026-10-07)
// 1) 전체화면 덮개: 1920×1080 stretch 는 런타임에 RectSize 그대로 렌더된다(pitfalls #10) → 16:9보다 넓은 화면에서 가장자리가 샌다.
//    DialogGroup/Dimmer, HUDGroup/SpawnFade 는 pitfalls #43 표준(middle-center 3840×2160)으로.
//    MainMenuGroup/Bg 는 middle-center 로 바꾸고, 실제 화면 크기는 UIMainMenuController 가 런타임에 맞춘다.
// 2) HUD 우하단 조작 버튼 확대·재배치. 버튼 하위(아이콘·라벨·쿨다운)는 같은 배율로 크기·위치·글자 크기를 키운다.
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const root = path.join(__dirname, "..");
const UI = (f) => path.join(root, "ui", f);
const backupDir = path.join(root, "scratch", "ui-before-mobilefix-20261007");
fs.mkdirSync(backupDir, { recursive: true });
for (const f of ["DialogGroup.ui", "HUDGroup.ui", "MainMenuGroup.ui"]) {
  const dst = path.join(backupDir, f);
  if (!fs.existsSync(dst)) fs.copyFileSync(UI(f), dst);
}
const TR = "MOD.Core.UITransformComponent";
const TEXT_COMPS = ["MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent"];

// --- 1) fullscreen covers ---
{
  const b = UIBuilder.read(UI("DialogGroup.ui"));
  b.patch("Dimmer", { anchor: "middle-center", pos: [0, 0], rect_size: [3840, 2160], pivot: [0.5, 0.5] });
  b.write(UI("DialogGroup.ui"));
}
{
  const b = UIBuilder.read(UI("MainMenuGroup.ui"));
  b.patch("Bg", { anchor: "middle-center", pos: [0, 0], rect_size: [3840, 2160], pivot: [0.5, 0.5] });
  b.write(UI("MainMenuGroup.ui"));
}

// --- 2) HUD ---
const b = UIBuilder.read(UI("HUDGroup.ui"));
b.patch("SpawnFade", { rect_size: [3840, 2160] });

const r = (v) => Math.round(v * 100) / 100;
function scaleDescendants(parentPath, k) {
  const prefix = b.find(parentPath).path + "/";
  for (const e of b.listEntities().filter((e) => e.path.startsWith(prefix))) {
    const t = b.getComponent(e.path, TR);
    b.patch(e.path, {
      rect_size: [r(t.RectSize.x * k), r(t.RectSize.y * k)],
      pos: [r(t.anchoredPosition.x * k), r(t.anchoredPosition.y * k)],
    });
    for (const c of TEXT_COMPS) {
      const tc = b.getComponent(e.path, c);
      if (!tc || typeof tc.FontSize !== "number") continue;
      const upd = { FontSize: Math.round(tc.FontSize * k) };
      if (typeof tc.MinSize === "number") upd.MinSize = Math.round(tc.MinSize * k);
      if (typeof tc.MaxSize === "number") upd.MaxSize = Math.round(tc.MaxSize * k);
      b.patchComponent(e.path, c, upd);
    }
  }
}
function resizeButton(p, size, pos) {
  const t = b.getComponent(p, TR);
  const k = size / t.RectSize.x;
  scaleDescendants(p, k);
  b.patch(p, { rect_size: [size, size], pos });
  return k;
}

// MobileUI 버튼: anchor bottom-right, pivot (1,0) → pos = 버튼 오른쪽 아래 모서리
const plan = {
  "MobileUI/BtnMine": [190, [-55, 65]],
  "MobileUI/BtnJump": [130, [-285, 30]],
  "MobileUI/BtnInteract": [130, [-270, 200]],
  "MobileUI/BtnBag": [110, [-60, 505]],
  "MobileUI/BtnCraft": [110, [-194, 505]],
  "MobileUI/BtnInfo": [110, [-328, 505]],
};
for (const [p, [size, pos]] of Object.entries(plan)) {
  const k = resizeButton(p, size, pos);
  console.log(`${p}: ${size}px (x${k.toFixed(3)}) @${pos}`);
}

// SkillBar: anchor bottom-right, pivot 0.5 → pos = 막대 중심. 슬롯 120, 간격 22.
const slot = 120, gap = 22, barW = slot * 4 + gap * 3;
b.patch("SkillBar", { rect_size: [barW, slot], pos: [-(60 + barW / 2), 410] });
for (let i = 1; i <= 4; i++) {
  const p = `SkillBar/SkillSlot${i}`;
  const t = b.getComponent(p, TR);
  const k = slot / t.RectSize.x;
  scaleDescendants(p, k);
  const cx = -barW / 2 + slot / 2 + (i - 1) * (slot + gap);
  b.patch(p, { rect_size: [slot, slot], pos: [cx, 0] });
}
console.log(`SkillBar: ${barW}x${slot} @${-(60 + barW / 2)},410`);
b.write(UI("HUDGroup.ui"), { lint_verbose: false });
