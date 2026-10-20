"""ui8 9조각 판 → 모서리를 줄여 쓰는 곳용 축소 조각 세트 (2026-10-20).

Maker 가져오기 스프라이트는 줄여 그릴 때 최근접(Point) 필터라 둥근 모서리가 계단처럼 깨지고 겹테두리 선이
뭉개진다(제작자 보고 "지저분한 테두리"). 필터는 바꿀 수 없으므로(API filter_mode 무반영, pitfalls #74)
실제로 쓰이는 모서리 크기로 미리 Lanczos 축소한 조각을 만들어 1:1 로 그리게 한다.

- 모서리 4개: 가로·세로 모두 축소
- 위·아래 변: 두께(세로)만 축소 — 가로는 어차피 늘려 그린다
- 왼·오른 변: 두께(가로)만 축소
- 가운데: 원본 그대로 재사용(무늬 없는 면)

출력: ui8_import4/ui8p_<이름>_s<모서리px>_<조각>.png
키트(ui8_kit.skin9)는 모서리 배율 k<1 일 때 같은 이름의 조각이 등록돼 있으면 자동으로 쓴다.
실행: python -I build_ui8_piece_sized.py
"""
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_ui8_sized import shrink  # noqa: E402  (같은 폴더의 premultiplied Lanczos 축소)

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "ui8_import2")
OUT = os.path.join(HERE, "ui8_import4")

# (9조각 에셋, 원본 모서리 px, 쓰이는 모서리 px) — 쓰이는 크기는 ui/*.ui 의 Skin/tl 실측(2026-10-20)
JOBS = [
    ("darkwood_filigree", 42, 32),  # HUD 채팅창·퀘스트 추적·스킬 툴팁·아이템 툴팁
    ("fish_board", 28, 24),  # 캐릭터 창 전투력 칸
]


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    from PIL import Image

    for name, src_px, dst_px in JOBS:
        k = dst_px / src_px
        for part in ("tl", "tr", "bl", "br", "t", "b", "l", "r"):
            im = Image.open(os.path.join(SRC, f"ui8p_{name}_{part}.png")).convert("RGBA")
            w, h = im.size
            if part in ("t", "b"):
                size = (w, max(1, round(h * k)))
            elif part in ("l", "r"):
                size = (max(1, round(w * k)), h)
            else:
                size = (max(1, round(w * k)), max(1, round(h * k)))
            out = shrink(im, *size)
            fn = f"ui8p_{name}_s{dst_px}_{part}.png"
            out.save(os.path.join(OUT, fn))
            print("->", fn, out.size)
        # 가운데 면은 무늬가 없어 축소할 필요가 없지만, 키트가 세트 단위로 찾으므로 같이 둔다
        c = Image.open(os.path.join(SRC, f"ui8p_{name}_c.png"))
        c.save(os.path.join(OUT, f"ui8p_{name}_s{dst_px}_c.png"))
        print("->", f"ui8p_{name}_s{dst_px}_c.png", c.size)


if __name__ == "__main__":
    main()
