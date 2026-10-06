# -*- coding: utf-8 -*-
"""town.map 소품·나무 충돌 박스 실측 제안 (2026-10-06).

규칙(pitfalls 14·17): 실물 박스 = BoxSize × Scale, 박스는 그림의 '발밑(바닥 접지면)' 실루엣에 맞춘다.
Trigger 는 Y정렬 기준(아랫변)·조준·통행 차단(ResourceOccupiedArea) 에 쓰이므로 그림 가운데가 아니라 바닥에 있어야 한다.
피벗은 업로드 스프라이트 기본값(정중앙) 가정. 로컬 단위 = px/100 (Scale 곱하기 전).

입력: scratchpad 의 town_audit.json(엔티티 종류별 현재 값) — 실행: python scripts/audit_town_colliders.py <audit.json> <out_dir>
출력: proposals.json(모델 id → BoxSize/Offset), town_colliders_sheet.png(빨강 = 현재, 초록 = 제안)
"""
import json, os, sys, subprocess
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AUDIT, OUT = sys.argv[1], sys.argv[2]

# 모델 id → (원본 PNG, 종류). 종류: tree = 줄기 밑동만 / low = 낮은 소품(덤불·바위) / post = 기둥형(가로등)
SRC = {
    "deco_bush": ("docs/design/art/trees/collection/props/prop_04_bush.png", "low"),
    "deco_rocktree": ("docs/design/art/trees/collection/props/prop_03_rock_tree.png", "low"),
    "deco_smallflower": ("docs/design/art/trees/collection/props/prop_07_small_flower.png", "flat"),
    "deco_fallenleaves": ("docs/design/art/trees/collection/props/prop_09_fallen_leaves.png", "flat"),
    "deco_flowergrass": ("docs/design/art/trees/collection/props/prop_05_flower_grass.png", "flat"),
    "deco_tallgrass": ("docs/design/art/trees/collection/props/prop_06_tall_grass.png", "flat"),
    "deco_fallenlog": ("docs/design/art/trees/collection/props/prop_02_fallen_log.png", "low"),
    "deco_vinestump": ("docs/design/art/trees/collection/props/prop_08_vine_stump.png", "low"),
    "deco_treestump": ("docs/design/art/trees/collection/props/prop_01_stump.png", "low"),
}
TREES = {
    "tree_basic": "tree_01_basic", "tree_tall": "tree_02_tall", "tree_tiered": "tree_03_tiered", "tree_flower": "tree_04_flower",
    "tree_cherryblossom": "tree_05_cherry_blossom", "tree_autumnmaple": "tree_06_autumn_maple", "tree_pine": "tree_07_pine",
    "tree_fir": "tree_08_fir", "tree_wide": "tree_09_wide", "tree_willow": "tree_10_willow", "tree_birch": "tree_11_birch",
    "tree_dark": "tree_12_dark", "tree_fruit": "tree_13_fruit", "tree_apple": "tree_14_apple", "tree_palm": "tree_15_palm",
    "tree_round": "tree_16_round", "tree_twin": "tree_17_twin", "tree_small": "tree_18_small",
}
for k, v in TREES.items():
    SRC[k] = (f"docs/design/art/trees/collection/trees/{v}.png", "tree")
lamp = subprocess.run(["git", "-c", "core.quotepath=off", "ls-files", "*가로등.png"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8").stdout.split("\n")[0].strip()
if lamp:
    SRC["prop_lamppost"] = (lamp, "post")


def footprint(img, kind):
    """불투명 실루엣에서 바닥 박스(px, 이미지 좌표) 계산."""
    a = img.split()[3].point(lambda v: 255 if v > 60 else 0)
    x0, y0, x1, y1 = a.getbbox()
    W, H = x1 - x0, y1 - y0
    # 바닥 10% 줄의 불투명 열 범위 = 접지면(줄기·받침)
    band_top = y1 - max(2, int(H * 0.10))
    cols = [x for x in range(x0, x1) if any(a.getpixel((x, y)) for y in range(band_top, y1))]
    bx0, bx1 = (min(cols), max(cols) + 1) if cols else (x0, x1)
    if kind == "tree":       # 줄기 밑동: 바닥 띠 폭(대개 줄기+뿌리)을 조금 줄이고 높이는 그림의 12%
        cx = (bx0 + bx1) / 2; w = max(W * 0.18, (bx1 - bx0) * 0.8); h = H * 0.12
    elif kind == "post":     # 기둥: 받침 폭, 높이 10%
        cx = (bx0 + bx1) / 2; w = max(W * 0.25, (bx1 - bx0)); h = H * 0.10
    elif kind == "flat":     # 밟고 지나가는 풀·꽃·낙엽: 아래 절반
        cx = (x0 + x1) / 2; w = W * 0.7; h = H * 0.5
    else:                    # 낮은 소품(덤불·바위·통나무·그루터기): 아래 40%
        cx = (x0 + x1) / 2; w = W * 0.8; h = H * 0.4
    return (cx - w / 2, y1 - h, cx + w / 2, y1)


def main():
    audit = json.load(open(AUDIT, encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    props, tiles = {}, []
    for r in audit:
        mid = r.get("model")
        if mid not in SRC:
            continue
        path, kind = SRC[mid]
        img = Image.open(os.path.join(ROOT, path)).convert("RGBA")
        Wp, Hp = img.size
        fx0, fy0, fx1, fy1 = footprint(img, kind)
        # 이미지 px → 로컬 유닛 (피벗 정중앙, y 위쪽 +)
        bw, bh = (fx1 - fx0) / 100, (fy1 - fy0) / 100
        ox = ((fx0 + fx1) / 2 - Wp / 2) / 100
        oy = (Hp / 2 - (fy0 + fy1) / 2) / 100
        props[mid] = {"kind": kind, "png": path, "size": [Wp, Hp], "BoxSize": [round(bw, 3), round(bh, 3)], "ColliderOffset": [round(ox, 3), round(oy, 3)],
                      "current": r.get("trig"), "count": r["n"]}
        # 시트 칸: 그림 + 현재(빨강) + 제안(초록)
        cell = Image.new("RGBA", (Wp + 20, Hp + 34), (52, 60, 52, 255))
        cell.alpha_composite(img, (10, 10))
        d = ImageDraw.Draw(cell)
        def box(bs, off, col):
            if not bs or bs[0] is None:
                return
            cx = 10 + Wp / 2 + off[0] * 100; cy = 10 + Hp / 2 - off[1] * 100
            d.rectangle([cx - bs[0] * 50, cy - bs[1] * 50, cx + bs[0] * 50, cy + bs[1] * 50], outline=col, width=3)
        cur = r.get("trig")
        if cur:
            box([cur[0], cur[1]], [0, cur[2] or 0], (255, 60, 60, 255))
        box(props[mid]["BoxSize"], props[mid]["ColliderOffset"], (60, 255, 90, 255))
        d.text((6, Hp + 16), f"{mid} x{r['n']}", fill=(255, 255, 255, 255))
        tiles.append(cell)
    json.dump(props, open(os.path.join(OUT, "proposals.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # 시트: 가로 5칸, 칸 높이 = 줄 최대
    S = 0.5
    tiles = [t.resize((int(t.width * S), int(t.height * S))) for t in tiles]
    rows = [tiles[i:i + 6] for i in range(0, len(tiles), 6)]
    W = max(sum(t.width for t in row) for row in rows); H = sum(max(t.height for t in row) for row in rows)
    sheet = Image.new("RGBA", (W, H), (30, 30, 34, 255)); y = 0
    for row in rows:
        x = 0
        for t in row:
            sheet.alpha_composite(t, (x, y)); x += t.width
        y += max(t.height for t in row)
    sheet.save(os.path.join(OUT, "town_colliders_sheet.png"))
    print("models", len(props), "sheet", sheet.size)


if __name__ == "__main__":
    main()
