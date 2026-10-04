# 빨간 우체통 맵 오브젝트 에셋 (Red Mailbox Map Object)

공식 메이플 리소스 RUID(`27efc79bbf9648b4aac710348c1b879e`)를 기반으로 생성된 맵 오브젝트 모델과, 높이 128px 기준으로 선명하게 다시 그린 고해상도 리드로우 에셋 모음입니다.

---

## 1. 종합 비교 프리뷰 시트

> **비교 시트**: [`docs/design/art/mailbox/preview_mailbox_comparison.png`](file:///d:/메이플월도/docs/design/art/mailbox/preview_mailbox_comparison.png)

![우체통 비교 시트](file:///d:/메이플월도/docs/design/art/mailbox/preview_mailbox_comparison.png)

---

## 2. 생성된 모델 사양 (.model)

- **모델 파일**: [`RootDesk/MyDesk/MapObjects/Models/Prop_Mailbox.model`](file:///d:/메이플월도/RootDesk/MyDesk/MapObjects/Models/Prop_Mailbox.model)
- **현재 적용 RUID**: `27efc79bbf9648b4aac710348c1b879e` (공식 원본 48×56)
- **컴포넌트 구성**:
  - `MOD.Core.TransformComponent`: 기본 Scale `(1.5, 1.5, 1.0)`
  - `MOD.Core.SpriteRendererComponent`: SortingLayer `MapLayer5`, Order 2
  - `script.YSortSprite`: 동적 Y 정렬 (캐릭터 및 NPC와 자연스러운 앞뒤 겹침)
  - `MOD.Core.TriggerComponent`: 상호작용용 트리거 영역 (`BoxSize: (0.6, 0.9)`, `ColliderOffset: (0, 0.3)`)
  - `MOD.Core.PhysicsColliderComponent`: 지지대 기둥 충돌체 (`BoxSize: (0.3, 0.3)`)

---

## 3. 에셋 목록 및 스펙 비교

| 구분 | 파일명 | 해상도 (W×H) | 특징 |
|:---:|:---|:---:|:---|
| **원본** | [`mailbox_original_48x56.png`](file:///d:/메이플월도/docs/design/art/mailbox/mailbox_original_48x56.png) | 48 × 56 px | 공식 MSW 원본 스프라이트 (픽셀이 다소 거칠고 작은 규격) |
| **HD 128** | [`mailbox_hd_128.png`](file:///d:/메이플월도/docs/design/art/mailbox/mailbox_hd_128.png) | **108 × 128 px** | **높이 128px 기준 선명한 메이플 카툰 일러스트** (하트/편지봉투/둥근 지붕 디테일 극대화) |
| **도트 128** | [`mailbox_pixel_128.png`](file:///d:/메이플월도/docs/design/art/mailbox/mailbox_pixel_128.png) | **108 × 128 px** | 지형 타일 도트 밀도와 맞춘 **메이플 도트화(Pixelize) 마감** |

---

## 4. 고해상도 스프라이트 등록 및 모델 RUID 교체 방법

1. **Maker 리소스 가져오기**:
   - MSW Maker 실행 -> 상단 `[내 리소스] -> [가져오기]`
   - [`docs/design/art/mailbox/mailbox_hd_128.png`](file:///d:/메이플월도/docs/design/art/mailbox/mailbox_hd_128.png) 또는 `mailbox_pixel_128.png` 선택하여 등록
2. **피벗 설정**:
   - **하단 중앙 `(nx: 0.5, ny: 0.0)`** 지정 (기둥 끝이 지면에 닿도록)
3. **모델 RUID 교체**:
   - 등록 후 발급받은 새 RUID를 [`Prop_Mailbox.model`](file:///d:/메이플월도/RootDesk/MyDesk/MapObjects/Models/Prop_Mailbox.model)의 `SpriteRendererComponent.SpriteRUID`에 입력 (또는 모델 인스펙터에서 새 스프라이트 드래그)
   - 고해상도(128px) 적용 시 모델 `TransformComponent.Scale`을 `(1.0, 1.0, 1.0)`으로 변경하시면 완벽한 비율로 연출됩니다.
