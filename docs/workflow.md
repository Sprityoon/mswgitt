# 작업 절차 (Workflow)

> **운영 체제**: 제작자(사람) 1명이 주도하고, AI 어시스턴트가 보조한다.
> 2026-08-06부로 **지휘자 + 구현자 함대 체제는 종료**했다. 구 체제 문서(`conductor-role.md` · `subagent-handoff.md` · 킥오프 프롬프트)는 [agents/](./agents/)에 동결 보존돼 있다.
>
> **역할 분담**: 코드·데이터·모델·UI 편집과 `refresh`·빌드 로그 확인까지는 AI가 수행할 수 있다. **Play 런타임 검증은 제작자 전담**이다.

---

## 1. 5단계 루프

### ① Plan

- 변경 유형 분류: **New**(신규만) / **Modify**(기존 수정만) / **Both**.
- 작업을 검증 가능한 단계로 분해한다. **Verify 단계를 반드시 포함**한다.
- 여러 턴에 걸칠 작업이면 [tasks.md](./tasks.md)에 항목을 추가한다.

### ② Analyze

- **API 시그니처**: `Environment/**/*.d.mlua`를 `Grep`으로 검색 (읽기만 허용, 수정 금지).
- **기존 패턴**: 관련 `.mlua`·데이터셋 CSV를 `Read`로 확인.
- **크로스 스크립트 호출 예정이면 대상 정의를 먼저 검색** ([pitfalls 규칙 8](./pitfalls.md#규칙-8-크로스-스크립트-호출-전-정의를-확인한다)).

### ③ Implement

- `.model` / `.ui` / `.map`은 각 빌더(`ModelBuilder` / `UIBuilder` / `MapBuilder`) 경유. 호출 프로토콜은 `msw-general` 스킬의 `references/builder-protocol.md` **전문**을 먼저 Read.
  - ⛔ 워크스페이스 `plugins/` 경로를 직접 Read하지 말 것 — 훅이 차단한다. 스킬 시스템으로 로드한다.
- 프리셋 우선([AGENTS.md](../AGENTS.md) R1), 데이터 주도(R3), mlua 문법(R2) 준수.
- 검증 포인트에 `log()` 추가 (예: `[FISHING]` 같은 태그 접두사) — Play 검증 시 근거로 쓴다.
- 타입은 `integer` / `number` (`int` / `float` 금지). `SpawnByModelId`의 parent에 nil 금지.

### ④ Verify — 🔴 AI의 검증 범위는 refresh + 빌드 로그까지

```
1) maker_refresh_workspace          → status ok 확인
2) maker_logs(kind="build")         → Error 수 집계 (Error=0 이 게이트)
3) 로그 dateTime이 이번 refresh 시각과 같은지 대조 (규칙 22 — 옛 스냅샷일 수 있다)
4) Warning 수도 함께 확인 — baseline 대비 증가분은 원인·소유 스크립트까지 밝힌다
5) 그 이후 Play 시나리오는 "런타임 검증 보류(제작자 수행)"로 명시
```

- **신규 `.mlua`를 만들었으면 refresh 후 `.codeblock` 생성을 반드시 확인한다.** 쌍이 없으면 스크립트가 등록조차 안 된다.
- 🔴 **build 로그는 refresh마다 갱신되지 않는다** ([규칙 22](./pitfalls.md#규칙-22-build-로그는-refresh마다-갱신되지-않는다--타임스탬프를-확인하라)). `maker_clear_logs`는 `normal`만 지우고 build는 보존하므로 강제로 비울 수단이 없다. **타임스탬프가 어긋나면 `Error=0`을 근거로 쓰지 말 것.**
- **현재 Warning baseline = 17** (2026-08-08 실측, HEAD `3126192`). 내역 전량:

  | 소유 | 코드 | 프로퍼티 | 건수 |
  |---|---|---|---:|
  | `Furnace` | `LWA-4012` | `RecipeTableName` · `StationTitle` · `DurationColumn` | 3 |
  | `MonsterMeleeAttack` | `LWA-4012` | `TouchDamage` | 3 |
  | `MonsterAI` | `LWA-4012` | `ProjectileDamage` · `MinionSummonCount` | 2 |
  | `Monster` | `LWA-4012` | `BossDropMin` · `BossDropMax` | 2 |
  | `SpriteRendererComponent` | `LWA-4012` | `Color` | 1 |
  | (owner 없음) | `LWA-1111` | 인자 `2`/`1` | 6 |

  - ✅ **구 baseline 48은 폐기.** T103(`c6c0a3c`)이 청소한 Prop `LWA-4012` 31건(`SortYOffset` 11 · Occ `Offset*` 20)은 **실측에서 부재**하며, 남은 17건이 종전 문서의 "상시 잔여 17"과 정확히 일치한다. T103 청소는 실효했다.
  - ⚠️ 나흘간(08-05~08-08) 커밋 3건이 계속 "Warning 48"로 기록한 건 **[규칙 22](./pitfalls.md#규칙-22-build-로그는-refresh마다-갱신되지-않는다--타임스탬프를-확인하라)(고착된 build 로그)** 정황이 강하다. **48이 다시 보이면 회귀를 의심하기 전에 로그 `dateTime`부터 대조할 것.**
- `LWA-4012` = 모델에 프로퍼티 기본값 미명시 계열. 스크립트 기본값과 1:1인 프로퍼티를 모델 `Values`에 명시하면 사라진다.
- MCP 미연결이면 LSP 진단까지만 수행하고 **"refresh 검증 보류"** 로 정확히 보고한다. 허위 `Error=0` 기재 금지.

> ⚠️ **build Error=0이 잡지 못하는 것**: `.map` JSON 구조 붕괴([규칙 16](./pitfalls.md#규칙-16-map의-jsonstring은-중첩-객체다--문자열-대입-금지)) · `.ui` 산출물 원복([규칙 11](./pitfalls.md#규칙-11-maker-저장은-워크스페이스-파일을-통째로-재직렬화한다)) · 시각 실루엣 불일치([규칙 17](./pitfalls.md#규칙-17-trigger배치는-스프라이트-실루엣-정합이-1순위다)).

### ⑤ On Failure

1. **ExecSpace 확인** — `_Service` 호출이 Client/Server 올바른 쪽인지.
2. **에러 코드로 원인 분류**:
   | 코드 | 의미 |
   |---|---|
   | `LEA-3004` | TileMapMode ↔ Body 불일치 |
   | `LEA-3005` | InvalidArgument (예: `RowIndex` nil → [규칙 7](./pitfalls.md#규칙-7-userdatarow에는-rowindex가-없다)) |
   | `LEA-3011` | 존재하지 않는 컬럼 `GetItem` |
   | `LEA-3015` | `.map` `jsonString` 문자열 붕괴 → [규칙 16](./pitfalls.md#규칙-16-map의-jsonstring은-중첩-객체다--문자열-대입-금지) |
   | `LWA-4012` | 모델 프로퍼티 기본값 미명시 |
3. 수정 후 ④ 재실행. `refresh 진행 중` 에러는 대기 후 재시도.
4. 해결 불가 시 **원인 후보와 시도 내역을 정리해 보고**한다 — 임의로 "동작함" 처리 금지.

---

## 2. MCP 도구 실명 규약

**서버**: `msw-maker-mcp`

| 구분 | 도구 |
|---|---|
| ✅ AI 사용 가능 | `maker_refresh_workspace`(Play 중 불가) · `maker_logs` · `maker_clear_logs` · `maker_get_current_map` · `maker_get_world_info` |
| ⛔ 제작자 전담 (AI 호출 금지) | `maker_play` · `maker_stop` · `maker_keyboard_input` · `maker_mouse_input` · `maker_execute_script` · `maker_screenshot` · `maker_save` · `maker_move_map` · **`maker_reset_data_storage`**(세이브 파괴) · `maker_import_maplestory_map` |

**예외**: 제작자가 특정 턴에 명시적으로 Play 실행을 지시한 경우에만 허용.

### 보조 스크립트

- `scratch/mcp_probe.py` — 연결/툴 목록
- `scratch/run_lua.py` — Play 컨텍스트 Lua 실행
- `scratch/watch_maker_logs.py` — 로그 감시
  - ⚠️ `if __name__ == "__main__"` 가드가 없어 **import만으로 감시 루프가 즉시 실행**된다. import 금지 — 반드시 `python scratch/watch_maker_logs.py`로 직접 실행할 것.
- MCP bat 경로 리졸버 순서: `MSW_MCP_BAT` 환경변수 → 프로젝트 `.mcp.json`의 `msw-maker-mcp` args → 알려진 설치 경로.

### 연결이 이상할 때

**`MakerMCP_run.exe` 고아 프로세스**가 가장 흔한 원인이다. `msw-maker-mcp.bat`이 `cmd.exe /c call` → `MakerMCP_run.exe` 구조라 exe가 손자 프로세스가 되고, cmd이 죽어도 살아남는다. **가장 먼저 뜬 인스턴스가 브리지 포트를 점유**(`bridge_port.txt`)하고 나머지는 그 허브에 붙으므로, 죽은 세션의 고아가 허브를 쥔 상태가 흔하다.

→ 연결이 이상하면 **`MakerMCP_run.exe`를 전부 종료한 뒤 재연결**이 가장 빠르다.
→ 여러 에디터/세션에서 **`refresh`를 동시에 돌리지 말 것** ([규칙 11](./pitfalls.md#규칙-11-maker-저장은-워크스페이스-파일을-통째로-재직렬화한다) 계열 사고).

### 🔴 MCP 설정 파일은 절대 커밋 금지

`.mcp.json` / `.cursor/mcp.json` 등에는 **msw-mcp Bearer 토큰이 평문**으로 들어간다. `.gitignore`에 5경로(`.mcp.json` · `.cursor` · `.agents` · `.codex` · `.github`)를 등록해 뒀다. **새 에이전트를 도입하면 경로를 추가**할 것.

> 사고 이력: `.cursor/mcp.json`이 벤더 동기화 때 신규 생성돼 `5beb4c5`에 커밋·푸시됐다. 토큰은 재발급 완료, 구 값은 폐기. 히스토리 4개 커밋에 구 토큰이 남아 있으나 죽은 값이다.

---

## 3. 작업 기록

솔로 체제에서는 **보고서 파일을 강제하지 않는다.** 대신:

| 남길 것 | 어디에 |
|---|---|
| 진행 중·예정 작업 | [tasks.md](./tasks.md) |
| 게임 설계 변경·Phase 진행 | [../game_design.md](../game_design.md) (해당 시스템 § + §5 Phase 트래커) |
| 상시 적용되는 디자인 결정 | [design-policy.md](./design-policy.md) |
| **재발 방지 가치가 있는 사고·실측** | [pitfalls.md](./pitfalls.md) — **규칙 18번부터 append**. 번호 재사용 금지 |
| 커밋 | [msw-checkpoint 스킬](../.claude/skills/msw-checkpoint/SKILL.md) 절차 |

> 상세 보고서가 필요할 만큼 큰 작업이면 [agents/reports/_TEMPLATE.md](./agents/reports/_TEMPLATE.md) 양식을 재사용해도 된다. 다만 새 파일은 아카이브가 아니라 **`docs/reports/`** 에 두어 T번호 체계와 섞이지 않게 한다.

### 검증 수준 표기

완료를 적을 때는 **어디까지 검증했는지 반드시 병기**한다.

- `[코드 완료 | refresh Error=0 | 런타임 검증 보류]`
- `[완료 | Play 확인 2026-08-06]`

검증하지 않은 것을 "동작함"으로 적지 않는다 ([AGENTS.md](../AGENTS.md) R8).

---

## 4. 착수 전 체크리스트

- [ ] Foundation 스킬·레퍼런스가 컨텍스트에 있는가 ([AGENTS.md](../AGENTS.md) 상단)
- [ ] 이 작업이 [pitfalls.md](./pitfalls.md)의 어느 규칙에 걸리는가
- [ ] 편집 대상이 [AGENTS.md §5 편집 레인](../AGENTS.md) 안에 있는가 — `.model`/`.ui`는 빌더 경유
- [ ] 지형을 만진다면 [tile-scheme.md](./tile-scheme.md) 문법과 `--force` 위험을 확인했는가
- [ ] Maker가 스테일 상태는 아닌가 — 빌더 편집 전후로 `git status` 확인
- [ ] 기존 패키지/템플릿으로 해결되는가 (R1 프리셋 우선 — [wiki/](./wiki/))

---

## 관련 문서

- 절대 규칙·스킬 라우팅: [../AGENTS.md](../AGENTS.md)
- 함정 사전: [pitfalls.md](./pitfalls.md)
- 스킬 로딩 프로토콜: [reference/skill-routing.md](./reference/skill-routing.md)
- 훅 계약·차단 대응: [reference/hooks.md](./reference/hooks.md)
- 폴더 구조 규칙: [reference/directory-structure.md](./reference/directory-structure.md)
- 물리·조작키·맵 구성: [reference/physics-controls.md](./reference/physics-controls.md)
