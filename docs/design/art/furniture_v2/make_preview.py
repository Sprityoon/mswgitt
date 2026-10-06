"""Compose diagnostic previews; original asset PNGs are never changed."""
from pathlib import Path
import json
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
names = ["cooking_pot", "bed", "animal_pen"]
sheet = Image.new("RGBA", (1050, 700), "#f4e6c8")
draw = ImageDraw.Draw(sheet)
manifest = {}
for i, name in enumerate(names):
    x = i * 350
    draw.text((x + 16, 15), name, fill="#4a2a1c")
    for j, color in enumerate(["#81a85d", "#c9af7e", "#e4e7eb", "#9c9993"]):
        y = 50 + j * 135
        draw.rectangle((x + 10, y, x + 340, y + 128), fill=color)
        sprite = Image.open(HERE / f"{name}_sprite.png").convert("RGBA")
        opaque = sprite.getchannel("A").point(lambda a: 255 if a >= 128 else 0).getbbox()
        # Preview only: ignore faint generated fringe when measuring the silhouette.
        shown = sprite.crop(opaque)
        shown.thumbnail((180, 118), Image.Resampling.LANCZOS)
        sheet.alpha_composite(shown, (x + 26 + (180-shown.width)//2, y + (128-shown.height)//2))
        icon = Image.open(HERE / f"{name}_icon.png").convert("RGBA")
        icon_box = icon.getchannel("A").point(lambda a: 255 if a >= 128 else 0).getbbox()
        small = icon.crop(icon_box)
        small.thumbnail((48, 48), Image.Resampling.NEAREST)
        sheet.alpha_composite(small, (x + 255, y + 38))
        if j == 0:
            manifest[name] = {"sprite_canvas": sprite.size, "sprite_opaque_bounds": opaque,
                              "icon_canvas": icon.size, "icon_opaque_bounds": icon_box,
                              "registration": "pending", "pivot": [0.5, 0.5]}
    draw.text((x + 20, 617), "sprite + 48px icon / grass, sand, snow, gray", fill="#4a2a1c")
# Existing neighbor shown at its game's 0.75 scale, for visual comparison.
neighbor = Image.open(HERE.parent / "furnace_v2/furnace_idle.png").convert("RGBA")
neighbor.thumbnail((60, 60), Image.Resampling.NEAREST)
sheet.alpha_composite(neighbor, (24, 640))
draw.text((100, 654), "Existing furnace reference; PNGs retain original resolution.", fill="#4a2a1c")
sheet.save(HERE / "preview.png")
(HERE / "asset-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("preview.png and asset-manifest.json saved")
