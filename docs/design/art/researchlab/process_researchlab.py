import os
import sys
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

sys.path.insert(0, r"c:\minho\메이플월드\.agents\skills\image-to-pixel\scripts")
from propkit import pixelize, preview_sheet

def extract_alpha(img_path):
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
        # Pure or near pure white
        if r >= 242 and g >= 242 and b >= 242:
            return True
        if min(r, g, b) >= 235 and (max(r, g, b) - min(r, g, b) <= 6):
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

    # Binary mask
    mask = (~visited).astype(np.uint8) * 255
    mask_im = Image.fromarray(mask, mode='L')

    # Smooth the mask boundary slightly to reduce pixel staircasing on high-res
    # but keep sharp transition
    blurred_mask = mask_im.filter(ImageFilter.GaussianBlur(1.0))
    alpha_arr = np.array(blurred_mask, dtype=np.float32) / 255.0

    # Defringe: where alpha < 1.0 and near edges, remove white tint
    # If observed = alpha * C + (1 - alpha) * 255
    # Then C = (observed - 255 * (1 - alpha)) / alpha
    # For very low alpha, clamp
    clean_rgb = np.copy(arr)
    # We also clamp to prevent over-saturation
    alpha_safe = np.maximum(alpha_arr, 0.15)[:, :, None]
    unmixed = (arr - 255.0 * (1.0 - alpha_arr[:, :, None])) / alpha_safe
    unmixed = np.clip(unmixed, 0, 255)

    # For pixels near the outer boundary (alpha between 0.05 and 0.9), darken slightly towards dark brown outline
    edge_zone = (alpha_arr > 0.05) & (alpha_arr < 0.85)
    outline_color = np.array([74.0, 42.0, 28.0]) # #4a2a1c
    t = (1.0 - alpha_arr[edge_zone, None]) * 0.7
    unmixed[edge_zone] = unmixed[edge_zone] * (1.0 - t) + outline_color * t

    # Set final alpha (cut off very faint noise)
    final_alpha = np.where(alpha_arr >= 0.25, 255, 0).astype(np.uint8)
    
    rgba = np.dstack([unmixed.astype(np.uint8), final_alpha])
    cutout = Image.fromarray(rgba, mode='RGBA')
    
    return cutout

def fit_to_canvas(cutout, target_w=356, target_h=248, target_building_h=238):
    # Crop to opaque bounding box
    bbox = cutout.getbbox()
    cropped = cutout.crop(bbox)
    cw, ch = cropped.size
    
    # Scale to match target height
    scale = target_building_h / float(ch)
    new_w = int(round(cw * scale))
    new_h = int(round(ch * scale))
    
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)
    
    # Place on 356 x 248 canvas
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    # Center horizontally, place at bottom (margin 1-2px from bottom)
    pos_x = (target_w - new_w) // 2
    pos_y = target_h - new_h - 2 # 2px margin from bottom
    
    canvas.paste(resized, (pos_x, pos_y), mask=resized)
    return canvas

if __name__ == "__main__":
    gen_file = r"C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/mushroom_research_lab_1790934709978.jpg"
    cutout = extract_alpha(gen_file)
    canvas = fit_to_canvas(cutout, 356, 248, target_building_h=238)
    
    out_dir = r"c:\minho\메이플월드\docs\design\art\researchlab"
    os.makedirs(out_dir, exist_ok=True)
    raw_path = os.path.join(out_dir, "researchlab_raw.png")
    canvas.save(raw_path)
    print("Saved raw fit:", raw_path, canvas.size)
    
    # Apply pixelize
    dot2_path = os.path.join(out_dir, "researchlab_dot2.png")
    p2 = pixelize(canvas, dot=2, colors=64, alpha_cut=100)
    p2.save(dot2_path)
    print("Saved dot2:", dot2_path, p2.size)

    dot1_path = os.path.join(out_dir, "researchlab_dot1.png")
    p1 = pixelize(canvas, dot=1, colors=80, alpha_cut=100)
    p1.save(dot1_path)
    print("Saved dot1:", dot1_path, p1.size)
