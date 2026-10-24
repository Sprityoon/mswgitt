"""Losslessly pack the corrected 64px tiles into Maker-sized grid atlases."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '09_atlases_8x6_512x384'
VARIANTS = [
    ('07_tiles_64x64_24px_border_door_fixed', 'Cabin_atlas_24px_border_door_fixed_8x6.png'),
    ('08_tiles_64x64_24px_outer_edge_door_fixed', 'Cabin_atlas_24px_outer_edge_door_fixed_8x6.png'),
]

def main():
    OUT.mkdir(exist_ok=True)
    manifests = []
    for source, filename in VARIANTS:
        tiles = sorted((ROOT / source).glob('*.png'))
        assert len(tiles) == 48, source
        atlas = Image.new('RGBA', (512, 384), (0, 0, 0, 0))
        entries = []
        for index, tile in enumerate(tiles):
            assert int(tile.name[:2]) == index, tile.name
            image = Image.open(tile).convert('RGBA')
            assert image.size == (64, 64), tile.name
            x, y = (index % 8) * 64, (index // 8) * 64
            # Direct paste preserves even the RGB bytes under fully transparent pixels.
            atlas.paste(image, (x, y))
            entries.append({'index': index, 'file': tile.name,
                            'column': index % 8, 'row': index // 8,
                            'x': x, 'y': y, 'width': 64, 'height': 64})
        path = OUT / filename
        atlas.save(path)
        saved = Image.open(path).convert('RGBA')
        assert saved.size == (512, 384)
        assert max(saved.size) <= 2048
        for tile, entry in zip(tiles, entries):
            x, y = entry['x'], entry['y']
            assert saved.crop((x, y, x + 64, y + 64)).tobytes() == Image.open(tile).convert('RGBA').tobytes(), tile.name
        manifests.append({'atlas': filename, 'source': source, 'width': 512,
                          'height': 384, 'columns': 8, 'rows': 6,
                          'tile_width': 64, 'tile_height': 64, 'margin': 0,
                          'spacing': 0, 'order': 'left-to-right, top-to-bottom',
                          'lossless_tile_checks': 48, 'tiles': entries})
        print(f'PASS {filename}: 512x384 RGBA, 8x6, all 48 tiles pixel-identical')
    (OUT / 'atlas-layout.json').write_text(json.dumps(manifests, ensure_ascii=False, indent=2), encoding='utf8')

if __name__ == '__main__':
    main()
