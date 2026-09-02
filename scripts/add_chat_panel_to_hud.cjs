const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const hudPath = path.join(ROOT, "ui/HUDGroup.ui");

const hudJson = JSON.parse(fs.readFileSync(hudPath, "utf8"));
let ents = hudJson.ContentProto.Entities;

// Remove existing ChatPanel entities if any
ents = ents.filter(e => !e.path || !e.path.startsWith("/ui/HUDGroup/ChatPanel"));

const panelId = crypto.randomUUID();
const tabAllId = crypto.randomUUID();
const tabAllLabelId = crypto.randomUUID();
const tabWhisperId = crypto.randomUUID();
const tabWhisperLabelId = crypto.randomUUID();
const tabSystemId = crypto.randomUUID();
const tabSystemLabelId = crypto.randomUUID();
const textLogId = crypto.randomUUID();
const chatInputId = crypto.randomUUID();
const btnSendId = crypto.randomUUID();
const btnSendLabelId = crypto.randomUUID();

// Helper to make basic UITransform
function makeUITransform(opt) {
  return {
    "@type": "MOD.Core.UITransformComponent",
    "ActivePlatform": 255,
    "AlignmentOption": opt.align !== undefined ? opt.align : 7, // 7: BottomLeft
    "AnchorsMax": opt.anchorsMax || { "x": 0, "y": 0 },
    "AnchorsMin": opt.anchorsMin || { "x": 0, "y": 0 },
    "MobileOnly": false,
    "OffsetMax": opt.offsetMax || { "x": 100, "y": 100 },
    "OffsetMin": opt.offsetMin || { "x": 0, "y": 0 },
    "Pivot": opt.pivot || { "x": 0, "y": 0 },
    "RectSize": opt.rectSize || { "x": 100, "y": 100 },
    "UIMode": 1,
    "UIScale": { "x": 1, "y": 1, "z": 1 },
    "UIVersion": 2,
    "anchoredPosition": opt.anchoredPosition || { "x": 0, "y": 0 },
    "Rotation": { "x": 0, "y": 0, "z": 0 },
    "Position": opt.position || { "x": 0, "y": 0, "z": 0 },
    "QuaternionRotation": { "x": 0, "y": 0, "z": 0, "w": 1 },
    "Scale": { "x": 1, "y": 1, "z": 1 },
    "ZRotation": 0,
    "Enable": true
  };
}

function makeSpriteGUI(opt) {
  return {
    "@type": "MOD.Core.SpriteGUIRendererComponent",
    "AnimClipPlayType": 0,
    "EndFrameIndex": 2147483647,
    "IgnoreMapLayerCheck": false,
    "ImageRUID": { "DataId": opt.ruid || "" },
    "LocalPosition": { "x": 0, "y": 0 },
    "LocalScale": { "x": 1, "y": 1 },
    "MaterialId": "",
    "OrderInLayer": 0,
    "OverrideSorting": false,
    "PlayRate": 1,
    "PreserveSprite": 0,
    "SortingLayer": "UI",
    "StartFrameIndex": 0,
    "Color": opt.color || { "r": 1, "g": 1, "b": 1, "a": 1 },
    "DropShadow": false,
    "DropShadowAngle": 120,
    "DropShadowColor": { "r": 0, "g": 0, "b": 0, "a": 0.72 },
    "DropShadowDistance": 3,
    "FillAmount": 1,
    "FillCenter": true,
    "FillClockWise": true,
    "FillMethod": 0,
    "FillOrigin": 0,
    "FlipX": false,
    "FlipY": false,
    "FrameColumn": 1,
    "FrameRate": 0,
    "FrameRow": 1,
    "Outline": false,
    "OutlineColor": { "r": 0, "g": 0, "b": 0, "a": 1 },
    "OutlineWidth": 3,
    "RaycastTarget": opt.raycast !== undefined ? opt.raycast : true,
    "Type": opt.type !== undefined ? opt.type : 0,
    "Enable": true
  };
}

function makeButton(opt) {
  return {
    "@type": "MOD.Core.ButtonComponent",
    "Colors": {
      "NormalColor": { "r": 1, "g": 1, "b": 1, "a": 1 },
      "HighlightedColor": { "r": 1, "g": 0.9, "b": 0.5, "a": 1 },
      "PressedColor": { "r": 0.7, "g": 0.6, "b": 0.4, "a": 1 },
      "SelectedColor": { "r": 1, "g": 1, "b": 1, "a": 1 },
      "DisabledColor": { "r": 0.5, "g": 0.5, "b": 0.5, "a": 0.5 },
      "ColorMultiplier": 1,
      "FadeDuration": 0.08
    },
    "ImageRUIDs": {
      "HighlightedSprite": null,
      "PressedSprite": null,
      "SelectedSprite": null,
      "DisabledSprite": null
    },
    "KeyCode": 0,
    "OverrideSorting": false,
    "Selectable": true,
    "Transition": 1,
    "Enable": true
  };
}

function makeTouch() {
  return {
    "@type": "MOD.Core.TouchReceiveComponent",
    "AutoFitOnce": true,
    "RelayEventToBehind": true,
    "TouchArea": { "x": 1, "y": 1 },
    "TouchAreaUpdateTime": 0,
    "Enable": true
  };
}

function makeTextGUI(opt) {
  return {
    "@type": "MOD.Core.TextGUIRendererComponent",
    "BestFit": false,
    "ConstraintX": 100,
    "ConstraintY": 100,
    "FaceDilate": 0,
    "Font": "Default",
    "FontColor": opt.fontColor || { "r": 1, "g": 1, "b": 1, "a": 1 },
    "FontSize": opt.fontSize || 13,
    "FontStyle": 0,
    "HorizontalAlignment": opt.hAlign !== undefined ? opt.hAlign : 0,
    "IgnoreMapLayerCheck": false,
    "MaxSize": 40,
    "MinSize": 10,
    "OrderInLayer": 0,
    "OutlineColor": { "r": 0, "g": 0, "b": 0, "a": 0.8 },
    "OutlineWidth": 0.2,
    "Overflow": 0,
    "OverrideSorting": false,
    "Padding": { "left": 0, "right": 0, "top": 0, "bottom": 0 },
    "SizeFit": false,
    "SortingLayer": "UI",
    "Text": opt.text || "",
    "Underlay": false,
    "UseConstraintX": false,
    "UseConstraintY": false,
    "VerticalAlignment": opt.vAlign !== undefined ? opt.vAlign : 512,
    "Enable": true
  };
}

// 1. ChatPanel (Root container) - Positioned at Left-Bottom: x:30, y:30
const chatPanelEnt = {
  id: panelId,
  path: "/ui/HUDGroup/ChatPanel",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,script.UIChatController",
  jsonString: {
    name: "ChatPanel",
    path: "/ui/HUDGroup/ChatPanel",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 25,
    pathConstraints: "///",
    revision: 1,
    origin: {
      type: "Model",
      entry_id: "UISprite",
      sub_entity_id: null,
      root_entity_id: null,
      replaced_model_id: null
    },
    modelId: "uisprite",
    "@components": [
      makeUITransform({
        align: 7, // BottomLeft
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 0, y: 0 },
        pivot: { x: 0, y: 0 },
        offsetMin: { x: 30, y: 30 },
        offsetMax: { x: 430, y: 210 },
        rectSize: { x: 400, y: 180 },
        anchoredPosition: { x: 30, y: 30 },
        position: { x: -930, y: -510, z: 0 }
      }),
      makeSpriteGUI({
        color: { r: 0.06, g: 0.06, b: 0.1, a: 0.7 },
        raycast: true
      }),
      {
        "@type": "script.UIChatController",
        "chatPanel": panelId,
        "textLogEntity": textLogId,
        "inputEntity": chatInputId,
        "btnSendEntity": btnSendId,
        "btnTabAllEntity": tabAllId,
        "btnTabWhisperEntity": tabWhisperId,
        "btnTabSystemEntity": tabSystemId,
        "CurrentChannel": "map",
        "MaxLogCount": 50,
        "Enable": true
      }
    ],
    "@version": 1
  }
};

// 2. TabAll Button (x: 8, y: 150)
const tabAllEnt = {
  id: tabAllId,
  path: "/ui/HUDGroup/ChatPanel/TabAll",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.ButtonComponent,MOD.Core.TouchReceiveComponent",
  jsonString: {
    name: "TabAll",
    path: "/ui/HUDGroup/ChatPanel/TabAll",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 26,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIButton", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uibutton",
    "@components": [
      makeUITransform({
        align: 7,
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 0, y: 0 },
        pivot: { x: 0, y: 0 },
        offsetMin: { x: 8, y: 150 },
        offsetMax: { x: 68, y: 174 },
        rectSize: { x: 60, y: 24 },
        anchoredPosition: { x: 8, y: 150 }
      }),
      makeSpriteGUI({ color: { r: 0.2, g: 0.22, b: 0.32, a: 0.9 }, raycast: true }),
      makeButton(),
      makeTouch()
    ],
    "@version": 1
  }
};

// TabAll Label
const tabAllLabelEnt = {
  id: tabAllLabelId,
  path: "/ui/HUDGroup/ChatPanel/TabAll/Label",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.TextGUIRendererComponent",
  jsonString: {
    name: "Label",
    path: "/ui/HUDGroup/ChatPanel/TabAll/Label",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 27,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIText", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uitext",
    "@components": [
      makeUITransform({
        align: 15, // CenterStretch
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 1, y: 1 },
        pivot: { x: 0.5, y: 0.5 },
        offsetMin: { x: 0, y: 0 },
        offsetMax: { x: 0, y: 0 },
        rectSize: { x: 60, y: 24 }
      }),
      makeTextGUI({ text: "전체", fontColor: { r: 1.0, g: 0.9, b: 0.4, a: 1.0 }, fontSize: 12, hAlign: 1, vAlign: 512 })
    ],
    "@version": 1
  }
};

// 3. TabWhisper Button (x: 72, y: 150)
const tabWhisperEnt = {
  id: tabWhisperId,
  path: "/ui/HUDGroup/ChatPanel/TabWhisper",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.ButtonComponent,MOD.Core.TouchReceiveComponent",
  jsonString: {
    name: "TabWhisper",
    path: "/ui/HUDGroup/ChatPanel/TabWhisper",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 26,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIButton", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uibutton",
    "@components": [
      makeUITransform({
        align: 7,
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 0, y: 0 },
        pivot: { x: 0, y: 0 },
        offsetMin: { x: 72, y: 150 },
        offsetMax: { x: 142, y: 174 },
        rectSize: { x: 70, y: 24 },
        anchoredPosition: { x: 72, y: 150 }
      }),
      makeSpriteGUI({ color: { r: 0.14, g: 0.15, b: 0.22, a: 0.9 }, raycast: true }),
      makeButton(),
      makeTouch()
    ],
    "@version": 1
  }
};

// TabWhisper Label
const tabWhisperLabelEnt = {
  id: tabWhisperLabelId,
  path: "/ui/HUDGroup/ChatPanel/TabWhisper/Label",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.TextGUIRendererComponent",
  jsonString: {
    name: "Label",
    path: "/ui/HUDGroup/ChatPanel/TabWhisper/Label",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 27,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIText", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uitext",
    "@components": [
      makeUITransform({
        align: 15,
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 1, y: 1 },
        pivot: { x: 0.5, y: 0.5 },
        offsetMin: { x: 0, y: 0 },
        offsetMax: { x: 0, y: 0 },
        rectSize: { x: 70, y: 24 }
      }),
      makeTextGUI({ text: "귓속말", fontColor: { r: 0.7, g: 0.7, b: 0.7, a: 1.0 }, fontSize: 12, hAlign: 1, vAlign: 512 })
    ],
    "@version": 1
  }
};

// 4. TabSystem Button (x: 146, y: 150)
const tabSystemEnt = {
  id: tabSystemId,
  path: "/ui/HUDGroup/ChatPanel/TabSystem",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.ButtonComponent,MOD.Core.TouchReceiveComponent",
  jsonString: {
    name: "TabSystem",
    path: "/ui/HUDGroup/ChatPanel/TabSystem",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 26,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIButton", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uibutton",
    "@components": [
      makeUITransform({
        align: 7,
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 0, y: 0 },
        pivot: { x: 0, y: 0 },
        offsetMin: { x: 146, y: 150 },
        offsetMax: { x: 216, y: 174 },
        rectSize: { x: 70, y: 24 },
        anchoredPosition: { x: 146, y: 150 }
      }),
      makeSpriteGUI({ color: { r: 0.14, g: 0.15, b: 0.22, a: 0.9 }, raycast: true }),
      makeButton(),
      makeTouch()
    ],
    "@version": 1
  }
};

// TabSystem Label
const tabSystemLabelEnt = {
  id: tabSystemLabelId,
  path: "/ui/HUDGroup/ChatPanel/TabSystem/Label",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.TextGUIRendererComponent",
  jsonString: {
    name: "Label",
    path: "/ui/HUDGroup/ChatPanel/TabSystem/Label",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 27,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIText", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uitext",
    "@components": [
      makeUITransform({
        align: 15,
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 1, y: 1 },
        pivot: { x: 0.5, y: 0.5 },
        offsetMin: { x: 0, y: 0 },
        offsetMax: { x: 0, y: 0 },
        rectSize: { x: 70, y: 24 }
      }),
      makeTextGUI({ text: "시스템", fontColor: { r: 0.7, g: 0.7, b: 0.7, a: 1.0 }, fontSize: 12, hAlign: 1, vAlign: 512 })
    ],
    "@version": 1
  }
};

// 5. TextLog (Message viewer: y: 38 ~ 144)
const textLogEnt = {
  id: textLogId,
  path: "/ui/HUDGroup/ChatPanel/TextLog",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.TextGUIRendererComponent",
  jsonString: {
    name: "TextLog",
    path: "/ui/HUDGroup/ChatPanel/TextLog",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 26,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIText", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uitext",
    "@components": [
      makeUITransform({
        align: 7,
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 0, y: 0 },
        pivot: { x: 0, y: 0 },
        offsetMin: { x: 10, y: 38 },
        offsetMax: { x: 390, y: 144 },
        rectSize: { x: 380, y: 106 },
        anchoredPosition: { x: 10, y: 38 }
      }),
      makeTextGUI({
        text: "마을에 오신 것을 환영합니다!\nEnter 또는 T를 눌러 대화를 시작할 수 있습니다.",
        fontSize: 13,
        fontColor: { r: 0.95, g: 0.95, b: 0.95, a: 1.0 },
        hAlign: 0, // Left
        vAlign: 1024 // Bottom
      })
    ],
    "@version": 1
  }
};

// 6. ChatInput (Input area: y: 8 ~ 34)
const chatInputEnt = {
  id: chatInputId,
  path: "/ui/HUDGroup/ChatPanel/ChatInput",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.ButtonComponent,MOD.Core.TouchReceiveComponent,MOD.Core.TextGUIRendererComponent,MOD.Core.TextGUIRendererInputComponent",
  jsonString: {
    name: "ChatInput",
    path: "/ui/HUDGroup/ChatPanel/ChatInput",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 27,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIEmpty", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uiempty",
    "@components": [
      makeUITransform({
        align: 7,
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 0, y: 0 },
        pivot: { x: 0, y: 0 },
        offsetMin: { x: 8, y: 8 },
        offsetMax: { x: 334, y: 34 },
        rectSize: { x: 326, y: 26 },
        anchoredPosition: { x: 8, y: 8 }
      }),
      makeSpriteGUI({
        color: { r: 0.04, g: 0.04, b: 0.07, a: 0.9 },
        raycast: true
      }),
      makeButton(),
      makeTouch(),
      makeTextGUI({
        fontColor: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        fontSize: 13,
        hAlign: 0,
        vAlign: 512
      }),
      {
        "@type": "MOD.Core.TextGUIRendererInputComponent",
        "AllowAutomaticTranslation": true,
        "AutoClear": false,
        "CharacterLimit": 60,
        "ContentType": 0,
        "IgnoreMapLayerCheck": false,
        "IsLocalizationKey": false,
        "LineType": 0,
        "OrderInLayer": 0,
        "OverrideSorting": false,
        "PlaceHolder": "엔터 또는 T를 눌러 대화 입력...",
        "PlaceHolderColor": { "r": 0.6, "g": 0.6, "b": 0.6, "a": 0.8 },
        "SortingLayer": "UI",
        "Text": "",
        "Enable": true
      }
    ],
    "@version": 1
  }
};

// 7. BtnSend Button (x: 340, y: 8)
const btnSendEnt = {
  id: btnSendId,
  path: "/ui/HUDGroup/ChatPanel/BtnSend",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.ButtonComponent,MOD.Core.TouchReceiveComponent",
  jsonString: {
    name: "BtnSend",
    path: "/ui/HUDGroup/ChatPanel/BtnSend",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 27,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIButton", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uibutton",
    "@components": [
      makeUITransform({
        align: 7,
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 0, y: 0 },
        pivot: { x: 0, y: 0 },
        offsetMin: { x: 340, y: 8 },
        offsetMax: { x: 392, y: 34 },
        rectSize: { x: 52, y: 26 },
        anchoredPosition: { x: 340, y: 8 }
      }),
      makeSpriteGUI({
        color: { r: 0.25, g: 0.35, b: 0.55, a: 0.95 },
        raycast: true
      }),
      makeButton(),
      makeTouch()
    ],
    "@version": 1
  }
};

// BtnSend Label
const btnSendLabelEnt = {
  id: btnSendLabelId,
  path: "/ui/HUDGroup/ChatPanel/BtnSend/Label",
  componentNames: "MOD.Core.UITransformComponent,MOD.Core.TextGUIRendererComponent",
  jsonString: {
    name: "Label",
    path: "/ui/HUDGroup/ChatPanel/BtnSend/Label",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 28,
    pathConstraints: "///",
    revision: 1,
    origin: { type: "Model", entry_id: "UIText", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    modelId: "uitext",
    "@components": [
      makeUITransform({
        align: 15,
        anchorsMin: { x: 0, y: 0 },
        anchorsMax: { x: 1, y: 1 },
        pivot: { x: 0.5, y: 0.5 },
        offsetMin: { x: 0, y: 0 },
        offsetMax: { x: 0, y: 0 },
        rectSize: { x: 52, y: 26 }
      }),
      makeTextGUI({ text: "전송", fontColor: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }, fontSize: 12, hAlign: 1, vAlign: 512 })
    ],
    "@version": 1
  }
};

ents.push(chatPanelEnt);
ents.push(tabAllEnt);
ents.push(tabAllLabelEnt);
ents.push(tabWhisperEnt);
ents.push(tabWhisperLabelEnt);
ents.push(tabSystemEnt);
ents.push(tabSystemLabelEnt);
ents.push(textLogEnt);
ents.push(chatInputEnt);
ents.push(btnSendEnt);
ents.push(btnSendLabelEnt);

hudJson.ContentProto.Entities = ents;
fs.writeFileSync(hudPath, JSON.stringify(hudJson, null, 2), "utf8");
console.log("Successfully rebuilt ChatPanel with exact BottomLeft coordinates and full Button/Touch components!");
