const path = require('path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const uiPath = path.join(__dirname, '../ui/MainMenuGroup.ui');
const b = UIBuilder.load(uiPath);

console.log('--- Applying Cozy Wood & Parchment Theme V2 ---');

// Official MSW Maple Wood & Diary RUIDs
const RUID_WOOD_PANEL = '1b0b24ed2bc44ac1bdd4f93c9eb406c7';    // Textured Wood Panel
const RUID_ROUND_BTN = '9bb8e4d004fb46bb9c1b528b3c1ebf9f';      // 3D Rounded Maple Wood Button
const RUID_ACTION_BTN = 'e22dca176e7c48b39d5b40554b546e22';     // 3D Embossed Golden Action Button
const RUID_TITLE_DECO = '25e5f99bdc562c241bf1b96a0d76f493';     // Maple Title Ribbon Plate
const RUID_SLOT_FRAME = '004e5fc9c660a1342a055ae7157e5aeb';     // Rounded Ornament Frame

// ====================================================================
// 1. SlotPanel: Remove unnatural dim tints, refine header & back button
// ====================================================================

// Hide PageTint completely to reveal natural book parchment texture!
b.patch('/ui/MainMenuGroup/SlotPanel/PageTint', {
  enable: false,
});

// Book Notebook Frame
b.patch('/ui/MainMenuGroup/SlotPanel/Notebook', {
  pos: [0, -25],
  rect_size: [1020, 920],
  pivot: [0.5, 0.5],
});

// Subtitle Plate: Use Deco Plate RUID instead of flat box
b.patch('/ui/MainMenuGroup/SlotPanel/SubtitlePlate', {
  pos: [0, 365],
  rect_size: [560, 60],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/SubtitlePlate', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_TITLE_DECO },
  Color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
  Type: 1, // Sliced
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.1, g: 0.05, b: 0.0, a: 0.4 },
});

b.patch('/ui/MainMenuGroup/SlotPanel/Subtitle', {
  pos: [0, 366],
  rect_size: [520, 44],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/Subtitle', 'MOD.Core.TextGUIRendererComponent', {
  FontColor: { r: 1.0, g: 0.95, b: 0.82, a: 1.0 },
  FontSize: 28,
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.2, g: 0.1, b: 0.05, a: 0.8 },
});

// Back Button: Use 3D Rounded Maple Wood Button!
b.patch('/ui/MainMenuGroup/SlotPanel/BtnBack', {
  pos: [-380, 365],
  rect_size: [130, 52],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/BtnBack', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ROUND_BTN },
  Color: { r: 0.88, g: 0.78, b: 0.65, a: 1.0 },
  Type: 1,
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.1, g: 0.05, b: 0.0, a: 0.35 },
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/BtnBack', 'MOD.Core.TextGUIRendererComponent', {
  Text: '◀ 뒤로',
  FontColor: { r: 0.98, g: 0.96, b: 0.92, a: 1.0 },
  FontSize: 24,
});

// ====================================================================
// 2. 5 Slots: Non-flat wood & parchment cards, elevate avatar (+14px)
// ====================================================================
const slotYPositions = [170, 68, -34, -136, -238];

for (let i = 1; i <= 5; i++) {
  const slotPath = `/ui/MainMenuGroup/SlotPanel/Slot${i}`;
  const y = slotYPositions[i - 1];

  // Slot Card Panel: Use Textured Wood Panel
  b.patch(slotPath, {
    pos: [0, y],
    rect_size: [760, 94],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(slotPath, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_WOOD_PANEL },
    Color: { r: 1.0, g: 0.98, b: 0.94, a: 0.98 },
    Type: 1,
    DropShadow: true,
    DropShadowDistance: 3,
    DropShadowColor: { r: 0.15, g: 0.08, b: 0.02, a: 0.22 },
  });

  // Avatar in Slot: Y elevated to +14px to fix the sagging issue!
  const avatarPath = `${slotPath}/Avatar`;
  b.patch(avatarPath, {
    pos: [-305, 14],
    rect_size: [104, 114],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(avatarPath, 'MOD.Core.AvatarGUIRendererComponent', {
    PreserveAvatar: 1, // AspectOnly
  });

  // Title Text (Character Name)
  const titlePath = `${slotPath}/Title`;
  b.patch(titlePath, {
    pos: [-100, 18],
    rect_size: [310, 36],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(titlePath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.24, g: 0.15, b: 0.08, a: 1.0 },
    FontSize: 28,
  });

  // Info Text (Level & Job)
  const infoPath = `${slotPath}/Info`;
  b.patch(infoPath, {
    pos: [-100, -18],
    rect_size: [310, 30],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(infoPath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.46, g: 0.34, b: 0.22, a: 1.0 },
    FontSize: 22,
  });

  // Select Button: Use 3D Golden Action Button with Fresh Green Tint!
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

  // Delete Button: Use 3D Rounded Wood Button with Soft Rosewood Tint
  const btnDeletePath = `${slotPath}/BtnDelete`;
  b.patch(btnDeletePath, {
    pos: [315, 0],
    rect_size: [80, 66],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(btnDeletePath, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_ROUND_BTN },
    Color: { r: 0.75, g: 0.42, b: 0.38, a: 0.95 },
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
// 3. CustomizePanel: Remove ugly page tints, elevate avatar (+35px), polish selectors
// ====================================================================

// Remove page tints that made the paper muddy!
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/LeftPageTint', {
  enable: false,
});
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/PageTint', {
  enable: false,
});

// Title Plate: Use Deco Ribbon Plate
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/TitlePlate', {
  pos: [0, 370],
  rect_size: [540, 62],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/TitlePlate', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_TITLE_DECO },
  Color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
  Type: 1,
});

b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/Title', {
  pos: [0, 372],
  rect_size: [500, 48],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/Title', 'MOD.Core.TextGUIRendererComponent', {
  FontColor: { r: 1.0, g: 0.95, b: 0.82, a: 1.0 },
  FontSize: 30,
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.2, g: 0.1, b: 0.05, a: 0.8 },
});

// Avatar in Customize: Elevate Y to 150px (was 115px) to prevent sagging!
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/Preview', {
  pos: [-225, 150],
  rect_size: [240, 310],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/Preview', 'MOD.Core.AvatarGUIRendererComponent', {
  PreserveAvatar: 1, // AspectOnly
});

// Mode Toggle Buttons: Use 3D Rounded Buttons
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookAccount', {
  pos: [-225, -50],
  rect_size: [250, 56],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookAccount', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ROUND_BTN },
  Type: 1,
});

b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookCustom', {
  pos: [-225, -118],
  rect_size: [250, 56],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnLookCustom', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ROUND_BTN },
  Type: 1,
});

// Back Button in Customize
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/BtnBack', {
  pos: [-225, -228],
  rect_size: [200, 64],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/BtnBack', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ROUND_BTN },
  Color: { r: 0.75, g: 0.65, b: 0.55, a: 1.0 },
  Type: 1,
});

// Start Adventure Button in Customize: Use 3D Golden Action Button!
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/BtnStart', {
  pos: [245, -228],
  rect_size: [220, 68],
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

// Arrow buttons: Use 3D Rounded Buttons
const arrowBtns = [
  'BtnHairPrev', 'BtnHairNext',
  'BtnFacePrev', 'BtnFaceNext',
  'BtnBodyPrev', 'BtnBodyNext',
  'BtnCoatPrev', 'BtnCoatNext',
];
for (const btnName of arrowBtns) {
  b.patchComponent(`/ui/MainMenuGroup/CustomizePanel/Frame/${btnName}`, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_ROUND_BTN },
    Color: { r: 0.85, g: 0.72, b: 0.58, a: 1.0 },
    Type: 1,
  });
}

// Selector Name Plates: Use Wood Panel Texture
const namePlates = ['HairNamePlate', 'FaceNamePlate', 'BodyNamePlate', 'CoatNamePlate'];
for (const plateName of namePlates) {
  b.patchComponent(`/ui/MainMenuGroup/CustomizePanel/Frame/${plateName}`, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: RUID_WOOD_PANEL },
    Color: { r: 1.0, g: 0.98, b: 0.94, a: 0.95 },
    Type: 1,
  });
}

// Name Input box: Rounded Wood Panel Frame
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/NameInput', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_WOOD_PANEL },
  Color: { r: 1.0, g: 1.0, b: 0.98, a: 0.98 },
  Type: 1,
});

console.log('Writing updated UI V2...');
b.write(uiPath);
console.log('Done applying Cozy Wood V2!');
