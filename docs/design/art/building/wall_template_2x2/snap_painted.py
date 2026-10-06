# -*- coding: utf-8 -*-
"""이미지 생성 채색본(v2) → 템플릿 규격 정규화 (2026-10-05).

template_painted_imagegen_v2.png 는 1341×1173(512×448 의 약 2.62배, 정수배 아님)이고 세로 배치가
아래로 갈수록 최대 20px(1x 기준) 위로 밀려 있다. 그래서 v2 를 '재질 원본'으로만 쓰고, 템플릿 좌표로
다시 짠다(build_template.py 의 영역·띠 규격 그대로).

  · 띠 재질(트림·그늘·벽지·레일·징두리·걸레받이·사이딩·돌·기초): v2 에서 깨끗한 구간을 64px 주기로 잘라 축소
      - 돌 기초: 줄눈 열(x1072 · x1241, 169px = 1칸) 사이   - 징두리: 판 이음(x88 · x234, 판 4장) 사이
      - 벽지: 문양 반복 2주기(224px)                          - 트림·사이딩·그늘: 6px 겹쳐 섞기(이어지는 원본 구간 사용)
  · 윗면: v2 의 어두운 면 평균색(36,36,45, 표준편차 1 — 거의 단색) + 트림 질감으로 코드 조립
  · 문 4·창 2: v2 의 그림을 실루엣 마스크(상인방/머리 · 문틀 몸통 · 창턱)로만 오려 템플릿 위치에 얹음 —
      주변 벽 띠는 평범한 앞면과 같은 픽셀이라 이웃 칸과 이음매가 없다
  · 바닥 4: 판자 이음 위치에서 잘라 64px, 위아래는 섞어 이음매 제거
산출: template_painted_v2_snapped.png (512×448) — build_template.py --check / --compose 로 검증.
"""
from PIL import Image, ImageFilter, ImageDraw
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_template as bt   # 영역·띠·시트 배치 단일 소스

SRC = Image.open(os.path.join(HERE, "template_painted_imagegen_v2.png")).convert("RGBA")
T, U, TR = bt.T, bt.U, bt.TR
OUT = os.path.join(HERE, "template_painted_v2_snapped.png")


def shrink(im, size):
    """고해상도 원본 → 목표 크기. LANCZOS 후 약한 언샤프로 도트 밀도 유지."""
    out = im.resize(size, Image.Resampling.LANCZOS)
    return out.filter(ImageFilter.UnsharpMask(radius=0.8, percent=70, threshold=1))


def band(x0, x1, y0, y1, out_w, out_h, blend_x=0, blend_y=0):
    """원본 [x0,x1)×[y0,y1) 을 out 크기로. blend>0 이면 원본 오른쪽/아래로 이어지는 구간을 겹쳐 섞어 감싸기 이음매 제거."""
    sx = (x1 - x0) / out_w
    sy = (y1 - y0) / out_h
    ex = int(round(blend_x * sx)) if blend_x else 0
    ey = int(round(blend_y * sy)) if blend_y else 0
    ext = shrink(SRC.crop((x0, y0, x1 + ex, y1 + ey)), (out_w + blend_x, out_h + blend_y))
    px = ext.load()
    tile = Image.new("RGBA", (out_w, out_h))
    tp = tile.load()
    for y in range(out_h):
        for x in range(out_w):
            p = px[x, y]
            if blend_x and x < blend_x:     # 왼쪽 끝을 '오른쪽 너머' 픽셀과 섞는다 → 오른쪽 끝과 이어짐
                q = px[out_w + x, y]
                t = x / blend_x
                p = tuple(int(q[i] * (1 - t) + p[i] * t) for i in range(4))
            tp[x, y] = p
    if blend_y:
        tp2 = tile.copy().load()
        for y in range(blend_y):
            t = y / blend_y
            for x in range(out_w):
                q = px[x, out_h + y] if x >= blend_x else tp2[x, y]
                p = tp2[x, y]
                tp[x, y] = tuple(int(q[i] * (1 - t) + p[i] * t) for i in range(4))
    return tile


def tiled(sw, w, h):
    im = Image.new("RGBA", (w, h))
    for y in range(0, h, sw.height):
        for x in range(0, w, sw.width):
            im.paste(sw, (x, y))
    return im


# ── 재질 견본 (v2 좌표, 실측) ──────────────────────────────────────────
TRIM_H = band(300, 468, 151, 178, T, TR, blend_x=6)          # 가로 트림 (위아래 외곽선 포함)
TRIM_V = band(0, 30, 200, 368, TR, T, blend_y=6)             # 세로 트림 (내벽 앞면 왼쪽 끝 트림)
CROWN = band(300, 468, 177, 189, T, 4, blend_x=6)
INT = {
    "MAIN": band(100, 324, 189, 356, T, 68),                 # 벽지 2주기(224px)
    "RAIL": band(300, 468, 356, 376, T, 6, blend_x=6),
    "WAIN": band(88, 234, 376, 458, T, 30),                  # 판자 4장 (이음 x88·x234)
    "BASE": band(300, 468, 458, 479, T, 8, blend_x=6),
}
EXT = {
    "MAIN": band(800, 968, 189, 377, T, 68, blend_x=6),      # 사이딩
    "RAIL": band(800, 968, 376, 388, T, 6, blend_x=6),
    "WAIN": band(1072, 1241, 386, 469, T, 30, blend_x=4),   # 돌 (줄눈 x1072·x1241, 이어지는 4px 섞기)
    "BASE": band(1072, 1241, 469, 480, T, 8, blend_x=4),
}
TOP_RGB = (37, 37, 46, 255)
FLOORS = [band(x0, x1, 800, 968, T, T, blend_y=6) for (x0, x1) in [(757, 920), (841, 1006), (1006, 1173), (1139, 1305)]]


def face_unit(kind, lend, rend):
    mat = INT if kind == "INT" else EXT
    im = Image.new("RGBA", (U, U))
    im.alpha_composite(tiled(TRIM_H, U, TR), (0, 0))
    im.alpha_composite(tiled(CROWN, U, 4), (0, 12))
    y = 16
    for key, h in (("MAIN", 68), ("RAIL", 6), ("WAIN", 30), ("BASE", 8)):
        im.alpha_composite(tiled(mat[key], U, h), (0, y))
        y += h
    if lend:
        im.alpha_composite(tiled(TRIM_V, TR, U), (0, 0))
    if rend:
        im.alpha_composite(tiled(TRIM_V, TR, U), (U - TR, 0))
    return im


def top_tile(kind):
    im = Image.new("RGBA", (T, T), TOP_RGB)
    if kind in ("top_outer_TL", "top_outer_TR", "top_edge_T"):
        im.alpha_composite(TRIM_H, (0, 0))
    if kind in ("top_outer_TL", "top_edge_L"):
        im.alpha_composite(TRIM_V, (0, 0))
    if kind in ("top_outer_TR", "top_edge_R"):
        im.alpha_composite(TRIM_V, (T - TR, 0))
    if kind == "top_nub_TL":
        im.alpha_composite(TRIM_V.crop((0, 0, TR, TR)), (0, 0))
    if kind == "top_nub_TR":
        im.alpha_composite(TRIM_V.crop((0, 0, TR, TR)), (T - TR, 0))
    return im


def paste_art(base, box_src, body_x, head_rows_src, tail_rows_src, dst_xy, scale):
    """v2 그림 box_src=(x0,y0,x1,y1) 을 scale 로 축소해 dst_xy 에 얹는다.
    마스크: 머리 행(head_rows_src)·꼬리 행(tail_rows_src) 은 전체 폭, 나머지는 body_x=(bx0,bx1) 만."""
    x0, y0, x1, y1 = box_src
    w, h = int(round((x1 - x0) / scale)), int(round((y1 - y0) / scale))
    art = shrink(SRC.crop(box_src), (w, h))
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    to_x = lambda sx: int(round((sx - x0) / scale))
    to_y = lambda sy: int(round((sy - y0) / scale))
    d.rectangle([to_x(body_x[0]), 0, to_x(body_x[1]) - 1, h - 1], fill=255)
    if head_rows_src:
        d.rectangle([0, 0, w - 1, to_y(head_rows_src[1]) - 1], fill=255)
    if tail_rows_src:
        d.rectangle([0, to_y(tail_rows_src[0]), w - 1, h - 1], fill=255)
    base.paste(art, dst_xy, mask)


DOORS = {   # 이름: (상인방 x0, x1, 문틀 몸통 x0, x1)  — 세로는 공통 y509(상인방 위)~787(문 아래)
    "door_INT_closed": (59, 280, 67, 269),
    "door_INT_open": (396, 616, 403, 607),
    "door_EXT_closed": (726, 949, 735, 939),
    "door_EXT_open": (1062, 1280, 1070, 1272),
}
WINDOWS = {  # 이름: x0 (창 머리·창턱 x 범위 x0..x0+221, 틀 몸통 x0+8..x0+213), 세로 y843(창 머리 외곽선)~999
    "window_INT": 59,
    "window_EXT": 392,
}


def door_unit(name):
    kind = "INT" if "_INT_" in name else "EXT"
    lx0, lx1, jx0, jx1 = DOORS[name]
    im = face_unit(kind, False, False)
    scale = 2.5
    w = int(round((lx1 - lx0) / scale))
    h = int(round((787 - 509) / scale))
    paste_art(im, (lx0, 509, lx1, 787), (jx0, jx1), (509, 537), None, (64 - w // 2, U - h), scale)
    return im


def window_unit(name):
    kind = "INT" if name.endswith("INT") else "EXT"
    x0 = WINDOWS[name]
    im = face_unit(kind, False, False)
    scale = 2.6
    w = int(round(221 / scale))
    paste_art(im, (x0, 843, x0 + 221, 999), (x0 + 8, x0 + 213), (843, 870), (980, 999), (64 - w // 2, 24), scale)
    return im


def build():
    out = Image.new("RGBA", (bt.SHEET_W * T, bt.SHEET_H * T), (0, 0, 0, 0))
    for i, k in enumerate(bt.TOP_KINDS):
        out.alpha_composite(top_tile(k), (i * T, 0))
    for j, kind in enumerate(("INT", "EXT")):
        c0 = j * 4
        out.alpha_composite(face_unit(kind, True, False), (c0 * T, T))
        out.alpha_composite(face_unit(kind, False, True), ((c0 + 2) * T, T))
    for i, name in enumerate(("door_INT_closed", "door_INT_open", "door_EXT_closed", "door_EXT_open")):
        out.alpha_composite(door_unit(name), (i * 2 * T, 3 * T))
    out.alpha_composite(window_unit("window_INT"), (0, 5 * T))
    out.alpha_composite(window_unit("window_EXT"), (2 * T, 5 * T))
    for n in range(4):
        out.alpha_composite(FLOORS[n], ((4 + n) * T, 5 * T))
    blank_alpha = Image.open(os.path.join(HERE, "template_blank.png")).convert("RGBA").split()[3]
    out.putalpha(blank_alpha.point(lambda a: 255 if a > 127 else 0))
    out.save(OUT)
    print("saved", OUT, out.size)


if __name__ == "__main__":
    build()
