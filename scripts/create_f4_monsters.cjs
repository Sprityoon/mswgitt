"use strict";
const path = require("path");
const {
	ModelBuilder,
	vector2,
	vector3,
} = require(path.join(__dirname, "../.claude/skills/msw-general/scripts/model/msw_model_builder.cjs"));

const ROOT = path.join(__dirname, "..");
const MODELS = path.join(ROOT, "RootDesk/MyDesk/Monster/Models");
const src = (n) => path.join(MODELS, n + ".model");
const dst = (n) => path.join(MODELS, n + ".model");

// ---------------------------------------------------------------------------
// 1. JrYeti.model — 주니어 예티 (CONTACT)
// ---------------------------------------------------------------------------
const JR_YETI = {
	stand: "1975dd704eec461ab49bdeb0c11c54d9", // 61x57 / 11f
	move: "842a6865f7074f94ac4a190ed90e2e21",  // 47x41 / 3f
	attack: "f59ed8ac1cfa4aec918331209a15dc1b",// jump
	die: "13b9f2b2f7664cc5a08e663f2fe0502b",   // 56x43 / 5f
};

const jrYeti = ModelBuilder.load(src("Slime"));
jrYeti.renameModel("JrYeti", "jr_yeti");
jrYeti.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", JR_YETI.stand, "string");
jrYeti.value("MOD.Core.TransformComponent", "Scale", vector3(2.0, 2.0, 2.0), "vector3");
jrYeti.value("MOD.Core.MovementComponent", "InputSpeed", 2.6, "float");
jrYeti.value("MOD.Core.HitComponent", "BoxSize", vector2(1.0, 0.9), "vector2");
jrYeti.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.4), "vector2");
jrYeti.value("script.Monster", "MonsterId", "jr_yeti", "string");
jrYeti.value("script.Monster", "MaxHp", 260.0, "double");
jrYeti.value("script.Monster", "Defense", 24.0, "double");
jrYeti.value("script.Monster", "RespawnOn", false, "bool");
jrYeti.value("script.MonsterAI", "StandRUID", JR_YETI.stand, "string");
jrYeti.value("script.MonsterAI", "MoveRUID", JR_YETI.move, "string");
jrYeti.value("script.MonsterAI", "AttackRUID", JR_YETI.attack, "string");
jrYeti.value("script.MonsterAI", "DieRUID", JR_YETI.die, "string");
jrYeti.value("script.MonsterAI", "AttackType", "CONTACT", "string");
jrYeti.value("script.MonsterAI", "AttackWindup", 0.35, "double");
jrYeti.value("script.MonsterAI", "AttackCooldown", 1.4, "double");
jrYeti.value("script.MonsterAI", "DetectRange", 7.0, "double");
jrYeti.value("script.MonsterAI", "AttackRange", 1.0, "double");
jrYeti.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.2, "double");
jrYeti.value("script.MonsterMeleeAttack", "ContactDamage", 22.0, "double");
jrYeti.value("script.MonsterMeleeAttack", "TouchDamage", 7.0, "double");
jrYeti.write(dst("JrYeti"));

// ---------------------------------------------------------------------------
// 2. Yeti.model — 예티 (MELEE_WEAPON, 강력한 완력 강타)
// ---------------------------------------------------------------------------
const YETI = {
	stand: "2fa39477afb34d8cb6412b7fe5085f42", // 100x108 / 3f
	move: "02dfd5686d7042768adcea2d24c184b4",  // 110x107 / 4f
	attack: "a9e503154e3e4ad5ab0e9e7742dd53ec",// attack1 170x121 / 9f
	die: "5a328165fb9a4f47b3810c427b8edbd6",   // 146x79 / 7f
};

const yeti = ModelBuilder.load(src("Slime"));
yeti.renameModel("Yeti", "yeti");
yeti.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", YETI.stand, "string");
yeti.value("MOD.Core.TransformComponent", "Scale", vector3(2.2, 2.2, 2.2), "vector3");
yeti.value("MOD.Core.MovementComponent", "InputSpeed", 2.2, "float");
yeti.value("MOD.Core.HitComponent", "BoxSize", vector2(1.6, 1.6), "vector2");
yeti.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.7), "vector2");
yeti.value("script.Monster", "MonsterId", "yeti", "string");
yeti.value("script.Monster", "MaxHp", 420.0, "double");
yeti.value("script.Monster", "Defense", 30.0, "double");
yeti.value("script.Monster", "RespawnOn", false, "bool");
yeti.value("script.MonsterAI", "StandRUID", YETI.stand, "string");
yeti.value("script.MonsterAI", "MoveRUID", YETI.move, "string");
yeti.value("script.MonsterAI", "AttackRUID", YETI.attack, "string");
yeti.value("script.MonsterAI", "DieRUID", YETI.die, "string");
yeti.value("script.MonsterAI", "AttackType", "MELEE_WEAPON", "string");
yeti.value("script.MonsterAI", "AttackWindup", 0.6, "double");
yeti.value("script.MonsterAI", "AttackCooldown", 1.8, "double");
yeti.value("script.MonsterAI", "DetectRange", 8.0, "double");
yeti.value("script.MonsterAI", "AttackRange", 1.8, "double");
yeti.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.8, "double");
yeti.value("script.MonsterMeleeAttack", "ContactDamage", 34.0, "double");
yeti.value("script.MonsterMeleeAttack", "TouchDamage", 10.0, "double");
yeti.write(dst("Yeti"));

// ---------------------------------------------------------------------------
// 3. Pepe.model — 페페 (CONTACT, 무리 이동)
// ---------------------------------------------------------------------------
const PEPE = {
	stand: "48dbd76df3fe4ba5a3c1d2ae18a6fc49", // 64x56 / 7f
	move: "810a146dc54c4ce9a9fad09112c22655",  // 71x60 / 3f
	die: "facc93ada5074221a4661f20d34c101b",   // 70x80 / 4f
};
PEPE.attack = PEPE.move;

const pepe = ModelBuilder.load(src("Slime"));
pepe.renameModel("Pepe", "pepe");
pepe.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", PEPE.stand, "string");
pepe.value("MOD.Core.TransformComponent", "Scale", vector3(2.0, 2.0, 2.0), "vector3");
pepe.value("MOD.Core.MovementComponent", "InputSpeed", 2.8, "float");
pepe.value("MOD.Core.HitComponent", "BoxSize", vector2(1.1, 0.9), "vector2");
pepe.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.4), "vector2");
pepe.value("script.Monster", "MonsterId", "pepe", "string");
pepe.value("script.Monster", "MaxHp", 220.0, "double");
pepe.value("script.Monster", "Defense", 20.0, "double");
pepe.value("script.Monster", "RespawnOn", false, "bool");
pepe.value("script.MonsterAI", "StandRUID", PEPE.stand, "string");
pepe.value("script.MonsterAI", "MoveRUID", PEPE.move, "string");
pepe.value("script.MonsterAI", "AttackRUID", PEPE.attack, "string");
pepe.value("script.MonsterAI", "DieRUID", PEPE.die, "string");
pepe.value("script.MonsterAI", "AttackType", "CONTACT", "string");
pepe.value("script.MonsterAI", "AttackWindup", 0.3, "double");
pepe.value("script.MonsterAI", "AttackCooldown", 1.2, "double");
pepe.value("script.MonsterAI", "DetectRange", 6.0, "double");
pepe.value("script.MonsterAI", "AttackRange", 1.0, "double");
pepe.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.0, "double");
pepe.value("script.MonsterMeleeAttack", "ContactDamage", 18.0, "double");
pepe.value("script.MonsterMeleeAttack", "TouchDamage", 6.0, "double");
pepe.write(dst("Pepe"));

// ---------------------------------------------------------------------------
// 4. WhiteFang.model — 화이트팽 (CHARGE, 도약 돌진)
// ---------------------------------------------------------------------------
const WHITE_FANG = {
	stand: "aaa3b506804d4418b025da47dbb65b3f", // 126x56 / 4f
	move: "a669487dc36d43df99ecef932ccf6f00",  // 111x57 / 3f
	attack: "e7d12e44869040ed8d6cd4c25c41d543",// attack1 106x60 / 8f
	die: "ec707ca9121f4e4cb536c37a29084760",   // 108x38 / 4f
};

const whiteFang = ModelBuilder.load(src("Boar"));
whiteFang.renameModel("WhiteFang", "white_fang");
whiteFang.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", WHITE_FANG.stand, "string");
whiteFang.value("MOD.Core.TransformComponent", "Scale", vector3(2.2, 2.2, 2.2), "vector3");
whiteFang.value("MOD.Core.MovementComponent", "InputSpeed", 3.4, "float");
whiteFang.value("MOD.Core.HitComponent", "BoxSize", vector2(1.8, 0.9), "vector2");
whiteFang.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.4), "vector2");
whiteFang.value("script.Monster", "MonsterId", "white_fang", "string");
whiteFang.value("script.Monster", "MaxHp", 380.0, "double");
whiteFang.value("script.Monster", "Defense", 26.0, "double");
whiteFang.value("script.Monster", "RespawnOn", false, "bool");
whiteFang.value("script.MonsterAI", "StandRUID", WHITE_FANG.stand, "string");
whiteFang.value("script.MonsterAI", "MoveRUID", WHITE_FANG.move, "string");
whiteFang.value("script.MonsterAI", "AttackRUID", WHITE_FANG.attack, "string");
whiteFang.value("script.MonsterAI", "DieRUID", WHITE_FANG.die, "string");
whiteFang.value("script.MonsterAI", "AttackType", "CHARGE", "string");
whiteFang.value("script.MonsterAI", "AttackWindup", 0.5, "double");
whiteFang.value("script.MonsterAI", "AttackCooldown", 2.2, "double");
whiteFang.value("script.MonsterAI", "DetectRange", 10.0, "double");
whiteFang.value("script.MonsterAI", "AttackRange", 3.5, "double");
whiteFang.value("script.MonsterAI", "ChargeSpeedMultiplier", 3.8, "double");
whiteFang.value("script.MonsterAI", "ChargeMaxDuration", 2.0, "double");
whiteFang.value("script.MonsterAI", "ChargeDecelDuration", 0.45, "double");
whiteFang.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.2, "double");
whiteFang.value("script.MonsterMeleeAttack", "ContactDamage", 30.0, "double");
whiteFang.value("script.MonsterMeleeAttack", "TouchDamage", 9.0, "double");
whiteFang.write(dst("WhiteFang"));

// ---------------------------------------------------------------------------
// 5. Snowman.model — 스노우맨 (B4 보스, LEAP 대형 강타)
// ---------------------------------------------------------------------------
const SNOWMAN = {
	stand: "bf93196a2da842eaaf93c944453416d8", // 205x176 / 6f
	move: "881ed191bfad4861b63aa94d2a9a2bb8",  // 192x186 / 8f
	attack: "022330aea10449ac970a86ee17db8709",// attack1 211x184 / 29f
	die: "23d06abe8f804666beaee7246a586f05",   // 224x158 / 12f
};

const snowman = ModelBuilder.load(src("SlimeKing"));
snowman.renameModel("Snowman", "snowman");
snowman.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", SNOWMAN.stand, "string");
snowman.value("MOD.Core.TransformComponent", "Scale", vector3(2.5, 2.5, 2.5), "vector3");
snowman.value("MOD.Core.MovementComponent", "InputSpeed", 2.2, "float");
snowman.value("MOD.Core.HitComponent", "BoxSize", vector2(2.5, 2.4), "vector2");
snowman.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 1.1), "vector2");
snowman.value("script.Monster", "MonsterId", "snowman", "string");
snowman.value("script.Monster", "MaxHp", 5200.0, "double");
snowman.value("script.Monster", "Defense", 34.0, "double");
snowman.value("script.Monster", "IsBoss", true, "bool");
snowman.value("script.Monster", "BossDropItem", "snow_crystal", "string");
snowman.value("script.Monster", "BossDropMin", 8, "int");
snowman.value("script.Monster", "BossDropMax", 16, "int");
snowman.value("script.Monster", "UnlockWaypointId", "", "string");
snowman.value("script.Monster", "UnlockWaypointName", "", "string");
snowman.value("script.MonsterAI", "StandRUID", SNOWMAN.stand, "string");
snowman.value("script.MonsterAI", "MoveRUID", SNOWMAN.move, "string");
snowman.value("script.MonsterAI", "AttackRUID", SNOWMAN.attack, "string");
snowman.value("script.MonsterAI", "DieRUID", SNOWMAN.die, "string");
snowman.value("script.MonsterAI", "AttackType", "LEAP", "string");
snowman.value("script.MonsterAI", "AttackWindup", 0.9, "double");
snowman.value("script.MonsterAI", "AttackCooldown", 3.2, "double");
snowman.value("script.MonsterAI", "DetectRange", 12.0, "double");
snowman.value("script.MonsterAI", "SlamDamage", 48.0, "double");
snowman.value("script.MonsterAI", "SlamRadius", 3.2, "double");
snowman.value("script.MonsterAI", "TelegraphOn", true, "bool");
snowman.value("script.MonsterAI", "TelegraphModelId", "AttackTelegraph", "string");
snowman.value("script.MonsterAI", "MinionModelId", "jr_yeti", "string");
snowman.value("script.MonsterAI", "MinionSummonInterval", 30.0, "double");
snowman.value("script.MonsterAI", "MinionSummonCount", 2, "int");
snowman.value("script.MonsterMeleeAttack", "AttackBoxSize", 3.2, "double");
snowman.value("script.MonsterMeleeAttack", "ContactDamage", 48.0, "double");
snowman.value("script.MonsterMeleeAttack", "TouchDamage", 12.0, "double");
snowman.write(dst("Snowman"));

console.log("Successfully created F4 snowfield monster models!");
