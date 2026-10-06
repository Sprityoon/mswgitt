import os
from PIL import Image, ImageDraw, ImageFont

def make_full_preview():
    art_dir = r"c:\minho\메이플월드\docs\design\art\construction"
    tile_path = r"c:\minho\메이플월드\scratch\grass-remote-FullGrass.png"
    if not os.path.exists(tile_path):
        tile_path = r"c:\minho\메이플월드\tileimg\new grass\14.png"
        
    tile = Image.open(tile_path).convert('RGBA')
    tw, th = tile.size
    
    font_path = "C:/Windows/Fonts/malgun.ttf"
    try:
        font_main = ImageFont.truetype(font_path, 16)
        font_title = ImageFont.truetype(font_path, 22)
    except:
        font_main = None
        font_title = None

    row1_items = [
        ("board_notice_roof.png", "지붕형 공지 게시판"),
        ("sign_mushroom_triangle.png", "주황버섯 삼각표지판"),
        ("barricade_wood_lights.png", "경광등 바리케이드"),
        ("barricade_cone_bar.png", "라바콘 연결 차단봉"),
        ("easel_chalkboard.png", "미니 칠판 스탠드"),
        ("signpost_direction.png", "목재 방향 팻말"),
    ]
    
    row2_items = [
        ("stand_slime_caution.png", "슬라임 CAUTION 스탠드"),
        ("banner_construction.png", "UNDER CONSTRUCTION 배너"),
        ("pile_materials.png", "방수포 자재더미"),
        ("barrel_safety_beacon.png", "경광등 드럼통"),
        ("fence_safety_mesh.png", "안전 메쉬 펜스"),
        ("pole_hardhat_blueprint.png", "안전모·청사진 기둥"),
    ]
    
    sheet_w = 1800
    sheet_h = 920
    
    canvas = Image.new('RGBA', (sheet_w, sheet_h), (255, 255, 255, 255))
    
    # Grass background for upper half
    grass_half = Image.new('RGBA', (sheet_w, 460))
    for y in range(0, 460, th):
        for x in range(0, sheet_w, tw):
            grass_half.paste(tile, (x, y))
    canvas.paste(grass_half, (0, 0))
    
    # Checkerboard for lower half
    cd = ImageDraw.Draw(canvas)
    cell = 24
    for y in range(460, sheet_h, cell):
        for x in range(0, sheet_w, cell):
            if (x // cell + y // cell) % 2:
                cd.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(215, 215, 220, 255))
            else:
                cd.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(255, 255, 255, 255))
                
    cd.line([(0, 460), (sheet_w, 460)], fill=(80, 80, 80, 255), width=3)
    
    def place_row(item_list, base_y):
        spacing = sheet_w // len(item_list)
        for i, (fn, label) in enumerate(item_list):
            fp = os.path.join(art_dir, fn)
            if not os.path.exists(fp): continue
            sp = Image.open(fp).convert('RGBA')
            
            sw, sh = sp.size
            scale = min(1.0, 190 / sh, 250 / sw)
            target_w = int(sw * scale)
            target_h = int(sh * scale)
            sp_res = sp.resize((target_w, target_h), Image.LANCZOS)
            
            cx = int((i + 0.5) * spacing)
            pos_x = cx - target_w // 2
            pos_y = base_y - target_h
            
            canvas.paste(sp_res, (pos_x, pos_y), mask=sp_res)
            
            lbl_draw = ImageDraw.Draw(canvas)
            lbl_w = 95
            lbl_draw.rectangle([cx - lbl_w, base_y + 8, cx + lbl_w, base_y + 36], fill=(30, 30, 30, 210))
            lbl_draw.text((cx - lbl_w + 10, base_y + 11), label, fill=(255, 240, 200), font=font_main)
            
    # Row 1 on Grass (base_y = 400)
    place_row(row1_items, 400)
    
    # Row 2 on Checker (base_y = 840)
    place_row(row2_items, 840)
    
    td = ImageDraw.Draw(canvas)
    td.rectangle([20, 15, 520, 55], fill=(20, 20, 20, 220))
    td.text((35, 22), "🌿 [마젠타 크로마키] 인게임 지형 배치 검증", fill=(120, 255, 160), font=font_title)
    
    td.rectangle([20, 475, 520, 515], fill=(20, 20, 20, 220))
    td.text((35, 482), "🏁 [체커보드] 투명도 100% 무결점 관통 홀 점검", fill=(255, 230, 120), font=font_title)
    
    out_preview = os.path.join(art_dir, "preview_construction_sheet.png")
    canvas.save(out_preview)
    print(f"Saved perfected preview sheet to {out_preview}")

if __name__ == "__main__":
    make_full_preview()
