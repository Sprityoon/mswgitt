const path = require('path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const uiPath = path.join(__dirname, '../ui/MainMenuGroup.ui');
const b = UIBuilder.load(uiPath);

console.log('--- Patching SlotPanel & Avatars (Cozy Wood & Parchment Theme) ---');

// 1. SlotPanel Frame & Header
b.patch('/ui/MainMenuGroup/SlotPanel/Notebook', {
  pos: [0, -30],
  rect_size: [1020, 920],
  pivot: [0.5, 0.5],
});

b.patch('/ui/MainMenuGroup/SlotPanel/PageTint', {
  pos: [0, -25],
  rect_size: [800, 560],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/PageTint', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 0.24, g: 0.16, b: 0.10, a: 0.15 },
});

// Subtitle Plate & Text
b.patch('/ui/MainMenuGroup/SlotPanel/SubtitlePlate', {
  pos: [0, 365],
  rect_size: [520, 54],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/SubtitlePlate', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 0.36, g: 0.24, b: 0.15, a: 0.92 },
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0, g: 0, b: 0, a: 0.4 },
});

b.patch('/ui/MainMenuGroup/SlotPanel/Subtitle', {
  pos: [0, 365],
  rect_size: [500, 44],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/Subtitle', 'MOD.Core.TextGUIRendererComponent', {
  FontColor: { r: 1.0, g: 0.94, b: 0.78, a: 1.0 },
  FontSize: 28,
});

// Back Button
b.patch('/ui/MainMenuGroup/SlotPanel/BtnBack', {
  pos: [-380, 365],
  rect_size: [120, 50],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/BtnBack', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 0.44, g: 0.30, b: 0.20, a: 0.95 },
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0, g: 0, b: 0, a: 0.3 },
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/BtnBack', 'MOD.Core.TextGUIRendererComponent', {
  Text: '◀ 뒤로',
  FontColor: { r: 0.96, g: 0.92, b: 0.85, a: 1.0 },
  FontSize: 24,
});

// 2. 5 Slots Layout & Styling
const slotYPositions = [170, 68, -34, -136, -238];

for (let i = 1; i <= 5; i++) {
  const slotPath = `/ui/MainMenuGroup/SlotPanel/Slot${i}`;
  const y = slotYPositions[i - 1];

  // Slot Card Panel
  b.patch(slotPath, {
    pos: [0, y],
    rect_size: [760, 94],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(slotPath, 'MOD.Core.SpriteGUIRendererComponent', {
    Color: { r: 0.985, g: 0.965, b: 0.915, a: 0.96 },
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0.1, g: 0.05, b: 0.0, a: 0.18 },
  });

  // Avatar in Slot (Fix squishing!)
  const avatarPath = `${slotPath}/Avatar`;
  b.patch(avatarPath, {
    pos: [-310, 0],
    rect_size: [100, 110],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(avatarPath, 'MOD.Core.AvatarGUIRendererComponent', {
    PreserveAvatar: 1, // AspectOnly!
  });

  // Title Text
  const titlePath = `${slotPath}/Title`;
  b.patch(titlePath, {
    pos: [-105, 18],
    rect_size: [300, 36],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(titlePath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.24, g: 0.16, b: 0.10, a: 1.0 },
    FontSize: 28,
  });

  // Info Text
  const infoPath = `${slotPath}/Info`;
  b.patch(infoPath, {
    pos: [-105, -18],
    rect_size: [300, 30],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(infoPath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.48, g: 0.36, b: 0.24, a: 1.0 },
    FontSize: 22,
  });

  // Select Button
  const btnSelectPath = `${slotPath}/BtnSelect`;
  b.patch(btnSelectPath, {
    pos: [175, 0],
    rect_size: [170, 64],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(btnSelectPath, 'MOD.Core.SpriteGUIRendererComponent', {
    Color: { r: 0.35, g: 0.58, b: 0.28, a: 1.0 }, // Fresh Forest Olive
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0, g: 0, b: 0, a: 0.25 },
  });
  b.patchComponent(btnSelectPath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 1.0, g: 1.0, b: 0.95, a: 1.0 },
    FontSize: 26,
  });

  // Delete Button
  const btnDeletePath = `${slotPath}/BtnDelete`;
  b.patch(btnDeletePath, {
    pos: [315, 0],
    rect_size: [80, 64],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(btnDeletePath, 'MOD.Core.SpriteGUIRendererComponent', {
    Color: { r: 0.55, g: 0.28, b: 0.25, a: 0.92 }, // Rosewood Brown
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0, g: 0, b: 0, a: 0.25 },
  });
  b.patchComponent(btnDeletePath, 'MOD.Core.TextGUIRendererComponent', {
    FontColor: { r: 0.98, g: 0.90, b: 0.88, a: 1.0 },
    FontSize: 22,
  });
}

// 3. Customize Panel Avatar Squish Fix
b.patch('/ui/MainMenuGroup/CustomizePanel/Frame/Preview', {
  pos: [-225, 115],
  rect_size: [240, 310],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/CustomizePanel/Frame/Preview', 'MOD.Core.AvatarGUIRendererComponent', {
  PreserveAvatar: 1, // AspectOnly!
});

console.log('Writing updated UI...');
b.write(uiPath);
console.log('Done!');
