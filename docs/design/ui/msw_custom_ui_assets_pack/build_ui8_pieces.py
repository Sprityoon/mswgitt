"""ui8 늘림 판 → 조각 PNG (2026-10-17).

Maker 로 가져온 스프라이트(assetKind 1)는 리소스 저장소 API 로 9-slice 경계를 넣을 수 없었다
(요청은 ok 이지만 버전·속성 변화 없음). MaskComponent 는 .ui 로드를 깨뜨린다(pitfalls #49).
그래서 늘어나는 판을 조각으로 잘라 UI 에서 앵커로 조립한다 — 부모 크기만 바꾸면 조각이 따라온다.

- 9조각(tl t tr / l c r / bl b br): 상하좌우 모두 늘어나는 창·패널.
- 3조각(l c r): 높이가 정해진 줄·버튼·게이지·탭. 양 끝 조각은 UI 높이에 맞춰 비율 그대로 축소된다.
- 경계값은 ui8_import/ui8_borders.json 과 같다(3조각은 좌우 값만 쓴다).
- 출력: ui8_import2/ui8p_<이름>_<조각>.png + ui8_pieces.json (조각 크기 기록)

실행: python -I build_ui8_pieces.py   (build_ui8_assets.py 를 먼저 실행)
"""
import json
import os
import shutil

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "ui8_import")
OUT = os.path.join(HERE, "ui8_import2")

NINE = ["ui8_popup_frame", "ui8_subpanel", "ui8_dialog_frame",
        "ui8_darkwood_filigree", "ui8_fish_board", "ui8_status_card"]
THREE = ["ui8_row", "ui8_row_sel", "ui8_row_wide", "ui8_row_wide_sel",
         "ui8_btn_amber", "ui8_btn_oak", "ui8_btn_green", "ui8_btn_olive", "ui8_btn_red", "ui8_btn_disabled",
         "ui8_fish_track", "ui8_fish_fill_amber", "ui8_fish_fill_red", "ui8_fish_fill_cream",
         "ui8_badge_left", "ui8_badge_right", "ui8_tip_plaque", "ui8_skill_node",
         "ui8_gauge_track", "ui8_gauge_hp", "ui8_gauge_mp", "ui8_gauge_st", "ui8_gauge_exp",
         "ui8_tab_on", "ui8_tab_off", "ui8_input", "ui8_pill_badge",
         "ui8_toast_leaf", "ui8_dialog_nameplate", "ui8_scroll_banner"]


def main():
    borders = json.load(open(os.path.join(SRC, "ui8_borders.json"), encoding="utf-8"))
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    meta = {}
    n = 0
    for name in NINE + THREE:
        im = Image.open(os.path.join(SRC, name + ".png")).convert("RGBA")
        w, h = im.size
        b = borders[name]
        L, R = b["left"], b["right"]
        base = name.replace("ui8_", "ui8p_", 1)
        if name in NINE:
            T, B = b["top"], b["bottom"]
            xs = {"l": (0, L), "m": (L, w - R), "r": (w - R, w)}
            ys = {"t": (0, T), "m": (T, h - B), "b": (h - B, h)}
            keys = {("t", "l"): "tl", ("t", "m"): "t", ("t", "r"): "tr",
                    ("m", "l"): "l", ("m", "m"): "c", ("m", "r"): "r",
                    ("b", "l"): "bl", ("b", "m"): "b", ("b", "r"): "br"}
            for (yk, xk), k in keys.items():
                x0, x1 = xs[xk]
                y0, y1 = ys[yk]
                im.crop((x0, y0, x1, y1)).save(os.path.join(OUT, f"{base}_{k}.png"))
                n += 1
            meta[name] = {"kind": 9, "size": [w, h], "border": [L, R, T, B]}
        else:
            for k, (x0, x1) in {"l": (0, L), "c": (L, w - R), "r": (w - R, w)}.items():
                im.crop((x0, 0, x1, h)).save(os.path.join(OUT, f"{base}_{k}.png"))
                n += 1
            meta[name] = {"kind": 3, "size": [w, h], "border": [L, R, 0, 0]}
    json.dump(meta, open(os.path.join(HERE, "ui8_pieces.json"), "w", encoding="utf-8"), indent=1)
    print("pieces:", n, "assets:", len(meta))


if __name__ == "__main__":
    main()
