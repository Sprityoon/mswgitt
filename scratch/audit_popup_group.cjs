"use strict";
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const { lintUiFile } = require("../.claude/skills/msw-ui-system/scripts/ui_lint.cjs");

const ROOT = path.resolve(__dirname, "..");
const UI = path.join(ROOT, "ui/PopupGroup.ui");
const SLICE = "2860136c06ab075439721c027de365af";
const HOVER_GOLD = { r: 1, g: 0.82, b: 0.38 };

function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}
function xy(v, fb = 0) {
  const o = v && typeof v === "object" ? v : {};
  return [Number(o.x ?? fb), Number(o.y ?? fb)];
}
function hex(c) {
  if (!c) return "-";
  const h = (n) => Math.round(Number(n ?? 0) * 255).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)} a=${Number(c.a ?? 0).toFixed(2)}`;
}
function ruid(spr) {
  const v = spr?.ImageRUID;
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.DataId || v.Value || "";
}
function walkMlua(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walkMlua(p, out);
    else if (name.endsWith(".mlua")) out.push(p);
  }
  return out;
}

const b = UIBuilder.load(UI);
const rows = b.listEntities();
const ents = rows.map((row) => {
  const e = b.find(row.path);
  const js = e.jsonString;
  const ut = findComp(e, "MOD.Core.UITransformComponent");
  const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
  const spr = findComp(e, "MOD.Core.SpriteGUIRendererComponent");
  const btn = findComp(e, "MOD.Core.ButtonComponent");
  const group = findComp(e, "MOD.Core.UIGroupComponent");
  const canvas = findComp(e, "MOD.Core.CanvasGroupComponent");
  const input = findComp(e, "MOD.Core.TextGUIRendererInputComponent");
  const mask = findComp(e, "MOD.Core.MaskComponent");
  const mn = xy(ut?.AnchorsMin, 0.5);
  const mx = xy(ut?.AnchorsMax, 0.5);
  return {
    id: e.id,
    path: row.path,
    depth: row.depth,
    name: js.name,
    enable: js.enable !== false,
    do: Number(js.displayOrder ?? 0),
    origin: js.origin?.entry_id || "",
    types: (js["@components"] || []).map((c) => c["@type"]),
    ut, text, spr, btn, group, canvas, input, mask,
    pos: xy(ut?.anchoredPosition),
    size: xy(ut?.RectSize),
    stretch: mn[0] !== mx[0] || mn[1] !== mx[1],
    preserve: spr?.PreserveSprite,
    sprType: spr?.Type,
    sprColor: spr?.Color,
    ruid: ruid(spr),
    ray: spr?.RaycastTarget,
    hAlign: text?.HorizontalAlignment,
    vAlign: text?.VerticalAlignment,
    font: text?.Font,
    fontSize: text?.FontSize,
    textVal: text?.Text || "",
    textColor: text?.FontColor,
    hover: btn?.Colors?.HighlightedColor,
    transition: btn?.Transition,
  };
});
const byId = new Map(ents.map((e) => [e.id, e]));
const byPath = new Map(ents.map((e) => [e.path, e]));

const root = ents[0];
console.log("=== ROOT ===");
console.log({
  name: root.name,
  origin: root.origin,
  GroupType: root.group?.GroupType,
  GroupOrder: root.group?.GroupOrder,
  DefaultShow: root.group?.DefaultShow,
  canvasA: root.canvas?.GroupAlpha,
  blocks: root.canvas?.BlocksRaycasts,
  interact: root.canvas?.Interactable,
  count: ents.length,
});

console.log("\n=== TOP-LEVEL ===");
for (const e of ents.filter((x) => x.depth <= 1)) {
  console.log(
    `${e.enable ? "on " : "OFF"} do=${String(e.do).padStart(2)} ${e.path}` +
      ` ${e.size[0]}x${e.size[1]} origin=${e.origin}` +
      (e.group && e.depth > 0 ? " NESTED_UIGROUP" : "") +
      (e.mask ? " MASK" : "") +
      (e.spr ? ` spr=${hex(e.sprColor)} p=${e.preserve} ruid=${(e.ruid || "").slice(0, 8)}` : "")
  );
}

const lint = lintUiFile(UI);
const lintE = lint.filter((f) => f.severity === "error");
const lintW = lint.filter((f) => f.severity === "warning");
console.log(`\n=== LINT E${lintE.length}/W${lintW.length}/all${lint.length} ===`);
const lintByRule = new Map();
for (const f of lint) {
  const k = `${f.severity}:${f.rule}`;
  if (!lintByRule.has(k)) lintByRule.set(k, []);
  lintByRule.get(k).push(f);
}
for (const [k, arr] of [...lintByRule.entries()].sort()) {
  console.log(`  ${k} x${arr.length}`);
  for (const f of arr.slice(0, 8)) console.log(`    ${f.path}: ${f.message}`);
  if (arr.length > 8) console.log(`    ... +${arr.length - 8}`);
}

const findings = [];
function add(sev, msg) {
  findings.push({ sev, msg });
}

for (const e of ents) {
  if (e !== root && e.group) add("ERROR", `nested UIGroup ${e.path} origin=${e.origin}`);
  if (e.ut && (e.ut.ActivePlatform === undefined || e.ut.ActivePlatform === 0)) {
    add("WARN", `ActivePlatform missing/0 ${e.path}`);
  }
  if (e.spr && e.preserve === 1 && Math.abs(e.size[0] - e.size[1]) > 8) {
    add("WARN", `AspectOnly non-square ${e.path} ${e.size[0]}x${e.size[1]}`);
  }
  if (e.btn) {
    const h = e.hover;
    const goldish = h && Math.abs(h.r - HOVER_GOLD.r) < 0.05 && Math.abs(h.g - HOVER_GOLD.g) < 0.05;
    if (!goldish) add("WARN", `hover not gold ${e.path} H=${hex(h)}`);
    if (!e.ruid) add("WARN", `button empty RUID ${e.path} spr=${hex(e.sprColor)}`);
    if (e.ruid && e.ruid.length === 32 && e.sprColor && Number(e.sprColor.a) < 0.05) {
      add("INFO", `button sprite a≈0 ${e.path}`);
    }
    if (e.size[0] > 0 && e.size[1] > 0 && (e.size[0] < 88 || e.size[1] < 88)) {
      add("INFO", `touch <88 ${e.path} ${e.size[0]}x${e.size[1]}`);
    }
  }
  if (e.spr && !e.ruid && Number(e.sprColor?.a ?? 0) > 0.01 && !e.text && !e.btn) {
    add("INFO", `empty RUID solid ${e.path} ${hex(e.sprColor)}`);
  }
  if (e.mask && e.spr && Number(e.sprColor?.a ?? 0) > 0.05) {
    const kids = ents.filter((k) => k.path.startsWith(e.path + "/") && k.depth === e.depth + 1 && k.spr);
    if (kids.some((k) => k.ruid && k.ruid === e.ruid)) {
      add("WARN", `Mask parent + child share RUID ${e.path}`);
    }
  }
}

const byParent = new Map();
for (const e of ents) {
  const p = e.path.includes("/") ? e.path.slice(0, e.path.lastIndexOf("/")) : "";
  if (!byParent.has(p)) byParent.set(p, []);
  byParent.get(p).push(e);
}
for (const [, kids] of byParent) {
  const plates = kids.filter((k) => /Plate$/i.test(k.name) && k.spr);
  const texts = kids.filter((k) => k.text && !k.btn);
  for (const plate of plates) {
    for (const t of texts) {
      const same =
        Math.abs(plate.pos[0] - t.pos[0]) < 8 && Math.abs(plate.pos[1] - t.pos[1]) < 8;
      if (same && plate.do > t.do) add("WARN", `Plate covers text ${plate.path}(${plate.do}) > ${t.path}(${t.do})`);
    }
  }
}

const uuidRe = /property\s+(\w+)\s+(\w+)\s*=\s*"([0-9a-fA-F-]{36}|)"/g;
const popupControllers = walkMlua(path.join(ROOT, "RootDesk/MyDesk/UI/Scripts")).filter((p) =>
  /UI(Inventory|Crafting|Collection|SkillTree|Shop|Chest|Furnace|Warp|Permission|Request|Research|Character)/.test(path.basename(p))
);
console.log("\n=== CONTROLLERS ===");
for (const f of popupControllers) console.log(" ", path.basename(f));

let bindErr = 0;
let bindEmpty = 0;
let bindOk = 0;
const bound = new Set();
for (const file of popupControllers) {
  const src = fs.readFileSync(file, "utf8");
  let m;
  const re = new RegExp(uuidRe.source, "g");
  while ((m = re.exec(src))) {
    const [, type, name, uuid] = m;
    if (!uuid) {
      bindEmpty++;
      add("WARN", `empty bind ${path.basename(file)} ${type} ${name}`);
      continue;
    }
    const ent = byId.get(uuid);
    if (!ent) {
      bindErr++;
      add("ERROR", `UUID not in PopupGroup ${path.basename(file)} ${type} ${name}=${uuid}`);
      continue;
    }
    bound.add(uuid);
    if (type === "TextInputComponent") add("ERROR", `rule 24 ${path.basename(file)} ${name} → ${ent.path}`);
    const need = {
      ButtonComponent: "MOD.Core.ButtonComponent",
      TextGUIRendererComponent: "MOD.Core.TextGUIRendererComponent",
      TextGUIRendererInputComponent: "MOD.Core.TextGUIRendererInputComponent",
      SpriteGUIRendererComponent: "MOD.Core.SpriteGUIRendererComponent",
    }[type];
    if (need && !ent.types.includes(need)) {
      add("ERROR", `type mismatch ${path.basename(file)} ${type} ${name} → ${ent.path}`);
    } else bindOk++;
  }
}
console.log(`binds ok=${bindOk} empty=${bindEmpty} missing=${bindErr}`);

const unboundBtn = ents.filter(
  (e) => e.btn && !bound.has(e.id) && !/Template|Chip|ItemSlot|Slot\d|Ghost|Dimmer/.test(e.path + e.name)
);
console.log("\n=== UNBOUND BUTTONS (non-template) ===");
for (const e of unboundBtn) console.log(" ", e.path);

console.log("\n=== POPUP FRAMES / BG / TITLE ===");
for (const e of ents) {
  if (!/(^|\/)(Bg|Frame|Title|TitleText|Header|Dimmer)$/.test(e.path) && !/Popup$/.test(e.path)) continue;
  if (e.depth > 2 && !/Title|TitleText|Header/.test(e.name)) continue;
  console.log(
    `${e.enable ? "on " : "OFF"} do=${e.do} ${e.path} ${e.size[0]}x${e.size[1]}` +
      (e.spr ? ` spr=${hex(e.sprColor)} p=${e.preserve} type=${e.sprType} ruid=${(e.ruid || "").slice(0, 8)} ray=${e.ray}` : "") +
      (e.text ? ` "${e.textVal.slice(0, 20)}" ${hex(e.textColor)} H=${e.hAlign}` : "") +
      (e.mask ? " MASK" : "")
  );
}

console.log("\n=== BUTTONS (sample hover/ruid) ===");
const btns = ents.filter((e) => e.btn);
console.log("count", btns.length);
const ruidCount = new Map();
for (const e of btns) ruidCount.set(e.ruid || "(empty)", (ruidCount.get(e.ruid || "(empty)") || 0) + 1);
console.log("ruid histogram", [...ruidCount.entries()]);
for (const e of btns.filter((x) => /BtnClose|BtnCraft|Tab|BtnStart|BtnLevelUp|BtnOk|Title/.test(x.name)).slice(0, 25)) {
  console.log(
    `  ${e.path} ${e.size[0]}x${e.size[1]} "${e.textVal}" spr=${hex(e.sprColor)} ruid=${(e.ruid || "").slice(0, 8)} H=${hex(e.hover)} T=${e.transition} ray=${e.ray}`
  );
}

const bySev = { ERROR: [], WARN: [], INFO: [] };
for (const f of findings) bySev[f.sev].push(f);
for (const sev of ["ERROR", "WARN", "INFO"]) {
  console.log(`\n=== ${sev} (${bySev[sev].length}) ===`);
  for (const f of bySev[sev]) console.log(`[${sev}] ${f.msg}`);
}
console.log(`\nSUMMARY ERROR=${bySev.ERROR.length} WARN=${bySev.WARN.length} INFO=${bySev.INFO.length}`);
