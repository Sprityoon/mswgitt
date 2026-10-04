# 연결 벽 타일셋 생성 프롬프트 (2026-10-05)

이미지 생성 도구에 **참조 이미지 `tileset_64.png`(그림체 기준)를 첨부**하고 아래 영어 프롬프트를 넣는다.
결과는 칸 단위로 잘라 64×64 로 축소해 쓴다 — 축소·자르기·투명화는 이쪽에서 처리하므로 프롬프트에는 넣지 않았다.

꼭 필요한 제한만 남겼다:
1. 4×4 칸 배치와 칸별 모양(16가지 연결) — 자동 연결에 필수
2. 이웃 칸과 맞물리는 단면 규칙(앞면 높이·세로벽 폭·위치가 모든 칸에서 같음) — 이음매에 필수
3. 앞면 아랫변 = 칸 아랫변, 벽은 자기 칸 안에서 끝남 — 충돌·가림(낮은 벽 방식)에 필수
4. 배경 단색 — 투명 처리용

---

## 프롬프트 1 — 벽 16칸 (필수)

```
Use the attached tileset as the exact art style reference: same pixel art look, warm brown wooden
beams with small iron nails, cream plaster panels, light beige stone base, dark brown outlines,
light from the upper-left, top-down 3/4 RPG view. Draw a NEW wall tileset in this style.

Canvas: a 4 x 4 grid of equal square cells, no gaps, no gridlines, no labels, no text.
Background: one flat solid magenta (#FF00FF) everywhere that is not wall.

Each cell is one map tile of a low timber-frame wall. The wall connects to neighbouring cells
(north, east, south, west). Cells, left to right, top to bottom:

Row 1:  1 isolated short pillar (no connections)
        2 wall coming from the north, ending in this cell
        3 wall end, continuing to the east only
        4 corner: from north, turning east  (shape of "└")
Row 2:  5 wall end, continuing to the south only
        6 straight vertical wall (north-south)
        7 corner: from east, turning south   (shape of "┌")
        8 T-junction: north, east and south  (shape of "├")
Row 3:  9 wall end, continuing to the west only
       10 corner: from north, turning west   (shape of "┘")
       11 straight horizontal wall (east-west)
       12 T-junction: north, east and west   (shape of "┴")
Row 4: 13 corner: from west, turning south   (shape of "┐")
       14 T-junction: north, south and west  (shape of "┤")
       15 T-junction: east, south and west   (shape of "┬")
       16 cross junction, all four directions (shape of "┼")

Construction rules (identical in every cell so any two neighbours join seamlessly):
- A horizontal (east-west) wall is seen from the front: top wooden beam, plaster panel, stone base.
  Its front face is about 80% of the cell height and its bottom edge sits exactly on the bottom
  edge of the cell. It always has the same height and the same beam/plaster/stone bands.
- A vertical (north-south) wall is a narrow column about 2/3 of the cell width, centered
  horizontally, seen from above (wood post edges with plaster between). Same width and same
  position in every cell.
- Where a wall continues into a neighbour, it reaches that cell edge exactly, with no post and no
  outline on that edge, so the next cell continues it without a seam.
- Where a vertical wall does not continue south, it ends with a short front face (plaster and
  stone base) whose bottom sits on the cell bottom edge.
- Corners, T-junctions and the cross are one clean joint: the horizontal face and the vertical
  column meet at a single corner post, like a real L-shaped or T-shaped wall seen from above.
- Nothing extends outside its own cell.
```

## 프롬프트 2 — 바닥·문 (선택, 같은 대화에서 이어서)

```
Same style as before. A 4 x 2 grid of equal square cells, no gaps, no labels, flat magenta
(#FF00FF) background where empty.
Row 1: four warm wooden plank floor tiles. Each fills its whole cell and tiles seamlessly in all
       directions: no border, no outline or dark line at the cell edges.
Row 2: cell 1 wooden door CLOSED and cell 2 the same door OPEN, each fitting inside the straight
       horizontal wall of the previous sheet (same face height, bottom on the cell bottom edge,
       reaching both side edges). Cells 3 and 4: the same horizontal wall with a small window,
       and a plain wall variant with a hanging lantern.
```

## 받은 뒤 처리 (AI)

칸 자르기 → 마젠타 제거 → 64×64 축소(도트 마감) → 칸 경계 단면 검사(앞면 높이·세로벽 x 위치가 16칸에서 일치하는지) → 잔디 위 방 목업 → 등록용 스트립. 결과 파일은 `woodland_64/` 에 넣어 주면 된다.
