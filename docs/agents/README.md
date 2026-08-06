# 아카이브 — 구 지휘자/구현자 체제 기록 (2026-07 ~ 2026-08-04)

> 🧊 **이 폴더는 동결 구역이다.** 2026-08-06 솔로 체제 전환 이전에 운영하던 **지휘자(conductor) 1세션 + 구현자(worker) N세션** 위임 구조의 기록이 들어 있다.
>
> **새 작업은 여기에 추가하지 않는다.** 현재 문서는 다음을 본다:
> - 작업 절차 → [../workflow.md](../workflow.md)
> - 할 일 → [../tasks.md](../tasks.md)
> - 함정 사전 → [../pitfalls.md](../pitfalls.md)
>
> 다만 **읽기 가치는 살아 있다** — 각 보고서에는 구현 상세·실측 근거·제작자 Play 체크리스트가 남아 있어, 해당 시스템을 다시 만질 때 1차 자료가 된다.

---

## 무엇이 어디로 갔나

| 동결된 문서 | 살아있는 내용의 새 위치 |
|---|---|
| `subagent-handoff.md` §1.2 절대 규칙 17개 | → [../pitfalls.md](../pitfalls.md) (**규칙 번호 그대로 승계**) |
| `subagent-handoff.md` §1.3 타일 스킴 | → [../tile-scheme.md](../tile-scheme.md) |
| `subagent-handoff.md` §1.4 검증 프로토콜 | → [../workflow.md](../workflow.md) §2 |
| `subagent-handoff.md` §1.5 상시 디자인 정책 | → [../design-policy.md](../design-policy.md) |
| `subagent-handoff.md` §3 작업 큐 잔여분 | → [../tasks.md](../tasks.md) |
| `subagent-handoff.md` §4 보고 형식 · §5 킥오프 프롬프트 | **폐기** (솔로 체제에서 불필요) |
| `conductor-role.md` | **폐기** — 절차는 [../workflow.md](../workflow.md)로 통합 |
| `crafting_ui_concepts.md` | 소진됨 — 채택안은 `game_design.md` §3.3 / Phase 14-F에 기록 |

---

## 폴더 내용

| 항목 | 설명 |
|---|---|
| [subagent-handoff.md](./subagent-handoff.md) | 구 작업 큐 원문. T4~T103 티켓의 **Target / Change / Acceptance 스펙**과 지휘자 현황판 시계열 기록 (962행) |
| [conductor-role.md](./conductor-role.md) | 구 지휘자 역할 규약 |
| [crafting_ui_concepts.md](./crafting_ui_concepts.md) | 제작 UI 컨셉 4안 비교 (Phase 14-F 채택 근거) |
| [reports/](./reports/) | T번호별 작업 보고서 88건 + `_TEMPLATE.md` |
| [reports/BATCH-A-B-play-verify-2026-07-11.md](./reports/BATCH-A-B-play-verify-2026-07-11.md) | 배치 A/B Play 검증 종합 |

> 스펙 원문이 필요한데 여기에도 없으면 `git log -p -- docs/agents/subagent-handoff.md`를 본다 (2026-07-16 슬림화 때 완료 티켓 원문이 git 이력으로 이관됐다).

---

## 보고서 색인 (주제별)

### 지형 · 타일

| 보고서 | 내용 |
|---|---|
| [T51](./reports/T51-subgrass-diagonal-tiles.md) | 대각 `SubGrass` 타일 — 마스크 0~15 전 표현 |
| [T61](./reports/T61-terrain-edit-cooldown.md) | 지형 편집 반응 지연 — 전용 쿨다운 분리 |
| [T90](./reports/T90-water-tile-foundation.md) | 물 타일 기반 (`wall.tileset` `Water`) — 배치는 미이행 |
| [T98](./reports/T98-water-fringe-map01.md) | map01 물가 L2 프린지 · **`LEA-3015` 사고 복구** |
| [T92](./reports/T92-terrain-dig-water.md) | 영지 물 파기 `dig_water`/`fill_water` |

### 생활 시스템 (농사 · 요리 · 낚시 · 목장 · 펫)

| 보고서 | 내용 |
|---|---|
| [T6](./reports/T6-farming-mvp.md) · [T24](./reports/T24-crop-visual-tuning.md) | 농사 MVP · 작물 비주얼 튜닝 |
| [T7](./reports/T7-research-lab.md) · [T8](./reports/T8-bed-sleep.md) | 연구소 · 침대/수면 |
| [T16](./reports/T16-buff-infra.md) · [T17](./reports/T17-cooking.md) | 버프 인프라 · 요리 |
| [T57](./reports/T57-weekly-fishing-leaderboard.md) · [T63](./reports/T63-fishing-rank-immediate-refresh.md) · [T64](./reports/T64-fishing-v2-reeling.md) · [T91](./reports/T91-tile-water-fishing.md) | 주간 낚시왕 · 즉시 반영 수정 · 릴링 v2 · 물 타일 낚시 |
| [T19](./reports/T19-ranch-animals.md) · [T23](./reports/T23-pet-companion.md) · [T49](./reports/T49-animal-pet-pen-art.md) | 목장 · 펫 · 가축/펫 아트 |
| [T20](./reports/T20-bulletin-board.md) · [T21](./reports/T21-weather-system.md) | 의뢰 게시판 · 날씨 |

### 인벤토리 · 제작 · 도감

| 보고서 | 내용 |
|---|---|
| [T14](./reports/T14-crafting-ui-hybrid.md) · [T25](./reports/T25-recipe-unlock-infra.md) · [T26](./reports/T26-crafting-filter-tabs.md) | 제작창 도감형 · 레시피 해금 인프라 · 필터 탭 |
| [T22](./reports/T22-collection-dex.md) · [T42](./reports/T42-collection-category-chips.md) · [T43](./reports/T43-dex-discovery-reward.md) · [T44](./reports/T44-inventory-cointext-lea3044.md) | 도감·업적 · 카테고리 칩 · 발견 보상 · `LEA-3044` 수정 |
| [T27](./reports/T27-quest-reward-unlock.md) | 퀘스트 보상 → 레시피 해금 |
| [T9](./reports/T9-rare-drops.md) · [T34](./reports/T34-spawn-tuning-treasure-chest.md) | 희귀 드롭 · 보물 상자 |

### 전투 · 몬스터

| 보고서 | 내용 |
|---|---|
| [T38](./reports/T38-monster-combat-feel.md) · [T39](./reports/T39-monster-projectile.md) · [T40](./reports/T40-monster-charge-leap.md) | 전투 체감 · 원거리 포자 · 돌진/도약 |
| [T93](./reports/T93-monster-approach-blocker.md) | 몬스터 접근 차단 장치 |
| [T99](./reports/T99-monster-entity-obstacles.md) | **몬스터 엔티티 장애물 차단** — `ObstacleQuery` 추출 |
| [T28](./reports/T28-monster-id-coin-drop.md) | MonsterId 체계 · 코인 드롭 |

### 스킬

| 보고서 | 내용 |
|---|---|
| [T45](./reports/T45-skill-equip-flow.md) · [T46](./reports/T46-skill-maple-skin.md) | 해금·장착 흐름 · 원작 메이플 스킨 |
| [T47](./reports/T47-skill-tree-ux.md) · [T48](./reports/T48-skill-tree-visual-cleanup.md) · [T50](./reports/T50-skill-node-icon-detail-panel.md) | 트리 UX 3단 개선 |
| [T58](./reports/T58-skill-tree-links-parent-gate.md) · [T60](./reports/T60-skill-tree-lines.md) | 트리 위상화 · 연결선 |
| [T62](./reports/T62-unified-skillbar.md) · [T69](./reports/T69-equipped-skills-persist.md) | 통합 스킬바 · 장착 영속화 |
| [T66](./reports/T66-skill-vfx-dash-damage.md) · [T70](./reports/T70-skill-cast-motion-fx-fallback.md) · [T71](./reports/T71-effect-instigator-nil.md) | 이펙트 미표시 3연작 — **진범 = `instigator` nil** ([규칙 12](../pitfalls.md)) |

### UI · 모바일 · 입력

| 보고서 | 내용 |
|---|---|
| [T52](./reports/T52-skillbar-mobile-touch.md) · [T53](./reports/T53-hud-mobile-touch-targets.md) · [T54](./reports/T54-popup-mobile-close-audit.md) | 모바일 UX 정비 배치 |
| [T59](./reports/T59-click-interact-removal.md) | **클릭 상호작용 전면 제거** — F/BtnInteract 일원화 |
| [T67](./reports/T67-aim-cell-interact-gate.md) · [T82](./reports/T82-aim-trigger-aabb.md) | 조준 셀 게이트 · Trigger AABB footprint |
| [T79](./reports/T79-furnace-nested-uigroup.md) · [T88](./reports/T88-furnace-uigroup-stale-recovery.md) | 중첩 `UIGroup` 제거 2회 — **둘 다 재발** ([규칙 15](../pitfalls.md) 참조) |
| [T30](./reports/T30-furniture-preview-data-driven.md) | 가구 프리뷰 데이터 주도화 |

### 마을 · 아트워크

| 보고서 | 내용 |
|---|---|
| [T72](./reports/T72-item-icon-model-match.md) | 아이템 아이콘 ↔ 모델 외형 일치화 |
| [T73](./reports/T73-plaza-fountain-well.md) · [T74](./reports/T74-town-houses.md) · [T77](./reports/T77-town-npcs-cat.md) | 광장 · 주택 · NPC/고양이 |
| [T75](./reports/T75-town-props-p1-p11.md) | 생활 소품 P1~P11 — **배치는 2026-08-04 철회, 모델만 잔존** |
| [T56](./reports/T56-villager-dialog-balloon.md) · [T80](./reports/T80-town-npc-legacy-cleanup.md) | 주민 대화 말풍선 · NPC legacy 청산 |
| [T55](./reports/T55-sound-foundation-bgm-ambience.md) · [T65](./reports/T65-mine-attack-sfx.md) · [T68](./reports/T68-sfx-reselection.md) | BGM·앰비언스 · 채집/공격 SFX · **SFX 전량 재선정** |

### 물리 · 렌더 정렬 · 충돌

| 보고서 | 내용 |
|---|---|
| [T36](./reports/T36-resolve-overlaps-aabb.md) · [T41](./reports/T41-resource-collider-collision-jump.md) | 자원 통과 AABB · 충돌 정합 |
| [T81](./reports/T81-town-movement-blocking.md) | 마을 오브젝트 통행 차단 등록 |
| [T83](./reports/T83-building-walkbehind-fade.md) | 건물 walk-behind 반투명 + Y정렬 |
| [T89](./reports/T89-y-sort-alignment.md) · [T95](./reports/T95-groundline-y-sort.md) · [T97](./reports/T97-y-sort-review-fixes.md) | Y정렬 3연작 — 누락 → 접지선 통일 → 검수 보정 |
| [T100](./reports/T100-furniture-trigger-passthrough.md) · [T101](./reports/T101-collider-scale-passthrough.md) | 가구 Trigger 부여 · **콜라이더 Scale 미반영** ([규칙 14](../pitfalls.md)) |

### 데이터 위생 · 인프라 · 사고 복구

| 보고서 | 내용 |
|---|---|
| [T29](./reports/T29-resource-xp-dataset.md) · [T31](./reports/T31-feast-dish-buff-reassignment.md) · [T32](./reports/T32-data-hygiene.md) · [T33](./reports/T33-currency-portal-data-driven.md) | 감사 배치 — XP 컬럼화 · 버프 재배정 · 데이터 위생 · 통화/포탈 컬럼화 |
| [T35](./reports/T35-rowindex-api-hotfix.md) | **`RowIndex` 핫픽스** — [규칙 7](../pitfalls.md)의 유래 |
| [T37](./reports/T37-logout-map-kind.md) | 로그아웃 정책 + **세이브 유실 핫픽스** — [규칙 9](../pitfalls.md)의 유래 |
| [T84](./reports/T84-static-npc-rigidbody-cleanup.md) · [T85](./reports/T85-estate-fishing-spot-restore.md) · [T86](./reports/T86-build-warning-lwa4012-cleanup.md) · [T87](./reports/T87-workspace-root-asset-cleanup.md) | 위생 배치 N |
| [T103](./reports/T103-prop-lwa4012-cleanup.md) | Prop `LWA-4012` 경고 청소 |

### 보고서가 없는 T번호

T1~T5 · T10~T13 · T15 · T18 · T76 · T78 · T94 · T96 · T102 — 지휘자 직접 처리 / 제작자 직접 / 결정 티켓 / 폐기 등으로 별도 보고서 파일이 없다. 내용은 [subagent-handoff.md](./subagent-handoff.md) §2·§3과 `game_design.md` Phase 트래커에 있다.
