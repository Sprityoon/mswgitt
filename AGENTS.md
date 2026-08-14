<!-- >>> managed by mswai >>> -->
# MapleStory Worlds 프로젝트 에이전트 규칙

이 저장소는 MapleStory Worlds(MSW) 기반 톱다운 생존·채집 게임이다.
모든 요청은 MSW 프로젝트 작업으로 처리한다.

## 1. 규칙 우선순위

1. 사용자의 현재 요청
2. 이 문서의 프로젝트 전용 규칙
3. 로드한 MSW 스킬과 레퍼런스
4. 일반적인 개발 관례

MSW는 일반 게임 엔진과 다른 침묵 실패가 많다. 기억이나 추정 대신 실제 프로젝트 파일,
`.d.mlua`, 스킬 레퍼런스와 Maker 로그를 근거로 판단한다.

## 2. 매 작업 시작 절차

분석이나 편집 전에 다음 순서로 준비한다.

1. `msw-general`을 로드한다.
2. `msw-ui-system`을 로드한다.
3. 다음 Foundation 레퍼런스를 전문으로 읽는다. 이미 현재 컨텍스트에 전문이 있으면 다시 읽지 않는다.
   - `msw-general/references/platform.md`
   - `msw-general/references/workspace.md`
   - `msw-general/references/entity.md`
   - `msw-general/references/authoring.md`
4. 이 저장소의 기능을 구현·수정하거나 다음 작업을 이어갈 때는 `msw-project`를 사용한다.
5. [docs/pitfalls.md](./docs/pitfalls.md)의 빠른 색인에서 관련 함정을 확인한다.
6. 변경을 검증 가능한 단계로 나누고 Verify 단계를 포함한다.

`다음 작업`, `이어서 진행`, `현황`, `뭐 할 차례야` 요청은 `msw-planning` 대상이 아니다.
[docs/tasks.md](./docs/tasks.md)와 [docs/workflow.md](./docs/workflow.md)를 기준으로 이어간다.
`msw-planning`은 이 게임과 별개의 신규 월드를 기획할 때만 사용한다.

## 3. 도메인별 추가 스킬

| 작업 | 추가로 사용할 스킬·레퍼런스 |
|---|---|
| `.mlua`, Component, Logic, Event, lifecycle | `msw-scripting` + `references/verify-checklist.md` |
| `.model` | `msw-general/references/model.md` + ModelBuilder 프로토콜 |
| `.map`, 배치, spawn, 좌표 | `entity.md` + MapBuilder 프로토콜 |
| UI, HUD, 팝업, 버튼, `.ui` | `msw-ui-system` + 관련 디자인/API/빌더 레퍼런스 |
| RUID, sprite, animation, sound 검색 | `msw-search`; RUID 적용은 `msw-sprite-ruid` |
| 전투 기반 구조, 피해, 몬스터 AI | `msw-combat-system` |
| 플레이어 공격·이동 스킬과 연출 | `maplestory-skill-maker` |
| 아바타 의상·모션 | `msw-avatar` |
| DefaultPlayer 설정 | `msw-defaultplayer` |
| 인벤토리·상점·퀘스트 등 표준 시스템 | 구현 전에 `msw-packages`와 `docs/wiki/` 확인 |
| Behaviour Tree | `msw-behaviourtree` |
| 이미지 픽셀 변환 | `image-to-pixel` |
| 커밋·푸시 | 사용자가 요청한 경우에만 `msw-checkpoint` |

스킬이 지시하는 필수 레퍼런스는 생략하지 않는다. UI 작업은
`ui-fundamentals.md`와 `layout-recipes.md`, [docs/design-policy.md](./docs/design-policy.md)를 기준으로
기존 UI의 비주얼 아이덴티티를 유지한다.

## 4. 프로젝트 고정 사양

- 맵 모드: `RectTile` (`TileMapMode = 1`)
- 동적 엔티티 Body: `KinematicbodyComponent`
- 중력: 없음
- 점프: `Alt` 비주얼 점프이며 물리 높이는 변하지 않음
- 이동: 방향키 4방향
- 공격·채광: `Ctrl`, 바라보는 인접 셀
- 상호작용: `F`
- 맵:
  - `map/map01.map`: 영지 원본
  - `map/town.map`: 공동 마을
  - `map/template_field.map`: 사냥터
  - `map/template_boss.map`: 보스
- 런타임 영지 인스턴스 이름: `Home_<UserId>`
- CoreVersion 단일 소스: `Environment/config`의 `26.7.0.0`

기존 `.model` 내부의 `MOD.Core, Version=...` 문자열은 버전이 섞여 있어도 일괄 마이그레이션하지 않는다.

## 5. 편집 범위와 수단

| 대상 | 규칙 |
|---|---|
| `RootDesk/MyDesk/**/*.mlua` | 직접 편집 가능 |
| `RootDesk/MyDesk/**/*.csv`, `*.userdataset` | 직접 편집 가능 |
| `RootDesk/MyDesk/**/*.model` | ModelBuilder만 사용 |
| `Global/DefaultPlayer.model` | ModelBuilder만 사용 |
| `map/*.map` | MapBuilder만 사용 |
| `ui/*.ui` | UIBuilder만 사용; 원본 JSON 직접 읽기·편집 금지 |
| `Global/WorldConfig.config` | 값만 편집 가능 |
| `docs/**`, `game_design.md` | 직접 편집 가능 |

다음은 수정하지 않는다.

- `Environment/**`, `*.d.mlua`: API 정의, 읽기 전용
- `*.codeblock`, `*.directory`: Maker가 생성
- `Global/`의 기타 파일과 `common` 엔티티
- `skills-lock.json`에 등록된 벤더 스킬

새 `.mlua`는 `RootDesk/MyDesk/{Category}/Scripts/`, 새 `.model`은
`RootDesk/MyDesk/{Category}/Models/` 아래에 만든다. 새 사용자 파일을 `Global/`에 만들지 않는다.

워크스페이스 탐색은 에이전트가 제공하는 파일 읽기·검색 도구를 우선 사용한다.
`.map`·`.model`·`.ui`는 해당 빌더의 read API로 조사한다. 셸은 `git`, `node`, 검증 스크립트처럼
실제 프로그램 실행에만 사용한다.

## 6. MSW 핵심 불변식

1. `TileMapMode = 1`인 동적 엔티티에는 `KinematicbodyComponent`가 필요하다.
2. 좌표는 월드 단위이며 `1 unit = 100 px`이다.
3. `SpriteRUID = ""`이면 오류 없이 보이지 않는다.
4. `SpawnByModelId`의 parent에는 `nil` 대신 `self.Entity.CurrentMap` 같은 맵 엔티티를 넘긴다.
5. 사용자 스크립트는 `.mlua`와 Maker가 생성한 `.codeblock` 쌍으로 등록된다.
6. 같은 구성의 엔티티를 두 번 이상 배치하거나 런타임 spawn하면 `.model`을 만들고 `modelId`로 사용한다.
7. UI는 클라이언트 전용이다. 서버에서 UI 엔티티나 `_LocalizationService`를 직접 사용하지 않는다.
8. `@Logic`은 맵 전환에도 유지되며 `OnMapEnter`와 `OnMapLeave`가 호출되지 않는다.
9. 구조화 파일 변경은 빌더의 snapshot → patch → write 계약을 따른다.
10. API 이름·타입·ExecSpace는 실제 `.d.mlua`에서 확인하고 추정하지 않는다.

## 7. 프로젝트 절대 규칙

- **프리셋 우선**: 패키지, 기존 모델, UI 템플릿, 리소스를 먼저 찾는다.
- **데이터 주도**: 아이템·레시피·수량·확률·모션명은 데이터셋이나 프로퍼티로 관리한다.
  `if itemName == "..."` 같은 이름 분기를 추가하지 않는다.
- **아이템 키**: 인벤토리 저장 키는 `item_dataset.Name` 값이다.
- **UserDataRow**: `Count()`와 `GetItem(columnName)`만 사용한다. `RowIndex`는 없으며,
  선택 컬럼은 `pcall`로 보호한다.
- **호출 전 정의 확인**: 다른 스크립트의 메서드나 프로퍼티를 호출하기 전에 실제 정의와 시그니처를 검색한다.
- **세이브 경로 Yield 금지**: 필수 `GetAndWait`·`SetAndWait` 외 추가 Yield를 저장 루틴에 넣지 않는다.
- **검증 없는 성공 보고 금지**: 확인하지 않은 결과를 `동작함`, `정상`으로 표현하지 않는다.
- **범위 밖 리팩터링 금지**: 요청과 무관한 구조 변경, 커밋, 푸시를 하지 않는다.

세부 원인과 사고 사례는 이 문서에 복제하지 않고 [docs/pitfalls.md](./docs/pitfalls.md)를 단일 원문으로 삼는다.

## 8. 검증

에이전트의 기본 검증 범위는 다음과 같다.

1. 관련 정적 진단·린트·빌더 검증 실행
2. `maker_refresh_workspace`가 `status ok`인지 확인
3. `maker_logs(kind="build")`에서 Error·Warning·Info 수 확인
4. build 로그 `dateTime`이 이번 refresh 시각과 같은지 확인
5. 신규 `.mlua`라면 `.codeblock` 생성 확인
6. 결과와 검증 범위를 [docs/tasks.md](./docs/tasks.md)에 기록

build 로그는 이전 스냅샷을 다시 반환할 수 있다. 타임스탬프가 맞지 않으면 `Error=0`을 근거로 쓰지 않고
`build 로그 갱신 미확인`으로 보고한다. Warning 기준선과 상세 내역은
[docs/workflow.md](./docs/workflow.md)를 따른다.

build Error=0은 `.map` 직렬화 붕괴, `.ui` 원복, 시각·콜라이더 불일치를 보장하지 않는다.
작업 종류에 맞는 구조 검사와 제작자 육안 확인 항목을 별도로 남긴다.

### Play 검증 정책

Play와 사용자 입력은 제작자 전담이다. 제작자가 해당 턴에 명시적으로 요청한 경우를 제외하고 다음 도구를 호출하지 않는다.

- `maker_play`, `maker_stop`
- `maker_keyboard_input`, `maker_mouse_input`
- `maker_execute_script`, `maker_screenshot`
- `maker_save`, `maker_move_map`
- `maker_reset_data_storage`, `maker_import_maplestory_map`

Play를 실행하지 않았으면 `런타임 검증 보류(제작자 수행)`라고 정확히 적는다.
MCP가 연결되지 않았으면 가능한 정적 검증까지만 수행하고 `refresh 검증 보류`라고 적는다.

## 9. 운영과 보안

- 운영 체제는 제작자 1명 + AI 보조다.
- 하위 에이전트는 제작자가 명시적으로 요청한 경우에만 사용한다.
- 신규 T번호를 발행하지 않는다. 구 T번호는 `docs/agents/`의 아카이브 식별자로만 쓴다.
- `.mcp.json`, `.cursor/mcp.json` 등 토큰이 들어가는 MCP 설정 파일은 커밋하지 않는다.
- 중간 단계가 실패하면 이후 단계를 진행하지 말고 원인을 먼저 해결한다.

## 10. 문서 단일 소스

| 주제 | 문서 |
|---|---|
| 진행 중·예정 작업 | [docs/tasks.md](./docs/tasks.md) |
| 작업·검증 절차 | [docs/workflow.md](./docs/workflow.md) |
| 실측 함정과 판별법 | [docs/pitfalls.md](./docs/pitfalls.md) |
| 전체 설계·Phase | [game_design.md](./game_design.md) |
| 스토리·맵 컨셉·퀘스트 콘텐츠 설계 | [docs/design/story/README.md](./docs/design/story/README.md) |
| 타일 문법 | [docs/tile-scheme.md](./docs/tile-scheme.md) |
| 상시 디자인 정책 | [docs/design-policy.md](./docs/design-policy.md) |
| 스킬 라우팅 | [docs/reference/skill-routing.md](./docs/reference/skill-routing.md) |
| 훅·편집 차단 | [docs/reference/hooks.md](./docs/reference/hooks.md) |
| 물리·조작 | [docs/reference/physics-controls.md](./docs/reference/physics-controls.md) |
| 리소스 API 함정 | [docs/reference/resource-api-pitfalls.md](./docs/reference/resource-api-pitfalls.md) |
| 구 T기록 | [docs/agents/README.md](./docs/agents/README.md) |
<!-- <<< managed by mswai <<< -->
