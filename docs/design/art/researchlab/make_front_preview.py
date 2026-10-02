import os
from PIL import Image, ImageDraw, ImageFont

def make_front_comparison():
    ref_path = r'C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/ref_blacksmith.png'
    prev_lab = r'c:/minho/메이플월드/docs/design/art/researchlab/researchlab_raw.png'
    new_clean = r'c:/minho/메이플월드/docs/design/art/researchlab/researchlab_front_clean.png'
    tile_path = r'c:/minho/메이플월드/scratch/grass-remote-FullGrass.png'
    
    im_ref = Image.open(ref_path).convert('RGBA')
    im_prev = Image.open(prev_lab).convert('RGBA')
    im_new = Image.open(new_clean).convert('RGBA')
    
    tile = Image.open(tile_path).convert('RGBA')
    tw, th = tile.size
    
    margin = 30
    w_item = 356
    h_item = 248
    total_w = margin + (w_item + margin) * 3
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
        ("1. [공식 기준] 대장간 (정면 탑다운 뷰)", im_ref, (30, 25, 20), (255, 220, 160)),
        ("2. [신규 정면 뷰 - 추천] 연구소 (공식 원본 화질 마감)", im_new, (20, 40, 30), (180, 255, 220)),
        ("3. [이전 3/4 쿼터뷰] 연구소 (비교용 이전 시안)", im_prev, (35, 30, 45), (210, 200, 230)),
    ]
    
    baseline_y = panel_h - 40
    
    for i, (label, img, box_bg, text_fg) in enumerate(items):
        pos_x = margin + i * (w_item + margin)
        pos_y = baseline_y - h_item
        
        # Paste onto grass & checker
        grass_panel.paste(img, (pos_x, pos_y), mask=img)
        checker_panel.paste(img, (pos_x, pos_y), mask=img)
        
        for panel, draw_obj in [(grass_panel, ImageDraw.Draw(grass_panel)), (checker_panel, ImageDraw.Draw(checker_panel))]:
            draw_obj.rectangle([pos_x + 10, pos_y - 32, pos_x + w_item - 10, pos_y - 6], fill=(*box_bg, 230))
            draw_obj.text((pos_x + 20, pos_y - 28), label, fill=text_fg)
            draw_obj.rectangle([pos_x, pos_y, pos_x + w_item, pos_y + h_item], outline=(255, 255, 255, 60), width=1)
            
    header_h = 50
    final_h = header_h + panel_h * 2 + 20
    final_img = Image.new('RGBA', (total_w, final_h), (28, 30, 34, 255))
    
    hd = ImageDraw.Draw(final_img)
    hd.text((margin, 16), "마을 버섯 연구소(Research Lab) 구도 수정 검증 시트 — [대장간 기준 정면 탑다운 뷰 정합]", fill=(255, 255, 255))
    hd.text((total_w - 410, 16), "규격: 356 x 248 px | 하단 접지 정렬 | 공식 원본 화질", fill=(180, 195, 210))
    
    final_img.paste(grass_panel, (0, header_h))
    final_img.paste(checker_panel, (0, header_h + panel_h + 20))
    
    out_dir = r'c:/minho/메이플월드/docs/design/art/researchlab'
    out_path = os.path.join(out_dir, 'preview_front_comparison.png')
    final_img.save(out_path)
    
    # Save to artifacts directory as well
    artifact_preview = r'C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/researchlab_front_comparison.png'
    final_img.save(artifact_preview)
    
    # Also copy clean version directly to artifacts
    shutil_dest = r'C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/researchlab_front_clean.png'
    import shutil
    shutil.copyfile(new_clean, shutil_dest)
    
    print("Front comparison preview saved:", out_path)
    print("Artifact preview saved:", artifact_preview)

if __name__ == '__main__':
    make_front_comparison()
