# 시작 화면 개편 — Maker 등록용 최종 PNG (2026-10-15)

`../build_final_assets.py` 가 `1_Original_HiRes_PNG` 에서 만든다. `2_MSW_TargetSize_PNG` 는 비율이 깨져 쓰지 않는다.

- 보정: 투명 여백 잘라내기 · 배경 제거 잔여 1px 헤일로 제거 · 책갈피 V홈 회색 그림자 제거.
- 크기: 실제 화면 배치 크기(1920×1080 캔버스)의 **2배**. 늘어나는 판은 이미 9-slice 로 목표 비율을 맞춰 두었으니 **Maker 에서 9-slice 경계를 설정하지 않아도 된다**(UI 는 Simple 로 쓴다).
- 일반 타이틀 버튼 판자(`mc_title_btn_plank`)는 `docs/design/art/mainmenu/wooden_menu_planks_v2.png` 의 3번째 판자를 잘라 만든다.

## 등록 → 적용

1. Maker [내 리소스] → [가져오기]로 이 폴더의 `mc_*.png` 18장을 등록한다. **파일 이름(=리소스 이름)을 바꾸지 않는다.** 피벗은 기본(중앙) 그대로.
2. `node scripts/build_mainmenu_revamp_20261015.cjs` — RootDesk 의 `mc_*.sprite` 에서 RUID 를 이름으로 모아 `ui/MainMenuGroup.ui` 와 `UIMainMenuController.tabActiveRuid/tabInactiveRuid` 에 넣는다. 미등록 이미지는 임시 색 스프라이트로 남고 목록이 출력된다.
3. Maker refresh.

| 파일 | 화면 크기 | 쓰는 곳 |
|---|---|---|
| mc_modal_parchment | 540×360 | 삭제 확인 모달 |
| mc_header_plaque | 440×112 | 캐릭터 선택·만들기 상단 현판 |
| mc_bookmark_back | 60×156 | 책 좌상단 뒤로 책갈피 |
| mc_preview_pedestal | 230×139 | 캐릭터 만들기 아바타 단상 |
| mc_input_recessed | 340×52 | 닉네임 입력(만들기·삭제 확인) |
| mc_arrow_left / mc_arrow_right | 40×40 | 외형 선택 화살표 |
| mc_title_btn_primary | 300×84 (PNG 600×168) | 타이틀 `시작하기`. 현재 배치 380×106.4, 원본 비율 유지 |
| mc_title_btn_plank | 280×80 | 타이틀 `이어하기`·`종료하기` |
| mc_slot_card | 330×140 | 캐릭터 슬롯 카드(슬롯 6 잠금 칸은 반투명) |
| mc_row_card | 330×56 | 외형 선택 행 |
| mc_tab_active / mc_tab_inactive | 190×56 | 외형 모드 라디오 탭 |
| mc_btn_olive_m | 130×44 | 슬롯 `이어하기` |
| mc_btn_olive_l | 220×56 | `+ 새 캐릭터 생성`, `모험 시작` |
| mc_btn_red_s | 70×44 | 슬롯 `삭제` |
| mc_btn_red_m / mc_btn_gray_m | 160×52 | 삭제 모달 `삭제` / `취소` |

레이아웃 확인용 오프라인 합성: `python ../preview_layout.py` → `../preview_screens/*.png` (글꼴은 근사).
