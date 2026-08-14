# 메인화면 + 슬롯 세이브 설계 (main-menu-save-slots) — 2026-08-08

> **목표**: 접속 직후 **메인화면**(키 아트 + 새로하기/이어하기)을 띄우고, **유저당 3~5개 세이브 슬롯**으로
> 서로 다른 캐릭터 진행(레벨/인벤토리/퀘스트/**영지 상태**)을 완전히 분리해 키울 수 있게 한다.
> 메인화면 아트는 제작자가 타사 에이전트로 생성 예정 — UI 뼈대는 아트 없이 먼저 만들고 `ImageRUID`만 교체한다.

---

## 1. 현 세이브 구조 실측 (2026-08-08, `PersistenceManager.mlua`)

| 항목 | 현행 |
|---|---|
| 저장소 | `_DataStorageService:GetUserDataStorage(userId)` |
| 키 | **`"SaveData"` 단일 키** — 인벤/레벨/스킬/퀘스트/영지 델타 등 JSON 블롭 1개 |
| 영지 인스턴스 | `Home_<UserId>` (map01 템플릿 런타임 복제 + 세이브의 지형/설치 델타 재생) |
| 손님 방문 | `Home_<ownerId>` 이름으로 조인 (권한 팝업 T-계열) |
| 월드 시간 | `GetGlobalDataStorage("WorldTimeStorage")`의 `AccumulatedTime` (슬롯 무관 월드 공용) |
| 입장 연출 | `UIHUDController.spawnFade` — 홈 준비 완료 신호까지 검은 커버 유지 후 페이드 |

**핵심**: 영지 상태가 전부 SaveData 델타로 재생되므로, **"슬롯 = SaveData 키를 무엇으로 읽고 쓰느냐"만 바꾸면 영지까지 통째로 분리**된다. 맵 명명(`Home_<UserId>`)은 바꿀 필요 없다(세션당 활성 슬롯 1개 전제).

---

## 2. 슬롯 데이터 설계

### 2.1 키 스킴 (UserDataStorage 내부)

| 키 | 내용 |
|---|---|
| `SaveData_s1` ~ `SaveData_s5` | 슬롯별 세이브 JSON (현행 SaveData와 동일 스키마) |
| `SlotMeta` | 선택 화면용 요약 JSON: `{ "1": { name, level, playSec, lastSaveTicks, fishLv, costume }, ... }` — **슬롯 저장 시 함께 갱신** (선택 화면에서 슬롯 5개를 각각 GetAndWait하지 않기 위함 — DataStorage는 과금 자원, 호출 수 최소화). `costume` = `{ useAccount: true }` **또는** `{ useAccount: false, hair, face, body, coat, pants }` |
| `SaveData` (레거시) | **읽기 폴백 전용**. 마이그레이션 후에도 삭제하지 않는다(롤백 안전) |

### 2.2 마이그레이션 (기존 유저 보호 — 최우선 순위)

1. 로그인 시 `SlotMeta` 없음 + 레거시 `SaveData` 있음 → **슬롯 1로 간주**: `SaveData_s1`에 복사 + `SlotMeta` 생성.
2. 이후 저장은 `SaveData_s1`에만. 레거시 키는 두 번 다시 쓰지 않는다(백업 역할).
3. ⚠️ **세이브 경로 Yield 금지(규칙 9, T37 인벤토리 전량 유실)**: 마이그레이션 복사는 로그인 로드 시점(이미 GetAndWait 하는 지점)에서만. 저장 루틴에 Get을 추가하지 말 것.

### 2.3 슬롯 수

- ⚖️ **2026-08-08 제작자 확정: 5 슬롯 고정.**

### 2.4 슬롯이 분리하는 것 / 하지 않는 것 (명시)

| 분리됨 (SaveData 소속) | 분리 안 됨 |
|---|---|
| 레벨/XP/스탯/스킬/SP | 월드 시간(`WorldTimeStorage` — 서버 공용) |
| 인벤토리/퀵슬롯/화폐 | 마을/사냥터 맵 상태 (공용) |
| 퀘스트/도감/연구 해금 | — |
| **영지 지형 델타/설치 가구/상자 내용물** | — |
| **주간 낚시왕 랭킹** (캐릭터/슬롯 단위) | — |
| **캐릭터 외형** (`costumeLook` JSON) | — |

> ⚖️ **2026-08-09**: 슬롯별 외형은 계정 아바타를 바꾸지 않고, 월드 안에서 `CostumeManager`로 적용한다.
>
> ⚖️ **2026-08-09 (후속)**: 기본은 **내 캐릭터 유지** (`{ useAccount: true }` → `UseCustomEquipOnly=false`). **외형 꾸미기** 선택 시에만 파츠 RUID를 저장하고 `UseCustomEquipOnly=true`로 재적용. 레거시(hair만 있는) 세이브는 커스텀으로 간주.

---

## 3. 메인화면(타이틀) 플로우

MSW는 월드 입장 시점에 이미 아바타가 스폰된다 → 메인화면은 **풀스크린 오버레이 UI** 방식.

⚖️ **2026-08-09 UX**: 타이틀에는 메뉴 버튼 3개만. 슬롯 선택은 그 다음 단계.

```
접속 → spawnFade(검정) 유지
     → TitlePanel: 키아트 + 로고 + [새로하기] [이어하기] [종료하기]
     → 새로하기 → SlotPanel(빈 슬롯만) → CustomizePanel(닉네임 + **내 캐릭터 유지 / 외형 꾸미기**)
     → 이어하기 → SlotPanel(점유 슬롯만, AvatarGUI로 저장된 외형) → 선택 시 로드
     → 종료하기 → KickUser(WorldContent)로 월드 퇴장 시도
     → ServerSelectSaveSlot → 로드/생성 → MainMenu 닫기 + spawnFade 페이드아웃
```

> ⚖️ **2026-08-10 신규 캐릭터 부트스트랩 순서 (중요)**
>
> `SelectSaveSlot(isNew)`는 **기본값 주입 → 영지 시드(`SeedNewEstate`) → 저장 → 로드** 순으로만 돌아야 한다.
> 시드 없이 저장부터 하면 `lastMapKind="town"` · `homeFurniture="[]"` 가 박제되어
> **새 캐릭터가 영지가 아니라 마을에서 시작**하고 영지가 텅 빈다 ([pitfalls 규칙 26](../pitfalls.md)).
> 홈 워프가 끝날 때까지 `PersistenceManager.PendingHomeWarp[userId]`가 서 있고,
> 이 구간의 저장은 실제 위치(마을) 대신 `home` + `LastHomePos`를 기록한다.

- **서버 로드 지연**: 슬롯 선택 전까지 SaveData 로드 보류. (게스트 `Home_<ownerId>` 무변경.)
- 슬롯 전환은 재접속(또는 추후 타이틀 복귀)만 — 세션 중 핫스왑 금지.
- 삭제: 이어하기 슬롯 카드의 삭제 → **닉네임 재입력** 확인. `SaveData_sN="{}"` + SlotMeta 제거.

## 4. UI 구성 (아트 교체 전제의 뼈대)

- `ui/MainMenuGroup.ui` (UIBuilder):
  - `Bg` 키아트 — RUID `ff194285…` (Mask + `Bg/Art` AspectOnly 2100² **cover crop**)
  - `TitlePanel/SignBoard` 표지판 — RUID `9d3a2b2b…` (displayOrder 최하위 — 글씨/버튼 뒤)
  - `SlotPanel/Notebook` · `CustomizePanel/Frame` · `NamePrompt` 수첩 — RUID `59a330fa…` (동일, 프레임은 뒤)
  - **글자 가독성**: 키아트 위 글자(로고/힌트/슬롯 서브타이틀/커스텀 제목)만 반투명 어두운 `*Plate` + 밝은 글자. **수첩 종이 위 글자는 진한 갈색 잉크색**(Plate 불필요).
  - 커스텀: `BtnLookAccount`(내 캐릭터 유지) / `BtnLookCustom`(외형 꾸미기) — 기본=계정 유지, 꾸미기 시에만 파츠 순환 활성(비활성 시 **숨기지 말고 흐리게**).
  - 키 아트/`ImageRUID` 교체만으로 아트 교체 가능 — **구조와 아트 일정 분리**.
- 메인화면 중 입력 차단: 풀스크린 Bg raycast + HUD 숨김.
- 키 아트 프롬프트: [art-style-guide.md](./art-style-guide.md) §5.
- 적용 스크립트: `scratch/apply_mainmenu_art_ruids.cjs` · 가독성/룩모드: `scratch/patch_mainmenu_look_and_textplates.cjs` · **레이아웃 정합: `scratch/fix_mainmenu_layout.cjs`**

### 4.1 ⚖️ 2026-08-10 레이아웃 재정합 (수첩 아트가 정사각이라서)

수첩 아트(`notebook_menu_frame_ui.png`)는 **1024×1024 정사각**이고 `PreserveSprite=AspectOnly`다 →
`RectSize 1700×820`을 줘도 **실제로는 820×820만 그려진다**([pitfalls 규칙 25](../pitfalls.md)).
아트를 늘려 찌그러뜨리는 대신 **레이아웃을 정사각 페이지에 맞췄다.**

| 영역 | 변경 |
|---|---|
| `SlotPanel/Notebook` | 1700×820 → **960×960** @ (0,-40) |
| 슬롯 5개 | 세로 카드 5열(250×480) → **가로 행 5줄(700×96)** — 줄공책 아트에 맞는 리스트 형태 |
| 슬롯 행 내부 | `[Avatar 84×88] [이름/정보 좌정렬] [선택 180×88] [삭제 104×88]`, 정보는 **1줄** (`Lv.5 · 낚시 Lv.3`) |
| `CustomizePanel/Frame` | 1600×820 → **960×960** @ (0,-20). 왼쪽 페이지 = 미리보기 + 룩 모드, 오른쪽 페이지 = 파츠 4행 + 닉네임 |
| `NamePrompt` | 700×380 → **640×640** |
| 모든 `*Plate` | displayOrder가 글자보다 **높아서 글자를 가리던** 것 → 글자 아래로. 좌표도 글자와 일치시킴 |
| 텍스트 정렬 | 전부 `Left(1)/Top(256)`이라 박스 좌상단에 붙어 있던 것 → 용도별 `Center/Middle`·`Right/Middle` |
| 아트 실측 기준 | 책 외곽 x 55~975 / **페이지 안쪽 x 120~905, y 215~790** / 제본선 x 490~570 (원본 1024px 기준) |

> 아트를 교체할 때 **비율이 바뀌면 위 좌표를 다시 계산해야 한다.** 계산식은 `scratch/fix_mainmenu_layout.cjs` 상단 주석 참조.

### 4.2 닉네임 길이 규약 = **2~15자** (⚖️ 2026-08-10)

세 곳이 반드시 같아야 한다. 하나만 어긋나도 입력은 되는데 확정에서 거부된다.

| 위치 | 값 |
|---|---|
| `UIMainMenuController.nickMinLen` / `nickMaxLen` | 2 / 15 |
| `PersistenceManager.NickMinLen` / `NickMaxLen` | 2 / 15 |
| `MainMenuGroup.ui` `NameInput`·`NamePrompt/Input` 의 `CharacterLimit` | 15 |

한글은 UTF-8 3바이트라 `#s` 바이트 길이로 세면 안 된다 — 양쪽 다 `Utf8Len()`으로 **글자 수**를 센다.

## 5. 작업 분해 (구현 순서)

| # | 작업 | 규모 | 비고 |
|---|---|---|---|
| A | `PersistenceManager` 슬롯 키 파라미터화 + 레거시 마이그레이션 + `SlotMeta` | 중 | **규칙 9 절대 준수**. 저장 경로 diff 최소화 |
| B | 슬롯 선택 전 로드 보류 (진입점 분리) + `ServerSelectSlot` RPC | 중 | 게스트 방문 경로 회귀 0 확인 |
| C | `MainMenuGroup.ui` 타이틀→슬롯→커스텀 + 컨트롤러 | 중 | 아트 placeholder · AvatarGUI 미리보기 |
| D | `costumeLook` 세이브/로드 + `UseCustomEquipOnly` 적용 | 중 | SlotMeta에도 costume 요약 |
| E | 키 아트 적용 + 폴리시 (BGM, 페이드 연출) | 소 | 타사 에이전트 아트 수령 후 |

> 검증: 단계별 refresh Error=0 → 제작자 Play. **A는 세이브 파괴 위험이 있는 작업**이라 착수 전 제작자에게 백업 고지 + 테스트 계정으로 먼저.

## 6. 결정 기록 (⚖️ 2026-08-08 제작자)

1. **슬롯 수 = 5 고정.**
2. 새로하기 시 **튜토리얼 퀘스트(101~)** 재시작 — 슬롯 분리면 자연히 재시작(유지).
3. **주간 낚시왕 랭킹 = 캐릭터(슬롯) 단위** — 제출 키 = `CharacterId`(`{userId}_s{n}`), 표시 태그 = 슬롯 닉네임.
4. **닉네임 중복 생성 금지** — 새로하기 시 글로벌 `NicknameRegistry`(GlobalDataStorage) + 동일 계정 타 슬롯과 충돌하면 거부. 삭제 슬롯은 레지스트리에서 해제.
5. 슬롯 표시명 = **플레이어가 입력한 닉네임** (v1부터 입력 UI 포함). "슬롯 N" 자동 명명은 폴백만.
6. **대화하기(F)** = 머리 위 ChatBalloon이 아니라 **메이플스토리식 하단 대화창**. 퀘스트 offer/수락/거절을 이 창에서 처리. **모바일 버튼·퀵슬롯을 가려도 됨**(높은 displayOrder + BlocksRaycasts).
7. ⚖️ **2026-08-09 타이틀 UX**: 키아트 + **새로하기 / 이어하기 / 종료하기** 3버튼만. 슬롯 선택은 하위 화면.
8. ⚖️ **2026-08-09 외형**: 기본 **내 캐릭터(계정 아바타) 유지**. 선택적으로 **외형 꾸미기**(헤어·얼굴·피부·상의). 글자 뒤 블록 플레이트로 가독성 확보.
9. ⚖️ **2026-08-09 커스텀 풀**: 화려한 이벤트/코스튬 제외. **헤어 ~20 · 얼굴(눈) ~10 · 피부 6 · 상의 ~15** — 단발/숏컷/면티/트레이닝 등 일상 기본 세트.

---

## 관련 문서

- 세이브 함정: [../pitfalls.md](../pitfalls.md) 규칙 9 (T37 인벤토리 유실)
- 아트: [art-style-guide.md](./art-style-guide.md) §5 메인화면 키 아트
- 스토리 연동(새로하기 시 첫 경험): [story/story-npc-quest-plan.md](./story/story-npc-quest-plan.md)
