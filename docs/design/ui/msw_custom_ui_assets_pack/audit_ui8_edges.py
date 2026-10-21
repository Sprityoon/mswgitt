"""ui8 원본 그림 가장자리 점검 (2026-10-21, 읽기 전용).

배경 제거가 덜 된 흔적을 수치로 찾는다.
- stray : 본체와 떨어진 작은 덩어리(alpha>8, 8방향 연결)의 화소 수 — 실루엣 밖에 흩어진 점
- semi  : 본체 안쪽(가장자리 2px 제외)인데 alpha 16~239 인 화소 비율 — 몸통이 반투명해 배경이 비침
- halo  : 가장자리 반투명 화소 중 안쪽 이웃보다 눈에 띄게 밝은(흰 테) 화소 수
결과: 표준출력 표 + edge_audit.json
실행: python -I audit_ui8_edges.py
"""
import json
import os
from collections import deque

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "ui8_import")


def audit(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    A = [[px[x, y][3] for x in range(w)] for y in range(h)]
    comp = [[0] * w for _ in range(h)]
    sizes = [0]
    cid = 0
    for y in range(h):
        for x in range(w):
            if A[y][x] > 8 and comp[y][x] == 0:
                cid += 1
                n = 0
                q = deque([(x, y)])
                comp[y][x] = cid
                while q:
                    cx, cy = q.popleft()
                    n += 1
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < w and 0 <= ny < h and comp[ny][nx] == 0 and A[ny][nx] > 8:
                                comp[ny][nx] = cid
                                q.append((nx, ny))
                sizes.append(n)
    if cid == 0:
        return None
    main = max(range(1, cid + 1), key=lambda i: sizes[i])
    big = sizes[main]
    # 본체의 1% 보다 작은 덩어리 = 잔여 점 (아이콘처럼 의도적으로 떨어진 큰 부분은 제외)
    stray = sum(sizes[i] for i in range(1, cid + 1) if i != main and sizes[i] < big * 0.01)
    stray_blobs = sum(1 for i in range(1, cid + 1) if i != main and sizes[i] < big * 0.01)

    def inner(x, y):
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < w and 0 <= ny < h) or A[ny][nx] <= 8:
                    return False
        return True

    body = semi = halo = edge = 0
    for y in range(h):
        for x in range(w):
            a = A[y][x]
            if comp[y][x] != main:
                continue
            if inner(x, y):
                body += 1
                if 16 <= a <= 239:
                    semi += 1
            elif a < 255:
                edge += 1
                r, g, b, _ = px[x, y]
                lum = (r * 3 + g * 6 + b) / 10
                best = None
                for dx in (-2, -1, 0, 1, 2):
                    for dy in (-2, -1, 0, 1, 2):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h and A[ny][nx] == 255:
                            rr, gg, bb, _ = px[nx, ny]
                            l2 = (rr * 3 + gg * 6 + bb) / 10
                            best = l2 if best is None else min(best, l2)
                if best is not None and lum > best + 60:
                    halo += 1
    # 외곽선 끊김(hole): 투명(<128)인데 좌우 또는 상하 이웃이 모두 불투명(>=128) — 실루엣 선에 뚫린 1px 구멍
    # 튀어나온 점(spike): 불투명인데 상하좌우 중 3곳 이상이 투명 — 외곽 밖으로 삐져나온 1px
    holes = spikes = 0
    for y in range(h):
        for x in range(w):
            a = A[y][x]
            L = A[y][x - 1] if x > 0 else 0
            R = A[y][x + 1] if x < w - 1 else 0
            U = A[y - 1][x] if y > 0 else 0
            D = A[y + 1][x] if y < h - 1 else 0
            if a < 128 and ((L >= 128 and R >= 128) or (U >= 128 and D >= 128)):
                holes += 1
            elif a >= 128 and sum(1 for v in (L, R, U, D) if v < 128) >= 3:
                spikes += 1
    return {
        "size": [w, h], "stray_px": stray, "stray_blobs": stray_blobs, "holes": holes, "spikes": spikes,
        "semi_body_pct": round(100 * semi / max(1, body), 1), "edge_px": edge, "halo_px": halo,
    }


def main():
    res = {}
    for fn in sorted(os.listdir(SRC)):
        if fn.endswith(".png"):
            r = audit(os.path.join(SRC, fn))
            if r:
                res[fn[:-4]] = r
    with open(os.path.join(HERE, "edge_audit.json"), "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)
    bad = {k: v for k, v in res.items() if v["stray_px"] > 0 or v["semi_body_pct"] > 2 or v["halo_px"] > 20 or v["holes"] + v["spikes"] > 0}
    score = lambda v: v["stray_px"] + v["semi_body_pct"] * 50 + v["halo_px"] + 3 * (v["holes"] + v["spikes"])
    print(f"{'이름':36} {'떨어진점(덩어리)':>14} {'끊김':>5} {'튐':>5} {'반투명몸통%':>10} {'흰테':>5}")
    for k, v in sorted(bad.items(), key=lambda kv: -score(kv[1])):
        print(f"{k:36} {v['stray_px']:>8}({v['stray_blobs']:>3}) {v['holes']:>5} {v['spikes']:>5} {v['semi_body_pct']:>10} {v['halo_px']:>5}")
    print("점검", len(res), "장 / 문제", len(bad), "장")


if __name__ == "__main__":
    main()
