# -*- coding: utf-8 -*-
"""건축 타일셋 템플릿 생성기 (2026-10-05).

문법 (building-system-v2.md §3 개정 2·3):
  배치 한 칸(unit) = 64px 타일 2×2 = 128px. 벽 unit 은 타일 4장(TL TR / BL BR)으로 그린다.
  - 남쪽 unit 도 벽  → TOP unit : 벽 윗면(어두운 덩어리) + 벽이 아닌 쪽/앞면 쪽 변에 트림(12px)
  - 남쪽 unit 이 빔  → FACE unit: unit 전체가 앞면(키 높이). 맨 위 12px 트림 고정.
      남쪽에 건축 바닥 → 내벽(INT), 아니면 외벽(EXT). 옆이 비면 그쪽 끝에 세로 트림.
  타일 선택 규칙은 compose() 의 quadrants() 가 단일 소스.

산출:
  template_blank.png  : 칠할 원본 (영역 단색, 글자·선 없음) 512×448
  template_guide.png  : 확대 + 칸 번호 + 영역 범례 (사람/모델 참고용)
  preview_house.png   : 템플릿 조각만으로 조립한 집 (구조 검증)
  zones.json          : 영역 색 ↔ 이름 ↔ 설명, 타일 이름 ↔ 시트 좌표
칠한 시트를 받으면: python build_template.py --compose <painted.png>  → preview_house_painted.png
"""
from PIL import Image, ImageDraw, ImageFont
import os, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
T, U, TR = 64, 128, 12   # 타일 · unit · 트림 두께(px)

# ── 영역 (색은 서로 달라야 한다 — 색으로 영역을 판별) ─────────────────────
ZONES = {
    "TOP":        ("#262633", "벽 윗면 — 위에서 본 벽 덩어리(레퍼런스의 검은 영역). 아주 어둡게, 이음매 없이"),
    "TRIM":       ("#E0913F", "트림 — 윗면 가장자리 나무 몰딩. 방·바깥과 맞닿는 변과 앞면 맨 위에 두른다"),
    "CROWN":      ("#7B4A2B", "앞면 맨 위 그늘(크라운 몰딩) 4px"),
    "INT_MAIN":   ("#F0D2B0", "내벽 상단 — 벽지·회벽·벽돌 등 실내 벽면"),
    "INT_RAIL":   ("#8A5A30", "내벽 체어레일(가로 몰딩)"),
    "INT_WAIN":   ("#C0905F", "내벽 하단 징두리 판자"),
    "INT_BASE":   ("#4F321D", "내벽 걸레받이 — 바닥과 맞닿는 선"),
    "EXT_MAIN":   ("#A8C8DC", "외벽 상단 — 판자·통나무 사이딩"),
    "EXT_RAIL":   ("#5E6B78", "외벽 띠장(가로 보)"),
    "EXT_WAIN":   ("#9C9C9C", "외벽 하단 — 돌 기초"),
    "EXT_BASE":   ("#555555", "외벽 기초 아랫단 — 땅과 맞닿는 선"),
    "DOOR_FRAME": ("#6B4226", "문틀(양 기둥 + 상인방)"),
    "DOOR_LEAF":  ("#C47A45", "문짝"),
    "OPENING":    ("#141418", "열린 문 너머(어두운 안쪽)"),
    "THRESHOLD":  ("#A88058", "문지방(바닥과 이어짐)"),
    "WIN_FRAME":  ("#5C3A20", "창틀"),
    "GLASS":      ("#9FD6F0", "유리"),
    "SILL":       ("#B5804A", "창턱"),
    "FLOOR1":     ("#D2AE82", "바닥 1 (기본)"),
    "FLOOR2":     ("#C9A579", "바닥 2 (변형)"),
    "FLOOR3":     ("#DAB68A", "바닥 3 (변형)"),
    "FLOOR4":     ("#C29E72", "바닥 4 (변형)"),
}
RGB = {k: tuple(int(v[0][i:i + 2], 16) for i in (1, 3, 5)) + (255,) for k, v in ZONES.items()}

# 앞면 가로 띠 (unit 기준 y 구간, 끝 포함)
FACE_BANDS = [("TRIM", 0, 11), ("CROWN", 12, 15), ("MAIN", 16, 83), ("RAIL", 84, 89), ("WAIN", 90, 119), ("BASE", 120, 127)]


def rect(im, zone, x0, y0, x1, y1):
    ImageDraw.Draw(im).rectangle([x0, y0, x1, y1], fill=RGB[zone])


# ── 윗면 타일 (64×64) ─────────────────────────────────────────────────
def top_tile(kind):
    im = Image.new("RGBA", (T, T), RGB["TOP"])
    e = T - 1
    if kind in ("top_outer_TL", "top_outer_TR", "top_edge_T"):
        rect(im, "TRIM", 0, 0, e, TR - 1)
    if kind in ("top_outer_TL", "top_edge_L"):
        rect(im, "TRIM", 0, 0, TR - 1, e)
    if kind in ("top_outer_TR", "top_edge_R"):
        rect(im, "TRIM", T - TR, 0, e, e)
    if kind == "top_nub_TL":
        rect(im, "TRIM", 0, 0, TR - 1, TR - 1)
    if kind == "top_nub_TR":
        rect(im, "TRIM", T - TR, 0, e, TR - 1)
    return im


TOP_KINDS = ["top_outer_TL", "top_edge_T", "top_outer_TR", "top_edge_L", "top_fill", "top_edge_R", "top_nub_TL", "top_nub_TR"]


# ── 앞면 unit (128×128) ───────────────────────────────────────────────
def face_unit(kind, lend, rend):
    im = Image.new("RGBA", (U, U), (0, 0, 0, 0))
    for band, y0, y1 in FACE_BANDS:
        zone = band if band in ("TRIM", "CROWN") else f"{kind}_{band}"
        rect(im, zone, 0, y0, U - 1, y1)
    if lend:
        rect(im, "TRIM", 0, 0, TR - 1, U - 1)
    if rend:
        rect(im, "TRIM", U - TR, 0, U - 1, U - 1)
    return im


def door_unit(kind, opened):
    im = face_unit(kind, False, False)
    rect(im, "DOOR_FRAME", 24, 16, 35, 127)
    rect(im, "DOOR_FRAME", 92, 16, 103, 127)
    rect(im, "DOOR_FRAME", 24, 16, 103, 27)
    if opened:
        rect(im, "OPENING", 36, 28, 91, 119)
        rect(im, "DOOR_LEAF", 36, 28, 43, 119)   # 안쪽으로 젖혀진 문짝 모서리
    else:
        rect(im, "DOOR_LEAF", 36, 28, 91, 119)
    rect(im, "THRESHOLD", 36, 120, 91, 127)
    return im


def window_unit(kind):
    im = face_unit(kind, False, False)
    rect(im, "WIN_FRAME", 28, 24, 99, 77)
    rect(im, "GLASS", 34, 30, 93, 71)
    rect(im, "WIN_FRAME", 62, 30, 65, 71)      # 가운데 창살
    rect(im, "SILL", 24, 78, 103, 83)
    return im


def floor_tile(n):
    return Image.new("RGBA", (T, T), RGB[f"FLOOR{n}"])


# ── 시트 배치 (8열 × 7행, 64px) ─────────────────────────────────────────
SHEET_W, SHEET_H = 8, 7
LAYOUT_SHEET = {}   # 이름 → (col,row,w,h)  w/h = 타일 수


def build_sheet():
    sheet = Image.new("RGBA", (SHEET_W * T, SHEET_H * T), (0, 0, 0, 0))

    def put(name, im, col, row):
        sheet.alpha_composite(im, (col * T, row * T))
        LAYOUT_SHEET[name] = (col, row, im.width // T, im.height // T)

    for i, k in enumerate(TOP_KINDS):
        put(k, top_tile(k), i, 0)
    for j, kind in enumerate(("INT", "EXT")):
        c0 = j * 4
        seg = Image.new("RGBA", (U * 2, U), (0, 0, 0, 0))
        seg.alpha_composite(face_unit(kind, True, False), (0, 0))
        seg.alpha_composite(face_unit(kind, False, True), (U, 0))
        sheet.alpha_composite(seg, (c0 * T, 1 * T))
        names = {(0, 0): "U_L", (1, 0): "U_M", (2, 0): "U_M2", (3, 0): "U_R",
                 (0, 1): "D_L", (1, 1): "D_M", (2, 1): "D_M2", (3, 1): "D_R"}
        for (dx, dy), nm in names.items():
            LAYOUT_SHEET[f"face_{kind}_{nm}"] = (c0 + dx, 1 + dy, 1, 1)
    put("door_INT_closed", door_unit("INT", False), 0, 3)
    put("door_INT_open", door_unit("INT", True), 2, 3)
    put("door_EXT_closed", door_unit("EXT", False), 4, 3)
    put("door_EXT_open", door_unit("EXT", True), 6, 3)
    put("window_INT", window_unit("INT"), 0, 5)
    put("window_EXT", window_unit("EXT"), 2, 5)
    for n in range(1, 5):
        put(f"floor{n}", floor_tile(n), 3 + n, 5)
    return sheet


# ── 조립 규칙 (런타임 선택 규칙의 단일 소스) ───────────────────────────
def quadrants(walls, floors, kinds, ux, uy):
    """unit (ux,uy) 의 타일 4장 이름 [TL,TR,BL,BR]. walls: 벽 unit 집합, floors: 건축 바닥 unit 집합,
    kinds: 특수 unit {(x,y): 'door_closed'|'door_open'|'window'} (벽으로 계산)."""
    w = lambda x, y: (x, y) in walls
    is_top = lambda x, y: w(x, y) and w(x, y + 1)
    is_face = lambda x, y: w(x, y) and not w(x, y + 1)
    ftype = lambda x, y: "INT" if (x, y + 1) in floors else "EXT"
    x, y = ux, uy
    if is_top(x, y):
        nT = not is_top(x, y - 1)          # 북쪽: 비었으면 트림 (북쪽이 앞면 unit 일 수는 없다)
        wT = not is_top(x - 1, y)          # 서쪽: 비었거나 앞면 unit 이면 트림
        eT = not is_top(x + 1, y)

        def upper(side_trim, side, diag_open):
            if nT and side_trim:
                return f"top_outer_T{side}"
            if nT:
                return "top_edge_T"
            if side_trim:
                return f"top_edge_{side}"
            if diag_open:
                return f"top_nub_T{side}"
            return "top_fill"
        TL = upper(wT, "L", not w(x - 1, y - 1))
        TRn = upper(eT, "R", not w(x + 1, y - 1))
        BL = "top_edge_L" if wT else "top_fill"
        BR = "top_edge_R" if eT else "top_fill"
        return [TL, TRn, BL, BR]
    t = ftype(x, y)
    special = kinds.get((x, y))
    if special:
        key = {"door_closed": f"door_{t}_closed", "door_open": f"door_{t}_open", "window": f"window_{t}"}[special]
        return [(key, 0, 0), (key, 1, 0), (key, 0, 1), (key, 1, 1)]

    def end(nx, ny):   # 그쪽 끝에 세로 트림을 그릴지: 비었거나, 종류가 다른 앞면
        if not w(nx, ny):
            return True
        return is_face(nx, ny) and ftype(nx, ny) != t
    le, re = end(x - 1, y), end(x + 1, y)
    return [f"face_{t}_U_{'L' if le else 'M'}", f"face_{t}_U_{'R' if re else 'M'}",
            f"face_{t}_D_{'L' if le else 'M'}", f"face_{t}_D_{'R' if re else 'M'}"]


def slicer(sheet):
    cache = {}

    def get(name):
        key = name if isinstance(name, str) else name
        if key in cache:
            return cache[key]
        if isinstance(name, tuple):
            nm, dx, dy = name
            c, r, _, _ = LAYOUT_SHEET[nm]
            im = sheet.crop(((c + dx) * T, (r + dy) * T, (c + dx + 1) * T, (r + dy + 1) * T))
        else:
            c, r, _, _ = LAYOUT_SHEET[name]
            im = sheet.crop((c * T, r * T, (c + 1) * T, (r + 1) * T))
        cache[key] = im
        return im
    return get


# 예시 집 (unit 단위): # 벽, f 건축 바닥, D 문(닫힘), O 문(열림), W 창, . 잔디
_BASE = [
    "...............",
    ".######W####...",
    ".#ffff#ffff#.##",
    ".#ffff#ffff#.##",
    ".#fffffffff#...",
    ".##D######W#.#.",
    ".#fffffffff#...",
    ".#fffffffff#..#",
    ".#####O#####..#",
    "...............",
]
_GRID = [list(r + "." * 6) for r in _BASE]
# 두께 2칸 ㄱ자 벽 (안쪽 모서리 조각 top_nub_TL / top_nub_TR 검증용)
for (x, y) in [(17, 1), (18, 1), (16, 2), (17, 2), (18, 2), (16, 3), (17, 3), (18, 3)]:
    _GRID[y][x] = "#"
for (x, y) in [(16, 5), (17, 5), (16, 6), (17, 6), (18, 6), (16, 7), (17, 7), (18, 7)]:
    _GRID[y][x] = "#"
HOUSE = ["".join(r) for r in _GRID]
assert all(len(r) == len(HOUSE[0]) for r in HOUSE)


def compose(sheet, out_path, people=True):
    get = slicer(sheet)
    rows, cols = len(HOUSE), len(HOUSE[0])
    walls = {(c, r) for r in range(rows) for c in range(cols) if HOUSE[r][c] in "#DOW"}
    floors = {(c, r) for r in range(rows) for c in range(cols) if HOUSE[r][c] == "f"}
    kinds = {(c, r): {"D": "door_closed", "O": "door_open", "W": "window"}[HOUSE[r][c]]
             for r in range(rows) for c in range(cols) if HOUSE[r][c] in "DOW"}
    im = Image.new("RGBA", (cols * U, rows * U))
    grass = Image.open(os.path.join(REPO, "tileimg", "FullGrass.png")).convert("RGBA")
    used = set()
    for r in range(rows):
        for c in range(cols):
            for q in range(4):
                im.alpha_composite(grass, (c * U + (q % 2) * T, r * U + (q // 2) * T))
            if (c, r) in floors:
                for q in range(4):
                    im.alpha_composite(get("floor1"), (c * U + (q % 2) * T, r * U + (q // 2) * T))
    for (c, r) in sorted(walls):
        for q, name in enumerate(quadrants(walls, floors, kinds, c, r)):
            used.add(name if isinstance(name, str) else name[0])
            im.alpha_composite(get(name), (c * U + (q % 2) * T, r * U + (q // 2) * T))
    if people:
        d = ImageDraw.Draw(im)
        for (ux, uy, col) in [(3, 2, (90, 140, 210)), (8, 6, (220, 110, 120)), (6, 9, (120, 190, 110)), (12, 4, (230, 180, 70))]:
            fx, fy = ux * U + 64, (uy + 1) * U - 8
            d.ellipse([fx - 24, fy - 8, fx + 24, fy + 6], fill=(30, 20, 30, 110))
            d.rounded_rectangle([fx - 20, fy - 82, fx + 20, fy - 2], 10, fill=col + (255,), outline=(40, 28, 30, 255), width=3)
            d.ellipse([fx - 26, fy - 128, fx + 26, fy - 76], fill=(250, 214, 180, 255), outline=(40, 28, 30, 255), width=3)
    im.save(out_path)
    return used


def guide(sheet):
    Z = 2
    font_path = "C:/Windows/Fonts/malgun.ttf"
    f12 = ImageFont.truetype(font_path, 12) if os.path.exists(font_path) else ImageFont.load_default()
    f14 = ImageFont.truetype(font_path, 15) if os.path.exists(font_path) else ImageFont.load_default()
    sw, sh = sheet.width * Z, sheet.height * Z
    legend_w = 640
    im = Image.new("RGBA", (sw + legend_w, max(sh, 40 + 24 * len(ZONES))), (245, 242, 236, 255))
    chk = Image.new("RGBA", (sw, sh), (255, 255, 255, 255))
    dc = ImageDraw.Draw(chk)
    for y in range(0, sh, 16):
        for x in range(0, sw, 16):
            if (x + y) // 16 % 2:
                dc.rectangle([x, y, x + 15, y + 15], fill=(225, 225, 225, 255))
    im.alpha_composite(chk, (0, 0))
    im.alpha_composite(sheet.resize((sw, sh), Image.NEAREST), (0, 0))
    d = ImageDraw.Draw(im)
    for x in range(0, sw + 1, T * Z):
        d.line([(x, 0), (x, sh)], fill=(255, 0, 255, 255), width=1)
    for y in range(0, sh + 1, T * Z):
        d.line([(0, y), (sw, y)], fill=(255, 0, 255, 255), width=1)
    for name, (c, r, w_, h_) in LAYOUT_SHEET.items():
        d.text((c * T * Z + 4, r * T * Z + 3), name, fill=(255, 0, 255, 255), font=f12)
    for c in range(4, 8):   # 예약 칸
        d.text((c * T * Z + 4, 6 * T * Z + 3), "예약(비움)", fill=(140, 140, 140, 255), font=f12)
    x0 = sw + 16
    d.text((x0, 8), "영역 범례 — 색 = 재질 자리. 경계 픽셀 위치는 바꾸지 말 것", fill=(30, 30, 30, 255), font=f14)
    for i, (k, (hexc, desc)) in enumerate(ZONES.items()):
        y = 36 + i * 24
        d.rectangle([x0, y, x0 + 18, y + 16], fill=RGB[k], outline=(30, 30, 30, 255))
        d.text((x0 + 26, y), f"{k}  {desc}", fill=(30, 30, 30, 255), font=f12)
    return im


def check(sheet, painted):
    """칠한 시트 검사: 크기 · 투명 영역 일치 · 타일 경계 이음(가로 띠 연속) 요약."""
    probs = []
    if painted.size != sheet.size:
        return [f"크기 {painted.size} ≠ {sheet.size}"]
    a0, a1 = sheet.split()[3], painted.split()[3]
    diff = sum(1 for p, q in zip(a0.tobytes(), a1.tobytes()) if (p > 127) != (q > 127))
    if diff:
        probs.append(f"투명/불투명 영역이 템플릿과 다른 픽셀 {diff}개")
    get = slicer(painted)

    def seam(a, b, axis):
        if axis == "x":
            ca = [a.getpixel((63, y)) for y in range(T)]
            cb = [b.getpixel((0, y)) for y in range(T)]
        else:
            ca = [a.getpixel((x, 63)) for x in range(T)]
            cb = [b.getpixel((x, 0)) for x in range(T)]
        return sum(sum(abs(p[i] - q[i]) for i in range(3)) / 3 for p, q in zip(ca, cb)) / T
    pairs = []
    for t in ("INT", "EXT"):
        for row in ("U", "D"):
            for l, r in [("L", "M"), ("M", "M"), ("M", "R"), ("M", "M2"), ("M2", "M")]:
                pairs.append((f"face_{t}_{row}_{l}", f"face_{t}_{row}_{r}", "x"))
        for c in ("L", "M", "R"):
            pairs.append((f"face_{t}_U_{c}", f"face_{t}_D_{c}", "y"))
    for a, b in [("top_fill", "top_fill"), ("top_edge_T", "top_edge_T"), ("top_edge_L", "top_edge_L")]:
        pairs.append((a, b, "x" if a != "top_edge_L" else "y"))
    worst = sorted(((seam(get(a), get(b), ax), a, b, ax) for a, b, ax in pairs), reverse=True)[:6]
    probs.append("이음 경계 평균 색 차이 상위: " + ", ".join(f"{a}→{b}({ax}) {v:.1f}" for v, a, b, ax in worst))
    return probs


def main():
    sheet = build_sheet()
    if "--check" in sys.argv:
        painted = Image.open(sys.argv[sys.argv.index("--check") + 1]).convert("RGBA")
        for p in check(sheet, painted):
            print("-", p)
        return
    if "--compose" in sys.argv:
        painted = Image.open(sys.argv[sys.argv.index("--compose") + 1]).convert("RGBA")
        assert painted.size == sheet.size, f"시트 크기 {painted.size} ≠ {sheet.size}"
        used = compose(painted, os.path.join(HERE, "preview_house_painted.png"))
        print("composed painted sheet; tiles used:", len(used))
        return
    sheet.save(os.path.join(HERE, "template_blank.png"))
    guide(sheet).save(os.path.join(HERE, "template_guide.png"))
    used = compose(sheet, os.path.join(HERE, "preview_house.png"))
    meta = {
        "tile_px": T, "unit_px": U, "trim_px": TR,
        "face_bands_unit_y": FACE_BANDS,
        "zones": {k: {"color": v[0], "desc": v[1]} for k, v in ZONES.items()},
        "sheet_tiles": {k: {"col": c, "row": r, "w": w_, "h": h_} for k, (c, r, w_, h_) in LAYOUT_SHEET.items()},
    }
    with open(os.path.join(HERE, "zones.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print("sheet", sheet.size, "tiles used in preview:", len(used), sorted(used))


if __name__ == "__main__":
    main()
