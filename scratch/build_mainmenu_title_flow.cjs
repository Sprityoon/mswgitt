/**
 * Rebuilds ui/MainMenuGroup.ui for title → slot → customize flow.
 * Run from repo root:
 *   node scratch/build_mainmenu_title_flow.cjs
 */
const path = require("path");
const UIBuilder = require(
  path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs")
).UIBuilder;

const PANEL = { r: 0.08, g: 0.1, b: 0.14, a: 0.96 };
const CARD = { r: 0.1, g: 0.14, b: 0.2, a: 0.95 };
const BTN_NEW = { r: 0.2, g: 0.55, b: 0.35, a: 1 };
const BTN_CONT = { r: 0.25, g: 0.45, b: 0.75, a: 1 };
const BTN_QUIT = { r: 0.45, g: 0.25, b: 0.25, a: 1 };
const BTN_MUTED = { r: 0.35, g: 0.35, b: 0.4, a: 1 };
const BTN_DEL = { r: 0.55, g: 0.22, b: 0.2, a: 1 };

function addAvatar(b, name, opts) {
  b.avatar(name, opts);
  b.addComponent(name, "MOD.Core.CostumeManagerComponent");
}

function buildMainMenu() {
  const b = new UIBuilder("MainMenuGroup", 50, false);

  b.panel("Bg", {
    anchor: "stretch",
    pos: [0, 0],
    color: { r: 0.1, g: 0.16, b: 0.14, a: 1 },
    raycast: true,
  });

  // --- Title ---
  b.empty("TitlePanel", {
    anchor: "stretch",
    pos: [0, 0],
    enable: true,
  });
  b.text("TitlePanel/Logo", "메이플월드", {
    anchor: "top-center",
    pos: [0, -120],
    rect_size: [900, 100],
    font_size: 72,
    color: "#FFE8A3",
    alignment: "MiddleCenter",
  });
  b.text("TitlePanel/Tagline", "아늑한 영지에서 천천히", {
    anchor: "top-center",
    pos: [0, -220],
    rect_size: [700, 40],
    font_size: 26,
    color: "#DDE8FF",
    alignment: "MiddleCenter",
  });
  b.button("TitlePanel/BtnNew", "새로하기", {
    anchor: "middle-center",
    pos: [0, 40],
    rect_size: [360, 88],
    bg_color: BTN_NEW,
    font_size: 32,
  });
  b.button("TitlePanel/BtnContinue", "이어하기", {
    anchor: "middle-center",
    pos: [0, -70],
    rect_size: [360, 88],
    bg_color: BTN_CONT,
    font_size: 32,
  });
  b.button("TitlePanel/BtnQuit", "종료하기", {
    anchor: "middle-center",
    pos: [0, -180],
    rect_size: [360, 88],
    bg_color: BTN_QUIT,
    font_size: 32,
  });
  b.text("TitlePanel/Hint", "", {
    anchor: "bottom-center",
    pos: [0, 60],
    rect_size: [900, 40],
    font_size: 22,
    color: "#FF8A8A",
    alignment: "MiddleCenter",
  });

  // --- Slot select ---
  b.empty("SlotPanel", {
    anchor: "stretch",
    pos: [0, 0],
    enable: false,
  });
  b.text("SlotPanel/Subtitle", "슬롯을 선택하세요", {
    anchor: "top-center",
    pos: [0, -70],
    rect_size: [800, 48],
    font_size: 32,
    color: "#FFE8A3",
    alignment: "MiddleCenter",
  });
  b.button("SlotPanel/BtnBack", "뒤로", {
    anchor: "top-left",
    pos: [40, -40],
    rect_size: [160, 72],
    bg_color: BTN_MUTED,
    font_size: 24,
  });

  for (let i = 1; i <= 5; i++) {
    const x = (i - 3) * 340;
    b.panel(`SlotPanel/Slot${i}`, {
      anchor: "middle-center",
      pos: [x, 20],
      rect_size: [300, 520],
      color: CARD,
    });
    addAvatar(b, `SlotPanel/Slot${i}/Avatar`, {
      anchor: "top-center",
      pos: [0, -90],
      rect_size: [180, 260],
    });
    b.text(`SlotPanel/Slot${i}/Title`, `슬롯 ${i}`, {
      anchor: "top-center",
      pos: [0, -290],
      rect_size: [260, 40],
      font_size: 24,
      color: "#FFE8A3",
      alignment: "MiddleCenter",
    });
    b.text(`SlotPanel/Slot${i}/Info`, "비어 있음", {
      anchor: "top-center",
      pos: [0, -340],
      rect_size: [260, 60],
      font_size: 20,
      color: "#FFFFFF",
      alignment: "MiddleCenter",
    });
    b.button(`SlotPanel/Slot${i}/BtnSelect`, "선택", {
      anchor: "bottom-center",
      pos: [0, 90],
      rect_size: [220, 64],
      bg_color: BTN_CONT,
      font_size: 24,
    });
    b.button(`SlotPanel/Slot${i}/BtnDelete`, "삭제", {
      anchor: "bottom-center",
      pos: [0, 20],
      rect_size: [220, 56],
      bg_color: BTN_DEL,
      font_size: 22,
      enable: false,
    });
  }

  // --- Customize (new game) ---
  b.empty("CustomizePanel", {
    anchor: "stretch",
    pos: [0, 0],
    enable: false,
  });
  b.panel("CustomizePanel/Frame", {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: [1100, 720],
    color: PANEL,
  });
  b.text("CustomizePanel/Frame/Title", "캐릭터 만들기", {
    anchor: "top-center",
    pos: [0, -28],
    rect_size: [600, 48],
    font_size: 34,
    color: "#FFE8A3",
    alignment: "MiddleCenter",
  });
  addAvatar(b, "CustomizePanel/Frame/Preview", {
    anchor: "middle-left",
    pos: [180, 20],
    rect_size: [260, 380],
  });

  const rows = [
    ["Hair", "헤어", 120],
    ["Face", "얼굴", 40],
    ["Body", "피부", -40],
    ["Coat", "상의", -120],
  ];
  for (const [key, label, y] of rows) {
    b.text(`CustomizePanel/Frame/${key}Label`, label, {
      anchor: "middle-right",
      pos: [-420, y + 40],
      rect_size: [120, 36],
      font_size: 22,
      color: "#DDE8FF",
      alignment: "MiddleRight",
    });
    b.button(`CustomizePanel/Frame/Btn${key}Prev`, "<", {
      anchor: "middle-right",
      pos: [-300, y],
      rect_size: [72, 64],
      bg_color: BTN_MUTED,
      font_size: 28,
    });
    b.text(`CustomizePanel/Frame/${key}Name`, "-", {
      anchor: "middle-right",
      pos: [-120, y],
      rect_size: [240, 40],
      font_size: 20,
      color: "#FFFFFF",
      alignment: "MiddleCenter",
    });
    b.button(`CustomizePanel/Frame/Btn${key}Next`, ">", {
      anchor: "middle-right",
      pos: [40, y],
      rect_size: [72, 64],
      bg_color: BTN_MUTED,
      font_size: 28,
    });
  }

  b.textInput("CustomizePanel/Frame/NameInput", {
    anchor: "bottom-center",
    pos: [0, 150],
    rect_size: [480, 64],
    placeholder: "닉네임 (2~12자)",
    font_size: 26,
  });
  b.text("CustomizePanel/Frame/Error", "", {
    anchor: "bottom-center",
    pos: [0, 100],
    rect_size: [700, 36],
    font_size: 20,
    color: "#FF8A8A",
    alignment: "MiddleCenter",
  });
  b.button("CustomizePanel/Frame/BtnStart", "모험 시작", {
    anchor: "bottom-center",
    pos: [120, 36],
    rect_size: [220, 72],
    bg_color: BTN_NEW,
    font_size: 26,
  });
  b.button("CustomizePanel/Frame/BtnBack", "뒤로", {
    anchor: "bottom-center",
    pos: [-120, 36],
    rect_size: [220, 72],
    bg_color: BTN_MUTED,
    font_size: 26,
  });

  // --- Delete confirm ---
  b.panel("NamePrompt", {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: [640, 320],
    color: PANEL,
    enable: false,
  });
  b.text("NamePrompt/Title", "삭제 확인", {
    anchor: "top-center",
    pos: [0, -28],
    rect_size: [500, 40],
    font_size: 28,
    color: "#FFE8A3",
    alignment: "MiddleCenter",
  });
  b.textInput("NamePrompt/Input", {
    anchor: "middle-center",
    pos: [0, 10],
    rect_size: [480, 64],
    placeholder: "닉네임 재입력",
    font_size: 26,
  });
  b.text("NamePrompt/Error", "", {
    anchor: "middle-center",
    pos: [0, 70],
    rect_size: [500, 36],
    font_size: 20,
    color: "#FF8A8A",
    alignment: "MiddleCenter",
  });
  b.button("NamePrompt/BtnOk", "삭제", {
    anchor: "bottom-center",
    pos: [-120, 36],
    rect_size: [180, 64],
    bg_color: BTN_DEL,
    font_size: 24,
  });
  b.button("NamePrompt/BtnCancel", "취소", {
    anchor: "bottom-center",
    pos: [120, 36],
    rect_size: [180, 64],
    bg_color: BTN_MUTED,
    font_size: 24,
  });

  b.script("Controller", "script.UIMainMenuController", {
    anchor: "top-left",
    pos: [0, 0],
    rect_size: [1, 1],
  });

  const props = {
    root: "MainMenuGroup",
    bg: "Bg",
    titlePanel: "TitlePanel",
    logo: "TitlePanel/Logo",
    btnNew: "TitlePanel/BtnNew",
    btnContinue: "TitlePanel/BtnContinue",
    btnQuit: "TitlePanel/BtnQuit",
    titleHint: "TitlePanel/Hint",
    slotPanel: "SlotPanel",
    slotSubtitle: "SlotPanel/Subtitle",
    btnSlotBack: "SlotPanel/BtnBack",
    customizePanel: "CustomizePanel",
    customPreview: "CustomizePanel/Frame/Preview",
    customNameInput: "CustomizePanel/Frame/NameInput",
    customError: "CustomizePanel/Frame/Error",
    btnHairPrev: "CustomizePanel/Frame/BtnHairPrev",
    btnHairNext: "CustomizePanel/Frame/BtnHairNext",
    hairName: "CustomizePanel/Frame/HairName",
    btnFacePrev: "CustomizePanel/Frame/BtnFacePrev",
    btnFaceNext: "CustomizePanel/Frame/BtnFaceNext",
    faceName: "CustomizePanel/Frame/FaceName",
    btnBodyPrev: "CustomizePanel/Frame/BtnBodyPrev",
    btnBodyNext: "CustomizePanel/Frame/BtnBodyNext",
    bodyName: "CustomizePanel/Frame/BodyName",
    btnCoatPrev: "CustomizePanel/Frame/BtnCoatPrev",
    btnCoatNext: "CustomizePanel/Frame/BtnCoatNext",
    coatName: "CustomizePanel/Frame/CoatName",
    btnCustomStart: "CustomizePanel/Frame/BtnStart",
    btnCustomBack: "CustomizePanel/Frame/BtnBack",
    namePrompt: "NamePrompt",
    nameInput: "NamePrompt/Input",
    nameError: "NamePrompt/Error",
    btnNameOk: "NamePrompt/BtnOk",
    btnNameCancel: "NamePrompt/BtnCancel",
  };
  for (let i = 1; i <= 5; i++) {
    props[`slot${i}`] = `SlotPanel/Slot${i}`;
    props[`slot${i}Avatar`] = `SlotPanel/Slot${i}/Avatar`;
    props[`slot${i}Title`] = `SlotPanel/Slot${i}/Title`;
    props[`slot${i}Info`] = `SlotPanel/Slot${i}/Info`;
    props[`slot${i}BtnSelect`] = `SlotPanel/Slot${i}/BtnSelect`;
    props[`slot${i}BtnDelete`] = `SlotPanel/Slot${i}/BtnDelete`;
  }

  b.write("ui/MainMenuGroup.ui", {
    bind: ["RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua", props],
  });
  console.log("Wrote ui/MainMenuGroup.ui");
}

buildMainMenu();
