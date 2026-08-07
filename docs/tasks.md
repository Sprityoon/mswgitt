# 작업 목록 (Tasks)

> **현재 상태**: 솔로 체제 (제작자 주도 + AI 보조). 2026-08-06 문서 개편 시점 기준.
> T번호 체계는 **더 이상 신규 발행하지 않는다.** 아래 T번호는 구 체제에서 넘어온 잔여 항목의 식별자이며, 상세는 [agents/reports/](./agents/reports/)에 있다.
> 새 작업은 T번호 없이 이 문서에 항목으로 추가한다.

---

## 1. 진행 중 (워킹 트리 미커밋)

| 대상 | 내용 |
|---|---|
| `item_dataset.csv` · `.userdataset` | 주먹도끼 외형·모션 조정 후속 (커밋 `af6f676` 계열) |
| `ui/PreviewTool.ui` · `ui/PopupGroup.ui` | 인게임 리소스 프리뷰 도구(F9) 후속 (커밋 `8f36832` 계열) |
| `map/map01.map` · `scripts/fix_water_fringe.cjs` · `PlayerController.mlua` | **물가 프린지 규칙 반전 + 낚시 조준 판정 수정** (2026-08-06, 아래 참조) |

관련 실측 기록: [reference/resource-api-pitfalls.md](./reference/resource-api-pitfalls.md) §2 · §5-bis · §5-quater.

### 2026-08-06 물·낚시 수정 — Play 확인 필요

| 증상 | 원인 | 수정 |
|---|---|---|
| 연못 둘레에 흙 후광 | 프린지가 뚫는 것은 **그 셀 자신의 L1**(=`Soil`)이라 물이 아닌 흙이 드러남 ([규칙 19](./pitfalls.md)) | `fix_water_fringe.cjs` 규칙 반전 — 잔디가 물 셀을 ½셀 덮도록. 문법 = [tile-scheme.md §4-bis](./tile-scheme.md). map01 L2 72셀 변경, **L1 무수정** |
| 낚시 상호작용 무반응 | `IsAimTileWater()`가 미선언 `self.LastDirection`(→nil)로 방향 분기 → **항상 아래쪽 셀만 검사**. 셀 환산도 `math.floor` 자체 구현 ([규칙 18](./pitfalls.md)) | `ToCellPosition` + `LastDirectionX/Y` 단일 규약으로 교체 + `[FISHING]` 태그 로그 추가 |

- 검증: refresh **Error=0** (total 561 / Warning 48 / Info 513). **런타임 검증 보류(제작자 Play)**.
- Play 확인 포인트: ① 연못 둘레에 흙색 띠가 없는지 ② 물 쪽을 바라보고 `F` → 낚시 캐스팅 시작 ③ 좌/우/위 방향에서도 되는지 ④ 콘솔에 `[FISHING] aim=(x,y) tile=Water water=true` 출력

### 2026-08-06 삽 길 파기 회귀 + 물 전용 도구 — Play 확인 필요

| 증상 | 원인 | 수정 |
|---|---|---|
| 삽으로 길을 파려는데 물이 생김 | T92가 물 파기를 삽에 얹으면서 `if action == ... or action == "digPath"` 로 조건에 넣어 `realAction`이 **항상** `dig_water`/`fill_water`로 치환됐다. `ApplyTerrainEdit`의 `digPath` 분기가 **도달 불가능한 코드**가 되어 Phase 14-A 길 파기가 통째로 회귀 | 조건에서 `digPath` 제거 + 재발 방지 주석. 물 편집은 **전용 도구** 소관으로 분리 |

- ⚖️ **2026-07-25 "CSV 행 추가 없이 기존 Shovel 재사용" 결정을 뒤집음** (2026-08-06 제작자 확정): 삽 하나가 길·물을 겸하면 둘을 고를 방법이 없어 한쪽이 반드시 죽는다.
- **신규 `Water Spade`**: `item_dataset` + `RecipeDataSet` 각 1행. `TerrainEditAction=dig_water`. 제작 = Wood 2 + Stone 2 (Tier 1).
- ⚖️ **2026-08-06 지형 도구 외형 확정** (제작자 F9 프리뷰 육안 선택):

  | 도구 | 외형 | RUID | 슬롯/모션 |
  |---|---|---|---|
  | `Shovel` | 사각 강철 야삽 *(구 Pooh Pooh Shovel 교체)* | `f1b86bd8…` | onehand / `swingO1` |
  | `Water Spade` | 삼각 강철 야삽 | `5803e765…` | onehand / `swingO1` |
  | `Hoe` | 호프만 *(유지)* | `db5c8f98…` | twohand / `swingT1` |

  - `IconRUID` = 각 `WeaponRUID`의 `thumbnail://` — 아이콘과 손에 든 모습이 구조적으로 어긋날 수 없다(T72 패턴).
  - 🔴 Shovel은 신규 RUID가 `onehandedweapon` 계열이라 **`WeaponSlot` twohand→onehand, `SwingAction` swingT1→swingO1 동반 변경**. 카테고리↔슬롯이 어긋나면 조용히 미장착되고, 모션 계열이 어긋나면 휘두르는 중 무기가 사라진다([resource-api-pitfalls §5](./reference/resource-api-pitfalls.md)).
  - **전수 감사 통과**: 무기 RUID 보유 11개 도구 전부 카테고리↔슬롯↔모션 정합 (빈 `WeaponSlot`=onehand 폴백 반영, 불일치 0건).
- ⚖️ **2026-08-06 삽 계열 스윙 모션 확정 = `stabO1`** (Shovel · Water Spade 공통. 제작자 F9 2라운드 육안 선택).
  - 발단: "Hoe처럼 내려찍는 모션" 요청 → **Hoe의 `swingT1`은 두손 전용이라 야삽(onehandedweapon)에는 쓸 수 없다**(걸면 모션 중 도구가 사라짐). 갈래 A(야삽 유지, 한손 액션 중 선택)로 진행.
  - 1라운드 `swingO1`·`O2`·`O3`·`stabO1`·`stabO2` / 2라운드 `swingOF`·`stabOF`·`swingP1`·`P2`·`PF` → **`stabO1` 채택**(땅에 삽을 꽂는 찌르기 동작에 가장 근접).
  - 📌 **실측으로 알아낸 것 (공식 문서에 없음 — 재조사 방지)**:
    - **`*F` 계열(`swingOF`/`stabOF`)은 모션이 훨씬 크다** → **치명타·강타 연출 후보로 재사용 가치 있음**.
    - **폴암 계열(`swingP1`/`P2`/`PF`)은 한손 아바타 아이템에 프레임이 없어 무기가 사라진다** → 한손 도구에 P 계열 금지.
    - `swingO1`은 내려찍기가 아니라 **휘두르기**에 가깝다.
  - 🔴 **`MineState.mlua`의 "swingO1 = 머리 위 내려찍기 / swingO2 = 사선 내려치기" 주석은 근거 없는 추정이었음 → 정정 완료.** 공식 문서(*Controlling Avatar Animations*)는 **액션 이름 목록만 제공하고 각 모션의 동작을 설명하지 않는다.** 모션 인상을 주석·문서에 단정하지 말 것.
  - 한손 전체: `swingO1` `swingO2` `swingO3` `swingOF` `stabO1` `stabO2` `stabOF` (+폴암 `swingP1` `swingP2` `swingPF`) / 두손 전용: `swingT1~T3` `swingTF` `stabT1` `stabT2` `stabTF`.
  - 액션 보유 여부는 **API로 사전 확인 불가** (`payload: null` — [resource-api-pitfalls §2-bis](./reference/resource-api-pitfalls.md)). 육안이 유일.
  - F9 프리뷰는 평시 구성(현행 도구 5종 미러링)으로 복귀 완료.
  - 고른 뒤 할 일: `item_dataset`의 `Shovel`·`Water Spade` `SwingAction` 갱신 + `UIPreviewToolController`를 평시 구성(주석에 보존)으로 복귀.
- 검증: refresh **Error=0** (Warning 48 = baseline 유지), CSV 열 정합 불일치 0건. **런타임 검증 보류(제작자 Play)**.
- Play 확인 포인트: ① **삽으로 길이 다시 파지는지**(최우선 — 회귀 수정 확인) ② 괭이는 흙 홀 정상 ③ Water Spade 제작 → 흙에 쓰면 물, 물에 쓰면 되메움 ④ 삽·물삽을 들었을 때 외형이 각각 맞는지, 휘두르는 중 무기가 사라지지 않는지

> 🙋 **남은 판단**: 삽·괭이·물삽의 **떨어진 아이템 모델**이 셋 다 `Item_StonePickaxe`로 같다. 손에 든 모습(`WeaponRUID`)은 서로 다르므로 급하지 않다. 드롭 외형까지 분리하려면 `.model` 3종 신규 저작이 필요 — 별도 작업으로.

### 2026-08-07 물삽 + 드러난 흙 근처 프린지 꼬임 — Play 확인 필요

| 항목 | 내용 |
|---|---|
| 🔴 **원인** | 잔디 셀이 **물**과 **흙 홀**에 동시에 접하면 같은 서브셀을 양쪽이 주장한다. 구식 `(base & ~water) \| other` 는 흙이 이겨 **물에 붙은 흙 조각**이 남음 (=프린지 꼬임). 캡처로 물·흙·잔디 삼중 코너에서 재현 확인 |
| 🔴 **수정** | `RefreshWaterAreaRect` / `fix_water_fringe.cjs` 모두 **물 우선** `(base \| other) & ~water`. 시뮬레이션 6305조합 꼬임 0. plan 기록은 `ipairs`+중첩테이블 대신 **평행 배열+while** (호출 경로 정지 실측 회피) |
| 캡처 | Play 중 물가·흙 경계 꼬임 육안 확인. MakerScript로 dig 재현은 루프 제한에 걸려 불완전 — **제작자 Play로 물삽 dig 확인 필요** |

### 2026-08-07 물 파기 가드 + L4 scrub + G키 영속 — Play 확인 2026-08-07

| 항목 | 내용 |
|---|---|
| 🛑 **가드** | 물 블록 **둘레 1칸**에 드러난 흙(L2 홀)이 있으면 `dig_water` 거부. 피드백: `"드러난 흙 근처에는 물을 갤 수 없습니다."` |
| 🔧 **fill** | `fill_water` 코드는 유지(향후 복구 도구). **Water Spade는 dig만** — 물 조준 시 되메움 토글 제거(2026-08-07) |
| 🧰 **G키** | 조준 셀 **3×3** → L1 `Soil` + L2 FullGrass + L4 scrub. **`forceGrass` 지형 델타로 영속** + MarkPlayerDirty. 팝업 없음 |
| 🧹 **L4** | map01 L4 잔디/프린지 23칸 제거. `ObstacleQuery`는 **Big Wall만** 벽. 맵 로드 scrub |

- Play 확인 **PASS 2026-08-07** (제작자): 물삽 dig-only · G 영속 · L4 정리
- 검증: refresh는 Maker MCP 간헐 미연결로 보류했던 구간 있음 — Play로 런타임 확인 완료

### 2026-08-06 물삽 프린지 + 지형 편집 시각 피드백 — Play 확인 필요

| 항목 | 내용 |
|---|---|
| 🔴 **버그 수정** | 물삽으로 판 물에 프린지 미적용 — **런타임 경로가 §4-bis 오버행 문법을 아예 몰랐다**(`dig_water`가 `SetTile("Water")`+마스크 15만 실행). `ResourceSpawner:RefreshWaterArea()` 신설로 3×3 재계산. `fill_water`도 동일 적용. 규칙은 `fix_water_fringe.cjs`와 **동일 — 한쪽만 고치지 말 것** |
| ✨ **신규** | **지형 편집 영향 셀 시각 피드백** — 조준점과 별개로, 이번 편집이 건드릴 셀을 미리 칠한다. **진한 노랑 = 직접 파이는 셀 / 옅은 노랑 = 프린지(½셀 마진)만 받는 셀**. `map01`에 `TerrainAffect_1~9` 스프라이트 풀 추가(digHole 최대 9셀), 클라 `PlayerController:UpdateTerrainAffectPreview()` |
| ♻️ **규칙 18 정리** | `digPath` axis/side 판정이 서버(PlayerInventory)에만 있어 미리보기가 복제본을 만들 뻔했다 → `ResourceSpawner:DeriveDigPathAxisSide()` 단일 소스로 추출, 서버·클라 공용. 영향 셀 집합도 `GetTerrainEditAffectedCells()` 단일 소스 |

- 검증: refresh **Error=0** (Warning 48 = baseline 유지, 증가분 0). `map01` 엔티티 25개 전부 `jsonString` 객체 유지(규칙 16 통과).
- Play 확인 포인트: ① 물삽으로 물 팔 때 **잔디가 물을 ½셀 덮는지**(흙 후광 없이) ② 되메우기 정상 ③ 삽/괭이/씨앗/물삽 들었을 때 **영향 셀이 노랗게 표시**되는지 ④ 표시된 셀과 실제로 바뀌는 셀이 **일치**하는지(어긋나면 규칙 18 위반 재발)

> ⚖️ **2026-08-06 결정 — 물삽 1회 = 2×2 블록** (`ResourceSpawner.WaterDigSize = 2`)
> - **원인 확정(시뮬레이션 실측)**: 1×1은 오버행이 셀을 전부 덮어 마스크가 0 → degenerate 가드가 홀(15)로 되돌림 → **프린지가 아예 안 붙고 각진 물 1칸.** "여전히 잘 안 된다"의 정체.
> - 2×2면 각 셀이 안쪽 모서리를 남겨 **중앙 물웅덩이 + 사방 잔디 오버행**, 둘레 12셀 전부 `FullGrass`(흙 후광 0). 연속 2×2 병합·3×3 내부 온전한 물도 실측 확인.
> - 조준 셀을 **항상 포함**하고 바라보는 쪽으로 뻗는다(`GetWaterDigOrigin` — 서버·클라 공용, 규칙 18). 영속 델타에 **블록 원점**을 저장해 재생 시 방향 없이 재현.
> - 시각 피드백 풀 9 → **16**(4×4 = 직접 4 + 프린지 12). 4방향 전부 16셀·조준셀 포함 검증 완료.
> - 문법 원문 = [tile-scheme.md §4-bis](./tile-scheme.md).

### 2026-08-06 릴링 밸런스 — Play 확인 필요

| 증상 | 원인 | 수정 |
|---|---|---|
| ⚠ 무시하고 F를 꾹 눌러도 텐션이 일정 이상 안 오르고 낚시 성공 | 티어 1은 릴이 4.6초라 **위험 페이즈가 딱 1회**만 들어오고, 1회로 얻는 텐션이 최대 66(=`TensionRisePerSec 55 × DangerDurationMax 1.2`)이라 100에 **도달 자체가 불가능**했다. 시뮬레이션 4000회 실패율 **0.0%** | `FishingDifficultyDataSet.csv` 전 티어 재조정 — `TensionRisePerSec × TensionReliefMinMult × DangerDurationMin ≥ GaugeMax` 를 만족시켜 위험 페이즈를 끝까지 버티면 반드시 줄이 끊기게 |
| 초급 어종이 너무 쉬움 | 위와 동일 원인 (반응할 일이 없었음) | 릴 길이·위험 빈도 재조정 — 티어 1 약 7초/위험 1.7회 → 티어 5 약 11초/위험 3.4회 |

- `TensionReliefMinMult` **0.4 → 0.7**: 0.4에서는 고레벨 완화가 위 부등식을 깨서 버그가 되살아났다.
- **재발 방지**: `WarnIfDangerToothless()` 자가검사 추가 — 부등식이 깨진 난이도가 있으면 `[FISHING][BALANCE]` 경고를 로그에 남긴다. 앞으로 CSV만 만져도 조용히 무력화되지 않는다.
- 검증: refresh **Error=0** (Warning 48 = baseline 유지, 증가분 0). **런타임 검증 보류(제작자 Play)**.
- Play 확인 포인트: ① ⚠ 뜨는데 계속 누르고 있으면 **줄이 끊기는지**(전 어종) ② ⚠ 보고 손 떼면 잡히는지 ③ 잉어/새우 한 마리에 6~8초·손 떼기 2회 안팎인지 ④ 콘솔에 `[FISHING][BALANCE]` 경고가 **없어야** 정상

---

## 2. Play 확인 대기 (코드 완료 · 런타임 미확인)

> ⚠️ 누적 목록이라 정확도가 떨어질 수 있다. 제작자가 광범위 Play에서 이상을 보고하지 않은 항목이 다수 섞여 있고, **개별 명시 확인만 미완**인 상태다. 확인되는 대로 지우면 된다.

### 최근분 (2026-08-04 배치 O·P)

| # | 내용 | 확인 포인트 |
|---|---|---|
| T100 | 가구 6종 `TriggerComponent` 부여 | 가구 통행 차단 · F 상호작용 거리 |
| T98 | map01 물가 L2 프린지 — **2026-08-06 규칙 반전으로 재작업됨** | **맵 로드 성공 여부 먼저** (규칙 16 사고 복구분) · 물가 비주얼 = §1 참조 |
| T103 | Prop 11종 `LWA-4012` 경고 청소 | 시각·차단·조준 회귀 0 (값 변경 없음) |
| T101 | 콜라이더 판정 `Transform.Scale` 반영 | `Big Stone1`·`Tree1` 통과 버그 해소 |

### 물·낚시 (Phase 21)

| # | 내용 | 확인 포인트 |
|---|---|---|
| T91 | 낚시 = 물 타일 인접 판정 | **영지 물가 낚시** (사냥터는 물 페인팅 전이라 미검증) |
| T92 | 영지 물 파기 (`dig_water`/`fill_water`) | 파기·되메우기 · 자기 갇힘 방지 가드 |

### 이전 누적분

| # | 내용 |
|---|---|
| T27 | 퀘스트 보상 → 레시피 해금 (`RewardUnlockId`) — **미완료 캐릭터로** 확인 필요 |
| T64 | 낚시 v2 홀드-릴리즈 릴링 + 숙련 레벨 |
| T65 · T67 · T69 | 채집·공격 SFX / 조준 셀 게이트 / QWER 장착 영속화 |
| T19 · T23 | 목장·가축 / 펫 동반자 |
| T49 · T54 · T55 · T61 | 가축·펫 아트 / 팝업 닫기 / BGM·앰비언스 / 지형 편집 쿨다운 |
| T72 · T73 · T74 · T77 | 아이템 아이콘 / 광장 리스킨 / 주택 배치 / 마을 NPC |
| T84 · T85 · T86 · T87 | NPC Rigidbody 청산 / 영지 낚시터 복구 / 경고 청소 / 워크스페이스 위생 |

---

## 3. 제작자 직접 예정 (아트 — 취향 판단 필요)

| # | 내용 | 준비된 것 |
|---|---|---|
| T94 | 상점거리 노점 M1~M3 | 커스텀 톱다운 리드로우 5종 (`scratch/artwork_rework/msw_topdown_stall*`) — 변형 선택만 |
| T76 | 마을 랜드마크 (여관·시계탑·헛간) | 헛간 리드로우 4종 완성. 여관(968×640 벡터풍)·시계탑(260×708)은 도트 리드로우 + 시점 압축 판단 필요. 원본 `scratch/artwork_rework/source/{inn,clocktower,barn}.png` |
| — | `House_ThatchHut` 배치 여부 | 모델만 존재하고 `town.map` 미배치 (T74 보고 "5동" vs 실제 4동) |

---

## 4. 후속 후보 (미착수)

| 항목 | 선행 조건 |
|---|---|
| **Prop `LWA-4012` 경고 31건 재발 규명** | 2026-08-06 실측 Warning **48**(=상시 17 + Prop 31). T103이 "W17 복귀"로 보고했으나 재현되지 않음 — 커밋 `c6c0a3c`는 HEAD에 온전하고 Prop 모델 워킹트리도 HEAD와 동일. 동작 무관(표지 경고)이라 우선순위 낮음 |
| **town / template_field / template_boss 물 페인팅 + L2 프린지** | 제작자가 Maker에서 L1 `Water` 페인팅 → `scripts/fix_water_fringe.cjs` 재실행 (스크립트는 범용). ⚠️ [규칙 16](./pitfalls.md#규칙-16-map의-jsonstring은-중첩-객체다--문자열-대입-금지) 재확인 필수 |
| **마을 생활 소품 재배치** | T75가 모델 11종만 남기고 `town.map` 인스턴스 43개를 철회한 상태. 재배치는 [규칙 17](./pitfalls.md#규칙-17-trigger배치는-스프라이트-실루엣-정합이-1순위다) 실루엣 정합 기준으로 |
| **16-C 직업/전직** | `JobId` 컬럼 예약 완료. 설계 계약 = [design/skill-tree-plan.md](./design/skill-tree-plan.md) §7 |
| **주간 낚시왕 보상** | T57/T63의 v1은 보상 없음 |
| 경계 테라스·절벽 아트 (구 T4) | ⚖️ 보류 — Maker에서 제작자 협업 전제. `wall.tileset` 동시 편집 금지 |

---

## 5. 폐기 결정

| 항목 | 사유 |
|---|---|
| 필드·바이옴 오브젝트 변주 (구 T78) | ⚖️ 2026-07-25 — 체감 기여 최저 + Phase 21이 사냥터 지형을 재편해 중복. 명세(`design/artwork-spec.md` §7)는 보존 |

---

## 관련 문서

- 작업 절차: [workflow.md](./workflow.md)
- 함정 사전: [pitfalls.md](./pitfalls.md)
- Phase 트래커(설계 관점 진행 현황): [../game_design.md](../game_design.md) §5
- 구 T티켓 원문·보고서: [agents/](./agents/)
