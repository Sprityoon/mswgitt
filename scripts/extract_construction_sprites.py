import os
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def extract_sprite(im_arr, box, bg_color, pad=8, dist_thresh=28, hole_min_size=20):
    """
    Extract a single sprite from the image array with clean alpha transparency.
    Uses outer flood fill and detects enclosed background holes.
    """
    x1, y1, x2, y2 = box
    h_orig, w_orig, _ = im_arr.shape
    
    # Apply padding
    px1 = max(0, x1 - pad)
    py1 = max(0, y1 - pad)
    px2 = min(w_orig, x2 + pad)
    py2 = min(h_orig, y2 + pad)
    
    crop = im_arr[py1:py2, px1:px2].copy()
    ch, cw, _ = crop.shape
    
    # Distance to bg_color
    bg = np.array(bg_color, dtype=np.float32)
    dist = np.linalg.norm(crop - bg, axis=2)
    is_bg_candidate = dist < dist_thresh
    
    # 1. Flood fill from borders to find definite outside background
    visited = np.zeros((ch, cw), dtype=bool)
    q = deque()
    for x in range(cw):
        if is_bg_candidate[0, x]: q.append((0, x)); visited[0, x] = True
        if is_bg_candidate[ch-1, x]: q.append((ch-1, x)); visited[ch-1, x] = True
    for y in range(ch):
        if is_bg_candidate[y, 0]: q.append((y, 0)); visited[y, 0] = True
        if is_bg_candidate[y, cw-1]: q.append((y, cw-1)); visited[y, cw-1] = True
        
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((-1,0), (1,0), (0,-1), (0,1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < ch and 0 <= nx < cw and not visited[ny, nx]:
                if is_bg_candidate[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))
                    
    # 2. Check enclosed regions (potential internal holes between legs, posts, etc.)
    # Any unvisited region that matches bg_candidate could be an enclosed hole
    for y in range(ch):
        for x in range(cw):
            if is_bg_candidate[y, x] and not visited[y, x]:
                # find component
                cq = deque([(y, x)])
                comp_visited = [(y, x)]
                visited[y, x] = True
                while cq:
                    py, px = cq.popleft()
                    for dy, dx in ((-1,0), (1,0), (0,-1), (0,1)):
                        ny, nx = py + dy, px + dx
                        if 0 <= ny < ch and 0 <= nx < cw and not visited[ny, nx] and is_bg_candidate[ny, nx]:
                            visited[ny, nx] = True
                            cq.append((ny, nx))
                            comp_visited.append((ny, nx))
                # Check if this hole is genuinely background color
                # (e.g. not a bright yellow or white graphic inside the sprite)
                hole_colors = [crop[hy, hx] for hy, hx in comp_visited]
                mean_dist = np.mean([np.linalg.norm(c - bg) for c in hole_colors])
                if mean_dist < dist_thresh * 0.9 and len(comp_visited) >= hole_min_size:
                    # Treat as transparent hole
                    pass
                else:
                    # Unmark as background (it's part of sprite)
                    for hy, hx in comp_visited:
                        visited[hy, hx] = False

    # Create Alpha Channel
    # visited == True -> transparent (0)
    # visited == False -> opaque (255)
    alpha = np.where(visited, 0, 255).astype(np.uint8)
    
    # 3. Soft defringing on semi-transparent transition
    # For pixels adjacent to transparent, if their color is close to bg, apply partial alpha
    for y in range(1, ch - 1):
        for x in range(1, cw - 1):
            if alpha[y, x] == 255:
                # check if neighbour is transparent
                has_trans_nbr = (alpha[y-1, x] == 0 or alpha[y+1, x] == 0 or 
                                 alpha[y, x-1] == 0 or alpha[y, x+1] == 0)
                if has_trans_nbr and dist[y, x] < dist_thresh * 1.6:
                    factor = (dist[y, x] - dist_thresh * 0.6) / (dist_thresh)
                    alpha[y, x] = int(np.clip(factor * 255, 0, 255))

    # Assemble RGBA Image
    rgba = np.dstack([crop.astype(np.uint8), alpha])
    img = Image.fromarray(rgba, 'RGBA')
    
    # Auto-crop transparent borders
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    return img

def main():
    out_dir = r"c:\minho\메이플월드\docs\design\art\construction"
    os.makedirs(out_dir, exist_ok=True)
    
    img1_path = r"C:\Users\윤민호\.gemini\antigravity-ide\brain\a11daeda-280a-4ab4-8ffe-732c585899b8\front_cute_construction_signs_1791279508963.jpg"
    img2_path = r"C:\Users\윤민호\.gemini\antigravity-ide\brain\a11daeda-280a-4ab4-8ffe-732c585899b8\front_warning_signs_set_1791279582905.jpg"
    
    im1 = np.array(Image.open(img1_path).convert('RGB'), dtype=np.float32)
    im2 = np.array(Image.open(img2_path).convert('RGB'), dtype=np.float32)
    
    bg1 = [253, 242, 219]
    bg2 = [254, 249, 224]
    
    sprites_info = [
        # Set 1
        ("board_notice_roof", im1, (69, 46, 414, 393), bg1, 28, 30),
        ("stand_slime_caution", im1, (455, 103, 608, 264), bg1, 28, 15),
        ("stand_slime_caution_sq", im1, (634, 105, 765, 261), bg1, 28, 15),
        ("barricade_stripe", im1, (825, 77, 1131, 268), bg1, 28, 25),
        ("traffic_cones_group", im1, (417, 356, 680, 550), bg1, 28, 15),
        ("concrete_barrier", im1, (670, 390, 840, 542), bg1, 28, 20),
        ("easel_chalkboard", im1, (882, 295, 1122, 568), bg1, 28, 25),
        ("signpost_direction", im1, (91, 482, 263, 838), bg1, 28, 20),
        ("banner_construction", im1, (309, 584, 718, 838), bg1, 28, 30),
        ("pile_materials", im1, (749, 612, 1138, 851), bg1, 28, 25),
        
        # Set 2
        ("sign_mushroom_triangle", im2, (69, 50, 330, 390), bg2, 26, 25),
        ("sign_tools_square", im2, (462, 61, 684, 394), bg2, 26, 25),
        ("barricade_cone_bar", im2, (761, 109, 1150, 268), bg2, 26, 25),
        ("barrel_safety_beacon", im2, (891, 304, 1026, 516), bg2, 26, 20),
        ("pole_hardhat_blueprint", im2, (71, 483, 297, 839), bg2, 26, 25),
        ("barricade_wood_lights", im2, (389, 520, 802, 839), bg2, 26, 35),
        ("sign_wood_ribbon", im2, (863, 528, 1155, 835), bg2, 26, 25),
    ]
    
    extracted_files = []
    for name, img_arr, box, bg_col, d_thresh, h_min in sprites_info:
        sprite = extract_sprite(img_arr, box, bg_col, pad=10, dist_thresh=d_thresh, hole_min_size=h_min)
        out_file = os.path.join(out_dir, f"{name}.png")
        sprite.save(out_file)
        w, h = sprite.size
        print(f"Extracted: {name}.png ({w}x{h})")
        extracted_files.append((name, out_file, w, h))
        
    print(f"\nTotal {len(extracted_files)} sprites extracted to {out_dir}")

if __name__ == "__main__":
    main()
