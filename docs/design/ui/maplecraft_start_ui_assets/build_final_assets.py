"""시작 화면 UI 개편 — HiRes 원본 → MSW 임포트용 최종 PNG (2026-10-15).

- 입력: 1_Original_HiRes_PNG/*.png (+ docs/design/art/mainmenu/wooden_menu_planks_v2.png 의 판자 1장)
- 출력: 4_Final_MSW_PNG/mc_*.png — 실제 화면 배치 크기(1920×1080 캔버스 기준)의 2배.
- 2_MSW_TargetSize_PNG 는 비율이 깨져 있어 쓰지 않는다.

보정:
  1) 투명 여백 잘라내기(알파 bbox).
  2) 배경 제거 잔여물: 투명 영역에 닿은 저채도·밝은 1px 헤일로 제거.
  3) 책갈피(03) 아래 V홈 안쪽에 남은 회색 그림자 띠 제거.
늘어나는 판(버튼·카드·입력창·모달)은 여기서 9-slice 로 목표 비율을 만들어 둔다 →
Maker 에서 9-slice 경계를 따로 설정하지 않아도 Simple 로 그대로 쓴다.

실행: python build_final_assets.py   (Pillow 만 필요)
"""
import os
from collections import deque
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "1_Original_HiRes_PNG")
OUT = os.path.join(HERE, "4_Final_MSW_PNG")
PLANKS = os.path.join(HERE, "..", "..", "art", "mainmenu", "wooden_menu_planks_v2.png")


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def shadowish(c):
    r, g, b, a = c
    if a == 0:
        return False
    mx, mn = max(r, g, b), min(r, g, b)
    sat = (mx - mn) / mx if mx else 0
    return mx >= 120 and sat < 0.25


def crop_alpha(im):
    bbox = im.getchannel("A").getbbox()
    return im.crop(bbox) if bbox else im


def remove_halo(im):
    """투명에 닿은 가장자리 픽셀 중, 안쪽 이웃보다 확연히 밝은 저채도 픽셀(흰 배경 잔여)을 지운다."""
    im = im.copy()
    px = im.load()
    W, H = im.size
    kill = []
    for y in range(H):
        for x in range(W):
            c = px[x, y]
            if c[3] == 0 or not shadowish(c):
                continue
            inner = []
            touches = False
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < W and 0 <= ny < H) or px[nx, ny][3] == 0:
                    touches = True
                else:
                    inner.append(lum(px[nx, ny]))
            if touches and inner and lum(c) > min(inner) + 40:
                kill.append((x, y))
    for x, y in kill:
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
    return im, len(kill)


def remove_notch_shadow(im, from_ratio=0.85):
    """아래쪽(from_ratio 이하)에서 투명 영역과 이어진 회색 그림자 덩어리를 지운다."""
    im = im.copy()
    px = im.load()
    W, H = im.size
    y0 = int(H * from_ratio)
    seen = set()
    q = deque()
    for y in range(y0, H):
        for x in range(W):
            if px[x, y][3] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if y0 <= ny < H and 0 <= nx < W and (nx, ny) not in seen and shadowish(px[nx, ny]):
                    seen.add((nx, ny))
                    q.append((nx, ny))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if y0 <= ny < H and 0 <= nx < W and (nx, ny) not in seen and shadowish(px[nx, ny]):
                seen.add((nx, ny))
                q.append((nx, ny))
    for x, y in seen:
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
    return im, len(seen)


def rs(im, w, h):
    """premultiplied 리샘플 — 가장자리 색 번짐 방지."""
    w, h = max(1, int(round(w))), max(1, int(round(h)))
    return im.convert("RGBa").resize((w, h), Image.LANCZOS).convert("RGBA")


def nine_slice(im, out_w, out_h, L, R, T, B, s):
    """src 경계(L,R,T,B px)를 배율 s 로 줄인 모서리를 유지하고 가운데만 늘린다."""
    W, H = im.size
    oL, oR, oT, oB = [max(1, int(round(v * s))) for v in (L, R, T, B)]
    cw, ch = out_w - oL - oR, out_h - oT - oB
    assert cw > 0 and ch > 0, (out_w, out_h, oL, oR, oT, oB)
    out = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    xs = [(0, L, 0, oL), (L, W - R, oL, cw), (W - R, W, oL + cw, oR)]
    ys = [(0, T, 0, oT), (T, H - B, oT, ch), (H - B, H, oT + ch, oB)]
    for sx0, sx1, dx, dw in xs:
        for sy0, sy1, dy, dh in ys:
            part = im.crop((sx0, sy0, sx1, sy1))
            out.paste(rs(part, dw, dh), (dx, dy))
    return out


def load(name, notch=False):
    im = Image.open(os.path.join(SRC, name)).convert("RGBA")
    im = crop_alpha(im)
    n_notch = 0
    if notch:
        im, n_notch = remove_notch_shadow(im)
    im, n_halo = remove_halo(im)
    im = crop_alpha(im)
    print(f"  {name}: halo={n_halo} notch={n_notch} -> {im.size}")
    return im


def plank_crop():
    im = Image.open(PLANKS).convert("RGBA")
    # 3번째(밝은) 판자. 왼쪽 여백에 옅은 알파 잡티가 있어 bbox 대신 판자 좌표로 자르고, 알파 128 미만은 지운다.
    band = im.crop((375, 695, 880, 860))
    band.putalpha(band.getchannel("A").point(lambda v: 255 if v >= 128 else 0))
    band = crop_alpha(band)
    band, n = remove_halo(band)
    print(f"  plank crop: halo={n} -> {band.size}")
    return crop_alpha(band)


def save(im, name):
    os.makedirs(OUT, exist_ok=True)
    im.save(os.path.join(OUT, name))
    print(f"-> {name} {im.size}")


def main():
    modal = load("01_UI_Modal_SingleParchment.png")
    plaque = load("02_UI_Header_WoodPlaque.png")
    bookmark = load("03_UI_Btn_BookmarkBack.png", notch=True)
    pedestal = load("04_UI_Preview_GrassPedestal.png")
    inp = load("05_UI_Input_RecessedParchment.png")
    arr_l = load("06a_UI_Btn_Arrow_Left.png")
    arr_r = load("06b_UI_Btn_Arrow_Right.png")
    primary = load("07_UI_Btn_TitlePrimary.png")
    card = load("08_UI_Slot_HalfPageCard.png")
    tab_on = load("09a_UI_Btn_Tab_Active_Green.png")
    tab_off = load("09b_UI_Btn_Tab_Inactive_Gray.png")
    olive = load("09c_UI_Btn_Action_Primary_Olive.png")
    red = load("09d_UI_Btn_Action_Delete_Red.png")
    plank = plank_crop()

    # 표시 크기(D) × 2 = 출력 크기. 레이아웃 수치는 build_mainmenu_revamp 스크립트와 맞춘다.
    save(nine_slice(modal, 1080, 720, 120, 120, 120, 120, 0.75), "mc_modal_parchment.png")      # D 540×360
    save(rs(plaque, 880, 880 * plaque.height / plaque.width), "mc_header_plaque.png")       # D 440×~112
    save(rs(bookmark, 120, 120 * bookmark.height / bookmark.width), "mc_bookmark_back.png")  # D 60×~156
    save(rs(pedestal, 460, 460 * pedestal.height / pedestal.width), "mc_preview_pedestal.png")  # D 230×~139
    save(nine_slice(inp, 680, 104, 240, 40, 40, 40, 0.46), "mc_input_recessed.png")          # D 340×52
    save(rs(arr_l, 80, 80), "mc_arrow_left.png")                                              # D 40×40
    save(rs(arr_r, 80, 80), "mc_arrow_right.png")
    save(nine_slice(primary, 600, 168, 430, 70, 60, 60, 0.476), "mc_title_btn_primary.png")  # D 300×84
    save(nine_slice(plank, 600, 168, 40, 40, 40, 40, 1.0), "mc_title_btn_plank.png")         # D 300×84
    save(nine_slice(card, 660, 280, 70, 70, 70, 70, 0.5), "mc_slot_card.png")                # D 330×140
    save(nine_slice(card, 660, 112, 70, 70, 70, 70, 0.32), "mc_row_card.png")                # D 330×56
    save(nine_slice(tab_on, 380, 112, 80, 80, 60, 60, 0.557), "mc_tab_active.png")           # D 190×56
    save(nine_slice(tab_off, 380, 112, 80, 80, 60, 60, 0.557), "mc_tab_inactive.png")
    save(nine_slice(olive, 260, 88, 70, 70, 60, 60, 0.42), "mc_btn_olive_m.png")             # D 130×44
    save(nine_slice(olive, 440, 112, 70, 70, 60, 60, 0.53), "mc_btn_olive_l.png")            # D 220×56
    save(nine_slice(red, 140, 88, 70, 70, 60, 60, 0.42), "mc_btn_red_s.png")                 # D 70×44
    save(nine_slice(red, 320, 104, 70, 70, 60, 60, 0.5), "mc_btn_red_m.png")                 # D 160×52
    save(nine_slice(tab_off, 320, 104, 80, 80, 60, 60, 0.5), "mc_btn_gray_m.png")            # D 160×52


if __name__ == "__main__":
    main()
