const path = require('path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const uiPath = path.join(__dirname, '../ui/MainMenuGroup.ui');
const b = UIBuilder.load(uiPath);

console.log('--- Applying Cozy Wood & Parchment Theme V3 ---');

// Official MSW Maple Verified RUIDs
const RUID_PARCHMENT_PAPER = 'c24adedc9faa457daf4e4aae7cd663bb';  // Light Warm Parchment Paper
const RUID_WOOD_FRAME = '25e9e89579644202805f535d038a9edb';        // Antique Carved Wood Frame
const RUID_ROUND_WOOD_BTN = '9bb8e4d004fb46bb9c1b528b3c1ebf9f';    // 3D Rounded Maple Wood Button
const RUID_ACTION_BTN = 'e22dca176e7c48b39d5b40554b546e22';        // 3D Embossed Golden Action Button
const RUID_ITEM_SLOT = 'a7928ea51274446898d8453eb96ee06f';         // Engraved Gold/Wood Slot Frame
const RUID_SOFT_RECT = '4fea64a3307cda641809ad8be0d4890b';         // Smooth 9-slice Rounded Box

// ====================================================================
// 1. SlotPanel: Warm Wood Title Plate, Non-dimmed background, Back Button
// ====================================================================

// Completely disable all unnatural dim tints
b.patch('/ui/MainMenuGroup/SlotPanel/PageTint', { enable: false });

// Book Notebook Frame
b.patch('/ui/MainMenuGroup/SlotPanel/Notebook', {
  pos: [0, -25],
  rect_size: [1020, 920],
  pivot: [0.5, 0.5],
});

// Title Signboard: Rich Antique Walnut Wood Signboard with Gold drop-shadow!
b.patch('/ui/MainMenuGroup/SlotPanel/SubtitlePlate', {
  pos: [0, 365],
  rect_size: [520, 58],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/SubtitlePlate', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_WOOD_FRAME },
  Color: { r: 0.38, g: 0.22, b: 0.12, a: 1.0 }, // Rich Antique Walnut
  Type: 1, // Sliced
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
  FontColor: { r: 1.0, g: 0.95, b: 0.85, a: 1.0 }, // Radiant Warm Ivory
  FontSize: 26,
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
  FontColor: { r: 0.30, g: 0.18, b: 0.10, a: 1.0 },
  FontSize: 24,
});

// ====================================================================
// 2. 5 Slots: Cozy Parchment Texture Cards, Elevated Centered Avatar (+24px)
// ====================================================================
const slotYPositions = [170, 68, -34, -136, -238];

for (let i = 1; i <= 5; i++) {
  const slotPath = `/ui/MainMenuGroup/SlotPanel/Slot${i}`;
  const y = slotYPositions[i - 1];

  // Slot Card Panel: Light Warm Parchment Paper (Harmonizes with Book pages!)
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

  // Avatar in Slot: Y elevated to +24px (Perfect vertical center!)
  const avatarPath = `${slotPath}/Avatar`;
  b.patch(avatarPath, {
    pos: [-305, 24],
    rect_size: [96, 108],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(avatarPath, 'MOD.Core.AvatarGUIRendererComponent', {
    PreserveAvatar: 1, // AspectOnly
  });

  // Title Text (Character Name / Slot Name)
  const titlePath = `${slotPath}/Title`;
  b.patch(titlePath, {
    pos: [-100, 18],
    rect_size: [310, 36],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(titlePath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.22, g: 0.14, b: 0.06, a: 1.0 }, // Deep Antique Brown (High Contrast!)
    FontSize: 28,
  });

  // Info Text (Level & Job / "비어 있음")
  const infoPath = `${slotPath}/Info`;
  b.patch(infoPath, {
    pos: [-100, -18],
    rect_size: [310, 30],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(infoPath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.50, g: 0.38, b: 0.25, a: 1.0 }, // Warm Olive Wood Tone
    FontSize: 22,
  });

  // Select Button: 3D Golden Action Button with Fresh Olive Green Tint!
  const btnSelectPath = `${slotPath}/BtnSelect`;
  b.patch(btnSelectPath, {
    pos: [175, 0],
    rect_size: [170, 66],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(btnSelectPath, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_ACTION_BTN },
    Color: { r: 0.45, g: 0.72, b: 0.35, a: 1.0 }, // Vivid Forest Olive
    Type: 1,
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0.05, g: 0.15, b: 0.05, a: 0.3 },
  });
  b.patchComponent(btnSelectPath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 1.0, g: 1.0, b: 0.96, a: 1.0 },
    FontSize: 26,
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0.1, g: 0.25, b: 0.08, a: 0.6 },
  });

  // Delete Button: 3D Rounded Maple Wood Button with Soft Rosewood Tint
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
  });
}

// ====================================================================
// 3. CustomizePanel: Centered Avatar (+205px), Warm Parchment Selectors
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
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.15, g: 0.08, b: 0.03, a: 0.9 },
});

// Avatar in Customize: Elevate Y to 205px (Perfect vertical center of left page!)
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/Preview', {
  pos: [-225, 205],
  rect_size: [240, 310],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/Preview', 'MOD.Core.AvatarGUIRendererComponent', {
  PreserveAvatar: 1, // AspectOnly
});

// Mode Toggle Buttons: Repositioned below avatar with comfortable spacing
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
  FontColor: { r: 0.28, g: 0.16, b: 0.08, a: 1.0 },
  FontSize: 24,
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
  FontColor: { r: 0.28, g: 0.16, b: 0.08, a: 1.0 },
  FontSize: 24,
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
  FontColor: { r: 0.30, g: 0.18, b: 0.10, a: 1.0 },
  FontSize: 26,
});

b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/BtnStart', {
  pos: [245, -195],
  rect_size: [240, 66],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnStart', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ACTION_BTN },
  Color: { r: 0.45, g: 0.72, b: 0.35, a: 1.0 }, // Vivid Forest Olive
  Type: 1,
  DropShadow: true,
  DropShadowDistance: 3,
  DropShadowColor: { r: 0.05, g: 0.15, b: 0.05, a: 0.35 },
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnStart', 'MOD.Core.TextGUIRendererComponent', {
  FontColor: { r: 1.0, g: 1.0, b: 0.96, a: 1.0 },
  FontSize: 28,
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
    FontColor: { r: 0.28, g: 0.16, b: 0.08, a: 1.0 }, // Deep Antique Brown
    FontSize: 22,
  });
  b.patchComponent(`/ui/MainMenuGroup/CustomizePanel/Frame/${p.value}`, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.45, g: 0.32, b: 0.18, a: 1.0 }, // Warm Olive Wood
    FontSize: 22,
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
});

console.log('Writing updated UI V3...');
b.write(uiPath);
console.log('Done applying Cozy Wood V3!');
