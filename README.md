# 메이플월드 — 탑다운 라이프·크래프트 게임

**MapleStory Worlds(MSW)** 로 만드는 탑다운 생존/채집 게임.
**스타듀밸리**(개인 농장·꾸미기)를 핵심 축으로, 마인크래프트·코어키퍼의 채집/제작/건설 손맛과 **바람의 나라·메이플스토리**식 공용 사냥터를 결합했다.

플레이어는 세 갈래 루프를 오간다:

| 공간 | 인원 | 전투 | 하는 일 | 맵 |
|---|---|:--:|---|---|
| **① 개인 영지** | 1인 | ❌ | 채집·제작·건설·농사·낚시·휴식 | `Home_<UserId>` (`map/map01.map` 복제) |
| **② 공동 마을** | 서버 전체 | ❌ | 상점·퀘스트·연구소·게시판·커뮤니티 | `map/town.map` |
| **③ 사냥터 / 보스** | 서버 전체 | ✅ | 전투·레벨링·희귀 전리품 | `map/template_field.map` · `map/template_boss.map` |

**조작**: 방향키 4방향 이동 / `Alt` 비주얼 점프 / `Ctrl` 공격·채광 / `F` 상호작용

---

## 지금 어디까지 왔나

Phase 21까지 진행. 구현 완료된 주요 시스템:

- **생활**: 농사 · 요리 · 낚시(릴링 미니게임 + 숙련 레벨) · 목장 · 펫 · 침대/수면 · 날씨
- **제작**: 인벤토리 · 도감형 제작창(티어 탭 + 해금) · 연구소 · 화로/제련 · 가구 설치
- **진행**: 스킬트리(SP·위상 게이트) · 퀘스트/업적 · 도감 · 의뢰 게시판 · 주간 낚시왕 랭킹
- **전투**: 몬스터 AI(돌진·도약·원거리) · 엔티티 장애물 차단 · 접근 차단 장치
- **월드**: 5레이어 타일 지형 + 서브셀 마스크 지형 편집 · 물 타일/파기 · Y축 렌더 정렬 · walk-behind 반투명 · BGM/앰비언스

남은 일과 Play 확인 대기 항목은 **[docs/tasks.md](docs/tasks.md)** 에 있다.

---

## 문서 지도

### 먼저 볼 것

| 문서 | 언제 보나 |
|---|---|
| **[AGENTS.md](AGENTS.md)** | AI 어시스턴트 규칙·스킬 라우팅·편집 레인. **모든 작업의 출발점** |
| **[docs/workflow.md](docs/workflow.md)** | 작업 절차 5단계 · MCP 검증 체인 · 도구 실명 규약 |
| **[docs/pitfalls.md](docs/pitfalls.md)** | 🔴 **이 프로젝트에서 실제로 사고를 낸 함정 28건.** 대부분 에러 없이 조용히 틀린다 |
| **[docs/tasks.md](docs/tasks.md)** | 지금 할 일 · Play 확인 대기 목록 |

### 설계

| 문서 | 내용 |
|---|---|
| [game_design.md](game_design.md) | 전체 기획서 + §5 Phase 트래커 (84KB — 필요한 §만 검색해 읽을 것) |
| [docs/design-policy.md](docs/design-policy.md) | 한 번 정하면 계속 지켜야 하는 디자인 결정 (톤·입력·복잡도) |
| [docs/tile-scheme.md](docs/tile-scheme.md) | 타일 지형 문법 단일 소스 (레이어 5장 + 서브셀 마스크) |
| [docs/design/skill-tree-plan.md](docs/design/skill-tree-plan.md) | 스킬트리 설계 · 전직 확장 계약 |
| [docs/design/phase15-living-world.md](docs/design/phase15-living-world.md) | 살아있는 월드 8개 시스템 기획 |
| [docs/design/artwork-spec.md](docs/design/artwork-spec.md) | 아트워크 명세 |

### 레퍼런스

| 문서 | 내용 |
|---|---|
| [docs/reference/physics-controls.md](docs/reference/physics-controls.md) | 맵 구성 · 물리(RectTile/Kinematicbody) · 조작키 |
| [docs/reference/directory-structure.md](docs/reference/directory-structure.md) | `RootDesk/MyDesk/` 2단계 폴더 규칙 |
| [docs/reference/skill-routing.md](docs/reference/skill-routing.md) | MSW 스킬 로딩 프로토콜 · 도메인 매트릭스 |
| [docs/reference/hooks.md](docs/reference/hooks.md) | 훅 인벤토리 · 차단 대응 · 종료 코드 계약 |
| [docs/reference/resource-api-pitfalls.md](docs/reference/resource-api-pitfalls.md) | 리소스 검색 API 실측 함정 (아바타 아이템 등) |
| [docs/reference/README.md](docs/reference/README.md) | 아바타 아이템 33,763개 카탈로그 CSV + 프리뷰 도구(F9) 사용법 |
| [docs/wiki/](docs/wiki/) | MSWPackages 29종 미러 + RoguelikeWorld 예제 큐레이션 |

### 아카이브

[docs/agents/](docs/agents/) — 2026-08-04까지 운영한 **지휘자/구현자 위임 체제**의 기록. T번호별 작업 보고서 88건 + 구 작업 큐 원문. 동결됐지만 **시스템별 구현 상세의 1차 자료**다.

---

## 워크스페이스 구조

```
RootDesk/MyDesk/     ← 작업 영역 (.mlua · .model · .userdataset+.csv)
  <카테고리>/          ← MapObjects · Furniture · item · Player · UI · Monster · NPC …
    Models/ Scripts/ DataSets/
map/                 ← .map 4종 (MapBuilder 경유)
ui/                  ← .ui (UIBuilder 경유)
Global/              ← 엔진 기본값. DefaultPlayer.model · WorldConfig.config만 편집 가능
Environment/         ← .d.mlua API 정의. 읽기 전용
scripts/             ← 빌더·생성기 CJS (build_maps.cjs 등)
docs/                ← 문서
```

**편집 수단이 강제된다**: `.model` → `ModelBuilder` · `.ui` → `UIBuilder` · `.map` → `MapBuilder`. 직접 편집은 훅이 차단한다. 자세한 레인 표는 [AGENTS.md §5](AGENTS.md).

---

## 작업하기

```
① 계획 → ② 분석(.d.mlua Grep · 기존 패턴) → ③ 구현(빌더 경유)
→ ④ 검증: maker_refresh_workspace → maker_logs(kind="build") → Error=0
→ ⑤ Play 확인 (제작자 전담)
```

- **Play 런타임 검증은 제작자(사람)가 직접 한다.** AI는 `refresh` + 빌드 로그까지가 범위이고, 그 이후는 "런타임 검증 보류"로 정확히 보고한다.
- 현재 빌드 Warning baseline = **17**. 늘었으면 원인과 소유 스크립트를 밝힌다.
- 커밋은 `msw-checkpoint` 스킬 절차를 따른다.

절차 전문: **[docs/workflow.md](docs/workflow.md)**

---

## 이것만은 (사고가 났던 것들)

1. **하드코딩 금지** — 데이터성 값은 `.csv` + `.userdataset` 컬럼으로. `if name == "..."` 분기 금지
2. **세이브 경로에 Yield 추가 금지** — 인벤토리 전량 유실 사고 ([규칙 9](docs/pitfalls.md))
3. **`.map` `jsonString`에 문자열 대입 금지** — 맵 전체 로드 실패 ([규칙 16](docs/pitfalls.md))
4. **빌더로 파일을 바꿨으면 Maker 저장 전에 `refresh` 먼저** — 산출물 조용한 원복 ([규칙 11](docs/pitfalls.md))
5. **콜라이더 실물 = `BoxSize × Transform.Scale`** — 판정이 실물보다 작아짐 ([규칙 14](docs/pitfalls.md))
6. **build Error=0은 만능이 아니다** — `.map` 구조 붕괴 · `.ui` 원복 · 시각 불일치를 못 잡는다

전문: **[docs/pitfalls.md](docs/pitfalls.md)**
