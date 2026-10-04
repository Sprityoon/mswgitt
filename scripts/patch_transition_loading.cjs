const path = require('path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const uiPath = path.join(__dirname, '../ui/TransitionGroup.ui');
const b = UIBuilder.load(uiPath);

console.log('--- Applying Concept A Loading Screen to TransitionGroup.ui ---');

// 1. Remove legacy TextGUIRendererComponent from Cover
if (b.hasComponent('Cover', 'MOD.Core.TextGUIRendererComponent')) {
  b.removeComponent('Cover', 'MOD.Core.TextGUIRendererComponent');
}

// 2. Patch Cover sprite color to warm dark vignette background
b.patchComponent('Cover', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 0.08, g: 0.05, b: 0.03, a: 1.0 },
});

// Official MSW Verified RUIDs
const RUID_PARCHMENT_PAPER = 'c24adedc9faa457daf4e4aae7cd663bb'; // Light Warm Parchment Paper
const RUID_WOOD_FRAME = '25e9e89579644202805f535d038a9edb';       // Antique Carved Wood Frame
const RUID_ORANGE_MUSHROOM = 'a95cfed2c8fe4d2cb64cbb62db051f92';  // Orange Mushroom Sprite
const RUID_WHITE_PIXEL = '2860136c06ab075439721c027de365af';      // 1x1 White Sprite

// 3. MapContainer: Central Wood Border Box
b.sprite('Cover/MapContainer', {
  anchor: 'middle-center',
  pos: [0, 45],
  rect_size: [1020, 580],
  pivot: [0.5, 0.5],
  image_ruid: RUID_WOOD_FRAME,
  sprite_type: 1, // Sliced
  color: { r: 0.38, g: 0.22, b: 0.12, a: 1.0 },
});
b.patchComponent('Cover/MapContainer', 'MOD.Core.SpriteGUIRendererComponent', {
  DropShadow: true,
  DropShadowDistance: 6,
  DropShadowColor: { r: 0.0, g: 0.0, b: 0.0, a: 0.65 },
});

// 4. Parchment Paper inside MapContainer
b.sprite('Cover/MapContainer/Parchment', {
  anchor: 'middle-center',
  pos: [0, 0],
  rect_size: [970, 530],
  pivot: [0.5, 0.5],
  image_ruid: RUID_PARCHMENT_PAPER,
  sprite_type: 1, // Sliced
  color: { r: 1.0, g: 0.96, b: 0.90, a: 1.0 },
});

// 5. Title & Subtitle on Parchment
b.text('Cover/MapContainer/Title', 'MAPLE CRAFT', {
  anchor: 'middle-center',
  pos: [0, 200],
  rect_size: [500, 48],
  size: 32,
  bold: true,
  color: { r: 0.26, g: 0.15, b: 0.08, a: 1.0 }, // Deep rich brown
  alignment: 4, // MiddleCenter
});

b.text('Cover/MapContainer/Subtitle', '·  TERRITORY & EXPEDITION  ·', {
  anchor: 'middle-center',
  pos: [0, 162],
  rect_size: [500, 24],
  size: 13,
  bold: true,
  color: { r: 0.58, g: 0.38, b: 0.22, a: 1.0 }, // Lighter golden brown
  alignment: 4,
});

// 6. Dotted Trail Track & Endpoints
b.sprite('Cover/MapContainer/TrailLine', {
  anchor: 'middle-center',
  pos: [0, 30],
  rect_size: [560, 4],
  image_ruid: RUID_WHITE_PIXEL,
  color: { r: 0.68, g: 0.50, b: 0.35, a: 0.45 },
});

// 출발·도착 라벨: 트레일 양 끝 아래에 원목 명패(TipPlate 와 같은 프레임) + 크림 글자 24 Bold.
// 글자와 배경은 한 엔티티(규칙 50) — text() 엔티티의 투명 스프라이트에 프레임을 입힌다.
// x(±250)는 UIHUDController.WarpMascotStartX / EndX 와 맞춘다 (마스코트가 라벨 위를 출발·도착).
for (const [name, label, x] of [['StartPoint', '🚩 영지', -250], ['EndPoint', '사냥터 🏰', 250]]) {
  const p = `Cover/MapContainer/${name}`;
  b.text(p, label, {
    anchor: 'middle-center',
    pos: [x, -30],
    rect_size: [250, 56],
    pivot: [0.5, 0.5],
    size: 24,
    bold: true,
    color: { r: 0.98, g: 0.93, b: 0.80, a: 1.0 }, // 크림
    alignment: 4,
  });
  b.patchComponent(p, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_WOOD_FRAME },
    Type: 1, // Sliced
    Color: { r: 0.30, g: 0.17, b: 0.09, a: 1.0 },
    DropShadow: true,
    DropShadowDistance: 3,
    DropShadowColor: { r: 0.0, g: 0.0, b: 0.0, a: 0.5 },
  });
}

// 7. Mascot: Cute Orange Mushroom
b.sprite('Cover/MapContainer/Mascot', {
  anchor: 'middle-center',
  pos: [0, 45],
  rect_size: [70, 70],
  pivot: [0.5, 0.5],
  image_ruid: RUID_ORANGE_MUSHROOM,
  color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
});

// 8. Status Text
b.text('Cover/MapContainer/StatusText', '지도를 확인하며 이동 중...', {
  anchor: 'middle-center',
  pos: [0, -110],
  rect_size: [560, 36],
  size: 18,
  bold: true,
  color: { r: 0.38, g: 0.24, b: 0.12, a: 1.0 },
  alignment: 4,
});

// 9. TipPlate: Bottom Cozy Wood Frame
b.sprite('Cover/TipPlate', {
  anchor: 'middle-center',
  pos: [0, -325],
  rect_size: [840, 80],
  pivot: [0.5, 0.5],
  image_ruid: RUID_WOOD_FRAME,
  sprite_type: 1, // Sliced
  color: { r: 0.25, g: 0.14, b: 0.08, a: 1.0 }, // Dark rich wood
});
b.patchComponent('Cover/TipPlate', 'MOD.Core.SpriteGUIRendererComponent', {
  DropShadow: true,
  DropShadowDistance: 4,
  DropShadowColor: { r: 0.0, g: 0.0, b: 0.0, a: 0.55 },
});

// 10. TipBadge (Centered top header)
b.text('Cover/TipPlate/TipBadge', '[ 모험 팁 ]', {
  anchor: 'middle-center',
  pos: [0, 18],
  rect_size: [240, 24],
  size: 13,
  bold: true,
  color: { r: 0.96, g: 0.74, b: 0.26, a: 1.0 }, // Golden accent
  alignment: 4, // MiddleCenter
});

// 11. TipContent (Centered tip text)
b.text('Cover/TipPlate/TipContent', '밤에는 필드 몬스터의 공격력이 상승합니다. 화로를 설치해 안전 구역을 확보하세요!', {
  anchor: 'middle-center',
  pos: [0, -14],
  rect_size: [780, 32],
  size: 14,
  bold: true,
  color: { r: 0.98, g: 0.95, b: 0.88, a: 1.0 }, // Ivory cream
  alignment: 4, // MiddleCenter
});
b.patchComponent('Cover/TipPlate/TipContent', 'MOD.Core.TextGUIRendererComponent', {
  DropShadow: true,
  DropShadowDistance: 1,
  DropShadowColor: { r: 0.1, g: 0.05, b: 0.02, a: 0.8 },
});

b.write(uiPath);
console.log('--- Successfully written TransitionGroup.ui ---');
