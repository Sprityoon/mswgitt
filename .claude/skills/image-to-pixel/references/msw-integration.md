# MSW 통합 — 크기·피벗·상태·등록·교체

그린 PNG 가 게임에 들어가기까지의 규약. 이 문서의 수치는 [platform.md](../../msw-general/references/platform.md) §5·§7, [art-style-guide.md](../../../../docs/design/art-style-guide.md) §1~§2, [pitfalls.md](../../../../docs/pitfalls.md) 규칙 17·45 에서 온다.

## 1. 단위와 크기

- **1 월드 유닛 = 100px** (Scale 1 기준). RectTile 한 칸 = 1 유닛. 화면에 보이는 크기 = PNG px × 모델 `TransformComponent.Scale` / 100.
- 목표 화면 크기를 먼저 정하고 PNG 를 역산한다: `PNG px = 목표 유닛 × 100 / 모델 Scale`.

| 대상 | 화면 폭(유닛) | 비고 |
|---|---|---|
| 1×1 소품 | 0.9 ~ 1.2 | 상자·표지판·화분 |
| 2×2 가구·설치물 | 1.6 ~ 2.0 | 작업대·조리 냄비·상자 — `ResourceOccupiedArea` 점유와 맞춘다 |
| 존재감 있는 시설 | 2.6 ~ 4.0 | 화로·가마처럼 "플레이어보다 커야 어울리는" 물건. 점유는 2×2 유지, 스프라이트만 넘침 |
| 건물 | 3 ~ 6 | 높이는 폭의 0.8 ~ 1.4 배(탑다운 ¾ 압축) |
| 아이템 아이콘 | 128×128 PNG | 슬롯이 크기를 맞춘다(규칙 29 — Simple + None) |

- **플레이어가 기준 자**: `DefaultPlayer` Scale 2.8 → 플레이어 키 약 **2 유닛**. 크기는 표보다 "플레이어 옆에서 어떤 물건이어야 하나"로 먼저 정한다(2026-09-30 제작자: 화로가 플레이어와 같은 키면 안 어울림 → 화로 Scale 1.2 = 약 3 유닛).
- **기존 모델의 Scale 을 유지하는 쪽**으로 캔버스를 정하면 교체가 RUID 치환만으로 끝난다. 반대로 목표 크기가 커지면 Scale 을 올리기보다 캔버스를 키워 `dot × Scale ≈ 1.5` 를 지키는 편이 도트 굵기가 맞다(화로: 256px × Scale 1.2 → 1도트 2.4px 로 지형보다 굵음. 384px 캔버스 × 0.75 면 같은 크기에 1.5px).
- **이웃 실측**: 같은 화면에 놓일 공식 에셋의 PNG 를 받아 `preview_sheet` 에 그 에셋의 실제 배율로 넣고 나란히 본다. 표 수치보다 이웃과의 상대 크기가 우선.
- **도트 밀도**: 지형 타일 64px 가 화면 100px → 1도트 ≈ 1.56px. 소품의 도트 마감은 `dot × 모델 Scale ≈ 1.5` 로 맞춘다(Scale 0.75 → dot 2). 실제 타일 PNG 는 `tileimg/FullGrass.png`, `tileimg/FullSoil.png`.

## 2. 피벗

| 용도 | 피벗 | 캔버스에서 지킬 것 |
|---|---|---|
| 맵에 놓이는 오브젝트(가구·자원·건물) | **하단 중앙** (x = W/2, y = 0 = 맨 아래) | 바닥 접지선을 캔버스 맨 아래(여백 0~2px)에, 불투명 영역 중심을 x=W/2 에 (±2px) |
| 아이콘·UI | 중앙 | 여백 균등, 1px 아래로 무게 |
| 이펙트 | 중앙 | 발광 번짐까지 캔버스 안에 |

- **공식 스프라이트 피벗은 가정 금지** — 가운데가 아닌 것이 흔하다. `node <msw-search>/scripts/msw_resource_api.cjs get <ruid>` 의 `payload.pivot` 으로 실측.
- 등록할 때 피벗을 위 규약대로 지정해 달라고 사용자에게 **수치로** 요청한다(예: "피벗 x=128, y=0").

## 3. 상태 짝(스프라이트 교체형)

- 스크립트가 상태별 RUID 를 바꿔 끼우는 오브젝트(예: `Furnace.IdleSpriteRUID` / `ActiveSpriteRUID`)는 **캔버스·피벗·몸체 좌표가 1px 도 다르면 안 된다** — 교체 순간 튄다.
- 애니메이션이 필요하면 공식 animationclip 을 쓰거나, 정지 스프라이트 두 장 + 스크립트 교체로 충분한지 먼저 판단한다(이 프로젝트 화로는 두 장 교체).

## 4. 굽지 말 것

- **바닥 그림자·바닥 반사광** — 엔진(Kinematicbody 그림자)과 Y정렬이 처리한다. 구우면 이중 그림자.
- 텍스트·워터마크·UI 테두리.

## 5. 등록 인계 (🔴 규칙 45)

- 에이전트가 `asset_create_account_resource_storage_item` 으로 올린 계정(UGC) 스프라이트는 **Play 에서 `RUID(...) is unavailable now` 로 렌더되지 않는다.** 업로드·메타데이터 수정이 성공해도 쓸 수 없다. → **직접 올리지 않는다.**
- 사용자에게 아래 표로 요청한다(사용자가 이 월드에서 실제로 쓸 수 있는 경로로 등록하고 RUID 를 알려 준다):

```
| 파일 | 용도 | 피벗 | 교체 위치 |
|---|---|---|---|
| docs/design/art/<asset>/<asset>_idle.png | 대기 | 하단 중앙 (x=W/2, y=0) | <모델>.SpriteRUID · <스크립트>.IdleSpriteRUID · item_dataset.PreviewRUID |
| .../<asset>_lit.png | 가동 | 동일 | <스크립트>.ActiveSpriteRUID |
| .../<asset>_icon.png | 아이콘 | 중앙 | item_dataset.IconRUID · RecipeDataSet 아이콘 열 |
```

## 6. RUID 를 받은 뒤 교체 순서

1. `.model` 값은 **ModelBuilder** 로(`value(..., "SpriteRUID", ruid, "string")`, 스크립트 컴포넌트 값 포함). 🔴 같은 필드에 **프로퍼티 값(`TargetType: null`, 예: `Scale`·`renderguid`)** 이 있으면 그것이 컴포넌트 값을 덮는다 — 둘 다 같은 값으로 쓴다(pitfalls 규칙 62, 화로 Scale 0.35 사고).
2. CSV(`item_dataset.IconRUID` / `PreviewRUID` / `PreviewScale`, `RecipeDataSet` 아이콘)는 BOM·CRLF 를 보존해 해당 칸만 치환.
3. 스크립트 프로퍼티 기본값(`IdleSpriteRUID` 등)은 모델 값과 같이 맞춘다 — 모델 값이 우선하지만 기본값이 옛 RUID 면 다음 사람이 헷갈린다.
4. `refresh` → build 로그 타임스탬프 대조(규칙 22).
5. **Trigger/콜라이더 재조정은 새 실루엣 기준**(규칙 17·14: 실물 = BoxSize × Scale). 박스를 코드로 추정해 확정하지 말고 제작자 Maker 육안 대조를 완료 조건에 넣는다.
