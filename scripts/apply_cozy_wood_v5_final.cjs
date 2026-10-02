const path = require('path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const uiPath = path.join(__dirname, '../ui/MainMenuGroup.ui');
const b = UIBuilder.load(uiPath);

console.log('--- Applying Cozy Wood & Parchment Theme V5 Final (Crystal Clarity Polish) ---');

// Official MSW Maple Verified RUIDs
const RUID_PARCHMENT_PAPER = 'c24adedc9faa457daf4e4aae7cd663bb';  // Light Warm Parchment Paper
const RUID_WOOD_FRAME = '25e9e89579644202805f535d038a9edb';        // Antique Carved Wood Frame
const RUID_ROUND_WOOD_BTN = '9bb8e4d004fb46bb9c1b528b3c1ebf9f';    // 3D Rounded Maple Wood Button
const RUID_ACTION_BTN = 'e22dca176e7c48b39d5b40554b546e22';        // 3D Embossed Golden Action Button

// ====================================================================
// 1. SlotPanel: Crisp High-Contrast Wood Typography
// ====================================================================

// Completely disable all unnatural dim tints
b.patch('/ui/MainMenuGroup/SlotPanel/PageTint', { enable: false });

// Book Notebook Frame
b.patch('/ui/MainMenuGroup/SlotPanel/Notebook', {
  pos: [0, -25],
  rect_size: [1020, 920],
  pivot: [0.5, 0.5],
});

// Title Signboard: Rich Antique Walnut Wood Signboard
b.patch('/ui/MainMenuGroup/SlotPanel/SubtitlePlate', {
  pos: [0, 365],
  rect_size: [520, 58],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/SubtitlePlate', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_WOOD_FRAME },
  Color: { r: 0.38, g: 0.22, b: 0.12, a: 1.0 },
  Type: 1,
  DropShadow: true,
  DropShadowDistance: 3,
  DropShadowColor: { r: 0.12, g: 0.06, b: 0.02, a: 0.45 },
});

b.patch('/ui/MainMenuGroup/SlotPanel/Subtitle', {
  pos: [0, 366],
  rect_size: [480, 44],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/Subtitle', 'MOD.Core.TextGUIRendererComponent', {
  FontColor: { r: 1.0, g: 0.95, b: 0.85, a: 1.0 },
  FontSize: 26,
  FontStyle: 1, // Bold
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.15, g: 0.08, b: 0.03, a: 0.9 },
});

// Back Button: 3D Rounded Maple Wood Button
b.patch('/ui/MainMenuGroup/SlotPanel/BtnBack', {
  pos: [-380, 365],
  rect_size: [130, 52],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/BtnBack', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ROUND_WOOD_BTN },
  Color: { r: 0.92, g: 0.82, b: 0.70, a: 1.0 },
  Type: 1,
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.1, g: 0.05, b: 0.0, a: 0.35 },
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/BtnBack', 'MOD.Core.TextGUIRendererComponent', {
  Text: '◀ 뒤로',
  FontColor: { r: 0.22, g: 0.12, b: 0.06, a: 1.0 },
  FontSize: 24,
  FontStyle: 1, // Bold
  Outline: false,
  Padding: { left: 0, right: 0, top: 0, bottom: 4 },
});

// 5 Slots: Crisp Chocolate Typography, Perfect Vertical Center
const slotYPositions = [170, 68, -34, -136, -238];

for (let i = 1; i <= 5; i++) {
  const slotPath = `/ui/MainMenuGroup/SlotPanel/Slot${i}`;
  const y = slotYPositions[i - 1];

  // Slot Card Panel: Warm Parchment Paper
  b.patch(slotPath, {
    pos: [0, y],
    rect_size: [760, 94],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(slotPath, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_PARCHMENT_PAPER },
    Color: { r: 1.0, g: 0.98, b: 0.94, a: 0.95 },
    Type: 1,
    DropShadow: true,
    DropShadowDistance: 3,
    DropShadowColor: { r: 0.22, g: 0.14, b: 0.06, a: 0.25 },
  });

  // Avatar in Slot: Y at +24px (Balanced Center)
  const avatarPath = `${slotPath}/Avatar`;
  b.patch(avatarPath, {
    pos: [-305, 24],
    rect_size: [96, 108],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(avatarPath, 'MOD.Core.AvatarGUIRendererComponent', {
    PreserveAvatar: 1, // AspectOnly
  });

  // Title Text: Dark Chocolate
  const titlePath = `${slotPath}/Title`;
  b.patch(titlePath, {
    pos: [-100, 18],
    rect_size: [310, 36],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(titlePath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.16, g: 0.08, b: 0.03, a: 1.0 },
    FontSize: 28,
    FontStyle: 1, // Bold
  });

  // Info Text: Deep Roasted Walnut
  const infoPath = `${slotPath}/Info`;
  b.patch(infoPath, {
    pos: [-100, -18],
    rect_size: [310, 30],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(infoPath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.34, g: 0.20, b: 0.10, a: 1.0 },
    FontSize: 22,
    FontStyle: 1, // Bold
  });

  // Select Button: Centered text on 3D Embossed button
  const btnSelectPath = `${slotPath}/BtnSelect`;
  b.patch(btnSelectPath, {
    pos: [175, 0],
    rect_size: [170, 66],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(btnSelectPath, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_ACTION_BTN },
    Color: { r: 0.45, g: 0.72, b: 0.35, a: 1.0 },
    Type: 1,
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0.05, g: 0.15, b: 0.05, a: 0.3 },
  });
  b.patchComponent(btnSelectPath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 1.0, g: 1.0, b: 0.96, a: 1.0 },
    FontSize: 26,
    FontStyle: 1, // Bold
    Outline: false,
    Padding: { left: 0, right: 0, top: 0, bottom: 6 },
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0.1, g: 0.25, b: 0.08, a: 0.6 },
  });

  // Delete Button: Centered text on 3D Rounded button
  const btnDeletePath = `${slotPath}/BtnDelete`;
  b.patch(btnDeletePath, {
    pos: [315, 0],
    rect_size: [80, 66],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(btnDeletePath, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_ROUND_WOOD_BTN },
    Color: { r: 0.80, g: 0.45, b: 0.40, a: 0.95 },
    Type: 1,
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0.2, g: 0.05, b: 0.05, a: 0.25 },
  });
  b.patchComponent(btnDeletePath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.98, g: 0.92, b: 0.90, a: 1.0 },
    FontSize: 22,
    FontStyle: 1, // Bold
    Outline: false,
    Padding: { left: 0, right: 0, top: 0, bottom: 4 },
  });
}

// ====================================================================
// 2. CustomizePanel: +20% Sizable Avatar, Crystal-Clear Ivory Buttons
// ====================================================================

// Remove unnatural page tints
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/LeftPageTint', { enable: false });
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/PageTint', { enable: false });

// Title Signboard: Rich Antique Walnut Wood Signboard
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/TitlePlate', {
  pos: [0, 365],
  rect_size: [520, 58],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/TitlePlate', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_WOOD_FRAME },
  Color: { r: 0.38, g: 0.22, b: 0.12, a: 1.0 },
  Type: 1,
  DropShadow: true,
  DropShadowDistance: 3,
  DropShadowColor: { r: 0.12, g: 0.06, b: 0.02, a: 0.45 },
});

b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/Title', {
  pos: [0, 366],
  rect_size: [480, 44],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/Title', 'MOD.Core.TextGUIRendererComponent', {
  FontColor: { r: 1.0, g: 0.95, b: 0.85, a: 1.0 },
  FontSize: 28,
  FontStyle: 1, // Bold
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.15, g: 0.08, b: 0.03, a: 0.9 },
});

// Avatar in Customize: Enlarged by ~20% (rect_size: [288, 372], pos: [-225, 215])
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/Preview', {
  pos: [-225, 215],
  rect_size: [288, 372],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/Preview', 'MOD.Core.AvatarGUIRendererComponent', {
  PreserveAvatar: 1, // AspectOnly
});

// Mode Toggle Buttons: Crystal-Clear Light Ivory Text with Subtle Shadow
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookAccount', {
  pos: [-225, 15],
  rect_size: [250, 54],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookAccount', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ROUND_WOOD_BTN },
  Color: { r: 0.88, g: 0.78, b: 0.65, a: 1.0 },
  Type: 1,
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookAccount', 'MOD.Core.TextGUIRendererComponent', {
  Text: '내 캐릭터 유지',
  FontColor: { r: 1.0, g: 1.0, b: 0.96, a: 1.0 },
  FontSize: 25,
  FontStyle: 1, // Bold
  Outline: false,
  Padding: { left: 0, right: 0, top: 0, bottom: 4 },
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.12, g: 0.06, b: 0.02, a: 0.7 },
});

b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookCustom', {
  pos: [-225, -50],
  rect_size: [250, 54],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookCustom', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ROUND_WOOD_BTN },
  Color: { r: 0.88, g: 0.78, b: 0.65, a: 1.0 },
  Type: 1,
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookCustom', 'MOD.Core.TextGUIRendererComponent', {
  Text: '외형 꾸미기',
  FontColor: { r: 1.0, g: 1.0, b: 0.96, a: 1.0 },
  FontSize: 25,
  FontStyle: 1, // Bold
  Outline: false,
  Padding: { left: 0, right: 0, top: 0, bottom: 4 },
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.12, g: 0.06, b: 0.02, a: 0.7 },
});

// Bottom Navigation Buttons: Back and Start Adventure
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/BtnBack', {
  pos: [-225, -195],
  rect_size: [200, 62],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnBack', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ROUND_WOOD_BTN },
  Color: { r: 0.82, g: 0.72, b: 0.60, a: 1.0 },
  Type: 1,
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnBack', 'MOD.Core.TextGUIRendererComponent', {
  Text: '◀ 뒤로',
  FontColor: { r: 1.0, g: 1.0, b: 0.96, a: 1.0 },
  FontSize: 26,
  FontStyle: 1, // Bold
  Outline: false,
  Padding: { left: 0, right: 0, top: 0, bottom: 4 },
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.12, g: 0.06, b: 0.02, a: 0.7 },
});

// Start Adventure Button: Perfectly Centered Text with 3D Face Padding Compensation!
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/BtnStart', {
  pos: [245, -195],
  rect_size: [240, 68],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnStart', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ACTION_BTN },
  Color: { r: 0.45, g: 0.72, b: 0.35, a: 1.0 },
  Type: 1,
  DropShadow: true,
  DropShadowDistance: 3,
  DropShadowColor: { r: 0.05, g: 0.15, b: 0.05, a: 0.35 },
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnStart', 'MOD.Core.TextGUIRendererComponent', {
  Text: '모험 시작',
  FontColor: { r: 1.0, g: 1.0, b: 0.96, a: 1.0 },
  FontSize: 28,
  FontStyle: 1, // Bold
  Outline: false,
  HorizontalAlignment: 2, // Center
  VerticalAlignment: 512, // Middle
  Padding: { left: 0, right: 0, top: 0, bottom: 8 }, // Dead-center on 3D face!
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.1, g: 0.25, b: 0.08, a: 0.6 },
});

// Arrow buttons: 3D Rounded Buttons with warm brown arrows
const arrowBtns = [
  'BtnHairPrev', 'BtnHairNext',
  'BtnFacePrev', 'BtnFaceNext',
  'BtnBodyPrev', 'BtnBodyNext',
  'BtnCoatPrev', 'BtnCoatNext',
];
for (const btnName of arrowBtns) {
  b.patchComponent(`/ui/MainMenuGroup/CustomizePanel/Frame/${btnName}`, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_ROUND_WOOD_BTN },
    Color: { r: 0.92, g: 0.82, b: 0.70, a: 1.0 },
    Type: 1,
  });
  b.patchComponent(`/ui/MainMenuGroup/CustomizePanel/Frame/${btnName}`, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.28, g: 0.16, b: 0.08, a: 1.0 },
    FontSize: 22,
    FontStyle: 1,
    Outline: false,
    Padding: { left: 0, right: 0, top: 0, bottom: 4 },
  });
}

// Selector Name Plates: Warm Parchment Paper Plates with Dark Wood Text
const namePlates = [
  { name: 'HairNamePlate', label: 'HairLabel', value: 'HairName' },
  { name: 'FaceNamePlate', label: 'FaceLabel', value: 'FaceName' },
  { name: 'BodyNamePlate', label: 'BodyLabel', value: 'BodyName' },
  { name: 'CoatNamePlate', label: 'CoatLabel', value: 'CoatName' },
];
for (const p of namePlates) {
  b.patchComponent(`/ui/MainMenuGroup/CustomizePanel/Frame/${p.name}`, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_PARCHMENT_PAPER },
    Color: { r: 1.0, g: 0.98, b: 0.93, a: 0.95 },
    Type: 1,
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0.2, g: 0.12, b: 0.05, a: 0.18 },
  });
  b.patchComponent(`/ui/MainMenuGroup/CustomizePanel/Frame/${p.label}`, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.22, g: 0.12, b: 0.06, a: 1.0 },
    FontSize: 22,
    FontStyle: 1,
    Outline: false,
  });
  b.patchComponent(`/ui/MainMenuGroup/CustomizePanel/Frame/${p.value}`, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.38, g: 0.24, b: 0.12, a: 1.0 },
    FontSize: 22,
    FontStyle: 1,
    Outline: false,
  });
}

// Name Input box: Parchment Paper Frame with crisp contrast text
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/NameInput', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_PARCHMENT_PAPER },
  Color: { r: 1.0, g: 0.99, b: 0.96, a: 0.98 },
  Type: 1,
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.2, g: 0.12, b: 0.05, a: 0.22 },
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/NameInput', 'MOD.Core.TextGUIRendererComponent', {
  FontColor: { r: 0.22, g: 0.14, b: 0.06, a: 1.0 },
  FontSize: 24,
  FontStyle: 1,
  Outline: false,
});

console.log('Writing updated UI V5 Final...');
b.write(uiPath);
console.log('Done applying Cozy Wood V5 Final (Crystal Clarity Polish)!');
