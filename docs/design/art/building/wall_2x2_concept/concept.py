# -*- coding: utf-8 -*-
"""벽 2×2 사분면 방식 개념 검증 (2026-10-05). 그림은 임시(윗면 = 코드로 그린 짙은 판, 앞면 = woodland 벽면 띠).

배치 한 칸(unit) = 64px 타일 2×2. 벽 unit 하나 = 타일 4장:
  TL/TR (위 줄) = 윗면. 자기 모서리 쪽 이웃 3개(세로·가로·대각)로 테두리 결정
  BL/BR (아래 줄) = 남쪽 unit 이 비면 앞면(좌/우 끝 마감은 옆 unit 도 앞면인지로), 남쪽이 벽이면 윗면
사분면 상태는 5가지(바깥 모서리 / 가로 변 / 세로 변 / 안쪽 모서리 / 채움) → 등록 타일 약 20장.
"""
from PIL import Image, ImageDraw
import os, random

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
T = 64
CAP = (58, 40, 30, 255); CAP2 = (50, 34, 26, 255); RIM = (201, 139, 85, 255); RIM2 = (143, 89, 52, 255); OUT = (33, 20, 15, 255)

SRC = Image.open(os.path.join(HERE, "..", "woodland_64", "tileset_64.png")).convert("RGBA")
W2 = SRC.crop((64, 64, 128, 128)); W3 = SRC.crop((128, 64, 192, 128))
BAND = Image.new("RGBA", (T, 51))
BAND.paste(W2.crop((16, 6, 48, 57)), (0, 0)); BAND.paste(W3.crop((16, 6, 48, 57)), (32, 0))
POST = W2.crop((0, 3, 14, 59))


def cap_tile(rim_v_side, rim_h_side, inner, seed):
    """rim_v_side: 'L'/'R'/None (세로 변 테두리), rim_h_side: 'T'/'B'/None (가로 변), inner: 모서리 위치 문자열 'TL'.. or None."""
    im = Image.new("RGBA", (T, T), CAP)
    rng = random.Random(seed)
    px = im.load()
    for _ in range(60):
        x, y = rng.randrange(T - 1), rng.randrange(T - 1)
        px[x, y] = CAP2; px[x + 1, y] = CAP2
    d = ImageDraw.Draw(im)
    if rim_h_side == "T":
        d.rectangle([0, 0, T - 1, 0], fill=OUT); d.rectangle([0, 1, T - 1, 3], fill=RIM); d.rectangle([0, 4, T - 1, 4], fill=RIM2)
    if rim_h_side == "B":
        d.rectangle([0, T - 5, T - 1, T - 5], fill=RIM2); d.rectangle([0, T - 4, T - 1, T - 2], fill=RIM); d.rectangle([0, T - 1, T - 1, T - 1], fill=OUT)
    if rim_v_side == "L":
        d.rectangle([0, 0, 0, T - 1], fill=OUT); d.rectangle([1, 0, 3, T - 1], fill=RIM); d.rectangle([4, 0, 4, T - 1], fill=RIM2)
    if rim_v_side == "R":
        d.rectangle([T - 5, 0, T - 5, T - 1], fill=RIM2); d.rectangle([T - 4, 0, T - 2, T - 1], fill=RIM); d.rectangle([T - 1, 0, T - 1, T - 1], fill=OUT)
    if inner:  # 안쪽 모서리: 대각선만 빈 곳에 작은 ㄱ 테두리
        x0 = 0 if "L" in inner else T - 5
        y0 = 0 if "T" in inner else T - 5
        d.rectangle([x0, y0, x0 + 4, y0 + 4], fill=RIM)
    return im


def face_tile(left_end, right_end):
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, T - 1, 2], fill=RIM)            # 윗면 앞 모서리(립)
    d.rectangle([0, 3, T - 1, 12], fill=(110, 66, 40, 255))
    im.alpha_composite(BAND, (0, 13))
    if left_end:
        im.alpha_composite(POST.crop((0, 0, 14, 54)), (0, 10))
    if right_end:
        im.alpha_composite(POST.crop((0, 0, 14, 54)).transpose(Image.FLIP_LEFT_RIGHT), (T - 14, 10))
    return im


TILES = {}


def tile(key, fn):
    if key not in TILES:
        TILES[key] = fn()
    return TILES[key]


def unit_tiles(W, ux, uy):
    w = lambda x, y: (x, y) in W
    n, s, e, wst = w(ux, uy - 1), w(ux, uy + 1), w(ux + 1, uy), w(ux - 1, uy)
    ne, nw, se, sw = w(ux + 1, uy - 1), w(ux - 1, uy - 1), w(ux + 1, uy + 1), w(ux - 1, uy + 1)

    def capq(vert_open, horiz_open, vside, hside, diag_open, corner):
        key = ("cap", vside if vert_open else None, hside if horiz_open else None, corner if (not vert_open and not horiz_open and diag_open) else None)
        return tile(key, lambda: cap_tile(key[1], key[2], key[3], hash(key) & 0xffff))

    TL = capq(not wst, not n, "L", "T", not nw, "TL")
    TR = capq(not e, not n, "R", "T", not ne, "TR")
    if not s:
        BL = tile(("face", not (wst and not sw), "x"), lambda: face_tile(not (wst and not sw), False))
        BR = tile(("face", "x", not (e and not se)), lambda: face_tile(False, not (e and not se)))
    else:
        BL = capq(not wst, False, "L", "B", not sw, "BL")
        BR = capq(not e, False, "R", "B", not se, "BR")
    return TL, TR, BL, BR


# unit 배치도: # 벽, D 문 자리(벽으로 계산, 그림 없음), f 바닥, . 잔디
LAYOUT = [
    "............",
    ".#######....",
    ".#ff#ff#.##.",
    ".#ff#ff#.##.",
    ".#f##D##....",
    ".#fffff#.#..",
    ".###D###....",
    "............",
]


def render():
    rows, cols = len(LAYOUT), len(LAYOUT[0])
    W = {(c, r) for r in range(rows) for c in range(cols) if LAYOUT[r][c] in "#D"}
    im = Image.new("RGBA", (cols * 2 * T, rows * 2 * T))
    grass = Image.open(os.path.join(REPO, "tileimg", "FullGrass.png")).convert("RGBA")
    floor = Image.open(os.path.join(HERE, "..", "woodland_64", "connect", "tiles", "BuildWoodFloor.png")).convert("RGBA")
    for r in range(rows * 2):
        for c in range(cols * 2):
            im.alpha_composite(grass, (c * T, r * T))
            if 1 <= c // 2 <= 7 and 1 <= r // 2 <= 6:
                im.alpha_composite(floor, (c * T, r * T))
    for r in range(rows):
        for c in range(cols):
            if LAYOUT[r][c] == "#":
                q = unit_tiles(W, c, r)
                for i, t in enumerate(q):
                    im.alpha_composite(t, ((c * 2 + i % 2) * T, (r * 2 + i // 2) * T))
    d = ImageDraw.Draw(im)
    for (ux, uy, col) in [(2, 2, (90, 140, 210)), (5, 5, (220, 110, 120)), (3, 0, (120, 190, 110))]:
        fx, fy = ux * 2 * T + 64, (uy + 1) * 2 * T - 8
        d.ellipse([fx - 22, fy - 7, fx + 22, fy + 5], fill=(30, 20, 30, 110))
        d.rounded_rectangle([fx - 18, fy - 80, fx + 18, fy - 2], 9, fill=col + (255,), outline=(40, 28, 30, 255), width=2)
        d.ellipse([fx - 24, fy - 128, fx + 24, fy - 76], fill=(250, 214, 180, 255), outline=(40, 28, 30, 255), width=2)
    scale = 100 / 64 * 0.5   # 화면 절반 축소로 전체 보기
    out = im.resize((int(im.width * scale), int(im.height * scale)), Image.NEAREST)
    out.save(os.path.join(HERE, "concept_mockup.png"))
    im.crop((0, 0, 8 * T, 8 * T)).resize((8 * 100, 8 * 100), Image.NEAREST).save(os.path.join(HERE, "concept_mockup_zoom.png"))
    print("distinct tiles used:", len(TILES))


if __name__ == "__main__":
    render()
