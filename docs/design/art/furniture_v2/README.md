# 냄비·침대·가축 우리 새 아트 (2026-10-07)

내장 image_gen으로 새로 그린 투명 PNG. 설치용 3장과 아이콘 3장, 프롬프트, [배경별 48px 아이콘/가구 미리보기](./preview.png), 실제 캔버스/불투명 실루엣 측정값 [asset-manifest.json](./asset-manifest.json)을 보관한다. 기존 화로의 따뜻한 석재·원목 톤을 기준으로 원본 해상도와 축소 화면을 검토했다. 미리보기의 축소·합성은 진단용이며 등록용 PNG를 변경하지 않는다.

## RUID 연결 완료

제작자가 등록한 RUID 6개를 모델과 데이터셋에 연결했다. 아이콘은 UI Rect에 맞추고, 설치 이미지는 불투명 실루엣 폭을 기준으로 모델·미리보기·Trigger 배율을 함께 조정했다. 정확한 RUID와 배율은 asset-manifest.json에 기록했다.

| 가구 | 아이콘 RUID | 설치 Sprite RUID | 모델·미리보기 배율 | Trigger 실효 크기 |
|---|---|---|---|---|
| 냄비 | `81a8b2d8738b4c4d8490ee0278be4d66` | `c494472e96614b0cbd1c76b344d51dfe` | 0.1766437684 | 1.7×1.7 |
| 침대 | `b733c148a20d41a481c613d682e1f780` | `03031ab084354c8581e84239e2f6f83f` | 0.2023121387 | 1.4×1.7 |
| 가축 우리 | `105b1739f4f14dfaafb5a73638e1ade3` | `7256286180e948d8841e2b22337dc60b` | 0.1466049383 | 1.8×1.3 |

| 파일 | 용도/연결 위치 |
|---|---|
| [cooking_pot_sprite.png](./cooking_pot_sprite.png) | `Furniture_CookingPot` SpriteRUID, Furnace IdleSpriteRUID/ActiveSpriteRUID, item_dataset PreviewRUID |
| [cooking_pot_icon.png](./cooking_pot_icon.png) | item_dataset/RecipeDataSet 냄비 아이콘. 냄비 드롭은 화로 모델을 공유하므로 별도 Item_CookingPot 모델을 만들어 분리 |
| [bed_sprite.png](./bed_sprite.png) | `Furniture_Bed` SpriteRUID, item_dataset PreviewRUID |
| [bed_icon.png](./bed_icon.png) | item_dataset/RecipeDataSet, `Item_Bed` 드롭 SpriteRUID |
| [animal_pen_sprite.png](./animal_pen_sprite.png) | `Furniture_AnimalPen` SpriteRUID, item_dataset PreviewRUID |
| [animal_pen_icon.png](./animal_pen_icon.png) | item_dataset/RecipeDataSet, `Item_AnimalPen` 드롭 SpriteRUID |

원본 전체 캔버스 유지, 필터 Point 권장. 피벗 중앙(0.5, 0.5)을 기준으로 `GetOccupiedAnchorPosition`의 가구 중심 배치에 맞췄다. 실루엣 폭은 냄비 180px·침대 140px·우리 190px, 점유는 기존 2×2. 침대의 높이는 점유 바닥보다 위로 보일 수 있으므로 접지선/Y 정렬은 제작자 확인 필요. 냄비 드롭은 새 Item_CookingPot으로 화로와 분리했다. 고해상도 아이콘의 드롭은 item_dataset.DropScaleMultiplier로 32px 논리 크기를 맞춘 뒤 공통 배율 3을 적용한다(실루엣 긴 변 96px).

ModelBuilder 저장·재읽기·모델 검증 및 CSV 연결, 미리보기 배율과 Trigger 실효 크기 정합 검증 완료. Maker MCP 없음 → **refresh 검증 보류 · 런타임 검증 보류(제작자 수행)**. Maker에서 원본 캔버스·피벗·필터, 설치/복원/드롭 크기, 터치·통행·walk-behind 페이드를 확인한다.
