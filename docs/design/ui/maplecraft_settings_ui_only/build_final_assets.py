"""환경설정 UI — HiRes 원본 → MSW 임포트용 최종 PNG (2026-10-15).

- 입력: 1_Original_HiRes_PNG/*.png (2_MSW_TargetSize_PNG 는 쓰지 않는다)
- 출력: 4_Final_MSW_PNG/mc_set_*.png — 화면 배치 크기의 2배.
- 보정 함수(헤일로 제거·알파 bbox·9-slice·premultiplied 리샘플)는 시작 화면 스크립트와 같은 것을 쓴다.
- 10b 채움 바는 테두리+초록+빈 트랙이 한 장에 합쳐진 완성형이라, 초록 띠(테두리 안쪽)만 잘라
  가로로 균일한 채움 이미지로 만든다 → SliderComponent.FillRectImageRUID 가 늘려도 모양이 안 깨진다.

실행: python build_final_assets.py   (Pillow 만 필요)
"""
import importlib.util
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "1_Original_HiRes_PNG")
OUT = os.path.join(HERE, "4_Final_MSW_PNG")

_spec = importlib.util.spec_from_file_location(
    "start_assets", os.path.join(HERE, "..", "maplecraft_start_ui_assets", "build_final_assets.py"))
_m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_m)
crop_alpha, remove_halo, rs, nine_slice = _m.crop_alpha, _m.remove_halo, _m.rs, _m.nine_slice


def load(name):
    im = Image.open(os.path.join(SRC, name)).convert("RGBA")
    im = crop_alpha(im)
    im, n = remove_halo(im)
    im = crop_alpha(im)
    print(f"  {name}: halo={n} -> {im.size}")
    return im


def green_band():
    """10b 에서 초록 채움 띠만: 초록이 시작되는 행~끝나는 행, 가로는 가운데 균일 구간."""
    im = Image.open(os.path.join(SRC, "10b_UI_Slider_Bar_Filled.png")).convert("RGBA")
    px = im.load()
    x = 300
    rows = [y for y in range(im.height) if px[x, y][1] > px[x, y][0] + 30 and px[x, y][3] > 0]
    y0, y1 = min(rows), max(rows) + 1
    band = im.crop((120, y0, 680, y1))
    print(f"  fill band rows {y0}..{y1} -> {band.size}")
    return band


def save(im, name):
    os.makedirs(OUT, exist_ok=True)
    im.save(os.path.join(OUT, name))
    print(f"-> {name} {im.size}")


def main():
    track = load("10a_UI_Slider_Track_Empty.png")
    knob = load("10c_UI_Slider_Handle_Knob.png")
    snd_on = load("10d_UI_Btn_Sound_On.png")
    snd_off = load("10e_UI_Btn_Sound_Mute.png")
    sw_on = load("11a_UI_Toggle_Switch_On.png")
    sw_off = load("11b_UI_Toggle_Switch_Off.png")
    key_sq = load("12b_UI_Badge_Keycap_Square.png")
    key_wd = load("12c_UI_Badge_Keycap_Wide.png")
    gray = load("../../maplecraft_start_ui_assets/1_Original_HiRes_PNG/09b_UI_Btn_Tab_Inactive_Gray.png")
    olive = load("../../maplecraft_start_ui_assets/1_Original_HiRes_PNG/09c_UI_Btn_Action_Primary_Olive.png")

    # D = 화면 크기. 레이아웃 수치는 scripts/build_settings_ui_20261015.cjs 와 맞춘다.
    save(nine_slice(track, 300, 44, 60, 60, 40, 40, 0.3), "mc_set_slider_track.png")      # D 150×22
    save(rs(green_band(), 64, 28), "mc_set_slider_fill.png")                              # 가로로 늘려 쓰는 채움
    save(rs(knob, 60, 64), "mc_set_slider_knob.png")                                      # D 30×32
    save(rs(snd_on, 80, 80), "mc_set_sound_on.png")                                       # D 40×40
    save(rs(snd_off, 80, 80), "mc_set_sound_mute.png")
    save(rs(sw_on, 168, 90), "mc_set_switch_on.png")                                      # D 84×45
    save(rs(sw_off, 168, 90), "mc_set_switch_off.png")
    save(nine_slice(key_sq, 72, 72, 50, 50, 40, 60, 0.3), "mc_set_keycap_sq.png")         # D 36×36
    save(nine_slice(key_wd, 180, 72, 60, 60, 40, 60, 0.3), "mc_set_keycap_wide.png")      # D 90×36
    save(nine_slice(gray, 340, 104, 80, 80, 60, 60, 0.5), "mc_set_btn_gray.png")           # D 170×52
    save(nine_slice(olive, 340, 104, 70, 70, 60, 60, 0.5), "mc_set_btn_olive.png")         # D 170×52


if __name__ == "__main__":
    main()
