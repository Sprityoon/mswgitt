# T97 작업 보고서 — T95 검수 지적 3건 수정 (이름 분기 제거 · 아바타 경로 · 가축/펫 Y정렬)

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식 산출물.

- **작업**: T97 T95 검수 지적 3건 수정 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0, Warning 17, Info 520 / Baseline 동일) | Play 런타임 검증 보류 (제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High) | Maker MCP 기동 | LSP 진단 통과
- **날짜**: 2026-07-28

## 1. 요약

직전 T95 구현에 대한 지휘자 코드 검수 지적 3건을 보정했습니다:
1) `RenderLayers.mlua` 내 하드코딩된 엔티티 이름 문자열 분기를 완전 삭제(AGENTS.md R3 준수)하고 `YSortSprite.IsUnit` 프로퍼티 기반으로 교체했습니다.
2) `PlayerController.UpdateAvatarYOrder`에서 아바타가 Trigger/Collider 박스 보정을 중복으로 타지 않도록 `ComputeYOrder(y)` 직접 호출로 복원하고, 사유 주석 명시 및 `UnitTieBias` (+1) 가산을 유지했습니다.
3) `Animal_Chicken`, `Animal_Sheep`, `Pet_Dog`, `Animal_Cat` 및 NPC 7종 모델에 `script.YSortSprite` (`IsUnit=true`)를 설정하여 가축·펫·NPC의 유닛 정렬 누락을 보정했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Scripts/YSortSprite.mlua` | `property boolean IsUnit = false` 프로퍼티 신설 |
| `RootDesk/MyDesk/Util/RenderLayers.mlua` | `ComputeYOrderForEntity` 내 엔티티 이름 문자열 분기 삭제 및 `YSortSprite.IsUnit` 참조로 전환 |
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `UpdateAvatarYOrder`를 `ComputeYOrder(y) + UnitTieBias` 직접 호출로 변경 (발밑 위치 보정 중복 방지 주석 기재) |
| `RootDesk/MyDesk/MapObjects/Models/Animal_Chicken.model` | `script.YSortSprite` (`Dynamic=true`, `IsUnit=true`) 부착 (ModelBuilder) |
| `RootDesk/MyDesk/MapObjects/Models/Animal_Sheep.model` | `script.YSortSprite` (`Dynamic=true`, `IsUnit=true`) 부착 (ModelBuilder) |
| `RootDesk/MyDesk/MapObjects/Models/Pet_Dog.model` | `script.YSortSprite` (`Dynamic=true`, `IsUnit=true`) 부착 (ModelBuilder) |
| `RootDesk/MyDesk/MapObjects/Models/Animal_Cat.model` | `script.YSortSprite`에 `IsUnit=true` 설정 (ModelBuilder) |
| `RootDesk/MyDesk/NPC/Models/*.model` (7종) | `Merchant`, `Villager_Elder`, `Villager_Fisher`, `Villager_ResidentA~D` 모델의 `script.YSortSprite`에 `IsUnit=true` 설정 (ModelBuilder) |

## 3. 구현 상세

1. **R3 위반 삭제 및 데이터 기반 유닛 판정**:
   - `RenderLayers.mlua`의 `ComputeYOrderForEntity`에서 `string.find(entName, "Villager" / "Merchant" / "Elder" / "Fisher")` 이름 분기 4줄을 전량 삭제했습니다.
   - 유닛 판정 우선순위: `PlayerController` / `PlayerComponent` / `MonsterAI` 보유 (코드 계약) → `YSortSprite.IsUnit` (데이터 프로퍼티) 순으로 통일하였습니다.
   - Grep 검증 결과: `RenderLayers.mlua` 내 엔티티 이름 문자열 분기 **0건** (`null`).
2. **아바타 Y정렬 경로 복원**:
   - 아바타 Transform의 WorldPosition.y는 이미 발밑 위치이므로 Trigger/Collider 박스 보정을 타지 않고 `_RenderLayers:ComputeYOrder(y)`를 직접 호출하도록 `UpdateAvatarYOrder`를 수정했습니다.
   - 단, 아바타 역시 유닛이므로 `UnitTieBias` (+1)를 추가 가산하여 현행 유닛 우선 정렬 체감과 100% 동일하게 유지했습니다.
3. **가축·펫·NPC Y정렬 모델 업데이트**:
   - `Animal_Chicken`, `Animal_Sheep`, `Pet_Dog` 모델 3종에 `script.YSortSprite` (`Dynamic=true`, `IsUnit=true`)를 부착했습니다.
   - `Animal_Cat` 및 NPC 7종 모델에 `IsUnit=true`를 명시적으로 설정하여 이동체 및 NPC가 유닛 바이어스(+1)를 정상 수용하도록 보정했습니다.

## 4. 수행한 검증과 결과

- **LSP 진단 (`mlua-diagnose`)**: `RenderLayers.mlua`, `YSortSprite.mlua`, `PlayerController.mlua` syntax/type Error 0건.
- **Maker `refresh` 빌드 검증**:
  - `maker_refresh_workspace` 실행 통과 (`status: ok`)
  - `maker_logs(kind="build")` 검증 결과: **Total logs: 537, Errors: 0, Warnings: 17, Info: 520** (지휘자 실측 baseline과 100% 일치, Error 0건).
- **Play 런타임 검증**: 범위 밖 — 런타임 검증 보류 (제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 닭(`Animal_Chicken`), 양(`Animal_Sheep`), 개(`Pet_Dog`)가 y 순서대로 정렬되며 오브젝트와 동률 시 위에 렌더링
- [ ] 고양이(`Animal_Cat`) 및 주민/상인 NPC 7종이 유닛 바이어스(+1)를 받아 오브젝트에 가려지지 않음
- [ ] 플레이어 아바타의 Y정렬 동작이 T95 대비 회귀 없이 동일 유지
- [ ] 신규 이름의 NPC를 추가해도 `IsUnit=true` 설정만으로 유닛 Y정렬 정상 적용

## 7. 이력

- 2026-07-28 최초 작성 - 코드 완료 (Gemini 3.6 Flash High)
