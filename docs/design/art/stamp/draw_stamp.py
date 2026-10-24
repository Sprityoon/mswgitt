"""의뢰 게시판 도장 UI 아이콘 (Quest Board Stamp Suite)
메이플스토리풍 2D 아늑한 카툰 채색 밀랍 인장 & 점선 빈 칸 아이콘

규격:
  - 128x128 PNG, 투명 배경, 완벽한 중앙 정렬 (64, 64), 가장자리 여백 >= 6px
  - 채색: 메이플 카툰 채색 (좌상단 광원, 2~3단 셀 쉐이딩, 부드러운 우하단 그늘, 좌상단 림 하이라이트)
  - 외곽선: 진한 갈색 #4a2a1c (순검정 배제), 선 두께 약 3px
  - 팔레트: 양피지 #f1e2c2, 나무 갈색 #6b4426, 호박색 #c8861e, 금빛 하이라이트 #ffd77a
산출물:
  - stamp_empty.png       : 아직 안 찍은 칸 (지름 104px 점선 테두리 + 옅은 양피지 음영 + 20% 투명도 나뭇잎 자국)
  - stamp_done.png        : 찍힌 금빛 도장 (울퉁불퉁한 밀랍 테두리 + 볼록 나뭇잎/별 문양 + 좌상단 하이라이트 + 밀랍 흘림)
  - stamp_done_flash.png  : 찍히는 순간 연출용 (바깥 8방향 금빛 반짝이 파티클)
  - preview.png           : 양피지, 다크 우드, 체커보드 및 정합성 오버레이/2x 디테일 검증 시트
"""
import math
import os
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

W, H = 128, 128
SS = 4  # 4x 슈퍼샘플링 (512x512 캔버스에서 정밀 합성 후 Lanczos 다운샘플)
SW, SH = W * SS, H * SS
CX, CY = 64.0 * SS, 64.0 * SS

# 팔레트 상수 (MSW 프로젝트 디자인 가이드라인 준수)
OUTLINE_COLOR = (74, 42, 28, 255)       # #4a2a1c
WOOD_BROWN = (107, 68, 38, 255)         # #6b4426
AMBER_DEEP = (160, 80, 16, 255)         # #a05010
AMBER_MID = (200, 134, 30, 255)         # #c8861e
AMBER_BRIGHT = (235, 172, 45, 255)      # #ebac2d
GOLD_HI = (255, 215, 122, 255)          # #ffd77a
GOLD_BRIGHT = (255, 245, 204, 255)      # #fff5cc
WHITE = (255, 255, 255, 255)
PARCHMENT = (241, 226, 194, 255)        # #f1e2c2
PARCHMENT_LINE = (166, 124, 82, 255)    # #a67c52


def lanczos_downsample(img_ss: Image.Image) -> Image.Image:
    """Premultiplied alpha 축소로 경계 검은 테두리 및 번짐 방지."""
    pm = img_ss.convert("RGBa")
    resized = pm.resize((W, H), Image.LANCZOS)
    return resized.convert("RGBA")


def make_star_polygon(cx: float, cy: float, r_outer: float, r_inner: float, points: int = 4) -> list[tuple[float, float]]:
    """4포인트 반짝이 별 다각형 좌표 생성."""
    pts = []
    angle_step = math.pi / points
    for i in range(2 * points):
        r = r_outer if i % 2 == 0 else r_inner
        ang = -math.pi / 2 + i * angle_step
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return pts


def extract_motif_mask(source_img: Image.Image, cx: int, cy: int) -> Image.Image:
    """소스 이미지의 중앙 오목판에서 단풍잎 및 별 문양의 정밀 마스크 추출."""
    arr = np.array(source_img)
    # 중앙 플레이트 반경 220px 영역
    crop_sz = 300
    crop = arr[cy - crop_sz : cy + crop_sz, cx - crop_sz : cx + crop_sz]
    r = crop[:, :, 0]
    g = crop[:, :, 1]

    plate_mask = np.zeros(crop.shape[:2], dtype=np.uint8)
    cv2.circle(plate_mask, (300, 300), 220, 255, -1)

    # 단풍잎 골드 채색 영역 분리 (r > 215, g > 155)
    leaf_gold = (r > 215) & (g > 155) & (plate_mask > 0)
    closed = cv2.morphologyEx(
        leaf_gold.astype(np.uint8) * 255,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    )

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(closed)
    motif = np.zeros(crop.shape[:2], dtype=np.uint8)
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area > 800:
            motif[labels == i] = 255

    contours, _ = cv2.findContours(motif, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    motif_filled = np.zeros(crop.shape[:2], dtype=np.uint8)
    cv2.drawContours(motif_filled, contours, -1, 255, -1)
    motif_final = cv2.dilate(motif_filled, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))

    return Image.fromarray(motif_final, mode="L")


def build_stamp_done_ss(cutout: Image.Image, scale: float, orig_cx: float, orig_cy: float) -> Image.Image:
    """stamp_done 4x 슈퍼샘플링 캔버스 생성."""
    ss_scale = scale * SS
    new_cw = int(round(cutout.width * ss_scale))
    new_ch = int(round(cutout.height * ss_scale))

    pm = cutout.convert("RGBa")
    resized_pm = pm.resize((new_cw, new_ch), Image.LANCZOS)
    resized_cutout = resized_pm.convert("RGBA")

    new_cx = orig_cx * ss_scale
    new_cy = orig_cy * ss_scale

    canvas_ss = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    paste_x = int(round(CX - new_cx))
    paste_y = int(round(CY - new_cy))

    canvas_ss.paste(resized_cutout, (paste_x, paste_y), resized_cutout)
    return canvas_ss


def build_stamp_empty_ss(motif_mask: Image.Image, scale: float) -> Image.Image:
    """stamp_empty 4x 슈퍼샘플링 캔버스 생성 (지름 104px 점선 + 나뭇잎 워터마크 20%)."""
    canvas = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))

    radius_logical = 51.5  # 지름 103px + 테두리 2.8px = 외경 정확히 104px
    radius = radius_logical * SS

    # 1. 내부 인셋 마스크 & 옅은 양피지 음영 (#f1e2c2 at 18%)
    inner_mask = Image.new("L", (SW, SH), 0)
    ImageDraw.Draw(inner_mask).ellipse(
        [CX - radius + 1.4 * SS, CY - radius + 1.4 * SS,
         CX + radius - 1.4 * SS, CY + radius - 1.4 * SS],
        fill=255
    )
    tint_layer = Image.new("RGBA", (SW, SH), (PARCHMENT[0], PARCHMENT[1], PARCHMENT[2], 0))
    tint_layer.putalpha(inner_mask.point(lambda v: int(v * 0.18)))
    canvas = Image.alpha_composite(canvas, tint_layer)

    # 좌상단 종이 음각 인셋 그림자
    offset_mask = Image.new("L", (SW, SH), 0)
    ImageDraw.Draw(offset_mask).ellipse(
        [CX - radius + 4.2 * SS, CY - radius + 4.2 * SS,
         CX + radius + 4.2 * SS, CY + radius + 4.2 * SS],
        fill=255
    )
    inset_raw = ImageChops.subtract(inner_mask, offset_mask)
    inset_blurred = inset_raw.filter(ImageFilter.GaussianBlur(3.0 * SS))
    inset_clean = ImageChops.multiply(inset_blurred, inner_mask)

    inset_img = Image.new("RGBA", (SW, SH), (WOOD_BROWN[0], WOOD_BROWN[1], WOOD_BROWN[2], 0))
    inset_img.putalpha(inset_clean.point(lambda v: int(v * 0.28)))
    canvas = Image.alpha_composite(canvas, inset_img)

    # 2. stamp_done 과 100% 일치하는 단풍잎 + 별 워터마크 (20% 투명도)
    ss_scale = scale * SS
    new_mw = int(round(motif_mask.width * ss_scale))
    new_mh = int(round(motif_mask.height * ss_scale))
    resized_motif = motif_mask.resize((new_mw, new_mh), Image.LANCZOS)

    motif_canvas = Image.new("L", (SW, SH), 0)
    paste_mx = int(round(CX - new_mw / 2.0))
    paste_my = int(round(CY - new_mh / 2.0))
    motif_canvas.paste(resized_motif, (paste_mx, paste_my))

    watermark_img = Image.new("RGBA", (SW, SH), (WOOD_BROWN[0], WOOD_BROWN[1], WOOD_BROWN[2], 0))
    watermark_img.putalpha(motif_canvas.point(lambda v: int(v * 0.20)))
    canvas = Image.alpha_composite(canvas, watermark_img)

    # 3. 원형 점선 테두리 (#a67c52, 두께 2.8px, 32개 둥근 호)
    num_dashes = 32
    dot_radius = radius - 1.4 * SS
    dash_width = 2.8 * SS

    dash_layer = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    dash_draw = ImageDraw.Draw(dash_layer)
    for i in range(num_dashes):
        ang_start = (2 * math.pi / num_dashes) * i
        ang_end = ang_start + (2 * math.pi / num_dashes) * 0.60
        bbox = [CX - dot_radius, CY - dot_radius, CX + dot_radius, CY + dot_radius]
        dash_draw.arc(
            bbox,
            start=math.degrees(ang_start),
            end=math.degrees(ang_end),
            fill=(PARCHMENT_LINE[0], PARCHMENT_LINE[1], PARCHMENT_LINE[2], 240),
            width=int(dash_width)
        )
    canvas = Image.alpha_composite(canvas, dash_layer)

    return canvas


def add_flash_sparkles(base_ss: Image.Image) -> Image.Image:
    """stamp_done_flash 연출용 외곽 8방향 금빛 반짝이 파티클 추가."""
    sparkle_layer = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    sp_draw = ImageDraw.Draw(sparkle_layer)

    # 반경 53.0~54.0px (가장자리 여백 >= 6px 엄수: 64 - 58 = 6.0px)
    sparkles = [
        (25, 53.5, 3.8, 'star'),
        (70, 53.0, 2.4, 'dot'),
        (115, 54.0, 3.8, 'star'),
        (160, 53.0, 2.4, 'dot'),
        (205, 53.5, 3.8, 'star'),
        (250, 53.0, 2.4, 'dot'),
        (295, 54.0, 3.8, 'star'),
        (340, 53.0, 2.4, 'dot'),
    ]

    for ang_deg, r_log, sz, kind in sparkles:
        rad = math.radians(ang_deg)
        sx = CX + r_log * SS * math.cos(rad)
        sy = CY + r_log * SS * math.sin(rad)

        if kind == 'star':
            s_pts_out = make_star_polygon(sx, sy, r_outer=(sz + 1.2) * SS, r_inner=(sz + 1.2) * 0.35 * SS, points=4)
            s_pts_in = make_star_polygon(sx, sy, r_outer=sz * SS, r_inner=sz * 0.35 * SS, points=4)
            sp_draw.polygon(s_pts_out, fill=OUTLINE_COLOR)
            sp_draw.polygon(s_pts_in, fill=GOLD_HI)
            sp_draw.ellipse([sx - 1.2 * SS, sy - 1.2 * SS, sx + 1.2 * SS, sy + 1.2 * SS], fill=WHITE)
        else:
            r_dot = sz * SS
            sp_draw.ellipse([sx - r_dot - 1.2 * SS, sy - r_dot - 1.2 * SS,
                             sx + r_dot + 1.2 * SS, sy + r_dot + 1.2 * SS], fill=OUTLINE_COLOR)
            sp_draw.ellipse([sx - r_dot, sy - r_dot, sx + r_dot, sy + r_dot], fill=GOLD_HI)
            sp_draw.ellipse([sx - r_dot * 0.45, sy - r_dot * 0.45,
                             sx + r_dot * 0.45, sy + r_dot * 0.45], fill=WHITE)

    return Image.alpha_composite(base_ss, sparkle_layer)


def create_preview_sheet(empty_img: Image.Image, done_img: Image.Image, flash_img: Image.Image) -> Image.Image:
    """양피지, 체커보드, 다크 우드 및 2x 줌 검증 시트 생성."""
    bg_w, bg_h = 440, 160
    sheet = Image.new("RGBA", (bg_w * 2, bg_h * 2), (245, 240, 230, 255))

    # 1. 양피지 배경 (#f1e2c2) — 실제 게임 의뢰 게시판 UI
    parchment_bg = Image.new("RGBA", (bg_w, bg_h), (241, 226, 194, 255))
    p_draw = ImageDraw.Draw(parchment_bg)
    p_draw.rectangle([6, 6, bg_w - 6, bg_h - 6], outline=(214, 194, 154, 255), width=2)
    p_draw.text((16, 10), "1. On Parchment (Game Quest Board UI #f1e2c2)", fill=(107, 68, 38, 255))
    parchment_bg.paste(empty_img, (20, 24), empty_img)
    parchment_bg.paste(done_img, (160, 24), done_img)
    parchment_bg.paste(flash_img, (300, 24), flash_img)
    sheet.paste(parchment_bg, (0, 0))

    # 2. 체커보드 투명도 확인
    checker_bg = Image.new("RGBA", (bg_w, bg_h), (220, 220, 220, 255))
    c_draw = ImageDraw.Draw(checker_bg)
    tile_sz = 16
    for y in range(0, bg_h, tile_sz):
        for x in range(0, bg_w, tile_sz):
            if (x // tile_sz + y // tile_sz) % 2 == 0:
                c_draw.rectangle([x, y, x + tile_sz, y + tile_sz], fill=(245, 245, 245, 255))
    c_draw.text((16, 10), "2. Transparency Checkerboard", fill=(60, 60, 60, 255))
    checker_bg.paste(empty_img, (20, 24), empty_img)
    checker_bg.paste(done_img, (160, 24), done_img)
    checker_bg.paste(flash_img, (300, 24), flash_img)
    sheet.paste(checker_bg, (bg_w, 0))

    # 3. 다크 우드 프레임 (#362216)
    dark_bg = Image.new("RGBA", (bg_w, bg_h), (54, 34, 22, 255))
    d_draw = ImageDraw.Draw(dark_bg)
    d_draw.text((16, 10), "3. Dark Wood Frame (#362216)", fill=(240, 215, 170, 255))
    dark_bg.paste(empty_img, (20, 24), empty_img)
    dark_bg.paste(done_img, (160, 24), done_img)
    dark_bg.paste(flash_img, (300, 24), flash_img)
    sheet.paste(dark_bg, (0, bg_h))

    # 4. 정합성 오버레이 및 2x 디테일 검증
    zoom_bg = Image.new("RGBA", (bg_w, bg_h), (235, 230, 220, 255))
    z_draw = ImageDraw.Draw(zoom_bg)
    z_draw.text((16, 10), "4. Alignment & 2x Detail Zoom", fill=(74, 42, 28, 255))

    comp_box = Image.new("RGBA", (128, 128), (241, 226, 194, 255))
    comp_box.paste(empty_img, (0, 0), empty_img)
    comp_box.paste(done_img, (0, 0), done_img)
    zoom_bg.paste(comp_box, (40, 24))
    z_draw.rectangle([40, 24, 168, 152], outline=(107, 68, 38, 255), width=2)
    z_draw.text((45, 28), "Exact Overlay", fill=(107, 68, 38, 255))

    crop_done = done_img.crop((16, 16, 112, 112)).resize((120, 120), Image.NEAREST)
    zoom_bg.paste(crop_done, (260, 24), crop_done)
    z_draw.rectangle([260, 24, 380, 144], outline=(107, 68, 38, 255), width=2)
    z_draw.text((265, 28), "2x Pixel Detail", fill=(107, 68, 38, 255))

    sheet.paste(zoom_bg, (bg_w, bg_h))
    return sheet


def main():
    target_dir = os.path.dirname(os.path.abspath(__file__))
    source_path = os.path.join(target_dir, "stamp_source.png")

    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source asset not found: {source_path}")

    cutout = Image.open(source_path).convert("RGBA")
    orig_cx, orig_cy = 514.0, 511.0
    scale = 104.0 / 706.0  # 지름 104px 기준 스케일

    print("Generating stamp assets...")
    # 1. stamp_done
    done_ss = build_stamp_done_ss(cutout, scale, orig_cx, orig_cy)
    img_done = lanczos_downsample(done_ss)

    # 2. stamp_done_flash
    flash_ss = add_flash_sparkles(done_ss)
    img_flash = lanczos_downsample(flash_ss)

    # 3. stamp_empty (워터마크 마스크 자동 추출)
    motif_mask = extract_motif_mask(cutout, int(orig_cx), int(orig_cy))
    empty_ss = build_stamp_empty_ss(motif_mask, scale)
    img_empty = lanczos_downsample(empty_ss)

    # 4. 저장
    path_empty = os.path.join(target_dir, "stamp_empty.png")
    path_done = os.path.join(target_dir, "stamp_done.png")
    path_flash = os.path.join(target_dir, "stamp_done_flash.png")
    path_preview = os.path.join(target_dir, "preview.png")

    img_empty.save(path_empty)
    img_done.save(path_done)
    img_flash.save(path_flash)

    preview = create_preview_sheet(img_empty, img_done, img_flash)
    preview.save(path_preview)

    print("All stamp icons successfully created and saved:")
    print(f"  - {path_empty}")
    print(f"  - {path_done}")
    print(f"  - {path_flash}")
    print(f"  - {path_preview}")

    # Bounding box & 여백 검증
    for name, img in [("stamp_empty", img_empty), ("stamp_done", img_done), ("stamp_done_flash", img_flash)]:
        alpha = img.getchannel("A")
        bbox = alpha.getbbox()
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        ml = bbox[0]
        mr = W - bbox[2]
        mt = bbox[1]
        mb = H - bbox[3]
        min_m = min(ml, mr, mt, mb)
        cx = (bbox[0] + bbox[2]) / 2.0
        cy = (bbox[1] + bbox[3]) / 2.0
        print(f"[{name}] size={img.size}, bbox={bbox} (w={w}, h={h}), min_margin={min_m}px, center=({cx:.1f}, {cy:.1f}), margins(L={ml}, R={mr}, T={mt}, B={mb})")


if __name__ == "__main__":
    main()
