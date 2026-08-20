# 작업 목록 (Tasks)

> **현재 상태**: 솔로 체제 (제작자 주도 + AI 보조). 2026-08-06 문서 개편 시점 기준.
> T번호 체계는 **더 이상 신규 발행하지 않는다.** 아래 T번호는 구 체제에서 넘어온 잔여 항목의 식별자이며, 상세는 [agents/reports/](./agents/reports/)에 있다.
> 새 작업은 T번호 없이 이 문서에 항목으로 추가한다.

---

## 1. 진행 중 (워킹 트리 미커밋)

| 대상 | 내용 |
|---|---|
| map/*.map | **맵 경계에 배치된 정적 오브젝트 좌표 조정 (타일 축소 0.5에 따른 경계선 오브젝트 재배치)** |
| `map/*.map` · `ResourceOccupiedArea` · `PlayerController` · `PlayerInventory` · `ResourceSpawner` | **타일 축소(GridSize 0.5×0.5) 및 2×2 조준점·점유 영역(OccupiedArea) 시스템 개편** (2026-08-20) — 아래 참조 |
| `docs/world_metadata.md` · `docs/design/story/story-bible.md` | **[출품 준비] 월드 메타데이터(1000자 스토어 설명문·3분할 썸네일·스토리 바이블 전면 개정)** (2026-08-20) — 아래 참조 |
| `PlayerController.mlua` · `PersistenceManager.mlua` · `PlayerDBManager.mlua` | **[긴급 핫픽스] 타 유저 동시 접속 시 LEA-3022 클라 에러 폭주 + 퇴장 시 서버 크래시 해소** (2026-08-19) — 아래 참조 |
| `RootDesk/MyDesk/NPC/Models/*.model` (7종) · `map/town.map` | **[핫픽스] 마을 주민 7종 콜라이더 오류 원인 규명 및 일괄 교정** (2026-08-19) — 아래 참조 |
| `SkillDataSet.csv` · `item_dataset.csv` · `PlayerController.mlua` | **[긴급 핫픽스] 데이터셋 컬럼 복원(LEA-3011) + 점프/낙하 모션 고착 해소** (2026-08-18) — 아래 참조 |
| UIQuestNavigationController · UIHUDController · `ui/HUDGroup.ui` | **미수락 퀘스트 주민 방향/거리 네비게이션 시스템** (2026-08-16) — 아래 참조 |
| PlayerCombat · PlayerController · item_dataset · SkillDataSet | **전투 데미지 세 갈래 + 주먹도끼 던지기 장착 제한** (2026-08-16) — 아래 참조 |
| item_dataset · SkillDataSet · 인벤/스킬/제작/캐릭터 툴팁 | **아이템·스킬 스펙 툴팁 + MagicAttack/SkillAttack 칸** (2026-08-16) — 아래 참조 |
| PlayerQuest · QuestData · UserQuestData · QuestDataSet | **보고 퀘 vs 자동완료 분리** (2026-08-16) — 아래 참조 |
| QuestDataSet 202~216 · StoryDialog · Slime Jelly · template_field | **스토리 챕터 1~2 1차 반영** (2026-08-15) — 아래 참조 |
| VillagerDialog · UIMinimapController | **퀘스트 NPC 머리 표시 + 미니맵 노란 칸** (2026-08-15) — 아래 참조 |
| `ui/PopupGroup.ui` CharacterPopup · CraftingPopup | **장착 실루엣 삭제 + 제작 제목/설명 가림 해소** (2026-08-15) — 아래 참조 |
| `ui/PopupGroup.ui` CharacterPopup | **캐릭터 정보 장착칸·게이지·권한버튼 창 밖 돌출** (2026-08-15) — 아래 참조 |
| `ui/PopupGroup.ui` | **팝업 배치·가시성 전수 복구** (2026-08-15) — 아래 참조 |
| `MainMenuGroup` · `PreviewTool` · `HUDGroup` · `UIHUDController` | **부팅 시 팝업/HUD가 타이틀보다 먼저 보임** (2026-08-15) — 아래 참조 |
| `PlayerDBManager` · `PersistenceManager` | **퀘스트 재접속 초기화 버그 해결 & 캐릭터 닉네임 동기화** (2026-08-15) — 아래 참조 |
| `PersistenceManager` · `UIMainMenuController` | **이어하기 슬롯 캐릭터 레벨 실시간 동기화** (2026-08-15) — 아래 참조 |
| `QuestConditionDataSet` · `PlayerQuest` · `UserQuestData` | **퀘스트 CountMode Action/State** (2026-08-15) — 아래 참조 |
| `ui/PopupGroup.ui` 퀘스트 보상 Icon | **보상칸 아이콘 Simple+None 정렬** (2026-08-15) — 아래 참조 |
| `item_dataset` · `SkillDataSet` · 인벤/스킬/퀘스트 | **주먹도끼 기믹 무기 + 던지기 스킬** (2026-08-14) — 아래 참조 |
| `docs/design/story/` 신설 6문서 · `AGENTS.md` §10 | **스토리·맵·퀘스트 콘텐츠 설계 체계** (2026-08-14) — 아래 참조 |
| `ui/PopupGroup.ui` · `HUDGroup.ui` · `UIQuestLogController` · `UIQuestController` | **퀘스트 로그 A안** (2026-08-14) — 아래 참조 |
| `UIPreviewToolController` · `item_dataset` | **도끼 외형 F9 8라운드** (2026-08-14) — 망치 철회, 전투 도끼 재탐색 |
| 데이터셋 + `ui/PopupGroup.ui`·`HUDGroup.ui` + UI 컨트롤러 | **한글화 1차** (2026-08-14) — 아래 참조 |
| `ui/MainMenuGroup.ui` · `UIMainMenuController` | **타이틀 호버+SFX+키아트 정리** (2026-08-14) — 아래 참조 |
| `ui/*.ui` 5파일 | **버튼 호버 ColorTint** (2026-08-14) — 아래 참조 |
| `ui/MainMenuGroup.ui` | **캐릭터 만들기 좌/우 페이지** (2026-08-14) — 아래 참조 |
| `ui/*.ui` 5파일 · UI 컨트롤러 바인딩 | **UI 정합성 감사** (2026-08-13) — 아래 참조 |
| `ui/PopupGroup.ui` | **팝업 정합성 감사 + 크롬 2계열 통일 적용** (2026-08-14 ⚖️ 확정) — 아래 참조 |
| `ResourceSpawner` · `PersistenceManager` · `PlayerController` | **영지 밖 좌표 가드** (X/Y -27~27, 2026-08-13) — 아래 참조 |

### 2026-08-20 타일 축소(GridSize 0.5×0.5) 및 2×2 조준점·점유 영역(OccupiedArea) 시스템 개편

- **요청 사항**:
  1. 타일을 기존 2×2 타일 크기가 현재 1×1 크기로 보이도록 축소 (`GridSize = Vector2(0.5, 0.5)`).
  2. 자동 생성되는 맵 오브젝트 및 엔티티는 기존 월드 크기(1.0)를 유지하되 점유 영역(`OccupiedArea`)은 2×2 타일로 확장.
  3. 플레이어 조준점이 1타일이 아닌 2×2 타일(1.0×1.0 월드 단위)을 지정하도록 단일화하고, 기존 삽/물삽/호미 등 보조 조준선(`TerrainAffect_1..16`)을 제거.
- **작업 내용**:
  1. **맵 타일 그리드 크기 변경**:
     - `map/map01.map`, `map/town.map`, `map/template_field.map`, `map/template_boss.map` 내 모든 `RectTileMapComponent` (`RectTileMap`, `RectTileMap2~6`)의 `GridSize`를 `{ x: 0.5, y: 0.5 }`로 설정.
     - `scripts/build_maps.cjs` 맵 빌더 스크립트의 레이어 생성 기본값에 `GridSize: { x: 0.5, y: 0.5 }` 추가.
  2. **오브젝트 점유 영역 확장**:
     - `ResourceOccupiedArea.mlua` 기본값을 `OffsetXMin = 0, OffsetXMax = 1, OffsetYMin = 0, OffsetYMax = 1`로 변경 (기본 1×1 월드 크기 = 2×2 타일).
     - 모든 `.model` 파일(`Furniture_*`, `Crop_*`, `Prop_*`, `Big Stone1/2`)의 점유 오프셋을 2배 확장 갱신 (ModelBuilder).
  3. **플레이어 조준 및 지형 상호작용 1×1 타일 단위 정밀화 & 캐릭터 중심 앵커 투영 & 렌더링 오프셋 보정**:
     - `PlayerController.mlua`:
       - `ReticleOffsetX` / `ReticleOffsetY` 프로퍼티 추가 (기본값 `0.0, 0.0`): 타격 셀과 100% 일치하도록 렌더링 위치 정합.
       - `GetAimedCell`: 캐릭터 발 위치 대신 **몸체 중심점(`Y + 0.25`)에서 진행 방향으로 0.45 전방의 타일 셀을 투영**하여 캐릭터 몸체와 겹치거나 위로 붕 뜨는 오차를 해결.
       - `UpdatePlacementPreview` / `UpdateMineReticle`: `GetAimedCell`과 `tilemap:ToWorldPosition(targetCell)` 및 `ReticleOffsetX/Y`를 연계하여 정확한 위치로 조준점 스냅.
       - `RequestMine` / `ProbeInteractTarget`: `GetAimedCell` 기반으로 타격 및 상호작용 위치 계산.
       - `IsAimTargetCore`: 1×1 타일 셀 `tilemap:ToWorldPosition(aimCell)` 기준 AABB ∩ 콜라이더 판정.
       - `IsAimTileWaterCore`: `GetAimedCell` 기준 물 타일 검사.
     - `PlayerInventory.mlua`:
       - `ServerRequestPlace`: `tilemap:ToWorldPosition(cellPos)` 기반으로 가구/작물 스폰 좌표 정밀화.
       - `ServerRequestTerrainEdit`: 전방 투영 셀 기준 허용 검증 및 1×1 타일 셀 단위 지형 편집.
     - `ResourceSpawner.mlua`:
       - `AddPlacedFurniture` / `RemovePlacedFurniture`: 다중 타일 점유(`ResourceOccupiedArea`)와 1×1 타일 조준 히트의 완벽 정합.
        - 자연 스폰(TrySpawnResourceInChunk, SpawnResourceWithAnimation, SpawnTownTreasureChests, SpawnHuntBoss, SpawnFixedPortal, ReconstructWorldPlacementsForMap, SpawnAndRegisterFurniture, AroundItem_Stone 드롭, FindSafeSpawnPosition): 하드코딩된 Vector3(x + 0.5, y + 0.5, 0) 대신 tilemap:ToWorldPosition(Vector2Int(x, y))을 사용하도록 전면 교체하여 타일 축소 후 맵 경계 밖으로 스폰되던 버그 해결.
      - MonsterSpawner.mlua: 몬스터 자연 스폰 및 AI 앵커 좌표를 tilemap:ToWorldPosition으로 동기화.
      - TileDurabilityManager.mlua: 자원/타일 파괴 시 드롭 아이템 위치를 tilemap:ToWorldPosition으로 동기화.
- **검증**: `maker_refresh_workspace` status ok, `maker_logs(kind="build")` Error=0, Warning=66 (baseline 유지, 신규 에러 없음), 타임스탬프 일치. **런타임 검증 보류(제작자 Play)**.

### 2026-08-20 월드 메타데이터(1000자 스토어 설명문·3분할 썸네일·스토리 바이블 전면 개정)

- **배경**: 메이플스토리 월드 콘테스트/모각코 출품 및 스토어 등록을 위한 메타데이터 패키지 구축.
- **작업 내용**:
  1. **공식 타이틀 확정**: `메이플크래프트: 마지막 모험가` (MapleCraft: The Last Adventurer)
  2. **세계관 & 스토리 개정**: 세상을 구하고 은퇴한 전설의 모험가가 모든 장비를 처분하고 일반인 몸으로 분양받은 작은 개인 섬에 정착해, 돌멩이 하나부터 시작하는 힐링형 개척 서사 (`story-bible.md` 전면 개정 및 `README.md` 판정 로그 기록).
  3. **스토어 상세 설명문 (1000자 이내 최적화)**: 이모지/마크다운 깨짐 방지를 위해 표준 특수문자(`※`, `◆`, `■`, `[ ]`)로 구성, 공백 포함 760자로 1000자 제한 완벽 통과. (크래프팅, 섬 꾸미기, 친구 초대, 공동 마을, 몬스터 연구, 사냥터 원정, 안내사항 포함).
  4. **스크린샷 5장 시각화 가이드 & 30초 트레일러 콘티**: UI/조작법/테크트리를 스크린샷 자막으로 분리하고, 30초 영상 초 단위 타임라인 구축.
  5. **대표 썸네일 에셋 생성**: [섬 라이프 / 몬스터 전리품 연구소 / 사냥터 전투] 3분할 및 대형 3D 카툰 타이포그래피가 일체화된 16:9 대표 썸네일 제작 (`maplecraft_3split_thumbnail_1787213764458.jpg`).
- **관련 파일**: `docs/world_metadata.md`, `docs/design/story/story-bible.md`, `docs/design/story/README.md`, `docs/tasks.md`

### 2026-08-19 타 유저 동시 접속 시 LEA-3022 클라 에러 폭주 + 퇴장 시 서버 크래시 긴급 핫픽스

제작자 보고: 마을에 다른 유저와 함께 들어가보니 콘솔 에러가 폭주함 (`[Error][CLIENT] [LEA-3022] InvalidExecSpace : 권한이 없는 실행 공간에서는 상태의 강제 전이가 불가능합니다. PlayerController.OnUpdate (at MyDesk/PlayerController:438)`, `[Error][SERVER] Object reference not set to an instance of an object. PersistenceManager.OnUserLeave`).

- **원인 분석**:
  1. **LEA-3022 클라이언트 에러 폭주**: `PlayerController` 컴포넌트의 `OnUpdate`, `OnKeyDown`, `OnScreenTouch` 등 클라이언트 훅에 `LocalPlayer` 가드가 누락되어 있었음. 동일 맵에 타 유저(Remote Player)가 접속하면 로컬 클라이언트에서 원격 유저 엔티티의 `PlayerController:OnUpdate`가 매 프레임 실행되어 로컬 키보드 입력을 읽고 `stateComp:ChangeState("IDLE"/"MOVE")`를 원격 엔티티에 호출함. MSW 엔진은 클라이언트가 타 유저의 StateComponent를 변경하는 것을 엄격히 금지하므로 초당 수백 회 `LEA-3022` 에러가 발생함.
  2. **OnUserLeave 서버 NullReference 크래시**: `PersistenceManager.OnUserLeave`에서 `self:SavePlayerData(player, true)`(내부 `SetAndWait` Yield 함수) 호출 도중 플레이어 엔티티가 파괴된 뒤, 다음 라인에서 `player:GetComponent("script.PlayerDBManager")`를 호출하여 서버 NullReferenceException 발생.
- **조치 내용**:
  - `PlayerController.mlua`: `OnBeginPlay`, `OnUpdate`, `OnKeyDown`, `OnScreenTouch`, `OnInteractButton`, `SetMobileReelHold`, `TryMine`, `TryInteract`에 `if self.Entity ~= _UserService.LocalPlayer then return end` 전수 배치 (`UpdateAvatarYOrder` 정렬만 모든 유저 수행).
  - `PersistenceManager.mlua`: `OnUserLeave`에서 `player:GetComponent("script.PlayerDBManager")` 조회를 `SavePlayerData` (Yield) 호출 전으로 이동.
  - `PlayerDBManager.mlua`: `SaveToDB`의 `onSaved` 콜백에 `isvalid(playerEntity)` 및 서브컴포넌트 `isvalid` 가드 추가.
- 검증: 정적 문법 검사 통과. Maker 오프라인 상태로 **refresh 검증 보류**, **런타임 검증 보류(제작자 Play)**.

### 2026-08-19 마을 주민 7종 콜라이더 오류 원인 규명 및 일괄 교정

제작자 보고: 마을의 주민들 콜라이더가 주민과 알맞지 않게 설정돼 있음. 기존 계산법에서의 원인 파악 후 일괄 처리.

- **원인 분석**:
  1. **중심 피벗(Center Pivot) 착오 및 음수 오프셋(-0.35)**: T81에서 NPC 스프라이트 피벗이 허리/중심에 있다고 가정하고 바닥 정렬을 위해 `ColliderOffset.y = -0.35`로 설정했으나, 실제 스프라이트 피벗은 **발밑(y = 0)** 이었음. 이로 인해 콜라이더 박스가 **발밑 땅속(y: -0.75 ~ +0.05)** 에 형성되어 북쪽에서는 몸통을 통과하고 남쪽에서는 0.75m 먼 땅에서 막힘.
  2. **Scale(배율) 곱셈 반영에 따른 왜곡**: T101에서 실물 콜라이더(`BoxSize × Scale`) 규약이 코드에 반영되면서, 스케일(1.218~1.658)이 곱해져 박스가 땅속으로 더욱 깊이 파고들고 불필요하게 커짐.
  3. **Y-Order(접지선) 정렬 및 F키 조준 결함**: 접지선 계산식(`groundY = worldY + ColliderOffset.y*sy - BoxSize.y*0.5*sy`)에서 음수 오프셋으로 인해 접지선이 1m 남쪽으로 오판되어 플레이어가 앞에 서 있어도 NPC에 가려지며, F키 조준선(AABB)도 빗나감.
- **올바른 계산 공식**: 발밑 피벗 기준 $\text{ColliderOffset.y} = \frac{\text{BoxSize.y}}{2}$ (양수). 바닥이 항상 정확히 발밑 접지선 `y = 0`에 일치하여 Scale 배율에도 바닥 위치가 불변하며 Y정렬 접지선도 플레이어와 1:1 완벽 정합.
- **표준 설정**: `BoxSize = { x: 0.60, y: 0.70 }`, `ColliderOffset = { x: 0.0, y: 0.35 }`

| 파일 | 조치 |
|---|---|
| `RootDesk/MyDesk/NPC/Models/*.model` (7종) | `Merchant`, `Villager_Elder`, `Villager_Fisher`, `Villager_ResidentA~D` 7종 `TriggerComponent` `BoxSize=(0.6, 0.7)`, `ColliderOffset=(0, 0.35)` 갱신 (ModelBuilder) |
| `map/town.map` | 위 7기 엔티티 `MOD.Core.TriggerComponent` `BoxSize`, `ColliderOffset` 동일 동기화 (MapBuilder) |

- 검증: `ModelBuilder.read` 및 `MapBuilder.read` 7종 전수 스캔 확인. `maker_refresh_workspace` status ok. build logs Error=1 (기존 `PlayerController.OnMapEnter` 무관), Warning=48 (baseline 유지). **런타임 검증 보류(제작자 Play)**

### 2026-08-18 데이터셋 컬럼 복원(LEA-3011) + 점프/낙하 모션 고착 해소 긴급 핫픽스

제작자 보고: 인게임 진입/제작대/인벤토리 오픈 시 `DamageModel`, `ToolTier`, `Attack`, `MagicAttack`, `SkillAttack` 컬럼 NotFound (`LEA-3011`) 에러 폭주 + 캐릭터가 들어가자마자 계속 점프 모션으로 이동하는 문제.

- **원인**:
  1. 커밋 `23402cc`에서 `item_dataset.csv` 및 `SkillDataSet.csv`가 이전 버전으로 롤백되어 신규 스탯 컬럼들이 누락됨.
  2. 톱다운 맵(`RectTile`)에는 사이드뷰 발판 판정이 없어 `Player.stateset`의 `NCIsOnGround`(착지)가 발동하지 않는데, `PlayerController.mlua`가 `FALL`/`JUMP` 상태에서의 `MOVE`/`IDLE` 복귀를 가드 조건으로 차단하여 아바타가 점프 모션에 영구 고착됨.

| 파일 | 조치 |
|---|---|
| `SkillDataSet.csv` | `DamageModel`, `SkillPower`, `RequireEquippedItem` 컬럼 복원 (`a0333f5` 버전 정합) |
| `item_dataset.csv` | `Attack`, `ToolTier`, `MagicAttack`, `SkillAttack` 컬럼 복원 (`a0333f5` 버전 정합) |
| `PlayerController.mlua` | 클라이언트 `OnBeginPlay` 시 `IDLE` 초기화 + 이동 루프에서 `FALL`/`JUMP` 상태 시 `MOVE`/`IDLE`로 정상 복귀하도록 가드 확장 |
| `Big Stone2.model` | `ResourceOccupiedArea` 점유 그리드 범위를 피벗 포함 콜라이더 영역에 맞춰 `X: 0~3, Y: -3~0`으로 보정 (피벗 미포함 HitResource 실패 및 외곽 허공 판정 해소) |
| `Big Stone1.model` | `ResourceOccupiedArea` 점유 그리드 범위를 피벗 포함 콜라이더 영역에 맞춰 `X: 0~2, Y: -2~0`으로 보정 |
| `RecipeDataSet.csv` · `UICraftingController.mlua` | **제작대 아이콘 단일 소스화**: `item_dataset.IconRUID`를 최우선 참조하도록 스크립트 개선 및 레시피 데이터셋 전수 동기화 (`thumbnail://...`) |
| `RootDesk/MyDesk/item/Models/*.model` · `itemreact.mlua` | **아이템 모델 RUID 전수 동기화**: `item_dataset.csv` 기준으로 기존 17종 모델 SpriteRUID 갱신(돌 곡괭이 포함 장착 무기 썸네일 전수 일치), 구리/철 도구 및 몬스터와드 신규 모델 6종 고유 EntryKey(UUID) 발급 및 생성(LEA-3015 해소), `itemreact` 바닥 드롭 스프라이트 동적 갱신 연결 |

- 검증: ModelBuilder 통한 `.model` 스키마 안전 패치 및 신규 모델 6종 등록(중복 EntryKey 0건 전수 검사 통과). `maker_refresh_workspace` status ok. build dateTime=`2026-08-18` 일치. Error=1 = 기존 `LEA-4004 PlayerController.OnMapEnter` (무관). Warning=48. **런타임 검증 보류(제작자 Play)**

### 2026-08-16 미수락 퀘스트 주민 방향/거리 네비게이션 시스템

제작자: 마을에 도착했을 때 퀘스트가 있는(아직 수락하지 않은) 주민이 있을 경우, 느낌표 표시 + 미니맵 표시에 더해 방향을 알려주는 네비게이션 추가.

| 파일 | 조치 |
|---|---|
| `UIQuestNavigationController.mlua` (신규) | 수락 가능 퀘스트(`!`) 주민 탐색, 화면 밖 엣지 뱃지([!] 이름 거리 화살표), 플레이어 궤도 가이드 화살표 실시간 렌더 (30fps), 2.5m 도달 시 자동 숨김 |
| `ui/HUDGroup.ui` | `QuestNavigator` 엔티티 신설 및 `UIQuestNavigationController` 컴포넌트 부착 (UIBuilder) |
| `UIHUDController.mlua` | `SetPlayHudVisible` 관리 대상에 `QuestNavigator` 추가 (타이틀 화면 중복 노출 방지) |

- 검증: `ui_lint` Error=0 (WARN 62 베이스라인 유지). `math.atan2` 폐기 이슈 `Vector2.SignedAngle` 및 `Normalize` 네이티브 연산으로 해소. `maker_refresh_workspace` status ok. build dateTime=`2026-08-16T22:00:16~17`(이번 refresh와 일치). Error=1 = 기존 `LEA-4004 PlayerController.OnMapEnter`(무관). Warning=48. `.codeblock` 생성 확인. **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 마을 도착 시 미수락 퀘스트가 있는 촌장 방향으로 화면 가장자리 뱃지 + 플레이어 주변 화살표 표시 ② 접근 시 거리 감소 및 방향 회전 ③ 2.5m 접근 시 네비게이션 숨김 및 머리 위 `!` 표시 ④ 퀘스트 수락 시 네비게이션 소거

### 2026-08-16 전투 데미지 세 갈래 + 주먹도끼 던지기 장착 제한

제작자: 모든 스킬이 도구 ToolPower에 비례하는 게 어색. 던지기는 들고 있을 때만, 세게, 나중에 스탯·SP로 성장.

| 파일 | 조치 |
|---|---|
| `item_dataset.csv` | `Attack` 컬럼. Stone Axe 8 / Copper Axe 12 / Iron Axe 20. 곡괭이·주먹도끼·삽=0 |
| `SkillDataSet.csv` | `DamageModel`/`SkillPower`/`RequireEquippedItem`. 던지기 Throw·16·Hand Axe, MaxLevel 5, mul 1.5, DamagePerLevel 0.3, SPCost 1 |
| `PlayerCombat.mlua` | 평타 = CharAtk + Attack (ToolPower×4 제거) |
| `PlayerController.mlua` | `GetCharacterAttack` / `ComputeSkillDamage` 세 갈래. `RequireEquippedItem` 시전 게이트 |
| `PlayerInventory.mlua` | `GetEquippedToolInfo().attack` |

- 검증: LSP 0. **refresh 검증 보류** (Maker Play Test 중). **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 주먹도끼 미장착 시 던지기 불가·안내 ② 장착 후 던지기 ≈36, 도끼 1개 소모 ③ 구리 곡괭이 들면 매직 클로가 평타처럼 세지지 않음(≈17) ④ 돌 도끼 평타 16 ⑤ 채집은 기존 ToolPower

### 2026-08-16 아이템·스킬 스펙 툴팁 + MagicAttack/SkillAttack 칸

제작자: 아이템/스킬에 짧은 설명. 스킬은 물리·마법. 아이템은 툴 티어와 무기 데미지 유무. 스킬 강화 무기·마법 스탯 칸을 미리.

| 파일 | 조치 |
|---|---|
| `item_dataset.csv` | `ToolTier` `MagicAttack` `SkillAttack`. 돌=T2, 구리=T3, 철=T4. 마법/스킬 공격력은 0 예약 |
| `SkillDataSet.csv` | 물리/마법 비례 문구. 던지기 성장 문구 |
| `PlayerInventory.mlua` | `FormatItemStatLines` |
| `PlayerController.mlua` | `GetMagicAttack` `GetSkillKindLabel`. 마법 코어에 MagicAtk+MagicAttack+SkillAttack |
| 인벤·제작·캐릭터·스킬바·스킬트리 UI | 스펙 줄 / `물리 스킬` 라벨 |

- 검증: LSP 0. **refresh 검증 보류** (Maker Play Test 중). **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 돌 곡괭이 툴팁 `T2 곡괭이 · 채집 +2`, 무기 공격력 없음 ② 돌 도끼 툴팁에 `무기 공격력 8` ③ 스킬바/트리에 `물리 스킬`/`마법 스킬`/`투척 스킬` ④ 주먹도끼 툴팁에 던지기 언급 없음

### 2026-08-16 보고 퀘 vs 자동완료 분리

제작자: 낚싯대(202)를 만들기만 해도 완료됨. 튜토리얼·모으기만 하면 되는 퀘와 가져와서 보고하는 퀘를 나눠야 함.

원인: `PlayerQuest`가 `TurnInNpcId`와 무관하게 `IsCompletable`이면 즉시 `CompleteQuests`. `ConsumeItems` 컬럼은 CSV에만 있고 로드되지 않음.

| 파일 | 조치 |
|---|---|
| `QuestData.mlua` | `ConsumeItems` 로드. `RequiresNpcTurnIn()` = TurnInNpcId 비공란 |
| `PlayerQuest.mlua` | 행동/수락 스냅샷/`TryCompleteReadyQuests` 자동완료는 TurnIn 공란만 |
| `UserQuestData.mlua` | 완료 시 ConsumeItems 수량 확인 후 `RemoveItem` |
| `VillagerDialog.mlua` | 완료 대사·`RequestCompleteQuests`는 인벤 수량까지 맞을 때 |
| `QuestDataSet.csv` | 201 Grass:5 · 203 Wood:10 · 204 Stone:10 · 212 Slime Jelly:3 · 213 Copper Ore:10. 202/214/215 Consume 공란(도구·주괴 유지) |

- 검증: LSP 0. `maker_refresh_workspace` status ok. build dateTime=`2026-08-16T00:05:42`~`43`(이번 refresh와 일치). Error=1 = 기존 `LEA-4004 PlayerController.OnMapEnter`(무관). Warning=47. **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 202 낚싯대 제작 후에도 진행 유지 → fisher F로 완료, 대는 남음 ② 101~108은 조건 충족 시 기존처럼 즉시 완료 ③ 203 나무 10을 모은 뒤 써 버리면 대장장이에게 진행 대사만, 다시 들고 가야 완료·나무 소모

### 2026-08-15 퀘스트 NPC 머리 표시 + 미니맵 노란 칸

제작자: 퀘스트가 있는 주민 머리 위 표시, 미니맵에서 그 위치를 노란색으로.

| 파일 | 조치 |
|---|---|
| `VillagerDialog.mlua` | `GetQuestPingKind`: 수락 가능 `!`, 진행/보고 `?`. HUD `uitext`를 월드 좌표에 붙임 (InteractGuide와 같은 런타임 스폰, `.ui` 무수정) |
| `UIMinimapController.mlua` | 같은 판정으로 해당 셀을 노란 `Color(1, 0.86, 0.12)` |

- 검증: LSP 0. `maker_refresh_workspace` status ok. build dateTime=`2026-08-15T23:43:12`~`13`(이번 refresh와 일치). Error=1 = 기존 `LEA-4004 PlayerController.OnMapEnter`(무관). Warning=47. **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 마을에서 촌장 머리에 노란 `!` (201 수락 전) ② 수락 후 `?` ③ 미니맵에 그 칸이 노랑 ④ 타이틀 화면에서는 표시 없음

### 2026-08-15 스토리 챕터 1~2 1차 반영

설계 원안: `docs/design/story/` 챕터 1(202~205) + 챕터 2(211~216). 마법 스킬·희귀 장비·신규 몬스터 모델은 제외.

| 항목 | 내용 |
|---|---|
| 퀘스트 | `QuestDataSet`/`QuestConditionDataSet` 202~205, 211~216. Main, RequiredId 직렬, AutoAccept 빈칸 |
| 대사 | `StoryDialogDataSet` 수주/진행/완료. 앰비언트 vendor/barnkeeper/fisher 증분 |
| 드롭·연구 | `Slime Jelly` + 슬라임 드롭 0.6. `research_gloom_sample` → `Purified Jelly`. 아이콘 = 슬라임 코인 RUID 플레이스홀더 |
| 맵 | `template_field` `PioneerSignpost` (`Prop_Signpost`, 4,0, 기울임). TileMapMode=1 확인 |
| CSV | 열 수 mismatch 0. 스토리 대사 42자 초과 0 |

- 검증: CSV 정적만. **refresh 검증 보류** (Maker MCP 미연결). **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 201 후 fisher 202 수주 ② 205 hunt01 워프 ③ 슬라임 5 퇴치(211) ④ 젤리 줍기(212) ⑤ 화로 제련(214) ⑥ 벌판 이정표 보임

### 2026-08-15 장착 실루엣 삭제 + 제작 제목/설명 가림 해소

제작자 보고: (1) 캐릭터 정보 왼쪽 장착칸 사이에 불필요 사각형 (2) 제작 창 제목이 안 보임, 설명이 슬롯에 가림.

원인:
1. `EquipPanel/Silhouette` 150×250 어두운 박스(`4fea64a3` a=0.6) + "아바타" 라벨. 컨트롤러 참조 없음.
2. 제작 `Title` dOrd=2 < `TierBar` 5, 제목 하단 20px를 티어바가 덮음.
3. `Details/Desc` dOrd=2 < `Slot1/2` 3·4 이고 y도 50px 겹침.

| 파일 | 조치 |
|---|---|
| `CharacterPopup/EquipPanel/Silhouette` | 서브트리 삭제 (3 엔티티). 장착 슬롯 6칸 유지 |
| `CraftingPopup` | Title dOrd=10. TierBar y=-80, CategoryBar y=-128. List/Details y=-56 |
| `CraftingPopup/Details` | Icon/Desc를 슬롯 위로, 재료칸을 제작 버튼 쪽으로. Desc dOrd=5 |

- 검증: 실루엣 부재, 제목∩티어바 null, 설명∩슬롯 null. `ui_lint` Error=0 (WARN 91, 기존 베이스라인). **refresh 검증 보류** (Maker Play Test 중). **런타임 검증 보류(제작자 수행)**
- Play 확인: ① 캐릭터 정보 장착칸 사이에 회색 박스 없음 ② 제작대 제목이 티어바 위에 보임 ③ 레시피 설명이 재료 칸에 안 가림

### 2026-08-15 캐릭터 정보 장착칸·게이지·권한버튼 창 밖 돌출

제작자 보고: 캐릭터 정보 팝업에서 장착칸, HP/SP/경험치 바, 영지 권한 설정 버튼이 창 밖으로 나감.

원인:
1. `SlotWeapon/Icon`·`SlotArmor/Icon` RectSize **400×48** (`text()` 기본값). 런타임 `weaponIcon.ImageRUID`가 그 박스를 채워 창 왼쪽으로 ~75px 돌출.
2. HP/Stamina/XP가 Name과 같은 **top-left** `(0,1)`인데 `pos.x=180`(패널 360의 반) → 바의 왼쪽이 중앙에 붙어 창 오른쪽 **85px** 돌출.
3. `BtnPermission` top-center에서 `pos.x=180` → 버튼 중심이 패널 오른쪽 끝, 창 밖 **65px**.

| 파일 | 조치 |
|---|---|
| `scratch/fix_character_popup_overflow.cjs` | UIBuilder만. 아이콘 48×48(인벤 슬롯과 동일). 바 `pos.x=20`. 권한 버튼 `pos.x=0`. 헬멧 라벨 80×20. 실루엣/바 텍스트 칸 안에 |
| `.mlua` | 변경 없음 (`FillAmount`·아이콘 RUID 경로 유지) |

- 검증: 재실측 HP/SP/XP/권한버튼 vs CharacterPopup AABB **ok**. 아이콘 vs 64칸 **ok**. `ui_lint` Error=0 (WARN 91). `maker_refresh_workspace` status ok. build 로그 dateTime=`2026-08-15T17:47:51` — **이번 refresh와 불일치 → 빌드 로그 갱신 미확인**. **런타임 검증 보류(제작자 수행)**
- Play 확인: 캐릭터 정보 창에서 ① 장착칸·아이콘이 나무 프레임 안 ② HP/SP/경험치 바가 종이 속지 안 ③ 영지 권한 설정 버튼이 창 안·클릭 가능
- 재발 방지: pitfalls **규칙 31**

### 2026-08-15 팝업 배치·가시성 전수 복구

크롬 2계열 통일 이후 13창에서 제목·닫기가 탑바/카테고리 바에 묻힘. 스타일 교체 없이 z-order와 틴트만 되돌림.

원인: 카드 창 `displayOrder`가 정책과 반대(TopBar > Title/Close). 종이 창 Close가 전부 20 미만. 제작 CategoryBar(7)가 Close(6)를 덮음(규칙 11 재발).

| 파일 | 조치 |
|---|---|
| `scratch/audit_popup_layout.cjs` | 13창 AABB·dOrd·겹침·돌출 실측. 패치 전 issues=34, 후 **0**. 창 밖 돌출 없음 → 좌표 미수정 |
| `scratch/fix_popup_visibility.cjs` | UIBuilder만. 종이 5 Close=20. 카드 7 TopBar/Accent/Title/Close=15/16/17/20. 스킬트리=25/26/27/30. 의뢰·연구 Bg 틴트 `(0.2,0.1,0.1,1)` |
| 워프 | Title/Close 작성 좌표·앵커 불변. z만 17/20 |
| `.mlua` | 변경 없음 |

- 검증: `ui_lint` Error=0 (WARN 91, 기존 베이스라인). 감사 재실행 issues=0. `maker_refresh_workspace` status ok. build 로그 dateTime=`2026-08-15T17:47:51` — **이번 refresh와 불일치 → 빌드 로그 갱신 미확인**. 고착 스냅샷 Error=1은 `PlayerController.OnMapEnter`(LEA-4004), UI 무관. **런타임 검증 보류(제작자 수행)**
- Play 확인: ① 13창 우상단 흰 X가 탑바/카테고리 바 위·클릭 가능 ② 카드 8 크림 제목이 어두운 탑바 위 ③ 제작 티어/카테고리 바가 창 안·X 안 가림 ④ 워프 목적지 수에 따라 제목·X·탑바 추종 ⑤ 퀘스트 보상 아이콘이 칸 안

### 2026-08-15 부팅 시 팝업이 타이틀보다 먼저 보임

제작자 보고: 게임 첫 실행 때 메인 화면 전에 다른 팝업 UI가 보임.

원인:
1. `PreviewTool/Root`가 `.ui`에서 Enable=true — F9 프리뷰(1600×900)가 `OnBeginPlay`로 숨기기 전 한 프레임 이상 노출. GroupOrder=1이라 HUD 페이드보다 위.
2. `MainMenuGroup.DefaultShow=false` + `OnBeginPlay`가 루트를 끔 — 타이틀은 서버 `ClientOpenMainMenu` RPC 뒤에야 켜짐.

| 파일 | 조치 |
|---|---|
| `ui/PreviewTool.ui` | `Root` Enable=false (Controller는 유지 → F9 동작) |
| `ui/MainMenuGroup.ui` | `DefaultShow=true` |
| `UIMainMenuController` | `OnBeginPlay`에서 루트를 켜 두고 타이틀 패널만 표시 |
| `ui/HUDGroup.ui` | 미니맵·스킬바·퀵슬롯·내정보·모바일·퀘스트트래커·버튼·페이드 전부 Enable=false |
| `UIHUDController` | `SetPlayHudVisible` — 타이틀 동안 크롬 끔, 슬롯 확정 `Close` 뒤에만 켬. UpdateHUD/버프바도 그 전엔 갱신 안 함 |
| `UIMainMenuController` | 열릴 때 HUD 숨김, `Close` 때 HUD 표시 |

- 검증: HUD d1 크롬 Enable=false 재독. LSP 0. **refresh 검증 보류** (Maker MCP 타임아웃). **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 타이틀에 미니맵/스킬바/내정보/퀵슬롯이 안 비치는지 ② 모험 시작(슬롯 확정) 후 HUD가 켜지는지 ③ 낚시 게이지는 낚시 중에만 보이는지

### 2026-08-15 이어하기 슬롯 캐릭터 레벨 실시간 동기화

제작자 보고: 이어하기(메인메뉴 슬롯 선택)에서 캐릭터별 레벨이 제대로 뜨지 않음.

원인:
1. `SlotMeta`와 실제 슬롯 세이브(`SaveData_s1`~`s5`)의 이중 관리 및 미동기화 — 세이브 본문에 레벨업이 기록되어도 `SlotMeta`가 갱신되지 않아 이전 레벨(Lv.1)이 표시됨.
2. 60초 주기 자동 저장 등 비동기 저장 경로에서 `SlotMeta` 갱신 누락.

| 파일 | 조치 |
|---|---|
| `PersistenceManager.mlua` | `ReadSlotMetaTable`: `BatchGetAndWait`로 `SaveData_s1`~`s5`를 조회하여 최신 `level`, `fishingLevel`, `characterName`을 `SlotMeta`에 실시간 자동 동기화 및 영구 저장. `SavePlayerData` 비동기 저장 콜백에도 `SlotMeta` 갱신 추가 |
| `UIMainMenuController.mlua` | `RefreshSlots`: `meta.level`/`Level`, `meta.fishLv`/`fishingLevel` 방어적 파싱 보강 |

- 검증: `maker_refresh_workspace` status ok, build logs `13:15:02` Error=0, Warning=0. **런타임 검증 보류(제작자 Play)**

### 2026-08-15 퀘스트 재접속 초기화 버그 해결 & 캐릭터 닉네임 동기화

제작자 보고: 접속할 때마다 퀘스트가 다시 처음부터 뜨고, 새로 만든 캐릭터 이름이 인게임에서 계정 이름으로 뜸.

원인:
1. `PlayerDBManager:LoadFromDB`: 슬롯 키(`Quest_s1`)와 레거시 키(`Quest`) 조회 시, 레거시 키가 존재하면 슬롯 키 데이터를 무시해버리는 조건문 우선순위 역전 버그.
2. `PersistenceManager`: `OnEndPlay`, `OnUserLeave`, `SaveDirtyData`에서 `PlayerDBManager:SaveToDB` 호출이 누락되어 퀘스트 변경사항이 저장되지 않고 소실됨.
3. `PersistenceManager`: `SelectSaveSlot` 및 `LoadPlayerData`에서 슬롯 캐릭터 닉네임을 `self.CharacterNameByUser`에만 두고 `player.PlayerComponent.Nickname` 및 `player.NameTagComponent.Name`에 대입해주지 않아 계정명이 그대로 노출됨.

| 파일 | 조치 |
|---|---|
| `PlayerDBManager.mlua` | `LoadFromDB`: 슬롯 전용 데이터(`Quest_s{slot}`) 최우선 채택. `SaveToDB`: `successKeys` .NET List 안전 순회 보강 |
| `PersistenceManager.mlua` | `SelectSaveSlot` / `LoadPlayerData`: `player.PlayerComponent.Nickname = nick`, `player.NameTagComponent.Name = nick` 설정. `OnEndPlay`/`OnUserLeave`/`SaveDirtyData`: `PlayerDBManager:SaveToDB` 연동 |

- 검증: `maker_refresh_workspace` status ok, build logs `11:22:29` Error=0, Warning=0. **런타임 검증 보류(제작자 Play)**

### 2026-08-15 퀘스트 보상칸 아이콘 정렬

제작자 보고: 주먹도끼는 보상칸 가운데, 나무·돌 등 자원은 칸을 살짝 벗어남.

원인: 보상 `Icon`이 인벤토리와 달리 `PreserveSprite=AspectOnly` + `Type=Sliced` + `pos y=+8`. 자원 `IconRUID`는 하단 피벗 드롭 스프라이트, 주먹도끼는 `thumbnail://` 중심 썸네일.

| 항목 | 내용 |
|---|---|
| 대상 | `QuestPopup/Details/RewardSlot1~4/Icon` |
| 조치 | 인벤토리 `ItemSlot/Icon`과 동일: `Type=Simple(0)`, `PreserveSprite=None(0)`, `pos (0, 0)` |
| 재발 방지 | `scratch/build_quest_popup.cjs` 동일 값으로 맞춤. pitfalls 규칙 29 |

- 검증: UIBuilder 재독으로 4칸 모두 Simple+None+(0,0) 확인. **refresh 검증 보류** (Maker MCP `CallMcpTool` 클라이언트 미등록). **런타임 검증 보류(제작자 Play)**
- Play 확인: 퀘스트 로그에서 Wood/Stone 보상이 72×72 칸 안에 들어가 보이는지. 주먹도끼도 가운데 유지.

### 2026-08-15 퀘스트 CountMode — Action / State

제작자: 퀘스트를 (1) 받은 **이후** 행동으로만 완수 / (2) **이미 한 일**이면 자동 완수, 두 부류로 나눌 것. 예: 주먹도끼 던지기 습득(108)은 이미 배웠으면 LearnSkill 이벤트가 다시 안 나와 완수 불가.

| 항목 | 내용 |
|---|---|
| 컬럼 | `QuestConditionDataSet.CountMode` = `Action` \| `State` |
| Action | 수락 이후 `ActionEvent`만 집계. 101·103·105·107·201 |
| State | 수락·로그인 때 `GetUpdatedValue` 스냅샷. 이미 충족이면 즉시 완료. 102·104·106·108 |
| 108 | LearnSkill `hand_axe_throw` — `GetSkillLevel>=1`이면 완료. 빈 CountMode의 LearnSkill도 State |
| 반복 퀘 | 스냅샷으로 자동 완료하지 않음 (AutoAccept 보상 루프 방지) |

- 변경: `ActionConditionData` 스냅샷 헬퍼 · 조건 7종 `GetUpdatedValue` · `QuestConditionData.CountMode` · `UserQuestData.UpdateValues` · `PlayerQuest.AcceptQuests`/`TryCompleteReadyQuests`
- 검증: **refresh 검증 보류** (MCP maker 미연결). **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 스킬을 먼저 배운 뒤 108 수락 → 즉시 완료+주먹도끼 20 ② 108 진행 중 접속(이미 배운 세이브) → 로그인 시 완료 ③ 101은 풀을 이미 들고 있어도 0/3에서 시작 ④ 102는 주먹도끼를 이미 만든 세이브면 수락 즉시 완료

### 2026-08-14 주먹도끼 기믹 무기 + 던지기 스킬

제작자 요청: 주먹도끼는 다른 도구와 달리 한 슬롯에 중첩. 스킬 `주먹도끼 던지기`는 1개 소모 투사체. 첫 제작 후 해금. 퀘스트 `왠지 던질 수 있을것 같습니다..` → 배우면 주먹도끼 20개. 아이템·레시피 설명은 벌목 도구(던지기 문구 없음).

| 항목 | 내용 |
|---|---|
| 중첩 | `item_dataset.MaxStack` (Hand Axe=99). `IsUniqueKeyedItem` — 이름 분기 없음. 구세이브 고유키는 로드/획득 시 스택으로 합침 |
| 스킬 | `hand_axe_throw` Projectile, TreeRow=2 TreeCol=2, SPCost=0 MaxLevel=1, ConsumeItem=`Hand Axe` x1 |
| 해금 | Achievement 1006(Craft Hand Axe) **OR** `UnlockOwnedItem=Hand Axe` (도감/보유) |
| 퀘스트 108 | 이름 `왠지 던질 수 있을것 같습니다..`. LinkedPrevId=102 AutoAccept. Cond=`LearnSkill,hand_axe_throw`. Reward=`Hand Axe:20` |
| 조건 11종 | `ActionEnum.LearnSkill=11` + `ActionConditionData_LearnSkill`. 0→1 해금 시 Emit |

- 변경: `PlayerInventory` · `PlayerController` · `UISkillTreeController` · `PlayerQuest.PostOnLoadedDataFromDB` AutoAccept · CSV 다수 · `PersistenceManager` 로드 후 fold
- 검증: LSP(아래). **refresh 검증 보류** (MCP maker 미연결). **런타임 검증 보류(제작자 Play)**
- Play 확인: 주먹도끼 제작 → 한 슬롯 중첩 → 퀘스트 108 등장 → 스킬트리 해금(SP 0) → 배우면 +20 → QWER 던지기 1개 소모

### 2026-08-15 도구 평타에 스킬 HitEffect 잔류

제작자 보고: 일반 도구 Ctrl 평타만 쳐도 스킬 `HitEffect`가 몬스터에 재생됨.

원인: `ExecuteSkill`이 Projectile만 `PendingHitEffectRUID`를 비행 중 유지하고, `DoAttackAt`은 비우지 않음. 매직 클로 등 HitEffect가 있는 투사체 이후 Ctrl 평타가 그 RUID를 그대로 소비.

| 파일 | 조치 |
|---|---|
| `PlayerCombat.DoAttackAt` | AttackFast 직전 `PendingHitEffectRUID=""` |
| `PlayerController.ExecuteSkill` | Projectile 포함 시전 후 즉시 클리어 (탄환은 자체 `HitEffectRUID`) |
| `Projectile.TriggerAttackOnTarget` | 명중 후 이전 Pending을 되살리지 않고 `""` |

- 검증: LSP 0. refresh + build 로그는 아래 턴 기록. **런타임 검증 보류(제작자 Play)** — 스킬 후 Ctrl 평타에 `[T66][HITFX]`가 없어야 함. 스킬 자체 HitEffect는 유지.

### 2026-08-14 스토리·맵·퀘스트 콘텐츠 설계 체계 (docs/design/story/ 신설)

제작자 지시: 스토리 구체화 + 앞으로의 맵 컨셉·디자인을 퀘스트와 연계, **전용 폴더 관리**, 여러 에이전트 공동 보완 체제.

| 산출물 | 내용 |
|---|---|
| `docs/design/story/README.md` | 허브 — 문서 지도 · 진행 보드 · **에이전트 협업 규약**(⚖️/🧭/❓/✅ 표기, ❓ 미실측 반영 금지) · 열린 질문 Q1~Q7 |
| `story-bible.md` | 톤 가드(⚖️ 코지+미스터리) · 세계관 「푸른 불씨」 🧭 · 챕터 1~5 아크 · 용어집. 근거 = 반영된 201 대사·`Recipe Scroll`(고대 두루마리)·hunt04 Biome=green_island·`SlimeKing.model` |
| `npc-cast.md` | NPC 말투 카드(기존 CSV 대사에서 역산) + 🔴 수주 가능 NPC = `VillagerDialog` 부착 6인뿐(merchant 불가) 실측 명시 |
| `map-concepts.md` | 공간 7종 컨셉·팔레트(BiomeDataSet 실측색) · 🔴 hunt01~03 `template_field` 공유 → 구역별 픽스처 구조 결정 필요(Q5) · 스토리 소품 = 기존 Prop 재사용 표(R1) |
| `quest-design.md` | 챕터 1 상세(202~205 초안) + 챕터 2~5 골격(211~243) · 조건 10종 중 검증 4종/미실측 6종(❓) 구분 · CSV 반영 체크리스트 · 키 부록(아이템 48·몬스터·포탈) |
| 이동 | `docs/design/story-npc-quest-plan.md` → `docs/design/story/`(git mv, 시스템 측 단일 소스로 유지). 인바운드 링크 1건(main-menu-save-slots.md) 및 내부 상대 링크 수정 |
| `AGENTS.md` §10 | 문서 단일 소스 표에 「스토리·맵 컨셉·퀘스트 콘텐츠 설계」 행 추가 |

- 검증: 문서·링크 작업만 — 코드/데이터셋/맵/UI 무변경, refresh 불요. 이동 후 참조 전수 grep으로 끊긴 링크 0 확인. 퀘스트 초안은 전부 🧭이며 CSV 미투입.

**같은 날 제작자 판정 1차 반영 (⚖️ 2026-08-14)** — README 판정 로그에 원문 기록:

| 판정 | 반영 |
|---|---|
| 죽음·공포·정치 **엄격 금지 해제** (잔혹·고어, 절망 전개, 현실 정치 풍자만 회피) | story-bible §0 · story-npc-quest-plan §4·§5 브리프 · design-policy §5 스토리 톤 행 개정 |
| 몬스터 전투 = **"퇴치"** · 몬스터 = **잠식되어 적대화된 이웃 생물** (확정) | story-bible §0·§1·§5 용어집 · 퀘스트명 개정(211·242) |
| 긍정 미스터리(푸른 빛) + **미스터리 메인 빌런**(몬스터 발생 원인) 이원 구조 | story-bible §2-B 신설 (이름 후보 = Q8) · 챕터 단서 사슬 빛/그늘 2가닥 재편 · 설원 아크 = 빌런 추적으로 승격 |
| **몬스터 사냥 드롭 → 연구·발전** 재료 축 | quest-design §4.6 신설 (Slime Jelly 등 4종 + 연구 행 제안 = Q9, 챕터 2에 표본 퀘스트 212 추가 → 211~216) |
| **주민 4인 역할 및 공식 NpcId 확정** | `researcher`(연구원 엘렌), `vendor`(노점상 마리), `blacksmith`(대장장이 로체), `barnkeeper`(헛간지기 토리) — `town.map`·`.model`·`DialogDataSet.csv`·`VillagerDialog.mlua`·스토리 문서군 전수 정합 |
| **마법 스킬 해금 = 푸른빛(불씨) 연동** | story-bible §0·§2-A, quest-design §4.7, game_design §3.12.3 (푸른빛을 해금 자원으로 5종 스킬 습득) |
| **몬스터 사냥 희귀 특수 장비 드롭** | story-bible §0·§1, quest-design §4.8, game_design §3.13 (제작대 기본 장비와 차별화된 고유 옵션 장비 파밍) |

- 다음 단계: 제작자가 열린 질문 **Q1~Q9** 판정 (신규: Q8 빌런 이름, Q9 드롭·연구 라인업) → 챕터 1 대사 집필(202~205) → ❓ 조건 실측(Kill/Smelt/Warp 인자, Gather 드롭 집계) 후 CSV 반영.

### 2026-08-14 퀘스트 로그 A안 + 트래커 클릭

제작자 확정: 좌목록+우상세 큰창(제작·도감 1000×780 크롬). HUD `QuestTracker` 클릭으로 연다. 수락/거절은 `DialogGroup` 유지.

| 구역 | 내용 |
|---|---|
| 탭 | 진행 중 / 완료 가능 / 완료 (`InProgress`·`IsCompletable`·`Completed`) |
| 왼쪽 | 스크롤 행 400×88. 이름·진행·카테고리 칩 |
| 오른쪽 | 설명·목표·보상 슬롯 4·포기(`IsAbandonable`일 때만) |
| 트래커 | `BtnOpen` 오버레이. 진행 퀘스트가 없어도 크롬 유지 |

- 변경: `ui/PopupGroup.ui` `QuestPopup` · `ui/HUDGroup.ui` `QuestTracker/BtnOpen` · `UIQuestLogController.mlua`(신규) · `UIQuestController.mlua` · `docs/design-policy.md` §5
- 검증: UIBuilder write + `ui_lint` Error=0 (Popup WARN 87 / HUD WARN 62, 기존 베이스라인+신규 탭은 88px). LSP 0. `maker_refresh_workspace` status ok. build dateTime=`2026-08-14T19:18:11`~`12`(이번 refresh와 일치). Error=1 = 기존 `LEA-4004 PlayerController.OnMapEnter`(무관). Warning=47. `.codeblock` 생성 확인. 1차 refresh의 `LEA-1118 ---@type UIQuestLogController`는 주석 제거 후 소거.

### 2026-08-14 퀘스트 팝업 가시성 (Play 실측)

제작자: 가시성 떨어짐 · 배치 이상 → AI가 Play 들어가 스크린샷 확인.

실측 (슬롯1 `다줄`, 퀘스트 101 `첫 걸음 - 풀 뜯기` 0/3):
1. 나무 프레임 속지가 Inner a=0.08이라 맵이 비치고, 크림/회색 글자가 잔디·길에 묻힘
2. 상세 힌트가 보상 슬롯·「보상」라벨과 겹침 (힌트 bottom y=150 vs 슬롯 top -322, 480px 패널에 88px 포기 버튼까지 넣어서 수직 충돌)
3. 선택 행 Color a=0.55라 행 자체도 비침
4. 목록/상세 y=-70이라 탭(하단 ~172)과 콘텐츠(상단 ~220) 사이 빈 간격

수정:
- `QuestPopup/Paper` 추가 (제작창과 같은 `c24adedc…` a=1) + Inner a=1
- 목록 마스크 다크 a=0.72, 상세 카드 다크 a=0.96
- 힌트를 설명 아래로, 보상·포기는 겹치지 않게 재배치. 목록/상세 y=-40
- 선택 행 a=1.0 + 잉크색 글자

- 검증: UIBuilder write + `ui_lint` Error=0 (WARN 87). `maker_refresh_workspace` status ok. build dateTime=`2026-08-14T19:31:45`~`46`(이번 refresh와 일치). Error=1 = 기존 `LEA-4004`. Warning=47.
- 재Play 스크린샷 (2026-08-14 19:38): 맵 비침은 사라졌으나 제목 외곽선·힌트 겹침·다크카드가 도감/제작대와 안 맞음.
- 제작자: 다른 UI처럼 직접 열어 대조하라. Play에서 제작대·도감을 연 뒤 퀘스트를 도감 탭(180×44)+제작대 잉크 본문+Inner Paper a=1로 맞춤. 늦은 sibling `Paper` 제거. 힌트 pivot (0,1).
- 재캡처 19:51: 나무 헤더+얇은 탭+종이 속지+잉크 상세. build dateTime=`2026-08-14T19:50:21`~`23`(이번 refresh 일치). Error=1 기존 `LEA-4004`. Warning=47. 닫기 ✕는 TextGUIRenderer 글리프라 제작대 X 스프라이트(`221e0368…`) 대비 약함.

### 2026-08-14 도끼 외형 F9 8라운드

제작자: 망치류는 뜬금없음. 전투 무기여도 되니 도끼에서 다시. 철=강철 유지. 돌·구리 `item_dataset` 미반영.
이번 5종은 이전에 F9에 안 올린 도끼·엑스만.

| # | 후보 | 슬롯/모션 |
|---|---|---|
| 1 | 메이플 스틸 엑스 `1c6f881a…` | onehand / swingO2 |
| 2 | 드래곤 엑스 `4f1e6bbc…` | onehand / swingO2 |
| 3 | 클로니안 엑스 `53a4e340…` | twohand / swingT1 |
| 4 | Commerci Two-handed Axe `504f8169…` | twohand / swingT1 |
| 5 | 스칼렛 배틀엑스 `34de2b5f…` | twohand / swingT1 |

7라운드(망치·톱·몽둥이) 철회.
- 검증: `maker_refresh_workspace` **보류** (Play Test 중). Stop 후 Refresh 필요.
- **런타임 검증 보류(제작자 수행)** — Stop → Refresh → Play → F9 → 모션 재생

### 2026-08-14 도끼 외형 F9 7라운드

제작자: 6라운드(미스릴·Battle Axe·젝커·쟈이힌)도 전투템. 카탈로그 도끼/엑스는 전부 전투 무기라 **작업 도구**로 전환.
철=강철 유지. 돌·구리 `item_dataset` 미반영. 곡괭이·야삽·호미는 다른 도구가 사용 중이라 제외.

| # | 후보 | 슬롯/모션 | 제안 |
|---|---|---|---|
| 1 | 나무 망치 `3c9b8138…` | twohand / swingT1 | 돌 · 나무 작업 |
| 2 | 몽둥이 `ce073997…` | onehand / swingO2 | 돌 · 원시 |
| 3 | 톱 `d18bed85…` | onehand / swingO2 | 벌목 도구 |
| 4 | 망치 `512df6b4…` | onehand / swingO2 | 구리 · 한손 작업 |
| 5 | 사각 망치 `4f3b9177…` | twohand / swingT1 | 구리 · 양손 작업 |

6라운드에서 내린 것: 미스릴 도끼 · GMS Battle Axe · 젝커 · 쟈이힌 엑스 · 쟈이힌 투핸드엑스.
- 검증: `maker_refresh_workspace` status ok. build dateTime=`2026-08-14T18:31:14`~`15` — **이번 refresh와 일치**. Error=1 = 기존 `LEA-4004`(무관). Warning=47
- **런타임 검증 보류(제작자 수행)** — Play → F9 → 모션 재생

### 2026-08-14 도끼 외형 F9 6라운드

제작자: 5라운드와 다른 기본템을 더 찾음. 철=강철 유지. 돌·구리 `item_dataset` 미반영.

카탈로그 도끼/엑스 103종 전수. 이벤트·앱솔·제네시스·메이플로고·이미 본 5라운드 제외.

| # | 후보 | 슬롯/모션 | 제안 |
|---|---|---|---|
| 1 | 미스릴 도끼 `07511c43…` | onehand / swingO2 | 돌 · 회색 한손 (신규) |
| 2 | GMS Battle Axe `949f8935…` | twohand / swingT1 | 돌 · 양손 벌목 (신규) |
| 3 | 젝커 `61decbb6…` | onehand / swingO2 | 구리 · 초반 한손 (신규) |
| 4 | 쟈이힌 엑스 `ef7b758c…` | onehand / swingO2 | 구리 · 한손 (신규) |
| 5 | 쟈이힌 투핸드엑스 `e97411c1…` | twohand / swingT1 | 구리 · 양손 (신규) |

5라운드 보류: 벅 · 양손 도끼 · 쇠 도끼 · 철제 도끼 · 버크.
- 검증: `maker_refresh_workspace` **보류** (Play Test 중). Stop 후 Refresh 필요.
- **런타임 검증 보류(제작자 수행)** — Stop → Refresh → Play → F9 → 모션 재생

### 2026-08-14 도끼 외형 F9 5라운드

제작자: 철 도끼 = 강철 도끼 확정. 돌·구리는 기본템 느낌으로 재탐색.

**철 도끼 확정** (`item_dataset` `Iron Axe` 반영):

| 항목 | 값 |
|---|---|
| 외형 | 강철 도끼 |
| WeaponRUID | `69ef6490cd794abeb4ebbc539b8582d9` |
| IconRUID | `thumbnail://69ef6490…` |
| WeaponSlot | `twohand` (구 전투 도끼는 한손 `swingO2` → 슬롯·모션 동반 변경) |
| SwingAction | `swingT1` |

F9는 돌(1–2)·구리(3–5). 카탈로그에 돌날 전용 도끼는 없음(Chief/호크헤드는 화려해서 제외).

| # | 후보 | 슬롯/모션 | 제안 |
|---|---|---|---|
| 1 | 벅 `28f8e12e…` | onehand / swingO2 | 돌 · 초반 한손 |
| 2 | 양손 도끼 `95a4ec9d…` | twohand / swingT1 | 돌 · 기본 양손 (신규) |
| 3 | 쇠 도끼 `2b9abd01…` | twohand / swingT1 | 구리 · 기본 양손 |
| 4 | 철제 도끼 `4573564d…` | twohand / swingT1 | 구리 · 기본 양손 |
| 5 | 버크 `b72e8b64…` | twohand / swingT1 | 구리 · 기본 양손 (신규) |

4라운드에서 내린 것: 파이어 잭 · 콘트라 엑스 · Commerci Axe. 돌·구리 `item_dataset` 미반영.
- 검증: `maker_refresh_workspace` status ok. build dateTime=`2026-08-14T18:10:17`~`19` — **이번 refresh와 일치**. Error=1 = 기존 `LEA-4004`(무관). Warning=47
- **런타임 검증 보류(제작자 수행)** — Play → F9 → 모션 재생. 철 도끼는 인게임 장착으로 강철 도끼인지 확인

### 2026-08-14 도끼 외형 F9 4라운드

제작자: 네오코라 제외. 구리색이 눈에 띄는 도끼 탐색. 쇠·강철 유지.
카탈로그에 '구리 도끼' 이름 없음. 틴트 불가 → 날이 주황·적동·청동인 한손 도끼 3종.

| # | 후보 | 슬롯/모션 | 상태 |
|---|---|---|---|
| 1 | 파이어 잭 `d36181f7…` | onehand / swingO2 | 주황 날 (색이 가장 뚜렷) |
| 2 | 콘트라 엑스 `cdee4e06…` | onehand / swingO2 | 적동 한손 |
| 3 | Commerci Axe `c410c327…` | onehand / swingO2 | 청동 한손 |
| 4 | 쇠 도끼 `2b9abd01…` | twohand / swingT1 | **후보 유지** |
| 5 | 강철 도끼 `69ef6490…` | twohand / swingT1 | **후보 유지** |

3라운드에서 내린 것: 네오코라. 보류: 벅 · 철제 도끼. `item_dataset` 미반영.
- 검증: `maker_refresh_workspace` **보류** (Play Test 중). Stop 후 Refresh 필요.
- **런타임 검증 보류(제작자 수행)** — Stop → Refresh → Play → F9 → 모션 재생

### 2026-08-14 도끼 외형 F9 3라운드

제작자: 2라운드(Chief/호크헤드/당커)는 화려함. 구리도 초반 라인에서 재탐색. 쇠·강철 유지.

| # | 후보 | 슬롯/모션 | 상태 |
|---|---|---|---|
| 1 | 벅 `28f8e12e…` | onehand / swingO2 | 초반 한손 (손도끼 다음) |
| 2 | 네오코라 `4a1ea465…` | onehand / swingO2 | 초반 청동·구리 |
| 3 | 철제 도끼 `4573564d…` | twohand / swingT1 | 초반 양손, 쇠↔강철 사이 |
| 4 | 쇠 도끼 `2b9abd01…` | twohand / swingT1 | **후보 유지** |
| 5 | 강철 도끼 `69ef6490…` | twohand / swingT1 | **후보 유지** |

2라운드에서 내린 것: Chief Axe · 호크헤드 · 당커. `item_dataset` 미반영.
- 검증: `maker_refresh_workspace` status ok. build dateTime=`2026-08-14T17:54:57`~`58` — **이번 refresh와 일치**. Error=1 = 기존 `LEA-4004`(무관). Warning=47
- **런타임 검증 보류(제작자 수행)** — Play → F9 → 모션 재생

### 2026-08-14 도끼 외형 F9 2라운드

제작자: 쇠 도끼·강철 도끼는 후보 유지. 손 도끼는 돌날이 더 필요.

| # | 후보 | 슬롯/모션 | 상태 |
|---|---|---|---|
| 1 | Chief Axe `3524d8ff…` | onehand / swingO2 | 돌 신규 |
| 2 | 호크헤드 `39d5af74…` | onehand / swingO2 | 돌 신규 |
| 3 | 당커 `4e010b67…` | onehand / swingO2 | 돌·투박 신규 |
| 4 | 쇠 도끼 `2b9abd01…` | twohand / swingT1 | **후보 유지** |
| 5 | 강철 도끼 `69ef6490…` | twohand / swingT1 | **후보 유지** |

1라운드에서 내린 것: 손 도끼(금속) · 토마호크 · 양날 도끼. `item_dataset` 미반영.
- **refresh 검증 보류** — 요청 시점 Maker가 Play Test라 `maker_refresh_workspace` unavailable. Play 종료 후 refresh 필요
- **런타임 검증 보류(제작자 수행)** — Stop → Refresh → Play → F9 → 모션 재생

### 2026-08-14 도끼 외형 F9 샘플 1라운드

현행 장착이 마음에 안 맞음. `item_dataset`은 아직 안 바꾸고 F9 후보만 교체.

| 현행 | 이름 | RUID |
|---|---|---|
| 돌 도끼 | GMS Axe | `096fabc5…` |
| 구리 도끼 | (이름 없음) onehandedweapon-3280 | `233fd076…` |
| 철 도끼 | 전투 도끼 | `963cde7d…` |

F9 슬롯 (벌목 실루엣, 전투·네온 제외):

| # | 후보 | 슬롯/모션 | 제안 티어 |
|---|---|---|---|
| 1 | 손 도끼 `5b0af54d…` | onehand / swingO2 | 돌 |
| 2 | 토마호크 `5e6acebb…` | onehand / swingO2 | 돌 |
| 3 | 양날 도끼 `9d1a419e…` | onehand / swingO2 | 구리 |
| 4 | 쇠 도끼 `2b9abd01…` | twohand / swingT1 | 구리·철 |
| 5 | 강철 도끼 `69ef6490…` | twohand / swingT1 | 철 |

- 고르면: `WeaponRUID` + `WeaponSlot` + `SwingAction` + `IconRUID=thumbnail://같은RUID`. 양손이면 슬롯/모션을 twohand·swingT*로 같이 바꿀 것
- 2라운드 가능: 같은 계열 색 변형, 또는 `철제 도끼` `미스릴 도끼` `Chief Axe`
- **런타임 검증 보류(제작자 수행)** — Play → F9 → 모션 재생. 사라지는 슬롯 = 그 액션 없음
- 검증: `maker_refresh_workspace` status ok. build dateTime=`2026-08-14T17:29:01`~`02` — **이번 refresh와 일치**. Error=1 = 기존 `LEA-4004 PlayerController.OnMapEnter`(무관). Warning=47

### 2026-08-14 한글화 1차 (데이터셋 + UI)

플레이어 문구는 한글. **`item_dataset.Name`은 영문 키 유지** (세이브·제작·상점 깨짐 방지). 표시는 `DisplayName`.

| 대상 | 내용 |
|---|---|
| `item_dataset.csv` | `DisplayName` 컬럼 추가(Name 다음). Description 한글. 48행 |
| `RecipeDataSet.csv` | `Desc` 한글. RecipeName/Ing* 키 유지 |
| `BiomeDataSet.csv` | DisplayName: 초록 섬 / 흙 벌판 / 바위 지대 / 사막 / 설원 |
| `QuestDataSet.csv` | ProgressingDesc 영문 잔재 제거 6건 |
| `AnimalDataSet.csv` | DisplayName: 닭 / 양 / 고양이 |
| `ui/PopupGroup.ui` | 타이틀·탭·슬롯·스탯·칩·버튼 한글 33 |
| `ui/HUDGroup.ui` | 모바일 라벨 한글 6 |
| UI 컨트롤러 | 제작/가방/캐릭터/화로/도감/상점/의뢰가 DisplayName·한글 버튼 사용 |

- 검증: UIBuilder write + lint Error=0 (Popup WARN 86, HUD WARN 66). `maker_refresh_workspace` status ok. build 로그 dateTime=`2026-08-14T17:15:50`~`51` — **이번 refresh와 일치**. Error=1 = 기존 `LEA-4004 PlayerController.OnMapEnter`(무관). Warning=47 (이번 시각 6 + 버퍼 잔여 41). **런타임 검증 보류(제작자 수행)**
- Play 확인: ① 가방 탭=전체/자원/장비 ② 툴팁 한글명 ③ 제작 목록·상세·칩 한글 ④ 캐릭터 스탯 라벨 한글 ⑤ 상점·의뢰 아이템명 한글 ⑥ HUD 모바일 버튼 한글. **인벤 세이브가 그대로인지**(Name 키 변경 없음)

### 2026-08-14 PopupGroup 정합성 감사

| 판정 | 내용 |
|---|---|
| ✅ 바인딩 | 팝업 컨트롤러 UUID 160건 → `PopupGroup.ui` 대조. **missing=0.** 규칙 24 해당 없음. 중첩 UIGroup 0. 빈 string 프로퍼티 6건은 상태값(아이템키 등)이라 노이즈 |
| ✅ 호버 | 팝업 버튼 82개 전부 ColorTint 골드 `#ffd161` (08-14 패치 유지) |
| ✅ **닫기 이중 X** | 상자·용광로·권한·상점·스킬트리 `BtnClose`가 X 스프라이트 `221e0368` + 레거시 `TextComponent="X"` 겹침. 글자 비움. 인벤/제작/캐릭터/워프는 원래 스프라이트만 |
| ✅ **용광로 제목** | Title 500×50이 닫기를 68px 덮음 → 340×50. L023 소거 |
| ✅ **인벤 툴팁** | `Name`/`Count` 히트박스 400px → 카드 240에 맞춤 220 |
| ℹ️ 닫기 두 패밀리 | 큰 종이창(인벤·제작·캐릭터)=흰 X 아이콘. 작은 카드=적갈 X 아이콘. 도감·의뢰·연구는 나무칩+글자(✕/X) — 의도된 세대 차이, 미통일 |
| ℹ️ 워프 L023 | Header/Slot 풀이 작성 좌표에서 겹침. `UIWarpController.PopulateDestinations`가 Open 때 재배치·Bg 높이 맞춤. 작성 좌표는 풀 주차 |
| ℹ️ 스킬트리 L016 | 노드가 왼쪽 치우침. 오른쪽 `SkillDetailPanel` 자리. 의도 |
| ℹ️ Grid L004 | 인벤 Grid stretch + `anchoredPosition.y=-18.3`는 OffsetMin/Max에서 유도된 값. 규칙 10 오탐 |
| ⚠ 닫기 히트박스 | 작은 카드에서 88×88 닫기가 카드 밖으로 4~14px (상자·권한·워프·상점·스킬·의뢰·연구). 터치 88 정책과 트레이드오프. 미수정 |
| ⚠ GroupType | 파일 전부 `GroupType=1` (08-13과 동일). `GroupOrder=2`로만 쌓음 |
| ℹ️ 노이즈 | 터치 &lt;88 (슬롯 72·탭 40) · 연구/의뢰 템플릿 빈 RUID(런타임 채움) · Capacity↔Coin 20px · 스탯 라벨↔값 10px |

- 변경: `ui/PopupGroup.ui` only (닫기 텍스트 5 · 용광로 Title · 툴팁 Name/Count). `.mlua` 없음
- 검증: UIBuilder write + `ui_lint` Error=0 (WARN 87→86, Furnace L023 소거). `maker_refresh_workspace` status ok. build 로그 dateTime=`2026-08-14T15:56:22` — **이번 refresh와 불일치 → 빌드 로그 갱신 미확인**. **런타임 검증 보류(제작자 수행)**
- Play 확인: ① 상자/용광로/상점/권한/스킬트리 닫기가 X 아이콘 한 장인지(글자 X 겹침 없음) ② 용광로 제목이 닫기를 안 덮는지 ③ 인벤 툴팁 이름·수량이 카드 안에 있는지 ④ 워프 Open 때 헤더·슬롯이 카드 안에 세로로 쌓이는지

### 2026-08-14 팝업 크롬 통일 적용 (⚖️ 제작자 확정 "그래 한번 통일하자")

13팝업 전체를 [design-policy.md §5 팝업 크롬 2계열](./design-policy.md)로 통일. 기준: **종이 큰창=인벤 / 나무 카드=의뢰**.

| 구역 | 적용 |
|---|---|
| **닫기 13개 전부** | 흰 X 스프라이트(221e0368) 88×88 · dOrd 20(스킬트리 30) · 글리프(✕/X) 제거. 종이창 (-35,-35) / 카드 (-12,-12) 카드 안쪽(기존 4~14px 밖 돌출 해소) |
| **종이 큰창 5** | 도감·퀘스트 Bg 960×740 → **루트 크기 풀블리드**(제작·인벤과 실루엣 일치) · 도감 속지 a=0.1→1(퀘스트와 동일 불투명 종이) · **캐릭터에 나무 프레임 신설**(유일하게 없던 창) · 제목 전부 (0,-28) 400×48 fs32 크림 · 도감 제목 "📖 도감"→"도감"(이모지 글리프 금지) |
| **나무 카드 8** | 상점·워프·권한·상자·화로·스킬트리 Bg를 25e9e895 회색틴트 → **4fea64a3 (0.2,0.1,0.1)** (의뢰와 동일) · 6창에 TopBar(카드폭×56)+골드 AccentLine 신설 · 의뢰/연구 TopBar 재앵커(top 고정, 64→56) · 제목 (0,-8) fs26 크림 (1,0.9,0.7) |
| **인벤 탭** | 좌측 정렬 120~140×40 → 도감 규격 **180×44 중앙 3분할**. 800폭이라 ±220은 닫기와 33px 겹침(L023) → 크래프팅 바와 같은 **좌로 60 시프트**(-280/-60/+160)로 해소 |
| 🛡️ **워프 예외** | `UIWarpController.PopulateDestinations`가 제목·닫기를 **중앙 앵커 좌표계**(`totalH/2-40`)로 런타임 재배치 + Bg 높이 리사이즈 → 앵커 불변, 색·스킨·x(155→134)만. TopBar/Accent는 top-anchored라 리사이즈 추종 |
| 🛡️ 인벤 탭 스킨 | 컨트롤러가 탭 색을 만지지 않아(SetTab=필터만) 선택 피드백 회귀 없음 확인 후 배치만 변경, 스킨 유지 |

- 적용: `scratch/unify_popup_chrome.cjs` (RUID 3종은 레퍼런스 엔티티에서 실측 복사). 신규 엔티티 13(TopBar/Accent×6쌍 + 캐릭터 Bg) — 15경로 존재 확인
- 검증: UIBuilder write + `ui_lint` **Error=0** (WARN 91 — 신규는 좁은 카드의 제목박스↔닫기 모서리 L023 2건뿐, 글자는 중앙·X가 위층이라 기능 무해. 나머지는 기존 베이스라인). 컨트롤러 9종 크롬 간섭 grep — 워프만 해당(예외 처리). **refresh 검증 보류(MCP 미연결)** · **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 13창 모두 닫기가 같은 흰 X·우상단·콘텐츠 위인지 ② 상점/워프/권한/상자/화로/스킬트리가 의뢰와 같은 나무 카드+골드 라인인지 ③ 도감/퀘스트 창이 제작과 같은 크기로 보이는지(20px 유령 마진 소거) ④ 캐릭터 창에 나무 프레임 ⑤ 인벤 탭 3개 중앙 정렬 + 전체/자원/장비 전환 정상 ⑥ **워프: 포탈 F → 목적지 수에 따라 카드가 늘어나도 제목·닫기·탑바가 따라오는지** ⑦ 화로 제목이 상단 밴드 안인지
- 후속 후보(선택): 카드 슬롯 스킨(9bb8e4d0 white vs dark 틴트 혼재) · 종이창 속지 인셋 편차(제작 10px vs 인벤 40/90) — 콘텐츠 재배치가 필요해 이번 범위에서 제외

### 2026-08-14 팝업 정합성 감사 2차 — 퀘스트·크래프팅 배치 정합 (제작자 지목)

제작자: "여러 팝업 정합성 체크. 특히 퀘스트·크래프팅 테이블 팝업 배치가 어색." 13팝업 전수 실측(dump_popup_chrome.cjs) → 기준 크롬 = **도감**(Bg 960×740 · Inner 900×640 @(0,-10) · Title 400×48 @(0,-28) · 탭 180×44 @y=-90 · 컬럼 420×500 @(±230,-40)).

| 판정 | 내용 |
|---|---|
| 🐛 **크래프팅 바 돌출·닫기 가림** | 직전 "즉시 수정"이 **절반만 파일에 남음** — 컨테이너는 820×44 @x=-60로 옮겨졌는데 안쪽 `Bg`가 **940×44** 그대로(창 왼쪽 밖 30px 돌출 + BtnClose x377~465와 겹침), `BtnClose` displayOrder 20도 없음(=6 < CategoryBar 7 → 바가 X를 덮음). Bg 820×44 정합 + dOrd 20 재적용. 바 우측 끝 350 < 377 확인 |
| 🐛 **컬럼 좌표 불일치** | 크래프팅 List 420×480@(-220,-40)·Details 400×500@(230,-40) vs 퀘스트 420×500@(±230,-40) → 크래프팅을 퀘스트/도감 좌표계(±230, 420×500)로 통일 |
| 🐛 **크래프팅 리스트 민낯** | 무배경·무Mask (퀘스트/도감은 다크 인셋 25e9e895 a=0.4 + Mask) → 동일 배경+Mask 부여. 스크롤 넘침 클립도 해소 |
| 🐛 **레시피 행 240×60** | 420 리스트에서 오른쪽이 비고 Name 160px라 레시피명 넘침 → 행 400×60 · Name 300 (도감/퀘스트 행처럼 리스트 폭 채움) |
| 🐛 **퀘스트 종이 드리프트** | `Bg/Inner` (6.6,-14.7) 886.8×630.6 소수점 → 왼 컬럼이 종이 밖 3.2px 돌출 → 도감과 동일 (0,-10) 900×640 (불투명 a=1 가시성 결정은 유지) |
| 🐛 **퀘스트 잔결함** | Title x=10 드리프트 → (0,-28) · 루트 `enable=on`(다른 12개는 off) → off · 닫기 ✕글리프(2d183f2a, 기지 약점) → 제작대와 같은 X 스프라이트(221e0368) |
| ✨ 제목 통일 | 크래프팅 Title (0,-24)45h → (0,-28)48h — 1000×780 3창(도감·퀘스트·제작) 제목선 일치 |

- 적용: `scratch/fix_popup_quest_crafting_align.cjs` (RUID는 레퍼런스 엔티티에서 실측 복사 — 프리픽스 추정 금지)
- 검증: UIBuilder write + `ui_lint` **Error=0** (WARN 89 — 수정 엔티티의 신규 경고 0, 전부 기존 L007 터치타깃/L023 계열). 컨트롤러 무변경(퀘스트 행 400×88 런타임 리사이즈·크래프팅 행 템플릿 복제 확인 후 진행). **refresh 검증 보류(MCP 미연결)** · **런타임 검증 보류(제작자 Play)**
- Play 확인: ① 제작대 F → 티어/카테고리 바가 창 안에 있고 X 안 가림 ② 레시피명 잘림 해소·행이 리스트 폭을 채움 ③ 스크롤 시 행이 바 위로 안 새는지(Mask) ④ 퀘스트 창 종이·제목 정렬 ⑤ 퀘스트 X 버튼이 제작대와 같은 스프라이트인지 ⑥ 접속 직후 퀘스트 창이 안 떠 있는지
- **미착수(제작자 확정 대기, 기존 통일안)**: 닫기 스킨 3계열(221e0368 X / 4fea64a3 나무칩[도감·의뢰·연구] / 빨강 틴트[Bg계열 6창]) · 프레임 2계열(풀블리드[제작·인벤] vs 20px 인셋[도감·퀘스트], 캐릭터는 나무 프레임 자체가 없음) · Title y 3종(-24/-28/-35) · 인벤 탭(좌측 정렬 120~140×40) vs 도감/퀘스트 탭(중앙 180×44) · 작은 창 8종 다크카드+빨강 X

### 2026-08-14 팝업 크롬 통일 — Play 실측 + 크래프트 X

12창을 Enable로 열어 캡처. 타이틀 그룹이 팝업 위에 있어서 MainMenu/HUD는 끄고 찍음.

| 창 | 실측 |
|---|---|
| 제작 | 티어/카테고리 바(do 6·7)가 닫기(do 3)를 덮음. 영문 잔재·칩 대비 낮음·레시피명 넘침 |
| 인벤 | 닫기 보임. 탭 영문. 종이 프레임은 기준 후보 |
| 캐릭터 | 닫기 보임. 스탯 영문·값 잘림 |
| 도감 | 나무칩 ✕. 한글 |
| 상점·상자 | 작은 다크 카드. 상자는 인벤 옆용 우측 오프셋 |
| 용광로 | 영문 Furnace. 회색 플레이스홀더에 가까움 |
| 스킬 | 닫기 보임. 한글 |
| 의뢰·연구 | 나무+골드 액센트. 크롬이 가장 정돈됨 |
| 워프 | Open 후 그룹 헤더 정상. 흰 카드 |

- 즉시 수정: 제작 `BtnClose` displayOrder 20 + Tier/Category 바 820px·좌로 60. Play 재캡처로 X 노출 확인
- 검증: UIBuilder write + lint Error=0 (WARN 86). refresh ok. **런타임 검증 보류(제작자: 테이블 F → 닫기가 바에 안 가리는지)**
- 통일안(미착수, 제작자 확정 대기): 큰창=인벤 종이 / 작은카드=의뢰 나무. 닫기는 항상 창 우상단·최상단 z. 제목 한글+크림 플레이트. 영문 잔재 제거

### 2026-08-14 타이틀 호버 + SFX + Bg 정리

| 판정 | 내용 |
|---|---|
| 🐛 **타이틀 호버 없음** | 새로하기/이어하기/종료하기 `ImageRUID=e363fe…` **리소스 없음**(=투명). ColorTint가 칠할 스프라이트가 없었음 |
| ✅ **타이틀 칩** | 슬롯과 같은 9-slice + 나무색 a=0.92. 호버 골드 ColorTint가 보임 |
| ✅ **키아트** | 원본 **1376×768**. Stretch(None)→1920×1080은 비균등 업스케일로 열화. **Art AspectOnly + Bg Mask(alpha 0)** 로 복구. 보이는 스프라이트는 Art 한 장 |
| ✅ **SFX** | 메인메뉴 `BindBtn` — 호버/클릭. RUID는 프로퍼티 |

- 변경: `ui/MainMenuGroup.ui` · `UIMainMenuController.mlua`
- 검증: UIBuilder write + `ui_lint` Error=0. LSP 0. `maker_refresh_workspace` status ok. build dateTime=`2026-08-14T15:56:22`(이번 refresh와 일치). Error=1 = 기존 `LEA-4004 PlayerController.OnMapEnter`(무관). Warning=47. **런타임 검증 보류(제작자 수행)**
- Play 확인: ① 타이틀 3버튼 호버=골드 칩 ② 호버/클릭 효과음 ③ 키아트가 화면에 한 장만 보이는지(이중 겹침 없음) ④ 슬롯/커스텀 버튼도 효과음

### 2026-08-14 버튼 호버 피드백

| 판정 | 내용 |
|---|---|
| ✅ **원인** | 전 버튼이 이미 ColorTint인데 Highlighted=`#f5f5f5`(Normal 대비 4%)라 나무/그린 버튼에서 호버가 안 보였음 |
| ✅ **호버** | Highlighted=`#ffd161` (따뜻한 골드). Fade 0.08s |
| ✅ **누름** | Pressed=`#9e8c6b` (어둡게) |
| ✅ **범위** | MainMenu 28 · HUD 22 · Popup 82 · Dialog 4 · PreviewTool 4 = **140** |

- 변경: `ui/*.ui` 5파일 `ButtonComponent.Colors`만. `.mlua` 없음. 평소 스프라이트색은 Normal 백색 유지
- 검증: UIBuilder write + `ui_lint` Error=0 (WARN은 파일별 기존 베이스라인). `maker_refresh_workspace` status ok. build 로그 dateTime=`2026-08-14T15:00:47` — **이번 refresh와 불일치 → 빌드 로그 갱신 미확인**. **런타임 검증 보류(제작자 수행)**
- Play 확인: ① 타이틀 새로하기/이어하기/종료하기에 마우스 → 골드 틴트 ② 클릭 유지 → 어두워짐 ③ 슬롯·커스텀·인벤 닫기·대화 수락도 동일 ④ 호버 끝나면 원래 색으로 복귀

### 2026-08-14 캐릭터 만들기 — 스프링 축 좌/우 페이지

| 판정 | 내용 |
|---|---|
| ✅ **스프링 축** | 좌 틴트 350×490 @ (-225, 10) · 우 틴트 380×490 @ (245, 10). 틈 x≈-50~+55 |
| ✅ **왼쪽 페이지** | 미리보기 · 내 캐릭터 유지 · 외형 꾸미기 · 뒤로 |
| ✅ **오른쪽 페이지** | 헤어/얼굴/피부/상의 행 + 닉네임 + 모험 시작. 행 칩은 슬롯과 같은 `#f7edd9` a=0.92 |
| ✅ **선택 가독성** | NamePlate를 행 전체 360×62 크림 칩으로. 라벨 24px 잉크색. `<`/`>` 56×56 |

- 변경: `ui/MainMenuGroup.ui` only (`LeftPageTint` 추가). `.mlua` 바인딩 불변
- 검증: UIBuilder write + `ui_lint` Error=0 (WARN 19, 기존 베이스라인). `maker_refresh_workspace` status ok. build 로그 dateTime=`2026-08-14T15:00:47` — **이번 refresh와 불일치 → 빌드 로그 갱신 미확인**. **런타임 검증 보류(제작자 수행)**
- Play 확인: 타이틀 → 새로하기 → 빈 슬롯 → 캐릭터 만들기. ① 스프링철이 좌/우 페이지 사이 빈 틈에 보이는지 ② 헤어~상의 크림 칩이 오른쪽 페이지에만 있는지 ③ `<`/`>`·파츠명이 읽히는지 ④ 미리보기·룩 버튼이 왼쪽인지 ⑤ 뒤로/모험 시작이 각 페이지 하단인지

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
