const fs = require("fs");
const path = require("path");
const { ModelBuilder } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");

/**
 * 겨울 시즌 나무(18종) 및 소품(9종) .model 일괄 생성 스크립트
 * 
 * [사용법]
 * 1. MSW Maker에서 docs/design/art/trees/winter/trees 및 props 폴더의 이미지를 [내 리소스] -> [가져오기]로 임포트합니다.
 * 2. 각 스프라이트의 피벗을 Bottom Center (하단 중앙)으로 맞춥니다.
 * 3. 발급된 RUID를 아래 ruidMap 객체에 입력하거나 scratch/winter_sprites_ruid_map.json 에 저장합니다.
 * 4. node scripts/create_winter_trees_and_props.cjs 실행 -> 27종 모델 자동 완성!
 */

const modelsDir = path.join(__dirname, "..", "RootDesk", "MyDesk", "MapObjects", "Models");
const templateModelPath = path.join(modelsDir, "Tree_Basic.model");

// RUID 맵 경로 (외부 JSON 또는 인라인)
const ruidMapPath = path.join(__dirname, "..", "scratch", "winter_sprites_ruid_map.json");
let ruidMap = {};
if (fs.existsSync(ruidMapPath)) {
  try {
    ruidMap = JSON.parse(fs.readFileSync(ruidMapPath, "utf8"));
  } catch (e) {
    console.warn("[Warn] Failed to parse winter_sprites_ruid_map.json, using fallback.");
  }
}

const treeDefinitions = [
  // Row 1 (Trees)
  { id: "tree_winter_01_basic", name: "Tree_Winter_Basic", korName: "기본 나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_02_tall", name: "Tree_Winter_Tall", korName: "키 큰 나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_03_tiered", name: "Tree_Winter_Tiered", korName: "다층 나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_04_flower", name: "Tree_Winter_Flower", korName: "꽃나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_05_cherry_blossom", name: "Tree_Winter_CherryBlossom", korName: "벚꽃나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_06_autumn_maple", name: "Tree_Winter_AutumnMaple", korName: "단풍나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },

  // Row 2 (Trees)
  { id: "tree_winter_07_pine", name: "Tree_Winter_Pine", korName: "소나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_08_fir", name: "Tree_Winter_Fir", korName: "전나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.7, colH: 0.4 },
  { id: "tree_winter_09_wide", name: "Tree_Winter_Wide", korName: "넓은 나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 1.2, colH: 0.4 },
  { id: "tree_winter_10_willow", name: "Tree_Winter_Willow", korName: "버드나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_11_birch", name: "Tree_Winter_Birch", korName: "자작나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_12_dark", name: "Tree_Winter_Dark", korName: "어두운 나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },

  // Row 3 (Trees)
  { id: "tree_winter_13_fruit", name: "Tree_Winter_Fruit", korName: "열매나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_14_apple", name: "Tree_Winter_Apple", korName: "사과나무(겨울)", isResource: true, drop: "Apple", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_15_palm", name: "Tree_Winter_Palm", korName: "야자나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_16_round", name: "Tree_Winter_Round", korName: "둥근 나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.8, colH: 0.4 },
  { id: "tree_winter_17_twin", name: "Tree_Winter_Twin", korName: "쌍둥이 나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 1.1, colH: 0.4 },
  { id: "tree_winter_18_small", name: "Tree_Winter_Small", korName: "작은 나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.6, colH: 0.3 }
];

const propDefinitions = [
  // Row 4 (Props)
  { id: "prop_winter_01_stump", name: "Deco_Winter_TreeStump", korName: "나무 그루터기(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.6, colH: 0.3 },
  { id: "prop_winter_02_fallen_log", name: "Deco_Winter_FallenLog", korName: "쓰러진 나무(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.9, colH: 0.4 },
  { id: "prop_winter_03_rock", name: "Deco_Winter_Rock", korName: "바위(겨울)", isResource: true, drop: "Stone", scale: 1.5, colW: 0.9, colH: 0.4 },
  { id: "prop_winter_04_bush", name: "Deco_Winter_Bush", korName: "나무 덤불(겨울)", isResource: false, scale: 1.5 },
  { id: "prop_winter_05_flower_grass", name: "Deco_Winter_FlowerGrass", korName: "꽃풀(겨울)", isResource: false, scale: 1.5 },
  { id: "prop_winter_06_tall_grass", name: "Deco_Winter_TallGrass", korName: "풀(겨울)", isResource: false, scale: 1.5 },
  { id: "prop_winter_07_small_flower", name: "Deco_Winter_SmallFlower", korName: "작은 꽃(겨울)", isResource: false, scale: 1.5 },
  { id: "prop_winter_08_vine", name: "Deco_Winter_Vine", korName: "덩굴(겨울)", isResource: true, drop: "Wood", scale: 1.5, colW: 0.5, colH: 0.5 },
  { id: "prop_winter_09_fallen_leaves", name: "Deco_Winter_FallenLeaves", korName: "나뭇잎(겨울)", isResource: false, scale: 1.5 }
];

const allDefinitions = [...treeDefinitions, ...propDefinitions];

console.log(`[Winter Models Builder] Total ${allDefinitions.length} definitions ready.`);

let createdCount = 0;
let missingRuidCount = 0;

for (const def of allDefinitions) {
  const ruid = ruidMap[def.id] || "";
  if (!ruid) {
    missingRuidCount++;
  }

  const modelPath = path.join(modelsDir, `${def.name}.model`);
  let m;
  if (fs.existsSync(modelPath)) {
    m = ModelBuilder.load(modelPath);
  } else {
    m = ModelBuilder.load(templateModelPath);
    m.renameModel(def.name);
  }

  if (ruid) {
    m.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", ruid, "string");
  }
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
    if (!m.hasComponent("MOD.Core.PhysicsColliderComponent")) {
      m.addComponent("MOD.Core.PhysicsColliderComponent");
    }
    m.value("MOD.Core.PhysicsColliderComponent", "BoxSize", { x: def.colW || 0.8, y: def.colH || 0.4 }, "vector2");
    m.value("MOD.Core.PhysicsColliderComponent", "ColliderOffset", { x: 0, y: 0 }, "vector2");

    if (!m.hasComponent("script.ResourceOccupiedArea")) {
      m.addComponent("script.ResourceOccupiedArea");
    }
    m.value("script.ResourceOccupiedArea", "CustomWidth", def.colW >= 1.0 ? 2 : 1, "int");
    m.value("script.ResourceOccupiedArea", "CustomHeight", 1, "int");

    if (!m.hasComponent("script.ResourceReaction")) {
      m.addComponent("script.ResourceReaction");
    }
    m.value("script.ResourceReaction", "ResourceType", def.drop, "string");
  } else {
    // Pure decoration prop
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

  const fallbackRuid = "819b6951ca4842a3b99901d75de67768"; // Fallback until Maker import
  const finalRuid = ruid || fallbackRuid;
  m.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", finalRuid, "string");

  m.write(modelPath, { ensureSpriteRuid: false });
  createdCount++;
  console.log(`[OK] ${def.name}.model (RUID: ${ruid ? ruid : "(Temporary Fallback - Pending Maker Import)"})`);
}

console.log(`\nFinished: ${createdCount} models generated. (Missing RUIDs: ${missingRuidCount})`);
