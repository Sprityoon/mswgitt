import os
import sys
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

sys.path.insert(0, r"c:\minho\메이플월드\.agents\skills\image-to-pixel\scripts")
from propkit import pixelize

def extract_alpha_precise(img_path):
    im = Image.open(img_path).convert('RGB')
    w, h = im.size
    arr = np.array(im, dtype=np.float32)

    # 1. Flood fill from outer boundaries
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        q.append((0, x))
        q.append((h - 1, x))
    for y in range(h):
        q.append((y, 0))
        q.append((y, w - 1))

    def is_white_bg(y, x):
        r, g, b = arr[y, x]
        if r >= 244 and g >= 244 and b >= 244:
            return True
        if min(r, g, b) >= 238 and (max(r, g, b) - min(r, g, b) <= 6):
            return True
        return False

    q = deque([(y, x) for y, x in q if is_white_bg(y, x)])
    for y, x in q:
        visited[y, x] = True

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy+1, cx), (cy-1, cx), (cy, cx+1), (cy, cx-1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if is_white_bg(ny, nx):
                    visited[ny, nx] = True
                    q.append((ny, nx))

    # Binary initial mask
    mask = (~visited).astype(np.uint8) * 255
    mask_im = Image.fromarray(mask, mode='L')

    # Edge anti-aliasing treatment:
    # 1px gentle blur to catch subpixel fringes smoothly
    blurred_mask = mask_im.filter(ImageFilter.GaussianBlur(0.8))
    alpha_arr = np.array(blurred_mask, dtype=np.float32) / 255.0

    # Defringe: where alpha < 1.0, eliminate white background leakage
    clean_rgb = np.copy(arr)
    alpha_safe = np.maximum(alpha_arr, 0.12)[:, :, None]
    unmixed = (arr - 255.0 * (1.0 - alpha_arr[:, :, None])) / alpha_safe
    unmixed = np.clip(unmixed, 0, 255)

    # Warm dark-brown tone for edge transition (#4a2a1c = [74, 42, 28])
    edge_zone = (alpha_arr > 0.05) & (alpha_arr < 0.85)
    outline_color = np.array([74.0, 42.0, 28.0])
    t = (1.0 - alpha_arr[edge_zone, None]) * 0.75
    unmixed[edge_zone] = unmixed[edge_zone] * (1.0 - t) + outline_color * t

    # Final crisp alpha threshold
    final_alpha = np.where(alpha_arr >= 0.20, 255, 0).astype(np.uint8)
    
    # Smooth the final alpha edge by 0.5px for official Maple AA look
    final_alpha_im = Image.fromarray(final_alpha, mode='L').filter(ImageFilter.GaussianBlur(0.4))
    
    rgba = np.dstack([unmixed.astype(np.uint8), np.array(final_alpha_im)])
    cutout = Image.fromarray(rgba, mode='RGBA')
    
    return cutout

def fit_to_canvas(cutout, target_w=356, target_h=248, target_building_h=238):
    bbox = cutout.getbbox()
    cropped = cutout.crop(bbox)
    cw, ch = cropped.size
    
    scale = target_building_h / float(ch)
    new_w = int(round(cw * scale))
    new_h = int(round(ch * scale))
    
    # If width exceeds target_w - 4, fit by width
    if new_w > (target_w - 6):
        scale = (target_w - 6) / float(cw)
        new_w = int(round(cw * scale))
        new_h = int(round(ch * scale))
    
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)
    
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    pos_x = (target_w - new_w) // 2
    pos_y = target_h - new_h - 2 # 2px margin from bottom
    
    canvas.paste(resized, (pos_x, pos_y), mask=resized)
    return canvas

def process_front_view():
    gen_file = r"C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/mushroom_lab_front_view_1790935051548.jpg"
    out_dir = r"c:\minho\메이플월드\docs\design\art\researchlab"
    os.makedirs(out_dir, exist_ok=True)
    
    cutout = extract_alpha_precise(gen_file)
    canvas = fit_to_canvas(cutout, 356, 248, target_building_h=238)
    
    # 1. Official Maple Clean version (User preferred: smooth AA, crisp 1px lines)
    clean_path = os.path.join(out_dir, "researchlab_front_clean.png")
    canvas.save(clean_path)
    print("Saved clean:", clean_path, canvas.size)
    
    # 2. dot1 version
    dot1_path = os.path.join(out_dir, "researchlab_front_dot1.png")
    p1 = pixelize(canvas, dot=1, colors=96, alpha_cut=80)
    p1.save(dot1_path)
    print("Saved dot1:", dot1_path, p1.size)
    
    # 3. dot2 version
    dot2_path = os.path.join(out_dir, "researchlab_front_dot2.png")
    p2 = pixelize(canvas, dot=2, colors=64, alpha_cut=80)
    p2.save(dot2_path)
    print("Saved dot2:", dot2_path, p2.size)

if __name__ == "__main__":
    process_front_view()
