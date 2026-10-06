# -*- coding: utf-8 -*-
"""건축 타일 등록 자료 생성 + 런타임 문법 교차 검증 (2026-10-06).

입력: template_painted_v2_snapped.png (512×448, build_template.py 시트 규격)
산출: register/
  Cabin_strip.png        — 48타일 가로 스트립(64px). wall.tileset 에 이 순서대로 등록한다.
  cabin-tiles.json       — 스트립 순서 · 타일 이름 · IsCollidable
  tiles/Cabin_*.png      — 낱장 (개별 등록·확인용)
  Cabin_strip_labeled.png — 이름표를 단 확인용 시트
  icons/*.png            — 아이템 아이콘 후보 128×128 (선택 등록)
  verify_basic_cabin.png — BuildingManager.ComputeQuadrants 를 그대로 옮긴 문법으로 기본형 오두막(BlueprintDataSet)을 조립한 결과

타일 이름 규약(BuildingManager.PaintUnit): "<Style>_<키>", Style = BuildPieceDataSet.Style ("Cabin").
막힘 = 구조물 레이어(RectTileMap7)에 칠하는 타일: 윗면·앞면·창문·닫힌 문.  통행 = 바닥 레이어(RectTileMap3): 바닥·열린 문.
"""
from PIL import Image, ImageDraw
import csv, io, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
SHEET = Image.open(os.path.join(HERE, "template_painted_v2_snapped.png")).convert("RGBA")
OUT = os.path.join(HERE, "register")
T = 64
STYLE = "Cabin"

TOP_KINDS = ["top_outer_TL", "top_edge_T", "top_outer_TR", "top_edge_L", "top_fill", "top_edge_R", "top_nub_TL", "top_nub_TR"]


def tile_table():
    """(키, 시트 열, 시트 행, 막힘) — 등록 순서 그대로."""
    rows = []
    for i, k in enumerate(TOP_KINDS):
        rows.append((k, i, 0, True))
    for kind, c0 in (("INT", 0), ("EXT", 4)):
        # 시트 열: c0 = 왼쪽 끝 단위의 L, c0+1 = M, c0+3 = 오른쪽 끝 단위의 R (c0+2 는 M 과 같은 그림)
        for half, r in (("U", 1), ("D", 2)):
            rows.append((f"face_{kind}_{half}_L", c0, r, True))
            rows.append((f"face_{kind}_{half}_M", c0 + 1, r, True))
            rows.append((f"face_{kind}_{half}_R", c0 + 3, r, True))
    for i, name in enumerate(("door_INT_closed", "door_INT_open", "door_EXT_closed", "door_EXT_open")):
        blocked = name.endswith("closed")
        c, r = i * 2, 3
        rows += [(f"{name}_TL", c, r, blocked), (f"{name}_TR", c + 1, r, blocked),
                 (f"{name}_BL", c, r + 1, blocked), (f"{name}_BR", c + 1, r + 1, blocked)]
    for i, name in enumerate(("window_INT", "window_EXT")):
        c, r = i * 2, 5
        rows += [(f"{name}_TL", c, r, True), (f"{name}_TR", c + 1, r, True),
                 (f"{name}_BL", c, r + 1, True), (f"{name}_BR", c + 1, r + 1, True)]
    for n in range(4):
        rows.append((f"floor{n + 1}", 4 + n, 5, False))
    return rows


def crop(c, r, w=1, h=1):
    return SHEET.crop((c * T, r * T, (c + w) * T, (r + h) * T))


# ── BuildingManager 문법 이식 (월드 좌표, y 위쪽 +) — mlua 와 한 줄씩 대응 ──────────────
STRUCT = ("wall", "door", "window")


def is_struct(units, x, y):
    u = units.get((x, y))
    return u is not None and u["k"] in STRUCT


def is_floor(units, x, y):
    u = units.get((x, y))
    return u is not None and u["k"] == "floor"


def is_top(units, x, y):
    return is_struct(units, x, y) and is_struct(units, x, y - 1)


def is_face(units, x, y):
    return is_struct(units, x, y) and not is_struct(units, x, y - 1)


def face_type(units, x, y):
    return "INT" if is_floor(units, x, y - 1) else "EXT"


def top_upper_key(nT, side_trim, side, diag_open):
    if nT and side_trim:
        return "top_outer_T" + side
    if nT:
        return "top_edge_T"
    if side_trim:
        return "top_edge_" + side
    if diag_open:
        return "top_nub_T" + side
    return "top_fill"


def is_face_end(units, nx, ny, t):
    if not is_struct(units, nx, ny):
        return True
    return is_face(units, nx, ny) and face_type(units, nx, ny) != t


def compute_quadrants(units, x, y):
    u = units[(x, y)]
    if u["k"] in ("door", "window"):
        t = face_type(units, x, y)
        base = "window_" + t
        if u["k"] == "door":
            base = "door_" + t + "_" + ("open" if u.get("o") else "closed")
        return {q: base + "_" + q.upper() for q in ("tl", "tr", "bl", "br")}
    if is_struct(units, x, y - 1):
        nT = not is_top(units, x, y + 1)
        wT = not is_top(units, x - 1, y)
        eT = not is_top(units, x + 1, y)
        return {
            "tl": top_upper_key(nT, wT, "L", not is_struct(units, x - 1, y + 1)),
            "tr": top_upper_key(nT, eT, "R", not is_struct(units, x + 1, y + 1)),
            "bl": "top_edge_L" if wT else "top_fill",
            "br": "top_edge_R" if eT else "top_fill",
        }
    t = face_type(units, x, y)
    l = "L" if is_face_end(units, x - 1, y, t) else "M"
    r = "R" if is_face_end(units, x + 1, y, t) else "M"
    return {"tl": f"face_{t}_U_{l}", "tr": f"face_{t}_U_{r}", "bl": f"face_{t}_D_{l}", "br": f"face_{t}_D_{r}"}


def tile_variant_hash(x, y):
    # ResourceSpawner:TileVariantHash 와 같은 식 (Lua % 는 바닥 나머지 = 파이썬 %)
    a = (x * 7919 + y * 104729 + 12345) % 65521
    b = (a * a + x * 31 + y * 17) % 65521
    return b // 7


def read_csv(path):
    raw = open(path, "rb").read().decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(raw)))


def blueprint_units(name, ax, ay, door_open=False):
    """BuildingManager.BuildPlan 이식: Layout 북쪽 행부터, 'D' 칸 = (ax, ay)."""
    ds = os.path.join(ROOT, "RootDesk", "MyDesk", "Building", "DataSets")
    bp = next(r for r in read_csv(os.path.join(ds, "BlueprintDataSet.csv")) if r["BlueprintName"] == name)
    pieces = {r["ItemName"]: r for r in read_csv(os.path.join(ds, "BuildPieceDataSet.csv"))}
    rows = [p for p in bp["Layout"].split("/") if p]
    legend = {"#": bp["WallItem"], "f": bp["FloorItem"], "D": bp["DoorItem"], "W": bp["WindowItem"]}
    ar = ac = 0
    for r, line in enumerate(rows, 1):
        c = line.find("D")
        if c >= 0:
            ar, ac = r, c + 1
            break
    units = {}
    for r, line in enumerate(rows, 1):
        for c, ch in enumerate(line, 1):
            item = legend.get(ch)
            if item:
                p = pieces[item]
                units[(ax + (c - ac), ay + (ar - r))] = {"k": p["Kind"], "i": item, "s": p["Style"], "o": door_open and p["Kind"] == "door"}
    return units


def render(units, tiles, pad=1):
    xs = [x for x, _ in units]
    ys = [y for _, y in units]
    ux0, ux1, uy0, uy1 = min(xs) - pad, max(xs) + pad, min(ys) - pad, max(ys) + pad
    cx0, cy1 = ux0 * 2, uy1 * 2 + 1
    W, H = (ux1 - ux0 + 1) * 2 * T, (uy1 - uy0 + 1) * 2 * T
    img = Image.new("RGBA", (W, H), (96, 140, 72, 255))
    names = []

    def put(name, cx, cy):
        img.alpha_composite(tiles[name], ((cx - cx0) * T, (cy1 - cy) * T))

    for (x, y), u in sorted(units.items()):
        cells = {"tl": (2 * x, 2 * y + 1), "tr": (2 * x + 1, 2 * y + 1), "bl": (2 * x, 2 * y), "br": (2 * x + 1, 2 * y)}
        if u["k"] == "floor":
            for q, (cx, cy) in cells.items():
                n = f'floor{tile_variant_hash(cx, cy) % 4 + 1}'
                put(n, cx, cy)
                names.append(n)
            continue
        qs = compute_quadrants(units, x, y)
        for q, (cx, cy) in cells.items():
            put(qs[q], cx, cy)
            names.append(qs[q])
    return img, names


def main():
    os.makedirs(os.path.join(OUT, "tiles"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "icons"), exist_ok=True)
    table = tile_table()
    assert len(table) == 48 and len({k for k, *_ in table}) == 48
    strip = Image.new("RGBA", (T * len(table), T), (0, 0, 0, 0))
    tiles = {}
    meta = []
    for i, (key, c, r, blocked) in enumerate(table):
        im = crop(c, r)
        tiles[key] = im
        strip.alpha_composite(im, (i * T, 0))
        im.save(os.path.join(OUT, "tiles", f"{STYLE}_{key}.png"))
        layer = "RectTileMap7 (구조물·막힘)" if blocked else "RectTileMap3 (바닥·통행)"
        meta.append({"order": i, "name": f"{STYLE}_{key}", "IsCollidable": blocked, "layer": layer, "sheet": [c, r]})
    strip.save(os.path.join(OUT, f"{STYLE}_strip.png"))
    # 슬라이스 한도(2048×2048) 대응: 8열 × 6행 격자, 순번 = 행 우선(왼→오, 위→아래)
    GC = 8
    grid = Image.new("RGBA", (T * GC, T * ((len(table) + GC - 1) // GC)), (0, 0, 0, 0))
    for i, (key, *_r) in enumerate(table):
        grid.alpha_composite(tiles[key], ((i % GC) * T, (i // GC) * T))
    grid.save(os.path.join(OUT, f"{STYLE}_grid.png"))
    json.dump({"style": STYLE, "tileSize": T, "count": len(meta), "tiles": meta}, open(os.path.join(OUT, "cabin-tiles.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # 이름표 확인 시트: 8열 그리드, 칸마다 순번·이름·막힘(빨강)/통행(초록) 띠
    cols, cw, chh = 8, 150, 104
    lab = Image.new("RGBA", (cols * cw, ((len(table) + cols - 1) // cols) * chh), (40, 40, 48, 255))
    d = ImageDraw.Draw(lab)
    for i, (key, c, r, blocked) in enumerate(table):
        x, y = (i % cols) * cw, (i // cols) * chh
        lab.alpha_composite(tiles[key], (x + (cw - T) // 2, y + 4))
        d.rectangle([x + 2, y + 70, x + cw - 3, y + 73], fill=(220, 70, 60, 255) if blocked else (80, 200, 90, 255))
        d.text((x + 4, y + 76), f"{i:02d} {key}", fill=(255, 255, 255, 255))
        d.text((x + 4, y + 89), "IsCollidable=" + ("true" if blocked else "false"), fill=(200, 200, 200, 255))
    lab.save(os.path.join(OUT, f"{STYLE}_strip_labeled.png"))

    # 아이콘 후보 128×128 (2×2 칸 그림 그대로)
    crop(4, 1, 2, 2).save(os.path.join(OUT, "icons", "icon_cabin_wall.png"))
    Image.new("RGBA", (128, 128))
    fl = Image.new("RGBA", (128, 128))
    for k, (dx, dy) in enumerate(((0, 0), (64, 0), (0, 64), (64, 64))):
        fl.alpha_composite(tiles[f"floor{k + 1}"], (dx, dy))
    fl.save(os.path.join(OUT, "icons", "icon_cabin_floor.png"))
    crop(4, 3, 2, 2).save(os.path.join(OUT, "icons", "icon_cabin_door.png"))
    crop(2, 5, 2, 2).save(os.path.join(OUT, "icons", "icon_cabin_window.png"))

    # 런타임 문법 교차 검증: 기본형 오두막(문 닫힘/열림) — 사용된 타일이 모두 등록 목록에 있어야 한다
    for opened in (False, True):
        units = blueprint_units("Basic Cabin Blueprint", 0, 0, opened)
        img, used = render(units, tiles)
        missing = sorted(set(used) - set(tiles))
        assert not missing, missing
        suffix = "_dooropen" if opened else ""
        img.save(os.path.join(OUT, f"verify_basic_cabin{suffix}.png"))
        print(f"verify{suffix}: units={len(units)} tiles={len(used)} distinct={len(set(used))}")
    # 플레이어 수정 예시 (문 칸 (0,0) 기준 오두막 = x -2..3, y 0..4, 동쪽 벽 x=3):
    # 북쪽 벽에 창문 추가 + 동쪽 벽 가운데 3칸 철거 후 동쪽으로 2칸 확장(새 동쪽 벽 x=6, 창문 하나 더)
    units = blueprint_units("Basic Cabin Blueprint", 0, 0, True)
    wall = {"k": "wall", "i": "Cabin Wall", "s": STYLE}
    floor = {"k": "floor", "i": "Cabin Floor", "s": STYLE}
    window = {"k": "window", "i": "Cabin Window", "s": STYLE}
    units[(2, 4)] = dict(window)
    for y in (1, 2, 3):
        units[(3, y)] = dict(floor)
    for x in (4, 5):
        units[(x, 4)] = dict(wall)
        units[(x, 0)] = dict(wall)
        for y in (1, 2, 3):
            units[(x, y)] = dict(floor)
    for y in range(0, 5):
        units[(6, y)] = dict(wall)
    units[(5, 4)] = dict(window)
    img, used = render(units, tiles)
    assert not (set(used) - set(tiles))
    img.save(os.path.join(OUT, "verify_cabin_extended.png"))
    print("extended: units=%d distinct=%d" % (len(units), len(set(used))))
    print("saved", OUT)


if __name__ == "__main__":
    main()
