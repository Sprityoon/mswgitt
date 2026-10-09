"use strict";

const fs = require("fs");
const path = require("path");
const { ModelBuilder } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");

const modelsDir = path.resolve(__dirname, "../RootDesk/MyDesk/MapObjects/Models");
const treeTemplatePath = path.join(modelsDir, "Tree_Basic.model");
const decoTemplatePath = path.join(modelsDir, "Deco_DryBush.model");

const desertDefinitions = [
  {
    id: "tree_desert_deadtree",
    name: "Tree_Desert_DeadTree",
    ruid: "da60b97c82664ff5a8cf7fb237e0b1b7",
    scale: 0.5,
    isTree: true,
    colW: 0.8,
    colH: 0.4
  },
  {
    id: "deco_desert_yuccaflower",
    name: "Deco_Desert_YuccaFlower",
    ruid: "5327537b4e8c43d0b008da6227e4a727",
    scale: 0.5,
    isTree: false,
    colW: 0.5,
    colH: 0.3
  },
  {
    id: "deco_desert_animalbone",
    name: "Deco_Desert_AnimalBone",
    ruid: "378103312bc742109fa01ff7b098471d",
    scale: 0.5,
    isTree: false,
    colW: 0.6,
    colH: 0.3
  }
];

console.log("[Desert Models Builder] Generating 3 desert models...");

for (const def of desertDefinitions) {
  const modelPath = path.join(modelsDir, `${def.name}.model`);
  let m;

  if (fs.existsSync(modelPath)) {
    m = ModelBuilder.load(modelPath);
  } else {
    const baseTemplate = def.isTree ? treeTemplatePath : decoTemplatePath;
    m = ModelBuilder.load(baseTemplate);
    m.renameModel(def.name);
  }

  // SpriteRendererComponent
  m.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", def.ruid, "string");
  m.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer5", "string");
  m.value("MOD.Core.SpriteRendererComponent", "OrderInLayer", 2, "int");

  // TransformComponent
  m.value("MOD.Core.TransformComponent", "Scale", { x: def.scale, y: def.scale, z: 1 }, "vector3");

  // YSortSprite
  if (!m.hasComponent("script.YSortSprite")) {
    m.addComponent("script.YSortSprite");
  }

  // Colliders
  if (def.isTree) {
    if (m.hasComponent("MOD.Core.PhysicsColliderComponent")) {
      m.value("MOD.Core.PhysicsColliderComponent", "BoxSize", { x: def.colW, y: def.colH }, "vector2");
      m.value("MOD.Core.PhysicsColliderComponent", "ColliderOffset", { x: 0, y: 0 }, "vector2");
    }
    if (m.hasComponent("MOD.Core.TriggerComponent")) {
      m.value("MOD.Core.TriggerComponent", "BoxSize", { x: def.colW + 0.1, y: def.colH + 0.1 }, "vector2");
      m.value("MOD.Core.TriggerComponent", "ColliderOffset", { x: 0, y: 0 }, "vector2");
    }
    if (m.hasComponent("script.ResourceReaction")) {
      m.value("script.ResourceReaction", "DropItemName", "Wood", "string");
      m.value("script.ResourceReaction", "DropMinCount", 1, "int");
      m.value("script.ResourceReaction", "DropMaxCount", 1, "int");
    }
  } else {
    // For deco props: add physics collider for solid presence
    if (!m.hasComponent("MOD.Core.PhysicsColliderComponent")) {
      m.addComponent("MOD.Core.PhysicsColliderComponent");
    }
    m.value("MOD.Core.PhysicsColliderComponent", "BoxSize", { x: def.colW, y: def.colH }, "vector2");
    m.value("MOD.Core.PhysicsColliderComponent", "ColliderOffset", { x: 0, y: 0 }, "vector2");

    if (m.hasComponent("MOD.Core.TriggerComponent")) {
      m.value("MOD.Core.TriggerComponent", "BoxSize", { x: def.colW + 0.1, y: def.colH + 0.1 }, "vector2");
      m.value("MOD.Core.TriggerComponent", "ColliderOffset", { x: 0, y: 0 }, "vector2");
    }
  }

  m.write(modelPath);
  console.log(`[OK] Created/Updated ${def.name}.model (RUID: ${def.ruid})`);
}

console.log("[Desert Models Builder] Done.");
