// 음악 토글: 기존 버튼 UUID 보존, 기본 도형으로 스피커/음소거 사선 구성.
const assert = require('node:assert/strict');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const file = 'ui/MainMenuGroup.ui';
const b = UIBuilder.read(file);
const name = 'TitlePanel/BtnMusic';
if (!b.find(name)) {
  b.button(name, '', {
    anchor: 'bottom-left', pivot: [0, 0], pos: [32, 32], rect_size: [88, 88],
  });
}
const buttonId = b.getId(name);
const transform = b.getComponent(name, 'MOD.Core.UITransformComponent');
// Maker에서 옮긴 위치를 기준으로 축소. 우상단 플랫폼 기본 메뉴 영역만 피한다.
const pos = [transform.anchoredPosition.x, transform.anchoredPosition.y];
if (transform.AlignmentOption === 7 && pos[1] > 850) {
  const parent = b.getComponent('TitlePanel', 'MOD.Core.UITransformComponent');
  pos[0] = Math.min(pos[0], parent.RectSize.x - 220 - 8 - 88);
}
b.patch(name, { pos, rect_size: [88, 88] });
b.patchComponent(name, 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 1, g: 1, b: 1, a: 0 }, DropShadow: false, Outline: false, RaycastTarget: true,
});
b.patchComponent(name, 'MOD.Core.ButtonComponent', { Transition: 0 });
// UIButton 프리팹의 텍스트 컴포넌트는 유지하되 빈 문구로 저장한다.
b.patchComponent(name, 'MOD.Core.TextGUIRendererComponent', { Text: '' });

const root = name + '/Icon';
const ink = '#3A2419';
const cream = '#FFF0CE';
const base = { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [0, 0], rect_size: [68, 68] };
b.empty(root, base);
// 곡선 모서리·둥근 선 끝도 폴리곤에 포함해서 native 선 렌더러의 끝 모양에 의존하지 않는다.
function roundCorners(vertices, radius) {
  const result = [];
  vertices.forEach((v, i) => {
    const previous = vertices[(i + vertices.length - 1) % vertices.length];
    const next = vertices[(i + 1) % vertices.length];
    const previousLength = Math.hypot(previous[0] - v[0], previous[1] - v[1]);
    const nextLength = Math.hypot(next[0] - v[0], next[1] - v[1]);
    const distance = Math.min(radius, previousLength / 3, nextLength / 3);
    const start = v.map((value, axis) => value + (previous[axis] - value) * distance / previousLength);
    const end = v.map((value, axis) => value + (next[axis] - value) * distance / nextLength);
    for (let step = 0; step <= 6; step++) {
      const t = step / 6;
      result.push(v.map((value, axis) => (1 - t) ** 2 * start[axis] + 2 * t * (1 - t) * value + t ** 2 * end[axis]));
    }
  });
  return result;
}
function arcStroke(radius, width) {
  const result = [], half = width / 2, angle = 0.72;
  const polar = (r, theta) => [-5 + r * Math.cos(theta), r * Math.sin(theta)];
  for (let i = 0; i <= 16; i++) result.push(polar(radius + half, -angle + 2 * angle * i / 16));
  const upper = polar(radius, angle);
  for (let i = 1; i <= 12; i++) {
    const theta = angle + Math.PI * i / 12;
    result.push([upper[0] + half * Math.cos(theta), upper[1] + half * Math.sin(theta)]);
  }
  for (let i = 1; i <= 16; i++) result.push(polar(radius - half, angle - 2 * angle * i / 16));
  const lower = polar(radius, -angle);
  for (let i = 1; i < 12; i++) {
    const theta = -angle + Math.PI + Math.PI * i / 12;
    result.push([lower[0] + half * Math.cos(theta), lower[1] + half * Math.sin(theta)]);
  }
  return result;
}
function capsule(start, end, width) {
  const result = [], half = width / 2;
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  for (const [center, from] of [[end, angle - Math.PI / 2], [start, angle + Math.PI / 2]]) {
    for (let i = 0; i <= 12; i++) {
      const theta = from + Math.PI * i / 12;
      result.push([center[0] + half * Math.cos(theta), center[1] + half * Math.sin(theta)]);
    }
  }
  return result;
}
const speaker = [[-26, -12], [-16, -12], [0, -25], [0, 25], [-16, 12], [-26, 12]];
const speakerOutline = [[-30, -16], [-18, -16], [3, -30], [3, 30], [-18, 16], [-30, 16]];
b.polygon(root + '/SpeakerOutline', { ...base, points: roundCorners(speakerOutline, 6), color: ink });
b.polygon(root + '/Speaker', { ...base, points: roundCorners(speaker, 4), color: cream });
b.empty(root + '/Waves', base);
[18, 30].forEach((radius, i) => {
  b.polygon(root + '/Waves/Arc' + i + 'Outline', { ...base, points: arcStroke(radius, 12), color: ink });
  b.polygon(root + '/Waves/Arc' + i, { ...base, points: arcStroke(radius, 8), color: cream });
});
b.empty(root + '/MuteSlash', { ...base, enable: false });
b.polygon(root + '/MuteSlash/Outline', { ...base, points: capsule([-27, -25], [27, 25], 14), color: ink });
b.polygon(root + '/MuteSlash/Line', { ...base, points: capsule([-27, -25], [27, 25], 10), color: cream });

b.write(file, {
  bind: {
    mlua: 'RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua',
    props: { btnMusic: name, musicWaves: root + '/Waves', musicMuteSlash: root + '/MuteSlash' },
  },
});
const saved = UIBuilder.read(file);
assert.equal(saved.getId(name), buttonId);
assert.equal(saved.getComponent(name, 'MOD.Core.SpriteGUIRendererComponent').RaycastTarget, true);
assert.equal(saved.getComponent(name, 'MOD.Core.SpriteGUIRendererComponent').Color.a, 0);
assert.equal(saved.getComponent(name, 'MOD.Core.TextGUIRendererComponent').Text, '');
assert.deepEqual(saved.getComponent(name, 'MOD.Core.UITransformComponent').RectSize, { x: 88, y: 88 });
assert.equal(saved.find(root + '/MuteSlash').jsonString.enable, false);
console.log('Speaker icon saved; existing music button UUID preserved:', buttonId);
