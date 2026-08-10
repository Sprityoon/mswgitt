/**
 * Swap cozy art RUIDs + fix displayOrder so frames sit BEHIND text/buttons.
 *   node scratch/fix_mainmenu_art_layering.cjs
 */
const path = require("path");
const UIBuilder = require(
  path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs")
).UIBuilder;

const RUID = {
  notebook: "59a330fa4cd44a5583d05d2109cd7f14",
  sign: "9d3a2b2b00124690b00515e900119627",
  bg: "ff194285e29d4c21b39a64d5d4ab0ec6",
};

const b = UIBuilder.read("ui/MainMenuGroup.ui");

function setOrder(id, order) {
  b.patch(id, { display_order: order });
}

function clearOverrideSort(id) {
  const sprite = b.getComponent(id, "MOD.Core.SpriteGUIRendererComponent");
  if (sprite) {
    b.patchComponent(id, "MOD.Core.SpriteGUIRendererComponent", {
      OverrideSorting: false,
      OrderInLayer: 0,
    });
  }
  const text = b.getComponent(id, "MOD.Core.TextGUIRendererComponent");
  if (text) {
    b.patchComponent(id, "MOD.Core.TextGUIRendererComponent", {
      OverrideSorting: false,
      OrderInLayer: 0,
    });
  }
  const btn = b.getComponent(id, "MOD.Core.ButtonComponent");
  if (btn) {
    b.patchComponent(id, "MOD.Core.ButtonComponent", {
      OverrideSorting: false,
      OrderInLayer: 0,
    });
  }
}

// --- RUID swap ---
b.patchComponent("TitlePanel/SignBoard", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: RUID.sign },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 0,
  PreserveSprite: 1,
  RaycastTarget: false,
  OverrideSorting: false,
  OrderInLayer: 0,
});

b.patchComponent("SlotPanel/Notebook", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: RUID.notebook },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 0,
  PreserveSprite: 1,
  RaycastTarget: false,
  OverrideSorting: false,
  OrderInLayer: 0,
});

b.patchComponent("CustomizePanel/Frame", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: RUID.notebook },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 0,
  PreserveSprite: 1,
  RaycastTarget: false,
  OverrideSorting: false,
  OrderInLayer: 0,
});

b.patchComponent("NamePrompt", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: RUID.notebook },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 0,
  PreserveSprite: 1,
  RaycastTarget: true,
  OverrideSorting: false,
  OrderInLayer: 0,
});

// Keep bg art
b.patchComponent("Bg/Art", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: RUID.bg },
  PreserveSprite: 1,
  Type: 0,
  RaycastTarget: false,
  OverrideSorting: false,
  OrderInLayer: 0,
});

// --- TitlePanel: SignBoard behind everything ---
setOrder("TitlePanel/SignBoard", 0);
setOrder("TitlePanel/Logo", 1);
setOrder("TitlePanel/Tagline", 2);
setOrder("TitlePanel/BtnNew", 3);
setOrder("TitlePanel/BtnContinue", 4);
setOrder("TitlePanel/BtnQuit", 5);
setOrder("TitlePanel/Hint", 6);

for (const id of [
  "TitlePanel/SignBoard",
  "TitlePanel/Logo",
  "TitlePanel/Tagline",
  "TitlePanel/BtnNew",
  "TitlePanel/BtnContinue",
  "TitlePanel/BtnQuit",
  "TitlePanel/Hint",
]) {
  clearOverrideSort(id);
}

// Transparent hit plates stay alpha 0 (text only on sign)
for (const key of ["New", "Continue", "Quit"]) {
  b.patchComponent(`TitlePanel/Btn${key}`, "MOD.Core.SpriteGUIRendererComponent", {
    Color: { r: 0.42, g: 0.28, b: 0.16, a: 0 },
    ImageRUID: { DataId: "" },
    RaycastTarget: true,
  });
  b.patchComponent(`TitlePanel/Btn${key}`, "MOD.Core.TextGUIRendererComponent", {
    FontColor: { r: 1, g: 0.96, b: 0.88, a: 1 },
    OutlineWidth: 0.3,
    OutlineColor: { r: 0.18, g: 0.1, b: 0.06, a: 1 },
  });
}

// --- SlotPanel: Notebook behind slots ---
setOrder("SlotPanel/Notebook", 0);
setOrder("SlotPanel/Subtitle", 1);
setOrder("SlotPanel/BtnBack", 2);
for (let i = 1; i <= 5; i++) setOrder(`SlotPanel/Slot${i}`, 2 + i);
clearOverrideSort("SlotPanel/Notebook");
clearOverrideSort("SlotPanel/Subtitle");

// Root siblings: Bg under panels (safety)
setOrder("Bg", 0);
setOrder("TitlePanel", 1);
setOrder("SlotPanel", 2);
setOrder("CustomizePanel", 3);
setOrder("NamePrompt", 4);
setOrder("Controller", 5);

b.write("ui/MainMenuGroup.ui");
console.log("Updated RUIDs + displayOrder (art behind text)", RUID);
