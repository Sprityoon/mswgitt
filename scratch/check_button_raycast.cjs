const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const ui = UIBuilder.read('ui/MainMenuGroup.ui');

const btnNew = ui.find('TitlePanel/BtnNew');
console.log("BtnNew components:");
btnNew.jsonString['@components'].forEach(c => console.log(c['@type'], JSON.stringify(c, null, 2)));

const signBoard = ui.find('TitlePanel/SignBoard');
console.log("\nSignBoard components:");
signBoard.jsonString['@components'].forEach(c => console.log(c['@type'], JSON.stringify(c, null, 2)));
