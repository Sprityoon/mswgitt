"""ui8_import 검수용 미리보기 — 9-slice 경계로 다른 크기로 늘려 본 모습 + 게이지 채움 비율.

실행: python -I preview_ui8.py  →  ui8_preview/sliced.png (등록 대상 아님)
"""
import json
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "ui8_import")


def slice9(im, size, b):
    L, R, T, B = b["left"], b["right"], b["top"], b["bottom"]
    w, h = im.size
    W, H = size
    out = Image.new("RGBA", (W, H))
    xs = [(0, L, 0, L), (L, w - R, L, W - R), (w - R, w, W - R, W)]
    ys = [(0, T, 0, T), (T, h - B, T, H - B), (h - B, h, H - B, H)]
    for sx0, sx1, dx0, dx1 in xs:
        for sy0, sy1, dy0, dy1 in ys:
            if sx1 <= sx0 or sy1 <= sy0 or dx1 <= dx0 or dy1 <= dy0:
                continue
            out.alpha_composite(im.crop((sx0, sy0, sx1, sy1)).resize((dx1 - dx0, dy1 - dy0), Image.BILINEAR), (dx0, dy0))
    return out


def main():
    borders = json.load(open(os.path.join(D, "ui8_borders.json"), encoding="utf-8"))
    sheet = Image.new("RGBA", (1900, 6000), (128, 150, 96, 255))  # 잔디 비슷한 배경
    dr = ImageDraw.Draw(sheet)
    x, y, rowh = 10, 10, 0
    for name, b in borders.items():
        im = Image.open(os.path.join(D, name + ".png")).convert("RGBA")
        w, h = im.size
        # 가로 1.7배·세로 1.4배(높이 경계 0 이면 세로 유지)로 늘려 본다
        tw = int(w * 1.7)
        th = int(h * 1.4) if b["top"] + b["bottom"] > 0 else h
        if name.startswith("ui8_gauge_") or name.startswith("ui8_fish_fill"):
            tw = int(w * 0.6)  # 채움은 줄여 본다(낮은 수치)
        s = slice9(im, (tw, th), b)
        if x + tw > 1890:
            x, y, rowh = 10, y + rowh + 26, 0
        sheet.alpha_composite(s, (x, y))
        dr.text((x, y + th + 2), name, fill=(0, 0, 0, 255))
        x += tw + 14
        rowh = max(rowh, th)
    sheet = sheet.crop((0, 0, 1900, y + rowh + 30))
    sheet.save(os.path.join(HERE, "ui8_preview", "sliced.png"))
    print(sheet.size)


if __name__ == "__main__":
    main()
