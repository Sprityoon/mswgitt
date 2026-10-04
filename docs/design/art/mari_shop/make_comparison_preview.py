import os
from PIL import Image, ImageDraw, ImageFont

def make_comparison_sheet():
    base_dir = r"d:\메이플월도\docs\design\art\mari_shop"
    lab_dir = r"d:\메이플월도\docs\design\art\researchlab"
    
    blacksmith_path = os.path.join(base_dir, "ref_blacksmith.png")
    lab_path = os.path.join(lab_dir, "researchlab_front_clean.png")
    shop_path = os.path.join(base_dir, "mari_shop_front_clean.png")
    tile_path = r"d:\메이플월도\tileimg\FullGrass.png"
    
    out_path = os.path.join(base_dir, "preview_mari_shop_comparison.png")
    
    im_blacksmith = Image.open(blacksmith_path).convert('RGBA')
    im_lab = Image.open(lab_path).convert('RGBA')
    im_shop = Image.open(shop_path).convert('RGBA')
    
    tile = Image.open(tile_path).convert('RGBA')
    tw, th = tile.size
    
    margin = 30
    w_item = 356
    h_item = 248
    num_items = 3
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
        ("1. [공식 기준] 대장간 (RUID: 3cf6b9...)", im_blacksmith, (30, 25, 20), (255, 220, 160)),
        ("2. [마을 건물 1호] 연구소 (Research Lab)", im_lab, (25, 20, 40), (210, 200, 245)),
        ("3. [마을 건물 2호 - 신규] 마리의 노점상 (Shop)", im_shop, (45, 20, 20), (255, 210, 210)),
    ]
    
    baseline_y = panel_h - 40
    
    # Try loading a basic font
    font = None
    try:
        font = ImageFont.truetype("malgun.ttf", 14)
        title_font = ImageFont.truetype("malgunbd.ttf", 16)
    except:
        pass
        
    for i, (label, img, box_bg, text_fg) in enumerate(items):
        pos_x = margin + i * (w_item + margin)
        pos_y = baseline_y - h_item
        
        # Paste onto grass & checker
        grass_panel.paste(img, (pos_x, pos_y), mask=img)
        checker_panel.paste(img, (pos_x, pos_y), mask=img)
        
        for panel, draw_obj in [(grass_panel, ImageDraw.Draw(grass_panel)), (checker_panel, ImageDraw.Draw(checker_panel))]:
            draw_obj.rectangle([pos_x + 10, pos_y - 32, pos_x + w_item - 10, pos_y - 6], fill=(*box_bg, 235))
            if font:
                draw_obj.text((pos_x + 20, pos_y - 28), label, fill=text_fg, font=font)
            else:
                draw_obj.text((pos_x + 20, pos_y - 28), label, fill=text_fg)
            # Outline bounding box
            draw_obj.rectangle([pos_x, pos_y, pos_x + w_item, pos_y + h_item], outline=(255, 255, 255, 70), width=1)
            
    header_h = 56
    final_h = header_h + panel_h * 2 + 20
    final_im = Image.new('RGB', (total_w, final_h), (24, 25, 28))
    fd = ImageDraw.Draw(final_im)
    
    title_text = "마을 버섯 건물 통일 프로젝트 — 대장간 vs 연구소 vs 마리의 노점상(상점) 실측 검증 시트"
    spec_text = "규격: 356 x 248 px | 하단 접지 2px | 권장 피벗: (0.5, 0.0) | 정면 2.5D 탑다운 뷰"
    if font:
        fd.text((margin, 12), title_text, fill=(255, 255, 255), font=title_font)
        fd.text((margin, 34), spec_text, fill=(180, 185, 195), font=font)
    else:
        fd.text((margin, 12), title_text, fill=(255, 255, 255))
        fd.text((margin, 34), spec_text, fill=(180, 185, 195))
        
    final_im.paste(grass_panel, (0, header_h))
    final_im.paste(checker_panel, (0, header_h + panel_h + 10))
    
    final_im.save(out_path)
    print(f"Generated comparison sheet: {out_path} ({total_w}x{final_h})")

if __name__ == "__main__":
    make_comparison_sheet()
