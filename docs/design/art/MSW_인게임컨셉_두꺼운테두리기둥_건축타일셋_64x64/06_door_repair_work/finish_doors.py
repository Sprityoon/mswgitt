"""Finish the image-tool repaint inside the existing door-leaf bounds only.

Original 48-tile sets are never rewritten. Both door states can be repaired locally.
"""
from pathlib import Path
import argparse
import importlib.util
import json
import shutil
from PIL import Image, ImageChops, ImageDraw
from prepare_reference import assemble, ROOT, SRC, OUT

PROJECT = ROOT.parents[3]
PROP_PATH = PROJECT / '.agents/skills/image-to-pixel/scripts/propkit.py'

def checker(size):
    im = Image.new('RGBA', size, '#cdd0c4')
    d = ImageDraw.Draw(im)
    for y in range(0, size[1], 8):
        for x in range(0, size[0], 8):
            if (x // 8 + y // 8) % 2:
                d.rectangle((x, y, x + 7, y + 7), fill='#b5baa9')
    return im

def preview(leaf, tag, open_patch=None):
    image = Image.new('RGB', (1440, 680), '#30332e')
    draw = ImageDraw.Draw(image)
    pairs = [(20, 24, 'INTERIOR'), (28, 32, 'EXTERIOR')]
    closed = {}
    for r, (start, opened, label) in enumerate(pairs):
        original = assemble(start)
        reference = assemble(opened)
        repaired = reference.copy()
        repaired.paste(leaf, (35, 51))
        closed[start] = repaired
        repaired.save(OUT / f'{label.lower()}_closed_{tag}_128.png')
        open_fixed = reference.copy()
        if open_patch is not None:
            open_fixed.paste(open_patch, (35, 51))
            closed[opened] = open_fixed
            open_fixed.save(OUT / f'{label.lower()}_open_{tag}_128.png')
        for c, (im, title) in enumerate([
            (original, 'BEFORE CLOSED'), (repaired, 'REPAIRED CLOSED'),
            (open_fixed, 'REPAIRED OPEN' if open_patch is not None else 'OPEN / UNCHANGED')
        ]):
            x, y = 16 + c * 480, 35 + r * 330
            draw.text((x, y - 20), label + ' ' + title, fill='white')
            bg = checker(im.size)
            bg.alpha_composite(im)
            image.paste(bg.resize((256, 256), Image.Resampling.NEAREST).convert('RGB'), (x, y))
            image.paste(bg.convert('RGB'), (x + 284, y + 64))
            # Native tile cut in the larger preview, outside art only.
            draw.line((x + 128, y - 5, x + 128, y - 1), '#88c492')
            draw.line((x - 5, y + 128, x - 1, y + 128), '#88c492')
    image.save(OUT / f'door_comparison_{tag}.png')
    return closed

def wall_preview(closed, tag):
    sheet = Image.new('RGB', (1100, 580), '#30332e')
    d = ImageDraw.Draw(sheet)
    for row, (closed_id, open_id, top, low, title) in enumerate([
        (20, 24, 9, 12, 'INTERIOR WALL'), (28, 32, 15, 18, 'EXTERIOR WALL')
    ]):
        for col, (door, state) in enumerate([(closed[closed_id], 'CLOSED'), (closed.get(open_id, assemble(open_id)), 'OPEN')]):
            wall = Image.new('RGBA', (512, 128))
            for x in range(8):
                for y, index in enumerate((top, low)):
                    tile = Image.open(next(SRC.glob(f'{index:02d}_*.png'))).convert('RGBA')
                    wall.alpha_composite(tile, (x * 64, y * 64))
            wall.alpha_composite(door, (192, 0))
            x, y = 20 + col * 540, 55 + row * 260
            d.text((x, y - 23), title + ' / ' + state, fill='white')
            sheet.paste(wall.convert('RGB'), (x, y))
            # Second strip is 100% tile size with 64px cut guides below it.
            for k in range(9):
                d.line((x + k * 64, y + 130, x + k * 64, y + 135), '#88c492')
    sheet.save(OUT / f'wall_connections_{tag}.png')

def open_preview(doors, tag):
    sheet = Image.new('RGB', (960, 660), '#30332e')
    draw = ImageDraw.Draw(sheet)
    for row, (start, label) in enumerate([(24, 'INTERIOR'), (32, 'EXTERIOR')]):
        for col, (im, state) in enumerate([(assemble(start), 'BEFORE OPEN'), (doors[start], 'REPAIRED OPEN')]):
            x, y = 16 + col * 480, 35 + row * 325
            draw.text((x, y - 20), label + ' / ' + state, fill='white')
            bg = checker(im.size)
            bg.alpha_composite(im)
            sheet.paste(bg.resize((256, 256), Image.Resampling.NEAREST).convert('RGB'), (x, y))
            sheet.paste(bg.convert('RGB'), (x + 280, y + 64))
    sheet.save(OUT / f'open_door_comparison_{tag}.png')

def release(closed):
    variants = [
        ('02_tiles_64x64_24px_border', '07_tiles_64x64_24px_border_door_fixed', 'Cabin_strip_24px_border_door_fixed.png'),
        ('04_tiles_64x64_24px_outer_edge_with_wall', '08_tiles_64x64_24px_outer_edge_door_fixed', 'Cabin_strip_24px_outer_edge_door_fixed.png'),
    ]
    has_open = 24 in closed
    expected_changed = list(range(20, 36)) if has_open else [20, 21, 22, 23, 28, 29, 30, 31]
    report = {'tile_size': [64, 64], 'border_px': 24, 'leaf_change_bounds': [35, 47, 93, 126],
              'open_change_bounds': [35, 51, 93, 126] if has_open else None, 'variants': []}
    for source, target, stripname in variants:
        src, dst = ROOT / source, ROOT / target
        dst.mkdir(exist_ok=True)
        for file in src.glob('*.png'):
            shutil.copyfile(file, dst / file.name)
        for start, door in closed.items():
            for i in range(4):
                x, y = (i % 2) * 64, (i // 2) * 64
                name = next(src.glob(f'{start+i:02d}_*.png')).name
                door.crop((x, y, x + 64, y + 64)).save(dst / name)
        files = sorted(dst.glob('*.png'))
        assert len(files) == 48
        changed = [int(f.name[:2]) for f in files if ImageChops.difference(
            Image.open(f).convert('RGB'), Image.open(src / f.name).convert('RGB')).getbbox()]
        assert changed == expected_changed, changed
        for f in files:
            assert Image.open(f).size == (64, 64)
            if int(f.name[:2]) not in changed:
                assert f.read_bytes() == (src / f.name).read_bytes()
        for start in closed:
            before = assemble(start).convert('RGBA')
            diff = ImageChops.difference(before, closed[start]).convert('RGB')
            bbox = diff.getbbox()
            min_y = 51 if start in (24, 32) else 47
            assert bbox and bbox[0] >= 35 and bbox[1] >= min_y and bbox[2] <= 93 and bbox[3] <= 126, bbox
            # Tile slicing is lossless, including the vertical/horizontal center cuts.
            roundtrip = Image.new('RGBA', (128, 128))
            for i in range(4):
                f = next(dst.glob(f'{start+i:02d}_*.png'))
                roundtrip.alpha_composite(Image.open(f).convert('RGBA'), ((i % 2) * 64, (i // 2) * 64))
            assert roundtrip.tobytes() == closed[start].tobytes()
        strip = Image.new('RGBA', (3072, 64))
        for i, file in enumerate(files):
            strip.alpha_composite(Image.open(file).convert('RGBA'), (i * 64, 0))
        strip.save(ROOT / '01_Cabin_strip_3072x64' / stripname)
        atlas = Image.new('RGB', (672, 564), '#30332e')
        draw = ImageDraw.Draw(atlas)
        for i, file in enumerate(files):
            x, y = 10 + (i % 8) * 84, 24 + (i // 8) * 90
            tile = checker((64, 64))
            tile.alpha_composite(Image.open(file).convert('RGBA'))
            atlas.paste(tile.convert('RGB'), (x, y))
            draw.text((x, y - 14), f'Tile {i}', fill='#a5e8a8' if i in changed else 'white')
        atlas.save(OUT / f'{target}_sheet.png')
        report['variants'].append({'folder': target, 'count': len(files), 'changed_indices': changed,
                                   'unchanged_tiles_byte_identical': 48 - len(changed),
                                   'open_tiles_unchanged': not has_open,
                                   'architecture_outside_door_bounds_unchanged': True,
                                   'tile_split_roundtrip': True, 'strip': stripname})
    (OUT / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    print(json.dumps(report, ensure_ascii=False, indent=2))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--generated', required=True)
    parser.add_argument('--open-generated')
    parser.add_argument('--tag', default='v1')
    parser.add_argument('--release', action='store_true')
    args = parser.parse_args()
    gen_path = OUT / 'generated_closed_door_final.png'
    if Path(args.generated).resolve() != gen_path.resolve():
        shutil.copyfile(args.generated, gen_path)
    generated = Image.open(gen_path).convert('RGBA')
    # Normalize only the repainted leaf; source jambs, lintel, wallpaper and borders remain exact.
    normalized = generated.resize((128, 128), Image.Resampling.LANCZOS)
    leaf = normalized.crop((31, 51, 94, 126)).resize((58, 75), Image.Resampling.LANCZOS)
    spec = importlib.util.spec_from_file_location('door_propkit', PROP_PATH)
    propkit = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(propkit)
    leaf = propkit.pixelize(leaf, dot=1, colors=72)
    leaf.save(OUT / f'closed_leaf_{args.tag}.png')
    open_patch = None
    if args.open_generated:
        open_path = OUT / 'generated_open_door_final.png'
        if Path(args.open_generated).resolve() != open_path.resolve():
            shutil.copyfile(args.open_generated, open_path)
        open_image = Image.open(open_path).convert('RGBA').resize((128, 128), Image.Resampling.LANCZOS)
        # Keep the small gray-metal highlight in a floor-dominated opening palette.
        open_patch = propkit.pixelize(open_image.crop((35, 51, 93, 126)), dot=1, colors=192)
        open_patch.save(OUT / f'open_leaf_shadow_{args.tag}.png')
    repaired = preview(leaf, args.tag, open_patch)
    wall_preview(repaired, args.tag)
    if open_patch is not None:
        open_preview(repaired, args.tag)
    if args.release:
        release(repaired)

if __name__ == '__main__':
    main()
