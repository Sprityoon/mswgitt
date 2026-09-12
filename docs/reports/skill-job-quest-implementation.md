# 스킬·직업·퀘스트 구현 기록

2026-09-11. 주먹도끼 던지기와 기간틱 락/쇄석 흩뿌리기의 원래 컨셉을 유지한다.

> 이어받은 작업. 아래 상태는 **이번 턴에 실제로 확인한 범위**만 갱신했다.
> `정적 확인` = 파일/데이터 실측 · `Play 확인` = Maker Play 화면으로 검증 · `OPEN` = 미확인.

| 요구 | 소유자·구현 위치 | 검증 시나리오 | 상태 |
|---|---|---|---|
| DATA-01 | SkillDataSet·PlayerController 기존 경로 | 기존 7스킬 호환 | **정적 확인** — 공용 9종이 `JobId` 공란으로 유지, 트리 좌표 그대로 |
| DATA-02 | SkillDataSet CSV 선택 컬럼 | 스키마·참조 검사 | **정적 확인** — 63컬럼, `JobId`(34번) 포함. 21행 파싱 정상 |
| DATA-03 | 신규 공용 2종·직업별 스킬 | 해금→QWER 장착 | **정적 확인** — 공용 9 + trapper/battle_smith/alchemist/wild_keeper 각 3종 |
| DATA-04 | 카탈로그 로딩 | 정적 검사·Maker 빌드 | **Play 확인** — 공용 탭 9노드 렌더, 선택 시 상세 반영 |
| PAP-01 | PlayerController 시전 모션 | 액티브 모션 | OPEN |
| PAP-02 | PlayerController 조작 소유권 | 시전 중 이동 | OPEN |
| PAP-03 | PlayerController·Projectile | 사망·맵 전환·만료 정리 | OPEN |
| PAP-04 | 제작자 Play | 시전·조작 복구 | OPEN |
| PAJ-01 | PlayerCombat·Projectile 현행 HitEvent | 대상 선택 | OPEN |
| PAJ-02 | 공격별 대상 중복 차단 | 관통·산탄 판정 | OPEN |
| PAJ-03 | 장판 틱·단발 구분 | 범위 이탈·만료 | OPEN |
| PAJ-04 | 제작자 Play | 피해·상태이상 순서 | OPEN |
| MHP-01 | Monster·MonsterAI·모델 | 모델별 상태 확인 | OPEN |
| MHP-02 | Monster 기존 피격 | 넉백·속박·기절 회복 | OPEN |
| MHP-03 | Monster 기존 사망·드롭 | 치명타 후 추가 타격 차단 | OPEN |
| MHP-04 | 제작자 Play | 모델별 HIT/DEAD | OPEN |
| JOB | PlayerController·PersistenceManager | 타 직업 거절·저장 복원 | **정적 확인** — `@Sync JobId`, `GrantJob`, `IsJobGrantable`, 저장(`jobId`)·복원 경로 존재. 전직 자체는 미수행 |
| QUEST | QuestData·UserQuestData·CSV | 선행·제출·중복 전직 거절 | **정적 확인** — 전직 4종(302/312/322/332) + 후속 4종, `RequiredJobId=novice` 게이트와 `RewardJobId` 지급 경로 존재 |
| UI | UISkillTreeController·UIBuilder | 직업 탭·분기·조건·MP | **Play 확인 (1건 잔여)** — 아래 참조 |

적용 계약: maplestory-skill-maker의 architecture/datasets.md, architecture/framework.md, player/preflight.md 및 presentation gates. 실제 프로젝트는 PlayerCombat(AttackComponent)→HitEvent와 비행 충돌 투사체를 사용한다. 기존 동작·세이브를 보존하라는 AGENTS 규칙에 따라 해당 경로를 확장하며 다른 예시 아키텍처로 교체하지 않는다.

---

## UI 마무리 (2026-09-11 이어받아 처리)

창이 900×800으로 확장되고 탭·노드·상세 패널이 새로 배치됐으나, **옛 기하가 남은 부분**이 있어 정리했다.

| 항목 | 문제 | 조치 | 검증 |
|---|---|---|---|
| `Link_*` 연결선 6종 | 구 노드 좌표(x −230/−130/−30, y 140/40, 14×28)에 그대로 — 새 노드(x −320/−195/−70, y 170/35/−100, 88×88)와 어긋남 | 노드 좌표에서 파생 재계산 (열 중심 x, 행 사이 중점 y, 14×47) | Play — 노드 사이 연결선 정상 표시 |
| `EquipBar` | 창은 900폭인데 640폭 유지. 버튼 64×40 으로 터치 최소 88 미달([§9.4](../../.claude/skills/msw-ui-system/references/ui-fundamentals.md)) | 840폭, QWER 88×88, 레벨업 260×88 | Play — 버튼 확대·정렬 확인 |
| 하단 `Hint` | 830폭 중앙 정렬이라 오른쪽 절반이 상세 패널(x 0~420)에 덮여 문구가 잘림 | 노드 열 영역(x −225, 430폭)으로 이동 + 문구 축약(QWER 안내는 EquipBar 버튼이 대체) | Play — 전문 표시 |
| 팝업 제목 | `TopBar` 가 `Title` 보다 나중에 그려져 완전히 가림 — 5개 팝업 공통 | 제목을 형제 배열 끝으로 재생성 ([규칙 47](../pitfalls.md)) | Play — `스킬트리` 표시 확인 |
| 상세 패널 글자 | fs 13~14 로 §9.5 본문 권장(24~28)의 절반 | 설명 20 / 이름 24 / 조건·상태 18 / 상단 상태줄 24 | Play — 설명 또렷하게 읽힘 |

**Play 확인된 표시**: 제목 `스킬트리` · 상태줄 `모험가 · Lv 12 · SP 69 · MP 60/60.0` · `공용` 탭 · `마을 멘토의 기초 과제 → 전직 시험` 안내 · 3×3 노드 + 연결선 · 상세(아이콘/설명/`이미 최대 레벨`/`MAX · MP 0 · 기력 8`) · 하단 힌트 · QWER+레벨업 바.

### 🔴 남은 결함 1건 — 상세 패널의 `DName`(스킬 이름) · `DTypeLv`(종류·레벨)

두 줄만 화면에 나오지 않는다. **개편 이전부터 있던 문제**이며(HEAD 스크린샷 픽셀 스캔으로 확인) 이번 확장으로 생긴 회귀가 아니다.

- 런타임은 정상이다: 값 대입·되읽기 성공, `Enable=true`, Error 0.
  `[SKILLUI-DIAG2] DName legacy=OK want='가시 넝쿨 방벽' read='가시 넝쿨 방벽' show=true`
- 같은 부모·같은 컴포넌트 구성인 `DDesc`/`DGate`/`DCost` 는 정상 렌더된다.
- **반증 완료 (재조사 시 반복하지 말 것)**: 컴포넌트 종류(레거시/GUI) · 프리팹 타입(`uitext`/`uitextguirenderer`) · 부모가 `uiempty` 인지 · 부모 체인의 렌더러 유무 · Bold · FontSize · 정렬 · 컴포넌트/엔티티 Enable · FontColor 알파 · `ActivePlatform` · 이름 중복 · 저장 텍스트 공란 · **배치 위치**(렌더되는 구역으로 옮겨도 동일) · **형제/배열 순서**(최후미·최상위로 올려도 동일) · **엔티티 재생성**(제목 5종을 고친 처방) · **칸 높이 대비 폰트** · 자체 배경 스프라이트 알파 · 아이콘 `PreserveSprite`(0=RectSize 로 늘려 그리므로 덮지 않음).
- 다음 시도 후보: Maker 에디터에서 해당 엔티티를 직접 열어 에디터 렌더와 Play 렌더를 분리 대조. 또는 두 줄을 상세 패널 밖(`Bg` 직속)으로 빼서 표시.
- 영향도: 아이콘·설명·상태·비용은 모두 보이므로 **사용은 가능**하다. 스킬명이 안 보이는 것이 유일한 불편.


### 🔴 해소: 직업 탭 배경 미표시 (`LEA-3044`)

제작자가 붙여 준 런타임 로그로 잡았다.

```
[LEA-3044] InvalidSerialization : Entity: /ui/PopupGroup/SkillTreePopup/Bg/TabCommon,
           Component: SpriteGUIRendererComponent, Property: ImageRUID
```

- **원인**: `TabCommon` / `TabJob` 의 `ImageRUID` 가 **이중 래핑**돼 있었다 — `{"DataId":{"DataId":"4fea64a3…"}}`. 정상형은 `{"DataId":"4fea64a3…"}`. 이미 래핑된 DataRef 를 빌더에 다시 넘긴 결과다.
- **조치**: 두 건을 1겹으로 폄. 전체 UI 파일의 **DataRef 871개 전수 점검 → 중첩 0건** 확인.
- **검증**: `clear_logs` 후 재Play — `LEA-3044` **0건 / Error 0건**. 탭 배경(나무 텍스처) 정상 렌더. 빌드도 699건 전량 Info.
- 함정 사전 [규칙 48](../pitfalls.md) 신설 + 점검 도구 `scripts/check_ui_dataref.cjs`.
- ⚠️ 이 건은 빌드 로그에 `LWA-4001` **Warning 2건**으로만 떴고, 내가 "병행 작업분으로 보이며 무관"이라 오판해 넘겼다. **필드명을 지목하는 경고는 그 필드를 직접 열어 확인해야 한다.**


## 스킬창 목록형 전환 (2026-09-11 ⚖️ 확정)

제작자 지시 — 메이플 SKILL 창 레퍼런스의 **구조**를 따르되 색·틴팅은 기존 앤틱 우든/골드 유지.
계보는 "분류하고 그 안에서 보이면 된다"는 판단에 따라 **계열 그룹 + 세로 들여쓰기**로 표현한다.

| 이전 | 이후 |
|---|---|
| 3×3 노드 격자 + 연결선 6종 | 계열 헤더 + 세로 목록 (행 풀 24, 헤더 풀 5) |
| 창 안 우측 상세 패널 | **창 바깥 오른쪽**에 붙는 상세 패널 |
| 좌표(`TreeRow`/`TreeCol`) 의존 배치 | `ParentSkillId` 에서 계보를 파생해 깊이 우선 배치 |

- **계보 표현**: 자식 스킬은 한 단계(26px) 들여쓰고 이름 앞에 `└`. 2D 격자 대신 세로 계보라 스킬이 늘어도 버틴다(skill-tree-plan §7.2 의 확장 경로와 정합).
- **행 상태**: `MAX` / `강화 가능` / `해금 가능` / `Lv N 필요` / `선행 필요` / `목표 미달` 을 문구와 배경색으로 동시 표기. 선택 행은 밝게.
- **계열 분류**: `SkillDataSet.Category` 컬럼이 있으면 사용, 없으면 `Type` 으로 유추(Passive→채집). pcall 가드(규칙 7).
- 🔴 **mlua 다중 반환 금지(규칙 23)**: 배치 커서를 `(rowIdx, y)` 로 돌려주려다 `LEA-3015` 를 만들 뻔했다. `self._T.listRowIdx` / `self._T.listY` 커서로 바꿨다.

**Play 검증 완료**: 계열 헤더(`전투`/`채집`) · 9개 스킬 행 · `└` 계보 들여쓰기 · 상태/레벨 · 행 선택 하이라이트 · 상세창(아이콘·이름·`투척 스킬 · Lv 1/5`·설명·`소모: 주먹도끼 x1`·`장착: 주먹도끼`·`강화 가능`·`레벨업: SP 1 · MP 0 · 기력 4`) · Q 슬롯 장착 표시 · `레벨업 (SP 1)` 활성.

### 🔴 해소: 상세 패널 이름/종류 미표시 (여러 턴 미해결이던 건)

`b.sprite(path, { text: ... })` 로 **렌더러와 같은 엔티티에 글자를 얹자** 즉시 해결됐다. 별도 자식 `text()` 엔티티일 때만 안 나오던 것이다. → [규칙 50](../pitfalls.md) 신설.

### 🔴 사고: `MaskComponent` 로 `.ui` 전체가 로드 불가

목록 클리핑용으로 붙인 `MaskComponent` 1건 때문에 `PopupGroup.ui` 의 **모든 팝업**(스킬창·인벤토리 포함)이 열리지 않았다. build Error 0, refresh 로그 0, 런타임 Error 0 — **아무 흔적도 남지 않았다.** 제거 후 즉시 복구. → [규칙 49](../pitfalls.md) 신설.
판별법: 한 팝업이 안 열리면 **같은 `.ui` 의 다른 팝업도 확인**할 것.

### 남은 폴리시 항목

- 상세 패널이 우측 HUD 버튼(가방/상호작용 등)과 겹친다. 팝업이 모달성이라 당장 문제는 아니나 위치 조정 여지가 있다.
- 소모/장착 줄이 아직 설명 칸에 합쳐져 들어간다. 전용 스펙 줄로 분리하면 설명이 더 깔끔해진다.
- 행 높이 44 는 터치 최소 88(§9.4)보다 작다. 폭이 800이라 실사용 타깃은 충분하지만, 모바일 실기 확인 권장.


## 파이프라인 무결성 점검 (2026-09-11 이어받아 처리)

"파이프라인 작업" 이 남아 있는지 확인하려고 **저작된 CSV 컬럼을 실제로 읽는 코드가 있는지**
30개 신규 컬럼 전수 대조했다. 결론부터: **구현 누락은 없었다.** 소비처가 전부 존재한다.

| 저작된 것 | 소비처 | 확인 |
|---|---|---|
| `ManaCost` `UnlockQuestId` | PlayerController · UISkillBar · UISkillTree | 정적 확인 |
| 투사체 7종 (`ProjectileCount` `SpreadDegrees` `ProjectileSpeed` `ProjectileLife` `ProjectileSize` `PierceCount` `Splash*`) | PlayerController `ExecuteProjectileSkill` | 정적 확인 |
| 장판 4종 (`AreaSize` `AreaReach` `Duration` `TickInterval`) | PlayerController `CreateSkillArea` · `TickSkillAreas` | 정적 확인 |
| 상태이상 4종 (`Status` `StatusDuration` `StatusValue` `StatusMaxStacks`) | Monster `GetSkillStatus` — `Root`/`Acid`/`ArmorBreak`/`Slow`/`Stun` | 정적 확인 |
| 콤보 3종 (`ComboStatus` `ComboMultiplier` `ConsumeCombo`) | Monster 피해 계산 | 정적 확인 |
| 패시브 3종 (`PassiveStat2` `PassiveValue2` `PassiveItem`) | `GetPassiveBonus` · `RefreshTemperedSkin` | 정적 확인 |
| 직업/퀘스트 3종 (`RequiredJobId` `RewardJobId` `RewardSP`) | QuestData `IsPlayerEligible` · UserQuestData 보상 지급 · PlayerController `GrantJob` | 정적 확인 |
| `CondEnum=LearnSkill` | `ActionConditionData_LearnSkill` (`_ActionEnum.LearnSkill = 11`) | 정적 확인 |

교차 참조도 전부 맞는다. 스킬의 아이템 참조 3종, 퀘스트 보상/소모 아이템, 조건의 몬스터·아이템·스킬 인자,
전직 NPC 4명(`vendor` `blacksmith` `researcher` `barnkeeper`)의 `town.map` 실제 배치까지 확인했다.

### 새 도구 — `scripts/check_skill_quest_pipeline.cjs`

이 파이프라인의 실패 방식은 **런타임 에러가 아니라 침묵**이다. 아이템 이름 한 글자가 틀리면
퀘스트가 영원히 안 끝나고, `Type` 이 분기표에 없으면 시전이 조용히 무시된다. 빌드는 통과한다.
그래서 계속 확장될 것을 전제로 검사기를 만들었다.

- 🔴 **허용 집합을 하드코딩하지 않는다.** `supported` 분기표 · `GetSkillStatus("…")` · `GetPassiveBonus("…")` 를
  **소비 코드에서 직접 추출**해 데이터를 대조한다. 하드코딩하면 코드가 바뀔 때 검사기가 먼저 거짓말을 한다.
- 패시브는 PlayerController 밖(채집·가축)에서도 읽히므로 `RootDesk` 의 모든 `.mlua` 를 훑는다.
  처음에 PlayerController 만 봤다가 멀쩡한 스킬 3종(`MinePower`/`LootChance`/`AnimalCare`)을 결함으로 오탐했다.
- 검사 항목: 스킬 아이템 참조 · 선행 존재/동일 직업 · `ParentRequiredLevel` ≤ 선행 `MaxLevel` ·
  `UnlockQuestId` 존재 · `JobId`↔`JobName` 짝 · `Type` 분기 가능 · `Status`/`ComboStatus` 처리 여부 ·
  `PassiveStat` 소비 여부 · 퀘스트 아이템/선행/NPC 배치/`RewardJobId`/조건 행 유무 ·
  조건 인자(`Kill`→몬스터, `Gather`→아이템, `LearnSkill`→스킬).

**음성 대조 완료** — CSV 를 메모리에서 일부러 망가뜨려 5종 결함(없는 소모 아이템 · 분기표에 없는 Type ·
처리되지 않는 Status · 없는 몬스터 · 배치되지 않은 NPC)을 넣었고 **5/5 모두 잡았다.**
현재 데이터 기준 **결함 0건**.


런타임 검증 보류(제작자 수행): PAP/PAJ/MHP 계열 전부와 실제 전직 수행(302/312/322/332 완료 → 직업 탭 개방 → 직업 스킬 해금·장착).
