/**
 * T100 Change ① — Trigger 전수 재감사 (규칙 13 갭 우회)
 * ModelBuilder.read()가 maplestorymapobject$ 를 0 components 로 반환하므로,
 * JSON에서 Components 배열을 가진 가장 안쪽 노드를 본체로 읽는다.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MODEL_ROOT = path.join(ROOT, "RootDesk", "MyDesk");

function walkModels(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkModels(p, out);
    else if (ent.name.endsWith(".model")) out.push(p);
  }
  return out;
}

/** Components 배열을 가진 가장 안쪽 노드를 찾는다 (규칙 13). */
function findInnerBody(node, depth = 0) {
  if (!node || typeof node !== "object") return null;
  let best = null;
  if (Array.isArray(node.Components) && node.Components.length > 0) {
    best = { node, depth };
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") {
      const inner = findInnerBody(v, depth + 1);
      if (inner && (!best || inner.depth > best.depth)) best = inner;
    }
  }
  return best;
}

function compNames(body) {
  return (body.Components || []).map((c) => {
    if (typeof c === "string") return c;
    if (c && c["@type"]) return c["@type"];
    return String(c);
  });
}

function getValue(body, targetType, name) {
  const vals = body.Values || [];
  for (const v of vals) {
    if (v.TargetType === targetType && v.Name === name) return v.Value;
  }
  return undefined;
}

function hasComp(names, needle) {
  return names.some((n) => n === needle || n.endsWith("." + needle) || n.includes(needle));
}

function vec2str(v) {
  if (v == null) return "—";
  if (typeof v === "object") {
    const x = v.x ?? v.X ?? v[0];
    const y = v.y ?? v.Y ?? v[1];
    return `(${x}, ${y})`;
  }
  return String(v);
}

const files = walkModels(MODEL_ROOT);
const rows = [];

for (const fp of files) {
  const raw = JSON.parse(fs.readFileSync(fp, "utf8"));
  const entryKey = raw.EntryKey || raw.entryKey || "";
  const content = raw.ContentProto?.Json || raw.ContentProto || raw;
  const found = findInnerBody(content);
  const body = found ? found.node : content;
  const names = compNames(body);
  const gapHit =
    String(entryKey).includes("$") ||
    String(body.Id || content.Id || "").includes("$") ||
    String(body.Name || "").includes("$") ||
    (found && found.depth > 0 && names.length > 0);

  // Also check ModelBuilder-style: if outer has 0 comps but inner has some
  const outerComps = Array.isArray(content.Components) ? content.Components.length : 0;
  const builderWouldMiss = outerComps === 0 && names.length > 0;

  const hasTrigger = hasComp(names, "TriggerComponent");
  const hasPhys = hasComp(names, "PhysicsColliderComponent");
  const hasOcc = hasComp(names, "ResourceOccupiedArea");
  const hasFurn = hasComp(names, "PlaceableFurniture");
  const scale = getValue(body, "MOD.Core.TransformComponent", "Scale");
  const boxSize = getValue(body, "MOD.Core.TriggerComponent", "BoxSize");
  const off = getValue(body, "MOD.Core.TriggerComponent", "ColliderOffset");
  const sortY = getValue(body, "MOD.Core.SpriteRendererComponent", "SortYOffset");
  const occW = getValue(body, "script.ResourceOccupiedArea", "OccupiedWidth")
    ?? getValue(body, "script.ResourceOccupiedArea", "Width");
  const occH = getValue(body, "script.ResourceOccupiedArea", "OccupiedHeight")
    ?? getValue(body, "script.ResourceOccupiedArea", "Height");
  const blocks = getValue(body, "script.ResourceOccupiedArea", "BlocksMovement")
    ?? getValue(body, "script.PlaceableFurniture", "BlocksMovement");

  const rel = path.relative(ROOT, fp).replace(/\\/g, "/");
  const displayName = body.Name || content.Name || path.basename(fp, ".model");

  rows.push({
    rel,
    name: displayName,
    entryKey,
    gap: builderWouldMiss || gapHit,
    builderWouldMiss,
    compCount: names.length,
    hasTrigger,
    hasPhys,
    hasOcc,
    hasFurn,
    scale: vec2str(scale),
    boxSize: vec2str(boxSize),
    offset: vec2str(off),
    sortY: sortY == null ? "—" : String(sortY),
    occW: occW == null ? "—" : String(occW),
    occH: occH == null ? "—" : String(occH),
    blocks: blocks == null ? "—" : String(blocks),
    comps: names.join(", "),
  });
}

rows.sort((a, b) => a.rel.localeCompare(b.rel));

const withT = rows.filter((r) => r.hasTrigger);
const withoutT = rows.filter((r) => !r.hasTrigger);
const gapModels = rows.filter((r) => r.builderWouldMiss);

console.log(`TOTAL_MODELS=${rows.length}`);
console.log(`TRIGGER_YES=${withT.length}`);
console.log(`TRIGGER_NO=${withoutT.length}`);
console.log(`GAP_BUILDER_MISS=${gapModels.length}`);
console.log("---GAP_MODELS---");
for (const r of gapModels) {
  console.log(`${r.name}\tTrigger=${r.hasTrigger}\t${r.rel}`);
}
console.log("---ALL---");
for (const r of rows) {
  console.log(
    [
      r.hasTrigger ? "Y" : "N",
      r.builderWouldMiss ? "GAP" : "ok",
      r.name,
      r.boxSize,
      r.offset,
      r.scale,
      r.sortY,
      r.hasOcc ? "Occ" : "-",
      r.hasFurn ? "Furn" : "-",
      r.blocks,
      r.occW,
      r.occH,
      r.rel,
    ].join("\t")
  );
}

// Furniture 6 focus
const furnNames = [
  "Furniture_Bed",
  "Furniture_CookingPot",
  "Furniture_Furnace",
  "Furniture_WoodenChest",
  "Furniture_AnimalPen",
  "Furniture_MonsterWard",
];
console.log("---FURNITURE6---");
for (const n of furnNames) {
  const r = rows.find((x) => x.name === n || x.rel.endsWith(`${n}.model`));
  if (!r) {
    console.log(`MISSING ${n}`);
    continue;
  }
  console.log(JSON.stringify(r, null, 0));
}

fs.writeFileSync(
  path.join(__dirname, "t100_trigger_audit.json"),
  JSON.stringify({ total: rows.length, withT: withT.length, withoutT: withoutT.length, rows }, null, 2)
);
console.log("Wrote scratch/t100_trigger_audit.json");
