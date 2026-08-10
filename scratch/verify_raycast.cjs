const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const ui = UIBuilder.read('ui/MainMenuGroup.ui');

// SignBoard raycast false
ui.patchComponent('TitlePanel/SignBoard', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });

// Buttons raycast true
['BtnNew', 'BtnContinue', 'BtnQuit'].forEach(name => {
  ui.patchComponent(`TitlePanel/${name}`, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: true });
});

ui.write('ui/MainMenuGroup.ui');
console.log("RaycastTarget properties updated.");
