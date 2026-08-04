# T103 작업 보고서 — T75 소품 LWA-4012 Warning 청소

- **작업**: T103 Prop `LWA-4012` 프로퍼티 기본값(Properties 링크) 명시 (`docs/agents/subagent-handoff.md` §3)
- **상태**: **코드 완료** | refresh **Error=0 / Warning 17 / Info 520 / total 537** | **런타임 검증 보류(제작자 수행)**
- **수행 에이전트/환경**: Cursor Grok 4.5 (구현자) · ModelBuilder · Maker MCP
- **날짜**: 2026-08-04

## 1. 요약

T75 소품은 `Values`에 `SortYOffset`/`Offset*`가 이미 있었으나 **Inspector `Properties` 링크가 없어** `LWA-4012`가 31건 발생했다(W48). ModelBuilder `property()`로 링크를 추가했고, Values는 변경 전후 동일(전부 0)을 대조했다. refresh 후 **Warning 48→17**, 소품 `LWA-4012` **0**.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Models/Prop_{LampPost,StakeFence,WhiteFence,Signpost,Bench,FlowerBed,Barrel,CrateStack,JarSet,Cart,Banner}.model` | `SortYOffset` Properties 링크(+ Occ 5종 Offset* 링크) |
| `scratch/t103_prop_lwa4012_cleanup.cjs` | 적용 스크립트 |

⛔ `.mlua` / `.map` / BoxSize / Trigger / Occ 멤버십 / 배치 — **미수정**.

## 3. 구현 상세

### 진단

| 모델 예 | Values `SortYOffset` | Properties에 `SortYOffset` |
|---|---|---|
| Prop_LampPost (T75 직후) | 있음 (=0) | **없음** |
| Building_Shop (T86 청소분) | — | CoveredAlpha 등 **있음** |

→ LWA-4012는 Values만으로는 해소되지 않고 **Properties 링크**가 필요(T86과 동일).

### 적용

- 전 11종: `property("SortYOffset", { target: "script.YSortSprite", … })` + value 재명시(동일값)
- Occ 5종(StakeFence/WhiteFence/Barrel/CrateStack/Cart): `Offset{X,Y}{Min,Max}` 동일

### 값 대조표 (변경 전=후)

| 프로퍼티 | mlua 기본 | 모델 명시 | 일치 |
|---|---:|---:|:---:|
| `YSortSprite.SortYOffset` | 0.0 | 0 | Y |
| `ResourceOccupiedArea.OffsetXMin` | 0 | 0 | Y |
| `OffsetXMax` | 0 | 0 | Y |
| `OffsetYMin` | 0 | 0 | Y |
| `OffsetYMax` | 0 | 0 | Y |

**스펙 이탈**: 없음.

## 4. 수행한 검증과 결과

```
maker_refresh_workspace → {"status":"ok"}
maker_logs(kind="build") → Error 0 / Warning 17 / Info 520 / total 537
```

| 항목 | 전(배치 O 검수) | 후(T103) |
|---|---:|---:|
| Warning | 48 | **17** |
| 소품 LWA-4012 | 31 | **0** |
| Error | 0 | 0 |

잔여 Warning 17 = 기존 baseline(ServerRequestUseItem / TouchDamage / 기타). **런타임 검증 보류(제작자 수행).**

## 5. 발견한 문제 / 후속 제안

- T75 생성 스크립트는 `.value()`만 호출하고 `.property()`를 빼먹었다. 이후 스크립트 컴포넌트 부착 시 **value+property 쌍**을 관례로 할 것.
- handoff baseline을 **17**로 되돌림(T103 Acceptance).

## 6. 제작자 런타임 체크리스트

- [ ] 마을 소품 시각·위치 변화 없음
- [ ] 울타리·술통·궤짝·수레 통행 차단 유지
- [ ] 벤치·꽃·배너 통과 유지

## 7. 이력

- 2026-08-04 최초 작성 (구현자 — Cursor Grok 4.5)
