# 트래퍼 투척 계보 밸런스 분석·검증 기록 (2026-10-15)

요청: 주먹도끼 던지기의 과도한 성능 원인을 수정하고, 상위 스킬 쇄석 흩뿌리기의 근접 산탄 역할을 회복한다. 새 시스템이나 애니메이션을 만들지 않고 기존 데이터·실제 비행 충돌 판정·장비/패시브 공식을 유지한다. AGENTS.md P7에 따라 Play·입력은 제작자 전담이며 에이전트 검증은 정적 검사·refresh·최신 build까지다. 기존 설정/로딩 작업과 다른 미커밋 전투 변경은 보존한다.

## 역할 및 계약

- 데이터/조회/서버 시전·쿨다운·피해 공식: `SkillDataSet.csv/.userdataset` → `PlayerController.ServerRequestCastSkill`, `GetEffectiveDamageMultiplier`, `GetEffectiveCooldown`, `GetSkillCore`, `ComputeSkillDamage`.
- 바인딩/표시: `PlayerController`의 `SkillSlotsJson`·`GetEquippedSlots`·`RequestCastSkill`, `UISkillBarController`, `UISkillTreeController`. 새 키/슬롯/아이콘 불필요. 기존 QWER 슬롯과 데이터 기반 상세/쿨다운 유지.
- 투사체: `PlayerController.ExecuteProjectileSkill`·`SpawnPlayerProjectile` → `Projectile.OnUpdate`·타겟별 중복 방지 → `PlayerCombat.DealSkillHit`·`CalcDamage` → `Monster.ResolveSkillDamage`·피격 처리.
- 판정 우선순위: 기존 프로젝트는 투사체 비행 중 native `AttackFast`/`HitBox` 판정이다. 일반 스킬 예시의 즉시 판정·수동 HP/풀로 재구축하지 않는다(프로젝트 P6 범위 외 리팩터링 금지, skill `architecture/divergences.md` Project Convention Precedence).
- 질문이 필요한 신규 스킬 명세가 아닌 기존 스킬 밸런스 수정이며, 피해·쿨다운 수치 조정은 사용자 요청 범위에서 비교 분석으로 결정한다.

## 진행 원장

| ID | 결정·소유자 / 구현 위치 | 계약 | 증거 시나리오 | 상태 |
|---|---|---|---|---|
| DATA-01 | 기존 SkillDataSet·PlayerController·QWER 재사용 | architecture/datasets + framework | 파일/호출 경로 조사 | PASS(정적) |
| DATA-02 | 기존 CSV schema·userdataset 유지 | architecture/datasets | 필드·행 폭·인코딩 검사 | OPEN |
| DATA-03 | hand_axe_throw / shatter_scatter 2행 조정 | architecture/datasets | 부모 Lv3·장착·탄약·기존 바인딩 보존 | OPEN |
| DATA-04 | 기존 조회/형변환·타입 분기 유지 | architecture/framework | 회귀 검사·refresh·build; 실제 시전 로그는 제작자 | OPEN |
| PAP-01 | 기존 swingO1·시전 FX/SFX 재사용 | player/casting | 모션/리소스/타입 유지 확인 | OPEN |
| PAP-02 | 기존 PlayerController 시전 제어 유지 | player/casting | 서버 쿨다운 검사·비용 선검사 확인 | OPEN |
| PAP-03 | 기존 시전 해제/타이머 경로 유지 | player/casting | 변경 범위/해제 경로 정적 검토 | OPEN |
| PAP-04 | 플레이어 모션·이동·재시전 체감 | player-control-harness | 주먹도끼/쇄석 연속 시전 | 제작자 Play 대기(P7) |
| PAJ-01 | 기존 실제 투사체 비행 충돌 유지 | combat/targeting + 프로젝트 우선 | 산탄 수·분산·생성 위치·표적 조사 | OPEN |
| PAJ-02 | Projectile의 개별 HitTargets 및 PlayerCombat 정확한 대상 필터 유지 | combat/targeting | 발당 1타·여러 파편 합산 허용·중복 누적 방지 | OPEN |
| PAJ-03 | 실제 충돌 시만 공격, 시각 타이머에서 추가 피해 없음 | combat/projectile | 모든 피해 호출자 검사 | OPEN |
| PAJ-04 | 정적 피해/방어/거리 계산 및 제작자 실제 명중 로그 | combat/targeting | 1/3/5발 적중·원거리·근접·보스 | OPEN |
| MHP-01 | 기존 Monster/MonsterAI/BossPatternController 수신 파이프라인 유지 | player/preflight | 데이터 행 변경과 피격 파이프라인 연결 조사 | OPEN |
| MHP-02 | 기존 비치명 HIT·속박/넉백 유지 | combat/hit-reaction | 수신 코드·넉백 처리 확인 | OPEN |
| MHP-03 | 기존 치명/사망·피해 숫자 유지 | combat/death | 사망 배제·die/숫자 보류 처리 확인 | OPEN |
| MHP-04 | 피격/사망 시각 회귀 | monster-visual-harness | 일반 몬스터·보스 근접 산탄/치명 | 제작자 Play 대기(P7) |

## 변경 전 확인값

- 주먹도끼: Lv1 150%, Lv3 210%, Lv5 270%, 쿨다운 0.8초, 기력 4, MP 0, SkillPower 16, 1발, 판정 크기 기본 1.6, 비행 11×1.1=12.1유닛.
- 쇄석: Lv1 발당 70%, Lv3 발당 100%, 5발, 쿨다운 5초, 기력 10, MP 12, SkillPower 16, 50도, 판정 크기 0.8, 비행 8×0.65=5.2유닛.
- 같은 피해 코어와 투척 보너스를 공유한다. 최대 레벨 방어 전 초당 계수: 주먹도끼 2.7/0.8=3.375, 쇄석 전탄 1.0×5/5=1.0. 쇄석은 3발만 맞히면 0.6. 선행 Lv3 주먹도끼와 신규 Lv1 쇄석 비교도 2.625 대 전탄 0.7로 역전.
- 알뜰한 손놀림: Lv5 탄약 보존 100%·투척 피해 +20%, 양쪽 동일 적용. 보존은 의도된 직업 정체성이며 별도 너프하지 않는다. 주먹도끼의 짧은 쿨다운·높은 성장·MP 없음이 비용 제거와 결합해 문제를 확대한다.

## 추가 요청: 손에 든 무기와 탄약의 충돌

- 제작자: 단검 기본 투척이 주먹도끼보다 약함. 보유 최고 무기 자동 선택을 없애고 현재 슬롯에서 든 무기를 기준으로 해야 함. 맨주먹 싸움꾼은 무기 영향을 받지 않는 예외. 다만 자동 선택의 원래 목적은 주먹도끼를 들면 다른 스킬이 약해지는 문제 방지였으므로 대안을 함께 결정해야 함.
- `PlayerInventory.FindBestWeaponKey`는 보유 무기를 Attack+MagicAttack으로 비교하며, `GetGearKey("weapon")`가 GearJson 등록 또는 이 자동값을 반환한다. `PlayerController.GetEquippedWeaponType`도 이 키를 사용한다. 예: 사냥꾼의 투척검 Attack10/SkillAttack4를 손에 들어도, 철 도끼 Attack20을 보유하면 공격력뿐 아니라 평타 방식까지 Melee로 선택될 수 있다. 새 기준은 피해·평타 종류·무기 특수능력·캐릭터 창을 같은 출처로 맞춰야 한다.
- 주먹도끼는 Category=tool, EquipSlot 공란, Attack/MagicAttack/SkillAttack=0, MaxStack99. 세 투척 스킬의 RequireEquippedItem=Hand Axe 때문에 단검을 내려놓는 구조다. 기본 단검 투척은 별도 WeaponAttackDataSet 행(100%·힘·SkillAttack 제외·사거리 약5), ThrowBasic 패시브 해금 및 BasicThrowDamagePct만 적용된다.
- **추천안(결정 대기)**: 주먹도끼는 가방 탄약으로 소비하고 직접 들기 제약을 제거한다. 단검을 든 채 기본 투척/주먹도끼/쇄석과 다른 스킬을 연계하며 공격력은 현재 든 무기에 통일한다. 맨주먹은 무기 슬롯 기여를 제외하고 기존 장갑 환산을 유지. 대안은 직접 들기 제약을 유지하고 다른 스킬에 별도 수동 주무기 기준을 남기는 것. 비동기 질문으로 선택 요청, 답변 전 무기 로직·스킬 데이터 수정 보류.
- `Monster.ResolveSkillDamage`는 파편마다 방어력을 차감하고, 속박 시 투척 피해 +25%·방깎을 양쪽에 동일 적용한다. `Projectile`의 발당 HitTargets와 `PlayerCombat.PendingTargetId`는 중복·주변 대상 중복타를 막고 있다. 무한 중복 피해가 원인이라는 증거는 없다. 산탄의 근접 발사 오프셋(공통1.2)으로 인한 사각지대 가능성은 정적 기하/실제 Play 확인이 필요하며 아직 결함으로 확정하지 않는다.

## 수치 조정 후보(미적용)

주먹도끼 Lv1 120% +레벨당15%p(최대180%), 재사용1.4초 / 쇄석 발당110% +레벨당20%p(최대150%)×5, 재사용3초. MP·기력 비용과 탄약 보존은 유지하는 후보. 단검 평타는 지속 화력을 맡도록 함께 비교한다. 최종 값은 무기 기준 결정 후 실제 데이터와 일반/방어형 대상·스킬 레벨별로 다시 검증한다.

같은 코어60·트래퍼 투척 보너스20%·대상 방어10, 치명/속박 없음, 전탄 가정 비교(계산 근거이며 런타임 실측 아님):

| 최대 레벨 | 기존 1회 피해 / 쿨당 DPS | 후보 1회 피해 / 쿨당 DPS |
|---|---|---|
| 주먹도끼 | 184 / 230.0 | 119 / 85.0 |
| 쇄석 3발 적중 | 186 / 37.2 | 294 / 98.0 |
| 쇄석 5발 적중 | 310 / 62.0 | 490 / 163.3 |

## 제작자 확정 및 구현 계획

제작자 확정: 기본은 주먹도끼를 직접 들고 던져야 한다. `주먹도끼 주머니` 보유 시에만 가방 탄약으로 쓸 수 있다. 그 외 손 무기 기준·자동 최고 무기 제거·맨주먹 예외·세 공격 역할 분리는 추천대로 진행.

1. `PlayerInventory.GetGearKey("weapon")`는 현재 `EquippedTool`만 검사한다. 소유·무기 슬롯·직업·착용 레벨 검증, TRI 평타 직업은 무기 기여 제외. 방어구 등록은 기존대로. 장비 창 무기 장착/해제도 손 무기 경로로 통일, 구 GearJson.weapon은 실효값에 사용하지 않는다.
2. `PlayerController.GetGearPerk`는 손 무기·장비/강화/소유·직업 변경 즉시 캐시 무효화. `IsSkillEquipRequirementMet`는 일반 `EquipBypassItem` 열로 보유 우회 판정하며 실제 ConsumeItem 보유/소모는 기존 경로를 유지.
3. `Hand Axe Pouch` 아이템·레시피(멧돼지 가죽6+구리 주괴2, Tier2) 추가. 공식 사냥꾼 주머니 아이콘 `c3149183777c4089b830c192e2a8ca53` 검색·상세·실제 PNG 확인. 3종 투척의 직접 장착 조건은 유지하고 우회 아이템만 지정.
4. 주먹도끼 120~180% /1.4초, 쇄석 발당110~150%×5 /3초, 기본 단검 투척 115%로 조정. 쇄석은 좁은 근접 산탄 정체성 유지, Knockback=0으로 첫 파편이 나머지 파편 밖으로 적을 밀지 않게 한다. `ProjectileSpawnDistance` 선택 열(기본1.2)로 쇄석·단검만0.4에서 출발해 근접 사각지대를 줄인다.
5. 기존 UI를 재사용해 현재 손 무기와 주머니 우회 조건 표시. 기존 스킬 해금·QWER·리소스·수신 Monster 파이프라인 및 저장 경로 유지. 실제 모델별 HIT/DEAD는 제작자 회귀 확인 대상으로 유지(P7).

제작자 후속 확정: 가방에 보유만 해서는 효과가 없고 **장착템**이어야 한다. 상의에 합치는 파츠로도 설계해 제한된 부여 슬롯과 경쟁하게 한다. 구현은 기존 `shield` 보조 슬롯(표시명 보조 장비)에 주머니를 장착하거나, 기존 `EnchantPartDataSet`의 armor 한정 파츠로 주머니 1개를 소비해 `HandAxePouch=1`을 부여하는 두 경로. 주머니 장착은 방패를, 상의 결합은 부여 슬롯 하나를 포기한다. 스킬은 `EquipBypassStat`을 읽고 **현재 실효 장비의 GetGearPerk**만 검사한다. 위 보유형 `EquipBypassItem` 계획은 폐기, 인벤토리 수량만으로 우회 금지. 기존 모루에 이미 타깃 슬롯·파츠 소모·슬롯 상한/덮어쓰기·저장 구현이 있어 새 강화 시스템 없이 연결한다.

확장 원장: WEAPON-01 손 무기/기본 공격/합산/강화, WEAPON-02 무기 종류/직업/레벨 및 TRI 예외, WEAPON-03 캐시·UI·구 세이브 무기 등록 무시, POUCH-01 보유 우회·탄약 선검사, POUCH-02 획득 가능한 아이템/레시피, BAL-01 1/3/5발·레벨·방어별 계산, BAL-02 근접 탄환 생성 거리 → 모두 OPEN, 아래 검증 결과로 갱신.

검증: 정적 진단·회귀 검사 → refresh/build → 제작자 Play 확인. 현재 Maker 편집 모드 확인.

## 최종 반영·검증

최종 주먹도끼는 재사용 **1.5초**, 기본 위력 **8**로 보정했다. 1.4초/위력16 후보는 낮은 레벨에서 단검 지속 화력을 대체할 여지가 남아 실제 데이터 예산 검사로 추가 낮췄다. 쇄석 발당110~150%×5/3초, 기본 단검115%, 나머지 역할/조건은 위 구현 계획 및 후속 확정을 따른다. 보유형 우회가 아니라 **장착/상의 부여형** 우회를 적용했다.

| 원장 항목 | 구현·정적 증거 | 최종 상태 |
|---|---|---|
| DATA-01~03 | 기존5개 CSV·스킬53개 및 전용3행·보조 장비/레시피/상의 파츠, 기존 키/해금/QWER 유지 | 정적 PASS |
| DATA-04 | 기존 DataService 조회·타입 분기 및 참조 검사, refresh 후229개 비대상 행 불변·행 폭 일치 | 정적 PASS / 실제 카탈로그·시전은 제작자 Play 대기 |
| PAP-01~03 | 기존 CastAction/아이콘/FX/SFX/모션·제어 코드 유지, 서버 쿨다운/자원/직접 들기 검사 재사용 | 변경 경로 정적 PASS |
| PAP-04 | 기존 시전·연속 입력/해제 체감 | 제작자 Play 대기(P7) |
| PAJ-01~03 | 비행 충돌·발당 HitTargets·정확한 PendingTargetId 유지. 생성 거리만 데이터화(기본1.2, 쇄석/단검0.4), 산탄 Knockback0 | 변경 경로 정적 PASS |
| PAJ-04 / BAL-01~02 | 실제 CSV/능력치 프로퍼티 기반 화력 예산·생성 거리/판정 앞쪽 커버 관계 검사 통과 | 계산 PASS / 실제 충돌·피해는 제작자 Play 대기 |
| MHP-01~03 | Monster.ResolveSkillDamage/HandleHitEvent·MonsterAI 수신 경로 변경 없음. 기존 상태·사망·수신 모델을 새 토폴로지로 교체하지 않음 | 수신 경로 정적 확인 / 모델별 실제 HIT/DEAD 미검증 |
| MHP-04 | 일반/보스 피격·사망, 4방향 근접 산탄 회귀 | 제작자 Play 대기(P7) |
| WEAPON-01~03 | 현재 손 무기·직업/레벨/소유/TRI·고유효과 캐시·장비/인벤토리 UI·구 GearJson.weapon 무시, 자동 선택 함수/잔존 호출 제거 | 정적 PASS / 실제 교체·동기화는 제작자 Play 대기 |
| POUCH-01~02 | `GetGearPerk(EquipBypassStat)`로 장착/상의 부여만 허용, 탄약 별도 선검사. 보조/상의 슬롯·파츠 기능 동일·제작 재료 실제 키·획득 경로 검사 | 정적 PASS / 모루·재접속은 제작자 Play 대기 |

- 수정 mLua6개 LSP Error0 / Warning0, 기존 스킬·퀘스트 참조 검사 통과.
- `node scripts/check_trapper_balance_20261015.cjs`로 실제 데이터의 피해 예산·조건·파츠/재료/부여 대상을 회귀 검사. 패치는 `node scripts/patch_trapper_balance_20261015.cjs`로 재적용 가능.
- refresh 19:54:56~19:55:00 KST `ok`, 최신 build **19:55:00 Error0 / 기존 Warning16 / Info906**. refresh 뒤 데이터 조정값·행 폭·229개 비대상 행 보존 확인.
- Play·입력·캡처는 P7에 따라 수행하지 않았다. 계산 결과는 실제 프레임·명중률·치명타·상태/버프·마나/기력·교대 공격을 포함한 실전 DPS가 아니다.

장착 효과 활성·실제 투사체 발사에는 `[VRF][POUCH]`, `[VRF][SKILL]` 로그를 제공한다. 보유만/장착/상의 결합/효과 해제·덮어쓰기·탄약0·100% 보존·직업/레벨·맨주먹·구 세이브·4방향·일반/보스 피격/사망·상의 부여 재접속이 제작자 확인 범위다.
