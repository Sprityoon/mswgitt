# -*- coding: utf-8 -*-
"""코어키퍼(Core Keeper) 스타일 벽 시스템 + woodland_64 그림체 결합 타일셋.
코어키퍼의 핵심 구조:
1. 북쪽 벽(Back Wall): 상단 짙은 Top Cap + 높은 앞면(목재 보 + 회벽 + 돌받침). 벽걸이 장식 가능.
2. 남쪽 벽(Front Wall): 방 내부 시야를 가리지 않기 위해 Top Cap(윗면 14px)만 노출! 앞면은 남쪽 바깥으로만 노출.
3. 좌우 세로 벽(Side Wall): 앞면 없이 '위에서 본 Top Cap 단면'이 상하로 관통 + 바닥 쪽 그림자(Shadow).
4. 모서리 코너: Top Cap이 직각으로 꺾이며 방의 완벽한 박스 입체감 형성.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
WOODLAND_DIR = HERE
REPO = os.path.abspath(os.path.join(WOODLAND_DIR, "..", "..", "..", "..", ".."))

T = 64
SRC = Image.open(os.path.join(WOODLAND_DIR, "tileset_64.png")).convert("RGBA")

def cell(r, c):
    return SRC.crop(((c - 1) * T, (r - 1) * T, c * T, r * T))

W2 = cell(2, 2)
W3 = cell(2, 3)

# ── 1. 부품 라이브러리 (woodland_64 고유 화풍) ──────────────────────────────
# (1) 앞면 구성 (목재 윗보, 크림색 회벽, 연베이지 돌받침)
beam_slice = W2.crop((16, 6, 48, 16))          # 32 x 10 목재 보
plaster_slice = W2.crop((16, 26, 48, 50))      # 32 x 24 회벽
stone_slice = W2.crop((16, 50, 48, 64))        # 32 x 14 돌받침

# (2) Top Cap (벽 윗면 - 코어키퍼의 시그니처: 어둡고 단단한 상단 마감)
# woodland_64의 목재 텍스처를 짙은 밤색/먹색 톤으로 변환한 윗면 캡 (높이 16px)
top_cap_base = W2.crop((16, 6, 48, 22)).resize((T, 16), Image.NEAREST)
tc_arr = np.array(top_cap_base).astype(np.float32)
# 약간 어둡고 깊이감 있는 상단 목재 톤 (밝기 0.7배, 외곽선 강조)
tc_arr[:, :, :3] *= 0.72
tc_arr[0, :, :3] = [35, 20, 15]    # 맨 윗줄 진한 테두리
tc_arr[1, :, :3] = [65, 40, 25]    # 윗면 하이라이트
tc_arr[15, :, :3] = [30, 15, 10]   # 아랫변 음영
# 철제 못 (x=12, x=52)
for nx in (12, 52):
    tc_arr[6:9, nx-1:nx+2, :3] = [45, 45, 50]
    tc_arr[7, nx, :3] = [80, 80, 85]
TOP_CAP_H = Image.fromarray(np.clip(tc_arr, 0, 255).astype(np.uint8), "RGBA")

# 세로용 Top Cap (폭 32px, 높이 64px 무한 반복)
tc_v = Image.new("RGBA", (32, T))
for y in range(0, T, 16):
    tc_v.paste(TOP_CAP_H.crop((16, 0, 48, 16)), (0, y))
# 좌우 진한 테두리
tc_v_arr = np.array(tc_v)
tc_v_arr[:, 0, :3] = [30, 15, 10]
tc_v_arr[:, 1, :3] = [55, 30, 20]
tc_v_arr[:, 30, :3] = [55, 30, 20]
tc_v_arr[:, 31, :3] = [30, 15, 10]
TOP_CAP_V = Image.fromarray(tc_v_arr, "RGBA")

# ── 2. 코어키퍼 스타일 벽 타일 제작 ──────────────────────────────────────────

# [1] 북쪽 벽 (Back Wall / North Wall) - 방의 북쪽 뒷벽
# 상단 14px Top Cap + 50px 높은 앞면 (목재 보 + 회벽 + 돌받침)
def make_north_wall():
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    # 윗면 Top Cap (y=0..14)
    im.alpha_composite(TOP_CAP_H.crop((0, 0, T, 14)), (0, 0))
    # 목재 보 (y=14..24)
    beam_full = Image.new("RGBA", (T, 10))
    beam_full.paste(beam_slice, (0, 0))
    beam_full.paste(beam_slice, (32, 0))
    im.alpha_composite(beam_full, (0, 14))
    # 크림색 회벽 (y=24..50)
    plaster_full = Image.new("RGBA", (T, 26))
    plaster_full.paste(plaster_slice.crop((0, 0, 32, 26)), (0, 0))
    plaster_full.paste(plaster_slice.crop((0, 0, 32, 26)), (32, 0))
    im.alpha_composite(plaster_full, (0, 24))
    # 연베이지 돌받침 (y=50..64)
    stone_full = Image.new("RGBA", (T, 14))
    stone_full.paste(stone_slice, (0, 0))
    stone_full.paste(stone_slice, (32, 0))
    im.alpha_composite(stone_full, (0, 50))
    return im

# [2] 남쪽 벽 (Front Wall / South Wall) - 방의 남쪽 앞벽
# 핵심: 방 내부 시야를 가리지 않기 위해 오직 상단 Top Cap(16px)만 표시!
# 캐릭터가 벽 바로 위까지 가도 가려지지 않음.
def make_south_wall_top():
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    # Top Cap이 칸 중앙 또는 상단(y=0..16)에 위치
    im.alpha_composite(TOP_CAP_H, (0, 0))
    return im

# 남쪽 벽의 아래쪽 앞면 (방 밖 복도로 내려가는 앞면 돌받침/회벽)
def make_south_wall_front():
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    # 상단 14px 돌받침/회벽
    stone_full = Image.new("RGBA", (T, 14))
    stone_full.paste(stone_slice, (0, 0))
    stone_full.paste(stone_slice, (32, 0))
    im.alpha_composite(stone_full, (0, 0))
    return im

# [3] 좌측 세로 벽 (West Wall)
# 폭 32px의 Top Cap (x=16..48) + 방 안쪽(우측)으로 떨어지는 부드러운 그림자
def make_west_wall():
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    # 바닥 그림자 (우측 x=48..56, 반투명 검정)
    d = ImageDraw.Draw(im)
    for x in range(48, 56):
        alpha = int(90 * (1.0 - (x - 48) / 8.0))
        d.line([(x, 0), (x, T)], fill=(0, 0, 0, alpha))
    # 세로 Top Cap (x=16..48)
    im.alpha_composite(TOP_CAP_V, (16, 0))
    return im

# [4] 우측 세로 벽 (East Wall)
# 폭 32px의 Top Cap (x=16..48) + 방 안쪽(좌측)으로 떨어지는 바닥 그림자
def make_east_wall():
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    # 바닥 그림자 (좌측 x=8..16, 반투명 검정)
    d = ImageDraw.Draw(im)
    for x in range(8, 16):
        alpha = int(90 * ((x - 8) / 8.0))
        d.line([(x, 0), (x, T)], fill=(0, 0, 0, alpha))
    # 세로 Top Cap (x=16..48)
    im.alpha_composite(TOP_CAP_V, (16, 0))
    return im

# [5] 모서리 코너 (Corners)
# 북서 코너 (NW Corner): 북벽 앞면 + 서쪽 벽 상단 연결 기둥
def make_nw_corner():
    im = make_north_wall()
    # 좌측에 튼튼한 코너 기둥 오버레이 (x=16..36)
    post = W2.crop((0, 3, 16, 59)).resize((20, 64), Image.NEAREST)
    im.alpha_composite(post, (16, 0))
    im.alpha_composite(TOP_CAP_H.crop((16, 0, 36, 16)), (16, 0))
    return im

# 북동 코너 (NE Corner): 북벽 앞면 + 동쪽 벽 상단 연결 기둥
def make_ne_corner():
    im = make_north_wall()
    post = W2.crop((0, 3, 16, 59)).resize((20, 64), Image.NEAREST)
    im.alpha_composite(post, (28, 0))
    im.alpha_composite(TOP_CAP_H.crop((28, 0, 48, 16)), (28, 0))
    return im

# 남서 코너 (SW Corner): 서쪽 세로벽 Top Cap + 남쪽 벽 Top Cap '└' 조인트
def make_sw_corner():
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    # 남쪽 가로 Top Cap (x=16..64, y=0..16)
    im.alpha_composite(TOP_CAP_H.crop((16, 0, T, 16)), (16, 0))
    # 서쪽 세로 Top Cap (x=16..48, y=0..16)
    im.alpha_composite(TOP_CAP_V.crop((0, 0, 32, 16)), (16, 0))
    return im

# 남동 코너 (SE Corner): 동쪽 세로벽 Top Cap + 남쪽 벽 Top Cap '┘' 조인트
def make_se_corner():
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    # 남쪽 가로 Top Cap (x=0..48, y=0..16)
    im.alpha_composite(TOP_CAP_H.crop((0, 0, 48, 16)), (0, 0))
    # 동쪽 세로 Top Cap (x=16..48, y=0..16)
    im.alpha_composite(TOP_CAP_V.crop((0, 0, 32, 16)), (16, 0))
    return im

# ── 3. 코어키퍼 스타일 룸 목업 렌더링 ─────────────────────────────────────────
def render_corekeeper_mockup():
    tiles = {
        "wall_n": make_north_wall(),
        "wall_s": make_south_wall_top(),
        "wall_w": make_west_wall(),
        "wall_e": make_east_wall(),
        "corner_nw": make_nw_corner(),
        "corner_ne": make_ne_corner(),
        "corner_sw": make_sw_corner(),
        "corner_se": make_se_corner(),
    }
    
    # 바닥 타일
    floor_tile = cell(1, 1) # 따뜻한 목재 판자 바닥
    px = floor_tile.load()
    for y in range(T):
        for x in (0, 1): px[x, y] = px[2, y]
        for x in (62, 63): px[x, y] = px[61, y]
        
    grass = Image.open(os.path.join(REPO, "tileimg", "FullGrass.png")).convert("RGBA")
    
    # 레이아웃: 가로 10칸, 세로 7칸
    # 0행: 잔디 / 북쪽 바깥
    # 1행: 북쪽 벽 (NW ... N ... NE)
    # 2..4행: 방 내부 (W ... floor ... E)
    # 5행: 남쪽 벽 (SW ... S ... SE)
    # 6행: 잔디 / 남쪽 바깥 복도
    cols, rows = 10, 7
    im = Image.new("RGBA", (cols * T, rows * T))
    
    # 1. 배경 잔디
    for r in range(rows):
        for c in range(cols):
            im.alpha_composite(grass, (c * T, r * T))
            
    # 2. 방 내부 바닥 (c=2..7, r=2..4)
    for r in range(2, 5):
        for c in range(2, 8):
            im.alpha_composite(floor_tile, (c * T, r * T))
            
    # 3. 벽 배치
    # 북쪽 벽 (r=1)
    im.alpha_composite(tiles["corner_nw"], (1 * T, 1 * T))
    for c in range(2, 8):
        im.alpha_composite(tiles["wall_n"], (c * T, 1 * T))
    im.alpha_composite(tiles["corner_ne"], (8 * T, 1 * T))
    
    # 좌우 세로 벽 (r=2..4)
    for r in range(2, 5):
        im.alpha_composite(tiles["wall_w"], (1 * T, r * T))
        im.alpha_composite(tiles["wall_e"], (8 * T, r * T))
        
    # 남쪽 벽 (r=5) - 문 자리(c=4,5) 제외
    im.alpha_composite(tiles["corner_sw"], (1 * T, 5 * T))
    im.alpha_composite(tiles["wall_s"], (2 * T, 5 * T))
    im.alpha_composite(tiles["wall_s"], (3 * T, 5 * T))
    # c=4,5는 출입구
    im.alpha_composite(tiles["wall_s"], (6 * T, 5 * T))
    im.alpha_composite(tiles["wall_s"], (7 * T, 5 * T))
    im.alpha_composite(tiles["corner_se"], (8 * T, 5 * T))
    
    # 4. 코어키퍼 스타일 가구 및 장식 배치!
    d = ImageDraw.Draw(im)
    
    # (1) 북쪽 벽면 장식 (북벽 앞면에 걸리는 장식들!)
    # 벽난로 (Fireplace) at c=4..5, r=1 앞면 (y=1*T + 20)
    fx, fy = int(4.5 * T), 1 * T + 24
    d.rounded_rectangle([fx - 24, fy, fx + 24, fy + 38], 4, fill=(80, 75, 70, 255), outline=(40, 35, 30, 255), width=2)
    d.rounded_rectangle([fx - 14, fy + 12, fx + 14, fy + 38], 3, fill=(30, 20, 15, 255))
    # 불꽃
    d.polygon([(fx, fy + 18), (fx - 8, fy + 34), (fx + 8, fy + 34)], fill=(255, 140, 30, 255))
    d.polygon([(fx, fy + 22), (fx - 4, fy + 34), (fx + 4, fy + 34)], fill=(255, 230, 80, 255))
    
    # 벽면 크리스마스 전구 스트링 (String lights across c=2..7)
    for c in range(2, 8):
        y_wire = 1 * T + 18
        d.line([(c * T, y_wire), ((c + 1) * T, y_wire)], fill=(40, 60, 40, 200), width=1)
        for i, col in enumerate([(255, 60, 60), (60, 255, 60), (255, 230, 60), (60, 180, 255)]):
            lx = c * T + 8 + i * 14
            d.ellipse([lx - 2, y_wire + 1, lx + 2, y_wire + 6], fill=col + (255,))
            
    # 세로벽 횃불 (Torches on side walls)
    # 좌측 벽 횃불 (c=1, r=3)
    d.rectangle([1 * T + 44, 3 * T + 20, 1 * T + 50, 3 * T + 34], fill=(120, 70, 30, 255), outline=(40, 20, 10, 255))
    d.ellipse([1 * T + 42, 3 * T + 12, 1 * T + 52, 3 * T + 22], fill=(255, 160, 40, 220))
    # 우측 벽 횃불 (c=8, r=3)
    d.rectangle([8 * T + 14, 3 * T + 20, 8 * T + 20, 3 * T + 34], fill=(120, 70, 30, 255), outline=(40, 20, 10, 255))
    d.ellipse([8 * T + 12, 3 * T + 12, 8 * T + 22, 3 * T + 22], fill=(255, 160, 40, 220))
    
    # 방 중앙 긴 테이블 (Red feast table at c=3..6, r=3)
    tx, ty = int(4.5 * T), 3 * T + 10
    d.rounded_rectangle([tx - 60, ty, tx + 60, ty + 36], 6, fill=(180, 40, 45, 255), outline=(90, 15, 20, 255), width=2)
    # 테이블 위 머그잔/음식
    d.ellipse([tx - 35, ty + 10, tx - 23, ty + 24], fill=(240, 220, 180, 255))
    d.ellipse([tx + 25, ty + 10, tx + 37, ty + 24], fill=(240, 220, 180, 255))
    
    # 플레이어 캐릭터 (중앙 방 안, 키 2칸 스케일)
    px, py = int(3.2 * T), 4 * T + 10
    d.ellipse([px - 18, py - 6, px + 18, py + 4], fill=(30, 20, 30, 110))
    d.rounded_rectangle([px - 14, py - 70, px + 14, py - 2], 6, fill=(90, 140, 210, 255), outline=(30, 20, 25, 255), width=2)
    d.ellipse([px - 18, py - 110, px + 18, py - 68], fill=(250, 214, 180, 255), outline=(30, 20, 25, 255), width=2)
    # 광부 모자 / 랜턴
    d.arc([px - 20, py - 116, px + 20, py - 86], 180, 360, fill=(230, 170, 40, 255), width=4)
    d.ellipse([px - 4, py - 114, px + 4, py - 104], fill=(255, 255, 150, 255))
    
    # 이미지 저장
    out_path = os.path.join(WOODLAND_DIR, "mockup_corekeeper_style.png")
    im.save(out_path)
    im.resize((cols * 100, rows * 100), Image.NEAREST).save(os.path.join(WOODLAND_DIR, "mockup_corekeeper_style@game.png"))
    print("Saved Core Keeper style mockup successfully.")

if __name__ == "__main__":
    render_corekeeper_mockup()
