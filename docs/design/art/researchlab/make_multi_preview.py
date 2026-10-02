import os
from PIL import Image, ImageDraw, ImageFont

def generate_multi_comparison():
    ref_path = r'C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/ref_blacksmith.png'
    raw_path = r'c:/minho/메이플월드/docs/design/art/researchlab/researchlab_raw.png'
    dot1_path = r'c:/minho/메이플월드/docs/design/art/researchlab/researchlab_dot1.png'
    dot2_path = r'c:/minho/메이플월드/docs/design/art/researchlab/researchlab_dot2.png'
    tile_path = r'c:/minho/메이플월드/scratch/grass-remote-FullGrass.png'
    
    im_ref = Image.open(ref_path).convert('RGBA')
    im_dot1 = Image.open(dot1_path).convert('RGBA')
    im_dot2 = Image.open(dot2_path).convert('RGBA')
    
    tile = Image.open(tile_path).convert('RGBA')
    tw, th = tile.size
    
    # 3 items comparison:
    # 1. Blacksmith (Official Reference) - 356x248
    # 2. Research Lab (Clean Maple Style, dot=1) - 356x248
    # 3. Research Lab (Pixelized Style, dot=2) - 356x248
    
    margin = 30
    w_item = 356
    h_item = 248
    total_w = margin + (w_item + margin) * 3
    panel_h = 360
    
    # Section 1: Grass Background
    grass_panel = Image.new('RGBA', (total_w, panel_h))
    for y in range(0, panel_h, th):
        for x in range(0, total_w, tw):
            grass_panel.paste(tile, (x, y))
            
    # Section 2: Checker Background
    checker_panel = Image.new('RGBA', (total_w, panel_h), (225, 225, 225, 255))
    cd = ImageDraw.Draw(checker_panel)
    c_size = 20
    for y in range(0, panel_h, c_size):
        for x in range(0, total_w, c_size):
            if (x // c_size + y // c_size) % 2:
                cd.rectangle([x, y, x + c_size - 1, y + c_size - 1], fill=(255, 255, 255, 255))
                
    items = [
        ("1. [공식 기준] 대장간", im_ref, (30, 25, 20), (255, 220, 160)),
        ("2. [신규 A안 - 추천] 연구소 (메이플 원본 화질 dot=1)", im_dot1, (20, 35, 45), (200, 245, 255)),
        ("3. [신규 B안] 연구소 (도트화 마감 dot=2)", im_dot2, (35, 20, 45), (245, 210, 255)),
    ]
    
    baseline_y = panel_h - 40
    
    for i, (label, img, box_bg, text_fg) in enumerate(items):
        pos_x = margin + i * (w_item + margin)
        pos_y = baseline_y - h_item
        
        # Paste onto grass
        grass_panel.paste(img, (pos_x, pos_y), mask=img)
        # Paste onto checker
        checker_panel.paste(img, (pos_x, pos_y), mask=img)
        
        # Draw labels
        for panel, draw_obj in [(grass_panel, ImageDraw.Draw(grass_panel)), (checker_panel, ImageDraw.Draw(checker_panel))]:
            draw_obj.rectangle([pos_x + 10, pos_y - 32, pos_x + w_item - 10, pos_y - 6], fill=(*box_bg, 220))
            draw_obj.text((pos_x + 20, pos_y - 28), label, fill=text_fg)
            
            # Draw canvas boundary guide (subtle dashed/dotted border)
            draw_obj.rectangle([pos_x, pos_y, pos_x + w_item, pos_y + h_item], outline=(255, 255, 255, 60), width=1)
            
    # Combine into final review sheet
    header_h = 50
    final_h = header_h + panel_h * 2 + 20
    final_img = Image.new('RGBA', (total_w, final_h), (30, 32, 36, 255))
    
    hd = ImageDraw.Draw(final_img)
    hd.text((margin, 16), "마을 버섯 건물 교체 프로젝트 — 1순위 연구소(Research Lab) 아트 정합성 검증 시트", fill=(255, 255, 255))
    hd.text((total_w - 380, 16), "규격: 356 x 248 px | 하단 접지선 정렬 | 쿼터뷰 탑다운", fill=(180, 190, 205))
    
    final_img.paste(grass_panel, (0, header_h))
    final_img.paste(checker_panel, (0, header_h + panel_h + 20))
    
    out_path = r'c:/minho/메이플월드/docs/design/art/researchlab/preview_multi.png'
    final_img.save(out_path)
    
    # Save to artifacts directory as well
    art_path = r'C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/researchlab_comparison_sheet.png'
    final_img.save(art_path)
    print("Multi preview saved successfully to:", out_path)
    print("Artifact preview saved to:", art_path)

if __name__ == '__main__':
    generate_multi_comparison()
