"""시작 화면 개편 레이아웃 오프라인 미리보기 (2026-10-15).

scripts/build_mainmenu_revamp_20261015.cjs 가 쓴 layout_preview.json 을 읽어
실제 배경(keyart_1_1) · 책(notebook_menu_frame_ui) · 4_Final_MSW_PNG 에셋으로 1920×1080 화면을 합성한다.
아바타는 회색 실루엣 박스, 글자는 맑은 고딕으로 근사한다(게임 폰트와 다르다 — 배치 확인용).
출력: preview_screens/{title,select,delete,create}.png
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
FINAL = os.path.join(HERE, "4_Final_MSW_PNG")
OUT = os.path.join(HERE, "preview_screens")
W, H = 1920, 1080
FONT = "C:/Windows/Fonts/malgunbd.ttf"


def to_px(abs_xy, size):
    x, y = abs_xy
    w, h = size
    return int(round(W / 2 + x - w / 2)), int(round(H / 2 - y - h / 2))


def background():
    art = Image.open(os.path.join(ROOT, "keyart_1_1.jpg")).convert("RGBA").resize((1920, 1920), Image.LANCZOS)
    return art.crop((0, 420, 1920, 1500))


def text(canvas, it):
    if not it.get("text"):
        return
    d = ImageDraw.Draw(canvas)
    size = it.get("fontSize", 22)
    f = ImageFont.truetype(FONT, size)
    x0, y0 = to_px(it["abs"], it["size"])
    w, h = it["size"]
    col = it.get("color", "#2A1608")
    alpha = it.get("alpha", 1)
    lines = it["text"].split("\n")
    lh = size + 4
    ty = y0 + (h - lh * len(lines)) / 2
    for ln in lines:
        tw = d.textlength(ln, font=f)
        if it.get("align") == "left":
            tx = x0 + it.get("padLeft", 0)
        else:
            tx = x0 + it.get("padLeft", 0) / 2 + (w - tw) / 2
        c = tuple(int(col[i:i + 2], 16) for i in (1, 3, 5)) + (int(255 * alpha),)
        d.text((tx, ty), ln, font=f, fill=c, stroke_width=it.get("outlinePixels", 0), stroke_fill=it.get("outlineColor", "#4A2B10"))
        ty += lh


def render(items, screen, base=None):
    canvas = base.copy() if base is not None else background()
    for it in items:
        if it["screen"] != screen:
            continue
        img = it.get("image")
        w, h = [int(round(v)) for v in it["size"]]
        xy = to_px(it["abs"], it["size"])
        if img == "book":
            im = Image.open(os.path.join(ROOT, "notebook_menu_frame_ui.png")).convert("RGBA").resize((w, h), Image.LANCZOS)
            canvas.paste(im, xy, im)
        elif img == "dim":
            canvas.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(255 * 0.58))))
        elif img == "avatar":
            ov = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            d.rectangle([0, 0, w - 1, h - 1], outline=(60, 60, 200, 255), width=2)
            d.ellipse([w * 0.3, h * 0.2, w * 0.7, h * 0.5], fill=(90, 90, 90, 200))
            d.rectangle([w * 0.35, h * 0.5, w * 0.65, h * 0.9], fill=(90, 90, 90, 200))
            canvas.paste(ov, xy, ov)
        elif img:
            im = Image.open(os.path.join(FINAL, img + ".png")).convert("RGBA").resize((w, h), Image.LANCZOS)
            if it.get("alpha", 1) < 1 and not it.get("text"):
                im.putalpha(im.getchannel("A").point(lambda v: int(v * it["alpha"])))
            canvas.paste(im, xy, im)
        text(canvas, it)
    return canvas


def main():
    data = json.load(open(os.path.join(HERE, "layout_preview.json"), encoding="utf8"))
    items = data["items"]
    os.makedirs(OUT, exist_ok=True)
    title = background()
    logo = Image.open(os.path.join(ROOT, "title_logo_transparent.png")).convert("RGBA").resize((920, 514), Image.LANCZOS)
    title.paste(logo, to_px([0, 270], [920, 514]), logo)
    render(items, "title", title).save(os.path.join(OUT, "title.png"))
    sel = render(items, "select")
    sel.save(os.path.join(OUT, "select.png"))
    render(items, "delete", sel).save(os.path.join(OUT, "delete.png"))
    render(items, "create").save(os.path.join(OUT, "create.png"))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
