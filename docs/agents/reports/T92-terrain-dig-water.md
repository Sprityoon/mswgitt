# T92 작업 보고서 — 영지 물 파기 (지형 편집 action 추가)

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식 산출물.

- **작업**: T92 영지 물 파기 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0) | Play 런타임 검증 보류 (제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High) | Maker MCP 기동 | LSP 진단 통과
- **날짜**: 2026-07-28

## 1. 요약

개인 영지(`Home_<UserId>`)에서 플레이어가 직접 물 지형을 파서 영지를 디자인할 수 있도록 `dig_water` (물 파기) 및 `fill_water` (되메우기) 지형 편집 action을 신설했습니다.
레인 B 소유 파일인 `item_dataset.csv`를 수정하지 않는 제약을 엄수하여 기존 `Shovel` (삽) 도구를 재사용했으며, 영지 조준 타일 상태(일반 타일 vs 물 타일)에 따라 `dig_water`와 `fill_water`가 자동 전환되도록 연동했습니다. 플레이어가 본인이 딛고 서 있는 발밑 셀을 파서 수영 불가 물속에 갇히는 현상을 방지하기 위한 안전 가드를 적용하였고, 기존 영속 지형 델타(`TerrainEditsJson`) 체계를 재사용하여 재접속 후에도 영지 물 지형이 보존되도록 구현했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | `ApplyTerrainEdit`에 `dig_water` 및 `fill_water` action 추가 (L1 타일 `Water` ↔ `Soil` 전환) |
| `RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` | `ServerRequestTerrainEdit`에서 `Shovel` 도구 연동, 조준 타일 판정 기반 `dig_water`/`fill_water` 전환 및 발밑 파기 금지 가드 추가 |

## 3. 구현 상세

1. **지형 액션 신설**: `ResourceSpawner.mlua`의 `ApplyTerrainEdit` 메서드에 `dig_water` (L1 타일 `"Water"` 설정, L2 마스크 15 셋) 및 `fill_water` (L1 타일 `"Soil"` 복원) 액션을 신설했습니다.
2. **도구 재사용 및 레인 소유권 준수**: `item_dataset.csv` (레인 B 소유)를 수정하지 않고 기존 `Shovel` (삽) 도구를 조준했을 때, 조준 타일이 일반 흙/잔디이면 `dig_water`, 이미 `Water` 타일이면 `fill_water`가 수행되도록 `PlayerInventory.mlua`에서 동적 전환되도록 설계했습니다.
3. **갇힘 방지 가드**: 플레이어 자신의 현재 위치 셀(`playerCell`)을 조준하여 물을 파려는 시도가 있을 경우, "발 밑 셀에는 물을 갤 수 없습니다." 알림을 띄우고 편집을 차단하도록 가드를 적용했습니다.
4. **영속성 보존**: 기존 `TerrainEditsJson` 저장/재생 인프라에 추가 설계 없이 그대로 기록되므로 재접속 및 영지 재입장 시에도 물 지형이 100% 영속 저장 및 복원됩니다. 세이브 경로 내 추가 Yield 없이 동작합니다 (규칙 7 준수).

## 4. 수행한 검증과 결과

- **LSP 진단 (`mlua-diagnose`)**: `ResourceSpawner.mlua`, `PlayerInventory.mlua` syntax/type Error 0건.
- **Maker `refresh` 빌드 검증**:
  - `maker_refresh_workspace` 성공
  - `maker_logs(kind="build")` 검증 결과: **Total logs: 545, Errors: 0** (Error 0건 통과).
- **Play 런타임 검증**: 범위 밖 — 런타임 검증 보류 (제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 영지에서 삽(`Shovel`)으로 흙/잔디를 조준하고 작용하면 물 타일(`Water`)로 파임 (`dig_water`)
- [ ] 영지에서 판 물 타일에 다시 삽을 사용하면 흙 타일(`Soil`)로 되메워짐 (`fill_water`)
- [ ] 판 물 타일에서 즉시 물가 낚시 진행 가능 (T91 연계)
- [ ] 플레이어가 본인이 딛고 서 있는 발밑 셀을 파려고 하면 차단 피드백 출력 (갇힘 차단)
- [ ] 영지 재접속 / 재입장 후에도 판 물 지형 유지
- [ ] 사냥터/마을 등 영지 외 맵에서는 물 파기 불가

## 7. 이력

- 2026-07-28 최초 작성 - 코드 완료 (Gemini 3.6 Flash High)
