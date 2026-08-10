const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

console.log("Restoring initial panel enable states: TitlePanel=true, SlotPanel=false...");
const ui = UIBuilder.read('ui/MainMenuGroup.ui');

ui.patch('TitlePanel', { enable: true });
ui.patch('SlotPanel', { enable: false });
ui.patch('CustomizePanel', { enable: false });

ui.write('ui/MainMenuGroup.ui');
console.log("Restored panel states in MainMenuGroup.ui");
