# 퀘스트 라인 설계 — 챕터별 체인 + CSV 반영 규칙 (quest-design)

> 챕터 서사([story-bible.md](./story-bible.md) §3)를 실제 `QuestDataSet`/`QuestConditionDataSet`/`StoryDialogDataSet` 행으로 옮기기 위한 설계.
> 시스템 원문: [story-npc-quest-plan.md](./story-npc-quest-plan.md). 대사 말투: [npc-cast.md](./npc-cast.md). 무대: [map-concepts.md](./map-concepts.md).
> 작성: 2026-08-14. 여기 퀘스트는 전부 🧭 초안이다 (✅ 표기 행 제외). **❓ 항목은 반영 전 실측이 의무다 (README §3-4).**

---

## 1. 하드 제약 (요약 — 위반 콘텐츠는 반려)

1. **조건은 10종뿐** (✅ `ActionEnum` 실측): `Attend` `StateChange` `MesoChange` `StaminaChange` `Kill` `Gather` `Craft` `Smelt` `Place` `Warp`. 호위·타이머·"대화만으로 완료" 없음 — 필요하면 "시스템 제안"으로 분리.
2. **조건 인자(CondArg)의 검증 상태**:

   | CondEnum | 인자 의미 | 상태 |
   |---|---|---|
   | Gather | 아이템 `Name` (Grass/Wood/Stone) | ✅ 101·103·105·201 가동 — 단, **직접 채집** 기준. 드롭 습득(구리 등)도 집계되는지 ❓ |
   | Craft | 결과 아이템 `Name` | ✅ 102·104 가동 |
   | Place | 설치 가구 `Name` | ✅ 106 가동 |
   | Warp | 빈칸 = 아무 포탈 이동 | ✅ 107 가동 — 특정 목적지 지정 가능 여부 ❓ |
   | Kill | 몬스터 Id 추정 (`slime`/`boar`/`horn_mushroom`) | ❓ 사용례 0 — 인자 표기·발화 지점 실측 필수 |
   | Smelt | 제련 결과 `Name` 추정 | ❓ 사용례 0 |
   | Attend·StateChange·MesoChange·StaminaChange | — | ❓ 사용례 0 — 실측 전 콘텐츠 배정 금지 |
3. **수주/보고 NPC는 `VillagerDialog` 부착 NPC만** (elder·fisher·resident_a~d). 검증된 것은 elder(201)뿐 — fisher·resident 첫 사용 시 재생기 동작 확인. `merchant`·시설은 불가 ([npc-cast.md](./npc-cast.md) §0).
4. **아이템·몬스터·포탈 키는 §6 부록의 영문 키 그대로** (pitfalls 규칙 4). 존재하지 않는 키 금지, 신규 아이템은 ❓ 비용 항목으로 분리.
5. **대사 형식** (⚖️): 한 문장 40자 내외 · 이모지 금지 · "…" 하나. 분량 = offer 2~4 / progress 1 / complete 1~3 문장. 몬스터 전투 서술 = **"퇴치"** (⚖️ 2026-08-14 — [story-bible.md](./story-bible.md) §5 용어집).
6. **한 퀘스트 = 조건 1행** 유지 (현행 데이터 전례). 다조건(같은 Id 복수 행) 지원 여부 ❓ — 실측 전 사용 금지.

## 2. 규약 제안 (🧭)

### 2.1 Id 블록

| 블록 | 용도 | 상태 |
|---|---|---|
| 101~1xx | 튜토리얼 (AutoAccept 직렬) | ✅ 가동 |
| 2 0 1~209 | 챕터 1 | 201 ✅ |
| 211~219 / 221~229 / 231~239 / 241~249 | 챕터 2 / 3 / 4 / 5 | 초안 |
| 3xx | 설원 이후 차기 아크 예약 | — |

### 2.2 공통 값

- 메인 챕터 퀘스트: `CategoryEnum=Main`, `AutoAccept` 빈칸(대면 수주), `CannotAbandon=O`(온보딩 201 전례 따름 ❓— 202 이후는 포기 허용 검토), `Priority`는 Id 순.
- 게이트는 `RequiredId`로 직전 퀘스트를 지정 (✅ 201이 `RequiredId=107` — 대면 수주 퀘의 검증된 패턴). `LinkedPrevId`는 AutoAccept 직렬 체인(튜토리얼) 전용으로 남긴다 ❓(두 컬럼의 동작 차이 실측 후 확정).
- 보상 문법(✅): `RewardItems="Name:수량|Name:수량"` · `RewardUnlockId`(레시피 해금) · `RewardPortalId`(포탈 개통 — 106→town 가동).

### 2.3 구역 개방 정책 (❓ Q7 — 제작자 결정)

- **A안 (스토리 개방)**: 챕터 3·4 마지막 퀘스트의 `RewardPortalId`로 hunt02/hunt04 웨이포인트를 개통. 이야기가 문을 여는 구조 — 단, `RewardPortalId`가 waypoint형 목적지에도 유효한지 ❓ 실측 필요 (`GrantEstatePortal` 경로).
- **B안 (도보 개방 유지)**: game_design §2.2 ③의 D2식 "최초 도달 개방"만 두고, 퀘스트는 도달을 안내만 한다 (`Warp` 조건).
- 절충안: 필드(hunt02·03)는 B, 보스(hunt04)만 A — "정원의 위치는 이야기로만 알 수 있다"는 서사와 정합.

## 3. 챕터 1 「마을의 푸른 빛」 — 상세 초안 (town)

> 기존 ✅ 201 + 신규 4퀘 = 5퀘. 대사 초안은 집필 단계에서 npc-cast 카드로 작성 (아래는 방향 1줄).

| Id | 이름(안) | Giver→TurnIn | 조건 (CondEnum,CondArg,Value) | 보상 | 게이트 | 이야기 비트 |
|---|---|---|---|---|---|---|
| 201 ✅ | 촌장의 걱정 | elder→elder | Gather,Grass,5 | Wood:15\|Stone:10 | RequiredId=107 | 불씨의 존재 (반영 완료) |
| 202 | 연못가의 첫 수업 | fisher→fisher | Craft,Fishing Rod,1 | Coin:30 | RequiredId=201 | "마음이 들뜰수록 낚싯대부터" — fisher 온보딩. fisher 수주 첫 사용 ❓ 재생기 확인 |
| 203 | 골목의 목격담 | resident_c→resident_c | Gather,Wood,10 | Grass Seed:5 | RequiredId=202 | 가로등 손질 나무를 모아 주면, 밤에 본 연구소 창가 빛 이야기를 들려줌 |
| 204 | 창가의 받침돌 | elder→elder | Gather,Stone,10 | Roasted Grass:3 | RequiredId=203 | 연구소 창가에 둘 받침 — 불씨를 "맞이하는" 마을의 태도 |
| 205 | 벌판의 기척 | elder→elder | Warp,,1 | Wood:20\|Stone:20 | RequiredId=204 | 벌판 소문(노점 주민 발) 확인차 첫 원정 → complete가 챕터 2 예고 |

- 앰비언트 증분(~10줄): resident_b(벌판 소문) · resident_a(밤 광장이 환하다) · fisher(물밑이 수상하다) 등 — 집필 단계.
- ❓ 205의 Warp는 목적지 미지정(107 전례). hunt01 지정 가능해지면 교체.

## 4. 챕터 2~5 — 퀘스트 골격 (집필 전 단계)

### 4.1 챕터 2 「검은 이슬」 (hunt01) — 잠식의 물증 + 구리 테크 + 드롭→연구 개시

| Id | 이름(안) | Giver | 조건 | 비고 |
|---|---|---|---|---|
| 211 | 잠식된 이웃 퇴치 | elder | Kill,slime,5 ❓ | Kill 인자·발화 실측 후 반영. 퇴치 후 "잠식이 걷히는" 연출 방향 |
| 212 | 검은 이슬 표본 | elder | Gather,Slime Jelly,3 ❓❓ | **§4.6 드롭 라인업(Q9) 채택 전제.** 미채택 시 대체: Kill,slime,10 ❓. 연구소 "잠식 표본 연구"(§4.6)와 연결 |
| 213 | 구리 한 줌 | elder | Gather,Copper Ore,10 | 드롭 습득 집계 여부 ❓ (§1-2) |
| 214 | 화로의 첫 쇳물 | elder | Smelt,Copper Bar,2 ❓ | 연구소 연구(구리 10 소모) 안내를 Desc에 |
| 215 | 구리 손맛 | elder | Craft,Copper Pickaxe,1 | `research_copper_tools` 해금 선행 — Desc가 연구 유도 |
| 216 | 이정표 아래에서 | elder | Kill,boar,3 ❓ | complete: 이정표 문양 = 두루마리 문양 (빛 사슬 2) + 검은 이슬 재확인 (그늘 사슬 2) |

### 4.2 챕터 3 「바위 메아리」 (hunt02) — 철 테크와 심지

| Id | 이름(안) | 조건 | 비고 |
|---|---|---|---|
| 221 | 메아리를 따라 | Warp ❓ 또는 §2.3 개방 정책 | hunt02 진입 |
| 222 | 뿔버섯의 사정 | Kill,horn_mushroom,5 ❓ | 뿔버섯 데뷔 — "사정" = 잠식된 것. 퇴치 서술(⚖️ 용어집) |
| 223 | 철 한 줌 | Gather,Iron Ore,10 | 철 노드(✅ IronNodeResource) 채광이라 Gather 확실성 높음 |
| 224 | 단단한 해독 | Craft,Iron Pickaxe,1 | `research_iron_tools` 선행 |
| 225 | 웅웅거리는 조각 | Gather,Stone,15 | 캔 돌 중 울림돌 조각 발견(연출) — 신규 아이템 없이 처리 (단서 3) |

### 4.3 챕터 4 「모래에 잠든 길」 (hunt03) — 기록과 위치

| Id | 이름(안) | 조건 | 비고 |
|---|---|---|---|
| 231 | 모래 길 | Warp ❓ / 개방 정책 | hunt03 진입 |
| 232 | 사막의 이웃들 | Kill,horn_mushroom,7 ❓ | 사막 주력 스폰(✅ 가중 80) |
| 233 | 여정의 채비 | Craft,Roasted Grass,3 | 요리로 완급 조절 — 코지 리듬 유지 |
| 234 | 마른 우물가의 기록 | Gather,Grass,5 | **201과 같은 조건 — 수미상관.** 기록 틈 풀에 불씨가 반응(단서 4). 보상 `RewardPortalId=hunt04` ❓(§2.3 A안) |

- ❓ 사막 바이옴의 풀·나무 자원 분포는 `BiomeResourceDataSet` 확인 후 조건 확정.

### 4.4 챕터 5 「첫 정원의 뜰지기」 (hunt04) — 퇴치와 정화

| Id | 이름(안) | 조건 | 비고 |
|---|---|---|---|
| 241 | 정원에 들기 전에 | Craft,Monster Ward,1 | 와드 = "그늘이 꺼리는 물건"(잠식 세계관과 정합 — ✅ 레시피 T1 존재) · 보스맵 유틸 온보딩 겸용 |
| 242 | 잠식을 걷어내다 | Kill,(슬라임 킹),1 ❓ | 보스 Id 표기 실측 (`SlimeKing.model`) · **퇴치 = 정화** — 뜰지기에게서 그늘 조각이 빠져나가 눈밭 쪽으로 달아나는 연출(에필로그 훅) · T1 보스 = 구리 빌드 게이트(✅)와 정합 |
| 243 | 등불을 다시 걸다 | Gather,Grass,10 ❓ | 정원의 풀로 심지 갈무리 — 보스맵 자원 스폰 여부 실측. 보상 = §4.5 |

### 4.5 완주 보상 (❓ Q6 — 제작자)

- **A안**: 신규 가구 「정원의 등불」 (`item_dataset` 1행 + `Prop_LampPost` 리스킨 모델) — 영지에 남는 이야기의 기념품. 비용: 아이템 행+모델+아이콘.
- **B안 (비용 0)**: 기존 보상 조합 `Feast Dish:3|Coin:300` + town 연구소 창가 점등 연출([map-concepts.md](./map-concepts.md) §1.2).

### 4.6 몬스터 드롭 → 연구·발전 축 (⚖️ 방향 확정 2026-08-14 · 🧭 라인업 = ❓ Q9)

⚖️ 제작자 확정: **몬스터를 사냥해 얻는 아이템으로 연구·발전을 할 수 있어야 한다.**
이는 원 설계와도 일치한다 (✅ [game_design.md](../../../game_design.md) §2.2 ② 연구소 컨셉 — "멧돼지 다리를 연구하면 고기와 가죽으로 분해하는 기술을 얻는다").

**현행 실측**: 몬스터 드롭은 코인 중심(`MonsterCoinDropDataSet`) + 멧돼지 생고기(`Raw Meat`)뿐이고, 연구 입력은 광석 2종뿐(`ResearchDataSet`) — 사냥→연구 고리가 아직 없다.

🧭 **제안 라인업** (전부 데이터 행 — 코드 무변경 전제, `ItemDropDataSet` 경로 재사용):

| 신규 아이템 (`Name` / 표시명) | 드롭원 | 소비처 (신규 `ResearchDataSet` 행) | 산출(해금) 방향 |
|---|---|---|---|
| `Slime Jelly` / 슬라임 젤리 | slime | **잠식 표본 연구** | Monster Ward 강화 레시피 or 신규 소모품 (제작자와 확정) |
| `Boar Hide` / 멧돼지 가죽 | boar | 가죽 가공 연구 | 가방·장비류 제작 라인 (발전 축) |
| `Mushroom Cap` / 뿔버섯 갓 | horn_mushroom | 포자 연구 | 상위 버프 요리 재료 해금 |
| `Gloom Shard` / 그늘 조각 | SlimeKing (1회) | — (스토리 키 아이템, `Tradable=false`) | 설원 아크 열쇠 — 챕터 5 연출용 |

- 비용: `item_dataset` 4행 + 아이콘 RUID 4종(`msw-search`) + `ItemDropDataSet` 행 + `ResearchDataSet` 2~3행 + (선택) 드롭 모델. 
- ❓ 반영 전 실측 2건: ① `Gather` 조건이 **드롭 습득**을 집계하는지 (§1-2 — 212 성립 조건) ② 연구 산출 해금 대상 확정(제작자).
- 챕터 연계: 2장 212(젤리)에서 축을 열고, 3장(갓)·4장(가죽)은 의뢰·앰비언트로 소비처를 넓힌다 — 챕터마다 새 연구 1건이 리듬.

## 5. CSV 반영 체크리스트 (행 투입 전마다)

1. [ ] 아이템·몬스터·포탈 키를 §6 부록과 **문자 단위로 대조** (규칙 4 — `Name` 영문 키).
2. [ ] 조건의 ❓가 남아 있으면 **먼저 실측** (QuestAndAchievement 패키지 `.mlua`에서 CondEnum 발화 지점·인자 확인).
3. [ ] 열 수·순서 검증 — 🔴 전례: 201행 컬럼 1칸 밀림으로 **퀘스트가 통째로 로드 스킵**된 사고 (2026-08-10, tasks.md). 행 추가 후 열 개수 카운트.
4. [ ] `StoryDialogDataSet` 분량·형식 (§1-5) + npc-cast 말투 준수. 신규 NPC 대사는 카드 먼저.
5. [ ] `maker_refresh_workspace` ok → build 로그 Error=0 + **dateTime이 이번 refresh와 일치** (pitfalls 규칙 22).
6. [ ] [README.md](./README.md) §2 진행 보드 + [docs/tasks.md](../../tasks.md)에 기록, 상태를 ✅로.
7. [ ] **런타임 검증 보류(제작자 Play)** 명기 — 수주→진행→보고→보상 전 구간은 Play로만 확정된다.

## 6. 부록 — 사용 가능한 키 (✅ 2026-08-14 실측 스냅샷)

> 원본: `item_dataset.csv` / `MonsterSpawnDataSet.csv` / `PortalDestinationDataSet.csv` / `ResearchDataSet.csv`. **CSV가 늘 우선** — 어긋나면 이 표를 갱신.

- **자원**: `Wood` `Stone` `Grass` `Copper Ore` `Iron Ore` `Copper Bar` `Iron Bar` `Coin` `Carrot` `Egg` `Wool` `Raw Meat` `Carp` `Shrimp` `Salmon` `Tuna`
- **도구**: `Hand Axe` `Stone Pickaxe` `Stone Axe` `Copper Pickaxe` `Copper Axe` `Iron Pickaxe` `Iron Axe` `Shovel` `Hoe` `Water Spade` `Fishing Rod`
- **가구**: `Wooden Chest` `Furnace` `Cooking Pot` `Bed` `Wood Floor` `Portal` `Animal Pen` `Monster Ward`
- **소모품**: `Roasted Grass` `Carrot Soup` `Veggie Stir Fry` `Feast Dish` `Roasted Meat` `Egg Omelette` `Grass Seed` `Carrot Seed` `Chicken Ticket` `Sheep Ticket` `Dog Whistle` `Recipe Scroll: Copper Tools` `Recipe Scroll: Iron Tools`
- **몬스터**: `slime` `boar` `horn_mushroom` (스폰 데이터 기준) · 보스 `SlimeKing`(모델명 — Kill 인자 표기 ❓)
- **포탈 목적지**: `town` `hunt01` `hunt02` `hunt03` `hunt04`
- **연구/해금 Id**: `research_copper_tools` `research_iron_tools` · 퀘스트 해금 전례 `quest_cooking_pot`(✅ 107)
