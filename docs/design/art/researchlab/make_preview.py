import os
from PIL import Image, ImageDraw, ImageFont

def make_comparison_preview():
    ref_path = r'C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/ref_blacksmith.png'
    lab_raw = r'c:/minho/메이플월드/docs/design/art/researchlab/researchlab_raw.png'
    lab_dot2 = r'c:/minho/메이플월드/docs/design/art/researchlab/researchlab_dot2.png'
    tile_path = r'c:/minho/메이플월드/scratch/grass-remote-FullGrass.png'
    
    im_ref = Image.open(ref_path).convert('RGBA')
    im_lab = Image.open(lab_dot2).convert('RGBA')
    im_raw = Image.open(lab_raw).convert('RGBA')
    
    # 1. Background with grass tiles
    # Let's tile 64x64 or 100x100
    tile = Image.open(tile_path).convert('RGBA')
    tw, th = tile.size # usually 64 or 100
    
    # Canvas for side-by-side comparison:
    # Width: 356 + 40 + 356 + 40 = ~800, Height: 400
    sheet_w = 820
    sheet_h = 420
    
    # Grass background
    grass_bg = Image.new('RGBA', (sheet_w, sheet_h))
    for y in range(0, sheet_h, th):
        for x in range(0, sheet_w, tw):
            grass_bg.paste(tile, (x, y))
            
    # Checker background
    checker_bg = Image.new('RGBA', (sheet_w, sheet_h), (220, 220, 220, 255))
    cd = ImageDraw.Draw(checker_bg)
    cell = 20
    for y in range(0, sheet_h, cell):
        for x in range(0, sheet_w, cell):
            if (x // cell + y // cell) % 2:
                cd.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(255, 255, 255, 255))
                
    # Place items on grass
    # Left: Blacksmith (Existing), Right: Research Lab (New)
    ground_y = 360 # baseline for both
    
    # Blacksmith: height 248, baseline at y=248 -> top is ground_y - 248
    x_ref = 30
    y_ref = ground_y - 248
    grass_bg.paste(im_ref, (x_ref, y_ref), mask=im_ref)
    
    # Research Lab:
    x_lab = 430
    y_lab = ground_y - 248
    grass_bg.paste(im_lab, (x_lab, y_lab), mask=im_lab)
    
    # Add text labels
    draw = ImageDraw.Draw(grass_bg)
    # Simple label boxes
    draw.rectangle([x_ref + 60, y_ref - 30, x_ref + 296, y_ref - 5], fill=(30, 20, 15, 200))
    draw.text((x_ref + 75, y_ref - 26), "[기준] 대장간 (공식 RUID: 3cf6b9e9...)", fill=(255, 230, 180))
    
    draw.rectangle([x_lab + 60, y_lab - 30, x_lab + 296, y_lab - 5], fill=(20, 30, 45, 200))
    draw.text((x_lab + 75, y_lab - 26), "[신규] 연구소 (버섯 연금술 랩)", fill=(200, 240, 255))
    
    # Also place on checker
    checker_bg.paste(im_ref, (x_ref, y_ref), mask=im_ref)
    checker_bg.paste(im_lab, (x_lab, y_lab), mask=im_lab)
    draw_c = ImageDraw.Draw(checker_bg)
    draw_c.rectangle([x_ref + 60, y_ref - 30, x_ref + 296, y_ref - 5], fill=(30, 20, 15, 200))
    draw_c.text((x_ref + 75, y_ref - 26), "[기준] 대장간 (Blacksmith)", fill=(255, 230, 180))
    draw_c.rectangle([x_lab + 60, y_lab - 30, x_lab + 296, y_lab - 5], fill=(20, 30, 45, 200))
    draw_c.text((x_lab + 75, y_lab - 26), "[신규] 연구소 (Research Lab)", fill=(200, 240, 255))
    
    # Combine both into a vertical sheet (Total 820 x 860)
    final_sheet = Image.new('RGBA', (sheet_w, sheet_h * 2 + 20), (40, 40, 40, 255))
    final_sheet.paste(grass_bg, (0, 0))
    final_sheet.paste(checker_bg, (0, sheet_h + 20))
    
    out_dir = r'c:/minho/메이플월드/docs/design/art/researchlab'
    preview_path = os.path.join(out_dir, 'preview.png')
    final_sheet.save(preview_path)
    
    # Also save to artifact dir for instant view
    artifact_preview = r'C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/researchlab_preview.png'
    final_sheet.save(artifact_preview)
    print("Preview saved successfully:", preview_path)
    print("Artifact preview saved:", artifact_preview)

if __name__ == '__main__':
    make_comparison_preview()
