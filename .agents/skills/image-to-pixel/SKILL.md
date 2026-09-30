---
name: image-to-pixel
description: "MSW 게임 아트 제작 — (1) 사용자가 준 이미지를 게임 에셋으로 리드로우(변환)하거나 (2) 원본 없이 새 스프라이트·아이콘·가구·소품을 직접 그린다. 두 트랙: 트랙 A '메이플 카툰 채색 + 살짝 도트화 마감'(지형 타일과 같은 도트 밀도로 끝내는 가구·설치물·작업대·자원 오브젝트·아이템 아이콘 — 이 프로젝트 기본, scripts/propkit.py, 외부 이미지 생성 AI 결과물도 propkit pixelize 로 마감) / 트랙 B '도트'(64px 지형 타일·도트 UI·레트로 아이콘, .pxg + scripts/pixeltool.py). 절차: 공식 리소스 우선 판정 → 디자인/변환 브리프 → 이웃 에셋 실측 → 코드로 그리기 → 게임 배율 미리보기 자가비평 2회 이상 → PNG+원본 스크립트 납품 → Maker 등록 인계(계정 업로드 금지, pitfalls 규칙 45) → RUID 교체. Triggers: '이미지 생성', '직접 그려', '이미지를 만들어', '스프라이트/아이콘/가구/소품 새로 만들어', '디자인이 안 어울려 바꿔줘', '공식에 없으면 그려', '이 이미지를 픽셀로', '이 사진으로 스프라이트', '도트화', '타일 그려줘', 'draw a sprite', 'generate game art', 'convert this image to pixel art', image attachment + game asset request."
---

# Image-to-Pixel — MSW 게임 아트 제작 (변환 + 신규 생성)

> **2026-09-29 전면 개편.** 구판은 "원본 이미지 → 도트 변환" 전용이었고 원본 없는 신규 생성·MSW 등록 절차가 없었다. 지금 이 게임의 월드 오브젝트는 공식 메이플 오브젝트와 **커스텀 도트 지형(64px 타일)** 사이에 놓인다. 그래서 가구·소품·아이콘은 **트랙 A = 메이플 카툰 채색으로 그리고 "살짝 도트화"로 마감**(지형과 같은 도트 밀도)이 기본이고, 순수 도트 파이프라인은 지형 타일·도트 UI용 **트랙 B**로 남는다. ⚖️ 제작자 확정(2026-09-29): "이미지는 약간 도트화가 되어야 한다 · 디테일은 더 쌓아서". 스킬 이름은 호출 호환을 위해 유지한다.

**이 스킬이 정의하는 한 가지 원칙: 축소·필터가 아니라 다시 그린다.** 원본이 있으면 정체성(무엇이 그것을 그것답게 하는가)만 가져오고, 없으면 브리프에서 출발해 부품 단위로 새로 그린다. 품질은 세 장치에서 나온다 — **이웃 에셋 실측**(톤을 맞출 기준), **코드로 그리는 매체**(부품·광원·외곽선을 결정적으로 통제), **게임 배율 자가비평 루프**(첫 렌더는 절대 보여 주지 않는다).

---

## 0. 먼저: 공식 리소스 우선 판정 (필수 — 건너뛰면 R1 위반)

그리기 전에 `msw-search`로 공식 리소스를 찾는다. 한국어·영어 동의어 **3개 이상** + 좋은 후보의 `similar` 검색까지.

| 판정 항목 | 불합격 예 |
|---|---|
| 이웃 에셋과 **톤**(채도·외곽선·시점)이 맞는가 | 어둡고 장식적인 청동 제단형 화로 — 아늑한 영지와 이질적 |
| 필요한 **상태 짝**이 있는가 (대기/가동, 성장 단계, 열림/닫힘) | 불 꺼진 흙가마만 있고 불 켜진 짝이 없음 |
| **피벗·크기**가 쓸 수 있는가 (`get` 으로 pivot 실측) | 흰 링 `c43c70…` 피벗 (10,72) — 확대하면 원이 엉뚱한 곳에 그려짐 |
| 요청 **분위기**와 맞는가 ("힐링", "귀엽게") | 실내 벽난로·황금 솥 — 영지 야외 소품과 안 어울림 |

- 합격 후보가 있으면 **여기서 멈추고 그 RUID를 쓴다.** 틴트(`SpriteRendererComponent.Color` 곱연산)로 해결되는지도 본다 — 원본이 흰색/무채색일 때만 자유롭게 물들일 수 있다.
- 불합격이면 보고에 한 줄로 남긴다: `공식 후보 N개 검토: A(사유) · B(사유) → 신규 제작`.

## 1. 트랙 선택

| | **트랙 A — 메이플 카툰 일러스트** (기본) | **트랙 B — 도트** |
|---|---|---|
| 대상 | 가구·설치물·작업대·소품·자원 오브젝트·아이템 아이콘 — **공식 MSW 스프라이트 옆에 놓이는 것** | 커스텀 지형 타일(64px 헤네시스 테라스 킷), 도트 UI·레트로 아이콘, 사용자가 '도트'를 명시한 것 |
| 모양 | 부품 도형 + 셀 2~3단·그라데이션·좌상단 림라이트로 채색 → **살짝 도트화 마감**(격자 축소 · 팔레트 제한 · 알파 이진화 · 1도트 selout) — 지형 타일과 같은 도트 밀도 | 1문자=1픽셀 `.pxg` · 계단 리듬 · AA 규칙 |
| 도구 | [`scripts/propkit.py`](scripts/propkit.py) (Pillow만) | [`scripts/pixeltool.py`](scripts/pixeltool.py) (표준 라이브러리만) |
| 규칙 | [references/track-cartoon.md](references/track-cartoon.md) | [references/pxg-format.md](references/pxg-format.md) + [style-retro.md](references/style-retro.md) / [style-pixel-cartoon.md](references/style-pixel-cartoon.md) |
| 프리셋 | [presets/prop-maple-furniture.md](presets/prop-maple-furniture.md) | [presets/index.md](presets/index.md)의 도트 프리셋 |

판단이 애매하면 **같은 화면에 놓일 이웃 에셋과 같은 쪽**을 고른다. 공식 가구 옆에 도트 가구 하나 = 색이 틀린 것보다 더 튄다.

## 2. 워크플로

| 단계 | 할 일 | 레퍼런스 |
|:-:|---|---|
| 1 | **입력 확인** — 원본 이미지(변환) / 공식 RUID(리드로우) / 없음(신규 생성). 원본이 RUID면 `msw-search get` → 썸네일 다운로드로 이미지화 | [analysis.md](references/analysis.md) |
| 2 | **브리프 작성** — 신규면 *Design Brief*, 변환이면 *Conversion Brief* (대화에 먼저 적는다) | [analysis.md](references/analysis.md) |
| 3 | **이웃 실측** — 같은 화면에 놓일 에셋 2~4개를 받아 게임 배율로 나란히 놓고 크기·외곽선 두께·채도·시점을 잰다 | [msw-integration.md](references/msw-integration.md) |
| 4 | **스펙 잠금** — 트랙 / 캔버스 / 게임 배율 / 피벗 / 상태 목록 / 아이콘. 빈 칸만 한 번에 질문(≤4), "알아서"면 기본값을 명시하고 진행 | [elicitation.md](references/elicitation.md) |
| 5 | **구도 계약** — 수치로 한 줄 (`하단 중앙 피벗 · 바닥 여백 0~2 · 중심 오차 ≤2px · 위 여백 ≥2`) | [composition.md](references/composition.md) |
| 6 | **그리기** — A: 에셋별 `draw_<asset>.py`(propkit, 상태를 인자로, `export(dot=)` 로 도트 마감), B: `.pxg` 패스. 제작자가 외부 이미지 생성 AI 를 쓰겠다면 프롬프트를 주고 결과물을 `propkit.py pixelize` 로 같은 규격 마감 | [track-cartoon.md](references/track-cartoon.md) / [pxg-format.md](references/pxg-format.md) / [imagegen-path.md](references/imagegen-path.md) §0 |
| 7 | **미리보기 → 자가비평 → 수정** — 게임 배율 + 잔디·모래·눈·체커 배경 + 이웃 에셋 옆. **최소 2회, 첫 렌더 공개 금지** | 각 트랙 문서의 체크리스트 |
| 8 | **납품** — `docs/design/art/<asset>/` 에 상태별 PNG + 아이콘 + 그리기 스크립트(또는 .pxg) + `preview.png` | 아래 §4 |
| 9 | **등록 인계** — 계정 업로드 금지(규칙 45). 사용자에게 Maker 등록 요청 + 피벗·교체 위치 표. RUID를 받으면 모델(ModelBuilder)·CSV·스크립트 기본값 교체 → refresh | [msw-integration.md](references/msw-integration.md) |
| 10 | **교체 후 확인** — 실루엣↔Trigger/콜라이더 정합(규칙 17)은 제작자 Maker 육안/Play 로. AI 는 "런타임 검증 보류" 명시 | [msw-integration.md](references/msw-integration.md) |

## 3. 트랙 A 핵심 (상세·수치는 track-cartoon.md)

- **캔버스 = 최종 PNG 크기**(논리 px). 내부 4× 로 채색한 뒤 **`export(path, dot=N)` 로 살짝 도트화**한다. `dot` = 화면에서 1도트가 지형 도트(64px 타일 → 100px = 1.56px)와 같아지는 값 — `dot × 모델 Scale ≈ 1.5`. (예: Scale 0.75 → dot 2, Scale 1.0 → dot 2, Scale 0.5 → dot 3)
- **디테일을 쌓는다**(제작자 확정): 재질 편차(벽돌 색·그을림·깨짐·금), 쓰던 흔적(그을음·재), 공예 디테일(쇠띠·리벳·문양), 생활 소품(장작·도구·산출물), 자연 포인트(이끼 늘어짐·꽃·새싹·버섯). 단 **1도트(= dot px) 미만 디테일은 도트화에서 사라진다** — 최소 2도트 크기로 그린다.
- **부품(part) 단위**: 외곽선을 밑에 칠하고 채움을 올린다. 뒤 → 앞 순서로 그리면 앞 부품의 외곽선이 저절로 부품 경계선이 된다(메이플 특유의 부품 선).
- 외곽선 **#4a2a1c 계열 2.4~3px @256 캔버스**. 순검정 금지. 이끼 등 유색 재질은 같은 계열의 짙은 색(예: #3f6424).
- **좌상단 광원**: `shade`(반대편 초승달 그늘) + `light`(좌상단 림) + 위→아래 명암 그라데이션 + 바닥 AO. 한 에셋 안에서 방향이 바뀌면 즉시 탈락.
- **바닥 그림자·바닥 불빛을 굽지 않는다** — 엔진 그림자·Y정렬이 처리한다(art-style-guide §1).
- **상태 짝**은 같은 함수에 `state` 인자로: 캔버스·피벗·부품 좌표가 전부 같고 **발광·연기·불꽃만** 달라야 교체 순간 튀지 않는다.
- '힐링/아늑함' 레버: 둥근 실루엣 · 이끼·작은 꽃 · 장작더미 같은 생활 소품 · 따뜻한 중채도 · 부드러운 연기 · 뾰족한 가시·해골·짙은 보라 배제.

## 4. 트랙 B 핵심 (구판 파이프라인 — 그대로 유효)

도트 에셋은 [pxg-format.md](references/pxg-format.md)의 패스(실루엣 → 면 → 명암 → 외곽선/디테일)로 그리고, 프리셋([presets/index.md](presets/index.md))의 램프·비율을 재채색해 쓴다. 구도는 [composition.md](references/composition.md)의 계약을 `pixeltool check`로 기계 검증한다.

```bash
python scripts/pixeltool.py render sprite.pxg -o out.png --preview 4
python scripts/pixeltool.py check sprite.pxg --baseline 2..4 --height-occ 0.82..0.92 --center-x 2
```

이미지 생성 도구가 있는 에이전트는 [imagegen-path.md](references/imagegen-path.md)로 1차 초안을 뽑아도 되지만, 정리·비평 루프는 동일하다.

## 5. 납품 폴더 규약

```
docs/design/art/<asset>/
  draw_<asset>.py        # 트랙 A 원본 (다시 돌리면 같은 PNG) — 트랙 B 면 <asset>.pxg
  <asset>_<state>.png    # 상태별 스프라이트 (캔버스·피벗 동일)
  <asset>_icon.png       # 인벤토리 아이콘 (필요 시)
  preview.png            # 게임 배율 · 배경 4종 · 이웃 에셋 비교 시트
```

선례: [docs/design/art/furnace/](../../../docs/design/art/furnace/) — 화로 대기/가동 + 아이콘.

## 6. 보고 형식

```
산출물: <png 경로들> (+ 원본 스크립트/.pxg)
트랙: A 카툰 | B 도트 / 캔버스 WxH / 게임 배율 / 피벗
공식 리소스 판정: <검토 후보와 부적합 사유 한 줄씩>
컨셉: <한 줄> · 유지(변환 시): <정체성 앵커> · 재해석: <무엇을 왜>
비평 회차: N (회차별 핵심 수정 1줄)
등록 인계: <사용자가 할 일 + RUID 교체 위치 표>
```

## 7. 함정

- **계정 업로드(`asset_create_account_resource_storage_item`) 스프라이트는 Play 에서 `RUID is unavailable`** — 업로드 성공 ≠ 사용 가능(규칙 45). 직접 올리지 말고 사용자에게 등록을 요청한다. `msw-painter`의 "그려서 업로드" 경로도 같은 이유로 이 프로젝트에선 끝까지 가지 못한다 — 그리기 기법만 참고.
- **도트 마감 누락 / 밀도 불일치**: 매끈한 채색만 납품하면 도트 지형 위에서 혼자 떠 보이고, dot 가 너무 크면(화면 3px 이상) 공식 오브젝트 옆에서 뭉개진다. 미리보기는 반드시 **실제 지형 타일(`tileimg/FullGrass.png` 등) 배경**으로(`preview_sheet(..., tiles=...)`).
- **도트화에서 사라지는 것**: 반투명 연기·빛 번짐(알파 이진화로 잘림) → 연기는 불투명 덩이로, 빛은 표면 색(번짐 radial)으로 그린다. 1도트보다 얇은 선·점도 사라진다.
- **`arch`/`dome` 타원 함정(2026-09-29 수정)**: 캡 타원을 통째로 합치면 아래 절반이 바닥 밑으로 삐져나와 받침에 곡선 자국이 생긴다 — propkit 은 위쪽 절반만 쓰도록 고쳤다. 직접 도형을 합칠 때도 같은 실수를 조심.
- **캔버스 끝에 걸린 연기·빛·가지** → 게임에서 칼로 벤 듯 잘린다. `export()` 가 돌려주는 bbox 로 위·좌우 여백 ≥2px 을 확인.
- **무게중심 치우침**: 장작·굴뚝 같은 비대칭 부품 때문에 불투명 영역 중심이 피벗 열에서 벗어난다 → `nudge()` 로 맞추고 두 상태에 똑같이 적용.
- **공식 스프라이트 피벗을 가정하지 말 것** — 가운데가 아닌 것이 흔하다. `msw_resource_api.cjs get <ruid>` 로 `payload.pivot` 실측.
- **틴트는 곱연산** — 노랑/분홍 원본은 파랑·보라로 물들지 않는다. 자유로운 색이 필요하면 흰색·무채색 원본을 찾는다.
- **스프라이트 교체 후 Trigger/콜라이더** 는 새 실루엣 기준으로 다시 맞춰야 한다(규칙 17) — 박스를 코드로 추정해 확정하지 말고 Maker 육안 대조.
- **첫 렌더 공개 금지** / 같은 결함이 두 번 살아남으면 한 단계 앞(실루엣·부품 구성)이 틀린 것 — 그 단계를 다시 한다.
