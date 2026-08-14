"use strict";

const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const { lintUiFile } = require("../.claude/skills/msw-ui-system/scripts/ui_lint.cjs");

function xy(v, fb = 0) {
  const o = v && typeof v === "object" ? v : {};
  return [Number(o.x ?? fb), Number(o.y ?? fb)];
}
function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}

function dump(rel) {
  const b = UIBuilder.load(path.join(__dirname, "..", rel));
  const rows = b.listEntities();
  console.log(`\n######## ${rel} (${rows.length}) ########`);
  for (const row of rows) {
    const e = b.find(row.path);
    const js = e.jsonString;
    const ut = findComp(e, "MOD.Core.UITransformComponent");
    const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
    const sprite = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
    const btn = findComp(e, "MOD.Core.ButtonComponent");
    const group = findComp(e, "MOD.Core.UIGroupComponent");
    const sz = xy(ut?.RectSize);
    const pos = xy(ut?.anchoredPosition);
    const mn = xy(ut?.AnchorsMin, 0.5);
    const mx = xy(ut?.AnchorsMax, 0.5);
    const stretch = mn[0] !== mx[0] || mn[1] !== mx[1];
    const kind = btn ? "BTN" : text ? "TXT" : sprite ? "SPR" : group ? "GRP" : "EMP";
    const label = text ? ` "${String(text.Text || "").slice(0, 24)}"` : "";
    const font = text ? ` font=${text.Font} sz=${text.FontSize} H=${text.HorizontalAlignment} V=${text.VerticalAlignment} fit=${text.BestFit}` : "";
    const preserve = sprite && sprite.PreserveSprite != null ? ` preserve=${sprite.PreserveSprite}` : "";
    const ruid = sprite?.ImageRUID;
    const rid = typeof ruid === "string" ? ruid : ruid?.DataId || "";
    const ruidShort = rid ? ` ruid=${String(rid).slice(0, 8)}` : sprite ? " ruid=" : "";
    console.log(
      `${String(js.displayOrder ?? 0).padStart(3)} ${kind} ${js.enable === false ? "OFF" : "on "} ${row.path}` +
        ` ${sz[0]}x${sz[1]} @(${pos[0]},${pos[1]})${stretch ? " STRETCH" : ""}` +
        `${label}${font}${preserve}${ruidShort}`
    );
  }
  const lint = lintUiFile(path.join(__dirname, "..", rel)).filter((f) => f.severity !== "info");
  console.log(`-- lint non-info ${lint.length} --`);
  for (const f of lint) console.log(`  [${f.severity}] ${f.rule} ${f.path}: ${f.message}`);
}

dump("ui/DialogGroup.ui");
dump("ui/MainMenuGroup.ui");
dump("ui/PreviewTool.ui");
