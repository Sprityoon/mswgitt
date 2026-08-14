"use strict";
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function hasHangul(s) { return /[\uAC00-\uD7A3]/.test(s); }
function hasLatinWord(s) {
  return /[A-Za-z]{3,}/.test(s);
}

const DISPLAY_COLS = /^(Name|DisplayName|Desc|Description|UnlockHint|RecipeName|Text|Title|Hint|ProgressingDesc|Category)$/i;
const SKIP_COLS = /^(id|Id|SkillId|ModelName|EntryId|Icon|IconRUID|SpriteRUID|MapName|UnlockId|UnlockType|Group|TemplateMap|Biome|Type|ParentSkillId|PassiveStat|CastAction|SwingAction|WeaponSlot|TerrainEditAction|UseUnlockId|UseBuffId|FurnitureKind|IsCurrency|UseAnimalId|UsePetId|RUID|SoundRUID|HitSoundRUID|WeaponRUID|PreviewRUID|EffectRUID|HitEffectRUID|OverlayColor|MinimapColor|TintColor|CategoryEnum|CycleEnum|CondEnum|CondArg|CondExtra)$/i;

const csvRoot = path.join(__dirname, "..", "RootDesk/MyDesk");
function walk(dir, acc = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (n.endsWith(".csv")) acc.push(p);
  }
  return acc;
}

console.log("=== CSV display English ===");
for (const file of walk(csvRoot)) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.length);
  if (lines.length < 2) continue;
  const headers = lines[0].split(",");
  const hits = [];
  for (let r = 1; r < lines.length; r++) {
    // naive split — enough for scan
    const cols = lines[r].split(",");
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      const v = (cols[c] || "").trim();
      if (!v || !hasLatinWord(v)) continue;
      if (hasHangul(v) && v.length < 80) continue;
      if (SKIP_COLS.test(h) && h !== "Name" && h !== "RecipeName") continue;
      if (!DISPLAY_COLS.test(h) && !/Desc|Name|Hint|Text/i.test(h)) continue;
      hits.push(`${h}=${v.slice(0, 70)}`);
    }
  }
  if (hits.length) {
    console.log("\n" + path.relative(csvRoot, file) + " x" + hits.length);
    for (const h of hits.slice(0, 12)) console.log("  " + h);
    if (hits.length > 12) console.log("  ... +" + (hits.length - 12));
  }
}

console.log("\n=== UI English text ===");
const uiDir = path.join(__dirname, "..", "ui");
function findComp(e, t) {
  return (e?.jsonString?.["@components"] || []).find((c) => c["@type"] === t) || null;
}
for (const f of fs.readdirSync(uiDir).filter((n) => n.endsWith(".ui"))) {
  const b = UIBuilder.load(path.join(uiDir, f));
  for (const row of b.listEntities()) {
    const e = b.find(row.path);
    const text = findComp(e, "MOD.Core.TextGUIRendererComponent");
    const tc = findComp(e, "MOD.Core.TextComponent");
    const v = (text?.Text || tc?.Text || "").trim();
    if (v && hasLatinWord(v) && !hasHangul(v)) {
      console.log(f, row.path.replace("/ui/" + f.replace(".ui", ""), "."), JSON.stringify(v));
    }
  }
}
