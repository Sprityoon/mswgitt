const path = require('path');
const { UIBuilder } = require(path.resolve(__dirname, '../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));

const b = UIBuilder.read('ui/HUDGroup.ui');

// 기존 QuestNavigator 엔티티가 있다면 제거 후 재생성
if (b.find('/ui/HUDGroup/QuestNavigator')) {
    b.remove('/ui/HUDGroup/QuestNavigator');
}

// /ui/HUDGroup/QuestNavigator 추가
b.empty('/ui/HUDGroup/QuestNavigator', {
    pos: [0, 0],
    rect_size: [100, 100],
    anchor: 'center',
    enable: false
});

// 스크립트 컴포넌트 부착
b.addComponent('/ui/HUDGroup/QuestNavigator', 'script.UIQuestNavigationController');

b.write('ui/HUDGroup.ui');
console.log('Successfully updated ui/HUDGroup.ui with QuestNavigator');
