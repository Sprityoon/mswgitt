"use strict";
// F3 모래 사막(desert) 몬스터 모델 5종 생성 스크립트. 멱등(재실행 안전 — 항상 원본 베이스를 다시 읽는다).
//
//   Moredji.model   (moredji)   <- Slime.model        기반 · CONTACT
//   Catus.model     (catus)     <- HornMushroom.model 기반 · RANGED (제자리 사격)
//   Scorpion.model  (scorpion)  <- Slime.model        기반 · MELEE_WEAPON
//   Bellamoa.model  (bellamoa)  <- Slime.model        기반 · CONTACT (고속 활강)
//   Deu.model       (deu)       <- SlimeKing.model    기반 · LEAP + AttackTelegraph B3 보스
//
// 출처: docs/design/story/hunting-grounds-ruid-index.md §3 (RUID·스탯)
//       docs/design/story/hunting-grounds-ecosystem-plan.md §2.3 (라인업·보스 기획)
//
// 값은 전부 모델 프로퍼티(= 데이터 주도). MonsterAI/Monster/MonsterMeleeAttack 는
// 기존 스크립트를 그대로 재사용하며 신규 .mlua 는 없다.
//
// 콜라이더 규약: HitComponent.BoxSize/ColliderOffset 은 Transform.Scale 이 곱해진 값이
// 실제 판정이다(함정 규칙 14). 일반 몹은 스프라이트 px/100 × 여유 배율 1.56(슬라임·스텀프
// 선례), 보스는 스프라이트 실루엣과 1:1(슬라임킹·스톤골렘 선례)로 잡는다.
//
// 좌우 반전: MonsterAI:Face() 는 SpriteRendererComponent.FlipX 를 쓴다(MonsterAI.mlua:1555).
// 따라서 좌향 작화 mob 리소스라도 모델에서 Scale.x 를 손볼 필요가 없다.
//
// ⚠ 베이스가 Slime.model 인 3종은 Slime 에 Defense/ContactDamage 값이 없어(스크립트 기본값
//    6 / 5 사용) F3 티어 수치를 반드시 명시적으로 세팅한다.

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
// 1. Moredji.model — 모래두지 (CONTACT · 모래를 파고들다 솟구치는 기습형)
// ---------------------------------------------------------------------------
const MOREDJI = {
	stand: "c6df515cbe0748038dab14361749b57c", // stand 96x62 /16f
	move: "8748561fda1241a09905472bb1fc1b7b", // move  102x48 /8f
	die: "b516a880263d4f3a998a62e7ea351b91", // die1   92x95 /8f
};
// 팩 mob/2110300.img 에는 attack 클립이 없다 → move 재사용 (색인 §0 규칙 5).
MOREDJI.attack = MOREDJI.move;

const moredji = ModelBuilder.load(src("Slime"));
moredji.renameModel("Moredji", "moredji");

// Sprite & Visuals
moredji.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", MOREDJI.stand, "string");
moredji.value("MOD.Core.TransformComponent", "Scale", vector3(2.0, 2.0, 2.0), "vector3");
moredji.value("MOD.Core.MovementComponent", "InputSpeed", 2.4, "float"); // 슬라임과 동급

// Hit Collider (스프라이트 96x62 기준 × 1.56)
moredji.value("MOD.Core.HitComponent", "BoxSize", vector2(1.5, 0.97), "vector2");
moredji.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.43), "vector2");

// Monster Stats
moredji.value("script.Monster", "MonsterId", "moredji", "string");
moredji.value("script.Monster", "MaxHp", 120, "double");
moredji.value("script.Monster", "Defense", 16, "double");
moredji.value("script.Monster", "RespawnOn", false, "bool");

// Monster AI & Clips
moredji.value("script.MonsterAI", "StandRUID", MOREDJI.stand, "string");
moredji.value("script.MonsterAI", "MoveRUID", MOREDJI.move, "string");
moredji.value("script.MonsterAI", "AttackRUID", MOREDJI.attack, "string");
moredji.value("script.MonsterAI", "DieRUID", MOREDJI.die, "string");
moredji.value("script.MonsterAI", "AttackType", "CONTACT", "string");
moredji.value("script.MonsterAI", "DetectRange", 7.0, "double");
moredji.value("script.MonsterAI", "AttackRange", 1.1, "double");
moredji.value("script.MonsterAI", "StopDistance", 0.8, "double");
moredji.value("script.MonsterAI", "AttackWindup", 0.45, "double");
moredji.value("script.MonsterAI", "AttackCooldown", 1.6, "double");
moredji.value("script.MonsterAI", "LeashRange", 14.0, "double");
// 기획의 "잠복 기습"은 전용 파고들기 클립이 팩에 없어 스폰 유예 + 넓은 탐지로 근사한다.
moredji.value("script.MonsterAI", "SpawnGraceDuration", 0.6, "double");

// Melee Attack
moredji.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.5, "double");
moredji.value("script.MonsterMeleeAttack", "ContactDamage", 14.0, "double");
moredji.value("script.MonsterMeleeAttack", "TouchDamage", 5.0, "double");

moredji.write(dst("Moredji"));

// ---------------------------------------------------------------------------
// 2. Catus.model — 카투스 (RANGED · 제자리에서 가시 침 연사)
// ---------------------------------------------------------------------------
const CATUS = {
	stand: "7b3a31991e2b4af3a2df22836291e8a3", // stand 76x91 /6f
	move: "80d83a6fa60d4ec79a3ba0a1774bd476", // move  76x91 /6f
	die: "4de7520929664ef5acf74e422a572566", // die1  84x72 /9f
};
// attack 클립 없음 → 몸을 부풀리는 연출은 stand 재사용 (색인 §3).
CATUS.attack = CATUS.stand;

// 베이스는 유일한 기존 RANGED 몹인 뿔버섯 — 투사체 파이프라인이 이미 배선되어 있다.
const catus = ModelBuilder.load(src("HornMushroom"));
catus.renameModel("Catus", "catus");

// Sprite & Visuals
catus.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", CATUS.stand, "string");
catus.value("MOD.Core.TransformComponent", "Scale", vector3(2.0, 2.0, 2.0), "vector3");
catus.value("MOD.Core.MovementComponent", "InputSpeed", 1.2, "float"); // 슬라임 대비 0.5배 — 사실상 제자리

// Hit Collider (스프라이트 76x91 기준 × 1.56 — 세로로 긴 선인장)
catus.value("MOD.Core.HitComponent", "BoxSize", vector2(1.19, 1.42), "vector2");
catus.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.62), "vector2");

// Monster Stats
catus.value("script.Monster", "MonsterId", "catus", "string");
catus.value("script.Monster", "MaxHp", 140, "double");
catus.value("script.Monster", "Defense", 20, "double");
catus.value("script.Monster", "RespawnOn", false, "bool");

// Monster AI & Clips
catus.value("script.MonsterAI", "StandRUID", CATUS.stand, "string");
catus.value("script.MonsterAI", "MoveRUID", CATUS.move, "string");
catus.value("script.MonsterAI", "AttackRUID", CATUS.attack, "string");
catus.value("script.MonsterAI", "DieRUID", CATUS.die, "string");
catus.value("script.MonsterAI", "AttackType", "RANGED", "string");
catus.value("script.MonsterAI", "DetectRange", 8.5, "double");
// 기획상 "제자리 고정" — StopDistance 를 사거리로 쓰고 AttackRange 를 그보다 약간 넓게 둔다
// (뿔버섯 선례: AttackRange 3 / StopDistance 2.5).
catus.value("script.MonsterAI", "AttackRange", 6.5, "double");
catus.value("script.MonsterAI", "StopDistance", 6.0, "double");
catus.value("script.MonsterAI", "AttackWindup", 0.8, "double");
catus.value("script.MonsterAI", "AttackCooldown", 2.2, "double");
catus.value("script.MonsterAI", "LeashRange", 13.0, "double");

// Projectile — 가시 침. 전용 모델이 아직 없어 Projectile_Spore 를 재질 그대로 재사용한다
// (색인 §3 "재질 교체 권장"). 전용 스프라이트가 생기면 이 한 줄만 교체하면 된다.
catus.value("script.MonsterAI", "ProjectileModelId", "Projectile_Spore", "string");
catus.value("script.MonsterAI", "ProjectileDamage", 16, "int");
catus.value("script.MonsterAI", "ProjectileSpeed", 5.0, "double");
catus.value("script.MonsterAI", "ProjectileLifeTime", 2.2, "double"); // 사거리 6.5 / 속도 5.0 → 여유 포함
catus.value("script.MonsterAI", "ProjectileHitRadius", 0.4, "double");

// Melee Attack — RANGED 는 DoAttack 을 타지 않으므로 근접타는 0. 몸통 접촉 피해만 남긴다.
catus.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.0, "double");
catus.value("script.MonsterMeleeAttack", "ContactDamage", 0.0, "double");
catus.value("script.MonsterMeleeAttack", "TouchDamage", 4.0, "double");

catus.write(dst("Catus"));

// ---------------------------------------------------------------------------
// 3. Scorpion.model — 스콜피온 (MELEE_WEAPON · 꼬리 침 연속 찌르기)
// ---------------------------------------------------------------------------
const SCORPION = {
	stand: "68dad519868b4fad94870237de0c5d66", // stand  78x61 /6f
	move: "d441dbbe37324c579dfdd839d39da332", // move   75x60 /12f
	die: "fca1c3aaa4da4f7eabc7f6f3b3abb975", // die1  109x45 /7f
};
// 팩 mob/2110301.img 에는 attack 클립이 없다 → move 재사용 (색인 §0 규칙 5).
SCORPION.attack = SCORPION.move;

const scorpion = ModelBuilder.load(src("Slime"));
scorpion.renameModel("Scorpion", "scorpion");

// Sprite & Visuals
scorpion.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", SCORPION.stand, "string");
scorpion.value("MOD.Core.TransformComponent", "Scale", vector3(2.0, 2.0, 2.0), "vector3");
scorpion.value("MOD.Core.MovementComponent", "InputSpeed", 2.6, "float"); // 슬라임 대비 1.08배

// Hit Collider (스프라이트 78x61 기준 × 1.56)
scorpion.value("MOD.Core.HitComponent", "BoxSize", vector2(1.22, 0.95), "vector2");
scorpion.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.42), "vector2");

// Monster Stats — F3 최고 체력 잡몹
scorpion.value("script.Monster", "MonsterId", "scorpion", "string");
scorpion.value("script.Monster", "MaxHp", 150, "double");
scorpion.value("script.Monster", "Defense", 18, "double");
scorpion.value("script.Monster", "RespawnOn", false, "bool");

// Monster AI & Clips
scorpion.value("script.MonsterAI", "StandRUID", SCORPION.stand, "string");
scorpion.value("script.MonsterAI", "MoveRUID", SCORPION.move, "string");
scorpion.value("script.MonsterAI", "AttackRUID", SCORPION.attack, "string");
scorpion.value("script.MonsterAI", "DieRUID", SCORPION.die, "string");
scorpion.value("script.MonsterAI", "AttackType", "MELEE_WEAPON", "string");
scorpion.value("script.MonsterAI", "DetectRange", 7.0, "double");
scorpion.value("script.MonsterAI", "AttackRange", 1.2, "double");
scorpion.value("script.MonsterAI", "StopDistance", 0.9, "double");
scorpion.value("script.MonsterAI", "AttackWindup", 0.5, "double");
scorpion.value("script.MonsterAI", "AttackCooldown", 1.4, "double"); // F3 최단 쿨 — 연속 찌르기 체감
scorpion.value("script.MonsterAI", "LeashRange", 14.0, "double");

// Melee Attack — F3 최고 단타. 기획의 "중독 타격"은 몬스터→플레이어 상태이상
// 파이프라인이 아직 없어(색인 §5 미해결) 순수 물리 피해로 근사한다.
scorpion.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.8, "double");
scorpion.value("script.MonsterMeleeAttack", "ContactDamage", 18.0, "double");
scorpion.value("script.MonsterMeleeAttack", "TouchDamage", 6.0, "double");

scorpion.write(dst("Scorpion"));

// ---------------------------------------------------------------------------
// 4. Bellamoa.model — 벨라모아 (CONTACT · 모래 능선을 미끄러지는 사막 뱀)
// ---------------------------------------------------------------------------
const BELLAMOA = {
	stand: "0788dfc74ff7448a886c39fdef88cb19", // stand 56x72 /4f
	move: "716fef1de1c24d87b8ce34e31337a20b", // move  61x72 /4f
	die: "064ff1510ca9411f98dfcbfa2135edb2", // die1  82x73 /7f
};
// 팩 mob/2100105.img 에는 attack 클립이 없다 → move 재사용 (색인 §0 규칙 5).
BELLAMOA.attack = BELLAMOA.move;

const bellamoa = ModelBuilder.load(src("Slime"));
bellamoa.renameModel("Bellamoa", "bellamoa");

// Sprite & Visuals
bellamoa.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", BELLAMOA.stand, "string");
bellamoa.value("MOD.Core.TransformComponent", "Scale", vector3(2.0, 2.0, 2.0), "vector3");
bellamoa.value("MOD.Core.MovementComponent", "InputSpeed", 3.1, "float"); // 슬라임 대비 1.3배 (색인 §3)

// Hit Collider (스프라이트 56x72 기준 × 1.56 — 세로로 선 뱀)
bellamoa.value("MOD.Core.HitComponent", "BoxSize", vector2(0.87, 1.12), "vector2");
bellamoa.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.49), "vector2");

// Monster Stats — 빠른 대신 가장 물렁한 F3 잡몹
bellamoa.value("script.Monster", "MonsterId", "bellamoa", "string");
bellamoa.value("script.Monster", "MaxHp", 130, "double");
bellamoa.value("script.Monster", "Defense", 14, "double");
bellamoa.value("script.Monster", "RespawnOn", false, "bool");

// Monster AI & Clips
bellamoa.value("script.MonsterAI", "StandRUID", BELLAMOA.stand, "string");
bellamoa.value("script.MonsterAI", "MoveRUID", BELLAMOA.move, "string");
bellamoa.value("script.MonsterAI", "AttackRUID", BELLAMOA.attack, "string");
bellamoa.value("script.MonsterAI", "DieRUID", BELLAMOA.die, "string");
bellamoa.value("script.MonsterAI", "AttackType", "CONTACT", "string");
bellamoa.value("script.MonsterAI", "DetectRange", 7.5, "double");
bellamoa.value("script.MonsterAI", "AttackRange", 1.1, "double");
bellamoa.value("script.MonsterAI", "StopDistance", 0.8, "double");
bellamoa.value("script.MonsterAI", "AttackWindup", 0.4, "double");
bellamoa.value("script.MonsterAI", "AttackCooldown", 1.5, "double");
bellamoa.value("script.MonsterAI", "LeashRange", 15.0, "double"); // 빠른 만큼 멀리 따라붙는다

// Melee Attack
bellamoa.value("script.MonsterMeleeAttack", "AttackBoxSize", 2.4, "double");
bellamoa.value("script.MonsterMeleeAttack", "ContactDamage", 13.0, "double");
bellamoa.value("script.MonsterMeleeAttack", "TouchDamage", 5.0, "double");

bellamoa.write(dst("Bellamoa"));

// ---------------------------------------------------------------------------
// 5. Deu.model — 데우 B3 보스 (LEAP + AttackTelegraph)
// ---------------------------------------------------------------------------
const DEU = {
	stand: "6cf930e280f44694a0a0feedbfd855ed", // stand   108x129 /6f
	move: "196bfc9fe38b4266b279f1b3be53c5dc", // move    105x129 /4f
	skill1: "9af96df994cf4794882fec71c027da2b", // skill1  123x136 /12f — 지팡이 내려찍기
	attack1: "4a7d9f008b334c1187c087d6f5e5cdd3", // attack1 122x137 /20f — (예비) 긴 시전 모션
	die: "7c264f46b77a41ecb52c50b0f191d249", // die1    153x128 /7f
};
// 도약 강타에는 프레임이 짧은 skill1 이 적합하다. attack1(20f)은 전용 보스 AI 도입 시
// "가시 폭풍" 시전 모션 후보로 남겨 둔다.
DEU.attack = DEU.skill1;

const deu = ModelBuilder.load(src("SlimeKing"));
deu.renameModel("Deu", "deu");

// Sprite & Visuals
deu.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", DEU.stand, "string");
deu.value("MOD.Core.TransformComponent", "Scale", vector3(3.0, 3.0, 2.0), "vector3");
deu.value("MOD.Core.MovementComponent", "InputSpeed", 2.0, "float"); // 슬라임 대비 0.83배

// Hit Collider — 보스는 스프라이트 실루엣과 1:1 (슬라임킹·스톤골렘 선례). 108x129 px.
deu.value("MOD.Core.HitComponent", "BoxSize", vector2(1.08, 1.29), "vector2");
deu.value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.58), "vector2");

// Monster Stats / Boss config
deu.value("script.Monster", "MonsterId", "deu", "string");
deu.value("script.Monster", "MaxHp", 2600, "double");
deu.value("script.Monster", "Defense", 26, "double");
deu.value("script.Monster", "IsBoss", true, "bool");
deu.value("script.Monster", "RespawnOn", true, "bool");
deu.value("script.Monster", "RespawnDelay", 30, "double");
// 고정 보스 드롭 — F3 바이옴 기간재(고운 모래). 테마 전리품·레시피는 ItemDropDataSet 담당
// (스톤골렘: BossDropItem=iron_ore + ItemDropDataSet=iron_fragment/recipe 선례와 동일 분담).
deu.value("script.Monster", "BossDropItem", "soft_sand", "string");
deu.value("script.Monster", "BossDropMin", 6, "double");
deu.value("script.Monster", "BossDropMax", 12, "double");
// ⚠ B3 다음 목적지(B5 첫 정원 / F4 설원)는 아직 PortalDestinationDataSet 에 행이 없다.
//    슬라임킹에서 상속된 "hunt02" 를 반드시 비워 잘못된 웨이포인트 해금을 막는다.
//    hunt04 행이 생기면 이 두 줄만 채우면 된다.
deu.value("script.Monster", "UnlockWaypointId", "", "string");
deu.value("script.Monster", "UnlockWaypointName", "", "string");

// Monster AI & Clips
deu.value("script.MonsterAI", "StandRUID", DEU.stand, "string");
deu.value("script.MonsterAI", "MoveRUID", DEU.move, "string");
deu.value("script.MonsterAI", "AttackRUID", DEU.attack, "string");
deu.value("script.MonsterAI", "DieRUID", DEU.die, "string");

// --- LEAP(가시 기둥 솟구침) 패턴 — 슬라임킹·스톤골렘 구성 차용 -----------------
// 기획서 §2.3 의 3패턴(모래 소용돌이 / 가시 폭풍 / 메마름의 저주) 중 예고원 → 솟구침
// 구조가 LEAP + AttackTelegraph 와 가장 가깝다. 나머지 2패턴은 전용 AI 필요(색인 §5).
deu.value("script.MonsterAI", "AttackType", "LEAP", "string");
deu.value("script.MonsterAI", "DetectRange", 11.0, "double");
deu.value("script.MonsterAI", "AttackRange", 7.0, "double");
deu.value("script.MonsterAI", "StopDistance", 3.0, "double");
deu.value("script.MonsterAI", "LeashRange", 22.0, "double");
deu.value("script.MonsterAI", "AttackWindup", 1.0, "double"); // 지면 예고 길이
deu.value("script.MonsterAI", "AttackCooldown", 3.5, "double");
deu.value("script.MonsterAI", "SpawnGraceDuration", 1.5, "double"); // 보스방 입장 직격 방지

// 착지 예고 장판 — 링 반지름 = SlamRadius(= 실제 판정 반지름) 단일 소스
deu.value("script.MonsterAI", "TelegraphModelId", "AttackTelegraph", "string");
deu.value("script.MonsterAI", "SlamRadius", 3.0, "double");

// 도약 단계 타이밍 (WINDUP -> FLY -> HANG -> SLAM)
deu.value("script.MonsterAI", "LeapReactionWindow", 0.75, "double"); // 좌표 확정~착지 회피 여유
deu.value("script.MonsterAI", "LeapRiseDuration", 0.55, "double");
deu.value("script.MonsterAI", "LeapHangDuration", 0.25, "double");
deu.value("script.MonsterAI", "LeapSlamDuration", 0.16, "double");
deu.value("script.MonsterAI", "LeapLandingFraction", 1.0, "double");
deu.value("script.MonsterAI", "LeapSpeedMultiplier", 12.0, "double");
// skill1 이 12프레임이라 공중 포즈는 중반부(스톤골렘 10f/4 와 같은 0.4 지점).
deu.value("script.MonsterAI", "LeapAirFrameIndex", 5, "int");
deu.value("script.MonsterAI", "LeapAnimFallPlayRate", 1.5, "double");

// 착지 충격 연출 — F3 보스는 스톤골렘보다 한 단계 강하게
deu.value("script.MonsterAI", "ImpactShakeIntensity", 0.7, "double");
deu.value("script.MonsterAI", "ImpactShakeDuration", 0.4, "double");

// 미니언 소환 — 사막 식생(모래두지) 호출. 슬라임킹에서 상속된 "slime" 을 반드시 덮어쓴다.
deu.value("script.MonsterAI", "MinionSummonInterval", 30.0, "double");
deu.value("script.MonsterAI", "MinionModelId", "moredji", "string");
deu.value("script.MonsterAI", "MinionSummonCount", 3, "int");
deu.value("script.MonsterAI", "MinionSummonRadius", 3.5, "double");

// --- 원거리("바위/가시 파편 난사") 사전 배선 --------------------------------
// 🔴 MonsterAI:FireProjectile() 은 ATTACK 상태의 스트라이크 분기에서만 호출된다
//    (MonsterAI.mlua:318). AttackType="LEAP" 인 동안에는 절대 발사되지 않으므로
//    ProjectileModelId 를 채우면 "죽은 설정"이 된다 → 명시적으로 비워 둔다.
//    수치만 미리 튜닝해 두고, 전용 보스 AI(또는 AttackType 전환) 도입 시
//    ProjectileModelId 한 줄만 채우면 원거리 패턴이 살아난다.
deu.value("script.MonsterAI", "ProjectileModelId", "", "string");
deu.value("script.MonsterAI", "ProjectileDamage", 22, "int");
deu.value("script.MonsterAI", "ProjectileSpeed", 6.5, "double");
deu.value("script.MonsterAI", "ProjectileLifeTime", 2.0, "double");
deu.value("script.MonsterAI", "ProjectileHitRadius", 0.5, "double");

// Melee / Slam Attack
deu.value("script.MonsterMeleeAttack", "AttackBoxSize", 5.6, "double");
deu.value("script.MonsterMeleeAttack", "ContactDamage", 30.0, "double");
deu.value("script.MonsterMeleeAttack", "TouchDamage", 8.0, "double");
deu.value("script.MonsterMeleeAttack", "SlamDamage", 36.0, "double"); // 착지 광역타 전용
deu.value("script.MonsterMeleeAttack", "TouchBoxSize", 4.0, "double");

deu.write(dst("Deu"));

console.log("F3 models written: Moredji.model / Catus.model / Scorpion.model / Bellamoa.model / Deu.model");
