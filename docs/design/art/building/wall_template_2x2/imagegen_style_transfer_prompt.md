# 템플릿 메이플풍 질감 재작업 — 2026-10-05

도구: 내장 `image_gen` 이미지 편집 모델. 제작자가 제공한 템플릿/가이드/화풍 참조로 재작업. 기존 `template_painted.png`는 보존했다.

입력 역할: `template_blank.png` = 배치 원본, `template_guide.png` = 영역·재질 가이드, `generated_maple_raw.png` = 화풍·질감 참고, `template_painted.png` = 기존 비교본. 가이드는 채색 영역 설명용이며 별도 채색 산출물이 아니다.

산출물: `template_painted_imagegen_v2.png`. 내벽 목재 징두리, 외벽 석재 기초, 벽지, 나뭇결, 철물, 유리 반사를 재작업한 채색 참고본.

비평 1회: 질감 개선을 확인했으나 문·창 좌표와 예약 영역의 알파 경계가 원본과 달라 2차 보정 요청.

비평 2회: 내·외벽 재질 구분과 문·창 표현을 확인. 그러나 출력은 1341×1173 RGBA로 원본 512×448 및 정수 배수와 불일치. 상대 좌표로 투명 영역을 비교할 때 이진 알파 불일치 14,070px, 부분 알파 1,454,846px. 부분 알파 수에는 불투명에 가까운 픽셀도 포함되며 전부 시각적 결함이라는 뜻은 아니다. 정확한 마스크·띠 높이·타일 주기·조립 검증은 통과로 간주하지 않는다. 게임 등록용 시트로 사용하려면 별도 규격 보정이 필요하다.

검증: PNG 열기·치수·모드·알파 검사, 시각 대조 2회, 프로젝트 복사 SHA256 일치 확인. `build_template.py --check`는 512×448 전용이므로 이 파일에 대한 통과를 주장하지 않음. 게임 등록/코드/모델/맵 변경 없음. **refresh 검증 보류(MCP 미연결)** · **런타임 검증 보류(제작자 수행)**.

## 1차 프롬프트

```text
Use case: style-transfer. Edit target: image 1 template_blank.png. Image 2 template_guide.png is the authoritative geometry and MATERIAL LEGEND, not artwork to copy. Image 3 generated_maple_raw.png is ONLY a painting-style and texture reference. Image 4 template_painted.png is an earlier unsatisfactory attempt; improve its craftsmanship and obey image 1/2 much more closely.

Create ONE clean high-quality hand-painted MapleStory-inspired architectural TILE ATLAS by painting directly over the EXACT layout of image 1. Output an 8:7 rectangular canvas, ideally 1024x896 (2x the original 512x448), with an invisible 8-column x 7-row grid of 128px squares. Atlas fills the canvas edge to edge. Do not include the legend panel, titles, labels, grid lines, pink lines, borders, padding, or a scene. Preserve all tile positions, shape boundaries, door/window silhouettes and empty areas precisely. Crisp detailed painted game sprite finish with warm dark brown outlines, luminous honey wood, controlled cel shadows and rich organically drawn woodgrain like image 3. Avoid blurred stretched pasted textures, vector flatness, overly granular noise, photorealism and 3D.

GEOMETRY measured in ORIGINAL 512x448 pixel coordinates below; double ALL coordinates if rendering 1024x896. Everything must stay at these positions:
Row 0 y=0..63: eight dark wall-top tiles. The near-black violet-charcoal wall mass must be visually continuous, almost flat and smooth, with NO visible masonry, bricks, slab joints, stone pattern, raised beams or grouting inside the dark mass. Only the orange TRIM areas receive honey wood moulding texture. TRIM exact masks: col0 top 12px and left 12px; col1 top12px only; col2 top12px and right12px; col3 left12px only; col4 entirely dark; col5 right12px only; col6 ONLY upper-left12x12px nub; col7 ONLY upper-right12x12px nub. Connected dark areas blend without seams.

Rows1-2 y=64..191: left256px interior wall, right256px exterior wall. Full panel horizontal bands relative to y64: trim y0..11; crown shadow y12..15; main wall y16..83; chair rail y84..89; lower wainscot/foundation y90..119; baseboard y120..127. Vertical 12px wood trims at x0..11,x244..255,x256..267,x500..511 only on these two large wall panels. Interior main: cream plaster/wallpaper, delicately faded beige botanical pattern as reference; interior LOWER band must be beautiful VERTICAL WOOD WAINSCOT PLANKS, not stones. Exterior main: rich horizontally layered amber woodgrain planks like image3; exterior lower band: charming hand-painted rounded beige-gray natural-stone foundation like image3. The light blue in the template is a material ID for wood siding, NOT blue paint. Same principle for flat placeholder colors everywhere. Keep all band boundaries exact across tiles.

Rows3-4 y192..319: FOUR equal 128x128 door units, in order interior closed / interior open / exterior closed / exterior open. Do NOT create a fifth door. Door frame geometry per unit: left jamb x24..35, right jamb x92..103; top lintel y0..11; door surface/opening x36..91,y12..103; threshold y104..111; base area y112..127. Surrounding wall material is consistent with the corresponding interior or exterior panel. Closed leaves are vertical rich golden-brown wood boards with tasteful iron hinge straps/rivets and one small brass ring handle, confined INSIDE the leaf rectangle. Interior open has a narrow 8px wood leaf on left x36..43 and near-black opening x44..91. Exterior open dark opening fills x36..91. Do not angle the doors, move their frames, create strong perspective or enlarge parts beyond masks.

Rows5-6 y320..447: TWO windows in first four columns: interior window x0..127 and exterior window x128..255, each128x128. Preserve template silhouette: frame x28..99,y24..75; turquoise glass panes x34..61 and x66..93,y30..71, a single vertical central mullion, warm wood sill x24..103,y78..83. No horizontal mullion. Surrounding wall is same material and exact band height as matching plain wall above. Last four columns x256..511,y320..383 are FOUR 64x64 wood floor variations of the same golden vertical plank family; organic grain, varied small knots, consistent board widths, no frames around individual tiles. Last four columns x256..511,y384..447 MUST remain fully TRANSPARENT, exactly the empty reserved region in image1.

Keep all non-reserved atlas rectangles fully opaque, including dark wall top and open doorway darkness. True transparency ONLY in bottom-right256x64px reserved region. Do not introduce checkerboard pixels. Do not remove dark material as if it were background. Subtle small highlights from upper-left, clean layered molding, strong material readability at native512x448 size. Use image3's beautiful craftsmanship but image1/2's actual geometry, material assignments and tile count.
```

## 2차 보정 프롬프트

```text
Use case: precise-object-edit / style-transfer.
Image1 template_blank.png is the absolute EDIT TARGET and pixel geometry, 512x448px.
Image2 template_guide.png is only the MATERIAL GUIDE. Never copy its labels, grid or legend.
Image3 generated_maple_raw.png is painting-style reference only.
Image4 is the first new painted draft: its lovely warm golden wood grain and painted rendering are good, but its GEOMETRY IS NOT CORRECT. Correct that geometry against image1 while matching its craftsmanship. Return a single clean atlas, ideally EXACTLY512x448 pixels; if higher resolution use EXACT integer2x1024x896, never arbitrary aspect/size. No margin or padding. 8 columns7 rows, each64x64 at native resolution.

Start from image1. Repaint inside every region, retaining its exact rectangular shapes and pixel boundaries. Do not redesign silhouettes. The repeated orange strips of image1 have a uniform12px width, regardless of how the previous draft looks.

Native512x448 coordinate contract (scale uniformly only if2x):
TOP band y0..63. Eight tiles c0..c7 at x=c*64. TOP near-flat uniform very dark charcoal-purple #262633, seamless and no bricks/grout, no separate highlights distinguishing tiles. Wooden trims ONLY on orange mask: c0 top12 & left12; c1 top12; c2 top12 & right12; c3 left12; c4 no wood; c5 right12; c6 only top-left12x12 square; c7 only top-right12x12 square. Avoid the first draft's inflated or misplaced wood strip. All grain respects orientation.

PLAIN WALL band y64..191, interior left x0..255 exterior right x256..511. Orange top trim y64..75, crown y76..79, main y80..147, rail y148..153, lower band y154..183, base y184..191. Interior cream floral wallpaper + LOWER VERTICAL WOOD WAINSCOT, NOT stone. Exterior main horizontally grained amber wood siding + LOWER rounded beige STONE foundation. Four vertical12px trims x0..11,x244..255,x256..267,x500..511. No extra support posts in middle. Correct band heights to template exactly. Material pattern periods64px horizontally, so individual atlas cells tile in arbitrary order.

DOOR band y192..319: four exact128x128 rectangles at x0,128,256,384: interior closed, interior open, exterior closed, exterior open. ALL share exact same frame silhouette from image1:
local top wood trim y0..11, crown y12..15.
actual door FRAME lintel local x24..103,y16..27 (NOT y0..11!), left jamb x24..35,y16..127; right jamb x92..103,y16..127.
actual door LEAF local x36..91,y28..119, and THRESHOLD x36..91,y120..127 (NOT y104!).
CLOSED leaves: vertical carved wood planks, small brass ring and dark iron straps inside leaf bounds.
BOTH OPEN doors: narrow8px leaf edge local x36..43,y28..119; dark opaque interior x44..91,y28..119.
NO perspective swing. No lintel protrusion beyond x24..103. No empty space below doorway. Surrounding plaster+wood or siding+stone bands y16..83,y84..89,y90..119,y120..127 match respective plain wall. Do not erase floral wall material in door backgrounds.

WINDOW band y320..447: interior unit x0..127, exterior unit x128..255. Top horizontal12px wood trim local y0..11 and crown y12..15 always continue like wall units. Window ONLY local frame x28..99,y24..77; glass left x34..61,y30..71,right x66..93,y30..71; central vertical mullion x62..65. Sill only x24..103,y78..83. This means a visible8px wallpaper or siding gap ABOVE the window frame, not a window glued to the upper strip. NO horizontal crossbar, no enlarged ornamental lintel or sill. Wall railing UNDER window y84..89, lower material y90..119, baseboard y120..127 all match plain walls. Window colors turquoise glass diagonal painted highlights, rich wood frames.

FOUR FLOOR tiles ONLY x256..511,y320..383, each64x64. Rich golden wood floors with consistent vertical boards, four subtle natural grain variations, no border strips. Y384..447,x256..511 is ONE exact128? correction: 256x64 TRANSPARENT RECTANGLE. This reserved region must have clean straight hard edges at x256,y384. Fully transparent ALL pixels including its top and left edges, no dusty alpha fringe. Every other pixel of the atlas must be fully opaque, including dark TOP and dark doorway areas. No transparency anywhere else. No checkerboard graphics.

Style rich hand-painted MapleStory architectural sprites as image3 and4; honey-gold warm wood, dark brown outlines confined inside existing material masks, layered cel shade, organic clean grain, modest knots, soft botanical wallpaper, softly rounded painted foundation stones. No blurry cloned photo patches. Keep native tile readability with crisp tiny detail rather than heavy artificial pixel mosaic. Focus on ALL exact placements from image1; DO NOT copy the first draft's stretching, taller windows, shallow doors, distorted grid or resized reserved area. No grid, text, watermark, legend. Exact template layout, same tile count and boundaries.
```
