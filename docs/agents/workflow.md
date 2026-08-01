# 개발 워크플로우 및 MCP 검증 (Workflow & Verification)

> 이 문서는 [AGENTS.md](../../AGENTS.md)의 온디맨드 세부 가이드입니다. 구현·검증 단계 진입 시 로드하십시오.
> MCP 도구 실명 표는 AGENTS.md §4.2에 있습니다 — 이 문서의 도구명도 전부 실명입니다.

## 5단계 워크플로우

1. **Plan (계획)**
   - 변경 유형 분류: New(신규만) / Modify(기존 수정만) / Both.
   - 작업을 검증 가능한 단계로 분해해 에이전트의 작업 목록 도구(TodoWrite / TaskCreate 등 자기 에이전트가 제공하는 것)에 기록. **Verify 단계를 반드시 포함**.
   - T티켓 작업이면 [subagent-handoff.md](./subagent-handoff.md) §1 공통 컨텍스트 + 해당 티켓의 Target/Change/Acceptance를 먼저 읽는다.

2. **Analyze (분석)**
   - API 시그니처: `Environment/**/*.d.mlua`를 Grep으로 검색 (읽기는 허용, 수정 금지).
   - 기존 패턴: 관련 `.mlua`·데이터셋 CSV를 Read로 확인. 크로스 스크립트 호출 예정이면 대상 정의를 먼저 검색(AGENTS.md R6).

3. **Implement (구현)**
   - `.model`/`.ui`/`.map`은 각 빌더(ModelBuilder/UIBuilder/MapBuilder) 경유 — 호출 프로토콜은 msw-general 스킬의 `references/builder-protocol.md` **전문**을 먼저 Read (스킬 시스템으로 로드된 경로 기준. 워크스페이스 `plugins/` 경로를 직접 Read하지 말 것 — 훅이 차단).
   - 프리셋 우선(AGENTS.md R1), 데이터 주도(R3), mlua 문법(R2) 준수.
   - 검증 포인트에 `log()` 추가 (예: `[FISHING]` 같은 태그 접두사) — Play 검증 시 로그 근거로 쓴다.
   - 타입은 `integer`/`number` (`int`/`float` 금지). `SpawnByModelId` parent에 nil 금지.

4. **Verify (검증)** — AGENTS.md §4 표준 체인 그대로. 🔴 **에이전트의 검증 범위는 refresh + 빌드 로그까지다** (AGENTS.md §0 O-2 — Play는 제작자 전담):
   - `maker_refresh_workspace` → status ok 확인
   - `maker_logs(kind="build")` → 빌드 **Error 수 확인·기록** (티켓마다 1회 이상 — 레인 말미로 몰지 말 것). Warning이 baseline 대비 늘었으면 원인과 소유 스크립트까지 밝힌다.
   - 신규 `.mlua`를 만들었으면 refresh 후 **`.codeblock` 생성 여부를 반드시 확인** (쌍이 없으면 스크립트가 등록조차 안 됨).
   - 이후 Play 시나리오는 보고서에 **"런타임 검증 보류(제작자 수행)"** 로 명시. `maker_play`/`maker_stop`/`maker_keyboard_input`/`maker_mouse_input`은 에이전트가 호출하지 않는다.
   - Maker 미가동·MCP 미연결이면 수행한 범위(LSP 진단까지)를 명시하고 **"refresh 검증 보류"**로 보고 — 허위 `Error=0` 기재 금지(R8).

5. **On Failure (실패 시)**
   - ① ExecSpace 확인(`_Service` 호출이 Client/Server 올바른 쪽인지) ② `maker_logs`의 에러 코드로 원인 분류(`[LEA-3004]`=Body 불일치, `[LEA-3005]`=InvalidArgument, `[LEA-3011]`=없는 컬럼) ③ 수정 후 4단계 재실행.
   - `refresh 진행 중` 에러 → 대기 후 재시도.
   - 해결 불가 시 원인 후보와 시도 내역을 정리해 보고 — 임의로 "동작함" 처리 금지.

## RUID 유효성

`SpriteRendererComponent` 등 렌더러 생성 시 `SpriteRUID`를 비워두지 말고 `msw-search` 스킬로 리소스를 검색해 바인딩한다 (빈 문자열 = 에러 없이 안 보임).

## 에이전트별 MCP 연결 실태 (2026-08-01 지휘자 실측)

> 워커 보고서에 반복 등장하던 **"msw-maker-mcp 미연결 / `servers=[]`"** 의 정체를 실측으로 규명한 결과다. **원인이 3종이고 서로 별개**이므로 뭉뚱그려 "MCP 안 됨"으로 보고하지 말 것.

### ① 승인 해시 함정 — Cursor CLI 워커의 `servers=[]` 대부분이 이것

Cursor는 **서버 정의를 해시해 승인을 관리**한다(`~/.cursor/projects/<slug>/mcp-approvals.json`의 `msw-maker-mcp-1a627663f08cc566` 형태). 따라서:

- **`.cursor/mcp.json`을 한 글자라도 고치면 기존 승인이 무효화**된다. `mswai mcp --agent cursor` 재실행도 포함.
- 비대화형(`-p`) 실행은 승인 프롬프트를 띄울 수 없으므로 **조용히 `not loaded (needs approval)`** 로 빠진다 → 워커 눈에는 `servers=[]`.

**대응**: 설정을 건드린 직후 `cursor-agent mcp list`를 한 번 돌려 `ready`를 눈으로 확인하고 배치한다. 워커 킥오프에는 **`--approve-mcps`** 를 붙인다.

### ② HTTP 전송 종료 어서션 — cursor-agent 자체 버그 (우리 설정 무관)

```
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76
```

서버를 하나씩 남기고 격리 테스트한 결과: **`msw-mcp`(HTTP) 단독 → 재현 / `msw-maker-mcp`(stdio) 단독 → 정상**. libuv가 이미 닫히는 중인 async 핸들에 `uv_async_send`를 재호출할 때 나는 **Windows 전용** 어서션이고, 어서션 실패는 `abort()`라 잡을 수 없다. Claude Code·Codex는 같은 엔드포인트·같은 토큰으로 정상이다 — HTTP 클라이언트 구현 차이.

**터지는 시점이 "결과 출력 후 종료 시"** 라 단발 명령의 결과 자체는 온전하다. 대화형/`-p` 세션 종료 때 프로세스가 죽는 게 문제.
**대응**: `cursor-agent update` 우선. 그래도 세션이 죽으면 `.cursor/mcp.json`에서 `msw-mcp`(HTTP)만 빼고 `msw-maker-mcp`(stdio)만 남긴다 — 단, `msw-search`(RUID 조회)가 막히므로 아트 티켓에는 부적합.

### ③ MakerMCP 고아 프로세스 — 모든 에이전트 공통

`msw-maker-mcp.bat`이 `cmd.exe /c call` → `MakerMCP_run.exe` 구조라 **exe가 손자 프로세스**가 된다. cmd이 죽어도 exe는 살아남아 고아가 된다. 그리고 **가장 먼저 뜬 인스턴스가 브리지 포트를 LISTENING으로 점유**하고(`bridge_port.txt`에 기록) 나머지는 그 허브에 붙는다.

즉 **죽은 세션의 고아가 허브를 쥔 상태**가 흔하며, 그게 죽으면 붙어 있던 전원이 Maker 연결을 동시에 잃는다.

**대응**: Cursor와 Claude Code에서 **`refresh`를 동시에 돌리지 말 것**(규칙 11 스테일 저장 사고와 같은 계열). 연결이 이상하면 `MakerMCP_run.exe`를 전부 종료한 뒤 재연결이 가장 빠르다.

### 🔴 MCP 설정 파일은 절대 커밋 금지

`.mcp.json` / `.cursor/mcp.json` 등에는 **msw-mcp Bearer 토큰이 평문**으로 들어간다. `.gitignore`에 5경로(`.mcp.json` · `.cursor` · `.agents` · `.codex` · `.github`)를 등록해 뒀다. `mswai`가 에이전트별 미러를 새로 만들어도 막히지만, **새 에이전트를 도입하면 경로를 추가**할 것.
> 사고 이력: `.cursor/mcp.json`이 벤더 동기화 때 신규 생성되어 `5beb4c5`에 커밋·푸시됨(토큰은 이후 재발급 완료, 해당 값은 폐기). 히스토리 4개 커밋에 구 토큰이 남아 있으나 죽은 값이다.
