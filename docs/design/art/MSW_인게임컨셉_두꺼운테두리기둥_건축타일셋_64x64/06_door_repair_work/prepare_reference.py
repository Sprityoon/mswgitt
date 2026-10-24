from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / '02_tiles_64x64_24px_border'
OUT = Path(__file__).resolve().parent

def assemble(start):
    image = Image.new('RGBA', (128, 128))
    for i in range(4):
        path = next(SRC.glob(f'{start+i:02d}_*.png'))
        image.alpha_composite(Image.open(path).convert('RGBA'), ((i % 2) * 64, (i // 2) * 64))
    return image

def main():
    OUT.mkdir(exist_ok=True)
    sheet = Image.new('RGB', (1120, 700), '#353732')
    draw = ImageDraw.Draw(sheet)
    for i, (name, start) in enumerate([
        ('interior_closed', 20), ('interior_open_REFERENCE', 24),
        ('exterior_closed', 28), ('exterior_open_REFERENCE', 32),
    ]):
        image = assemble(start)
        image.save(OUT / f'{name}_128.png')
        image.resize((512, 512), Image.Resampling.NEAREST).save(OUT / f'{name}_512.png')
        x, y = 18 + (i % 2) * 560, 28 + (i // 2) * 350
        draw.text((x, y - 18), name, fill='white')
        checker = Image.new('RGBA', (128, 128), '#bfc5ad')
        checker.alpha_composite(image)
        sheet.paste(checker.resize((256, 256), Image.Resampling.NEAREST).convert('RGB'), (x, y))
        sheet.paste(checker.convert('RGB'), (x + 280, y + 64))
        for k in (0, 64, 128):
            draw.line((x + k * 2, y, x + k * 2, y + 256), '#fb6373')
            draw.line((x, y + k * 2, x + 256, y + k * 2), '#fb6373')
    sheet.save(OUT / 'door_audit_before.png')
    sizes = {Image.open(p).size for p in SRC.glob('*.png')}
    print('source sizes:', sizes)
    other = ROOT / '04_tiles_64x64_24px_outer_edge_with_wall'
    print('door tiles equal across 24px variants:', all(
        p.read_bytes() == (other / p.name).read_bytes()
        for p in SRC.glob('*.png') if 20 <= int(p.name[:2]) < 36
    ))

if __name__ == '__main__':
    main()
