"""new stone.png 의 바깥 흰 배경을 투명으로 바꾼다 (2026-10-06, 제작자 제공 돌무더기 이미지).

1) 테두리에서 시작하는 flood fill 로 '흰색 계열' 픽셀만 지운다 — 외곽선 안쪽의 밝은 하이라이트는 닿지 않는다.
2) 지운 영역과 맞닿은 가장자리 띠(EDGE_BAND px)는 흰 배경과 섞인 안티앨리어싱이라, 흰색을 걷어내고(un-premultiply)
   알파를 남긴다 — 어두운 배경 위에서 흰 테두리가 남지 않게.
3) 불투명 영역 bbox + MARGIN 으로 크롭.
사용: python -I remove_bg.py <입력.png> <출력.png>
"""
import sys
from collections import deque
from PIL import Image

WHITE_TOL = 48      # 흰색과의 거리(채널 최소값 기준) 이내면 배경 후보
EDGE_BAND = 2       # 배경과 맞닿은 가장자리 정리 폭(px)
MARGIN = 2          # 크롭 여백(px)


def main(src, dst):
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()

    def is_bg(c):
        r, g, b, _ = c
        return min(r, g, b) >= 255 - WHITE_TOL and max(r, g, b) - min(r, g, b) <= 24

    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(px[x, y]) and not bg[y * w + x]:
                bg[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(px[x, y]) and not bg[y * w + x]:
                bg[y * w + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny * w + nx] and is_bg(px[nx, ny]):
                bg[ny * w + nx] = 1
                q.append((nx, ny))

    # 배경까지의 거리(EDGE_BAND 이내) — 가장자리 띠 찾기
    dist = [0 if bg[i] else 999 for i in range(w * h)]
    frontier = deque(i for i in range(w * h) if bg[i])
    while frontier:
        i = frontier.popleft()
        d = dist[i]
        if d >= EDGE_BAND:
            continue
        x, y = i % w, i // w
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if dist[j] > d + 1:
                    dist[j] = d + 1
                    frontier.append(j)

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            i = y * w + x
            r, g, b, _ = px[x, y]
            if bg[i]:
                continue
            if dist[i] <= EDGE_BAND:
                # 흰색(255)과 섞인 비율 추정: 가장 어두운 채널이 밝을수록 흰색이 많이 섞였다.
                a = max(0.0, min(1.0, (255 - min(r, g, b)) / 200.0))
                if a <= 0.02:
                    continue
                if a < 1.0:
                    r = int(max(0, min(255, (r - (1 - a) * 255) / a)))
                    g = int(max(0, min(255, (g - (1 - a) * 255) / a)))
                    b = int(max(0, min(255, (b - (1 - a) * 255) / a)))
                op[x, y] = (r, g, b, int(a * 255))
            else:
                op[x, y] = (r, g, b, 255)

    bbox = out.getbbox()
    l, t, rr, bb = bbox
    l, t = max(0, l - MARGIN), max(0, t - MARGIN)
    rr, bb = min(w, rr + MARGIN), min(h, bb + MARGIN)
    out = out.crop((l, t, rr, bb))
    out.save(dst)
    print("saved", dst, out.size, "bbox", bbox)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
