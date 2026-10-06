"""UIBuilder에서 추출한 기본 도형을 켜짐/음소거 상태로 그리는 진단용 미리보기.

Maker의 실제 렌더 검증을 대체하지 않는다. 게임은 PNG 대신 native UI 도형을 사용한다.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

directory = Path(__file__).resolve().parent
parts = json.loads((directory / 'music_icon.preview-data.json').read_text(encoding='utf-8'))
scale = 4
image = Image.new('RGB', (400 * scale, 160 * scale), '#48634A')
draw = ImageDraw.Draw(image)

def color(value):
    return tuple(round(value[channel] * 255) for channel in ('r', 'g', 'b'))

for muted, center in [(False, (100, 76)), (True, (300, 76))]:
    def point(value):
        return ((center[0] + value['x']) * scale, (center[1] - value['y']) * scale)
    for part in parts:
        if '/Waves/' in part['path'] and muted:
            continue
        if '/MuteSlash/' in part['path'] and not muted:
            continue
        if part['polygon']:
            data = part['polygon']
            draw.polygon([point(p) for p in data['Points']], fill=color(data['Color']))
        if part['line']:
            data = part['line']['Points']
            draw.line([point(p['Position']) for p in data], fill=color(data[0]['Color']),
                      width=round(data[0]['Width'] * scale), joint='curve')
    draw.text(((center[0] - 20) * scale, 125 * scale), 'MUTED' if muted else 'ON',
              fill='#FFF0CE', font_size=14 * scale)
image.resize((400, 160), Image.Resampling.LANCZOS).save(directory / 'music_icon.preview.png')
