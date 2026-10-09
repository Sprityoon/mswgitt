"use strict";

const fs = require("fs");
const path = require("path");
const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

const mapPath = path.resolve(__dirname, "../map/template_desert.map");
const backupPath = path.resolve(__dirname, "../scratch/template_desert_before_desert_props.map");

// 1. Backup map file
fs.copyFileSync(mapPath, backupPath);
console.log(`[Backup] Copied template_desert.map to ${backupPath}`);

// 2. Load with MapBuilder
const b = MapBuilder.load(mapPath);
const initialCount = b.entities.length;
console.log(`[Load] Initial entity count: ${initialCount}`);

// 3. Remove existing Cattail models (3 items)
const cattailNames = [
  "D21_Deco_Cattail",
  "D23_Deco_Cattail",
  "D25_Deco_Cattail"
];

for (const name of cattailNames) {
  try {
    b.remove(name);
    console.log(`[Remove] Cattail removed: ${name}`);
  } catch (err) {
    console.warn(`[Warn] Cattail not found: ${name}`);
  }
}

// 4. Model paths
const modelsDir = path.resolve(__dirname, "../RootDesk/MyDesk/MapObjects/Models");
const modelDeadTree = path.join(modelsDir, "Tree_Desert_DeadTree.model");
const modelYucca = path.join(modelsDir, "Deco_Desert_YuccaFlower.model");
const modelBone = path.join(modelsDir, "Deco_Desert_AnimalBone.model");

// 5. Placements (17 items mathematically validated on dry sand)
const placements = [
  // Dead Trees (6 items)
  { name: "Desert_DeadTree_01", model: modelDeadTree, pos: [-14.0, -18.0, 0] },
  { name: "Desert_DeadTree_02", model: modelDeadTree, pos: [-10.0, 15.0, 0] },
  { name: "Desert_DeadTree_03", model: modelDeadTree, pos: [10.0, -16.0, 0] },
  { name: "Desert_DeadTree_04", model: modelDeadTree, pos: [18.0, -5.0, 0] },
  { name: "Desert_DeadTree_05", model: modelDeadTree, pos: [8.0, 16.0, 0] },
  { name: "Desert_DeadTree_06", model: modelDeadTree, pos: [-18.0, 2.0, 0] },

  // Yucca Flowers (6 items)
  { name: "Desert_Yucca_01", model: modelYucca, pos: [-6.5, -6.5, 0] },
  { name: "Desert_Yucca_02", model: modelYucca, pos: [6.5, -2.0, 0] },
  { name: "Desert_Yucca_03", model: modelYucca, pos: [12.0, 7.0, 0] },
  { name: "Desert_Yucca_04", model: modelYucca, pos: [-13.0, -7.0, 0] },
  { name: "Desert_Yucca_05", model: modelYucca, pos: [-3.0, 12.0, 0] },
  { name: "Desert_Yucca_06", model: modelYucca, pos: [20.0, 15.0, 0] },

  // Animal Bones (5 items)
  { name: "Desert_Bone_01", model: modelBone, pos: [-24.0, -12.0, 0] },
  { name: "Desert_Bone_02", model: modelBone, pos: [18.5, -20.0, 0] },
  { name: "Desert_Bone_03", model: modelBone, pos: [-3.0, -20.0, 0] },
  { name: "Desert_Bone_04", model: modelBone, pos: [4.0, 22.0, 0] },
  { name: "Desert_Bone_05", model: modelBone, pos: [-18.0, 18.0, 0] },
];

console.log(`[Placing] Placing ${placements.length} new desert assets...`);
for (const p of placements) {
  b.placeModel(p.name, p.model, { pos: p.pos });
  console.log(` - Placed ${p.name} at (${p.pos[0]}, ${p.pos[1]})`);
}

// 6. Write map file
b.write(mapPath);
console.log(`[Success] Written updated map to ${mapPath}`);

// 7. Verify reloading
const verifyB = MapBuilder.load(mapPath);
const finalCount = verifyB.entities.length;
console.log(`[Verify] Final entity count: ${finalCount} (expected: ${initialCount - cattailNames.length + placements.length})`);
