# 가구 3종 경량 이미지

**새 RUID 연결 완료(2026-10-07)**. 설치·드롭 모델 6개 및 item_dataset/RecipeDataSet 15개 셀을 경량본에 연결했다. 기존 표시 크기와 충돌 범위를 유지하도록 아래 배율을 함께 적용했다. Maker refresh status ok(06:47:13 KST), refresh 후 모델/CSV 재읽기 검증 통과. 빌드 로그는 이전 06:39:26 기록이므로 **build 로그 갱신 미확인 · 런타임 검증 보류(제작자 수행)**.

| 가구 | 새 설치 Sprite RUID | 새 아이콘 RUID |
|---|---|---|
| 냄비 | `f490fd4358c94c23b7cf16c197574ded` | `dbe50d325e50451ca26200f944dd472f` |
| 침대 | `d24c49e9ef4b4e119a520ef7c45df837` | `defccbb251f84016a941adae219a5eeb` |
| 가축 우리 | `2026fc42c4814e1da9bad2e32afdff83` | `2ae5cafb050044c792eaed6435ec2177` |

기존 디자인을 유지한 냄비·침대·가축 우리 6장의 등록용 PNG. 원본은 상위 폴더에 보존했다. 아이콘은 **128×128**, 설치 스프라이트는 **256×256**이다.

| 가구 | 아이콘 | 설치 스프라이트 | 새 모델/미리보기 Scale |
|---|---|---|---:|
| 냄비 | [cooking_pot_icon.png](./cooking_pot_icon.png) | [cooking_pot_sprite.png](./cooking_pot_sprite.png) | 0.8652784592737978 |
| 침대 | [bed_icon.png](./bed_icon.png) | [bed_sprite.png](./bed_sprite.png) | 0.9989161849710984 |
| 가축 우리 | [animal_pen_icon.png](./animal_pen_icon.png) | [animal_pen_sprite.png](./animal_pen_sprite.png) | 0.7868561921296297 |

- PNG 6장 합계: **6,063,576 → 322,997 bytes** (5.78MiB → 315.4KiB, 약 94.7% 감소).
- RGBA8 디코딩 크기 계산: **37,742,840 → 983,040 bytes** (36.00MiB → 0.9375MiB, 약 97.4% 감소). 밉맵·아틀라스·엔진 캐시 등은 포함하지 않은 계산이며, FPS/실측 메모리 개선을 측정한 것은 아니다.
- 색상과 비율, 투명 배경, 중앙 피벗 (0.5, 0.5)을 유지했다. 전체 원본 캔버스를 균일 축소하며 침대/우리의 직사각형 캔버스에는 중앙 투명 여백을 추가했다. 알파를 곱한 색으로 면적 평균해 외곽 번짐을 줄였다.

## 비교

[투명 배경 비교](./preview.png), [풀밭 위 비교](./preview_game.png). 위부터 냄비·침대·우리. 각 줄 왼쪽 두 개는 원본/경량본 설치 모습(같은 게임 표시 크기), 오른쪽 작은 두 개는 원본/경량본 48px UI 아이콘, 맨 오른쪽은 새 128px 아이콘이다. 비교 이미지는 진단용이다.

## Maker 등록 및 연결

이 폴더의 **6개 PNG**는 제작자가 등록해 [ruids.json](./ruids.json)에 RUID를 기록했다. 미리보기나 원본 대형 PNG는 가져오지 않는다. 피벗 **중앙 (0.5, 0.5)**, 필터 **Point** 기준.

**아래 연결과 배율을 모두 반영했다.** 향후 재등록할 때도 이미지와 배율을 함께 검토해야 표시 크기가 유지된다. 이미지 해상도만 바꾸고 기존 배율을 유지하면 약 1/5~1/10 크기로 표시된다.

[manifest.json](./manifest.json)의 `integration`에 실제 기존 모델을 ModelBuilder로 읽어 계산한 값을 기록했다.

1. 설치 모델 `SpriteRendererComponent.SpriteRUID`와 item_dataset의 `PreviewRUID`를 새 sprite RUID로 바꾼다. 냄비는 Furnace의 `IdleSpriteRUID`, `ActiveSpriteRUID`도 함께 바꾼다.
2. 설치 모델 XY Scale을 `newModelScale`, Trigger의 BoxSize/ColliderOffset을 `newTriggerBox`/`newColliderOffset`으로 바꾼다. Z Scale 및 2×2 점유 범위는 유지한다. Inspector 속성의 별도 override가 있다면 함께 동기화한다.
3. item_dataset의 `PreviewScale`을 `newPreviewScale`로 바꾼다.
4. item_dataset 및 RecipeDataSet의 아이콘과 Item_* 모델의 SpriteRUID를 새 icon RUID로 바꾼다. Item_* 모델 XY Scale은 `newDropModelScale`, item_dataset의 `DropScaleMultiplier`는 `newDropScaleMultiplier`로 바꾼다. 공통 드롭 배율 3은 유지한다.
5. 모델은 ModelBuilder의 snapshot → patch → write → 재읽기/validate 절차로 반영한다. CSV BOM/줄바꿈을 보존한다. 새 등록 없이 이 수치부터 적용하지 않는다.

| item_dataset.Name | DropScaleMultiplier | Item_* 모델 XY Scale | Trigger BoxSize XY |
|---|---:|---:|---|
| Cooking Pot | 0.26478040540540543 | 0.7943412162162162 | manifest의 newTriggerBox 참고 |
| Bed | 0.29081632653061223 | 0.8724489795918368 | manifest의 newTriggerBox 참고 |
| Animal Pen | 0.2536407766990291 | 0.7609223300970874 | manifest의 newTriggerBox 참고 |

## 검증

이미지 검증: `node docs/design/art/furniture_v2/optimized/optimize.cjs verify`. 게임 연결 검증: `node docs/design/art/furniture_v2/optimized/connect.cjs --verify`. 적용 도구는 기본 dry-run이며 `--apply`로 모델/CSV를 저장한다. 이미 연결한 아트를 재출력하면 배율 기준이 달라질 수 있어 재출력은 차단한다.

6장 규격, 원본/출력 SHA-256, 투명 코너, 중앙 좌표 변환, 게임 좌표 실루엣 외곽 차이 2px 이내(실제 최댓값 0.38px 미만), Trigger 실효 크기·오프셋 보존 검증 통과. 투명 배경과 풀밭에서 기존 크기 및 48px UI 비교 검토 완료.

**refresh ok · build 로그 갱신 미확인 · 런타임 검증 보류(제작자 수행)**. 이전 빌드 스냅샷 Warning 13 / Info 876이며 이번 변경의 빌드 성공 근거로 사용하지 않았다. Warning은 snowman(3), stone_golem(2), deu(3), catus(1), prop_uc_constructionsite(4)의 LWA-4012로 가구 3종 대상 경고는 없다. 인벤토리·제작법 아이콘, 설치/복원/드롭 크기, 접지선, 터치 및 통행은 제작자 Play 확인 필요.
