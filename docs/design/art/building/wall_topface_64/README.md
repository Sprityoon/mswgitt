# 연속 윗면 + 남쪽 앞면 벽 16종

요청한 코어키퍼 벽 문법으로 제작한 64px 연결 타일 시트(2026-10-05).

- 최종 파일: `wall_16_64.png` — 256×256px, RGBA, 4×4, 칸마다 64×64px.
- 확대 확인용: `wall_16_64@4x.png` — 최근접 4배. 등록용은 원본 PNG.
- 구성 확인용: `preview_room.png` — 잔디 위 사각형 방·T자·십자 연결. Maker 화면이 아닌 오프라인 합성.
- 픽셀 원본: `wall_16_64.pxg`. 생성 원본: `generated_source.png`. 내장 imagegen 사용, 프롬프트는 `generation_prompt.txt`.

## 타일 순서

N=1, E=2, S=4, W=8. 마스크 0~15를 왼쪽부터, 위에서 아래로 배치한다.

| 행 | 1열 | 2열 | 3열 | 4열 |
|---|---|---|---|---|
| 1 | 없음 | N | E | N+E |
| 2 | S | N+S | E+S | N+E+S |
| 3 | W | N+W | E+W | N+E+W |
| 4 | S+W | N+S+W | E+S+W | N+E+S+W |

## 구조

- 거의 검은 갈색 윗면. 내부 연결 경계에 외곽선·기둥·보 없음.
- N/E/W 중 벽 이웃이 없는 변에만 3px 나무 테두리.
- S 이웃이 없으면 윗면 y=0~28, 앞면 y=29~63(35px, 54.6875%).
- 앞면 공통 띠: 목재 입술 y=29~34, 회벽 y=35~53, 돌받침 y=54~62, 진갈색 아랫변 y=63.
- S 이웃이 있으면 전체 높이가 윗면. 모든 칸은 완전히 채워져 있으므로 빈 영역/마젠타 픽셀은 0개다. #FF00FF 배경 규칙은 빈 영역이 생길 때만 적용한다.

## 제작·검증

요청한 구조는 기존 원본의 기둥식 연결 부품과 다르므로 신규 제작했다. 공식 리소스 MCP 도구는 연결되지 않아 공식 후보 적합성 검토는 미수행이다.

1. 이미지 생성 1차: 재질과 마스크 배열을 확인. 앞면 높이와 내부 세로 경계선이 부적합해 수정 요청.
2. 이미지 생성 2차: 앞면 일부 경계가 개선됐으나 테두리 위치와 높이 오류가 남음. 생성물의 재질을 48색 PXG로 정리하고 공통 부품을 사용해 정확한 마스크로 재조립.
3. 최종 시트: 동일한 35px 앞면과 3px 테두리 확인. 방·T자·십자 목업에서 기둥 없는 윗면 연결 확인. 최종 목업 비평에서 추가 수정 사항 없음.

`verification.json`: 16개 마스크의 치수·불투명 영역·앞면 띠 위치, 호환되는 북/남 프로필의 좌우 경계 16쌍, 동/서 프로필의 남북 어두운 윗면 경계 16쌍 검사. `preview_room.py`에서 실제 납품 PNG의 치수·알파·공통 앞면·좌우 경계 재검사. `pixeltool check`에서 전체 점유·아랫변·중앙·불투명 경계 통과.

게임 등록·타일셋 교체·충돌 설정은 수행하지 않았다. **refresh 검증 보류(MCP 미연결)**. **런타임 검증 보류(제작자 수행)**.

## 재현

프로젝트 루트에서 아래 명령을 순서대로 실행한다.

```powershell
node docs/design/art/building/wall_topface_64/finish_wall.cjs
python .agents/skills/image-to-pixel/scripts/pixeltool.py render docs/design/art/building/wall_topface_64/wall_16_64.pxg -o docs/design/art/building/wall_topface_64/wall_16_64.png --preview 4
python docs/design/art/building/wall_topface_64/preview_room.py
```
