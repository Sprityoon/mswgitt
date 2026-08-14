"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}

const b = UIBuilder.load(path.join(__dirname, "..", "ui/MainMenuGroup.ui"));
for (const p of ["NamePrompt/Input", "CustomizePanel/Frame/NameInput"]) {
  const e = b.find(p);
  const input = findComp(e, "MOD.Core.TextGUIRendererInputComponent");
  console.log("\n" + p);
  console.log(JSON.stringify(input, null, 2));
}
