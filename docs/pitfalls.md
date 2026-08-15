# 이 프로젝트의 함정 사전 (Pitfalls)

> **무엇인가**: 이 저장소에서 **실제로 사고를 낸 뒤 실측으로 원인을 규명한** 규칙들이다. 일반적인 MSW 지식으로는 예측되지 않고, 대부분 **에러 없이 조용히 틀린 결과**를 낸다.
>
> **AGENTS.md와의 관계**: [AGENTS.md](../AGENTS.md) §3의 절대 규칙(R1~R8)이 *무엇을 지켜야 하는가*라면, 이 문서는 *왜 그런지와 어떻게 판별하는가*다. 규칙이 겹치는 항목은 AGENTS.md가 요약, 이 문서가 원문이다.
>
> **번호 체계**: 규칙 번호(1~17)는 구 `docs/agents/subagent-handoff.md` §1.2에서 그대로 승계했다. 보고서·기획서 곳곳이 "규칙 11", "규칙 13" 식으로 참조하므로 **번호는 재사용·재배열하지 않는다.** 새 규칙은 18부터 append.

---

## 빠른 색인

| # | 한 줄 요약 | 증상 |
|:--:|---|---|
| [1](#규칙-1-하드코딩-금지-data-driven) | 하드코딩 금지 | (설계 규칙) |
| [2](#규칙-2-편집-허용-경로) | 편집 허용 경로 | (설계 규칙) |
| [3](#규칙-3-좌표는-월드-단위--spawn-parent-nil-금지) | 월드 단위 좌표 / spawn parent | 100× 어긋남 · 런타임 에러 |
| [4](#규칙-4-아이템-식별자는-name-컬럼) | 아이템 식별자 = `Name` 컬럼 | 인벤토리 키 불일치 |
| [5](#규칙-5-런타임-검증-없이-동작함-금지) | 검증 근거 없는 "동작함" 금지 | (보고 규칙) |
| [6](#규칙-6-ui-작업은-미학-루브릭을-통과해야-끝난다) | UI = 미학 루브릭 필수 | 회색 박스 UI |
| [7](#규칙-7-userdatarow에는-rowindex가-없다) | `UserDataRow`에 `RowIndex` 없음 | `LEA-3005`로 서버 루프 통째 중단 |
| [8](#규칙-8-크로스-스크립트-호출-전-정의를-확인한다) | 타 스크립트 호출 전 정의 확인 | 존재하지 않는 API 호출 |
| [9](#규칙-9-세이브-경로에-yield를-추가하지-않는다) | 세이브 경로 Yield 금지 | **인벤토리 전량 유실** |
| [10](#규칙-10-ui-stretch-앵커를-믿지-말고-rectsize를-명시한다) | `.ui` stretch 앵커 미신뢰 | 정체불명 박스 |
| [11](#규칙-11-maker-저장은-워크스페이스-파일을-통째로-재직렬화한다) | Maker 저장 = 전량 재직렬화 | 산출물 조용한 원복 |
| [12](#규칙-12-effectservice--particleservice의-instigator에-nil-금지) | 이펙트 `instigator` nil 금지 | 클라 생성 조용한 실패(serial=0) |
| [13](#규칙-13-modelbuilderread가-빈-모델을-반환하는-갭) | `ModelBuilder.read()` 갭 | "컴포넌트 0개" 오판 → 감사표 오염 |
| [14](#규칙-14-콜라이더-실물--boxsize--transformscale) | 콜라이더 = `BoxSize × Scale` | 판정이 실물보다 작아 통과 |
| [15](#규칙-15-ui-엔티티의-프리팹-타입이-컴포넌트를-강제한다) | `.ui` 프리팹 타입이 컴포넌트 강제 | 지운 컴포넌트 무한 재부착 |
| [16](#규칙-16-map의-jsonstring은-중첩-객체다--문자열-대입-금지) | `.map` `jsonString`은 객체 | `LEA-3015`로 맵 전체 로드 실패 |
| [17](#규칙-17-trigger배치는-스프라이트-실루엣-정합이-1순위다) | Trigger·배치 = 실루엣 정합 우선 | 눈에 보이는 것과 판정이 따로 놈 |
| [18](#규칙-18-조준-셀방향은-단일-규약을-재사용한다--자체-환산-금지) | 조준 셀·방향 규약 재사용 | 상호작용이 엉뚱한 셀을 봄 |
| [19](#규칙-19-투명-프린지-타일은-그-셀-자신의-l1을-드러낸다) | 투명 프린지 = 자기 셀 L1 노출 | 물가에 흙 후광 |
| [20](#규칙-20-물흙-홀이-같은-잔디-셀을-공유하면-서브셀-경합이-난다) | 물·흙 홀 서브셀 경합 → 물 우선 | 물 근처 드러난 흙에서 프린지 꼬임 |
| [21](#규칙-21-l4recttilemap4에는-big-wall만--잔디프린지는-l2) | L4 = Big Wall만 / 잔디·프린지 = L2 | 잔디처럼 보이는데 못 지나감 · L4 이중 덮임 |
| [22](#규칙-22-build-로그는-refresh마다-갱신되지-않는다--타임스탬프를-확인하라) | build 로그는 refresh마다 갱신되지 않음 | 옛 빌드 결과를 새 검증으로 오독 |
| [23](#규칙-23-mlua-메서드-시그니처에-다중-반환을-쓰지-않는다) | mlua `method T1, T2` 금지 | `LEA-3015 CannotLoad` · Sequence contains no elements |
| [24](#규칙-24-입력창-프로퍼티-타입은-textguirendererinputcomponent다--textinputcomponent가-아니다) | 입력창 = `TextGUIRendererInputComponent` | 무엇을 입력해도 "글자수가 안 맞음" |
| [25](#규칙-25-preservespriteaspectonly는-rectsize를-무시하고-짧은-변의-정사각으로-그린다) | `AspectOnly` = 짧은 변 정사각 렌더 | 자식이 프레임 아트 밖 허공에 배치 |
| [26](#규칙-26-로드보다-먼저-저장하면-신규-플레이어-분기가-영영-실행되지-않는다) | 로드 전 저장 = 신규 분기 봉인 | 새 캐릭터가 마을에서 시작 · 영지가 텅 빔 |
| [27](#규칙-27-map에-직접-배치한-가구는-spriteruid와-itemid를-둘-다-줘야-한다) | 맵 배치 가구 = RUID + ItemId 필수 | 포탈이 안 보이고 세이브 복원도 실패 |
| [28](#규칙-28-영지-홈-좌표는-플레이어블-박스-안에-있어야-한다) | 영지 홈 좌표 = 플레이어블 박스 필수 | 영지 밖 좌표로 워프되어 복귀 불가 |
| [29](#규칙-29-아이템-슬롯-아이콘은-simple--none이다) | 아이템 슬롯 아이콘 = Simple + None | 자원 아이콘이 보상칸 밖으로 밀려 나감 |
| [30](#규칙-30-숨길-오버레이는-ui에서-enablefalse로-둔다) | 숨길 오버레이는 `.ui`에서 Enable=false | 부팅 때 팝업이 타이틀보다 먼저 보임 |
| [31](#규칙-31-기본-텍스트-rect와-top-left-pos를-슬롯바에-쓰지-않는다) | 슬롯/바는 칸 크기·왼쪽 여백 | 장착 아이콘·HP바가 팝업 밖으로 나감 |

---

## A. 설계·보고 원칙 (규칙 1~5, 22)

### 규칙 1. 하드코딩 금지 (Data-Driven)

아이템명·수치·모션명 등 데이터성 값에 `if name == "..."` 분기를 쓰지 않는다. 데이터셋(`.csv` + `.userdataset`) 컬럼으로 관리하고 `_DataService:GetTable(...):FindRow(...)`로 조회한다.

불가피해 보이면 **구현 전에 판단을 멈추고 질문**한다. (실례: T95가 `RenderLayers`에 엔티티 이름 문자열 분기를 넣었다가 T97에서 `YSortSprite.IsUnit` 데이터 프로퍼티로 전량 교체.)

### 규칙 2. 편집 허용 경로

편집 허용: `RootDesk/MyDesk/**` · `Global/DefaultPlayer.model` · `Global/WorldConfig.config` · `map/*.map` · `ui/*.ui`(빌더 경유).
절대 수정 금지: `.codeblock` · `.d.mlua` · `Environment/**`.

전체 표는 [AGENTS.md §5 편집 레인](../AGENTS.md)에 있다.

### 규칙 3. 좌표는 월드 단위 / spawn parent nil 금지

좌표는 월드 단위(1 unit = 100px). `_SpawnService:SpawnByModelId(...)`의 `parent`에 `nil`을 넘기지 말고 `self.Entity.CurrentMap`을 쓴다.

### 규칙 4. 아이템 식별자는 `Name` 컬럼

인벤토리 저장 키는 `item_dataset`의 **`Name` 컬럼 값**이다. 소문자 `id`나 표시명과 혼동하지 않는다.

### 규칙 5. 런타임 검증 없이 "동작함" 금지

Play 런타임 검증 없이 "동작함"이라고 적지 않는다. AI 어시스턴트의 검증 범위는 **`refresh` + 빌드 로그까지**이고, 그 이후는 "런타임 검증 보류(제작자 수행)"로 명시한다. 절차는 [workflow.md](./workflow.md) §검증 참조.

> 🔴 **build Error=0은 만능이 아니다** — `maker_logs(kind="build")`는 `.mlua` 빌드만 본다. `.map` JSON 구조 붕괴(규칙 16)나 `.ui` 산출물 원복(규칙 11)은 **Error=0을 그대로 통과**한다.

### 규칙 22. build 로그는 refresh마다 갱신되지 않는다 — 타임스탬프를 확인하라

`maker_refresh_workspace`가 `{"status":"ok"}`를 반환해도 **`maker_logs(kind="build")`가 새 빌드 결과를 준다는 보장이 없다.** 갱신할 것이 없으면 **직전 빌드의 스냅샷을 그대로 재반환**한다.

- **실측 (2026-08-08)**: refresh → build 로그 536건(타임스탬프 `18:02:41~42`). **86분 뒤 refresh를 다시 걸었는데 응답이 224,468자까지 바이트 단위로 동일**했고, 타임스탬프도 여전히 `18:02:41`이었다. 2차 빌드는 로그에 흔적조차 남기지 않았다.
- **`maker_clear_logs`로는 못 지운다.** 이 도구는 설명에 명시된 대로 `normal`(런타임/콘솔) 로그만 지우고 **build 로그는 보존**한다. 즉 에이전트에게는 build 버퍼를 강제로 비울 수단이 없다.
- **그래서 무엇이 위험한가**: 수정 → refresh → "Error=0" 을 보고 통과시켰는데, 그 로그가 **수정 전 빌드의 것**일 수 있다. 반대로 이미 고친 경고가 계속 남아 보여 "회귀했다"고 오진할 수도 있다.

**판별 절차** — 검증 보고에 build 로그를 인용할 때는 반드시:

1. 로그의 **`dateTime`이 이번 refresh 시각과 같은지** 확인한다. 다르면 그 로그는 이번 수정의 결과가 아니다.
2. 어긋나면 Maker를 재시작해 새 빌드를 강제하거나, **"build 로그 갱신 미확인"** 으로 정확히 보고한다. 옛 스냅샷을 근거로 `Error=0`을 적으면 규칙 5 위반이다.

> 유래: T103(`c6c0a3c`, 2026-08-04)이 Prop `LWA-4012` 31건을 청소해 `W48 → W17`로 보고했는데, 이후 나흘간(08-05·08-08) 다른 커밋 3건이 계속 "Warning 48 = baseline 유지"로 기록해 "재발 원인 미규명" 미결 항목이 열렸다. 2026-08-08 별도 머신에서 실측하니 **Warning 17**이고 내역이 문서상 "상시 잔여 17"과 정확히 일치했다 — T103 청소는 실효했다. 나흘간의 48은 **고착된 옛 스냅샷을 반복 인용한 것으로 보인다**(강한 정황이나 원인 확정은 아님 — 그 머신에서 타임스탬프 대조로 확인 필요).

---

## B. 스크립트·런타임 (규칙 7~9, 12)

### 규칙 7. `UserDataRow`에는 `RowIndex`가 없다

`UserDataSet:FindRow()`가 반환하는 `UserDataRow`는 **`Count()`와 `GetItem(columnName)` 두 메서드만** 제공한다.

- `row.RowIndex`는 존재하지 않는 프로퍼티(**nil**)다. 이걸 `GetCell`에 넘기면 `[LEA-3005] InvalidArgument`가 나고 **호출한 서버 루프가 통째로 중단**된다.
- 행 값 조회는 반드시 `row:GetItem("컬럼명")`.
- 존재가 불확실한 컬럼은 **`pcall` 가드** 필수 — 없는 컬럼에 `GetItem`을 쓰면 `LEA-3011`이다(`Furnace.mlua`의 `readDur` 선례).

유래: T35 사고.

### 규칙 8. 크로스 스크립트 호출 전 정의를 확인한다

다른 스크립트의 메서드/프로퍼티를 호출하는 코드를 쓰기 전에, **대상 `.mlua`에서 그 정의를 검색해 존재와 시그니처를 확인**한다.

- 정의가 없으면 추정으로 호출하지 않는다.
- 담당 범위 밖 파일에 정의를 새로 만들어 붙이는 것도 금지 — 멈추고 질문한다.
- "아마 있을 것" 추정 호출이 과거 배치의 치명 런타임 오류 원인이었다(T18).

### 규칙 9. 세이브 경로에 Yield를 추가하지 않는다

`SavePlayerData` 등 영속 저장 루틴 안에서는 **필수 `GetAndWait`/`SetAndWait` 외의 추가 Yield(다른 `GetAndWait`, 타이머 대기 등)를 절대 넣지 않는다.**

- Yield 사이에 플레이어 엔티티가 파괴되면 이후 읽는 컴포넌트 값이 `nil` → 기본값 폴백 → **세이브가 빈 데이터로 덮인다.**
- 저장에 필요한 컴포넌트 값은 **루틴 진입 직후 전부 지역 변수로 선캡처**한다. 외부 조회가 필요하면 세션 캐시를 쓴다.

유래: T37 — **인벤토리 전량 유실 사고**.

### 규칙 12. `_EffectService` / `_ParticleService`의 `instigator`에 nil 금지

`PlayEffect` / `PlayBasicParticle` 등의 `instigator` 인자에 `nil`을 넘기면 **클라이언트에서 생성이 에러 없이 조용히 실패(serial=0)** 한다.

- 서버는 nil을 통과시켜 `serial > 0`을 반환하므로 **"서버 로그만 보면 성공"으로 오진하기 쉽다.**
- 반드시 유효 엔티티(시전자·대상 등)를 넘기고, 재생 직후 **반환 serial을 로그로 남겨 0 여부를 확인**한다.
- `SpawnByModelId`의 parent nil 금지(규칙 3)와 같은 계열의 함정이다.

유래: T71 — T46부터 이어진 "스킬 이펙트가 안 보인다"의 진범.

---

## C. `.ui` (규칙 6, 10, 15)

### 규칙 6. UI 작업은 미학 루브릭을 통과해야 끝난다

`.ui` 파일이나 UI 스크립트를 만지는 **모든** 작업은 착수 전에 `msw-ui-system`의
`references/ui-fundamentals.md`와 `references/layout-recipes.md`, 그리고
[design-policy.md](./design-policy.md)를 읽는다. 기존 화면의 색·패널·간격·폰트 패턴을 재사용하고
화면마다 새 스타일을 만들지 않는다.

- 납품 전 **동 문서 §7 자가 리뷰 루브릭을 실측 좌표 근거로 평가**해 결과를 남긴다. 누락 시 작업 미완료로 본다.
- 기존 게임 UI(인벤토리/HUD/상점)와 **같은 비주얼 아이덴티티를 유지**하고, 화면마다 새 스타일을 발명하지 않는다.
- 레이아웃 작업 시 `references/layout-recipes.md`도 참조.

### 규칙 10. UI stretch 앵커를 믿지 말고 `RectSize`를 명시한다

이 프로젝트 런타임에서 `.ui` 자식의 **stretch 앵커(`AnchorsMin ≠ AnchorsMax`) + Offset 0** 조합은 부모 크기로 늘어나지 않고 **`RectSize` 값 그대로 렌더**된다. (2026-07-14 T48 '정체불명 박스' 실증 — 측정 당시 CoreVersion 26.5.0.0.)

- 신규/수정 `.ui` 자식은 **명시 anchor + `rect_size`** 로 작성한다.
- 부모 크기를 바꾸면 stretch 자식의 `RectSize` 동기화 여부를 반드시 함께 확인한다.

### 규칙 15. `.ui` 엔티티의 프리팹 타입이 컴포넌트를 강제한다

`.ui` 엔티티는 **프리팹 모델 인스턴스**이고, **모델이 정의한 컴포넌트는 인스턴스에서 지워도 Maker가 로드/저장 때 복원**한다(Maker UI: *"모델에서 정의한 컴포넌트라서 제거할 수 없다"*). 따라서 **컴포넌트를 지우는 건 증상 치료이고 무한 재발한다.**

- **사고 실례**: `FurnacePopup`이 `entry_id="UIGroup"` / `modelId="uigroup"` 이었다. 빌더의 `group()`이 심는 타입으로, `UITransform + UIGroupComponent + CanvasGroupComponent`를 함께 정의한다. **T79·T88이 `UIGroupComponent`만 두 번 지웠고 두 번 다 되살아났다.** 형제 팝업 11종은 전부 `uiempty`라 이런 일이 없었다.
- **판정 절차**: `.ui`에서 지운 컴포넌트가 되살아나면 **`b.find(path).jsonString.origin.entry_id` / `.modelId`를 먼저 확인**한다. 루트 UIGroup 외의 엔티티가 `uigroup`이면 그게 원인이다.
- **수정 방법 — 통째로 다시 만들 필요 없다**: 빌더 `_add()`가 `origin.entry_id`와 `modelId`를 덮어쓰므로 **해당 이름으로 `empty()`를 재호출해 타입만 교체**하면 된다. 단 `@components`가 교체되므로 스크립트 컴포넌트는 `addComponent`로 재부착하고, `enable`/`displayOrder`는 creator가 보존하지 않으니 명시·`patch()`로 복원한다. **UUID·자식 엔티티·트랜스폼은 그대로 유지된다**(바인딩 안 깨짐).
- **L029와의 관계**: 재부착된 상태에서는 중첩 `UIGroupComponent`가 린트 L029 **ERROR**라 그 `.ui`에 대한 모든 `UIBuilder.write()`가 throw한다. 방치하면 그 파일의 UI 작업이 계속 막힌다.

유래: T102(근본 수정). 규칙 11로 잘못 분류돼 있던 3·4차 사고의 진짜 원인.

---

## D. Maker · 파일 직렬화 (규칙 11, 13, 16)

### 규칙 11. Maker 저장은 워크스페이스 파일을 통째로 재직렬화한다

Maker 에디터는 저장 시 **에디터 메모리 상태로 워크스페이스 파일을 통째로 재직렬화**한다. 에디터가 구버전 상태(git pull·빌더 편집을 `refresh`로 반영하기 전)를 들고 있으면 **무관한 저장에도 `ui/*.ui`가 구버전으로 덮인다.**

**규칙**
1. `git pull` 또는 빌더로 `.map`/`.model`/`.ui`를 바꾼 뒤에는, Maker에서 **어떤 저장이든 하기 전에 반드시 `refresh` 먼저**.
2. 의도치 않은 `.ui`/`.csv` 변경이 `git status`에 보이면 **덮어쓰기 여부부터 대조**하고 작업을 시작한다.
3. CSV의 BOM 재직렬화는 무해하다(클린 필터 처리).

🔴 **"재직렬화 diff는 무해"를 오용하지 말 것 (2026-07-25 3차 사고)**

`maker_refresh_workspace` 직후 `ui/PopupGroup.ui`가 전량 재직렬화(+16,685 −16,683)되면서 T79의 L029 수정이 원복됐다. **엔티티 수는 341로 동일했다.**

- 2026-07-16의 "무해" 판정은 전제가 **"내용이 전수 실존"** 이다. 산출물이 하나라도 사라졌으면 그 판정은 적용되지 않는다.
- **필수 절차**: 재직렬화 diff를 봤을 때 무해 판정 전에 반드시 **"그 커밋이 만든 핵심 산출물이 지금도 실존하는가"를 빌더로 1건씩 대조**한다. **엔티티 수 일치는 근거가 아니다.**
- **`refresh` 호출 자체가 Maker의 스테일 상태를 디스크로 밀어낼 수 있다** — 빌더로 파일을 바꾼 세션에서는 refresh 전후로 `git status`를 확인한다.

> ⚠️ 3·4차 사고는 사후에 **규칙 15**(프리팹 타입)가 진짜 원인으로 재분류됐다. `.ui` 컴포넌트가 되살아나는 증상은 규칙 15부터 의심할 것.

### 규칙 13. `ModelBuilder.read()`가 빈 모델을 반환하는 갭

모델 본체(`Components`/`Values`)가 **셸 한 단계 안쪽**에 들어 있는 형식이 있다. `EntryKey`/`Id`가 `maplestorymapobject$...` 형태(메이플 네이티브 맵오브젝트 임포트)면 여기 해당한다.

이때 `ModelBuilder.read()`는 **에러 없이 `0 components, 0 values`** 를 반환한다 — 실제로는 `TriggerComponent`·`ResourceOccupiedArea`가 멀쩡히 들어 있는데도.

- UUID형 `model_id` + `base_model_id`가 있는 모델(예: `Big Stone1`)은 **정상 파싱**된다. "빌더가 되니까 다 된다"고 믿으면 안 된다.
- **판정 절차**: `.model` 구성 감사 시 `listComponents()`가 빈 배열이면 "컴포넌트 없음"으로 결론내지 말고 **갭을 먼저 의심**한다. 확인은 `snapshot().model_id`가 `$`를 포함하는지 보면 된다.
- 갭에 걸린 모델은 `Components` 배열을 가진 **가장 안쪽 노드**를 본체로 삼아 읽는다(진단용 읽기 전용 우회는 허용 — 쓰기는 여전히 빌더로).

**사고 실례**: 이 갭 때문에 T96의 실측표가 틀렸다 — 자원 `Tree1`·`Tree2`·`Stone`·`IronNodeResource`를 "Trigger 미보유"로 기재했으나 **4종 모두 보유**였다. 그 표를 근거로 만든 T100의 작업 범위도 함께 틀어졌고, T101의 1차 영향범위 집계까지 연쇄 오염됐다.

### 규칙 16. `.map`의 `jsonString`은 중첩 객체다 — 문자열 대입 금지

Maker/엔진은 `ContentProto.Entities[].jsonString`을 **`Newtonsoft.Json.Linq.JObject`** 로 역직렬화한다.

스크립트가 `slot.e.jsonString = JSON.stringify(slot.js)`처럼 **JSON 문자열을 대입**하면 파일이 짧아지며(중첩이 한 줄로 붕괴), 로드 시 `[LEA-3015] Invalid cast from 'System.String' to 'JObject'`로 **맵이 통째로 실패**한다.

- 🔴 `maker_logs(kind="build")`는 `.mlua` 빌드만 보므로 **이 구조 붕괴를 Error=0으로 통과시킨다.** refresh 통과 ≠ `.map` 로드 가능.
- **대입은 항상 객체로**: `slot.e.jsonString = slot.js`.
- **판정**: 쓰기 전후로 전 엔티티에 대해 `typeof e.jsonString === "object"`를 확인한다. 줄 수가 급감한 커밋은 타일 diff만이 아니라 **직렬화 형태**를 먼저 의심한다.
- 이미 붕괴된 파일은 `JSON.parse`로 객체 복원 후 `JSON.stringify(mapRoot, null, 2)`로 저장.

**사고 실례**: T98의 `scripts/fix_water_fringe.cjs`가 `RectTileMap2`의 `jsonString`을 문자열로 저장 → `map01`이 69,231→41,805줄로 붕괴 · Play/로드 `LEA-3015`. 미푸시 상태에서 `d7b9479`로 복구. **스크립트가 범용이라 방치하면 `town`/`template_*` 재실행으로 동일 파괴가 난다.**

---

## E. 모델·콜라이더·배치 (규칙 14, 17)

### 규칙 14. 콜라이더 실물 = `BoxSize × Transform.Scale`

엔진이 쓰는 실제 충돌/트리거 박스는 모델의 `BoxSize`·`ColliderOffset`에 **`Transform.Scale`이 곱해진 값**이다.

- 코드에서 박스로 기하 계산을 할 때 Scale을 빼먹으면 `Scale ≠ 1` 모델에서 **판정이 실물보다 작아져 그대로 통과**한다.
- `TransformComponent`에 `WorldScale`은 **없다**(`.d.mlua` 확인). 로컬 `Scale`이 유일한 소스이며, 맵 직속 엔티티는 이것이 곧 월드 스케일이다.
- ⚠️ **Maker에서 박스를 키워도 실물이 같이 커지므로 에디터 조정으로는 절대 상쇄되지 않는다.** 증상이 보이면 모델값이 아니라 **코드의 Scale 반영 여부**를 먼저 본다.

**사고 실례**: `ObstacleQuery.GetColliderAABB` / `RenderLayers.ComputeYOrderForEntity`가 Scale 미반영 → `Big Stone1`(Scale 2) 판정 박스 1/2, `Tree1`(Scale 1.5) 판정 박스 2/3 → 제작자 Play "조정했는데도 통과" (T101에서 수정).

### 규칙 17. Trigger·배치는 스프라이트 실루엣 정합이 1순위다

`TriggerComponent.BoxSize`/`ColliderOffset`과 맵 배치는 **Maker에서 보이는 스프라이트와 맞아야** 한다. 기획서 목표 폭·종횡비 추정·"중심 피벗 가정"·정수 그리드만으로 확정하면 **눈에 보이는 영역과 동떨어진 박스/좌표**가 나온다.

**refresh Error=0 · 조준 판정 일치 · 본셀 가둠은 시각 정합을 대체하지 않는다.**

**산정 규칙**
1. `BoxSize`/`ColliderOffset`은 **로컬(Scale 적용 전)** 단위다. 월드 크기를 Box에 넣지 말 것 — 실물 월드 크기 = `BoxSize × Transform.Scale`(규칙 14).
2. 피벗은 **추정 금지** — Maker 오버레이로 발밑/실루엣에 맞춘다. 중심 피벗 가정 금지.
3. 차단·F조준·페이드·Y정렬이 **한 Trigger를 공유**하므로, 조준이나 지붕 통과 때문에 박스를 깎으면 **"시각 불일치 허용 사유"** 를 남기거나 제작자 확인을 받는다. 완료 기준에 "실루엣 정합"이 없으면 임의로 눈을 희생하지 않는다.
4. 신규/재조정 완료 기준에 **Maker 육안(또는 Play) 실루엣 대조**를 넣는다. MCP 미연결·Play 보류만으로 "박스 완료" 보고 금지.
5. 배치 좌표도 스크립트 그리드만으로 끝내지 말고, 주변 건물·길과의 여백을 에디터/Play로 확인한다.

**사고 실례**: T81이 `artwork-spec` 목표 폭×종횡비로 Box를 산정하고 "`GetColliderAABB`가 Scale을 무시한다"고 오해해 **월드 시각 크기를 `BoxSize`에 기입**한 채 `Transform.Scale`(Shop ×2 등)은 그대로 뒀다 → 실물(규칙 14)과 스프라이트가 구조적으로 어긋남. T75 소품도 RUID + 그리드 좌표 + 고정 오프셋으로 배치해 제작자가 **전량 철회·재조정**했다.

---

## F. 판정 규약 · 레이어 합성 (규칙 18~19)

### 규칙 18. 조준 셀·방향은 단일 규약을 재사용한다 — 자체 환산 금지

조준 대상 셀은 **`tilemap:ToCellPosition(worldPos)` + `LastDirectionX` / `LastDirectionY`** 한 가지 방법으로만 구한다. 같은 판정을 재구현하면 조준선(T67·T82)과 조용히 어긋난다.

- ⛔ `math.floor(worldPos.x)` 로 셀을 직접 계산하지 말 것. RectTileMap의 원점은 그리드 설정에 따라 ½셀 오프셋을 가질 수 있어 `ToCellPosition`과 일치한다는 보장이 없다.
- ⛔ `self.LastDirection`(문자열) 같은 **선언되지 않은 프로퍼티를 읽지 말 것.** 미선언 필드 읽기는 에러 없이 **nil**이라, 방향 분기가 전부 실패하고 기본값 한 방향으로 고정된다. 선언된 것은 `LastDirectionX` / `LastDirectionY`(정수) **둘뿐**이다.
  - 판별: 새 프로퍼티를 쓰기 전 같은 파일에서 `property .*<이름>` 을 Grep으로 확인한다. 빌드 로그에는 `LIA-1114` Info로만 흘러가 놓치기 쉽다.

**사고 실례 (2026-08-06)**: `PlayerController.IsAimTileWater()` 가 `math.floor` 자체 환산 + 미선언 `self.LastDirection` 을 썼다. 방향 분기가 전부 nil 비교라 **항상 "아래쪽 셀"만 검사** → 물 옆에 서서 물을 바라봐도 낚시가 시작되지 않았다. refresh Error=0을 그대로 통과했다.

### 규칙 19. 투명 프린지 타일은 "그 셀 자신의 L1"을 드러낸다

`Grass{dir}` 계열 L2 타일의 흙 쪽은 **그림이 아니라 alpha=0 투명**이다(실측: `GrassD.png` 하단 59.7% 투명). 즉 프린지가 보여 주는 바닥은 **그 타일이 놓인 셀의 L1**이지, 옆 셀의 L1이 아니다.

- L1이 전면 `Soil`인 지형(광장·길)에서는 이 차이가 드러나지 않는다 — 어느 셀을 뚫든 똑같이 흙이다.
- **L1에 두 종류 이상이 섞이면(예: `Water`) 즉시 어긋난다.** 물 셀 둘레의 잔디 셀에 프린지를 켜면, 뚫리는 것은 그 잔디 셀의 L1 = `Soil` → **연못 둘레에 흙 후광**이 생긴다.
- **규칙**: 프린지는 **드러내려는 L1을 가진 셀 위에** 놓는다. 물가라면 프린지를 물 셀 안쪽으로 넣어 잔디가 물을 ½셀 덮게 한다 → 문법은 [tile-scheme.md §7](./tile-scheme.md).

**사고 실례**: T98이 광장/밭 문법(홀 + 이웃 ½셀 마진)을 물에 그대로 차용해 흙 후광이 생겼다. 2026-08-06 `fix_water_fringe.cjs` 규칙 반전으로 해소.

### 규칙 20. 물·흙 홀이 같은 잔디 셀을 공유하면 서브셀 경합이 난다

물가 오버행(§4-bis)과 흙 홀 프린지(문법 2)는 **같은 ½셀 비트 공간**을 쓴다. 잔디 셀이 물과 흙 홀에 동시에 이웃하면 한 서브셀을 양쪽이 주장한다.

- ⛔ `(base & ~waterBits) | otherBits` (흙 나중) — 흙이 이겨 **물에 붙은 흙 조각**이 남는다. 캡처상 "프린지 꼬임".
- ✅ `(base | otherBits) & ~waterBits` (물 나중·물 우선) — 경합 서브셀은 잔디로 남아 물과 흙을 가른다.
- 런타임 `ResourceSpawner:RefreshWaterAreaRect` 와 오프라인 `fix_water_fringe.cjs` **양쪽을 같이** 고친다. 한쪽만 고치면 맵 로드 보정과 물삽 결과가 어긋난다.
- 물과 무관한 셀(`waterBits == 0`)은 손대지 않는다 — digPath/digHole 회귀 방지.

**사고 실례 (2026-08-07)**: 물삽으로 드러난 흙(광장/길 홀) 옆에 물을 파면 삼중 코너에서 프린지가 꼬였다. 시뮬레이션 6305조합에서 구식 공식은 5712건 꼬임, 물 우선은 0건.

### 규칙 21. L4(`RectTileMap4`)에는 Big Wall만 — 잔디·프린지는 L2

L4는 경계 충돌 밴드(`Big Wall`) 전용이다. 잔디·프린지 문법은 **L2만** ([tile-scheme.md](./tile-scheme.md) §1).

- L4에 `FullGrass`/`Grass*`가 쌓이면 (1) L2보다 위 SortingLayer라 **잔디가 이중으로 덮여 보이고** (2) 구 `ObstacleQuery.IsWallAt`은 L4에 타일만 있으면 전부 벽으로 오판 → **잔디처럼 보이는데 못 지나감**.
- ✅ 벽 판정 = 타일명 `"Big Wall"`만. ✅ 맵 로드·물 편집·임시 G에서 L4 비-BigWall scrub. ✅ 지형 페인팅/프린지 보정은 L1/L2만.

**사고 실례 (2026-08-07)**: `map01` L4에 잔디/프린지 23칸 오적재. 물가처럼 보이는 셀에서 통행 불가 + G로 L2만 고쳐도 L4 잔재 때문에 막힘.

### 규칙 23. mlua 메서드 시그니처에 다중 반환을 쓰지 않는다

`method integer, table Foo(...)` / `method integer, integer Bar(...)` 처럼 **반환 타입을 콤마로 나열하면** 파서가 파일을 통째로 거부한다.

- 증상: `[LEA-3015] CannotLoad` · `Sequence contains no elements` · 해당 `.mlua` 로드 실패
- ✅ 반환은 단일 타입만. 여러 값이 필요하면 `table`/`any`로 `{ a=..., b=... }`를 돌린다
- ✅ 커스텀 script 타입을 반환 타입에 적지 말고 `any`를 쓴다 (`method UIDialogController X()`도 위험)
- 선례: `PlayerController` AimFootprint 주석 · **2026-08-08 `VillagerDialog.FindOfferQuest`**

### 규칙 24. 입력창 프로퍼티 타입은 `TextGUIRendererInputComponent`다 — `TextInputComponent`가 아니다

MSW에는 **이름이 비슷한 별개 컴포넌트가 둘** 있고, `UIBuilder.textInput()`이 만드는 것은 **`TextGUIRendererInputComponent`** 다.

- `.mlua`에서 `property TextInputComponent x = "<uuid>"` 로 선언하면 엔진이 `MODComponentRef("{uuid}:TextInputComponent")` 로 해석 → 그 엔티티엔 해당 타입이 없어 **바인딩이 조용히 nil**이 된다.
- 증상이 "입력값이 안 읽힌다"로 안 나오고 **후속 검증 실패 메시지**로 나온다. `isvalid(input)` 가드가 있으면 `raw=""` → 길이 0 → *"닉네임은 2~15글자로 입력하세요"* 가 무엇을 입력해도 뜬다. 빌드 Error=0, LSP 경고도 0.
- ✅ 선언 전 `.ui`에서 실제 컴포넌트 타입을 확인한다: `UIBuilder.read(...).getComponent(path, "MOD.Core.TextGUIRendererInputComponent")`
- ✅ `OnBeginPlay`에서 `log(... isvalid(self.input) ...)` 로 바인딩 성패를 남긴다 — 이 부류는 로그가 없으면 원인 추적이 불가능하다.
- 이 함정은 입력창에 국한되지 않는다. **모든 컴포넌트형 프로퍼티**는 uuid만 맞추면 되는 게 아니라 **타입까지** 맞아야 한다.

**사고 실례 (2026-08-10)**: `UIMainMenuController`의 `customNameInput`/`nameInput` 2개가 `TextInputComponent`로 선언돼 있어, 새 캐릭터 생성 시 닉네임을 무엇으로 넣어도 글자수 오류로 거부됐다. 슬롯 삭제 확인(닉네임 재입력)도 같은 이유로 항상 불일치 처리됐다.

### 규칙 25. `PreserveSprite=AspectOnly`는 RectSize를 무시하고 "짧은 변의 정사각"으로 그린다

`SpriteGUIRendererComponent.PreserveSprite = AspectOnly(1)` 은 원본 비율을 지킨다 → **정사각(1024×1024) 아트에 `RectSize 1700×820`을 줘도 실제로는 820×820만 그려진다.** 나머지 880px은 투명 여백이다.

- 레이아웃을 `RectSize` 기준으로 잡으면 자식들이 **아트 바깥 허공에 배치**된다. 에러 없음, 빌드 Error=0, `ui_lint`도 캔버스 안이면 통과.
- ✅ 아트의 **원본 픽셀 치수와 내부 여백을 먼저 실측**하고(예: 책 외곽 x 55~975 / 페이지 안쪽 x 120~905 / 제본선 x 490~570), 그 비율을 RectSize에 곱해 "실사용 가능 영역"을 계산한 뒤 자식 좌표를 잡는다.
- ✅ 넓은 영역이 필요한데 아트가 정사각이면 **아트를 늘리지(=`None`으로 바꾸지) 말고 레이아웃을 아트에 맞춘다.** 픽셀아트는 비균등 스케일에서 바로 티가 난다.
- ✅ 프레임을 진짜 늘려야 하면 `Type=Sliced(1)` + 에셋 쪽 9-slice 보더(`asset_update_resource_storage_info`)를 먼저 세팅한다. 단, 중앙에 세로 장식(제본선 등)이 있으면 9-slice로도 뭉개진다.

**사고 실례 (2026-08-10)**: `MainMenuGroup.ui`의 수첩 프레임(1024² 아트)에 1700×820을 줘 슬롯 카드 5장(총 폭 1330)이 실제 그려지는 820폭 밖으로 전부 튀어나가 있었다. 정사각 페이지에 맞춰 "세로 카드 5장 → 가로 행 5줄"로 재배치해 해소.

### 규칙 26. 로드보다 먼저 저장하면 "신규 플레이어" 분기가 영영 실행되지 않는다

`Save → Load` 순서로 부트스트랩하면, 로드 시점에 세이브가 **이미 존재**하므로 로드 루틴의 *"세이브 없음 = 신규"* 분기가 죽는다. 기본값 주입이 통째로 건너뛰어진다.

- 더 나쁜 건 **저장이 그 순간의 런타임 상태를 그대로 박제한다**는 점이다. 캐릭터 생성 직후 플레이어는 아직 **시작맵(마을)** 에 서 있으므로 `lastMapKind="town"`, `homeFurniture="[]"` 가 저장되고, 이어지는 로드가 그 값을 그대로 신뢰한다.
- 증상은 "저장이 잘못됐다"로 안 보이고 **"새 캐릭터가 마을에서 시작한다" / "영지가 텅 비어 있다"** 로 나타난다. 에러 0, 빌드 0.
- ✅ 부트스트랩 순서는 **기본값 주입 → 로드 → 저장**. 순서를 못 바꾸면 (a) 저장 전에 기본 상태를 런타임 캐시에 먼저 심고, (b) "아직 목적지로 못 간 부팅 구간"임을 표식(`PendingHomeWarp` 등)으로 남겨 저장·로드가 실제 위치 대신 의도된 위치를 쓰게 한다.
- ✅ 저장 루틴이 `player.CurrentMap` 같은 **현재 런타임 상태**를 읽는다면, "그 상태가 아직 의도된 값이 아닌 구간"이 언제인지 반드시 따져본다.

**사고 실례 (2026-08-10)**: `PersistenceManager.SelectSaveSlot`이 `SavePlayerData` → `LoadPlayerData` 순서라 새 캐릭터가 영지 대신 마을에서 시작하고, 영지 기본 설치물이 하나도 생기지 않았다.

### 규칙 27. `.map`에 직접 배치한 가구는 `SpriteRUID`와 `ItemId`를 둘 다 줘야 한다

모델(`Furniture_*.model`)로 스폰하면 값이 다 들어있지만, **맵에 손으로 배치한 엔티티는 컴포넌트만 붙어 있고 값은 비어 있을 수 있다.** 두 값이 각각 다른 방식으로 조용히 실패한다.

| 빠진 값 | 결과 |
|---|---|
| `SpriteRendererComponent.SpriteRUID` | **화면에 안 보인다** (8대 핵심 규칙 3). 트리거는 살아 있어서 "보이지 않는데 F는 먹는" 상태가 된다 |
| `script.PlaceableFurniture.ItemId` | 세이브 델타의 `itemName`이 **엔티티 이름**으로 기록된다 → 복원 시 `Furniture_<엔티티이름>` 모델 조회 실패 → **다음 접속부터 아예 안 생긴다** |

- ✅ 맵에 배치한 가구는 `MapBuilder.component(name, "script.PlaceableFurniture")`로 `ItemId`가 실제 `item_dataset.Name`과 일치하는지, `SpriteRendererComponent`에 `SpriteRUID`가 있는지 확인한다.
- ✅ 애초에 **맵에 직접 배치하지 말고 모델을 스폰**하는 편이 안전하다. 맵 배치본은 위 두 값이 빠져도 Maker에서는 (기즈모로) 보이므로 작성 시점에 눈치채기 어렵다.
- ✅ 이미 잘못 기록된 세이브가 있으면 로드 경로에 `itemName` 정규화 보정을 넣는다.

**사고 실례 (2026-08-10)**: `map01`의 `TownPortal`이 `SpriteRUID` 없음 + `ItemId` 공란이라, 영지에 복제되긴 했지만 **보이지 않았고** 세이브 복원 경로에서도 `Furniture_TownPortal`을 못 찾아 생성되지 않았다. 엔티티를 삭제하고 `Furniture_Portal` 모델 스폰으로 일원화해 해소.

### 규칙 28. 영지 홈 좌표는 플레이어블 박스 안에 있어야 한다

영지(`Home_*`)의 플레이어블 영역은 `ResourceSpawner.MapRadius`/`WallThickness`가 정한다. 기본값 30/3 → `|x|<28` and `|y|<28`, 즉 **X/Y -27~27**. 이 박스 밖의 좌표를 세이브하거나 워프 타깃으로 쓰면, 플레이어가 **경계 벽 너머**에 떨어져 영지로 걸어 들어올 수 없다. 에러 0, 빌드 0.

- 개발 중 출시·테스트로 `MapRadius`가 줄어들기 전 좌표, 벽 너머 클리핑, 오염된 `posX`/`posY`가 그대로 로드되면 재현된다.
- `FindSafeSpawnPosition`은 원래 **가구 점유만** 본다. 박스 밖 빈 셀을 "안전"으로 통과시킨다.
- ✅ 홈 좌표의 단일 가드는 `ResourceSpawner:ClampHomeWorldPosition` / `IsInsidePlayable`. 로드·세이브·홈 워프·맵 진입이 모두 여기를 거친다. 박스 밖이면 기본 스폰 `(-3, 0)`.
- ✅ 세이브 경로에 박스 밖 좌표를 쓰지 않는다. 한 번 박제되면 다음 접속마다 벽 밖으로 워프된다.
- ✅ 박스 수치를 `-27`/`27`로 하드코딩하지 말고 `MapRadius`/`WallThickness`를 따른다.

**사고 실례 (2026-08-13)**: 개발 중 출시 테스트 플레이 세이브의 캐릭터 좌표가 영지 밖이라, 접속 시 영지로 제대로 돌아오지 못했다.

### 규칙 29. 아이템 슬롯 아이콘은 Simple + None이다

인벤토리 `ItemSlot/Icon`은 `ImageType=Simple(0)` + `PreserveSprite=None(0)` + `pos (0, 0)` 이다. 같은 아이콘을 퀘스트 보상칸에 `Sliced` + `AspectOnly` + `y=+8` 로 두면 **하단 피벗 드롭 스프라이트**(나무 `(0,-5)`, 돌 `(-6,-5)`)가 칸 밖으로 밀려 나간다. `thumbnail://` 도구 아이콘은 엔진이 정사각·중심 피벗으로 다시 그리므로 같은 칸에서도 가운데에 앉는다.

- ✅ 아이템 슬롯 아이콘은 인벤토리와 동일하게 **Simple + None + 슬롯 중앙**으로 맞춘다.
- ✅ `sprite()` 기본값 `sprite_type=1`(Sliced)을 아이콘에 그대로 쓰지 않는다.
- ❌ 아이템 이름 분기로 좌표를 보정하지 않는다. 피벗은 에셋 쪽 값이다.

**사고 실례 (2026-08-15)**: 퀘스트 보상칸에서 주먹도끼는 가운데, 나무·돌은 칸을 벗어남. 보상 `Icon`만 AspectOnly+Sliced+y=8.

### 규칙 30. 숨길 오버레이는 `.ui`에서 Enable=false로 둔다

`OnBeginPlay`에서 `Enable=false`를 해도 **그 전 프레임은 `.ui` 값이 그대로 그려진다.** F9 프리뷰·낚시 게이지처럼 평소 꺼 둘 창을 Enable=true로 저장하면, 메인메뉴 `DefaultShow=false`인 동안 HUD/프리뷰가 타이틀보다 먼저 보인다.

- ✅ 평소 숨길 창은 `.ui`에서 `enable=false`. 토글용 컨트롤러는 그 부모 밖에 둔다.
- ✅ 타이틀 그룹은 `DefaultShow=true`로 두고, 부팅 `OnBeginPlay`에서 루트를 끄지 않는다.
- ❌ `DefaultShow=false`로 타이틀을 숨긴 채 서버 RPC를 기다리지 않는다.

**사고 실례 (2026-08-15)**: `PreviewTool/Root` Enable=true + `MainMenuGroup.DefaultShow=false` → 첫 실행에 F9 프리뷰가 타이틀보다 먼저 노출.

### 규칙 31. 기본 텍스트 Rect와 top-left pos를 슬롯/바에 쓰지 않는다

`text()` 기본 박스 **400×48**을 장착칸 `Icon`에 남기면, 런타임 `ImageRUID`가 그 사각형을 그대로 채워 **칸과 팝업 밖으로** 나간다. `top-left`(pivot `(0,1)`)에서 `pos.x`에 패널 반폭을 넣으면 가운데가 아니라 **바의 왼쪽 끝이 중앙**에 붙어 오른쪽으로 밀린다.

- ✅ 슬롯 아이콘 RectSize는 칸보다 작거나 같게 (인벤 `ItemSlot/Icon` 48×48).
- ✅ 같은 패널의 Name처럼 왼쪽 여백 `pos.x=20`을 바에 재사용한다.
- ❌ 기본 텍스트 박스(400×48)를 아이콘·게이지 라벨에 그대로 두지 않는다.

**사고 실례 (2026-08-15)**: 캐릭터 정보. 무기 `Icon` 400×48 + HP/SP/XP `pos.x=180`(패널 360의 반) + 권한 버튼 `pos.x=180`(top-center) → 창 밖으로 돌출.

---

## 관련 문서

- 절대 규칙 요약: [AGENTS.md](../AGENTS.md) §3
- 작업 절차·검증 체인: [workflow.md](./workflow.md)
- 타일 스킴 단일 소스: [tile-scheme.md](./tile-scheme.md)
- 상시 디자인 정책: [design-policy.md](./design-policy.md)
- 리소스 검색 API 함정: [reference/resource-api-pitfalls.md](./reference/resource-api-pitfalls.md)
- 사고별 원본 기록: [agents/reports/](./agents/reports/) (T번호별 보고서)
