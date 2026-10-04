import os
import math
import colorsys
from PIL import Image, ImageDraw, ImageFilter

def create_fishing_board():
    base = Image.open('게시판.png').convert('RGBA')
    w, h = base.size
    board = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    base_pixels = base.load()
    board_pixels = board.load()

    # 1. Base Cap Color Transformation: Red Mushroom -> Deep Blue Ocean Mushroom
    # Yellow Dots -> Aqua/Mint Water Droplets with soft glow
    for y in range(h):
        for x in range(w):
            r, g, b, a = base_pixels[x, y]
            if a == 0:
                continue
            
            rf, gf, bf = r / 255.0, g / 255.0, b / 255.0
            hue, sat, val = colorsys.rgb_to_hsv(rf, gf, bf)
            
            # Cap region (y < 108)
            if y < 108:
                # Red cap body
                if (hue > 0.92 or hue < 0.08) and sat > 0.35 and val > 0.15:
                    new_h = 0.585 # Deep Cobalt / Cyan Blue
                    new_s = min(1.0, sat * 0.96)
                    new_v = val * 0.95
                    nr, ng, nb = colorsys.hsv_to_rgb(new_h, new_s, new_v)
                    board_pixels[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
                    continue
                # Yellow spots -> Aqua mint / pearl white
                elif 0.08 <= hue <= 0.22 and sat > 0.35 and val > 0.55:
                    new_h = 0.50 # Mint Aqua
                    new_s = 0.32
                    new_v = min(1.0, val * 1.05)
                    nr, ng, nb = colorsys.hsv_to_rgb(new_h, new_s, new_v)
                    board_pixels[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
                    continue

            board_pixels[x, y] = (r, g, b, a)

    # 2. Clean the parchment interior so we can draw a pristine Fishing Rank Notice
    # Paper area: X [55, 134], Y [120, 168]
    draw = ImageDraw.Draw(board)
    
    # Paper background clean-up: gentle warm parchment tone (#f0e8d6 to #e5dac2)
    for py in range(120, 168):
        grad_t = (py - 120) / 48.0
        bg_r = int(242 - grad_t * 12)
        bg_g = int(234 - grad_t * 14)
        bg_b = int(216 - grad_t * 18)
        for px in range(56, 134):
            # check distance to paper edge for soft blending
            orig_r, orig_g, orig_b, orig_a = board_pixels[px, py]
            if orig_a > 220:
                # blend with slight edge shadow
                shadow = 1.0
                if px < 60 or px > 130 or py < 123 or py > 165:
                    shadow = 0.92
                board_pixels[px, py] = (int(bg_r * shadow), int(bg_g * shadow), int(bg_b * shadow), orig_a)

    # 3. Draw on Parchment: Fishing Rank Content
    # (a) Top Header: Cute Fish Silhouette with Golden Crown / Star
    # Fish Center: (95, 132)
    fish_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fish_layer)
    
    # Fish Body: Oval at (86, 126) to (106, 137)
    fish_color = (68, 115, 158, 240) # Slate Blue Ink
    fish_shade = (42, 75, 108, 255)
    fdraw.ellipse([85, 127, 105, 137], fill=fish_color, outline=fish_shade, width=1)
    # Fish Tail: Polygon
    fdraw.polygon([(104, 132), (111, 127), (109, 132), (111, 137)], fill=fish_color, outline=fish_shade)
    # Fish Eye: Small dot
    fdraw.ellipse([88, 130, 90, 132], fill=(255, 255, 255, 255))
    fdraw.point((89, 131), fill=(30, 45, 60, 255))
    # Fish Fin:
    fdraw.polygon([(94, 133), (92, 137), (96, 135)], fill=fish_shade)
    
    # Tiny Golden Crown above fish: (93, 122) to (99, 126)
    crown_gold = (235, 185, 45, 255)
    crown_dark = (160, 110, 20, 255)
    fdraw.polygon([(91, 126), (91, 122), (93, 124), (95, 121), (97, 124), (99, 122), (99, 126)], fill=crown_gold, outline=crown_dark)

    # (b) Fishing Hook & Line next to fish
    hook_color = (130, 140, 150, 240)
    # Line
    fdraw.line([(80, 122), (80, 133)], fill=hook_color, width=1)
    fdraw.arc([77, 131, 83, 137], start=0, end=180, fill=hook_color, width=1)
    fdraw.line([(77, 134), (77, 132)], fill=hook_color, width=1)

    # (c) Ranking Lines (1st, 2nd, 3rd) on Parchment:
    # Stylized ranking chart entries
    ink_color = (75, 55, 42, 220) # Sepia Ink
    ink_light = (110, 85, 65, 180)
    
    # Rank 1:
    fdraw.rectangle([64, 143, 67, 145], fill=(210, 160, 40, 255)) # Gold 1
    fdraw.line([(72, 144), (105, 144)], fill=ink_color, width=1)
    fdraw.line([(114, 144), (126, 144)], fill=ink_light, width=1)
    
    # Rank 2:
    fdraw.rectangle([64, 150, 67, 152], fill=(160, 170, 180, 255)) # Silver 2
    fdraw.line([(72, 151), (100, 151)], fill=ink_color, width=1)
    fdraw.line([(114, 151), (123, 151)], fill=ink_light, width=1)
    
    # Rank 3:
    fdraw.rectangle([64, 157, 67, 159], fill=(185, 120, 70, 255)) # Bronze 3
    fdraw.line([(72, 158), (95, 158)], fill=ink_color, width=1)
    fdraw.line([(114, 158), (121, 158)], fill=ink_light, width=1)

    # Water wave motif at bottom of parchment
    wave_color = (120, 160, 190, 160)
    for wx in range(65, 125, 6):
        fdraw.arc([wx, 163, wx + 5, 166], start=0, end=180, fill=wave_color, width=1)

    # Composite paper markings
    board.alpha_composite(fish_layer)

    # 4. Roof Decoration: Classic Wooden Fish Weather-Sign & Red/White Float
    # Top ridge of the mushroom cap is at Y: 60.
    decor_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ddraw = ImageDraw.Draw(decor_layer)

    # (a) Cute Wooden Fish Sign on the roof: Center (95, 40)
    wood_base = (185, 125, 65, 255)
    wood_shadow = (115, 70, 30, 255)
    wood_light = (225, 165, 100, 255)
    outline = (60, 35, 15, 255)

    # Wooden/Metal mount socket firmly anchored into roof ridge (Y: 58~63)
    ddraw.rounded_rectangle([90, 58, 101, 63], radius=2, fill=(100, 70, 45, 255), outline=outline)
    ddraw.point((93, 60), fill=(200, 180, 140, 255))
    ddraw.point((98, 60), fill=(200, 180, 140, 255))

    # Support rod connecting socket to fish (Y: 44 to 58)
    ddraw.line([(95, 45), (95, 59)], fill=(80, 80, 85, 255), width=2)
    ddraw.line([(96, 45), (96, 59)], fill=(145, 145, 150, 255), width=1)

    # Wooden Fish Silhouette: X: [78, 117], Y: [30, 48]
    # Dorsal fin
    ddraw.polygon([(92, 34), (96, 30), (101, 34)], fill=wood_base, outline=outline)
    ddraw.polygon([(93, 34), (96, 31), (100, 34)], fill=wood_light)

    # Fish Body: Oval at [80, 34, 108, 47]
    ddraw.ellipse([80, 34, 108, 47], fill=wood_base, outline=outline, width=2)
    # Top highlight
    ddraw.arc([82, 35, 106, 46], start=190, end=350, fill=wood_light, width=1)
    # Bottom shade
    ddraw.arc([82, 35, 106, 46], start=10, end=170, fill=wood_shadow, width=1)
    
    # Fish Tail: Polygon
    ddraw.polygon([(106, 40), (117, 32), (113, 40), (117, 48)], fill=wood_base, outline=outline)
    ddraw.polygon([(107, 40), (115, 34), (112, 40), (115, 46)], fill=wood_base)
    ddraw.line([(108, 38), (114, 34)], fill=wood_light, width=1)
    ddraw.line([(108, 42), (114, 46)], fill=wood_shadow, width=1)

    # Fish Eye & Smile:
    ddraw.ellipse([84, 38, 88, 42], fill=(255, 255, 255, 255), outline=outline)
    ddraw.point((85, 40), fill=outline)
    # Carved Gill line
    ddraw.arc([89, 36, 95, 45], start=280, end=80, fill=outline, width=1)

    # (b) Fishing Bobber (낚시 찌) hanging from left roof eave tip (X: 23, Y: 101)
    float_string = (200, 200, 205, 220)
    ddraw.line([(23, 101), (23, 115)], fill=float_string, width=1)
    
    # Oval Bobber at (18, 115) to (28, 128)
    # Top half: Bright Maple Red
    # Bottom half: Clean White
    ddraw.ellipse([18, 115, 28, 128], fill=(250, 250, 250, 255), outline=outline, width=1)
    ddraw.chord([18, 115, 28, 128], start=180, end=360, fill=(235, 45, 35, 255), outline=outline, width=1)
    # Central band
    ddraw.line([(18, 121), (28, 121)], fill=outline, width=1)
    # Little stick tip
    ddraw.line([(23, 112), (23, 116)], fill=(40, 40, 40, 255), width=1)
    ddraw.line([(23, 128), (23, 131)], fill=(40, 40, 40, 255), width=1)

    # (c) Small Starfish / Shell hanging from rope knot at pillar (Y: 195~210)
    star_gold = (245, 195, 65, 255)
    star_shadow = (175, 120, 30, 255)
    ddraw.line([(98, 202), (98, 209)], fill=(120, 95, 65, 255), width=1) # String
    # Tiny Shell / Starfish Charm
    ddraw.ellipse([94, 209, 102, 217], fill=star_gold, outline=outline, width=1)
    ddraw.arc([95, 210, 101, 216], start=200, end=340, fill=(255, 240, 180, 255), width=1)
    ddraw.arc([95, 210, 101, 216], start=20, end=160, fill=star_shadow, width=1)

    board.alpha_composite(decor_layer)

    return board

if __name__ == '__main__':
    out_dir = 'docs/design/art/fishing_board'
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs('scratch', exist_ok=True)

    img = create_fishing_board()
    
    # Save deliverables
    dest_path1 = os.path.join(out_dir, 'fishing_board.png')
    dest_path2 = '낚시터_게시판.png'
    preview_path = os.path.join(out_dir, 'preview.png')
    
    img.save(dest_path1)
    img.save(dest_path2)
    print(f'Saved: {dest_path1}')
    print(f'Saved: {dest_path2}')

    # Create Comparison Preview:
    # Original Bulletin Board vs New Fishing Board side-by-side on checker / game background
    orig = Image.open('게시판.png').convert('RGBA')
    comp_w = 192 * 2 + 60
    comp_h = 280
    comp = Image.new('RGBA', (comp_w, comp_h), (240, 235, 225, 255))
    
    # Draw background cards
    cdraw = ImageDraw.Draw(comp)
    cdraw.rectangle([15, 15, 205, 265], fill=(255, 255, 255, 255), outline=(200, 190, 180, 255), width=1)
    cdraw.rectangle([235, 15, 425, 265], fill=(235, 245, 255, 255), outline=(170, 200, 230, 255), width=1)
    
    comp.paste(orig, (15, 15), orig)
    comp.paste(img, (235, 15), img)
    
    comp.save(preview_path)
    comp.save('scratch/boards_comparison.png')
    print(f'Saved comparison preview: {preview_path}')
