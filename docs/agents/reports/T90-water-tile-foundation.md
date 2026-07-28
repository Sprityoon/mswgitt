# T90 작업 보고서 — 물 타일 기반 신설 (L1 Water)

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식 산출물.

- **작업**: T90 물 타일 기반 신설 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0) | Play 런타임 검증 보류 (제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High) | Maker MCP 기동 | LSP 진단 통과
- **날짜**: 2026-07-28

## 1. 요약

기존 서브셀 마스크 지형 시스템(1축 흙 vs 잔디)을 변경하지 않고 L1 지반 타일 이름 `Soil` ↔ `Water`로 가르는 수역 기반 인프라를 신설했습니다.
`wall.tileset` 미사용 슬롯의 `Water` 타일을 활성화하고 `IsCollidable = true`로 설정하여 물 셀 통행 차단을 반영하였으며, `ResourceSpawner.mlua`에 `IsWaterTileName` 판정 및 물 셀 자원 스폰 억제 로직을 구현했습니다. `UIMinimapController.mlua`에 물 타일 미니맵 컬러(`Color(0.2, 0.45, 0.85, 1.0)`)를 반영했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/wall.tileset` | `Water` 타일의 `IsCollidable`을 `true`로 설정 (8방향 통행 불가) |
| `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | `IsWaterTileName` 판정 함수 추가 및 물 타일 셀 자원 스폰 억제 |
| `RootDesk/MyDesk/UI/Scripts/UIMinimapController.mlua` | `TileColor`에 물 타일 미니맵 전용 색상 추가 |

## 3. 구현 상세

1. **지형 마스크 호환성 보존**: `FullGrass`, `Grass*`, `SubGrass` 잔디 오토타일 및 프린지 문법을 일체 건드리지 않고, L2 홀일 때 L1이 `Soil`이면 흙길/광장, `Water`면 물로 노출되는 구조로 통합했습니다.
2. **통행 불가**: `wall.tileset`에서 `Water` 타일의 `IsCollidable = true`로 설정하여 별도 엔티티 Trigger 없이 타일 충돌 체계로 플레이어/엔티티 진입을 차단했습니다.
3. **자원 스폰 억제**: `ResourceSpawner.mlua`에서 L1 타일이 `Water`로 판정된 셀에서는 자원 스폰 시도를 배제했습니다 (`choice == "Water"` 수용 억제).

## 4. 수행한 검증과 결과

- **LSP 진단 (`mlua-diagnose`)**: `ResourceSpawner.mlua`, `UIMinimapController.mlua` syntax/type Error 0건.
- **Maker `refresh` 빌드 검증**:
  - `maker_refresh_workspace` 성공
  - `maker_logs(kind="build")` 검증 결과: **Total logs: 535, Errors: 0** (Error 0건 통과).
- **Play 런타임 검증**: 범위 밖 — 런타임 검증 보류 (제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 물 타일이 렌더링되고 8방향 진입 불가 (통행 차단)
- [ ] 물가 잔디 테두리가 기존 잔디 문법대로 자동 생성
- [ ] 물 셀에 자원 스폰 0 (자원 생성 억제)
- [ ] 미니맵에 물 영역이 파란색 톤으로 구분 표시

## 7. 이력

- 2026-07-28 최초 작성 - 코드 완료 (Gemini 3.6 Flash High)
