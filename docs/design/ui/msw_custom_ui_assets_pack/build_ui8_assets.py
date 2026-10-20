"""UI 개편(ui8) — 커스텀 에셋 팩 → Maker 가져오기용 PNG (2026-10-17).

- 입력: 이 폴더의 01~06 PNG + ../ui_refinement_complete_with_assets_v7/assets (팩에 없는 탭·퀵슬롯·입력창만)
- 출력: ui8_import/ui8_*.png  +  ui8_import/ui8_borders.json (9-slice 경계 L/R/T/B, 원본 픽셀)
- 크기 변환 없이 원본 픽셀 그대로 쓴다. 늘리는 판은 등록 후 리소스 메타데이터에 9-slice 경계를 넣고
  UI 에서 Sliced 로 그린다(크기별로 미리 굽지 않음).
- 가공:
  * HUD 게이지 4종은 채움 양(70~90%)이 그려진 완성형이라 색 캡슐만 잘라 채움으로, 빈 트랙은 HP 바의
    오른쪽 빈 구간을 좌우 대칭으로 이어 만든다.
  * 낚시 진행/위험 바도 색 캡슐만 잘라 채움으로. 평상시(크림) 장력은 위험(빨강) 채움을 다시 칠해 만든다.
  * 96px 아이콘 12종은 가장자리 반투명 픽셀(어두운 잔상)을 알파 임계로 정리한다.
  * 스킬트리 가지 패널은 하단 가지가 잘려 있어 제외(노드 프레임만 쓰고 연결선은 UI 에서 그린다).

실행: python -I build_ui8_assets.py   (Pillow 만 필요)
"""
import colorsys
import json
import os
import shutil

from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
V7 = os.path.join(HERE, "..", "ui_refinement_complete_with_assets_v7", "assets")
OUT = os.path.join(HERE, "ui8_import")

borders = {}


def src(rel):
    return Image.open(os.path.join(HERE, rel)).convert("RGBA")


def save(im, name, border=None):
    im.save(os.path.join(OUT, name + ".png"))
    if border:
        borders[name] = dict(zip(("left", "right", "top", "bottom"), border))
    print(f"-> {name}.png {im.size} {border or ''}")


def copy(rel, name, border=None):
    save(src(rel), name, border)


def sat_mask(im, min_sat=0.35, min_val=0.30):
    px = im.load()
    w, h = im.size
    m = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            m[y][x] = s >= min_sat and v >= min_val
    return m


def colour_capsule(im, probe_x):
    """probe_x 열 가운데의 채움 색과 색상·명도가 가까운 픽셀만 남겨 채움 캡슐을 잘라 낸다.
    트랙 테두리(갈색)는 색상은 비슷해도 명도가 절반 수준이라 명도 기준으로 걸러진다."""
    w, h = im.size
    px = im.load()
    r, g, b, _ = px[probe_x, h // 2]
    hc, sc, vc = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    keep = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            dh = min(abs(hh - hc), 1 - abs(hh - hc))
            # 위쪽 하이라이트(채도 낮고 밝음)도 채움의 일부
            if (dh < 0.07 and s > sc * 0.45 and v > min(vc, 0.85) * 0.85) or (s < sc * 0.6 and v > max(0.8, vc) and dh < 0.12):
                keep[y][x] = True
    # 채움 캡슐과 이어진 덩어리만 남긴다(트랙 끝의 비슷한 색 점 제외)
    seen = [[False] * w for _ in range(h)]
    stack = [(probe_x, h // 2)]
    while stack:
        x, y = stack.pop()
        if not (0 <= x < w and 0 <= y < h) or seen[y][x] or not keep[y][x]:
            continue
        seen[y][x] = True
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    keep = seen
    xs =[x for x in range(w) for y in range(h) if keep[y][x]]
    ys = [y for y in range(h) for x in range(w) if keep[y][x]]
    x0, x1, y0, y1 = min(xs), max(xs) + 1, min(ys), max(ys) + 1
    cap = Image.new("RGBA", (x1 - x0, y1 - y0))
    cp = cap.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            if keep[y][x]:
                cp[x - x0, y - y0] = px[x, y]
    return cap


def hud_track(bar):
    """HP 바 오른쪽 빈 트랙(색 없는 구간)을 좌우 대칭으로 이어 전체 빈 트랙을 만든다."""
    w, h = bar.size
    right = bar.crop((w - 60, 0, w, h))
    left = ImageOps.mirror(right)
    mid_col = bar.crop((w - 60, 0, w - 59, h))
    out = Image.new("RGBA", (240, h))
    out.paste(left, (0, 0))
    for x in range(60, 180):
        out.paste(mid_col, (x, 0))
    out.paste(right, (180, 0))
    return out


def recolour(im, rgb):
    """명암은 유지하고 색만 바꾼다(위험 빨강 → 평상시 크림)."""
    out = im.copy()
    px = out.load()
    tr, tg, tb = rgb
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 160
            px[x, y] = (min(255, int(tr * lum)), min(255, int(tg * lum)), min(255, int(tb * lum)), a)
    return out


def clean_icon(im, cut=110):
    """반투명 가장자리 정리: 알파 cut 미만은 투명, 이상은 불투명(도트 경계 선명하게)."""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 0) if a < cut else (r, g, b, 255)
    return out


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    # 1) 대화·채팅·토스트·전경
    d = "01_dialog_and_chat_assets/"
    copy(d + "dialog_parchment_box_frame.png", "ui8_dialog_frame", (36, 36, 36, 36))
    copy(d + "dialog_npc_nameplate_wood.png", "ui8_dialog_nameplate", (20, 20, 12, 12))
    copy(d + "dialog_portrait_wood_frame.png", "ui8_portrait_frame", (24, 24, 24, 24))
    copy(d + "quest_toast_ornate_leaf_banner.png", "ui8_toast_leaf", (64, 64, 32, 32))
    copy(d + "chat_window_filigree_darkwood_frame.png", "ui8_darkwood_filigree", (42, 42, 42, 42))
    copy(d + "fullview_top_scroll_banner.png", "ui8_scroll_banner", (72, 72, 28, 28))

    # 2) 팝업·서브 패널·목록 줄
    d = "02_popup_and_list_assets/"
    copy(d + "popup_window_parchment_frame.png", "ui8_popup_frame", (44, 44, 96, 88))  # 네 모서리 나무 못까지 고정
    copy(d + "parchment_subpanel_card_short.png", "ui8_subpanel", (20, 20, 20, 20))
    copy(d + "parchment_subpanel_card_tall.png", "ui8_subpanel_tall", (20, 20, 20, 20))
    copy(d + "list_row_darkwood_short.png", "ui8_row", (28, 28, 20, 20))
    copy(d + "list_row_amber_selected_short.png", "ui8_row_sel", (28, 28, 20, 20))
    copy(d + "list_row_darkwood_wide.png", "ui8_row_wide", (28, 28, 20, 20))
    copy(d + "list_row_amber_selected_wide.png", "ui8_row_wide_sel", (28, 28, 20, 20))

    # 3) 버튼·토글
    d = "03_buttons_toggles_tabs/"
    btn = (24, 24, 22, 22)
    copy(d + "btn_wood_amber_active.png", "ui8_btn_amber", btn)
    copy(d + "btn_wood_oak_grain.png", "ui8_btn_oak", btn)
    copy(d + "btn_wood_leaf_green.png", "ui8_btn_green", btn)
    copy(d + "btn_wood_olive_secondary.png", "ui8_btn_olive", btn)
    copy(d + "btn_wood_crimson_red.png", "ui8_btn_red", btn)
    copy(d + "btn_wood_disabled_muted.png", "ui8_btn_disabled", btn)
    copy(d + "toggle_permission_on_green.png", "ui8_toggle_on")
    copy(d + "toggle_permission_off_dark.png", "ui8_toggle_off")
    copy(d + "btn_header_close_x_wood.png", "ui8_btn_close")
    copy(d + "btn_stat_plus_wood.png", "ui8_btn_plus")
    copy(d + "btn_qty_minus_wood.png", "ui8_btn_minus")

    # 4) 낚시·화로·스킬트리·전환
    d = "04_fishing_furnace_skilltree_transition/"
    copy(d + "fishing_minigame_wood_board.png", "ui8_fish_board", (28, 28, 28, 28))
    track = src(d + "fishing_gauge_track_empty.png")
    save(track, "ui8_fish_track", (30, 30, 0, 0))
    amber = colour_capsule(src(d + "fishing_gauge_amber_progress_bar.png"), 120)
    save(amber, "ui8_fish_fill_amber", (amber.height // 2, amber.height // 2, 0, 0))
    red = colour_capsule(src(d + "fishing_gauge_red_danger_bar.png"), 160)
    save(red, "ui8_fish_fill_red", (red.height // 2, red.height // 2, 0, 0))
    cream = recolour(red, (234, 224, 213))
    save(cream, "ui8_fish_fill_cream", (cream.height // 2, cream.height // 2, 0, 0))
    copy(d + "furnace_smelting_arrow_empty.png", "ui8_furnace_arrow_empty")
    copy(d + "furnace_smelting_arrow_filled.png", "ui8_furnace_arrow_fill")
    copy(d + "skilltree_node_wood_frame.png", "ui8_skill_node", (24, 24, 20, 20))
    copy(d + "transition_location_wood_badge_left.png", "ui8_badge_left", (36, 36, 0, 0))
    copy(d + "transition_location_wood_badge_right.png", "ui8_badge_right", (36, 36, 0, 0))
    copy(d + "transition_tip_filigree_plaque.png", "ui8_tip_plaque", (40, 40, 36, 36))

    # 5) HUD
    d = "05_hud_slots_and_action_buttons/"
    copy(d + "hud_status_wood_parchment_card.png", "ui8_status_card", (40, 40, 80, 40))
    copy(d + "slot_octagon_darkwood_normal.png", "ui8_slot", (40, 40, 40, 40))
    copy(d + "slot_octagon_gold_selected.png", "ui8_slot_sel", (44, 44, 44, 44))
    copy(d + "slot_octagon_green_equipped.png", "ui8_slot_equip", (44, 44, 44, 44))
    copy(d + "btn_hud_attack_mine_large.png", "ui8_hud_attack")
    copy(d + "btn_hud_jump_wings.png", "ui8_hud_jump")
    copy(d + "btn_hud_interact_bolt.png", "ui8_hud_interact")
    copy(d + "btn_hud_info_helmet.png", "ui8_hud_info")
    copy(d + "btn_hud_craft_cube.png", "ui8_hud_craft")
    copy(d + "btn_hud_bag_backpack.png", "ui8_hud_bag")
    hp = src(d + "gauge_hp_red_bar.png")
    t = hud_track(hp)
    save(t, "ui8_gauge_track", (t.height // 2, t.height // 2, 0, 0))
    for key, f in (("hp", "gauge_hp_red_bar"), ("mp", "gauge_mp_blue_bar"),
                   ("st", "gauge_stamina_yellow_bar"), ("exp", "gauge_exp_green_bar")):
        cap = colour_capsule(src(d + f + ".png"), 150)
        save(cap, "ui8_gauge_" + key, (cap.height // 2, cap.height // 2, 0, 0))

    # 6) 아이콘
    d = "06_custom_game_icons/"
    for f in sorted(os.listdir(os.path.join(HERE, d))):
        im = src(d + f)
        if im.size == (96, 96):
            im = clean_icon(im)
        save(im, "ui8_" + f[:-4])

    # 7) 팩에 없는 것 — v7 에서 보충 (평면이라 작은 부품만)
    for rel, name, b in (("buttons/tab_pill_active_amber.png", "ui8_tab_on", (17, 17, 0, 0)),
                         ("buttons/tab_pill_inactive_wood.png", "ui8_tab_off", (17, 17, 0, 0)),
                         ("slots/quickslot_cell_normal.png", "ui8_quick_cell", (12, 12, 12, 12)),
                         ("slots/quickslot_cell_selected.png", "ui8_quick_cell_sel", (12, 12, 12, 12)),
                         ("frames/input_field_recessed_parchment.png", "ui8_input", (10, 10, 10, 10)),
                         ("frames/prompt_pill_badge_dark_wood.png", "ui8_pill_badge", (16, 16, 0, 0))):
        save(Image.open(os.path.join(V7, rel)).convert("RGBA"), name, b)

    with open(os.path.join(OUT, "ui8_borders.json"), "w", encoding="utf-8") as fp:
        json.dump(borders, fp, indent=1, ensure_ascii=False)
    print(f"total png: {len([f for f in os.listdir(OUT) if f.endswith('.png')])}, sliced: {len(borders)}")


if __name__ == "__main__":
    main()
