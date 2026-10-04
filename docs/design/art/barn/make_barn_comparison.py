import os
from PIL import Image, ImageDraw, ImageFont

def make_barn_comparison_sheet():
    base_dir = r"d:\메이플월도\docs\design\art\barn"
    shop_dir = r"d:\메이플월도\docs\design\art\mari_shop"
    
    old_barn_path = r"d:\메이플월도\scratch\ref_b11_barn.png"
    new_barn_path = os.path.join(base_dir, "barn_front_clean.png")
    blacksmith_path = os.path.join(shop_dir, "ref_blacksmith.png")
    shop_path = os.path.join(shop_dir, "mari_shop_front_clean.png")
    tile_path = r"d:\메이플월도\tileimg\FullGrass.png"
    
    out_path = os.path.join(base_dir, "preview_barn_comparison.png")
    
    im_old_barn = Image.open(old_barn_path).convert('RGBA')
    im_new_barn = Image.open(new_barn_path).convert('RGBA')
    im_blacksmith = Image.open(blacksmith_path).convert('RGBA')
    im_shop = Image.open(shop_path).convert('RGBA')
    
    # Fit old barn to 356x248 for visual fair comparison
    ob_bbox = im_old_barn.getbbox()
    ob_cropped = im_old_barn.crop(ob_bbox)
    ob_scale = 238.0 / ob_cropped.size[1]
    ob_w = int(round(ob_cropped.size[0] * ob_scale))
    ob_h = int(round(ob_cropped.size[1] * ob_scale))
    if ob_w > 350:
        ob_scale = 350.0 / ob_cropped.size[0]
        ob_w = int(round(ob_cropped.size[0] * ob_scale))
        ob_h = int(round(ob_cropped.size[1] * ob_scale))
    ob_resized = ob_cropped.resize((ob_w, ob_h), Image.LANCZOS)
    im_old_fitted = Image.new("RGBA", (356, 248), (0, 0, 0, 0))
    im_old_fitted.paste(ob_resized, ((356 - ob_w) // 2, 248 - ob_h - 2), mask=ob_resized)
    
    tile = Image.open(tile_path).convert('RGBA')
    tw, th = tile.size
    
    margin = 25
    w_item = 356
    h_item = 248
    num_items = 4
    total_w = margin + (w_item + margin) * num_items
    panel_h = 360
    
    # 1. Grass Panel
    grass_panel = Image.new('RGBA', (total_w, panel_h))
    for y in range(0, panel_h, th):
        for x in range(0, total_w, tw):
            grass_panel.paste(tile, (x, y))
            
    # 2. Checker Panel
    checker_panel = Image.new('RGBA', (total_w, panel_h), (225, 225, 225, 255))
    cd = ImageDraw.Draw(checker_panel)
    c_size = 20
    for y in range(0, panel_h, c_size):
        for x in range(0, total_w, c_size):
            if (x // c_size + y // c_size) % 2:
                cd.rectangle([x, y, x + c_size - 1, y + c_size - 1], fill=(255, 255, 255, 255))
                
    items = [
        ("1. [이전 시안 - 쿼터뷰 왜곡] 헛간 (B11 후보)", im_old_fitted, (40, 25, 25), (255, 190, 190)),
        ("2. [신규 제작 - 정면 2.5D] 헛간지기 헛간", im_new_barn, (20, 45, 30), (180, 255, 210)),
        ("3. [마을 기준 건물] 대장간 (RUID: 3cf6b9...)", im_blacksmith, (30, 25, 20), (255, 220, 160)),
        ("4. [마을 상점] 마리의 의상·꾸미기 상점", im_shop, (35, 20, 35), (255, 205, 255)),
    ]
    
    baseline_y = panel_h - 40
    
    font = None
    try:
        font = ImageFont.truetype("malgun.ttf", 13)
        title_font = ImageFont.truetype("malgunbd.ttf", 16)
    except:
        pass
        
    for i, (label, img, box_bg, text_fg) in enumerate(items):
        pos_x = margin + i * (w_item + margin)
        pos_y = baseline_y - h_item
        
        grass_panel.paste(img, (pos_x, pos_y), mask=img)
        checker_panel.paste(img, (pos_x, pos_y), mask=img)
        
        for panel, draw_obj in [(grass_panel, ImageDraw.Draw(grass_panel)), (checker_panel, ImageDraw.Draw(checker_panel))]:
            draw_obj.rectangle([pos_x + 10, pos_y - 30, pos_x + w_item - 10, pos_y - 6], fill=(*box_bg, 235))
            if font:
                draw_obj.text((pos_x + 16, pos_y - 27), label, fill=text_fg, font=font)
            else:
                draw_obj.text((pos_x + 16, pos_y - 27), label, fill=text_fg)
            draw_obj.rectangle([pos_x, pos_y, pos_x + w_item, pos_y + h_item], outline=(255, 255, 255, 70), width=1)
            
    header_h = 56
    final_h = header_h + panel_h * 2 + 20
    final_im = Image.new('RGB', (total_w, final_h), (24, 25, 28))
    fd = ImageDraw.Draw(final_im)
    
    title_text = "마을 헛간 구도 및 디자인 리디자인 — 이전 쿼터뷰 vs 신규 정면 탑다운 헛간 실측 비교 시트"
    spec_text = "규격: 356 x 248 px | 하단 접지 2px | 권장 피벗: (0.5, 0.0) | 정면 2.5D 탑다운 RPG 뷰 | 버섯집 배제(정통 목조 농가 헛간)"
    if font:
        fd.text((margin, 12), title_text, fill=(255, 255, 255), font=title_font)
        fd.text((margin, 34), spec_text, fill=(180, 185, 195), font=font)
    else:
        fd.text((margin, 12), title_text, fill=(255, 255, 255))
        fd.text((margin, 34), spec_text, fill=(180, 185, 195))
        
    final_im.paste(grass_panel, (0, header_h))
    final_im.paste(checker_panel, (0, header_h + panel_h + 10))
    
    final_im.save(out_path)
    print(f"Generated barn comparison sheet: {out_path} ({total_w}x{final_h})")

if __name__ == "__main__":
    make_barn_comparison_sheet()
