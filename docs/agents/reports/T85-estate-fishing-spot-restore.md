# T85 작업 보고서 — 영지(map01) 낚시터 복구 — 무티켓 삭제 회귀

- **작업**: T85 영지(map01) 낚시터 복구 — 무티켓 삭제 회귀 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0) | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High), Maker 기동 환경 (MCP refresh 완료), MapBuilder 사용
- **날짜**: 2026-07-25

## 1. 요약 (3~5줄)

무티켓 커밋(`38ae03c`)에서 `map/map01.map`로부터 삭제되었던 `FishingSpot` 엔티티를 설계 문서(`game_design.md` §15-C, 영지/마을/사냥터 3곳 낚시터 명시) 및 `FishDataSet.csv`(`SpotType=estate` 어종: Carp, Shrimp) 규격에 따라 동일 좌표 `(2.916275, 1.81077909, 0)`에 복구했습니다.
최신 `FishingSpot_Pond.model` 구성을 미러하여 `TransformComponent`, `SpriteRendererComponent`, `TriggerComponent`, `script.FishingSpot`, `script.ResourceOccupiedArea` 컴포넌트가 바인딩되었습니다.
`maker_refresh_workspace` 빌드 결과 Error=0 (total 587 logs) 통과를 확인했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `map/map01.map` | `/maps/map01/FishingSpot` 엔티티 재배치 (`modelId=fishingspot_pond`, Position `(2.916275, 1.81077909, 0)`) |

## 3. 구현 상세

- **MapBuilder 기반 배치**: MapBuilder의 `placeModel` API를 활용하여 `RootDesk/MyDesk/Furniture/Models/FishingSpot_Pond.model` 현행 모델 구성을 `map/map01.map`에 신규 UUID로배치했습니다.
- **지형 좌표 검증**: `map01` 타일 범위(`minX: -30, maxX: 30, minY: -30, maxY: 30`) 내에 정상적으로 배치되었으며, 연못 위치 좌표 `(2.916, 1.810)`가 타일 지형과 부합함을 확인했습니다.
- **FishDataSet 유지**: CSV 데이터셋의 `SpotType=estate` 2개 어종(붕어/새우) 데이터는 무수정으로 자동 정상화되었습니다.

## 4. 수행한 검증과 결과

- **맵 엔티티 스캔 검증**:
  - `map/map01.map` 스캔 결과 `/maps/map01/FishingSpot` 엔티티 존재 확인 (ID: `e3c374da-6f3f-4cb7-b0ce-fc63eac084e3`).
- **Maker Refresh 빌드 검증**:
  - `maker_refresh_workspace` 호출 → **Error=0** (total 587 / Warning 85 / Info 502).
- **Play 런타임 검증**:
  - 런타임 검증 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 영지(`map01`) 낚시터 연못 근처에서 F키로 낚시(캐스팅~릴링 T64)가 정상 작동하는가
- [ ] 영지 낚시 시 `SpotType=estate` 어종(Carp/Shrimp)이 정상 낚이는가
- [ ] 마을 및 사냥터 낚시터 기능에 회귀가 없는가

## 7. 이력

- 2026-07-25 최초 작성 (Gemini 3.6 Flash High)
