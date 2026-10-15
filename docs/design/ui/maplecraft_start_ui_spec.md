# 《메이플크래프트 : 마지막 모험가》 시작 화면 UI/UX 개편 명세서 및 커스텀 리소스 제작 가이드

본 문서는 메이플스토리 월드(MapleStory Worlds) 환경에서 제작 중인 **《메이플크래프트 : 마지막 모험가》**의 시작 화면 및 초기 진입 UI 4종(타이틀, 캐릭터 선택, 삭제 확인 모달, 캐릭터 만들기)을 개편하기 위한 **에이전트 작업 지시서 및 커스텀 리소스 생성 프롬프트 명세서**입니다.

---

## 1. 전역 레이아웃 규칙 및 공통 가이드라인

모든 화면은 **1920 × 1080 (16:9 FHD)** 캔버스 해상도를 기준으로 배치하며, '펼쳐진 책(2-Page Open Book)' 배경을 사용하는 화면(`CharacterSelectUI`, `CharacterCreateUI`)은 책의 물리적 구조를 침범하지 않도록 아래 **안전 여백(Safe Area)** 규칙을 엄격히 준수합니다.

| 구분 | 기준 영역 및 수치 (1920×1080 기준 권장값) | 레이아웃 제약 조건 |
| :--- | :--- | :--- |
| **책 전체 컨테이너 (`BookPanel`)** | 중앙 정렬 (`Anchor: Center`), 크기 약 `1040 × 640 px` | 배경 일러스트의 주요 오브젝트(좌하단 밭, 우하단 연못·슬라임)가 가려지지 않도록 크기 고정 |
| **좌측 페이지 안전 영역 (`LeftPage_SafeArea`)** | 좌측 나무 표지 및 종이 여백 안쪽 (`Left Padding ≥ 56 px`), 중앙 제본선 좌측 (`Right Padding ≥ 36 px`), 유효 폭 약 `410 px` | 모든 좌측 페이지 UI 요소는 종이 영역 밖이나 중앙 제본 링을 침범하지 않음 |
| **우측 페이지 안전 영역 (`RightPage_SafeArea`)** | 중앙 제본선 및 책갈피 끈 우측 (`Left Padding ≥ 44 px`), 우측 나무 표지 및 종이 끝단 안쪽 (`Right Padding ≥ 56 px`), 유효 폭 약 `400 px` | 우측 항목들이 오른쪽 나무 표지나 종이 테두리 밖으로 삐져나오지 않도록 안쪽(중앙 방향)으로 모아 배치 |
| **상단 헤더 현판 (`HeaderPlaque`)** | 책 상단 중앙 외곽(`PosY: +360 px` 부근), 크기 `460 × 76 px` | 기존의 검은색 반투명 그라데이션 바를 제거하고, 모든 서브 화면에서 동일한 나무 현판 리소스 사용 |
| **책갈피 뒤로가기 버튼 (`Btn_BackBookmark`)** | 책 좌측 페이지 상단 모서리(`BookPanel` 기준 좌상단 걸침 배치), 크기 `72 × 96 px` | 하늘에 떠 있던 기존 `◀ 뒤로` 버튼과 캐릭터 만들기의 좌하단 `◀ 뒤로` 버튼을 모두 제거하고 책갈피 탭 위치로 단일화 |

---

## 2. 화면별 UI 컴포넌트 수정 명세 (에이전트 구현 지시사항)

### 2.1. 메인 타이틀 화면 (`01_main_title` → `MainTitleUI`)

#### 현황 및 문제점
* 5개의 나무판 버튼 중 3·4번째 버튼이 텍스트 없는 빈 판자로 노출되어 미완성 인상을 주며, 배경의 버섯집 출입구와 연못 위 주황버섯·슬라임 일러스트를 가리고 있음.
* 모든 버튼의 시각적 비중이 동일하여 대표 행동(`새로하기`)의 위계가 드러나지 않음.

#### 에이전트 수정 작업 지시
1. **빈 나무판 슬롯 제거 및 4단(또는 3단) 압축**:
   * 미사용 중인 3·4번째 빈 버튼 엔티티를 `Enable = false` 처리하거나 제거합니다.
   * 버튼 구성을 `새로하기` / `이어하기` / `환경설정` / `종료하기` 총 4개(환경설정 미구현 시 3개)로 정리합니다.
2. **버튼 그룹 Y축 위치 조정 및 간격 축소**:
   * `ButtonGroup`의 `VerticalLayoutGroup` 간격(`Spacing`)을 `14 px`로 설정하고, 상단 버섯집 지붕과 출입구가 온전히 보이도록 그룹 전체 Y 좌표를 하단 중앙으로 정렬합니다.
3. **주 행동(Primary CTA) 버튼 하이라이트**:
   * 최상단 `새로하기` 버튼(세이브 데이터 보유 유저의 경우 `이어하기` 강조 가능)에 밝은 황금빛 우드 테두리 스프라이트(`UI_Btn_TitlePrimary`)와 좌측 작은 아이콘(검+새싹 도트 아이콘)을 적용합니다.

---

### 2.2. 캐릭터 선택 화면 (`02_main_slot_continue`, `04_main_slot_new` → `CharacterSelectUI`)

#### 현황 및 문제점
* 펼쳐진 2페이지 책의 중앙 제본선(스프링 및 책갈피 끈)을 가로질러 긴 슬롯 배너 5개를 일렬로 배치해 그래픽이 겹치고 어색함.
* `새로하기(빈 슬롯 선택)`와 `이어하기(캐릭터 선택)` 화면이 동일한 5슬롯 책 UI를 중복 사용하면서 버튼만 다르게 띄워 유저 동선이 분리됨.

#### 에이전트 수정 작업 지시
1. **좌·우 페이지 분리형 2열 슬롯 배치**:
   * 가로로 책 전체를 덮던 기존 슬롯의 폭(`Width`)을 절반 수준(`약 390 ~ 410 px`)으로 줄여 **중앙 제본선과 책갈피 끈을 완전히 비웁니다.**
   * **좌측 페이지 (`LeftPage_SafeArea`)**: 슬롯 1 ~ 3을 수직 배치 (`Spacing: 16 px`).
   * **우측 페이지 (`RightPage_SafeArea`)**: 슬롯 4 ~ 5 및 추후 확장용 잠금 슬롯(슬롯 6, 자물쇠 아이콘 표시)을 수직 배치.
2. **슬롯 내부 레이아웃 및 통합 인터랙션**:
   * **데이터가 존재하는 슬롯**: 좌측에 캐릭터 아바타 프리뷰, 중앙에 닉네임(Bold) 및 `Lv.XX · 직업명`, 우측 하단(또는 우측 끝)에 녹색 `이어하기` 버튼과 갈색 `삭제` 버튼을 함께 배치합니다.
   * **비어 있는 슬롯**: 상단에 `슬롯 N` 라벨을 작게 표시하고 중앙에 `+ 새 캐릭터 생성` 버튼을 배치하여, 유저가 어느 경로로 진입하든 빈 슬롯에서 즉시 캐릭터 생성 화면(`CharacterCreateUI`)으로 넘어갈 수 있도록 통합합니다.
3. **헤더 및 뒤로가기 교체**:
   * 상단 검은 그라데이션 바를 제거하고 나무 현판(`UI_Header_WoodPlaque`)에 `캐릭터 선택` 텍스트를 출력합니다.
   * 좌상단 하늘에 떠 있던 `◀ 뒤로` 버튼을 제거하고, 책 좌측 상단 모서리에 책갈피 리본 버튼(`UI_Btn_BookmarkBack`)을 부착합니다.

---

### 2.3. 캐릭터 삭제 확인 모달 (`03_main_delete_confirm` → `DeleteConfirmPopup`)

#### 현황 및 문제점
* 팝업 프레임으로 '펼쳐진 2페이지 책' 이미지를 축소 재사용하여, **`삭제 확인` 제목, 경고 문구, 닉네임 입력창 정중앙을 책 제본선과 끈이 세로로 관통**하며 가독성을 크게 해침.
* 팝업 오픈 시 후면 화면을 어둡게 눌러주는 딤(Dimmer) 처리가 없어, 뒤쪽 캐릭터 슬롯의 `삭제` 버튼들과 팝업이 시각적으로 뒤엉킴.

#### 에이전트 수정 작업 지시
1. **배경 암전 레이어 (`DimmerPanel`) 추가**:
   * `DeleteConfirmPopup` 최하단 자식으로 화면 전체(`1920 × 1080`)를 덮는 `DimmerPanel`을 배치합니다.
   * 색상 `RGBA(0, 0, 0, 0.58)`을 적용하고, 클릭 차단(`Raycast Target / Block Raycasts = true`)을 활성화해 팝업이 떠 있는 동안 뒤쪽 슬롯 버튼이 눌리지 않도록 막습니다.
2. **단일 양피지 모달 프레임 (`UI_Modal_SingleParchment`) 교체**:
   * 기존의 2페이지 축소 책 스프라이트를 제거하고, 중앙 제본선이 없는 **단일 양피지+나무 테두리 프레임**(크기 약 `520 × 340 px`)으로 교체합니다.
3. **타이포그래피 및 버튼 활성화 로직**:
   * 상단 타이틀 배너: `삭제 확인` (진한 고동색 `#3B2314`, Bold)
   * 안내 문구: 받침 유무에 상관없이 자연스럽도록 `삭제하려면 닉네임 'eeee' 입력` 또는 `삭제하려면 아래에 'eeee'을(를) 입력하세요`로 표기 (경고색 `#B83227`).
   * 입력 필드(`TextInput`): 플레이스홀더를 `닉네임 입력`으로 변경하고, 오목한 밝은 크림색 입력창(`#FAF3E3`)과 외곽선(`#C8B496`)을 적용합니다.
   * 버튼 인터랙션: 입력창의 문자열이 대상 캐릭터 닉네임과 정확히 일치할 때만 좌측 `삭제` 버튼(`#8C3B2B`)을 활성화(`Interactable = true`)하고, 불일치 시 반투명 비활성 상태를 유지합니다.

---

### 2.4. 캐릭터 만들기 화면 (`05_main_customize_account`, `06_main_customize_custom` → `CharacterCreateUI`)

#### 현황 및 문제점
* **우측 페이지 영역 이탈**: `헤어`, `얼굴`, `피부`, `상의` 선택 행과 `닉네임` 입력 배너가 오른쪽으로 지나치게 길어 **책의 종이 영역을 벗어나 우측 나무 표지 끝까지 침범**하고 있음.
* **헤더 및 뒤로가기 불일치**: 상단 헤더가 검은 그라데이션 바이고, `◀ 뒤로` 버튼이 좌측 페이지 하단에 배치되어 캐릭터 선택 화면과 UI 통일성이 떨어짐.
* **`<` `>` 화살표 명도 대비 역전**: `외형 꾸미기` 활성화 시 화살표 버튼 배경이 어두운 고동색으로 변해 검은색 `<` `>` 기호가 보이지 않음.
* **좌측 모드 버튼 선택 상태 모호**: `내 캐릭터 유지`와 `외형 꾸미기` 두 버튼의 색상이 거의 동일해 현재 선택된 모드를 구분하기 어려움.

#### 에이전트 수정 작업 지시
1. **상단 헤더 현판 및 책갈피 `◀ 뒤로` 버튼 통일**:
   * `CharacterSelectUI`와 동일한 좌표·크기로 상단에 나무 현판(`캐릭터 만들기`)을 배치하고, 책 좌상단 모서리에 책갈피형 `◀ 뒤로` 버튼을 배치합니다.
   * 기존 좌측 페이지 하단에 있던 `◀ 뒤로` 버튼은 제거하여 좌측 페이지 하단 여백과 일러스트 데코 영역을 확보합니다.
2. **우측 페이지 컴포넌트 폭 축소 및 중앙 방향 정렬 (종이 영역 이탈 방지)**:
   * 우측 페이지 컨테이너(`RightPage_Content`)의 가로 폭을 `360 ~ 380 px`로 줄이고, 우측 나무 표지로부터 최소 `56 px` 이상의 여백(`Right Margin`)을 확보하여 **모든 행이 크림색 종이 영역 내부에 여유 있게 들어오도록 안쪽(중앙 방향)으로 당겨 배치**합니다.
   * 각 커스터마이징 행(`Row_Hair`, `Row_Face`, `Row_Skin`, `Row_Top`)의 내부 구성을 `[좌측 라벨 (64 px)] + [< 버튼 (38 px)] + [중앙 선택값 텍스트 (180 px)] + [> 버튼 (38 px)]` 형태로 종이 폭 안에 깔끔하게 정렬합니다.
3. **좌측 페이지 프리뷰 단상 및 모드 스위치 탭 명확화**:
   * 캐릭터 프리뷰 도트 하단에 **잔디·나무 원형 단상(`UI_Preview_GrassPedestal`)** 스프라이트를 배치해 캐릭터가 줄노트 허공에 떠 보이지 않도록 고정합니다.
   * `내 캐릭터 유지` / `외형 꾸미기` 두 버튼을 라디오 탭(Toggle Group)으로 동작하게 구성합니다:
     * **선택됨 (Active)**: 밝은 리프 그린(`#58B832`) 배경 + 밝은 연두색 하이라이트 인라인 테두리 + 흰색 Bold 텍스트 (외곽선 `#235212`).
     * **비선택 (Inactive)**: 채도를 낮춘 회갈색(`#8A7F70`) 배경 + 연한 회백색(`#D8D0C5`) 텍스트로 눌리지 않은 상태임을 명확히 표현.
4. **우측 `<` `>` 화살표 버튼 명도 대비(Contrast) 수정**:
   * **`외형 꾸미기` 모드 (활성화 상태)**: `<` `>` 버튼 배경을 밝은 황토/우드 톤(`#C88A4B`, 테두리 `#6E421C`)으로 설정하고, 화살표 기호(`<`, `>`)는 밝은 크림화이트(`#FFFDF9`, 외곽선 `#4A2B10`)로 렌더링하여 시인성을 극대화합니다.
   * **`내 캐릭터 유지` 모드 (비활성화 상태)**: 외형 변경이 불가하므로 `<` `>` 버튼을 반투명 처리(`Alpha = 0.35`, `Interactable = false`)하고 중앙 텍스트는 `(계정 외형)`으로 표시합니다.
5. **닉네임 입력창(`Input_Nickname`) 디자인 분리**:
   * 상단 외형 선택 행과 동일한 배너 이미지를 쓰지 않고, 종이 안쪽에 파여 있는 **오목한 밝은 크림색 인풋 박스(`UI_Input_RecessedParchment`)**를 적용합니다.
   * 좌측 내부에 작은 **깃펜(Quill) 아이콘**을 배치하고 텍스트 시작 위치를 좌측 테두리에서 `36 px` 띄워(`Left Padding = 36`) 글자가 테두리에 붙지 않도록 설정합니다.

---

## 3. 커스텀 제작 필요 UI 리소스 목록 및 AI 생성 프롬프트

메이플스토리 월드 기본 프리셋에는 없는 **우드·양피지·코지 픽셀아트 풍 UI 에셋 9종**의 제작 사양과 이미지 생성 AI 프롬프트입니다.

> **리소스 제작 및 MSW 임포트 팁**
> * 투명 배경 추출(누끼)이 용이하도록 프롬프트에 **순백색(`#FFFFFF`) 단색 배경 분리 지시어**가 포함되어 있습니다. 생성된 레퍼런스 이미지를 배경 제거(Remove BG) 후 PNG로 저장해 바로 활용하거나, 프롬프트로 추가 변형을 생성하세요.
> * 가변 크기 패널(모달, 현판, 슬롯 카드, 인풋 박스, 버튼)은 메이플스토리 월드 Sprite 설정에서 `SpriteType = Sliced` (9-Slice)로 설정해 모서리 픽셀이 늘어나지 않도록 적용하세요.

| 번호 | 에셋 식별자 (권장 이름) | 적용 화면 | 권장 원본 크기 | MSW 9-Slice 보더 (L / R / T / B) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `UI_Modal_SingleParchment` | 삭제 확인 팝업 및 공용 알림창 | `520 × 340 px` | `32 / 32 / 32 / 32` |
| **2** | `UI_Header_WoodPlaque` | 캐릭터 선택, 캐릭터 만들기 상단 제목 | `460 × 80 px` | `48 / 48 / 20 / 20` |
| **3** | `UI_Btn_BookmarkBack` | 책 UI 좌상단 `◀ 뒤로` 책갈피 탭 | `72 × 96 px` | `Fixed (단일 스프라이트)` |
| **4** | `UI_Preview_GrassPedestal` | 캐릭터 만들기 좌측 아바타 발판 | `220 × 110 px` | `Fixed (단일 스프라이트)` |
| **5** | `UI_Input_RecessedParchment` | 캐릭터 만들기·삭제 확인 닉네임 입력창 | `360 × 52 px` | `44 / 16 / 14 / 14` |
| **6** | `UI_Btn_ArrowSquare` | 캐릭터 만들기 `<` `>` 화살표 버튼 | `40 × 40 px` | `Fixed (단일 스프라이트)` |
| **7** | `UI_Btn_TitlePrimary` | 메인 타이틀 대표 버튼 (`새로하기`) | `280 × 68 px` | `52 / 24 / 18 / 18` |
| **8** | `UI_Slot_HalfPageCard` | 캐릭터 선택/만들기 단일 페이지 내부 배너 | `380 × 92 px` | `24 / 24 / 18 / 18` |
| **9** | `UI_Btn_CommonStates` | 탭 스위치(Active/Inactive) 및 확인/삭제 버튼 | `160 × 48 px` | `18 / 18 / 14 / 14` |

### 에셋 1. 단일 양피지 모달 프레임 (`UI_Modal_SingleParchment`)
* **용도**: `03_main_delete_confirm`에서 기존 2페이지 책을 대체할 단일 평면 모달 프레임 (중앙 제본선 절대 없음).
* **영문 프롬프트**:
  > `Pixel art game UI modal window frame, single flat rectangular sheet of warm cream parchment paper framed by a cozy carved oak wood border with triangular wooden corner protectors, small dried autumn leaves and tiny sprout motifs on the inner corners, COMPLETELY FLAT center area with NO book spine and NO center crease, clean 9-slice friendly edges, 16-bit cozy farming RPG style like Stardew Valley and MapleStory, crisp pixel outlines, text-free, no labels, no watermarks, isolated on a solid flat white background.`
* **한글 설명/보조 프롬프트**:
  > `코지 도트 RPG 스타일의 단일 직사각형 팝업 프레임. 따뜻한 크림색 양피지 한 장을 나무 액자 테두리와 네 모서리 나무 장식이 감싸고 있는 형태. 중앙에 책 제본선이나 접힌 줄이 전혀 없는 깨끗한 평면 구조. 텍스트 없음, 단색 배경 분리.`

### 에셋 2. 상단 나무 현판 타이틀 배너 (`UI_Header_WoodPlaque`)
* **용도**: `캐릭터 선택`, `캐릭터 만들기` 화면 상단의 검은색 그라데이션 바를 대체하는 나무 현판.
* **영문 프롬프트**:
  > `Pixel art game UI title header banner plaque, horizontal carved warm brown wooden signboard with subtle wood grain texture, nailed edges, and small green pixel leaves and vine accents sprouting from the left and right sides, cozy fantasy farming RPG UI asset, flat empty center for placing title text, crisp pixel art, text-free, no letters, no watermarks, isolated on a solid flat white background.`
* **한글 설명/보조 프롬프트**:
  > `가로형 나무 현판 타이틀 UI 배너. 따뜻한 갈색 나뭇결이 살아있는 판자 형태이며 양옆 모서리에 작은 초록색 나뭇잎 장식이 돋아난 디자인. 중앙은 텍스트를 넣을 수 있도록 비어 있음. 텍스트 없음, 단색 배경 분리.`

### 에셋 3. 책갈피 리본형 뒤로가기 탭 (`UI_Btn_BookmarkBack`)
* **용도**: 펼쳐진 책 좌측 상단 모서리에 걸치는 세로 리본 형태의 `◀ 뒤로` 버튼 배경.
* **영문 프롬프트**:
  > `Pixel art game UI vertical bookmark ribbon tab, warm tan parchment and stitched leather bookmark with a V-cut swallowtail notch at the bottom and a folded top edge designed to hang over the top edge of an open book page, small dark brown left-pointing triangle arrow icon near the top, cozy pixel art RPG UI style, text-free, no letters, no watermarks, isolated on a solid flat white background.`
* **한글 설명/보조 프롬프트**:
  > `책 상단 모서리에 걸치는 세로형 양피지/가죽 책갈피 탭 UI. 하단이 역삼각형(제비꼬리 모양)으로 파여 있고 상단에 작은 좌측 방향 화살표(◀) 도트 아이콘이 그려진 디자인. 텍스트 없음.`

### 에셋 4. 캐릭터 프리뷰 잔디·나무 단상 (`UI_Preview_GrassPedestal`)
* **용도**: 캐릭터 만들기 화면 좌측 페이지에서 아바타 도트 발밑에 배치할 코지한 원형 발판.
* **영문 프롬프트**:
  > `Pixel art game UI character preview pedestal platform, small isometric oval wooden platform topped with lush green grass, tiny white wildflowers, a dirt path center, and a miniature rustic wooden fence along the back edge, 16-bit cozy farming RPG style, crisp pixel outlines, text-free, no characters, no watermarks, isolated on a solid flat white background.`
* **한글 설명/보조 프롬프트**:
  > `캐릭터 프리뷰용 타원형 미니 단상 도트 에셋. 둥근 나무 밑판 위에 초록 잔디와 작은 들꽃이 피어 있고 뒤편에 낮은 나무 울타리가 둘러진 아기자기한 귀농 컨셉 발판. 캐릭터 및 텍스트 없음.`

### 에셋 5. 오목한 텍스트 입력창 프레임 (`UI_Input_RecessedParchment`)
* **용도**: 닉네임 입력(`닉네임 2~15글자`) 및 삭제 확인 팝업 입력창을 일반 배너와 시각적으로 구분해 주는 인풋 박스.
* **영문 프롬프트**:
  > `Pixel art game UI text input box frame, horizontal rounded rectangle with a recessed inner shadow, bright cream-white paper interior and a dark brown pixel outline, featuring a small pixel art feather quill pen icon on the far left inside the box, empty right area for typing text, cozy fantasy RPG UI asset, text-free, no letters, no watermarks, isolated on a solid flat white background.`
* **한글 설명/보조 프롬프트**:
  > `가로형 텍스트 입력창 도트 UI 프레임. 안쪽이 살짝 파여 보이는(Inner Shadow) 밝은 크림화이트 배경에 짙은 갈색 테두리가 둘러져 있으며, 박스 좌측 내부에 작은 깃펜 아이콘이 배치된 형태. 텍스트 없음.`

### 에셋 6. 고대비 우드 화살표 버튼 (`UI_Btn_ArrowSquare`)
* **용도**: 캐릭터 만들기 우측 페이지의 `<` `>` 선택 버튼 (어두운 배경에 검은 화살표가 묻히던 문제 해결).
* **영문 프롬프트**:
  > `Pixel art game UI square arrow buttons set (left arrow button and right arrow button), warm golden-brown beveled wooden square buttons with dark brown pixel borders and a bright high-contrast cream-white chevron arrow (< and >) with a dark outline in the center, 16-bit RPG UI asset, crisp pixel art, text-free, no watermarks, isolated on a solid flat white background.`
* **한글 설명/보조 프롬프트**:
  > `정사각형 나무 화살표 버튼(<, >) 세트. 밝은 황금갈색 입체 나무 버튼 중앙에 진한 외곽선이 들어간 크림화이트 화살표 기호가 또렷하게 표시된 고대비 디자인.`

### 에셋 7. 메인 타이틀 하이라이트 나무 버튼 (`UI_Btn_TitlePrimary`)
* **용도**: 메인 타이틀 화면의 대표 버튼(`새로하기`)을 일반 나무판 버튼과 차별화하는 황금빛 우드 버튼.
* **영문 프롬프트**:
  > `Pixel art game UI primary menu button, horizontal wooden plank button with a warm golden-honey wood finish, glowing light-gold inner border highlight, and a small pixel art iron sword with a green leaf sprout icon on the left side, empty center for button text, 16-bit cozy adventure farming RPG style, text-free, no letters, no watermarks, isolated on a solid flat white background.`
* **한글 설명/보조 프롬프트**:
  > `메인 타이틀 주 행동(Primary CTA) 나무판 버튼. 따뜻한 황금빛 우드 톤과 밝은 인라인 하이라이트 테두리가 적용되어 있으며, 좌측에 작은 검과 새싹이 결합된 도트 아이콘이 들어간 형태. 중앙 텍스트 없음.`

### 에셋 8. 단일 페이지 폭 맞춤 양피지 슬롯/옵션 배너 (`UI_Slot_HalfPageCard`)
* **용도**: 책 한쪽 페이지 내부 폭(`360 ~ 390 px`)에 딱 맞게 들어가며 종이 테두리를 침범하지 않는 슬롯/옵션 배경 배너.
* **영문 프롬프트**:
  > `Pixel art game UI horizontal parchment banner strip, warm beige aged paper rectangle with subtle decorative corner notches and soft inner border, compact width designed to fit neatly inside a single book page column, 16-bit RPG UI asset, completely blank center, text-free, no labels, no watermarks, isolated on a solid flat white background.`
* **한글 설명/보조 프롬프트**:
  > `책 한쪽 페이지 내부에 들어가는 가로형 양피지 카드 배너. 모서리에 작은 홈 장식이 있는 따뜻한 베이지색 양피지 직사각형으로, 중앙이 완전히 비어 있는 9-Slice 대응 에셋.`

### 에셋 9. 공용 액션 및 모드 토글 버튼 4종 세트 (`UI_Btn_CommonStates`)
* **용도**: 캐릭터 만들기 탭 전환(`외형 꾸미기` Active 연두색 / `내 캐릭터 유지` Inactive 회갈색) 및 주요 액션(`모험 시작`/`이어하기` 올리브그린, `삭제` 적갈색) 버튼 프레임.
* **영문 프롬프트**:
  > `Pixel art game UI button sprite sheet isolated on a pure solid flat white background (#FFFFFF) showing 4 horizontal blank rounded pill/beveled buttons arranged in a neat 2x2 grid: 1) Bright leaf-green active toggle button with a glowing light-green inner border and dark green pixel outline, 2) Muted gray-brown inactive toggle button with a soft border, 3) Warm olive-green primary action button with beveled edge, 4) Deep rust-red/brown destructive action button. Completely blank centers with NO text, no labels, no watermarks.`
* **한글 설명/보조 프롬프트**:
  > `공용 액션 및 토글 상태 버튼 4종 도트 스프라이트 시트(단색 흰 배경 분리). 좌상단: 활성 탭(밝은 연두색+인라인 하이라이트), 우상단: 비활성 탭(채도 낮은 회갈색), 좌하단: 주 실행 버튼(올리브 그린 입체 버튼), 우하단: 삭제/경고 버튼(적갈색 입체 버튼). 텍스트 없음.`