# T98 작업 보고서 — map01 물가 L2 프린지 (dry-run 대기)

- **작업**: T98 고정 수역 실배치 — L2 프린지 보정 (`docs/agents/subagent-handoff.md` §3)
- **상태**: **코드 완료** | refresh **Error=0 / Warning 17(baseline) / Info 520 / total 537** | **런타임 검증 보류(제작자 수행)**
- **수행 에이전트/환경**: Cursor Grok 4.5 (구현자)
- **날짜**: 2026-08-04

## 1. 요약

`scripts/fix_water_fringe.cjs`를 **맵 경로 인자 범용**으로 작성·적용했다. `build_maps.cjs`의 `cellTile`/`loadWallTileIndex`를 소스 추출로 재사용하고, 프린지 비트는 `ResourceSpawner.digHole`과 동일하다. `map01` L2 **40셀** 프린지 적용 · **범위 밖 diff 0** · Water 61 홀 유지. refresh Error=0.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `scripts/fix_water_fringe.cjs` | **신규** — 범용 프린지 스크립트 (`--dry-run` 지원) |
| `scratch/t98_water_fringe_dryrun.json` | dry-run 산출 요약 |
| `map/map01.map` | L2 프린지 40셀 적용 (L1/L3~L5·엔티티 무변경) |

⛔ `build_maps.cjs` 미수정 · `--force` 미실행 · `AutotileGrassLayer` 미호출.

## 3. 구현 상세

### 재사용 방식

- `build_maps.cjs` 직접 `require` 불가: 로드 시 `--force` 없으면 `process.exit(1)`, 있으면 4맵 `paintMap` 전량 실행.
- 대응: 가드·paint 섹션을 제거한 **가상 모듈로 동일 소스의 `cellTile`/`loadWallTileIndex`를 컴파일** — 로직 복제가 아니라 단일 파일 본문 공유. `build_maps.cjs`를 고치면 프린지 스크립트가 같은 함수를 읽는다.
- 프린지 OR 비트: digHole과 동일 8방 테이블.

### Change ①ⓑ dry-run 결과 (`map/map01.map`)

| 항목 | 값 |
|---|---|
| Water 셀 | 61 |
| 영향 범위 (water∪8이웃) | 101 |
| L2 변경 예정 | **40** (전부 `FullGrass`→방향 에지/`Grass*Corner`) |
| 물 셀 L2 클리어 | 0 (이미 61/61 홀) |
| 범위 밖 L2 diff | **0** |
| Name44 경고 | 0 — L1 `(3,6)`은 현재 **Soil**(제작자 복구 확인) |

변경 예정 타일 분포:

| 대상 타일 | 셀 수 |
|---|---:|
| GrassD | 5 |
| GrassL | 5 |
| GrassR | 4 |
| GrassT | 4 |
| GrassRTCorner | 4 |
| GrassRDCorner | 3 |
| GrassLDCorner | 3 |
| GrassLTCorner | 3 |
| GrassRT | 3 |
| GrassRD / GrassLD / GrassLT | 2 each |

샘플 좌표: `(18,-22) FullGrass→GrassRT`, `(17,-21)→GrassR`, `(20,-25)→GrassT`, … (전체는 `scratch/t98_water_fringe_dryrun.json`).

핸드오프의 "86 FullGrass 이웃"은 **물 셀별 8이웃 중복 합산**에 가깝고, unique 비물 이웃은 **40**이다.

### 적용

```
node scripts/fix_water_fringe.cjs map/map01.map
→ SAVED — L2 changes=40, outsideDiff=0
```

**스펙 이탈**: 없음. ⓐ 작업량 0(이미 홀).

## 4. 수행한 검증과 결과

- dry-run + 적용 산출 검사: outsideDiff=0 · waterWithL2=0 · 유효 15종만.
- `maker_refresh_workspace` → ok
- `maker_logs(kind="build")` → **Error 0 / Warning 17 / Info 520 / total 537** (baseline 유지)
- **런타임 검증 보류(제작자 수행)**

## 5. 발견한 문제 / 후속 제안

- 나머지 3맵은 Water 0 — 페인팅 후 동일 스크립트 재실행.

## 6. 제작자 체크리스트

- [ ] Play: 물가 프린지 육안 (방향 에지·Corner)
- [ ] 물 8방 진입 불가
- [ ] 물가 F 낚시(T91)
- [ ] 밀착 길·광장·밭 회귀 0

## 7. 이력

- 2026-08-04 dry-run 제출 → 제작자 승인 후 적용·refresh Error=0 (구현자 — Cursor Grok 4.5)
