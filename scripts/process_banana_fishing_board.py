import os
import sys
from PIL import Image, ImageDraw, ImageFilter
from collections import deque

def process_banana_fishing_board():
    raw_path = r'C:\Users\mh566\.gemini\antigravity-ide\brain\5c14a9dd-fa5e-4f03-9d8c-2938173e889b\fishing_board_from_orig_1791060989268.jpg'
    raw = Image.open(raw_path).convert('RGB')
    w, h = raw.size

    # 1. Flood-fill from outer edges to isolate the pure background
    # Background is near white (r > 240, g > 240, b > 240)
    visited = [[False] * h for _ in range(w)]
    q = deque()

    # Add all borders to queue
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
        visited[x][0] = True
        visited[x][h - 1] = True
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
        visited[0][y] = True
        visited[w - 1][y] = True

    def is_bg(px, py):
        r, g, b = raw.getpixel((px, py))
        return r > 235 and g > 235 and b > 235

    bg_mask = [[False] * h for _ in range(w)]

    while q:
        cx, cy = q.popleft()
        if is_bg(cx, cy):
            bg_mask[cx][cy] = True
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                    visited[nx][ny] = True
                    q.append((nx, ny))

    # 1-b. Clear trapped white background between bobber/fishing string and board column (Y in [475, 720])
    for y in range(475, 720):
        if y < 585:
            # Fishing string is at X in [78, 92], board column is at X >= 129
            for x in range(93, 129):
                p = raw.getpixel((x, y))
                if p[0] > 220 and p[1] > 220 and p[2] > 220:
                    bg_mask[x][y] = True
        elif y <= 665:
            # In the bobber body region, find bobber's rightmost dark outline (X < 128)
            bobber_right = 0
            for x in range(80, 128):
                p = raw.getpixel((x, y))
                # Dark outline or red color
                if p[0] < 140 and p[1] < 140 and p[2] < 140:
                    bobber_right = max(bobber_right, x)
                elif p[0] > 150 and p[1] < 70 and p[2] < 70:
                    bobber_right = max(bobber_right, x)
            
            # If bobber outline found, gap is strictly between bobber_right and column (129)
            if bobber_right > 0 and bobber_right < 128:
                for x in range(bobber_right + 1, 129):
                    p = raw.getpixel((x, y))
                    if p[0] > 220 and p[1] > 220 and p[2] > 220:
                        bg_mask[x][y] = True
        else:
            # Bottom pin of bobber is at X in [80, 91], column is at X >= 130
            for x in range(93, 131):
                p = raw.getpixel((x, y))
                if p[0] > 220 and p[1] > 220 and p[2] > 220:
                    bg_mask[x][y] = True

    # 2. Build RGBA image: Non-background is strictly 100% opaque (alpha=255)
    # This guarantees the bobber, roof, frame, and parchment are completely solid with no transparency leaks
    rgba = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    raw_pixels = raw.load()
    rgba_pixels = rgba.load()

    for y in range(h):
        for x in range(w):
            if bg_mask[x][y]:
                rgba_pixels[x, y] = (0, 0, 0, 0)
            else:
                r, g, b = raw_pixels[x, y]
                rgba_pixels[x, y] = (r, g, b, 255)

    # 3. Crop to content bounding box
    bbox = rgba.getbbox()
    cropped = rgba.crop(bbox)
    print(f'Cropped bbox: {bbox}, size: {cropped.size}')

    # 4. Compare with original bulletin board (게시판.png)
    orig = Image.open('게시판.png').convert('RGBA')
    ow, oh = orig.size
    print(f'Original board size: {ow}x{oh}')
    
    # Analyze original board bounding box to match scale and pivot
    orig_bbox = orig.getbbox()
    orig_content = orig.crop(orig_bbox)
    print(f'Original content bbox: {orig_bbox}, size: {orig_content.size}')

    # Notice the fishing board has a top fish ornament, so content height might be slightly taller.
    # We want the main roof width / board width to closely match the original board!
    # Original width is 156px within 192px width.
    target_content_w = int(orig_content.width * 1.05)
    scale = target_content_w / cropped.width
    target_content_h = int(cropped.height * scale)

    resized = cropped.resize((target_content_w, target_content_h), Image.Resampling.LANCZOS)
    
    # 5. Place on target canvas
    # Canvas size: 192 x 256 (if height fits) or adjusted height
    # Let's check target height
    # Original bottom Y is around 220~225
    bottom_y = orig_bbox[3]
    top_y = bottom_y - target_content_h
    
    canvas_h = max(256, target_content_h + 30)
    canvas_w = 192
    if top_y < 10:
        # If top ornament exceeds, we can adjust canvas height or scale slightly
        # Let's scale so top_y is around 12 and bottom_y matches orig_bbox[3] (223)
        desired_h = 223 - 12 # 211px
        scale = desired_h / cropped.height
        target_content_w = int(cropped.width * scale)
        target_content_h = desired_h
        resized = cropped.resize((target_content_w, target_content_h), Image.Resampling.LANCZOS)
        top_y = 12

    final_sprite = Image.new('RGBA', (192, 256), (0, 0, 0, 0))
    place_x = (192 - target_content_w) // 2
    final_sprite.paste(resized, (place_x, top_y), resized)

    # Save deliverables
    dest_path1 = 'docs/design/art/fishing_board/fishing_board.png'
    dest_path2 = '낚시터_게시판.png'
    final_sprite.save(dest_path1)
    final_sprite.save(dest_path2)
    print(f'Saved: {dest_path1}')
    print(f'Saved: {dest_path2}')

    # 6. Create comparison preview side-by-side with original
    comp_w = 192 * 2 + 60
    comp_h = 280
    comp = Image.new('RGBA', (comp_w, comp_h), (242, 240, 235, 255))
    cdraw = ImageDraw.Draw(comp)
    cdraw.rectangle([15, 15, 205, 265], fill=(255, 255, 255, 255), outline=(210, 200, 190, 255), width=1)
    cdraw.rectangle([235, 15, 425, 265], fill=(235, 245, 255, 255), outline=(170, 200, 230, 255), width=1)
    
    comp.paste(orig, (15, 15), orig)
    comp.paste(final_sprite, (235, 15), final_sprite)

    preview_path = 'docs/design/art/fishing_board/preview.png'
    comp.save(preview_path)
    comp.save('scratch/boards_comparison.png')
    print(f'Saved comparison preview: {preview_path}')

if __name__ == '__main__':
    process_banana_fishing_board()
