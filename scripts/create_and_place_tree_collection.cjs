const fs = require("fs");
const path = require("path");
const { ModelBuilder } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");
const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

// 1. Load Sprite RUID Map
const ruidMapPath = path.join(__dirname, "..", "scratch", "sprites_ruid_map.json");
const ruidMap = JSON.parse(fs.readFileSync(ruidMapPath, "utf8"));

const modelsDir = path.join(__dirname, "..", "RootDesk", "MyDesk", "MapObjects", "Models");
const templateModelPath = path.join(modelsDir, "Deco_Stump.model");
const townMapPath = path.join(__dirname, "..", "map", "town.map");

const treeDefinitions = [
  // Row 1 (Trees)
  { id: "tree_01_basic", name: "Tree_Basic", ruidKey: "tree_01_basic", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_02_tall", name: "Tree_Tall", ruidKey: "tree_02_tall", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_03_tiered", name: "Tree_Tiered", ruidKey: "tree_03_tiered", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_04_flower", name: "Tree_Flower", ruidKey: "tree_04_flower", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_05_cherry_blossom", name: "Tree_CherryBlossom", ruidKey: "tree_05_cherry_blossom", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_06_autumn_maple", name: "Tree_AutumnMaple", ruidKey: "tree_06_autumn_maple", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },

  // Row 2 (Trees)
  { id: "tree_07_pine", name: "Tree_Pine", ruidKey: "tree_07_pine", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_08_fir", name: "Tree_Fir", ruidKey: "tree_08_fir", isResource: true, drop: "Wood", scale: 1.5, colW: 0.7, colH: 0.4 },
  { id: "tree_09_wide", name: "Tree_Wide", ruidKey: "tree_09_wide", isResource: true, drop: "Wood", scale: 1.5, colW: 1.2, colH: 0.4 },
  { id: "tree_10_willow", name: "Tree_Willow", ruidKey: "tree_10_willow", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_11_birch", name: "Tree_Birch", ruidKey: "tree_11_birch", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_12_dark", name: "Tree_Dark", ruidKey: "tree_12_dark", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },

  // Row 3 (Trees)
  { id: "tree_13_fruit", name: "Tree_Fruit", ruidKey: "tree_13_fruit", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_14_apple", name: "Tree_Apple", ruidKey: "tree_14_apple", isResource: true, drop: "Apple", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_15_palm", name: "Tree_Palm", ruidKey: "tree_15_palm", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_16_round", name: "Tree_Round", ruidKey: "tree_16_round", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_17_twin", name: "Tree_Twin", ruidKey: "tree_17_twin", isResource: true, drop: "Wood", scale: 1.5, colW: 1.1, colH: 0.4 },
  { id: "tree_18_small", name: "Tree_Small", ruidKey: "tree_18_small", isResource: true, drop: "Wood", scale: 1.5, colW: 0.6, colH: 0.3 }
];

const propDefinitions = [
  // Row 4 (Props)
  { id: "deco_treestump", name: "Deco_TreeStump", ruidKey: "prop_01_stump", isResource: true, drop: "Wood", scale: 1.5, colW: 0.6, colH: 0.3 },
  { id: "deco_fallenlog", name: "Deco_FallenLog", ruidKey: "prop_02_fallen_log", isResource: true, drop: "Wood", scale: 1.5, colW: 0.9, colH: 0.4 },
  { id: "deco_rocktree", name: "Deco_RockTree", ruidKey: "prop_03_rock_tree", isResource: true, drop: "Stone", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "deco_bush", name: "Deco_Bush", ruidKey: "prop_04_bush", isResource: false, scale: 1.5 },
  { id: "deco_flowergrass", name: "Deco_FlowerGrass", ruidKey: "prop_05_flower_grass", isResource: false, scale: 1.5 },
  { id: "deco_tallgrass", name: "Deco_TallGrass", ruidKey: "prop_06_tall_grass", isResource: false, scale: 1.5 },
  { id: "deco_smallflower", name: "Deco_SmallFlower", ruidKey: "prop_07_small_flower", isResource: false, scale: 1.5 },
  { id: "deco_vinestump", name: "Deco_VineStump", ruidKey: "prop_08_vine_stump", isResource: true, drop: "Wood", scale: 1.5, colW: 0.5, colH: 0.5 },
  { id: "deco_fallenleaves", name: "Deco_FallenLeaves", ruidKey: "prop_09_fallen_leaves", isResource: false, scale: 1.5 }
];

const allDefinitions = [...treeDefinitions, ...propDefinitions];

console.log(`[Step 1/2] Creating ${allDefinitions.length} .model files in ${modelsDir}...`);

const createdModels = [];

for (const def of allDefinitions) {
  const ruid = ruidMap[def.ruidKey];
  if (!ruid) {
    throw new Error(`RUID for key '${def.ruidKey}' not found in sprites_ruid_map.json!`);
  }

  const modelPath = path.join(modelsDir, `${def.name}.model`);
  const m = ModelBuilder.load(templateModelPath);
  m.renameModel(def.name);

  // Common Sprite and Transform
  m.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", ruid, "string");
  m.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer5", "string");
  m.value("MOD.Core.SpriteRendererComponent", "OrderInLayer", 2, "int");
  m.value("MOD.Core.TransformComponent", "Scale", { x: def.scale, y: def.scale, z: 1 }, "vector3");

  // YSortSprite
  if (!m.hasComponent("script.YSortSprite")) {
    m.addComponent("script.YSortSprite");
  }
  m.value("script.YSortSprite", "Dynamic", false, "bool");
  m.value("script.YSortSprite", "IsUnit", false, "bool");
  m.value("script.YSortSprite", "SortYOffset", 0, "double");

  // TriggerComponent
  if (!m.hasComponent("MOD.Core.TriggerComponent")) {
    m.addComponent("MOD.Core.TriggerComponent");
  }
  const triggerW = (def.colW || 0.8) * 1.1;
  const triggerH = (def.colH || 0.4) * 1.3;
  m.value("MOD.Core.TriggerComponent", "BoxSize", { x: triggerW, y: triggerH }, "vector2");
  m.value("MOD.Core.TriggerComponent", "ColliderOffset", { x: 0, y: 0 }, "vector2");
  m.value("MOD.Core.TriggerComponent", "IsPassive", true, "bool");
  m.value("MOD.Core.TriggerComponent", "IsLegacy", false, "bool");

  if (def.isResource) {
    // Physics Collider
    if (!m.hasComponent("MOD.Core.PhysicsColliderComponent")) {
      m.addComponent("MOD.Core.PhysicsColliderComponent");
    }
    m.value("MOD.Core.PhysicsColliderComponent", "BoxSize", { x: def.colW || 0.8, y: def.colH || 0.4 }, "vector2");
    m.value("MOD.Core.PhysicsColliderComponent", "ColliderOffset", { x: 0, y: 0 }, "vector2");
    m.value("MOD.Core.PhysicsColliderComponent", "IsLegacy", false, "bool");

    // ResourceOccupiedArea
    if (!m.hasComponent("script.ResourceOccupiedArea")) {
      m.addComponent("script.ResourceOccupiedArea");
    }
    m.value("script.ResourceOccupiedArea", "OffsetXMin", 0, "double");
    m.value("script.ResourceOccupiedArea", "OffsetXMax", 1, "double");
    m.value("script.ResourceOccupiedArea", "OffsetYMin", 0, "double");
    m.value("script.ResourceOccupiedArea", "OffsetYMax", 1, "double");
    m.value("script.ResourceOccupiedArea", "Enable", true, "bool");

    // ResourceReaction
    if (!m.hasComponent("script.ResourceReaction")) {
      m.addComponent("script.ResourceReaction");
    }
    m.value("script.ResourceReaction", "DropItemName", def.drop || "Wood", "string");
    m.value("script.ResourceReaction", "DropMinCount", 1, "double");
    m.value("script.ResourceReaction", "DropMaxCount", 1, "double");
    m.value("script.ResourceReaction", "Enable", true, "bool");
  } else {
    // If not a resource, remove PhysicsCollider / Resource scripts to allow walking through decorations
    if (m.hasComponent("MOD.Core.PhysicsColliderComponent")) {
      m.removeComponent("MOD.Core.PhysicsColliderComponent");
    }
    if (m.hasComponent("script.ResourceOccupiedArea")) {
      m.removeComponent("script.ResourceOccupiedArea");
    }
    if (m.hasComponent("script.ResourceReaction")) {
      m.removeComponent("script.ResourceReaction");
    }
  }

  // Validate
  const errs = m.validate();
  if (errs.length > 0) {
    console.warn(`[WARN] Validation issues for ${def.name}:`, errs);
  }

  m.write(modelPath);
  console.log(`  -> Model created: ${def.name}.model (isResource: ${def.isResource})`);
  createdModels.push({ def, modelPath });
}

console.log(`[Step 2/2] Placing 27 models into town.map near (24, 24)...`);

const map = MapBuilder.read(townMapPath);

// Coordinates layout near (X: 24, Y: 24):
// Trees (3 rows x 6 cols)
// Row 1: Y = 28.0, X in [16.5, 19.5, 22.5, 25.5, 28.5, 31.5]
// Row 2: Y = 25.0, X in [16.5, 19.5, 22.5, 25.5, 28.5, 31.5]
// Row 3: Y = 22.0, X in [16.5, 19.5, 22.5, 25.5, 28.5, 31.5]
// Props (1 row x 9 cols)
// Row 4: Y = 19.5, X in [16.0, 18.0, 20.0, 22.0, 24.0, 26.0, 28.0, 30.0, 32.0]

const placements = [];

// Trees
const treeCols = [16.5, 19.5, 22.5, 25.5, 28.5, 31.5];
const treeRows = [28.0, 25.0, 22.0];

for (let i = 0; i < treeDefinitions.length; i++) {
  const rowIdx = Math.floor(i / 6);
  const colIdx = i % 6;
  const x = treeCols[colIdx];
  const y = treeRows[rowIdx];
  const def = treeDefinitions[i];
  placements.push({
    name: def.name,
    modelPath: path.join(modelsDir, `${def.name}.model`),
    pos: [x, y, 0]
  });
}

// Props
const propCols = [16.0, 18.0, 20.0, 22.0, 24.0, 26.0, 28.0, 30.0, 32.0];
const propY = 19.5;

for (let i = 0; i < propDefinitions.length; i++) {
  const x = propCols[i];
  const y = propY;
  const def = propDefinitions[i];
  placements.push({
    name: def.name,
    modelPath: path.join(modelsDir, `${def.name}.model`),
    pos: [x, y, 0]
  });
}

for (const p of placements) {
  if (map.find(p.name)) {
    map.remove(p.name);
  }
  map.placeModel(p.name, p.modelPath, { pos: p.pos });
  console.log(`  Placed ${p.name} at (${p.pos[0]}, ${p.pos[1]})`);
}

map.write(townMapPath);
console.log(`Successfully saved town.map with 27 models placed near (24, 24)!`);
