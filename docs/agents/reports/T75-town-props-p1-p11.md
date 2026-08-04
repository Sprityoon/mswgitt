# T75 작업 보고서 — 마을 생활 소품 P1~P11

- **작업**: T75 마을 생활 소품 배치 (P0-C) (`docs/agents/subagent-handoff.md` §3)
- **상태**: **코드 완료** | refresh **Error=0 / Warning 17(baseline) / Info 520 / total 537** | **런타임 검증 보류(제작자 수행)**
- **수행 에이전트/환경**: Cursor Grok 4.5 (구현자) · T100 커밋 `63c2848` 이후 착수
- **날짜**: 2026-08-04

## 1. 요약

artwork-spec §4 검증 RUID로 소품 11종 `.model`을 만들고 `town.map`에 **43 인스턴스**(`modelId`) 배치했다. 전 소품 `TriggerComponent`+`YSortSprite`(WalkBehindFade 없음). **Occ(차단)는 울타리·술통·궤짝·수레만**. 벤치·꽃밭·배너 등 순수 데코는 T100 회피책대로 Occ/상호작용 스크립트 없음 → Ctrl/F 조준 대상 아님.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Models/Prop_{LampPost,StakeFence,WhiteFence,Signpost,Bench,FlowerBed,Barrel,CrateStack,JarSet,Cart,Banner}.model` | 신규 11종 |
| `map/town.map` | 소품 43 인스턴스 `placeModel` |
| `scratch/t75_place_town_props.cjs` | 생성·배치 스크립트 |

## 3. 구현 상세

### Occ / 조준 대상 표

| ID | 모델 | 배치 수 | Trigger | ResourceOccupiedArea | Ctrl/F 조준 | 비고 |
|---|---|---:|:---:|:---:|:---:|---|
| P1 | Prop_LampPost | 8 | Y | N | N | 데코 |
| P2 | Prop_StakeFence | 4 | Y | **Y** | N | 차단 |
| P3 | Prop_WhiteFence | 3 | Y | **Y** | N | 차단 |
| P4 | Prop_Signpost | 3 | Y | N | N | 데코 |
| P5 | Prop_Bench | 4 | Y | N | N | 순수 데코 |
| P6 | Prop_FlowerBed | 6 | Y | N | N | 순수 데코 |
| P7 | Prop_Barrel | 3 | Y | **Y** | N | 차단 |
| P8 | Prop_CrateStack | 3 | Y | **Y** | N | 차단 |
| P9 | Prop_JarSet | 3 | Y | N | N | 데코 |
| P10 | Prop_Cart | 2 | Y | **Y** | N | 차단 |
| P11 | Prop_Banner | 4 | Y | N | N | 순수 데코 |

**T100 회피책 적용**: Trigger만 있고 `Furnace`/`Chest`/… 및 `ResourceOccupiedArea`가 없으면 `FindNearby*`·`RequestMine` 그리드에 안 걸림. Box는 데코 `w≤1`·접지 오프셋 유지.

**RUID**: artwork-spec §4 표 1열 그대로 (재검색 없음).

**절대원칙 11**: 동일 소품 ≥2 → 전부 `.model` + `modelId` 인스턴스.

### 배치 요약

분수·상점·대장간·주택 주변 / 광장 테두리. 기존 건물·NPC·연못 엔티티는 `placeModel`만 추가(기존 경로 미터치).

**스펙 이탈**: 없음.

## 4. 수행한 검증과 결과

```
maker_refresh_workspace → ok
maker_logs(kind="build") → Error 0 / Warning 17 / Info 520 / total 537
```

town prop 엔티티 43 · 모델 컴포넌트 구성 확인(Bench=Trigger+YSort / StakeFence=+Occ).

**런타임 검증 보류(제작자 수행).**

## 5. 발견한 문제 / 후속 제안

- 꽃밭·울타리 스프라이트가 커서 일부 좌표는 Play 후 미세 이동이 필요할 수 있음(맵 디자인은 제작자 소유 — 좌표만 보고).

## 6. 제작자 런타임 체크리스트

- [ ] 소품 11종이 마을 곳곳에 보임
- [ ] 울타리·술통·궤짝·수레만 통행 차단 / 벤치·꽃·배너는 통과
- [ ] Ctrl이 데코를 채집 대상으로 잡지 않음
- [ ] Y정렬이 플레이어·NPC와 자연스러움
- [ ] 기존 건물·NPC·연못 회귀 0

## 7. 이력

- 2026-08-04 최초 작성 (구현자 — Cursor Grok 4.5)
