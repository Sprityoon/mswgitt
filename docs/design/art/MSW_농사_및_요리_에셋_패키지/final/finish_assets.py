"""농사·요리 에셋 패키지 마감 (2026-10-22).

외부 생성 원본(상위 폴더 01_/04_/05_)을 게임 등록용으로 정리한다. 다시 돌리면 같은 결과가 나온다.
  1. 흰 구멍 메움 제거 — 잎 사이·지지대 격자·손잡이 안쪽처럼 투명이어야 할 곳이 흰색으로 칠해진 덩어리를 지운다
  2. 황금 호박 5단 금색화 — 주황 과육만 금색 램프로 옮긴다 (줄기·잎은 그대로)
  3. 씨앗 주머니 작물별 색 — 같은 디자인 6종을 인벤토리 48px에서도 구분되게 자루 색만 살짝 바꾼다
  4. 조리 냄비 대기/조리 중 정렬 — 256x288 캔버스에 같은 바닥선으로 맞추고, 잘린 김 꼭대기를 다듬는다
  5. '살짝 도트화' 마감 (image-to-pixel propkit.pixelize, dot 2)

실행: python finish_assets.py   (Pillow만 필요)
"""
import colorsys
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, ".claude", "skills", "image-to-pixel", "scripts"))
from propkit import preview_sheet  # noqa: E402  (실행 시 sys.path 로 해석 — 정적 분석기 경고는 무시)

DOT = 2

CROPS = {
    "carrot": ("01_carrot_128x128_natural_scale/sprite_carrot_s{}.png", 3),
    "wheat": ("01_crops_128x128_natural_scale/spr_wheat_s{}.png", 3),
    "potato": ("01_crops_128x128_natural_scale/spr_potato_s{}.png", 4),
    "tomato": ("01_crops_128x128_natural_scale/spr_tomato_s{}.png", 4),
    "strawberry": ("01_crops_128x128_natural_scale/spr_strawberry_s{}.png", 5),
    "gpumpkin": ("01_crops_128x128_natural_scale/spr_gpumpkin_s{}.png", 5),
}
# 흰 메움이 확인된 파일 (꽃잎이 흰 딸기·감자는 제외 — 꽃까지 지워진다)
HOLE_FIX = {
    "carrot_s2", "carrot_s3", "wheat_s2", "wheat_s3", "tomato_s3", "tomato_s4",
    "gpumpkin_s3", "gpumpkin_s4",
}
ICONS = {
    "icon_carrot": "04_carrot_icons_128x128/icon_carrot.png",
    "icon_carrot_soup": "04_carrot_icons_128x128/icon_carrot_soup.png",
    "icon_carrot_seed": "04_carrot_icons_128x128/icon_carrot_seed.png",
    "icon_wheat_seed": "04_icons_128x128/icon_wheat_seed.png",
    "icon_potato_seed": "04_icons_128x128/icon_potato_seed.png",
    "icon_tomato_seed": "04_icons_128x128/icon_tomato_seed.png",
    "icon_strawberry_seed": "04_icons_128x128/icon_strawberry_seed.png",
    "icon_golden_pumpkin_seed": "04_icons_128x128/icon_golden_pumpkin_seed.png",
    "icon_compost": "04_icons_128x128/icon_compost.png",
    "icon_watering_can": "04_icons_128x128/icon_watering_can.png",
    # 새 냄비 디자인용 아이콘 (2026-10-22 추가 — 원본 128px 대기 냄비)
    "icon_cooking_pot": "05_cooking_pot_and_held_tools/cooking_pot_idle_128x128.png",
}
# 씨앗 주머니 자루 색: (색상 이동°, 채도 배율, 명도 배율). 밀은 원본(기준 삼베색).
SEED_TINT = {
    "icon_carrot_seed": (-12, 1.25, 1.0),
    "icon_wheat_seed": (0, 1.0, 1.0),
    "icon_potato_seed": (-4, 0.75, 0.82),
    "icon_tomato_seed": (-28, 1.15, 0.95),
    "icon_strawberry_seed": (-45, 0.95, 1.02),
    "icon_golden_pumpkin_seed": (12, 1.45, 1.08),
}


def lum(r, g, b):
    return 0.299 * r + 0.587 * g + 0.114 * b


def is_fill_white(p):
    r, g, b, a = p
    return a > 0 and min(r, g, b) >= 200 and max(r, g, b) - min(r, g, b) <= 35


def remove_white_holes(im, min_size=8):
    """흰 메움 덩어리(연결 성분 >= min_size)를 투명으로 + 그 둘레의 밝은 무채색 번짐을 정리한다."""
    w, h = im.size
    px = im.load()
    seen = set()
    removed = 0
    for y in range(h):
        for x in range(w):
            if (x, y) in seen or not is_fill_white(px[x, y]):
                continue
            comp, stack = [], [(x, y)]
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and is_fill_white(px[nx, ny]):
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            if len(comp) < min_size:
                continue
            for cx, cy in comp:
                px[cx, cy] = (0, 0, 0, 0)
            removed += len(comp)
            # 둘레 번짐: 흰색과 외곽선이 섞인 밝은 회색 1겹
            for cx, cy in comp:
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        r, g, b, a = px[nx, ny]
                        if a > 0 and lum(r, g, b) > 165 and max(r, g, b) - min(r, g, b) <= 40:
                            px[nx, ny] = (0, 0, 0, 0)
                            removed += 1
    return removed


def shift_hsv(rgb, dh, sm, vm):
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
    h = (h + dh / 360) % 1.0
    s = max(0, min(1, s * sm))
    v = max(0, min(1, v * vm))
    return tuple(int(round(c * 255)) for c in colorsys.hsv_to_rgb(h, s, v))


def gold_pumpkin(im):
    """주황 과육(색상 15~45°, 채도 높음)만 금색 쪽으로: 색상 +14°, 채도·명도 소폭 상승."""
    px = im.load()
    n = 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 15 / 360 <= h <= 45 / 360 and s >= 0.45 and v >= 0.35:
                nr, ng, nb = shift_hsv((r, g, b), 14, 1.05, 1.08)
                px[x, y] = (nr, ng, nb, a)
                n += 1
    return n


def tint_burlap(im, dh, sm, vm):
    """삼베 자루(색상 20~50°, 중간 채도)만 물들인다. 꼬리표 그림·씨앗 내용물의 고채도 색은 남는다."""
    if dh == 0 and sm == 1.0 and vm == 1.0:
        return 0
    px = im.load()
    n = 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 20 / 360 <= h <= 50 / 360 and 0.18 <= s <= 0.62 and v >= 0.30:
                px[x, y] = (*shift_hsv((r, g, b), dh, sm, vm), a)
                n += 1
    return n


def pot_pair():
    """대기/조리 중 냄비를 256x288 캔버스에 같은 바닥선(y=275)으로 정렬. 조리 중 원본은 12px 아래로 그려져 있었다."""
    idle = Image.open(os.path.join(SRC, "05_cooking_pot_and_held_tools/cooking_pot_idle_256x256.png")).convert("RGBA")
    act = Image.open(os.path.join(SRC, "05_cooking_pot_and_held_tools/cooking_pot_active_256x256.png")).convert("RGBA")
    W, H = 256, 288
    ci = Image.new("RGBA", (W, H))
    ci.alpha_composite(idle, (0, 32))
    ca = Image.new("RGBA", (W, H))
    ca.alpha_composite(act, (0, 20))
    # 원본 꼭대기에서 잘린 김: 위쪽 10px을 성기게 깎아 칼로 벤 직선을 없앤다
    px = ca.load()
    for y in range(20, 30):
        keep_every = 1 + (30 - y) // 3
        for x in range(W):
            r, g, b, a = px[x, y]
            if a and min(r, g, b) > 150 and (x + y) % (keep_every + 1):
                px[x, y] = (0, 0, 0, 0)
    return ci, ca


def _protected(p, keep_fire):
    """색 제한·외곽 어둡게(selout)에서 뺄 픽셀: 흰 김·흰 꽃잎(+냄비는 불꽃·숯불)."""
    r, g, b, a = p
    if a == 0:
        return False
    if min(r, g, b) >= 185 and max(r, g, b) - min(r, g, b) <= 40:
        return True
    if keep_fire:
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if h <= 55 / 360 and s >= 0.5 and v >= 0.7:
            return True
    return False


def finish(im, colors, keep_fire=False):
    """propkit.pixelize 와 같은 단계(격자 축소 → 알파 이진화 → 색 제한 → selout → 원래 크기)에,
    보호 픽셀(흰 김·꽃잎·불꽃)은 축소 직후 색을 그대로 두고 selout 도 건너뛰는 예외를 더한다.
    (그대로 돌리면 흰 김이 회갈색, 작은 불꽃이 돌 색에 흡수돼 사라진다.)"""
    W, H = im.size
    gw, gh = W // DOT, H // DOT
    small = im.convert("RGBa").resize((gw, gh), Image.LANCZOS).convert("RGBA")
    alpha = small.getchannel("A").point(lambda v: 255 if v >= 110 else 0)
    rgb = Image.new("RGB", (gw, gh), (74, 42, 28))
    rgb.paste(small.convert("RGB"), mask=alpha)
    q = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGBA")
    q.putalpha(alpha)
    qp, sp = q.load(), small.load()
    protect = set()
    for y in range(gh):
        for x in range(gw):
            if qp[x, y][3] and _protected(sp[x, y], keep_fire):
                r, g, b, _ = sp[x, y]
                qp[x, y] = (r, g, b, 255)
                protect.add((x, y))
    border = []
    for y in range(gh):
        for x in range(gw):
            if qp[x, y][3] == 0 or (x, y) in protect:
                continue
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if nx < 0 or ny < 0 or nx >= gw or ny >= gh or qp[nx, ny][3] == 0:
                    border.append((x, y))
                    break
    for x, y in border:
        r, g, b, a = qp[x, y]
        if lum(r, g, b) > 70:
            qp[x, y] = (r // 2, g // 2, b // 2, a)
    return q.resize((gw * DOT, gh * DOT), Image.NEAREST)


def save(im, rel):
    p = os.path.join(HERE, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    im.save(p)
    bb = im.getchannel("A").getbbox()
    return p, bb


def main():
    report = []
    for crop, (pattern, n) in CROPS.items():
        for s in range(1, n + 1):
            key = f"{crop}_s{s}"
            im = Image.open(os.path.join(SRC, pattern.format(s))).convert("RGBA")
            note = []
            if key in HOLE_FIX:
                note.append(f"holes-{remove_white_holes(im)}px")
            if key == "gpumpkin_s5":
                note.append(f"gold-{gold_pumpkin(im)}px")
            p, bb = save(finish(im, 56), f"crops/crop_{key}.png")
            report.append((os.path.relpath(p, HERE), bb, ",".join(note)))
    for name, rel in ICONS.items():
        im = Image.open(os.path.join(SRC, rel)).convert("RGBA")
        note = []
        if name == "icon_watering_can":
            note.append(f"holes-{remove_white_holes(im)}px")
        if name in SEED_TINT:
            note.append(f"tint-{tint_burlap(im, *SEED_TINT[name])}px")
        p, bb = save(finish(im, 56), f"icons/{name}.png")
        report.append((os.path.relpath(p, HERE), bb, ",".join(note)))
    can = Image.open(os.path.join(SRC, "05_cooking_pot_and_held_tools/held_watering_can_128x128.png")).convert("RGBA")
    note = f"holes-{remove_white_holes(can)}px"
    p, bb = save(finish(can, 56), "tools/held_watering_can.png")
    report.append((os.path.relpath(p, HERE), bb, note))
    ci, ca = pot_pair()
    for state, im in (("idle", ci), ("active", ca)):
        p, bb = save(finish(im, 96, keep_fire=True), f"pot/cooking_pot_{state}.png")
        report.append((os.path.relpath(p, HERE), bb, "aligned 256x288 baseline y=275"))
    for r in report:
        print(*r)

    tiles = {"farm": os.path.join(ROOT, "tileimg", "FullFarm.png"), "grass": os.path.join(ROOT, "tileimg", "FullGrass.png")}
    crop_items = [(f"{c}{s}", os.path.join(HERE, f"crops/crop_{c}_s{s}.png"), 0.75)
                  for c, (_, n) in CROPS.items() for s in range(1, n + 1)]
    preview_sheet(crop_items, os.path.join(HERE, "preview_crops.png"), bgs=("checker",), zoom=2, tiles=tiles)
    icon_items = [(k.replace("icon_", ""), os.path.join(HERE, f"icons/{k}.png"), 0.5) for k in ICONS]
    icon_items.append(("held_can", os.path.join(HERE, "tools/held_watering_can.png"), 0.5))
    preview_sheet(icon_items, os.path.join(HERE, "preview_icons.png"), bgs=("checker", "grass", "dirt"), zoom=2)
    pot_items = [("idle", os.path.join(HERE, "pot/cooking_pot_idle.png"), 0.84),
                 ("active", os.path.join(HERE, "pot/cooking_pot_active.png"), 0.84)]
    preview_sheet(pot_items, os.path.join(HERE, "preview_pot.png"), bgs=("checker",), zoom=1, tiles=tiles)


if __name__ == "__main__":
    main()
