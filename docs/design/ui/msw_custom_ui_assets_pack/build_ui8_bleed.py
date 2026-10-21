"""ui8 조각 → 아틀라스 실금 방지용 "여백 + 색 번짐" 조각 (2026-10-21).

증상: 창 조각 경계마다 1px 어두운 실선. 실측 선 색 (185,177,155) = 종이 (242,231,203) × 0.765 — 세 채널이 같은
비율로 어두움 = 검정이 섞인 색. 아틀라스(BP.blueprintatlas)는 조각 사이를 투명-검정 여백(padding)으로 채우는데,
필터링(Bilinear/Trilinear 밉맵/압축 블록/화면 축소 샘플링)이 조각 가장자리 화소에 그 검정을 섞는다.
같은 그림으로 바꿔도 남고, 맨 위 조각의 사각 경계를 따라 움직인 실측과 맞는다
(docs/reports/ui-popup-seam-decimal-audit-20261020.md).

해결: 조각마다 바깥에 E px 여백을 붙인다.
- 여백과 원래 투명 화소의 RGB = 가장 가까운 불투명 화소 색(alpha bleed) → 필터가 섞어도 검정이 아니라 같은 색이 섞인다.
- 여백 alpha = 1/255(사실상 투명) → 그려도 안 보이고, 가져오기가 투명 테두리를 잘라내는 일도 막는다.
- 아틀라스 검정 여백은 이제 실제 그림 경계에서 E 텍셀 떨어져 있어, 밉맵 3단계(8텍셀)까지 그림에 닿지 않는다.
키트(scripts/ui8_kit.cjs)는 ui8b_* 가 등록돼 있으면 그 조각을 쓰고, 여백만큼 조각을 넓혀 그려 그림 위치를 그대로 둔다.

입력: ui8_import2/ui8p_*.png, ui8_import4/ui8p_*_s*.png
출력: ui8_import5/ui8b_*.png + ui8_bleed.json { 이름: { w, h, e } }  (w,h = 여백 뺀 원래 크기)
실행: python -I build_ui8_bleed.py
"""
import json
import os
import shutil
from collections import deque

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRCS = [os.path.join(HERE, "ui8_import2"), os.path.join(HERE, "ui8_import4")]
OUT = os.path.join(HERE, "ui8_import5")
E = 8  # 여백 텍셀. 밉맵 n 단계는 2^n 텍셀까지 번지므로 8 = 3단계까지 안전
MARGIN_ALPHA = 1


def bleed(src):
    w, h = src.size
    W, H = w + 2 * E, h + 2 * E
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    im.paste(src, (E, E))
    px = im.load()
    # 다중 출발 BFS: 불투명(alpha>0) 화소에서 바깥으로 퍼지며 가장 가까운 색을 투명 화소에 채운다
    filled = bytearray(W * H)
    q = deque()
    for y in range(H):
        for x in range(W):
            if px[x, y][3] > 0:
                filled[y * W + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H and not filled[ny * W + nx]:
                filled[ny * W + nx] = 1
                px[nx, ny] = (r, g, b, 0)
                q.append((nx, ny))
    # 여백(원래 그림 바깥)만 alpha 1 — 원래 그림 안의 투명 화소는 0 그대로
    for y in range(H):
        for x in range(W):
            if x < E or x >= W - E or y < E or y >= H - E:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, MARGIN_ALPHA)
    return im


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    meta = {}
    for d in SRCS:
        for fn in sorted(os.listdir(d)):
            if not (fn.startswith("ui8p_") and fn.endswith(".png")):
                continue
            src = Image.open(os.path.join(d, fn)).convert("RGBA")
            out = bleed(src)
            name = "ui8b_" + fn[len("ui8p_"):-4]
            out.save(os.path.join(OUT, name + ".png"))
            meta[name] = {"w": src.size[0], "h": src.size[1], "e": E}
    with open(os.path.join(HERE, "ui8_bleed.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print("->", len(meta), "pieces in", OUT)


if __name__ == "__main__":
    main()
