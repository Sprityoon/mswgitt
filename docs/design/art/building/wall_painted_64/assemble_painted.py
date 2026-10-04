"""Place image-model-painted materials on the exact tile grid without palette reduction.

This only crops/resizes/copies the painted pixels. No vector drawing, PXG, dithering,
procedural texture generation, sharpening or nearest-neighbor pixel enlargement.
"""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'generated_source.png'
source = Image.open(SOURCE).convert('RGBA')
assert source.size == (1254, 1254), source.size
size, top_height, trim_width = 256, 116, 12
def crop(box, dimensions):
    return source.crop(box).resize(dimensions, Image.Resampling.LANCZOS)

# The painting model's atlas has uneven rows; use its actual materials, then place
# them into equal square cells. All surface details come from the generated image.
top = crop((972, 880, 1240, 1220), (size, size))
# Match the periodic endpoints by copying boundary pixels, preserving the paint.
top.paste(top.crop((0, 0, 1, size)), (size - 1, 0))
top.paste(top.crop((0, 0, size, 1)), (0, size - 1))
face = Image.new('RGBA', (size, 140))
face.paste(crop((944, 119, 1252, 147), (size, 24)), (0, 0))
face.paste(crop((944, 147, 1252, 230), (size, 76)), (0, 24))
face.paste(crop((944, 230, 1252, 278), (size, 36)), (0, 100))
face.paste(crop((944, 278, 1252, 282), (size, 4)), (0, 136))
face.paste(face.crop((0, 0, 1, 140)), (size - 1, 0))
north = crop((24, 0, 298, 14), (size, trim_width))
north.paste(north.crop((0, 0, 1, trim_width)), (size - 1, 0))
west = crop((0, 290, 18, 560), (trim_width, size))
west.paste(west.crop((0, 0, trim_width, 1)), (0, size - 1))
east = west.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
end = face.crop((0, 136, 4, 140)).resize((4, 140), Image.Resampling.LANCZOS)

tiles = []
for mask in range(16):
    tile = top.copy()
    height = size if mask & 4 else top_height
    if not mask & 4:
        tile.paste(face, (0, top_height))
    if not mask & 1:
        tile.paste(north, (0, 0))
    if not mask & 8:
        tile.paste(west.crop((0, 0, trim_width, height)), (0, 0))
    if not mask & 2:
        tile.paste(east.crop((0, 0, trim_width, height)), (size - trim_width, 0))
    if not mask & 4:
        if not mask & 8:
            tile.paste(end, (0, top_height))
        if not mask & 2:
            tile.paste(end, (size - 4, top_height))
    tiles.append(tile)
master = Image.new('RGBA', (1024, 1024))
for mask, tile in enumerate(tiles):
    master.paste(tile, (mask % 4 * size, mask // 4 * size))
master.save(ROOT / 'wall_16_painted_master.png')
small = master.resize((256, 256), Image.Resampling.LANCZOS)
small.save(ROOT / 'wall_16_64.png')

for tile in tiles:
    assert tile.getextrema()[3] == (255, 255)
for mask in (0, 1, 2, 3, 8, 9, 10, 11):
    assert tiles[mask].crop((4, 116, 252, 256)).tobytes() == face.crop((4, 0, 252, 140)).tobytes()
assert tiles[15].tobytes() == top.tobytes()
report = {
    'master': [1024, 1024], 'game_sheet': [256, 256], 'tile': [64, 64],
    'order': 'N1 E2 S4 W8, masks 0..15', 'face_height': 35, 'trim_width': 3,
    'front_masks': [0, 1, 2, 3, 8, 9, 10, 11], 'opaque': True,
    'rendering': 'imagegen-painted materials, crop/placement only, Lanczos size conversion',
    'palette_reduction': False, 'pixelization': False, 'vector_drawing': False,
    'shared_edge_precision': 'master endpoint equality; 64px antialiasing may mix edge colors',
    'maker': 'refresh 검증 보류(MCP 미연결)', 'runtime': '런타임 검증 보류(제작자 수행)',
}
(ROOT / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(json.dumps(report, ensure_ascii=False))
