# 자유 건축 — 설계 v2 (woodland_64 타일셋 기반)

> **2026-10-06 구현 완료 — 현행 사양은 [§10 구현](#10-구현-2026-10-06--현행-사양)이 단일 소스다.** §2~§8 중 §10 과 다른 부분(16마스크·`BuildDoorBlock`·문 오브젝트·`BuildCells`·`MapLayer5` 벽 레이어·데이터 열 구성)은 설계 단계 기록으로만 남긴다.
>
> 2026-10-05 작성. 제작자 지시: "시제품(`building_test.map`)은 폐기, 따로 설계". 이 문서가 건축의 현행 설계다.
> 이전 초안 [building-system.md](./building-system.md)의 **제작자 확정 사항**(자유 건축 · 바닥/일반 벽은 타일 · 문·작업대·가구는 오브젝트 · 영지 한정 · 벽 칸마다 엔티티 금지)과 **점유 규칙 표(§3)** 는 이어받고, 시제품·렌더 구조 미정 부분은 이 문서로 대체한다.
> 상태: **⚖️ 2026-10-05 제작자 확정 — ① 칸 안 낮은 벽 ② woodland_64 부품 재조립 ③ 세로벽 = 기둥|회벽|기둥 (남쪽 끝만 좁은 앞면)**. 1단계 아트 완료 → 제작자 Maker 등록 대기. 코드·맵·데이터 변경 없음.
>
> **1단계 아트 결과** — [`woodland_64/connect/`](./art/building/woodland_64/connect/): `compose_connect.py`(재조립, 리샘플·재채색 없음) · `BuildWood_strip.png`(1344×64, 21칸 — 순서는 `BuildWood_strip_order.txt`) · `tiles/` 개별 PNG · `mockup_room.png`(게임 배율, 키 2칸 인물 4명) · `sheet_connect.png`. 자가비평 3회: ① 세로벽 28px 가 울타리처럼 가늘고 충돌과 18px 어긋남 → 원본 r2c5~c8 구성대로 기둥|회벽|기둥 42px ② 벽 칸에 바닥이 없으면 방 안 바닥과 세로벽 사이에 잔디 띠 → **벽 칸에도 바닥(기초 테두리)** 이 낫다 — §6 "벽·문은 바닥 위" 규칙 유지 ③ 직선 벽 회벽 가운데 이음 자국 = 원본 기둥 옆 그늘 열(x14·x49~50) → 깨끗한 x16~47 두 장으로 64px 띠. 바닥 3·4번(r1c7/c8)은 색이 달라 섞으면 얼룩져 보여 1차 무작위 교대는 1·2번만 권장.
> 실제 벽 앞면 = 칸 y13~63(51px, 아랫변 = 충돌 경계), 기둥 y10~63, 세로벽 x11~52.

## 0. 한 줄 요약

**벽은 "칸 안에서 끝나는 낮은 벽" 타일 16종(4방향 이웃 마스크)으로 자동 연결**한다. 타일은 항상 캐릭터 아래에 그려도 앞뒤가 틀리지 않으므로 벽마다 오브젝트가 필요 없다. 아트는 제작자의 `woodland_64` 시트에서 부품(보·회벽·돌받침·기둥)을 잘라 **이음매가 맞는 연결 세트로 재조립**한다.

---

## 1. woodland_64 타일셋 실측 판정

`docs/design/art/building/woodland_64/tileset_64.png` (512×256, 64px × 8열 × 4행). 칸별 가장자리 알파(불투명 >127)를 실측하고, 시트 그대로 작은 방을 조립해 봤다 → [`assembly_test_asis.png`](./art/building/woodland_64/assembly_test_asis.png).

| 구분 | 실측 | 판정 |
|---|---|---|
| 1행 바닥 8종 | 전부 불투명. 단 **왼쪽·위·오른쪽 가장자리 2~3px 이 검은 테두리**(가장자리 열 밝기 15~50, 안쪽 126~185) | 그대로 깔면 칸마다 격자선 → **테두리 제거 후 사용 가능**. 나무판 6종·돌바닥 2종 |
| 2행 직선 벽 c1~c4 | 위 가장자리 전폭, 좌우 가장자리 0~57px, **아래 가장자리 투명(높이 59px)**. 모든 칸이 **양 끝에 기둥** | 이어 붙이면 **기둥이 두 개씩** 겹치고 칸 아래 5px 틈 |
| 2행 c5~c8 (세로 토막) | 폭 약 25px 섬, 좌우 가장자리에 닿지 않음 | 세로로 쌓으면 미니 벽이 층층이 쌓인 모양 — 세로벽으로 부적합 |
| 3·4행 모서리·끝단·접합 | **어느 가장자리에도 닿지 않는 섬**(여백 2~12px) | 이웃과 연결 불가 |
| 4행 문틀·창문 | 문틀은 오른쪽만 닿음, 창문은 좌우 일부 | 연결 세트에 맞춰 재조립 필요 |

**결론**: 그림체(따뜻한 목재 보 + 회벽 + 돌받침, 좌상단 광원, 64px 도트 밀도)는 잔디·화로와 잘 맞는다. 하지만 **연결 타일셋이 아니라 '완성된 벽 토막' 모음**이다. 부품은 살리고 연결 규칙에 맞게 다시 조립해야 한다(§4).

---

## 2. 렌더 구조 — "칸 안 낮은 벽" (제안)

### 2.1 왜 이 방식인가

| 방식 | 깊이감 | 캐릭터 앞뒤 | 벽당 오브젝트 | 판정 |
|---|---|---|---|---|
| A. 높은 벽(앞면 1칸 + 윗면이 북쪽 칸에 걸침) | 강함(코어키퍼) | 걸친 윗면은 **Y정렬 스프라이트** 필요 — 타일맵은 정렬값이 맵 단위라 북벽 앞 캐릭터(키 2칸) 머리가 잘림 | 벽 북쪽 칸마다 1개 | 제작자 우려(오브젝트 증가)와 충돌 → **기각** |
| **B. 칸 안 낮은 벽** | 중간(앞면 + 윗보 + 기둥 + 접지 그늘) | 벽 그림이 자기 칸 안에서 끝나므로 타일을 **항상 캐릭터 아래**에 그려도 틀리지 않음: 벽 남쪽에 선 캐릭터는 벽 위에 겹쳐 그려짐(= 앞) · 벽 북쪽에 선 캐릭터는 위로 뻗어 벽과 안 겹침 | **0** | **채택 제안** |

- 시각 높이 ≈ 0.9칸(앞면) — 플레이어(키 2칸)의 허리~가슴 높이 "울타리형 벽". woodland_64 벽 토막 자체가 이 비율(높이 59px)로 그려져 있어 그림체와도 맞다.
- 벽 북쪽 칸에 선 캐릭터의 발이 벽 윗보 바로 위에 보이는 것은 "벽 뒤에 서 있음"으로 읽힌다(가림은 없음). 이 한계는 B안의 대가다.

### 2.2 레이어 (영지 템플릿 `map/map01.map` 만)

| 레이어 | 엔티티 | 정렬 | 내용 | 충돌 |
|---|---|---|---|---|
| 건축 바닥 | 기존 `RectTileMap3` | `MapLayer3` | `BuildWoodFloor*` | 통행 |
| **건축 벽 (신규)** | `RectTileMap7` | `MapLayer5` · `OrderInLayer 1` (엔티티 최소값 2 아래, 지형 위 — `RectTileMap5` 테라스와 같은 방식) | `BuildWoodWall00~15`, `BuildDoorBlock`, 접지 그늘 | 벽·문막이 차단 / 그늘 통행 |

- 두 레이어 모두 **`wall.tileset`**(맵의 기존 타일셋). 기존 `Wood Floor` 가 `tile1.tileset` 의 `Baram_167` 을 가리켜 `RectTileMap3`(wall.tileset)에 안 그려지던 불일치도 새 바닥 타일을 wall.tileset 에 등록하면서 해소한다.
- 신규 레이어는 **맵 파일 안의 일반 타일맵 엔티티**로 만든다(기존 `RectTileMap3` 구조 복제, MapBuilder). 사용자 `.model` 안에 타일맵을 넣지 않는다 — 폐기된 시제품이 그 구조에서 `LEA-3035` 6건을 냈다.
- `MapleMapLayer` 쌍·`displayOrder` 인접(pitfalls 규칙 40)은 `RectTileMap0`·`RectTileMap6` 처럼 기존 레이어를 공유하는 후발 타일맵 선례를 따르고, Maker 레이어 트리에서 `Invalid layer` 가 없는지 제작자 확인을 완료 조건에 넣는다.

---

## 3. 벽 자동 연결

> ⚖️ **2026-10-05 개정 3 — 스타듀풍 실내 문법 + 내벽/외벽** (제작자 레퍼런스: 실내 평면 — 트림으로 두른 방, 검은 벽 덩어리, 키 큰 뒷벽). 개정 2 의 "윗면 1타일 + 앞면 1타일"을 아래로 **대체**:
> - **윗면 칸**(남쪽도 벽): 2×2 전체가 어두운 윗면. 북·동·서 변 중 윗면이 아닌 칸(빈 칸·앞면 칸)과 맞닿은 변에 트림 12px. 두께 2칸 ㄱ자 안쪽은 모서리 조각.
> - **앞면 칸**(남쪽이 빔): 2×2 전체가 앞면 = 플레이어 키 높이(레퍼런스 뒷벽 비율). 맨 위 12px 트림 고정. **남쪽 칸에 건축 바닥이 있으면 내벽, 없으면 외벽** — 방 북벽은 벽지, 집 남벽은 바깥에서 보이는 외벽이 자동으로 갈린다(바닥 종류에 실외 데크가 생기면 데이터 열로 예외 처리).
> - 고유 타일 20장(윗면 8 · 내벽 앞면 6 · 외벽 앞면 6) + 문 2×2 캔버스 4(내·외 × 닫힘·열림) + 창 2 + 바닥 4. 문·창은 양옆이 벽인 가로벽 칸만.
> - 앞면 띠(칸 기준 y): 트림 0~11 · 그늘 12~15 · 주 벽면 16~83 · 레일 84~89 · 하단 90~119 · 걸레받이 120~127.
> - 칠하기용 템플릿·규칙서·조립 검증: [`art/building/wall_template_2x2/`](./art/building/wall_template_2x2/) (`template_blank.png` 를 질감 작업자에게 넘김 — 재질 한 벌 = 칠한 시트 한 장).

> ⚖️ **2026-10-05 개정 2 — 배치 한 칸 = 64px 타일 2×2** (제작자: "2x2방식이니까 64px 타일을 4개씩 한칸을 구성"). 벽 한 칸 = 타일 4장:
> - **위 2장(TL·TR) = 윗면**, **아래 2장(BL·BR) = 남쪽 칸이 비면 앞면 / 벽이면 윗면**. 벽 높이 = 윗면 1타일 + 앞면 1타일 = 2유닛 = 플레이어 키 (코어키퍼 비례), 그림이 자기 칸(2×2) 안에서 끝나므로 타일을 캐릭터 아래에 그려도 앞뒤 정합 — 개체 0개 유지.
> - 사분면마다 자기 모서리 쪽 이웃 칸 3개(세로·가로·대각)만 봄 → 윗면 사분면 5상태(바깥 모서리·가로 변·세로 변·안쪽 모서리·채움), 앞면 3종(가운데·왼끝·오른끝). **고유 타일 13장**으로 8방향 47조합 전부 표현 — ㄱ자·T·십자·안쪽 꺾임·2×2 벽 덩어리·외딴 벽 자동 해결.
> - 개념 검증: [`art/building/wall_2x2_concept/`](./art/building/wall_2x2_concept/) (`concept.py` + `concept_mockup.png`, 임시 그림 — 윗면 = 코드로 그린 짙은 판, 앞면 = woodland 벽면 띠). 사각형 방·T자 칸막이·문 구멍·2×2 벽 덩어리·외딴 벽 모두 정합 확인, 사용 타일 13종.
> - 함의: 벽·바닥 칸은 **짝수 격자 정렬**(2타일 격자)로 놓아야 이웃이 반 칸 어긋나지 않음 · 벽 칸의 타일 4장 모두 충돌 · 설치/철거 시 주변 3×3 칸(최대 36타일) 재계산 · 문은 2×2 오브젝트(기존 가구 2×2 점유와 같은 규격).
> - 아래 16마스크 단일 타일 방식(개정 1 포함)은 이 방식으로 **대체**. `wall_connections_64` 의 앞면 그림은 앞면 3종 재료로 재사용 후보.

> ⚖️ **2026-10-05 개정 — 코어키퍼 벽 문법** (제작자 제공 인게임 스크린샷 분석). 벽은 "완성된 벽 토막(기둥+보+회벽)"을 이어 붙이는 게 아니라 **두 층**이다: ① **윗면** = 벽 칸을 덮는 거의 검은 평면, 벽끼리 붙은 변은 경계 없이 이어지고 **빈 칸과 맞닿은 변에만** 얇은 밝은 테두리 → ㄱ자·T자·십자가 자동으로 해결 ② **앞면** = **남쪽이 빈 벽 칸에만** 윗면 아래(칸 아래 약 55%)에 벽면+걸레받이. 남쪽이 벽이면 칸 전체가 윗면. 마스크(N1 E2 S4 W8) 16종은 그대로, 각 칸 그림 규칙만 바뀐다. 아래 §3.2(기둥·보 방식)와 §4(woodland 부품 재조립)는 이 개정으로 **대체**. 생성 프롬프트: [`art/building/wall_tileset_prompt_ck.md`](./art/building/wall_tileset_prompt_ck.md).

### 3.1 마스크

이웃 **벽 또는 문** 여부로 `N=1, E=2, S=4, W=8` → 0~15. 타일 이름 = 데이터의 접두어 + 두 자리 마스크(`BuildWoodWall05`). 설치·철거 시 **자기 + 상하좌우 4칸**만 다시 계산한다(대각선 불필요).

### 3.2 마스크별 그림 규칙 (낮은 벽 문법)

| 조건 | 그림 |
|---|---|
| S 없음 (벽의 남쪽 끝) | **앞면**: 윗보(약 14px) + 회벽(약 26px) + 돌받침(약 14px), 칸 아래 가장자리까지 |
| S 있음 (벽이 남쪽으로 이어짐) | 앞면 대신 **위에서 본 세로 보**(가운데 약 24px 폭 목재)가 칸 아래 가장자리까지 → 남쪽 칸의 보와 이어짐 |
| N 있음 | 세로 보가 칸 위 가장자리까지 |
| E·W 있음 | 앞면/윗보가 그 쪽 가장자리까지 끊김 없이 (기둥 없음) |
| E·W 없음 | 그 쪽 끝에 **끝 기둥** |
| 꺾임·T·십자(가로+세로 동시) | 교차점에 **기둥 하나** (중복 기둥 금지) |
| 0 (외딴 칸) | 양 끝 기둥 짧은 벽 토막 (woodland r4c4 토막과 같은 인상) |

- 세로벽은 "기둥 + 세로 보" 로 얇게 읽히고 남쪽 끝에서만 앞면을 드러낸다 → 방 안에서 북벽은 앞면, 좌우벽은 보, 남벽은 (방 쪽에서 보면) 윗보 + 바깥 앞면.
- 칸 경계 정합: 가로로 이어지는 행(윗보·회벽·돌받침)은 **64px 주기로 무늬가 이어지게**, 세로 보는 칸 위·아래 가장자리 4px 단면을 모든 마스크에서 픽셀 동일하게.

### 3.3 문·창문

- **문**: 상호작용 오브젝트 `Build_WoodDoor`(모델 1개, 열림/닫힘 2스프라이트, Y정렬 — 기존 가구 파이프라인). 마스크 계산에서는 **벽으로 취급**(양옆 벽이 문 쪽으로 끊김 없이 이어짐). 닫힘 = 문 칸 벽 레이어에 투명 충돌 타일 `BuildDoorBlock`, 열림 = 제거. 닫을 때 그 칸에 플레이어가 있으면 거부.
- **창문**: 1차 제외. 2차에 같은 마스크의 외관 변형(벽 아이템을 창문 벽으로 교체)으로 데이터만 추가.

### 3.4 접지 그늘 (2차, 선택)

앞면 남쪽 칸 위 가장자리 반투명 그늘 1종. 벽 레이어의 빈 칸에 비충돌 타일로. 1차는 생략하고 Play 인상 확인 후 결정.

---

## 4. 아트 제작안 — woodland_64 재조립

제작자 그림을 다시 그리지 않고 **부품만 잘라 연결 세트로 재조립**한다(코드 합성, 리샘플·색 변경 없음).

| 부품 | 원본 위치 | 쓰임 |
|---|---|---|
| 가로 앞면(윗보·회벽·돌받침) | r2c2~c3 의 기둥 사이 가운데 구간 | 64px 반복 띠로 이어 붙임 |
| 끝 기둥 | r2c1 왼쪽 / r2c4 오른쪽 기둥 | E·W 끝 |
| 교차 기둥 | r4c5 가운데 기둥 | 꺾임·T·십자 |
| 세로 보(위에서 본 목재) | 윗보 질감을 90° 회전 + 광원 보정 | S·N 연결 |
| 바닥 6+2종 | r1 전부, **가장자리 2~3px 테두리를 안쪽 질감으로 대체** | `BuildWoodFloor` + 변형(무작위 교대 — `TileVariantDataSet` 재사용) |

산출: `docs/design/art/building/woodland_64/connect/` — 벽 16장 + 문막이 1장 + 바닥, **등록용 한 줄 스트립 PNG**(지난번 둥근 프린지와 같은 방식), 잔디 위 방 목업(플레이어 키 2칸 실루엣 포함, 게임 배율), 합성 스크립트. 자가비평 2회 이상 후 제작자 승인 → Maker 등록.

---

## 5. 데이터 (전부 데이터셋 — 코드에 아이템 이름 분기 없음)

| 데이터 | 내용 |
|---|---|
| `item_dataset` | `Wood Workbench`(가구) · `Wood Floor`(**기존 키 유지**, 타일만 교체) · `Wood Wall` · `Wood Door` |
| **`BuildPieceDataSet` (신규)** | `ItemName, Kind(floor/wall/door), TilePrefix, DoorModel, Refund` — 예: `Wood Wall, wall, BuildWoodWall` |
| **`BuildRecipeDataSet` (신규)** | 작업대 레시피. `RecipeDataSet` 과 같은 열 + `OutputCount`. 제안 수치(제작자 조정): 작업대 Wood 8+Stone 2(일반 제작) · 바닥 Wood 1→4 · 벽 Wood 1→1 · 문 Wood 3→1 |

`RecipeDataSet` 의 기존 `Wood Floor` 행은 1차에 유지(작업대 레시피로 옮길지는 제작자 결정).

## 6. 점유·배치·철거

- **지면/설치물 분리**: 새 레지스트리 `BuildCells[map]["x_y"] = { floor = 아이템, top = 아이템, kind, open }`. 기존 `GridToEntity` 는 가구·자원용 그대로 두고, **바닥은 GridToEntity 를 차지하지 않는다**(이전 초안이 찾은 "바닥 위 가구 거부" 문제 해소). 벽·문은 GridToEntity 에도 점유 표시(자원 리스폰·가구 배치 차단).
- 배치 규칙(이전 초안 §3 표 그대로): 바닥 = 빈 건조 지면만 · 벽/문 = 바닥 위 빈 칸만 · 가구 = 바닥 위 허용, 벽/문과 겹침 불가 · 바닥 철거는 위에 무엇이 있으면 거부.
- 진입: 기존 배치 모드(인벤토리 아이템 선택 → Ctrl 바라보는 칸) 재사용. `PlayerInventory.ServerRequestPlace` 에 `BuildPieceDataSet` 행이 있는 아이템 분기 하나 추가 → `_ResourceSpawner:PlaceBuildPiece(...)`. 크로스 스크립트 기존 메서드 인자 수는 바꾸지 않는다(규칙 46).
- 철거: 기존 도구 타격 철거(`TileDurabilityManager`) 흐름에 건축 칸 판정 추가 → 아이템 반환 → 주변 4칸 재계산. 문은 가구 철거 흐름.
- 권한: 영지 소유자만(서버 검사, 기존 영지 권한 규약).

## 7. 저장·복원

- 영지 세이브에 **새 필드 `homeBuild`**: `{"v":1,"cells":[{"x":0,"y":0,"f":"Wood Floor","t":"Wood Wall"},{"x":3,"y":-2,"f":"Wood Floor","t":"Wood Door","o":false}]}`. 논리 요소(아이템 키·좌표·문 상태)만 저장하고 타일 이름·마스크는 저장하지 않는다(복원 때 다시 계산).
- 기존 `homeTiles` 의 `Wood Floor`(`Baram_167`) 기록은 첫 로드 때 `homeBuild` 바닥으로 이관하고 `homeTiles` 에서 뺀다(세이브 초기화 없음).
- 복원 순서: 논리 로드 → 점유 등록 → 바닥 칠 → 벽 마스크 일괄 계산·칠 → 문 스폰 → 문막이 타일. 저장 경로에 Yield 추가 없음(규칙 9).

## 8. 구현 단계와 검증

| 단계 | 내용 | AI 검증 | 제작자 Play |
|---|---|---|---|
| 1 아트 | §4 재조립 → 목업 → 승인 → **제작자 등록** | 이음매·마스크 픽셀 검사, 목업 | 그림체 승인 |
| 2 레이어·데이터 | map01 `RectTileMap7`, 데이터셋 3종 | MapBuilder 검사, refresh, build | Maker 레이어 트리 `Invalid layer` 없음 |
| 3 설치/철거/연결 | `PlaceBuildPiece`/`RemoveBuildPiece`/`RefreshWallMask` + 배치 분기 | LSP·refresh·build | 방 짓기, 세로·가로·꺾임·T 모양, 벽 앞뒤 서 보기 |
| 4 문 | 모델 + F 개폐 + 문막이 | 〃 | 출입, 닫힘 거부 |
| 5 작업대 | 모델 + `BuildRecipeDataSet` 제작 창(기존 제작 창 재사용) | 〃 | 제작 → 설치 흐름 |
| 6 저장 | `homeBuild` 저장·복원·이관 | 〃 | 재접속 후 동일, 바닥 위 가구 유지 |
| 7 성능 | 벽 100/500칸 시험 배치 | — | 입장 시간·이동 프레임 |

## 9. 제작자 결정 필요

1. **렌더 구조 B(칸 안 낮은 벽)** 로 확정할지 — 벽 오브젝트 0개 대신 키 큰 벽의 가림 연출은 없다.
2. **아트를 woodland_64 부품 재조립**으로 진행할지 (다시 생성하지 않음).
3. 세로벽 모양 = "기둥 + 위에서 본 세로 보" (남쪽 끝만 앞면) 로 갈지.

---

## 10. 구현 (2026-10-06) — 현행 사양

제작자 지시: "'건축 테이블'을 이용해서 건축 — 일정한 건물 양식을 주고 '기본형' 건물을 먼저 지을 수 있는 형태, 이후 수정은 플레이어의 몫". 벽 문법은 §3 개정 3(스타듀풍 2×2, 내벽/외벽) 그대로다.

### 10.1 구성

| 구분 | 파일 | 내용 |
|---|---|---|
| 서버 상태·문법 | `RootDesk/MyDesk/Building/Scripts/BuildingManager.mlua` (`@Logic`, `_BuildingManager`) | 칸 상태(맵별) · 벽 문법 `ComputeQuadrants` · 설치 `PlaceBuildItem`/`ValidatePlan` · 철거 `HitBuildUnit`/`TryHitFloor` · 문 `ToggleDoorAt` · 저장 `GetBuildJson`/`SetBuildJson`/`RestoreForMap` · 조준 `GetAimUnit` · 미리보기 판정 `CheckPlanClient` |
| 건축 테이블 | `RootDesk/MyDesk/Building/Scripts/BuildingTable.mlua` (`@Component`) + `RootDesk/MyDesk/Furniture/Models/Furniture_BuildingTable.model` | F(조준 게이트) → 제작 창을 건축 모드로 연다. 모델 = 조리 냄비 모델 복제, `script.Furnace` → `script.BuildingTable`, 공식 목공 작업대 `877cf45e82074a698ca6e04c32f26aef`, Scale 1.2, Trigger 1.64×0.99 (오프셋 0.22, −0.215) = 그림 전체 |
| 데이터 | `RootDesk/MyDesk/Building/DataSets/` `BuildPieceDataSet`(ItemName·Kind·Style·Hits) · `BuildRecipeDataSet`(RecipeDataSet 열 + OutputCount) · `BlueprintDataSet`(BlueprintName·Layout·WallItem·FloorItem·DoorItem·WindowItem) | 아이템 이름 분기 없음 — 부품 종류·타일 접두어·타격 수·설계도 모양이 전부 데이터 |
| 아이템 | `item_dataset` 6행 | `Building Table`(furniture, HomeOnly) · `Basic Cabin Blueprint` · `Cabin Wall` · `Cabin Floor` · `Cabin Door` · `Cabin Window` (전부 Category `build`, HomeOnly). 드롭 모델은 범용 `Item_Wood`(아이콘은 itemreact 가 IconRUID 로 덮음) |
| 제작법 | `RecipeDataSet` 1행 / `BuildRecipeDataSet` 5행 | 건축 테이블 = 나무 15 + 돌 5 (일반 제작 창) · 설계도 = 나무 50 + 돌 10 · 벽 = 나무 2 · 바닥 2장 = 나무 1 · 문 = 나무 6 · 창문 = 나무 3 + 돌 1 |
| 맵 | `map/map01.map` `RectTileMap7` | 구조물 레이어. `MapLayer4`(바닥 위·엔티티 아래), z 994, displayOrder 33(맨 뒤 — 기존 `MapleMapLayer`↔`RectTileMap` 인접 쌍 유지, 규칙 40), wall.tileset. 모든 영지(`Home_<UserId>`)가 map01 복제라 전부 적용 |

수정한 기존 스크립트(인자 수 변경 없음 — 규칙 46): `PlayerController`(설치 요청·미리보기 `UpdateBuildPreview`·바닥 타격·문 `FindAimedBuildDoor`/`ServerRequestToggleBuildDoor`·상호작용 목록 3곳에 `script.BuildingTable`) · `PlayerInventory`(`ServerRequestPlace` 건축 분기·`ServerRequestBuildCraft`·`AutoSlotCraftedItem`) · `ResourceSpawner`(`IsGridOccupied`·청크 스폰·청크 정리·리스폰) · `TileDurabilityManager`(`isBuild` 분기) · `PersistenceManager`(`homeBuild` 저장·복원·초기화) · `ObstacleQuery`(`IsBuildWallAt`) · `UICraftingController`(건축 모드 `OpenBuild`) · `UIInventoryController`·`UICollectionController`(`build` 분류).

### 10.2 플레이 흐름

1. 제작 창(C) → 가구 → **건축 테이블** 제작 → 퀵슬롯 자동 등록 → 영지에서 Ctrl 설치(기존 가구 흐름, 2×2).
2. 테이블을 바라보고 **F** → 같은 제작 창이 건축 모드로 열린다(탭: 설계도 / 건축 부품). 서버는 테이블 트리거 박스 가장자리 3.0 이내인지 다시 잰다(`IsNearBuildingTable`).
3. **기본형 오두막 설계도**를 들면 집 전체(6×5칸 = 12×10셀) 외곽이 초록/빨강으로 미리보인다. **위쪽을 바라보고** Ctrl → 문 칸 = 바로 앞 칸, 집은 북쪽으로 펼쳐진다. 설계도 1장이 벽 16 · 창문 1 · 문 1 · 바닥 12칸을 한 번에 놓는다.
   ```
   ##W###   ← 북쪽 (내벽: 남쪽이 바닥)
   #ffff#
   #ffff#
   #ffff#
   ##D###   ← 남쪽 (외벽), D = 설치 기준 칸
   ```
4. **수정은 플레이어 몫**: 아무 칸이나 Ctrl 로 쳐서 철거(벽 3번 · 바닥/문/창문 2번, 10초 멈추면 처음부터) → 그 부품 아이템 1개가 칸 가운데 떨어진다 → 테이블에서 만든 부품이나 주운 부품을 원하는 칸에 다시 놓는다. 벽 모양(윗면/앞면·내벽/외벽·끝 트림)은 이웃 3×3 칸을 보고 자동으로 다시 칠해진다.
5. **문**: 바라보고 F → 열기/닫기(가이드 라벨 "[F] 문 열기 / 문 닫기", 손님도 가능). 닫을 때 문 칸(±0.3)에 사람이 있으면 거부.

### 10.3 규칙

- **칸** = 2×2 셀, 짝수 격자 정렬. 칸 (ux, uy) = 셀 x 2ux..2ux+1, y 2uy..2uy+1.
- **조준 칸** `GetAimUnit`(미리보기·설치 요청 공용 — 규칙 18): 바라보는 축으로 발에서 `AimClearance` 0.35 이상 떨어진 첫 칸(몸과 겹치는 칸을 고르지 않음), 바라보지 않는 축은 발이 선 칸. 서버는 발 ↔ 칸 사각형 거리 `PlaceReach` 2.8 이내만 받는다.
- **설치 검증** `ValidatePlan`(서버): 칸이 비었음 · 4셀 모두 영지 경계 안(`IsInsidePlayable`) · 땅 있음(L1/L2) · 물 아님 · `GridToEntity` 빈 셀(나무·돌·가구·설치 타일 없음) · 바닥 레이어 빈 셀(밭·나무 바닥 타일 없음) · 구조물이면 그 칸에 사람 없음 · **문·창문 단품은 남쪽이 구조물이 아닌 자리만**(윗면 자리에 문·창 그림이 서는 것 방지). 거부 사유는 화면 안내로 보낸다.
- **점유**: 구조물(벽·문·창문) 4셀은 `GridToEntity` 에 `isBuild` 로 등록(피벗 = 칸 원점 셀) → 가구·자원·지형 편집이 점유로 보고, Ctrl 타격은 `TileDurabilityManager.HitResource` → `HitBuildUnit` 으로 온다. **바닥은 등록하지 않는다**(위에 가구를 놓아야 함) — `IsBuildCell` 로 자원 스폰·리스폰·지형 편집을 따로 막고, 바닥 타격은 `PlayerController.RequestMine` 에서 `TryHitFloor` 로 받는다.
- **자원 리스폰**: 건축 칸에서 2셀(`RespawnClearRadius`) 이내의 파괴 자원 기록은 다시 자라지 않고 지운다(여러 칸짜리 나무가 벽을 뚫고 자라는 것 방지). 로그인 직후 스폰된 자원이 집 칸에 걸치면 복원 때 걷어낸다(`ClearResourcesInUnit`).
- **렌더·충돌**: 구조물 = `RectTileMap7`(전부 `IsCollidable`), 바닥·**열린 문** = `RectTileMap3`(통행). 문을 열면 문 타일 4장을 바닥 레이어로 옮겨 칠한다. 걷기는 엔진 타일 충돌이, 대시·넉백 같은 순간이동은 `ObstacleQuery.IsBuildWallAt` 이 막는다.
- **바닥 무늬**: `floor1..4` 를 셀 해시(`ResourceSpawner:TileVariantHash`)로 고른다 — 재접속해도 같은 무늬.
- **저장**: 영지 세이브 새 필드 `homeBuild` = `[{x, y, i, o}]`(칸 좌표 · 부품 아이템 이름 · 문 열림). 타일 이름은 저장하지 않고 복원 때 다시 계산. 복원 = `PersistenceManager` 로드에서 `ReconstructWorldPlacementsForMap` 다음 `RestoreForMap`(이전 흔적 전부 제거 → 자원 걷기 → 점유 → 칠하기). 새 캐릭터·새 슬롯은 빈 목록. 저장 경로에 Yield 없음(규칙 9).

### 10.4 타일 등록 (제작자 작업 — 이것이 끝나야 집이 보인다)

- 자료: [`art/building/wall_template_2x2/register/`](./art/building/wall_template_2x2/register/) — `Cabin_strip.png`(48칸, 3072×64) · `cabin-tiles.json`(순서·이름·IsCollidable) · `Cabin_strip_labeled.png`(확인용) · `tiles/Cabin_*.png`(낱장) · `README.md`(절차). 생성 스크립트 `export_cabin_tiles.py`(원본 = `template_painted_v2_snapped.png`).
- `wall.tileset` 에 순서대로 추가하고 **이름을 `cabin-tiles.json` 의 name 그대로**(`Cabin_top_fill` 등), `IsCollidable` 을 표대로: 윗면 8 · 앞면 12 · 닫힌 문 8 · 창문 8 = **true**, 열린 문 8 · 바닥 4 = **false**.
- 타일 이름 규약: `<Style>_<키>` (Style = `BuildPieceDataSet.Style` = `Cabin`). 새 재질 세트는 같은 48개 키로 다른 Style 을 등록하고 부품 행을 추가하면 코드 수정 없이 늘어난다.
- 미등록이면 서버 로그 `[BUILD] tile missing in tileset: <이름>` 이 이름마다 한 번 남고 그 칸이 보이지 않는다(충돌도 없음).

### 10.5 검증 범위 (2026-10-06)

- 정적: 수정·신규 `.mlua` 11개 LSP Error 0 · `check_dataset_columns.cjs` 불일치 0(새 테이블은 이름을 프로퍼티로 받아 자동 추적 밖 → CSV 헤더와 수동 대조 완료) · CSV 열 수 검사(item_dataset 125행 × 50열) · 새 `.codeblock` 2개 생성.
- 맵: `RectTileMap7` 추가 전·후 구조 비교 — 의미 변경 0(숫자 표기 `0.0`→`0` 정규화뿐). 백업 `scratch/map01-before-buildlayer-20261005.map`.
- 문법 교차 검증: `export_cabin_tiles.py` 가 `ComputeQuadrants` 를 한 줄씩 옮겨 `BlueprintDataSet` 기본형 오두막(문 닫힘·열림)과 확장 예시를 조립 → `register/verify_basic_cabin*.png` · `verify_cabin_extended.png`. 쓰인 타일이 모두 등록 목록 안(24종).
- Maker: refresh ok. 최종 build **10-06 02:25:03**(마지막 `.mlua` 저장 02:25:02 직후 — 타임스탬프 일치) Error 0 · Warning 9(10-05 20:02 부터 있던 `LWA-4012` 몬스터 계열) · Info 857. 모델·맵 refresh(02:15) 뒤 normal 로그 0건.
- 코드 리뷰 보완 2건: ① 기존 설치 바닥 타일(`Wood Floor` 등 PlacedTileName 아이템)을 건축 칸에 놓으면 같은 `RectTileMap3` 의 건축 바닥을 덮어쓰던 경로 차단(`PlayerInventory.ServerRequestPlace`) ② 바닥 칸 4셀 중 하나라도 가구·자원 점유가 있으면 바닥 철거 거부(`TryHitFloor`, §6 규칙).
- **런타임 검증 보류(제작자 수행)** — Play 체크리스트:
  1. Maker 레이어 트리에 `RectTileMap7` 이 `Invalid layer` 없이 보이는지(규칙 40).
  2. 타일 등록 후 영지: 건축 테이블 제작·설치 → F → 건축 탭 → 설계도 제작 → 미리보기 초록 → 설치 → 집 모양이 `verify_basic_cabin.png` 와 같은지.
  3. 벽을 통과할 수 없고 문을 열면 지나갈 수 있는지 · 대시로 벽을 넘지 못하는지 · 문 칸에 서서 닫기 거부.
  4. 벽·바닥·창 철거 → 부품 드롭 → 다른 칸에 재설치 → 주변 벽 모양 자동 갱신.
  5. 집 안 바닥에 가구 설치 가능 · 집 칸에 나무가 자라지 않음 · 재접속 후 집·문 상태 동일.
  6. 로그 `[BUILD] placed / hit / demolished / door / restored`, `tile missing` 없음.

### 10.6 알려진 한계 · 다음 후보

- 열린 문을 지나갈 때 캐릭터가 문틀(상인방) 위에 그려진다(타일은 항상 캐릭터 아래 — §2 B안의 대가).
- 미리보기는 외곽 사각형 1장(벽/바닥 구분 없음). 판정은 클라 근사라 드물게 서버가 거부할 수 있다(안내 문구로 사유 표시).
- 아이템 아이콘은 공식 리소스 임시값 — `register/icons/` 4장을 등록하면 `item_dataset.IconRUID` 교체.
- 작업대 그림이 2×2 점유 칸보다 오른쪽으로 약 0.26칸 치우친다(공식 스프라이트 피벗). 거슬리면 자식 엔티티 오프셋 또는 다른 작업대 그림으로 교체.
- 문·창문 칸에는 끝 트림이 없다(캔버스 그대로) · 벽 위에 동물·펫이 갇히는 경우는 검사하지 않는다(사람만).
