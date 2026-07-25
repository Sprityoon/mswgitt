# T86 작업 보고서 — 빌드 Warning 청소 — `LWA-4012` 프로퍼티 기본값 명시

- **작업**: T86 빌드 Warning 청소 — `LWA-4012` 프로퍼티 기본값 명시 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 코드 완료 | LSP·refresh 무에러 (Error=0) | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Gemini 3.6 Flash (High), Maker 기동 환경 (MCP refresh 완료), ModelBuilder 및 MapBuilder 사용
- **날짜**: 2026-07-25

## 1. 요약 (3~5줄)

`WalkBehindFade`가 적용된 11개 건물/구조물 모델 및 `VillagerDialog`가 적용된 6개 주민/NPC 모델, 그리고 `town.map` 오버라이드 엔티티에 대해 `CoveredAlpha`, `SortRadius`, `CoverNorthExtent`, `CoverWidthScale` 및 `InteractRange`, `BalloonDuration`, `AutoTalkInterval`, `AutoTalkRange` 8개 프로퍼티의 명시적 `Properties` 링크 및 `Values` 기본값을 ModelBuilder/MapBuilder로 적용했습니다.
수치 및 타입은 스크립트 선언값(`CoveredAlpha=0.4`, `SortRadius=100`, `CoverNorthExtent=1.2`, `CoverWidthScale=0.85` / `InteractRange=3.0`, `BalloonDuration=4.0`, `AutoTalkInterval=15.0`, `AutoTalkRange=6.0`)과 100% 동일하게 일치시켜 연출 및 동작 변형 0을 보장했습니다.
`maker_refresh_workspace` 빌드 결과 Error=0 (total 587 logs)을 유지하며 정상 완료했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Models/Building_Blacksmith.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/MapObjects/Models/Building_Fountain.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/MapObjects/Models/Building_ResearchLab.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/MapObjects/Models/Building_Shop.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/MapObjects/Models/Building_Well.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/MapObjects/Models/BulletinBoard.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/MapObjects/Models/House_MushroomA.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/MapObjects/Models/House_MushroomOrange.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/MapObjects/Models/House_MushroomYellow.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/MapObjects/Models/House_WoodTower.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/NPC/Models/FishingRankBoard.model` | `WalkBehindFade` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/NPC/Models/Villager_Elder.model` | `VillagerDialog` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/NPC/Models/Villager_Fisher.model` | `VillagerDialog` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentA.model` | `VillagerDialog` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentB.model` | `VillagerDialog` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentC.model` | `VillagerDialog` 프로퍼티 4종 링크 및 Values 명시 |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentD.model` | `VillagerDialog` 프로퍼티 4종 링크 및 Values 명시 |
| `map/town.map` | 해당 엔티티 인스턴스의 `WalkBehindFade` / `VillagerDialog` 프로퍼티 값 동기화 |

## 3. 구현 상세

- **ModelBuilder 명시적 링킹**: `WalkBehindFade` 11종 및 `VillagerDialog` 6종 모델 파일에 `builder.property()`와 `builder.value()`를 사용하여 `Properties` 링크 구조와 `Values` 기본값을 동시에 기술했습니다.
- **MapBuilder 맵 인스턴스 반영**: `town.map`에 오버라이드된 건물 및 NPC 엔티티에도 동일한 프로퍼티 값을 기입했습니다.
- **타입 정합**: `mlua` 스크립트의 `property number` 타입과 호환되는 `double` (`System.Double, mscorlib`) 타입으로 직렬화했습니다.

## 4. 수행한 검증과 결과

- **프로퍼티 대조표**:

| 컴포넌트 | 프로퍼티명 | mlua 선언 기본값 | 모델/맵 명시값 | 일치 여부 |
|---|---|---|---|---|
| `WalkBehindFade` | `CoveredAlpha` | 0.4 | 0.4 | 일치 |
| `WalkBehindFade` | `SortRadius` | 100 | 100 | 일치 |
| `WalkBehindFade` | `CoverNorthExtent` | 1.2 | 1.2 | 일치 |
| `WalkBehindFade` | `CoverWidthScale` | 0.85 | 0.85 | 일치 |
| `VillagerDialog` | `InteractRange` | 3.0 | 3.0 | 일치 |
| `VillagerDialog` | `BalloonDuration` | 4.0 | 4.0 | 일치 |
| `VillagerDialog` | `AutoTalkInterval` | 15.0 | 15.0 | 일치 |
| `VillagerDialog` | `AutoTalkRange` | 6.0 | 6.0 | 일치 |

- **Maker Refresh 빌드 검증**:
  - `maker_refresh_workspace` 호출 → **Error=0** (total 587 / Warning 85 / Info 502).

## 5. 발견한 문제 / 후속 제안

- 범위 밖 잔여 `LWA-4012` 경고 11건 (Furnace 3 / MonsterMeleeAttack 3 / MonsterAI 2 / Monster 2 / SpriteRendererComponent 1) 및 `LWA-1111` 6건은 별도 위생 티켓에서 청소를 제안합니다.

## 6. 제작자 런타임 체크리스트

- [ ] 건물 뒤 통과 시 반투명 농도(`CoveredAlpha=0.4`) 및 가림 범위(`CoverNorthExtent=1.2`, `CoverWidthScale=0.85`)에 변형이 없는가
- [ ] 주민 대화 F키 범위(`InteractRange=3.0`), 말풍선 유지시간(`BalloonDuration=4.0`), 자동수다 주기(`AutoTalkInterval=15.0`)에 변형이 없는가

## 7. 이력

- 2026-07-25 최초 작성 (Gemini 3.6 Flash High)
