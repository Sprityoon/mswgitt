"use strict";

const path = require("path");
const { ModelBuilder } = require(path.resolve(__dirname, "../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs"));

const rootDir = path.resolve(__dirname, "..");

const models = [
  { relPath: "RootDesk/MyDesk/NPC/Models/Merchant.model", dynamic: false },
  { relPath: "RootDesk/MyDesk/NPC/Models/Villager_Elder.model", dynamic: false },
  { relPath: "RootDesk/MyDesk/NPC/Models/Villager_Fisher.model", dynamic: false },
  { relPath: "RootDesk/MyDesk/NPC/Models/Villager_ResidentA.model", dynamic: false },
  { relPath: "RootDesk/MyDesk/NPC/Models/Villager_ResidentB.model", dynamic: false },
  { relPath: "RootDesk/MyDesk/NPC/Models/Villager_ResidentC.model", dynamic: false },
  { relPath: "RootDesk/MyDesk/NPC/Models/Villager_ResidentD.model", dynamic: false },
  { relPath: "RootDesk/MyDesk/MapObjects/Models/Animal_Cat.model", dynamic: true },
  { relPath: "RootDesk/MyDesk/Furniture/Models/FishingSpot_Pond.model", dynamic: false, setSortingLayer: true },
];

for (const m of models) {
  const fullPath = path.resolve(rootDir, m.relPath);
  console.log("Patching model:", m.relPath);
  const mb = ModelBuilder.load(fullPath);
  mb.addComponent("script.YSortSprite");
  mb.value("script.YSortSprite", "Dynamic", m.dynamic, "bool");
  if (m.setSortingLayer) {
    mb.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer5", "string");
  }
  mb.write(fullPath);
}

console.log("All T89 models patched successfully.");
