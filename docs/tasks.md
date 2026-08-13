# 작업 목록 (Tasks)

> **현재 상태**: 솔로 체제 (제작자 주도 + AI 보조). 2026-08-06 문서 개편 시점 기준.
> T번호 체계는 **더 이상 신규 발행하지 않는다.** 아래 T번호는 구 체제에서 넘어온 잔여 항목의 식별자이며, 상세는 [agents/reports/](./agents/reports/)에 있다.
> 새 작업은 T번호 없이 이 문서에 항목으로 추가한다.

---

## 1. 진행 중 (워킹 트리 미커밋)

| 대상 | 내용 |
|---|---|
| `ui/*.ui` 5파일 · UI 컨트롤러 바인딩 | **UI 정합성 감사** (2026-08-13) — 아래 참조 |
| `ResourceSpawner` · `PersistenceManager` · `PlayerController` | **영지 밖 좌표 가드** (X/Y -27~27, 2026-08-13) — 아래 참조 |

### 2026-08-13 UI 정합성 감사

| 판정 | 내용 |
|---|---|
| ✅ 바인딩 | `.mlua` UUID 314건 → `.ui` 엔티티 대조. **ERROR=0.** 규칙 24 입력창 타입 정상. 중첩 UIGroup 0 |
| ✅ **타이틀 HintPlate** | 빈 힌트일 때 아래 막대 숨김 (`SetTitleHint` + 기본 Enable=false). Play 캡처로 막대 소거 확인 2026-08-13 |
| ✅ **플레이트 회귀** | 커스텀/삭제확인 `*Plate` displayOrder를 짝 텍스트 뒤로. 삭제확인 플레이스홀더 대비 상향. Play 캡처 2026-08-13 20:01·20:02 |
| ✅ **커스텀 라벨** | 헤어/얼굴/피부/상의 행을 오른쪽 페이지로 +56px. 스프링 겹침 완화. Play 캡처 확인 |
| ✅ **빈 ErrorPlate** | `SetCustomError` — 문구 있을 때만 Error+Plate Enable. Play 캡처로 빈 막대 소거 확인 2026-08-13 20:11 |
| ✅ **슬롯 자막** | `Subtitle` displayOrder 20 + 글자색 `#ffe8a3`(커스텀 제목과 동일). 「빈 슬롯을 선택하세요」「이어할 캐릭터를 선택하세요」 Play 캡처 확인 |
| ✅ **슬롯 페이지 틴트** | `SlotPanel/PageTint` 728×548 @ (0,-31), 슬롯 5줄+14px. `#2e1f14` a=0.32. Play 캡처 2026-08-13 20:21 |
| ✅ **커스텀 페이지 틴트** | `CustomizePanel/Frame/PageTint` 808×521 @ (30,-11). Frame 스프라이트는 투명, `Frame/Notebook` 형제로 노트 표시(슬롯과 동일 스택). Play 캡처 2026-08-13 20:24 |
| 🔴 **SignBoard** | `515×891` + `PreserveSprite=AspectOnly` → 짧은 변 정사각 렌더(규칙 25). 종료 버튼이 표지판 밖으로 떨어질 수 있음 |
| ⚠ GroupType | 5파일 전부 `GroupType=1`. 팝업/대화/메인메뉴는 규약상 `2`. 지금은 `GroupOrder`만으로 쌓음 (HUD0 · Preview1 · Popup2 · Dialog3 · MainMenu4) |
| ⚠ DefaultShow | `MainMenuGroup.DefaultShow=false` — 그룹 안 컨트롤러 `OnBeginPlay`(버튼 배선)가 안 돌 수 있음. PreviewTool은 컨트롤러를 root 밖에 두는 패턴 |
| ⚠ 잔여 | `customParts=""` 빈 바인딩. 대화 `BodyText`↔버튼 L023 겹침. 타이틀 버튼 좌표 소수 드리프트 |
| ℹ️ 노이즈 | 터치 타겟 &lt;88 · PC 예약영역(UIMyInfo/미니맵) · 템플릿 빈 RUID — 기존 베이스라인 |
| 파일 | `ui_lint` Error=0. 워킹트리 `MainMenuGroup.ui`/`PopupGroup.ui` 더티 — Popup은 줄 수 대칭 재직렬화(규칙 11) 의심 |

- 검증: UIBuilder write + `ui_lint` Error=0. `maker_refresh_workspace` status ok. build 로그 dateTime=`2026-08-13T20:08:06`(이번 refresh와 일치). Error=1 = 기존 `LEA-4004 PlayerController.OnMapEnter`(무관). Warning=47. Play 캡처로 슬롯 자막·빈 ErrorPlate 소거 확인. SignBoard·GroupType·DefaultShow는 미수정.

| `PersistenceManager` · `PlayerDBManager` · `UIMainMenuController` · `ui/MainMenuGroup.ui` | **5슬롯 세이브** + **타이틀→슬롯→외모커스텀** (2026-08-09) |

### 2026-08-13 영지 밖 좌표 가드 — Play 확인 필요

| 항목 | 내용 |
|---|---|
| 🐛 **영지 복귀 불가** | 개발 중 출시 테스트 세이브의 `posX`/`posY`가 영지 플레이어블 박스(`X/Y -27~27`) 밖이라, 접속 시 경계 벽 너머로 워프되어 영지로 걸어 들어올 수 없었음. `FindSafeSpawnPosition`은 가구 점유만 보고 박스 밖을 통과시킴. ([pitfalls 규칙 28](./pitfalls.md)) |
| 🛑 **가드** | `ResourceSpawner:ClampHomeWorldPosition` 단일 소스. 박스 밖이면 기본 스폰 `(-3, 0)`. 적용 지점: 로드 · 세이브(`LastHomePos`) · 홈 워프 · `OnMapEnter` · 서버 `OnBeginPlay` 0.5s 스냅 |
| ⚖️ 박스 정의 | `MapRadius=30` / `WallThickness=3` → `|x|<28` and `|y|<28` = 셀 X/Y -27~27. 하드코딩 금지 |

- 변경: `ResourceSpawner`(Clamp + FindSafeSpawn Home 이웃 제외) · `PersistenceManager`(로드/세이브) · `PlayerController`(워프·맵진입·부팅 스냅)
- 검증: **refresh 검증 보류(MCP 미연결)**. LSP 진단 수정 3파일 errors=0. **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 영지 밖 좌표 세이브로 접속 → `(-3, 0)` 근처에서 시작 ② 콘솔 `[HOME] out-of-bounds pos (...) clamped to default spawn` ③ 박스 안 좌표는 그대로 복원 ④ 마을/사냥터 워프 회귀 없음 ⑤ 재접속 후에도 벽 밖에 안 떨어짐
| `UIDialogController` · `VillagerDialog` · `ui/DialogGroup.ui` · `StoryDialogDataSet` · Quest 201 | **메이플식 대화창 + 퀘스트 수락** (2026-08-08) |
| `FishingContestLogic` | 낚시왕 랭킹 = 캐릭터/슬롯 단위 |
| `item_dataset.csv` · `.userdataset` | 주먹도끼 외형·모션 조정 후속 (커밋 `af6f676` 계열) |
| `ui/PreviewTool.ui` · `ui/PopupGroup.ui` | 인게임 리소스 프리뷰 도구(F9) 후속 (커밋 `8f36832` 계열) |
| `map/map01.map` · `scripts/fix_water_fringe.cjs` · `PlayerController.mlua` | **물가 프린지 규칙 반전 + 낚시 조준 판정 수정** (2026-08-06, 아래 참조) |
| `PlayerController.mlua` + 인터랙터블 12종 `.mlua` | **상호작용 가이드 — 조준 대상 라벨 + 하이라이트** (2026-08-08, 아래 참조) |

### 2026-08-10 새 캐릭터 시작 지점 + 영지 첫 포탈을 퀘스트 보상으로 — Play 확인 필요

| 항목 | 내용 |
|---|---|
| 🐛 **마을에서 시작** | `SelectSaveSlot(isNew)`가 **로드보다 먼저 저장**해 `lastMapKind="town"`(그 순간 플레이어는 시작맵에 서 있음)이 박제 → `LoadPlayerData`가 영지 대신 마을로 워프. ([pitfalls 규칙 26](./pitfalls.md)) |
| 🐛 **영지가 텅 빔** | 같은 원인으로 `homeFurniture="[]"`가 저장되어 `LoadPlayerData`의 *"신규 플레이어"* 기본값 분기가 영영 실행되지 않았음 |
| 🐛 **포탈이 안 보임** | `map01`의 `TownPortal`이 **`SpriteRUID` 없음**(=투명) + **`PlaceableFurniture.ItemId` 공란**(→ 세이브가 `itemName="TownPortal"`로 기록 → `Furniture_TownPortal` 모델 조회 실패). ([pitfalls 규칙 27](./pitfalls.md)) |
| ⚖️ **포탈 = 퀘스트 보상** | 신규 영지엔 포탈이 **없다.** `QuestDataSet.RewardPortalId` 신설 → **106(나무 상자 설치) 완료 시 마을 포탈 개통** + 토스트. 곧바로 107(포탈 이동)이 AutoAccept |
| 🐛 **퀘스트 201 누락** | `QuestDataSet.csv` 201행이 컬럼 1칸 밀려 `Disable="10"` → **촌장 퀘스트가 로드 단계에서 통째로 스킵**되고 보상·GiverNpcId도 유실 상태였음. 정렬 교정 |
| 🔁 마이그레이션 | 구세이브 `itemName="TownPortal"` → `"Portal"` 정규화 · 이미 106을 깬 세이브는 로그인 시 `BackfillEarnedPortals`가 보정 (멱등) |

- 변경: `PersistenceManager`(부트스트랩 순서·`SeedNewEstate`·`GrantEstatePortal`·`BackfillEarnedPortals`) · `ResourceSpawner.SpawnAndRegisterFurniture` · `QuestData.RewardPortalId` · `UserQuestData.Complete` · `PlayerDBManager.PostOnLoadedDataFromDB` · `QuestDataSet.csv` · `map/map01.map`(TownPortal 제거)
- 포탈 셀은 `PersistenceManager.EstatePortalCellX/Y`(기본 -2, 0) 프로퍼티. 목적지는 `PortalDestinationDataSet`
- 검증: `maker_refresh_workspace` ok → `maker_logs(build)` **Error=0 / Warning=6** (전부 기존 `PlayerInventory.ServerRequestUseItem` `LWA-1111`, 무관). dateTime 일치 확인. **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 새 캐릭터 → **영지에서 시작** ② 시작 시 포탈 없음 ③ 나무 상자 제작·설치 → 포탈 등장 + 토스트 ④ 포탈 F → 마을 이동(107 완료) ⑤ 재접속 후 포탈 유지 ⑥ 기존 세이브 접속 시 포탈 정상 ⑦ 촌장 대화로 201 수주

### 2026-08-10 메인메뉴 슬롯/커스텀 레이아웃 정합 + 닉네임 버그 — Play 확인 필요

| 항목 | 내용 |
|---|---|
| 🐛 **닉네임 거부** | `UIMainMenuController`의 `customNameInput`/`nameInput`이 **`TextInputComponent`로 선언**돼 있었음 → 실제 엔티티는 `TextGUIRendererInputComponent`라 바인딩이 nil → 입력값이 항상 `""` → **무엇을 입력해도 "글자수가 맞지 않음"**. 슬롯 삭제 확인도 동일 원인으로 항상 불일치. ([pitfalls 규칙 24](./pitfalls.md)) |
| 🐛 **슬롯 모양** | 수첩 아트가 **1024² 정사각 + AspectOnly** → `RectSize 1700×820`을 줘도 820×820만 그려져 슬롯 카드 5장이 프레임 밖에 있었음. **가로 행 5줄**로 재배치. ([pitfalls 규칙 25](./pitfalls.md)) |
| 🐛 **글자 배치** | 모든 `*Plate`가 글자보다 displayOrder가 높아 **글자를 가리고** 있었고, 슬롯 Plate는 좌표까지 250px 어긋나 버튼을 덮었음. 텍스트는 전부 `Left/Top` 정렬이라 박스 좌상단에 붙어 있었음 → 전부 정정 |
| ⚖️ 닉네임 길이 | **2~15자로 통일** (기존엔 클라·서버·`CharacterLimit`·placeholder 모두 2~12였음). 3곳 동기: [design/main-menu-save-slots.md](./design/main-menu-save-slots.md) §4.2 |
| ✨ 가독성 | 종이 위 글자 = 진한 갈색 잉크 / 키아트 위 글자만 어두운 Plate + 밝은 글자 |
| ✨ 파츠 버튼 | "내 캐릭터 유지" 선택 시 화살표 버튼이 **사라지던 것** → 흐리게(클릭만 차단) |
| 🔍 진단 로그 | `OnBeginPlay`에서 입력창 바인딩 성패를 log — 같은 부류 재발 시 즉시 식별 |

- 적용 스크립트: `scratch/fix_mainmenu_layout.cjs`
- 검증: `maker_refresh_workspace` ok → `maker_logs(build)` **Error=0 / Warning=6** (전부 `PlayerInventory.ServerRequestUseItem`의 기존 `LWA-1111`, 이번 변경과 무관). **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 새로하기 → 2글자 닉네임 생성 성공 ② 15자 초과 입력 차단 ③ 슬롯 5줄이 수첩 안에 들어오는지 ④ 커스텀 화면 글자가 안 가려지는지 ⑤ 삭제 확인(닉네임 재입력) 통과 ⑥ 이어하기 슬롯 아바타/레벨 표시

### 2026-08-09 메인메뉴 타이틀 UX + 외모 커스텀 — Play 확인 필요

| 항목 | 내용 |
|---|---|
| ✨ 타이틀 | 키아트 Bg + 로고 + **새로하기 / 이어하기 / 종료하기** 3버튼만 |
| ✨ 슬롯 | 버튼 누른 뒤 슬롯 선택. 이어하기=점유만(+AvatarGUI 외형), 새로하기=빈 슬롯만 |
| ✨ 룩모드 | 기본 **내 캐릭터 유지** / 선택 **외형 꾸미기**. `costumeLook.useAccount` |
| ✨ 커스텀 풀 | 기본 세트 확대 — 헤어20·눈10·피부6·상의15 (화려 코스튬 제외) |
| 🐛 닉네임 | `#` 바이트 판정 → **UTF-8 글자 수** 2~12 (한글 5자+ 생성 실패 수정) — *2026-08-10에 2~15로 상향* |
| ✨ 텍스트 | 로고/타이틀버튼 스타일 반영 — 전 텍스트 BestFit + dilate/outline |
| ✨ 가독성 | 로고·태그라인·슬롯/커스텀 라벨 뒤 `*Plate` + 메뉴 버튼 반투명 채움 |
| ✨ 세이브 | `SaveData_sN.costumeLook` + `SlotMeta.costume` · 계정=`UseCustomEquipOnly=false` / 커스텀=`true` |
| ✨ 종료 | `KickUser(WorldContent)` (플랫폼 Leave API 없음) |
| ✅ UI 배치 | 아트 적용 후 레이아웃 엉망 → **2026-08-10 정합 완료** (위 항목). 인수인계 문서: [design/mainmenu-ui-verify-handoff.md](./design/mainmenu-ui-verify-handoff.md) |

- 검증: **refresh 검증 보류(MCP 미연결)**. 런타임 검증 보류 → 위 핸드오프로 이관.
- Play 확인: ① 타이틀 3버튼·글자 플레이트 가독 ② 이어하기 아바타(계정/커스텀) ③ 새로하기→**내 캐릭터 유지**로 시작 ④ **외형 꾸미기**→파츠 변경 후 유지 ⑤ 슬롯2 분리 ⑥ 종료/삭제

### 2026-08-08 메인메뉴·슬롯·대화창 — Play 확인 필요

| 항목 | 내용 |
|---|---|
| ✨ 슬롯 5 | 접속 시 메인메뉴 → 이어하기/새로하기(닉네임 2~12자)/삭제. 레거시 `SaveData`는 슬롯1 마이그레이션 |
| ✨ 닉네임 | GlobalDataStorage `NicknameRegistry` + 계정 내 타 슬롯 중복 거부 |
| ✨ 대화창 | F「대화하기」→ 하단 메이플식 창(DialogGroup displayOrder=40, HUD 덮음). 자동 혼잣말만 말풍선 |
| ✨ 퀘스트 201 | 촌장 `elder` 수주 — 튜토리얼 107 이후, Grass 5 채집 (코지+미스터리 톤) |
| ✨ 낚시왕 | 점수 키 = `{userId}_s{slot}`, 표시 = 캐릭터 닉네임 |

- 검증: **refresh 검증 보류(MCP 미연결)**. 런타임 검증 보류(제작자 Play).
- Play 확인 포인트: ① 접속 시 메인메뉴·페이드 유지 ② 새로하기 닉네임 중복 거부 ③ 슬롯2 새 캐릭터와 슬롯1 진행 분리 ④ 촌장 F → 대화창·201 수락 ⑤ 낚시 랭킹에 캐릭터명 표시 ⑥ 모바일/퀵슬롯이 대화창에 가려지는지

관련 실측 기록: [reference/resource-api-pitfalls.md](./reference/resource-api-pitfalls.md) §2 · §5-bis · §5-quater.

### 2026-08-08 상호작용 가이드 (로드맵 2번) — Play 확인 필요

| 항목 | 내용 |
|---|---|
| ✨ **신규** | 조준선이 상호작용 대상에 닿으면 **대상 위에 "[F] {행동}" 라벨**(메이플 폰트·흰 글자·다크 아웃라인, 모바일은 키 프리픽스 없음) + **대상 스프라이트를 노란 틴트로 하이라이트**. 라벨은 `uitext` 런타임 스폰(TimeClock 패턴 — `.ui` 파일 무수정, 규칙 11 영향권 밖) |
| 대상 탐지 | `ProbeInteractTarget()`이 **TryInteract와 같은 우선순위**로 판정만 수행: 보물상자→포탈→침대→화로→상자→낚시터→물 타일→분산 6종(연구소/게시판/상인/주민/낚시왕/가축). ⚠️ 우선순위는 양쪽 동시 수정(규칙 18 계열 주석 명시) |
| 라벨 문구 | 각 인터랙터블 스크립트의 `property string InteractLabel` 기본값 (연구소 이용하기/포탈 이용하기/대화하기 등 12종 — 이름 분기 없음, R3) |
| 로그 스팸 방지 | `IsAimTarget`/`IsAimTileWater`를 **코어(무로그)+래퍼(로그)** 로 분리 — F 단발 판정은 기존 로그 유지, 0.15s 프로브는 무로그. 대상 변경 시에만 `[GUIDE]` 1줄 |
| 한계 | 아바타 렌더러 NPC는 `Color` 프로퍼티가 없어 **라벨만** 표시(틴트 없음). 아웃라인 셰이더(`Outline` 카테고리 머티리얼)는 msw-guide-mcp 연결 후 속성 확정해 후속 적용 |

- 검증: LSP 진단 인터랙터블 12종 errors=0 · warnings=0 (info는 기존 크로스 스크립트 오탐). **refresh Error=0 · Warning 48 = baseline 유지(증가분 0), Info 519(+6 = 신규 프로퍼티 LIA-1114 계열) — 2026-08-08 실측**. 런타임 검증 보류(제작자 Play).
- Play 확인 포인트: ① 포탈/연구소/상인/침대/화로/상자/게시판/가축/물가를 조준할 때 라벨 문구·위치(대상 상단) ② 스프라이트 대상 노란 틴트 적용·이탈 시 **원색 복원**(특히 색 있는 포탈) ③ F를 눌렀을 때 실제 동작과 라벨이 일치하는지(어긋나면 우선순위 규약 위반) ④ 콘솔 `[GUIDE] label=... target=...`이 대상 변경 시에만 찍히는지(스팸이면 회귀) ⑤ 낚시 중/수면 중 라벨 숨김

### 2026-08-06 물·낚시 수정 — Play 확인 필요

| 증상 | 원인 | 수정 |
|---|---|---|
| 연못 둘레에 흙 후광 | 프린지가 뚫는 것은 **그 셀 자신의 L1**(=`Soil`)이라 물이 아닌 흙이 드러남 ([규칙 19](./pitfalls.md)) | `fix_water_fringe.cjs` 규칙 반전 — 잔디가 물 셀을 ½셀 덮도록. 문법 = [tile-scheme.md §4-bis](./tile-scheme.md). map01 L2 72셀 변경, **L1 무수정** |
| 낚시 상호작용 무반응 | `IsAimTileWater()`가 미선언 `self.LastDirection`(→nil)로 방향 분기 → **항상 아래쪽 셀만 검사**. 셀 환산도 `math.floor` 자체 구현 ([규칙 18](./pitfalls.md)) | `ToCellPosition` + `LastDirectionX/Y` 단일 규약으로 교체 + `[FISHING]` 태그 로그 추가 |

- 검증: refresh **Error=0** (total 561 / Warning 48 / Info 513). **런타임 검증 보류(제작자 Play)**.
- Play 확인 포인트: ① 연못 둘레에 흙색 띠가 없는지 ② 물 쪽을 바라보고 `F` → 낚시 캐스팅 시작 ③ 좌/우/위 방향에서도 되는지 ④ 콘솔에 `[FISHING] aim=(x,y) tile=Water water=true` 출력

### 2026-08-06 삽 길 파기 회귀 + 물 전용 도구 — Play 확인 필요

| 증상 | 원인 | 수정 |
|---|---|---|
| 삽으로 길을 파려는데 물이 생김 | T92가 물 파기를 삽에 얹으면서 `if action == ... or action == "digPath"` 로 조건에 넣어 `realAction`이 **항상** `dig_water`/`fill_water`로 치환됐다. `ApplyTerrainEdit`의 `digPath` 분기가 **도달 불가능한 코드**가 되어 Phase 14-A 길 파기가 통째로 회귀 | 조건에서 `digPath` 제거 + 재발 방지 주석. 물 편집은 **전용 도구** 소관으로 분리 |

- ⚖️ **2026-07-25 "CSV 행 추가 없이 기존 Shovel 재사용" 결정을 뒤집음** (2026-08-06 제작자 확정): 삽 하나가 길·물을 겸하면 둘을 고를 방법이 없어 한쪽이 반드시 죽는다.
- **신규 `Water Spade`**: `item_dataset` + `RecipeDataSet` 각 1행. `TerrainEditAction=dig_water`. 제작 = Wood 2 + Stone 2 (Tier 1).
- ⚖️ **2026-08-06 지형 도구 외형 확정** (제작자 F9 프리뷰 육안 선택):

  | 도구 | 외형 | RUID | 슬롯/모션 |
  |---|---|---|---|
  | `Shovel` | 사각 강철 야삽 *(구 Pooh Pooh Shovel 교체)* | `f1b86bd8…` | onehand / `swingO1` |
  | `Water Spade` | 삼각 강철 야삽 | `5803e765…` | onehand / `swingO1` |
  | `Hoe` | 호프만 *(유지)* | `db5c8f98…` | twohand / `swingT1` |

  - `IconRUID` = 각 `WeaponRUID`의 `thumbnail://` — 아이콘과 손에 든 모습이 구조적으로 어긋날 수 없다(T72 패턴).
  - 🔴 Shovel은 신규 RUID가 `onehandedweapon` 계열이라 **`WeaponSlot` twohand→onehand, `SwingAction` swingT1→swingO1 동반 변경**. 카테고리↔슬롯이 어긋나면 조용히 미장착되고, 모션 계열이 어긋나면 휘두르는 중 무기가 사라진다([resource-api-pitfalls §5](./reference/resource-api-pitfalls.md)).
  - **전수 감사 통과**: 무기 RUID 보유 11개 도구 전부 카테고리↔슬롯↔모션 정합 (빈 `WeaponSlot`=onehand 폴백 반영, 불일치 0건).
- ⚖️ **2026-08-06 삽 계열 스윙 모션 확정 = `stabO1`** (Shovel · Water Spade 공통. 제작자 F9 2라운드 육안 선택).
  - 발단: "Hoe처럼 내려찍는 모션" 요청 → **Hoe의 `swingT1`은 두손 전용이라 야삽(onehandedweapon)에는 쓸 수 없다**(걸면 모션 중 도구가 사라짐). 갈래 A(야삽 유지, 한손 액션 중 선택)로 진행.
  - 1라운드 `swingO1`·`O2`·`O3`·`stabO1`·`stabO2` / 2라운드 `swingOF`·`stabOF`·`swingP1`·`P2`·`PF` → **`stabO1` 채택**(땅에 삽을 꽂는 찌르기 동작에 가장 근접).
  - 📌 **실측으로 알아낸 것 (공식 문서에 없음 — 재조사 방지)**:
    - **`*F` 계열(`swingOF`/`stabOF`)은 모션이 훨씬 크다** → **치명타·강타 연출 후보로 재사용 가치 있음**.
    - **폴암 계열(`swingP1`/`P2`/`PF`)은 한손 아바타 아이템에 프레임이 없어 무기가 사라진다** → 한손 도구에 P 계열 금지.
    - `swingO1`은 내려찍기가 아니라 **휘두르기**에 가깝다.
  - 🔴 **`MineState.mlua`의 "swingO1 = 머리 위 내려찍기 / swingO2 = 사선 내려치기" 주석은 근거 없는 추정이었음 → 정정 완료.** 공식 문서(*Controlling Avatar Animations*)는 **액션 이름 목록만 제공하고 각 모션의 동작을 설명하지 않는다.** 모션 인상을 주석·문서에 단정하지 말 것.
  - 한손 전체: `swingO1` `swingO2` `swingO3` `swingOF` `stabO1` `stabO2` `stabOF` (+폴암 `swingP1` `swingP2` `swingPF`) / 두손 전용: `swingT1~T3` `swingTF` `stabT1` `stabT2` `stabTF`.
  - 액션 보유 여부는 **API로 사전 확인 불가** (`payload: null` — [resource-api-pitfalls §2-bis](./reference/resource-api-pitfalls.md)). 육안이 유일.
  - F9 프리뷰는 평시 구성(현행 도구 5종 미러링)으로 복귀 완료.
  - 고른 뒤 할 일: `item_dataset`의 `Shovel`·`Water Spade` `SwingAction` 갱신 + `UIPreviewToolController`를 평시 구성(주석에 보존)으로 복귀.
- 검증: refresh **Error=0** (Warning 48 = baseline 유지), CSV 열 정합 불일치 0건. **런타임 검증 보류(제작자 Play)**.
- Play 확인 포인트: ① **삽으로 길이 다시 파지는지**(최우선 — 회귀 수정 확인) ② 괭이는 흙 홀 정상 ③ Water Spade 제작 → 흙에 쓰면 물, 물에 쓰면 되메움 ④ 삽·물삽을 들었을 때 외형이 각각 맞는지, 휘두르는 중 무기가 사라지지 않는지

> 🙋 **남은 판단**: 삽·괭이·물삽의 **떨어진 아이템 모델**이 셋 다 `Item_StonePickaxe`로 같다. 손에 든 모습(`WeaponRUID`)은 서로 다르므로 급하지 않다. 드롭 외형까지 분리하려면 `.model` 3종 신규 저작이 필요 — 별도 작업으로.

### 2026-08-07 물삽 + 드러난 흙 근처 프린지 꼬임 — Play 확인 필요

| 항목 | 내용 |
|---|---|
| 🔴 **원인** | 잔디 셀이 **물**과 **흙 홀**에 동시에 접하면 같은 서브셀을 양쪽이 주장한다. 구식 `(base & ~water) \| other` 는 흙이 이겨 **물에 붙은 흙 조각**이 남음 (=프린지 꼬임). 캡처로 물·흙·잔디 삼중 코너에서 재현 확인 |
| 🔴 **수정** | `RefreshWaterAreaRect` / `fix_water_fringe.cjs` 모두 **물 우선** `(base \| other) & ~water`. 시뮬레이션 6305조합 꼬임 0. plan 기록은 `ipairs`+중첩테이블 대신 **평행 배열+while** (호출 경로 정지 실측 회피) |
| 캡처 | Play 중 물가·흙 경계 꼬임 육안 확인. MakerScript로 dig 재현은 루프 제한에 걸려 불완전 — **제작자 Play로 물삽 dig 확인 필요** |

### 2026-08-07 물 파기 가드 + L4 scrub + G키 영속 — Play 확인 2026-08-07

| 항목 | 내용 |
|---|---|
| 🛑 **가드** | 물 블록 **둘레 1칸**에 드러난 흙(L2 홀)이 있으면 `dig_water` 거부. 피드백: `"드러난 흙 근처에는 물을 갤 수 없습니다."` |
| 🔧 **fill** | `fill_water` 코드는 유지(향후 복구 도구). **Water Spade는 dig만** — 물 조준 시 되메움 토글 제거(2026-08-07) |
| 🧰 **G키** | 조준 셀 **3×3** → L1 `Soil` + L2 FullGrass + L4 scrub. **`forceGrass` 지형 델타로 영속** + MarkPlayerDirty. 팝업 없음 |
| 🧹 **L4** | map01 L4 잔디/프린지 23칸 제거. `ObstacleQuery`는 **Big Wall만** 벽. 맵 로드 scrub |

- Play 확인 **PASS 2026-08-07** (제작자): 물삽 dig-only · G 영속 · L4 정리
- 검증: refresh는 Maker MCP 간헐 미연결로 보류했던 구간 있음 — Play로 런타임 확인 완료

### 2026-08-06 물삽 프린지 + 지형 편집 시각 피드백 — Play 확인 필요

| 항목 | 내용 |
|---|---|
| 🔴 **버그 수정** | 물삽으로 판 물에 프린지 미적용 — **런타임 경로가 §4-bis 오버행 문법을 아예 몰랐다**(`dig_water`가 `SetTile("Water")`+마스크 15만 실행). `ResourceSpawner:RefreshWaterArea()` 신설로 3×3 재계산. `fill_water`도 동일 적용. 규칙은 `fix_water_fringe.cjs`와 **동일 — 한쪽만 고치지 말 것** |
| ✨ **신규** | **지형 편집 영향 셀 시각 피드백** — 조준점과 별개로, 이번 편집이 건드릴 셀을 미리 칠한다. **진한 노랑 = 직접 파이는 셀 / 옅은 노랑 = 프린지(½셀 마진)만 받는 셀**. `map01`에 `TerrainAffect_1~9` 스프라이트 풀 추가(digHole 최대 9셀), 클라 `PlayerController:UpdateTerrainAffectPreview()` |
| ♻️ **규칙 18 정리** | `digPath` axis/side 판정이 서버(PlayerInventory)에만 있어 미리보기가 복제본을 만들 뻔했다 → `ResourceSpawner:DeriveDigPathAxisSide()` 단일 소스로 추출, 서버·클라 공용. 영향 셀 집합도 `GetTerrainEditAffectedCells()` 단일 소스 |

- 검증: refresh **Error=0** (Warning 48 = baseline 유지, 증가분 0). `map01` 엔티티 25개 전부 `jsonString` 객체 유지(규칙 16 통과).
- **2026-08-08 코드 정합 재검증 (로드맵 4번 — 어시스턴트)**: ① 단일 소스 3함수(`GetTerrainEditAffectedCells`/`GetWaterDigOrigin`/`DeriveDigPathAxisSide`) 시그니처 = 클라 프리뷰(PlayerController)·서버 적용(PlayerInventory) 호출부와 일치 ② 최대 영향 셀 16(물 4×4) = `TerrainAffect_` 풀 16개(map01 실존) = 프리뷰 루프 상한 16 3자 일치 ③ digPath 6 / digHole·plantGrass 9 / dig_water 16 / forceGrass 9 전 분기 커버. **2026-08-08 refresh 재확인 Error=0 · Warning 48**(baseline 유지) — 남은 것은 아래 Play 확인뿐.
- Play 확인 포인트: ① 물삽으로 물 팔 때 **잔디가 물을 ½셀 덮는지**(흙 후광 없이) ② 되메우기 정상 ③ 삽/괭이/씨앗/물삽 들었을 때 **영향 셀이 노랗게 표시**되는지 ④ 표시된 셀과 실제로 바뀌는 셀이 **일치**하는지(어긋나면 규칙 18 위반 재발)

> ⚖️ **2026-08-06 결정 — 물삽 1회 = 2×2 블록** (`ResourceSpawner.WaterDigSize = 2`)
> - **원인 확정(시뮬레이션 실측)**: 1×1은 오버행이 셀을 전부 덮어 마스크가 0 → degenerate 가드가 홀(15)로 되돌림 → **프린지가 아예 안 붙고 각진 물 1칸.** "여전히 잘 안 된다"의 정체.
> - 2×2면 각 셀이 안쪽 모서리를 남겨 **중앙 물웅덩이 + 사방 잔디 오버행**, 둘레 12셀 전부 `FullGrass`(흙 후광 0). 연속 2×2 병합·3×3 내부 온전한 물도 실측 확인.
> - 조준 셀을 **항상 포함**하고 바라보는 쪽으로 뻗는다(`GetWaterDigOrigin` — 서버·클라 공용, 규칙 18). 영속 델타에 **블록 원점**을 저장해 재생 시 방향 없이 재현.
> - 시각 피드백 풀 9 → **16**(4×4 = 직접 4 + 프린지 12). 4방향 전부 16셀·조준셀 포함 검증 완료.
> - 문법 원문 = [tile-scheme.md §4-bis](./tile-scheme.md).

### 2026-08-06 릴링 밸런스 — Play 확인 필요

| 증상 | 원인 | 수정 |
|---|---|---|
| ⚠ 무시하고 F를 꾹 눌러도 텐션이 일정 이상 안 오르고 낚시 성공 | 티어 1은 릴이 4.6초라 **위험 페이즈가 딱 1회**만 들어오고, 1회로 얻는 텐션이 최대 66(=`TensionRisePerSec 55 × DangerDurationMax 1.2`)이라 100에 **도달 자체가 불가능**했다. 시뮬레이션 4000회 실패율 **0.0%** | `FishingDifficultyDataSet.csv` 전 티어 재조정 — `TensionRisePerSec × TensionReliefMinMult × DangerDurationMin ≥ GaugeMax` 를 만족시켜 위험 페이즈를 끝까지 버티면 반드시 줄이 끊기게 |
| 초급 어종이 너무 쉬움 | 위와 동일 원인 (반응할 일이 없었음) | 릴 길이·위험 빈도 재조정 — 티어 1 약 7초/위험 1.7회 → 티어 5 약 11초/위험 3.4회 |

- `TensionReliefMinMult` **0.4 → 0.7**: 0.4에서는 고레벨 완화가 위 부등식을 깨서 버그가 되살아났다.
- **재발 방지**: `WarnIfDangerToothless()` 자가검사 추가 — 부등식이 깨진 난이도가 있으면 `[FISHING][BALANCE]` 경고를 로그에 남긴다. 앞으로 CSV만 만져도 조용히 무력화되지 않는다.
- 검증: refresh **Error=0** (Warning 48 = baseline 유지, 증가분 0). **런타임 검증 보류(제작자 Play)**.
- Play 확인 포인트: ① ⚠ 뜨는데 계속 누르고 있으면 **줄이 끊기는지**(전 어종) ② ⚠ 보고 손 떼면 잡히는지 ③ 잉어/새우 한 마리에 6~8초·손 떼기 2회 안팎인지 ④ 콘솔에 `[FISHING][BALANCE]` 경고가 **없어야** 정상

---

## 2. Play 확인 대기 (코드 완료 · 런타임 미확인)

> ⚠️ 누적 목록이라 정확도가 떨어질 수 있다. 제작자가 광범위 Play에서 이상을 보고하지 않은 항목이 다수 섞여 있고, **개별 명시 확인만 미완**인 상태다. 확인되는 대로 지우면 된다.

### 최근분 (2026-08-04 배치 O·P)

| # | 내용 | 확인 포인트 |
|---|---|---|
| T100 | 가구 6종 `TriggerComponent` 부여 | 가구 통행 차단 · F 상호작용 거리 |
| T98 | map01 물가 L2 프린지 — **2026-08-06 규칙 반전으로 재작업됨** | **맵 로드 성공 여부 먼저** (규칙 16 사고 복구분) · 물가 비주얼 = §1 참조 |
| T103 | Prop 11종 `LWA-4012` 경고 청소 | 시각·차단·조준 회귀 0 (값 변경 없음) |
| T101 | 콜라이더 판정 `Transform.Scale` 반영 | `Big Stone1`·`Tree1` 통과 버그 해소 |

### 물·낚시 (Phase 21)

| # | 내용 | 확인 포인트 |
|---|---|---|
| T91 | 낚시 = 물 타일 인접 판정 | **영지 물가 낚시** (사냥터는 물 페인팅 전이라 미검증) |
| T92 | 영지 물 파기 (`dig_water`/`fill_water`) | 파기·되메우기 · 자기 갇힘 방지 가드 |

### 이전 누적분

| # | 내용 |
|---|---|
| T27 | 퀘스트 보상 → 레시피 해금 (`RewardUnlockId`) — **미완료 캐릭터로** 확인 필요 |
| T64 | 낚시 v2 홀드-릴리즈 릴링 + 숙련 레벨 |
| T65 · T67 · T69 | 채집·공격 SFX / 조준 셀 게이트 / QWER 장착 영속화 |
| T19 · T23 | 목장·가축 / 펫 동반자 |
| T49 · T54 · T55 · T61 | 가축·펫 아트 / 팝업 닫기 / BGM·앰비언스 / 지형 편집 쿨다운 |
| T72 · T73 · T74 · T77 | 아이템 아이콘 / 광장 리스킨 / 주택 배치 / 마을 NPC |
| T84 · T85 · T86 · T87 | NPC Rigidbody 청산 / 영지 낚시터 복구 / 경고 청소 / 워크스페이스 위생 |

---

## 3. 제작자 직접 예정 (아트 — 취향 판단 필요)

| # | 내용 | 준비된 것 |
|---|---|---|
| T94 | 상점거리 노점 M1~M3 | 커스텀 톱다운 리드로우 5종 (`scratch/artwork_rework/msw_topdown_stall*`) — 변형 선택만 |
| T76 | 마을 랜드마크 (여관·시계탑·헛간) | 헛간 리드로우 4종 완성. 여관(968×640 벡터풍)·시계탑(260×708)은 도트 리드로우 + 시점 압축 판단 필요. 원본 `scratch/artwork_rework/source/{inn,clocktower,barn}.png` |
| — | `House_ThatchHut` 배치 여부 | 모델만 존재하고 `town.map` 미배치 (T74 보고 "5동" vs 실제 4동) |

---

## 4. 후속 후보 (미착수)

> 🗺️ **2026-08-08 제작자 로드맵 5건** — ② 상호작용 가이드는 §1에서 구현 완료(Play 대기), ④ 지형 편집 시각 피드백은 §1 재검증 완료(Play 대기). 나머지 3건은 설계 문서 작성 완료, 구현 미착수.

| 항목 | 선행 조건 |
|---|---|
| **로드맵 ① 스토리·NPC·퀘스트 연동** | 설계 완료 + **챕터1 샘플(Quest 201) 코드 투입**. 톤=코지+미스터리 확정. 추가 챕터는 스토리 에이전트 §5 브리프 |
| **로드맵 ③ 메인화면 + 슬롯 세이브** | **코드 완료(Play 대기)** — 슬롯5·닉네임 중복금지·캐릭터 단위 낚시왕 |
| **로드맵 ⑤ 아트 스타일 가이드·생성 프롬프트** | 가이드 = [design/art-style-guide.md](./design/art-style-guide.md) 작성 완료. 제작자가 타사 에이전트로 생성 → image-to-pixel 도트화 → RUID 교체 파이프라인 |
| **상호작용 아웃라인 셰이더 (로드맵 ② 후속)** | 현행은 Color 틴트. `Outline` 카테고리 `.material` 저작은 msw-guide-mcp 연결 후 |
| ~~**Prop `LWA-4012` 경고 31건 재발 규명**~~ → ✅ **해소 (2026-08-08)** | 별도 머신에서 HEAD `3126192` 실측 결과 **Warning 17**이고 내역이 문서상 "상시 잔여 17"과 정확히 일치 — Prop 31건 부재. **T103(`c6c0a3c`) 청소는 실효했다.** 나흘간의 "48"은 고착된 옛 build 로그 스냅샷을 반복 인용한 정황이 강하다(→ [규칙 22](./pitfalls.md#규칙-22-build-로그는-refresh마다-갱신되지-않는다--타임스탬프를-확인하라) 신설, baseline 17로 갱신). **잔여 확인**: 48을 보고했던 머신에서 refresh 후 로그 `dateTime`을 대조해 스냅샷 고착이 맞는지 확정할 것 |
| **town / template_field / template_boss 물 페인팅 + L2 프린지** | 제작자가 Maker에서 L1 `Water` 페인팅 → `scripts/fix_water_fringe.cjs` 재실행 (스크립트는 범용). ⚠️ [규칙 16](./pitfalls.md#규칙-16-map의-jsonstring은-중첩-객체다--문자열-대입-금지) 재확인 필수 |
| **마을 생활 소품 재배치** | T75가 모델 11종만 남기고 `town.map` 인스턴스 43개를 철회한 상태. 재배치는 [규칙 17](./pitfalls.md#규칙-17-trigger배치는-스프라이트-실루엣-정합이-1순위다) 실루엣 정합 기준으로 |
| **16-C 직업/전직** | `JobId` 컬럼 예약 완료. 설계 계약 = [design/skill-tree-plan.md](./design/skill-tree-plan.md) §7 |
| **주간 낚시왕 보상** | T57/T63의 v1은 보상 없음 |
| 경계 테라스·절벽 아트 (구 T4) | ⚖️ 보류 — Maker에서 제작자 협업 전제. `wall.tileset` 동시 편집 금지 |

---

## 5. 폐기 결정

| 항목 | 사유 |
|---|---|
| 필드·바이옴 오브젝트 변주 (구 T78) | ⚖️ 2026-07-25 — 체감 기여 최저 + Phase 21이 사냥터 지형을 재편해 중복. 명세(`design/artwork-spec.md` §7)는 보존 |

---

## 관련 문서

- 작업 절차: [workflow.md](./workflow.md)
- 함정 사전: [pitfalls.md](./pitfalls.md)
- Phase 트래커(설계 관점 진행 현황): [../game_design.md](../game_design.md) §5
- 구 T티켓 원문·보고서: [agents/](./agents/)
