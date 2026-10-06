# 메인화면 나무 판자와 음악 버튼

## 최신 수정본(v2, 2026-10-06)

후속 제작자 요청으로 혼자 다른 모양인 상단 장식 판자와 잎·꽃까지 제거했다. [wooden_menu_planks_v2.png](./wooden_menu_planks_v2.png)는 가로 판자 5개만 남긴 투명 배경 PNG이며, 기존 판자 배치와 상단 빈 여백을 유지한다. [편집 프롬프트](./wooden_menu_planks_v2.prompt.md). 내장 image_gen 편집 후 판자 5개·상단 장식 제거·RGBA 알파를 확인했다.

제작자가 제공한 v2 RUID `a49a5bd9bddf457b881e4e6f7ea5b878`를 `TitlePanel/SignBoard`에 연결 완료했다. refresh 검증 보류 · 런타임 검증 보류(제작자 수행).

제작자 요청(2026-10-06): 우측 메뉴 이미지에서 십자가 모양 기둥을 제거하고 나무 판자만 유지. 메인화면에 음악 켜기/끄기 버튼 추가.

- 이미지: [wooden_menu_planks.png](./wooden_menu_planks.png), 1254×1254 RGBA PNG. 장식 상단 판자 1개와 넓은 메뉴 판자 5개를 남기고 세로 기둥·가로 지지대·X자 밧줄을 제거한 투명 배경 이미지.
- 원본: 프로젝트 루트 `wooden_signpost_ui.png`(1024×1024). 내장 image_gen으로 편집했으며 원본은 별도 보존. [편집 프롬프트](./wooden_menu_planks.prompt.md).
- 시각 검토: 지지 구조 제거·판자 수·도트풍 나무 질감 확인. 알파 채널 0~255, 완전 투명 픽셀 1,142,870개 확인. 생성 결과는 원본보다 해상도가 크고 판자 위치/비율에도 차이가 있어 실제 버튼 정렬을 Maker에서 확인해야 한다.

## Maker 등록 및 연결

제작자가 PNG를 Maker에 등록한 뒤 제공한 RUID를 `scripts/apply_mainmenu_planks.cjs`로 연결했다. v1 RUID는 `6676188d980946d5b726e1be994c1837`, 현재 v2 RUID는 `a49a5bd9bddf457b881e4e6f7ea5b878`다. 현재 Maker MCP가 연결되어 있지 않아 refresh는 수행하지 못했다.

1. 이후 이미지를 다시 수정한다면 Maker에서 최신 PNG를 스프라이트로 등록한다.
2. 발급된 Sprite RUID로 아래 명령을 실행하거나 AI에게 RUID를 전달한다.

```powershell
node scripts/apply_mainmenu_planks.cjs <Sprite RUID>
```

교체 대상은 `ui/MainMenuGroup.ui` → `TitlePanel/SignBoard` → `SpriteGUIRendererComponent.ImageRUID`이다. 기존 기둥 이미지 `9d3a2b2b00124690b00515e900119627` → v1 → 현재 v2 순으로 변경했다. 교체 스크립트는 UIBuilder의 읽기 → 패치 → 쓰기 → 재읽기 절차만 사용한다.

기존 SignBoard는 AspectOnly이며 RectSize 약 576×996, 우측 중앙 앵커·우측 피벗이다. 새 이미지도 정사각이므로 실제 표시 영역은 짧은 변 기준으로 결정된다. 새로하기·이어하기·종료하기 글자/클릭 영역이 판자에 맞는지 제작자가 확인해야 한다.

## 음악 버튼

- 위치: 제작자가 Maker에서 옮긴 우측 상단 위치를 기준으로 `TitlePanel/BtnMusic`를 88×88 클릭 영역으로 축소했다. 기존 bottom-left 앵커·피벗을 유지하고 좌표 (1604, 967)로 플랫폼 우상단 메뉴 영역 왼쪽에 배치했다. 기존 클릭/호버음 유지.
- 표시: 글자와 버튼 배경 없이 크림색 스피커와 짙은 갈색 외곽선만 표시. 켜짐 = 음파 2줄, 음소거 = 음파를 숨기고 스피커 위 사선 1줄. UIBuilder의 `PolygonGUIRendererComponent`로 구성했으며 별도 이미지 등록은 필요 없다.
- ⚖️ 2026-10-06 후속 가독성 조정: 음파의 크림색 두께 4→8px, 음소거 사선 5→10px. 짙은 외곽선도 음파 7→12px, 사선 9→14px로 확대. 스피커 모서리는 둥근 곡선, 음파는 원호, 사선은 둥근 끝의 캡슐 형태로 만들었다. 선 렌더러 대신 채워진 도형 안에 곡선과 둥근 끝을 포함해 모양을 확정했다. 클릭 영역 88×88·아이콘 68×68·기존 UUID와 켜짐/음소거 동작 유지.
- [아이콘 켜짐/음소거 진단용 미리보기](./music_icon.preview.png): UIBuilder에서 실제 도형·색·선 폭·그리기 순서를 추출하여 만든 참고 그림. Maker 실제 렌더 결과는 아니며, 게임은 PNG 대신 native UI 도형을 사용한다.
- 처리: `UIMainMenuController` → `BGMManager.SetMusicEnabled`. SoundService의 BGM 볼륨만 0 또는 현재 곡의 데이터셋 볼륨으로 변경한다. 곡 전환 시에도 꺼짐 상태를 반영한다.
- 설정 범위: 접속 세션의 클라이언트 로컬 상태. 맵 이동 동안 유지, 새 접속의 기본값은 켜짐. 효과음·날씨 앰비언스는 기존 설정 유지.

## 메인메뉴 BGM

- `BGMDataSet.csv`의 `mainmenu` 행: `67540f6a11f04476900190962b9e3d4c`, 볼륨 0.45.
- `BGMManager.MainMenuActive`가 true이면 플레이어 맵과 무관하게 전용 곡을 선택한다. 최초 기동 시에도 해당 곡을 선택하므로 아바타 맵이 아직 없어도 재생 요청을 할 수 있다.
- 타이틀·슬롯·외형 선택 동안 같은 곡을 유지한다. `UIMainMenuController.SetRootEnable(false)`에서 메뉴 전용 선택을 해제하고 기존 home/town/field/boss 곡으로 돌아간다. 음소거 상태는 유지한다.

## 검증

- 두 수정 `.mlua`의 로컬 LSP 진단: 오류 0 / 경고 0, 프로젝트 로딩 완료·stale 결과 아님.
- UIBuilder 검증 및 UI lint: 오류 0 / 기존 경고 32. 새 음악 버튼 관련 경고 없음.
- 음악 버튼 추가 시 HEAD와 UIBuilder로 비교: 기존 91개 엔티티의 메타데이터 및 UITransform/Sprite/Text/Button 컴포넌트 불변, 음악 버튼 1개 추가. 이후 SignBoard의 ImageRUID만 추가 변경. 전체 스프라이트 DataRef 81개의 DataId가 문자열임을 확인.
- 최종 아이콘 교체 후 두 `.mlua` LSP 오류 0 / 경고 0, UIBuilder strict lint 오류 0 / 기존 경고 32(착수 시 33 → 음악 버튼의 PC 예약 영역 경고 해소). 클릭 영역 88×88, 아이콘 68×68 안에 도형/선 포함, 배경 알파 0·빈 문구·raycast 및 컨트롤러 UUID 3개 바인딩 확인. 미리보기 켜짐/음소거 상태와 도형 그리기 순서 시각 검토.
- BGM CSV: 4컬럼·MapKind 중복 없음·mainmenu RUID 확인. 기존 home/town/field/boss 행이 HEAD와 동일함을 확인.
- refresh 검증 보류. 런타임 검증 보류(제작자 수행): 음악 전환·맵 이동 시 음소거 유지·글자 가독성·신규 판자와 클릭 영역 정렬.
