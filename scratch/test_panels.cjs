const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

console.log("Setting SlotPanel Enable=true, TitlePanel Enable=false for visual test...");
const ui = UIBuilder.read('ui/MainMenuGroup.ui');

ui.patch('TitlePanel', { enable: false });
ui.patch('SlotPanel', { enable: true });
ui.patch('CustomizePanel', { enable: false });

ui.write('ui/MainMenuGroup.ui');
console.log("Updated MainMenuGroup.ui to show SlotPanel");
