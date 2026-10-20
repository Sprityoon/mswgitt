"""ui8 축소 표시 그림 → 표시 크기 그대로 미리 줄인 PNG (2026-10-18).

Maker 가져오기 스프라이트는 축소될 때 최근접(Point) 필터로 그려져 매끈한 아이콘 가장자리가 계단처럼 깨진다
(HUD 우하단 버튼 151px → 110~190px). 필터를 바꿀 수 없으므로(pitfalls #74 와 같은 이유) 1920×1080 기준
표시 크기로 고품질(Lanczos, 알파 premultiply) 축소본을 만들어 1:1 로 그린다.

출력: ui8_import3/ui8s_<이름>_<가로>.png
실행: python -I build_ui8_sized.py
"""
import os
import shutil

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "ui8_import")
OUT = os.path.join(HERE, "ui8_import3")

# (원본, 표시 가로, 표시 세로) — 크기는 ui/HUDGroup·PopupGroup 의 실제 RectSize
JOBS = [
    ("ui8_hud_bag", 110, 110), ("ui8_hud_craft", 110, 110), ("ui8_hud_info", 110, 110),
    ("ui8_hud_interact", 130, 130), ("ui8_hud_jump", 130, 130), ("ui8_hud_attack", 190, 190),
    ("ui8_btn_close", 50, 52), ("ui8_btn_close", 52, 54),
    ("ui8_btn_plus", 60, 62), ("ui8_btn_plus", 64, 66), ("ui8_btn_minus", 60, 62),
]


def shrink(im, w, h):
    # premultiplied 알파로 줄여 가장자리에 검은 테가 생기지 않게 한다
    im = im.convert("RGBA")
    r, g, b, a = im.split()
    pm = Image.merge("RGBA", [Image.composite(c, Image.new("L", im.size, 0), a) for c in (r, g, b)] + [a])
    pm = Image.merge("RGB", pm.split()[:3]).resize((w, h), Image.LANCZOS)
    a2 = a.resize((w, h), Image.LANCZOS)
    out = Image.new("RGBA", (w, h))
    pr, pg, pb = pm.split()
    px_a = a2.load()
    rr, gg, bb = pr.load(), pg.load(), pb.load()
    o = out.load()
    for y in range(h):
        for x in range(w):
            al = px_a[x, y]
            if al == 0:
                o[x, y] = (0, 0, 0, 0)
            else:
                o[x, y] = (min(255, rr[x, y] * 255 // al), min(255, gg[x, y] * 255 // al), min(255, bb[x, y] * 255 // al), al)
    return out


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    for name, w, h in JOBS:
        im = Image.open(os.path.join(SRC, name + ".png"))
        out = shrink(im, w, h)
        fn = f"{name.replace('ui8_', 'ui8s_', 1)}_{w}.png"
        out.save(os.path.join(OUT, fn))
        print("->", fn, out.size)


if __name__ == "__main__":
    main()
