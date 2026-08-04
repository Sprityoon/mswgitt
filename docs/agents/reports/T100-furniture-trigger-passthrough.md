# T100 작업 보고서 — 가구 통행 차단 미작동 확정 + Trigger 전수 재감사·가구 6종 부여

- **작업**: T100 가구 6종 `TriggerComponent` 부여 + Trigger 전수 재감사 (`docs/agents/subagent-handoff.md` §3)
- **상태**: **코드 완료** (지휘자 검수 통과 2026-08-04) | refresh **Error=0 / Warning 17(당시 baseline) / Info 520 / total 537** | **런타임 검증 보류(제작자 수행)**
- **수행 에이전트/환경**: Cursor Grok 4.5 (구현자) · Maker MCP(`scratch/mcp_call.py`) · 규칙 13 갭 우회 감사
- **날짜**: 2026-08-04

## 1. 요약

**가구 6종은 Trigger/PhysicsCollider가 없어 `OverlapAll(TriggerBox)` 후보에 안 걸리므로, 통행 차단이 지금까지 작동하지 않았다.** 갭 우회 전수 감사로 T96의 "보유 22 / 미보유 23"을 **보유 26 →(부여 후) 32 / 미보유 34**로 교체했다. 가구 6종에 `TriggerComponent`(IsPassive)를 부여해 차단·Y정렬 접지선 경로에 편입했고, T82 AimFootprint↔Trigger AABB 수치 대조로 F 거리 회귀 0을 맞췄다. 자원 `.model`·`.map`·`.mlua` diff 0.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Furniture/Models/Furniture_Bed.model` | Trigger 추가 Box(0.9,0.7) Off(0,-0.1) IsPassive |
| `RootDesk/MyDesk/Furniture/Models/Furniture_CookingPot.model` | Trigger Box(0.85,0.65) Off(0,-0.1) |
| `RootDesk/MyDesk/Furniture/Models/Furniture_Furnace.model` | Trigger Box(0.9,0.7) Off(0,-0.1) |
| `RootDesk/MyDesk/Furniture/Models/Furniture_WoodenChest.model` | Trigger Box(0.85,0.65) Off(0,-0.1) |
| `RootDesk/MyDesk/Furniture/Models/Furniture_AnimalPen.model` | Trigger Box(1.2,0.85) Off(0,-0.1) — 차단 폭 약간 확대 |
| `RootDesk/MyDesk/Furniture/Models/Furniture_MonsterWard.model` | Trigger Box(0.85,0.65) Off(0,-0.1) — BlocksMovement=false 유지 |
| `scratch/t100_trigger_audit.cjs` | 규칙 13 갭 우회 전수 감사(진단용) |
| `scratch/t100_add_furniture_triggers.cjs` / `t100_retune_furniture_boxes.cjs` | 부여·박스 재조정 스크립트 |

⛔ 자원 `.model` / `.map` / `.mlua` — **수정 없음**(git status로 Furniture 6만 M).

## 3. 구현 상세

### ① Trigger 전수 재감사 (규칙 13 갭 우회) — **새 기준표**

읽기 경로: JSON에서 `Components` 배열을 가진 **가장 안쪽 노드**를 본체. `ModelBuilder.read()`가 0 components를 반환해도 갭으로 단정하지 않음.

| 시점 | Trigger 보유 | Trigger 미보유 | 비고 |
|---|---:|---:|---|
| T96 오염 수치 | 22 | 23 | **폐기** — 규칙 13 갭 |
| T100 부여 **전** (갭 우회) | **26** | **40** | 총 66 |
| T100 부여 **후** (현행 기준) | **32** | **34** | 가구 6 추가 |

**규칙 13 갭에 걸린 모델** (`builderWouldMiss`): 보고서 초안은 5종(`Tree1`·`Tree2`·`Stone`·`IronNodeResource`·`GrownGrass`)으로 적었으나, **지휘자 재실행(2026-08-04)에서는 3종만 갭** — `GrownGrass`·`IronNodeResource`·`Stone`. `Tree1`/`Tree2`는 갭이 아니다. Trigger 보유 여부 결론(자원은 보유)은 불변.

#### 보유 32 (부여 후)

| 카테고리 | 모델 | BoxSize (요약) |
|---|---|---|
| 자원 | Tree1, Tree2, Stone, IronNodeResource, Big Stone1, Big Stone2 | (갭 우회 확인) |
| 건물·구조 | Building_*, House_Mushroom*, House_WoodTower, BulletinBoard, FishingRankBoard, FishingSpot_Pond | T81 값 |
| NPC | Merchant, Villager_* 7 | (0.8,0.8) |
| 가구(기존) | Furniture_Portal | (1,1.5) |
| 가구(**본 티켓**) | Bed, CookingPot, Furnace, WoodenChest, AnimalPen, MonsterWard | 아래 ③ |

#### 미보유 34 (부여 후) — 대표

| 카테고리 | 모델 | 비고 |
|---|---|---|
| 통과/작물 | GrownGrass, Crop_Carrot | 의도적 |
| 미배치 주택 | House_ThatchHut | Trigger 없음 |
| 동물·펫 | Animal_*, Pet_Dog | T81 고양이 제외 계열 |
| 몬스터·투사체 | Slime*, Boar, HornMushroom, Projectile_* | HitBox 계열 |
| 아이템 드롭 17종 | Item_* | 월드 드롭 비주얼 |
| UI 샘플 | UIRanking* | 무관 |
| 기타 | TreasureChest, HandItem, Furniture 외 | |

### ② 가구 통행 차단 실태 — **미작동 확정**

코드 경로:

1. `ObstacleQuery.IsObstacle` → `OverlapAll(CollisionGroups.TriggerBox, …)` (`ObstacleQuery.mlua` 167행)
2. `TriggerComponent.CollisionGroup` 기본값 = `CollisionGroups.TriggerBox` (`TriggerComponent.d.mlua` 39행)
3. 필터 `IsBlockingOverlapEntity`는 `ResourceOccupiedArea`/`PlaceableFurniture`의 `BlocksMovement`를 보지만, **후보에 안 실리면 도달 불가**
4. 가구 6종은 부여 전 Trigger·PhysicsCollider **둘 다 없음** → `GetColliderAABB`도 false

**결론: 침대·화로·상자·냄비·축사·와드는 멤버십만 있고 박스가 없어 통행 차단이 동작하지 않았다.** (와드는 `BlocksMovement=false`라 부여 후에도 차단 안 함 — 의도)

### ③ 가구 6종 Trigger 부여

| 모델 | BoxSize | ColliderOffset | BlocksMovement | 비고 |
|---|---|---|---|---|
| Furniture_Bed | 0.9×0.7 | (0,-0.1) | default true | F=Furniture_Bed |
| Furniture_CookingPot | 0.85×0.65 | (0,-0.1) | default true | script.Furnace |
| Furniture_Furnace | 0.9×0.7 | (0,-0.1) | default true | |
| Furniture_WoodenChest | 0.85×0.65 | (0,-0.1) | default true | script.Chest |
| Furniture_AnimalPen | 1.2×0.85 | (0,-0.1) | **true** 명시 | F 경로 없음·차단 폭↑ |
| Furniture_MonsterWard | 0.85×0.65 | (0,-0.1) | **false** | 정렬용만 |

공통: `IsPassive=true`, `IsLegacy=false`, Scale 미명시(=1) → 규칙 14 실물=BoxSize. `PlaceableFurniture`/`ResourceOccupiedArea` 멤버십 유지(차단 *자격* 변경 없음).

### ④ T82 AimFootprint → Trigger AABB 대조 (**T75 스펙 확정**)

전제: 엔티티 셀 중심 `(tx+0.5, ty+0.5)`, Scale=1. Footprint 수식 `maxDx=floor((W-1)/2)` → **Bed W/H=2도 실효 1셀**(floor(0.5)=0).

| 대상 | AimFP (표기) | 실효 FP | Trigger 셀 히트 (Δ=0,±1) | 판정 |
|---|---|---|---|---|
| Bed | 2×2 | 1셀 | 본셀만 | **SAME** |
| CookingPot | 1×1 | 1셀 | 본셀만 | **SAME** |
| Furnace | 1×1 | 1셀 | 본셀만 | **SAME** |
| WoodenChest | 1×1 | 1셀 | 본셀만 | **SAME** |
| MonsterWard | (기본 1×1) | 1셀 | 본셀만 | **SAME** |
| AnimalPen | (F 없음) | — | 좌우·하 약간 확장 | F 무관·차단용 |

초기 오프셋 -0.15는 남쪽 셀 WIDER를 만들어 **재조정**함(`|offY|+boxH/2 ≤ 0.5`).

#### T75 회피책 (그대로 따를 것)

`IsAimTarget`은 Trigger가 있으면 **AimFootprintW/H를 무시**하고 AABB로 전환한다. 따라서:

1. **순수 데코(벤치·꽃밭·배너)**: Trigger + `YSortSprite`만. **`ResourceOccupiedArea`/`PlaceableFurniture` 붙이지 않음**(차단·멤버십 없음). 상호작용 스크립트(`Furnace`/`Chest`/… 및 `ReadAimFootprint` 목록) **금지**.
2. **Ctrl 조준**: `RequestMine`은 `ResourceSpawner` 그리드만 본다 — 데코를 자원 그리드에 넣지 않으면 Ctrl 대상 아님.
3. **F 조준**: `FindNearby*`가 특정 `script.*`만 열거 — 그 타입을 안 붙이면 F 대상 아님.
4. **통행 차단이 필요한 소품만** `ResourceOccupiedArea(BlocksMovement=true)` (+ Trigger). Trigger만으로는 차단 안 됨(T81 자격=Trigger+멤버십).
5. BoxSize는 본셀 안에 가두기(`|offY|+h/2≤0.5`, `w≤1`) — 인접 셀 오조준 방지.

### ⑤⑥ 역방향·SortYOffset

- `ComputeYOrderForEntity`: Trigger 있으면 접지선 경로 — 가구 6종 편입. `IsUnit` 오분류 없음(유닛 스크립트 없음).
- `SortYOffset` 값: 가구 6종 **없음** → 이중 보정 없음.

**스펙 이탈**: 없음.

## 4. 수행한 검증과 결과

```
maker_refresh_workspace → {"status":"ok"}  (2회: 부여 후 · 박스 재조정 후)
maker_logs(kind="build") → Error 0 / Warning 17 / Info 520 / total 537
```

Warning **baseline 17 유지**(초과 0). LWA-4012·LWA-1111은 기존 Furnace/Monster/UseItem 계열.

자원 `.model` git diff **0**. 가구 6만 변경.

**런타임 검증 보류(제작자 수행).**

## 5. 발견한 문제 / 후속 제안

- Bed `AimFootprintW/H=2`는 현 수식상 **무확장**(실효 1셀). 진짜 2×2가 필요하면 후속 티켓에서 footprint 수식 또는 BoxSize를 따로 개정.
- `House_ThatchHut`은 여전히 Trigger 미보유(미배치) — 범위 밖.

## 6. 제작자 런타임 체크리스트

- [ ] 영지에서 침대·화로·상자·냄비·축사에 **부딪혀 통과되지 않음**(와드는 통과 가능)
- [ ] 화로·냄비·상자·침대가 **기존과 같은 거리**에서 F로 잡힘(인접 셀에서 새로 잡히면 회귀)
- [ ] 와드 설치 후에도 플레이어가 통과됨
- [ ] 가구와 플레이어 Y정렬이 접지선 기준으로 자연스러움
- [ ] 나무·바위 채집·통행 회귀 0

## 7. 이력

- 2026-08-04 최초 작성 (구현자 — Cursor Grok 4.5)
- 2026-08-04 지휘자 검수 통과 · 갭 목록 각주 정정(Tree1/Tree2≠갭)
