# 건축 타일셋 템플릿 (2×2 칸 문법) — 2026-10-05

제작자 레퍼런스(스타듀풍 실내 평면)의 벽 문법을 우리 규격으로 옮긴 **칠하기용 밑그림**이다. 영역별 단색 자리에 질감만 입히면, 이 폴더의 스크립트가 잘라서 그대로 집을 조립한다.

| 파일 | 용도 |
|---|---|
| `template_blank.png` | **칠할 원본** 512×448 (64px × 8열 × 7행). 영역 단색 22개 + 투명, 글자·선 없음 |
| `template_guide.png` | 2배 확대 + 칸 이름 + 영역 범례 (참고용 — 이것 위에 칠하지 말 것) |
| `preview_house.png` | 템플릿 조각만으로 조립한 예시 집 (구조 검증) |
| `zones.json` | 영역 색·이름·설명, 칸 이름 ↔ 시트 좌표, 앞면 띠 y 구간 |
| `build_template.py` | 생성기 · 검사(`--check`) · 칠한 시트 조립(`--compose`) — 타일 선택 규칙 `quadrants()` 의 단일 소스 |

## 1. 벽 문법

- **배치 한 칸 = 64px 타일 2×2 (128px = 2유닛)**. 벽 한 칸은 타일 4장으로 그린다. 플레이어 키 = 1칸 높이.
- **남쪽 칸도 벽 → 윗면 칸**: 칸 전체가 어두운 윗면(레퍼런스의 검은 영역). 북·동·서 변 중 **윗면이 아닌 칸**(빈 칸이나 앞면 칸)과 맞닿은 변에 트림(12px)을 두른다. 두께 2칸 ㄱ자의 안쪽 꺾임은 모서리 조각(`top_nub`)이 메운다.
- **남쪽 칸이 빔 → 앞면 칸**: 칸 전체가 벽 앞면(키 높이). 맨 위 12px는 항상 트림이다.
  - 앞면 종류는 **남쪽 칸에 건축 바닥이 있으면 내벽, 없으면 외벽**이다. 방의 북벽은 내벽, 집의 남벽은 바깥에서 보이는 외벽이 된다.
  - 옆 칸이 비면 그쪽 끝에 세로 트림이 붙는다. 옆이 윗면 칸이면 그 칸이 트림을 그린다.
- 결과: 방은 트림으로 둘러싸이고, 북벽에는 벽지 앞면, 남쪽 바깥에는 외벽 앞면이 보이며, 칸막이와 옆벽은 "어두운 윗면 + 양쪽 트림"이 된다. 그림이 자기 칸(2×2) 안에서 끝나므로 타일을 캐릭터 아래에 그려도 앞뒤가 맞고, 벽용 오브젝트는 0개다.
- 고유 타일: 윗면 8 + 내벽 앞면 6 + 외벽 앞면 6 = **20장**. 문(내·외 × 닫힘·열림) 4개와 창(내·외) 2개는 2×2 캔버스이고, 바닥은 4장이다.
- 문·창은 **양옆이 벽인 가로벽 칸**에만 놓는다. 끝 칸이나 세로벽에는 놓지 않는다.

## 2. 앞면 가로 띠 (칸 기준 y, 모든 앞면·문·창 공통)

| y | 영역 | 내벽 예 | 외벽 예 |
|---|---|---|---|
| 0~11 | TRIM | 나무 몰딩 | 나무 몰딩 |
| 12~15 | CROWN | 그늘 | 그늘 |
| 16~83 | MAIN | 벽지·회벽·벽돌 | 판자·통나무 사이딩 |
| 84~89 | RAIL | 체어레일 | 띠장 |
| 90~119 | WAIN | 징두리 판자 | 돌 기초 |
| 120~127 | BASE | 걸레받이 | 기초 아랫단 |

## 3. 칠하는 규칙 (꼭 지킬 것만)

1. **시트 크기와 영역 경계 픽셀을 바꾸지 않는다.** 영역을 옮기거나, 늘리거나, 지우거나, 새로 만들지 않는다. 투명 칸은 투명으로 둔다. 큰 해상도로 작업했다면 정확히 2배(1024×896)나 4배로 주면 이쪽에서 줄인다.
2. **같은 영역은 모든 칸에서 같은 재질**로 칠한다. 칸끼리 어떤 순서로 붙어도 이어져야 한다.
3. **가로 무늬(벽지·사이딩·돌·트림 결)는 64px 주기로 반복**한다. 32px 주기도 된다. `U_M` 과 `U_M2` 는 같은 칸의 변형이라, 서로 바꿔 붙여도 이어져야 한다.
4. **윗면(TOP)과 바닥은 가로·세로 모두 64px 이음매 없이** 칠한다.
5. 칸 경계를 따라 테두리선이나 그늘을 새로 긋지 않는다. 트림 영역 안에서 트림 자체의 명암을 넣는 것은 괜찮다.
6. 빛은 왼쪽 위에서 온다.
7. 재질 한 벌 = 칠한 시트 한 장이다. 돌집·통나무집 같은 다른 재질은 같은 템플릿을 다시 칠한다.

## 4. 이미지 모델용 프롬프트

첨부 순서: ① `template_blank.png`(칠할 대상) ② `template_guide.png`(영역 범례) ③ 그림체 레퍼런스(스타듀풍 실내 평면) ④ `tileimg/FullGrass.png`(바깥 잔디 색 조화용).

```
Paint pixel-art textures onto image 1 and return it at exactly the same size (512x448 px).
Image 1 is a tile template for a top-down 3/4 view cozy farming RPG house, 64x64 px tiles.
Every flat color in image 1 is a placeholder for one material. Image 2 shows the region names.
Keep every region exactly where it is: same pixel boundaries, nothing moved, resized, added or
removed. Transparent pixels stay transparent. No text, no grid lines.

Style: like image 3 (cozy pixel-art house interior: warm wood trims, homey wallpapers, dark wall
tops), colors that sit well next to the bright grass in image 4. Light from the upper-left.

Materials:
- Dark slate regions = the top of the walls seen from above: very dark, almost black, subtle
  texture, seamless in all directions.
- Orange regions = wooden trim molding (12 px wide) along wall edges and across the top of every
  wall face; grain runs along the strip; brighter on the top/left side.
- Thin brown line under the trim = shadow / crown molding.
- Peach wall regions (interior wall): cozy wallpaper or plaster on the upper part, a wooden chair
  rail, wooden wainscot panels below, a dark baseboard at the bottom.
- Light blue wall regions (exterior wall): wooden plank siding on the upper part, a wooden belt
  beam, a stone foundation below, a dark base line at the bottom.
- Door blocks (frame, door leaf, dark opening, threshold) and window blocks (frame, glass, sill):
  a cozy wooden door (closed and open) and a wooden window, matching the wall they sit in.
- The four floor squares: the same warm wooden plank floor, four slight variations, each seamless.

Rules: every region must look the same in every tile where it appears; horizontal patterns
(wallpaper, siding, stone, trim grain) repeat every 64 px so any two tiles placed side by side
continue seamlessly; walls tops and floors are seamless in all directions; do not draw outlines or
shadows along the 64 px tile borders.
```

## 5. 받은 뒤 (AI)

```
python build_template.py --check <칠한.png>     # 크기·투명 영역 일치·이음 경계 색 차이
python build_template.py --compose <칠한.png>   # preview_house_painted.png — 같은 예시 집 조립
```

검사를 통과하면 등록용 스트립(타일 20 + 바닥 4)과 문·창 스프라이트(128×128, 하단 중앙 피벗)로 나눠 넘긴다.
