import os
from PIL import Image, ImageDraw, ImageFont

def make_preview_sheet():
    art_dir = r"c:\minho\메이플월드\docs\design\art\construction"
    tile_path = r"c:\minho\메이플월드\scratch\grass-remote-FullGrass.png"
    if not os.path.exists(tile_path):
        tile_path = r"c:\minho\메이플월드\tileimg\new grass\14.png"
        
    tile = Image.open(tile_path).convert('RGBA')
    tw, th = tile.size
    
    font_path = "C:/Windows/Fonts/malgun.ttf"
    try:
        font_main = ImageFont.truetype(font_path, 18)
        font_title = ImageFont.truetype(font_path, 22)
    except:
        font_main = None
        font_title = None

    items = [
        ("board_notice_roof.png", "대형 지붕 게시판"),
        ("sign_mushroom_triangle.png", "주황버섯 삼각표지판"),
        ("barricade_wood_lights.png", "경광등 2단 바리케이드"),
        ("barricade_cone_bar.png", "라바콘 연결 차단봉"),
        ("stand_slime_caution.png", "슬라임 스탠드"),
        ("easel_chalkboard.png", "미니 칠판 스탠드"),
        ("barrel_safety_beacon.png", "경광등 드럼통"),
        ("banner_construction.png", "UNDER CONSTRUCTION 배너"),
        ("pile_materials.png", "방수포 자재더미"),
        ("sign_wood_ribbon.png", "리본 공사 팻말"),
    ]
    
    sheet_w = 1600
    sheet_h = 900
    
    canvas = Image.new('RGBA', (sheet_w, sheet_h), (240, 240, 240, 255))
    
    grass_half = Image.new('RGBA', (sheet_w, 450))
    for y in range(0, 450, th):
        for x in range(0, sheet_w, tw):
            grass_half.paste(tile, (x, y))
    canvas.paste(grass_half, (0, 0))
    
    cd = ImageDraw.Draw(canvas)
    cell = 24
    for y in range(450, sheet_h, cell):
        for x in range(0, sheet_w, cell):
            if (x // cell + y // cell) % 2:
                cd.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(215, 215, 220, 255))
            else:
                cd.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(255, 255, 255, 255))
                
    cd.line([(0, 450), (sheet_w, 450)], fill=(80, 80, 80, 255), width=3)
    
    row1_items = items[:5]
    row2_items = items[5:]
    
    def place_row(item_list, base_y):
        spacing = sheet_w // len(item_list)
        for i, (fn, label) in enumerate(item_list):
            fp = os.path.join(art_dir, fn)
            if not os.path.exists(fp): continue
            sp = Image.open(fp).convert('RGBA')
            
            sw, sh = sp.size
            scale = min(1.0, 180 / sh, 240 / sw)
            target_w = int(sw * scale)
            target_h = int(sh * scale)
            sp_res = sp.resize((target_w, target_h), Image.LANCZOS)
            
            cx = int((i + 0.5) * spacing)
            pos_x = cx - target_w // 2
            pos_y = base_y - target_h
            
            canvas.paste(sp_res, (pos_x, pos_y), mask=sp_res)
            
            lbl_draw = ImageDraw.Draw(canvas)
            lbl_w = 110
            lbl_draw.rectangle([cx - lbl_w, base_y + 8, cx + lbl_w, base_y + 36], fill=(30, 30, 30, 200))
            lbl_draw.text((cx - lbl_w + 12, base_y + 11), label, fill=(255, 240, 200), font=font_main)
            
    place_row(row1_items, 390)
    place_row(row2_items, 820)
    
    td = ImageDraw.Draw(canvas)
    td.rectangle([20, 15, 480, 55], fill=(20, 20, 20, 220))
    td.text((35, 22), "🌿 [인게임 지형 배경] 공사장 표지판 & 소품", fill=(120, 255, 160), font=font_title)
    
    td.rectangle([20, 465, 480, 505], fill=(20, 20, 20, 220))
    td.text((35, 472), "🏁 [체커보드 투명도 검증] 외곽선 및 관통 홀 점검", fill=(255, 230, 120), font=font_title)
    
    out_preview = os.path.join(art_dir, "preview_construction_sheet.png")
    canvas.save(out_preview)
    print(f"Saved preview sheet to {out_preview}")

if __name__ == "__main__":
    make_preview_sheet()
