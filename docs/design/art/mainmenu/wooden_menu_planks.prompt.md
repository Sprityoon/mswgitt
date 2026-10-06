# 메인화면 나무 판자 편집 프롬프트

- 도구: 내장 image_gen
- 입력: 프로젝트 루트 `wooden_signpost_ui.png`
- 출력: `wooden_menu_planks.png`
- transparent_background: true
- 결과는 1254×1254이며 원본의 크기·위치가 픽셀 단위로 그대로 보존되지는 않았다. 실제 UI 정렬은 Maker 확인 대상.

```text
Use case: precise-object-edit / background-extraction.
Input is an existing pixel-art wooden signpost menu UI sprite with a vertical support pole, rope X-shaped brace, horizontal support beam, one decorated small top header plaque and FIVE wide blank horizontal wooden menu planks below it.
Edit only to remove the support structure. Keep ONLY the decorated small TOP HEADER PLAQUE and the FIVE wide rectangular horizontal menu PLANKS, as disconnected floating wooden plaques. Completely erase the continuous central upright wooden pole above, behind, between and below all plaques; erase the crossed X brace ropes; erase the extra moss-covered horizontal support crossbeam immediately below the top header (it is part of the cruciform support, not one of the five large menu boards). Erase ALL hanging ropes and hooks between boards too. Everything removed must become genuinely transparent pixels.
Preserve every retained board's existing exact wood texture, coloring, chipped corners, pixelated dark outlines, sizes, locations and vertical spacing. Preserve the header's decorative scalloped wood face and small ivy/flower decoration attached directly to its edges. Do not move the plaques, compact the composition, add text, add new boards, redraw the art style, change proportions, or add backgrounds/shadows. This is a UI sprite intended to replace the original in the same rect. Maintain the original canvas shape/dimensions and all five broad boards in the same positions. Six retained plaques total: one small ornate header + five large horizontal planks. No vertical or horizontal support beams, no cross shape, no X ropes, no floor/stand.
Output a transparent-background PNG; genuine alpha transparency, no black background, no checkerboard baked into artwork. Retained artwork must match the supplied MapleStory cozy pixel-art style exactly.
```
