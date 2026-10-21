"""ui8 원본 그림 가장자리 정리 (2026-10-21).

받은 원본(01_~07_ 폴더)의 배경 제거가 거칠어 실루엣 외곽선에 1~2px 구멍이 뚫리고, 외곽 밖으로 점이 튀어나오고,
본체와 떨어진 잔여 점이 남아 있다(audit_ui8_edges.py). 원본은 그대로 두고 ui8_import 결과물만 정리한다.

1) 떨어진 잔여 점 제거: 본체와 이어지지 않은 작은 덩어리(STRAY_MAX px 이하) → 투명
2) 알파 3×3 중앙값(MedianFilter): 1px 구멍 메움 · 튀어나온 점 제거 · 들쭉날쭉한 외곽 고르게 (안쪽 불투명 영역은 그대로)
3) 새로 불투명해진 화소의 색 = 가장 가까운 원래 불투명 화소 색(외곽선 색 유지), 투명 화소 색도 번짐 처리
제외: KEEP_SOFT — 일부러 반투명인 그림(알약 배지·선택 칸 빛)은 알파 값을 바꾸지 않고 1) 만 한다.

사용: python -I clean_ui8_edges.py            → ui8_import 전체 정리(제자리 덮어쓰기 전 ui8_import_raw/ 에 원래본 보관)
      python -I clean_ui8_edges.py --preview 이름...  → 정리 전후 비교 PNG 만 ui8_preview/edge_*.png 로
"""
import json
import os
import shutil
import sys
from collections import deque

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "ui8_import")
RAW = os.path.join(HERE, "ui8_import_raw")
PREV = os.path.join(HERE, "ui8_preview")
STRAY_MAX = 12
KEEP_SOFT = {"ui8_pill_badge", "ui8_quick_cell_sel"}
# 아이콘은 세부 묘사(가는 선·반짝임)를 지키려고 1번, 판·버튼·배지는 외곽선 끊김이 길어 2번
PASSES_ICON = 1
PASSES_FRAME = 2
OUTLIER = 96  # 늘림 구간에서 줄 대표 알파와 이만큼 넘게 다르면 끊김/튐으로 본다
META = json.load(open(os.path.join(HERE, "ui8_pieces.json"), encoding="utf-8"))


def components(A, w, h, thr=8):
    comp = [0] * (w * h)
    sizes = [0]
    cid = 0
    for i in range(w * h):
        if A[i] > thr and comp[i] == 0:
            cid += 1
            n = 0
            q = deque([i])
            comp[i] = cid
            while q:
                j = q.popleft()
                n += 1
                x, y = j % w, j // w
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            k = ny * w + nx
                            if comp[k] == 0 and A[k] > thr:
                                comp[k] = cid
                                q.append(k)
            sizes.append(n)
    return comp, sizes


def clean(im, soft=False, passes=1, meta=None):
    im = im.convert("RGBA")
    w, h = im.size
    r, g, b, a = im.split()
    A = list(a.get_flattened_data())
    comp, sizes = components(A, w, h)
    if len(sizes) > 1:
        main = max(range(1, len(sizes)), key=lambda i: sizes[i])
        for i in range(w * h):
            c = comp[i]
            if c and c != main and sizes[c] <= STRAY_MAX:
                A[i] = 0
    a1 = Image.new("L", (w, h))
    a1.putdata(A)
    a2 = a1
    if not soft:
        for _ in range(passes):
            a2 = a2.filter(ImageFilter.MedianFilter(3))
    A2 = list(a2.get_flattened_data())
    if meta:
        mirror_caps(A2, w, h, meta)
    # 색: 원래 불투명(>=128) 화소에서 다중 출발 BFS 로 가장 가까운 색을 나머지 전부에 채운다
    R, G, B = list(r.get_flattened_data()), list(g.get_flattened_data()), list(b.get_flattened_data())
    seen = bytearray(w * h)
    q = deque()
    for i in range(w * h):
        if A[i] >= 128:
            seen[i] = 1
            q.append(i)
    while q:
        j = q.popleft()
        x, y = j % w, j // w
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                k = ny * w + nx
                if not seen[k]:
                    seen[k] = 1
                    R[k], G[k], B[k] = R[j], G[j], B[j]
                    q.append(k)
    if meta:
        uniformize(A, A2, R, G, B, w, h, meta)
    out = Image.new("RGBA", (w, h))
    out.putdata(list(zip(R, G, B, A2)))
    return out


SYM_IOU = 0.93  # 왼쪽 끝과 (거울 비춘) 오른쪽 끝 실루엣이 이만큼 겹치면 대칭 그림으로 본다 (실측 최저 0.946)


def mirror_caps(A2, w, h, meta):
    """좌우 대칭인 늘림 그림(버튼·탭·줄 등)의 양 끝: 한쪽에만 파인 홈을 반대쪽 모양으로 메운다(알파 max).
    비대칭(배지 좌/우처럼 한쪽이 뾰족)이면 실루엣 겹침이 SYM_IOU 미만이라 손대지 않는다."""
    L, R_ = meta["border"][0], meta["border"][1]
    inter = union = 0
    for y in range(h):
        for x in range(L):
            p, q = A2[y * w + x] >= 128, A2[y * w + (w - 1 - x)] >= 128
            inter += p and q
            union += p or q
    if union == 0 or inter / union < SYM_IOU:
        return False
    src = A2[:]
    for y in range(h):
        for x in list(range(0, L)) + list(range(w - R_, w)):
            i = y * w + x
            A2[i] = max(src[i], src[y * w + (w - 1 - x)])
    return True


def fix_line(idx, A, A2, R, G, B):
    """한 줄(가로 행 또는 세로 열)의 화소 인덱스 목록: 대표 알파(중앙값)와 OUTLIER 이상 다른 화소만 바로잡는다.
    불투명해야 할 자리는 같은 줄에서 가장 가까운 정상 화소 색으로 채운다(외곽선은 외곽선 색으로 이어짐)."""
    vals = sorted(A2[i] for i in idx)
    m = vals[len(vals) // 2]
    bad = [abs(A2[i] - m) > OUTLIER for i in idx]
    if not any(bad):
        return 0
    good = [k for k, b in enumerate(bad) if not b and A[idx[k]] >= 128]
    n = 0
    for k, i in enumerate(idx):
        if not bad[k]:
            continue
        A2[i] = m
        n += 1
        if m >= 128 and good:
            j = idx[min(good, key=lambda g: abs(g - k))]
            R[i], G[i], B[i] = R[j], G[j], B[j]
    return n


def uniformize(A, A2, R, G, B, w, h, meta):
    """늘려 쓰는 그림의 가운데 구간은 늘리는 방향으로 모양이 같아야 한다 — 그 방향의 줄마다 튀는 화소를 바로잡는다.
    3조각: 좌우 끝을 뺀 가운데 가로 구간의 모든 행. 9조각: 위·아래 변(가로 구간 행) + 왼·오른 변(세로 구간 열)."""
    L, R_, T, Bb = (meta["border"] + [0, 0, 0, 0])[:4]
    rows = []
    if meta["kind"] == 3:
        rows = range(h)
    else:
        rows = list(range(0, T)) + list(range(h - Bb, h))
    n = 0
    for y in rows:
        n += fix_line([y * w + x for x in range(L, w - R_)], A, A2, R, G, B)
    if meta["kind"] == 9:
        for x in list(range(0, L)) + list(range(w - R_, w)):
            n += fix_line([y * w + x for y in range(T, h - Bb)], A, A2, R, G, B)
    return n


def passes_for(n):
    return PASSES_ICON if n.startswith("ui8_icon_") else PASSES_FRAME


def preview(names):
    os.makedirs(PREV, exist_ok=True)
    for n in names:
        src = Image.open(os.path.join(RAW if os.path.isdir(RAW) else SRC, n + ".png")).convert("RGBA")
        cl = clean(src, n in KEEP_SOFT, passes_for(n), META.get(n))
        z = 4 if max(src.size) < 200 else 2
        W, H = src.width * z, src.height * z
        sheet = Image.new("RGBA", (W * 2 + 30, H + 20), (0, 0, 0, 255))
        for i, im in enumerate((src, cl)):
            bg = Image.new("RGBA", src.size, (120, 230, 120, 255))
            bg.alpha_composite(im)
            sheet.paste(bg.resize((W, H), Image.NEAREST), (10 + i * (W + 10), 10))
        sheet.save(os.path.join(PREV, "edge_" + n + ".png"))
        print("preview", n)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--preview":
        preview(sys.argv[2:])
        return
    if not os.path.isdir(RAW):
        shutil.copytree(SRC, RAW)
    for fn in sorted(os.listdir(RAW)):
        if fn.endswith(".png"):
            n = fn[:-4]
            clean(Image.open(os.path.join(RAW, fn)), n in KEEP_SOFT, passes_for(n), META.get(n)).save(os.path.join(SRC, fn))
    print("cleaned", SRC)


if __name__ == "__main__":
    main()
