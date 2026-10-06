# Cabin 건축 타일 등록 (wall.tileset)

건축 시스템 구현 사양: [building-system-v2.md §10](../../../../building-system-v2.md). 이 폴더는 `export_cabin_tiles.py` 가 `template_painted_v2_snapped.png` 에서 만든다(다시 만들 때: `python export_cabin_tiles.py`).

## 1. 등록 절차

1. Maker 에서 `RootDesk/MyDesk/wall.tileset` 을 열고 `Cabin_grid.png`(64px 타일 8열 × 6행 = 512×384, 슬라이스 한도 2048 이내)를 **행 우선(왼→오, 위→아래) 순서대로** 타일로 추가한다. 기존 213칸 뒤(214번째부터)에 붙는다.
2. 각 타일의 **이름**과 **IsCollidable** 을 아래 표(= `cabin-tiles.json`)대로 정한다. 이름은 코드가 그대로 찾으므로 글자 하나도 다르면 그 칸이 보이지 않는다.
3. 저장 → (AI) refresh. Play 중 서버 로그에 `[BUILD] tile missing in tileset: <이름>` 이 보이면 그 이름이 빠졌거나 틀린 것이다.

| 순번 | 이름 | IsCollidable | 칠하는 레이어 |
|:--:|---|:--:|---|
| 00–07 | `Cabin_top_outer_TL` · `Cabin_top_edge_T` · `Cabin_top_outer_TR` · `Cabin_top_edge_L` · `Cabin_top_fill` · `Cabin_top_edge_R` · `Cabin_top_nub_TL` · `Cabin_top_nub_TR` | true | RectTileMap7 |
| 08–13 | `Cabin_face_INT_U_L` · `_U_M` · `_U_R` · `Cabin_face_INT_D_L` · `_D_M` · `_D_R` | true | RectTileMap7 |
| 14–19 | `Cabin_face_EXT_U_L` · `_U_M` · `_U_R` · `Cabin_face_EXT_D_L` · `_D_M` · `_D_R` | true | RectTileMap7 |
| 20–23 | `Cabin_door_INT_closed_TL` · `_TR` · `_BL` · `_BR` | true | RectTileMap7 |
| 24–27 | `Cabin_door_INT_open_TL` · `_TR` · `_BL` · `_BR` | **false** | RectTileMap3 |
| 28–31 | `Cabin_door_EXT_closed_TL` · `_TR` · `_BL` · `_BR` | true | RectTileMap7 |
| 32–35 | `Cabin_door_EXT_open_TL` · `_TR` · `_BL` · `_BR` | **false** | RectTileMap3 |
| 36–39 | `Cabin_window_INT_TL` · `_TR` · `_BL` · `_BR` | true | RectTileMap7 |
| 40–43 | `Cabin_window_EXT_TL` · `_TR` · `_BL` · `_BR` | true | RectTileMap7 |
| 44–47 | `Cabin_floor1` · `Cabin_floor2` · `Cabin_floor3` · `Cabin_floor4` | **false** | RectTileMap3 |

`_U_M` 처럼 줄인 칸은 앞의 접두어를 이어 붙인 이름이다(예: 09 = `Cabin_face_INT_U_M`). 정확한 전체 이름은 `cabin-tiles.json` 과 `Cabin_strip_labeled.png` 에 있다.

## 2. 파일

| 파일 | 내용 |
|---|---|
| `Cabin_grid.png` | **등록용** 8×6 격자 (512×384). 순번 = 행 우선 |
| `Cabin_strip.png` | 가로 한 줄 스트립 (3072×64) — 슬라이스 한도 초과, 참고용 |
| `cabin-tiles.json` | 순번 · 이름 · IsCollidable · 칠하는 레이어 · 원본 시트 칸 |
| `Cabin_strip_labeled.png` | 이름표·충돌 띠(빨강 = 막힘, 초록 = 통행)를 단 확인용 |
| `tiles/Cabin_*.png` | 낱장 48개 (개별 등록·교체용) |
| `icons/icon_cabin_*.png` | 아이템 아이콘 후보 128×128 (벽·바닥·문·창문). 등록하면 `item_dataset.IconRUID` 를 바꾼다 — 지금은 공식 리소스 임시값 |
| `verify_basic_cabin.png` · `verify_basic_cabin_dooropen.png` · `verify_cabin_extended.png` | 런타임 문법(`BuildingManager.ComputeQuadrants`)을 그대로 옮긴 조립 결과 — Play 화면과 같은 모양이어야 한다 |
