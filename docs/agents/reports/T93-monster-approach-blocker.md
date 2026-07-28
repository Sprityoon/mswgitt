# T93 작업 보고서 — 몬스터 접근 차단 장치 (안전 낚시용 설치물)

- **작업**: T93 몬스터 접근 차단 장치 — 안전 낚시용 설치물 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP errors=0 (수정 mlua) | Maker MCP 미연결 — refresh·런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok (레인 B 구현자) · Maker MCP 미연결
- **날짜**: 2026-07-28

## 1. 요약

사냥터/보스맵에 설치하면 반경 안 몬스터가 진입하지 않고(이미 안이면 이탈), 경계 떨림은 진입/이탈 반경 히스테리시스로 억제하는 **Monster Ward** 가구를 추가했다. 수치·지속시간은 `item_dataset` CSV, 제작은 `RecipeDataSet`, 보스는 `Monster.IsBoss`로 면제. 활성 장치는 `@Logic` 레지스트리 캐시로 조회한다. **런타임 검증 보류(제작자 수행)**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Furniture/Scripts/MonsterAvoidanceRegistry.mlua` | 신규 `@Logic` — 맵별 활성 장치 캐시 |
| `RootDesk/MyDesk/Furniture/Scripts/MonsterApproachBlocker.mlua` | 신규 컴포넌트 — CSV 로드·등록·만료 Destroy |
| `RootDesk/MyDesk/Furniture/Models/Furniture_MonsterWard.model` | Bed 템플릿 복제 + Blocker 부착, 이동 비차단 |
| `RootDesk/MyDesk/Monster/Scripts/MonsterAI.mlua` | 회피 이탈 + 추격 목표 클램프, 보스 면제 |
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | 컬럼 3종 + `Monster Ward` 행 |
| `RootDesk/MyDesk/item/DataSets/RecipeDataSet.csv` | `Monster Ward` 제작 행 (Wood6+Stone4) |

## 3. 구현 상세

1. **설치물**: 기존 `PlaceableFurniture` + `ServerRequestPlace` 경로 재사용. 아이템 `Name=Monster Ward` → 모델 `Furniture_MonsterWard`. `BlocksMovement=false`(PlaceableFurniture·ResourceOccupiedArea).
2. **수치(CSV)**: `AvoidRadius=4`, `AvoidExitRadius=5`, `ActiveDurationSec=180`. 컴포넌트 프로퍼티는 폴백, `OnBeginPlay`에서 `PlaceableFurniture.ItemId`로 행 조회(pcall). 등급 추가는 CSV 행만으로 가능.
3. **회피**: `MonsterAI`가 CHARGE/LEAP/ATTACK 종료 후 `TryFleeAvoidZone` — 진입 반경 안(또는 히스테리시스 중 이탈 반경 안)이면 중심에서 멀어짐. `MoveToward`/`ClampChaseTargetOutsideAvoid`로 목표점이 진입 반경 안이면 이탈 원 가장자리로 투영.
4. **보스**: 데이터셋에 `IsBoss` 컬럼은 없음(실측). 기존 `Monster.IsBoss` 모델 프로퍼티 재사용 — 이름 분기 없음.
5. **캐시**: 설치 `Register` / 철거·만료·`OnEndPlay` `Unregister`. AI는 `_MonsterAvoidanceRegistry:GetActiveForMap`만 조회.
6. **만료**: `ActiveDurationSec>0`이면 타이머 후 `RemovePlacedFurniture` + `Destroy`(점유 정리 포함).
7. **스프라이트**: msw-mcp 미연결로 공식 검색 불가 → Portal RUID(`aba58d21…`) 임시 재사용. 제작자 아트 교체 가능.
8. **스펙 이탈**: 없음(보스 판정 소스는 모델 프로퍼티임을 보고서에 명시).

## 4. 수행한 검증과 결과

- **LSP (실행)**: `MonsterAI.mlua` / `MonsterApproachBlocker.mlua` / `MonsterAvoidanceRegistry.mlua` — **errors=0**.
- **ModelBuilder**: `Furniture_MonsterWard` write 성공 (6 components).
- **Maker refresh**: 보류 — MCP 서버 목록 비어 있음. **refresh Error 수: 측정 불가(보류)**. 신규 `.mlua` 2종은 refresh 후 `.codeblock` 생성 필수.
- **Play 런타임**: 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- **영지 UX**: 영지에도 설치는 되지만 몬스터가 없어 효과 없음. `Description`에 hunt/boss·estate 안내 문구 포함. 별도 설치 게이트는 넣지 않음(소견: 툴팁으로 충분, 설치 거부는 과함).
- **아트**: Portal 스프라이트 placeholder — 전용 토템/와드 아트 교체 티켓 후보.
- **CHARGE/LEAP 중**: 비중단 패턴은 회피보다 우선(기존 AI 계약 유지). 패턴 종료 후 이탈.

## 6. 제작자 런타임 체크리스트

- [ ] Maker `refresh` 후 빌드 Error=0 (신규 스크립트 `.codeblock` 생성 확인)
- [ ] 제작창에서 Monster Ward 제작 → 인벤 획득
- [ ] 사냥터에 설치 → `[T93][AVOID] registry register` / `blocker begin` 로그
- [ ] 반경 안 몬스터가 밖으로 나감 · 밖에서 안으로 들어오지 않음
- [ ] 경계에서 떨림(진입↔이탈 반복) 없음
- [ ] 보스(`IsBoss`)는 영향 없음
- [ ] 철거 또는 180초 만료 후 즉시 원복
- [ ] CSV에서 반경/지속시간 수정만으로 수치 반영
- [ ] 기존 추격·귀환·전투(T38~T41) 회귀 없음

## 7. 이력

- 2026-07-28 최초 작성 (레인 B 구현자)
