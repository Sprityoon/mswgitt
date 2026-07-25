# T87 작업 보고서 — 워크스페이스 위생 — `RootDesk/MyDesk/` 최상위 자산 정리

- **작업**: T87 워크스페이스 위생 — `RootDesk/MyDesk/` 최상위 자산 정리 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0) | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High), Maker 기동 환경 (MCP refresh 완료)
- **날짜**: 2026-07-25

## 1. 요약 (3~5줄)

`docs/agents/directory-structure.md` 디렉터리 규약 및 `msw-general` 절대원칙 12를 준수하여 `RootDesk/MyDesk/` 최상위에 방치되어 있던 자산 9개를 소속 카테고리 디렉터리 및 보존 디렉터리로 분리 이동했습니다.
비-MSW 작업 원본 파일 6개(`.png`/`.pxg`)는 `scratch/artwork_rework/source/`로, `.sprite` 파일 4개는 `MapObjects/Sprites/`로, `_reticle.sprite` 1개는 `UI/Sprites/`로 안전 수칙(2단계 이동+refresh 검증)에 따라 이동 완료했습니다.
`maker_refresh_workspace` 빌드 결과 Error=0 (total 587 logs) 및 신규 Warning 0건을 유지하며 통과했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/shop.png` | `scratch/artwork_rework/source/shop.png`로 이동 |
| `RootDesk/MyDesk/shop.pxg` | `scratch/artwork_rework/source/shop.pxg`로 이동 |
| `RootDesk/MyDesk/lacheln_house_topdown.png` | `scratch/artwork_rework/source/lacheln_house_topdown.png`로 이동 |
| `RootDesk/MyDesk/lacheln_house_topdown.pxg` | `scratch/artwork_rework/source/lacheln_house_topdown.pxg`로 이동 |
| `RootDesk/MyDesk/lacheln_house_front_topdown.png` | `scratch/artwork_rework/source/lacheln_house_front_topdown.png`로 이동 |
| `RootDesk/MyDesk/lacheln_house_front_topdown.pxg` | `scratch/artwork_rework/source/lacheln_house_front_topdown.pxg`로 이동 |
| `RootDesk/MyDesk/msw_topdown_fishing_board_256.sprite` | `RootDesk/MyDesk/MapObjects/Sprites/msw_topdown_fishing_board_256.sprite`로 이동 |
| `RootDesk/MyDesk/msw_topdown_fishing_pond_256.sprite` | `RootDesk/MyDesk/MapObjects/Sprites/msw_topdown_fishing_pond_256.sprite`로 이동 |
| `RootDesk/MyDesk/msw_topdown_quest_board_256.sprite` | `RootDesk/MyDesk/MapObjects/Sprites/msw_topdown_quest_board_256.sprite`로 이동 |
| `RootDesk/MyDesk/shop.sprite` | `RootDesk/MyDesk/MapObjects/Sprites/shop.sprite`로 이동 |
| `RootDesk/MyDesk/`_reticle.sprite` | `RootDesk/MyDesk/UI/Sprites/_reticle.sprite`로 이동 |

## 3. 구현 상세

- **2단계 안전 이동 절차 수행**:
  1. 1단계: 원본 `.png`/`.pxg` 6개 이동 → `maker_refresh_workspace` → logs 확인 (Error 0건).
  2. 2단계: `.sprite` 5개 이동 (`MapObjects/Sprites/`, `UI/Sprites/`) → `maker_refresh_workspace` → logs 확인 (Error 0건).
- **삭제 0건**: 자산을 삭제하지 않고 원본 및 소속 카테고리로 안전 이동만 수행했습니다.
- **최상위 유지 보존**: Maker 자동 생성물인 `.directory` 파일 12개와 타일셋 파일 2개(`tile1.tileset`, `wall.tileset`)는 규약에 따라 최상위 구성을 유지했습니다.

## 4. 수행한 검증과 결과

- **RootDesk/MyDesk 최상위 구성 실측**:
  - `list_dir` 실측 결과: 서브디렉터리 12개, `.directory` 파일 12개, 타일셋 2개 외 방치 파일 **0개**.
- **Maker Refresh 빌드 검증**:
  - `maker_refresh_workspace` 호출 → **Error=0** (total 587 / Warning 85 / Info 502).

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 상점 건물, 낚시 게시판, 의뢰 게시판, 연못 스프라이트 렌더링에 이상이 없는가
- [ ] 조준 리티클(`_reticle`) 아이콘 표시가 정상 유지되는가

## 7. 이력

- 2026-07-25 최초 작성 (Gemini 3.6 Flash High)
