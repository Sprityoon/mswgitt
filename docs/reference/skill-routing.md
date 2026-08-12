# 스킬 및 레퍼런스 로드 프로토콜 (Skill Loading Protocol)

> 이 문서는 [AGENTS.md](../../AGENTS.md) §3의 도메인 라우팅을 보충하는 위치 안내다.
> 규칙의 단일 소스와 우선순위는 [AGENTS.md](../../AGENTS.md)이며, 이 문서는 중복 규칙을 만들지 않는다.

## 스킬 위치 (에이전트별)

| 에이전트 | 로드 방법 |
|---|---|
| Claude Code | `Skill` 도구에 스킬 이름 전달 (파일 위치: 프로젝트 `.claude/skills/<name>/SKILL.md`) |
| Codex / 기타 `.agents` 지원 에이전트 | 세션의 스킬 목록에서 선택하고 제공된 locator의 `SKILL.md`를 전문 로드 |
| Cursor / Copilot | 에이전트가 자동 발견한 스킬 디렉터리에서 로드 |

- 벤더 스킬은 `skills-lock.json`으로 해시 관리됩니다(원본: GitHub `MSW-Git/msw-ai-coding-plugins-official`). **어느 미러든 수정 금지.** 워크스페이스의 `plugins/` 중간 사본은 2026-07-13 제거됨.
- 로드된 SKILL.md가 가리키는 `references/*.md`는 **Read 도구로 전문** 읽습니다. 쉘 명령(cat/head/Get-Content)·offset/limit 부분 읽기는 금지(훅이 차단) — 부분 읽기가 과거 UI 사고의 원인이었습니다.

## Foundation (매 턴 필수)

1. 스킬 2종 로드: `msw-general` → `msw-ui-system`
2. 레퍼런스 4종 전문 Read: `msw-general/references/platform.md`, `workspace.md`, `entity.md`, `authoring.md`
3. 대상 맵의 `TileMapMode` 확인 후 `platform-{maple|rect|sideview}.md` 중 1종 추가 (이 프로젝트 기본: RectTile=1 → `platform-rect.md`)

## 도메인 매트릭스 요약

| 트리거 | 스킬 | 필수 레퍼런스 (해당 시) |
|---|---|---|
| script / mlua / component / event / lifecycle | `msw-scripting` | 저장·영속 → `references/datastorage.md` · 검증 → `references/verify-checklist.md` |
| sprite / sound / RUID 검색 | `msw-search` | `references/resource/{search,detail,browse,avatar}.md` |
| SpriteRUID / ImageRUID / thumbnail:// / 아이콘 | `msw-sprite-ruid` | (없음) |
| avatar / costume / 장비 / 모션 | `msw-avatar` | (없음) |
| DefaultPlayer / 이속 / 점프 / 카메라 | `msw-defaultplayer` | (없음) |
| attack / hit / damage / 몬스터 전투 | `msw-combat-system` | 몬스터 모델 → `../msw-general/references/monster.md` · HP바 → `references/hp-gauge.md` · 투사체 → `references/projectile.md` · FSM → `../msw-general/references/animation-state.md` · BT → `references/ai-bt.md` |
| 인벤토리 / 상점 / 랭킹 / 퀘스트 / 도감 등 표준 시스템 | `msw-packages` + `msw-wiki` | 카탈로그 먼저 — 백지 구현 금지. README는 로컬 미러(`docs/wiki/mswpackages/`)부터 |
| 패키지 상세 / 공식 예제 / 충돌 감지 방식 / 오브젝트 풀 / 강화·레벨 예제 / UI 스타일팩 | `msw-wiki` | `docs/wiki/{mswpackages,roguelike-world}/INDEX.md` 먼저 |
| 새 게임 기획 / GDD / 마일스톤 로드맵 (독립 월드) | `msw-planning` | 이 저장소의 "다음 작업/이어서 진행"은 **[docs/tasks.md](../tasks.md)** + `msw-project` 소관. `msw-planning`은 별도 신규 월드에만 사용 |
| 플레이어 공격·이동 스킬 / 더블점프 / 텔레포트 / 쿨다운·핫키 / 피격·사망 연출 / 넉백 펄스 | `maplestory-skill-maker` | 전투 **기반 구조**는 `msw-combat-system` 소관(겹치면 둘 다). Phase 16 기존 스킬 파이프라인 위에 얹고 백지 도입하지 않는다 |
| popup / HUD / 버튼 / 토스트 / `.ui` | `msw-ui-system` | 기초 → `references/ui-fundamentals.md` · 레이아웃 → `references/layout-recipes.md` · API → `references/component-api.md` · 런타임 → `references/runtime-patterns.md` · 빌더 → `../msw-general/references/builder-protocol.md` + `builder-protocol-ui.md` · 프로젝트 톤 → [design-policy.md](../design-policy.md) |
| entity 배치 / `.map` / spawn / 좌표 | `msw-general` | `references/entity.md` + `references/builder-protocol.md` **+ `builder-protocol-map.md`** |
| `.model` / 템플릿 | `msw-general` | `references/model.md` + `references/builder-protocol.md` **+ `builder-protocol-model.md`** (+몬스터면 `monster.md`) |
| TileMapMode / Body / 물리 / 침묵 실패 디버깅 | `msw-general` | `references/platform.md` + 해당 `platform-*.md` · 증상 디버깅 → `references/troubleshooting.md` |
| DataSet / `.csv` / i18n | `msw-general` | `references/dataset.md` |
| MCP / refresh / logs / Play | `msw-general` | `references/workspace.md` |
| BT `.behaviourtree` 파일 저작 | `msw-behaviourtree` | `references/node-catalog.md` |
| 스프라이트 직접 제작 | `msw-painter` / `image-to-pixel` | 각 SKILL.md 라우팅 준수 |

## 프로젝트 스킬 (이 저장소 전용)

| 스킬 | 용도 |
|---|---|
| `msw-project` | 작업 부팅: 현황 파악 → 함정 확인 → 구현 → 검증 체인 → 기록 |
| `msw-checkpoint` | 문서 동기화 점검 + git 커밋·푸시 |
| `msw-wiki` | 로컬 위키(docs/wiki) 안내 — MSWPackages 미러 + RoguelikeWorld 예제 큐레이션 |
| `image-to-pixel` | 원본 이미지 → 픽셀 게임 에셋 변환 |
