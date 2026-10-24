# 농사·요리 에셋 — 등록용 최종본 (2026-10-22)

원본: 상위 폴더 `01_*`(작물 자연 배율) · `04_*`(아이콘) · `05_*`(냄비·물뿌리개). `02_fitted`(단계별 배율이 들쭉날쭉) · `03_strips`(중복) · `06_datasets_csv`(원안 기획서 기준이라 게임과 불일치)는 **쓰지 않는다**.
재생성: `python finish_assets.py` (Pillow, image-to-pixel `propkit` 미리보기 사용).

## 마감 처리 내역

| 처리 | 대상 |
|---|---|
| 흰 구멍 메움 제거 (투명이어야 할 곳이 흰색) | 당근 2·3 · 밀 2·3 · 토마토 3·4 · 황금 호박 3·4 · 물뿌리개 아이콘·손 그림 |
| 금색화 (주황 과육만) | 황금 호박 5 |
| 씨앗 주머니 작물별 색 (밀 = 원래 삼베색 기준) | 당근 주황 · 감자 흙갈색 · 토마토 빨강 · 딸기 분홍 · 황금 호박 금색 |
| 대기/조리 중 정렬 (원본 조리 중이 12px 아래로 그려져 있었음) · 잘린 김 끝 다듬기 | 냄비 2장 → 256×288, 바닥선 y=275 공통 |
| 살짝 도트화 (dot 2 · 색 56/96 · 알파 이진화 · 외곽 selout, 흰 김·꽃잎·불꽃은 보존) | 전부 |

검증: 전 파일 반투명 픽셀 0 · 캔버스 가장자리 여백 ≥ 6px(작물 바닥 6px 공통) · 미리보기 `preview_crops.png`(실제 밭·잔디 타일, 게임 배율 0.75) / `preview_icons.png` / `preview_pot.png`.

## Maker 등록 (제작자) — 에이전트 계정 업로드 금지 (pitfalls 45)

필터 **Point** 권장. 피벗은 **전부 기본값(중앙)**. ⚖️ 2026-10-22 정정: 작물 엔티티는 2×2 밭 칸 중앙에 서고 기존 당근 단계도 중앙 피벗이라, 바닥 피벗으로 바꾸면 식물이 칸 위로 0.5유닛 떠 보인다.

| 폴더 | 파일 | 피벗 | 연결 위치 (RUID 받으면 에이전트가 교체) |
|---|---|---|---|
| `crops/` | `crop_<작물>_s<단계>.png` 24장 | 중앙 | `CropDataSet.StageSprites` (+ `StageScales` 전 단계 0.75 — 원본이 자연 배율이라 크기 변화는 그림이 담당) |
| `icons/` | `icon_carrot` · `icon_carrot_soup` · `icon_carrot_seed` | 중앙 | `item_dataset.IconRUID` (당근·당근 수프·당근 씨앗 교체) |
| `icons/` | `icon_<작물>_seed` 5 · `icon_compost` · `icon_watering_can` | 중앙 | 신규 아이템 추가 시 `IconRUID` |
| `pot/` | `cooking_pot_idle` · `cooking_pot_active` | 중앙 | `Furniture_CookingPot` SpriteRUID · `CookingPot.IdleSpriteRUID/ActiveSpriteRUID` · `item_dataset` PreviewRUID (모양이 바뀌어 모델 배율·Trigger 재조정 필요) |
| `tools/` | `held_watering_can.png` | 중앙 | 물뿌리개 `WeaponRUID` (도구 구현 시) |

등록 후 RUID 목록(파일명 → RUID)을 알려 주면 데이터·모델 연결과 refresh 를 진행한다.

## 등록·연결 현황 (2026-10-22)

- 제작자 등록 완료 → `.sprite` 37개 + 분류 이동: `MapObjects/Sprites/Crops/`(작물 24) · `item/Sprites/Icons/`(아이콘 10) · `item/Sprites/Tools/`(물뿌리개 손 그림) · `Furniture/Sprites/`(냄비 2). 파일명 → RUID: [ruid-map.json](./ruid-map.json).
- **연결 완료**: 당근 3단계(`CropDataSet` · StageScales 0.75 공통) · 당근/당근 씨앗/당근 수프 아이콘(`IconRUID` + `DropScaleMultiplier` 0.2648 — 128px 아이콘의 드롭 크기를 기존 32px와 같게) · 냄비 대기/조리 중(`Furniture_CookingPot` · `CookingPot` 기본값 · `item_dataset` PreviewRUID). 냄비 배율 0.865 → **0.837**(새 그림 폭 216px → 기존과 같은 1.81×2.01유닛), Trigger 2.03 · 오프셋 y −0.12(실제 1.7유닛 유지).
- **추가 등록 필요**: `icons/icon_cooking_pot.png` — 새 냄비 모양의 인벤토리/드롭 아이콘(현재는 옛 냄비 아이콘 `dbe50d…`). 등록되면 `item_dataset.IconRUID` · `RecipeDataSet.Icon` · `Item_CookingPot` SpriteRUID 교체.
- **대기(기능 구현 때 연결)**: 밀·감자·토마토·딸기·황금 호박 단계 20장 · 씨앗 5 · 퇴비 · 물뿌리개 아이콘·손 그림.

## 후속 연결 (2026-10-22)

냄비 아이콘 등록 및 item_dataset/RecipeDataSet/Item_CookingPot 연결 완료를 확인했다. 신규 작물5종과 씨앗5종·물뿌리개/퇴비도 연결했다. 물뿌리개 손 sprite는 아바타 장비가 아닌 밭 조준 미리보기로 사용한다. 작물 바닥 중심은 공용 월드 오프셋0.435로 보정하며 피벗은 바꾸지 않는다. [구현·검증 기록](../../../../reports/farming-expansion-20261022.md).
