---
name: msw-checkpoint
description: 이 프로젝트의 커밋·푸시 절차. 사용자가 "푸시해줘", "깃에 올려", "커밋하자", "체크포인트", "깃 처리"라고 할 때 사용. 커밋 전 문서 동기화 점검(tasks.md 상태·game_design 트래커) → 스테이징 검토 → 컨벤션 커밋 → 푸시. CSV BOM 이슈 등 이 저장소 특유의 함정을 안다.
---

# MSW Checkpoint — 커밋·푸시 절차

## 1. 사전 점검

1. `git status --short` + `git log --oneline -5`로 현재 상태 파악. 예상 밖 변경(내가 만들지 않은 수정)이 있으면 목록을 사용자에게 보여주고 포함 여부 확인.
2. **문서 동기화 점검** — 이번 커밋에 기능 변경이 포함되면:
   - [docs/tasks.md](../../../docs/tasks.md)의 해당 항목 상태가 갱신되어 있는가 (검증 수준 병기 — `refresh Error=N` / `Play 확인 YYYY-MM-DD`)
   - `game_design.md` Phase 트래커 반영이 필요한 설계 변경인가
   - 재발 방지 가치가 있는 실측·사고를 겪었다면 [docs/pitfalls.md](../../../docs/pitfalls.md)에 규칙 18번부터 append했는가
   - 상시 적용될 디자인 결정을 내렸다면 [docs/design-policy.md](../../../docs/design-policy.md)에 날짜와 함께 기록했는가
   - 누락이 있으면 커밋 전에 채운다.
3. 커밋 대상에 `Environment/`, `*.codeblock` 대량 변경이 섞여 있으면 의심할 것 — Maker refresh 부산물은 정상이지만, `Environment/` diff는 비정상(수정 금지 영역).

## 2. 저장소 특유의 함정

- **CSV BOM**: DataSet `.csv`는 git clean 필터(`scripts/git-stripbom.cjs`, 커밋 faa90ea)가 UTF-8 BOM을 제거한다. `git status`에 CSV가 "수정됨"으로 떠도 `git diff`가 비어 보이면 BOM 차이뿐 — 정상이며 그대로 커밋해도 된다. Excel류로 CSV를 열면 BOM이 다시 붙는다.
- 🔴 **MCP 설정 파일 = Bearer 토큰 평문. 절대 추적 금지.** `.mcp.json` 하나만 보면 안 된다 — `mswai`가 **에이전트별 미러**(`.cursor/mcp.json`, `.agents/`, `.codex/`, `.github/`)를 새로 만든다. `.gitignore`에 5경로가 등록돼 있지만, **벤더 동기화·새 에이전트 도입 직후에는 `git status`에 `mcp.json`류가 뜨는지 반드시 확인**할 것.
  > 사고 이력: `.cursor/mcp.json`이 벤더 업데이트로 신규 생성돼 `5beb4c5`에 커밋·푸시됨. 확인 명령: `git ls-files | grep mcp.json` (비어 있어야 정상).
- 경로에 한글이 있으므로 쉘 인자는 항상 큰따옴표+슬래시.

## 3. 커밋

- 메시지 컨벤션: `feat:` / `fix:` / `docs:` / `chore:` 접두사 + 한 줄 요약 (예: `feat: 도감 & 업적 — 통계 카운터 + 도감 UI`). 구 T티켓 산출물을 마무리하는 커밋이면 티켓 번호를 본문에 남겨도 된다.
- 관련 파일만 명시적으로 `git add` (전체 `git add -A`는 사용자가 "모두"라고 했을 때만).
- 훅/서명 우회 옵션(`--no-verify` 등) 금지.

## 4. 푸시

- `git push` 전 `git pull --rebase` 필요 여부 확인 (다른 컴퓨터의 세션이 같은 문서를 갱신했을 수 있음 — 이 프로젝트는 멀티 컴퓨터 운영).
- 충돌 시 `docs/tasks.md`·`docs/pitfalls.md`·`game_design.md`는 **양쪽 내용 보존** 방향으로 병합 (항목 단위로 독립적이라 대부분 양쪽을 남기는 게 맞다).
- 푸시 후 `git log --oneline -3`으로 결과 확인해 보고.
