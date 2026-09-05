# 레퍼런스

이 폴더는 **필요할 때 찾아보는 참조 자료**다. 매번 읽을 문서는 [../workflow.md](../workflow.md) · [../pitfalls.md](../pitfalls.md) 쪽에 있다.

| 파일 | 내용 |
|---|---|
| [physics-controls.md](./physics-controls.md) | 맵 4종 구성 · RectTile/Kinematicbody 물리 · 조작키 |
| [directory-structure.md](./directory-structure.md) | `RootDesk/MyDesk/` 카테고리→자산종류 2단계 폴더 규칙 |
| [skill-routing.md](./skill-routing.md) | MSW 스킬 로딩 프로토콜 · 도메인 매트릭스 |
| [hooks.md](./hooks.md) | 활성 훅 인벤토리 · 종료 코드 계약 · deny 대응 |
| [resource-api-pitfalls.md](./resource-api-pitfalls.md) | 리소스 검색 API 실측 함정 (아바타 아이템 등) |
| [announcement-template.md](./announcement-template.md) | 패치노트/업데이트 공지사항 작성 가이드 & 디스코드 템플릿 |
| `avatar-item-catalog.csv` | 아바타 아이템 33,763개 전량 덤프 (아래) |

---

## `avatar-item-catalog.csv` — 아바타(장착) 아이템 전량 카탈로그

MSW 아바타 아이템 **33,763개** 전량 덤프. `GET /v3/avatars` (`listAvatars`, `canonicalOnly=false`) 1회 호출 결과이며,
서버가 캐시하는 정적 목록이라 **재생성이 거의 필요 없다**. 최초 생성: 2026-08-05.

| 컬럼 | 내용 |
|---|---|
| `Ruid` | `CostumeManagerComponent.Custom*Equip` 및 `item_dataset.WeaponRUID` 에 그대로 넣는 값 |
| `Category` | 아바타 슬롯 (`weapon` / `twohandweapon` / `subweapon` / `shield` / `glove` / `cap` / …) |
| `Dname` | 내부 식별자 (`onehandedweapon-579`). 안정적인 보조 키 |
| `NameKo` / `NameEn` | 표시명. **둘 중 하나만 있는 경우가 흔하므로 양쪽을 다 검색할 것** |
| `ColorHex` | 대표색 (약 21%는 비어 있음) |
| `GroupId` | 색 변형 묶음 |

**커버리지**: 이름이 아예 없는 행은 547개(1.6%)뿐. 카테고리 분포는 weapon 2,387 / twohandweapon 1,557 /
subweapon 69 / shield 102 / glove 476 / cap 3,125 / hair 11,746 / face 8,255 등.

### 쓰는 법 — 아이콘과 장착 아이템 모양 맞추기

1. **찾는다**: 이 CSV를 에디터·Excel에서 검색한다. 카테고리로 먼저 좁히면 빠르다.
   의미 검색이 필요하면 `msw-search` 의 `search-avatar` 를 쓰되, 이름 임베딩에 끌리는 한계가 있다
   ([resource-api-pitfalls.md](./resource-api-pitfalls.md) §3).
2. **본다**: 찾은 RUID를
   [UIPreviewToolController.mlua](../../RootDesk/MyDesk/DevTools/UIPreviewToolController.mlua) 의
   `GetAvatarCandidates()` 에 넣고 Maker refresh → Play → **F9**.
   슬롯마다 *기본 아바타에 장착한 모습* 과 *아이템 단독 아이콘* 이 함께 뜨고, `모션 재생`으로 휘두르는 중 모습까지 확인된다.
   - `slot` 은 그 아이템의 `Category` 와 반드시 맞출 것 (`weapon`→`onehand`, `twohandweapon`→`twohand`).
     어긋나면 에러 없이 빈 슬롯이 된다.
   - `action` 도 슬롯 계열과 맞출 것 (한손 `swingO*` / 양손 `swingT*`). 어긋나면 모션 중 아이템이 사라진다.
3. **아이콘을 일치시킨다**: `item_dataset.csv` 의 `IconRUID` 를 **`thumbnail://<같은 RUID>`** 로 적는다.
   아바타 아이템은 접두어 없이는 조용히 안 보인다. 이렇게 하면 아이콘과 장착 아이템이 같은 리소스라 모양이 어긋날 수 없다.
   예 — `hand_axe`: `WeaponRUID = 384de1d5…`, `IconRUID = thumbnail://384de1d5…`

### 재생성

덤프 스크립트는 일회성이라 저장소에 두지 않았다. 다시 떠야 하면 `msw-search` 스킬에서 현재 환경의
아바타 카탈로그 조회 도구를 확인한 뒤 `canonicalOnly=false`로 전량 조회한다. 결과는
`Ruid,Category,Dname,NameKo,NameEn,ColorHex,GroupId` 순서와 **BOM 포함 UTF-8**을 유지한다.
개인 PC의 절대 경로를 문서에 복사하지 않는다.
