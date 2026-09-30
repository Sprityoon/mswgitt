# Preset library — start every drawing from measured ground

A preset is the distilled technique for one asset type × track × density: concrete palette ramps (hex), proportion and canvas numbers, technique parameters, and idiom fragments. Starting from a preset keeps quality consistent across assets and sessions — improvised palettes and proportions drift.

**The re-hue rule** — presets provide *structure*, the brief provides *identity*: keep each ramp's **value spacing and saturation curve**, but replace its hue with the subject's colors. A 5-step ramp stays a 5-step ramp.

## Selection table

| Track | Slots (type × style × density) | Preset |
|:-:|---|---|
| **A** | 가구·설치물·작업대·소품 × 메이플 카툰 일러스트 (탑다운 ¾) | [prop-maple-furniture.md](prop-maple-furniture.md) |
| B | Character/NPC × pixel cartoon × chunky | [character-cartoon-64.md](character-cartoon-64.md) |
| B | Character/NPC × pixel cartoon × hi-res | [character-hires-160.md](character-hires-160.md) |
| B | Monster (small/mob) × pixel cartoon × chunky | [monster-cartoon-48.md](monster-cartoon-48.md) |
| B | Monster (large/boss) × pixel cartoon × hi-res | [monster-hires-200.md](monster-hires-200.md) |
| B | Icon/item × retro (any density) | [icon-retro.md](icon-retro.md) |
| B | Tile / background prop (any style) | [tile-and-background.md](tile-and-background.md) |

- 트랙 A 아이템 아이콘은 가구 프리셋의 팔레트·외곽선 규칙을 그대로 쓰고, 대표 상태를 128×128 에 맞춘다([track-cartoon.md](../references/track-cartoon.md) §6).
- 트랙 A 에 캐릭터/몬스터가 필요하면 먼저 공식 리소스·아바타 시스템(`msw-avatar`)을 본다 — 이 게임의 NPC·몬스터는 공식 리소스가 원칙이다.

Nearest-match rule: an in-between request starts from the nearest preset and adjusts its numbers — note the adjustment in the locked spec line.

## Preset anatomy

Each preset file contains: **Use for** / **Canvas & composition numbers** / **Palette ramps** (concrete hex, to be re-hued) / **Technique parameters** / **Idiom fragments** (track B: small .pxg excerpts) / **Checklist** (what the self-critique loop should verify for this asset type).

## Authoring new presets from inspiration material

When the user provides inspiration sprites (or the neighbors measured in workflow step 3 define a new look), distill a new preset instead of relying on the seeds:

1. Track B: `python scripts/pixeltool.py analyze <img>` on each — logical size, detected upscale, palette clusters, ramps, outline stats. Track A: measure outline width at game scale, dominant ramps, and top-face band height from the official PNGs.
2. Track B: `python scripts/pixeltool.py grid <img> --detect-scale` on 1–2 exemplars to study cluster shapes in text.
3. Aggregate: canvas size, ramp depth, outline treatment, AA/gradient usage, proportion measurements.
4. Write a new preset file here following the anatomy above; add it to the selection table. Parameters only — never copy third-party sprite images into the skill.
5. Prefer the new preset over seeds for that project from then on.
