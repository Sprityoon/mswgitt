"""실제 에셋을 합성하는 오프라인 배치 확인. Maker 캡처가 아니며 폰트는 맑은 고딕 근사치다.
python docs/design/ui/maplecraft_settings_ui_only/preview_layout.py
"""
import importlib.util
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
START = HERE.parent / "maplecraft_start_ui_assets"
ROOT = HERE.parents[3]
OUT = HERE / "preview_screens"
spec = importlib.util.spec_from_file_location("start_preview", START / "preview_layout.py")
start = importlib.util.module_from_spec(spec)
spec.loader.exec_module(start)


def asset(name):
    if name == "book":
        return ROOT / "notebook_menu_frame_ui.png"
    folder = HERE if name.startswith("mc_set_") else START
    return folder / "4_Final_MSW_PNG" / (name + ".png")


def paint(canvas, name, xy, size):
    im = Image.open(asset(name)).convert("RGBA").resize(tuple(map(int, size)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(im, tuple(map(int, xy)))


def main():
    OUT.mkdir(exist_ok=True)
    items = json.loads((HERE / "layout_preview.json").read_text(encoding="utf8"))["items"]
    for mobile in (False, True):
        canvas = start.background()
        for it in items:
            keypart = it["path"].startswith("Window/KeyRows/")
            if mobile and keypart:
                continue
            im = it.get("image")
            xy = start.to_px(it["abs"], it["size"])
            if im == "slider":
                paint(canvas, "mc_set_slider_track", xy, it["size"])
                w, h = it["size"]
                value = it["value"]
                paint(canvas, "mc_set_slider_fill", (xy[0] + 7, xy[1] + 5), ((w - 14) * value, h - 10))
                paint(canvas, "mc_set_slider_knob", (xy[0] + (w - 30) * value, xy[1] - 5), (30, 32))
            elif im:
                paint(canvas, im, xy, it["size"])
            start.text(canvas, it)
        if mobile:
            notice = {"abs": [256, 40], "size": [330, 180], "text": "모바일 조작키 설정은\n준비중입니다!", "fontSize": 24, "color": "#3B2314"}
            paint(canvas, "mc_row_card", start.to_px(notice["abs"], notice["size"]), notice["size"])
            start.text(canvas, notice)
        canvas.save(OUT / ("settings_mobile.png" if mobile else "settings_pc.png"))

    sheet = Image.new("RGB", (900, 600), "#F4E9D1")
    d = ImageDraw.Draw(sheet)
    font = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 14)
    for i, p in enumerate(sorted((HERE / "4_Final_MSW_PNG").glob("*.png"))):
        x, y = (i % 3) * 300, (i // 3) * 150
        im = Image.open(p).convert("RGBA")
        im.thumbnail((270, 100), Image.Resampling.LANCZOS)
        sheet.paste(im, (x + (300 - im.width) // 2, y + 12), im)
        d.text((x + 10, y + 120), p.stem, fill="#3B2314", font=font)
    sheet.save(OUT / "assets_contact_sheet.png")
    start.main()
    print("wrote", OUT)


if __name__ == "__main__":
    main()
