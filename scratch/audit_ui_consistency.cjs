"use strict";

const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const { lintUiFile, formatFinding } = require("../.claude/skills/msw-ui-system/scripts/ui_lint.cjs");

const ROOT = path.resolve(__dirname, "..");
const UI_FILES = [
  "ui/HUDGroup.ui",
  "ui/PopupGroup.ui",
  "ui/DialogGroup.ui",
  "ui/MainMenuGroup.ui",
  "ui/PreviewTool.ui",
];

const COMP_NEED = {
  ButtonComponent: "MOD.Core.ButtonComponent",
  TextGUIRendererComponent: "MOD.Core.TextGUIRendererComponent",
  TextGUIRendererInputComponent: "MOD.Core.TextGUIRendererInputComponent",
  SpriteGUIRendererComponent: "MOD.Core.SpriteGUIRendererComponent",
  UITransformComponent: "MOD.Core.UITransformComponent",
  TextInputComponent: "MOD.Core.TextInputComponent",
};

function walkMlua(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkMlua(p, out);
    else if (name.endsWith(".mlua")) out.push(p);
  }
  return out;
}

function xy(v, fb = 0) {
  const o = v && typeof v === "object" ? v : {};
  return [Number(o.x ?? fb), Number(o.y ?? fb)];
}

function rgba(c) {
  if (!c || typeof c !== "object") return null;
  return [c.r, c.g, c.b, c.a].map((n) => Number(n ?? 0));
}

function hexApprox(c) {
  const [r, g, b, a] = rgba(c) || [0, 0, 0, 0];
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)} a=${a.toFixed(2)}`;
}

function comps(entity) {
  return entity?.jsonString?.["@components"] || [];
}

function findComp(entity, type) {
  return comps(entity).find((c) => c["@type"] === type) || null;
}

function imageRuid(sprite) {
  if (!sprite) return "";
  const r = sprite.ImageRUID;
  if (!r) return "";
  if (typeof r === "string") return r;
  return r.DataId || r.Id || "";
}

function collectEntities(b) {
  const list = b.listEntities();
  return list.map((row) => {
    const e = b.find(row.path);
    const js = e.jsonString || {};
    const ut = findComp(e, "MOD.Core.UITransformComponent");
    const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
    const input = findComp(e, "MOD.Core.TextGUIRendererInputComponent");
    const sprite = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
    const btn = findComp(e, "MOD.Core.ButtonComponent");
    const group = findComp(e, "MOD.Core.UIGroupComponent");
    const canvas = findComp(e, "MOD.Core.CanvasGroupComponent");
    const mn = xy(ut?.AnchorsMin, 0.5);
    const mx = xy(ut?.AnchorsMax, 0.5);
    const stretch = mn[0] !== mx[0] || mn[1] !== mx[1];
    return {
      id: e.id,
      path: js.path || e.path,
      name: js.name,
      enable: js.enable !== false,
      visible: js.visible !== false,
      displayOrder: Number(js.displayOrder ?? 0),
      modelId: e.modelId || js.origin?.entry_id || "",
      origin: js.origin?.entry_id || "",
      types: comps(e).map((c) => c["@type"]),
      ut,
      text,
      input,
      sprite,
      btn,
      group,
      canvas,
      stretch,
      anchorsMin: mn,
      anchorsMax: mx,
      pos: xy(ut?.anchoredPosition),
      size: xy(ut?.RectSize),
      pivot: xy(ut?.Pivot, 0.5),
      alignmentOption: ut?.AlignmentOption,
      activePlatform: ut?.ActivePlatform,
      font: text?.Font,
      fontSize: text?.FontSize,
      bestFit: text?.BestFit,
      hAlign: text?.HorizontalAlignment,
      vAlign: text?.VerticalAlignment,
      textColor: text?.FontColor,
      textValue: text?.Text || "",
      preserve: sprite?.PreserveSprite,
      spriteType: sprite?.Type,
      spriteColor: sprite?.Color,
      imageRuid: imageRuid(sprite),
      raycast: sprite?.RaycastTarget,
    };
  });
}

const findings = [];
function add(sev, area, msg, extra) {
  findings.push({ sev, area, msg, extra: extra || "" });
}

const allById = new Map();
const allByPath = new Map();
const fileMeta = [];

for (const rel of UI_FILES) {
  const abs = path.join(ROOT, rel);
  const b = UIBuilder.load(abs);
  const ents = collectEntities(b);
  const root = ents[0];
  const group = root?.group || {};
  fileMeta.push({
    file: rel,
    count: ents.length,
    rootName: root?.name,
    rootPath: root?.path,
    groupType: group.GroupType,
    groupOrder: group.GroupOrder,
    defaultShow: group.DefaultShow,
    canvasAlpha: root?.canvas?.GroupAlpha,
    blocks: root?.canvas?.BlocksRaycasts,
    interactable: root?.canvas?.Interactable,
  });
  for (const e of ents) {
    allById.set(e.id, { ...e, file: rel });
    allByPath.set(e.path, { ...e, file: rel });
  }

  const lint = lintUiFile(abs);
  const err = lint.filter((f) => f.severity === "error");
  const warn = lint.filter((f) => f.severity === "warning");
  const info = lint.filter((f) => f.severity === "info");
  add("INFO", rel, `lint ${lint.length} (E${err.length}/W${warn.length}/I${info.length})`);
  for (const f of lint) {
    if (f.severity === "error") add("ERROR", rel, `${f.rule} ${f.path}: ${f.message}`);
    else if (f.severity === "warning") add("WARN", rel, `${f.rule} ${f.path}: ${f.message}`);
  }

  for (const e of ents) {
    if (e !== ents[0] && e.group) {
      add("ERROR", rel, `nested UIGroup (rule 15): ${e.path} origin=${e.origin} modelId=${e.modelId}`);
    }
    if (e.ut && (e.activePlatform === undefined || e.activePlatform === 0)) {
      add("WARN", rel, `ActivePlatform missing/0 → invisible: ${e.path}`);
    }
    if (e.btn) {
      const [w, h] = e.size;
      if (w > 0 && h > 0 && (w < 88 || h < 88)) {
        add("WARN", rel, `touch target <88: ${e.path} ${w}x${h}`);
      }
    }
    if (e.stretch && e.size[0] > 0 && e.size[1] > 0) {
      const parent = allByPath.get(e.path.slice(0, e.path.lastIndexOf("/")));
      if (parent && parent.size[0] > 0) {
        const same = Math.abs(e.size[0] - parent.size[0]) < 1 && Math.abs(e.size[1] - parent.size[1]) < 1;
        if (!same && e.size[0] <= 100 && e.size[1] <= 100) {
          add("WARN", rel, `stretch+small RectSize (rule 10): ${e.path} ${e.size[0]}x${e.size[1]} parent=${parent.size[0]}x${parent.size[1]}`);
        }
      }
    }
    if (e.sprite && e.preserve === 1 && e.size[0] !== e.size[1] && Math.abs(e.size[0] - e.size[1]) > 8) {
      add("WARN", rel, `AspectOnly on non-square (rule 25): ${e.path} RectSize ${e.size[0]}x${e.size[1]}`);
    }
    if (e.sprite && !e.imageRuid && (e.spriteColor?.[3] ?? 1) > 0.01 && !e.text && !e.btn) {
      add("INFO", rel, `empty ImageRUID (solid color only): ${e.path} ${hexApprox(e.spriteColor)}`);
    }
    if (e.text && e.hAlign === 1 && e.vAlign === 256 && /Title|Label|Name|Hint|Btn|Button/.test(e.name)) {
      add("INFO", rel, `Left/Top text on titled/label-like: ${e.path} "${e.textValue}"`);
    }
  }

  const byParent = new Map();
  for (const e of ents) {
    const p = e.path.slice(0, e.path.lastIndexOf("/"));
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(e);
  }
  for (const [p, kids] of byParent) {
    const plates = kids.filter((k) => /Plate$/i.test(k.name) && k.sprite);
    const texts = kids.filter((k) => k.text && !k.btn);
    for (const plate of plates) {
      for (const t of texts) {
        if (plate.displayOrder > t.displayOrder) {
          add("WARN", rel, `Plate covers text (displayOrder): ${plate.path}(${plate.displayOrder}) > ${t.path}(${t.displayOrder})`);
        }
      }
    }
  }
}

const mluaFiles = walkMlua(path.join(ROOT, "RootDesk/MyDesk"));
const uuidRe = /property\s+(\w+)\s+(\w+)\s*=\s*"([0-9a-fA-F-]{36}|)"/g;
const bindings = [];
for (const file of mluaFiles) {
  const src = fs.readFileSync(file, "utf8");
  let m;
  const re = new RegExp(uuidRe.source, "g");
  while ((m = re.exec(src))) {
    bindings.push({
      file: path.relative(ROOT, file).replace(/\\/g, "/"),
      type: m[1],
      name: m[2],
      uuid: m[3],
    });
  }
}

const boundIds = new Set();
for (const b of bindings) {
  if (!b.uuid) {
    if (["Entity", "ButtonComponent", "TextGUIRendererComponent", "TextGUIRendererInputComponent", "SpriteGUIRendererComponent", "UITransformComponent"].includes(b.type)) {
      add("WARN", "bind", `empty UUID: ${b.file} ${b.type} ${b.name}`);
    }
    continue;
  }
  boundIds.add(b.uuid);
  const ent = allById.get(b.uuid);
  if (!ent) {
    add("ERROR", "bind", `UUID not in any .ui: ${b.file} ${b.type} ${b.name}=${b.uuid}`);
    continue;
  }
  if (b.type === "TextInputComponent") {
    add("ERROR", "bind", `wrong type TextInputComponent (rule 24): ${b.file} ${b.name} → ${ent.path}`);
  }
  const need = COMP_NEED[b.type];
  if (need && !ent.types.includes(need)) {
    add("ERROR", "bind", `type mismatch: ${b.file} ${b.type} ${b.name} → ${ent.path} has [${ent.types.filter((t) => t.startsWith("MOD.Core.")).join(", ")}]`);
  }
}

const skipUnbound = /Template|Chip|Slot_|row\d|ingSlot|ItemSlot|Drag|Ghost|Preview|Plate|Bg$|Dimmer|SafeArea|Fade/;
for (const [id, e] of allById) {
  if (e.btn && !boundIds.has(id) && !skipUnbound.test(e.name) && !skipUnbound.test(e.path)) {
    add("INFO", "bind", `unbound button: ${e.file} ${e.path}`);
  }
}

const fonts = new Map();
const colors = new Map();
for (const e of allById.values()) {
  if (e.text && e.font) fonts.set(e.font, (fonts.get(e.font) || 0) + 1);
  if (e.text && e.textColor) {
    const k = hexApprox(e.textColor);
    colors.set(k, (colors.get(k) || 0) + 1);
  }
}

console.log("=== FILE META ===");
for (const m of fileMeta) {
  console.log(JSON.stringify(m));
}
console.log("\n=== FONTS ===");
for (const [k, n] of [...fonts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${n}`);
console.log("\n=== TEXT COLORS (top) ===");
for (const [k, n] of [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${k}: ${n}`);

const bySev = { ERROR: [], WARN: [], INFO: [] };
for (const f of findings) bySev[f.sev].push(f);

for (const sev of ["ERROR", "WARN", "INFO"]) {
  console.log(`\n=== ${sev} (${bySev[sev].length}) ===`);
  for (const f of bySev[sev]) {
    console.log(`[${sev}] ${f.area}  ${f.msg}${f.extra ? "  " + f.extra : ""}`);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`entities=${allById.size} bindings=${bindings.length} ERROR=${bySev.ERROR.length} WARN=${bySev.WARN.length} INFO=${bySev.INFO.length}`);
