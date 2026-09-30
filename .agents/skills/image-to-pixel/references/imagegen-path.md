# Optional path: image-generation assisted first pass

## 0. 제작자가 외부 이미지 생성 AI 로 뽑을 때 (트랙 A — 프롬프트 템플릿)

에이전트에게 이미지 생성 도구가 없으면, 제작자가 외부 AI 에 던질 **프롬프트**를 준다. 선례: 화로(2026-09-29) — [docs/design/art/furnace/](../../../../docs/design/art/furnace/).

```
[공통 스타일] 2D game asset for a cozy top-down farming/crafting game, MapleStory-inspired cartoon
with a hi-res pixel-art finish, clean 1px warm dark-brown outlines (not black), top-down three-quarter
view (front face and top both visible, about 60 degrees from above), cel shading with 2-3 tones and
soft highlights, light from the upper left, warm pastel colors, rich small details, single object
centered, the object's base touching the bottom edge, transparent background, no ground shadow, no text
[대상] <부품을 뒤→앞으로, 재질·손상·소품까지 구체적으로 — Design Brief 의 부품 목록을 그대로 영어로>
[상태 짝] same object, same composition and same camera as the previous image, only <바뀌는 것>
[네거티브] photorealistic, 3D render, blurry, airbrush, gradient background, drop shadow, isometric grid,
side view, black outlines, neon colors, text, watermark, multiple objects, cropped edges
```

- 상태 짝은 **첫 장을 참조 이미지로 넣고** "same object, same composition" 을 붙여 두 번째 장을 뽑는다(아니면 몸체가 달라져 교체 순간 튄다).
- 에이전트가 그린 초안 PNG 가 있으면 **구도 참조 이미지**로 같이 넣으라고 안내한다.
- 받은 결과 후처리: 배경 제거(투명이 안 되면 단색 크로마 배경으로 받아 지운다) → `python scripts/propkit.py pixelize gen.png out.png --dot 2 --colors 72 --width 256` → 이 스킬의 자가비평(실제 지형 타일 배경) → 등록 인계. 생성 이미지는 **중간물**이다 — 도트 마감·비평 없이 그대로 쓰지 않는다.

---

## 에이전트에게 이미지 생성 도구가 있을 때 (트랙 B 1차 초안)

**Only when the agent has an image-generation tool available.** This path replaces the *first-pass drawing* (steps 5's silhouette/surface passes) with a generated intermediate; everything else — brief, elicitation, preset, cleanup, self-critique loop — stays identical. Without an image tool, skip this file entirely; the manual .pxg path is the default and fully sufficient.

Why it helps: at hi-res (150px+), a generated intermediate supplies organic cluster shapes and material texture that are slow to invent pixel by pixel. At chunky grids (≤64) it usually does NOT help — generation artifacts dominate at small sizes and hand-drawing from the preset is both faster and cleaner.

## Pipeline

1. **Generate the intermediate** from the Conversion Brief — the prompt must encode the *locked spec*, not the source image's look:
   - subject + identity anchors (colors, features, accessories)
   - exact view/pose from the composition line ("full body side view facing left, idle stance")
   - style keywords from the preset ("cute cartoon game sprite, clean shapes, flat cel shading, plain solid background")
   - Ask for 2–4× the target size (e.g. 512 for a 160 target). Plain uniform background, single subject, full subject in frame.
2. **Quantize + downscale to .pxg**:
   ```bash
   python scripts/pixeltool.py pixelize gen.png --size 160 --colors 28 -o draft.pxg
   ```
   (`pixelize` = median-cut palette + dominant-color-per-cell downscale — deliberately not an averaging resize.)
3. **Repalette**: replace the quantized colors with the preset's ramp structure re-hued to the brief (edit the .pxg palette lines — the grid stays, the palette snaps to deliberate ramps). Merge near-duplicate keys.
4. **Cleanup passes** (this is where it becomes pixel art instead of a shrunken picture):
   - delete the background keys → transparent
   - orphan hunt; re-establish the outline (selout per style/preset — generated intermediates never have proper outlines)
   - rebuild the face/anchor details by hand (always mushy after downscale)
   - normalize staircases on the silhouette
5. **Self-critique loop as normal** — same 7-point checklist, same minimum 2 rounds.

## Honesty rules

- The generated image is an *intermediate*, not the deliverable — never ship it or its raw `pixelize` output. If cleanup is skipped, the result is exactly the "naive pixelation" this skill forbids.
- If generation can't match the composition line after 2 attempts (wrong view/pose), fall back to the manual path — do not adapt the spec to what the generator produced.
- The source image still rules identity: check anchors against the *source*, not against the generated intermediate.
