// NPC 상점: 기존 ui8 양피지 수량창 + 목재 버튼을 재사용한다.
const fs = require('node:fs');
const path = require('node:path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const kit = require('./ui8_kit.cjs');
const root = path.resolve(__dirname, '..');
const staged = process.argv.includes('--stage');
const source = path.join(root, 'ui/PopupGroup.ui');
const dest = staged ? path.join(root, 'scratch/shop-quantity-stage-20261021/PopupGroup.ui') : source;
const controller = path.join(root, staged ? 'scratch/shop-quantity-stage-20261021/UIShopController.mlua' : 'RootDesk/MyDesk/UI/Scripts/UIShopController.mlua');
const b = UIBuilder.read(source);
const popup = 'ShopPopup/BuyQuantity';
const card = popup + '/Card';
const cream = '#FFF0CC', ink = '#45210A';
b.empty(popup, { pos: [0, 0], rect_size: [1920, 1080], enable: false });
b.sprite(popup + '/Dim', { pos: [0, 0], rect_size: [3840, 2160], color: '#000000', alpha: 0.65, raycast: true });
b.sprite(card, { pos: [0, 0], rect_size: [640, 680], raycast: true });
// 배경을 모든 글자보다 먼저 만든다. 기존 노드의 순서/ID에는 손대지 않는다.
kit.skin9(b, card, 'ui8_popup_frame');
b.text(card + '/Title', '구매 수량', { pos: [-40, 282], rect_size: [420, 56], size: 34, bold: true, color: cream, outline: true, outline_color: '#351D10' });
b.text(card + '/ItemName', '', { pos: [0, 188], rect_size: [548, 52], size: 28, bold: true, color: ink, bestfit: true, min_size: 22, max_size: 28 });
b.text(card + '/UnitPrice', '', { pos: [0, 140], rect_size: [548, 40], size: 24, color: ink, bestfit: true, min_size: 20, max_size: 24 });
b.text(card + '/LimitText', '', { pos: [0, 96], rect_size: [548, 40], size: 24, color: ink });
b.sprite(card + '/CountText', { pos: [0, 24], rect_size: [280, 96], image_ruid: kit.ruid('ui8_input'), sprite_type: 0, color: '#FFFFFF', raycast: false, text: '1개', text_size: 34, text_bold: true, text_color: ink });
const button = (name, label, pos, size, asset = 'ui8_btn_oak', textColor = cream) => {
  const p = card + '/' + name;
  b.button(p, label, { pos, rect_size: size, font_size: 28, color: textColor, bg_color: '#FFFFFF', sprite_type: 0, image_ruid: kit.ruid(asset) });
  b.patchComponent(p, 'MOD.Core.TextGUIRendererComponent', { FontStyle: 1, Padding: { left: 0, right: 0, top: 0, bottom: Math.round(size[1] * 0.09) } });
};
button('BtnMinus', '−', [-220, 24], [96, 96]);
button('BtnPlus', '+', [220, 24], [96, 96]);
button('BtnMin', '최소', [-148, -96], [240, 88]);
button('BtnMax', '최대', [148, -96], [240, 88]);
b.text(card + '/TotalPrice', '', { pos: [0, -174], rect_size: [548, 44], size: 30, bold: true, color: ink, bestfit: true, min_size: 22, max_size: 30 });
button('BtnCancel', '취소', [-148, -268], [240, 88]);
button('BtnBuy', '구매', [148, -268], [240, 88], 'ui8_btn_amber', ink);
b.button(card + '/BtnClose', '', { anchor: 'top-right', pos: [-14, -14], rect_size: [88, 88], bg_color: '#FFFFFF', image_ruid: kit.ruid('ui8_btn_close'), sprite_type: 0 });
b.write(dest, { bind: { mlua: controller, props: { buyPopup: popup, buyCard: card } } });
console.log('Shop quantity modal: default hidden, seven touch targets >=88px, ui8 skin, ' + (staged ? 'staged' : 'applied'));
