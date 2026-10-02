import os
import sys
import cv2
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, r"c:\minho\메이플월드\.agents\skills\image-to-pixel\scripts")
from propkit import pixelize

def extract_alpha_with_internal_holes(img_path):
    bgr = cv2.imread(img_path)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    h, w, _ = rgb.shape

    # 1. Detect all pure white background pixels (R>=242, G>=242, B>=242)
    # Background white has almost no color saturation (max - min <= 8)
    diff = np.max(rgb, axis=2).astype(np.int16) - np.min(rgb, axis=2).astype(np.int16)
    is_pure_white = (rgb[:, :, 0] >= 240) & (rgb[:, :, 1] >= 240) & (rgb[:, :, 2] >= 240) & (diff <= 8)
    white_mask = is_pure_white.astype(np.uint8) * 255

    # 2. Connected components of white mask
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(white_mask, connectivity=8)

    # Label 1 is touching border (outer background)
    # Check all components: if its average RGB is pure white (> 250) and it is located in background or hollow regions
    bg_labels = set()
    border_labels = set()
    border_labels.update(labels[0, :])
    border_labels.update(labels[-1, :])
    border_labels.update(labels[:, 0])
    border_labels.update(labels[:, -1])
    border_labels.discard(0)
    bg_labels.update(border_labels)

    # In addition, identify internal holes (herb rack gaps, table leg gaps, potion stand gaps)
    for i in range(1, num_labels):
        if i in bg_labels:
            continue
        area = stats[i, cv2.CC_STAT_AREA]
        mean_val = cv2.mean(rgb, mask=(labels == i).astype(np.uint8))[:3]
        # Any component that has mean RGB >= 246 across all channels is background white hole!
        if mean_val[0] >= 244 and mean_val[1] >= 244 and mean_val[2] >= 242:
            cx, cy = centroids[i]
            print(f"Detected internal hole to clear: ID {i}, Area={area}, Pos=({cx:.1f}, {cy:.1f}), MeanRGB={mean_val}")
            bg_labels.add(i)

    # Create composite background mask
    full_bg_mask = np.isin(labels, list(bg_labels)).astype(np.uint8) * 255

    # Object mask is inverse of full_bg_mask
    obj_mask = 255 - full_bg_mask
    mask_im = Image.fromarray(obj_mask, mode='L')

    # AA edge smoothing & Defringe
    blurred_mask = mask_im.filter(ImageFilter.GaussianBlur(0.7))
    alpha_arr = np.array(blurred_mask, dtype=np.float32) / 255.0

    # Defringe: remove white halo
    clean_rgb = rgb.astype(np.float32)
    alpha_safe = np.maximum(alpha_arr, 0.12)[:, :, None]
    unmixed = (clean_rgb - 255.0 * (1.0 - alpha_arr[:, :, None])) / alpha_safe
    unmixed = np.clip(unmixed, 0, 255)

    # Edge darkening towards warm dark brown (#4a2a1c = [74, 42, 28])
    edge_zone = (alpha_arr > 0.05) & (alpha_arr < 0.85)
    outline_color = np.array([74.0, 42.0, 28.0])
    t = (1.0 - alpha_arr[edge_zone, None]) * 0.75
    unmixed[edge_zone] = unmixed[edge_zone] * (1.0 - t) + outline_color * t

    # Crisp threshold
    final_alpha = np.where(alpha_arr >= 0.20, 255, 0).astype(np.uint8)
    final_alpha_im = Image.fromarray(final_alpha, mode='L').filter(ImageFilter.GaussianBlur(0.35))

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
    
    if new_w > (target_w - 6):
        scale = (target_w - 6) / float(cw)
        new_w = int(round(cw * scale))
        new_h = int(round(ch * scale))
    
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)
    
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    pos_x = (target_w - new_w) // 2
    pos_y = target_h - new_h - 2
    
    canvas.paste(resized, (pos_x, pos_y), mask=resized)
    return canvas

def main():
    gen_file = r"C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/mushroom_lab_front_view_1790935051548.jpg"
    out_dir = r"c:\minho\메이플월드\docs\design\art\researchlab"
    
    cutout = extract_alpha_with_internal_holes(gen_file)
    canvas = fit_to_canvas(cutout, 356, 248, target_building_h=238)
    
    clean_path = os.path.join(out_dir, "researchlab_front_clean.png")
    canvas.save(clean_path)
    print("Saved clean with holes punched:", clean_path)

if __name__ == "__main__":
    main()
