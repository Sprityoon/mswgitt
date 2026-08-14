"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const uiPath = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const b = UIBuilder.load(uiPath);

// 크림 0.42는 노트 종이와 겹쳐 박스가 안 보임 → 제목 바와 같은 갈색 틴트
b.patchComponent("SlotPanel/PageTint", "MOD.Core.SpriteGUIRendererComponent", {
  Color: { r: 0.18039216, g: 0.12156863, b: 0.07843137, a: 0.32 },
});

b.write(uiPath);
console.log("PageTint darkened to #2e1f14 a=0.32");
