# T88 작업 보고서 — T79 L029 수정 원복 복구 (Maker 스테일 저장 3차)

- **작업**: T88 T79 L029 수정 원복 — Maker 스테일 저장 3차 사고 복구 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | ui_lint error=0 (L029 소멸) | Maker MCP 미연결 — refresh·Play 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok (레인 B 구현자) · Maker MCP 미연결 · LSP N/A(`.ui`만 수정)
- **날짜**: 2026-07-28

## 1. 요약

착수 시점 UIBuilder 대조에서 `FurnacePopup`에 `UIGroupComponent`가 **다시 있음**(HEAD/T79 의도=`false`)을 확인했다. T79와 동일하게 UIBuilder `removeComponent`로 제거했고, 엔티티 수 341 유지·`ui_lint` **0 error**. Maker MCP가 없어 refresh 선행을 에이전트가 직접 돌리지는 못했으며, **제작자는 이 산출물을 디스크에 반영한 뒤 Maker에서 반드시 refresh한 다음에만 저장**해야 한다(규칙 11 ① — 미선행 저장 시 재원복).

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `ui/PopupGroup.ui` | `FurnacePopup`에서 `MOD.Core.UIGroupComponent` 재제거 (T79 복구) |

## 3. 구현 상세

1. **착수 전 대조 (비정상 확정)**:
   - `entity_count=341`
   - `FurnacePopup has UIGroupComponent: true` ❌
   - `componentNames=UITransform,UIGroup,CanvasGroup,script.UIFurnaceController`
2. **Maker refresh 선행**: `msw-maker-mcp` 서버 미발견 → 에이전트 측 refresh 불가. 티켓 Change ③의 제작자 확인은 채팅/보고로 고지(아래 §5). 디스크 복구는 진행(미복구 시 커밋에 T79 회귀가 박힘).
3. **복구**: `UIBuilder.load` → `removeComponent("FurnacePopup", "MOD.Core.UIGroupComponent")` → `write()`. 타 팝업 무수정.
4. **사후 대조**: `has UIGroupComponent: false` ✅ / `componentNames=UITransform,CanvasGroup,script.UIFurnaceController` / 엔티티 341.
5. 스펙 이탈 없음. `.mlua` 무수정.

## 4. 수행한 검증과 결과

- **UIBuilder 대조 (실행)**: 복구 후 `FurnacePopup has UIGroupComponent: false`, entity_count=341.
- **ui_lint (실행)**: `ui/PopupGroup.ui: 220 finding(s) - 0 error, 89 warning, 131 info` — L029 없음.
- **Maker refresh**: 보류 — `msw-maker-mcp` 미연결. **refresh Error 수: 측정 불가(보류)**.
- **Play 런타임**: 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 🔴 **제작자 필수 조치**: Maker가 켜져 있으면 **먼저 `refresh`(디스크 → 에디터)**, 그 다음에만 저장. refresh 없이 저장하면 T79/T88이 또 원복된다(규칙 11 3차 동일 패턴).
- 경고 89건은 기존 L007 등 — 이번 범위 밖.

## 6. 제작자 런타임 체크리스트

- [ ] Maker에서 **refresh 선행** 후 빌드 Error=0
- [ ] 화로 F → 팝업 열림/닫힘
- [ ] input/fuel 슬롯 드래그·제련 정상
- [ ] WarpPopup·ChestPopup·SkillTree 등 타 팝업 무영향
- [ ] refresh 직후 `git status`에서 `PopupGroup.ui`가 다시 UIGroup을 끌어오지 않는지 확인

## 7. 이력

- 2026-07-28 최초 작성 (레인 B 구현자)
