/**
 * Builds ui/DialogGroup.ui (MapleStory-style talk) + ui/MainMenuGroup.ui (5 save slots).
 * Run from repo root:
 *   node scratch/build_dialog_mainmenu_ui.cjs
 */
const path = require("path");
const UIBuilder = require(
  path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs")
).UIBuilder;

function buildDialog() {
  const b = new UIBuilder("DialogGroup", 40, true);
  // Full-screen blocker so talk covers HUD / quickslots / mobile buttons.
  b.panel("Dimmer", {
    anchor: "stretch",
    pos: [0, 0],
    color: { r: 0, g: 0, b: 0, a: 0.45 },
    enable: false,
  });
  b.empty("DialogWindow", {
    anchor: "bottom-center",
    pos: [0, 24],
    rect_size: [1600, 280],
    enable: false,
  });
  b.panel("DialogWindow/Frame", {
    anchor: "stretch",
    pos: [0, 0],
    color: { r: 0.08, g: 0.1, b: 0.16, a: 0.94 },
  });
  b.panel("DialogWindow/NamePlate", {
    anchor: "top-left",
    pos: [24, -18],
    rect_size: [280, 48],
    color: { r: 0.16, g: 0.22, b: 0.34, a: 1 },
  });
  b.text("DialogWindow/NamePlate/NameText", "촌장", {
    anchor: "stretch",
    pos: [0, 0],
    font_size: 28,
    color: "#FFE8A3",
    alignment: "MiddleCenter",
  });
  b.text("DialogWindow/BodyText", "…", {
    anchor: "top-left",
    pos: [40, -80],
    rect_size: [1200, 140],
    font_size: 30,
    color: "#FFFFFF",
    alignment: "UpperLeft",
  });
  b.button("DialogWindow/BtnNext", "다음", {
    anchor: "bottom-right",
    pos: [-40, 28],
    rect_size: [160, 72],
    bg_color: { r: 0.25, g: 0.4, b: 0.7, a: 1 },
    font_size: 26,
  });
  b.button("DialogWindow/BtnAccept", "수락", {
    anchor: "bottom-right",
    pos: [-220, 28],
    rect_size: [160, 72],
    bg_color: { r: 0.2, g: 0.55, b: 0.3, a: 1 },
    font_size: 26,
    enable: false,
  });
  b.button("DialogWindow/BtnDecline", "거절", {
    anchor: "bottom-right",
    pos: [-400, 28],
    rect_size: [160, 72],
    bg_color: { r: 0.55, g: 0.22, b: 0.2, a: 1 },
    font_size: 26,
    enable: false,
  });
  b.button("DialogWindow/BtnClose", "닫기", {
    anchor: "bottom-right",
    pos: [-40, 28],
    rect_size: [160, 72],
    bg_color: { r: 0.35, g: 0.35, b: 0.4, a: 1 },
    font_size: 26,
    enable: false,
  });
  b.script("Controller", "script.UIDialogController", {
    anchor: "top-left",
    pos: [0, 0],
    rect_size: [1, 1],
  });
  b.write("ui/DialogGroup.ui", {
    bind: [
      "RootDesk/MyDesk/UI/Scripts/UIDialogController.mlua",
      {
        dimmer: "Dimmer",
        window: "DialogWindow",
        nameText: "DialogWindow/NamePlate/NameText",
        bodyText: "DialogWindow/BodyText",
        btnNext: "DialogWindow/BtnNext",
        btnAccept: "DialogWindow/BtnAccept",
        btnDecline: "DialogWindow/BtnDecline",
        btnClose: "DialogWindow/BtnClose",
      },
    ],
  });
  console.log("Wrote ui/DialogGroup.ui");
}

function buildMainMenu() {
  const b = new UIBuilder("MainMenuGroup", 50, false);
  b.panel("Bg", {
    anchor: "stretch",
    pos: [0, 0],
    color: { r: 0.12, g: 0.18, b: 0.14, a: 1 },
  });
  b.text("Logo", "메이플월드", {
    anchor: "top-center",
    pos: [0, -80],
    rect_size: [800, 90],
    font_size: 64,
    color: "#FFE8A3",
    alignment: "MiddleCenter",
  });
  b.text("Subtitle", "캐릭터 슬롯을 선택하세요", {
    anchor: "top-center",
    pos: [0, -170],
    rect_size: [700, 40],
    font_size: 26,
    color: "#DDE8FF",
    alignment: "MiddleCenter",
  });

  for (let i = 1; i <= 5; i++) {
    const x = (i - 3) * 320;
    b.panel(`Slot${i}`, {
      anchor: "middle-center",
      pos: [x, 40],
      rect_size: [280, 360],
      color: { r: 0.1, g: 0.14, b: 0.2, a: 0.95 },
    });
    b.text(`Slot${i}/Title`, `슬롯 ${i}`, {
      anchor: "top-center",
      pos: [0, -24],
      rect_size: [240, 40],
      font_size: 24,
      color: "#FFE8A3",
      alignment: "MiddleCenter",
    });
    b.text(`Slot${i}/Info`, "비어 있음", {
      anchor: "middle-center",
      pos: [0, -20],
      rect_size: [240, 120],
      font_size: 22,
      color: "#FFFFFF",
      alignment: "MiddleCenter",
    });
    b.button(`Slot${i}/BtnContinue`, "이어하기", {
      anchor: "bottom-center",
      pos: [0, 100],
      rect_size: [220, 64],
      bg_color: { r: 0.25, g: 0.45, b: 0.75, a: 1 },
      font_size: 24,
      enable: false,
    });
    b.button(`Slot${i}/BtnNew`, "새로하기", {
      anchor: "bottom-center",
      pos: [0, 28],
      rect_size: [220, 64],
      bg_color: { r: 0.2, g: 0.55, b: 0.35, a: 1 },
      font_size: 24,
    });
    b.button(`Slot${i}/BtnDelete`, "삭제", {
      anchor: "bottom-center",
      pos: [0, 28],
      rect_size: [220, 64],
      bg_color: { r: 0.55, g: 0.22, b: 0.2, a: 1 },
      font_size: 22,
      enable: false,
    });
  }

  b.panel("NamePrompt", {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: [640, 320],
    color: { r: 0.08, g: 0.1, b: 0.14, a: 0.98 },
    enable: false,
  });
  b.text("NamePrompt/Title", "닉네임 입력", {
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
    placeholder: "닉네임 (2~12자)",
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
  b.button("NamePrompt/BtnOk", "확인", {
    anchor: "bottom-center",
    pos: [-120, 36],
    rect_size: [180, 64],
    bg_color: { r: 0.2, g: 0.55, b: 0.35, a: 1 },
    font_size: 24,
  });
  b.button("NamePrompt/BtnCancel", "취소", {
    anchor: "bottom-center",
    pos: [120, 36],
    rect_size: [180, 64],
    bg_color: { r: 0.4, g: 0.4, b: 0.45, a: 1 },
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
    logo: "Logo",
    namePrompt: "NamePrompt",
    nameInput: "NamePrompt/Input",
    nameError: "NamePrompt/Error",
    btnNameOk: "NamePrompt/BtnOk",
    btnNameCancel: "NamePrompt/BtnCancel",
  };
  for (let i = 1; i <= 5; i++) {
    props[`slot${i}`] = `Slot${i}`;
    props[`slot${i}Title`] = `Slot${i}/Title`;
    props[`slot${i}Info`] = `Slot${i}/Info`;
    props[`slot${i}BtnContinue`] = `Slot${i}/BtnContinue`;
    props[`slot${i}BtnNew`] = `Slot${i}/BtnNew`;
    props[`slot${i}BtnDelete`] = `Slot${i}/BtnDelete`;
  }

  b.write("ui/MainMenuGroup.ui", {
    bind: ["RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua", props],
  });
  console.log("Wrote ui/MainMenuGroup.ui");
}

buildDialog();
buildMainMenu();
