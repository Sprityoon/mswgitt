# UI 개편(ui8) — Maker 등록용 에셋

원본: 이 폴더의 `01~06`(제작자 추가 팩) + `../ui_refinement_complete_with_assets_v7/assets`(팩에 없는 탭·퀵슬롯·입력창·알약 배지만).
생성: `python -I build_ui8_assets.py` → `ui8_import/` (재실행하면 폴더를 지우고 다시 만든다).
검수: `python -I preview_ui8.py` → `ui8_preview/sliced.png`(9-slice 로 늘려 본 모습), `ui8_preview/icons_on_parchment.png`.

## 등록 (제작자)

`ui8_import/` 의 **PNG 77장**을 Maker 가져오기로 등록한다. `ui8_borders.json` 은 등록하지 않는다.
등록 뒤 Maker 저장으로 `ui8_*.sprite` 가 생기면 에이전트에게 알려 준다.

## 2차 등록 — 조각 (제작자)

`ui8_import2/` 의 **PNG 144장**(`ui8p_*`)도 같은 방법으로 등록한다.

**왜 조각인가 (2026-10-17 실측)**: Maker 로 가져온 스프라이트(`assetKind 1`)에 `asset_update_resource_storage_info` 로
9-slice 경계를 넣으면 응답은 `code 0` 이지만 버전·속성이 바뀌지 않는다(저장소 목록에도 안 나온다 — 그 API 는 MCP 업로드분 `assetKind 0` 전용).
`SpriteGUIRendererComponent` 에 경계 필드가 없고, `MaskComponent` 는 `.ui` 로드를 깨뜨린다(pitfalls #49).
크기별로 미리 굽기엔 팝업·버튼 크기가 120가지가 넘는다. → 늘어나는 판은 조각으로 잘라 앵커로 조립한다.

- `python -I build_ui8_pieces.py` → `ui8_import2/` + `ui8_pieces.json`
- 9조각(`_tl _t _tr _l _c _r _bl _b _br`): popup_frame·subpanel·dialog_frame·darkwood_filigree·fish_board·status_card
- 3조각(`_l _c _r`): 줄·버튼·탭·게이지·배지·입력창·토스트·이름표·전경 바 등 30종. 양 끝 조각은 UI 높이에 맞춰 비율대로 축소.
- 조립 미리보기: `ui8_preview/pieces_assembled.png`
- 슬롯·퀵슬롯 칸·초상화 액자·HUD 버튼·토글·아이콘은 늘리지 않으므로 1차 등록본(`ui8_*`)을 그대로 쓴다.

## 등록 뒤 (에이전트)

1. `ui8_*.sprite`·`ui8p_*.sprite` 이름으로 RUID 수집(`ui8_ruids.json`).
2. UIBuilder 스크립트로 전 화면 적용 — 조각은 부모 엔티티 아래 앵커(모서리 고정·가장자리 한 축 stretch·가운데 stretch)로 조립.

## 가공 내역

| 대상 | 처리 |
|---|---|
| HUD 게이지 4종 | 그림에 채움 양(70~90%)이 박혀 있어 색 캡슐만 분리 → `ui8_gauge_hp/mp/st/exp`. 빈 트랙은 HP 바 오른쪽 빈 구간을 대칭으로 이어 `ui8_gauge_track` |
| 낚시 진행·위험 바 | 같은 방식으로 채움만 분리(`ui8_fish_fill_amber/red`). 평상시 크림 장력은 빨강 채움을 다시 칠해 `ui8_fish_fill_cream`. 트랙은 `ui8_fish_track` |
| 팝업 프레임 | 매니페스트 경계(T52/B48)로는 네 모서리 나무 못이 늘어나는 구간에 걸려 **L44/R44/T96/B88** 로 조정 |
| 96px 아이콘 12종 | 가장자리 반투명 어두운 잔상 → 알파 임계(110)로 정리 |
| 스킬트리 가지 패널 | 하단 가지가 잘려 있고 노드 3개 배치가 고정이라 **제외**. 노드 프레임(`ui8_skill_node`)만 쓰고 연결선은 UI 에서 그린다 |
| 화로 화살표 | 빈/채움 두 장 그대로(채움은 `Filled` 가로) |
| 배낭 버튼 alt | 중복이라 제외 |

## 이름 대응

| ui8 이름 | 원본 | 9-slice |
|---|---|---|
| `ui8_popup_frame` | popup_window_parchment_frame | 44/44/96/88 |
| `ui8_subpanel`, `_tall` | parchment_subpanel_card_short/tall | 20 |
| `ui8_row`, `_sel`, `_wide`, `_wide_sel` | list_row_* | 28/28/20/20 |
| `ui8_btn_amber/oak/green/olive/red/disabled` | btn_wood_* | 24/24/22/22 |
| `ui8_btn_close/plus/minus`, `ui8_toggle_on/off` | 03 폴더 | 고정 크기 |
| `ui8_dialog_frame`, `_nameplate`, `ui8_portrait_frame` | 01 대화창 | 36 / 20·12 / 24 |
| `ui8_toast_leaf`, `ui8_darkwood_filigree`, `ui8_scroll_banner` | 01 토스트·채팅·전경 바 | 64·32 / 42 / 72·28 |
| `ui8_fish_board/track/fill_*`, `ui8_furnace_arrow_*` | 04 | 표 참고 |
| `ui8_skill_node`, `ui8_badge_left/right`, `ui8_tip_plaque` | 04 | 24·20 / 36·0 / 40·36 |
| `ui8_status_card`, `ui8_slot`, `_sel`, `_equip` | 05 | 40·80 / 40 / 44 |
| `ui8_hud_attack/jump/interact/info/craft/bag` | 05 HUD 버튼(아이콘 포함) | 고정 크기 |
| `ui8_gauge_track/hp/mp/st/exp` | 05 게이지(가공) | 높이 절반 / 0 |
| `ui8_icon_*` (21) | 06 | 고정 크기 |
| `ui8_tab_on/off`, `ui8_quick_cell`, `_sel`, `ui8_input`, `ui8_pill_badge` | v7 | 17·0 / 12 / 10 / 16·0 |
