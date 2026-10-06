# 공사장 표지판 & 시설물 에셋 팩 및 상호작용 시스템

> **테마**: 메이플 감성 코지 탑다운 공사장 표지판, 안전 차단물 및 현장 소품  
> **뷰/구도**: **완전 정면(Front Orthographic 2D)** — 게임 내 기존 건축물/가구와 100% 동일한 정면 뷰  
> **규격**: RGBA 투명 배경, 디프린지 및 관통 홀(Hole) 투명화 완료, 메이플 카툰 픽셀 마감  

---

## 1. 스프라이트 에셋 목록 (총 17종)

저장 경로: [`docs/design/art/construction/`](file:///c:/minho/메이플월드/docs/design/art/construction/)

| 파일명 | 권장 크기 / 피벗 | 설명 및 특징 |
|---|---|---|
| `board_notice_roof.png` | `350×358` (Pivot 0.5, 0.0) | 지붕 위 안전모 쓴 귀여운 고양이가 있는 대형 목재 알림판 (공사 청사진/메모지/전구/화분) |
| `sign_mushroom_triangle.png` | `271×340` (Pivot 0.5, 0.0) | 안전모 쓴 주황버섯 삼각 주의 표지판 |
| `barricade_wood_lights.png` | `433×329` (Pivot 0.5, 0.0) | 양쪽 기둥 위에 경광등이 달린 2단 안전 목재 바리케이드 |
| `barricade_cone_bar.png` | `389×159` (Pivot 0.5, 0.0) | 안전 라바콘 2개를 가로 줄무늬 바로 연결한 차단선 |
| `stand_slime_caution.png` | `153×161` (Pivot 0.5, 0.0) | 안전모 쓴 파란 슬라임 A자 접이식 CAUTION 스탠드 |
| `stand_slime_caution_sq.png` | `131×156` (Pivot 0.5, 0.0) | 안전모 쓴 파란 슬라임 사각 스탠드 표지판 |
| `easel_chalkboard.png` | `240×272` (Pivot 0.5, 0.0) | 덩굴 꽃 장식 미니 칠판 스탠드 (포크레인 낙서/화분) |
| `barrel_safety_beacon.png` | `145×222` (Pivot 0.5, 0.0) | 상단에 노란 경광등이 반짝이는 안전 줄무늬 드럼통 |
| `banner_construction.png` | `409×253` (Pivot 0.5, 0.0) | 목재 기둥 사이 "UNDER CONSTRUCTION" 가로 천 배너 |
| `pile_materials.png` | `389×239` (Pivot 0.5, 0.0) | 파란 방수포 덮인 벽돌 자재 더미, 나무 상자, 공구함 |
| `sign_wood_ribbon.png` | `292×307` (Pivot 0.5, 0.0) | 리본 현판과 깃발이 달린 목재 "UNDER CONSTRUCTION" 팻말 |
| `sign_tools_square.png` | `222×333` (Pivot 0.5, 0.0) | 곡괭이와 삽 픽토그램 사각 스탠드 표지판 |
| `barricade_stripe.png` | `306×191` (Pivot 0.5, 0.0) | 주황/흰색 줄무늬 기본 안전 바리케이드 |
| `signpost_direction.png` | `172×355` (Pivot 0.5, 0.0) | 알록달록 목재 화살표 방향 팻말 기둥 |
| `traffic_cones_group.png` | `273×186` (Pivot 0.5, 0.0) | 데이지 꽃과 풀잎이 어우러진 라바콘 3종 세트 |
| `concrete_barrier.png` | `180×120` (Pivot 0.5, 0.0) | 공사장 콘크리트 방호벽 (저지 블록) |
| `pole_hardhat_blueprint.png` | `226×356` (Pivot 0.5, 0.0) | 안전모와 설계도(청사진) 롤이 걸린 현장 기둥 |

---

## 2. 검증 시트 미리보기

- **[미리보기 시트]**: [`preview_construction_sheet.png`](file:///c:/minho/메이플월드/docs/design/art/construction/preview_construction_sheet.png)
  - 상단: 인게임 잔디 타일 위 배치 조화 점검
  - 하단: 체커보드 배경 투명도 및 내부 관통 홀(Hole) 점검

---

## 3. 인게임 F키 상호작용 컴포넌트

- **스크립트**: [`ConstructionSignInteract.mlua`](file:///c:/minho/메이플월드/RootDesk/MyDesk/MapObjects/Scripts/ConstructionSignInteract.mlua)
- **주요 기능**:
  - 플레이어가 다가가면 하단 HUD에 `"F: 표지판 읽기"` 가이드 라벨 자동 표시 (`PlayerController:ReadInteractLabel` 연동)
  - `F` 키 입력 또는 모바일 상호작용 버튼 클릭 시 작동
  - **대화창 모드 (`UseDialog = true`)**: 메이플스토리 공식 하단 대화창(`UIDialogController`)을 열어 페이지별 안내문 출력
  - **토스트 모드 (`UseDialog = false`)**: 화면 상단 퀘스트 토스트로 간략 안내문 팝업
- **커스터마이징 프로퍼티**:
  - `InteractLabel`: 조준 시 표시될 문구 (기본: `"표지판 읽기"`)
  - `SignTitle`: 대화창 발화자 이름 (기본: `"공사 안내판"`)
  - `Page1`: 1페이지 내용 (예: `"🚧 [공사 중] 현재 이 구역은 개발이 진행 중입니다."`)
  - `Page2`: 2페이지 내용 (예: `"새롭고 멋진 모험 구역으로 찾아뵐 예정이니 기대해 주세요! 🛠️"`)
  - `Page3`: 3페이지 내용 (선택 사항)
