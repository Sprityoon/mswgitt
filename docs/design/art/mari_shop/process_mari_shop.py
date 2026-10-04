import os
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont

# Add propkit path if available
propkit_path = r"d:\메이플월도\.agents\skills\image-to-pixel\scripts"
if os.path.exists(propkit_path):
    sys.path.insert(0, propkit_path)
    from propkit import pixelize
else:
    pixelize = None

def extract_alpha_clean(img_path):
    im = Image.open(img_path).convert('RGB')
    w, h = im.size
    arr = np.array(im, dtype=np.float32)

    diff = np.max(arr, axis=2) - np.min(arr, axis=2)
    is_white = (arr[:, :, 0] >= 242) & (arr[:, :, 1] >= 242) & (arr[:, :, 2] >= 242) & (diff <= 8)

    visited = np.zeros((h, w), dtype=bool)

    # 1. Outer flood fill
    q = deque()
    for x in range(w):
        if is_white[0, x]: q.append((0, x)); visited[0, x] = True
        if is_white[h-1, x]: q.append((h-1, x)); visited[h-1, x] = True
    for y in range(h):
        if is_white[y, 0]: q.append((y, 0)); visited[y, 0] = True
        if is_white[y, w-1]: q.append((y, w-1)); visited[y, w-1] = True

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy+1, cx), (cy-1, cx), (cy, cx+1), (cy, cx-1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if is_white[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    # 2. Internal white holes detection
    labels = np.zeros((h, w), dtype=np.int32)
    comp_id = 0
    internal_holes = []

    for y in range(h):
        for x in range(w):
            if is_white[y, x] and not visited[y, x] and labels[y, x] == 0:
                comp_id += 1
                cq = deque([(y, x)])
                labels[y, x] = comp_id
                pts = [(y, x)]
                while cq:
                    py, px = cq.popleft()
                    for ny, nx in ((py+1, px), (py-1, px), (py, px+1), (py, px-1)):
                        if 0 <= ny < h and 0 <= nx < w and is_white[ny, nx] and not visited[ny, nx] and labels[ny, nx] == 0:
                            labels[ny, nx] = comp_id
                            cq.append((ny, nx))
                            pts.append((ny, nx))
                
                pts = np.array(pts)
                colors = arr[pts[:, 0], pts[:, 1]]
                mean_c = colors.mean(axis=0)
                # If mean color is pure background white (>=243 on all channels)
                if mean_c[0] >= 242 and mean_c[1] >= 242 and mean_c[2] >= 242:
                    for py, px in pts:
                        visited[py, px] = True
                    internal_holes.append((comp_id, len(pts), (pts[:, 0].mean(), pts[:, 1].mean()), mean_c))

    print(f"Cleared {len(internal_holes)} internal white hole regions:")
    for cid, area, (cy, cx), mean_c in internal_holes:
        print(f"  Hole {cid:2d}: Area={area:4d} px, Pos=({cy:.1f}, {cx:.1f}), MeanRGB=[{mean_c[0]:.1f}, {mean_c[1]:.1f}, {mean_c[2]:.1f}]")

    # Object mask: non-background
    obj_mask = (~visited).astype(np.uint8) * 255
    mask_im = Image.fromarray(obj_mask, mode='L')

    # Anti-aliasing treatment (0.75px blur)
    blurred_mask = mask_im.filter(ImageFilter.GaussianBlur(0.75))
    alpha_arr = np.array(blurred_mask, dtype=np.float32) / 255.0

    # Defringe: remove white halo
    clean_rgb = np.copy(arr)
    alpha_safe = np.maximum(alpha_arr, 0.12)[:, :, None]
    unmixed = (arr - 255.0 * (1.0 - alpha_arr[:, :, None])) / alpha_safe
    unmixed = np.clip(unmixed, 0, 255)

    # Edge darkening towards warm dark brown (#4a2a1c = [74, 42, 28])
    edge_zone = (alpha_arr > 0.05) & (alpha_arr < 0.85)
    outline_color = np.array([74.0, 42.0, 28.0])
    t = (1.0 - alpha_arr[edge_zone, None]) * 0.75
    unmixed[edge_zone] = unmixed[edge_zone] * (1.0 - t) + outline_color * t

    # Final crisp alpha threshold
    final_alpha = np.where(alpha_arr >= 0.20, 255, 0).astype(np.uint8)
    final_alpha_im = Image.fromarray(final_alpha, mode='L').filter(ImageFilter.GaussianBlur(0.35))

    rgba = np.dstack([unmixed.astype(np.uint8), np.array(final_alpha_im)])
    cutout = Image.fromarray(rgba, mode='RGBA')
    return cutout

def fit_to_canvas(cutout, target_w=356, target_h=248, target_building_w=265):
    bbox = cutout.getbbox()
    cropped = cutout.crop(bbox)
    cw, ch = cropped.size

    # Fit by width 265px (matching Research Lab 265px footprint & roof cap height)
    scale = target_building_w / float(cw)
    new_w = int(round(cw * scale))
    new_h = int(round(ch * scale))

    if new_h > (target_h - 4):
        scale = (target_h - 4) / float(ch)
        new_w = int(round(cw * scale))
        new_h = int(round(ch * scale))

    resized = cropped.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    pos_x = (target_w - new_w) // 2
    pos_y = target_h - new_h - 2 # 2px margin from bottom

    canvas.paste(resized, (pos_x, pos_y), mask=resized)
    print(f"Fitted bounding box: {new_w}x{new_h} onto {target_w}x{target_h} at ({pos_x}, {pos_y})")
    return canvas

def main():
    base_dir = r"d:\메이플월도\docs\design\art\mari_shop"
    raw_path = os.path.join(base_dir, "mari_shop_raw.png")
    clean_path = os.path.join(base_dir, "mari_shop_front_clean.png")

    print("Step 1: Extracting alpha and clearing internal holes...")
    cutout = extract_alpha_clean(raw_path)

    print("Step 2: Fitting to 356x248 canvas (matching Blacksmith & Research Lab)...")
    fitted = fit_to_canvas(cutout, target_w=356, target_h=248, target_building_w=265)
    fitted.save(clean_path)
    print(f"Saved clean front sprite: {clean_path}")

    # Optional dot versions
    if pixelize:
        print("Step 3: Generating dot versions (dot=1, dot=2)...")
        dot1 = pixelize(fitted, dot=1)
        dot1_path = os.path.join(base_dir, "mari_shop_front_dot1.png")
        dot1.save(dot1_path)

        dot2 = pixelize(fitted, dot=2)
        dot2_path = os.path.join(base_dir, "mari_shop_front_dot2.png")
        dot2.save(dot2_path)
        print("Saved dot1 and dot2 sprites.")

if __name__ == "__main__":
    main()
