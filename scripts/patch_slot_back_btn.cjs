const path = require('path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const uiPath = path.join(__dirname, '../ui/MainMenuGroup.ui');
const b = UIBuilder.load(uiPath);

console.log('--- Patching SlotPanel BtnBack text color & style ---');

const RUID_ROUND_WOOD_BTN = '9bb8e4d004fb46bb9c1b528b3c1ebf9f';

// Match Button background with CustomizePanel/BtnBack (warm antique wood)
b.patch('/ui/MainMenuGroup/SlotPanel/BtnBack', {
  pos: [-380, 365],
  rect_size: [130, 52],
  pivot: [0.5, 0.5],
});
b.patchComponent('/ui/MainMenuGroup/SlotPanel/BtnBack', 'MOD.Core.SpriteGUIRendererComponent', {
  ImageRUID: { DataId: RUID_ROUND_WOOD_BTN },
  Color: { r: 0.82, g: 0.72, b: 0.60, a: 1.0 },
  Type: 1,
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.1, g: 0.05, b: 0.0, a: 0.35 },
});

// Update text to radiant ivory white with drop-shadow for crystal-clear readability
b.patchComponent('/ui/MainMenuGroup/SlotPanel/BtnBack', 'MOD.Core.TextGUIRendererComponent', {
  Text: '◀ 뒤로',
  FontColor: { r: 1.0, g: 1.0, b: 0.96, a: 1.0 }, // Radiant Light Ivory Text!
  FontSize: 25,
  FontStyle: 1, // Bold
  Outline: false,
  Padding: { left: 0, right: 0, top: 0, bottom: 4 },
  DropShadow: true,
  DropShadowDistance: 2,
  DropShadowColor: { r: 0.12, g: 0.06, b: 0.02, a: 0.7 },
});

console.log('Writing updated UI...');
b.write(uiPath);
console.log('Done patching SlotPanel BtnBack!');
