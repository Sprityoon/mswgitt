# 아트 스타일 가이드 & 이미지 생성 프롬프트 (art-style-guide) — 2026-08-08

> **용도**: 제작자가 직접 아트/맵 디자인을 진행할 때, 그리고 타사 이미지 생성 에이전트(Midjourney/GPT계 등)에
> 의뢰할 때 쓰는 **스타일 기준 + 복붙용 프롬프트 템플릿**. 티켓별 상세 규격(치수/우선순위)은
> [artwork-spec.md](./artwork-spec.md) §1 공통 제작 규칙이 원본이며, 이 문서는 **스타일 축과 생성 프롬프트**를 담당한다.

---

## 1. 이 게임의 스타일 축 (한 줄 정의)

**"메이플스토리 카툰 명암 × 탑다운 ¾시점 × 코지 파스텔"** — 스타듀밸리의 아늑함을 메이플 도트 감성으로.

| 축 | 기준 | 근거 |
|---|---|---|
| 시점 | **탑다운 ¾뷰** (위에서 약 60°, 정면+윗면이 함께 보임). 사이드뷰·정수리 직하 뷰 금지 | RectTile(TileMapMode=1) 톱다운 맵 |
| 명암 | 메이플식 **셀 셰이딩 2~3단** + 또렷한 다크 아웃라인(순검정 아님, 진한 갈색/남색) | 기존 MSW 네이티브 리소스와 동거 |
| 채도 | 파스텔~중채도. 형광/네온 금지. 자연물은 그린·브라운 계열 | green_island 영지 톤 |
| 해상도 감각 | **1타일 = 100px** (1월드유닛). 소품 1~2타일, 건물 3~6타일 폭 | platform.md §5 (1unit=100px) |
| 그림자 | **스프라이트에 바닥 그림자를 굽지 않는다** — 엔진(Kinematicbody EnableShadow)과 Y정렬이 처리 | 이중 그림자 방지 |
| 실루엣 | 발밑 접지선이 명확한 실루엣 (Trigger/차단 박스가 실루엣 기준으로 잡힘) | pitfalls 규칙 17 |

**우선순위**: ① MSW 네이티브 메이플 리소스 검색(`msw-search`) → ② 그걸 리드로우/변형 → ③ 순수 신규 생성. (R1 프리셋 우선 — 기존 게임과 톤이 저절로 맞는 경로부터.)

---

## 2. 산출 규격 (생성 의뢰 시 공통 지시)

- **배경 투명 PNG** (키 아트 제외). 캔버스는 2의 배수 권장, 내용물 주변 여백 최소화.
- 타일 스냅 크기: 소품 100~200px, 가구 100~300px, 건물 300~600px 폭 (탑다운 시점 압축 — 높이는 폭의 0.8~1.4배).
- 아이콘: **64~128px 정사각**, 실루엣 중심, 3/4 기울임 통일 (기존 `IconRUID = thumbnail://` 관행과 톤 맞춤).
- 생성 원본이 고해상 일러스트여도 최종은 **도트화**를 거친다 — ⚖️ 2026-09-29 제작자 확정: **"약간" 도트화**. 형태·명암은 메이플 카툰 채색으로 잡고, 마감만 **지형 타일과 같은 도트 밀도**(64px 타일이 화면 100px → 1도트 ≈ 1.5px, 즉 `dot × 모델 Scale ≈ 1.5`)로 도트화한다. 디테일은 "더 쌓아서"(재질 편차·쓰던 흔적·공예 디테일·생활 소품·자연 포인트). → `image-to-pixel` 스킬 **트랙 A**(`propkit.py` 드로잉 + `export(dot=)` / 외부 AI 결과는 `propkit.py pixelize`). 순수 도트(64px 타일·도트 UI)는 트랙 B.
- 완성 판정: Maker에서 기존 오브젝트(노점/헛간 리드로우: `scratch/artwork_rework/`) 옆에 놓고 **톤 이질감 육안 대조**.

## 3. 파이프라인 (생성 → 게임 적용)

```
⓪ msw-search 로 공식 리소스 우선 판정       — 맞는 게 있으면 여기서 끝 (R1)
① 생성: image-to-pixel 트랙 A(가구·소품·아이콘, 코드 드로잉 + 살짝 도트화) / 트랙 B(타일, 도트)
   또는 타사 에이전트 프롬프트(§4 · image-to-pixel imagegen-path §0) → propkit pixelize 로 도트 마감
② 산출물: docs/design/art/<asset>/ (상태별 PNG + 아이콘 + 그리기 스크립트 + preview)
③ 제작자: Maker에 리소스 등록 → RUID 확보 (⚠️ 에이전트의 계정 업로드는 Play 불가 — pitfalls 규칙 45)
④ .model SpriteRUID / item_dataset IconRUID 교체 (코드 무변경 — artwork-spec §5 방식)
⑤ 실루엣 대조 (규칙 17) + F9 프리뷰 도구(PreviewTool)로 육안 확인
```

## 4. 복붙용 프롬프트 템플릿 (타사 에이전트)

> 공통 접두: *"2D game asset, MapleStory-inspired cartoon style, cel shading with 2-3 tone shadows,
> dark warm outline, pastel cozy colors, three-quarter top-down view (bird's eye ~60°),
> transparent background, no drop shadow on ground, clean silhouette"*

| 대상 | 템플릿 (공통 접두 + 아래) | 예시 |
|---|---|---|
| 건물 | `a small {건물}, front face and roof both visible, entrance at bottom center, {재질/색}, {포인트 디테일}, game building sprite, 512px` | `a small alchemy research lab, blue roof, glass flasks on window` |
| 소품/가구 | `a {소품}, single object, fits 1x1 tile footprint, {재질}, 128px` | `a wooden mailbox with tiny red flag` |
| 자원 오브젝트 | `a {자원}, slightly oversized cute proportions, harvestable look, 3 growth stages side by side` | `a mushroom cluster, 3 growth stages` |
| 아이템 아이콘 | `game item icon of {아이템}, single object, centered, bold readable silhouette, 96px` | `game item icon of a triangular steel spade` |
| NPC 컨셉 | `chibi villager character, {성격/직업}, 2-head proportion, front-facing idle pose` — ⚠️ 실기용 NPC는 MSW 아바타 시스템이 기본; 생성 이미지는 **컨셉/초상화(대화창)** 용도 | `chibi old village elder with straw hat` |
| 타일 텍스처 | `seamless top-down terrain tile, {지형}, 100px, subtle noise, no strong pattern repetition` | `seamless spring grass tile` |

**금지 지시(네거티브)**: `photorealistic, 3D render, side-scroller view, strong perspective, neon colors, drop shadow, text, watermark`

## 5. 메인화면 키 아트 (main-menu-save-slots §4 연동)

- 규격: **1920×1080** (UI 기준 해상도). 중앙 상단 1/3은 로고 자리, 하단 중앙은 버튼/슬롯 카드 자리 — **주인공 요소를 좌우 1/3 지점에** 배치하고 중앙 하단은 밀도 낮게.
- 소재 권고: 개인 영지 전경 — 아늑한 농장(밭·물웅덩이·집·상자) + 멀리 마을 실루엣, 캐릭터는 뒷모습이나 소품 정도로 (아바타는 유저마다 다르므로 특정 외형을 주인공으로 박지 않는다).
- 프롬프트 예:
  `key art for a cozy top-down farming craft game, MapleStory-inspired cartoon illustration, a small green island farm with tilled soil, a pond, wooden chest and small house, distant village silhouette, warm morning light, pastel colors, cel shading, wide 16:9 composition, empty calm area at bottom center for UI buttons, no text, no logo`
- 파생: 같은 구도의 **계절 4종**(봄 기본 → 여름/가을/겨울)을 뽑아두면 §2.2 계절 테마와 타이틀 연출에 재사용 가능.

## 6. 맵 디자인 메모 (제작자 직접 작업 보조)

- 지형 문법은 [tile-scheme.md](../tile-scheme.md)가 단일 소스 — 특히 물가 ½셀 오버행(§4-bis)과 L4=Big Wall 전용(규칙 21).
- 밀도 리듬: 스타듀밸리식 **"기능 앵커(건물/시설) 1 + 생활 소품 2~3 + 여백"** 클러스터 단위로. 소품 균일 살포 금지 (T75 전량 철회 교훈 — 규칙 17).
- 동선: 포탈→광장→상점거리→연구소/게시판이 한 화면(12.8×7.2유닛) 안에서 한 번에 읽히도록 앵커 간 간격 6~10타일.

---

## 관련 문서

- 티켓별 상세 치수·우선순위: [artwork-spec.md](./artwork-spec.md)
- 아트 제작 스킬: `.claude/skills/image-to-pixel` (트랙 A 카툰 일러스트 · 트랙 B 도트, 변환 + 신규 생성) — 선례 [art/furnace/](./art/furnace/)
- 메인화면 UI 설계: [main-menu-save-slots.md](./main-menu-save-slots.md)
