# 중단 작업 인계 — 체력바·SP 초기화 가격·단검 경직

## 범위와 작업 순서

1. 기존 타수 경직 데이터 전달·피격 경로 감사 및 생명주기 보완.
2. 일반 몬스터 피격 후 5초 머리 위 HP, 살아 있는 같은 맵 보스 상단 이름/HP.
3. SP 초기화 주문서 첫 구매 150 → 이후 3,000코인. 캐릭터별·판매자 공통 이력, 서버 가격 재계산, UI 동일 계산, 기존 세이브 호환.
4. 한 번의 검증 묶음: 데이터/행 보존, UIBuilder lint·ID 비교, mLua LSP, refresh·시각 일치 build 로그. 이번 요청은 Play를 요구하지 않아 AGENTS P7에 따라 Play는 제작자 확인.

## 현재 소유자 및 공격 검토 원장

요청은 기존 평타의 경직 빈도 조정이며 새 공격/애니메이션/핫키를 만들지 않는다. 프로젝트 승인 규칙(AGENTS P1/P2/P6)이 스킬의 일반 이식·전투 파이프라인 교체·자동 Play 요구에 우선한다. 기존 HitEvent → Monster → MonsterAI 경로를 유지한다.

| ID | 결정·소유자·구현 위치 | 검증 시나리오 | 상태 |
|---|---|---|---|
| DATA-01 | WeaponAttackDataSet / PlayerController.ExecuteWeaponAttack 재사용 | 기존 기본/충전/특성 행 경로 | 정적 PASS |
| DATA-02 | 기존 CSV/userdataset, StaggerEvery 열 | 31열/6행, 단검만 3 | 정적 PASS |
| DATA-03 | Dagger_Throw_1 + ThrowBasic 특성, 기존 Ctrl 입력 | 특성 없는 근접 및 다른 탄은 기존 경직 | 정적 PASS |
| DATA-04 | SkillNumber → spec → Projectile → PendingStaggerEvery | 전달 체인·빌드, 런타임 제작자 | 정적 PASS |
| PAP-01 | 기존 PlayWeaponAttackPresentation / CastAction 유지 | 변경 범위에서 모션/RUID 불변 | 정적 PASS |
| PAP-02 | 기존 PlayerController 동작 잠금 유지 | 공격 속도·이동 정책 불변 | 정적 PASS |
| PAP-03 | 기존 발사·정리 소유권 유지 | Pending 전달값 정리 | 정적 PASS |
| PAP-04 | 플레이어 시전 실측 | AGENTS P7에 따라 제작자 Play | 보류 |
| PAJ-01 | 기존 Projectile 충돌 조회 유지 | 목표 중복 적중 캐시 유지 | 정적 PASS |
| PAJ-02 | PlayerCombat.DealSkillHit 동기 HitEvent | 판정당 한 번 집계 | 정적 PASS |
| PAJ-03 | 기존 피해·이펙트·타이머 유지 | 지연 피해 신규 도입 없음 | 정적 PASS |
| PAJ-04 | 1·4·7·10 및 타인·공백·리스폰 | 소스 수식 1·4·7·10 확인, 나머지 제작자 Play | 정적 PASS / Play 대기 |
| MHP-01 | Monster 모델별 State/Body/AI 구성 | 모델 전수 읽기 결과 | 정적 PASS |
| MHP-02 | Monster.IsKnockbackAllowed → MonsterAI.ApplyKnockback | 일반 몬스터와 보스 슈퍼아머 보존 | 정적 PASS |
| MHP-03 | 기존 Monster.Dead/Respawn 유지 | 사망/리스폰 시 집계 초기화 | 정적 PASS |
| MHP-04 | 실제 HIT/사망 연출 | AGENTS P7에 따라 제작자 Play | 보류 |
| UI-01 | Monster HP @Sync → UICombatHpLogic, HUDGroup | 5초 숨김·사망·맵 전환·세션 정리 | 정적 PASS |
| UI-02 | IsBoss/MonsterId @Sync → 같은 맵 상단 HUD | 이름·체력·MaxHp·사망·이탈 | 정적 PASS |
| SHOP-01 | ShopItemDataSet.RepeatBuyPrice + PlayerInventory | 첫150/이후3000·다른 품목 불변 | 정적 PASS |
| SAVE-01 | PersistenceManager 기존 슬롯 payload | 선캡처·복원·기본값·추가 Yield 0 | 정적 PASS |
| VERIFY | 정적 검사 + refresh + 시각 대조 build | Play 없이 검증 수준 기록 | 정적 PASS |

## 최종 구현 및 검증 (2026-10-21)

- 중단 당시 남아 있던 작업은 WeaponAttackDataSet → PlayerController → Projectile → PlayerCombat.PendingStaggerEvery → Monster.IsKnockbackAllowed 경로였다. 이 경로를 유지하고 Monster.Respawn에 타수 초기화를 추가했다. 같은 몬스터·같은 공격자별 집계, 3초 초과 미적중 시 초기화, 근접·다른 탄·스킬의 기존 경직과 보스 슈퍼아머는 유지한다.
- 일반 HP: 기존 서버 HP 동기화의 감소를 관찰해 머리 위 100×14 막대를 마지막 감소부터 5초 표시. 재타격 시 연장, 0 HP·사망·비활성·디스폰·다른 맵이면 정리한다. 클라이언트 UI만 만들며 피해 판정은 건드리지 않는다.
- 보스 HP: 같은 맵의 살아 있는 IsBoss 몬스터를 0.1초마다 표시. 상단 중앙에 이름·게이지·현재/최대 수치. MonsterId도 동기화하여 클라이언트 공개 데이터셋의 한글 DisplayName(슬라임킹·스톤골렘·데우·스노우맨)을 사용한다. 메뉴에서는 기존 HUD 표시 정책에 따라 숨긴다.
- SP 초기화 주문서(Oblivion Scroll): 첫 구매 150코인, 두 번째부터 3,000코인(20배). 네 판매자 공통·캐릭터 슬롯별 구매 이력. 구매 전에 서버가 재계산하고 성공한 구매만 집계하며 상점 UI도 같은 계산을 쓴다. 이력은 기존 캐릭터 payload에 선캡처해 저장·복원, 추가 Yield 없음. 과거 저장에는 이력이 없으므로 업데이트 후 첫 구매부터 집계한다. AP 초기화 물약 등 다른 품목 가격은 보존했다.

### 정적·빌드 근거

- 관련 mLua 9개 LSP: Error 0 / Warning 0. Component 동적 타입 관련 Info는 남아 있다.
- check_dataset_columns.cjs: 실제 확인 363 / 추적 불가 238 / 불일치 0, 설정값 불일치 0. 추적 불가는 기존 row 전달 패턴으로 수동 확인 대상이며 전수 검증을 뜻하지 않는다.
- UIBuilder validate: 오류 0. 직전 백업의 기존 HUD 566개를 id·컴포넌트·속성까지 비교해 전부 동일, CombatHpLayer 아래 8개만 추가. 모든 신규 노드 UIScale=(1,1,1), ActivePlatform=255, 비입력 UI; 두 채움은 Filled/Horizontal/Left. 메뉴 기본 숨김. refresh 후 574개와 가격값 재확인.
- UI 배치 검토: 1920×1080 기준 보스판 상단 80, 크기 760×92. 기존 상단 시계(중심 -48, 높이48)의 아래72와 8px 간격. 이름·게이지·수치가 판 안에 들어가며 좌우 HUD·우측 미니맵과 구획을 나눈다. 기존 ui8 나무판·빨강 HP·크림 글자 재사용. 실제 화면·모바일 가독성은 Play 확인 전이다.
- ShopItemDataSet 28행: 기존 5열의 값 전부 HEAD와 동일. RepeatBuyPrice는 주문서 판매자 4행에만 3000, 네 판매자 BuyPrice 150/RepeatBuyPrice 3000/SellPrice 0 일치.
- WeaponAttackDataSet: 31열·6행, ThrowBasic 필요 단검 투척 행만 StaggerEvery=3. 실제 소스 경직 반환식을 Node에서 계산해 1·4·7·10 확인(게임 실행 검증 아님).
- ModelBuilder로 프로젝트 모델 190개 중 Monster 보유 19개 확인: 모두 Kinematicbody·State·Hit·MonsterAI 경로. 모델/상태/애니메이션 변경 없음. 원본 감사 자료는 scratch/combat-hp-model-audit-20261021.json.
- Maker refresh ok. 빌드 로그: 18:00:04~18:01:59(KST), Error 0 / Warning 16(기존) / Info 923. 신규 로직 자동 codeblock 생성 확인. 첫 등록 직후 Monster에 남던 _UICombatHpLogic 미정의 안내 8건은 의존 스크립트 재빌드 후 0건. 최종 변경 스크립트 로그 시각 18:01:59 일치.

### 제작자 Play 확인 대기

1. 일반 몬스터 타격 → 머리 위 현재 HP, 재타격 시 5초 연장, 처치·맵 이탈 시 제거.
2. 보스방 → 상단 한글 이름·현재/최대 HP 및 피해 비율, 처치·퇴장 시 숨김. 모바일 가독성·시계 간격.
3. 주문서 첫150/다음3000, 다른 판매자도3000, 코인 부족 시 미지급, 재접속·캐릭터 슬롯 변경 후 이력 유지/분리.
4. 트래퍼 투척을 같은 적에 10번 맞혀 1·4·7·10 경직, 다른 공격자·다른 적은 별도, 3초 초과 공백/리스폰 후 첫 타 경직. 근접과 다른 무기·스킬 및 기존 HIT/사망 연출 회귀.

AGENTS P7에 따라 이번 턴은 Play·입력 시뮬레이션을 수행하지 않았다. 런타임 행은 완료로 처리하지 않는다.

## 후속 조정 진행 (2026-10-21)

제작자가 기존 체력바·보스바·상점·초기화 제한 점검 완료를 보고했다. 트래퍼 경직만 1·6·11…(StaggerEvery5)로 재조정한다.

- DATA-01/03: 기존 Ctrl/ThrowBasic→Dagger_Throw_1 경로 재사용, 변경 없음.
- DATA-02: 해당 행 StaggerEvery 3→5만 변경, 다른 셀 보존 확인.
- DATA-04/PAJ-04: 실제 IsKnockbackAllowed에서 1·6·11·16, 공격자/대상 분리·3초 공백을 검사 PASS: 1·6·11·16, 공격자/대상 분리·3초 공백 확인. refresh ok/build18:56:07 Error0. 이번 간격5의 실제 Play는 미확인.
- PAP/MHP: 시전·피해·모델·HIT/사망 연출을 수정하지 않는다. 기존 항목은 제작자 점검 완료로 기록하며 이번 간격5의 Play 확인을 뜻하지 않는다.

제작자 확인 갱신: 이전 HP·보스바·상점/초기화 항목 등 나머지는 점검 완료 보고. 후속 경직5타/환경 변경은 [새 기록](environment-stagger-tuning-20261021.md) 참조.

## 와일드키퍼 후속 적용 (2026-10-21)

- DATA-01/03: 기존 Nature/Tap → Nature_Tap_1 평타 경로 재사용. DATA-02: 해당 행 StaggerEvery 공란→5, CSV 나머지 모든 셀·BOM·줄바꿈 보존 확인. 트래퍼와 동일한 공격자/대상별 1·6·11·16… 경직.
- DATA-04/PAJ-04: SkillNumber → spec → Projectile.StaggerEvery → PlayerCombat.PendingStaggerEvery → Monster.IsKnockbackAllowed 기존 경로 유지. 회귀 검사에서 두 데이터 행을 각각 실제 Lua 메서드에 넣어 1·6·11·16 확인 PASS, 공격자/대상 분리·3초 초과 공백 초기화 PASS. 충전 회복·스킬 행은 보존.
- PAP/MHP: 실행 로직·공격 모션·모델·HIT/사망 연출 변경 없음. 현재 정책과 다른 소스 주석만 갱신.
- 검증: scripts/test_environment_stagger_20261021.cjs PASS, 관련3 mLua LSP Error0/Warning0, 데이터 열 참조364건/추적불가242건/없는열0, 설정2건/불일치0. Maker refresh ok, 최신 build 2026-10-21 19:29:55(KST) Error0/Warning16(기존)/Info922. 이번 와일드키퍼 변경 Play는 AGENTS P7에 따라 제작자 확인 대기.
