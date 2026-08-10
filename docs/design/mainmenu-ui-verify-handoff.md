# 메인메뉴 UI 검증·수정 인수인계 (2026-08-09)

> ## ✅ 2026-08-10 처리 완료 — 아래 본문은 **당시 진단 기록**으로 남긴다
>
> **실제 원인 (§4.2의 추측과 다름)**: `TitlePanel`/`SlotPanel`의 RectSize 100×100 문제는 이미 해소돼 있었다.
> 진짜 원인은 **수첩 아트가 1024² 정사각인데 `PreserveSprite=AspectOnly`** 라서 `RectSize 1700×820`을 줘도
> **820×820만 그려진다**는 것이었다 → 슬롯 카드 5장(총 폭 1330)이 전부 프레임 밖. 그 위에
> 모든 `*Plate`의 displayOrder가 글자보다 높아 글자를 가리고 있었고, 슬롯 Plate는 좌표까지 250px 어긋나 버튼을 덮었다.
>
> **조치**: 아트를 늘리지 않고 정사각 페이지에 맞춰 레이아웃 재작성 (슬롯 = 가로 행 5줄).
> 상세 = [main-menu-save-slots.md §4.1](./main-menu-save-slots.md) · 스크립트 = `scratch/fix_mainmenu_layout.cjs` ·
> 일반화한 규칙 = [pitfalls 규칙 25](../pitfalls.md).
>
> **함께 잡힌 별건 버그**: 닉네임 입력창 프로퍼티가 `TextInputComponent`(실제는 `TextGUIRendererInputComponent`)로
> 선언돼 있어 무엇을 입력해도 글자수 오류로 거부됐다 → [pitfalls 규칙 24](../pitfalls.md).
>
> **남은 것**: 런타임 육안 검증(§5-C 체크리스트 1~6)은 제작자 Play 몫.

> **대상 에이전트**: Maker MCP 연결 가능한 환경에서 `ui/MainMenuGroup.ui` 레이아웃을 육안·구조 검증하고, 엉망인 배치를 고친다.  
> **이 문서를 쓴 이유**: 직전 환경에서 MCP 미연결 → Play/screenshot 검증 불가. 아트 RUID만 붙인 채 좌표·계층이 어긋난 상태로 제작자 보고(“배치 엉망”).

---

## 0. 한 줄 요약

**의도**: 코지 키아트 배경 + 우측 통나무 표지판에 메뉴 3버튼 + (하위) 수첩 프레임 위 슬롯/커스텀.  
**현상**: 표지판/수첩/버튼/텍스트 정렬이 깨져 보임.  
**해야 할 일**: Refresh → Play(또는 screenshot)로 실측 → UIBuilder로 레이아웃 재정렬 → Error=0 보고.

---

## 1. 절대 규칙 (이 프로젝트)

| 규칙 | 내용 |
|---|---|
| `.ui` | **UIBuilder만** (`msw-ui-system` / `msw_ui_builder.cjs`). raw JSON 편집 금지 |
| MCP | `maker_refresh_workspace` → `maker_logs(kind="build")` (dateTime 대조, pitfalls 규칙 22). Play는 제작자 전담이지만, **이 인수에서는 제작자가 Play 검증을 다른 에이전트에 위임**한 것으로 보고 screenshot/logs 사용 가능하면 사용 |
| 맵 물리 | 이 작업은 UI만. TileMapMode=1 / Kinematicbody 무관 |
| 스크립트 | `UIMainMenuController.mlua` 플로우는 유지 (타이틀→슬롯→커스텀). 레이아웃 수정이 우선 |
| 커밋 | 지시 없으면 커밋하지 말 것 |

---

## 2. 의도 UX (합격 기준)

### 2.1 타이틀 (`TitlePanel` Enable, `SlotPanel`/`CustomizePanel` Disable)

```
┌──────────────────────────────────────────────┐
│  [키아트 풀스크린 Bg — 비율 cover crop]        │
│                                              │
│         메이플월드 (로고, 상단 중앙)            │
│         태그라인 (로고 아래)                    │
│                              ┌─────────────┐ │
│                              │  표지판 아트  │ │
│                              │  새로하기    │ │
│                              │  이어하기    │ │
│                              │  종료하기    │ │
│                              └─────────────┘ │
│  (힌트 텍스트는 하단, 평소 빈 문자열)           │
└──────────────────────────────────────────────┘
```

**합격**
- 배경이 화면을 채움 (심한 찌그러짐 없이, 필요 시 crop)
- 표지판이 **오른쪽**에 자연스럽게 서 있음
- **버튼 글씨가 표지판 판면 위에** 읽힘 (아트가 글씨를 가리지 않음)
- 로고/태그라인이 표지판·배경에 가려지지 않음
- 클릭: 새로하기/이어하기 → 슬롯 화면, 종료하기 → quit 시도

### 2.2 슬롯 (`SlotPanel`)

```
┌──────────────────────────────────────────────┐
│ [뒤로]     슬롯을 선택하세요                   │
│         ┌────────────────────────────┐       │
│         │ 수첩 프레임 (뒤)              │       │
│         │  [슬롯1][2][3][4][5] 카드   │       │
│         │  (점유 시 Avatar+이름+Lv)    │       │
│         └────────────────────────────┘       │
└──────────────────────────────────────────────┘
```

**합격**
- 수첩은 **배경 프레임** (카드/텍스트보다 뒤)
- 5슬롯이 수첩 **안쪽 여백**에 들어가 보임 (프레임 밖으로 심하게 삐져나오지 않음)
- 이어하기: 점유만 선택 / 새로하기: 빈 슬롯만 선택 (컨트롤러 로직)

### 2.3 커스텀 (`CustomizePanel`) · 삭제 확인 (`NamePrompt`)

- 수첩 프레임 위에 미리보기 Avatar + 헤어/얼굴/피부/상의 순환 + 닉네임 + 시작/뒤로
- 글씨·버튼이 프레임에 가려지지 않음

---

## 3. 현재 리소스 (확정 RUID)

| 역할 | RUID | 엔티티 |
|---|---|---|
| 배경 | `ff194285e29d4c21b39a64d5d4ab0ec6` | `Bg` (Mask) + `Bg/Art` |
| 표지판 | `9d3a2b2b00124690b00515e900119627` | `TitlePanel/SignBoard` |
| 수첩 | `59a330fa4cd44a5583d05d2109cd7f14` | `SlotPanel/Notebook`, `CustomizePanel/Frame`, `NamePrompt` |

아트 교체 시 ImageRUID만 바꾸면 됨. **레이아웃 깨짐은 좌표/displayOrder 문제일 가능성이 큼.**

---

## 4. 현재 실측 스냅샷 (문제 후보)

파일: `ui/MainMenuGroup.ui`  
컨트롤러: `RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua`  
관련 스크립트: `scratch/apply_mainmenu_art_ruids.cjs`, `scratch/fix_mainmenu_art_layering.cjs`

### 4.1 계층 / displayOrder (의도: 아트 < 텍스트)

| displayOrder | path | 비고 |
|---:|---|---|
| 0 | `Bg` | Mask + 거의 투명 |
| — | `Bg/Art` | 2100×2100, PreserveSprite=AspectOnly(1), cover crop 시도 |
| 1 | `TitlePanel` | stretch인데 **RectSize=100×100** ← 수상 (stretch면 Offset이 먹어야 함) |
| 0 | `TitlePanel/SignBoard` | 440×760, middle-right, pos=(-40,-20) |
| 1~6 | Logo / Tagline / Btn×3 / Hint | 버튼 투명 스프라이트(a=0) + 텍스트만 |
| 2 | `SlotPanel` | 기본 Enable=false. stretch인데 **RectSize=100×100** 동일 이슈 |
| 0 | `SlotPanel/Notebook` | 1700×820 |
| 3~7 | Slot1~5 | x = -680,-340,0,340,680 / size 300×520 — **수첩 안으로 안 들어갈 수 있음** |

### 4.2 제작자 보고와 맞는 의심 원인

1. **`TitlePanel` / `SlotPanel` / `CustomizePanel`이 stretch인데 RectSize 100×100**  
   - 자식 좌표 기준이 깨지거나, 패널 히트/클리핑이 이상해질 수 있음.  
   - **검증**: stretch 부모는 OffsetMin/Max로 풀스크린인지, 자식 world bbox가 1920×1080 기준과 맞는지.

2. **표지판 vs 버튼 정렬**  
   - 버튼이 표지판 “판면”에 맞춰지지 않고 떠 있거나, 아트 실루엣과 어긋남.  
   - 새 표지판 아트(`9d3a2b2b…`) 실측 비율에 맞게 SignBoard size/pos + 버튼 y 간격을 **아트에 맞게 재튜닝** 필요.

3. **수첩 vs 슬롯 카드**  
   - Notebook 1700×820 vs 슬롯 5장×300폭 + 간격 → 가로만 ~1700+α로 **프레임 밖으로 넘침** 가능.  
   - 슬롯을 수첩 안쪽 safe area에 맞게 축소·재배치.

4. **레이어**  
   - `fix_mainmenu_art_layering.cjs`로 SignBoard/Notebook displayOrder를 뒤로 내림.  
   - 그래도 가리면: sibling displayOrder 재확인 + `OverrideSorting` 잔존 여부.

5. **배경 crop**  
   - `Bg/Art` 2100² AspectOnly + Mask. 잘린 구도가 어색하면 pos/rect_size 조정.

---

## 5. 검증 절차 (다른 에이전트용 체크리스트)

### A. 정적 (파일)

- [ ] `UIBuilder.read('ui/MainMenuGroup.ui')`로 엔티티 트리·RUID·displayOrder·anchor/pos/size 덤프
- [ ] stretch 부모 3종 (`TitlePanel`,`SlotPanel`,`CustomizePanel`) Rect/Offset 정상 여부
- [ ] SignBoard displayOrder < Logo/Buttons ; Notebook displayOrder < Slots

### B. Maker

- [ ] `maker_refresh_workspace` status ok  
- [ ] `maker_logs(kind="build")` → **Error=0**, dateTime이 이번 refresh와 일치 (규칙 22)  
- [ ] 신규/수정 `.mlua`면 `.codeblock` 존재 확인

### C. 런타임 육안 (Play 또는 screenshot)

| # | 장면 | 볼 것 |
|---|---|---|
| 1 | 접속 직후 타이틀 | 키아트 풀블리드, 로고 가독, 표지판+3버튼 정렬 |
| 2 | 버튼 hover/click | 글씨 가림 없음, 클릭 영역이 판면과 일치 |
| 3 | 새로하기 → 슬롯 | 수첩 안 빈 슬롯만, 카드가 프레임 안 |
| 4 | 이어하기 → 슬롯 | 점유 슬롯 Avatar/이름 보임, 수첩이 글씨 안 가림 |
| 5 | 새로하기 → 커스텀 | **내 캐릭터 유지 / 외형 꾸미기** + 글자 플레이트 가독 |
| 6 | 뒤로 네비 | Title ↔ Slot ↔ Customize 전환 시 Enable만 바뀌고 레이아웃 유지 |

### D. 수정 시 가이드

1. **UIBuilder만** 사용 (`patch` / `patchComponent` / 필요 시 재배치).  
2. 표지판·수첩은 **장식 레이어**(낮은 displayOrder, `RaycastTarget=false`), 버튼/텍스트는 위.  
3. 슬롯 5장은 수첩 safe inset 기준으로 다시 잡기 (예: 프레임 안쪽 1400×560 영역).  
4. stretch 패널은 `anchor: "stretch"` + 올바른 Offset(풀스크린)으로 고치고, 자식은 부모 기준 재배치.  
5. 끝나면 refresh + build Error=0 + (가능하면) screenshot 근거를 보고에 첨부.  
6. 설계 메모: `docs/design/main-menu-save-slots.md` §4 RUID/배치가 바뀌면 동기화.  
7. `docs/tasks.md`에 검증 결과 한 줄 기록.

---

## 6. 건드리면 안 되는 것 / 유지할 로직

- `UIMainMenuController` 플로우: title → slot(new|continue) → customize → `ServerSelectSaveSlot(..., costumeJson)`  
- `PersistenceManager` 슬롯/닉네임/costumeLook  
- `DialogGroup` / 퀘스트 대화창 (별건)  
- `.codeblock` 수동 편집 금지

---

## 7. 참고 파일

| 파일 | 역할 |
|---|---|
| `ui/MainMenuGroup.ui` | 수정 대상 |
| `RootDesk/MyDesk/UI/Scripts/UIMainMenuController.mlua` | 패널 Enable·버튼 바인딩 |
| `docs/design/main-menu-save-slots.md` | UX·RUID 설계 |
| `scratch/cozy_title_screen.html` | 코지 타이틀 비주얼 참고(웹 프로토타입) |
| `scratch/fix_mainmenu_art_layering.cjs` | RUID+displayOrder 최근 패치 |
| `.claude/skills/msw-ui-system/` | UIBuilder·displayOrder·anchor 규약 |

---

## 8. 보고 형식 (작업 후)

```
1) 실측: (screenshot 또는 배치 문제 재현 여부)
2) 수정: (어떤 엔티티의 pos/size/displayOrder를 어떻게)
3) refresh: Error=? Warning=? (dateTime 일치 여부)
4) Play: 체크리스트 1~6 PASS/FAIL
5) 잔여: (아트 safe-area 재튜닝 등)
```
