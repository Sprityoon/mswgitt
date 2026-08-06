---
name: msw-project
description: 이 프로젝트(메이플월드 탑다운 크래프팅 게임)의 작업 부팅 절차. 사용자가 "다음 작업", "이어서 진행", "마저 작업하자", "현황 알려줘", "뭐 할 차례야", "중단된 작업 다시 시작"이라고 하거나 이 저장소의 게임 기능을 구현·수정할 때 사용. 현황 파악 → 함정 확인 → 구현 → 검증 체인 → 기록까지 한 절차로 강제한다. 구 msw-conductor + msw-worker 통합.
---

# MSW Project — 작업 부팅 절차

이 저장소는 **솔로 체제**다 — 제작자(사람) 1명이 주도하고 AI가 보조한다.
지휘자/구현자 위임 체제와 T티켓 신규 발행은 **2026-08-06 폐기**됐다 (AGENTS.md §0 O-5).

원본 문서: [docs/workflow.md](../../../docs/workflow.md) · [docs/pitfalls.md](../../../docs/pitfalls.md) · [docs/tasks.md](../../../docs/tasks.md)

---

## 1. 현황 파악 (세션 시작마다 — 채팅 기록은 이어지지 않는다)

1. [docs/tasks.md](../../../docs/tasks.md) 전체 Read — 진행 중 / Play 확인 대기 / 후속 후보.
2. `git status --short` + `git log --oneline -10` — 미커밋 작업과 최근 작업을 확인한다. **`.ui`/`.csv`에 의도치 않은 변경이 보이면 Maker 스테일 저장을 먼저 의심**할 것 ([규칙 11](../../../docs/pitfalls.md)).
3. 설계 맥락이 필요하면 `game_design.md` §5 Phase 트래커를 Grep으로 찾아 해당 § 만 Read (84KB — 전체 읽기 금지).
4. 구 티켓의 구현 상세가 필요하면 [docs/agents/README.md](../../../docs/agents/README.md)의 주제별 색인에서 보고서를 찾는다.

## 2. 착수 전 확인 — 🔴 건너뛰지 말 것

1. **[docs/pitfalls.md](../../../docs/pitfalls.md)에서 이 작업이 걸리는 규칙을 찾는다.** 17건 전부 *에러 없이 조용히 틀리는* 종류다. 빠른 색인 표만 훑어도 된다.
2. 편집 대상이 AGENTS.md §2 레인 안인지 확인. `.model`=ModelBuilder / `.ui`=UIBuilder / `.map`=MapBuilder — 직접 편집은 훅이 차단한다.
3. 도메인에 맞는 MSW 스킬을 라우터 리마인더에 따라 로드 (Foundation 2종 + 레퍼런스 4종은 매 턴 필수).
4. 지형을 만진다면 [docs/tile-scheme.md](../../../docs/tile-scheme.md)와 `build_maps.cjs --force` 위험을 확인.
5. UI라면 `msw-ui-system`의 `references/ui-aesthetics.md` 전문 로드 + 기존 UI와 동일 비주얼 아이덴티티 유지 ([규칙 6](../../../docs/pitfalls.md)).

## 3. 구현

- **프리셋 우선** (R1): 표준 시스템 → `msw-packages` 카탈로그 + [docs/wiki/](../../../docs/wiki/) / 새 모델 → `msw-general` `models/` 템플릿 / UI → `msw-ui-system` 템플릿.
- **데이터 주도** (R3): 아이템·수치·확률·모션명은 전부 CSV 행으로. `if name == "..."` 분기 금지.
- **크로스 스크립트 호출 전 정의 확인** (R6): 대상 `.mlua`에서 Grep으로 시그니처 검증. 없으면 추정 호출 금지.
- 검증 포인트에 태그 로그 추가: `log("[태그] ...")` — 제작자 Play 검증의 근거가 된다.

## 4. 검증 — AI 범위는 refresh + 빌드 로그까지

```
1) maker_refresh_workspace       → status ok
2) maker_logs(kind="build")      → Error 수 (Error=0 이 게이트) · Warning 수
3) 신규 .mlua면 .codeblock 생성 확인
4) 이후는 "런타임 검증 보류(제작자 Play)"로 명시
```

- **현재 Warning baseline = 48** (2026-08-06 실측). 늘었으면 원인과 소유 스크립트를 밝힌다. 내역은 [docs/workflow.md](../../../docs/workflow.md) §④.
- ⛔ `maker_play` / `maker_stop` / `maker_keyboard_input` / `maker_mouse_input` / `maker_screenshot` / `maker_reset_data_storage`는 **제작자 전담 — 호출 금지** (AGENTS.md §0 O-2).
- ⚠️ **build Error=0이 못 잡는 것**: `.map` JSON 구조 붕괴([규칙 16](../../../docs/pitfalls.md)) · `.ui` 산출물 원복([규칙 11](../../../docs/pitfalls.md)) · 시각 실루엣 불일치([규칙 17](../../../docs/pitfalls.md)).
- MCP 미연결이면 LSP 진단까지만 하고 **"refresh 검증 보류"** 로 정확히 보고. 허위 `Error=0` 기재 금지 (R8).

## 5. 기록

| 남길 것 | 어디에 |
|---|---|
| 작업 진행·완료 | [docs/tasks.md](../../../docs/tasks.md) — 검증 수준 병기 |
| 설계 변경·Phase 진행 | `game_design.md` (해당 시스템 § + §5 트래커) |
| 상시 적용 디자인 결정 | [docs/design-policy.md](../../../docs/design-policy.md) — 날짜 + ⚖️ 표기 |
| **재발 방지 가치가 있는 사고·실측** | [docs/pitfalls.md](../../../docs/pitfalls.md) — **규칙 18번부터 append**. 번호 재사용 금지 |
| 커밋 | `msw-checkpoint` 스킬 |

## 금지 (사고 이력 기반)

- 검증하지 않은 것을 "동작함"으로 보고.
- 존재하지 않는 API 추정 호출 (T18 치명 오류의 원인).
- 세이브 루틴 내 추가 Yield (T37 인벤토리 전량 유실의 원인).
- `row.RowIndex` 사용 (T35 — `UserDataRow`는 `Count()`/`GetItem(col)`뿐).
- 지시 없는 커밋/푸시, 지시 없는 하위 에이전트 기동.
- 요청 범위 밖 리팩터링.
