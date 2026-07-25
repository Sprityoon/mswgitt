# T84 작업 보고서 — 정적 NPC `RigidbodyComponent` 청산 — RectTile Body 매핑 정합

- **작업**: T84 정적 NPC `RigidbodyComponent` 청산 — RectTile Body 매핑 정합 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0) | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High), Maker 기동 환경 (MCP refresh 완료), LSP 진단 완료
- **날짜**: 2026-07-25

## 1. 요약 (3~5줄)

8대 핵심규칙 1(RectTile 맵 엔티티 Body 매핑)을 위반하여 `map/town.map`(RectTile, TileMapMode=1)에 남아있던 정적 NPC 7기(`Merchant`, `Villager_Elder`, `Villager_Fisher`, `Villager_ResidentA~D`)의 MapleTile용 `RigidbodyComponent`를 모델 7종과 `town.map` 오버라이드 양쪽에서 전면 제거했습니다.
스페이스 스캔 결과 스크립트에서의 Rigidbody/Movement 참조 0건을 확인했으며, 통행 차단은 T81 TriggerComponent+ResourceOccupiedArea가, 조준 판정은 T82 Trigger AABB가 유지합니다.
`maker_refresh_workspace` 빌드 결과 Error=0 (total 587 logs) 통과를 확인했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/NPC/Models/Merchant.model` | `MOD.Core.RigidbodyComponent` 제거 |
| `RootDesk/MyDesk/NPC/Models/Villager_Elder.model` | `MOD.Core.RigidbodyComponent` 제거 |
| `RootDesk/MyDesk/NPC/Models/Villager_Fisher.model` | `MOD.Core.RigidbodyComponent` 제거 |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentA.model` | `MOD.Core.RigidbodyComponent` 제거 |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentB.model` | `MOD.Core.RigidbodyComponent` 제거 |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentC.model` | `MOD.Core.RigidbodyComponent` 제거 |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentD.model` | `MOD.Core.RigidbodyComponent` 제거 |
| `map/town.map` | 정적 NPC 7기의 `@components` 및 `componentNames`에서 `RigidbodyComponent` 제거 |

## 3. 구현 상세

- **선행 스캔**: `grep_search`로 `NPC/Scripts/{MerchantInteract, VillagerDialog}.mlua` 및 전 프로젝트 스크립트를 스캔하여 NPC 7종의 `RigidbodyComponent`/`MovementComponent` 참조 0건을 재검증했습니다.
- **ModelBuilder & MapBuilder 처리**: `ModelBuilder` 및 `MapBuilder`를 통해 모델 7종과 `town.map` 오버라이드 7건에서 `MOD.Core.RigidbodyComponent`를 안전하게 제거했습니다.
- **Animal_Cat 유지**: `Animal_Cat`은 이동형 NPC이므로 `KinematicbodyComponent` 구성을 그대로 유지했습니다.
- **스펙 무이탈**: 지휘자 설계 지침(교체가 아닌 제거)을 100% 이행했습니다.

## 4. 수행한 검증과 결과

- **재스캔 검증**:
  - `map/*.map` 및 `RootDesk/**/*.model` 재스캔 결과 `RigidbodyComponent` 등록 **0건** (전면 청산 통과).
- **Maker Refresh 빌드 검증**:
  - `maker_refresh_workspace` 호출 → **Error=0** (total 587 / Warning 85 / Info 502).
- **Play 런타임 검증**:
  - 런타임 검증 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- T86 티켓에서 이번 NPC 모델 7종(`VillagerDialog` 명시)을 포함한 `LWA-4012` Warning 청소가 진행될 예정입니다.

## 6. 제작자 런타임 체크리스트

- [ ] 주민/상인 7기에게 F키 대화·상점 열기·말풍선·AutoTalk 동작이 정상 작동하는가
- [ ] NPC 본체 영역에 플레이어 이동 차단(T81 Trigger)이 정상 유지되는가
- [ ] 고양이(`Animal_Cat`) 배회가 정상 작동하는가
- [ ] 런타임 로그에 `[LEA-3004]` (TileMapMode ↔ Body 매핑 불일치) 경고가 발생하지 않는가

## 7. 이력

- 2026-07-25 최초 작성 (Gemini 3.6 Flash High)
