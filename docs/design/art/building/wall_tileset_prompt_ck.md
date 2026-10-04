# 벽 타일셋 생성 프롬프트 — 코어키퍼 벽 문법 (2026-10-05)

제작자 제공 코어키퍼 인게임 스크린샷에서 읽은 벽 구성:

| 층 | 무엇 | 규칙 |
|---|---|---|
| **윗면(지붕)** | 벽 칸을 덮는 거의 검은 평평한 면 | 벽끼리 붙은 변은 그대로 이어짐(경계선 없음). **빈 칸과 맞닿은 변에만** 얇은 밝은 나무 테두리. ㄱ자·T자·십자 연결은 전부 이 층이 그냥 이어져서 해결 — 기둥·보로 맞추지 않음 |
| **앞면(벽면)** | 벽돌/판자 벽면 + 걸레받이 띠 | **남쪽 이웃이 빈 칸인 벽 칸에만**, 윗면 아래쪽에. 남쪽에 벽이 이어지면 앞면 없음 → 세로벽은 검은 띠, 가로벽은 검은 띠 + 앞면 |

우리 게임은 "칸 안에서 끝나는 낮은 벽"(확정)이라 한 칸 안에 윗면(위 약 45%) + 앞면(아래 약 55%)을 넣는다. 남쪽이 벽이면 칸 전체가 윗면.

첨부 이미지: ① 코어키퍼 스크린샷(구조 참고) ② `woodland_64/tileset_64.png`(재질·그림체 참고).

---

## 프롬프트 (영어로 그대로 사용)

```
Pixel art wall tileset for a top-down 3/4 view RPG, 64x64 px per tile.
Art style and materials: copy the second attached image (warm brown wood, cream plaster, light
stone, dark brown outlines, light from the upper-left).
Wall STRUCTURE: copy the first attached image (Core Keeper): every wall is built from two layers.

LAYER 1 - WALL TOP: seen from straight above. A flat, very dark brown, almost black surface with
only subtle texture. Where a wall tile touches another wall tile, the dark top simply continues
across the shared edge with no line, no post, no seam. Where a wall tile touches empty floor
(no wall), that edge gets a thin light wooden trim (2-3 px) along the top surface's border.
All corners, T-junctions and crossings are formed only by the dark top joining smoothly.
Do NOT draw posts, pillars or beams at joints.

LAYER 2 - WALL FACE: the vertical front side of the wall, seen from the front. It appears ONLY on
wall tiles whose south (lower) neighbour is empty. It sits directly under the dark top, fills the
lower ~55% of the tile, and its bottom edge touches the bottom edge of the tile. Content, top to
bottom: a narrow wooden lip, plaster or plank wall surface, a stone or wooden baseboard. If the
south neighbour is also a wall, there is NO face: the whole tile is dark top.
The face has the same height and the same bands in every tile, and continues seamlessly to the
left/right when the neighbouring tile also has a face. On a side that touches empty floor, the
face ends with a clean vertical edge.

Sheet: a 4 x 4 grid of 16 tiles, no gaps, no gridlines, no labels. Empty areas: flat magenta
#FF00FF. Each tile shows one combination of which neighbours (N, E, S, W) are walls:

Row 1:  (1) none            (2) N               (3) E               (4) N+E
Row 2:  (5) S               (6) N+S             (7) E+S             (8) N+E+S
Row 3:  (9) W               (10) N+W            (11) E+W            (12) N+E+W
Row 4:  (13) S+W            (14) N+S+W          (15) E+S+W          (16) N+E+S+W

Rules per tile:
- The whole tile is wall (dark top) except where the face is drawn.
- Light trim on each of the N / E / W edges of the dark top that is NOT listed for that tile.
- Tiles WITHOUT S in their list have the front face in the lower ~55%; tiles WITH S are entirely
  dark top (trim only on unlisted N / E / W edges).
- Nothing extends outside its own tile.
```

### 결과를 받은 뒤 (AI 처리)

칸 자르기 → 마젠타 제거 → 64×64 → 검사: ① 같은 변을 공유하는 두 칸의 윗면이 픽셀 단위로 이어지는가 ② 앞면 높이·띠 위치가 S 없는 8칸에서 같은가 ③ 테두리가 빈 변에만 있는가 → 잔디 위 **사각형 방 + T자 칸막이** 목업 → 등록용 스트립.

### 실패하면 (대안)

모델이 16칸 배치를 못 지키면 **부품만** 받아 코드로 16칸을 조립한다(위치·이음매는 코드가 보장, 그림은 모델 것 그대로):
`dark top texture (seamless 64x64)` · `light trim strip` · `wall face strip (64 wide, seamless left-right)` · `face left end` · `face right end`.
