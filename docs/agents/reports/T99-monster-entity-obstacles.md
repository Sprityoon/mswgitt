# T99 작업 보고서 — 몬스터 엔티티 장애물 판정 (ObstacleQuery 공용화)

- **작업**: T99 몬스터가 자원·오브젝트를 통과하는 문제 — 엔티티 장애물 판정이 플레이어 전용 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP errors=0 | Maker MCP 미연결 — refresh·런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok (T99 단독) · Maker MCP 미연결 · T97과 PlayerController 병행 주의(장애물 영역만 수정)
- **날짜**: 2026-07-28

## 1. 요약

T36 장애물 판정(`IsObstacle`/`GetColliderAABB`/`ResolveOverlaps` 계열)을 `@Logic ObstacleQuery`로 추출하고, `PlayerController`는 **동일 시그니처 래퍼**만 남겼다. `MonsterAI.MoveDirVec`에서 동일 판정+축 슬라이드를 적용해 자원/가구를 통과하지 못하게 했고, 갇힘 시 MTV 밀어내기→스폰 방향 스텝→`RETURN` 폴백을 프로퍼티 임계로 넣었다. **런타임 검증 보류(제작자 수행)**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Util/ObstacleQuery.mlua` | 신규 `@Logic` — 벽/AABB/침투/MTV/`IsObstacle`/`ComputeOverlapPush` |
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | 위 API로 **추출 래퍼만** (UpdateAvatarYOrder 등 T97 영역 무수정) |
| `RootDesk/MyDesk/Monster/Scripts/MonsterAI.mlua` | `MoveDirVec` 장애물 슬라이드 + 갇힘 탈출 + 스폰 시 push-out |

**미수정(소유 밖)**: `Util/RenderLayers.mlua`, `MapObjects/Scripts/YSortSprite.mlua`

## 3. 구현 상세

### ① 플레이어 추출 동일성 (T36·T41 회귀 0)

- 공용 모듈로 **알고리즘을 이동**하고 PlayerController 메서드는 `_ObstacleQuery:...` 1줄 위임.
- 유지된 호출 계약: `IsWallAt(checkPos)`, `IsObstacle(checkPos, radius, currentPos)`, `IsBlockingOverlapEntity`, `GetColliderAABB`, `CirclePenetration`, `ResolveCircleAABB`, `ResolveOverlaps(delta)`.
- `ResolveOverlaps`의 **위치 적용·OverlapSafe\***는 클라 PlayerController에 잔류(점프/Kinematicbody 대칭 쓰기 계약 유지). MTV 합산만 `ComputeOverlapPush`(maxPush=0.5 동일).
- `OverlapQueryRadius=2.5`, 원 반경 `r=0.3`, “더 깊어지는 침투만 차단”, `ResourceOccupiedArea`/`PlaceableFurniture.BlocksMovement` 필터 — 수치·분기 조건 불변.
- 근거: 추출 전 본문을 ObstacleQuery에 이식 후 PC는 래퍼만 — 동작 경로(이동 축 테스트·대시 스윕·워프 안전점·T82 조준 AABB)의 진입점은 동일 메서드명.

### ② 몬스터 적용 + T93 순서

1. `TryFleeAvoidZone` / CHASE·WANDER·CHARGE 경로가 `MoveToward`→`MoveDirVec` 또는 직접 `MoveDirVec` 호출  
2. **`MoveDirVec` 내부**에서 `ObstacleQuery:IsObstacle` + X/Y 슬라이드  
3. `MoveToDirection`  
→ 회피(T93)가 고른 방향도 장애물에 막히면 슬라이드/정지. 회피 로직 자체는 미수정.

### ③ 갇힘 방지

- 프로퍼티: `ObstacleStuckSeconds=1.5`, `ObstacleStuckCooldown=4`, `ObstacleEscapeStep=0.75`, `ObstacleRadius=0.3`, `ObstacleQueryRadius=2.5`
- `TickObstacleStuck`: 이동 시도 후 변위≈0이면 타이머 누적 → `EscapeObstacleStuck`
- 탈출: `TryPushOutOfObstacles`(MTV) → 실패 시 스폰 방향 스텝 → `EnterState("RETURN")` + `[T99][OBS] stuck escape`
- `OnBeginPlay`에서도 `TryPushOutOfObstacles` 1회(스폰 끼임)

### ④ 성능

- **전수 N×M 비교 없음.** 후보 = `_CollisionService:GetSimulator(mover):OverlapAll(TriggerBox, CircleShape(pos, queryR≈2.5))` — 플레이어와 동일 엔진 공간 질의.
- 몬스터당 이동 프레임에 OverlapAll 최대 3회(풀/X/Y 슬라이드 테스트). 정지·제로 방향은 질의 없음.

### 스펙 이탈

- 없음. 보스 면제는 장애물과 무관(장애물은 전원 적용; T93 회피만 `IsBoss` 면제 유지).

## 4. 수행한 검증과 결과

- **LSP**: `ObstacleQuery.mlua` / `MonsterAI.mlua` / `PlayerController.mlua` — **errors=0** (info: GetComponent→BlocksMovement 타입 추론 — 기존 T36과 동일 계열).
- **Maker refresh**: 보류 — MCP 서버 catalog 비어 있음. baseline(지휘자 2026-07-28: Error=0 / Warning 17 / Info 520) 대비 **측정 불가**. 신규 `@Logic`은 refresh 후 `.codeblock` 등록 필수.
- **Play 런타임**: 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- NPC·동물·펫 이동 차단은 티켓 범위 밖 — 공용 모듈이 있어 후속 티켓에서 `MoveDirVec` 동등 훅만 붙이면 됨.
- CHARGE/LEAP 비중단 구간은 기존처럼 조기 return — 돌진 중 자원 관통 가능. 필요 시 후속.

## 6. 제작자 런타임 체크리스트

- [ ] Maker `refresh` 후 빌드 **Error=0** (신규 `ObstacleQuery` 등록 확인). Warning이 baseline 17에서 급증하면 보고
- [ ] 플레이어 이동·자원 밀착·채집·점프 체감 **변화 없음**(T36·T41)
- [ ] 몬스터가 나무·바위·광맥을 **통과하지 못함**
- [ ] 자원 사이 끼임 시 `[T99][OBS] stuck escape` 후 탈출·귀환
- [ ] 스폰이 오브젝트 안이어도 즉시 밀려남
- [ ] T93 Monster Ward 회피·T38~T41 추격/돌진/귀환 회귀 없음
- [ ] 프레임 저하 체감 없음

## 7. 이력

- 2026-07-28 최초 작성 (T99 구현자)
