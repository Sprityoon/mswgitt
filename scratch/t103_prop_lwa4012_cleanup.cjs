/**
 * T103 — Prop LWA-4012 cleanup: add inspector Properties links
 * (Values already set by T75; warning is missing Properties metadata.)
 */
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const {
  ModelBuilder,
} = require(path.join(
  ROOT,
  ".claude/skills/msw-general/scripts/model/msw_model_builder.cjs"
));

const ALL = [
  "Prop_LampPost",
  "Prop_StakeFence",
  "Prop_WhiteFence",
  "Prop_Signpost",
  "Prop_Bench",
  "Prop_FlowerBed",
  "Prop_Barrel",
  "Prop_CrateStack",
  "Prop_JarSet",
  "Prop_Cart",
  "Prop_Banner",
];

const OCC = new Set([
  "Prop_StakeFence",
  "Prop_WhiteFence",
  "Prop_Barrel",
  "Prop_CrateStack",
  "Prop_Cart",
]);

function modelPath(name) {
  return path.join(
    ROOT,
    "RootDesk/MyDesk/MapObjects/Models",
    `${name}.model`
  );
}

function linkYSort(b) {
  const before = b.getValue("script.YSortSprite", "SortYOffset");
  b.property("SortYOffset", {
    target: "script.YSortSprite",
    property: "SortYOffset",
    type_key: "float",
    display_name: "SortYOffset",
    show_in_inspector: true,
  });
  // re-assert value unchanged (script default 0.0)
  b.value("script.YSortSprite", "SortYOffset", before ?? 0, "float");
  return before ?? 0;
}

function linkOcc(b) {
  const keys = ["OffsetXMin", "OffsetXMax", "OffsetYMin", "OffsetYMax"];
  const before = {};
  for (const k of keys) {
    before[k] = b.getValue("script.ResourceOccupiedArea", k);
    b.property(k, {
      target: "script.ResourceOccupiedArea",
      property: k,
      type_key: "float",
      display_name: k,
      show_in_inspector: true,
    });
    b.value("script.ResourceOccupiedArea", k, before[k] ?? 0, "float");
  }
  return before;
}

const report = [];
for (const name of ALL) {
  const p = modelPath(name);
  const b = ModelBuilder.read(p);
  if (!b.hasComponent("script.YSortSprite") && !b.hasValue("script.YSortSprite", "SortYOffset")) {
    throw new Error(`${name}: missing YSortSprite`);
  }
  const sortBefore = linkYSort(b);
  let occBefore = null;
  if (OCC.has(name)) {
    if (!b.hasComponent("script.ResourceOccupiedArea")) {
      throw new Error(`${name}: expected ResourceOccupiedArea`);
    }
    occBefore = linkOcc(b);
  }
  b.write(p);
  const after = ModelBuilder.read(p);
  const propNames = after.snapshot().properties.map((x) => x.name);
  const sortAfter = after.getValue("script.YSortSprite", "SortYOffset");
  const row = {
    name,
    sortBefore,
    sortAfter,
    hasSortProp: propNames.includes("SortYOffset"),
    occBefore,
    occProps: OCC.has(name)
      ? ["OffsetXMin", "OffsetXMax", "OffsetYMin", "OffsetYMax"].every((k) =>
          propNames.includes(k)
        )
      : null,
  };
  if (sortBefore !== sortAfter) throw new Error(`${name}: SortYOffset mutated`);
  if (OCC.has(name)) {
    for (const k of Object.keys(occBefore)) {
      const v = after.getValue("script.ResourceOccupiedArea", k);
      if (v !== occBefore[k]) throw new Error(`${name}: ${k} mutated ${occBefore[k]}→${v}`);
    }
  }
  report.push(row);
  console.log("OK", name, "props=", propNames.filter((n) => !["Position", "Rotation", "Scale", "renderguid"].includes(n)).join(","));
}

console.log(JSON.stringify(report, null, 2));
