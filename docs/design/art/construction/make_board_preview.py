import os
from PIL import Image, ImageDraw, ImageFont

def make_cat_board_preview():
    art_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.abspath(os.path.join(art_dir, "..", "..", "..", ".."))
    
    board_path = os.path.join(art_dir, "board_notice_roof.png")
    board = Image.open(board_path).convert('RGBA')
    bw, bh = board.size
    
    tile_path = os.path.join(workspace_dir, "scratch", "grass-remote-FullGrass.png")
    if not os.path.exists(tile_path):
        tile_path = os.path.join(workspace_dir, "tileimg", "new grass", "14.png")
    tile = Image.open(tile_path).convert('RGBA')
    tw, th = tile.size
    
    w, h = 900, 500
    canvas = Image.new('RGBA', (w, h), (255, 255, 255, 255))
    
    # Left half: grass background
    grass = Image.new('RGBA', (450, h))
    for y in range(0, h, th):
        for x in range(0, 450, tw):
            grass.paste(tile, (x, y))
    canvas.paste(grass, (0, 0))
    
    # Right half: checkerboard background
    cd = ImageDraw.Draw(canvas)
    cell = 20
    for y in range(0, h, cell):
        for x in range(450, w, cell):
            if (x // cell + y // cell) % 2:
                cd.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(210, 215, 225, 255))
            else:
                cd.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(255, 255, 255, 255))
                
    cd.line([(450, 0), (450, h)], fill=(70, 70, 70, 255), width=3)
    
    # Paste board on left (grass)
    # Scale slightly if needed, or 1:1
    paste_y = h - bh - 40
    paste_x1 = 225 - bw // 2
    paste_x2 = 675 - bw // 2
    
    canvas.paste(board, (paste_x1, paste_y), mask=board)
    canvas.paste(board, (paste_x2, paste_y), mask=board)
    
    # Draw labels
    font_path = "C:/Windows/Fonts/malgun.ttf"
    try:
        f_title = ImageFont.truetype(font_path, 18)
    except:
        f_title = None
        
    td = ImageDraw.Draw(canvas)
    td.rectangle([20, 15, 320, 50], fill=(20, 20, 20, 220))
    td.text((30, 20), "🌿 [인게임 잔디] 고양이 게시판", fill=(130, 255, 170), font=f_title)
    
    td.rectangle([470, 15, 780, 50], fill=(20, 20, 20, 220))
    td.text((480, 20), "🏁 [투명도 검증] 외곽선 및 내부 틈", fill=(255, 230, 120), font=f_title)
    
    out_path = os.path.join(art_dir, "preview_board_cat.png")
    canvas.save(out_path)
    print("Saved preview to", out_path)

if __name__ == '__main__':
    make_cat_board_preview()
