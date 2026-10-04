# 목재·회벽 건축 타일셋 — 64px 아트 시안

- 제작자 요청: 건축 시험 모드를 해제하고 아트 제작만 진행(2026-10-05).
- `tileset_64.png`: 512×256px, 8열×4행, 한 칸 64×64px, RGBA.
- `tiles/`: 동일 시트에서 자른 64×64px 개별 PNG 32개. 이름의 r/c는 1부터 시작하는 행/열.
- `tileset_64@3x.png`: 최근접 3배 확대 미리보기. 등록용이 아니다.
- `tileset.pxg`: 수정 가능한 픽셀·팔레트 원본. `tileset_source.png`: 이미지 생성 원본.
- 내장 이미지 생성 도구 사용. 프롬프트: `generation_prompt.txt`.

## 구성

| 행 | 구성 |
|---|---|
| 1 | 가로·세로 나무판 바닥, 밝은 돌바닥, 나무판 변형 총 8개 |
| 2 | 회벽·목재·돌받침 직선 벽 총 8개 |
| 3 | 벽 모서리·꺾임 시안 총 8개 |
| 4 | 끝단 4개, 접합부 2개, 문틀 1개, 창문 1개 |

## 제작·검수 범위

현재 잔디(FullGrass, 64×64)와 화로(furnace_v2)의 따뜻한 픽셀 질감을 기준으로 제작했다. 공식 리소스 검색 API는 연결 실패(fetch failed)하여 후보의 적합 여부는 확인하지 못했다.

1차 비평: 최초 생성물의 대각·등각 모서리와 매끈한 질감을 수정 요청했다.
2차 비평: 수평·수직 모듈 시점을 재검토하고 64px 도트 밀도로 마감했다. PXG에서 창문 유리의 회갈색 픽셀을 청회색 명암으로 직접 정리했다.

치수·알파·개별 파일 규격과 바닥 8칸의 불투명 여부를 검사했다. **아트 시안이며 자동 연결·반복 경계·모든 방향의 시점 정합을 게임에서 검증한 정식 타일셋은 아니다.** 등록·타일셋 교체·충돌·건축 코드 수정은 하지 않았다. 실제 조립 전 연결 경계와 중복 기둥을 확인해야 한다.

## 원본 재렌더

프로젝트 루트에서:

```powershell
python .agents/skills/image-to-pixel/scripts/pixeltool.py render docs/design/art/building/woodland_64/tileset.pxg -o docs/design/art/building/woodland_64/tileset_64.png --preview 3
```

---

## 4×4 자동 연결 벽 타일셋 (Low Timber-Frame Wall, 2026-10-05)

- **규격**: 4×4 그리드 (총 16칸, 각 64×64px), 마젠타(`#FF00FF`) 배경 원본 및 투명 RGBA 타일셋.
- **화풍**: 따뜻한 갈색 목재 보(iron nails), 크림색 회벽 패널, 연베이지 돌받침, 진갈색 외곽선, 좌상단 광원, 3/4 RPG 뷰.
- **건축 규칙**:
  - 수평 벽: 앞면 높이 약 80%(51px, y=13..63), 아랫변 = 셀 아랫변(y=63 바닥 밀착).
  - 수직 벽: 너비 약 2/3(42px), 가로 중앙 정렬.
  - 이음매(Seamless): 경계선에서 기둥/외곽선 없이 이웃 칸과 100% 매끄럽게 연결.
- **16칸 비트마스크 순서 (N=1, E=2, S=4, W=8)**:
  - Row 1: `00` 외딴 기둥, `01` N끝, `02` E끝, `03` N+E 코너(└)
  - Row 2: `04` S끝, `05` N+S 세로벽(│), `06` E+S 코너(┌), `07` N+E+S ├ 삼거리
  - Row 3: `08` W끝, `09` N+W 코너(┘), `10` E+W 가로벽(─), `11` N+E+W ┴ 삼거리
  - Row 4: `12` S+W 코너(┐), `13` N+S+W ┤ 삼거리, `14` E+S+W ┬ 삼거리, `15` N+E+S+W ┼ 십자
- **단면 무결성 검증 (Cross-Section Verification)**:
  - 수평 연결(E-W): 경계 단차 0px (100% Seamless)
  - 북쪽 유입 세로벽(N): 경계 단차 0px (100% Seamless)
  - 세로벽 상하 타일링 루프(N-S): 경계 단차 0px (100% Seamless)
  - `compose_connect_v2.py` 실행 결과: `Verified: True` (Error=0)
- **산출물 목록**:
  - `wall_connect_4x4_magenta.png` (256×256px, 마젠타 배경 4×4 캔버스)
  - `wall_connect_4x4_magenta@4x.png` (1024×1024px, 4배 확대 미리보기)
  - `wall_connect_4x4_transparent.png` (256×256px, 투명 배경)
  - `connect/tiles/BuildWoodWall00.png` ~ `BuildWoodWall15.png` (개별 64×64px 타일 16개)
  - `connect/BuildWood_strip.png` (게임 등록용 64px 가로 스트립)
  - `connect/sheet_connect.png` (잔디 배경 타일 시트 프리뷰)
  - `connect/mockup_room.png` (잔디 위 복합 방 조립 + 2칸 인물 스케일 검증 목업)

---

## 코어키퍼(Core Keeper) 스타일 벽 타일셋 (2026-10-05)

- **배경 및 학습**: 코어키퍼 인게임 스크린샷의 벽 형태학(Morphology)을 분석·학습하여 타일셋을 재설계.
- **코어키퍼 벽의 3대 형태 특성**:
  1. **벽 윗면(Top Cap)**: 모든 벽 상단에 짙은 밤색 목재 보(테두리 + 철제 못)가 윗면 단면으로 지나감.
  2. **북쪽 수평 벽(Back Wall)**: 상단 Top Cap 아래로 높은 수직 전면 벽체(목재 보 + 대각선 가새 + 크림색 회벽 패널 + 연베이지 벽돌 돌받침)가 펼쳐져 벽걸이 장식(횃불, 액자, 벽난로 등)이 걸릴 수 있는 시원한 벽면 제공.
  3. **세로 벽(Side Wall)**: 정면이 보이지 않고, 위에서 내려다본 수직 목재 윗면 기둥(Top surface)이 위아래로 관통하며 바닥에 부드러운 그림자가 깔림.
  4. **코너 & 교차**: 벽 윗면이 직각으로 꺾이며 사각 코너 기둥에서 견고하게 결합.
- **그림체 유지**: `woodland_64` 고유의 따뜻한 꿀갈색 목재, 작은 철제 못, 크림색 회벽, 연베이지 벽돌 돌받침, 진갈색 외곽선, 64px 도트 밀도 100% 적용.
- **산출물**:
  - `wall_corekeeper_4x4_magenta.png` (256×256px, 4×4 마젠타 배경 타일셋 원본)
  - `wall_corekeeper_4x4_magenta@4x.png` (1024×1024px, 4배 확대 미리보기)
  - `wall_corekeeper_4x4_transparent.png` (256×256px, 투명 배경 타일셋)
  - `wall_corekeeper_4x4_transparent@4x.png` (1024×1024px, 투명 4배 확대)
  - `corekeeper_tiles/` (`CK_Wall_00.png` ~ `CK_Wall_15.png` 개별 64×64px 타일 16개)
  - `wall_corekeeper_strip.png` (게임 등록용 16칸 가로 스트립)

런타임 검증 보류(제작자 수행).


