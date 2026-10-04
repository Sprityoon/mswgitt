# -*- coding: utf-8 -*-
"""woodland_64 → 연결 타일 재조립 (2026-10-05, 설계 v2 §3·§4).

원본 tileset_64.png 의 부품을 잘라 붙이기만 한다(리샘플·재채색 없음).
  벽 마스크: N=1, E=2, S=4, W=8 (이웃이 벽 또는 문) → BuildWoodWall00~15
  낮은 벽 문법: 그림은 자기 칸 안에서 끝나고 앞면 아랫변 = 칸 아랫변(충돌 경계).
  벽 중심선 = 칸 가운데 28px (기둥 2개). 가로 연결 = 앞면이 칸 끝까지 · 끝/꺾임/교차 = 기둥 ·
  세로 연결 = 위에서 본 판재 2장.
다시 돌리면 같은 PNG.
"""
from PIL import Image, ImageDraw
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = Image.open(os.path.join(HERE, "..", "tileset_64.png")).convert("RGBA")
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", "..", ".."))
T = 64
SHIFT = 7          # 앞면을 칸 아래로 붙이는 이동량 (원본 앞면 아래 y56 → 63)
PX0 = 11           # 세로벽(기둥|회벽|기둥 42px) 왼쪽 x — 원본 r2c5~c8 세로 토막 구성
POST_W = 14


def cell(r, c):
    return SRC.crop(((c - 1) * T, (r - 1) * T, c * T, r * T))


W2, W3 = cell(2, 2), cell(2, 3)

# ── 부품 ──────────────────────────────────────────────────────────────
# 1) 앞면 띠 (rows 6..56 → 51줄). 기둥 사이 구간 두 장을 이어 64px 주기 띠.
FACE_ROWS = (6, 57)
# x14·x49~50 은 기둥 옆 그늘 열(회벽 밝기 105·192 vs 본바탕 210) → 깨끗한 x16~47 만 쓴다 (3회차 비평)
seg_a = W2.crop((16, FACE_ROWS[0], 48, FACE_ROWS[1]))        # 32px
seg_b = W3.crop((16, FACE_ROWS[0], 48, FACE_ROWS[1]))        # 32px
BAND = Image.new("RGBA", (T, FACE_ROWS[1] - FACE_ROWS[0]))
BAND.paste(seg_a, (0, 0))
BAND.paste(seg_b, (32, 0))
FACE_Y = FACE_ROWS[0] + SHIFT                                  # 13

# 2) 기둥 (rows 3..58 = 56줄) → 54줄로: 나무 몸통 2줄(25, 35) 제거해 아랫변을 63에 맞춘다.
post_src = W2.crop((0, 3, POST_W, 59))
rows = [y for y in range(post_src.height) if y not in (25 - 3, 35 - 3)]
POST = Image.new("RGBA", (POST_W, len(rows)))
for i, y in enumerate(rows):
    POST.paste(post_src.crop((0, y, POST_W, y + 1)), (0, i))
POST_Y = T - POST.height                                       # 10

# 3) 세로벽 몸통 = 기둥 나무 | 회벽 | 기둥 나무 (세로 반복). 끝(남쪽)은 기둥 | 좁은 앞면 | 기둥.
post_body = W2.crop((0, 14, POST_W, 42))                       # 기둥 나무 28줄
plaster_body = W2.crop((24, 26, 24 + POST_W, 39))              # 회벽 13줄
MID_X = PX0 + POST_W
COL_W = 3 * POST_W


def tiled_v(src, h):
    col = Image.new("RGBA", (src.width, h))
    y = 0
    while y < h:
        col.paste(src, (0, y))
        y += src.height
    return col


def paste_boards(im, y0, y1, cap):
    h = y1 - y0
    if h <= 0:
        return
    im.alpha_composite(tiled_v(post_body, h), (PX0, y0))
    im.alpha_composite(tiled_v(plaster_body, h), (MID_X, y0))
    im.alpha_composite(tiled_v(post_body, h), (MID_X + POST_W, y0))
    if cap:  # 세로벽 북쪽 끝: 앞면 윗보 띠를 얹어 마감
        im.alpha_composite(BAND.crop((0, 0, COL_W, 15)), (PX0, y0))


def paste_face(im, x0, x1):
    if x1 <= x0:
        return
    im.alpha_composite(BAND.crop((x0, 0, x1, BAND.height)), (x0, FACE_Y))


def paste_pillar(im):
    # 기둥 | 좁은 앞면(보·회벽·돌받침) | 기둥 — 끝·꺾임·교차·세로벽 남쪽 끝 공용
    im.alpha_composite(BAND.crop((20, 0, 20 + POST_W, BAND.height)), (MID_X, FACE_Y))
    im.alpha_composite(POST, (PX0, POST_Y))
    im.alpha_composite(POST, (MID_X + POST_W, POST_Y))


def wall(mask):
    n, e, s, w = bool(mask & 1), bool(mask & 2), bool(mask & 4), bool(mask & 8)
    horiz = e or w
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    mid0, mid1 = PX0, PX0 + COL_W
    if horiz:
        if n:   # 북쪽에서 내려온 세로벽이 앞면 위로 들어온다
            paste_boards(im, 0, FACE_Y + 2, cap=False)
        paste_face(im, 0 if w else mid0, T if e else mid1)
        if not (e and w) or n or s:   # 끝·꺾임·교차 = 기둥
            paste_pillar(im)
    else:
        if s:   # 세로벽 몸통 — 판재가 칸 아래까지 (남쪽 칸으로 이어짐)
            paste_boards(im, 0 if n else FACE_Y - 1, T, cap=not n)
        else:   # 세로벽 남쪽 끝 / 외딴 칸 = 기둥 쌍(앞면)
            if n:
                paste_boards(im, 0, POST_Y + 4, cap=False)
            paste_pillar(im)
    return im


def floor(r, c):
    """가장자리 검은 테두리(왼 2~3 · 위 2 · 오른 1~2px)를 바로 안쪽 줄로 덮어 이음매 없앤다."""
    t = cell(r, c).copy()
    px = t.load()
    for y in range(T):
        for x in (0, 1, 2):
            px[x, y] = px[3, y]
        for x in (62, 63):
            px[x, y] = px[61, y]
    for x in range(T):
        for y in (0, 1, 2):
            px[x, y] = px[x, 3]
    return t


def build():
    out = os.path.join(HERE, "tiles")
    os.makedirs(out, exist_ok=True)
    tiles = {}
    for m in range(16):
        tiles[f"BuildWoodWall{m:02d}"] = wall(m)
    tiles["BuildDoorBlock"] = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    for name, (r, c) in {"BuildWoodFloor": (1, 1), "BuildWoodFloor2": (1, 2),
                         "BuildWoodFloor3": (1, 7), "BuildWoodFloor4": (1, 8)}.items():
        tiles[name] = floor(r, c)
    for k, im in tiles.items():
        im.save(os.path.join(out, k + ".png"))
    names = list(tiles.keys())
    strip = Image.new("RGBA", (T * len(names), T), (0, 0, 0, 0))
    for i, k in enumerate(names):
        strip.alpha_composite(tiles[k], (i * T, 0))
    strip.save(os.path.join(HERE, "BuildWood_strip.png"))
    with open(os.path.join(HERE, "BuildWood_strip_order.txt"), "w", encoding="utf-8") as f:
        f.write("왼쪽부터 64px 칸 순서 (등록 이름):\n")
        for i, k in enumerate(names):
            f.write(f"{i + 1:2d}. {k}\n")
    return tiles


# ── 목업: 잔디 위 방 + 키 2칸 플레이어 실루엣 (게임 배율 100/64) ─────────
LAYOUT = [
    "...........",
    ".#######...",
    ".#fff#f#...",
    ".#fff#f#.#.",
    ".#fffff#.#.",
    ".#fffff#.#.",
    ".###D###...",
    "..........#",
]


def mockup(tiles):
    rows, cols = len(LAYOUT), len(LAYOUT[0])
    im = Image.new("RGBA", (cols * T, rows * T))
    grass = Image.open(os.path.join(REPO, "tileimg", "FullGrass.png")).convert("RGBA")
    isw = lambda r, c: 0 <= r < rows and 0 <= c < cols and LAYOUT[r][c] in "#D"
    # 집 범위(1..7, 1..6)는 벽 칸까지 바닥을 깐다 — 설계 v2 §6 "벽·문은 바닥 위" (기초 테두리로 읽힘, 2회차 비평 B안)
    for r in range(rows):
        for c in range(cols):
            im.alpha_composite(grass, (c * T, r * T))
            if 1 <= c <= 7 and 1 <= r <= 6:
                im.alpha_composite(tiles["BuildWoodFloor2" if (r * 5 + c * 3) % 7 == 0 else "BuildWoodFloor"], (c * T, r * T))
    for r in range(rows):
        for c in range(cols):
            if LAYOUT[r][c] == "#":
                m = (1 if isw(r - 1, c) else 0) | (2 if isw(r, c + 1) else 0) | (4 if isw(r + 1, c) else 0) | (8 if isw(r, c - 1) else 0)
                im.alpha_composite(tiles[f"BuildWoodWall{m:02d}"], (c * T, r * T))
            elif LAYOUT[r][c] == "D":  # 문 자리 표시(임시): 열린 문틀
                d = ImageDraw.Draw(im)
                d.rectangle([c * T + 6, r * T + 10, c * T + 57, r * T + 63], outline=(255, 255, 255, 160), width=2)
    # 사람: (칸x, 칸y, 색) 발 = 칸 아래쪽
    d = ImageDraw.Draw(im)
    for (cx, cy, col) in [(3, 2, (90, 140, 210)), (4, 5, (220, 110, 120)), (9, 1, (120, 190, 110)), (8, 4, (230, 180, 70))]:
        fx, fy = cx * T + 32, (cy + 1) * T - 6
        d.ellipse([fx - 20, fy - 6, fx + 20, fy + 4], fill=(30, 20, 30, 110))
        d.rounded_rectangle([fx - 16, fy - 80, fx + 16, fy - 2], 8, fill=col + (255,), outline=(40, 28, 30, 255), width=2)
        d.ellipse([fx - 22, fy - 128, fx + 22, fy - 76], fill=(250, 214, 180, 255), outline=(40, 28, 30, 255), width=2)
    return im.resize((cols * 100, rows * 100), Image.NEAREST)


def sheet(tiles):
    names = list(tiles.keys())
    Z = 3
    cols = 8
    rows = (len(names) + cols - 1) // cols
    im = Image.new("RGBA", (cols * (T * Z + 8), rows * (T * Z + 22)), (70, 70, 74, 255))
    grass = Image.open(os.path.join(REPO, "tileimg", "FullGrass.png")).convert("RGBA")
    d = ImageDraw.Draw(im)
    for i, k in enumerate(names):
        x, y = (i % cols) * (T * Z + 8), (i // cols) * (T * Z + 22)
        bg = grass.copy()
        bg.alpha_composite(tiles[k])
        im.alpha_composite(bg.resize((T * Z, T * Z), Image.NEAREST), (x, y))
        d.text((x + 2, y + T * Z + 4), k, fill=(255, 255, 255, 255))
    return im


if __name__ == "__main__":
    tiles = build()
    mockup(tiles).save(os.path.join(HERE, "mockup_room.png"))
    sheet(tiles).save(os.path.join(HERE, "sheet_connect.png"))
    print("ok", len(tiles))
