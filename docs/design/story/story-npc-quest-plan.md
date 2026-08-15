# 스토리·NPC·퀘스트 연동 계획 (story-npc-quest-plan) — 2026-08-08

> **목적**: 별도 스토리 작가 에이전트(외부 세션)와 협업해 세계관·NPC 서사·퀘스트 라인을 전개하고,
> 그 산출물이 **이 저장소의 기존 데이터 주도 파이프라인(QuestDataSet / DialogDataSet)에 그대로 흘러들어오게** 하는 연동 설계.
> §5 핸드오프 브리프는 스토리 에이전트에게 복사해 전달하는 용도로 작성됐다.
>
> **2026-08-14 폴더 개편**: 이 문서는 `docs/design/story/`로 이동했다. 이 문서는 **시스템 연동(스키마·재생기·하드 제약)의 단일 소스**로 유지되고,
> 콘텐츠 원안(세계관·챕터·맵 컨셉·퀘스트 라인)은 같은 폴더의 [README.md](./README.md) 문서 지도를 따른다.

---

## 1. 현재 시스템 실측 (2026-08-08)

### 1.1 퀘스트 — `QuestAndAchievement` 패키지 (데이터 주도, 가동 중)

- 데이터: `RootDesk/MyDesk/QuestAndAchievement/DataSets/QuestDataSet.csv` + `QuestConditionDataSet.csv`
- 현행 콘텐츠: **튜토리얼 체인 101~108** (풀 뜯기 → 주먹도끼 → 벌목 / **108 주먹도끼 던지기 습득** → 곡괭이 → 채광 → 상자 설치 → 포탈 이동). 전부 `AutoAccept`, `LinkedPrevId`로 연결 (108은 102에서 분기).
- 보상: `RewardItems`(`아이템:수량|...`) + `RewardUnlockId`(레시피 해금 — T27, 107이 `quest_cooking_pot` 해금)
  + **`RewardPortalId`**(영지 포탈 개통 — 2026-08-10 신설, **106이 `town` 개통**).
  - ⚖️ **2026-08-10**: 신규 영지에는 포탈이 **없다.** 106(나무 상자 설치)을 깨야 마을 포탈이 나타나고,
    그 직후 107(포탈 이동)이 AutoAccept되는 자연스러운 흐름이 된다.
  - 값 = `PortalDestinationDataSet.DestinationId`. 지급은 `PersistenceManager:GrantEstatePortal`(멱등) 담당.
- 퀘스트 스키마 (`QuestDataSet.csv`):
  `Id, Name, Desc, ProgressingDesc, CategoryEnum(Main/Sub), CycleEnum, IsRepeatable, LinkedPrevId, RequiredId, AutoAccept, CannotAbandon, ConsumeItems, RewardItems, Priority, Disable, RewardUnlockId`
- 조건 스키마 (`QuestConditionDataSet.csv`): `Id(퀘스트 Id와 동일), Description, CondEnum, CondArg, CondExtra, Value, CountMode(Action|State), Disable`
  - **`CountMode=Action`**(기본): 수락 **이후** 행동만 집계. 풀 3개(101)·나무 5개(103)처럼 "지금 가서 하라".
  - **`CountMode=State`**: 수락·로그인 때 현재 상태를 스냅샷. 이미 한 일이면 즉시 완료. 주먹도끼 던지기 습득(108)·제작(102·104)·설치(106).
  - `LearnSkill`은 이벤트가 0→1 한 번뿐이라 빈 `CountMode`도 State로 취급한다. 반복 퀘스트는 스냅샷으로 자동 완료하지 않는다(보상 루프 방지).
- **지원 조건 타입 (`ActionEnum.mlua` 실측)**: `Attend`(출석) · `StateChange` · `MesoChange` · `StaminaChange` · `Kill`(몬스터 처치) · `Gather`(채집) · `Craft`(제작) · `Smelt`(제련) · `Place`(설치) · `Warp`(포탈 이동) · `LearnSkill`(스킬 첫 습득, 2026-08-14). **이 11종 밖의 조건은 현재 구현이 없다.**

### 1.2 NPC — 마을 상주 (T77) + 상호작용 가이드(2026-08-08)

| 촌장 elder | `VillagerDialog` | 분위기 대사 · 퀘스트 수주 | `DialogDataSet.csv` |
| 낚시꾼 fisher | `VillagerDialog` | 분위기 대사 · 낚시 퀘스트 | 〃 |
| 연구원 researcher | `VillagerDialog` | 표본/연구 퀘스트 (구 resident_a) | 〃 |
| 노점상 vendor | `VillagerDialog` | 의상/소문 퀘스트 (구 resident_b) | 〃 |
| 대장장이 blacksmith | `VillagerDialog` | 도구/무기 퀘스트 (구 resident_c) | 〃 |
| 헛간지기 barnkeeper | `VillagerDialog` | 가축/펫 퀘스트 (구 resident_d) | 〃 |
| 상인 merchant | `MerchantInteract` | 상점 (`ShopItemDataSet`) | — |
| 낚시왕 순위 | `FishingLeaderboardInteract` | 주간 낚시왕 | — |
| (건물) 연구소 | `ResearchLab` | 연구/해금 (`ResearchDataSet`) | — |
| (건물) 게시판 | `BulletinBoard` | 의뢰 보드 (`RequestPoolDataSet`) | — |

- 대사 스키마 (`DialogDataSet.csv`): `NpcId, Text, TimeBand(any/day/night), WeatherId(빈칸/rain/fog…), Weight`.
  현행 대사는 **시간대·날씨 반응형 앰비언트 한 줄 대사**다. **스토리 진행 상태에 반응하는 대사 축은 아직 없다.**

### 1.3 부재(= 이번 연동에서 만들어야 하는 것)

1. **NPC 대면 수주**: 퀘스트가 NPC에 묶여 있지 않다 (전부 AutoAccept). "elder에게 말 걸어 수주/완료" 경로 없음.
2. **스토리 대사 시퀀스**: 다중 문장 대화(대화창 넘기기), 수주/진행/완료별 대사 분기 없음.
3. **스토리 플래그 영속화**: "챕터 N 완료" 상태 저장 축 없음 (퀘스트 완료 기록은 패키지가 저장하므로 **퀘스트 Id를 스토리 플래그로 겸용**하는 것이 최소 구현).

---

## 2. 연동 아키텍처 (제안)

**원칙: 스토리는 전부 데이터(CSV)로 들어온다. 코드는 "재생기"만 만든다 (R3).**

```
스토리 에이전트 산출물                     이 저장소의 그릇
─────────────────────                  ─────────────────────────────
① 세계관 바이블 (md)          →  docs/design/story/story-bible.md (✅ 2026-08-14 신설, 참조용)
② 퀘스트 라인 (CSV 행)        →  QuestDataSet.csv / QuestConditionDataSet.csv  [기존 스키마 그대로]
③ NPC 스토리 대사 (CSV 행)    →  StoryDialogDataSet.csv  [신규 — §2.1]
④ 앰비언트 대사 증분 (CSV 행) →  DialogDataSet.csv  [기존 스키마 그대로]
```

### 2.1 신규 데이터셋 `StoryDialogDataSet` (제안 스키마)

수주/진행/완료 대사 시퀀스를 담는 그릇. 기존 `DialogDataSet`(앰비언트)과 분리해 서로 오염 방지.

```
QuestId, NpcId, Phase(offer|progress|complete), Seq(1..n), Text, Speaker(npc|player)
```

- 재생기: `VillagerDialog` 확장 — 대상 NPC에 걸린 퀘스트가 있으면 앰비언트 대신 스토리 시퀀스를 순서 재생.
- 수주 UX: 마지막 offer 문장에서 `수락/거절` 버튼 (기존 팝업 스타일 재사용 — 규칙 6 비주얼 아이덴티티).

### 2.2 퀘스트 ↔ NPC 바인딩

`QuestDataSet.csv`에 **컬럼 추가**: `GiverNpcId`(수주 NPC), `TurnInNpcId`(완료 보고 NPC, 빈칸=자동완료).
- 컬럼 추가는 패키지 로직에 무해(미참조 컬럼) — 신규 재생기만 읽는다. `UserDataRow` 접근은 `pcall` 가드(규칙 7 계열, R5).
- 튜토리얼 101~107은 `GiverNpcId` 빈칸 유지 → 기존 AutoAccept 동작 그대로.

### 2.3 스토리 진행 플래그

- 챕터 게이트 = **퀘스트 완료 여부**(`RequiredId` 활용)로 표현. 별도 플래그 저장소를 만들지 않는다 — 퀘스트 패키지의 완료 기록이 이미 영속화된다.
- 앰비언트 대사의 스토리 반응이 필요하면 `DialogDataSet`에 `RequiredQuestId` 컬럼 추가(빈칸=항상 후보)로 최소 대응.

---

## 3. 구현 작업 분해 (스토리 산출물 수령 후)

| # | 작업 | 규모 | 선행 |
|---|---|---|---|
| A | `StoryDialogDataSet.userdataset`+`.csv` 신설 + `VillagerDialog` 스토리 시퀀스 재생 | 중 | 스토리 산출물 ② ③ |
| B | `QuestDataSet` `GiverNpcId`/`TurnInNpcId` 컬럼 + 수주/보고 게이트 | 중 | A |
| C | 대화창 UI (문장 넘기기 + 수락/거절) — 기존 팝업 템플릿 재사용 | 중 | — (A와 병행 가능) |
| D | 퀘스트 CSV 행 투입 + 밸런스 검수 (아이템명 = `item_dataset` `Name` 컬럼 대조 — R4) | 소 | ② |
| E | (선택) `DialogDataSet` `RequiredQuestId` 컬럼 — 스토리 반응 앰비언트 | 소 | B |

> 검증: 매 단계 refresh Error=0 + 신규 `.mlua`/`.userdataset` 등록 확인, 이후 Play는 제작자.

---

## 4. 제작자 결정 필요 (열린 판단)

1. ⚖️ **스토리 톤 (2026-08-08 → 2026-08-14 개정)**: **기본 코지 + 이원 미스터리** — 긍정(푸른 빛)과 메인 빌런(그늘)이 나란히. 구 "죽음/공포/정치 전면 금지"는 **해제** — 잔혹·고어 묘사, 절망 전개, 현실 정치 풍자만 회피. 몬스터 전투 = **"퇴치"**, 몬스터 = 잠식으로 적대화된 이웃 생물, 사냥 드롭 = 연구·발전 재료. 원문: [story-bible.md](./story-bible.md) §0~§2.
2. **분량 단위**: 챕터당 4~6퀘, 첫 챕터는 마을 소개 아크 (유지).
3. **주인공 설정**: 영지 이주민 전제 명문화 (유지).
4. ⚖️ **대화창 (2026-08-08)**: **메이플스토리식 하단 대화창** 신설. F「대화하기」는 ChatBalloon이 아니라 이 창. 퀘스트 수락/거절 포함. HUD·퀵슬롯·모바일 버튼을 덮어도 됨. 자동 혼잣말(거리 트리거)만 기존 말풍선 유지.

---

## 5. 스토리 에이전트 핸드오프 브리프 (아래 블록을 복사해 전달)

```markdown
# 의뢰: MSW 탑다운 라이프·크래프트 게임의 스토리/퀘스트 집필

## 게임 개요
- 장르: 스타듀밸리식 개인 영지(농장) + 공동 마을 + 공용 사냥터의 탑다운 라이프·크래프트. 메이플스토리 리소스 기반의 아기자기한 도트 톤.
- 세계 구조: ① 개인 영지(평화, 채집/제작/건설/낚시/농사) ② 공동 마을(상점·연구소·게시판·NPC) ③ 사냥터(전투, 슬라임·멧돼지 등) + 보스맵.
- 플레이어: 영지에 새로 정착한 개척자. 도구를 만들어 영지를 가꾸고, 마을과 교류하며, 사냥터로 원정한다.

## 등장 NPC (기존 로스터 — 이 이름/역할을 유지하고 성격을 부여할 것)
- elder(촌장): 마을 안내자. / fisher(낚시꾼): 연못가, 낚시 사부.
- researcher(연구원 엘렌): 연구소 곁, 고대 두루마리 해독 및 잠식 표본 연구.
- vendor(노점상 마리): 시장 노점, 생활 소문 및 의상/치장.
- blacksmith(대장장이 로체): 대장간, 도구/무기 제작 및 금속/심지 가공 (남성 장인).
- barnkeeper(헛간지기 토리): 헛간/목장, 가축 돌봄 및 펫.
- merchant(상인): 상점 운영. / 연구소(무인 시설): 소재 연구→기술 해금. / 게시판: 주민 의뢰 보드.

## 이미 있는 이야기 뼈대 (충돌 금지)
- 튜토리얼 퀘스트 101~108: 풀 뜯기→주먹도끼→벌목(+108 던지기 습득)→곡괭이→채광→상자 설치→포탈로 첫 외출.
- 스토리는 107(첫 외출) 이후, 마을 도착 시점부터 시작하는 챕터 구조를 권장.

## 산출물 형식 (반드시 이 3종)
1) 세계관 바이블(markdown): 세계 설정 1페이지 + NPC별 성격/말투 카드 + 챕터 시놉시스.
2) 퀘스트 라인(CSV 행): 아래 두 스키마의 행으로. Id는 201부터.
   QuestDataSet: Id,Name,Desc,ProgressingDesc,CategoryEnum,CycleEnum,IsRepeatable,LinkedPrevId,RequiredId,AutoAccept,CannotAbandon,ConsumeItems,RewardItems,Priority,Disable,RewardUnlockId,GiverNpcId,TurnInNpcId
   QuestConditionDataSet: Id,Description,CondEnum,CondArg,CondExtra,Value,Disable
3) 대사(CSV 행):
   StoryDialogDataSet: QuestId,NpcId,Phase(offer|progress|complete),Seq,Text,Speaker(npc|player)
   DialogDataSet(앰비언트 증분): NpcId,Text,TimeBand(any|day|night),WeatherId(빈칸|rain|fog),Weight

## 하드 제약 (지키지 않으면 반려)
- 퀘스트 조건은 이 11종만: Attend / StateChange / MesoChange / StaminaChange / Kill / Gather / Craft / Smelt / Place / Warp / LearnSkill.
  (예: "Gather,Wood,,5" = 나무 5회 채집. 호위/타이머/대화만으로 완료되는 조건은 시스템에 없음 — 필요하면 "시스템 제안"으로 분리 표기.)
- 아이템/몬스터 이름은 제공된 목록의 영문 Name을 그대로 (별도 첨부: item_dataset의 Name 컬럼, 몬스터 Name 목록).
- 대사는 한국어, 한 문장 40자 내외, 이모지 금지. 말줄임표는 "…" 하나.
- 톤: **코지 기본 + 이원 미스터리**(긍정: 푸른 불씨 / 그늘: 메인 빌런). 따뜻함·잔잔한 유머 유지. 잔혹·고어 묘사, 절망 전개, 현실 정치 풍자만 금지 (2026-08-14 개정 — 구 "죽음/공포/정치 전면 금지"는 해제). 몬스터 전투는 "퇴치"로 서술. 세계관·용어는 story-bible.md 용어집을 따를 것.
- 챕터 1 분량: 퀘스트 4~6개 + NPC별 스토리 대사 시퀀스(offer 2~4문장, complete 1~3문장) + 앰비언트 10줄 내외.
```

---

## 관련 문서

- 콘텐츠 원안(같은 폴더): [README.md](./README.md) · [story-bible.md](./story-bible.md) · [npc-cast.md](./npc-cast.md) · [map-concepts.md](./map-concepts.md) · [quest-design.md](./quest-design.md)
- 게임 설계: [../../../game_design.md](../../../game_design.md) §2(월드 구조)·§3(시스템)
- 함정: [../../pitfalls.md](../../pitfalls.md) 규칙 4(아이템 식별자)·7(UserDataRow)
- 의뢰 게시판(기존): `RequestPoolDataSet` — 스토리 퀘스트와 별개 축으로 유지
