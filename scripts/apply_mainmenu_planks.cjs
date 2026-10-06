// Maker에서 등록한 나무 판자 PNG의 Sprite RUID를 UIBuilder로 연결한다.
const assert = require('node:assert/strict');
const path = require('node:path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const ruid = process.argv[2];
if (!/^[a-f0-9]{32}$/i.test(ruid || '')) {
  throw new Error('Usage: node scripts/apply_mainmenu_planks.cjs <Maker Sprite RUID: 32 hex characters>');
}
const file = path.resolve(__dirname, '../ui/MainMenuGroup.ui');
const target = 'TitlePanel/SignBoard';
const type = 'MOD.Core.SpriteGUIRendererComponent';
const b = UIBuilder.read(file);
const sprite = b.getComponent(target, type);
assert(sprite && typeof sprite.ImageRUID.DataId === 'string', 'SignBoard sprite is required');
const previous = sprite.ImageRUID.DataId;
b.patchComponent(target, type, { ImageRUID: { DataId: ruid } });
b.write(file);
assert.equal(UIBuilder.read(file).getComponent(target, type).ImageRUID.DataId, ruid);
console.log('SignBoard RUID:', previous, '->', ruid);
console.log('Maker refresh and visual button alignment verification are still required.');
