# T98 작업 보고서 — map01 물가 L2 프린지

- **작업**: T98 고정 수역 실배치 — L2 프린지 보정 (`docs/agents/subagent-handoff.md` §3)
- **상태**: **코드 완료** (지휘자 검수 통과·사고 복구 포함) | refresh **Error=0**(빌드) · **map 로드 가능(규칙 16)** | **런타임 검증 보류(제작자 수행)**
- **수행 에이전트/환경**: Cursor Grok 4.5 (구현자) · 사고 복구 `d7b9479`(미푸시 rewrite)
- **날짜**: 2026-08-04

## 1. 요약

`scripts/fix_water_fringe.cjs`를 **맵 경로 인자 범용**으로 작성·적용했다. `build_maps.cjs`의 `cellTile`/`loadWallTileIndex`를 소스 추출로 재사용하고, 프린지 비트는 `ResourceSpawner.digHole`과 동일하다. `map01` L2 **40셀** 프린지 적용 · **범위 밖 diff 0** · Water 61 홀 유지.

⚠️ **1차 적용 사고(보고 누락 → 지휘자 반려 후 복구)**: 스크립트가 `RectTileMap2.jsonString`을 `JSON.stringify`로 **문자열** 저장해 맵이 붕괴했다(§5). `d7b9479`에서 객체 대입·맵 복구. **규칙 16** 신설.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `scripts/fix_water_fringe.cjs` | **신규** — 범용 프린지 (`--dry-run`). **최종**: `slot.e.jsonString = slot.js`(객체) |
| `scratch/t98_water_fringe_dryrun.json` | dry-run 산출 요약 |
| `map/map01.map` | L2 프린지 40셀 + jsonString 객체 형태 유지 |

⛔ `build_maps.cjs` 미수정 · `--force` 미실행 · `AutotileGrassLayer` 미호출.

## 3. 구현 상세

### 재사용 방식

- `build_maps.cjs` 직접 `require` 불가: 로드 시 `--force` 없으면 `process.exit(1)`, 있으면 4맵 `paintMap` 전량 실행.
- 대응: 가드·paint 섹션을 제거한 **가상 모듈로 동일 소스의 `cellTile`/`loadWallTileIndex`를 컴파일**.
- 프린지 OR 비트: digHole과 동일 8방 테이블.

### Change ①ⓑ dry-run / 적용 결과 (`map/map01.map`)

| 항목 | 값 |
|---|---|
| Water 셀 | 61 |
| 영향 범위 (water∪8이웃) | 101 |
| L2 변경 | **40** (`FullGrass`→방향 에지/`Grass*Corner`) |
| 물 셀 L2 클리어 | 0 (이미 61/61 홀) |
| 범위 밖 L2 diff | **0** |
| Name44 경고 | 0 — L1 `(3,6)`은 **Soil** |

변경 타일 분포: GrassD 5 · GrassL 5 · GrassR 4 · GrassT 4 · GrassRTCorner 4 · GrassRDCorner 3 · GrassLDCorner 3 · GrassLTCorner 3 · GrassRT 3 · GrassRD/LD/LT 2 each. 전체 좌표는 `scratch/t98_water_fringe_dryrun.json`.

```
node scripts/fix_water_fringe.cjs map/map01.map
→ SAVED — L2 changes=40, outsideDiff=0
```

**스펙 이탈**: 없음. ⓐ 작업량 0(이미 홀).

## 4. 수행한 검증과 결과

- dry-run + 적용 산출 검사: outsideDiff=0 · waterWithL2=0 · 유효 15종만.
- `maker_refresh_workspace` → ok (구현자 1차)
- `maker_logs(kind="build")` → **Error 0** (1차는 Warning 17로 보고 — T75 이전). **한계**: build 로그는 `.mlua`만 보며 **`.map` jsonString 붕괴를 잡지 못함**.
- 지휘자 타일 단위 대조: L2 40셀만 변경 · L1 3,721 · Water 61 · RectTileMap3~6 diff 0 확인.
- HEAD(`d7b9479`) 실측: Entities `jsonString` **object 16 / string 0**, 줄 수 ≈69,232.
- **런타임 검증 보류(제작자 수행)** — map01 로드·물가 육안.

## 5. 발견한 문제 / 후속 제안

### LEA-3015 — `jsonString` 문자열 붕괴 (1차 커밋 사고)

- **증상**: `[LEA-3015] CannotLoad … Invalid cast from 'System.String' to 'Newtonsoft.Json.Linq.JObject' (at map/map01.map)`
- **원인**: `slot.e.jsonString = JSON.stringify(slot.js)` → `RectTileMap2`만 문자열, 파일 69,231→41,805줄.
- **위험**: 스크립트가 범용이라 town/field/boss에 재실행하면 동일 파괴.
- **수정**: `slot.e.jsonString = slot.js` + 붕괴분 `JSON.parse` 복원. 미푸시라 rewrite `d7b9479`로 흡수(⚖️ 2026-08-04 보스: 추가 amend 없음).
- **교훈**: §1.2 **규칙 16**. refresh Error=0 ≠ 맵 로드 가능. 쓰기 후 `typeof jsonString === "object"` 전수 확인.

- 나머지 3맵은 Water 0 — 페인팅 후 동일 스크립트 재실행(복구본 기준).

## 6. 제작자 체크리스트

- [ ] Play: map01 **로드 성공**(LEA-3015 없음)
- [ ] 물가 프린지 육안 (방향 에지·Corner)
- [ ] 물 8방 진입 불가
- [ ] 물가 F 낚시(T91)
- [ ] 밀착 길·광장·밭 회귀 0

## 7. 이력

- 2026-08-04 dry-run → 승인 후 적용·refresh Error=0 (구현자 — Cursor Grok 4.5)
- 2026-08-04 지휘자 검수: 산출 국소성 PASS · **jsonString 사고 반려** → `d7b9479` 복구 · 본 보고에 사고·규칙 16 소급 (지휘자 문서 커밋)
