"use strict";
// F2 바위 지대(rocky) 몬스터 모델 3종 생성 스크립트.
//
//   Stump.model      (stump)       <- Slime.model     기반 · CONTACT
//   IronHog.model    (iron_hog)    <- Boar.model      기반 · CHARGE
//   StoneGolem.model (stone_golem) <- SlimeKing.model 기반 · LEAP + AttackTelegraph 보스
//
// 출처: docs/design/story/hunting-grounds-ruid-index.md §2 (RUID·스탯)
//       docs/design/story/hunting-grounds-ecosystem-plan.md §2.2 (라인업·보스 기획)
//
// 값은 전부 모델 프로퍼티(= 데이터 주도). MonsterAI/Monster/MonsterMeleeAttack 는
// 기존 스크립트를 그대로 재사용하며 신규 .mlua 는 없다.
//
// 콜라이더 규약: HitComponent.BoxSize/ColliderOffset 은 Transform.Scale 이 곱해진 값이
// 실제 판정이다(함정 규칙 14). 아래 BoxSize 는 스프라이트 px/100 기준 × 기존 몹과 같은
// 여유 배율(슬라임·리본돼지 선례 ≈1.55~1.6배)로 잡았다.
//
// 좌우 반전: MonsterAI:Face() 는 SpriteRendererComponent.FlipX 를 쓴다(MonsterAI.mlua:1555).
// 따라서 좌향 작화 mob 리소스라도 모델에서 Scale.x 를 손볼 필요가 없다.

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
// 1. Stump.model — 스텀프 (CONTACT · 느리고 단단함)
// ---------------------------------------------------------------------------
const STUMP = {
	stand: "cf2a470436cd4b2aa265648e15198c45", // stand  64x52 /1f
	move: "d5de0c972d044d3cad5d0ecb7d8c96e7", // move   65x54 /4f
	die: "61a099877bda46309d038afe28acf9f0", // die1   63x52 /3f
};
// 팩 mob/0130100.img 에는 attack 클립이 없다 → move 재사용 (색인 §0 규칙 5).
STUMP.attack = STUMP.move;

const stump = ModelBuilder.load(src("Slime"));
stump.renameModel("Stump", "stump");

// Sprite & Visuals
stump.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", STUMP.stand, "string");
stump.value("MOD.Core.TransformComponent", "Scale", vector3(2.0, 2.0, 2.0), "vector3");
stump.value("MOD.Core.MovementComponent", "InputSpeed", 1.45, "float"); // 슬라임(2.4) 대비 0.6배

// Hit Collider (스프라이트 64x52 기준)
stump.value("MOD.Core.HitComponent", "BoxSize", vector2(1.0, 0.82), "vector2");
stump.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.36), "vector2");

// Monster Stats
stump.value("script.Monster", "MonsterId", "stump", "string");
stump.value("script.Monster", "MaxHp", 70, "double");
stump.value("script.Monster", "Defense", 14, "double"); // 기획서 "높은 방어력"
stump.value("script.Monster", "RespawnOn", false, "bool");

// Monster AI & Clips
stump.value("script.MonsterAI", "StandRUID", STUMP.stand, "string");
stump.value("script.MonsterAI", "MoveRUID", STUMP.move, "string");
stump.value("script.MonsterAI", "AttackRUID", STUMP.attack, "string");
stump.value("script.MonsterAI", "DieRUID", STUMP.die, "string");
stump.value("script.MonsterAI", "AttackType", "CONTACT", "string");
stump.value("script.MonsterAI", "DetectRange", 5.0, "double");
stump.value("script.MonsterAI", "AttackRange", 1.2, "double");
stump.value("script.MonsterAI", "StopDistance", 0.9, "double");
stump.value("script.MonsterAI", "AttackWindup", 0.6, "double");
stump.value("script.MonsterAI", "AttackCooldown", 2.0, "double");
stump.value("script.MonsterAI", "LeashRange", 12.0, "double");

// Melee Attack
stump.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.4, "double");
stump.value("script.MonsterMeleeAttack", "ContactDamage", 8.0, "double");
stump.value("script.MonsterMeleeAttack", "TouchDamage", 3.0, "double");

stump.write(dst("Stump"));

// ---------------------------------------------------------------------------
// 2. IronHog.model — 아이언호그 (CHARGE · 빠른 돌진)
// ---------------------------------------------------------------------------
const IRON_HOG = {
	stand: "eadfe08070d343a9afafe0fd6290f1c6", // stand  68x48 /3f
	move: "c3a9242a15e949e29f7d552ed551ca06", // move   68x48 /3f
	attack: "8e66814da53d4bb6a6ad1f064c8738f4", // skill1 77x46 /9f — 돌진 모션
	die: "af01ec8b8d19418e87158d5d596edbeb", // die1   72x54 /2f
};

const ironHog = ModelBuilder.load(src("Boar"));
ironHog.renameModel("IronHog", "iron_hog");

// Sprite & Visuals
ironHog.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", IRON_HOG.stand, "string");
ironHog.value("MOD.Core.TransformComponent", "Scale", vector3(2.5, 2.5, 2.0), "vector3");
ironHog.value("MOD.Core.MovementComponent", "InputSpeed", 3.4, "float"); // 슬라임 대비 1.4배

// Hit Collider (스프라이트 68x48 기준)
ironHog.value("MOD.Core.HitComponent", "BoxSize", vector2(1.06, 0.75), "vector2");
ironHog.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.33), "vector2");

// Monster Stats
ironHog.value("script.Monster", "MonsterId", "iron_hog", "string");
ironHog.value("script.Monster", "MaxHp", 85, "double");
ironHog.value("script.Monster", "Defense", 10, "double");
ironHog.value("script.Monster", "RespawnOn", false, "bool");

// Monster AI & Clips
ironHog.value("script.MonsterAI", "StandRUID", IRON_HOG.stand, "string");
ironHog.value("script.MonsterAI", "MoveRUID", IRON_HOG.move, "string");
ironHog.value("script.MonsterAI", "AttackRUID", IRON_HOG.attack, "string");
ironHog.value("script.MonsterAI", "DieRUID", IRON_HOG.die, "string");
ironHog.value("script.MonsterAI", "AttackType", "CHARGE", "string");
ironHog.value("script.MonsterAI", "DetectRange", 8.0, "double");
ironHog.value("script.MonsterAI", "AttackRange", 3.4, "double");
ironHog.value("script.MonsterAI", "AttackWindup", 0.7, "double");
ironHog.value("script.MonsterAI", "AttackCooldown", 2.4, "double");
ironHog.value("script.MonsterAI", "LeashRange", 16.0, "double");
// CHARGE 전용
ironHog.value("script.MonsterAI", "ChargeSpeedMultiplier", 3.6, "double");
ironHog.value("script.MonsterAI", "ChargeMaxDuration", 2.2, "double");
ironHog.value("script.MonsterAI", "ChargeDecelDuration", 0.45, "double");
// ⚠ 지면 예고 장판(TelegraphModelId)은 MonsterAI 가 LEAP 진입 시에만 스폰한다.
//    CHARGE 의 예고는 TelegraphOn 기반 주황 틴트뿐이므로 여기엔 설정하지 않는다.

// Melee Attack (CHARGE 는 DoChargeSweep 을 쓰지만 ContactDamage 를 공유한다)
ironHog.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.6, "double");
ironHog.value("script.MonsterMeleeAttack", "ContactDamage", 12.0, "double");
ironHog.value("script.MonsterMeleeAttack", "TouchDamage", 4.0, "double");

ironHog.write(dst("IronHog"));

// ---------------------------------------------------------------------------
// 3. StoneGolem.model — 스톤골렘 B2 보스 (LEAP + AttackTelegraph)
// ---------------------------------------------------------------------------
const GOLEM = {
	stand: "23761b84fca14bbfa671436791e4e0bb", // stand  179x159 /3f
	move: "736ecda03d4444dea5f9089c02c54eb2", // move   176x158 /4f
	attack: "28e55e44b6e34646b37f2fafef14a093", // skill1 176x156 /10f — 내려찍기
	die: "871de25edc28418c8fbfef5ea416f2d4", // die1   217x135 /7f
};

const golem = ModelBuilder.load(src("SlimeKing"));
golem.renameModel("StoneGolem", "stone_golem");

// Sprite & Visuals
golem.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", GOLEM.stand, "string");
golem.value("MOD.Core.TransformComponent", "Scale", vector3(2.8, 2.8, 2.0), "vector3");
golem.value("MOD.Core.MovementComponent", "InputSpeed", 1.7, "float"); // 슬라임 대비 0.7배

// Hit Collider — 보스는 스프라이트 실루엣과 1:1 (슬라임킹 선례). 179x159 px.
golem.value("MOD.Core.HitComponent", "BoxSize", vector2(1.79, 1.55), "vector2");
golem.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.7), "vector2");

// Monster Stats / Boss config
golem.value("script.Monster", "MonsterId", "stone_golem", "string");
golem.value("script.Monster", "MaxHp", 1400, "double");
golem.value("script.Monster", "Defense", 22, "double");
golem.value("script.Monster", "IsBoss", true, "bool");
golem.value("script.Monster", "RespawnOn", true, "bool");
golem.value("script.Monster", "RespawnDelay", 30, "double");
golem.value("script.Monster", "BossDropItem", "iron_ore", "string");
golem.value("script.Monster", "BossDropMin", 5, "double");
golem.value("script.Monster", "BossDropMax", 10, "double");
// B2 격파 시 F3 모래 언덕(hunt03) 웨이포인트 개방 — PortalDestinationDataSet 의 DestinationId.
golem.value("script.Monster", "UnlockWaypointId", "hunt03", "string");
golem.value("script.Monster", "UnlockWaypointName", "사냥터 3구역", "string");

// Monster AI & Clips
golem.value("script.MonsterAI", "StandRUID", GOLEM.stand, "string");
golem.value("script.MonsterAI", "MoveRUID", GOLEM.move, "string");
golem.value("script.MonsterAI", "AttackRUID", GOLEM.attack, "string");
golem.value("script.MonsterAI", "DieRUID", GOLEM.die, "string");

// --- LEAP(도약 강타) 패턴 — 슬라임킹 구성 차용 -----------------------------
golem.value("script.MonsterAI", "AttackType", "LEAP", "string");
golem.value("script.MonsterAI", "DetectRange", 10.0, "double");
golem.value("script.MonsterAI", "AttackRange", 6.5, "double");
golem.value("script.MonsterAI", "StopDistance", 2.5, "double");
golem.value("script.MonsterAI", "LeashRange", 20.0, "double");
golem.value("script.MonsterAI", "AttackWindup", 0.8, "double"); // 지면 예고 길이
golem.value("script.MonsterAI", "AttackCooldown", 3.2, "double");
golem.value("script.MonsterAI", "SpawnGraceDuration", 1.5, "double"); // 보스방 입장 직격 방지

// 착지 예고 장판 — 링 반지름 = SlamRadius(= 실제 판정 반지름) 단일 소스
golem.value("script.MonsterAI", "TelegraphModelId", "AttackTelegraph", "string");
golem.value("script.MonsterAI", "SlamRadius", 2.6, "double");

// 도약 단계 타이밍 (WINDUP -> FLY -> HANG -> SLAM)
golem.value("script.MonsterAI", "LeapReactionWindow", 0.7, "double"); // 좌표 확정~착지 회피 여유
golem.value("script.MonsterAI", "LeapRiseDuration", 0.5, "double");
golem.value("script.MonsterAI", "LeapHangDuration", 0.2, "double");
golem.value("script.MonsterAI", "LeapSlamDuration", 0.16, "double");
golem.value("script.MonsterAI", "LeapLandingFraction", 1.0, "double");
golem.value("script.MonsterAI", "LeapSpeedMultiplier", 12.0, "double");
// skill1 이 10프레임이라 슬라임킹(2)보다 뒤쪽 프레임이 공중 포즈다.
golem.value("script.MonsterAI", "LeapAirFrameIndex", 4, "int");
golem.value("script.MonsterAI", "LeapAnimFallPlayRate", 1.5, "double");

// 착지 충격 연출
golem.value("script.MonsterAI", "ImpactShakeIntensity", 0.6, "double");
golem.value("script.MonsterAI", "ImpactShakeDuration", 0.35, "double");

// 미니언 소환 — 고원 식생(스텀프) 호출. 슬라임킹에서 상속된 "slime" 을 반드시 덮어쓴다.
golem.value("script.MonsterAI", "MinionSummonInterval", 35.0, "double");
golem.value("script.MonsterAI", "MinionModelId", "stump", "string");
golem.value("script.MonsterAI", "MinionSummonCount", 3, "int");
golem.value("script.MonsterAI", "MinionSummonRadius", 3.5, "double");

// Melee / Slam Attack
golem.value("script.MonsterMeleeAttack", "AttackBoxSize", 5.0, "double");
golem.value("script.MonsterMeleeAttack", "ContactDamage", 24.0, "double");
golem.value("script.MonsterMeleeAttack", "TouchDamage", 6.0, "double");
golem.value("script.MonsterMeleeAttack", "SlamDamage", 30.0, "double"); // 착지 광역타 전용
golem.value("script.MonsterMeleeAttack", "TouchBoxSize", 3.6, "double");

golem.write(dst("StoneGolem"));

console.log("F2 models written: Stump.model / IronHog.model / StoneGolem.model");
