/**
 * MainMenu: look-mode buttons + text readability plates + opaque menu buttons.
 *   node scratch/patch_mainmenu_look_and_textplates.cjs
 */
const path = require("path");
const UIBuilder = require(
  path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs")
).UIBuilder;

const PLATE = { r: 0.12, g: 0.09, b: 0.06, a: 0.72 };
const PLATE_SOFT = { r: 0.18, g: 0.12, b: 0.08, a: 0.65 };
const BTN_FILL = { r: 0.38, g: 0.26, b: 0.16, a: 0.88 };

const b = UIBuilder.read("ui/MainMenuGroup.ui");

function plate(name, opts) {
  b.panel(name, {
    anchor: opts.anchor,
    pivot: opts.pivot,
    pos: opts.pos,
    rect_size: opts.rect_size,
    color: opts.color || PLATE,
    raycast: false,
    display_order: opts.display_order != null ? opts.display_order : 0,
    enable: opts.enable != null ? opts.enable : true,
  });
}

// --- Title text plates (behind logo / tagline / hint) ---
plate("TitlePanel/LogoPlate", {
  anchor: "top-center",
  pivot: [0.5, 1],
  pos: [0, -78],
  rect_size: [720, 96],
  color: PLATE,
  display_order: 0,
});
b.patch("TitlePanel/Logo", { display_order: 2 });
b.patch("TitlePanel/SignBoard", { display_order: 1 });

plate("TitlePanel/TaglinePlate", {
  anchor: "top-center",
  pivot: [0.5, 1],
  pos: [0, -188],
  rect_size: [520, 44],
  color: PLATE_SOFT,
  display_order: 0,
});
b.patch("TitlePanel/Tagline", { display_order: 3 });

plate("TitlePanel/HintPlate", {
  anchor: "bottom-center",
  pivot: [0.5, 0],
  pos: [0, 40],
  rect_size: [760, 44],
  color: PLATE_SOFT,
  display_order: 0,
});
b.patch("TitlePanel/Hint", { display_order: 7 });

// Menu buttons: visible wood blocks again
for (const key of ["New", "Continue", "Quit"]) {
  const id = `TitlePanel/Btn${key}`;
  b.patchComponent(id, "MOD.Core.SpriteGUIRendererComponent", {
    Color: BTN_FILL,
    Type: 0,
    ImageRUID: { DataId: "" },
    RaycastTarget: true,
  });
  b.patchComponent(id, "MOD.Core.TextGUIRendererComponent", {
    FontColor: { r: 1, g: 0.96, b: 0.88, a: 1 },
    OutlineWidth: 0.32,
    OutlineColor: { r: 0.12, g: 0.07, b: 0.04, a: 1 },
  });
  b.patch(id, { display_order: key === "New" ? 4 : key === "Continue" ? 5 : 6 });
}

// --- Slot subtitle plate ---
plate("SlotPanel/SubtitlePlate", {
  anchor: "top-center",
  pivot: [0.5, 1],
  pos: [0, -40],
  rect_size: [560, 52],
  color: PLATE,
  display_order: 0,
});
b.patch("SlotPanel/Notebook", { display_order: 0 });
b.patch("SlotPanel/Subtitle", { display_order: 2 });
b.patch("SlotPanel/SubtitlePlate", { display_order: 1 });

for (let i = 1; i <= 5; i++) {
  plate(`SlotPanel/Slot${i}/TitlePlate`, {
    anchor: "top-center",
    pivot: [0.5, 1],
    pos: [0, -280],
    rect_size: [240, 40],
    color: PLATE_SOFT,
    display_order: 0,
  });
  plate(`SlotPanel/Slot${i}/InfoPlate`, {
    anchor: "top-center",
    pivot: [0.5, 1],
    pos: [0, -330],
    rect_size: [240, 64],
    color: PLATE_SOFT,
    display_order: 0,
  });
  b.patch(`SlotPanel/Slot${i}/Title`, { display_order: 2 });
  b.patch(`SlotPanel/Slot${i}/Info`, { display_order: 3 });
}

// --- Customize: look mode + title plate ---
plate("CustomizePanel/Frame/TitlePlate", {
  anchor: "top-center",
  pivot: [0.5, 1],
  pos: [0, -20],
  rect_size: [420, 52],
  color: PLATE,
  display_order: 0,
});
b.patch("CustomizePanel/Frame/Title", { display_order: 1 });

b.button("CustomizePanel/Frame/BtnLookAccount", "내 캐릭터 유지", {
  anchor: "top-center",
  pos: [-150, -90],
  rect_size: [260, 64],
  bg_color: { r: 0.35, g: 0.55, b: 0.32, a: 0.92 },
  font_size: 22,
  display_order: 5,
});
b.button("CustomizePanel/Frame/BtnLookCustom", "외형 꾸미기", {
  anchor: "top-center",
  pos: [150, -90],
  rect_size: [260, 64],
  bg_color: { r: 0.42, g: 0.3, b: 0.2, a: 0.75 },
  font_size: 22,
  display_order: 5,
});

// Label name plates for part rows
for (const key of ["Hair", "Face", "Body", "Coat"]) {
  plate(`CustomizePanel/Frame/${key}NamePlate`, {
    anchor: "middle-right",
    pivot: [1, 0.5],
    pos: [-120, key === "Hair" ? 120 : key === "Face" ? 40 : key === "Body" ? -40 : -120],
    rect_size: [240, 40],
    color: PLATE_SOFT,
    display_order: 0,
  });
}

plate("CustomizePanel/Frame/ErrorPlate", {
  anchor: "bottom-center",
  pivot: [0.5, 0],
  pos: [0, 96],
  rect_size: [640, 36],
  color: { r: 0.35, g: 0.1, b: 0.1, a: 0.75 },
  display_order: 0,
});

// NamePrompt title plate
plate("NamePrompt/TitlePlate", {
  anchor: "top-center",
  pivot: [0.5, 1],
  pos: [0, -20],
  rect_size: [400, 44],
  color: PLATE,
  display_order: 0,
});
b.patch("NamePrompt/Title", { display_order: 1 });

b.write("ui/MainMenuGroup.ui", {
  bind: [
    "RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua",
    {
      btnLookAccount: "CustomizePanel/Frame/BtnLookAccount",
      btnLookCustom: "CustomizePanel/Frame/BtnLookCustom",
    },
  ],
});

console.log("Patched look-mode buttons + text plates");
