"use strict";
/**
 * CraftingPopup — 닫기 X가 티어/카테고리 바에 가려짐.
 * 원인: BtnClose displayOrder=3 < TierBar 6 < CategoryBar 7, 바가 창 오른쪽까지 덮음.
 * 수정: 닫기를 최상단 z + 바 폭을 줄여 X 자리를 비움.
 */
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = path.join(__dirname, "..", "ui/PopupGroup.ui");
const b = UIBuilder.load(UI);

b.patch("/ui/PopupGroup/CraftingPopup/BtnClose", { display_order: 20 });
b.patch("/ui/PopupGroup/CraftingPopup/TierBar", { pos: [-60, -56], rect_size: [820, 44] });
b.patch("/ui/PopupGroup/CraftingPopup/CategoryBar", { pos: [-60, -104], rect_size: [820, 44] });

b.write(UI);
console.log("craft close z + bar inset done");
