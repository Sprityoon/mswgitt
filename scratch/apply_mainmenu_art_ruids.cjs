/**
 * Apply imported cozy title arts to ui/MainMenuGroup.ui
 * - Bg: cover-crop via Mask + oversized AspectOnly child
 * - TitlePanel: wooden signpost behind menu buttons
 * - Slot / Customize / NamePrompt: notebook frame
 *
 *   node scratch/apply_mainmenu_art_ruids.cjs
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

// --- Background: fullscreen mask + cover crop ---
// Parent clips to 1920x1080; child keeps aspect and overflows → crop.
b.patchComponent("Bg", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: RUID.bg },
  Color: { r: 1, g: 1, b: 1, a: 0.02 },
  Type: 0,
  PreserveSprite: 0,
  RaycastTarget: true,
});
if (!b.hasComponent("Bg", "MOD.Core.MaskComponent")) {
  b.addComponent("Bg", "MOD.Core.MaskComponent", {
    "@type": "MOD.Core.MaskComponent",
    Shape: 0,
    Padding: { left: 0, right: 0, top: 0, bottom: 0 },
    Softness: { x: 0, y: 0 },
    Enable: true,
  });
}
b.sprite("Bg/Art", {
  anchor: "middle-center",
  pos: [0, 0],
  // Square-ish cover: fills width and crops top/bottom (or sides) via Mask.
  rect_size: [2100, 2100],
  image_ruid: RUID.bg,
  sprite_type: 0,
  preserve_sprite: 1, // AspectOnly
  color: { r: 1, g: 1, b: 1, a: 1 },
  raycast: false,
});

// --- Title: wooden signpost (diegetic menu board) ---
b.sprite("TitlePanel/SignBoard", {
  anchor: "middle-right",
  pos: [-80, -20],
  rect_size: [420, 720],
  image_ruid: RUID.sign,
  sprite_type: 0,
  preserve_sprite: 1,
  color: { r: 1, g: 1, b: 1, a: 1 },
  raycast: false,
});

// Sit the three actions on the sign face (invisible hit + outlined text).
const btnYs = { New: 90, Continue: -20, Quit: -130 };
for (const [key, y] of Object.entries(btnYs)) {
  const id = `TitlePanel/Btn${key}`;
  b.patch(id, {
    anchor: "middle-right",
    pivot: [1, 0.5],
    pos: [-56, y],
    rect_size: [300, 88],
  });
  b.patchComponent(id, "MOD.Core.SpriteGUIRendererComponent", {
    Color: { r: 0.42, g: 0.28, b: 0.16, a: 0 },
    Type: 0,
    ImageRUID: { DataId: "" },
    RaycastTarget: true,
    OrderInLayer: 2,
    OverrideSorting: true,
  });
  b.patchComponent(id, "MOD.Core.TextGUIRendererComponent", {
    OutlineWidth: 0.28,
    OutlineColor: { r: 0.2, g: 0.12, b: 0.08, a: 1 },
    FontColor: { r: 1, g: 0.96, b: 0.88, a: 1 },
    OrderInLayer: 3,
    OverrideSorting: true,
  });
}
b.patchComponent("TitlePanel/SignBoard", "MOD.Core.SpriteGUIRendererComponent", {
  OrderInLayer: 0,
  OverrideSorting: true,
});
b.patch("TitlePanel/SignBoard", {
  anchor: "middle-right",
  pivot: [1, 0.5],
  pos: [-40, -20],
  rect_size: [440, 760],
});

// Soften logo for key-art readability
b.patch("TitlePanel/Logo", {
  anchor: "top-center",
  pos: [0, -90],
  rect_size: [900, 100],
});
b.patchComponent("TitlePanel/Logo", "MOD.Core.TextGUIRendererComponent", {
  FontColor: { r: 1, g: 0.97, b: 0.88, a: 1 },
  OutlineWidth: 0.35,
  OutlineColor: { r: 0.25, g: 0.16, b: 0.1, a: 1 },
});
b.patch("TitlePanel/Tagline", {
  anchor: "top-center",
  pos: [0, -190],
});
b.patchComponent("TitlePanel/Tagline", "MOD.Core.TextGUIRendererComponent", {
  FontColor: { r: 0.95, g: 0.92, b: 0.82, a: 1 },
  OutlineWidth: 0.25,
  OutlineColor: { r: 0.2, g: 0.14, b: 0.1, a: 0.9 },
});
b.patch("TitlePanel/Hint", {
  anchor: "bottom-center",
  pos: [0, 48],
});

// --- Slot panel: notebook frame behind cards ---
b.sprite("SlotPanel/Notebook", {
  anchor: "middle-center",
  pos: [0, 10],
  rect_size: [1700, 820],
  image_ruid: RUID.notebook,
  sprite_type: 0,
  preserve_sprite: 1,
  color: { r: 1, g: 1, b: 1, a: 1 },
  raycast: false,
});
b.patch("SlotPanel/Subtitle", {
  anchor: "top-center",
  pos: [0, -48],
});
b.patchComponent("SlotPanel/Subtitle", "MOD.Core.TextGUIRendererComponent", {
  FontColor: { r: 0.35, g: 0.24, b: 0.16, a: 1 },
  OutlineWidth: 0.2,
  OutlineColor: { r: 1, g: 0.96, b: 0.88, a: 0.85 },
});

// Soften per-slot card panels so notebook paper shows
for (let i = 1; i <= 5; i++) {
  b.patchComponent(`SlotPanel/Slot${i}`, "MOD.Core.SpriteGUIRendererComponent", {
    Color: { r: 0.95, g: 0.9, b: 0.8, a: 0.55 },
    Type: 0,
  });
}

// --- Customize frame + delete confirm: notebook ---
b.patchComponent("CustomizePanel/Frame", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: RUID.notebook },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 0,
  PreserveSprite: 1,
});
b.patch("CustomizePanel/Frame", {
  rect_size: [1100, 760],
});

b.patchComponent("NamePrompt", "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: RUID.notebook },
  Color: { r: 1, g: 1, b: 1, a: 1 },
  Type: 0,
  PreserveSprite: 1,
});
b.patch("NamePrompt", {
  rect_size: [700, 380],
});

b.write("ui/MainMenuGroup.ui", { lint_verbose: true });
console.log("Applied RUIDs:", RUID);
