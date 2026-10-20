# 메이플스토리 월드(MSW) 커스텀 UI 투명 PNG 에셋 매니페스트 (`ASSET_MANIFEST.md`)

본 패키지는 **메이플스토리 월드(MapleStory Worlds) 기본 리소스에는 없는 크래프팅·생존·영지·낚시·도감 RPG 전용 UI 에셋 71종**을 투명 배경(`RGBA`)으로 개별 슬라이싱해 정리한 에셋 팩입니다. 모든 에셋은 내부 텍스트가 없는 블랭크(Blank) 상태이므로 MSW의 `SpriteGUIRendererComponent`와 `TextComponent`를 조합해 즉시 적용할 수 있습니다.

## 1. `01_dialog_and_chat_assets/` — NPC 대화창 · 퀘스트 토스트 · 채팅창 · 전경 탐색 전용 에셋 (6종)

| 파일명 | 해상도 (px) | MSW `ImageType` 권장 설정 | 적용 대상 화면 및 설명 |
| :--- | :--- | :--- | :--- |
| `dialog_parchment_box_frame.png` | `682 × 219` | `Sliced` (L:36, R:36, T:36, B:36) | `32~33_dialog` (`19_dialog_refined.png`): 기존 차가운 남색 대화창을 대체하는 조각 우드 테두리 + 크림 양피지 대화창 메인 프레임 |
| `dialog_npc_nameplate_wood.png` | `280 × 58` | `Sliced` (L:20, R:20, T:12, B:12) | `32~33_dialog`: 대화창 좌상단 테두리에 걸치는 나뭇결 NPC 이름표 명패 (`촌장`, `대장장이 로체` 텍스트용) |
| `dialog_portrait_wood_frame.png` | `183 × 186` | `Simple` / `Sliced` (24px) | `32~33_dialog` 및 `09_character`: 대화창 좌측 NPC 초상화 액자 및 캐릭터 스탠딩 액자 |
| `quest_toast_ornate_leaf_banner.png` | `604 × 155` | `Sliced` (L:64, R:64, T:32, B:32) | `39_quest_toast` (`23_quest_toast_and_downed_refined.png`): 모서리 나뭇잎 장식과 황금 우드 테두리가 들어간 그린 퀘스트 완료 토스트 배너 |
| `chat_window_filigree_darkwood_frame.png` | `587 × 232` | `Sliced` (L:42, R:42, T:42, B:42) | `50~51_chat` (`29_chat_expanded_refined.png`) 및 `07_hud` 상단 퀘스트 트래커: 모서리 금빛 필리그리 장식이 들어간 다크 에스프레소 우드 프레임 |
| `fullview_top_scroll_banner.png` | `614 × 140` | `Sliced` (L:72, R:72, T:28, B:28) | `38_minimap_fullview` (`22_minimap_fullview_refined.png`): 양끝에 우드 스크롤 장식이 달린 전경 탐색 모드 상단 안내 캡슐 바 |

## 2. `02_popup_and_list_assets/` — 메인 팝업 프레임 · 양피지 서브 패널 · 리스트 배너 (7종)

| 파일명 | 해상도 (px) | MSW `ImageType` 권장 설정 | 적용 대상 화면 및 설명 |
| :--- | :--- | :--- | :--- |
| `popup_window_parchment_frame.png` | `571 × 281` | `Sliced` (L:32, R:32, T:52, B:48) | 전 팝업 공통 베이스 프레임 (브라운 우드 헤더/푸터 + 4코너 나무 핀 크림 양피지 본문) |
| `parchment_subpanel_card_short.png` | `187 × 264` | `Sliced` (L:20, R:20, T:20, B:20) | 코너 장식 홈이 있는 양피지 서브 패널 (단형 - 캐릭터 스탯/연구소 우측 카드용) |
| `parchment_subpanel_card_tall.png` | `231 × 374` | `Sliced` (L:20, R:20, T:20, B:20) | 코너 장식 홈이 있는 양피지 서브 패널 (장형 - `08`, `42` 가방 우측 아이템 상세창 및 `22` 상점 수량 선택창용) |
| `list_row_darkwood_short.png` | `402 × 83` | `Sliced` (L:28, R:28, T:20, B:20) | 제작대(`10`), 보스 목록(`19`), 연구소(`21`), 모루(`28`) 좌측 리스트 기본 다크브라운 행 배너 |
| `list_row_amber_selected_short.png` | `405 × 86` | `Sliced` (L:28, R:28, T:20, B:20) | 좌측 리스트 선택 상태 웜 앰버 행 배너 |
| `list_row_darkwood_wide.png` | `538 × 84` | `Sliced` (L:28, R:28, T:20, B:20) | 도감(`13~15`), 퀘스트(`16~18`), 의뢰 게시판(`25`), 난이도(`29`) 와이드 다크브라운 행 배너 |
| `list_row_amber_selected_wide.png` | `540 × 87` | `Sliced` (L:28, R:28, T:20, B:20) | 와이드 리스트 선택 상태 웜 앰버 행 배너 |

## 3. `03_buttons_toggles_tabs/` — 조각 우드 버튼 · 영지 권한 토글 · 닫기/증감 버튼 (11종)

| 파일명 | 해상도 (px) | 용도 및 적용 대상 |
| :--- | :--- | :--- |
| `btn_wood_amber_active.png` | `178 × 65` | 주요 활성 액션 버튼 (`제작`, `구매`, `납품`, `마을에서 깨어나기`, `입장`, `확인`, `저장`) |
| `btn_wood_oak_grain.png` | `179 × 66` | 나뭇결 오크 브라운 기본 버튼 (`귓속말`, `추적`, `취소`, `자동 정렬`, `모두 보관`, `펼치기`, `접기`, `전송`) |
| `btn_wood_leaf_green.png` | `178 × 67` | 긍정/수락 버튼 (`퀘스트 수락`, `영지 초대 수락`, `바닥에 드롭`, `연구 완료`) |
| `btn_wood_olive_secondary.png` | `178 × 67` | 올리브 우드 보조/탭 버튼 |
| `btn_wood_crimson_red.png` | `178 × 67` | 거절/삭제/위험 버튼 (`퀘스트 거절`, `영지 초대 거절`, `버리기`, `삭제`) |
| `btn_wood_disabled_muted.png` | `174 × 63` | 비활성 버튼 (`부족`, `강화하기(재료 부족)`, `즉시 부활권(0)`, `내 영지로 초대(영지 전용)`) |
| `toggle_permission_on_green.png` | `199 × 74` | `27_permission_home` (`14_permission_refined.png`): 영지 권한 `허용 (ON)` 그린/앰버 토글 스위치 |
| `toggle_permission_off_dark.png` | `198 × 74` | `27_permission_home`: 영지 권한 `비허용 (OFF)` 다크우드 토글 스위치 |
| `btn_header_close_x_wood.png` | `72 × 74` | 모든 팝업 헤더 내부 우측 상단 고정용 조각 나무 `[X]` 닫기 버튼 |
| `btn_stat_plus_wood.png` | `72 × 74` | 캐릭터 스탯 분배(`09`) 및 수량 증가(`22`, `43`) 조각 나무 `[+]` 버튼 |
| `btn_qty_minus_wood.png` | `73 × 74` | 상점(`22`) 및 아이템 버리기(`43`) 수량 감소 조각 나무 `[-]` 버튼 |

## 4. `04_fishing_furnace_skilltree_transition/` — 낚시 · 화로 · 스킬트리 · 맵 트랜지션 전용 에셋 (11종)

| 파일명 | 해상도 (px) | 용도 및 적용 대상 |
| :--- | :--- | :--- |
| `fishing_minigame_wood_board.png` | `366 × 251` | `44~45_fishing` (`26_fishing_gauge_refined.png`): 낚시(`릴링!`) 미니게임 다크우드 보드 프레임 |
| `fishing_gauge_track_empty.png` | `319 × 64` | 낚시 게이지 1행/2행 공통 다크우드 빈 캡슐 트랙 |
| `fishing_gauge_amber_progress_bar.png` | `319 × 64` | 낚시 1행 깔끔한 단색 웜 앰버 진행도 게이지 |
| `fishing_gauge_red_danger_bar.png` | `319 × 64` | 낚시 2행 위험 상태 단색 코랄 레드 장력 게이지 |
| `furnace_smelting_arrow_empty.png` | `362 × 109` | `30`, `49_furnace` (`17_furnace_refined.png`): 화로 제련 진행 화살표 빈 트랙 (깨진 흰색 막대 대체) |
| `furnace_smelting_arrow_filled.png` | `362 × 108` | 화로 제련 진행 화살표 웜 앰버 채움 이미지 (`Filled` 모드로 가로 마스킹 사용 가능) |
| `skilltree_root_branch_panel.png` | `600 × 409` | `12_skilltree` (`05_skilltree_refined.png`): 선행 스킬에서 후속 2개 스킬로 이어지는 나무줄기·가지 배경 및 노드 프레임 |
| `skilltree_node_wood_frame.png` | `260 × 92` | 스킬트리 개별 우드 스킬 노드 프레임 |
| `transition_location_wood_badge_left.png` | `177 × 74` | `46_transition_cover` (`27_transition_cover_refined.png`): 출발지(`◆ 영지`) 라운드 다크우드 배지 |
| `transition_location_wood_badge_right.png` | `178 × 74` | 도착지(`사냥터 ♣`) 라운드 다크우드 배지 |
| `transition_tip_filigree_plaque.png` | `453 × 137` | 맵 이동 화면 하단 `[ 모험 팁 ]` 금빛 코너 장식 다크우드 현판 |

## 5. `05_hud_slots_and_action_buttons/` — HUD 상태창 · 4색 게이지 · 슬롯 3종 · 우측 HUD 액션 버튼 6종 (15종)

| 파일명 | 해상도 (px) | 용도 및 적용 대상 |
| :--- | :--- | :--- |
| `hud_status_wood_parchment_card.png` | `446 × 369` | 좌상단 상태창 패드 또는 소형 알림 모달(`36~37` 플레이어/영지 초대) 베이스 카드 |
| `slot_octagon_darkwood_normal.png` | `161 × 161` | 가방·장비·제작·상점·화로·보관함 공통 기본 라운드-팔각 슬롯 |
| `slot_octagon_gold_selected.png` | `175 × 174` | 선택된 슬롯 및 퀵슬롯 골드 글로우 프레임 |
| `slot_octagon_green_equipped.png` | `172 × 172` | 장착 중인 슬롯 그린 글로우 프레임 |
| `gauge_hp_red_bar.png` | `499 × 42` | HUD 및 캐릭터 창(`09`) HP 레드 캡슐 바 |
| `gauge_mp_blue_bar.png` | `498 × 42` | HUD 및 캐릭터 창 MP 블루 캡슐 바 |
| `gauge_stamina_yellow_bar.png` | `499 × 43` | HUD 및 캐릭터 창 기력(ST) 옐로우 캡슐 바 |
| `gauge_exp_green_bar.png` | `498 × 43` | HUD 및 캐릭터 창 EXP 그린 캡슐 바 (흰색 바 대체) |
| `btn_hud_attack_mine_large.png` | `198 × 191` | 우측 하단 메인 `채광/공격` (검+곡괭이 교차) 우드 버튼 (텍스트 미포함, 하단 라벨 조합용) |
| `btn_hud_jump_wings.png` | `151 × 149` | 우측 하단 `점프` (날개) 우드 버튼 |
| `btn_hud_interact_bolt.png` | `151 × 149` | 우측 하단 `상호작용` (번개) 우드 버튼 |
| `btn_hud_info_helmet.png` | `151 × 149` | 우측 `정보` (투구) 우드 버튼 |
| `btn_hud_craft_cube.png` | `151 × 149` | 우측 `제작` (큐브) 우드 버튼 |
| `btn_hud_bag_backpack.png` | `152 × 149` | 우측 `가방` (배낭) 우드 버튼 (`btn_hud_bag_backpack_alt.png` 포함) |

## 6. `06_custom_game_icons/` — 메이플스토리 월드에 없는 커스텀 컨텐츠 일러스트 아이콘 (21종)

- **생존·영지·생활 컨텐츠 전용 아이콘 (9종)**:
  1. `icon_territory_signpost_flag.png` (`180×202`): 개인 영지 표지판 & 초록 깃발 (`26~27` 영지 권한 / `20` 포탈)
  2. `icon_research_scroll_magnifier.png` (`196×187`): 연구소 고서 & 돋보기 (`21_research`)
  3. `icon_request_noticeboard.png` (`196×200`): 의뢰 게시판 나무 보드 (`25_request_board`)
  4. `icon_barn_chicken_sheep.png` (`192×197`): 헛간지기 가게 / 목장 & 가축 (`23_shop_barnkeeper`)
  5. `icon_cabin_blueprint_scroll.png` (`187×162`): 오두막 건축 설계도 (`11_crafting_build`)
  6. `icon_revival_phoenix_feather.png` (`183×206`): 즉시 부활권 불사조 깃털 (`22_shop`, `40_downed_panel`)
  7. `icon_whisper_chat_bubble.png` (`192×178`): 귓속말 / 양피지 말풍선 (`36_player_interact`, `50~51_chat`)
  8. `icon_estate_invite_envelope.png` (`190×132`): 영지 초대장 실링 왁스 봉투 (`37_estate_invite`)
  9. `icon_fishing_rod_bobber.png` (`188×204`): 낚싯대 & 찌 (`44~45_fishing`)
- **바이옴·보상·시스템 공통 아이콘 (12종, `96×96`)**:
  10. `icon_coin_gold.png`: 보유 코인 / 보상 금화
  11. `icon_coin_pouch.png`: 코인 주머니
  12. `icon_furnace_flame.png`: 화로 제련 불꽃 (`30`, `49_furnace`)
  13. `icon_lock_permission.png`: 영지 권한 / 잠금 자물쇠
  14. `icon_quest_star.png`: 퀘스트 황금 별
  15. `icon_check_complete.png`: 완료 초록 체크 배지
  16. `icon_equipped_ribbon.png`: 장착/업적 황금 리본
  17. `icon_biome_field.png`: 포탈 `흙 벌판` 바이옴
  18. `icon_biome_plateau.png`: 포탈 `바위 고원` 바이옴
  19. `icon_biome_desert.png`: 포탈 `모래 언덕` 바이옴
  20. `icon_biome_snowfield.png`: 포탈 `만년 설원` 바이옴
  21. `icon_anvil_hammer.png`: 대장간 모루 & 망치 (`28_anvil`)
