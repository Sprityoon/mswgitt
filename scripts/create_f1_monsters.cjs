"use strict";
const path = require("path");
const { ModelBuilder, vector2, vector3 } = require(path.join(__dirname, "../.claude/skills/msw-general/scripts/model/msw_model_builder.cjs"));

const ROOT = path.join(__dirname, "..");
const SLIME_MODEL = path.join(ROOT, "RootDesk/MyDesk/Monster/Models/Slime.model");
const RIBBON_PIG_MODEL = path.join(ROOT, "RootDesk/MyDesk/Monster/Models/RibbonPig.model");
const ORANGE_MUSHROOM_MODEL = path.join(ROOT, "RootDesk/MyDesk/Monster/Models/OrangeMushroom.model");

// 1. RibbonPig.model
const pig = ModelBuilder.load(SLIME_MODEL);
pig.renameModel("RibbonPig", "ribbon_pig");

// Sprite & Visuals
pig.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", "6a699b8c31b94474bb795c7394c3af3b", "string");
pig.value("MOD.Core.TransformComponent", "Scale", vector3(2.0, 2.0, 2.0), "vector3");
pig.value("MOD.Core.MovementComponent", "InputSpeed", 3.0, "float");

// Hit Collider
pig.value("MOD.Core.HitComponent", "BoxSize", vector2(1.1, 0.8), "vector2");
pig.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.3), "vector2");

// Monster Stats
pig.value("script.Monster", "MonsterId", "ribbon_pig", "string");
pig.value("script.Monster", "MaxHp", 26, "double");
pig.value("script.Monster", "Defense", 4, "double");
pig.value("script.Monster", "RespawnOn", false, "bool");

// Monster AI & Clips
pig.value("script.MonsterAI", "StandRUID", "6a699b8c31b94474bb795c7394c3af3b", "string");
pig.value("script.MonsterAI", "MoveRUID", "efd4d44e0da7496bac4c350def33a108", "string");
pig.value("script.MonsterAI", "AttackRUID", "a09f56642db6409b8a41bb97106425db", "string");
pig.value("script.MonsterAI", "DieRUID", "77f8f34df8cc4ba6ae188fd2f1b28bc4", "string");
pig.value("script.MonsterAI", "AttackType", "CONTACT", "string");
pig.value("script.MonsterAI", "AttackWindup", 0.30, "double");
pig.value("script.MonsterAI", "AttackCooldown", 1.1, "double");
pig.value("script.MonsterAI", "DetectRange", 6.5, "double");
pig.value("script.MonsterAI", "AttackRange", 1.0, "double");

// Melee Attack
pig.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.0, "double");
pig.value("script.MonsterMeleeAttack", "ContactDamage", 4.0, "double");
pig.value("script.MonsterMeleeAttack", "TouchDamage", 2.0, "double");

pig.write(RIBBON_PIG_MODEL);

// 2. OrangeMushroom.model
const mushroom = ModelBuilder.load(SLIME_MODEL);
mushroom.renameModel("OrangeMushroom", "orange_mushroom");

// Sprite & Visuals
mushroom.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", "a95cfed2c8fe4d2cb64cbb62db051f92", "string");
mushroom.value("MOD.Core.TransformComponent", "Scale", vector3(2.2, 2.2, 2.2), "vector3");
mushroom.value("MOD.Core.MovementComponent", "InputSpeed", 2.0, "float");

// Hit Collider
mushroom.value("MOD.Core.HitComponent", "BoxSize", vector2(1.1, 0.9), "vector2");
mushroom.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.35), "vector2");

// Monster Stats
mushroom.value("script.Monster", "MonsterId", "orange_mushroom", "string");
mushroom.value("script.Monster", "MaxHp", 40, "double");
mushroom.value("script.Monster", "Defense", 7, "double");
mushroom.value("script.Monster", "RespawnOn", false, "bool");

// Monster AI & Clips
mushroom.value("script.MonsterAI", "StandRUID", "a95cfed2c8fe4d2cb64cbb62db051f92", "string");
mushroom.value("script.MonsterAI", "MoveRUID", "8257566e41aa4234929e81c6c2dab2e4", "string");
mushroom.value("script.MonsterAI", "AttackRUID", "6df12df0c9ce4caea61385606a4d40d3", "string");
mushroom.value("script.MonsterAI", "DieRUID", "dddbe2f162184ec89add7440da56eb75", "string");
mushroom.value("script.MonsterAI", "AttackType", "CONTACT", "string");
mushroom.value("script.MonsterAI", "AttackWindup", 0.55, "double");
mushroom.value("script.MonsterAI", "AttackCooldown", 1.7, "double");
mushroom.value("script.MonsterAI", "DetectRange", 5.0, "double");
mushroom.value("script.MonsterAI", "AttackRange", 1.1, "double");

// Melee Attack
mushroom.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.4, "double");
mushroom.value("script.MonsterMeleeAttack", "ContactDamage", 6.0, "double");
mushroom.value("script.MonsterMeleeAttack", "TouchDamage", 3.0, "double");

mushroom.write(ORANGE_MUSHROOM_MODEL);

console.log("Successfully created RibbonPig.model and OrangeMushroom.model!");
