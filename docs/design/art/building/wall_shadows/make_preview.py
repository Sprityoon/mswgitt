"""Diagnostic before/after mockup of the actual registered cabin tiles."""
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
source = Image.open(HERE.parent / "wall_template_2x2/register/verify_basic_cabin.png").convert("RGBA")
after = source.copy()
shadow = Image.open(HERE / "wall_shadow_tile.png").convert("RGBA")
# Same 0.5 renderer tint alpha used by BuildingManager; preview only.
shadow.putalpha(shadow.getchannel("A").point(lambda a: round(a * .5)))
horizontal = shadow.resize((128, 42), Image.Resampling.LANCZOS)
# Interior floor edges adjacent to the north/left/right walls.
for x in range(256, 768, 128):
    after.alpha_composite(horizontal, (x, 256))
vertical_left = horizontal.transpose(Image.Transpose.ROTATE_90)
vertical_right = horizontal.transpose(Image.Transpose.ROTATE_270)
for y in range(256, 640, 128):
    after.alpha_composite(vertical_left, (256, y))
    after.alpha_composite(vertical_right, (726, y))
# Front exterior wall base, skipping the open-door position in this illustration.
bottom = horizontal
for x in [128, 256, 512, 640, 768]:
    after.alpha_composite(bottom, (x, 768))
out = Image.new("RGBA", (source.width * 2, source.height + 36), "#f4e6c8")
draw = ImageDraw.Draw(out)
draw.text((20, 12), "BEFORE", fill="#4a2a1c")
draw.text((source.width + 20, 12), "CONTACT SHADOW / registration pending", fill="#4a2a1c")
out.alpha_composite(source, (0, 36))
out.alpha_composite(after, (source.width, 36))
out.save(HERE / "preview_before_after.png")
print("preview_before_after.png saved; original textures unchanged")
