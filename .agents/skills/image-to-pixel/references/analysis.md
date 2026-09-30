# Brief — Design Brief (신규 생성) / Conversion Brief (원본 변환)

두 경우 모두 **그리기 전에 대화에 브리프를 먼저 적는다.** 브리프는 질문(elicitation)의 근거이자 자가비평 루프가 대조하는 체크리스트다.

## Design Brief (원본 없이 새로 그릴 때 — required output)

```
## Design Brief
- Subject / 용도: <무엇 + 게임에서의 역할 (예: 광석 제련 가구, 2×2 점유, 대기/가동 상태 교체)>
- 공식 리소스 판정: <검토 후보 N개와 부적합 사유 — SKILL.md §0>
- 무드 키워드: <예: 힐링·아늑함·둥글둥글 / 금지: 어두움·가시·해골>
- 이웃 실측: <같은 화면 공식 에셋 2~4개 — 게임 배율 크기·외곽선·채도>
- 부품 목록: <뒤→앞 순서 5~12개 (예: 굴뚝 → 받침돌 → 벽돌 돔 → 이끼 모자 → 돌 아치 → 아궁이 → 장작)>
- 재질 → 램프: <부품별 재질과 hex 램프 — 프리셋에서 재채색>
- 상태: <상태별로 바뀌는 부품만 (예: 가동 = 불꽃·빛 번짐·연기)>
- Spec: 트랙 A|B / 캔버스 WxH / 모델 Scale / 피벗 / 아이콘 여부  (모르는 칸 "TBD → elicit")
```

---

## Conversion Brief (원본 이미지를 변환할 때)

The goal of analysis is to extract **what makes the subject recognizable** so it can be redrawn in a completely different style, size, and composition without losing identity. You are not building a pixel map of the image — you are building a *description* precise enough to draw from.

### The Conversion Brief (required output)

Write this in the conversation before eliciting or drawing. Use this exact template:

```
## Conversion Brief
- Subject: <one sentence — what the image shows>
- Identity anchors (must survive): <3–5 bullets>
- Source palette → target ramps: <dominant hues → quantized, style-shifted ramps>
- Source composition: <view, pose, framing of the original>
- Target composition: <requested view/layout — or "TBD → elicit">
- Reinterpretation notes: <what gets re-posed / simplified / invented>
- Spec: <asset type> / <style> / <logical grid> / <output size>  (mark unknowns "TBD → elicit")
```

Unfilled slots marked `TBD → elicit` become the questions in the elicitation step.

## Identity anchors

Ask yourself: *if a friend of the subject saw the sprite, what 3–5 things would make them say "oh, that's them"?* Typical anchors:

- **Shape**: silhouette-defining features — long ears, round body, spiky hair, a big hat
- **Color**: the one or two colors people associate with the subject — the orange scarf, the teal logo
- **Marks**: patterns, logos, scars, a blaze on a dog's face, heterochromia
- **Accessories**: glasses, collar, weapon, headphones

Rank them. At small grids you will only fit the top 2–3 (see detail budget below); the ranking decides what gets cut.

Photos: separate subject from background first. The background is noise unless the user asked for a scene — anchors come from the subject only.

## Palette: quantize and style-shift, never sample

Raw photo colors are desaturated by lighting and contain thousands of shades; a sprite needs 2–6 deliberate ramps. Two moves:

1. **Quantize** — name the 3–5 dominant hues of the subject ("warm brown fur, cream chest, red collar"), ignoring lighting variation. Each hue becomes one ramp. For objective data, run `python scripts/pixeltool.py analyze source.png` — its palette clusters are the quantization starting point.
2. **Style-shift** — move each hue toward the target style's palette:
   - Track A (메이플 카툰 일러스트) → [track-cartoon.md](track-cartoon.md) §4 material ramps + warm dark outline.
   - `pixel cartoon` → warm, slightly desaturated pastel (see [style-pixel-cartoon.md](style-pixel-cartoon.md) palette section). Build 4–6 level ramps + a colored-outline shade per surface.
   - `retro` → minimal and punchy, 2–4 levels per surface, black/white outline allowed (see [style-retro.md](style-retro.md)).

Write the resulting hex ramps into the brief. When drawing, use ONLY these ramps.

## Composition delta — where reinterpretation happens

Compare source composition to target composition and state the gap explicitly:

| Delta | What it means for drawing |
|---|---|
| Same view (photo is side-on, sprite is side-view) | Silhouette can loosely guide the outline; still redraw, don't trace |
| View change (front photo → side sprite, photo → top-down) | **Re-imagine the subject from the new angle using anchors only.** Nothing in the source can be traced; you know the ear shape, colors, and proportions — draw the subject as if you'd seen it from the target angle |
| Framing change (bust photo → full-body sprite) | Invent the unseen parts consistently with the visible ones (clothing continues, legs match body proportion) |
| Pose change (lying cat → idle standing sprite) | Keep anatomy + anchors, adopt the standard pose from composition.md |
| Style gap (realistic photo → chibi cartoon) | Re-proportion (2–3 heads tall for cartoon characters), enlarge the head and eyes, simplify limbs |

State each applicable delta in "Reinterpretation notes". If a delta is large (view change on a complex subject), say so during elicitation — the user may prefer a view that stays closer to the source.

## Detail budget per logical grid

Detail that fits shrinks fast with the grid. Decide what survives *before* drawing, not while drawing:

| Logical grid | Budget |
|---|---|
| 16×16 | Silhouette + 1–2 anchors as color blocks. No facial features beyond dot eyes |
| 32×32 | Silhouette + 3 anchors + simple face (dot eyes, 1px mouth) |
| 48×48 | Most anchors + cartoon face features (eyes with highlight, blush) |
| 64×64 | Full anchor list + shading ramps + accessories with interior detail |
| 96–200 (hi-res 1:1) | Everything above + full face detail, material contrast (fur/cloth/metal read differently), cluster shading — see style-pixel-cartoon.md high-resolution mode. Plan the surface list (8–15 surfaces) in the brief |
| 200+ (hi-res 1:1) | Boss/large-monster scale: sub-anchors get their own ramps (each hair lock, armor plate); skipping the surface plan here guarantees a muddy result |

If the user's requested size can't fit their must-keep anchors, raise it during elicitation ("이 디테일을 유지하려면 128×128 이상을 추천합니다").

## Anti-patterns

- **Color-picking pixels from the photo** → lighting-contaminated mud. Quantize + style-shift instead.
- **Describing the image in terms of pixels** ("the pixel at 40,30 is brown") → you are drawing a subject, not copying a bitmap.
- **Keeping photographic lighting** (soft shadows, bounce light) → replace with the style's light model: upper-left key light, stepped ramps.
- **Anchoring on the background** ("standing in a park") → the park is not the subject. Transparent background is the default.
- **Treating text in the source (logos) as optional** → text/lettering is usually THE identity anchor of a logo; budget pixels for a readable simplified mark, or confirm with the user that it can be dropped.
