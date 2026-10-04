"""Compose an offline art review; no Maker interaction or game resource changes."""
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parent
project = root.parents[4]
sheet = Image.open(root / 'wall_16_64.png').convert('RGBA')
assert sheet.size == (256, 256)
tiles = [sheet.crop((m % 4 * 64, m // 4 * 64, m % 4 * 64 + 64, m // 4 * 64 + 64)) for m in range(16)]
grass = Image.open(project / 'tileimg/FullGrass.png').convert('RGBA').resize((64, 64), Image.Resampling.NEAREST)
floor = Image.open(project / 'docs/design/art/building/woodland_64/tileset_64.png').convert('RGBA').crop((3, 3, 61, 61)).resize((64, 64), Image.Resampling.NEAREST)
walls = {(x, y) for x in range(1, 10) for y in (1, 7)} | {(x, y) for x in (1, 9) for y in range(1, 8)}
walls |= {(5, y) for y in range(1, 6)} | {(x, 4) for x in range(3, 8)}
preview = Image.new('RGBA', (11 * 64, 9 * 64))
for y in range(9):
    for x in range(11):
        preview.paste(floor if 1 < x < 9 and 1 < y < 7 else grass, (x * 64, y * 64))
for x, y in sorted(walls):
    mask = sum(bit for dx, dy, bit in ((0, -1, 1), (1, 0, 2), (0, 1, 4), (-1, 0, 8)) if (x + dx, y + dy) in walls)
    preview.paste(tiles[mask], (x * 64, y * 64))
preview.resize((1100, 900), Image.Resampling.NEAREST).save(root / 'preview_room.png')

# Inspect the delivered PNG itself, including all face bands and connected edge pairs.
pixels = sheet.load()
assert all(pixels[x, y][3] == 255 for y in range(256) for x in range(256))
def pixel(mask, x, y):
    return pixels[(mask % 4) * 64 + x, (mask // 4) * 64 + y]
face_masks = [m for m in range(16) if not m & 4]
for m in face_masks:
    for y in range(29, 64):
        for x in range(1, 63):
            assert pixel(m, x, y) == pixel(0, x, y)
for m in range(16):
    if m & 4:
        assert max(pixel(m, 32, 45)[:3]) < 60
    if m & 2:
        for n in range(16):
            if n & 8 and m & 5 == n & 5:
                assert all(pixel(m, 63, y) == pixel(n, 0, y) for y in range(64))
report = json.loads((root / 'verification.json').read_text(encoding='utf8'))
report['deliveredPngVerified'] = True
report['offlinePreview'] = 'rectangle room + T junction + crossing; preview_room.png'
(root / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print('Delivered PNG: dimensions, alpha, common face bands, horizontal shared edges PASS; offline preview saved.')
