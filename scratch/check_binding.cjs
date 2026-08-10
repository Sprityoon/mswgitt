const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const fs = require('fs');

const ui = UIBuilder.read('ui/MainMenuGroup.ui');
const mlua = fs.readFileSync('RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua', 'utf8');

const controllerEnt = ui.find('Controller');
console.log('Controller Ent:', controllerEnt ? 'Found' : 'Not found');

const btnNewEnt = ui.find('TitlePanel/BtnNew');
console.log('BtnNew UUID in .ui:', btnNewEnt ? btnNewEnt.id : 'Not found');

const btnNewPropMatch = mlua.match(/property\s+ButtonComponent\s+btnNew\s*=\s*"([^"]+)"/);
console.log('mlua btnNew prop default:', btnNewPropMatch ? btnNewPropMatch[1] : 'None');

if (btnNewEnt && btnNewPropMatch) {
  console.log('Match?:', btnNewEnt.id === btnNewPropMatch[1]);
}
