# 하위 에이전트 작업 핸드오프 (Subagent Handoff)

> **용도**: 상위 에이전트/보스가 하위 에이전트에게 작업을 위임할 때 이 문서를 그대로 전달한다.
> 하위 에이전트는 **§1 공통 컨텍스트를 먼저 전부 읽고**, §3 작업 큐에서 지정된 작업 항목만 수행한다.
> 새 작업이 생기면 §3에 항목을 추가하고, 완료되면 상태를 갱신한다.
>
> 🧹 **2026-07-16 슬림화(지휘자, 보스 지시)**: 완료 티켓 원문·과거 실행 계획 일지는 **git 이력(커밋 3d9fcce 이전 버전의 이 문서)과 `docs/agents/reports/T<n>-*.md`로 이관**. 이 문서는 살아있는 규칙(§1) + 완료 포인터(§2) + 현재 큐(§3)만 유지한다. 과거 티켓의 스펙 원문이 필요하면 해당 보고서 또는 `git log -p -- docs/agents/subagent-handoff.md`를 볼 것.

---

## 1. 공통 컨텍스트 (모든 작업 전 필독)

### 1.1 프로젝트

- MSW(MapleStory Worlds) 생존/채집 게임. 루트: 저장소 루트 (작업 컴퓨터별 상이 — 예: `C:/minho/메이플월드`, `d:/메이플월도`)
- 톱다운 `RectTile` 맵 (영지 `Home_<UserId>` / 공동 마을 `town` / 사냥터 `template_field` / 보스 `template_boss`). 플레이어는 `KinematicbodyComponent`.
- 전체 게임 설계: `game_design.md` (84KB — 필요한 §만 검색해 읽을 것)
- 에이전트 규칙: `AGENTS.md` + `docs/agents/*.md` (특히 하드코딩 금지 룰 §2, 8대 핵심 규칙 §3)

### 1.2 절대 규칙 (위반 시 작업 무효)

1. **하드코딩 금지**: 아이템명/수치/모션명 등 데이터성 값은 `if name == "..."` 분기 금지. 데이터셋(`.csv` + `.userdataset`) 컬럼으로 관리하고 `_DataService:GetTable(...):FindRow(...)`로 조회한다. 불가피하면 **구현 전에 보스에게 질문**.
2. 편집 허용: `RootDesk/MyDesk/**`, `Global/DefaultPlayer.model`, `Global/WorldConfig.config`, `map/*.map`, `ui/*.ui`(빌더 경유). `.codeblock`/`.d.mlua`/`Environment/`는 절대 수정 금지.
3. 좌표는 월드 단위(1 unit = 100px). `SpawnByModelId`의 parent에 nil 금지(`self.Entity.CurrentMap` 사용).
4. 아이템 식별자는 `item_dataset`의 `Name` 컬럼 값(표시명 키)이다. 소문자 `id`와 혼동 금지.
5. 런타임 검증 없이 "동작함"이라고 보고 금지. Maker MCP(`refresh`→`play`→`logs`→`stop`)를 못 쓰는 환경이면 "코드 수정 완료, 런타임 검증 보류"로 정확히 보고.
6. **UI 작업 공통 (2026-07-11 신설 — 보스 지시)**: `.ui` 파일이나 UI 스크립트를 만지는 **모든** 작업은 착수 전에 msw-ui-system 스킬의 SKILL.md와 **`references/ui-aesthetics.md`(디자인 철학) 전문**을 로드한다 — 특히 §0 Gray Box Syndrome 회피, §1 비주얼 아이덴티티 선결정, §2 패널 해부, §5 간격·정렬 리듬. 납품 전 **동 문서 §7 자가 리뷰 루브릭 평가를 수행해 보고서에 표로 첨부**한다(누락 시 작업 미완료 — 루브릭은 **실측 좌표 근거**로 작성). 기존 게임 UI(인벤토리/HUD/상점)와 같은 비주얼 아이덴티티를 유지하고 화면마다 새 스타일을 발명하지 않는다. 레이아웃 작업 시 `references/layout-recipes.md`도 참조.
7. **데이터셋 행 접근 API (2026-07-11 신설 — T35 사고 재발 방지)**: `UserDataSet:FindRow()`가 반환하는 `UserDataRow`는 **`Count()`와 `GetItem(columnName)` 두 메서드만 제공**한다. `row.RowIndex`는 존재하지 않는 프로퍼티(nil)이며 이를 `GetCell`에 넘기면 `[LEA-3005] InvalidArgument`로 호출한 서버 루프가 통째로 중단된다. 행 값 조회는 반드시 `row:GetItem("컬럼명")`으로 하고, 존재가 불확실한 컬럼은 pcall 가드를 쓴다(없는 컬럼 GetItem은 LEA-3011 — `Furnace.mlua` readDur 선례).
8. **크로스 스크립트 API 호출 전 정의 확인 (2026-07-11 신설 — T18 치명 오류 재발 방지)**: 다른 스크립트의 메서드/프로퍼티를 호출하는 코드를 쓰기 전에 **반드시 대상 `.mlua` 파일에서 해당 정의를 검색해 존재와 시그니처를 확인**한다. 정의가 없으면 추정으로 호출하지 말 것 — 소유 레인 밖 파일에 정의를 새로 만들어 붙이는 것도 금지, [보류]+질문으로 전환한다. "아마 있을 것" 추정 호출이 과거 배치의 치명 런타임 오류 원인이었다.
9. **세이브 경로 Yield 금지 (2026-07-11 신설 — T37 인벤토리 전량 유실 사고 재발 방지)**: `SavePlayerData` 등 영속 저장 루틴 안에서 필수 `GetAndWait`/`SetAndWait` 외의 **추가 Yield 호출(다른 GetAndWait, 타이머 대기 등)을 절대 넣지 않는다**. Yield 사이에 플레이어 엔티티가 파괴되면 이후 읽는 컴포넌트 값이 nil → 기본값 폴백으로 **세이브가 빈 데이터로 덮인다**. 저장에 필요한 컴포넌트 값은 루틴 진입 직후 전부 지역 변수로 선캡처하고, 외부 조회가 필요하면 세션 캐시를 쓴다.
10. **UI stretch 앵커 미신뢰 — RectSize 명시 (2026-07-14 신설 — T48 '정체불명 박스' 실증)**: 이 프로젝트 런타임(CoreVersion 26.5.0.0)에서 `.ui` 자식의 stretch 앵커(AnchorsMin≠AnchorsMax)+Offset 0 조합은 **부모 크기로 늘어나지 않고 `RectSize` 값 그대로 렌더**된다(지휘자 Play 캡처 실증). 새/수정 `.ui` 자식은 **명시 anchor+rect_size로 작성**하고, 부모 크기를 바꾸면 stretch 자식의 RectSize 동기화 여부를 반드시 함께 확인한다.
11. **Maker 스테일 저장이 빌더 산출 `.ui`를 되돌린다 (2026-07-15 신설 — 실사고)**: Maker 에디터는 저장 시 **에디터 메모리 상태로 워크스페이스 파일을 통째로 재직렬화**한다. 에디터가 구버전 상태(git pull·빌더 편집을 refresh로 반영하기 전)를 들고 있으면 무관한 저장에도 `ui/*.ui`가 구버전으로 덮인다 — 2026-07-15 실사고(T47·T48·T50 산출물 소실 → 지휘자 HEAD 복구). **규칙**: ① git pull 또는 빌더로 `.map`/`.model`/`.ui`를 바꾼 뒤에는 Maker에서 어떤 저장이든 하기 전에 반드시 `refresh` 먼저 ② 에이전트는 Maker 저장 흔적(git status에 의도치 않은 `.ui`/`.csv` 변경)이 보이면 **덮어쓰기 여부부터 대조**하고 작업을 시작한다(핵심 산출물 존재 검사 — `scratch/inspect_stale_save_check.cjs` 선례) ③ CSV의 BOM 재직렬화는 무해(클린 필터 처리). `.ui` 전량 재직렬화 diff도 **내용이 전수 실존하면 무해** — 되돌리지 말고 커밋에 포함(2026-07-16 판정 선례. 되돌리면 다음 에디터 저장에서 재발).
> 🔴 **3차 사고 (2026-07-25, 지휘자 실측) — "재직렬화는 무해" 판정을 오용하지 말 것**: `maker_refresh_workspace` 직후 `ui/PopupGroup.ui`가 전량 재직렬화(+16,685 −16,683)되면서 **T79의 L029 수정(FurnacePopup 중첩 `UIGroupComponent` 제거)이 원복**됐다. HEAD=`false` / 워킹트리=`있음`, 엔티티 수는 341로 동일. **2026-07-16 판정의 전제는 "내용이 전수 실존"이며, 산출물이 하나라도 사라졌으면 그 판정은 적용되지 않는다** — 그때는 복구가 정답이다(→ T88). **재직렬화 diff를 봤을 때의 필수 절차: 무해 판정 전에 반드시 "그 커밋이 만든 핵심 산출물이 지금도 실존하는가"를 빌더로 1건씩 대조**할 것(엔티티 수 일치는 근거가 아니다 — 이번 건도 수는 같았다). 또한 **`refresh` 호출 자체가 Maker의 스테일 상태를 디스크로 밀어낼 수 있다**는 점이 이번에 처음 실증됐다 — 빌더로 `.ui`/`.map`/`.model`을 바꾼 세션에서는 refresh 전후로 `git status`를 확인한다.
12. **`_EffectService`/`_ParticleService` instigator에 nil 금지 (2026-07-18 신설 — T71 런타임 실측)**: `PlayEffect`/`PlayBasicParticle` 등의 instigator 인자에 `nil`을 넘기면 **클라이언트에서 생성이 에러 없이 조용히 실패(serial=0)** 한다 — 서버는 nil을 통과시켜 serial>0을 반환하므로 "서버 로그만 성공"으로 오진하기 쉽다. 반드시 유효 엔티티(시전자·대상 등)를 넘기고, 재생 직후 반환 serial을 로그로 남겨 0 여부를 확인한다. `SpawnByModelId` parent nil 금지(핵심 규칙 4)와 동계열 함정.

### 1.3 ⚖️ 현행 타일 스킴 (2026-07-08 밀착 페어 확정 — 이 문서의 최우선 배경지식)

**grass 기준 사각형 디자인 + 서브셀 흙 마스크, 밀착 페어 문법.** 이전 스킴(좁은 길 = L2 홀)은 2026-07-08 폐기 — 좁은 길은 이제 **L2가 덮인 방향 에지 페어**다(길 셀에 L2 홀 0칸).

| 레이어 | 엔티티 이름 | 내용 |
|---|---|---|
| Layer 1 (SL0) | `RectTileMap` | **`Soil` 전면 깔림** (광장/밭 바닥이자 베이스 지반) |
| Layer 2 (SL1) | `RectTileMap2` | **잔디 커버** — `FullGrass`(중앙) + `Grass{LT,T,RT,L,R,LD,D,RD}`(방향 에지 — 밀착 길·프린지) + `Grass{LT,RT,LD,RD}Corner`(오목 모서리) |
| Layer 3 (SL2) | `RectTileMap3` | 설치 바닥 (런타임 전용, tile1) |
| Layer 4 (SL3) | `RectTileMap4` | `Big Wall` 충돌 밴드 (경계 3겹) |
| Layer 5 (SL4) | `RectTileMap5` | 경계 테라스 비주얼 (TerraceTop 링 + 북벽 CliffFace) |
| MapLayer5 | (엔티티 전용) | 몬스터·NPC·자원·가구·드롭 |

- **서브셀 흙 마스크 (단일 표현)**: 모든 지형 문법은 셀당 2×2 서브셀 흙 마스크 하나로 통일. 셀 패턴 → 타일: 흙 0칸=`FullGrass` / 인접 2칸=`Grass{T|D|L|R}` / 3칸=볼록 `Grass{LT|RT|LD|RD}` / 1칸=오목 `Grass*Corner` / 4칸=L2 홀(L1 Soil 노출) / **대각 2칸=`SubGrass{LTRD|RTLD}` (T51, 2026-07-15 — 마스크 6=TL+BR→LTRD, 9=TR+BL→RTLD. 전 마스크 0~15 표현 가능, 구 FixDiagonalMask 승격/강등 보정 폐기)**. 접미사 방향 = 흙(길) 쪽. ※ 생성기(`build_maps.cjs`)는 대각을 산출하지 않음 — 대각은 런타임 편집 전용, 생성기 산출 검사의 "대각=에러"는 자기 산출물 한정으로 유효.
- **문법 1 — 길 (밀착 에지 페어, L2 홀 0칸)**: 셀 경계 좌표 중심선 폴리라인에서 폭 2서브셀(시각 1셀) 흙 밴드를 파생. 수평 길 = `GrassT|GrassD` 밀착 페어, 수직 길 = `GrassR|GrassL` 페어. ㄱ자 꺾임(바깥 오목 캡+안쪽 볼록), 막다른 끝(오목 코너 페어 캡), 길↔광장 접속은 마스크 합집합으로 전부 자동.
- **문법 2 — 광장/밭/보스 아레나 (홀 유지)**: 셀 사각형 + ½셀 마진. 내부 = L2 홀, 둘레 잔디 셀 = 프린지 에지, 모서리 = 오목 `Grass*Corner`. 광장 안 잔디 섬(정원)은 island 도려냄(같은 ½ 마진 규칙).
- ⚠️ **잔디 스트립 최소 2칸**: 두 흙 영역 사이 잔디가 1칸이면 양쪽 ½마진이 겹쳐 흙으로 병합된다 (map01 밭 고랑이 이 규칙으로 2칸 확보됨 — 밭 A `[-23,-19]`).
- `wall.tileset`은 2026-07-07 리네임으로 프린지가 `Soil{dir}` → **`Grass{dir}` 8종**으로 바뀌었고, `Soil*2`(구 내부 모서리) 폐기 + `Grass*Corner` 4종 추가. 2026-07-15 제작자가 대각 `SubGrass{RTLD|LTRD}` 2종 추가(아트 `tileimg/`). **L2 잔디 패밀리 = `FullGrass` + `Grass{dir}` 8 + `Grass*Corner` 4 + `SubGrass` 2 = 15종** (`IsGrassTileName` 판정 = "FullGrass" | prefix "Grass" | prefix "SubGrass"; 방향 에지 길 판정 `IsGrassEdgeTileName`에 SubGrass 포함).
- **기록/구현 위치**:
  - 블록아웃 생성기 `scripts/build_maps.cjs` (헤더 주석 = 스킴 명세. `makeDirt`(walk/plaza/island)+`cellTile`이 문법 단일 소스. `--force` 필수 — 손편집 전량 덮어씀. 산출 검사 내장: 무효 타일/길 셀 L2 홀 발견 시 즉시 실패)
  - 런타임 `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` — `IsGrassTileName`(잔디 패밀리) / **`IsGrassEdgeTileName`(방향 에지=길 판정)** / `IsSoilTileName`(정확히 `"Soil"`) / `ComputeGrassTileName` / 자원 스폰 `RequiredTile` 판정: `FullGrass`·`Grass*Corner` → `"FullGrass"`(스폰 가능), 방향 에지 → `"Soil"`(길 — 잔디 요구 자원 억제), L2 홀+L1 Soil → `"Soil"`(광장 바닥) / `AutotileGrassLayer`(⛔ 홀 문법 전용 — 밀착 페어 길을 FullGrass로 평탄화하므로 `AutotileGrassOnSetup` 기본 OFF 절대 유지)
  - 미니맵 `RootDesk/MyDesk/UI/Scripts/UIMinimapController.mlua` `TileColor` — 방향 에지·`Soil`(정확 일치)=흙색, `FullGrass`/`Grass*Corner`=잔디색
  - 설계 기록 `game_design.md` §3.5 "지형 (TileMap)" 불릿
- `BiomeResourceDataSet.csv`의 `RequiredTile=FullGrass` 행(Tree/GrownGrass)은 그대로 유효 — `FullGrass`/`Grass*Corner` 셀에서만 스폰, 길(방향 에지)·광장 홀에서는 억제.

### 1.4 검증 프로토콜 (Maker MCP)

- 브리지 스크립트: `scratch/mcp_probe.py`(연결/툴 목록), `scratch/run_lua.py`(Play 컨텍스트 Lua 실행), `scratch/watch_maker_logs.py`(로그 감시).
- MCP bat 경로 리졸버: `MSW_MCP_BAT` 환경변수 → 프로젝트 `.mcp.json`의 `msw-maker-mcp` args → 알려진 설치 경로 순.
- ⚠️ `watch_maker_logs.py`는 `if __name__ == "__main__"` 가드 없이 모듈 최상위에서 감시 루프가 즉시 실행됨. **import 금지**(import만으로 MCP 브리지가 떠서 라이브 세션과 충돌). 반드시 `python scratch/watch_maker_logs.py`로 직접 실행할 것.
- 표준 절차: Maker 에디터 실행 상태에서 `refresh` → `play` → 시나리오 재현 → `logs(kind=normal)`에서 Error/Warning 확인 → `stop`.

### 1.5 ⚖️ 상시 디자인 정책 (보스 확정 누적 — 위반 금지)

- **PC/모바일 UI 레이아웃 분기 금지 — 단일 고정 레이아웃**(⚖️ 2026-07-15): `IsMobilePlatform()` 등 런타임 분기 배치 금지. 터치 타겟은 상시 ≥88px 지향(T62 스킬바 선례).
- **월드 클릭/터치 상호작용 금지 — 상호작용 = F 키(PC) / BtnInteract(모바일)만**(⚖️ 2026-07-15, T59): 월드 엔티티에 `TouchEvent` 상호작용 부착 금지. 신규 인터랙터블은 자체 F 핸들러(KeyDownEvent — `MerchantInteract` 패턴) + `InteractRequestEvent` 구독(모바일 브리지)의 이중 연결.
- **날씨는 보너스만**(페널티 금지, ⚖️ 2026-07-11) / **영지 평화 원칙**(영지 내 전투·피격 없음) / **허기 시스템 기각**(페널티형 — 아늑한 생활 톤과 충돌) / **도감 보상 = 최초 발견 즉시 자동 지급**(⚖️ 2026-07-13).
- **스킬트리 단순성 가드라인**(⚖️ 2026-07-15 "복잡한 구조 거부"): 단일 부모 · 같은 열 바로 위 행만 · 3행×3열 상한 — `docs/design/skill-tree-plan.md` §8.3. 전직 확장 계약 = 동 문서 §7.

---

## 2. 완료된 작업 기록 (포인터 전용)

> 상세 스펙·구현 이력 = `docs/agents/reports/T<n>-*.md` + git 이력(이 문서의 과거 버전 포함). 설계는 `game_design.md` Phase 트래커에 반영 완료.

- **타일 스킴 전환(07-07/08) + 대각 SubGrass(T51)** — 최신 명세의 단일 소스 = **§1.3**.
- **Phase 14 완결**: 지형 편집 v2(T5·T11~T13 — 마스크 스펙은 git·보고서, T6 농사가 digHole 판정 재사용) · 농사(T6)+작물 비주얼(T24) · 제작창 도감형(T14→T25→T26) · 연구소(T7) · 침대(T8) · 희귀 드롭(T9) · 도구 아트(T15) · 인벤→퀵슬롯 드래그(T10).
- **Phase 15 완결**: 버프(T16) · 요리(T17) · 낚시(T18 — `FishingSpot.mlua`·`FishDataSet`·rod 게이트=`PlayerController.IsEquippedFishingRod`) · 의뢰 게시판(T20) · 목장(T19) · 날씨(T21 — `WeatherManager` @Sync) · 도감·업적(T22, 업적=QuestAndAchievement 패키지 재사용)+분류 칩(T42)+발견 보상(T43)+LEA-3044 수정(T44) · 펫(T23).
- **감사·버그픽스**: 감사 배치 T28~T35(MonsterId 체계·XP 컬럼화·통화/포탈 컬럼화·RowIndex 핫픽스=규칙 7 유래) · 자원 통과 AABB(T36) · 로그아웃 정책+세이브 유실 핫픽스(T37=규칙 9 유래) · 몬스터 전투 체감(T38) · 원거리 포자(T39) · 멧돼지 돌진/도약(T40) · 충돌 정합+점프 순간이동(T41) · 배치 D(T31② 고기 축·T32② Bed=50).
- **Phase 16 스킬**: 해금·장착 정합(T45 — QWER 공백 시작+장착 RPC) · 원작 스킨(T46 — MSWPackages에 스킬 패키지 없음 확인, 원작 리소스+`_EffectService`=공식 방식) · 트리 UX(T47 클릭/투자 분리+HUD 버튼 → T48 부분 → T50 노드 아이콘 칩+상세 사이드 패널) · **트리 위상화(T58 — `ParentRequiredLevel` 연계 게이트+연결선, 설계=skill-tree-plan §8)** · 연결선 선명화(T60). 전직=16-C 예약(설계 계약=skill-tree-plan §7, 티켓 미발행).
- **Phase 17 모바일·입력**: 배치 H — 터치 시전·이름 숨김·툴팁(T52), HUD 88px·UIMyInfo 정합(T53), 팝업 닫기 88px 통일·Furnace 구조 정합(T54) → **⚖️ 단일 레이아웃 정책 전환으로 T62(스킬바 고정 우하단 88px)가 T52 플랫폼 분기부 대체**. **클릭 상호작용 전면 제거+`TryInteract()` 일원화+`InteractRequestEvent` 모바일 브리지(T59)**.
- **Phase 18 소리와 사람**: BGM+날씨 앰비언스(T55 — `BGMManager`+`BGMDataSet`) · 주민 대화 말풍선(T56 — `ChatBalloonComponent` 자작, dialog 패키지 부적합 판정) · 주간 낚시왕(T57 — ranking-basic-package `FishingWeekly`, **Play 실패 → T63 재작업 중**).
- **가축·펫 아트(T49)** — 닭/양/개/우리 전용 RUID 교체(슬라임 placeholder 소멸).
- **운영 사고·인프라**: `.ui` 스테일 저장 사고 2건 판정(규칙 11) · 훅 상대 경로 전환(07-14) · SessionStart 훅 stdin 블록 수정(07-16) — 상세 `docs/agents/hooks.md`.

---

## 3. 작업 큐 (하위 에이전트 위임 대상)

> 상태: `[대기]` / `[진행]` / `[완료]` / `[보류]`
> 각 항목은 **Target(파일) / Change(변경) / Acceptance(완료 기준)** 3요소를 반드시 채운다. **T번호는 단조 증가·재사용 금지 — 현재 최대 = T100.**

> 🧭 **현황판 (지휘자 2026-07-21 — 버그픽스)**
> - **Play PASS 확정**: T50까지의 전 완료분 + T56(주민 대화 말풍선 버그픽스 검증) + T51 · T58 · T59 · T60 · **T62**(⚖️ 2026-07-16 확정) · **T63**(낚시 랭킹 수정 — 핫픽스 포함 확인). 체크포인트 커밋 = 이 갱신과 동시.
> - **Play 대기(제작자 광범위 Play에서 이상 보고 없음 — 개별 명시 확인은 미완)**: T19(목장) · T23(펫) · T27(퀘스트 107 해금 — **미완료 캐릭터로** 확인) · T49(아트 육안) · T54(팝업 여닫기) · T55(BGM) · **T61(지형 쿨다운 0.25s 체감)**. 체크리스트 = 각 `reports/T<n>-*.md` §6.
> - **코드 완료·Play 대기(2026-07-18)**: **T64 낚시 v2** — 지휘자 직접 구현 완료(LSP errors=0). ⚠ Maker 미기동 상태에서 작업 — **첫 refresh에서 신규 스크립트 2종(`UIFishingGaugeController`)·데이터셋(`FishingDifficultyDataSet`) 등록 + Error=0 확인 필요**. 체크리스트 = `reports/T64-fishing-v2-reeling.md` §6.
> - **⚖️ 2026-07-18 보스 지시 3건 → 배치 J (T65→T66→T67) 코드 완료(2026-07-18)**: 세 티켓 모두 refresh Error=0 · **런타임 검증 보류(제작자 Play)**. 보고서 = `T65-mine-attack-sfx.md` · `T66-skill-vfx-dash-damage.md` · `T67-aim-cell-interact-gate.md`. **⚖️ 제작자 1차 Play 피드백(2026-07-18): "선택된 사운드들이 어색" → 커밋 9850556 후 "모든 소리가 어색, 네가 선택하라" 지시 → T68(지휘자 직접)로 11슬롯 전량 재선정 완료.**
> - **⚖️ 2026-07-18 제작자 Play 버그 2건 → 배치 K(T69·T70) 코드 완료 + T71 지휘자 직접 해결**: ① QWER 장착 재접속 초기화 = T69 영속화(Play 확인 대기) ② 스킬 모션 = T70 `CastAction`(런타임 재생 확인) ③ 이펙트 미표시의 진범 = **`PlayEffect` instigator nil(신설 규칙 12)** — T71에서 수정, **시전 경로 클라 serial>0 런타임 검증 완료**(육안 최종 확인만 제작자). 사운드 재선정 잔여분은 ⚖️ 제작자 직접(T68 현황 유지).
> - **⚖️ 2026-07-23 보스 지시 → 배치 L (T79→T80) 코드 완료**: ① T79 FurnacePopup 중첩 UIGroup 제거(ui_lint error=0) ② T80 마을 NPC 7기 legacy/TouchReceive 청산 + ResidentA~D 이름표(미나/유나/다은/토리). **Maker MCP 미연결 — refresh·Play 보류(제작자)**. 보고서 = `T79-furnace-nested-uigroup.md` · `T80-town-npc-legacy-cleanup.md`.
> - **⚖️ 2026-07-23 보스 결정 → 배치 M (T81→T82) 코드 완료**: ① T81 마을 건물·구조물·NPC·연못 Trigger+OccupiedArea 등록 ② T82 IsAimTarget Trigger AABB footprint. **Maker MCP 미연결 — refresh·Play 보류(제작자)**. 보고서 = `T81-town-movement-blocking.md` · `T82-aim-trigger-aabb.md`.
> - **⚖️ 2026-07-23 보스 지시 → T83 코드 완료**: 건물 walk-behind — MapObject식 반투명+Y정렬(`WalkBehindFade`, 11종). **refresh·Play 보류(제작자, 신규 mlua 등록 필수)**. 보고서 = `T83-building-walkbehind-fade.md`.
> - **✅ 2026-07-25 지휘자 refresh 검증 — T79~T83 빌드 게이트 일괄 통과**: Maker MCP 재연결 후 `maker_refresh_workspace` 실행 → **Error=0** (total 587 / Warning 85 / Info 502). 문서상 "MCP 미연결 보류"였던 T79·T80·T81·T82·T83의 **코드 게이트 확정 통과**. 잔여는 Play 체감(제작자)뿐. ⚠️ Warning이 baseline 25 → 85로 증가(전량 `LWA-4012` 프로퍼티 기본값 미명시 — WalkBehindFade 44 / VillagerDialog 24) → **T86**으로 청소.
> - **⚖️ 2026-07-25 보스 결정 → 배치 N (위생·정합, T84→T85→T86→T87)**: T75/T76(town.map 아트 배치) **착수 전 선행**. 근거 = 지휘자 실사에서 8대 핵심규칙 위반 1건·설계 회귀 1건·문서 미동기 다수 확인. 상세는 각 티켓.
>   - ⚖️ **T81 Trigger 박스 3역할 겸임(차단·상호작용·페이드)은 현행 유지 확정**(2026-07-25 보스) — 단일 데이터 소스 이점 우선. Play에서 실제 불편이 나오면 그때 분리 티켓.
> - **🧭 2026-07-25 지휘자 직접 — 무티켓 커밋 소급 기록**: 커밋 `38ae03c`(2026-07-22 "top-down pixel artwork rework")는 T번호·보고서 없이 머지됨. 실사 결과 = ① `Building_Fountain`·`FishingSpot_Pond`·`GrownGrass` 모델 스프라이트 리스킨(커스텀 픽셀 아트) ② `.sprite` 3종 신규(fishing_board/fishing_pond/quest_board) ③ `town.map` 265행 변경 ④ **`map/map01.map`의 `FishingSpot` 엔티티 삭제(85행)** — ④가 설계 회귀라 **T85로 복구**. ①~③은 산출물 실존 확인 완료로 소급 승인(별도 재작업 불요). **부수 확정 2건**: `artwork-spec` B12 상점 리스킨은 커스텀 아트(`cfa2990a…`)로 이미 해결 / **T78의 낚시터 리스킨분은 이미 완료**(`FishingSpot_Pond`=`ecb83722…` = spec F9) → T78 범위에서 제외.
> - **✅ 2026-07-25 제작자 Play 확인 — T79·T80·T81·T82·T83 전량 [완료]**: 제작자 일괄 확인("전부 확인됐어"). 배치 L·M + walk-behind 종결. `game_design.md` Phase 20에 반영 완료.
> - **🔴 2026-07-25 규칙 11 사고 3차 발생 → T88 긴급 발행**: `maker_refresh_workspace` 직후 `ui/PopupGroup.ui`가 전량 재직렬화되며 **T79 산출물이 원복**됨(HEAD=`UIGroupComponent false` / 워킹트리=`있음`, 엔티티 수 341 동일). **"재직렬화 diff는 무해" 판정을 근거 없이 적용하면 안 된다**는 교훈을 §1.2 규칙 11에 3차 사례로 추가. **커밋 전 반드시 T88 선처리** — 안 하면 T79가 되돌아간 채로 이력에 박힌다.
> - **⚠️ 2026-07-25 병렬 워커 진행 중 (지휘자 실측)**: 워킹 트리에서 **T84 완료 반영 확인**(`town.map` `RigidbodyComponent` 14→**0**, NPC 모델 7종 각 −1행) + **T85 완료 반영 확인**(`map/map01.map`에 `FishingSpot` 재배치 — 새 UUID `e3c374da…`, `TriggerComponent`+`script.FishingSpot`+`script.ResourceOccupiedArea`, 제작자 커스텀 연못 아트 `68496b17…` 적용). 미커밋 상태이므로 **다른 세션이 같은 파일을 만지지 말 것**. 🧭 부수 확인: `FishingSpot_Pond.model`의 `SpriteRUID`가 `ecb83722…`(공식 F9) → **`68496b17…`(제작자 커스텀 톱다운 연못, `msw_topdown_fishing_pond_256.sprite`)** 로 교체됨 — 상위 품질이므로 승인, `artwork-spec` 정정 반영 완료.
> - **🧭 2026-07-25 지휘자 — 2레인 병렬 배치 정의 (에이전트 2인 위임)**
>   - **레인 A (주력 — 물·낚시·정렬, 순차 강제)**: **T89 → T90 → T91 → T92**
>     - 소유: `Util/RenderLayers.mlua` · 신규 `MapObjects/Scripts/YSortSprite.mlua` · `MapObjects/Scripts/{ResourceSpawner, WalkBehindFade}.mlua` · `Player/Scripts/{PlayerController, PlayerInventory}.mlua` · `Monster/Scripts/MonsterSpawner.mlua` · `Furniture/Scripts/FishingSpot.mlua` · `UI/Scripts/UIMinimapController.mlua` · `RootDesk/MyDesk/wall.tileset` · `scripts/build_maps.cjs` · `item/DataSets/FishDataSet.csv` · **`map/*.map` 전량** · `NPC/Models/*` · `MapObjects/Models/Animal_Cat.model` · `Furniture/Models/FishingSpot_Pond.model`
>     - 순차가 강제되는 이유: `ResourceSpawner.mlua`(T89·T90·T92 공유) + `PlayerController.mlua`(T89·T91 공유) + T90의 물 타일이 T91·T92의 선행 조건.
>   - **레인 B (독립 — UI 회귀·몬스터, 순차)**: **T88 → T93**
>     - 소유: `ui/PopupGroup.ui` · `Monster/Scripts/MonsterAI.mlua` · 신규 `Furniture/Models/*`(차단 장치) · 신규 `Furniture/Scripts/*`(차단 장치) · **`item/DataSets/item_dataset.csv`** · 제작 레시피 데이터셋
>     - 레인 A와 파일 교집합 0 — 완전 병렬 가능.
>   - ⚖️ **교차 레인 조정 1건 — `item_dataset.csv`는 레인 B 전용**: T92(레인 A)의 물 파기 도구는 **기존 `Shovel` 재사용으로 CSV 행 추가 없이** 처리한다. 전용 신규 도구가 꼭 필요하다고 판단되면 임의 추가하지 말고 **[보류]+질문**(레인 충돌).
>   - **레인 A 꼬리 추가 (⚖️ 2026-07-28)**: T92 다음에 **T95**(Y정렬 기준점을 접지선으로 통일 — T89 후속 보정). 레인 A 최종 순서 = **T89 → T90 → T91 → T92 → T95**.
>     - 🧭 **T89 검수 소견**: T89는 refresh Error=0으로 코드 게이트를 통과했으나 **티켓 ⑤(발밑 기준 + `SortYOffset` 보정)을 실질 미이행**했다 — `SortYOffset` 프로퍼티만 신설되고 전 모델에서 값이 0이라 접지선 보정이 적용되지 않았다. 보고서 §5 "발견한 문제 없음"은 이 누락을 놓친 것. **T89를 반려하지는 않되**(방향 규칙·일원화는 정상 이행), 잔여분을 T95로 분리 발행한다.
>   - **레인 A 완료 후 발행 (아트 배치)**: **T75(소품 P1~P11)만**. 🔴 **T90보다 먼저 착수 금지** — T90이 `build_maps.cjs`로 맵을 재생성하면 손배치가 전량 소실된다(아래 경고).
>   - ⚖️ **2026-07-25 보스 결정 — 아트 큐 정리 4건**: ① **T75 = 소품 P1~P11로 축소**(에이전트 유지 — 공식 RUID 검증 완료분이라 가성비 최고) ② **노점 M1~M3 → T94 [제작자 직접]** (커스텀 리드로우 5종 중 취향 선택) ③ **T76 랜드마크 3동 → [제작자 직접]** (여관·시계탑은 리드로우 품질 판단 필요) ④ **T78 필드 변주 → [폐기]** (체감 최저 + Phase 21이 사냥터 지형을 재편해 중복 작업). **에이전트는 T76·T94·T78·T4를 큐에서 건너뛴다.**
>   - 🔴 **T90 착수자 필독 — `build_maps.cjs --force` 위험**: `map/town.map`에는 T73·T74·T77·T81·T83의 **손배치 자산(건물 8동·NPC 7기·Trigger·WalkBehindFade·SortingLayer 패치)** 이 대량으로 들어 있고, `map01`에도 지형 편집·배치물이 있다. `--force` 재생성은 **이를 전량 덮어쓴다**. town의 수역은 재생성이 아니라 **MapBuilder 손배치로 넣고**, 생성기 재생성은 `template_field`에 한정할지를 **착수 전에 제작자에게 확인**하고 그 답을 보고서 §3에 기록할 것. 확인 없이 `--force` 실행 금지.
> - **✅ 2026-07-28 지휘자 검수 — T88·T89·T90·T91·T92·T93·T95 보고 3종 전량 충족, 코드 게이트 통과**
>   - **지휘자 직접 refresh 재검증**: **Error=0 / Warning 17 / Info 520 / total 537**. Warning이 배치 전 85 → **17**로 감소(T86 청소분 유지 + 신규 스크립트가 경고 무증가). 잔여 17건은 T86이 범위 밖으로 기록한 Furnace 3·MonsterMeleeAttack 3·MonsterAI 2·Monster 2·SpriteRenderer 1 + LWA-1111 6건.
>   - **산출물 실물 대조(지휘자 코드 실측)**: T88 `FurnacePopup` `UIGroupComponent`=**false**(L029 복구 확인) · T90 `wall.tileset`에 `"Name": "Water"` 존재 · T91 `FishingSpot`이 **town.map 1건뿐**(map01·template_field 제거 확인) · T92 `dig_water`/`fill_water`/`IsWaterTileName` 구현 존재 · T93 신규 `.mlua` 2종 `.codeblock` 생성 확인.
>   - **T93 참고**: 보고서상 "Maker MCP 미연결로 refresh 보류"였으나, 레인 A의 refresh로 `.codeblock`이 생성되었고 위 재검증에서 Error=0 확인 → **빌드 게이트 충족**. 단 와드 스프라이트는 Portal RUID placeholder(전용 아트는 후속).
>   - **🔴 T95 검수 지적 3건 → T97 발행**: ① `RenderLayers.ComputeYOrderForEntity` 72~75행의 **엔티티 이름 문자열 분기(R3 위반)** ② 아바타가 Trigger 자동 산출 경로를 탐(T95 티켓 ④ 명시 지시 위반 — 현재는 DefaultPlayer에 Trigger/Collider가 없어 우연히 정상) ③ `Animal_Chicken`/`Animal_Sheep`/`Pet_Dog` **Y정렬 누락 + 유닛 오분류**. **T95는 반려하지 않음**(접지선 통일·바이어스·Error=0은 정상 이행), 잔여만 분리.
> - **✅ 2026-07-28 제작자 Play 결과 (A·C·D PASS / B 미배치 / E 신규 버그)**
>   - **PASS 확정**: **T88**(화로 팝업·LEA-3039 소멸) · **T89·T95**(Y정렬 — 접지선 전환·유닛 우선·깜박임 없음) · **T93**(몬스터 차단 장치 전 항목).
>   - 🔴 **T90 반려**: "물이 배치가 안 돼 있어" → 지휘자 실측으로 **Change ⑥ 미이행** 확정(4개 맵 `Water` 0건 · `build_maps.cjs` 미수정) → **T98로 재작업 발행**. **T91·T92는 물이 없어 사냥터 경로가 미검증 상태** — T98 완료 후 재확인 필요(영지는 T92 파기로 자체 검증 가능).
>   - 🔴 **T99 신규**: "몬스터가 자원을 통과" → **이번 배치 회귀 아님**. `IsObstacle`/`ResolveOverlaps`/`GetColliderAABB` 22건이 전부 `PlayerController.mlua`에만 존재(실측) = T36 차단은 **플레이어 전용**이고 몬스터는 타일 충돌만 따르는 **원래부터의 미구현**. T81 ②에 기록해 둔 사안이 표면화.
>   - **후속 큐(권장 순서)**: **T98**(물 실배치 — Phase 21 완성 게이트) → **T97**(T95 검수 지적 3건) → **T99**(몬스터 장애물, 단독). T96(Trigger 확대)은 여전히 보스 결정 대기.
> - **✅ 2026-07-28 지휘자 검수 — T97·T99 통과 (지적 0건)**
>   - **빌드**: 지휘자 refresh 대행 → **Error=0 / Warning 17 / Info 533 (total 550)**. baseline(W17) 대비 경고 증가 0. T99의 신규 `@Logic` **`Util/ObstacleQuery.codeblock` 생성 확인**(핵심 규칙 2 충족 — 보고서상 "MCP 미연결로 보류"였던 항목을 지휘자가 대행 해소).
>   - **T97 실물 대조**: ① `RenderLayers.mlua`에 **이름 문자열 분기 0건**, `YSortSprite.IsUnit` 기반으로 교체 확인(R3 해소) ② `UpdateAvatarYOrder`가 `ComputeYOrder(y) + UnitTieBias` 직접 호출 + 사유 주석 확인 ③ **유닛 모델 11종 전수 `YSortSprite`+`IsUnit=true` 충족(미충족 0건)**, 닭·양·개는 `Dynamic=true` 동반. 역방향 오분류 검사도 통과(`Building_Shop`·`Tree1`·`FishingSpot_Pond`에 `IsUnit` 미설정).
>   - **T99 실물 대조**: `PlayerController`의 `IsWallAt`/`IsObstacle`/`IsBlockingOverlapEntity`/`GetColliderAABB`/`CirclePenetration`/`ResolveCircleAABB`가 **시그니처 보존 위임 래퍼**로 전환, `ResolveOverlaps`는 위치 적용·SafePos를 로컬 유지(보고 내용과 일치). `MonsterAI`에 `IsObstacle` + X/Y 축 슬라이드, `TickObstacleStuck`/`TryPushOutOfObstacles`/`EscapeObstacleStuck` 갇힘 폴백, 임계값 프로퍼티화 확인.
>   - **🔀 레인 충돌 없음 확인**: 두 레인이 `PlayerController.mlua`를 공유했으나 **상호 덮어쓰기 0** — T97의 `UpdateAvatarYOrder` 수정과 T99의 장애물 추출이 모두 온전히 잔존(T99 추출로 행 번호만 3084→2898 이동).
>   - **⚠️ Play에서 최우선 확인할 항목**: `ObstacleQuery`는 **플레이어=클라 / 몬스터=서버** 양쪽에서 호출된다. `CollisionService.d.mlua`에 ExecSpace 제약 표기는 없으나(지휘자 확인), **서버 경로에서 `GetSimulator(...):OverlapAll`이 실제로 동작하는지는 런타임에서만 판정 가능** — 몬스터가 여전히 자원을 통과하면 이 지점을 첫 번째로 의심할 것.
> - **✅ 2026-07-28 제작자 Play — T97·T99 전 항목 PASS → [완료]**. 몬스터 엔티티 장애물 차단이 서버 경로에서 정상 동작함이 실증됨(`ObstacleQuery`의 client/server 양용 우려 해소). 플레이어 이동·채집 추출 회귀 0.
>   - **남은 큐**: **T98**(물 실배치 — 제작자 페인팅 선행 후 프린지 보정) · **T75**(소품 P1~P11, 레인 A 완료 후) / **결정 대기**: T96(Trigger 확대) / **제작자 직접**: T76·T94 / **보류**: T4.
> - **🧭 2026-08-01 지휘자 — 체크포인트 + 큐 재배열**
>   - **커밋 3건 반영**: `8a62b40`(MCP 설정 파일 추적 해제 — `.cursor/mcp.json`에 Bearer 토큰이 평문 커밋된 사고. 토큰 재발급 완료, 구 토큰 폐기 / Cursor CLI MCP 실태를 [workflow.md](./workflow.md)에 실측 기록) · `53e0e12`(`AGENTS.md` 벤더 블록 축약 — 중복·충돌 절 제거, 35,350→29,862자). 원격 동기 완료.
>   - 🔴 **T98 선행 미충족 확정 (지휘자 실측 2026-08-01)**: `map01`·`town`·`template_field`·`template_boss` **4개 맵 전부 `"Water"` 참조 0건**, `scripts/fix_water_fringe.cjs` 미존재. **T98은 보스의 Maker L1 페인팅 전까지 착수 불가** — 에이전트에 발행하면 할 일이 없다.
>   - ⚖️ **T96 결정 완료 → (C) 오브젝트 계열 전면 부여**. 실행을 **T100**(자원 6 + 가구 6)으로 신규 발행하고, **T75 ③을 개정**(소품도 Trigger 부여)했다. T100의 조사 ⓒ가 T75 소품 스펙을 확정하므로 **T100 → T75 순차**.
>   - **🧭 권장 실행 순서 (파일 겹침 기준)**
>     1. **보스 단독 — Maker 물 페인팅** (T98 선행). ⚠️ **시작 전 `refresh` 필수**(규칙 11), 이 구간에는 에이전트를 돌리지 않는다. 끝나면 지휘자가 커밋.
>     2. **병렬 2레인** — **T98**(`.map` L2 타일 프린지) ∥ **T100**(`.model`만). 파일 겹침 0.
>     3. **T75**(소품 11종 — `town.map` 엔티티). T100 커밋 후 단독.
>     - 보스가 페인팅을 뒤로 미루면 **T100을 먼저 단독 발행**해도 무방하다(`.model`만 만져 물과 무관). 단 그 경우에도 **에이전트 작업 중 Maker 저장 금지**.
>   - **잔여 큐**: T98(보스 선행 대기) · T100(발행 가능) · T75(T100 후) / **제작자 직접**: T76·T94 / **보류**: T4(🔴 `wall.tileset` — 물 작업과 동시 편집 금지).
> - **병렬 규약(요지)**: ① 상대 레인 소유 파일은 읽기만 ② 이 문서 갱신은 자기 T블록 라인만 ③ 티켓 완료마다 refresh 1회+빌드 Error 수를 보고서 §4에 기재 ④ 무보고 종료 = 반려(§5 조항 11).

### T4. [보류 유지 — 제작자 협업 전제 | 🔴 T90과 `wall.tileset` 충돌 주의] 경계 테라스/절벽 아트 정리

- **⚖️ 2026-07-25 보스 결정**: P2 보류 유지. 아트 교체가 Maker에서의 제작자 협업 전제라 에이전트 단독 착수 대상이 아니다. **에이전트는 이 항목을 큐에서 건너뛴다.**
- 🔴 **`wall.tileset` 동시 편집 금지 (신설 경고)**: **T90(물 타일 기반)이 같은 `wall.tileset`을 잡는다.** T90은 미사용 슬롯(`xx`/`x`/`Name15`/`Name16`/`Name23~Name25`/`Name28~Name32`)에 `Water` 타일을 추가하고, T4는 `TerraceTop`/`CliffFace`/`Big Wall` 슬롯을 리스킨한다 — **슬롯은 겹치지 않지만 같은 파일이라 동시 편집 시 한쪽이 통째로 소실된다**(규칙 11과 동계열: Maker 저장이 파일을 재직렬화한다). 제작자가 Maker에서 T4를 진행할 경우 **T90 착수 전에 끝내거나, T90 완료·커밋 후에 시작**할 것. 중간에 겹치지 말 것.
- **배경**: `TerraceTop`/`CliffFace`/`Big Wall`은 이전 스킴의 임시 아트 그대로. 신규 grass 기준 아트와 톤 불일치 가능 + 테라스 타일 위 아바타 SortingLayer 최종 판정 미완(`docs/design/skill-tree-plan.md` §5 4번).
- **Target**: `RootDesk/MyDesk/wall.tileset`(Maker에서 아트 교체 — 제작자 협업) + 필요 시 `scripts/build_maps.cjs` 밴드/데코 페인팅
- **Change**: 신규 타일 아트 확정 후 테라스 링/절벽면 리스킨, 플레이어가 테라스 타일 아래로 숨는지 확인.
- **Acceptance**: 경계 밴드 비주얼이 잔디/흙 아트와 이어지고, 아바타가 지형 위에 정상 렌더.

### T27. [코드 완료 — 2026-07-11 | refresh Error=0 | Play 대기] 퀘스트 보상 → 레시피 해금 (`RewardUnlockId`)

- 퀘스트 107(넓은 세계로) 완료 → `quest_cooking_pot` 해금(`UserQuestData.Complete` 훅 → `GrantRecipeUnlock`). ⚠️ **이미 107을 완료한 세이브에는 소급 발동하지 않음 — 미완료 캐릭터로 확인.** 상세·체크리스트: `reports/T27-quest-reward-unlock.md` §6.

### T61. [완료 — ⚖️ 보스 승인(2026-07-16) 후 지휘자 직접 적용 | refresh Error=0(total 496) | 체감 확인 보류(제작자)] 지형 편집 반응 지연 개선 — 전용 쿨다운 분리 (T51 제작자 피드백)

- **진단·구현**: 원인 = 채집 스윙 쿨다운(≈0.52s)이 지형 편집에도 적용. `item_dataset.TerrainEditCooldown` 컬럼 신설(Shovel/Hoe/Grass Seed=**0.25**, 공란=기존 폴백) + `TryMine` 게이트를 아이템 선조회 후 쿨다운 선택으로 재배열. 채집·전투 무변경. 상세: `reports/T61-terrain-edit-cooldown.md` (§6 체크리스트 — 연속 길 파기 체감).

### T63. [완료 — 제작자 확인(2026-07-16, 핫픽스 LEA-3036 포함) | refresh Error=0] 낚시 랭킹 즉시 반영 수정 — 30분 캐시 우회 (T57 제작자 Play 실패 2026-07-16)

- **배경**: 제작자 Play — "낚시 랭킹이 제대로 적용 안 됨". **지휘자 진단(코드 확정)**: 점수 적립(`FishingContestLogic.AddCatchPoints` → `SetScoreAndWait` force 누적)은 SortableDataStorage에 즉시 쓰이지만, **리더보드 화면은 `RankingDataStorageLogic.UpdateDataTable()`이 만드는 서버 스냅샷(`RefreshIntervalSeconds=1800` = 30분 주기) + 클라 캐시(`RefreshCacheIntervalSeconds=600` = 10분)를 읽는다** — 어획 직후 게시판을 열면 반영이 안 보이는 것이 구조적으로 보장됨. (T57 보고서 §5가 이 리스크를 예고했음.)
- **Target**: `RootDesk/MyDesk/RankingBasic/Core/FishingContestLogic.mlua`(적립 후 갱신 트리거), `RootDesk/MyDesk/RankingBasic/Core/RankingDataStorageLogic.mlua`(주기 값·강제 갱신 경로), 랭킹 UI 열람 경로(`RankingSampleUILogic` 계열 — Open 시 최신화), (확인만) `NPC/Scripts/FishingLeaderboardInteract.mlua`.
- **Change**:
  ① **적립 직후 서버 스냅샷 갱신**: `AddCatchPoints` 말미에 `UpdateDataTable()` 호출 — 단 **디바운스 필수**(연속 어획 스팸 방지: 최소 간격 프로퍼티, 10s 제안. `GetSortedAndWait` 전량 조회 비용 보호).
  ② **열람 시 최신화**: 리더보드 UI Open 경로에서 서버 스냅샷 최신화 요청 후 목록 표시 + **클라 캐시(600s)도 Open 시 무효화/우회** — 패키지에 기존 강제 갱신 경로(어드민 툴/ForceUpdate 등)가 있으면 재사용(규칙 8: 정의 확인 후), 없으면 최소 RPC 신설.
  ③ **주기 완화(보조)**: `RefreshIntervalSeconds` 1800→300, `RefreshCacheIntervalSeconds` 600→60 (설정값 — 튜닝 자유, 근거 보고).
  ④ **선행 진단 로그**: 구현 전 Play 로그에서 `[T57][FISHRANK] catch ... ok=true` 확인 — 적립 자체가 실패(ok=false / "not ready" 경고)라면 그 로그를 첨부하고 [보류]+질문(원인이 다름).
- **Acceptance**: ① 물고기 잡고 **곧바로** 게시판 F → 내 점수·순위 반영 ② 연속 어획 누적 정상 ③ 디바운스 동작(스팸 어획 시 스토리지 호출 폭주 없음 — 로그 근거) ④ 패키지 타 기능 회귀 0 ⑤ refresh Error=0 + 보고 3종. Play 최종 확인은 제작자.
- **충돌 주의**: `RankingBasic/` 레인 단독. `FishingSpot.mlua`·`PlayerInventory`·`PersistenceManager` 수정 금지(훅은 이미 존재). 보상 지급은 여전히 범위 밖(후속 — T57 보고서 §5 제안 참조).
- **구현 요약 (2026-07-16)**: 선행 `ok=true` 확인 · `ForceRefreshSnapshot` · 적립 디바운스 10s · Open=`RequestFreshDataListWithSenderData` · 주기 300/60. FishingSpot 등 무수정. 보고서: `docs/agents/reports/T63-fishing-rank-immediate-refresh.md`.
- **핫픽스 (2026-07-16)**: 제작자 "여전히 안 보임" → 로그상 스냅샷 `rows=1`인데 UI RPC가 **LEA-3036**(`any myData`)으로 드롭. 원시 필드+평탄 table 전달로 수정. refresh Error=0.
- **검증**: Maker refresh 빌드 **Error=0** (total 497 / Warning 25 / Info 472). **런타임 검증 보류(제작자 수행)** — Open 시 `[T63][FISHRANK] UI apply myScore=` 확인.

### T64. [코드 완료 — 2026-07-18 지휘자 직접 | LSP errors=0 (전 파일) | refresh·Play 검증 보류(Maker 미기동 — 제작자 수행)] 낚시 v2 — 홀드-릴리즈 릴링 미니게임 + 낚시 숙련 레벨 (Phase 15-C v2)

- **배경(⚖️ 보스 지시 원문 요지)**: "낚시가 좀 더 어려워졌으면. **입질 이후 그냥 놓치는 경우는 없애고**, 스타듀밸리처럼 **낚시 레벨에 비례해 나오는 물고기·난이도 편차**가 생기거나, 두근두근타운처럼 **꾹 눌러서 잡되 위험 표시가 뜨면 잠시 풀었다가 다시 눌러야** 하거나. 복잡해도 직접 구현 가능." → **⚖️ 설계 확정(지휘자, 두 안 혼합)**: 릴링 조작 = 두근두근타운식 홀드-릴리즈, 편차 축 = 스타듀식 어종 난이도+숙련 레벨.
- **설계 확정**:
  ① **입질 후 미스 제거**: 기존 "입질(!) 후 0.8초 내 재입력, 놓치면 실패" 폐지 — 입질 시 **자동으로 릴링 페이즈 진입**. 실패는 오직 릴링 중 실수(줄 끊김)로만 발생(실력 기반).
  ② **릴링(홀드-릴리즈)**: F(PC)/BtnInteract(모바일) **꾹 누름** = 릴 감기 → **진행 게이지** 상승. 물고기 저항 순간 = **위험 표시(⚠, 게이지 적색 점멸)** — 즉시 손을 떼야 하고, 위험 중 계속 누르면 **텐션 게이지** 상승 → 가득 차면 줄 끊김(실패, 물고기 도망). 위험 종료 후 다시 홀드. 진행 게이지 만땅 = 어획. 놓고 있는 동안 진행 서서히 감소+텐션 회복(수치 전부 데이터).
  ③ **어종 편차(CSV — FishDataSet 컬럼 신설)**: `Difficulty`(위험 빈도·지속·텐션 상승 배율의 티어), `MinFishingLevel`(추첨 풀 진입 최소 숙련 레벨 — 레벨 비례 어종 개방), `FishingXp`(어획 시 숙련 XP). 기존 Weight/SpotType/RankPoints 유지.
  ④ **낚시 숙련 레벨**: `FishingLevel`/`FishingXp`(@Sync) + `PersistenceManager` 영속(**규칙 9 — 선캡처, Yield 추가 금지**). 레벨 효과 = 텐션 상승 완화(체감 난이도 하강) + 고레벨 어종 풀 개방. 레벨업 곡선·완화율 = 설정값(프로퍼티/CSV — 리터럴 금지).
  ⑤ **UI**: HUD `FishingGauge` 신설(진행 금색 + 텐션 적색 + ⚠ 표시 — 기존 HUD 비주얼 아이덴티티, 규칙 6·10 준수, **단일 레이아웃 §1.5**). 낚시 중에만 표시.
  ⑥ **입력**: F KeyDown/KeyUp 홀드 감지 + 모바일 BtnInteract down/up(ButtonComponent 이벤트 정의 확인 — 규칙 8. T59 `InteractRequestEvent`는 단발 신호라 홀드용 down/up 경로 별도 확인, 미지원 시 [보류]+보스 상의).
- **Target**: `Furniture/Scripts/FishingSpot.mlua`(릴링 상태기 — 기존 세션 관리·RollFish 재사용, BiteTime·날씨 FishBiteMult 유지), `Player/Scripts/PlayerController.mlua`(낚시 입력 홀드/릴리즈 + FishingLevel), `Player/Scripts/PersistenceManager.mlua`(숙련 영속), `item/DataSets/FishDataSet.csv`(컬럼 3종), `ui/HUDGroup.ui`(FishingGauge — UIBuilder), `UI/Scripts/UIFishingGaugeController.mlua`(신규).
- **Acceptance**: ① 입질 후 "그냥 놓침" 0 — 실패는 텐션 초과(줄 끊김)뿐 ② 위험 표시 중 홀드 유지 시 텐션 상승→끊김, 릴리즈-재홀드 리듬으로 어획 가능 ③ 어종별 난이도 체감 차이(Difficulty) + 숙련 레벨업 시 고레벨 어종 등장·텐션 완화(로그 근거) ④ 재접속 후 숙련 레벨 유지 ⑤ 낚시왕 랭킹(T57/T63)·날씨 입질 보너스(T21) 회귀 0 ⑥ 수치·어종 하드코딩 0(전부 CSV/프로퍼티) ⑦ refresh Error=0 + 보고 3종 + §7 루브릭(FishingGauge). 난이도 감성은 제작자 Play.
- **충돌 주의**: 지휘자 단독 레인(FishingSpot·PlayerController·PersistenceManager·HUDGroup.ui). 규칙 9(세이브)·규칙 11(.ui 편집 전 refresh 상태 확인) 준수.
- **구현 요약 (2026-07-18)**: ① 미스 폐지 — `TriggerBite`=자동 릴링 진입, 실패=텐션 초과 `FailReel`뿐 ② 서버 `ReelTick` 0.1s(진행/텐션/위험 랜덤 스케줄) + 클라 홀드 폴링(F `IsKeyPressed` ∨ 모바일 플래그, 변화 시만 `ServerSetReelHold`) ③ `FishDataSet` 컬럼 3종 + 신규 `FishingDifficultyDataSet`(티어별 파라미터 CSV) ④ `FishingLevel/FishingXp` @Sync+영속(선캡처, Yield 무추가) — 텐션 완화·풀 개방 ⑤ HUD `FishingGauge`(공용 프레임+UIMyInfo 바 패밀리+골드, §7 루브릭 8/8) ⑥ 모바일=BtnInteract `ButtonStateChangeEvent` Pressed/Released(정의 실확인 — [보류] 불필요). Target 외 최소 수정: `UIHUDController.mlua`(BtnInteract 배선 소유 파일 — 홀드 핸들러 1쌍). 보고서: `reports/T64-fishing-v2-reeling.md`.

### T65. [코드 완료 — 2026-07-18 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 채집·기본 공격 스윙/타격 사운드 (⚖️ 2026-07-18 보스 지시 — 배치 J ①)

- **배경**: Ctrl 채광/공격에 사운드가 전무. 지휘자 실사(코드 확정): `PlayerController.ClientPlayMineEffect`(825행 부근)가 **주석 "(Disabled)"의 빈 함수** — `RequestMine`이 이미 hitSuccess(true=자원/몬스터 명중, false=허공)와 대상 엔티티를 넘겨 호출 중이라 훅 포인트는 살아 있다. 몬스터 피격 측 훅 = `Monster.HandleHitEvent`(185행 — FlashHit·넉백 선례, 기본 공격·스킬 모두 HitEvent로 수렴). Phase 18 사운드 축(18-D) 연장.
- **Target**: `Player/Scripts/PlayerController.mlua`(스윙/타격 재생), `item/DataSets/item_dataset.csv`(+`SwingSoundRUID`/`HitSoundRUID` 컬럼), `Monster/Scripts/Monster.mlua`(피격음 — HandleHitEvent), (동기화 확인만) `MapObjects/Scripts/ResourceReaction.mlua`
- **Change**:
  ① 음원 확보 = **msw-search 공식 리소스 검색이 1순위**(원작 무기 스윙/타격 SFX — R1). 자작 금지.
  ② `item_dataset`에 `SwingSoundRUID`/`HitSoundRUID` 컬럼 신설 — 도구별 소리 차등(곡괭이/도끼/맨손 등). 공란 폴백 = PlayerController 프로퍼티 기본 RUID(맨손). `if name == "..."` 분기 금지(R3).
  ③ 스윙음: `TryMine`의 MINE 상태 진입 경로(허공 스윙 포함 매 스윙)에서 장착 도구의 SwingSoundRUID 재생. 지형 편집 도구(T61)는 스윙음만 — 별도 타격음 확장 금지.
  ④ 타격음: 자원 명중(`RequestMine` pivotKey 분기) + 몬스터 명중(`Monster.HandleHitEvent`)에서 HitSoundRUID 재생. 서버→클라 전파는 기존 `MulticastPlaySkillSound` 선례 미러. 위치 기반 재생 API 유무는 `_SoundService` `.d.mlua`로 **실확인**(규칙 8) — 없으면 2D 재생으로 확정.
- **Acceptance**: ① Ctrl 스윙마다 스윙음(허공 포함) ② 자원/몬스터 명중 시 타격음 추가 재생 ③ 도구별 소리 차등이 **CSV 행 수정만으로** 반영 ④ 하드코딩 0 ⑤ 스킬 시전 사운드(T46 `SkillDataSet.SoundRUID`) 무수정·회귀 0 ⑥ refresh Error=0 + 보고 3종. 체감(음량·톤)은 제작자 Play.
- **충돌 주의**: `PlayerController.mlua`·`Monster.mlua`는 T66과 공유 — **배치 내 순차 엄수**.
- **구현 요약 (2026-07-18)**: CSV 컬럼 2종+도구 RUID · `ResolveEquippedToolSound`/`ClientPlaySwingSound` · 자원=`ClientPlayMineEffect` · 몬스터=`HandleHitEvent`→`MulticastPlaySkillSound` · `_SoundService:PlaySound` 2D. 보고서: `docs/agents/reports/T65-mine-attack-sfx.md`.
- **검증**: Maker refresh **Error=0** (total 517 / Warning 25 / Info 492). **런타임 검증 보류(제작자 수행)**.

### T66. [부분 완료 — 대시 데미지·피격 훅은 동작(로그 확인) | **이펙트 가시화는 Play 실패(2026-07-18 제작자) → T70 재작업** | 지휘자 로그 진단: 클라 PlayEffect 전건 serial=0(생성 실패), 서버만 serial>0] 스킬 이펙트 실표시 수리 + 원작 이펙트·피격 이펙트 + 대시 데미지 (⚖️ 2026-07-18 보스 지시 — 배치 J ②)

- **배경**: 제작자 Play — "스킬 이펙트가 없다. 원작 메이플처럼 이펙트·데미지를 맞춰라(대시도 데미지)". 지휘자 실사: T46이 `SkillDataSet.EffectRUID` → `MulticastPlayEffect`(`_EffectService:PlayEffect`, 시전 위치)를 이미 구현했고 4스킬 전부 RUID가 채워져 있는데 **비주얼만 안 보임**(사운드는 동일 게이트의 코드가 재생됨) → 유력 원인 ⓐ EffectRUID 무효 ⓑ **렌더 정렬**(톱다운 타일맵에 깔림 — `ExecuteProjectileSkill` 2316~2320행이 `IgnoreMapLayerCheck=true`+`SortingLayer=EntityLayer`를 명시 설정해야 보였던 선례). 또한 피격 이펙트 전무, dash 행 `DamageMultiplier=0`.
- **Target**: `Player/Scripts/PlayerController.mlua`(이펙트 재생 경로·`ExecuteDashSkill`), `Player/DataSets/SkillDataSet.csv`(+`HitEffectRUID` 컬럼, dash 데미지 값), `Player/Scripts/Projectile.mlua`(명중 이펙트 훅), `Monster/Scripts/Monster.mlua`(피격 이펙트 훅 — T65와 같은 파일, 순차라 충돌 없음)
- **Change**:
  ① **진단 선행**: refresh 후 로그로 `PlayEffect` 호출 도달·RUID 유효성 확인 → 원인 확정 후 수정. 정렬 문제면 이펙트에 SortingLayer/레이어 무시를 지정 — `PlayEffect`/`PlayEffectAttached` 등 시그니처의 정렬 옵션 유무를 `.d.mlua`로 **실확인**(규칙 8, 추정 호출 금지). EffectRUID 무효면 msw-search로 원작 스킬(파워 스트라이크/매직 클로/플래시 점프/슬래시 블러스트) 이펙트 RUID 재확보.
  ② 시전 이펙트 원작화: 바라보는 방향 반영(좌우 플립/회전) + 시전자 전방 오프셋 — 오프셋·스케일 수치는 CSV 컬럼 또는 컴포넌트 프로퍼티(리터럴 금지).
  ③ `HitEffectRUID` 컬럼 신설 — 피격 몬스터 위치에 원작 피격 이펙트 재생. 훅 = `Monster.HandleHitEvent`에서 스킬 식별이 HitEvent 페이로드로 가능한지 **실확인 후** 결정, 불가하면 공격측(AttackFast 명중 결과/Projectile 명중)에서 재생.
  ④ **대시 데미지**: `SkillDataSet` dash 행 `DamageMultiplier`>0 + `DamagePerLevel` 부여(제안 1.0/+0.2 — 수치는 CSV, 튜닝은 제작자) + `ExecuteDashSkill`이 시작→도착 경로를 스윕 박스로 판정해 기존 `PendingDamage`+`AttackFast` 경로(ExecuteAreaDamageSkill 미러)로 데미지 적용 + 경로/도착 이펙트.
  ⑤ 기존 3스킬 배율(1.5/2.2/4.5)은 유지 — 전면 리밸런스는 범위 밖(제작자 Play 후 별도 티켓).
- **Acceptance**: ① 4스킬 전부 시전 이펙트 가시(코드 근거=로그·정렬 설정, 육안은 제작자 Play) ② 피격 몬스터에 피격 이펙트 ③ 대시 경로상 몬스터가 데미지를 입음(로그 근거) ④ 이펙트·수치 전부 CSV/프로퍼티 ⑤ 쿨다운·스태미나·사운드·기존 데미지 회귀 0 ⑥ refresh Error=0 + 보고 3종.
- **충돌 주의**: `PlayerController.mlua`·`Monster.mlua` 공유 — T65 완료 후 착수.
- **구현 요약 (2026-07-18)**: EffectRUID 유효 확인·비가시=정렬 누락 → `MulticastPlayEffectEx`(IgnoreMapLayerCheck+EntityLayer+FlipX) · HitEffectRUID+PendingHitEffectRUID · dash 1.0/+0.2+경로 AABB. 보고서: `docs/agents/reports/T66-skill-vfx-dash-damage.md`.
- **검증**: Maker refresh **Error=0** (total 517 / Warning 25 / Info 492). **런타임 검증 보류(제작자 수행)**.

### T67. [코드 완료 — 2026-07-18 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 상호작용 조준선(에임 셀) 게이트 — 근접 판정 폐지 (⚖️ 2026-07-18 보스 지시 — 배치 J ③)

- **배경**: 제작자 — "근처에만 있어도 상호작용돼 다른 오브젝트와 꼬인다. 조준선 안에 있을 때만 되어야 한다". 지휘자 실사(코드 확정): ⓐ PC의 F는 `PlayerController.TryInteract`(근접 1.5셀 최근접 체인)와 **분산 핸들러 6종이 KeyDown F를 동시 독립 리슨**(상인 3.0셀 등 각자 거리 판정) — 겹치면 복수 발동 ⓑ 모바일 `InteractRequestEvent` 브리지도 수신 측 각자 거리 판정이라 동일. 조준선 셀은 이미 존재: `UpdateMineReticle`의 `targetCell = playerCell + LastDirection`.
- **Target**: `Player/Scripts/PlayerController.mlua`(판정 헬퍼 + TryInteract/FindNearby* 교체), 분산 핸들러 6종 = `NPC/Scripts/MerchantInteract.mlua`·`NPC/Scripts/VillagerDialog.mlua`·`NPC/Scripts/FishingLeaderboardInteract.mlua`·`MapObjects/Scripts/ResearchLab.mlua`·`MapObjects/Scripts/BulletinBoard.mlua`·`MapObjects/Scripts/Animal.mlua`
- **Change (🧭 지휘자 설계 확정 2026-07-18)**:
  ① PlayerController에 공개 판정 헬퍼 **`IsAimTarget(Entity target): boolean` 단일 정의** — 조준선 셀(playerCell+LastDirection) 중심 월드 좌표가 대상 점유 범위 안이면 true. 점유 범위 기본 = 대상 위치 중심 1×1셀, 대형 구조물(연구소/게시판/우리/침대 등)은 **컴포넌트 프로퍼티(footprint 셀 폭·높이)**로 확장 — 이름 분기 금지(R3).
  ② 🧭 **트리거형 예외 = 발밑 셀 허용**: 포탈(`ActivePortal` 트리거 유지 — 밟고 서서 F)과 낚시 릴링 상태 분기는 기존 유지. 그 외는 전부 조준선 게이트.
  ③ PC-owned 대상(보물상자/침대/화로/상자/낚시터)의 `FindNearby*` 최근접 검색을 조준선 판정(`IsAimTarget` 필터)으로 교체.
  ④ 분산 핸들러 6종의 거리 판정(`dist <= 3.0` 등)을 `IsAimTarget(self.Entity)` 호출로 교체(LocalPlayer의 PlayerController 취득 — 규칙 8은 이 티켓에서 ①을 먼저 정의하므로 충족). `Animal`은 배회형이라 대상 **현재** 셀 기준 — 체감 불편은 제작자 피드백 후 완화(후속).
  ⑤ `TryInteract` 미처리 → `InteractRequestEvent` 브리지 구조는 유지(T59 회귀 금지). 같은 셀에 복수 후보가 겹치는 예외 상황만 기존 우선순위 체인 유지.
- **Acceptance**: ① 조준선 셀의 대상만 상호작용 — 1.5셀 내 인접해 있어도 조준선 밖이면 무반응 ② 화로+상자+상인 밀집 배치에서 방향 전환만으로 대상이 정확히 갈림(복수 팝업 0) ③ 포탈 밟고 F 워프 정상 ④ 모바일 BtnInteract도 동일 동작 ⑤ 낚시(캐스팅~릴링)/수면/목장 급여 회귀 0 ⑥ refresh Error=0 + 보고 3종.
- **충돌 주의**: `PlayerController.mlua` 공유 — **배치 마지막(T66 완료 후) 착수**. 낚시 릴링 홀드(T64 OnUpdate 폴링)는 무수정.
- **구현 요약 (2026-07-18)**: `IsAimTarget`+`AimFootprintW/H` · FindNearby* 5종 · 분산 6종 거리→조준선 · Animal InteractRequestEvent 추가 · 포탈/낚시 예외 유지. 보고서: `docs/agents/reports/T67-aim-cell-interact-gate.md`.
- **검증**: Maker refresh **Error=0** (total 471 / Warning 25 / Info 446). **런타임 검증 보류(제작자 수행)**.

### T68. [완료 — 2026-07-18 지휘자 직접 | refresh Error=0 | 체감 확인 = 제작자 Play] 전투·채집·스킬 SFX 전면 재선정 (⚖️ 보스 지시 "모든 소리 어색 — 네가 선택")

- **배경**: T65/T46 음원 선정의 구조적 결함(지휘자 실사 — 공식 리소스 API로 배정 RUID 전수 조회): 매직 클로·플래시 점프 시전음 = **UI 알림음**, 곡괭이 타격 = **파괴음**, 도끼·삽 스윙 = 쿨다운 대비 과장(0.84~0.86s). 이전 선정이 검색 결과의 설명·길이·카테고리를 확인하지 않고 채택한 것이 원인.
- **Change**: 11슬롯 전량 재검색·재선정 — 원칙 = ① 내용 일치(용도↔설명, UI음·파괴음·몬스터 울음 배제) ② 길이-쿨다운 정합(채집 ≤0.7s / 지형 0.26s / 스킬 1.2~1.6s) ③ 스킬은 `category=skill` 한정. **코드 무변경** — `SkillDataSet.SoundRUID` 4행 + `item_dataset` Swing/Hit RUID 5계열 + `PlayerController` Default 폴백 2종의 값만 교체. 선정표 = `reports/T68-sfx-reselection.md` §3.
- **Acceptance**: ① 스킬 시전음에서 UI 알림음 감각 소멸 ② 채집 연타·지형 0.25s 쿨다운에서 소리 겹침 없음 ③ 재질감(나무/돌/펀치) 구분 ④ refresh Error=0(달성 — Warning 25/Info 499). 최종 체감 = 제작자 Play, 특정 슬롯 불만 시 슬롯명 지목 → 개별 교체.

### T69. [코드 완료 — 2026-07-18 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] QWER 스킬 장착 영속화 — 재접속 초기화 수정 (⚖️ 2026-07-18 제작자 Play 버그 — 배치 K ①)

- **배경**: 제작자 — "QWER에 배치해도 재접속하면 초기화". **지휘자 진단(코드 확정)**: `EquippedSkillsJson`은 T45에서 **의도적으로 세션 값**으로 설계됨(`PersistenceManager.mlua` 216행 주석 "세이브 경로 무변경"). 세이브 캡처부(531~546행대)에 equipped 캡처 없음, 저장 테이블(640행대)에 필드 없음, 로드 경로에 복원 없음 — 재접속 시 프로퍼티 기본값 `"[]"`으로 시작. `skillLevels`(해금)는 정상 영속(533·655행). ⚖️ **보스 요구로 설계 변경 확정: 장착 목록도 영속화한다.**
- **Target**: `RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua` 단독 (PlayerController 무수정 — `EquippedSkillsJson` 프로퍼티·`SanitizeEquippedSkills`는 기존 정의 재사용, 호출 전 정의 확인 규칙 8).
- **Change**: ① `SavePlayerData` 진입부 선캡처 블록에 `local capEquippedSkills = pc.EquippedSkillsJson or "[]"` 추가(**규칙 9 — 추가 Yield 절대 금지, 기존 선캡처 블록과 같은 위치**) ② 저장 테이블에 `equippedSkills = capEquippedSkills` 필드 추가 ③ 로드 경로에서 `pc.EquippedSkillsJson = data.equippedSkills or "[]"` 복원 — **반드시 211행 `SkillLevelsJson` 복원 후, 217행 `SanitizeEquippedSkills()` 호출 전** 순서(정리 필터가 해금 데이터를 읽으므로) ④ 신규 캐릭 리셋 경로(473행)는 무변경 ⑤ 구 세이브(`equippedSkills` 필드 없음)는 `or "[]"` 폴백으로 기존 동작과 동일.
- **Acceptance**: ① QWER 장착 → 재접속 → 그대로 유지 ② 구 세이브 로드 에러 0(폴백) ③ 미해금 스킬이 세이브에 섞여도 로드 시 sanitize로 제거 ④ 세이브 루틴에 신규 Yield 0(코드 리뷰로 확인 — 규칙 9) ⑤ refresh Error=0 + 보고 3종. 재접속 확인은 제작자 Play.
- **충돌 주의**: `PersistenceManager`는 공유 파일 — 배치 내 순차(T70과 파일 겹침 없음, K 배치 선두).
- **구현 요약 (2026-07-18)**: 선캡처 `capEquippedSkills` · 저장 `equippedSkills` · 로드 순서 SkillLevels→Equipped→Sanitize · Yield 0 · `[T69][SAVE]` 로그. PlayerController 무수정. 보고서: `docs/agents/reports/T69-equipped-skills-persist.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T70. [완료 — 모션 OK | 이펙트는 폴백 3단 전부 serial=0(제작자 로그) → **원인 instigator=nil로 확정, T71에서 수정·런타임 검증 완료**] 스킬 시전 모션 + 이펙트 클라 생성 실패 수정 (⚖️ 2026-07-18 제작자 Play 버그 — 배치 K ②, T66 재작업)

- **배경**: 제작자 — "스킬 사용 시 모션·이펙트가 여전히 없음". **지휘자 런타임 로그 진단(2026-07-18 Play 로그 실측)**:
  - **이펙트**: `[T66][FX] PlayEffect` 로그가 시전마다 쌍으로 발생 — **서버(fromServer=true) serial=2147483665+ (성공·비렌더), 클라(fromServer=false) 전건 serial=0 (생성 실패)**. 즉 T46 시절=옵션 없이 생성돼도 정렬에 가려짐(추정), T66 이후=옵션 딕셔너리를 붙이자 클라 생성 자체가 실패. RUID 8종은 전부 유효한 `animationclip`(지휘자 리소스 API 전수 확인). `EffectService.d.mlua` 시그니처의 7번째 `options` 인자는 실존(FlipX/SortingLayer/OrderInLayer/IgnoreMapLayerCheck 등 키 명시) — **어느 옵션 키가 클라 생성을 죽이는지가 미확정**.
  - **모션**: 시전 경로에 아바타 액션 트리거가 전무 — 채집(`MineState.mlua` — `ActionStateChangedEvent`로 swingO1/O2 재생, `SwingAction` 컬럼 데이터 주도)과 달리 스킬은 어떤 상태/액션도 재생하지 않음.
- **Target**: `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua`(`MulticastPlayEffectEx` 폴백 체인 + 시전 모션 멀티캐스트), `RootDesk/MyDesk/Player/DataSets/SkillDataSet.csv`(+`CastAction` 컬럼), (경로 공유 확인만) `Monster/Scripts/Monster.mlua` 227행 `MulticastPlayEffectEx` 호출 — 시그니처 유지.
- **Change**:
  ① **이펙트 — 런타임 폴백 체인(자가 진단 겸 자가 치유)**: `MulticastPlayEffectEx`에서 (a) 서버면 스킵(`self:IsClient()` 가드 — 서버 생성은 무의미) (b) full 옵션으로 `PlayEffect` → serial 0이면 `{IgnoreMapLayerCheck=true}`만으로 재시도 → 또 0이면 옵션 nil 재시도 — 각 단계 `[T70][FX] variant=<full|min|none> serial=` 로그. 어느 변형이든 성공하면 화면에 뜨고, 로그가 범인 키를 특정한다. 3단계 전부 0이면 RUID 런타임 무효 → `[T70][FX] ALL-FAIL ruid=` 경고 로그(후속: 지휘자 RUID 재선정).
  ② **모션 — `CastAction` 컬럼 신설(데이터 주도, MineState 선례 미러)**: 시전 성공 시(`ServerRequestCastSkill` 검증 통과 지점) Multicast로 아바타 body에 `ActionStateChangedEvent`(CoreActionName=PartsActionName=`CastAction` 값, Onetime, PlayRate 1.33 — MineState 8~58행 미러) 전송. 컬럼 공란이면 모션 생략. **기본값 제안(CSV — 튜닝 자유)**: power_strike=`swingO2` / fireball(매직 클로)=`shoot1` / earth_shatter=`swingT2` / dash=공란(도약 이동 자체가 연출). ⚠ 액션 ID 실존 여부는 **msw-avatar 스킬로 확인 후 기입**(원작 body action 세트 — 규칙 8 준용, 존재하지 않는 액션명 금지). 무기 파츠 유무에 따른 한손/양손 계열 주의(MineState 13~16행 주석).
  ③ 피격 이펙트(`[T66][HITFX]` 경로)·대시 데미지(`[T66][DASH]` — 로그상 정상 동작)는 무수정. `MulticastPlayEffectEx` 시그니처 유지(Monster 227행 호출 호환).
- **Acceptance**: ① 4스킬 시전 시 클라 `[T70][FX] ... serial>0` 로그(제작자 Play 후 로그로 판정 — 어느 variant인지 보고서에 기재) ② 시전 시 아바타 모션 재생(CastAction 공란 스킬 제외) ③ CSV 행 수정만으로 모션 교체 가능 ④ 피격 이펙트·대시 데미지·사운드 회귀 0 ⑤ Monster 227행 경로 정상(시그니처 무변경) ⑥ refresh Error=0 + 보고 3종.
- **충돌 주의**: `PlayerController.mlua`·`SkillDataSet.csv` 수정 — T69(PersistenceManager)와 파일 겹침 없으나 **배치 순차 유지**. 착수 전 msw-scripting + **msw-avatar**(액션 ID 확인) + msw-combat-system 스킬 로드.
- **구현 요약 (2026-07-18)**: 클라 가드+full/min/none 폴백 · `CastAction` CSV+`MulticastPlayCastAction`(MineState 미러) · 액션 ID msw-avatar 실존 확인 · 시그니처 유지. 보고서: `docs/agents/reports/T70-skill-cast-motion-fx-fallback.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T71. [완료 — 2026-07-18 지휘자 직접 | refresh Error=0 | **런타임 검증 완료(시전 경로 클라 serial>0 로그)** | 육안 최종 확인 = 제작자] 스킬 이펙트 미표시 진범 수정 — `PlayEffect` instigator nil 금지 (⚖️ 보스 "직접 원인 찾아 수정" 지시)

- **원인 (지휘자 런타임 실측 — Play `maker_execute_script` 격리 실험)**: `_EffectService:PlayEffect`의 2번째 인자 **instigator에 `nil`을 넘기면 클라이언트에서 이펙트 생성이 조용히 실패(serial=0)** 하고, 유효 엔티티를 넘기면 즉시 성공. 실험 매트릭스: A(nil)=0 / B(LocalPlayer)=2 / C(Attached)=3 / D(다른 클립+nil)=0 / E(ParticleService+nil)=0 — **옵션·RUID·정렬 전부 무관, nil instigator가 유일 변수**. T46부터 모든 호출이 nil을 넘겨 왔음(서버는 nil 관대 통과로 serial>0 반환 — T70 진단의 "서버만 성공" 현상의 정체). 클립 자체는 정상 프레임 기반 원작 스킬 이펙트(리소스 API로 frames·subPath 확인).
- **수정**: `PlayerController.MulticastPlayEffectEx`의 PlayEffect 3곳 `nil` → `self.Entity`(시전자). 전 이펙트 경로(시전/피격/대시/Monster 227행)가 이 메서드로 수렴 — 단일 지점 수정. 폴백 체인·시그니처 유지, 로그 태그 `[T71][FX]`.
- **검증**: refresh **Error=0**(Warning 25/Info 502) + Play에서 `ServerRequestCastSkill` 직접 호출 — 클라 `[T71][FX] variant=full serial=1`(파워 스트라이크)·`serial=2`(대시) + `[T70][CAST] play action=swingO2` 모션 재생 확인. **variant=full 성공 = SortingLayer(MapLayer5)+IgnoreMapLayerCheck 적용 상태로 생성** → 타일 위 렌더 보장. 육안 색감·타이밍 확인만 제작자 몫.
- **재발 방지**: §1.2 규칙 12 신설(아래). 보고서: `reports/T71-effect-instigator-nil.md`.

### T72. [코드 완료 — 2026-07-21 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 아이템 아이콘 교체 및 모델 외형 일치화 (P0-D)
- **배경**: 임시로 잘못 재사용 중인 아이콘을 교체. 또한 아이템 아이콘과 실제 필드 모델 모양이 불일치하는 사례가 많아 일치화 필요. 인벤토리/퀵슬롯뿐만 아니라 모든 UI(제작, 도감 등)에서 일관되게 표시되도록 정비.
- **Target**: `RootDesk/MyDesk/item/DataSets/item_dataset.csv` 등 데이터셋
- **Change**: `artwork-spec.md` §5 표를 참고하되, 해당 RUID 대신 `msw-search`로 실제 인게임 모델과 일치하는 더 적합한 RUID를 새롭게 찾아 교체. 필요 시 다른 아이템들의 IconRUID도 전수 조사하여 외형 불일치 교정.
- **Acceptance**: 아이템 아이콘이 모델 외형과 일치하며, 모든 UI에서 정상 표시. refresh Error=0.
- **구현 요약 (2026-07-21)**: msw-search Icon 10건 + Recipe 6건. Furniture_Bed/Item_Bed 월드 침대 RUID. 보고서: `docs/agents/reports/T72-item-icon-model-match.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T73. [코드 완료 — 2026-07-21 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 마을 광장 분수대 및 우물 리스킨 및 재배치 (P0-A 파트 1)
- **배경**: 마을 중심 광장에 분수와 우물을 더 자연스럽고 심미적인 위치로 재배치. (상점 아트는 수정 불필요)
- **Target**: `RootDesk/MyDesk/MapObjects/Models/` (신규 .model), `map/town.map`
- **Change**: B8(분수대), B9(우물) 아트를 활용하여 `.model` 신규 작성 후 `town.map` 광장에 배치. 기존에 배치했던 어색한 위치를 피해 심미적으로 더 나은 좌표로 재배치. 통행 차단은 기존 `Building_Shop` 미러. 대장간(B7)도 필요시 재배치.
- **Acceptance**: 상점을 제외한 분수대, 우물 등이 구도에 맞게 정상 배치됨. 충돌/정렬 이상 없음. refresh Error=0.
- **구현 요약 (2026-07-21)**: Fountain(0,4.5)·Well(4.5,−4.5)·Blacksmith(9,−1.5). Shop 무수정. 보고서: `docs/agents/reports/T73-plaza-fountain-well.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T74. [코드 완료 — 2026-07-21 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 주거구역 주택 5동 배치 (P0-A 파트 2)
- **배경**: 주거구역을 형성할 버섯집 및 초가집 배치. `docs/design/artwork-spec.md` §2.
- **Target**: `RootDesk/MyDesk/MapObjects/Models/` (신규 .model), `map/town.map`
- **Change**: B1~B5 (주택 5종) RUID 확보. 접지선 및 톱다운 시점 보정 후 신규 `.model` 작성. `town.map`의 주거구역에 심미적으로 배치.
- **Acceptance**: 주택 5동 정상 배치 및 충돌 판정 정상. refresh Error=0.
- **구현 요약 (2026-07-21)**: House 5종 북서·남서·남동 배치. 보고서: `docs/agents/reports/T74-town-houses.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T75. [대기 — 🧭 2026-07-25 범위 축소: **소품 P1~P11 전용** | 🔄 2026-08-01 ③ 개정(T96 (C) 반영) | 🔴 **T100 완료 후 착수**] 마을 생활 소품 배치 (P0-C)

- **⚖️ 2026-07-25 보스 결정 — 노점 M1~M3은 이 티켓에서 분리**: 노점은 제작자가 이미 커스텀 리드로우 5종을 만들어 둔 상태(변형 선택 = 취향 결정)라 **제작자 직접 처리(→ T94)**. 이 티켓은 **소품 P1~P11만** 수행한다. 노점 관련 파일·배치에 손대지 말 것.
- **배경**: 마을 생활감 증대를 위한 데코 소품 11종 배치. `docs/design/artwork-spec.md` §4.
- **Target**: `RootDesk/MyDesk/MapObjects/Models/` (신규 .model), `map/town.map`
- **Change**: P1~P11(가로등·말뚝 울타리·흰 울타리·표지판·벤치·꽃밭 밴드·술통·궤짝 더미·항아리·수레·배너) 아트 확보 및 `.model`화 후 배치.
  ① **RUID는 `artwork-spec` §4 표의 검증 완료분을 그대로 사용** — 재검색 불요(육안 검증까지 끝난 목록). 표에 변형 후보가 있는 항목은 하나를 골라 선정 근거를 보고서에.
  ② **소품은 원본 직결 가능성이 높다** — 작아서 사이드뷰→톱다운 왜곡이 미미하다. `artwork-spec` §1-2의 리드로우(접지선 정리·높이 압축)는 **육안상 필요할 때만** 적용하고, 불필요하면 RUID 직접 바인딩으로 끝낼 것(과잉 작업 금지).
  ③ 🔄 **개정 (⚖️ 2026-08-01 보스 T96 (C) 확정) — 소품 11종 전부 `TriggerComponent` 부여**. 종전 "비충돌 데코는 Trigger 없이"는 **폐기**.
     - **Trigger는 전부 부여**(정렬 접지선 자동 산출 — T95 경로 편입). **`script.ResourceOccupiedArea`는 통행을 막아야 하는 것에만**(울타리·수레·술통 등) 부여한다. 이 둘은 별개다 — T81 기준 "차단 자격 = Trigger **+** 멤버십"이므로 멤버십 없이 Trigger만 두면 차단되지 않는다(**T100 조사 ②가 이를 코드로 확정한 뒤 적용할 것**).
     - 🔴 **T100 완료 후 착수** — T100 조사 ③(가구에 Trigger 부여 시 T82 `IsAimTarget`이 `AimFootprint`→Trigger AABB로 자동 전환되는 범위 변화)의 결론이 **소품의 조준 대상화 여부를 좌우**한다. 순수 데코(벤치·꽃밭·배너)가 조준 대상이 되면 안 되므로, T100이 내놓은 회피책(`AimFootprintW/H` 명시 또는 제외 규약)을 **그대로 따를 것**.
     - Trigger 박스 크기는 **스프라이트 접지면 기준**으로 잡는다(T81·T95 규약). 어느 소품에 `ResourceOccupiedArea`를 붙였고 어느 것이 조준 대상인지 **보고서에 표로**.
  ④ 같은 소품 2개 이상은 **반드시 `.model` + `modelId` 인스턴스**(msw-general 절대원칙 11).
  ⑤ **`WalkBehindFade` 부착 금지** — 소품은 키가 작아 walk-behind가 필요 없다. 대신 **T89의 `YSortSprite`를 붙여 Y정렬**에 편입할 것(T89 완료 후 착수이므로 컴포넌트가 이미 존재 — 규칙 8로 정의 확인).
- **Acceptance**: ① 소품 11종이 마을 곳곳에 렌더·배치됨 ② 데코가 통행을 부당하게 막지 않음(`ResourceOccupiedArea` 부여분만 차단) ③ 2개 이상 배치된 소품이 전부 `modelId` 인스턴스 ④ 소품이 플레이어·NPC와 **y 순서대로 정렬**(T89·T95 연계) ⑤ 기존 건물·NPC·연못 배치 회귀 0 ⑥ **순수 데코가 `Ctrl` 조준 대상으로 잡히지 않음**(T100 ③ 결론 적용 근거를 보고서에) ⑦ refresh Error=0 + 보고 3종.
- **충돌 주의**: `town.map` — 레인 A(T89~T92) 완료로 선행 해제됨. 🔴 **추가 선행 2건**: ① **T100 완료·커밋 후 착수**(소품 Trigger 스펙이 T100 조사에 종속) ② **보스의 물 페인팅 세션과 겹치지 말 것** — Maker 저장이 `town.map`을 재직렬화해 손배치를 원복시킨다(§1.2 규칙 11, 3차 사고 전례). `build_maps.cjs --force`는 여전히 **사용 금지**.

### T76. [제작자 직접 — ⚖️ 2026-07-25 보스 결정] 마을 랜드마크 건물 3동 (P0-A 파트 3)

- **⛔ 에이전트 착수 금지.** 제작자가 직접 수행한다. 하위 에이전트는 이 항목을 큐에서 건너뛴다.
- **사유**: B11 헛간은 리드로우 4종(`topdown_barn` / `_pure` / `_front` / `msw_topdown_barn`)이 이미 완성돼 **어느 것을 쓸지가 취향 결정**이고, B6 여관(968×640 벡터 카툰풍)·B10 시계탑(260×708 세로형)은 **도트 리드로우 + 시점 압축의 품질 판단**이 필요해 에이전트 위임 시 되돌릴 확률이 높다.
- **참고(제작자용)**: 원본 = `scratch/artwork_rework/source/{inn, clocktower, barn}.png`. 명세 = `docs/design/artwork-spec.md` §2 B6·B10·B11.
- **배치 시 참고**: 대형 건물이므로 T81 방식 통행 차단(`TriggerComponent`+`script.ResourceOccupiedArea`)과 T83 `WalkBehindFade` + T89 Y정렬 편입이 필요하다. 배치까지 에이전트에 넘기고 싶어지면 **아트 확정 후 별도 배치 티켓으로 재발행**할 것.
- **미배치 잔여**: `House_ThatchHut`은 모델만 있고 `town.map` 미배치(T74 보고는 "5동"이나 실제 4동). 이 항목과 함께 처리 여부를 제작자가 결정.

### T94. [제작자 직접 — ⚖️ 2026-07-25 보스 결정] 상점거리 노점 M1~M3 (P0-B, T75에서 분리)

- **⛔ 에이전트 착수 금지.** 제작자가 직접 수행한다.
- **사유**: 커스텀 톱다운 리드로우가 이미 5종 존재(`scratch/artwork_rework/msw_topdown_stall{,_hd,_straight,_c}_*.png`) — **어느 변형을 채택할지가 취향 결정**이라 에이전트 위임 시 되돌릴 확률이 높다. 남은 작업은 채택본 `.sprite` 업로드 → `.model`화 → `town.map` 배치.
- **명세**: `docs/design/artwork-spec.md` §3 M1~M3. 원본 = `scratch/artwork_rework/source/stall_{a,b,c}.png`.

### T77. [코드 완료 — 2026-07-21 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 비전투 마을 NPC 및 생물 다양화 (P1)
- **배경**: NPC 4인 및 고양이 배치. `docs/design/artwork-spec.md` §6.
- **Target**: `RootDesk/MyDesk/NPC/Models/` (신규 .model), `map/town.map`, `RootDesk/MyDesk/NPC/DataSets/DialogDataSet.csv`
- **Change**: N1~N7의 팩 ID에서 RUID 확보. 기존 `Villager_Elder` 미러링하여 신규 NPC `.model` 작성. `DialogDataSet`에 대사 부여 후 배치.
- **Acceptance**: NPC들이 마을 곳곳에 배치되고 대화 상호작용 동작. 고양이가 배회함. refresh Error=0.
- **구현 요약 (2026-07-21)**: ResidentA~D + Animal_Cat + Dialog 8행. 보고서: `docs/agents/reports/T77-town-npcs-cat.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T78. [❌ 폐기 — ⚖️ 2026-07-25 보스 결정] 필드 및 영지 바이옴 오브젝트 변주 (P1)

- **폐기 사유 2건**: ① **체감 기여가 큐에서 가장 낮음**(사냥터 나무·바위 실루엣 변주) ② **Phase 21(T90~T92)이 사냥터에 물 지형을 도입해 `template_field` 지형이 재편**되므로, 지금 자연물을 배치하면 T90의 생성기 재생성에 덮이거나 재배치 작업이 중복된다.
- **재개 조건**: Phase 21 완료 후 사냥터 지형이 확정되고, 그때도 시각적 단조로움이 실제 불만으로 남아 있으면 **신규 T번호로 재발행**한다(이 번호는 재사용하지 않는다 — T번호 단조 증가 규칙).
- **보존**: 명세 `docs/design/artwork-spec.md` §7(F1~F3·F5·F7~F8 RUID 검증 완료분)은 그대로 유지 — 재발행 시 재검색 불요. **F9 낚시터 리스킨은 이미 완료됐다**(커밋 `38ae03c`).
- ~~아래는 폐기된 원문(이력 보존)~~
- **배경**: 단조로운 필드의 나무, 바위 등 변주. `docs/design/artwork-spec.md` §7.
- **Target**: `RootDesk/MyDesk/MapObjects/Models/` (신규 .model), `map/template_field.map`, `map/town.map` (낚시터)
- **Change**: F1~F3, F5, F7~F9 아트 확보 및 `.model` 작성. 변주된 자연물을 사냥터에 배치. ~~마을 낚시터 리스킨 반영~~ → **🧭 2026-07-25 지휘자: 낚시터 리스킨(F9)은 무티켓 커밋 `38ae03c`에서 이미 완료**(`FishingSpot_Pond.model` `SpriteRUID=ecb83722d7fa4a3ab425302401032701`) — **이 티켓 범위에서 제외**.
- **Acceptance**: 사냥터 시각적 다양성 증가(F1~F3·F5·F7~F8). refresh Error=0. ※ 낚시터는 범위 밖.
- **충돌 주의**: `template_field.map` 레인 — town.map 레인(T84/T86/T75/T76)과 겹침 없음.

### T79. [✅ 완료 — Play 확인 2026-07-25(제작자 일괄) | ui_lint error=0 (L029 소멸) | refresh Error=0] PopupGroup.ui 중첩 UIGroup 제거 — 신규 린트 L029 ERROR 해소 (배치 L ①)

- **배경**: 2026-07-23 벤더 스킬 v0.6.0 동기화로 `ui_lint`에 L029(중첩 UIGroup 금지 — `UIGroupComponent`는 `.ui` 루트 전용, 중첩 시 렌더 이상 가능) 신설. 지휘자 실측: `node .claude/skills/msw-ui-system/scripts/ui_lint.cjs ui/PopupGroup.ui` → **ERROR 1건 `L029 /ui/PopupGroup/FurnacePopup`** (HUDGroup.ui는 error 0). 코드 실사(확정): 화로 팝업 여닫기는 이미 **entity `Enable` 구동**(`UIInventoryController.mlua` 651~·908~행 등 `furnacePopup.Enable` 판독) — 중첩 UIGroupComponent는 기능 잔재. 방치 시 다음 `PopupGroup.ui`에 대한 `b.write()`가 strict 린트에서 실패한다.
- **Target**: `ui/PopupGroup.ui`(UIBuilder 경유 단독), (확인만 — 수정 금지) `UI/Scripts/UIFurnaceController.mlua`·`UIInventoryController.mlua`
- **Change**: ① 착수 전 grep으로 FurnacePopup의 UIGroup API 의존 0건 확인(`UIGroupComponent` GetComponent/GroupVisible류 — 발견 시 entity Enable 방식 전환까지 포함하고 사유 보고) ② UIBuilder `removeComponent("FurnacePopup", "MOD.Core.UIGroupComponent")` 후 write(규칙 11 — 편집 전 Maker 스테일 저장 여부 확인) ③ `ui_lint` 재실행으로 L029=0 확인. 다른 팝업 엔티티 구조 변경 금지.
- **Acceptance**: ① `ui/PopupGroup.ui` 린트 error 0 (L029 소멸 — 린트 출력 발췌를 보고서에) ② 화로 F 상호작용 → 팝업 열림/닫힘, input/fuel 슬롯 드래그, 제련 동작 회귀 0 ③ WarpPopup·ChestPopup 등 타 팝업 무영향 ④ refresh Error=0 + 보고 3종. Play 확인은 제작자.
- **충돌 주의**: `ui/PopupGroup.ui` 레인 단독. `.mlua` 수정 없음(①에서 의존 발견 시에만 예외 — 그 경우 보고 필수).
- **구현 요약 (2026-07-23)**: UIGroup 의존 grep 0건 · `removeComponent(FurnacePopup, UIGroupComponent)` · lint `0 error, 89 warning`. `.mlua` 무수정. 보고서: `docs/agents/reports/T79-furnace-nested-uigroup.md`.
- **검증**: ui_lint **error=0**. **Maker refresh Error=0 확인 (2026-07-25 지휘자 — total 587 / W85 / I502)**. Play **보류(제작자 수행)**.

### T80. [✅ 완료 — Play 확인 2026-07-25(제작자 일괄) | town.map IsLegacy=true 0건 | refresh Error=0] 마을 NPC legacy 설정 청산 + 이름표 버그 수정 (배치 L ②)

- **배경(⚖️ 2026-07-23 보스 지시 "마을 legacy 설정 오브젝트 수정")**: 지휘자 전수 스캔(맵 4종 raw 파싱 + 전 모델 ModelBuilder 스냅샷) 결과 `IsLegacy=true`는 **`map/town.map`의 NPC 배치 7건이 전부** — `/maps/town/{Merchant, Villager_Elder, Villager_Fisher, Villager_ResidentA~D}`의 `StateComponent.IsLegacy=true` (map01/template_field는 false만, 모델 파일들도 전부 false/미설정). 동일 실사 추가 발견: ⓐ 이 NPC들의 `StateComponent`+`StateAnimationComponent`는 상태·시트 값이 전무한 **미사용 잔재**(정적 스프라이트 NPC — 모델 18개 값 중 State 계열 0) ⓑ `TouchReceiveComponent` 잔재 — ⚖️ 클릭 상호작용 금지 정책(§1.5, T59)과 상충 ⓒ **이름표 버그: ResidentA~D 4명 전원 NameTag가 "촌장"**(T77 미러링 잔재 — 마을에 촌장 5명 표시. Fisher만 "낚시꾼"으로 정상). NPC 스크립트(`MerchantInteract`/`VillagerDialog`)는 State/StateAnimation/TouchReceive/ActionSheet를 참조하지 않음(지휘자 grep 0건 — 제거 안전 추정, 착수 시 재확인).
- **Target**: `map/town.map`(MapBuilder), `RootDesk/MyDesk/NPC/Models/{Merchant, Villager_Elder, Villager_Fisher, Villager_ResidentA, Villager_ResidentB, Villager_ResidentC, Villager_ResidentD}.model`(ModelBuilder), (확인만 — 수정 금지) `NPC/Scripts/{MerchantInteract, VillagerDialog}.mlua`
- **Change**:
  ① **재확인 grep**: NPC 스크립트·전 워크스페이스에서 해당 NPC의 State/StateAnimation/TouchReceive 참조 0건 재검증 — 참조 발견 시 그 항목만 [보류]+질문.
  ② **legacy 청산(본체)**: 7개 맵 배치 + 7개 모델에서 미사용 `MOD.Core.StateComponent`·`MOD.Core.StateAnimationComponent` 제거(removeComponent — 맵 오버라이드와 모델 양쪽 모두). 제거가 불가/위험으로 판명되는 항목은 폴백으로 `IsLegacy=false` 패치 후 사유 보고.
  ③ **TouchReceiveComponent 제거**(같은 7기 — ⚖️ T59 정책 정합. NPC 상호작용은 F 키/`InteractRequestEvent` 경로가 이미 담당, 회귀 없음 확인).
  ④ **이름표 수정**: ResidentA~D의 NameTag `Name`을 각자 어울리는 한국어 이름 4종으로 교체(맵 오버라이드 + 모델 기본값 동시 정정 — 모델 기본값도 현재 "촌장"). 선정표를 보고서에 기재(제작자 취향으로 교체 가능함을 명시).
  ⑤ **Rigidbody는 변경 금지 — 확인만**: 정적 NPC의 `RigidbodyComponent`(RectTile 규칙 1의 Kinematicbody 매핑과 불일치)는 이번 범위 밖. 플레이어 통행 차단 현행 동작만 확인하고 소견을 보고서 §5에 남긴다(교체는 별도 승인 필요).
- **Acceptance**: ① `map/*.map`+`RootDesk/**/*.model` 재스캔에서 `"IsLegacy": true` 0건(스캔 출력 발췌를 보고서에) ② 주민/상인 F 대화·상점 열기·말풍선·자동수다(AutoTalk) 회귀 0 ③ ResidentA~D 이름이 각자 표기되고 "촌장"은 Elder 1명뿐 ④ 고양이(Animal_Cat — Kinematicbody, 정상 구성 확인 완료) 배회 회귀 0 ⑤ refresh Error=0 + 보고 3종. Play 육안 확인은 제작자.
- **충돌 주의**: NPC 레인(town.map NPC 엔티티 + NPC 모델) 단독. `town.map`은 T75/T76(대기 — 노점/랜드마크 배치)과 파일을 공유하므로 **T80을 T75/T76보다 먼저 완료**(또는 엄격 순차). NPC `.mlua` 수정 금지.
- **구현 요약 (2026-07-23)**: Scripts 참조 0건 재확인 · 7모델+town.map에서 State/StateAnimation/TouchReceive 제거 · NameTag A미나/B유나/C다은/D토리 · IsLegacy=true 0건. Rigidbody 유지(소견 §5). 보고서: `docs/agents/reports/T80-town-npc-legacy-cleanup.md`.
- **검증**: 맵/모델 재스캔 통과. **Maker refresh Error=0 확인 (2026-07-25 지휘자)**. Play **보류(제작자 수행)**. ※ §5 소견의 정적 NPC `RigidbodyComponent`는 **T84로 청산 발행**(2026-07-25).

### T81. [✅ 완료 — Play 확인 2026-07-25(제작자 일괄) | refresh Error=0] 마을 오브젝트 통행 차단 — T36 인프라 등록 (배치 M ①)

- **배경(⚖️ 2026-07-23 보스 결정)**: 마을 오브젝트 전면 관통. 원인(지휘자 실측 — town.map 최상위 엔티티 전수 + 모델 스냅샷): 통행 차단은 `PlayerController`의 자체 AABB 시스템(T36)인데, 차단 자격 = **`TriggerComponent`(차단 박스, `GetColliderAABB` 소스) + `script.ResourceOccupiedArea`/`script.PlaceableFurniture`(`IsBlockingOverlapEntity` 멤버십)**. 마을 건물 8동(`Building_{Shop,Fountain,Well,Blacksmith}`, `House_{MushroomA,MushroomOrange,MushroomYellow,WoodTower}`)은 Transform+SpriteRenderer뿐, 상호작용 구조물(`ResearchLab`/`BulletinBoard`/`FishingRankBoard`)도 Trigger·멤버십 없음, NPC 7기(Rigidbody만)와 연못(`FishingSpot` — Trigger는 있으나 멤버십 없음)도 미등록. T73/T74의 "Building_Shop 미러" 전제는 Shop 자체가 무차단이라 무효였음.
- **Target**: `map/town.map`(MapBuilder — 배치 엔티티에 컴포넌트 추가), `RootDesk/MyDesk/MapObjects/Models/{Building_Shop, Building_Fountain, Building_Well, Building_Blacksmith, House_MushroomA, House_MushroomOrange, House_MushroomYellow, House_WoodTower, Building_ResearchLab, BulletinBoard}.model`, `RootDesk/MyDesk/NPC/Models/{Merchant, Villager_Elder, Villager_Fisher, Villager_ResidentA~D, FishingRankBoard}.model`, `RootDesk/MyDesk/Furniture/Models/FishingSpot_Pond.model`(ModelBuilder — 모델·맵 양쪽 동기, T80 선례)
- **Change**:
  ① **건물 8동 + 상호작용 구조물 3종**: `MOD.Core.TriggerComponent`(IsLegacy=false, Box, `BoxSize`=본체 폭×(스프라이트 높이−지붕 겹침 0.5~1.5u), `ColliderOffset`=하단 정렬 중심) + `script.ResourceOccupiedArea`(`BlocksMovement=true`) 추가. 박스 수치는 각 SpriteRenderer 실크기 기준 모델별 산정(하드코딩 아님 — 컴포넌트 프로퍼티). **상단 지붕 밴드는 통행 가능**(톱다운 walk-behind).
  ② **정적 NPC 7기**: Trigger(Box ≈0.8×0.8, 발밑 정렬) + ResourceOccupiedArea. `Animal_Cat`(이동형)은 제외 — ResolveOverlaps는 플레이어 전용이라 이동 NPC 차단은 별개 주제.
  ③ **연못**: 기존 Trigger `BoxSize`를 물 영역 전체로 조정(현행 값 실측 후) + ResourceOccupiedArea 추가 — 진입 차단.
  ④ **회귀 확인**: `PortalToHome`(PlaceableFurniture, BlocksMovement=false) 통과 유지 / 가구 설치 프리뷰가 신규 Trigger 근처 설치를 차단하는 동작은 의도 부합 / town에 ResourceSpawner 점유 판정 간섭 없음(town은 자원 스폰 대상 아님 — 확인만).
  ⑤ **정렬 확인**: 지붕 뒤 통행 시 캐릭터가 건물에 가려지는지(SortingLayer/OrderInLayer/Y-sort) 확인 — 이상 시 수정하지 말고 소견 보고(§5).
- **Acceptance**: ① 건물 8동·구조물 3종·NPC 7기·연못 전부 8방향 통과 불가(본체), 지붕 상단 밴드는 통행 가능 ② 포탈 워프·고양이 배회·가구 설치 회귀 0 ③ 대시로도 관통 불가(IsObstacle 공유 — 로그/코드 근거) ④ refresh Error=0 + 보고 3종. Play 체감 = 제작자.
- **충돌 주의**: town.map + 모델 레인. **T75/T76(town.map 공유) 착수 전 완료**. `PlayerController.mlua` 수정 금지(그건 T82).
- **참고**: T74는 "주택 5동 배치"로 보고했으나 실배치는 4동 — `House_ThatchHut`은 모델만 존재, town.map 미배치(지휘자 실측 2026-07-23). 배치 보완은 T75/T76 소관으로 이관(이 티켓 범위 밖).
- **구현 요약 (2026-07-23)**: 건물 8+구조물 3+NPC 7+연못에 Trigger(IsPassive)+ResourceOccupiedArea(BlocksMovement=true) 모델·맵 동기. BoxSize=디자인 목표 폭×(높이−지붕밴드). 연못 7.5×4.5. PortalToHome `BlocksMovement=false` 맵 명시. Cat 무변경. 보고서: `docs/agents/reports/T81-town-movement-blocking.md`.
- **검증**: 맵 컴포넌트 스캔 통과. **Maker refresh Error=0 확인 (2026-07-25 지휘자)**. Play **보류(제작자 수행)**.

### T82. [✅ 완료 — Play 확인 2026-07-25(제작자 일괄) | refresh Error=0] 상호작용 판정 개선 — Trigger AABB 기반 footprint 자동 정합 (배치 M ②, T81 후 착수)

- **배경(⚖️ 2026-07-23 보스 결정)**: 상호작용이 오브젝트 **중심 셀** 인접에서만 성립해 "건물 한가운데까지 가야" 하는 불편(T67 조준선 게이트의 footprint가 실물 대비 협소: 연못 1×1, 연구소/게시판 2×2). T81 차단 도입 후에는 중심 접근 자체가 불가능해지므로 **이 티켓 없이 T81만 반영되면 상호작용 불능** — 결합 필수. 보스 선택 = A안: Trigger 박스에서 상호작용 범위 자동 산출(차단·상호작용 단일 데이터).
- **Target**: `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` 단독 (`IsAimTarget`/`ReadAimFootprint` 1155~1206행 일대)
- **Change**:
  ① `IsAimTarget`에 분기 추가: 대상에 유효 `TriggerComponent`가 있으면 **조준 셀의 월드 사각형(1×1u)과 Trigger 월드 AABB의 겹침(∩≠∅, epsilon 허용)** 으로 판정 — AABB 산출은 기존 `GetColliderAABB` 재사용(정의 실확인 완료, 규칙 8 충족). Trigger가 없으면 기존 `ReadAimFootprint`(AimFootprintW/H) 경로 유지.
  ② 효과: T81에서 Trigger를 단 건물·구조물·연못·NPC는 **테두리 어느 셀을 바라봐도 F 성립**(물가 어디서든 낚시). 화로/상자/침대 등 기존 명시 footprint 대상은 Trigger 유무에 따라 자동 전환 — 회귀 확인.
  ③ **서버측 거리 가드 정합**: `FishingSpot`/`TreasureChest`의 `ServerOpenDistance`(4.0 등) 등 서버 검증이 확장된 클라 판정과 어긋나 "클라 OK·서버 거부"가 나지 않는지 확인 — 필요 시 프로퍼티 값만 조정(코드 분기 금지). 대상 스크립트 수정 금지, 값 조정은 모델/배치 프로퍼티로.
  ④ 검증 태그 로그: `[T82][AIM] target=<name> mode=<trigger|footprint> hit=<bool>` (Play 검증 근거).
- **Acceptance**: ① 연구소·게시판·랭킹보드·연못·상인·주민 — 실물 테두리 인접 어느 방향에서든 F 성립(중심 접근 불요) ② 화로/상자/침대/보물상자/포탈/동물 상호작용 회귀 0(T67 Acceptance 재통과) ③ 낚시 캐스팅~릴링(T64) 회귀 0 ④ 모바일 BtnInteract 동일 동작 ⑤ refresh Error=0 + 보고 3종. Play 체감 = 제작자.
- **충돌 주의**: `PlayerController.mlua` 단독 레인. **T81 완료 후 착수**(Trigger 없이는 신규 분기가 공회전). 낚시 릴링 홀드(T64)·조준 리티클(`UpdateMineReticle` — 채굴용)·`IsObstacle`/`ResolveOverlaps`(T36) 무수정.
- **구현 요약 (2026-07-23)**: `IsAimTarget`에 Trigger AABB∩조준셀 분기 + footprint 폴백 + `[T82][AIM]` 로그. TreasureChest 서버도 IsAimTarget 공유·FishingSpot ServerOpenDistance 없음 → 프로퍼티 조정 불요. 보고서: `docs/agents/reports/T82-aim-trigger-aabb.md`.
- **검증**: 정적 코드 검토 통과. **Maker refresh Error=0 확인 (2026-07-25 지휘자)**. Play **보류(제작자 수행)**.

### T83. [✅ 완료 — Play 확인 2026-07-25(제작자 일괄) | refresh Error=0] 건물 walk-behind — MapObject식 반투명 + Y정렬

- **배경(⚖️ 2026-07-23 보스 지시)**: 박스 수치는 제작자가 직접 튜닝. 대신 건물 뒤로 통과할 때 캐릭터가 건물 **위**로 올라간 것처럼 보이지 않고 **뒤**로 들어가며, MapObject(`ResourceReaction` Alternative D)처럼 건물이 반투명해지길 원함. 원인: 일부 town 배치가 `MapLayer2`/고정 낮은 OrderInLayer라 플레이어가 항상 위에 그려짐 + 알파 오클루전 스크립트 없음.
- **Target**: 신규 `RootDesk/MyDesk/MapObjects/Scripts/WalkBehindFade.mlua` · 건물/구조물 모델 11종 + `map/town.map` 동기 (Shop/Fountain/Well/Blacksmith/House×4/ResearchLab/BulletinBoard/FishingRankBoard). NPC·연못·포탈 제외. `PlayerController` 무수정.
- **Change**:
  ① `WalkBehindFade`: OnBeginPlay에서 `SortingLayer=EntityLayer(MapLayer5)` + `OrderInLayer=(SortRadius−y)×100`(자원 스폰과 동일 공식) → 플레이어 기본 Order 위로 그려져 "뒤"로 가림.
  ② OnUpdate(Client): Trigger 박스 기준 `ResourceReaction`과 동일 가림 판정 → `SetAlpha(CoveredAlpha=0.4)` / 해제 시 1.0. 전이 시에만 `[T83][WALKBEHIND]` 로그.
  ③ 모델·맵에 컴포넌트 부착 + 맵 `SpriteRenderer.SortingLayer=MapLayer5` 패치.
- **Acceptance**: ① 건물 앞(남)에서는 캐릭터가 건물 앞에 보임(또는 발치 겹침만) ② 지붕 밴드(북) 통과 시 건물이 반투명 + 캐릭터가 건물 뒤 ③ MapObject 나무/돌 회귀 0 ④ refresh Error=0(신규 mlua codeblock 생성) + 보고 3종. Play=제작자.
- **충돌 주의**: town.map + MapObjects 레인. T75/T76 전 완료 권장. 박스 수치 변경은 제작자(T81 Trigger) — 이 티켓은 연출만.
- **구현 요약 (2026-07-23)**: WalkBehindFade 신설 + 11모델/맵 적용. 보고서: `docs/agents/reports/T83-building-walkbehind-fade.md`.
- **검증**: 맵 SL/컴포넌트 스캔 통과. **Maker refresh Error=0 확인 (2026-07-25 지휘자 — `WalkBehindFade.codeblock` 정상 생성)**. Play **보류(제작자 수행)**. ※ 이 티켓이 유발한 `LWA-4012` Warning 44건은 **T86**에서 청소.

### T84. [완료 — 2026-07-25 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 정적 NPC `RigidbodyComponent` 청산 — RectTile Body 매핑 정합 (배치 N ①)

- **배경(🔴 8대 핵심규칙 1 위반 — 지휘자 실측 2026-07-25)**: `map/town.map`은 `RectTile`(TileMapMode=1)인데 정적 NPC 7기(`Merchant`, `Villager_Elder`, `Villager_Fisher`, `Villager_ResidentA~D`)가 **MapleTile(모드 0)용 `RigidbodyComponent`**를 달고 있다. 실측 = town.map 14건(componentNames 7 + @components 7) + NPC 모델 7종. `msw-general/references/platform.md` §4 매핑표(모드1 → `KinematicbodyComponent`) 및 **§8.5 "정적 데코·트리거 영역은 Body 불요"** 양쪽에 어긋난다. T80 §5에서 "확인만, 교체는 별도 승인"으로 보류된 항목 — **⚖️ 2026-07-25 보스 승인으로 착수**.
- **🧭 지휘자 설계 확정 — 교체가 아니라 제거**: 이 NPC들은 `MovementComponent`가 없는 완전 정적 엔티티다. 따라서 `Kinematicbody`로 **교체하지 말고 Body를 제거**한다(§8.5). 통행 차단은 **T81의 `TriggerComponent`+`script.ResourceOccupiedArea`(BlocksMovement=true)** 가, 상호작용 판정은 **T82의 Trigger AABB**가 이미 담당하므로 Rigidbody는 현재 아무 기능도 없는 데드웨이트다.
- **Target**: `map/town.map`(MapBuilder — 배치 엔티티 7기), `RootDesk/MyDesk/NPC/Models/{Merchant, Villager_Elder, Villager_Fisher, Villager_ResidentA, Villager_ResidentB, Villager_ResidentC, Villager_ResidentD}.model`(ModelBuilder — 모델·맵 양쪽 동기, T80/T81 선례)
- **Change**:
  ① **선행 grep 재확인**: `NPC/Scripts/{MerchantInteract, VillagerDialog}.mlua` 및 전 워크스페이스에서 이 NPC들의 `RigidbodyComponent`·`MovementComponent` 참조 0건 확인(규칙 8). 참조 발견 시 그 항목만 [보류]+질문.
  ② `removeComponent(..., "MOD.Core.RigidbodyComponent")` — **모델 7종 + town.map 배치 7기 양쪽**. `componentNames` 동기는 빌더가 처리(직접 JSON 편집 금지).
  ③ **`Animal_Cat`은 무수정** — 이동형이라 `KinematicbodyComponent`가 정답이고 이미 정상 구성.
  ④ 다른 맵(`map01`/`template_field`/`template_boss`)은 `RigidbodyComponent` 0건(지휘자 전수 스캔 완료) — **범위 밖, 손대지 말 것**.
- **Acceptance**: ① `map/*.map` + `RootDesk/**/*.model` 재스캔에서 `MOD.Core.RigidbodyComponent` **0건**(스캔 출력 발췌를 보고서에) ② 주민/상인 F 대화·상점 열기·말풍선·AutoTalk 회귀 0 ③ **NPC 통행 차단이 그대로 유지**(T81 Trigger가 담당 — 코드 근거 + 제작자 Play 확인 항목) ④ 고양이 배회 회귀 0 ⑤ `[LEA-3004]` 로그 0건 ⑥ refresh Error=0 + 보고 3종. Play 육안은 제작자.
- **충돌 주의**: `town.map` + NPC 모델 레인. **T86과 NPC 모델 7종을 공유 → 배치 내 순차 엄수(T84 먼저)**. T75/T76(town.map 공유)보다 선행. NPC `.mlua` 수정 금지.

### T85. [완료 — 2026-07-25 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 영지(map01) 낚시터 복구 — 무티켓 삭제 회귀 (배치 N ②)

- **배경(🔴 설계 회귀 — 지휘자 실측 2026-07-25)**: 무티켓 커밋 `38ae03c`(2026-07-22)가 `map/map01.map`에서 `FishingSpot` 엔티티(85행, `modelId=fishingspot_pond`, id `a5c966c2-fd5c-406c-b596-d8580d8aa517`, Position `(2.916275, 1.81077909, 0)`)를 **삭제**했다. `game_design.md` §15-C는 낚시터를 **"영지 연못 / 마을 / 사냥터 물가" 3곳**으로 명시하며, 현재 `map01`의 FishingSpot은 0건(town·template_field에만 존재 — 지휘자 전수 스캔). 결과로 **`FishDataSet.csv`의 `SpotType=estate` 2행(Carp/Shrimp)이 도달 불가 데드 데이터**가 됐다. ⚖️ **2026-07-25 보스 결정: 복구(설계대로 3곳 유지).**
- **Target**: `map/map01.map`(MapBuilder — `placeModel`) 단독
- **Change**:
  ① 삭제 전 원문을 `git show 38ae03c -- map/map01.map`에서 확인해 **동일 좌표·동일 modelId(`fishingspot_pond`)로 재배치**. 엔티티 id는 새 UUID 발급(구 UUID 재사용 금지).
  ② 삭제 시점 이후 `FishingSpot_Pond.model`이 리스킨(`SpriteRUID=ecb83722d7fa4a3ab425302401032701`)되고 T81에서 `ResourceOccupiedArea`가 붙었으므로, **`placeModel`로 모델 현행 구성을 그대로 미러**한다(구 배치의 컴포넌트 오버라이드를 복사하지 말 것 — 구 `@components`는 리스킨 이전 값).
  ③ **map01 지형 확인**: 복구 좌표가 현재 map01의 물가/연못 타일과 맞는지 육안 근거를 남긴다. 어긋나면 임의 이동하지 말고 **좌표 후보를 보고서 §5에 제시하고 [보류]+질문**(지형은 T51 이후 변경 이력 있음).
  ④ `FishDataSet.csv`는 **무수정** — estate 2행은 복구로 자동 유효화된다.
- **Acceptance**: ① `map/map01.map`에 `FishingSpot` 1기 존재(스캔 출력 발췌) ② 영지에서 낚싯대 장착 후 F → 캐스팅~릴링(T64) 정상, `SpotType=estate` 어종(Carp/Shrimp) 출현 ③ 마을·사냥터 낚시터 회귀 0 ④ 주간 낚시왕 랭킹(T63) 적립 경로 회귀 0 ⑤ refresh Error=0 + 보고 3종. Play 최종 확인은 제작자.
- **충돌 주의**: `map01.map` 단독 레인 — town.map 레인(T84/T86)과 파일 겹침 없음. `FishingSpot.mlua`·`FishingSpot_Pond.model` 수정 금지(배치만).

### T86. [완료 — 2026-07-25 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 빌드 Warning 청소 — `LWA-4012` 프로퍼티 기본값 명시 (배치 N ③)

- **배경(빌드 위생 — 지휘자 refresh 실측 2026-07-25)**: refresh Error=0이지만 **Warning이 baseline 25 → 85로 3.4배 증가**. 전수 분류 결과 `LWA-4012`(스크립트 프로퍼티에 모델 기본값 미명시) 79건이 원인이며, 소유자별 내역은 **`WalkBehindFade` 44건**(11 엔티티 × 4 프로퍼티 — T83 유발) + **`VillagerDialog` 24건**(6 NPC × 4 프로퍼티 — T77이 ResidentA~D 추가하며 증가) + Furnace 3 / MonsterMeleeAttack 3 / MonsterAI 2 / Monster 2 / SpriteRendererComponent 1. 방치하면 실제 Error가 Warning 노이즈에 묻힌다.
- **Target**: `RootDesk/MyDesk/MapObjects/Models/{Building_Shop, Building_Fountain, Building_Well, Building_Blacksmith, House_MushroomA, House_MushroomOrange, House_MushroomYellow, House_WoodTower, Building_ResearchLab, BulletinBoard}.model` + `RootDesk/MyDesk/NPC/Models/{FishingRankBoard, Merchant, Villager_Elder, Villager_Fisher, Villager_ResidentA~D}.model` (ModelBuilder 단독)
- **Change**:
  ① `WalkBehindFade`가 붙은 **11개 모델 전부**에 `CoveredAlpha` / `SortRadius` / `CoverNorthExtent` / `CoverWidthScale` 4개 프로퍼티의 **기본값을 Values에 명시**. 값은 **`WalkBehindFade.mlua`의 현행 프로퍼티 선언 기본값을 그대로 읽어 반영**(임의 수치 발명 금지 — T83 핫픽스로 `CoverNorthExtent=1.2`/`CoverWidthScale=0.85`가 이미 튜닝된 값이므로 **연출 변경 0이 절대 조건**).
  ② `VillagerDialog`가 붙은 **NPC 6종**에 `InteractRange` / `BalloonDuration` / `AutoTalkInterval` / `AutoTalkRange` 동일 방식으로 명시(현행 스크립트 기본값 그대로).
  ③ Furnace / MonsterMeleeAttack / MonsterAI / Monster / SpriteRendererComponent 잔여 11건은 **범위 밖**(별개 레인·모델) — 손대지 말고 보고서 §5에 후속 후보로만 기록.
  ④ **`.mlua` 무수정** — 이 티켓은 모델 Values 명시만이다. 스크립트 기본값을 바꾸는 것이 아니다.
- **Acceptance**: ① refresh 후 `LWA-4012` Warning이 **79 → 11 이하**(WalkBehindFade 0 / VillagerDialog 0), 총 Warning ~25 수준 복귀 — **refresh 로그의 Warning 분류 집계를 보고서 §4에 표로 첨부** ② **Error=0 유지** ③ 건물 반투명 농도·가림 범위(T83) 육안 무변화 — 값이 스크립트 기본값과 1:1 동일함을 보고서에 표로 대조 ④ 주민 대화·AutoTalk 동작 무변화 ⑤ 보고 3종.
- **충돌 주의**: NPC 모델 7종을 **T84와 공유 → 반드시 T84 완료 후 착수**. `town.map` 무수정(모델만). `WalkBehindFade.mlua`·`VillagerDialog.mlua` 무수정.

### T87. [완료 — 2026-07-25 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 워크스페이스 위생 — `RootDesk/MyDesk/` 최상위 자산 정리 (배치 N ④)

- **배경(디렉터리 규칙 위반 — 지휘자 실측 2026-07-25)**: `docs/agents/directory-structure.md`는 `RootDesk/MyDesk/` 하위를 **카테고리 → 자산 종류 2단계**로 강제하고, `msw-general` 절대원칙 12도 최상위 직접 배치를 금지한다. 현재 최상위에 **자산 9개가 방치**돼 있다:
  - `.sprite` 4종 — `msw_topdown_fishing_board_256.sprite` · `msw_topdown_fishing_pond_256.sprite` · `msw_topdown_quest_board_256.sprite`(무티켓 커밋 `38ae03c` 산출) · `shop.sprite` · `_reticle.sprite`
  - **MSW 자산 타입이 아닌 작업 원본 4종** — `shop.png` / `shop.pxg` / `lacheln_house_topdown.png` / `lacheln_house_topdown.pxg` / `lacheln_house_front_topdown.png` / `lacheln_house_front_topdown.pxg` (Maker 스캔 대상 폴더에 원본 이미지가 들어가 있음)
  - ※ `.directory` 파일과 `tile1.tileset` / `wall.tileset`은 **현행 유지**(Maker 생성물 / 타일셋은 기존 참조 경로 고정 — 손대지 말 것)
- **Target**: `RootDesk/MyDesk/` 최상위 위 9개 파일 + 이동 대상 폴더(`MapObjects/`, `UI/`, `scratch/`)
- **Change**:
  ① **작업 원본(`.png`/`.pxg`) 6개는 `scratch/artwork_rework/source/` 로 이동** — MSW 자산이 아니므로 Maker 스캔 경로에서 제거. 삭제가 아니라 이동(원본 보존).
  ② **`.sprite` 5종은 소속 카테고리로 이동** — `msw_topdown_fishing_board_256` / `msw_topdown_fishing_pond_256` / `msw_topdown_quest_board_256` / `shop` → `MapObjects/Sprites/`, `_reticle` → `UI/Sprites/`(폴더 신규 생성, `.directory`는 refresh가 생성 — 손으로 만들지 말 것).
  ③ ⚠️ **안전 절차 필수**: 이동은 **①→refresh→logs 확인 → ②→refresh→logs 확인** 2단계로 나눠 수행한다. 모델은 `SpriteRUID` 문자열로 참조하므로 폴더 이동이 참조를 깨지 않는 것이 원칙(directory-structure.md "이동/리네임 안전성")이나, **`.sprite`는 그 문서에 명시된 쌍이 아니므로 실증이 필요**하다. refresh 로그에 신규 Error가 1건이라도 뜨거나 스프라이트 미표시가 의심되면 **즉시 이동을 되돌리고 [보류]+질문**으로 전환한다(임의 강행 금지).
  ④ **삭제는 하지 않는다** — 참조되지 않아 보이는 자산도 이 티켓에서는 이동만. 삭제는 별도 승인 사항.
- **Acceptance**: ① `RootDesk/MyDesk/` 최상위에 `.directory` / `tile1.tileset` / `wall.tileset` 외 파일 **0개**(Glob 출력 발췌를 보고서에) ② refresh **Error=0**, 이동 전 대비 **신규 Warning 0** ③ 상점 건물·낚시 게시판·의뢰 게시판·연못·조준 리티클이 **전부 정상 렌더**(SpriteRUID 미해결 0 — 규칙 3) ④ 보고 3종. Play 육안은 제작자.
- **충돌 주의**: 파일 이동 레인 단독. `.model`/`.map`/`.ui` 내용 수정 금지(이동만으로 해결돼야 한다 — 수정이 필요해지면 그 자체가 ③의 롤백 신호다). **배치 N 마지막**(T84~T86 완료 후) 착수.

### T88. [코드 완료 — 2026-07-28 | ui_lint error=0 | refresh·런타임 검증 보류(제작자 수행)] T79 L029 수정 원복 — Maker 스테일 저장 3차 사고 복구 (규칙 11)

- **배경(🔴 지휘자 실측 2026-07-25 — 규칙 11 사고 3번째 발생)**: `maker_refresh_workspace` 직후 워킹 트리를 대조한 결과 **`ui/PopupGroup.ui`가 전량 재직렬화**(diff 33,123행 / +16,685 −16,683)되면서 **T79의 산출물이 되돌아갔다**.
  - 근거(UIBuilder 대조): **HEAD** → `FurnacePopup has UIGroupComponent: false` ✅ / **현재 워킹 트리** → `UIGroup 있음` ❌. 엔티티 수는 341개로 양쪽 동일 → **전량 재직렬화 + 해당 컴포넌트만 복원**된 전형적 스테일 저장 패턴.
  - 즉 Maker 에디터가 **T79 이전 상태를 메모리에 들고 있다가** 워크스페이스 파일을 자기 상태로 재직렬화했다. 규칙 11이 예고한 정확한 시나리오(2026-07-15 T47·T48·T50 소실 / 2026-07-16 판정에 이은 3차).
  - ⚠️ **규칙 11의 "전량 재직렬화 diff는 무해" 판정은 이 건에 적용되지 않는다** — 그 판정의 전제는 "**내용이 전수 실존**"이고, 여기서는 핵심 산출물이 실제로 소실됐다. **되돌리지 말 것이 아니라 복구할 것.**
- **Target**: `ui/PopupGroup.ui`(UIBuilder 경유 단독)
- **Change**:
  ① 착수 전 **다시 한 번 현재 상태를 UIBuilder로 대조**한다(그 사이 제작자가 Maker에서 refresh를 돌렸다면 이미 정상일 수 있음 — 정상이면 이 티켓은 [완료-불요]로 닫고 사유만 보고).
  ② 비정상이면 T79와 동일하게 `removeComponent("FurnacePopup", "MOD.Core.UIGroupComponent")` 후 `write()`. 다른 팝업 엔티티 구조는 일절 건드리지 말 것.
  ③ **작업 직전 Maker에서 `refresh`가 선행됐는지 제작자에게 확인**하고 시작한다(선행 없이 쓰면 다음 저장에 또 덮인다 — 규칙 11 ①).
  ④ `ui_lint`로 L029=0 재확인, 출력 발췌를 보고서에.
- **Acceptance**: ① `FurnacePopup`에 `UIGroupComponent` 없음(UIBuilder 대조 출력을 보고서에) ② `ui_lint` error=0 ③ 화로 팝업 여닫기·슬롯 드래그·제련 회귀 0 ④ 타 팝업(Warp/Chest/SkillTree) 무영향 — 엔티티 수 341 유지 ⑤ refresh Error=0 + 보고 3종.
- **충돌 주의**: `ui/PopupGroup.ui` 레인 단독. **배치 N(T84~T87)과 파일 겹침 없음 — 병렬 가능**. `.mlua` 수정 금지.
- **구현 요약 (2026-07-28)**: 착수 시 `has UIGroup=true`(비정상) → UIBuilder로 제거 → `false`·entity 341·`ui_lint 0 error`. Maker MCP 미연결로 refresh 선행 확인 불가 — **제작자 refresh 후 저장** 필수. 보고서: `docs/agents/reports/T88-furnace-uigroup-stale-recovery.md`.
- **검증**: ui_lint **0 error** / 89 warning / 131 info. **런타임 검증 보류(제작자 수행)**.

### T89. [완료 — refresh Error=0 | 런타임 검증 보류(제작자 수행)] 마을 Y축 렌더 정렬 정합 — 플레이어·NPC가 Y정렬 대상에서 누락 (⚖️ 2026-07-25 제작자 Play 버그)

- **배경(제작자)**: "마을에서 레이어 정렬이 잘 안 됨. **y축 위치에 따라 정렬되어야 하는 원칙**인데 적용이 안 된 것 같다. **유저뿐 아니라 마을 주민도** 제대로 정렬 안 된 채 렌더링."
- **🔴 지휘자 실사 — 원인 확정(코드·맵 실측 2026-07-25)**: Y정렬은 **일부 시스템에만** 적용돼 있고, 플레이어와 NPC는 **고정 OrderInLayer**라 y와 무관하게 항상 같은 앞뒤 관계로 그려진다.

  | 대상 | 현행 OrderInLayer | Y정렬 |
  |---|---|---|
  | 자원 (`ResourceSpawner`) | `(MapRadius − y) × 100` | ✅ |
  | 스포너 몬스터 (`MonsterSpawner`) | `(radius − ry) × 100` | ✅ |
  | 설치 가구 (`PlayerInventory`) | `(MapRadius − y) × 100` | ✅ |
  | 건물·구조물 11종 (`WalkBehindFade`, T83) | `(SortRadius − y) × 100` → 런타임 **약 8,500~11,500** | ✅ |
  | **플레이어 아바타** | **엔진 기본값(≈4)** — 어떤 스크립트도 `AvatarRendererComponent.OrderInLayer`를 쓰지 않음(전 워크스페이스 grep: alpha 용도 3곳뿐) | ❌ |
  | **NPC 7기** (Merchant/Elder/Fisher/ResidentA~D) | **12 고정** (town.map 실측) | ❌ |
  | `Animal_Cat` | **2 고정** | ❌ |
  | `FishingSpot` | OIL 2, **`SortingLayer` 미설정(None)** | ❌ |

  → 귀결: ⓐ 건물 OIL(8,500~11,500) ≫ 플레이어(4) → **플레이어가 항상 모든 건물 뒤** ⓑ NPC(12) > 플레이어(4) → **NPC가 항상 플레이어 앞** ⓒ NPC끼리는 전원 12 동률이라 **주민 간 앞뒤가 y와 무관** ⓓ `FishingSpot`은 `SortingLayer`가 달라 OIL 비교 이전 단계에서 갈린다(우선순위 ① SortingLayer → ② OrderInLayer → ③ Z — `platform.md` §6).
  ※ T83 보고서 §5가 이 항목을 "후속 티켓 후보"로 예고했고, 그것이 실제 버그로 확정된 것.
- **🧭 지휘자 설계 확정 — 단일 Y정렬 규약으로 일원화**:
  ① **`Util/RenderLayers.mlua`에 단일 기준 신설** — `property number SortRadius`(전 맵 공통 기준) + `method integer ComputeYOrder(number worldY)`(= `math.max(MinEntityOrder, math.floor((SortRadius − worldY) * 100))`). **공식 리터럴을 개별 스크립트에 복제 금지**(R3·directory-structure.md "공통 속성 모듈화").
     - ⚠️ **기준값 불일치 해소가 이 티켓의 핵심 중 하나**: 현재 `WalkBehindFade.SortRadius=100` vs `ResourceSpawner.MapRadius=30`(홈)으로 **같은 y라도 OIL이 7,000 차이** → 두 시스템 산출물이 섞이면 정렬이 무너진다. 통일 기준값과 그 근거를 보고서에 기재하고, 기존 호출부를 `ComputeYOrder`로 교체한다(수치 변경으로 기존 자원↔가구↔몬스터 정렬이 깨지지 않는지 회귀 확인 필수).
  ② **신규 `MapObjects/Scripts/YSortSprite.mlua`** — 연출 없이 정렬만 하는 최소 컴포넌트(`WalkBehindFade`의 정렬 절반을 분리 재사용). `property boolean Dynamic = false`: false면 `OnBeginPlay` 1회(정적 NPC·구조물), true면 이동체용 주기 갱신(`Animal_Cat`). **`WalkBehindFade`에 페이드가 필요 없는 대상에 그걸 붙이지 말 것**(T83이 의미 불일치를 이유로 분리한 선례 유지).
  ③ **NPC 7기 + `Animal_Cat`(Dynamic=true) + `FishingSpot`에 `YSortSprite` 부착** — 모델·맵 동기(T80/T81 선례). `FishingSpot`은 `SortingLayer`도 `_RenderLayers.EntityLayer`로 명시.
  ④ **플레이어 아바타 Y정렬** — `PlayerController`에서 `AvatarRendererComponent`의 `SortingLayer = _RenderLayers.EntityLayer` + `OrderInLayer = _RenderLayers:ComputeYOrder(worldY)` 갱신. **매 프레임 무조건 대입 금지** — y 변화가 임계값 이상일 때만 갱신(불필요 이벤트 억제).
     - 🔴 **동기화 주의(착수 전 반드시 실확인)**: `AvatarRendererComponent.d.mlua` 기준 **`SortingLayer`는 `@Sync`이지만 `OrderInLayer`는 `@Sync`가 아니다**. 따라서 LocalPlayer만 자기 자신을 정렬하면 **다른 플레이어는 내 화면에서 정렬되지 않는다**. 각 클라이언트가 **화면상의 모든 플레이어 엔티티**에 대해 OIL을 계산하도록 실행 공간을 설계할 것(`PlayerController`의 해당 `OnUpdate` ExecSpace를 `.d.mlua`·기존 코드로 확인 후 결정 — 규칙 8). 구조상 불가하면 **[보류]+질문**으로 전환하고 임의 판단하지 말 것.
  ⑤ **정렬 기준점**: 스프라이트 중심 y가 아니라 **발밑(접지선) y**가 톱다운 정렬의 올바른 기준이다. 현행 `WalkBehindFade`/자원은 엔티티 y를 쓰므로, 건물처럼 키가 큰 스프라이트는 플레이어와 동률·역전이 날 수 있다. **오프셋 프로퍼티(예: `SortYOffset`)로 보정 가능하게** 하고 리터럴 금지.
- **Target**: `Util/RenderLayers.mlua`, 신규 `MapObjects/Scripts/YSortSprite.mlua`, `Player/Scripts/PlayerController.mlua`, `MapObjects/Scripts/WalkBehindFade.mlua`(공식 호출부 교체), `MapObjects/Scripts/ResourceSpawner.mlua`·`Monster/Scripts/MonsterSpawner.mlua`·`Player/Scripts/PlayerInventory.mlua`(공식 호출부 교체만 — 로직 변경 금지), `map/town.map` + `NPC/Models/{Merchant, Villager_Elder, Villager_Fisher, Villager_ResidentA~D}.model` + `MapObjects/Models/Animal_Cat.model` + `Furniture/Models/FishingSpot_Pond.model`
- **Acceptance**: ① 플레이어가 건물·NPC보다 **y가 작으면(남쪽) 앞**, **크면(북쪽) 뒤**로 그려짐 ② **NPC끼리도 y 순서대로** 앞뒤가 갈림 ③ 플레이어↔NPC 앞뒤가 y로 결정됨(현행 "NPC가 항상 앞" 소멸) ④ 고양이 배회 중에도 정렬 유지 ⑤ 낚시터·자원·설치 가구·몬스터 정렬 **회귀 0**(기준값 통일로 인한 역전 없음 — 근거 기재) ⑥ T83 walk-behind 반투명 동작 회귀 0 ⑦ 공식 리터럴 중복 0(전부 `ComputeYOrder` 경유) ⑧ refresh Error=0 + 보고 3종. 최종 육안은 제작자 Play.
- **충돌 주의**: `town.map`·NPC 모델을 **T84·T86과 공유** → **배치 N 완료 후 착수**. `PlayerController.mlua`는 단독. 신규 `.mlua`이므로 **refresh로 `.codeblock` 생성 확인 필수**(핵심 규칙 2). 착수 전 `msw-scripting` + `msw-general/references/platform.md §6`(3단 우선순위) 로드.

### T90. [🔴 반려 — 2026-07-28 지휘자 검수 | Change ⑥ 미이행 → T98로 재작업] 물 타일 기반 신설 — L1 `Water` (Phase 21 ①)

> **반려 사유(제작자 Play 2026-07-28 "물이 배치가 안 돼 있어" + 지휘자 실측)**: 티켓 **Change ⑥(생성기 고정 수역 배치 + 산출 검사)을 통째로 미이행**했다.
> - `map/{map01, town, template_field, template_boss}.map` 전부 **`Water` 참조 0건**(실측).
> - `scripts/build_maps.cjs` **미수정**(git diff 공백), 파일 내 `water` 문자열 **0건**.
> - 보고서 §2 수정 파일 목록에 `build_maps.cjs`가 없고, §5는 "발견한 문제 없음"으로 누락을 드러내지 못했다.
> - 결과적으로 **Acceptance ①(물 렌더·통행 불가) ②(물가 프린지) ④(미니맵 물색)가 구조적으로 확인 불가능한 상태**에서 [완료]로 표기됐다 — 지휘자 규약 "Acceptance 전부 충족 전 [완료] 금지" 위반.
>
> **인정 부분(재작업 범위에서 제외)**: `wall.tileset`의 `Water` 타일 정의 + `IsCollidable=true` · `ResourceSpawner.IsWaterTileName`과 스폰 억제 · 미니맵 물색 — 이 3건은 실물 확인됨. **T98은 "물을 실제로 맵에 놓는 일"만** 수행한다.

- **배경(⚖️ 2026-07-25 보스 지시)**: "크래프팅 게임에서 **물은 필수 요소**. 물을 이용한 개인 영지 디자인을 하고 싶다. 어느 맵에서든 물로 낚시할 수 있게." ⚖️ 확정 3건 — **물 생성 = 생성기 고정 배치 + 영지만 삽으로 파기 병행** / **물 통행 = 불가(수영 없음)** / 차단 장치는 T93.
- **🧭 지휘자 설계 확정 — 기존 잔디 마스크 문법을 건드리지 않는다 (이 티켓의 핵심 제약)**: §1.3 타일 스킴은 **"흙 vs 잔디" 1축 서브셀 마스크**다. 물을 3번째 지형으로 넣으면 `TileNameToMask`/`MaskToTileName`/`ComputeGrassTileName`/오토타일이 전부 2축으로 재설계돼야 하고, 이는 프로젝트에서 하중이 가장 큰 부분이다. **따라서 물은 L1의 타일 이름만 `Soil` ↔ `Water`로 가르는 방식으로 도입한다**:
  ```
  현행:  L2 홀(잔디 없음) → L1 Soil 노출        = 흙길·광장 바닥
  신규:  L2 홀            → L1이 Soil이면 흙 / Water면 물
  ```
  → 잔디 방향 에지·오목/볼록 코너·대각 `SubGrass` 문법 **전량 무변경**, 물가 테두리도 기존 잔디 프린지가 그대로 처리. **마스크 관련 함수를 한 줄도 고치지 말 것** — 고쳐야 할 것 같으면 설계가 어긋난 것이니 [보류]+질문.
- **Target**: `RootDesk/MyDesk/wall.tileset`(미사용 슬롯에 물 타일 추가), `MapObjects/Scripts/ResourceSpawner.mlua`(판정 함수·스폰 억제), `UI/Scripts/UIMinimapController.mlua`(`TileColor`), `scripts/build_maps.cjs`(고정 수역 배치 + 산출 검사)
- **Change**:
  ① **타일 추가**: `wall.tileset`의 미사용 슬롯(지휘자 실측 — `xx`, `x`, `Name15`, `Name16`, `Name23~Name25`, `Name28~Name32`)에 물 타일을 넣는다. 이름 규약 = **정확히 `Water`**(`IsSoilTileName`이 `"Soil"` 정확 일치인 선례 미러). 아트는 **msw-search 공식 리소스 1순위**(R1), 없으면 제작자 협업. ⚠️ 타일셋은 Maker 편집 영역이 섞이므로 **슬롯 이름 변경 시 기존 15종 잔디 패밀리 이름을 절대 건드리지 말 것**.
  ② **판정 함수 신설**: `IsWaterTileName(name)` (정확 일치). `IsSoilTileName`은 **무변경**(물을 흙으로 오판하면 자원이 물 위에 스폰된다).
  ③ **통행 불가**: 물 셀의 타일 `Movable = false`. RectTile 충돌은 타일 Movable 기반(`platform-rect.md` §3)이므로 **엔티티 Trigger 불요**. `EnableTileCollision=true` 전제 확인만.
  ④ **자원 스폰 억제**: `RequiredTile` 판정에서 물 셀은 **어떤 자원도 스폰 불가**로 확정(`BiomeResourceDataSet` 무수정 — 코드 판정에서 배제). 기존 `FullGrass`/`Soil` 판정 회귀 0.
  ⑤ **미니맵**: `TileColor`에 물색 추가(잔디색·흙색과 명확히 구분).
  ⑥ **생성기 고정 수역**: `build_maps.cjs`가 `template_field`(사냥터)와 `town`에 수역을 배치. 문법은 §1.3 "문법 2 — 광장/밭"의 홀 유지 규칙 재사용(내부 = L2 홀, 둘레 = 잔디 프린지) + **L1을 `Water`로**. **산출 검사 추가**: 물 셀에 L2 잔디가 남아 있거나 물 셀이 Movable이면 즉시 실패.
  - ⚠️ **`node scripts/build_maps.cjs --force`는 손편집을 전량 덮어쓴다** — 실행 전 반드시 제작자 확인을 받고, 현재 `map01`에 남아 있는 지형 편집·배치물 소실 여부를 먼저 보고할 것.
- **Acceptance**: ① 물 타일이 렌더되고 **8방향 전부 진입 불가** ② 물가 잔디 테두리가 기존 문법대로 자동 생성(전용 물가 타일 신설 0) ③ 물 셀에 자원 스폰 0(로그 근거) ④ 미니맵에 물이 구분되어 표시 ⑤ **마스크 관련 함수 diff 0** ⑥ 기존 길·광장·밭·대각 타일 회귀 0 ⑦ refresh Error=0 + 보고 3종.
- **충돌 주의**: `ResourceSpawner.mlua`는 T89(Y정렬)와 공유 → **순차**. T91·T92가 이 티켓에 의존하므로 **Phase 21 선두**.

### T91. [완료 — refresh Error=0 | 런타임 검증 보류(제작자 수행)] 낚시 = 물 타일 인접 판정으로 전환 + 맵별 어종 (Phase 21 ②, T90 후 착수)

- **배경(⚖️ 2026-07-25 보스 지시)**: "**마을 낚시터는 그대로 남기되, 개인 영지·다른 맵의 낚시터는 제거**. 대신 물 요소를 통해 **어느 맵에서든 낚시**. 단 **맵마다 특수한 물고기**가 존재해야 한다."
- **🔴 이력 왕복 고지**: 이 티켓은 **T85(2026-07-25, 커밋 `ce13617`)가 복구한 `map01`의 `FishingSpot`을 다시 제거**한다. T85는 당시 §15-C 설계(3곳 유지)에 따른 정당한 복구였고, 같은 날 보스 설계 변경으로 무효화된 것이다 — 구현자는 이를 회귀로 오해하지 말 것.
- **🧭 지휘자 설계 확정 — 두 경로 공존**: 마을은 **기존 픽스처 유지**, 그 외는 **타일 판정**. 판정 우선순위 = ① 조준 셀에 `FishingSpot` 픽스처가 있으면 그 픽스처의 `SpotType` ② 없고 조준 셀이 물 타일이면 **맵 기반 SpotType**. 이러면 마을 낚시터의 랭킹·연출이 그대로 살고 픽스처 삭제 마이그레이션도 불필요하다.
- **Target**: `Player/Scripts/PlayerController.mlua`(조준 셀 물 판정 → 낚시 진입), `Furniture/Scripts/FishingSpot.mlua`(픽스처 없는 낚시 세션 지원), `item/DataSets/FishDataSet.csv`(맵별 행 추가), `map/map01.map`·`map/template_field.map`(`FishingSpot` 제거), (**유지 — 수정 금지**) `map/town.map`의 `FishingSpot`
- **Change**:
  ① **조준 셀 물 판정으로 낚시 진입**: T67/T82의 조준 셀(`playerCell + LastDirection`)이 물 타일이면 F로 캐스팅. 기존 `IsAimTarget`(엔티티 대상) 경로는 **무수정** — 타일 판정은 별도 분기로 추가한다(T82 회귀 금지).
  ② **세션 소유 구조**: 현행 `FishingSpot.Sessions`는 픽스처 컴포넌트가 소유한다. 픽스처 없는 낚시를 위해 **세션 소유자를 어디로 둘지 먼저 결정**하고 사유를 보고서에 적을 것 — 권장안 = 맵 단위 싱글턴(`@Logic`)이 아니라 **플레이어 측 세션**(PlayerController 소유)으로 두어 T64의 릴링 상태기(`ReelTick` 0.1s·홀드 폴링)를 그대로 재사용. ⚠️ `@Logic`은 `OnMapEnter`/`OnMapLeave`가 호출되지 않으므로 맵 전환 정리 용도로 쓰지 말 것(R2).
  ③ **맵별 SpotType**: 맵 종류 판정은 **T37 mapKind 규약을 재사용**(신규 판정 로직 발명 금지 — 규칙 8로 정의 확인 후 호출). `SpotType` = 맵 종류 문자열(`estate`/`town`/`field`/`boss`). **맵이 늘면 CSV 행 추가만으로 어종이 붙어야 한다**(R3).
  ④ **CSV 행 추가**: 사냥터·보스맵 전용 어종을 `FishDataSet`에 추가(`Difficulty`/`MinFishingLevel`/`FishingXp`/`RankPoints` 포함). 기존 `estate`/`town` 행은 유지 — 영지는 T92의 판 물에서 계속 유효하다.
  ⑤ **픽스처 제거**: `map01`·`template_field`의 `FishingSpot` 엔티티 삭제(MapBuilder). **`FishingSpot_Pond.model`은 삭제하지 말 것** — town이 쓰고 있다.
  ⑥ **회귀**: 주간 낚시왕 적립(T57/T63)은 `SpotType` 무관하게 동작해야 한다 — 물 타일 낚시도 랭킹에 적립되는지 확인하고 결과를 보고.
- **Acceptance**: ① 영지·사냥터에서 **물가에 서서 조준 방향이 물이면** F로 낚시 시작 ② 마을 낚시터는 기존과 동일하게 동작(회귀 0) ③ 맵마다 다른 어종이 나옴(로그 근거) ④ `map01`·`template_field`에 `FishingSpot` 엔티티 0건 ⑤ T64 릴링(홀드-릴리즈·텐션·숙련 레벨) 전량 회귀 0 ⑥ 주간 낚시왕 적립 정상 ⑦ 어종·수치 하드코딩 0 ⑧ refresh Error=0 + 보고 3종.
- **충돌 주의**: `PlayerController.mlua`를 T89와 공유 → **순차**. `town.map` 무수정.

### T92. [완료 — refresh Error=0 | 런타임 검증 보류(제작자 수행)] 영지 물 파기 — 지형 편집 action 추가 (Phase 21 ③, T90 후 착수)

- **배경(⚖️ 2026-07-25 보스 확정 "둘 다")**: 고정 수역(T90 생성기)에 더해 **개인 영지에서는 플레이어가 직접 물을 파서 디자인**할 수 있어야 한다.
- **🧭 실현 근거(지휘자 실측)**: 지형 편집은 이미 **action 기반 + 맵별 영속** 구조다 — `ApplyTerrainEdit(mapName, map, action, x, y, axis, side, persist)` + `GetTerrainEditsJson`/`SetTerrainEditsJson`/`ReconstructTerrainEditsForMap`. **신규 저장 설계 없이 action 하나 추가로 성립**한다.
- **Target**: `MapObjects/Scripts/ResourceSpawner.mlua`(action 추가), `item/DataSets/item_dataset.csv`(도구 행 — `TerrainEditCooldown` 포함, T61 선례)
- **Change**:
  ① **`dig_water` action 신설** — 대상 셀의 L1을 `Soil` → `Water`로, Movable=false로 전환. **되메우기 action(`fill_water`)도 함께** 신설(물 → 흙) — 없으면 실수로 판 물을 되돌릴 수 없다.
  ② **영지 전용 게이트**: 영지(`Home_<UserId>`) 외 맵에서는 물 파기 불가. 맵 종류 판정은 **T37 mapKind 규약 재사용**(T91 ③과 동일 경로 — 중복 구현 금지).
  ③ **도구**: 기존 `Shovel` 재사용 여부 또는 전용 도구 신설을 **CSV 행으로** 결정. `if itemName == "..."` 분기 금지(R3) — 데이터셋 행 존재로 판정.
  ④ **안전 가드**: 플레이어가 선 셀·설치물이 점유한 셀·자원이 있는 셀은 파기 불가(물은 통행 불가라 **자기 자신을 가둘 수 있다**). 갇힘 방지 규칙을 명시하고 보고서에 적을 것.
  ⑤ **영속 검증**: 판 물이 재접속 후에도 유지되는지 `TerrainEditsJson` 경로로 확인. ⚠️ 세이브 경로를 만지게 되면 **규칙 9(Yield 금지)** 적용.
- **Acceptance**: ① 영지에서 삽으로 물을 파고 되메울 수 있음 ② 판 물에서 즉시 낚시 가능(T91 연계) ③ 재접속 후 물 지형 유지 ④ 사냥터·마을에서는 물 파기 불가 ⑤ 자기 자신이 갇히는 배치 불가 ⑥ 기존 지형 편집(길 파기·밭)·쿨다운(T61) 회귀 0 ⑦ refresh Error=0 + 보고 3종.
- **충돌 주의**: `ResourceSpawner.mlua`를 T89·T90과 공유 → **T90 완료 후 순차**.

### T93. [코드 완료 — 2026-07-28 | LSP errors=0 | refresh·런타임 검증 보류(제작자 수행)] 몬스터 접근 차단 장치 — 안전 낚시용 설치물 (Phase 21 ④)

- **배경(⚖️ 2026-07-25 보스 지시)**: "낚시를 안전하게 하기 위한 **몬스터가 오지 못하게 하는 장치 아이템**." ⚖️ 확정 = **설치 반경 내 접근 회피**(스폰 억제나 어그로 차단이 아니라, 몬스터 AI가 반경 안으로 들어오지 않음 — 이미 있는 몬스터에도 즉시 효과).
- **🧭 적용 범위**: **사냥터·보스맵 전용**이다. ⚖️ 영지 평화 원칙(§1.5 — 영지 내 전투·피격 없음)상 영지에는 몬스터가 없어 장치가 무의미하다. 영지에서 설치 시 동작하지 않는 게 정상이며, 이를 UI/툴팁으로 오해 없게 표기할지는 보고서 §5에 소견으로 남길 것.
- **Target**: 신규 `.model`(`Furniture/Models/` — ModelBuilder), 신규 또는 기존 `Furniture/Scripts/`(설치물 컴포넌트), `Monster/Scripts/MonsterAI.mlua`(회피 판정), `item/DataSets/item_dataset.csv` + 제작 레시피 데이터셋
- **Change**:
  ① **설치물**: 기존 `PlaceableFurniture` 인프라 재사용(신규 설치 체계 발명 금지 — 규칙 8로 정의 확인 후). 반경·지속시간/내구도는 **컴포넌트 프로퍼티 + CSV**(리터럴 금지 — 등급별 상위 장치를 CSV 행 추가만으로 낼 수 있어야 한다).
  ② **회피 로직**: `MonsterAI`의 추격·배회 목표 계산에서 **활성 장치 반경 안을 목적지로 삼지 않도록** 배제. 이미 반경 안에 있는 몬스터는 밖으로 이탈. ⚠️ 반경 경계에서 **떨림(진입↔이탈 반복)** 이 나지 않도록 히스테리시스(이탈 반경 > 진입 반경)를 두고, 값은 프로퍼티로.
  ③ **탐색 비용**: 몬스터마다 매 프레임 전 장치를 순회하면 비용이 커진다. 활성 장치 목록을 캐시하고 갱신 시점을 명시할 것(설치/철거/만료 시).
  ④ **보스 예외**: 보스가 이 장치로 무력화되면 안 된다 — **보스는 회피 대상에서 제외**(몬스터 데이터셋의 기존 보스 구분 컬럼을 재사용, 이름 분기 금지 R3).
  ⑤ **제작**: 아이템 + 레시피를 CSV 행으로 추가(제작창은 도감형 — T14/T25/T26 구조 그대로).
- **Acceptance**: ① 사냥터에 설치 → 반경 안으로 몬스터가 들어오지 않음(로그 근거) ② 이미 안에 있던 몬스터가 밖으로 나감 ③ 경계에서 떨림 없음 ④ 보스는 영향 없음 ⑤ 철거·만료 시 즉시 원복 ⑥ 반경·지속시간이 **CSV 행 수정만으로** 조정됨 ⑦ 기존 몬스터 추격·귀환·전투(T38~T41) 회귀 0 ⑧ refresh Error=0 + 보고 3종.
- **충돌 주의**: `MonsterAI.mlua` 단독 레인 — T89~T92와 파일 겹침 없어 **병렬 가능**. 착수 전 `msw-combat-system` + `references/ai-bt.md` 로드.
- **구현 요약 (2026-07-28)**: `Monster Ward` 가구 + `MonsterApproachBlocker`/`MonsterAvoidanceRegistry` + `MonsterAI` 회피·히스테리시스·`IsBoss` 면제 + CSV 컬럼 3종·레시피. 스프라이트=Portal RUID placeholder. 보고서: `docs/agents/reports/T93-monster-approach-blocker.md`.
- **검증**: LSP **errors=0**. **런타임 검증 보류(제작자 수행)**.

### T95. [완료 — refresh Error=0 | 런타임 검증 보류(제작자 수행)] Y정렬 기준점을 접지선으로 통일 — T89 후속 보정 (⚖️ 2026-07-28 제작자 Play 피드백)

- **배경(⚖️ 제작자 원문 요지)**: "건물의 중심 기준으로 **Y축 아래 유닛은 건물보다 튀어나오게, Y축 위 유닛은 건물보다 밑으로 깔리게** 해야 자연스럽다." → ⚖️ **T89 적용 후 상태를 보고 나온 피드백**(제작자 확인 2026-07-28).
- **🧭 지휘자 진단(실측 2026-07-28)**: **정렬 방향 규칙 자체는 이미 옳다** — `ComputeYOrder = (SortRadius − y) × 100`이라 y가 작을수록 OIL이 커져 앞에 그려진다. 문제는 **비교점**이다. T89는 전 대상을 `TransformComponent.WorldPosition.y` **한 점**으로 비교하는데, 실제 접지선(T81 충돌 박스 하단 = `ColliderOffset.y − BoxSize.y/2`)은 Transform에서 **대상마다 다르게** 떨어져 있다:

  | 모델 | BoxSize.y | ColliderOffset.y | 접지선(Transform 상대) |
  |---|---:|---:|---:|
  | `Building_Shop` | 3.12 | −0.44 | **−2.00** |
  | `Building_Blacksmith` | 2.96 | −0.42 | **−1.90** |
  | `House_MushroomA` | 2.57 | −0.36 | **−1.65** |
  | `FishingSpot_Pond` | 4.50 | 0 | **−2.25** |
  | `Villager_Elder` | 0.80 | −0.35 | **−0.75** |

  → 편차가 **0.75~2.25유닛으로 제각각**이라, 큰 건물일수록 실제보다 남쪽에 있는 것처럼 취급돼 앞뒤 전환선이 어긋난다. T89 티켓 ⑤가 "발밑 기준 + `SortYOffset` 보정"을 요구했으나 **구현은 프로퍼티만 만들고 전 모델에서 값이 0**이라 사실상 미적용 상태다(T89 보고서 §5 "발견한 문제 없음"은 이 누락을 놓친 것 — 검수 소견).
- **⚖️ 2026-07-28 보스 확정 2건**: ① **비교점 = 접지선(충돌 박스 하단)으로 전 대상 통일** ② **동률 시 유닛이 항상 이김**(캐릭터가 가려져 안 보이는 사고 방지 우선).
- **🧭 지휘자 설계 확정 — 접지선은 Trigger 박스에서 자동 산출(모델 수작업 금지)**:
  ① `RenderLayers`에 **`ComputeYOrderForEntity(Entity e, number extraOffset)`** 신설:
     - 대상에 유효 `TriggerComponent`가 있으면 → `groundY = worldY + ColliderOffset.y − BoxSize.y / 2`
     - 없으면 → `groundY = worldY + (SortYOffset or 0)` (수동 폴백)
     - 반환 = `ComputeYOrder(groundY)`
     이러면 **T81 Trigger 박스가 통행 차단(T81) + 상호작용 범위(T82) + walk-behind 페이드(T83) + 정렬 접지선(T95)의 단일 데이터 소스**가 된다 — ⚖️ 2026-07-25 "단일 데이터 소스 유지" 결정과 정합. **모델 15종에 수치를 손으로 박지 말 것**(R3).
  ② **유닛 우선 동률 규칙**: `RenderLayers`에 `property integer UnitTieBias = 1`(튜닝값) 신설. **유닛 계열**(플레이어·NPC·몬스터·펫·동물)의 OIL에만 `+ UnitTieBias`를 더한다. OIL 1 = y 0.01유닛이므로 체감 영향 없이 동률만 깬다. **오브젝트 계열**(건물·구조물·자원·설치 가구·소품)에는 더하지 않는다.
  ③ **호출부 전환**: `YSortSprite` · `WalkBehindFade` · `PlayerController.UpdateAvatarYOrder` · `ResourceSpawner` · `MonsterSpawner` · `PlayerInventory`의 OIL 산출을 전부 `ComputeYOrderForEntity` 경유로. **`ComputeYOrder(y)`는 남겨두되**(순수 y 계산이 필요한 곳), 엔티티가 있으면 반드시 새 헬퍼를 쓴다.
  ④ **⚖️ 2026-07-28 보스 확정 — 플레이어 아바타 `Transform` = 발밑**: 따라서 아바타는 **보정 오프셋 0**, `worldY`를 그대로 접지선으로 쓴다. 🔴 **아바타에는 Trigger 자동 산출 경로를 태우지 말 것** — 플레이어 엔티티에 다른 목적의 `TriggerComponent`가 있으면 접지선이 엉뚱하게 계산된다. `UpdateAvatarYOrder`는 `ComputeYOrder(worldY)` 직접 호출로 유지하고, 그 사유를 코드 주석에 남길 것.
  ⑤ **Trigger 유무별 처리 (지휘자 전수 실측 2026-07-28 — 45모델 중 보유 22 / 미보유 23)**:
     - **보유 22종**(건물·구조물 12 · NPC 8 · 연못 · 포탈) → **Trigger 자동 산출**. 접지선 −0.75 ~ −2.25.
     - **미보유 중 유닛 계열**(`Slime`, `SlimeKing`, `Boar`, `HornMushroom`, `Animal_Cat/Chicken/Sheep`, `Pet_Dog`) → **`SortYOffset = 0` 그대로**. 아바타와 같은 규약(발밑 = Transform)이 적용된다고 보고, 어긋나 보이면 값을 발명하지 말고 §5에 소견으로 보고.
     - **미보유 중 오브젝트 계열**(`Tree1`, `Tree2`, `Stone`, `IronNodeResource`, `GrownGrass`, `Crop_Carrot`, `TreasureChest`, `Furniture_{Bed, CookingPot, Furnace, WoodenChest, AnimalPen, MonsterWard}`) → **이 티켓에서는 `SortYOffset` 폴백(기본 0) 유지**. 값을 임의로 채우지 말 것 — 근본 해결은 T96 검토 결과에 따른다.
     - ⚠️ **일관성 이상 보고 대상**: `Big Stone1`(−1.25)·`Big Stone2`(−2.20)는 Trigger가 있는데 `Stone`·`Tree1/2`는 없다. 같은 자원 계열인데 갈리는 이유를 조사해 §5에 적을 것(런타임에 `ResourceSpawner`가 붙이는지 여부 포함).
     - `Projectile_Spore`는 투사체이므로 Y정렬 대상 밖 — 손대지 말 것.
- **Target**: `Util/RenderLayers.mlua`, `MapObjects/Scripts/{YSortSprite, WalkBehindFade, ResourceSpawner}.mlua`, `Player/Scripts/{PlayerController, PlayerInventory}.mlua`, `Monster/Scripts/MonsterSpawner.mlua`. **`.model`·`.map` 수정은 원칙적으로 불요** — 필요해지면 그 자체가 설계 이탈 신호이니 사유를 보고할 것.
- **Acceptance**: ① 건물 **바로 앞(남쪽)** 에 서면 캐릭터가 건물 앞, **바로 뒤(북쪽)** 로 가면 건물 뒤 — 전환선이 건물 접지선과 일치 ② 크기가 다른 건물(상점 3.12 vs 주민 0.80)끼리도 접지선 기준으로 올바르게 갈림 ③ 동률·근접 시 유닛이 앞(캐릭터가 오브젝트에 먹히지 않음) ④ 전환선 근처에서 좌우로 움직여도 깜박임 없음 ⑤ 자원·설치 가구·몬스터·낚시터·walk-behind 반투명(T83) 회귀 0 ⑥ **모델 파일에 수동 오프셋 수치 0건**(전부 Trigger 자동 산출 또는 폴백 프로퍼티) ⑦ refresh Error=0 + 보고 3종. 최종 체감은 제작자 Play.
- **충돌 주의**: **레인 A 소유 파일 전량** — T89~T92와 같은 파일을 만지므로 **레인 A에서 T92 완료 후 순차 착수**. 레인 B는 손대지 말 것.

### T96. [✅ 결정 완료 — ⚖️ 2026-08-01 보스 확정 **(C) 오브젝트 계열 전면 부여** → 실행은 T100·T75로 이관] 소품·자원·가구에 `TriggerComponent` 부여 여부

> ⚖️ **2026-08-01 보스 확정 — (C) 오브젝트 계열 전면 부여**
> - **부여 대상**: 자원 6종(`Tree1`·`Tree2`·`Stone`·`IronNodeResource`·`GrownGrass`·`Crop_Carrot`) + 가구 6종(`Bed`·`CookingPot`·`Furnace`·`WoodenChest`·`AnimalPen`·`MonsterWard`) + **신규 소품 P1~P11**(T75).
> - **제외(현행 유지)**: 몬스터 5 · 동물/펫 4 — Transform이 곧 발밑이라 보정 불요. `Big Stone1/2`는 이미 보유.
> - **실행 티켓**: **T100**(자원 6 + 가구 6) · **T75**(소품 11종, 스펙 ③ 개정 반영).
> - 🔴 **선행조사 3항목(①②③)은 여전히 미답이며 T100의 1단계로 편입한다.** 특히 ③(가구에 Trigger를 붙였을 때 T82 상호작용 범위 변화)의 답이 나오기 전에는 소품 스펙을 확정할 수 없으므로 **T100 → T75 순차**.
> - 🧭 지휘자 소견(참고): 아래 원 소견은 (B)/(C)를 권장했고 보스가 (C)를 택했다. (C)는 (B)보다 회귀 검증 범위가 넓으므로 **T81·T82·T83이 방금 Play PASS한 상태를 깨지 않는 것이 T100의 최우선 제약**이다.

- **배경(⚖️ 제작자)**: "소품 및 일부 자원도 trigger는 생각해보자." T95에서 접지선을 Trigger 박스로 자동 산출하기로 하면서, **Trigger 미보유 대상은 자동화 밖에 남는다**는 문제가 드러났다.
- **🧭 지휘자 실측 현황 (2026-07-28, 45모델 전수)**: 보유 **22** / 미보유 **23**.

  | 그룹 | Trigger | 현재 정렬 근거 |
  |---|:--:|---|
  | 건물·구조물 12 · NPC 8 · 연못 · 포탈 | ✅ | Trigger 박스 자동 |
  | 자원 `Tree1`·`Tree2`·`Stone`·`IronNodeResource`·`GrownGrass`·`Crop_Carrot` | ❌ | Transform y (보정 없음) |
  | 자원 `Big Stone1`·`Big Stone2` | ✅ | **같은 자원인데 갈림 — 원인 미확인** |
  | 가구 `Bed`·`CookingPot`·`Furnace`·`WoodenChest`·`AnimalPen`·`MonsterWard` | ❌ | Transform y |
  | 몬스터 5 · 동물/펫 4 | ❌ | Transform y (발밑 가정) |
  | 소품 P1~P11 (T75 — 미제작) | — | **신규라 지금 정하면 수작업 0** |

- **🔴 결정이 필요한 이유 — Trigger는 정렬 전용 부품이 아니다**: 이 프로젝트에서 `TriggerComponent`는 이미 **4가지를 동시에 구동**한다 — 통행 차단(T81, `ResourceOccupiedArea` 동반 시) · 상호작용 범위(T82 `IsAimTarget`) · walk-behind 페이드(T83) · 정렬 접지선(T95). 따라서 **정렬을 위해 Trigger를 붙이면 상호작용 범위와 통행 판정이 함께 바뀐다.**
  - 예: `Furniture_Bed`에 Trigger를 붙이면 상호작용이 현행 `AimFootprint` 방식에서 **Trigger AABB 방식으로 자동 전환**된다(T82 ②의 "Trigger 유무에 따라 자동 전환"). 범위가 넓어져 인접 설치물과 다시 꼬일 수 있다.
  - 예: 소품(벤치·꽃밭)에 `ResourceOccupiedArea`까지 붙이면 통행이 막혀 마을이 답답해진다. **Trigger만 붙이고 `ResourceOccupiedArea`는 안 붙이면 차단 없이 정렬·상호작용만** 얻을 수 있는지 — 이 조합의 실제 동작을 코드로 확인해야 한다(T81 배경 = "차단 자격 = Trigger + 멤버십" 이므로 이론상 가능하나 실증 필요).
- **선행 조사 항목 (결정 전에 지휘자/구현자가 답할 것)**:
  ① `Big Stone1/2`만 Trigger를 가진 이유 — `ResourceSpawner`가 런타임에 붙이는지, 아니면 단순 누락인지.
  ② `TriggerComponent`만 있고 `ResourceOccupiedArea`가 없을 때 통행이 실제로 안 막히는지(코드 근거).
  ③ 가구 6종에 Trigger를 붙였을 때 T82 상호작용 범위가 어떻게 변하는지(현행 `AimFootprintW/H` 값과 비교).
- **선택지(보스 결정 대기)**:
  - **(A) 전면 부여** — 45모델 전부 Trigger. 정렬 완전 자동화. 단 T82·T81 회귀 검증 범위가 가장 큼.
  - **(B) 신규만 부여** — T75 소품부터는 Trigger 필수로 규약화하고, 기존 미보유 23종은 `SortYOffset` 폴백 유지. **수작업 0 · 회귀 위험 최소**.
  - **(C) 오브젝트 계열만 부여** — 자원·가구·소품에는 부여, 몬스터·동물·펫은 발밑 규약 유지(유닛은 Transform=발밑이라 보정 불요).
- **🧭 지휘자 소견**: **(B) 또는 (C)** 를 권장한다. (A)는 T81·T82·T83이 모두 Play 확인을 마친 직후라 지금 전면 변경하면 방금 안정화한 3개 시스템을 동시에 흔든다. **T95 결과를 Play로 본 뒤**, 실제로 정렬이 어색한 대상만 좁혀서 부여하는 편이 안전하다.
- **Target/Change/Acceptance**: **보스 결정 후 확정**. 결정 전 착수 금지 — 이 항목은 티켓이 아니라 결정 대기 항목이다.

### T97. [✅ 완료 — Play 확인 2026-07-28(제작자) | refresh Error=0 | 지휘자 검수 통과·지적 0건] T95 검수 지적 3건 — 이름 분기 제거(R3) · 아바타 경로 · 가축/펫 Y정렬 누락

- **배경**: 지휘자 검수(2026-07-28, 코드 실측)에서 T95 구현의 결함 3건 확인. **T95를 반려하지는 않는다**(접지선 통일·`UnitTieBias`·refresh Error=0은 정상 이행) — 잔여 결함만 분리 발행.
- **① 🔴 R3 위반 — 유닛 판정에 이름 문자열 분기**: `Util/RenderLayers.mlua` `ComputeYOrderForEntity` 72~75행이
  ```lua
  if entName ~= nil and (string.find(entName, "Villager") or string.find(entName, "Merchant")
     or string.find(entName, "Elder") or string.find(entName, "Fisher")) then isUnit = true
  ```
  로 **엔티티 이름 문자열을 분기**한다. AGENTS.md **R3("`if itemName == "..."` 형태의 이름 분기 금지")** 정면 위반이며, 이름이 다른 신규 NPC는 조용히 오브젝트로 분류된다.
  - **수정**: `YSortSprite`에 **`property boolean IsUnit = false`** 를 신설하고 유닛 계열 모델에 `true`로 설정 → `ComputeYOrderForEntity`는 그 프로퍼티만 본다. 이름 분기 4줄은 **완전 삭제**. 판정 우선순위 = `PlayerController`/`PlayerComponent`/`MonsterAI` 보유(코드 계약) → `YSortSprite.IsUnit`(데이터) 순.
- **② 🟡 아바타가 Trigger 자동 산출 경로를 탐 (T95 티켓 ④ 명시 지시 위반)**: `PlayerController.UpdateAvatarYOrder`(3093행)가 `ComputeYOrderForEntity(self.Entity, 0)`를 호출한다. T95 티켓 ④는 **`ComputeYOrder(worldY)` 직접 호출 유지**를 지시했다.
  - **현재 영향 없음(지휘자 실측)**: `Global/DefaultPlayer.model`에 `TriggerComponent`·`PhysicsColliderComponent`가 **둘 다 없어** 폴백으로 `groundY = worldY`가 되어 우연히 정상 동작한다. ⚖️ 보스 확정대로 아바타 Transform = 발밑이므로 결과도 옳다.
  - **그러나 잠재 결함**: 향후 플레이어에 어떤 목적으로든 Trigger/Collider가 붙는 순간 **접지선이 조용히 어긋난다**(에러 없음). 
  - **수정**: `UpdateAvatarYOrder`를 `ComputeYOrder(transform.WorldPosition.y)` 직접 호출로 되돌리고, **"아바타 Transform은 발밑이므로 박스 보정 금지"** 사유를 코드 주석으로 남길 것. `UnitTieBias`는 별도로 가산(아바타도 유닛이므로 +bias 유지 — 현행 동작과 동일해야 한다).
- **③ 🟡 가축·펫 Y정렬 누락**: `Animal_Chicken` / `Animal_Sheep` / `Pet_Dog` 3종은 **`YSortSprite` 미부착 + `MonsterAI` 없음 + 이름 분기에도 미포함**(지휘자 실측) → Y정렬이 적용되지 않고 유닛으로도 분류되지 않는다. T89가 `Animal_Cat`만 처리하고 나머지 이동체를 놓쳤다.
  - **수정**: 3종 모델에 `script.YSortSprite`(`Dynamic=true`, `IsUnit=true`) 부착. `Animal_Cat`에도 `IsUnit=true` 추가.
- **Target**: `Util/RenderLayers.mlua`, `MapObjects/Scripts/YSortSprite.mlua`, `Player/Scripts/PlayerController.mlua`, `MapObjects/Models/{Animal_Cat, Animal_Chicken, Animal_Sheep, Pet_Dog}.model`, `NPC/Models/*.model`(7종 — `IsUnit=true`)
- **Acceptance**: ① `RenderLayers.mlua`에 **엔티티 이름 문자열 분기 0건**(grep 근거를 보고서에) ② 이름을 바꾼 NPC도 유닛으로 정상 분류 ③ 아바타는 박스 보정을 타지 않음(코드+주석 확인) ④ 닭·양·개가 y 순서대로 정렬되고 동률 시 오브젝트에 안 먹힘 ⑤ T95의 정렬 결과가 **육안상 회귀 0**(바이어스·접지선 동작 동일) ⑥ refresh Error=0 + 보고 3종.
- **충돌 주의**: 레인 A 소유 파일. **T95 완료 후 단독 착수** — 다른 티켓과 병행 금지.

### T98. [대기 — 🔴 T90 반려 재작업] 고정 수역 실배치 — 맵에 물을 실제로 놓는다

- **배경**: T90이 물 타일 **정의**는 만들었으나 **배치**를 하지 않아 게임에 물이 한 셀도 없다(제작자 Play 확인 + 지휘자 실측: 4개 맵 `Water` 참조 0건). 이 티켓은 배치만 담당한다.
- **⚖️ 2026-07-28 보스 결정 — 물 페인팅은 제작자가 Maker에서 직접, 에이전트는 테두리(프린지) 보정만**. 초안(CSV+런타임 적용)은 폐기.
- **🧭 지휘자 근거 — 이 분업이 프로젝트 규약과 정합**:
  - `ResourceSpawner.mlua` 914~916행 주석: **"맵 타일은 이제 Maker 손편집이 소스 오브 트루스다. 이 보정을 켜두면 로그인마다 사용자가 고른 타일 변형을 다시 계산해 덮어쓴다."** → 런타임 자동 배치는 이 철학과 충돌한다.
  - ⛔ `MapBuilder`는 타일 페인팅 미지원(`builder-protocol.md` §1.6 커버리지 갭) — 에이전트가 칠할 수단 자체가 없다.
  - ⛔ `build_maps.cjs --force`는 `town.map` 손배치(건물 8동·NPC 7기·Trigger·WalkBehindFade·YSortSprite)를 전량 파괴 — 사용 금지.
  - ⛔ `AutotileGrassLayer`(전맵 패스)는 **밀착 페어 길을 FullGrass로 평탄화해 길을 소실시킨다**(§1.3 · 코드 689~694행 경고). **절대 호출 금지.**
- **🔑 핵심 통찰 — 물가 프린지 = 기존 홀 프린지와 동일**: L2 관점에서 물 셀은 그냥 **L2 홀**이다(L1이 `Soil`이든 `Water`든 무관). 따라서 **전용 물가 타일이 필요 없고**, `digHole`과 똑같은 마스크 연산으로 둘레가 처리된다. 신규 타일·신규 문법 0.
- **제작자 선행 작업 (에이전트 착수 전 완료돼야 함)**: Maker에서 **L1 `RectTileMap` 레이어에 `Water` 타일만** 칠한다. **L2(`RectTileMap2`)는 건드리지 않는다** — 프린지는 이 티켓이 처리한다.
- **Target**: 신규 `scripts/fix_water_fringe.cjs` + 대상 `.map` 파일의 **L2 레이어만** 국소 수정. **`scripts/build_maps.cjs` 수정 금지 · `--force` 실행 금지 · `.mlua` 수정 금지 · L1/L3/L4/L5 레이어 수정 금지.**
- **Change**:
  ① **신규 오프라인 스크립트 `scripts/fix_water_fringe.cjs`**: `.map`을 읽어 **L1의 `Water` 셀 집합**을 구하고, ⓐ 그 셀들의 **L2를 홀로 비우고** ⓑ 물에 인접한 **잔디 셀의 서브셀 흙 마스크를 갱신**해 올바른 `FullGrass`/`Grass{8방}`/`Grass*Corner`/`SubGrass{LTRD,RTLD}` 로 다시 칠한다.
     - **프린지 계산 로직은 `build_maps.cjs`의 기존 `cellTile`/마스크 함수를 재사용**할 것(로직 복제 금지 — 두 곳이 갈라지면 §1.3 스킴이 깨진다). 재사용이 구조상 불가하면 그 사유를 보고서에 적고 **[보류]+질문**.
     - **국소성 엄수**: 물 셀과 그 8이웃 범위 밖의 L2 셀은 **1개도 건드리지 않는다**(밀착 페어 길 보존). 수정 셀 수를 로그로 출력할 것.
  ② **산출 검사 내장**(`build_maps.cjs` 선례): ⓐ L1이 `Water`인 셀에 L2 잔디가 남아 있으면 실패 ⓑ L2에 §1.3의 유효 15종(`FullGrass`+`Grass{dir}`8+`Grass*Corner`4+`SubGrass`2) 외 타일명이 생기면 실패 ⓒ 물 셀 외 영역의 L2 diff가 발생하면 실패.
  ③ **드라이런 우선**: `--dry-run`으로 변경 예정 셀 수·좌표 요약을 먼저 출력해 보고서에 첨부하고, 제작자 확인 후 실제 적용. **백업**: 적용 전 대상 `.map`의 git 상태를 확인하고(미커밋 변경이 섞이지 않게) 실행 결과를 diff로 검증.
  ④ **`.map` 직접 편집 허용 근거 명시**: 타일 페인팅은 `builder-protocol.md` §1.6 명시적 커버리지 갭이므로 **최소 범위 직접 편집 + `refresh` + 로그 검증**이 허용된다(msw-general 절대원칙 16). 그 외 영역은 절대 손대지 말 것.
  ⑤ **회귀 확인**: 물이 스폰 지점·포탈·NPC·건물·기존 통행로를 막지 않는지 확인하고, 막으면 **직접 고치지 말고** 좌표를 보고서에 적어 제작자에게 되돌린다(맵 디자인은 제작자 소유).
- **Acceptance**: ① 물가 잔디 테두리가 §1.3 문법대로 정확히 생성(전용 물가 타일 신설 0) ② **밀착 페어 길·광장·밭이 1셀도 변경되지 않음**(diff 범위 검사 근거를 보고서에) ③ L1 `Water` 셀에 L2 잔디 잔존 0 ④ 물 셀 자원 스폰 0 · 미니맵 물색 표시(T90 인정분 동작 확인) ⑤ **물가에서 F로 낚시 성립**(T91 연계 — Phase 21 완성 게이트) ⑥ 물 8방향 진입 불가 ⑦ refresh Error=0 + 보고 3종. Play 최종 확인은 제작자.
- **충돌 주의**: 대상 `.map`의 L2 레이어 단독. **제작자의 물 페인팅 완료 + 커밋 후 착수**(미커밋 상태에서 스크립트를 돌리면 규칙 11 사고와 섞여 원인 추적이 불가능해진다). T97·T99와 파일 겹침 없음 — 병렬 가능.

### T99. [✅ 완료 — Play 확인 2026-07-28(제작자) | 지휘자 refresh 대행 Error=0 (total 550 / W17 / I533), `ObstacleQuery.codeblock` 생성 확인 | 검수 통과·지적 0건] 몬스터가 자원·오브젝트를 통과하는 문제 — 엔티티 장애물 판정이 플레이어 전용 (⚖️ 2026-07-28 제작자 Play)

- **배경(제작자)**: "몬스터가 자원을 통과하며 움직이는 버그."
- **🧭 지휘자 진단 — 회귀가 아니라 처음부터 미구현(실측 확정)**: 엔티티 장애물 판정 3종(`IsObstacle` / `ResolveOverlaps` / `GetColliderAABB`)이 **`PlayerController.mlua`에만 22건 존재하고 다른 스크립트에는 0건**이다. 즉 T36 차단 시스템은 **플레이어 전용**이며, 몬스터는 `KinematicbodyComponent`의 **타일 충돌(Movable)만** 따르므로 **엔티티인 자원·건물·설치물을 통과하는 것이 현재 설계상 정상 동작**이다. (T81 ②에서 "`ResolveOverlaps`는 플레이어 전용이라 이동 NPC 차단은 별개 주제"로 이미 기록해 둔 사안이 제작자 Play에서 표면화된 것.) **이번 배치(T89~T95)의 회귀가 아니다.**
- **Target**: `Player/Scripts/PlayerController.mlua`(판정 로직 **추출**만 — 동작 변경 금지), 신규 공용 스크립트(예: `Util/ObstacleQuery.mlua` 또는 `@Logic`), `Monster/Scripts/MonsterAI.mlua`(이동 경로에 판정 적용)
- **Change**:
  ① **공용화**: `IsObstacle`/`GetColliderAABB` 계열을 플레이어에서 **공용 모듈로 추출**하고 PlayerController는 그것을 호출하도록 변경. **플레이어 이동 체감은 1도 바뀌면 안 된다**(T36·T41 회귀 0 — 추출 전후 동작 동일성을 보고서에 근거와 함께).
  ② **몬스터 적용**: `MonsterAI`의 이동 확정 지점에서 목표/다음 위치가 장애물과 겹치면 이동을 막거나 미끄러지게(slide) 처리. **T93의 `TryFleeAvoidZone`/`ClampChaseTargetOutsideAvoid`와 충돌하지 않게** 적용 순서를 정하고 보고서에 기재.
  ③ 🔴 **갇힘 방지 필수**: 몬스터가 자원 사이에 끼어 영구 정지하거나 스폰 직후 오브젝트 안에 갇히는 상황을 막아야 한다. 최소한 **일정 시간 이동 실패 시 탈출 폴백**(귀환/재배치)을 두고, 그 임계값은 프로퍼티로.
  ④ **성능**: 몬스터 N × 장애물 M 전수 비교는 매 프레임 비용이 크다. 주변 셀 기반 후보 축소나 캐시를 쓰고, 방식과 근거를 보고서 §3에.
  ⑤ **범위 한정**: 이 티켓은 **몬스터**만. NPC·동물·펫 이동체 차단은 범위 밖(필요하면 후속 티켓).
- **Acceptance**: ① 몬스터가 나무·바위·광맥을 **통과하지 못함** ② 몬스터가 자원 사이에 **영구히 갇히지 않음**(탈출 폴백 로그 근거) ③ 추격·귀환·배회·돌진(T38~T41)·회피 장치(T93) 회귀 0 ④ **플레이어 이동·채집 체감 회귀 0**(추출 리팩터링 안전성) ⑤ 프레임 저하 없음(근거 기재) ⑥ refresh Error=0 + 보고 3종.
- **충돌 주의**: `PlayerController.mlua`(레인 A 핵심 파일) + `MonsterAI.mlua`(T93 레인 B가 방금 수정) **양쪽을 동시에 만지는 유일한 티켓** → **단독 착수, 다른 티켓과 병행 금지**. 착수 전 `msw-combat-system` + `references/ai-bt.md` 로드.
- **구현 요약 (2026-07-28)**: `Util/ObstacleQuery.mlua`(@Logic) 신설 · PC 래퍼 추출(YOrder 무수정) · `MonsterAI.MoveDirVec` 슬라이드+갇힘 탈출. T93 순서=회피→MoveDirVec 내 장애물. 성능=OverlapAll(queryR). 보고서: `docs/agents/reports/T99-monster-entity-obstacles.md`.
- **검증**: LSP **errors=0**. **런타임 검증 보류(제작자 수행)**. refresh 측정 불가(MCP 미연결) — baseline Error=0 대비 제작자 refresh 필수.

### T100. [대기 — ⚖️ 2026-08-01 보스 T96 (C) 확정 | 🔴 T75의 선행] 자원 6종·가구 6종 `TriggerComponent` 부여 — T96 (C) 실행

- **배경**: T96이 **(C) 오브젝트 계열 전면 부여**로 확정(⚖️ 2026-08-01). T95가 정렬 접지선을 Trigger 박스에서 자동 산출하므로, Trigger 미보유 모델은 자동화 밖에 남는다. 이 티켓은 **자원·가구**를 편입하고, **소품(T75)의 스펙을 확정할 조사 결론**을 낸다.
- 🔴 **최우선 제약**: T81(통행 차단)·T82(상호작용 범위)·T83(walk-behind)이 **2026-07-25/28 Play PASS로 방금 안정화**된 상태다. 이 티켓은 정렬만 얻고 **그 3개 시스템의 동작을 바꾸지 않는 것**이 목표다. 바꿔야만 한다면 [보류]+질문.
- **Target**
  - 자원 6: `RootDesk/MyDesk/MapObjects/Models/{Tree1, Tree2, Stone, IronNodeResource, GrownGrass, Crop_Carrot}.model`
  - 가구 6: `RootDesk/MyDesk/Furniture/Models/Furniture_{Bed, CookingPot, Furnace, WoodenChest, AnimalPen, MonsterWard}.model`
  - 읽기 전용 참조: `MapObjects/Scripts/ResourceSpawner.mlua` · `Player/Scripts/PlayerController.mlua` · `Util/RenderLayers.mlua` · `MapObjects/Models/Big Stone1.model`
  - ⛔ **`.map` 파일 일절 수정 금지**(T75·T98과의 충돌 회피) · `.mlua` 수정 금지(조사 결과 필요 시 [보류]+질문)
- **Change**
  ① **선행조사 3항목을 코드 근거와 함께 보고서 §3에 먼저 답한다 — 부여 작업보다 앞선다.**
     - ⓐ `Big Stone1/2`만 Trigger를 가진 이유: `ResourceSpawner`가 런타임 부착하는가, 단순 누락인가. (→ 런타임 부착이면 **자원 6종도 코드로 처리하는 편이 맞을 수 있다**. 그 경우 모델 편집 대신 그 경로를 쓰고 사유를 기재.)
     - ⓑ `TriggerComponent`만 있고 `script.ResourceOccupiedArea`가 **없을 때 통행이 실제로 안 막히는지** — `PlayerController`의 차단 판정이 멤버십을 어떻게 보는지 인용해 확정.
     - ⓒ 가구 6종에 Trigger를 붙였을 때 **T82 `IsAimTarget`이 `AimFootprintW/H` → Trigger AABB로 자동 전환**되며 범위가 어떻게 변하는지. 현행 `AimFootprint` 값과 Trigger 박스 예정값을 **수치 표로 대조**하고, 넓어져 인접 설치물과 꼬이면 **회피책(값 명시 또는 제외 규약)을 제시**할 것. **이 결론이 T75 소품 스펙을 확정한다.**
  ② **자원 6종 Trigger 부여** — `ModelBuilder`로 `TriggerComponent` 추가. `BoxSize`/`ColliderOffset`은 **스프라이트 접지면 기준**(T81·T95 규약). `script.ResourceOccupiedArea` **멤버십은 현행 그대로 유지**(이 티켓은 차단 자격을 바꾸지 않는다 — 자원은 이미 채집 판정 경로가 별도).
  ③ **가구 6종 Trigger 부여** — 동일. ⓒ의 결론에 따라 `AimFootprint` 값 보존 조치를 함께 적용.
  ④ **역방향 검사**: 부여 후 `RenderLayers.ComputeYOrderForEntity`가 이 12종에서 **Trigger 경로로 접지선을 산출**하는지, 그리고 `IsUnit` 오분류가 생기지 않았는지 확인(T97 검수 방식 재사용).
  ⑤ **`SortYOffset` 폴백 정리**: Trigger를 얻은 모델에 남아 있는 `SortYOffset` 값이 **이중 보정**을 일으키지 않는지 확인. 일으키면 해당 모델의 값을 0으로.
- **Acceptance**
  ① 조사 3항목이 **코드 인용과 함께** 보고서 §3에 답변됨(T75 착수 근거가 됨) ② 자원 6 + 가구 6 전부 `TriggerComponent` 보유 ③ **통행 차단 동작 회귀 0** — 부여 전후로 막히는 대상 집합이 동일(ⓑ 근거) ④ **상호작용 범위 회귀 0** — 화로·요리냄비·상자·침대·축사·와드가 기존과 같은 거리에서 `F`로 잡힘(ⓒ 대조표) ⑤ 12종이 플레이어·NPC와 접지선 기준으로 정렬 ⑥ 이중 보정 없음 ⑦ refresh **Error=0** · Warning **baseline 17 유지**(초과 시 원인·소유 스크립트 명시) + 보고 3종.
- **충돌 주의**: `.model`만 만지므로 **T98(`.map` L2 타일)과 파일 겹침 0 → 병렬 가능**. **T75와는 순차**(T75가 이 티켓의 ⓒ 결론에 종속). 🔴 **보스의 Maker 물 페인팅 세션과는 겹치지 말 것** — Maker 저장이 워크스페이스를 재직렬화해 `.model` 편집을 원복시킨다(§1.2 규칙 11).

### (신규 작업 추가 템플릿)

### T<n>. [대기] <제목>
- **배경**: <왜 필요한가, 관련 game_design.md §>
- **Target**: <수정할 파일 경로들>
- **Change**: <단계별 변경 내용, 사용할 데이터셋/API>
- **Acceptance**: <관찰 가능한 완료 기준 + 검증 방법>
```

---

## 4. 하위 에이전트 보고 형식

작업 종료 시 다음을 보고한다:
1. 수정한 파일 전체 목록 (경로)
2. 실제 수행한 검증과 결과 (수행 못 한 검증은 "보류"로 명시 — 허위 "동작 확인" 금지)
3. 새로 발견한 문제 (있다면 §3에 신규 T항목으로 추가)

보고는 **세 곳**에 남긴다 (셋 다 필수 — 하나라도 빠지면 작업 미완료):
1. **채팅 응답** — 위 1~3 요약.
2. **이 문서의 해당 T항목 상태 갱신** — `[대기]`→`[진행]`→`[완료]`/`[보류]` + 검증 수준 병기.
3. **보고서 파일 작성** — [reports/_TEMPLATE.md](./reports/_TEMPLATE.md)를 복사해 `docs/agents/reports/T<n>-<kebab-슬러그>.md`로 저장 (예: `T6-farming-mvp.md`).
   - T항목당 파일 1개. 재작업 시 새 파일을 만들지 말고 같은 파일을 갱신하고 §7 이력에 append.
   - §4 검증 섹션에는 **실행한 검증만** 근거(로그 발췌)와 함께 적고, 못 한 것은 "보류" 명시.
   - §6에 해당 T항목의 제작자 런타임 체크리스트를 체크박스로 복사해 둔다 (제작자가 Play 검증 후 체크).

---

## 5. 외부 에이전트 킥오프 프롬프트 (복붙용 표준)

> 타사 에이전트(Codex/Cursor/Copilot/기타)에게 작업을 넘길 때 아래 블록의 `T<n>`만 바꿔 그대로 붙여넣는다.
> 대부분의 에이전트는 루트 `AGENTS.md`를 자동 로드하므로 절대 규칙은 이중으로 걸린다.

> **품질 추가 조항 (아래 5줄을 모든 킥오프 프롬프트 말미에 그대로 덧붙여 전달할 것)**
>
> ```
> 7. .mlua를 만지기 전에 msw-scripting 스킬(SKILL.md + references/verify-checklist.md)을 로드하라.
> 8. 다른 스크립트의 메서드/프로퍼티를 호출하기 전에 대상 파일에서 정의를 검색해 존재를 확인하라(§1.2 규칙 8). 없는 API를 추정으로 호출하지 마라.
> 9. refresh 검증은 티켓 완료마다 1회 수행하고 빌드 Error 수를 보고서 §4에 기재하라(레인 말미 몰기 금지).
> 10. 어떤 이유로든 중단할 때도 T항목 상태 갱신([보류]+사유)과 부분 보고서를 남겨라 — 무보고 종료는 반려다.
> 11. ⛔ [완료] 표기는 보고서 파일(docs/agents/reports/T<n>-*.md)을 먼저 작성한 뒤에만 허용된다. 보고서 없는 완료 표기는 즉시 반려다 — 이 위반이 반복 기록되었다. 작업 시작 시 첫 응답에 이 조항을 인지했음을 한 줄로 명시하라.
> ```
>
> ⚠️ **11번 조항은 킥오프 프롬프트 "최상단"에도 한 번 더 복사해 넣을 것** (2026-07-11 보스 지시 — 무보고 완료 재발 방지).


```
너는 이 저장소(MSW 게임 프로젝트)의 구현 담당 에이전트다. 계획 수립과 의사결정은 이미 끝났고, 너는 지시된 작업만 수행한다.

1. 먼저 `AGENTS.md`와 `docs/agents/subagent-handoff.md`의 §1(공통 컨텍스트)을 전부 읽어라.
2. 그 다음 §3 작업 큐에서 **T<n>** 항목만 수행하라. Target/Change/Acceptance에 명시되지 않은 것은 하지 마라 (리팩터링·기능 추가·다른 T항목 착수 금지).
3. 스펙이 모호하거나 하드코딩이 불가피해 보이면 임의 판단하지 말고 멈춰서 질문하라.
4. 시작 시 해당 T항목 상태를 [진행]으로 바꾸고, 종료 시 §4 보고 형식대로 보고 + 상태를 갱신하라.
5. 종료 시 반드시 `docs/agents/reports/_TEMPLATE.md` 양식으로 보고서 파일을 `docs/agents/reports/T<n>-<슬러그>.md`에 작성하라 (§4의 세 번째 필수 산출물 — 없으면 작업 미완료).
6. Play 런타임 검증은 네 범위가 아니다 — LSP 진단·refresh 빌드 로그까지만 검증하고, 나머지는 "런타임 검증 보류(제작자 수행)"로 정확히 보고하라.
```

> **배치 킥오프 프롬프트 (여러 T를 일괄 위임할 때)**
> 배치 목록(`T<a> → T<b> → …`)만 §3 현황판의 배치 정의로 바꿔 그대로 붙여넣는다.

```
너는 이 저장소(MSW 게임 프로젝트)의 구현 담당 에이전트다. 이번에는 **배치(연속 작업 목록)**를 위임받아 대규모로 수행한다.

1. 먼저 `AGENTS.md`와 `docs/agents/subagent-handoff.md` §1(공통 컨텍스트)을 전부 읽어라.
2. §3 작업 큐에서 **T<a> → T<b> → T<c>** 를 이 순서대로 하나씩 수행하라. **반드시 순차** — 앞 항목의 보고(상태 갱신+보고서 파일)까지 완료한 뒤 다음 항목에 착수한다. 순서를 바꾸거나 병합하지 마라.
3. 각 항목마다: 시작 시 [진행] 표기 → 구현 → LSP 진단+refresh 빌드 검증 → §4 보고 3종(채팅 요약 / T항목 상태 갱신 / `docs/agents/reports/T<n>-*.md`) 완료. 보고서는 항목당 1개씩 따로 작성한다.
4. 어느 항목이 질문 대기로 막히면(스펙 모호/하드코딩 불가피) 그 항목만 [보류]+질문을 남기고 다음 항목으로 진행하라. 단, 보류 항목에 의존하는 항목은 착수하지 말고 건너뛴 사실을 보고에 명시하라.
5. 배치 도중 새로 발견한 문제는 §3에 신규 T항목으로 추가만 하고 임의 착수하지 마라. Target/Change/Acceptance 밖의 리팩터링 금지.
6. Play 런타임 검증은 네 범위가 아니다 — 항목별로 "런타임 검증 보류(제작자 수행)"로 정확히 보고하라.
7. 배치 종료 시 최종 요약(완료/보류/건너뜀 목록 + 제작자가 Play로 확인할 통합 체크리스트)을 채팅으로 보고하라.
```
