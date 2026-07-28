# T89 작업 보고서 — 마을 Y축 렌더 정렬 정합 (플레이어·NPC Y정렬 적용)

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식 산출물.

- **작업**: T89 마을 Y축 렌더 정렬 정합 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0) | Play 런타임 검증 보류 (제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High) | Maker MCP 기동 | LSP 진단 통과
- **날짜**: 2026-07-28

## 1. 요약

마을에서 플레이어와 NPC 및 오브젝트들이 Y축 위치에 관계없이 고정 OrderInLayer(플레이어 4, NPC 12 고정)로 렌더링되던 원인을 해소하고 단일 Y정렬 규약으로 일원화했습니다.
`Util/RenderLayers.mlua`에 공통 기준 `SortRadius = 100` 및 `ComputeYOrder(worldY)` 메서드를 신설하고, 신규 `YSortSprite.mlua` 컴포넌트 추가 및 플레이어 아바타 `PlayerController.mlua` Y정렬 갱신 로직을 통합했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Util/RenderLayers.mlua` | 공통 `SortRadius=100` 및 `ComputeYOrder(worldY)` 단일 계산식 추가 |
| `RootDesk/MyDesk/MapObjects/Scripts/YSortSprite.mlua` | [신규] NPC/동물/구조물용 공용 Y정렬 컴포넌트 (`Dynamic` 및 `SortYOffset` 지원) |
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `UpdateAvatarYOrder` 메서드 추가 및 Client `OnBeginPlay`/`OnUpdate`에서 아바타 Y정렬 갱신 |
| `RootDesk/MyDesk/MapObjects/Scripts/WalkBehindFade.mlua` | OrderInLayer 계산식을 `_RenderLayers:ComputeYOrder(y)`로 대체 |
| `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | 자원/보스/포탈 스폰 OrderInLayer 계산식을 `_RenderLayers:ComputeYOrder(y)`로 대체 |
| `RootDesk/MyDesk/Monster/Scripts/MonsterSpawner.mlua` | 몬스터 스폰 OrderInLayer 계산식을 `_RenderLayers:ComputeYOrder(ry)`로 대체 |
| `RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` | 설치 가구 스폰 OrderInLayer 계산식을 `_RenderLayers:ComputeYOrder(cellPos.y)`로 대체 |
| `RootDesk/MyDesk/NPC/Models/*.model` (7종) | `Merchant`, `Villager_Elder`, `Villager_Fisher`, `Villager_ResidentA~D`에 `script.YSortSprite` (Dynamic=false) 부착 |
| `RootDesk/MyDesk/MapObjects/Models/Animal_Cat.model` | `script.YSortSprite` (Dynamic=true) 부착 |
| `RootDesk/MyDesk/Furniture/Models/FishingSpot_Pond.model` | `script.YSortSprite` 부착 및 `SpriteRendererComponent.SortingLayer` = MapLayer5 |
| `map/town.map` | FishingSpot 엔티티 `SpriteRendererComponent` `SortingLayer` = MapLayer5 오버라이드 지정 |

## 3. 구현 상세

1. **단일 Y정렬 규약 일원화**: `RenderLayers.mlua`에 `SortRadius = 100`을 정의하고 `ComputeYOrder(worldY)` (`math.max(MinEntityOrder, math.floor((SortRadius - worldY) * 100))`)로 계산 방식을 일원화했습니다.
2. **`YSortSprite.mlua` 신설**: 정적 엔티티(NPC, 픽스처) 및 이동체(Animal_Cat 등)에 범용 적용 가능한 컴포넌트를 작성했습니다.
3. **플레이어 아바타 정렬**: `PlayerController.mlua`의 `UpdateAvatarYOrder`에서 `AvatarRendererComponent`의 `SortingLayer`와 `OrderInLayer`를 갱신하도록 처리했습니다. 각 클라이언트에서 접속 중인 플레이어 엔티티별로 y 변화(≥0.05)를 감지하여 Local에서 독립 갱신되도록 하였습니다 (`OrderInLayer` 비동기 특성 대응).
4. **기존 시스템 정합 유지**: `WalkBehindFade`, `ResourceSpawner`, `MonsterSpawner`, `PlayerInventory` 내 OrderInLayer 하드코딩 수식을 전량 `_RenderLayers:ComputeYOrder`로 교체하여 기준선 불일치를 해소했습니다.

## 4. 수행한 검증과 결과

- **LSP 진단 (`mlua-diagnose`)**: `RenderLayers.mlua`, `YSortSprite.mlua`, `PlayerController.mlua`, `WalkBehindFade.mlua`, `ResourceSpawner.mlua`, `MonsterSpawner.mlua`, `PlayerInventory.mlua` 모두 syntax/type Error 0건.
- **Maker `refresh` 빌드 검증**:
  - `maker_refresh_workspace` 실행 통과 (`status: ok`)
  - `maker_logs(kind="build")` 검증 결과: **Total logs: 531, Errors: 0** (Error 1건이라도 발생 시 중단 조건 만족).
- **Play 런타임 검증**: 범위 밖 — 런타임 검증 보류 (제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 플레이어가 건물·NPC보다 y가 작으면(남쪽) 앞, 크면(북쪽) 뒤로 그려짐
- [ ] NPC끼리도 y 순서대로 앞뒤가 갈림
- [ ] 플레이어↔NPC 앞뒤가 y로 결정됨
- [ ] 고양이 배회 중에도 정렬 유지
- [ ] 낚시터·자원·설치 가구·몬스터 정렬 회귀 0
- [ ] T83 walk-behind 반투명 동작 회귀 0

## 7. 이력

- 2026-07-28 최초 작성 (Gemini 3.6 Flash High)
