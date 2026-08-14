"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const uiPath = path.join(__dirname, "..", "ui/MainMenuGroup.ui");
const b = UIBuilder.load(uiPath);

// 1) Plates behind paired text (SlotPanel pattern: plate do < text do)
b.patch("CustomizePanel/Frame/TitlePlate", { display_order: 0 });
b.patch("CustomizePanel/Frame/Title", { display_order: 32 });
b.patch("CustomizePanel/Frame/HairNamePlate", { display_order: 3 });
b.patch("CustomizePanel/Frame/FaceNamePlate", { display_order: 7 });
b.patch("CustomizePanel/Frame/BodyNamePlate", { display_order: 11 });
b.patch("CustomizePanel/Frame/CoatNamePlate", { display_order: 15 });
b.patch("CustomizePanel/Frame/ErrorPlate", { display_order: 18 });

b.patch("NamePrompt/TitlePlate", { display_order: 0 });
b.patch("NamePrompt/Title", { display_order: 6 });

// 2) Nudge right-page row off the notebook spine
const SHIFT = 56;
const labels = [
  ["CustomizePanel/Frame/HairLabel", 210],
  ["CustomizePanel/Frame/FaceLabel", 140],
  ["CustomizePanel/Frame/BodyLabel", 70],
  ["CustomizePanel/Frame/CoatLabel", 0],
];
for (const [p, y] of labels) b.patch(p, { pos: [-12 + SHIFT, y] });

const prevs = [
  ["CustomizePanel/Frame/BtnHairPrev", 210],
  ["CustomizePanel/Frame/BtnFacePrev", 140],
  ["CustomizePanel/Frame/BtnBodyPrev", 70],
  ["CustomizePanel/Frame/BtnCoatPrev", 0],
];
for (const [p, y] of prevs) b.patch(p, { pos: [66 + SHIFT, y] });

const names = [
  ["CustomizePanel/Frame/HairName", 210],
  ["CustomizePanel/Frame/FaceName", 140],
  ["CustomizePanel/Frame/BodyName", 70],
  ["CustomizePanel/Frame/CoatName", 0],
  ["CustomizePanel/Frame/HairNamePlate", 210],
  ["CustomizePanel/Frame/FaceNamePlate", 140],
  ["CustomizePanel/Frame/BodyNamePlate", 70],
  ["CustomizePanel/Frame/CoatNamePlate", 0],
];
for (const [p, y] of names) b.patch(p, { pos: [200 + SHIFT, y] });

const nexts = [
  ["CustomizePanel/Frame/BtnHairNext", 210],
  ["CustomizePanel/Frame/BtnFaceNext", 140],
  ["CustomizePanel/Frame/BtnBodyNext", 70],
  ["CustomizePanel/Frame/BtnCoatNext", 0],
];
for (const [p, y] of nexts) b.patch(p, { pos: [338 + SHIFT, y] });

// 3) NamePrompt placeholder was gray a=0.5 on cream — raise contrast
b.patchComponent("NamePrompt/Input", "MOD.Core.TextGUIRendererInputComponent", {
  PlaceHolderColor: { r: 0.219, g: 0.149, b: 0.09, a: 0.78 },
});

b.write(uiPath, { lint_verbose: true });

const after = UIBuilder.load(uiPath);
function doOf(p) {
  return after.find(p).jsonString.displayOrder;
}
function posX(p) {
  const ut = after
    .find(p)
    .jsonString["@components"].find((c) => c["@type"] === "MOD.Core.UITransformComponent");
  return ut.anchoredPosition.x;
}
console.log("TitlePlate/Title do", doOf("CustomizePanel/Frame/TitlePlate"), doOf("CustomizePanel/Frame/Title"));
console.log("NamePrompt plate/title do", doOf("NamePrompt/TitlePlate"), doOf("NamePrompt/Title"));
console.log("HairLabel x", posX("CustomizePanel/Frame/HairLabel"), "Prev x", posX("CustomizePanel/Frame/BtnHairPrev"));
console.log("HairNamePlate/HairName do", doOf("CustomizePanel/Frame/HairNamePlate"), doOf("CustomizePanel/Frame/HairName"));
