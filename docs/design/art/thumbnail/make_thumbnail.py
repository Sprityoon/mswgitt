# 메이플월드 월드 썸네일 v2 (대규모 업데이트: 직업·보스 레이드) 합성 스크립트
# 원본 일러스트: 루트의 maplecraft_3split_thumbnail_*.jpg (전투 패널만 재사용)
# 실행: python docs/design/art/thumbnail/make_thumbnail.py
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

ROOT = Path(__file__).resolve().parents[4]
SRC = next(ROOT.glob("maplecraft_3split_thumbnail_*.jpg"))
OUT = Path(__file__).with_name("thumbnail_update_raid.png")
W, H = 1376, 768
FB = "C:/Windows/Fonts/Hancom Gothic Bold.ttf"
FM = "C:/Windows/Fonts/malgunbd.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def gradient(size, top, bottom):
    w, h = size
    g = Image.new("RGBA", (1, h))
    for y in range(h):
        g.putpixel((0, y), lerp(top, bottom, y / max(1, h - 1)))
    return g.resize((w, h))


def text_layer(text, fnt, fill_top, fill_bot, stroke, stroke_w, outer=None, outer_w=0, shadow=True):
    """그라디언트 채움 + 이중 외곽선 텍스트를 RGBA 레이어로 만든다."""
    pad = stroke_w + outer_w + 20
    l, t, r, b = fnt.getbbox(text)
    w, h = r - l + pad * 2, b - t + pad * 2
    org = (pad - l, pad - t)
    lay = Image.new("RGBA", (w, h + 10))
    d = ImageDraw.Draw(lay)
    if shadow:
        sh = Image.new("RGBA", lay.size)
        ImageDraw.Draw(sh).text((org[0] + 4, org[1] + 8), text, font=fnt, fill=(0, 0, 0, 170),
                                stroke_width=stroke_w + outer_w, stroke_fill=(0, 0, 0, 170))
        lay.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4)))
    if outer:
        d.text(org, text, font=fnt, fill=outer, stroke_width=stroke_w + outer_w, stroke_fill=outer)
    d.text(org, text, font=fnt, fill=stroke, stroke_width=stroke_w, stroke_fill=stroke)
    mask = Image.new("L", lay.size)
    ImageDraw.Draw(mask).text(org, text, font=fnt, fill=255)
    gl = gradient(lay.size, fill_top, fill_bot)
    # 상단 하이라이트 띠
    lay.paste(gl, (0, 0), mask)
    return lay


def rays(center, color_a, color_b, n=22):
    lay = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(lay)
    cx, cy = center
    R = 1800
    for i in range(n):
        a0 = 2 * math.pi * i / n
        a1 = a0 + math.pi / n
        col = color_a if i % 2 == 0 else color_b
        d.polygon([(cx, cy), (cx + R * math.cos(a0), cy + R * math.sin(a0)),
                   (cx + R * math.cos(a1), cy + R * math.sin(a1))], fill=col)
    return lay


def chip(text, fnt, bg, fg, border, pad=(26, 12)):
    l, t, r, b = fnt.getbbox(text)
    w, h = r - l + pad[0] * 2, b - t + pad[1] * 2
    lay = Image.new("RGBA", (w + 12, h + 14))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle((6, 10, w + 6, h + 10), radius=h // 2, fill=(0, 0, 0, 140))
    d.rounded_rectangle((2, 2, w + 2, h + 2), radius=h // 2, fill=bg, outline=border, width=5)
    d.text((2 + pad[0] - l, 2 + pad[1] - t), text, font=fnt, fill=fg)
    return lay


def starburst(r_out, r_in, n, fill, outline):
    s = r_out * 2 + 20
    lay = Image.new("RGBA", (s, s))
    d = ImageDraw.Draw(lay)
    c = s / 2
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.pi * i / n - math.pi / 2
        pts.append((c + r * math.cos(a), c + r * math.sin(a)))
    d.polygon([(x + 5, y + 8) for x, y in pts], fill=(0, 0, 0, 150))
    d.polygon(pts, fill=fill, outline=outline, width=6)
    return lay


def main():
    src = Image.open(SRC).convert("RGB")
    canvas = gradient((W, H), (70, 10, 30, 255), (25, 5, 45, 255))

    # 레이드 분위기 방사광 (오른쪽 전투 장면 뒤에서 퍼짐)
    canvas.alpha_composite(rays((1060, 420), (255, 120, 40, 46), (255, 210, 80, 18)))
    glow = Image.new("RGBA", (W, H))
    ImageDraw.Draw(glow).ellipse((760, 80, 1360, 760), fill=(255, 150, 60, 120))
    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(120)))

    # 전투 패널 재사용: 채도·대비 강화 후 확대, 왼쪽 가장자리 페이드
    art = src.crop((945, 40, 1376, 768))
    art = ImageEnhance.Color(art).enhance(1.25)
    art = ImageEnhance.Contrast(art).enhance(1.08)
    sc = 1.22
    art = art.resize((int(art.width * sc), int(art.height * sc)), Image.LANCZOS).convert("RGBA")
    fade = Image.new("L", art.size, 255)
    fd = ImageDraw.Draw(fade)
    for x in range(90):
        fd.line([(x, 0), (x, art.height)], fill=int(255 * (x / 90) ** 1.2))
    art.putalpha(fade)
    ax = W - art.width + 30
    canvas.alpha_composite(art, (ax, H - art.height + 60))

    # 왼쪽 텍스트 가독성용 그림자 판
    shade = Image.new("RGBA", (W, H))
    ImageDraw.Draw(shade).rectangle((0, 0, 620, H), fill=(20, 0, 25, 150))
    canvas.alpha_composite(shade.filter(ImageFilter.GaussianBlur(70)))

    # 타이틀
    title = text_layer("메이플크래프트", font(FB, 104), (255, 246, 170), (255, 170, 30),
                       (110, 45, 10), 9, outer=(255, 255, 255), outer_w=5)
    canvas.alpha_composite(title, (14, 6))
    sub = text_layer("마지막 모험가", font(FB, 48), (215, 245, 255), (110, 190, 255),
                     (25, 50, 110), 6, outer=(255, 255, 255), outer_w=3)
    canvas.alpha_composite(sub, (40, 140))

    # 대규모 업데이트 (기울인 메인 카피)
    upd = text_layer("대규모", font(FB, 112), (255, 255, 255), (255, 225, 120),
                     (170, 10, 20), 12, outer=(255, 230, 90), outer_w=6)
    upd2 = text_layer("업데이트!", font(FB, 140), (255, 255, 230), (255, 200, 40),
                      (170, 10, 20), 13, outer=(255, 230, 90), outer_w=7)
    canvas.alpha_composite(upd.rotate(6, expand=True, resample=Image.BICUBIC), (20, 205))
    canvas.alpha_composite(upd2.rotate(6, expand=True, resample=Image.BICUBIC), (6, 305))

    # 콘텐츠 칩
    cf = font(FM, 34)
    chips = [
        chip("보스 레이드 4종 오픈", cf, (200, 25, 35), (255, 255, 255), (255, 215, 80)),
        chip("신규 직업 · 8갈래 전직", cf, (255, 205, 50), (70, 25, 5), (255, 255, 255)),
        chip("히든 직업 · 장비 강화", cf, (60, 120, 230), (255, 255, 255), (200, 235, 255)),
    ]
    y = 568
    x_list = [34, 34, 34]
    for c, x in zip(chips, x_list):
        canvas.alpha_composite(c, (x, y))
        y += c.height - 6
    # 칩이 세로로 넘치지 않도록 2열 배치 보정
    # NEW 스타버스트
    sb = starburst(78, 58, 14, (255, 40, 60), (255, 255, 255))
    sbd = ImageDraw.Draw(sb)
    nf = font(FB, 46)
    c = sb.width / 2
    sbd.text((c, c - 4), "NEW", font=nf, fill=(255, 255, 255), anchor="mm",
             stroke_width=3, stroke_fill=(120, 0, 10))
    canvas.alpha_composite(sb.rotate(-12, resample=Image.BICUBIC), (W - sb.width - 14, 8))

    canvas.convert("RGB").save(OUT, quality=95)
    print(OUT)


if __name__ == "__main__":
    main()
