# -*- coding: utf-8 -*-
"""코어키퍼 벽 형태 + woodland_64 그림체 결합 타일셋 프로세서.
생성된 corekeeper_woodland_wall_4x4 이미지에서 부품을 분석 및 가공하여
64x64 규격의 16종 정식 연결 타일셋(4x4 시트, 개별 PNG, 스트립)을 완성한다.
"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
WOODLAND_DIR = HERE
RAW_IMG_PATH = r"C:\Users\mh566\.gemini\antigravity-ide\brain\0d2d8bf4-3eac-49f1-bdb3-2a530593ffee\corekeeper_woodland_wall_4x4_1791145747913.jpg"

T = 64
OUT_TILES = os.path.join(WOODLAND_DIR, "corekeeper_tiles")
os.makedirs(OUT_TILES, exist_ok=True)

# 1. 원본 이미지 로드 및 마젠타 디매팅
raw_im = Image.open(RAW_IMG_PATH).convert("RGB")
arr = np.array(raw_im).astype(np.float32)

r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
# 마젠타 검출 (R, B 높고 G 낮음)
magenta_score = (r + b) / 2.0 - g
is_bg = (magenta_score > 70) & (g < 120)

alpha = np.ones((1024, 1024), dtype=np.float32) * 255.0
alpha[is_bg] = 0.0

# Despill: 마젠타 틴트 억제
spill = np.clip(np.minimum(r - g, b - g), 0, 255)
mask_spill = (alpha > 0) & (spill > 20)
arr_clean = arr.copy()
arr_clean[:, :, 0][mask_spill] -= spill[mask_spill] * 0.7
arr_clean[:, :, 2][mask_spill] -= spill[mask_spill] * 0.7

rgba = np.dstack([np.clip(arr_clean, 0, 255), alpha]).astype(np.uint8)
full_rgba = Image.fromarray(rgba, "RGBA")

# 2. 16개 셀 크롭 (각 256x256)
xs = [(2, 254), (258, 510), (514, 766), (770, 1022)]
ys = [(2, 254), (258, 510), (514, 766), (770, 1022)]

raw_cells_64 = []
for row in range(4):
    for col in range(4):
        c = full_rgba.crop((xs[col][0], ys[row][0], xs[col][1], ys[row][1]))
        c64 = c.resize((T, T), Image.LANCZOS)
        raw_cells_64.append(c64)

# 3. 코어키퍼 핵심 부품 샘플링
# (1) 북쪽 수평 벽 (Row 2, Col 2 or Col 1): 완벽한 64px 수평 벽 (Top cap 14px + 목재 보 + 회벽 + 돌받침)
wall_h_src = raw_cells_64[10] # Row 2, Col 2 (0-indexed 10번)

# (2) 세로 기둥 (Row 1, Col 1 or Row 0, Col 0): 윗면 목재 기둥
wall_v_src = raw_cells_64[5]  # Row 1, Col 1 (5번)

# (3) 코너 접합부: Row 3, Col 0 등
corner_src = raw_cells_64[12]

# 4. 코어키퍼 16종 벽 오토타일 합성
# 마스크: N=1, E=2, S=4, W=8
# 코어키퍼 문법:
# - 가로벽(E or W): 짙은 Top Cap(y=0..14) + 높은 회벽 앞면(y=14..52) + 돌받침(y=52..64)
# - 세로벽(N or S): 폭 약 24~32px의 Top Cap 기둥이 상하로 관통 + 바닥 쪽 그림자
# - 모서리/교차: Top Cap이 직각으로 꺾이며 코너 기둥 결합

# (A) 기준 수평 앞면 띠 (Seamless 64px)
# wall_h_src의 좌우 끝(x=0, x=63)을 매끄럽게 연결
h_arr = np.array(wall_h_src).astype(np.float32)
col_start = h_arr[:, 0:1, :]
for i in range(8):
    x = 56 + i
    w = (i + 1) / 8.0
    h_arr[:, x:x+1, :] = h_arr[:, x:x+1, :] * (1.0 - w) + col_start * w
h_arr[:, 63:64, :] = col_start
HORIZ_WALL = Image.fromarray(np.clip(h_arr, 0, 255).astype(np.uint8), "RGBA")

# (B) 기준 세로 기둥 (Seamless 64px 관통)
v_arr = np.array(wall_v_src).astype(np.float32)
# 세로 상하 루프 (y=0과 y=63 일치)
row_start = v_arr[0:1, :, :]
for i in range(8):
    y = 56 + i
    w = (i + 1) / 8.0
    v_arr[y:y+1, :, :] = v_arr[y:y+1, :, :] * (1.0 - w) + row_start * w
v_arr[63:64, :, :] = row_start
VERT_WALL = Image.fromarray(np.clip(v_arr, 0, 255).astype(np.uint8), "RGBA")

# (C) 코너 기둥 및 마감 캡
POST_W = 16
POST = raw_cells_64[0].crop((24, 0, 40, 64))

def build_ck_wall(mask):
    n = bool(mask & 1)
    e = bool(mask & 2)
    s = bool(mask & 4)
    w = bool(mask & 8)
    
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    horiz = e or w
    
    if horiz:
        # 가로 벽이 있는 경우
        # 1. 북쪽 연결 시: 세로 Top Cap이 상단에서 들어옴
        if n:
            im.alpha_composite(VERT_WALL.crop((0, 0, T, 20)), (0, 0))
            
        # 2. 남쪽 연결 시: 세로 Top Cap이 남쪽으로 나감
        if s:
            im.alpha_composite(VERT_WALL.crop((0, 20, T, T)), (0, 20))
            
        # 3. 가로 앞면 배치: W면 x=0부터, E면 x=64까지
        x0 = 0 if w else 24
        x1 = T if e else 40
        im.alpha_composite(HORIZ_WALL.crop((x0, 0, x1, T)), (x0, 0))
        
        # 4. 코너 및 삼거리/십자 기둥 마감
        if not (e and w):
            if not w: # 동쪽으로만 감: 서쪽 끝 기둥
                im.alpha_composite(POST, (16, 0))
            if not e: # 서쪽으로만 감: 동쪽 끝 기둥
                im.alpha_composite(POST, (32, 0))
        else:
            if n or s:
                # ┴, ┬, ┼ 접합부
                im.alpha_composite(POST, (24, 0))
    else:
        # 가로 벽이 없는 경우 (순수 세로벽 또는 단독 기둥)
        if n and s:
            # 북-남 관통 세로벽
            im.alpha_composite(VERT_WALL, (0, 0))
        elif n and not s:
            # 북쪽에서 내려와서 끝남
            im.alpha_composite(VERT_WALL.crop((0, 0, T, 52)), (0, 0))
            im.alpha_composite(POST.crop((0, 36, POST_W, 64)), (24, 36))
        elif not n and s:
            # 남쪽으로만 이어짐
            im.alpha_composite(POST.crop((0, 0, POST_W, 20)), (24, 0))
            im.alpha_composite(VERT_WALL.crop((0, 14, T, T)), (0, 14))
        else:
            # 외딴 단독 기둥 (큐브 블록)
            im.alpha_composite(POST, (24, 0))
            
    return im

# 5. 16개 타일 생성 및 저장
ck_tiles = {}
for m in range(16):
    name = f"CK_Wall_{m:02d}"
    t_im = build_ck_wall(m)
    ck_tiles[name] = t_im
    t_im.save(os.path.join(OUT_TILES, f"{name}.png"))

# 6. 4x4 마젠타 배경 타일셋 시트 생성 (요청 규격)
grid_order = [f"CK_Wall_{m:02d}" for m in range(16)]

sheet_4x4_mag = Image.new("RGBA", (4 * T, 4 * T), (255, 0, 255, 255))
sheet_4x4_trans = Image.new("RGBA", (4 * T, 4 * T), (0, 0, 0, 0))

for idx, name in enumerate(grid_order):
    r_idx, c_idx = idx // 4, idx % 4
    sheet_4x4_mag.alpha_composite(ck_tiles[name], (c_idx * T, r_idx * T))
    sheet_4x4_trans.alpha_composite(ck_tiles[name], (c_idx * T, r_idx * T))

# 저장 (표준 256x256 및 4배 확대 1024x1024)
sheet_mag_path = os.path.join(WOODLAND_DIR, "wall_corekeeper_4x4_magenta.png")
sheet_4x4_mag.save(sheet_mag_path)
sheet_4x4_mag.resize((1024, 1024), Image.NEAREST).save(os.path.join(WOODLAND_DIR, "wall_corekeeper_4x4_magenta@4x.png"))

sheet_trans_path = os.path.join(WOODLAND_DIR, "wall_corekeeper_4x4_transparent.png")
sheet_4x4_trans.save(sheet_trans_path)
sheet_4x4_trans.resize((1024, 1024), Image.NEAREST).save(os.path.join(WOODLAND_DIR, "wall_corekeeper_4x4_transparent@4x.png"))

# 7. 64px 가로 스트립 (등록용)
strip = Image.new("RGBA", (16 * T, T), (0, 0, 0, 0))
for i, name in enumerate(grid_order):
    strip.alpha_composite(ck_tiles[name], (i * T, 0))
strip.save(os.path.join(WOODLAND_DIR, "wall_corekeeper_strip.png"))

print("Core Keeper wall tileset generation completed successfully!")
