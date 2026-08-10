/**
 * Propagate user title-text style (BestFit / dilate / outline) across MainMenu texts.
 * Reference: TitlePanel/Logo (BestFit) + TitlePanel/Btn* (dilate/outline/cream).
 */
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const b = UIBuilder.read("ui/MainMenuGroup.ui");

const CREAM = { r: 1, g: 0.96, b: 0.88, a: 1 };
const GOLD = { r: 1, g: 0.91, b: 0.64, a: 1 };
const WHITE = { r: 1, g: 1, b: 1, a: 1 };
const ERROR = { r: 1, g: 0.54, b: 0.54, a: 1 };
const BROWN = { r: 0.35, g: 0.24, b: 0.16, a: 1 };
const OUTLINE_DARK = { r: 0.12, g: 0.07, b: 0.04, a: 1 };
const OUTLINE_SOFT = { r: 0.25, g: 0.16, b: 0.1, a: 1 };

function patchText(path, updates) {
  const e = b.find(path);
  if (!e) {
    console.log("MISS", path);
    return;
  }
  b.patchComponent(path, "MOD.Core.TextGUIRendererComponent", updates);
  console.log("patched text", path, Object.keys(updates).join(","));
}

function patchInput(path, updates) {
  const e = b.find(path);
  if (!e) {
    console.log("MISS input", path);
    return;
  }
  b.patchComponent(path, "MOD.Core.TextGUIRendererInputComponent", updates);
  console.log("patched input", path, Object.keys(updates).join(","));
}

// Title buttons: keep user's large size, enable BestFit so they stay readable in the rect
for (const p of ["TitlePanel/BtnNew", "TitlePanel/BtnContinue", "TitlePanel/BtnQuit"]) {
  patchText(p, {
    BestFit: true,
    MinSize: 22,
    MaxSize: 55,
    FontSize: 55,
    FaceDilate: 0.2,
    OutlineWidth: 0.32,
    OutlineColor: OUTLINE_DARK,
    FontColor: CREAM,
  });
}

// Hint (runtime error/status)
patchText("TitlePanel/Hint", {
  BestFit: true,
  MinSize: 16,
  MaxSize: 32,
  FontSize: 26,
  FaceDilate: 0.18,
  OutlineWidth: 0.25,
  OutlineColor: OUTLINE_DARK,
  FontColor: ERROR,
});

// Slot panel
patchText("SlotPanel/Subtitle", {
  BestFit: true,
  MinSize: 18,
  MaxSize: 36,
  FontSize: 30,
  FaceDilate: 0.2,
  OutlineWidth: 0.22,
  OutlineColor: OUTLINE_SOFT,
  FontColor: BROWN,
});
patchText("SlotPanel/BtnBack", {
  BestFit: true,
  MinSize: 16,
  MaxSize: 32,
  FontSize: 28,
  FaceDilate: 0.18,
  OutlineWidth: 0.28,
  OutlineColor: OUTLINE_DARK,
  FontColor: CREAM,
});

for (let i = 1; i <= 5; i++) {
  const base = `SlotPanel/Slot${i}`;
  patchText(`${base}/Title`, {
    BestFit: true,
    MinSize: 16,
    MaxSize: 30,
    FontSize: 26,
    FaceDilate: 0.18,
    OutlineWidth: 0.25,
    OutlineColor: OUTLINE_DARK,
    FontColor: GOLD,
  });
  patchText(`${base}/Info`, {
    BestFit: true,
    MinSize: 14,
    MaxSize: 26,
    FontSize: 22,
    FaceDilate: 0.15,
    OutlineWidth: 0.2,
    OutlineColor: OUTLINE_DARK,
    FontColor: WHITE,
  });
  patchText(`${base}/BtnSelect`, {
    BestFit: true,
    MinSize: 16,
    MaxSize: 30,
    FontSize: 26,
    FaceDilate: 0.18,
    OutlineWidth: 0.28,
    OutlineColor: OUTLINE_DARK,
    FontColor: CREAM,
  });
  patchText(`${base}/BtnDelete`, {
    BestFit: true,
    MinSize: 14,
    MaxSize: 26,
    FontSize: 22,
    FaceDilate: 0.16,
    OutlineWidth: 0.25,
    OutlineColor: OUTLINE_DARK,
    FontColor: CREAM,
  });
}

// Customize panel
const customFrame = "CustomizePanel/Frame";
patchText(`${customFrame}/Title`, {
  BestFit: true,
  MinSize: 20,
  MaxSize: 42,
  FontSize: 36,
  FaceDilate: 0.25,
  OutlineWidth: 0.3,
  OutlineColor: OUTLINE_DARK,
  FontColor: GOLD,
});

for (const label of ["HairLabel", "FaceLabel", "BodyLabel", "CoatLabel"]) {
  patchText(`${customFrame}/${label}`, {
    BestFit: true,
    MinSize: 14,
    MaxSize: 26,
    FontSize: 22,
    FaceDilate: 0.15,
    OutlineWidth: 0.2,
    OutlineColor: OUTLINE_DARK,
    FontColor: CREAM,
  });
}
for (const name of ["HairName", "FaceName", "BodyName", "CoatName"]) {
  patchText(`${customFrame}/${name}`, {
    BestFit: true,
    MinSize: 14,
    MaxSize: 26,
    FontSize: 22,
    FaceDilate: 0.15,
    OutlineWidth: 0.2,
    OutlineColor: OUTLINE_DARK,
    FontColor: WHITE,
  });
}

for (const btn of [
  "BtnHairPrev",
  "BtnHairNext",
  "BtnFacePrev",
  "BtnFaceNext",
  "BtnBodyPrev",
  "BtnBodyNext",
  "BtnCoatPrev",
  "BtnCoatNext",
]) {
  patchText(`${customFrame}/${btn}`, {
    BestFit: true,
    MinSize: 18,
    MaxSize: 36,
    FontSize: 30,
    FaceDilate: 0.18,
    OutlineWidth: 0.25,
    OutlineColor: OUTLINE_DARK,
    FontColor: CREAM,
  });
}

for (const btn of ["BtnLookAccount", "BtnLookCustom"]) {
  patchText(`${customFrame}/${btn}`, {
    BestFit: true,
    MinSize: 14,
    MaxSize: 28,
    FontSize: 24,
    FaceDilate: 0.18,
    OutlineWidth: 0.28,
    OutlineColor: OUTLINE_DARK,
    FontColor: CREAM,
  });
}

patchText(`${customFrame}/BtnStart`, {
  BestFit: true,
  MinSize: 18,
  MaxSize: 34,
  FontSize: 28,
  FaceDilate: 0.2,
  OutlineWidth: 0.3,
  OutlineColor: OUTLINE_DARK,
  FontColor: CREAM,
});
patchText(`${customFrame}/BtnBack`, {
  BestFit: true,
  MinSize: 16,
  MaxSize: 30,
  FontSize: 26,
  FaceDilate: 0.18,
  OutlineWidth: 0.28,
  OutlineColor: OUTLINE_DARK,
  FontColor: CREAM,
});
patchText(`${customFrame}/Error`, {
  BestFit: true,
  MinSize: 14,
  MaxSize: 28,
  FontSize: 22,
  FaceDilate: 0.16,
  OutlineWidth: 0.22,
  OutlineColor: OUTLINE_DARK,
  FontColor: ERROR,
});
patchText(`${customFrame}/NameInput`, {
  BestFit: true,
  MinSize: 16,
  MaxSize: 30,
  FontSize: 26,
  FaceDilate: 0.15,
  OutlineWidth: 0.2,
  OutlineColor: OUTLINE_DARK,
  FontColor: WHITE,
});
patchInput(`${customFrame}/NameInput`, {
  CharacterLimit: 12,
  PlaceHolder: "닉네임 (2~12글자)",
});

// Name prompt (delete confirm)
patchText("NamePrompt/Title", {
  BestFit: true,
  MinSize: 18,
  MaxSize: 36,
  FontSize: 30,
  FaceDilate: 0.22,
  OutlineWidth: 0.28,
  OutlineColor: OUTLINE_DARK,
  FontColor: GOLD,
});
patchText("NamePrompt/Error", {
  BestFit: true,
  MinSize: 14,
  MaxSize: 26,
  FontSize: 22,
  FaceDilate: 0.16,
  OutlineWidth: 0.22,
  OutlineColor: OUTLINE_DARK,
  FontColor: ERROR,
});
patchText("NamePrompt/Input", {
  BestFit: true,
  MinSize: 16,
  MaxSize: 30,
  FontSize: 26,
  FaceDilate: 0.15,
  OutlineWidth: 0.2,
  OutlineColor: OUTLINE_DARK,
  FontColor: WHITE,
});
patchInput("NamePrompt/Input", {
  CharacterLimit: 12,
});
for (const btn of ["NamePrompt/BtnOk", "NamePrompt/BtnCancel"]) {
  patchText(btn, {
    BestFit: true,
    MinSize: 16,
    MaxSize: 30,
    FontSize: 26,
    FaceDilate: 0.18,
    OutlineWidth: 0.28,
    OutlineColor: OUTLINE_DARK,
    FontColor: CREAM,
  });
}

// Keep Logo as user set, only ensure BestFit stays on
patchText("TitlePanel/Logo", {
  BestFit: true,
  MinSize: 24,
  MaxSize: 150,
  FontSize: 150,
  FaceDilate: 0.4803843,
  OutlineWidth: 0.35,
  OutlineColor: OUTLINE_SOFT,
  FontColor: { r: 1, g: 0.97, b: 0.88, a: 1 },
  Font: "Maple",
});

b.write("ui/MainMenuGroup.ui", { lint_verbose: false });
console.log("done");
