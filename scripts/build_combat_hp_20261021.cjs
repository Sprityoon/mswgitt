// 기존 ui8 HUD 게이지를 재사용하는 일반 몬스터/보스 체력바. UIBuilder만 사용한다.
const fs = require('node:fs');
const path = require('node:path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'ui/HUDGroup.ui');
const backup = path.join(root, 'scratch/combat-hp-before-20261021');
fs.mkdirSync(backup, { recursive: true });
if (!fs.existsSync(path.join(backup, 'HUDGroup.ui'))) fs.copyFileSync(file, path.join(backup, 'HUDGroup.ui'));
const b = UIBuilder.read(file);
const sprites = JSON.parse(fs.readFileSync(path.join(root, 'docs/design/ui/msw_custom_ui_assets_pack/ui8_ruids.json'), 'utf8'));
const ruid = name => { if (!sprites[name]) throw Error('Missing existing UI8 sprite: ' + name); return sprites[name]; };
const SPR = 'MOD.Core.SpriteGUIRendererComponent';
const filled = (name, size) => {
  b.sprite(name, { rect_size: size, image_ruid: ruid('ui8_gauge_hp'), color: '#FFFFFF', sprite_type: 3, raycast: false });
  b.patchComponent(name, SPR, { FillAmount: 1, FillMethod: 0, FillOrigin: 0, PreserveSprite: 0 });
};

const layer = 'CombatHpLayer';
b.empty(layer, { rect_size: [1920, 1080], pos: [0, 0], anchor: 'middle-center', enable: false });
const normal = layer + '/MonsterHpTemplate';
b.sprite(normal, { rect_size: [100, 14], image_ruid: ruid('ui8_gauge_track'), color: '#FFFFFF', sprite_type: 0, raycast: false, enable: false });
filled(normal + '/Fill', [96, 10]);

const boss = layer + '/BossHpPanel';
b.sprite(boss, { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -80], rect_size: [760, 92], image_ruid: ruid('ui8_row'), color: '#FFFFFF', sprite_type: 0, raycast: false, enable: false });
b.text(boss + '/BossName', '보스', { pos: [0, 23], rect_size: [720, 42], size: 28, bold: true, color: '#FFF0CC', bestfit: true, min_size: 22, max_size: 28, outline: true, outline_color: '#351D10' });
b.sprite(boss + '/Track', { pos: [0, -16], rect_size: [704, 32], image_ruid: ruid('ui8_gauge_track'), color: '#FFFFFF', sprite_type: 0, raycast: false });
filled(boss + '/Track/Fill', [696, 24]);
b.text(boss + '/HpText', '0 / 0', { pos: [0, -16], rect_size: [680, 34], size: 20, bold: true, color: '#FFFFFF', outline: true, outline_color: '#351D10' });
b.write(file);
console.log('Combat HP UI: 8 entities, existing ui8 sprites, no buttons/raycast.');
