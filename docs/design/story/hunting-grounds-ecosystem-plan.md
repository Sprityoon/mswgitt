# 사냥터 몬스터 생태계 & 퀘스트 연계 상세 기획서 (hunting-grounds-ecosystem-plan)

> **작성일**: 2026-09-22 (제작자 승인 기반 ⚖️)  
> **상위 문서**: [story-bible.md](./story-bible.md) · [hunting-grounds-plan.md](./hunting-grounds-plan.md) · [quest-design.md](./quest-design.md) · [game_design.md](../../game_design.md)  
> **데이터 계약**: `MonsterSpawnDataSet` · `ItemDropDataSet` · `QuestDataSet` · `QuestConditionDataSet` · `StoryDialogDataSet` · `ItemDataSet`

---

## 1. 개요 및 기획 의도

기존의 사냥터 기획은 리소스 제작 부담을 줄이기 위해 전 구역(F1~F4)에서 슬라임, 멧돼지, 뿔버섯 3종의 스탯 배율만 조정하여 재탕하는 한계가 있었습니다.

본 기획서는 **MSW 공식 메이플스토리 몬스터 리소스 풀(카탈로그)**을 적극 활용하여:
1. **바이옴별 고유 몬스터 라인업 구축**: 바위 지대, 모래 언덕, 설원 등에 어울리는 상징적 메이플 몬스터를 배치하여 탐험과 사냥의 맛을 극대화합니다.
2. **보스 연출 및 기믹 차별화**: 단순 슬라임 리스킨을 벗어나 스톤골렘(B2), 데우(B3) 등 공식 보스 리소스 기반 고유 패턴을 구축합니다.
3. **전리품 ↔ 마을 연구소 ↔ 크래프팅 테크트리 유기적 결합**: 몬스터 사냥 전리품이 마을의 **연구소(Research Lab)** 및 대장간/요리/건축과 맞물려 생활·성장의 순환 루프를 형성합니다.
4. **스토리 퀘스트 라인 정합**: 퀘스트 엔진 하드 제약(11종 ActionEnum, 단일 조건, CountMode)을 철저히 준수하면서 흥미진진한 모험 서사를 완성합니다.

---

## 2. 사냥터별 몬스터 생태계 및 보스 명세

```
마을(town)
  └─ F1 흙 벌판 「검은 이슬」 ────── 보스 B1: 이슬 삼킨 것 (대형 슬라임)
       └─ F2 바위 지대 「바위 메아리」 ──── 보스 B2: 울림돌 파수꾼 (스톤골렘)
            └─ F3 모래 언덕 「모래에 잠든 길」 ── 보스 B3: 마른 우물의 지킴이 (데우)
                 └─ B5 첫 정원 「뜰지기」 ───── 최종 보스 B5: 뜰지기 (슬라임킹)
                      └─ F4 설원 「눈밭의 대답」 ── 보스 B4: 서리 그늘 (스노우맨) ※ 차기 아크
```

---

### 2.1. F1 — 흙 벌판 「검은 이슬」 (Tier 1: 초심자 / 구리 테크)

- **바이옴 ID**: `earth_field`
- **맵**: `map/field_earth.map` (보스: `map/boss_dewpit.map`)
- **분위기 & 무드**: 마을 문밖의 평화로운 초원. 군데군데 풀과 웅덩이가 검게 젖어 이상 기척이 감돎.
- **주요 테크/자원**: 구리 원석(`Copper Ore`), 일반 목재, 돌, 약초.

#### 몬스터 라인업
| 몬스터 ID | 몬스터 명칭 | 공격 타입 | MSW 리소스/동작 | 주요 드롭 전리품 |
|---|---|---|---|---|
| `slime` | **슬라임** | `CONTACT` | 점프 통통 튀며 접근, 기본 타격 | `slime_jelly`, 코인 |
| `ribbon_pig` | **리본돼지** | `CONTACT` | 꼬마 돼지. 경쾌하고 빠른 이동 | `raw_meat`, `pig_ribbon` (리본) |
| `orange_mushroom` | **주황버섯** | `CONTACT` | 메이플 상징 몬스터. 점프 쿵쿵 바디 어택 | `orange_mushroom_cap` (주황 갓) |
| `boar` | **와일드보어** | `CHARGE` | 정지 예고 후 직선 전속 돌진 (원작 분노 돌진) | `raw_meat`, `boar_leather`, 구리 원석 |

#### 보스전: B1 「이슬 삼킨 것」 (`dew_glutton`)
- **외형**: 검은 이슬을 과도하게 마셔 거대해지고 탁한 남빛으로 변한 슬라임 (`Slime.model` 스케일 2.5배 확대 + 남색 틴트).
- **패턴**:
  1. **구르기 (`CHARGE`)**: 플레이어 방향으로 전속 돌진. 벽이나 장애물에 충돌 시 잠시 기절(딜 타임).
  2. **이슬 장판 생성 (`MAGIC`)**: 바닥에 3개의 검은 이슬 장판 순차 생성. 밟으면 지속 피해 (`AttackTelegraph` 재사용).
  3. **분열**: 체력 50% 이하 시 일반 슬라임 2마리 소환.
- **처치 보상**: `slime_jelly` 대량, `recipe_scroll_copper`(구리 제련 두루마리), **「맑아진 이슬」** (B2 포탈 개방 열쇠).

---

### 2.2. F2 — 바위 지대 「바위 메아리」 (Tier 2: 고원 / 철 테크)

- **바이옴 ID**: `rocky`
- **맵**: `map/field_rocky.map` (보스: `map/boss_echocave.map`)
- **분위기 & 무드**: 거친 암벽과 협곡 사이로 바람이 우는 고원. 저음의 공명음(울림돌)이 울림.
- **주요 테크/자원**: 철 광석(`Iron Ore`), 단단한 목재, 바위 파편.

#### 몬스터 라인업
| 몬스터 ID | 몬스터 명칭 | 공격 타입 | MSW 리소스/동작 | 주요 드롭 전리품 |
|---|---|---|---|---|
| `stump` | **스텀프 / 다크스텀프** | `CONTACT` | 단단한 나무 밑동. 이동 속도는 느리나 높은 방어력 | `stump_wood` (단단한 장작), `stump_leaf` |
| `iron_hog` | **아이언호그** | `CHARGE` | 철제 투구와 갑옷을 두른 멧돼지. 고속 묵직한 돌진 | `iron_fragment` (철 조각), `raw_meat` |
| `horn_mushroom` | **뿔버섯** | `RANGED` | 바위 틈에 숨어 원거리 포자 투사체(`Projectile_Spore`) 발사 | `mushroom_spore`, `horn_fragment` (뿔 조각) |

#### 보스전: B2 「울림돌 파수꾼」 (`stone_golem` / `echo_warden`)
- **외형**: 공식 메이플스토리 **스톤골렘(Stone Golem)** 리소스 활용. 바위와 유적 석판이 엉겨 일어선 거대 수호자.
- **패턴**:
  1. **대지 강타 (`LEAP` / `SLAM`)**: 슬라임킹 도약 패턴 활용. 높이 솟구쳤다가 플레이어 위치로 낙하해 광범위 충격파.
  2. **바위 파편 투척 (`RANGED`)**: 사방 8방향으로 파편 투사체 난사.
  3. **울림 포효 (광역 전멸기)**: 3초간 바닥 진동 예고 후 맵 전체 충격파. **맵 안의 '울림돌(거대 바위)' 뒤로 몸을 숨겨야 무효화 (엄폐 기믹)**.
- **처치 보상**: `iron_ore` 대량, `recipe_scroll_iron`(철 제련 두루마리), **「울림돌 핵」** (모래 언덕 해금 단서).

---

### 2.3. F3 — 모래 언덕 「모래에 잠든 길」 (Tier 3: 사막 / 고대 유적 테크)

- **바이옴 ID**: `desert`
- **맵**: `map/field_desert.map` (보스: `map/boss_wellyard.map`)
- **분위기 & 무드**: 낮잠처럼 고요한 노을빛 사막 언덕. 메마른 우물과 부서진 첫 개척단 수레 흔적.
- **주요 테크/자원**: 고대 석판 조각, 선인장 섬유, 단단한 키틴질 껍질, 보석 원석.

#### 몬스터 라인업
| 몬스터 ID | 몬스터 명칭 | 공격 타입 | MSW 리소스/동작 | 주요 드롭 전리품 |
|---|---|---|---|---|
| `moredji` | **모래두지** | `CONTACT` | 모래 속을 파고들다 플레이어 주변에서 솟구쳐 급습 | `soft_sand` (고운 모래), `mole_claw` (두더지 발톱) |
| `catus` | **카투스 (선인장)** | `RANGED` | 제자리에서 몸을 부풀려 가시 침 투사체 연사 | `cactus_thorn` (선인장 가시), `cactus_flower` |
| `scorpion` | **스콜피온** | `MELEE_WEAPON` / `CONTACT` | 집게발 방어 + 꼬리 침 연속 찌르기 (중독 타격) | `scorpion_stinger` (전갈 독침), `chitin_shell` |
| `bellamoa` | **벨라모아** | `CONTACT` | 모래 능선을 따라 부드럽게 미끄러지듯 이동하는 사막 뱀 | `snake_scale` (방울뱀 비늘) |

#### 보스전: B3 「마른 우물의 지킴이」 (`deu` / `well_keeper`)
- **외형**: 공식 메이플스토리 사막 보스 **데우(Deu)** 리소스 활용. 지팡이를 짚은 고대 선인장 정령.
- **패턴**:
  1. **모래 소용돌이 (블랙홀)**: 마른 우물 중앙으로 플레이어를 서서히 흡인 (외곽 방향 지속 이동 저항 필요).
  2. **가시 폭풍**: 맵 전역에 5개의 연속 예고 원 생성 후 거대한 가시 기둥 솟구침.
  3. **메마름의 저주**: 플레이어 스태미나 자연 회복을 일시 차단 (주변 오아시스/수원지 상호작용으로 정화).
- **처치 보상**: 상위 장신구 재료, **「첫 정원의 지도」** (B5 첫 정원 해금 열쇠).

---

### 2.4. F4 — 눈밭 「눈밭의 대답」 (Tier 4 / 차기 아크: 설원)

- **바이옴 ID**: `snowfield`
- **맵**: `map/field_snow.map` (보스 아레나 미정)
- **분위기 & 무드**: 첫 정원에서 도망친 어둠이 숨어든 극한의 만년설 지대.
- **몬스터 라인업**:
  - `jr_yeti` / `yeti` (**주니어 예티 / 예티**): 묵직한 완력과 분열 기믹.
  - `pepe` (**페페**): 떼 지어 뒤뚱거리며 무리 지어 이동.
  - `white_fang` / `hector` (**화이트팽 / 헥터**): 설원의 늑대 맹수, 빠른 도약 돌진.
  - **보스**: `snowman` (**스노우맨**) — 눈보라 강타 및 거대 눈뭉치 굴리기.

---

## 3. 퀘스트 라인 연계 개편안 (Chapter 2 ~ Chapter 4)

퀘스트 시스템의 하드 제약(11종 `ActionEnum`, 단일 조건, `CountMode`, `TurnInNpcId` 필수 분기)을 완벽히 준수한 구체적 퀘스트 체인입니다.

### 3.1. 챕터 2: 「검은 이슬」 (F1 흙 벌판)
| Id | 퀘스트 이름 | Giver → TurnIn | 조건 (CondEnum, CondArg, Value) | CountMode | 이야기 & 시스템 역할 |
|---|---|---|---|---|---|
| 211 | 벌판의 이상 신호 | elder → elder | `Kill,slime,5` | Action | 흙 벌판 진입 후 기본 슬라임 정화 |
| 212 | 끈적이는 표본 | researcher → researcher | `Gather,Slime Jelly,3` | Action | 전리품 획득(`Gather`) 학습 및 연구소 납품 |
| 213 | 꼬꼬마 멧돼지의 소동 | barnkeeper → barnkeeper | `Kill,ribbon_pig,3` | Action | [신규] 리본돼지 퇴치. 헛간 가축 안정화 |
| 214 | 구리 한 줌 | blacksmith → blacksmith | `Gather,Copper Ore,10` | Action | 벌판 채광을 통한 구리 원석 확보 |
| 215 | 화로의 첫 쇳물 | blacksmith → blacksmith | `Smelt,Copper Bar,2` | Action | 화로 제련을 통한 구리 주괴 제작 |
| 216 | 억센 야생의 돌진 | elder → elder | `Kill,boar,3` | Action | 야생 멧돼지의 돌진 패턴 대응 학습 |
| 217 | **이슬을 삼킨 것** | elder → elder | `Kill,dew_glutton,1` | Action | **B1 보스전**. 맑아진 이슬 획득 → F2 바위 지대 포탈 개방 |

---

### 3.2. 챕터 3: 「바위 메아리」 (F2 바위 지대)
| Id | 퀘스트 이름 | Giver → TurnIn | 조건 (CondEnum, CondArg, Value) | CountMode | 이야기 & 시스템 역할 |
|---|---|---|---|---|---|
| 221 | 메아리치는 고원으로 | elder → elder | `Warp,field_rocky,1` | Action | F2 바위 지대 진입 확인 |
| 222 | 딱딱한 나무 밑동 | researcher → researcher | `Kill,stump,5` | Action | [신규] 고원 식생 표본 확보 (스텀프 퇴치) |
| 223 | 철갑을 두른 위협 | blacksmith → blacksmith | `Kill,iron_hog,4` | Action | [신규] 돌진하는 아이언호그 처치 및 철 부속 수급 |
| 224 | 깊은 곳의 철맥 | blacksmith → blacksmith | `Gather,Iron Ore,10` | Action | 고원 바위 속 상위 철 광석 채광 |
| 225 | 강철의 손맛 | blacksmith → blacksmith | `Craft,Iron Pickaxe,1` | State | 철 곡괭이 제작 |
| 226 | 바위 틈의 날카로운 포자 | barnkeeper → barnkeeper | `Kill,horn_mushroom,5` | Action | 원거리 포자를 쏘는 뿔버섯 퇴치 |
| 227 | **울림돌의 파수꾼** | researcher → elder | `Kill,stone_golem,1` | Action | **B2 보스전**. 바위 엄폐 기믹 격파 → F3 모래 언덕 개방 |

---

### 3.3. 챕터 4: 「모래에 잠든 길」 (F3 모래 언덕)
| Id | 퀘스트 이름 | Giver → TurnIn | 조건 (CondEnum, CondArg, Value) | CountMode | 이야기 & 시스템 역할 |
|---|---|---|---|---|---|
| 231 | 침묵의 모래 언덕 | elder → elder | `Warp,field_desert,1` | Action | F3 모래 언덕 진입 확인 |
| 232 | 모래 속의 그림자 | researcher → researcher | `Kill,moredji,5` | Action | [신규] 발밑에서 기습하는 모래두지 퇴치 |
| 233 | 메마른 땅의 가시 | fisher → fisher | `Gather,cactus_thorn,6` | Action | [신규] 카투스를 잡아 도구/바늘 재료 선인장 가시 수집 |
| 234 | 독침의 위협 | blacksmith → blacksmith | `Kill,scorpion,4` | Action | [신규] 맹독 꼬리를 가진 전갈 퇴치 |
| 235 | 마른 우물가의 단서 | elder → elder | `Gather,Stone,10` | Action | 마른 우물 주변 고대 기록 조각 발굴 |
| 236 | **마른 우물의 지킴이** | elder → elder | `Kill,deu,1` | Action | **B3 보스전 (데우)**. 격파 후 「첫 정원의 지도」 획득 |

---

## 4. 마을 연구소(Research Lab) 및 제작 테크 시너지

몬스터 전리품은 단순 상점 판매 아이템이 아니라, **마을 연구소의 연구 과제 재료**로 활용되어 플레이어의 영구 패시브와 고급 레시피를 해금합니다:

1. **아이언호그의 철판 조각 (`iron_fragment`)**:
   - **연구 과제**: "강화 단조 공정" (대장장이 로체 연계)
   - **보상**: 화로에서 주괴 제련 시 추가 주괴 획득 확률 +15% 패시브 해금.
2. **카투스의 선인장 가시/수액 (`cactus_thorn` / `cactus_flower`)**:
   - **연구 과제**: "건조 지대 보습 기법" (연구원 엘렌 연계)
   - **보상**: 농작물 수분 유지 시간 2배 증가 (물 주기 빈도 완화).
3. **스텀프의 단단한 장작 (`stump_wood`)**:
   - **연구 과제**: "고강도 목공술" (연구원 엘렌 연계)
   - **보상**: 영지 방어 울타리 및 신규 오크목 가구 3종 레시피 해금.
4. **스콜피온의 독침 (`scorpion_stinger`)**:
   - **연구 과제**: "독성 중화 및 코팅"
   - **보상**: 무기 공격 시 몬스터를 3초간 감속시키는 '독성 오일' 연금 레시피 해금.

---

## 5. 구현 체크리스트 (향후 실무 작업 가이드)

- [ ] **1. 모델 생성 (`RootDesk/MyDesk/Monster/Models/`)**:
  - `RibbonPig.model`, `OrangeMushroom.model`
  - `Stump.model`, `IronHog.model`, `StoneGolem.model`
  - `Moredji.model`, `Catus.model`, `Scorpion.model`, `Deu.model`
- [ ] **2. 몬스터 스폰 데이터셋 반영 (`MonsterSpawnDataSet.csv`)**:
  - `earth_field`: slime(70), ribbon_pig(60), orange_mushroom(40), boar(30)
  - `rocky`: stump(70), iron_hog(60), horn_mushroom(50)
  - `desert`: moredji(70), catus(60), scorpion(50)
- [ ] **3. 드롭 데이터셋 반영 (`ItemDropDataSet.csv`)**:
  - 신규 몬스터 전리품 드롭율 및 최소/최대 수량 배정
- [ ] **4. 퀘스트 데이터셋 반영 (`QuestDataSet.csv`, `QuestConditionDataSet.csv`, `StoryDialogDataSet.csv`)**:
  - 챕터 2~4 신규 퀘스트 행 등록 및 대사 작성
- [ ] **5. 검증 (`maker_refresh_workspace` + `maker_logs(kind="build")`)**
