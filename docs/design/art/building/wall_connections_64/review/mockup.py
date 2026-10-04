# -*- coding: utf-8 -*-
"""wall_16_64 검증 목업 (2026-10-05). 마스크 N1 E2 S4 W8 → tiles/wall_{mask+1:02d}.png.
마젠타 #FF00FF → 투명. 바닥 = woodland_64/connect/tiles/BuildWoodFloor(테두리 제거판). 게임 배율 100/64."""
from PIL import Image, ImageDraw
import os
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
REPO = os.path.abspath(os.path.join(BASE, "..", "..", "..", "..", ".."))
T = 64
import sys
TILE_DIR = os.path.join(HERE, "fixed") if "--fixed" in sys.argv else os.path.join(BASE, "tiles")
SUFFIX = "_fixed" if "--fixed" in sys.argv else ""

def load(m):
    im = Image.open(os.path.join(TILE_DIR, f"wall_{m + 1:02d}.png")).convert("RGBA")
    px = im.load()
    for y in range(T):
        for x in range(T):
            r, g, b, a = px[x, y]
            if r > 230 and g < 30 and b > 230:
                px[x, y] = (0, 0, 0, 0)
    return im

WALL = {m: load(m) for m in range(16)}
GRASS = Image.open(os.path.join(REPO, "tileimg", "FullGrass.png")).convert("RGBA")
FLOOR = Image.open(os.path.join(BASE, "..", "woodland_64", "connect", "tiles", "BuildWoodFloor.png")).convert("RGBA")

# # = 벽, D = 문 자리(벽으로 계산하되 그림 없음), f = 바닥, . = 잔디
LAYOUT = [
    "..............",
    ".#########....",
    ".#fff#fff#..#.",
    ".#fff#fff#..#.",
    ".#fff#fff#..#.",
    ".###f###D#....",
    ".#fffffff#.#..",
    ".#fffffff#....",
    ".####D####..##",
    "..............",
]
FLOORED = lambda r, c: 1 <= c <= 9 and 1 <= r <= 8

def is_wall(r, c):
    return 0 <= r < len(LAYOUT) and 0 <= c < len(LAYOUT[0]) and LAYOUT[r][c] in "#D"

def mask(r, c):
    return (1 if is_wall(r - 1, c) else 0) | (2 if is_wall(r, c + 1) else 0) | (4 if is_wall(r + 1, c) else 0) | (8 if is_wall(r, c - 1) else 0)

def person(im, fx, fy, col):
    d = ImageDraw.Draw(im)
    d.ellipse([fx - 20, fy - 6, fx + 20, fy + 4], fill=(30, 20, 30, 110))
    d.rounded_rectangle([fx - 16, fy - 80, fx + 16, fy - 2], 8, fill=col + (255,), outline=(40, 28, 30, 255), width=2)
    d.ellipse([fx - 22, fy - 128, fx + 22, fy - 76], fill=(250, 214, 180, 255), outline=(40, 28, 30, 255), width=2)

def render(show_grid=False):
    rows, cols = len(LAYOUT), len(LAYOUT[0])
    im = Image.new("RGBA", (cols * T, rows * T))
    for r in range(rows):
        for c in range(cols):
            im.alpha_composite(GRASS, (c * T, r * T))
            if FLOORED(r, c):
                im.alpha_composite(FLOOR, (c * T, r * T))
    for r in range(rows):
        for c in range(cols):
            if LAYOUT[r][c] == "#":
                im.alpha_composite(WALL[mask(r, c)], (c * T, r * T))
    # 인물 (칸, 색): 북벽 앞 / 남벽 안쪽 / 칸막이 옆 / 집 밖 북쪽
    for (cx, cy, col) in [(3, 2, (90, 140, 210)), (6, 7, (220, 110, 120)), (4, 3, (230, 180, 70)), (7, 0, (120, 190, 110))]:
        person(im, cx * T + 32, (cy + 1) * T - 6, col)
    if show_grid:
        d = ImageDraw.Draw(im)
        for r in range(rows + 1):
            d.line([(0, r * T), (cols * T, r * T)], fill=(0, 255, 255, 90))
        for c in range(cols + 1):
            d.line([(c * T, 0), (c * T, rows * T)], fill=(0, 255, 255, 90))
    return im.resize((cols * 100, rows * 100), Image.NEAREST)

if __name__ == "__main__":
    render().save(os.path.join(HERE, f"mockup_room{SUFFIX}.png"))
    render(True).save(os.path.join(HERE, f"mockup_room_grid{SUFFIX}.png"))
    print("ok")
