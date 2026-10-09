"use strict";

const fs = require("fs");
const path = require("path");
const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

const mapPath = path.resolve(__dirname, "../map/template_snow.map");
const backupPath = path.resolve(__dirname, "../scratch/template_snow_before_placement.map");

// 1. Ensure clean base from backup
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(mapPath, backupPath);
  console.log(`[Backup] Copied template_snow.map to ${backupPath}`);
} else {
  console.log(`[Backup] Using existing clean backup: ${backupPath}`);
}

// 2. Load clean base
const b = MapBuilder.load(backupPath);
const initialCount = b.entities.length;
console.log(`[Load] Initial entity count from base: ${initialCount}`);

// 3. Remove existing fence models (7 items)
const fenceNames = [
  "D03_Deco_LogFence",
  "D06_Deco_LogFence",
  "D12_Deco_LogFence",
  "D16_Deco_LogFence",
  "D22_Deco_LogFence",
  "D24_Deco_LogFence",
  "D26_Deco_LogFence"
];

for (const name of fenceNames) {
  try {
    b.remove(name);
    console.log(`[Remove] Fence removed: ${name}`);
  } catch (err) {
    console.warn(`[Warn] Fence not found: ${name}`);
  }
}

// 4. Model paths
const modelsDir = path.resolve(__dirname, "../RootDesk/MyDesk/MapObjects/Models");
const modelFir = path.join(modelsDir, "Tree_Winter_Fir.model");
const modelRock = path.join(modelsDir, "Deco_Winter_Rock.model");
const modelStump = path.join(modelsDir, "Deco_Winter_TreeStump.model");
const modelLog = path.join(modelsDir, "Deco_Winter_FallenLog.model");

// 5. Placements (18 items verified on pure snow tiles with generous spacing)
const placements = [
  // Fir Trees (5 items)
  { name: "Snow_Fir_01", model: modelFir, pos: [-21.0, 16.0, 0] },
  { name: "Snow_Fir_02", model: modelFir, pos: [-17.5, -14.0, 0] },
  { name: "Snow_Fir_03", model: modelFir, pos: [18.0, -18.0, 0] },
  { name: "Snow_Fir_04", model: modelFir, pos: [6.0, 18.0, 0] },
  { name: "Snow_Fir_05", model: modelFir, pos: [23.0, 6.0, 0] },

  // Rocks (5 items)
  { name: "Snow_Rock_01", model: modelRock, pos: [5.5, 5.0, 0] },
  { name: "Snow_Rock_02", model: modelRock, pos: [17.5, -1.0, 0] },
  { name: "Snow_Rock_03", model: modelRock, pos: [-14.0, -23.0, 0] },
  { name: "Snow_Rock_04", model: modelRock, pos: [-24.0, -4.0, 0] },
  { name: "Snow_Rock_05", model: modelRock, pos: [-15.0, 23.0, 0] },

  // Stumps (4 items)
  { name: "Snow_Stump_01", model: modelStump, pos: [-25.0, -24.5, 0] },
  { name: "Snow_Stump_02", model: modelStump, pos: [11.0, -13.0, 0] },
  { name: "Snow_Stump_03", model: modelStump, pos: [5.0, -8.0, 0] },
  { name: "Snow_Stump_04", model: modelStump, pos: [-5.0, 16.0, 0] },

  // Fallen Logs (4 items)
  { name: "Snow_FallenLog_01", model: modelLog, pos: [9.0, -22.5, 0] },
  { name: "Snow_FallenLog_02", model: modelLog, pos: [15.0, 16.5, 0] },
  { name: "Snow_FallenLog_03", model: modelLog, pos: [-14.0, 18.0, 0] },
  { name: "Snow_FallenLog_04", model: modelLog, pos: [13.0, 8.0, 0] },
];

console.log(`[Placing] Placing ${placements.length} new winter assets...`);
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
console.log(`[Verify] Final entity count: ${finalCount} (expected: ${initialCount - 7 + placements.length})`);
