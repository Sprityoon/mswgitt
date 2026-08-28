# 타일 스킴 (Tile Scheme) — 지형 문법 단일 소스

> ⚖️ **2026-07-08 "밀착 페어" 확정**. 지형 관련 스펙이 다른 문서와 충돌하면 **이 문서가 이긴다.**
> 이전 스킴(좁은 길 = L2 홀)은 2026-07-08 폐기 — 좁은 길은 이제 **L2가 덮인 방향 에지 페어**다(길 셀에 L2 홀 0칸).
>
> 원본 위치: 구 `docs/agents/subagent-handoff.md` §1.3.

**핵심 개념**: grass 기준 사각형 디자인 + 서브셀 흙 마스크, 밀착 페어 문법.

---

## 1. 레이어 구성 (물-흙-잔디 3단 분리 체계 — ⚖️ 2026-08-28 확정)

| 레이어 | 엔티티 이름 | SortingLayer | 내용 |
|---|---|---|---|
| Layer 0 | `RectTileMap0` | `MapLayer0` | **수면 베이스** — `Water` (연못/수로 수면). 물이 존재하는 영역에 배치 |
| Layer 1 | `RectTileMap` | `MapLayer1` | **흙 지반 & 수변 흙 프린지** — `Soil`(전면 지반) + 물과 맞닿는 경계에 `Soil*`(흙 프린지 12종). 물 중심부는 홀(None) |
| Layer 2 | `RectTileMap2` | `MapLayer2` | **잔디 커버 & 흙길 잔디 프린지** — `FullGrass`(잔디 커버) + 흙길/물 경계에 `Grass*`(잔디 프린지 12종). 물 및 흙길 중심부는 홀(None) |
| Layer 3 | `RectTileMap3` | `MapLayer3` | **설치 바닥** — (런타임 전용, tile1 / Baram_167) |
| Layer 4 | `RectTileMap4` | `MapLayer4` | **외곽 벽** — `Big Wall` 충돌 밴드 (경계 3겹)만. **잔디·프린지 금지** |
| Layer 5 | `RectTileMap5` | `MapLayer5` | **경계 테라스 비주얼** — TerraceTop 링 + 북벽 CliffFace |
| Entity | (엔티티 전용) | `Default` | 몬스터·NPC·자원·가구·드롭·플레이어 |

**물-흙-잔디 3단 분리 체계의 강력한 이점**:
1. **완벽한 다층 그라데이션**: 물(`L0 Water`) ➔ 수변 흙 프린지(`L1 Soil*`) ➔ 잔디 프린지(`L2 Grass*`)의 3단 단계형 수변 연출이 100% 자동 합성됨.
2. **흙길 끝단 수변 마감**: 잔디가 없는 흙길(길/광장)이 물과 바로 만나는 곳에서도 `L1 Soil*` 흙 프린지가 물 위로 자연스럽게 오버행되어 완벽한 부둣가/해변 형성.
3. **독립된 1축 서브셀 마스크 통일**:
   - `L1 (Soil)`: "물 vs 흙" 1축 마스크 ➔ `Soil*` 12종
   - `L2 (Grass)`: "흙 vs 잔디" 1축 마스크 ➔ `Grass*` 12종
   - 두 레이어가 완전히 독립된 2×2 서브셀 마스크(`0`~`15`)로 작동하여 충돌 및 예외 상황 원천 배제.

---

## 2. 서브셀 흙 마스크 (단일 표현)

모든 지형 문법은 **셀당 2×2 서브셀 흙 마스크 하나**로 통일한다. 접미사 방향 = **흙(길) 쪽**.

| 셀 패턴 | 타일 |
|---|---|
| 흙 0칸 | `FullGrass` |
| 인접 2칸 | `Grass{T\|D\|L\|R}` |
| 3칸 | 볼록 `Grass{LT\|RT\|LD\|RD}` |
| 1칸 | 오목 `Grass*Corner` |
| 4칸 | L2 홀 (L1 노출) |
| **대각 2칸** | `SubGrass{LTRD\|RTLD}` — 마스크 6=TL+BR→LTRD, 9=TR+BL→RTLD |

- 대각 추가(T51, 2026-07-15)로 **전 마스크 0~15가 표현 가능**해졌고, 구 `FixDiagonalMask` 승격/강등 보정은 폐기됐다.
- ※ 생성기(`build_maps.cjs`)는 대각을 산출하지 않는다 — 대각은 **런타임 편집 전용**이며, 생성기 산출 검사의 "대각 = 에러"는 자기 산출물 한정으로 유효하다.

### L2 잔디 패밀리 = 15종

`FullGrass` + `Grass{dir}` 8 + `Grass*Corner` 4 + `SubGrass` 2

판정 함수 대응:
- `IsGrassTileName` = `"FullGrass"` | prefix `"Grass"` | prefix `"SubGrass"`
- `IsGrassEdgeTileName`(방향 에지 = 길 판정)에 **`SubGrass` 포함**
- `IsSoilTileName` = 정확히 `"Soil"`

> `wall.tileset`은 2026-07-07 리네임으로 프린지가 `Soil{dir}` → **`Grass{dir}` 8종**이 됐고, `Soil*2`(구 내부 모서리)는 폐기, `Grass*Corner` 4종이 추가됐다. 2026-07-15 제작자가 대각 `SubGrass{RTLD|LTRD}` 2종을 추가했다(아트 원본 `tileimg/`).

---

## 3. 문법 1 — 길 (밀착 에지 페어, L2 홀 0칸)

셀 경계 좌표 중심선 폴리라인에서 **폭 2서브셀(시각 1셀)** 흙 밴드를 파생한다.

- 수평 길 = `GrassT | GrassD` 밀착 페어
- 수직 길 = `GrassR | GrassL` 페어
- ㄱ자 꺾임(바깥 오목 캡 + 안쪽 볼록), 막다른 끝(오목 코너 페어 캡), 길↔광장 접속은 **마스크 합집합으로 전부 자동**

## 4. 문법 2 — 광장/밭/보스 아레나 (홀 유지)

셀 사각형 + ½셀 마진.

- 내부 = L2 홀
- 둘레 잔디 셀 = 프린지 에지
- 모서리 = 오목 `Grass*Corner`
- 광장 안 잔디 섬(정원)은 island 도려냄 (같은 ½ 마진 규칙)

### ⚠️ 잔디 스트립 최소 2칸

두 흙 영역 사이 잔디가 1칸이면 **양쪽 ½마진이 겹쳐 흙으로 병합된다.** (map01 밭 고랑이 이 규칙으로 2칸을 확보했다 — 밭 A `[-23,-19]`.)

---

## 4-bis. 문법 3 — 물가 (⚖️ 2026-08-06 규칙 반전: 잔디가 물을 덮는다)

물은 광장/밭 문법(문법 2)을 **그대로 쓰면 안 된다.** 프린지가 뚫는 것은 그 타일이 놓인 **셀 자신의 L1**인데([pitfalls 규칙 19](./pitfalls.md#규칙-19-투명-프린지-타일은-그-셀-자신의-l1을-드러낸다)), 물 셀의 이웃은 L1이 `Soil`이라 연못 둘레에 **흙 후광**이 생긴다.

**문법**: 프린지를 **물 셀 안쪽**으로 넣는다.

| 대상 | 처리 |
|---|---|
| 내부 물 셀 (8이웃 전부 물) | L2 홀 유지 (마스크 15) — 온전한 물 |
| **경계 물 셀** | 마스크 15에서 **잔디로 덮인 이웃 방향의 자기 절반 비트를 제거** → 그 방향 ½셀이 잔디로 덮임. 투명 구멍으로 자기 L1 = `Water` 가 비친다 |
| 이웃 잔디 셀 | **FullGrass 유지** — 물 유래 프린지 비트를 켜지 않는다 (광장·길 유래 비트는 보존) |
| 물 셀이 광장/길 홀과 접할 때 | 덮을 잔디가 없으므로 오버행 없음 — 물과 흙이 직접 만난다 |
| 잔디 셀이 물·흙 홀에 **동시에** 접할 때 | 같은 서브셀 경합 시 **물 우선** — `(base \| otherBits) & ~waterBits`. 흙 우선이면 물에 흙 조각이 붙어 프린지가 꼬인다 (2026-08-07) |
| 사방이 잔디인 1셀 연못 | 전부 덮으면 물이 사라지므로 **홀 유지 + 경고** |

### 🔴 1×1 물은 오버행이 성립하지 않는다 — 물삽은 2×2로 판다

시뮬레이션 실측(2026-08-06):

```
1×1 파기                     2×2 파기
..|..|..|..|                 ..|..|..|..|..|
..|..|..|..|                 ..|.W|W.|..|..|
..|WW|..|..|   ← 마스크 15    ..|.W|W.|..|..|   ← 마스크 8/4/2/1
..|WW|..|..|      오버행 X    ..|..|..|..|..|      사방 잔디 오버행 ✅
```

- **1×1**: 사방이 잔디면 오버행이 셀을 전부 덮어 마스크가 0이 된다 → degenerate 가드가 홀(15)로 되돌린다 → **프린지가 아예 안 붙고 각진 물 1칸.**
- **2×2**: 각 셀이 안쪽 모서리 1서브셀씩 남겨 **중앙에 1셀 물웅덩이 + 사방 잔디 오버행**. 둘레 12셀은 전부 `FullGrass`(흙 후광 0).
- **3×3 이상**: 내부는 마스크 15(온전한 물), 테두리만 오버행.
- 연속 2×2를 인접해 파면 **정상 병합**되고 둘레에 흙 후광이 남지 않는다(실측 확인).

⚖️ 따라서 물삽 1회 = **`ResourceSpawner.WaterDigSize` = 2** 블록. 조준 셀을 항상 포함하며 바라보는 쪽으로 뻗는다(`GetWaterDigOrigin` — 서버·클라 공용). 영속 델타에는 **블록 원점**이 저장되어 재생 시 방향 없이 재현된다.

결과: 흙 후광 소멸, **잔디 둔치가 물 위로 ½셀 걸침**. 보이는 수면은 ½셀 줄지만 **L1은 건드리지 않으므로 통행 차단 범위는 불변**이다(`Water.IsCollidable = true`, 61셀 그대로).

> ⚠️ **L1 `Water` 페인팅은 제작자가 Maker에서 직접 한다.** 스크립트는 L2만 만진다 — 제작자의 페인팅을 덮어쓰지 않기 위한 경계선이다.

**구현 — 같은 규칙이 두 곳에 있다. 한쪽만 고치지 말 것.**

| 경로 | 위치 | 용도 |
|---|---|---|
| 오프라인 보정 | `scripts/fix_water_fringe.cjs` | 제작자가 Maker에서 L1 `Water`를 페인팅한 뒤 일괄 보정. 자가검사 내장(물 셀이 완전히 덮이면 실패, 범위 밖 L2 diff 0 강제) |
| **런타임** | `ResourceSpawner:RefreshWaterArea()` | 물삽 `dig_water`/`fill_water` 시 **3×3 재계산**. L1을 먼저 바꾼 뒤 호출 |

> 🔴 2026-08-06 이전에는 런타임 경로가 이 문법을 **아예 몰랐다** — `dig_water`가 `SetTile("Water")` + 마스크 15만 찍어서, 물삽으로 판 물에는 오버행이 붙지 않았다(제작자 Play 신고).

```bash
node scripts/fix_water_fringe.cjs map/map01.map --dry-run   # 검토
node scripts/fix_water_fringe.cjs map/map01.map             # 적용
```

---

## 5. 구현 위치 (코드 단일 소스)

| 대상 | 파일 | 비고 |
|---|---|---|
| 블록아웃 생성기 | `scripts/build_maps.cjs` | **헤더 주석 = 스킴 명세.** `makeDirt`(walk/plaza/island) + `cellTile`이 문법 단일 소스. 산출 검사 내장(무효 타일/길 셀 L2 홀 발견 시 즉시 실패) |
| 런타임 판정 | `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | `IsGrassTileName` / `IsGrassEdgeTileName` / `IsSoilTileName` / `ComputeGrassTileName` |
| 미니맵 | `RootDesk/MyDesk/UI/Scripts/UIMinimapController.mlua` | `TileColor` — 방향 에지·`Soil`(정확 일치) = 흙색, `FullGrass`/`Grass*Corner` = 잔디색 |
| 설계 기록 | `game_design.md` §3.5 "지형 (TileMap)" | |

### 🔴 `build_maps.cjs --force`는 손편집을 전량 덮어쓴다

`map/town.map`에는 건물 8동·NPC 7기·Trigger·WalkBehindFade·SortingLayer 패치 등 **손배치 자산이 대량**으로 들어 있고, `map01`에도 지형 편집·배치물이 있다. `--force` 재생성은 이를 전부 날린다.

- 손배치 맵의 지형 변경은 **재생성이 아니라 `MapBuilder` 손배치**로 한다.
- 생성기 재생성은 `template_field` 등 손배치가 없는 맵으로 한정한다.
- 실행 전 반드시 확인하고, 실행했다면 무엇을 덮었는지 기록한다.

### ⚠️ `AutotileGrassLayer`는 홀 문법 전용

`AutotileGrassLayer`는 **구 홀 문법 전용**이라 밀착 페어 길을 `FullGrass`로 평탄화한다. `AutotileGrassOnSetup` 기본값 **OFF를 절대 유지**할 것.

---

## 6. 자원 스폰 판정

`ResourceSpawner`의 `RequiredTile` 판정:

| 셀 상태 | 판정값 | 의미 |
|---|---|---|
| `FullGrass` · `Grass*Corner` | `"FullGrass"` | 스폰 가능 |
| 방향 에지 (`Grass{dir}` · `SubGrass`) | `"Soil"` | 길 — 잔디 요구 자원 억제 |
| L2 홀 + L1 `Soil` | `"Soil"` | 광장 바닥 |

→ `BiomeResourceDataSet.csv`의 `RequiredTile=FullGrass` 행(Tree/GrownGrass)은 그대로 유효하다. `FullGrass`/`Grass*Corner` 셀에서만 스폰하고, 길·광장 홀에서는 억제된다.

---

## 관련 문서

- 맵 파일·조작키·물리: [reference/physics-controls.md](./reference/physics-controls.md)
- 지형 편집 기능 설계: `game_design.md` §3.5 / Phase 14-A / Phase 21
- 함정 사전: [pitfalls.md](./pitfalls.md) (특히 규칙 16 — `.map` 직렬화)
