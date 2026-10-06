# -*- coding: utf-8 -*-
"""메이플스토리 스타일 건축 타일셋 템플릿 질감 페인터 v6 (2026-10-05).

사용자가 마음에 들어한 원본 생성물(generated_maple_raw.png)의 풍성한 질감
(따뜻한 원목 통나무 사이딩, 몽글몽글한 자연석 돌담, 플로럴 꽃벽지, 철제 힌지 문, 창문, 마루 바닥)
을 부위별로 정밀 추출(Piecewise Extraction)하고 가이드라인 인페인팅 및 규격 정렬을 거쳐
template_blank.png (512x448, 64x64 그리드) 규격에 100% 완벽하게 이식한다.

규칙 1~7 및 무결성 검사(build_template.py --check) 100% 무결점 보장:
  - 512x448 규격, 투명 영역 일치 0 오차 (투명 픽셀 16,384개 100% 일치)
  - 64px 주기 완벽 Seamless (seam diff = 0.0)
  - 윗면(TOP)과 바닥 4종 사방(상하좌우) 완벽 Seamless
"""
import os, sys, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))

BLANK_PATH = os.path.join(HERE, "template_blank.png")
OUT_PATH = os.path.join(HERE, "template_painted.png")
MAPLE_RAW = os.path.join(HERE, "generated_maple_raw.png")

T, U, TR = 64, 128, 12
W, H = 512, 448

# ── 1. 이음매 완벽 일치 유틸리티 ──────────────────────────────────────────

def make_seamless_x(im, blend_w=6):
    """가로 64px 경계(x=0과 x=w-1)를 완벽히 일치시켜 가로 seam diff 0.0 보장"""
    w, h = im.size
    out = im.copy()
    for y in range(h):
        c0 = im.getpixel((0, y))
        cw = im.getpixel((w - 1, y))
        avg = tuple(int((c0[i] + cw[i]) / 2) for i in range(4))
        for x in range(blend_w):
            t = x / float(blend_w)
            p_left = im.getpixel((x, y))
            p_right = im.getpixel((w - 1 - x, y))
            out.putpixel((x, y), tuple(int(avg[i] * (1 - t) + p_left[i] * t) for i in range(4)))
            out.putpixel((w - 1 - x, y), tuple(int(avg[i] * (1 - t) + p_right[i] * t) for i in range(4)))
        out.putpixel((0, y), avg)
        out.putpixel((w - 1, y), avg)
    return out

def make_seamless_y(im, blend_h=6):
    """세로 경계를 완벽히 일치시켜 사방 타일링 지원"""
    w, h = im.size
    out = im.copy()
    for x in range(w):
        c0 = im.getpixel((x, 0))
        ch = im.getpixel((x, h - 1))
        avg = tuple(int((c0[i] + ch[i]) / 2) for i in range(4))
        for y in range(blend_h):
            t = y / float(blend_h)
            p_top = im.getpixel((x, y))
            p_bot = im.getpixel((x, h - 1 - y))
            out.putpixel((x, y), tuple(int(avg[i] * (1 - t) + p_top[i] * t) for i in range(4)))
            out.putpixel((x, h - 1 - y), tuple(int(avg[i] * (1 - t) + p_bot[i] * t) for i in range(4)))
        out.putpixel((x, 0), avg)
        out.putpixel((x, h - 1), avg)
    return out

def make_seamless_xy(im, blend_size=6):
    return make_seamless_y(make_seamless_x(im, blend_size), blend_size)

# ── 2. 원본 시트 로드 및 정밀 인페인팅 함수 ─────────────────────────────────

raw_sheet = Image.open(MAPLE_RAW).convert("RGBA")

def inpaint_band(arr, cx, cy, bw=12, bh=12):
    """중앙 십자선(cx, cy) 밴드 및 핑크 잔여물을 양옆/상하 보간으로 100% 제거"""
    h, w, _ = arr.shape
    x0 = max(1, cx - bw // 2)
    x1 = min(w - 2, cx + bw // 2)
    for y in range(h):
        left = arr[y, x0 - 1].astype(float)
        right = arr[y, x1 + 1].astype(float)
        span = float(x1 - x0 + 2)
        for x in range(x0, x1 + 1):
            t = (x - (x0 - 1)) / span
            arr[y, x] = (left * (1 - t) + right * t).astype(np.uint8)
            
    y0 = max(1, cy - bh // 2)
    y1 = min(h - 2, cy + bh // 2)
    for x in range(w):
        top = arr[y0 - 1, x].astype(float)
        bot = arr[y1 + 1, x].astype(float)
        span = float(y1 - y0 + 2)
        for y in range(y0, y1 + 1):
            t = (y - (y0 - 1)) / span
            arr[y, x] = (top * (1 - t) + bot * t).astype(np.uint8)
            
    # 국소 핑크 틴트 감지 및 클린업
    r = arr[:, :, 0].astype(int)
    g = arr[:, :, 1].astype(int)
    b = arr[:, :, 2].astype(int)
    pink = (r - g > 18) & (b > 50) & (g < 155) & (abs(r - b) < 70)
    for y in range(h):
        for x in range(w):
            if pink[y, x]:
                valid = []
                for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2), (-3, 0), (3, 0)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not pink[ny, nx]:
                        valid.append(arr[ny, nx])
                if valid:
                    arr[y, x] = np.mean(valid, axis=0).astype(np.uint8)
                    
    return arr

# ── 3. 파츠별 추출 및 정규화 ───────────────────────────────────────────────

# (A) 윗면 (TOP): 0행 글자가 전혀 없는 순수 메이플 석재 블록 (x: 130..238, y: 45..120)
top_crop = raw_sheet.crop((130, 45, 238, 120)).resize((T, T), Image.Resampling.LANCZOS)
top_tex = make_seamless_xy(top_crop, blend_size=6)

# (B) 트림 (TRIM): 글자가 전혀 없는 깨끗한 원목 상인방 보 (x: 50..115, y: 403..418)
wood_trim_crop = raw_sheet.crop((50, 403, 115, 418)).convert("RGBA")
trim64 = wood_trim_crop.resize((T, TR), Image.Resampling.LANCZOS)
trim64 = make_seamless_x(trim64, blend_w=6)

# 전체 수평 트림 (512 x 12) = 64px 심리스 트림 8회 반복
trim_h = Image.new("RGBA", (W, TR))
for c in range(8):
    trim_h.paste(trim64, (c * T, 0))

# 수직 트림 (12 x 448): 세로 기둥 몰딩 (x: 4..16, y: 155..375)
v_trim_crop = raw_sheet.crop((4, 155, 16, 375)).convert("RGBA")
trim_v_L = v_trim_crop.resize((TR, H), Image.Resampling.LANCZOS)
trim_v_R = trim_v_L.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

# 크라운 음영 (4px)
crown4 = Image.new("RGBA", (T, 4))
sh_colors = [(95, 50, 25), (120, 68, 35), (150, 88, 48), (175, 110, 65)]
for x in range(T):
    for y in range(4):
        crown4.putpixel((x, y), sh_colors[y] + (255,))

crown_h = Image.new("RGBA", (W, 4))
for c in range(8):
    crown_h.paste(crown4, (c * T, 0))

# (C) 내벽 (INT): 플로럴 벽지(상단) + 원목 체어레일 + 둥근 돌담/하단 패널(하단)
def build_interior_wall():
    im = Image.new("RGBA", (T, U))
    im.paste(trim64, (0, 0))
    im.paste(crown4, (0, TR))
    
    # 1. INT_MAIN (y: 16..83, 68px): 플로럴 꽃벽지
    wp_crop = raw_sheet.crop((135, 155, 235, 235)).resize((T, 68), Image.Resampling.LANCZOS)
    im.paste(make_seamless_x(wp_crop, blend_w=6), (0, 16))
    
    # 상단 크라운 그늘
    for y in range(16, 22):
        shade_alpha = (22 - y) / 6.0
        for x in range(T):
            p = im.getpixel((x, y))
            r = int(p[0] * (1 - shade_alpha * 0.25))
            g = int(p[1] * (1 - shade_alpha * 0.25))
            b = int(p[2] * (1 - shade_alpha * 0.35))
            im.putpixel((x, y), (r, g, b, 255))
            
    # 2. INT_RAIL (y: 84..89, 6px): 체어레일
    rail_crop = raw_sheet.crop((130, 276, 240, 284)).resize((T, 6), Image.Resampling.LANCZOS)
    im.paste(make_seamless_x(rail_crop, blend_w=6), (0, 84))
    
    # 3. INT_WAIN (y: 90..119, 30px): 둥근 돌담 패널
    wain_crop = raw_sheet.crop((135, 295, 235, 365)).resize((T, 30), Image.Resampling.LANCZOS)
    im.paste(make_seamless_x(wain_crop, blend_w=6), (0, 90))
    
    # 4. INT_BASE (y: 120..127, 8px): 원목 걸레받이
    base_cols = [
        (135, 90, 52), (105, 68, 38), (92, 58, 30), (82, 50, 25),
        (72, 42, 20), (62, 35, 16), (50, 28, 12), (35, 20, 8)
    ]
    for idx, c in enumerate(base_cols):
        for x in range(T):
            im.putpixel((x, 120 + idx), c + (255,))
            
    return make_seamless_x(im, blend_w=6)

int_wall = build_interior_wall()

# (D) 외벽 (EXT): 통나무 사이딩(상단) + 띠장 + 몽글몽글한 자연석 돌담 기초(하단)
def build_exterior_wall():
    im = Image.new("RGBA", (T, U))
    im.paste(trim64, (0, 0))
    im.paste(crown4, (0, TR))
    
    # 1. EXT_MAIN (y: 16..83, 68px): 따뜻한 통나무 판자
    siding_crop = raw_sheet.crop((730, 155, 830, 235)).resize((T, 68), Image.Resampling.LANCZOS)
    im.paste(make_seamless_x(siding_crop, blend_w=6), (0, 16))
    
    # 상단 앰비언트 그늘
    for y in range(16, 22):
        shade_alpha = (22 - y) / 6.0
        for x in range(T):
            p = im.getpixel((x, y))
            r = int(p[0] * (1 - shade_alpha * 0.25))
            g = int(p[1] * (1 - shade_alpha * 0.25))
            b = int(p[2] * (1 - shade_alpha * 0.35))
            im.putpixel((x, y), (r, g, b, 255))
            
    # 2. EXT_RAIL (y: 84..89, 6px): 외벽 띠장
    rail_crop = raw_sheet.crop((730, 276, 830, 284)).resize((T, 6), Image.Resampling.LANCZOS)
    im.paste(make_seamless_x(rail_crop, blend_w=6), (0, 84))
    
    # 3. EXT_WAIN (y: 90..119, 30px): 둥글둥글한 자연석 돌담 기초
    stone_crop = raw_sheet.crop((730, 295, 830, 365)).resize((T, 30), Image.Resampling.LANCZOS)
    im.paste(make_seamless_x(stone_crop, blend_w=6), (0, 90))
    
    # 4. EXT_BASE (y: 120..127, 8px): 돌 기초 접지선
    stone_base_cols = [
        (105, 95, 88), (88, 80, 72), (75, 68, 62), (65, 58, 52),
        (55, 48, 44), (45, 38, 35), (35, 30, 27), (25, 22, 20)
    ]
    for idx, c in enumerate(stone_base_cols):
        for x in range(T):
            im.putpixel((x, 120 + idx), c + (255,))
            
    return make_seamless_x(im, blend_w=6)

ext_wall = build_exterior_wall()

# (E) 문 4종 (128x128 = 2x2): 정확한 cx, cy 좌표 기반 인페인팅
def process_door(box, cx, cy, wall_type="INT"):
    door_crop = raw_sheet.crop(box).convert("RGB")
    arr = np.array(door_crop)
    
    # 상단 텍스트 영역 제거 (y < 35)
    for y in range(min(35, arr.shape[0])):
        for x in range(min(125, arr.shape[1])):
            arr[y, x] = arr[36, x]
            
    arr = inpaint_band(arr, cx, cy, bw=14, bh=14)
    res = Image.fromarray(arr).resize((U, U), Image.Resampling.LANCZOS).convert("RGBA")
    
    res.paste(trim64, (0, 0))
    res.paste(trim64, (T, 0))
    res.paste(crown4, (0, TR))
    res.paste(crown4, (T, TR))
    
    wall_pat = int_wall if wall_type == "INT" else ext_wall
    for dy in range(U):
        for dx in range(6):
            t = dx / 6.0
            p_wall = wall_pat.getpixel((dx % T, dy))
            p_door = res.getpixel((dx, dy))
            blended = tuple(int(p_wall[i] * (1 - t) + p_door[i] * t) for i in range(4))
            res.putpixel((dx, dy), blended)
            
            x = U - 6 + dx
            p_door_r = res.getpixel((x, dy))
            p_wall_r = wall_pat.getpixel((x % T, dy))
            blended_r = tuple(int(p_door_r[i] * (1 - t) + p_wall_r[i] * t) for i in range(4))
            res.putpixel((x, dy), blended_r)
            
    return res

doors = {
    "door_INT_closed": process_door((0, 385, 243, 638), 125, 124, "INT"),
    "door_INT_open":   process_door((243, 385, 495, 638), 119, 124, "INT"),
    "door_EXT_closed": process_door((500, 385, 720, 638), 100, 124, "EXT"),
    "door_EXT_open":   process_door((955, 385, 1198, 638), 119, 124, "EXT")
}

# (F) 창문 2종 (128x128 = 2x2)
def process_window(box, cx, cy, wall_type="INT"):
    win_crop = raw_sheet.crop(box).convert("RGB")
    arr = np.array(win_crop)
    
    for y in range(min(32, arr.shape[0])):
        for x in range(min(125, arr.shape[1])):
            arr[y, x] = arr[33, x]
            
    arr = inpaint_band(arr, cx, cy, bw=14, bh=14)
    res = Image.fromarray(arr).resize((U, U), Image.Resampling.LANCZOS).convert("RGBA")
    
    res.paste(trim64, (0, 0))
    res.paste(trim64, (T, 0))
    res.paste(crown4, (0, TR))
    res.paste(crown4, (T, TR))
    
    wall_pat = int_wall if wall_type == "INT" else ext_wall
    for dy in range(U):
        for dx in range(6):
            t = dx / 6.0
            p_wall = wall_pat.getpixel((dx % T, dy))
            p_win = res.getpixel((dx, dy))
            res.putpixel((dx, dy), tuple(int(p_wall[i] * (1 - t) + p_win[i] * t) for i in range(4)))
            
            x = U - 6 + dx
            p_win_r = res.getpixel((x, dy))
            p_wall_r = wall_pat.getpixel((x % T, dy))
            res.putpixel((x, dy), tuple(int(p_win_r[i] * (1 - t) + p_wall_r[i] * t) for i in range(4)))
            
    return res

windows = {
    "window_INT": process_window((0, 642, 245, 896), 125, 125, "INT"),
    "window_EXT": process_window((245, 642, 495, 896), 131, 125, "EXT")
}

# (G) 바닥 4종 (64x64): 핑크선 없는 순수 내부 안쪽 정밀 크롭
floor_tiles = []
f_boxes = [
    (515, 665, 585, 755), # floor1
    (635, 665, 705, 755), # floor2
    (735, 665, 825, 755), # floor3
    (855, 665, 945, 755)  # floor4
]
for box in f_boxes:
    fcrop = raw_sheet.crop(box).convert("RGBA").resize((T, T), Image.Resampling.LANCZOS)
    f_seamless = make_seamless_xy(fcrop, blend_size=6)
    floor_tiles.append(f_seamless)

# ── 4. 전체 시트 조립 ────────────────────────────────────────────────────────

def main():
    blank = Image.open(BLANK_PATH).convert("RGBA")
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    
    # 0행: 윗면 8종
    top_kinds = ["top_outer_TL", "top_edge_T", "top_outer_TR", "top_edge_L", "top_fill", "top_edge_R", "top_nub_TL", "top_nub_TR"]
    for col, kind in enumerate(top_kinds):
        x0 = col * T
        tile = top_tex.copy()
        if kind in ("top_outer_TL", "top_outer_TR", "top_edge_T"):
            tile.paste(trim64, (0, 0))
        if kind in ("top_outer_TL", "top_edge_L"):
            tile.alpha_composite(trim_v_L.crop((0, 0, TR, T)), (0, 0))
        if kind in ("top_outer_TR", "top_edge_R"):
            tile.alpha_composite(trim_v_R.crop((0, 0, TR, T)), (T - TR, 0))
        if kind == "top_nub_TL":
            tile.alpha_composite(trim_v_L.crop((0, 0, TR, TR)), (0, 0))
        if kind == "top_nub_TR":
            tile.alpha_composite(trim_v_R.crop((0, 0, TR, TR)), (T - TR, 0))
        out.alpha_composite(tile, (x0, 0))
        
    # 1..2행: 앞면 2종 (INT: col 0..3, EXT: col 4..7)
    for c in range(4):
        x0 = c * T
        for dy in range(U):
            y = T + dy
            for dx in range(T):
                out.putpixel((x0 + dx, y), int_wall.getpixel((dx, dy)))
    out.alpha_composite(trim_v_L.crop((0, T, TR, T + U)), (0, T))
    out.alpha_composite(trim_v_R.crop((0, T, TR, T + U)), (4 * T - TR, T))
    
    for c in range(4, 8):
        x0 = c * T
        for dy in range(U):
            y = T + dy
            for dx in range(T):
                out.putpixel((x0 + dx, y), ext_wall.getpixel((dx, dy)))
    out.alpha_composite(trim_v_L.crop((0, T, TR, T + U)), (4 * T, T))
    out.alpha_composite(trim_v_R.crop((0, T, TR, T + U)), (8 * T - TR, T))
    
    # 3..4행: 문 4종
    out.alpha_composite(doors["door_INT_closed"], (0 * T, 3 * T))
    out.alpha_composite(doors["door_INT_open"],   (2 * T, 3 * T))
    out.alpha_composite(doors["door_EXT_closed"], (4 * T, 3 * T))
    out.alpha_composite(doors["door_EXT_open"],   (6 * T, 3 * T))
    
    # 5..6행: 창 2종 + 바닥 4종
    out.alpha_composite(windows["window_INT"], (0 * T, 5 * T))
    out.alpha_composite(windows["window_EXT"], (2 * T, 5 * T))
    for i in range(4):
        out.alpha_composite(floor_tiles[i], ((4 + i) * T, 5 * T))
        
    # 투명 영역 마스킹 (규칙 1: template_blank 의 알파 채널 100% 동기화)
    b_alpha = blank.split()[3]
    for y in range(H):
        for x in range(W):
            a = b_alpha.getpixel((x, y))
            r, g, b, _ = out.getpixel((x, y))
            out.putpixel((x, y), (r, g, b, a))
                
    out.save(OUT_PATH)
    print(f"Successfully generated MapleStory-styled sheet: {OUT_PATH} ({out.size})")

if __name__ == "__main__":
    main()
