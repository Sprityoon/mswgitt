const path = require('path');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

function buildEnvironmentOverlayGroup() {
  const b = new UIBuilder('EnvironmentOverlayGroup', 0, true);

  // 1. Root UIGroup (GroupOrder: 0 - 월드 위, 모든 UI 아래)
  b.group('EnvironmentOverlayGroup', {
    group_order: 0,
    group_type: 1, // DefaultType (상시 표시 레이어)
    default_show: true,
    anchor: 'middle-center',
    pos: [0, 0],
    rect_size: [1920, 1080],
    pivot: [0.5, 0.5]
  });

  // 터치/클릭 100% 통과 가드 (BlocksRaycasts: false, Interactable: false)
  b.patchComponent('/ui/EnvironmentOverlayGroup', 'MOD.Core.CanvasGroupComponent', {
    BlocksRaycasts: false,
    Interactable: false,
    GroupAlpha: 1
  });

  // 2. NightOverlay: 3840x2160 풀커버 (울트라와이드 21:9~32:9부터 4:3 태블릿까지 어떤 비율도 레터박스 여백 없이 완벽 커버)
  b.sprite('EnvironmentOverlayGroup/NightOverlay', {
    anchor: 'middle-center',
    pos: [0, 0],
    rect_size: [3840, 2160],
    pivot: [0.5, 0.5],
    color: [0.06, 0.08, 0.22, 0.0],
    raycast: false
  });

  // 3. WeatherOverlay: 3840x2160 풀커버 (비/안개 날씨 틴트)
  b.sprite('EnvironmentOverlayGroup/WeatherOverlay', {
    anchor: 'middle-center',
    pos: [0, 0],
    rect_size: [3840, 2160],
    pivot: [0.5, 0.5],
    color: [0, 0, 0, 0],
    raycast: false
  });

  const targetPath = 'ui/EnvironmentOverlayGroup.ui';
  b.write(targetPath, { strict: true });
  console.log(`Successfully generated ${targetPath}`);
}

buildEnvironmentOverlayGroup();
