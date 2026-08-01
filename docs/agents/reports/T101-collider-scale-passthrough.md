# T101 작업 보고서 — 콜라이더 판정에 `Transform.Scale` 미반영 (자원 통과 버그)

- **작업**: T101 콜라이더 판정에 `Transform.Scale` 미반영 — 자원 통과 버그 (`docs/agents/subagent-handoff.md` §3)
- **상태**: **완료** | LSP `errors=0 / warnings=0` · refresh **Error=0 / Warning 17(baseline 유지) / Info 520 / total 537** | **런타임 검증 보류(제작자 수행)**
- **수행 에이전트/환경**: 지휘자 직접 (Claude Opus 5) · Maker MCP 연결됨 · LSP 사용 가능
- **날짜**: 2026-08-01

## 1. 요약

제작자 Play 보고 "Big Stone 스프라이트를 바꾸고 collider·trigger box를 조정했는데도 통과된다"의 원인은 **모델값이 아니라 코드**였다. 엔진의 실제 콜라이더는 `BoxSize × Transform.Scale`인데 `ObstacleQuery.GetColliderAABB`가 원본 `BoxSize`/`ColliderOffset`을 그대로 써서, **후보 수집은 실물 콜라이더로 / 침투 판정은 축소된 박스로** 하는 불일치가 있었다. `Scale≠1` 모델에서만 발현되며 `Big Stone1`(Scale 2)은 판정 박스가 실물의 **1/2**, `Tree1`(Scale 1.5)은 **2/3**이었다. `RenderLayers`의 접지선 계산에도 동일 결함이 있어 함께 고쳤다. **Maker에서 박스를 키우면 실물도 같이 커지므로 에디터 조정으로는 원리상 상쇄가 불가능**했다 — 제작자가 자력으로 못 고친 것이 정상이다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Util/ObstacleQuery.mlua` | `GetColliderAABB` — `BoxSize`·`ColliderOffset`에 `Transform.Scale` 반영 |
| `RootDesk/MyDesk/Util/RenderLayers.mlua` | `ComputeYOrderForEntity` — 접지선 계산에 동일 적용 |
| `docs/agents/subagent-handoff.md` | §1.2 규칙 13·14 신설, T96 실측표 정정, T100 범위 재작성, T101 신규, 현황판 |
| `game_design.md` | Phase 20 트래커 — 20-J(T101) 신설 · 20-I(T100) 정정 |

## 3. 구현 상세

**Change ① `GetColliderAABB`** — `transform.Scale`에서 `sx`/`sy`를 뽑아 `hx = BoxSize.x * 0.5 * sx`, `cx = WorldPosition.x + ColliderOffset.x * sx` 형태로 반영. 오프셋도 로컬 좌표라 함께 스케일된다.

- `TransformComponent`에 **`WorldScale`은 존재하지 않는다**(`Environment/NativeScripts/Component/TransformComponent.d.mlua` 전문 확인 — `Scale` / `WorldPosition` / `WorldRotation` / `WorldZRotation`만 있음). 자원·오브젝트는 맵 직속이라 부모 스케일이 1이므로 **로컬 `Scale` = 월드 스케일**로 취급했고, 그 근거를 코드 주석에 남겼다.
- 0·음수 방어: `math.abs` 후 `<= 0.0001`이면 1.0으로 폴백. `ResourceSpawner`가 스폰 연출로 Scale을 5%→100% 보간하는 구간(2064~2081행)에서도 실물 콜라이더와 판정이 **같은 방향으로** 움직이므로 오히려 정합이 개선된다.

**Change ② `ComputeYOrderForEntity`** — 접지선 `groundY = worldY + ColliderOffset.y*sy - (BoxSize.y*0.5*sy)`. Big Stone1 기준 `y − 1.00` → `y − 2.00`으로 교정(1.0유닛 오차 해소).

**Change ③ 규칙 13·14 신설** — §1.2에 추가. 상세는 §5.

**스펙에서 벗어난 결정**: 없음. 하드코딩 없음(R3) — 스케일 계수는 전부 런타임 프로퍼티에서 읽는다.

**재사용/신규**: 신규 로직 0. 기존 수식에 스케일 계수만 곱했다 — 그래서 `Scale=1`인 나머지 전 모델에서 결과가 **비트 단위로 동일**하다.

## 4. 수행한 검증과 결과

**LSP (`mlua-diagnose`, 자동 실행)**

```
ObstacleQuery.mlua : errors=0, warnings=0   (info 2 — 기존 'BlocksMovement' LIA-1114)
RenderLayers.mlua  : errors=0, warnings=0   (info 3 — 기존 'SortYOffset'/'IsUnit' LIA-1114)
```

info는 전부 `GetComponent(string)`이 추상 `Component`를 반환해 생기는 기존 노이즈(SKILL.md §17.2 분류)이며 이번 수정과 무관한 라인이다.

**Maker refresh + 빌드 로그**

```
maker_refresh_workspace  → {"status":"ok"}
maker_logs(kind="build") → Error 0 / Warning 17 / Info 520 / total 537
```

Warning 17은 직전 baseline과 **동일 — 증가 0**. 수정한 두 파일에서 나온 로그는 Info 5건뿐이고 Error/Warning 0건이다.

**영향 범위 전수 실측** — `.model` 66개를 갭 우회 리더로 스캔:

| 모델 | Scale | 박스 | 영향 |
|---|---|---|---|
| `Big Stone1` | (2, 2) | Trigger | 판정 박스가 실물의 **1/2** |
| `Tree1` | (1.5, 1.5) | Trigger | 판정 박스가 실물의 **2/3** |

`Scale≠1`인 다른 4종(`Crop_Carrot` 0.55 · `Boar` 1.25 · `HornMushroom` 1.25 · `SlimeKing` 1.4 · `HandItem` 0.45)은 **충돌 박스가 없어** 무관. 나머지 전 모델은 `Scale=1` → `sx=sy=1` → 수식 동일. **회귀 위험 0.**

**런타임(Play) 검증 보류 — 제작자 수행** (AGENTS.md §0 O-2).

## 5. 발견한 문제 / 후속 제안

🔴 **`ModelBuilder` 커버리지 갭 (→ §1.2 규칙 13 신설)** — `EntryKey`/`Id`가 `maplestorymapobject$...` 형태인 모델은 본체(`Components`/`Values`)가 **셸 한 단계 안쪽**에 있어 `ModelBuilder.read()`가 **에러 없이 `0 components, 0 values`** 를 반환한다. 실제로는 `TriggerComponent`·`ResourceOccupiedArea`를 갖고 있다.

이 갭이 만든 연쇄 오류가 셋이다:

1. **T96 실측표** — 자원 `Tree1`·`Tree2`·`Stone`·`IronNodeResource`를 "Trigger 미보유"로 기재(실제로는 4종 모두 보유). "보유 22 / 미보유 23" 총계 자체가 신뢰 불가.
2. **T100 작업 범위** — 위 표를 근거로 "자원 6종에 Trigger 부여"를 지시했으나 **이미 전부 갖고 있어 작업 대상이 아니다**. → T100 재작성 완료.
3. **본 티켓의 1차 영향범위 집계** — 처음에 "`Big Stone1` 1종"으로 보고했다가 갭 우회 재스캔에서 **`Tree1` 누락**을 발견. 가장 흔한 자원이 빠질 뻔했다.

**후속 제안**: `.model` 감사 결과가 "컴포넌트 없음"이면 결론 내기 전에 `snapshot().model_id`에 `$`가 있는지부터 확인할 것(규칙 13). 벤더 스킬 소관이라 빌더 자체는 수정하지 않았다.

🔴 **가구 6종 통행 차단 의심 (→ T100 ②로 편입)** — 가구는 `TriggerComponent`도 `PhysicsColliderComponent`도 없다. `ObstacleQuery.IsObstacle`의 후보 수집이 `OverlapAll(CollisionGroups.TriggerBox, ...)`이고 그 그룹은 `TriggerComponent`의 것(`TriggerComponent.d.mlua` 39행)이므로, **가구가 후보로 수집조차 안 될 가능성**이 있다. 침대·화로·상자의 통행 차단이 현재 작동하지 않을 수 있다 — T100에서 코드 경로로 판정한다.

## 6. 제작자 런타임 체크리스트

- [ ] `Big Stone1` / `Big Stone2`에 8방향으로 부딪혀 **통과되지 않음**
- [ ] **`Tree1`(Scale 1.5)** 에 부딪혀 통과되지 않음 — 이번에 함께 고쳐진 대상
- [ ] 바위·나무 발치에서 플레이어가 앞뒤로 자연스럽게 정렬(Y정렬 접지선 교정 확인)
- [ ] 몬스터도 바위·나무를 통과하지 못함(동일 모듈 사용 — T99 회귀 확인)
- [ ] 기존 자원 통행·채집 체감 회귀 0 (`Scale=1` 자원은 변화 없어야 정상)

## 7. 이력

- 2026-08-01 최초 작성 (지휘자 — Claude Opus 5)
