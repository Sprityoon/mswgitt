"use strict";
// 실제 산출물의 바인딩·플랫폼·초기 숨김·슬라이더 필드와 mLua 진단을 확인한다. Play 호출 없음.
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const settings = UIBuilder.read("ui/SettingsGroup.ui");
const menu = UIBuilder.read("ui/MainMenuGroup.ui");
const get = (b, p, type) => b.getComponent(p, `MOD.Core.${type}`);
const primaryPng = fs.readFileSync("docs/design/ui/maplecraft_start_ui_assets/4_Final_MSW_PNG/mc_title_btn_primary.png");
const primaryRect = get(menu, "TitlePanel/BtnNew", "UITransformComponent").RectSize;
assert(Math.abs(primaryRect.x / primaryRect.y - primaryPng.readUInt32BE(16) / primaryPng.readUInt32BE(20)) < 0.000001,
  "start button frame must preserve the registered PNG aspect ratio");
const uiSource = fs.readFileSync("RootDesk/MyDesk/UI/Scripts/UISettingsLogic.mlua", "utf8");
for (const [, prop, id] of uiSource.matchAll(/property (?:Entity|\w+Component) (\w+) = "([^"]*)"/g)) {
  assert(settings.listEntities().some(e => settings.getId(e.path) === id), `unbound ${prop}: ${id}`);
}
assert.equal(settings.find("Window").jsonString.enable, false);
assert.equal(settings.find("Dimmer").jsonString.enable, false);
assert.equal(get(settings, "SettingsGroup", "UIGroupComponent").DefaultShow, true);
assert.equal(get(settings, "Window/KeyRows", "UITransformComponent").ActivePlatform, 1);
assert.equal(get(settings, "Window/MobileNotice", "UITransformComponent").ActivePlatform, 2);
assert.equal(get(settings, "Window/MobileNotice", "TextGUIRendererComponent").Text.replace(/\n/g, " "), "모바일 조작키 설정은 준비중입니다!");
for (const kind of ["Bgm", "Sfx"]) {
  const slider = get(settings, `Window/${kind}Row/Slider`, "SliderComponent");
  assert(slider.FillRectImageRUID.DataId && slider.HandleImageRUID.DataId);
  assert.deepEqual(slider.HandleSize, { x: 30, y: 32 });
  assert.equal(slider.MinValue, 0);
  assert.equal(slider.MaxValue, 1);
}
for (const e of settings.listEntities()) {
  if (!settings.hasComponent(e.path, "MOD.Core.ButtonComponent")) continue;
  const size = get(settings, e.path, "UITransformComponent").RectSize;
  assert(size.x >= 88 && size.y >= 88, `small touch target: ${e.path}`);
}
for (const button of ["BtnNew", "BtnContinue", "BtnQuit"]) {
  const text = get(menu, `TitlePanel/${button}`, "TextGUIRendererComponent");
  if (process.argv.includes("--title-metrics")) console.log(JSON.stringify({ button, FontSize: text.FontSize, BestFit: text.BestFit, MinSize: text.MinSize, MaxSize: text.MaxSize, SizeFit: text.SizeFit }));
  assert.equal(text.FontSize, 64);
  assert.equal(text.BestFit, false, "title font must stay fixed when the button grows");
  assert.equal(text.OutlineWidth, 0.32);
  assert.equal(text.FaceDilate, text.OutlineWidth);
  assert.deepEqual(text.FontColor, { r: 1, g: 1, b: 1, a: 1 });
}
for (const button of ["SlotPanel/BtnBack", "CustomizePanel/Frame/BtnBack"]) {
  assert.deepEqual(get(menu, button, "SpriteGUIRendererComponent").Color, { r: 1, g: 1, b: 1, a: 1 });
  assert.equal(get(menu, button, "TextGUIRendererComponent").FontSize, 26);
}
// titlePanel을 숨겨도 바깥 배경이 유지되는지 확인한다.
const menuSource = fs.readFileSync("RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua", "utf8");
const bgId = menuSource.match(/property Entity bg = "([^"]+)"/)[1];
const bg = menu.listEntities().find(e => menu.getId(e.path) === bgId);
console.log("mainmenu background:", bg.path);
assert(!bg.path.startsWith("/ui/MainMenuGroup/TitlePanel/"), "settings would hide the title backdrop");
assert(!fs.readFileSync("scripts/build_settings_ui_20261015.cjs", "utf8").includes("JSON.stringify(built"));
console.log("PASS: UI bindings, visibility, platform gates, slider resources, typography and backdrop");

if (process.argv.includes("--registered")) {
  const ruid = name => {
    const resource = JSON.parse(fs.readFileSync(`RootDesk/MyDesk/${name}.sprite`, "utf8")).ContentProto.Json;
    assert(resource.resource_guid, `missing resource GUID: ${name}`);
    return resource.resource_guid;
  };
  const image = (entity, name) => {
    const sprite = get(settings, entity, "SpriteGUIRendererComponent");
    assert.equal(sprite.ImageRUID.DataId, ruid(name), `incorrect image: ${entity}`);
    assert.deepEqual(sprite.Color, { r: 1, g: 1, b: 1, a: 1 }, `tinted image: ${entity}`);
  };
  for (const kind of ["Bgm", "Sfx"]) {
    image(`Window/${kind}Row/Slider`, "mc_set_slider_track");
    image(`Window/${kind}Row/Mute/Visual`, "mc_set_sound_on");
    const slider = get(settings, `Window/${kind}Row/Slider`, "SliderComponent");
    assert.equal(slider.FillRectImageRUID.DataId, ruid("mc_set_slider_fill"));
    assert.equal(slider.HandleImageRUID.DataId, ruid("mc_set_slider_knob"));
  }
  for (const kind of ["Shake", "Guide"]) image(`Window/${kind}Row/Switch/Visual`, "mc_set_switch_on");
  image("Window/BtnReset/Visual", "mc_set_btn_gray");
  image("Window/BtnSave/Visual", "mc_set_btn_olive");
  for (const e of settings.listEntities().filter(e => /\/Key\d+$/.test(e.path))) {
    const width = get(settings, e.path, "UITransformComponent").RectSize.x;
    image(e.path, width > 40 ? "mc_set_keycap_wide" : "mc_set_keycap_sq");
  }
  for (const [prop, name] of [["soundOnRuid", "mc_set_sound_on"], ["soundMuteRuid", "mc_set_sound_mute"],
    ["switchOnRuid", "mc_set_switch_on"], ["switchOffRuid", "mc_set_switch_off"]]) {
    assert(uiSource.includes(`property string ${prop} = "${ruid(name)}"`), `incorrect runtime state image: ${prop}`);
  }
  console.log("PASS: all 11 registered settings assets and runtime state images applied without fallback tint");
}

if (process.argv.includes("--diagnose")) {
  const { resolveLspCommand, spawnLspSync } = require("../.claude/hooks/mlua-lsp/resolve-cmd.cjs");
  const root = path.resolve(__dirname, "..");
  const command = resolveLspCommand({ projectRoot: root });
  const files = ["Settings/Scripts/GameSettingsLogic", "UI/Scripts/UISettingsLogic", "UI/Scripts/UIMainMenuController", "Sound/Scripts/BGMManager"];
  for (const file of files) {
    const target = path.join(root, "RootDesk/MyDesk", `${file}.mlua`);
    const result = spawnLspSync(command, ["diagnose", root, target], { timeout: 60000 });
    assert(!result.error, result.error?.message);
    const report = JSON.parse(result.stdout);
    console.log(JSON.stringify({ file, errors: report.errors, warnings: report.warnings, diagnostics: report.diagnostics }));
    assert.equal(report.errors, 0, `mLua errors in ${file}`);
  }
}
