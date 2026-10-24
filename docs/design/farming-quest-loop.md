# 농사 · 일일 의뢰 루프 — 정합본 (farming-quest-loop)

> 원안: [Quest Add.md](./Quest%20Add.md) (2026-10-22 외부 자료 기반 기획 — 게임을 직접 보지 않고 작성되어 창의적이지만 실물과 어긋나는 부분이 있음).
> 이 문서 = **원안을 실제 게임 데이터·코드·NPC 로스터에 맞춘 버전**. 어긋나면 이 문서와 CSV가 우선한다.
> 말투 기준: [story/npc-cast.md](./story/npc-cast.md) · 대사 형식: [story/story-bible.md](./story/story-bible.md) §0.

---

## 0. 원안과 실물의 차이 (실측 2026-10-22)

| 원안 가정 | 실제 게임 | 처리 |
|---|---|---|
| 107 완료 → 바로 201(사냥터) | 107 → 201은 맞지만 201은 **촌장의 풀 5개 조사**(사냥은 205부터) | 109~112를 107과 201 사이에 삽입, 201 `RequiredId` 107→112 |
| 108번이 비어 있음 | 108 = 주먹도끼 던지기(튜토리얼 분기) | 새 체인은 **109~112** |
| 토리 = 밀짚모자 소녀, 해요체 | 토리 = **조용하고 다정한 청년**, 반말 + "…" (기존 CSV 역산) | 대사 전면 교정 |
| 201 수주자 = 경비대장 카인 | 201 수주자 = 촌장 | 카인 없음 → 촌장에 통합 |
| 연구소장 엘린 | 연구원 **엘렌** | 이름 교정 |
| 호미만 있으면 밭 | **삽으로 잔디를 두 번 파 2×2 흙을 드러낸 뒤 호미** (`till_field`는 순수 흙 마스크 15에서만) | 110에 삽 제작 조건 추가 |
| 요리 = Craft, 재료 여러 개 | 조리 냄비가 `Furnace` 복제(재료 1종 · 땔감 필요 · `Smelt` 신호)였음 | ⚖️ 2026-10-22 **전용 `CookingPot`으로 분리** (§3.5) — 레시피 선택형 · 짧은 타이머 · 땔감 없음 · 수거 시 `Craft` |
| 게시판 납품 = `StateChange,DeliverRequest` | `StateChange`는 미검증(Jump 조건이 점유) | **신규 조건 `Deliver`** (ActionEnum 14) |
| 무작위 3건 중 하나 납품 | 하루 3건은 전 서버 공통 추첨 — 초보가 못 낼 수 있음 | **첫 칸은 항상 `easy`(나무·돌·풀·당근)** |
| 신규 작물 5종·물뿌리개·퇴비·대풍년·덩굴 재수확 | 작물은 당근 1종, 해당 아이템·스프라이트 없음 | **보류** (§5 — 아트·아이템 선행) |
| 의뢰 25종 | 의뢰 품목 상당수가 미구현 아이템 | **기존 아이템 24종으로 재구성** |
| 경제 수치 (보상 75~350코인) | 현 의뢰 보상 12~60코인, 판매가 나무·돌 2 / 당근 5 | 현 경제 기준 1.5~2.5배로 재산정 |

## 1. NPC 통합 (⚖️ 2026-10-22 제작자 지시: 모호·중복 NPC는 기존 NPC에 통합, 필요한 NPC는 마을에 추가)

| 원안 NPC | 처리 | 근거 |
|---|---|---|
| 촌장 루카스 | `elder` 그대로 | — |
| 헛간지기 토리 | `barnkeeper` 그대로 (말투만 교정) | — |
| 대장장이 로체 | `blacksmith` 그대로 | — |
| 연구소장 엘린 | → `researcher` 엘렌 | 동일 인물 |
| 경비대장 카인 | **신규 NPC `guard`** (⚖️ 제작자 재지시) | 마을 입구(영지 포탈 옆) 지킴이 · 순찰·초소 의뢰 |
| 목수 잭 | **신규 NPC `carpenter`** (⚖️ 제작자 재지시) | 대장간 왼쪽 · 마을 공사장·벤치 등 목공 의뢰 (마을 구석 공사장 소품의 주인) |
| 광부 두목 반즈 · 석공 브론 | → `blacksmith` 로체 | 돌·광석은 대장장이 몫 |
| 재단사 클레어 · 잡화상인 도란 | → `vendor` 마리 | 의상·노점 담당과 겹침 (`merchant`는 대화창이 없어 대사 불가) |
| 촌장 손녀 루루 | **신규 NPC `granddaughter`** (⚖️ 제작자 재지시) | 비어 있던 노란 버섯집 앞 · 고양이·꽃 화관 의뢰 |
| 마을 고양이 네로 | 루루의 의뢰 속 고양이로 흡수 | 마을 `Animal_Cat`·게시판 고양이 그림이 이미 있음 |
| 제빵사 마르코 · 요리사 피에르 · 주점 주인 벨라 | **신규 NPC 1명 「식당 주인 벨라」 (`cook`)** | 요리 축 담당 NPC가 없었음 (npc-cast §4 여관 주인 제안과 같은 자리) |

- 벨라: `NPC/Models/Villager_Cook.model` · 공식 리소스 `npc/3003412.img`(아주머니) stand 클립 `b45b99a75781498f8634c7cf8bdf7992` · town (10.4, 12.0) 주황 버섯집 오른쪽 앞 · Scale 3.
- 카인: `Villager_Guard.model` · `npc/2230200.img`(병사) · town (-2.0, 6.8) Scale 2.2
- 잭: `Villager_Carpenter.model` · `npc/1530642.img`(망치의 달인, 안전모) · town (-16.2, 1.0) Scale 2.2
- 루루: `Villager_Granddaughter.model` · `npc/3003414.img`(꼬마, 꽃다발) · town (-5.8, 11.6) 노란 버섯집 앞 Scale 2.4
- 말투 카드: [npc-cast.md](./story/npc-cast.md) §2 `cook`·`guard`·`carpenter`·`granddaughter`.

## 2. 온보딩 체인 109~112 (✅ CSV 반영 2026-10-22)

| Id | 이름 | 수주 → 보고 | 조건 | 넘김 | 보상 |
|---|---|---|---|---|---|
| 109 | 마을의 환영 | 촌장 → 토리 | (없음 — 토리에게 말 걸면 완료) | — | 당근 씨앗 3 · 나무 3 · 돌 2 · Exp 30 |
| 110 | 거친 땅에 숨결을 | 토리 → 토리 | `Craft,Shovel` State · `Craft,Hoe` State · `Place,Carrot Seed,3` Action | — | 당근 씨앗 5 · 코인 30 · Exp 60 |
| 111 | 흙투성이 첫 수확 | 토리 → 벨라 | `Gather,Carrot,3` Action · `Craft,Carrot Soup,1` **Have** | 당근 수프 1 | 당근 수프 2 · 코인 50 · Exp 80 |
| 112 | 이웃이 되는 법 | 촌장 → 촌장 | `Deliver` (아무 의뢰) 1 Action | — | 코인 60 · 당근 씨앗 5 · Exp 100 |

- 게이트: 109 `RequiredId=107` → 110~112 순차 → **201 `RequiredId=112`**. 이미 201 이후를 진행한 캐릭터도 109를 받을 수 있다(107 완료자 전원).
- `Priority` 1009~1012 — 같은 NPC의 직업 퀘스트(331 등)보다 먼저 제안된다.
- 111 수프 조건은 보고 때 넘기므로 `Have` (pitfalls 56).
- 조리 냄비는 107 보상 해금(`quest_cooking_pot`)으로 이미 만들 수 있다.

## 3. 일일 의뢰 게시판 개편 (✅ 반영 2026-10-22)

**데이터** `RequestPoolDataSet.csv` 컬럼 추가: `Difficulty`(easy/normal/hard/bonus) · `RequesterNpcId` · `RequesterName` · `Story` · `ThanksText` · `ExtraRewards`(`Name:수량|...`).

- 24종 = easy 8 · normal 10 · hard 6 (농사·요리·목축·제작·사냥/채집·낚시). 전부 기존 `item_dataset.Name`.
- 추첨: 날짜 시드 결정론 유지. **1칸 = easy 풀에서**, 2~3칸 = 나머지 전체에서. `bonus` 행은 추첨 제외.
- **올클리어 보답**: `Difficulty=bonus` 행(`daily_all_clear`) — 오늘 3건을 모두 납품하는 순간 코인 60 + 당근 씨앗 3. 지급 기록은 같은 완료 목록(`DailyCompletedRequestsJson`)에 그 Id로 남겨 하루 1회.
- **주민 연동**: 의뢰를 올린 주민에게 말을 걸면 그날 한 번 부탁(`Story`) → 납품 뒤 한 번 감사(`ThanksText`). 상점을 겸하는 주민도 이 한마디가 먼저 나오고, 다음 대화부터 평소대로.
- 게시판 UI: 의뢰 줄 끝에 의뢰인 이름, 하단 안내 = `오늘 n/3 · 모두 마치면 코인 x60 · 당근 씨앗 x3`.
- 납품 성공 시 `ActionEnum.Deliver(14)` 발행 → 퀘스트 조건 `Deliver` (CondArg 빈 칸 = 아무 의뢰 / RequestId / 납품 아이템 Name).

## 3.5 조리 냄비 — 레시피 선택형 (⚖️ 2026-10-22 제작자 결정 · ✅ 반영)

- 결정: **레시피 선택형 · 짧은 타이머 · 땔감 없음**.
- 흐름: 냄비에 F → 제작창이 **요리 모드**로 열림(국물/구이/일품 필터) → 요리 선택 후 「요리」 → 재료 즉시 차감, 냄비 예약 큐에 1그릇 추가(연타 = 여러 그릇, 최대 10) → 냄비가 차례로 조리 → 완성품이 냄비에 쌓임 → 냄비에 F 한 번으로 전부 수거(`Craft` 신호).
- 상세 패널 하단 줄 = 냄비 상태(`조리 중: 당근 수프 5초 · 예약 2` / `완성 3개 · 냄비에 F로 수거`). 재료 3종 레시피는 3칸(-130/0/130)으로 펼친다(3번째 칸은 Slot2 런타임 복제).
- `CookingRecipeDataSet` 스키마: `RecipeName, Desc, Ing1~3Name/Count, CookDuration, OutputCount, Tier, Category(soup/grill/dish), UnlockId, UnlockHint`.

| 요리 | 재료 | 시간 |
|---|---|---|
| 당근 수프 | 당근 2 | 8초 |
| 구운 풀 | 풀 3 | 4초 (신규 — 기존엔 보상으로만 얻음) |
| 구운 고기 | 생고기 2 | 10초 |
| 야채 볶음 | 풀 2 · 당근 1 | 6초 (구: 풀 3) |
| 달걀 오믈렛 | 달걀 2 · 당근 1 | 10초 (구: 달걀 2) |
| 잔치 요리 | 구운 고기 1 · 당근 수프 1 · 구운 풀 2 | 15초 (구: 구운 풀 2) |

- 세이브: 영지 가구 레코드에 `cookData = { queue, output, progress }`(문자열 JSON 2개 + 숫자, 비면 생략). **구 화로식 냄비 세이브**(`furnaceData`)의 재료·땔감·결과물은 복원 시 수거 대기 목록으로 옮겨 잃지 않는다.
- 철거: 완성품 + 예약분 재료를 떨군다. 조명: 조리 중일 때만 냄비 광원이 켜진다.

## 4. 코드 변경 지점

| 파일 | 변경 |
|---|---|
| `QuestAndAchievement/Core/Action/ActionEnum.mlua` · `ActionConditionEnum.mlua` | `Deliver = 14` + 등록 |
| `QuestAndAchievement/Core/Action/ActionConditionData_Deliver.mlua` | 신규 조건 (Maker refresh로 `.codeblock` 생성 필요) |
| `Player/Scripts/PlayerInventory.mlua` | easy 첫 칸 추첨 · bonus 제외 · `GrantRequestRewards`(ExtraRewards) · 올클리어 · Deliver 발행 · `GetRequestCell`/`GetDailyBonusRequestId`/`CountCompletedTodaysRequests` |
| `UI/Scripts/UIRequestController.mlua` | 의뢰인 이름 · 하단 진행/보너스 안내 |
| `NPC/Scripts/VillagerDialog.mlua` | `cook`·`guard`·`carpenter`·`granddaughter` 이름 · `BuildRequestTalkPages` (부탁/감사 한 번) |
| `Furniture/Scripts/CookingPot.mlua` (신규) | 예약 큐 · 타이머 · 수거(Craft 신호) · 세이브/구 세이브 이관 · 철거 내용물 |
| `UI/Scripts/UICraftingController.mlua` | 요리 모드(`OpenCook`) · Ing3 · 3번째 칸 · 냄비 상태 줄 · 「요리」 버튼 |
| `Player/Scripts/PlayerController.mlua` | 냄비 조준·라벨 · F = 수거 또는 요리 창 |
| `Player/Scripts/PersistenceManager.mlua` · `MapObjects/Scripts/ResourceSpawner.mlua` | 냄비 저장·복원 (`RestoreCookingPot`) |
| `MapObjects/Scripts/TileDurabilityManager.mlua` · `UI/Scripts/UIHUDController.mlua` | 냄비 철거 드롭 · 조리 중 광원 |
| `Furniture/Models/Furniture_CookingPot.model` | `script.Furnace` → `script.CookingPot` |

## 5. 보류 — 다음 단계 후보 (결정·선행 작업 필요)

| 원안 항목 | 필요한 것 | 비고 |
|---|---|---|
| 신규 작물 5종 (밀·감자·토마토·딸기·황금 호박) | 작물 단계 스프라이트 3~5장 × 5종 + 씨앗·수확물 아이템·아이콘 + `Crop_*` 모델 | 아트는 공식 RUID 우선 탐색 → 없으면 image-to-pixel (업로드는 제작자) |
| 물뿌리개 (1단계 절반 단축) | 아이템·아이콘 + 작물 타격 분기 + `IsWatered` 영속 | 비 가속(`ApplyWeatherGrowthBoost`)과 같은 축 |
| 퇴비 (MinYield +1) · 대풍년(8%/16%, ×1.35, MaxYield×2) | 퇴비 아이템 + 작물 상태 영속 + 수확 연출 | 수확 경로 = `TileDurabilityManager` 작물 분기 |
| 덩굴 재수확 (토마토·딸기) | `CropDataSet.RegrowStage` 컬럼 + 수확 시 파괴 대신 타임스탬프 되감기 | 신규 작물과 묶음 |
| 요리 버프 5종 (오믈렛 방어·딸기 타르트 기동 등) | 레시피·버프 행 + 신규 재료(아이콘) | 냄비 구조는 준비됨 — 재료 3종 레시피 가능. 버프는 채집·이동·공격 계열만 있음 |
| 카인·잭·루루 전용 퀘스트 | 퀘스트·대사 집필 | 지금은 앰비언트 + 게시판 의뢰만 담당 |
| 주간 스탬프 5일 · 명예 주민 조경 상자 | 주간 카운터 영속 + 보상 가구 | 일일 보답이 자리 잡은 뒤 |
| 비 오는 날 작물 머리 위 물방울 · 날씨 툴팁 | 작은 연출 + HUD 툴팁 | 저비용 — 원하면 바로 가능 |
| 벨라 상점 (요리 재료/도시락) | `ShopItemDataSet Vendor=cook` | 수프를 팔면 111을 우회하므로 품목 신중 |
| 예약 취소 | 냄비 창에 취소 버튼(UIBuilder) | 지금은 철거하면 예약분 재료가 돌아온다 |

## 6. 2026-10-22 후속 구현

위 §5의 신규 작물5종·물뿌리개·퇴비·덩굴 재수확은 후속 요청으로 구현했다. 상세 데이터 수치와 원안 차이·검증 범위는 [농사 확장 기록](../reports/farming-expansion-20261022.md)을 따른다. 대풍년 확률·신규 전용 음식 버프·주간 스탬프는 이 범위에 포함하지 않는다. 제작자 Play 허용 후 수정본 핵심 경로와 재접속 복원까지 확인했다(상점 클릭·전 단계 육안 검사는 별도).

## 7. 2026-10-23 후속 구현

- **대풍년** ✅ (`CropDataSet.BumperChance` 0.08, 퇴비·비 ×2, 크기 ×1.35, 금빛, 수확 MaxYield×2, 경험치 ×3).
- **비 오는 날 표시** ✅ 시계 `비 (작물 성장↑)` — 작물 머리 위 물방울 연출은 아트가 필요해 보류.
- **카인·잭·루루 전용 퀘스트** ✅ 401~402 · 411~412 · 421~422.
- **초반 튜토리얼 길안내** ✅ (원안 외 신규) — 조건별 목표물 ▼ + 조작 TIP.
- 남은 보류: 요리 버프 신규 종류 · 주간 스탬프 · 벨라 상점 · 요리 예약 취소 버튼 · 물방울 연출.

## 8. 2026-10-23 보류 처리

§5 보류 항목을 모두 구현했다(작물 배율 0.9 · 요리 버프 다양화 · 벨라 상점 재료/요리/레시피 · 주간 도장 + 조경 상자 · 냄비 예약 취소 · 비 이슬 아이콘). 수치·데이터 위치는 [tasks.md](../tasks.md) 맨 위 항목. 벨라는 당근 수프를 팔지 않는다(111 우회 방지).
