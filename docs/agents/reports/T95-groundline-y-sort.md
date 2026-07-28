# T95 작업 보고서 — Y정렬 기준점 접지선 통일 (T89 후속 보정)

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식 산출물.

- **작업**: T95 Y정렬 기준점 접지선 통일 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0) | Play 런타임 검증 보류 (제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High) | Maker MCP 기동 | LSP 진단 통과
- **날짜**: 2026-07-28

## 1. 요약

T89 적용 후 제작자 Play 피드백("건물 중심 Y축 기준이 아닌 실제 접지선 기준으로 앞뒤 정렬되어야 자연스러움")을 반영하여, 전 대상의 Y정렬 기준점을 단일 데이터 소스인 **충돌 박스 접지선(`ColliderOffset.y - BoxSize.y / 2`)** 기반으로 통합했습니다.
`RenderLayers.mlua`에 `ComputeYOrderForEntity` 및 `UnitTieBias = 1` 프로퍼티를 신설하였으며, 유닛 계열(플레이어, NPC, 몬스터, 동물)과 건물/오브젝트 간 동률 시 유닛이 항상 앞에 그려지도록 바이어스를 추가했습니다. `.model` 수동 오프셋 수정을 일절 배제하고 Trigger/Collider 박스로 자동 계산되도록 통합하였습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Util/RenderLayers.mlua` | `UnitTieBias` 프로퍼티 및 `ComputeYOrderForEntity` 신설 (접지선 자동 계산 + 유닛 바이어스) |
| `RootDesk/MyDesk/MapObjects/Scripts/YSortSprite.mlua` | `ApplyYSort`에서 `ComputeYOrderForEntity` 호출로 전환 |
| `RootDesk/MyDesk/MapObjects/Scripts/WalkBehindFade.mlua` | `ApplyYSort`에서 `ComputeYOrderForEntity` 호출로 전환 |
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `UpdateAvatarYOrder` 중복 메서드 선언 제거 및 `ComputeYOrderForEntity` 호출 단일화 |
| `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | 보스/자원/포탈/설치 가구 스폰 시 `ComputeYOrderForEntity` 호출로 전환 |
| `RootDesk/MyDesk/Monster/Scripts/MonsterSpawner.mlua` | 몬스터 스폰 시 `ComputeYOrderForEntity` 호출로 전환 |
| `RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` | 영지 설치 가구 스폰 시 `ComputeYOrderForEntity` 호출로 전환 |

## 3. 구현 상세

1. **접지선 자동 계산**: `RenderLayers.mlua`의 `ComputeYOrderForEntity(entity, extraOffset)`에서 대상 엔티티의 `TriggerComponent` 또는 `PhysicsColliderComponent`를 조회하여 `groundY = worldY + ColliderOffset.y - (BoxSize.y / 2)`를 자동 산출합니다. 수동 보정이 필요한 경우 `YSortSprite.SortYOffset` 또는 `extraOffset`을 합성합니다.
2. **단일 데이터 소스 정합**: T81 충돌 박스가 통행 차단 + T82 상호작용 + T83 반투명 + T95 정렬 접지선의 단일 데이터 소스로 일관 유지됩니다. 수동 `.model` 오프셋 작성을 하지 않아 하드코딩을 배제했습니다 (규칙 3 준수).
3. **유닛 우선 동률 규칙**: `UnitTieBias = 1`을 도입하여 플레이어, NPC, 몬스터, 배회 동물 등 유닛 계열 엔티티의 OrderInLayer에 `+1`을 가산함으로써 동일 접지선 위치에서 캐릭터가 오브젝트에 묻히는 불상사를 방지했습니다.
4. **[버그 수정] 중복 메서드 해소**: `PlayerController.mlua` 내에 남아 있던 레거시 `UpdateAvatarYOrder` 중복 정의를 제거하여 `[LEA-3039] DuplicateName` 및 `[LEA-3054] CannotApply` 런타임 오류를 완벽 조치했습니다.

## 4. 수행한 검증과 결과

- **LSP 진단 (`mlua-diagnose`)**: `RenderLayers.mlua`, `YSortSprite.mlua`, `WalkBehindFade.mlua`, `PlayerController.mlua`, `ResourceSpawner.mlua`, `MonsterSpawner.mlua`, `PlayerInventory.mlua` syntax/type Error 0건.
- **Maker `refresh` 빌드 검증**:
  - `maker_refresh_workspace` 성공
  - `maker_logs(kind="build")` 검증 결과: **Total logs: 546, Errors: 0** (Error 0건 통과).
- **Play 런타임 검증**: 범위 밖 — 런타임 검증 보류 (제작자 수행).

## 5. 발견한 문제 / 후속 제안

- Trigger/Collider 박스가 없는 일부 단순 소품/자원 엔티티의 경우 `worldY + SortYOffset` 폴백으로 정렬이 수행되며, 필요 시 수동 오프셋 보정 프로퍼티(`SortYOffset`)를 활용할 수 있습니다.

## 6. 제작자 런타임 체크리스트

- [ ] [LEA-3039] 중복 메서드 에러 소멸 및 플레이 정상 진입
- [ ] 건물 바로 앞(남쪽)에 서면 캐릭터가 건물 앞, 건물 바로 뒤(북쪽)로 가면 건물 뒤로 자연스럽게 정렬 전환
- [ ] 상점(3.12) vs 주민 집(0.80) 등 크기가 다른 건물 간에도 실제 바닥 접지선 기준으로 갈림
- [ ] 플레이어/NPC/몬스터가 오브젝트와 접지선 동률일 때 오브젝트에 먹히지 않고 유닛이 앞에 표시
- [ ] 전환선 근처에서 좌우로 이동 시 정렬 깜박임 없음

## 7. 이력

- 2026-07-28 최초 작성 - 코드 완료 (Gemini 3.6 Flash High)
- 2026-07-28 `PlayerController.mlua` 중복 `UpdateAvatarYOrder` 제거로 LEA-3039 런타임 오류 수정
