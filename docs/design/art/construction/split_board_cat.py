# -*- coding: utf-8 -*-
"""board_notice_roof.png → 게시판(고양이 제거) + 고양이 낱장. 고양이는 지붕 마룻대(y64) 위에 앉아 있어 그 위만 오린다."""
from PIL import Image
SRC = Image.open("board_notice_roof.png").convert("RGBA")
BOX = (130, 0, 243, 63)          # 고양이 (지붕 윤곽선 y63 위, 오른쪽 덩굴 x245~ 제외)
cat = SRC.crop(BOX)
cat.save("board_cat.png")
board = SRC.copy()
board.paste(Image.new("RGBA", (BOX[2] - BOX[0], BOX[3] - BOX[1]), (0, 0, 0, 0)), BOX[:2])
board.save("board_notice_roof_nocat.png")
W, H = SRC.size
cx, cy = (BOX[0] + BOX[2]) / 2, (BOX[1] + BOX[3]) / 2
print("board", SRC.size, "cat", cat.size,
      "cat offset from board center (units, y up) = (%.3f, %.3f)" % ((cx - W / 2) / 100, (H / 2 - cy) / 100))
# 확인: 합치면 원본과 같아야 한다
re = board.copy(); re.alpha_composite(cat, BOX[:2])
print("recompose identical:", re.tobytes() == SRC.tobytes())
