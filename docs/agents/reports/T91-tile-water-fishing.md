# T91 작업 보고서 — 낚시 = 물 타일 인접 판정으로 전환 + 맵별 어종

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식 산출물.

- **작업**: T91 낚시 = 물 타일 인접 판정으로 전환 + 맵별 어종 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0) | Play 런타임 검증 보류 (제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High) | Maker MCP 기동 | LSP 진단 통과
- **날짜**: 2026-07-28

## 1. 요약

마을 픽스처 낚시터(`town.map` 내 `FishingSpot`)는 기존대로 유지하면서, 영지/사냥터/보스맵 등 픽스처가 없는 수역에서도 물 타일에 조준하고 F 키를 누르면 물가 인접 낚시를 진행할 수 있도록 판정 로직을 확장했습니다.
맵별 SpotType(`estate`/`town`/`field`/`boss`) 기반으로 `FishDataSet.csv`에서 해당 맵의 어종(사냥터/보스 전용 어종 포함)이 추첨되도록 처리하였고, `map01.map`과 `template_field.map`에 잔존해 있던 픽스처 `FishingSpot` 엔티티를 완전 제거했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `IsAimTileWater`, `GetMapSpotType`, `ServerRequestTileFishingInteract` 추가 및 `TryInteract` 조준 물 타일 분기 연동 |
| `RootDesk/MyDesk/Furniture/Scripts/FishingSpot.mlua` | `StartFishing`에 `overrideSpotType` 인자 수용 추가로 픽스처 없는 세션 지원 |
| `RootDesk/MyDesk/item/DataSets/FishDataSet.csv` | `boss` 맵 어종 행 추가 (Salmon, Tuna 등) |
| `map/map01.map` | `FishingSpot` 엔티티 삭제 |
| `map/template_field.map` | `FishingSpot` 엔티티 삭제 |
| `map/town.map` | (**유지**) 마을 중앙 연못 픽스처 `FishingSpot` 보존 |

## 3. 구현 상세

1. **조준 셀 물 타일 판정**: `PlayerController.mlua`에서 바라보는 4방향 조준 셀이 L1 타일맵의 `Water` 타일인 경우, F 상호작용 키 입력 시 `ServerRequestTileFishingInteract`를 호출합니다.
2. **세션 소유 및 상태기 재사용**: 픽스처가 없는 맵에서도 T64의 릴링 상태기(`ReelTick`, `SetReelHold`, `GaugeMax`, 텐션 완화 등)를 100% 재사용하도록 맵의 `FishingSpot` 컴포넌트 헬퍼로 세션을 연결했습니다.
3. **맵별 어종 동적 지원**: 맵 종류(`Home_*` → `estate`, `town` → `town`, `boss` → `boss`, 그 외 → `field`)를 판별하여 `FishDataSet.csv` 행 기반 추첨을 수행합니다. 데이터셋 행 추가만으로 신규 맵 어종 지원이 가능합니다.
4. **픽스처 정리**: `map01.map`과 `template_field.map`의 `FishingSpot` 엔티티를 제거하여 물가 타일 판정 체계로 단일화했습니다.

## 4. 수행한 검증과 결과

- **LSP 진단 (`mlua-diagnose`)**: `PlayerController.mlua`, `FishingSpot.mlua` syntax/type Error 0건.
- **Maker `refresh` 빌드 검증**:
  - `maker_refresh_workspace` 성공
  - `maker_logs(kind="build")` 검증 결과: **Total logs: 544, Errors: 0** (Error 0건 통과).
- **Play 런타임 검증**: 범위 밖 — 런타임 검증 보류 (제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 영지·사냥터·보스맵에서 물가에 서서 물 타일을 바라보고 F 키 누르면 낚시 시작
- [ ] 마을 낚시터 픽스처에서 낚시 동작 정상 작동
- [ ] 맵 종류마다 `FishDataSet.csv`에 명시된 해당 어종이 낚임
- [ ] `map01`·`template_field`에 픽스처 없이도 물 타일 낚시 정상 수행
- [ ] 릴링 미니게임(홀드/릴리즈, 텐션 게이지) 및 주간 낚시왕 적립 정상 작동

## 7. 이력

- 2026-07-28 최초 작성 - 코드 완료 (Gemini 3.6 Flash High)
