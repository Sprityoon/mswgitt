# 리소스 검색 API 함정 (실측 기록)

> **왜 여기 있나**: `msw-search`는 [skills-lock.json](../../skills-lock.json) 등재 **벤더 스킬이라 수정 금지**다.
> 아래는 이 저장소에서 실측으로 확인한 함정이므로 프로젝트 문서 쪽에 남긴다.
> 최초 작성: 2026-08-05.

---

## 1. 🔴 `/v3/resources/tags/{ruid}` 는 avataritem에서 **완전히 깨져 있다**

`msw_resource_api.cjs tags <ruid>` (= `getResourceTags`) 를 아바타 아이템 RUID로 호출하면
**전혀 다른 아이템의 태그 레코드가 반환된다.** 4개 표본 전부 오답이었다.

| 조회한 RUID | 실제 아이템 (`get` 응답) | `tags` 가 반환한 것 |
|---|---|---|
| `e490c7f7648946e2828647df0ce9b1a9` | 자쿰의 돌주먹 (`glove-405`) | Dark Cygnus's Hairband (`cap-3375`) |
| `384de1d5a70747a4b356484cf2753b5f` | 빨간 벽돌 (`onehandedweapon-579`) | 메이플 이올렛 클레이모어 (`twohandedweapon-860`) |
| `5b0af54d1fd0489198f8c31183d130fa` | 손 도끼 (`onehandedweapon-747`) | Solaria Face (`face-10173`) |
| `e9bbbc9357554781b860c9f869b462e3` | 아이언 너클 (`glove-426`) | 초록색 양순이 헤어 (`hair-168`) |

레코드 **내부도 모순**이다 — 두 번째 표본은 `displayName`이 양손무기인데 `category`는 `Ring`이었다.
일정한 오프셋도 아니라(카테고리 자체가 제각각) 보정으로 살릴 수 없다.

**규칙**
- **avataritem에는 `tags` 를 쓰지 않는다.** 이름·카테고리·색은 `get`(= `/v3/resources/{ruid}`) 응답만 신뢰한다.
- 응답에 섞여 오는 `path` (`character/cap/01003403.img`) / `itemname` (`itemname#1003403`) 은
  메이플스토리 원본 아이템 ID처럼 보이지만 **다른 아이템의 것**이다.
  → RUID → 메이플 아이템 ID → 외부 렌더러(maplestory.io 등) 경로는 **막혀 있다.**
- sprite / animationclip / resource_pack에서도 같은 증상이 있는지는 미검증. 쓰기 전 이름 일치를 확인할 것.

## 2. avataritem에는 **썸네일 URL이 없다**

`payload`에 `color_hex` / `group_*` 만 있고 `payload.thumbnail`이 없다
(sprite · animationclip · resource_pack 에는 있다).

### 2-bis. 🔴 `get` 응답의 `payload` 가 통째로 `null` 이다 (실측 2026-08-06)

`msw_resource_api.cjs get 5803e765…`(삼각 강철 야삽) 응답:

```json
{ "id": "5803e765…", "type": "avataritem", "category": "weapon",
  "names": { "ko": ["삼각 강철 야삽"] }, "dname": "onehandedweapon-729",
  "assetGuid": null, "hasEmbedding": true, "payload": null }
```

즉 **쓸 수 있는 건 `names` / `category` / `dname` 뿐**이다. 특히:

- **그 아이템이 어떤 액션 ID(`swingO1`/`swingO2`/`swingO3`/`stabO1`/`stabO2`)를 가지고 있는지 알 방법이 없다.** 없는 액션을 지정하면 무기 파츠 프레임이 없어 **모션 중 도구만 사라진다**(`MineState.mlua` 주석 — 과거 곡괭이 `swingT1` 사고).
- 따라서 **액션 후보 선별은 코드로 사전 필터링이 불가능**하고, [ui/PreviewTool.ui](../../ui/PreviewTool.ui)(F9)에 같은 RUID + 서로 다른 액션을 슬롯별로 걸어 **「모션 재생」으로 눈으로 걸러내는 것이 유일한 방법**이다. 사라지는 슬롯 = 그 아이템에 없는 액션.

→ **아바타 아이템의 생김새를 외부에서 확인할 방법이 없다.** 유일한 렌더러는 MSW 엔진이다:
- UI: `SpriteGUIRendererComponent.ImageRUID = DataRef("thumbnail://" .. ruid)`
- 월드: `SpriteRendererComponent.SpriteRUID = "thumbnail://" .. ruid`

접두어 없이 넣으면 **에러 없이 안 보인다.** 이 프로젝트의 확인 수단은
[ui/PreviewTool.ui](../../ui/PreviewTool.ui) + [UIPreviewToolController.mlua](../../RootDesk/MyDesk/DevTools/UIPreviewToolController.mlua) (F9).

## 3. 의미 검색은 **이름 임베딩에 끌린다** — 형태가 아니라

`돌멩이 바위 원석 돌덩이` / `--category weapon` 의 1위가 **"돌의 정령 응원봉"**(치어스틱)이었다.
이름에 '돌'이 있어서지 형태는 무관하다.

→ 형태가 중요한 검색은 상위 N개를 그대로 믿지 말고, 반드시 프리뷰로 눈으로 확인한다.
→ 질의를 형태 어휘(`자루 없는`, `주먹에 쥔`)로 바꿔도 개선폭이 작다. 카테고리 필터로 좁히고 훑는 편이 낫다.

## 3-bis. `findSimilarResources` 는 아바타 아이템에서 **색으로 묶인다** (형태 아님)

`similar 384de1d5...`(빨간 벽돌) 상위 25개가 사실상 **"빨간 물건 모음"** 이었다 —
빨간색 권투 글러브 · 파이어 잭 · 레드 모울 · 빨강 우산 · 붉은 채찍 · 빨간색 야구 헬멧 ·
빨간색 별 두건 · 빨간색 서핑보드 · 빨간색 더벅 머리 · 복고풍 레드 백팩 · 빨강색 카우보이 모자.
카테고리도 weapon/glove/cap/cape/hair로 흩어진다.

→ **"이것과 비슷하게 생긴 걸 찾아줘"에 쓸 수 없다.** `payload.color_hex` 기반 군집에 가깝다.
형태로 찾아야 하면 이름 검색(한/영 양쪽) + 프리뷰 육안 확인이 현재 유일한 방법이다.
(부수 효과: 색이 같은 다른 슬롯 아이템을 찾을 때는 오히려 유용하다.)

## 4. 아바타 아이템은 **신규 제작이 불가능하다**

`CostumeManagerComponent.Custom*Equip` 은 플랫폼 카탈로그의 `avataritem` RUID만 받는다.
에셋 업로드(`asset_create_*`)로 만들어지는 건 `sprite` 타입이라 이 슬롯에 들어가지 않는다.
→ "원하는 장비 모양이 카탈로그에 없으면 그려서 넣는다"는 **불가**. 카탈로그에서 고르거나, 아바타 슬롯을 포기하고
별도 엔티티로 렌더해야 한다(단, 휘두르는 모션에서 손을 따라가지 못한다).

## 5-bis. 인게임 아바타 프리뷰 구성 — **실측 확인됨 (2026-08-05 Play)**

문서에 명시가 없어 가정이었던 부분이 런타임 로그로 확인됐다. 아래 구성은 **동작한다**:

- **UI 엔티티 하나에 `AvatarGUIRendererComponent` + `CostumeManagerComponent`를 같이 붙이면**
  렌더러가 같은 엔티티의 코스튬을 소스로 읽는다.
  → `ApplyAvatarMode equipped 5 slot(s)` × 5회, `isvalid(costume)` 실패 경고 0건.
- **UI는 client-only인데도 `CostumeManagerComponent`의 `@Sync` 프로퍼티가 문제를 일으키지 않는다.**
  클라이언트에서 `SetEquip` → 로컬 렌더로 정상 표시. `is client only` 경고 **0건**, `LEA`/`LWA` **0건**.
- **`AvatarGUIRendererComponent:GetBodyEntity()` 에 `ActionStateChangedEvent`를 보내면 UI 안에서도 모션이 재생된다.**
  → `PlaySwing dispatched to 5 avatar(s)` × 3회. 월드 아바타 전용 기법이 아니다.

## 5-quater. 🔴 `SetAvatarPartColor` 는 **에러 없이 아무 효과도 없다** (실측 2026-08-05)

`AvatarGUIRendererComponent:SetAvatarPartColor(MapleAvatarItemCategory.OneHandedWeapon, r,g,b,a)` 로
무기 파츠만 회색·청회색·갈색으로 틴트하는 실험을 했다. **호출은 정상 실행됐다** —
`ApplyTints applied 4 tint(s)` 로그 2회(즉시 1 + 지연 0.5초 1), `LEA`/`LWA` **0건**.
그런데 **화면에는 아무 변화가 없었다.**

→ 아이템 색을 코드로 보정하는 경로는 **없다고 보는 게 안전하다.** 색이 안 맞으면 그 아이템은 못 쓴다.
→ 파츠 단위가 아닌 전체 틴트(`AvatarGUIRendererComponent.Color`)는 미검증이지만,
   캐릭터까지 같이 물들어서 "아이템만 색 바꾸기" 용도로는 어차피 쓸 수 없다.

> **교훈**: 이런 종류는 추정하지 말고 프리뷰 도구로 재라. 다만 **"안 보인다"를 결론으로 삼기 전에
> 반드시 로그로 코드가 실행됐는지부터 확인할 것** — `refresh` 없이 구 빌드를 본 것과 구별되지 않는다.

## 5-ter. 모드 전환형 UI는 **공유 엔티티의 지오메트리를 각 모드가 명시적으로 세팅**할 것

PreviewTool 초기 버전 버그: 스프라이트 모드가 `Thumb` 엔티티를 200×200 / 중앙으로 바꾸는데
아바타 모드가 배지 크기(96×96 / 우상단)로 되돌리지 않아, 모드를 왕복하면 아이콘이 아바타를 덮었다.
한 엔티티를 여러 모드가 공유하면 **"작성 시점 기본값이 남아 있겠지"에 의존하지 말고 모든 모드가 매번 전부 지정**한다.

## 5. 슬롯과 아이템 카테고리가 **어긋나면 조용히 미장착**

`category: weapon` 인 RUID를 Glove 슬롯에 넣는 식의 불일치는 에러도 경고도 없이 빈 슬롯이 된다.
`get` 응답의 `category` 와 대상 `MapleAvatarItemCategory` 가 일치하는지 넣기 전에 확인할 것.
