"""화로(Furnace) 리디자인 v2 — '힐링' 톤 벽돌 흙가마 + 살짝 도트화. image-to-pixel 트랙 A(propkit) 산출물.

    python docs/design/art/furnace/draw_furnace.py

출력 (이 폴더):
  furnace_idle.png  대기 — 숯 틈 불씨만 은은하게 (Furnace.IdleSpriteRUID 용)
  furnace_lit.png   가동 — 불꽃 · 들여다보는 구멍 발광 · 빛 번짐 · 굴뚝 연기 (Furnace.ActiveSpriteRUID 용)
  furnace_icon.png  인벤토리 아이콘 128x128 (item_dataset.IconRUID 용)
  preview.png       게임 배율(0.75) · 실제 지형 타일 + 배경 3종 · 이웃 가구 비교 시트

규격: 256x272, 피벗 = 하단 중앙 (x=128, y=0). 두 상태는 캔버스·피벗·몸체 좌표가 같다.
도트: 2px = 1도트(128x136 격자) — 모델 Scale 0.75 에서 1도트 = 화면 1.5px = 지형 타일(64px→100px) 도트 밀도와 같다.
v1 → v2: 제작자 피드백 "약간 도트화 + 디테일을 더 쌓을 것" (2026-09-29).
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, ".claude", "skills", "image-to-pixel", "scripts"))
from PIL import Image, ImageDraw  # noqa: E402
from propkit import Canvas, C, flame_points, mix, preview_sheet, rand  # noqa: E402

W, H, SS = 256, 272, 4
DOT = 2          # 살짝 도트화: 출력 2px = 아트 1도트
OY = 36          # 전체를 아래로 — 연기 자리
CX = 128
LINE = "#4a2a1c"  # 따뜻한 짙은 갈색 외곽선 (검정 금지)
OL = 2.2         # 바깥 외곽선 = 도트 격자에서 1도트
IL = 1.8         # 안쪽 선(이음새·줄눈)

BRICK = ["#e0845a", "#d9774a", "#e5946a", "#d06c43", "#dc7e52", "#cc6a45"]
BRICK_BURNT = ["#b35a37", "#a8512f"]
BRICK_LIGHT = "#eea070"
BRICK_HI = "#f6bb92"
BRICK_DEEP = "#8c3b22"
MORTAR = "#e6c9a0"
MORTAR_DEEP = "#b98a5e"
STONE = ["#f3e9d8", "#eee2cc", "#f6eee0", "#e9dcc4"]
STONE_B = "#cdb99a"
STONE_DEEP = "#9c8669"
IRON, IRON_HI, IRON_DK, IRON_LINE = "#7a6e68", "#a89c94", "#4f4541", "#2e2420"
MOSS = ["#a9d866", "#8fc452", "#7bb448", "#b8e07a"]
MOSS_B, MOSS_LINE = "#6fa83f", "#3f6424"
BARK_T, BARK_B, BARK_LINE = "#9a6a42", "#6b4428", "#4a2c18"
GRAIN, GRAIN_RING = "#efd29a", "#c99a5f"
COPPER, COPPER_HI, COPPER_DK, COPPER_LINE = "#e8935a", "#ffc79c", "#a8532e", "#5a2a18"


def body_half_width(y, top, shoulder, base_y, hw_top, hw_base):
    if y >= shoulder:
        t = (y - shoulder) / max(1, base_y - shoulder)
        return hw_top + (hw_base - hw_top) * t
    k = (shoulder - y) / max(1, shoulder - top)
    return hw_top * math.sqrt(max(0.0, 1 - k * k))


class Lines:
    """Batch polylines/dots on one RGBA layer, then clip by a mask and composite once (fast + tidy)."""

    def __init__(self, cv):
        self.cv = cv
        self.layer = Image.new("RGBA", cv.img.size, (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.layer)

    def line(self, pts, color, width, alpha=None):
        s = self.cv.ss
        self.d.line([(x * s, y * s) for x, y in pts], fill=C(color, alpha), width=max(1, int(width * s)), joint="curve")

    def dot(self, x, y, r, color, alpha=None):
        s = self.cv.ss
        self.d.ellipse([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], fill=C(color, alpha))

    def poly(self, pts, color, alpha=None):
        s = self.cv.ss
        self.d.polygon([(x * s, y * s) for x, y in pts], fill=C(color, alpha))

    def commit(self, clip=None):
        if clip is not None:
            self.layer.putalpha(Canvas.intersect(self.layer.getchannel("A"), clip))
        self.cv.img.alpha_composite(self.layer)


def puff(cv, x, y, r):
    """굴뚝 연기 한 덩이 — 도트화에서 살아남게 불투명으로."""
    m = cv.circle(x, y, r)
    cv.part(m, ("#fdfbf8", "#e6ded5", 90), "#a89c90", 1.6)
    cv.shade(m, "#cbbfb3", dx=r * 0.35, dy=r * 0.35, blur=1.2, alpha=0.8)


def draw(state: str) -> Canvas:
    lit = state == "lit"
    cv = Canvas(W, H, SS)
    rnd = rand(11)

    # ── 1. 굴뚝 (몸통 뒤) ─────────────────────────────
    chim = cv.rect(158, 24 + OY, 186, 98 + OY, r=2)
    cv.part(chim, (BRICK[2], BRICK[3], 0), LINE, OL)
    L = Lines(cv)
    for i, y in enumerate(range(31 + OY, 98 + OY, 8)):
        L.line([(158, y), (186, y)], MORTAR, IL)
        xo = 172 if i % 2 == 0 else 165
        L.line([(xo, y - 8), (xo, y)], MORTAR, IL)
        if i % 2:
            L.line([(179, y - 8), (179, y)], MORTAR, IL)
    L.commit(cv.shrink(chim, 0.6))
    cv.shade(chim, BRICK_DEEP, dx=7, dy=0, blur=2.5, alpha=0.45)
    cv.paint(Canvas.intersect(cv.rect(150, 22 + OY, 194, 40 + OY), chim), "#3a2016", 0.45)  # 굴뚝 입구 그을음
    cap = cv.rect(152, 13 + OY, 192, 27 + OY, r=3)
    cv.part(cap, (STONE[0], STONE_B, 90), LINE, OL)
    cv.paint(Canvas.intersect(cap, cv.rect(150, 11 + OY, 194, 17 + OY)), "#fffaf0", 0.9)   # 윗면
    cv.paint(Canvas.intersect(cap, cv.rect(150, 23 + OY, 194, 28 + OY)), STONE_DEEP, 0.55)  # 앞 모서리 그늘
    if lit:
        for (x, y, r) in [(176, 7 + OY, 7), (186, -6 + OY, 9), (176, -21 + OY, 7)]:
            puff(cv, x, y, r)

    # ── 2. 받침돌 (블록 4개) ───────────────────────────
    plinth_blocks = []
    for bi, (x0, x1) in enumerate([(24, 80), (80, 132), (132, 184), (184, 232)]):
        blk = cv.rect(x0, 194 + OY, x1, 232 + OY, r=4)
        tone = STONE[bi % len(STONE)]
        cv.part(blk, (tone, STONE_B, 90), LINE, OL)
        cv.paint(Canvas.intersect(blk, cv.rect(x0, 194 + OY, x1, 206 + OY)), "#fffaf0", 0.6)  # 윗면 띠
        cv.shade(blk, STONE_DEEP, dx=6, dy=4, blur=2.5, alpha=0.35)
        plinth_blocks.append(blk)
    plinth = Canvas.union(*plinth_blocks)
    L = Lines(cv)
    L.line([(26, 206.5 + OY), (230, 206.5 + OY)], STONE_DEEP, IL, 0.7)          # 윗면/앞면 경계
    L.line([(98, 214 + OY), (103, 220 + OY), (101, 226 + OY)], STONE_DEEP, 1.6)  # 금
    L.line([(206, 212 + OY), (211, 217 + OY), (216, 216 + OY)], STONE_DEEP, 1.6)
    for (px_, py_) in [(40, 222 + OY), (148, 226 + OY), (170, 216 + OY), (60, 214 + OY)]:
        L.dot(px_, py_, 1.3, STONE_DEEP, 0.7)                                      # 돌 표면 점
        L.dot(px_ - 1.5, py_ - 1.5, 1.0, "#ffffff", 0.7)
    L.commit(plinth)

    # ── 3. 몸통(벽돌 돔) ─────────────────────────────
    TOP, SHOULDER, BASE = 40 + OY, 128 + OY, 204 + OY
    HW_TOP, HW_BASE = 84, 94
    body = cv.dome(CX, BASE, HW_BASE, HW_TOP, SHOULDER, TOP)
    cv.part(body, MORTAR, LINE, OL + 0.4)
    inner_body = cv.shrink(body, 1.0)

    bricks = Lines(cv)
    details = Lines(cv)
    course_h = 14
    ci = 0
    y = TOP + 2
    while y < BASE:
        ymid = y + course_h / 2
        R = body_half_width(ymid, TOP, SHOULDER, BASE, HW_TOP, HW_BASE)
        if R > 8:
            n = max(3, round(2 * R / 26))
            stagger = 0.5 if ci % 2 else 0.0
            curve = 7.0 * min(1.0, (ymid - TOP) / 60.0)

            def yy(x, base, R=R, curve=curve):
                u = (x - CX) / max(1.0, R)
                return base + curve * u * u

            for j in range(-1, n + 1):
                t0, t1 = (j + stagger) / n, (j + 1 + stagger) / n
                if t1 <= 0 or t0 >= 1:
                    continue
                a0 = -math.pi / 2 + max(0.0, t0) * math.pi
                a1 = -math.pi / 2 + min(1.0, t1) * math.pi
                x0 = CX + R * math.sin(a0) + 1.3
                x1 = CX + R * math.sin(a1) - 1.3
                if x1 - x0 < 3:
                    continue
                top_y, bot_y = y + 1.3, y + course_h - 1.3
                pts = [(x0, yy(x0, top_y)), (x1, yy(x1, top_y)), (x1, yy(x1, bot_y)), (x0, yy(x0, bot_y))]
                roll = rnd.random()
                col = rnd.choice(BRICK_BURNT) if roll < 0.12 else (BRICK_LIGHT if roll > 0.9 else rnd.choice(BRICK))
                bricks.poly(pts, col)
                # 윗면 하이라이트 · 아랫면 그늘 · 줄눈 음영(벽돌 아래로 파인 홈)
                details.line([(x0 + 2.5, yy(x0, y + 3.2)), (x1 - 2.5, yy(x1, y + 3.2))], BRICK_HI, 2.0, 0.6)
                details.line([(x0 + 1.5, yy(x0, bot_y - 1.6)), (x1 - 1.5, yy(x1, bot_y - 1.6))], BRICK_DEEP, 2.0, 0.32)
                details.line([(x0, yy(x0, y + course_h + 0.2)), (x1, yy(x1, y + course_h + 0.2))], MORTAR_DEEP, 1.4, 0.65)
                # 깨진 모서리 (밝은 조각)
                if rnd.random() < 0.18:
                    cx_ = x0 + 2 if rnd.random() < 0.5 else x1 - 2
                    details.dot(cx_, yy(cx_, top_y + 2), 1.4, MORTAR, 0.95)
                # 금 간 벽돌
                if rnd.random() < 0.07 and x1 - x0 > 12:
                    mx = (x0 + x1) / 2
                    details.line([(mx - 3, yy(mx, top_y + 1)), (mx, yy(mx, top_y + 5)), (mx - 2, yy(mx, bot_y - 1))], BRICK_DEEP, 1.4, 0.9)
        y += course_h
        ci += 1
    bricks.commit(inner_body)
    details.commit(inner_body)

    # 돔 입체감
    cv.gradient(body, "#fff2dc", "#7a3220", 90, alpha=0.2)
    cv.shade(body, BRICK_DEEP, dx=30, dy=12, blur=16, alpha=0.5)
    cv.shade(body, "#5a2414", dx=9, dy=4, blur=4, alpha=0.35)
    cv.light(body, "#fff0d8", dx=12, dy=14, blur=8, alpha=0.45)
    base_ao = cv.intersect(body, cv.rect(0, BASE - 18, W, BASE + 2))
    cv.gradient(base_ao, "#5a2a1800", "#5a2a18", 90, alpha=0.5)
    # 아궁이 위 그을음 (쓰던 흔적)
    cv.paint(Canvas.intersect(cv.soften(cv.ellipse(CX, 104 + OY, 36, 18), 5), body), "#3a2016", 0.38)

    # 쇠띠 + 리벳 (돔 둘레)
    band_y = 98 + OY
    Rb = body_half_width(band_y + 4, TOP, SHOULDER, BASE, HW_TOP, HW_BASE)
    bpts_top, bpts_bot = [], []
    for k in range(0, 41):
        u = -1 + 2 * k / 40
        x = CX + Rb * u
        c = 7.0 * u * u
        bpts_top.append((x, band_y + c))
        bpts_bot.append((x, band_y + 8 + c))
    band = Canvas.intersect(cv.poly(bpts_top + bpts_bot[::-1]), cv.grow(body, 1.0))
    cv.part(band, (IRON_HI, IRON_DK, 90), IRON_LINE, 1.8)
    cv.light(band, "#d8d0c8", dx=0, dy=2.5, blur=0.8, alpha=0.6)
    L = Lines(cv)
    for k in range(-3, 4):
        u = k / 3.6
        rx = CX + Rb * u
        ry = band_y + 4 + 7.0 * u * u
        L.dot(rx + 0.6, ry + 0.6, 1.8, IRON_LINE)
        L.dot(rx, ry, 1.5, "#cfc6be")
    L.commit(band)

    # 들여다보는 구멍 (오른쪽 몸통)
    port_o = cv.circle(198, 152 + OY, 8)
    port_i = cv.circle(198, 152 + OY, 4.6)
    cv.part(port_o, (IRON_HI, IRON_DK, 90), IRON_LINE, 1.8)
    if lit:
        cv.paint(Canvas.intersect(cv.soften(cv.circle(198, 152 + OY, 12), 3), body), "#ffb347", 0.45)
        cv.part(port_i, ("#fff0b0", "#ff9a2e", 90), IRON_LINE, 1.2)
    else:
        cv.part(port_i, ("#1a0b06", "#4a2216", 90), IRON_LINE, 1.2)
        cv.paint(Canvas.intersect(cv.circle(199, 154 + OY, 2.2), port_i), "#c8552a", 0.7)
    L = Lines(cv)
    for ang in (0.6, 2.2, 3.8, 5.4):
        L.dot(198 + 6.3 * math.cos(ang), 152 + OY + 6.3 * math.sin(ang), 1.1, "#d8d0c8")
    L.commit(port_o)

    # ── 4. 이끼 모자 · 늘어진 이끼 · 꽃 · 새싹 ──────────────
    blobs = [cv.circle(CX + dx, TOP + dy, r) for (dx, dy, r) in
             [(-60, 28, 9), (-47, 15, 13), (-27, 6, 15), (0, 3, 16), (26, 6, 15), (46, 15, 12), (59, 27, 9), (-10, 15, 12), (14, 16, 12)]]
    drips = [cv.ellipse(CX + dx, TOP + dy, 3.4, h) for (dx, dy, h) in [(-52, 34, 7), (-34, 26, 6), (38, 28, 7), (55, 36, 5), (-8, 26, 5)]]
    moss = Canvas.intersect(Canvas.union(*blobs, *drips), cv.grow(body, 6))
    moss = Canvas.union(moss, cv.ellipse(CX, TOP + 14, 54, 12))
    cv.part(moss, (MOSS[3], MOSS_B, 90), MOSS_LINE, OL)
    cv.shade(moss, MOSS_LINE, dx=6, dy=5, blur=2.5, alpha=0.38)
    cv.light(moss, "#e8f9bb", dx=4, dy=5, blur=2, alpha=0.55)
    L = Lines(cv)
    for _ in range(46):  # 잎결: 작은 잎 덩이 3톤
        a = rnd.uniform(math.pi * 1.05, math.pi * 1.95)
        rr = rnd.uniform(0.3, 1.0)
        x = CX + math.cos(a) * 56 * rr
        y = TOP + 17 + math.sin(a) * 16 * rr + rnd.uniform(-2, 6)
        col = rnd.choice(["#6fa83f", "#5d9636", "#c4e889", "#9bcc5c"])
        L.poly([(x - 2.2, y), (x, y - 2.4), (x + 2.2, y), (x, y + 1.6)], col, 0.9)
    L.commit(cv.shrink(moss, 1.2))
    # 새싹
    sprout = Lines(cv)
    sprout.line([(CX + 4, TOP - 6), (CX + 4, TOP - 18)], "#5d9636", 2.4)
    sprout.poly([(CX + 4, TOP - 16), (CX - 6, TOP - 24), (CX - 7, TOP - 16)], "#8fc452")
    sprout.poly([(CX + 4, TOP - 17), (CX + 14, TOP - 25), (CX + 14, TOP - 17)], "#b8e07a")
    sprout.commit()
    sp_mask = Canvas.union(cv.poly([(CX + 4, TOP - 16), (CX - 6, TOP - 24), (CX - 7, TOP - 16)]), cv.poly([(CX + 4, TOP - 17), (CX + 14, TOP - 25), (CX + 14, TOP - 17)]))
    cv.paint(Canvas.subtract(cv.grow(sp_mask, 1.2), sp_mask), MOSS_LINE, 0.9)
    for (fx, fy, col) in [(CX - 36, TOP + 5, "#ffffff"), (CX - 14, TOP - 2, "#ffd6e4"), (CX + 20, TOP + 1, "#fff3a8"),
                          (CX + 42, TOP + 11, "#ffffff"), (CX - 52, TOP + 18, "#cfe8ff")]:
        petals = Canvas.union(*[cv.circle(fx + 3.2 * math.cos(k * 1.2566), fy + 3.2 * math.sin(k * 1.2566), 2.6) for k in range(5)])
        cv.part(petals, col, "#6b5a3a", 1.0)
        cv.paint(cv.circle(fx, fy, 1.7), "#f2b33d")

    # ── 5. 아궁이: 돌 아치 (돌마다 색·음영) ─────────────────
    AC_Y = 160 + OY          # 아치 중심
    R_IN, R_OUT = 35, 53
    A_OUT = cv.arch(CX, BASE + 1, R_OUT, AC_Y - R_OUT)
    A_IN = cv.arch(CX, BASE + 1, R_IN, AC_Y - R_IN)
    ring = Canvas.subtract(A_OUT, A_IN)
    cv.part(ring, STONE_DEEP, LINE, OL)  # 줄눈 바탕
    stones = []
    nv = 9
    gap = 0.035
    for k in range(nv):
        a0 = math.pi + k * math.pi / nv + gap
        a1 = math.pi + (k + 1) * math.pi / nv - gap
        pts = []
        for t in range(9):
            a = a0 + (a1 - a0) * t / 8
            pts.append((CX + (R_OUT - 1.2) * math.cos(a), AC_Y + (R_OUT - 1.2) * math.sin(a)))
        for t in range(9):
            a = a1 - (a1 - a0) * t / 8
            pts.append((CX + (R_IN + 1.2) * math.cos(a), AC_Y + (R_IN + 1.2) * math.sin(a)))
        stones.append((k, cv.poly(pts)))
    for side in (-1, 1):  # 양쪽 기둥돌 2단
        xa, xb = (CX - R_OUT + 1.2, CX - R_IN - 1.2) if side < 0 else (CX + R_IN + 1.2, CX + R_OUT - 1.2)
        stones.append((-1, cv.rect(xa, AC_Y + 1.2, xb, AC_Y + 20 - 1.2, r=1.5)))
        stones.append((-1, cv.rect(xa, AC_Y + 20 + 1.2, xb, BASE, r=1.5)))
    for k, st in stones:
        key = k == nv // 2
        tone = "#fffaf0" if key else STONE[rnd.randrange(len(STONE))]
        cv.gradient(st, tone, mix(STONE_B, "#ffffff", 0.15 if key else 0.0), 90)
        cv.light(st, "#ffffff", dx=2.2, dy=2.6, blur=0.8, alpha=0.6)
        cv.shade(st, STONE_DEEP, dx=2.6, dy=2.6, blur=1.0, alpha=0.45)
    # 쐐기돌 불꽃 문양 (새김)
    kx, ky = CX, AC_Y - (R_IN + R_OUT) / 2 + 2
    emb = cv.poly(flame_points(kx, ky + 5, 6, 11, lean=0.5))
    cv.paint(emb, "#8a7560", 0.9)
    cv.paint(cv.shift(Canvas.subtract(cv.grow(emb, 0.6), emb), 0.6, 0.6), "#ffffff", 0.5)
    cv.shade(ring, STONE_DEEP, dx=8, dy=4, blur=4, alpha=0.25)
    # 쇠 문턱 + 리벳
    sill = cv.rect(CX - R_OUT + 2, BASE - 5, CX + R_OUT - 2, BASE + 3, r=1.5)
    # (문턱은 아궁이 안쪽을 칠한 뒤 올린다 — 아래 6단계)

    # ── 6. 아궁이 안쪽 ──────────────────────────────
    if lit:
        cv.part(A_IN, ("#3a1409", "#b8441a", 90), LINE, OL)
    else:
        cv.part(A_IN, ("#24110b", "#4a2216", 90), LINE, OL)
        cv.radial(A_IN, "#c8552a", "#c8552a00", CX, BASE - 4, 34, alpha=0.5)
    L = Lines(cv)  # 안쪽 벽돌 결 (깊이감)
    for yy_ in range(int(AC_Y - 26), int(BASE - 8), 9):
        L.line([(CX - 34, yy_), (CX + 34, yy_)], "#140805", 1.4, 0.45)
    L.commit(cv.shrink(A_IN, 2.0))
    cv.shade(A_IN, "#140805", dx=-6, dy=-9, blur=5, alpha=0.55)
    # 재 바닥
    ash = cv.ellipse(CX, BASE - 5, 31, 5)
    cv.part(Canvas.intersect(ash, A_IN), ("#9a8f86", "#6f655e", 90), None, 0)
    L = Lines(cv)
    for _ in range(14):
        L.dot(CX + rnd.uniform(-26, 26), BASE - 5 + rnd.uniform(-3, 3), 0.9, rnd.choice(["#c4bab1", "#5a514b"]))
    L.commit(Canvas.intersect(ash, A_IN))
    # 장작(안쪽)
    for (x0, x1, yb) in [(CX - 26, CX + 6, BASE - 5), (CX - 4, CX + 26, BASE - 8)]:
        log = cv.rect(x0, yb - 8, x1, yb, r=4)
        cv.part(log, ("#4a2c1a", "#2a170d", 90), "#1a0b06", 1.6)
        if not lit:
            L = Lines(cv)
            for cx0 in range(int(x0) + 5, int(x1) - 3, 7):
                L.line([(cx0, yb - 6.5), (cx0 + 3, yb - 3.5), (cx0 + 1, yb - 1.5)], "#ff8a3a", 1.4)
            L.commit(cv.shrink(log, 0.8))
    if lit:
        clip = cv.grow(A_IN, 0.3)
        fl_back = Canvas.union(cv.poly(flame_points(CX - 14, BASE - 4, 26, 60, lean=-6)), cv.poly(flame_points(CX + 15, BASE - 4, 26, 64, lean=7)))
        fl_mid = cv.poly(flame_points(CX, BASE - 4, 36, 78, lean=2))
        fl_core = Canvas.union(cv.poly(flame_points(CX - 1, BASE - 5, 22, 54, lean=1)),
                               cv.poly(flame_points(CX - 13, BASE - 5, 14, 34, lean=-3)),
                               cv.poly(flame_points(CX + 13, BASE - 5, 14, 36, lean=4)))
        fl_hot = cv.poly(flame_points(CX, BASE - 6, 12, 30, lean=1))
        cv.paint(Canvas.intersect(fl_back, clip), "#e8552b")
        cv.paint(Canvas.intersect(fl_mid, clip), "#f76b2a")
        cv.paint(Canvas.intersect(cv.shrink(fl_mid, 3), clip), "#ff9a2e")
        cv.paint(Canvas.intersect(fl_core, clip), "#ffc93d")
        cv.paint(Canvas.intersect(fl_hot, clip), "#fff3bf")
        L = Lines(cv)
        for (sx, sy, sr) in [(CX - 9, 128 + OY, 1.6), (CX + 11, 120 + OY, 1.4), (CX + 3, 134 + OY, 1.2), (CX - 19, 142 + OY, 1.2)]:
            L.dot(sx, sy, sr, "#fff1b0")
        L.commit(clip)
    # 쇠 문턱
    cv.part(sill, (IRON_HI, IRON_DK, 90), IRON_LINE, 1.8)
    cv.light(sill, "#e0d8d0", dx=0, dy=2.2, blur=0.6, alpha=0.7)
    L = Lines(cv)
    for rx in (CX - 40, CX - 14, CX + 14, CX + 40):
        L.dot(rx + 0.5, BASE - 1 + 0.5, 1.6, IRON_LINE)
        L.dot(rx, BASE - 1, 1.3, "#d8d0c8")
    L.commit(sill)
    if lit:  # 불빛이 아치 안쪽 가장자리·문턱·받침돌 앞면으로 번진다
        spill = Canvas.union(ring, sill, Canvas.intersect(plinth, cv.rect(0, BASE, W, H)))
        cv.radial(spill, "#ffcf6a", "#ffcf6a00", CX, BASE - 16, 78, alpha=0.6)

    # ── 7. 왼쪽 앞 장작더미 + 꽂힌 돌도끼 ──────────────────
    logs = []
    for (x0, y0, x1, y1) in [(14, 212 + OY, 72, 228 + OY), (20, 197 + OY, 76, 213 + OY), (10, 181 + OY, 50, 196 + OY)]:
        log = cv.rect(x0, y0, x1, y1, r=7)
        cv.part(log, (BARK_T, BARK_B, 90), LINE, OL)
        L = Lines(cv)  # 껍질 결
        for bx in range(int(x0) + 6, int(x1) - 10, 6):
            off = rnd.uniform(-1, 1)
            L.line([(bx + off, y0 + 3), (bx + off + 2, y1 - 3)], BARK_LINE, 1.4, 0.75)
        L.line([(x0 + 5, y0 + 3.2), (x1 - 10, y0 + 3.2)], "#c9955f", 1.6, 0.8)
        L.commit(cv.shrink(log, 0.8))
        ey = (y0 + y1) / 2
        rx = (y1 - y0) / 2 - 0.5
        ex = x1 - rx * 0.55
        end = cv.ellipse(ex, ey, rx * 0.72, rx)
        cv.part(end, (GRAIN, "#e2bd80", 90), LINE, 1.8)
        ring1 = Canvas.subtract(cv.ellipse(ex, ey, rx * 0.46, rx * 0.64), cv.ellipse(ex, ey, rx * 0.46 - 1.2, rx * 0.64 - 1.2))
        cv.paint(ring1, GRAIN_RING, 0.95)
        cv.paint(cv.ellipse(ex, ey, 1.2, 1.5), GRAIN_RING)
        L = Lines(cv)
        L.line([(ex, ey - rx * 0.2), (ex + rx * 0.5, ey - rx * 0.75)], GRAIN_RING, 1.2, 0.9)  # 마른 틈
        L.commit(end)
        logs.append(log)
    # 돌도끼: 자루 + 돌머리 (맨 위 장작에 꽂힘)
    handle = cv.poly([(30, 179 + OY), (36, 177 + OY), (47, 150 + OY), (41, 148 + OY)])
    cv.part(handle, ("#c68c56", "#8e5c34", 0), LINE, 1.8)
    head = cv.poly([(34, 145 + OY), (54, 141 + OY), (59, 152 + OY), (50, 161 + OY), (35, 157 + OY)])
    cv.part(head, ("#b9b6bf", "#7d7984", 90), "#3a3540", 1.8)
    cv.light(head, "#ffffff", dx=2, dy=2.5, blur=0.8, alpha=0.6)
    L = Lines(cv)
    L.line([(40, 151 + OY), (52, 149 + OY)], "#8a5a34", 2.0)  # 가죽 끈
    L.line([(40, 154 + OY), (50, 152.5 + OY)], "#8a5a34", 1.6)
    L.commit(cv.grow(head, 1.0))
    if lit:  # 장작 오른쪽 면에 불빛
        cv.radial(Canvas.union(*logs), "#ffcf6a", "#ffcf6a00", 92, 238 + OY - 36, 60, alpha=0.4)

    # ── 8. 오른쪽 앞 구리 주괴 더미 + 버섯 · 이끼 ──────────────
    def ingot(x, y_bottom, w, h):
        m = cv.poly([(x, y_bottom), (x + w, y_bottom), (x + w - 4, y_bottom - h), (x + 4, y_bottom - h)])
        cv.part(m, (COPPER_HI, COPPER_DK, 90), COPPER_LINE, 1.8)
        top = cv.poly([(x + 4, y_bottom - h), (x + w - 4, y_bottom - h), (x + w - 6, y_bottom - h + 3), (x + 6, y_bottom - h + 3)])
        cv.paint(Canvas.intersect(top, m), "#ffe0c4", 0.9)
        cv.shade(m, "#7a3a1e", dx=3, dy=2, blur=0.8, alpha=0.4)
        L2 = Lines(cv)
        L2.line([(x + 7, y_bottom - h + 5), (x + 11, y_bottom - h + 5)], "#ffffff", 1.4, 0.9)  # 반짝
        L2.commit(m)
        return m
    ing = Canvas.union(ingot(186, 268, 30, 10), ingot(210, 268, 26, 10), ingot(197, 258, 28, 10))
    if lit:
        cv.radial(ing, "#fff0c0", "#fff0c000", 196, 250, 30, alpha=0.5)
    shroom_stem = Canvas.union(cv.rect(226, 223 + OY, 230, 232 + OY, r=1.5), cv.rect(234, 227 + OY, 237, 233 + OY, r=1.2))
    cv.part(shroom_stem, ("#fff6e6", "#e2cfb3", 90), LINE, 1.4)
    cap1 = cv.ellipse(228, 223 + OY, 7, 4.5)
    cap2 = cv.ellipse(235.5, 227 + OY, 5, 3.2)
    for capm in (cap1, cap2):
        cv.part(capm, ("#f07a5e", "#c9463a", 90), LINE, 1.4)
    L = Lines(cv)
    for (dx_, dy_) in [(225, 221.5 + OY), (230.5, 222 + OY), (234.5, 226 + OY)]:
        L.dot(dx_, dy_, 1.1, "#ffffff")
    L.commit(Canvas.union(cap1, cap2))
    tuft = Canvas.union(cv.circle(214, 197 + OY, 6), cv.circle(221, 200 + OY, 5), cv.circle(208, 200 + OY, 4.5))
    cv.part(tuft, (MOSS[3], MOSS_B, 90), MOSS_LINE, 1.6)
    return cv


def main():
    infos = []
    for st in ("idle", "lit"):
        cv = draw(st)
        cv.nudge(4)  # 불투명 영역 중심을 피벗 열 x=128 에 — 두 상태 동일 이동 (도트 격자와 맞게 짝수)
        infos.append(cv.export(os.path.join(HERE, f"furnace_{st}.png"), dot=DOT, colors=72))

    # 아이콘: 가동 상태 도트 이미지를 128x128 에 여백 8px, 정수배가 아닌 축소는 BOX(도트 뭉개짐 최소)
    lit = Image.open(os.path.join(HERE, "furnace_lit.png")).convert("RGBA")
    bbox = lit.getchannel("A").getbbox()
    crop = lit.crop(bbox)
    k = min(112 / crop.width, 112 / crop.height)
    crop = crop.resize((max(1, round(crop.width * k)), max(1, round(crop.height * k))), Image.BOX)
    crop.putalpha(crop.getchannel("A").point(lambda v: 255 if v >= 110 else 0))
    icon = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    icon.alpha_composite(crop, ((128 - crop.width) // 2, (128 - crop.height) // 2 + 1))
    icon.save(os.path.join(HERE, "furnace_icon.png"))

    refs = os.environ.get("FURNACE_REFS", "")  # "label=path=scale;..." 이웃 가구(선택)
    items = []
    for part in [p for p in refs.split(";") if p]:
        label, path, sc = part.split("=")
        items.append((label, path, float(sc)))
    items += [("idle", os.path.join(HERE, "furnace_idle.png"), 0.75), ("lit", os.path.join(HERE, "furnace_lit.png"), 0.75),
              ("icon", os.path.join(HERE, "furnace_icon.png"), 1.0)]
    tiles = {"tile:grass": os.path.join(ROOT, "tileimg", "FullGrass.png"), "tile:soil": os.path.join(ROOT, "tileimg", "FullSoil.png")}
    preview_sheet(items, os.path.join(HERE, "preview.png"), bgs=("sand", "snow", "checker"), tiles=tiles)
    for i in infos:
        print(i)


if __name__ == "__main__":
    main()
