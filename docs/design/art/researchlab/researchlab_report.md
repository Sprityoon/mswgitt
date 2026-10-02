# 마을 버섯 건물 교체 — [연구소(Research Lab)] 투명화 최종 완료 보고서

> **기준 에셋**: 마을 대장간 공식 스프라이트 (`RUID: 3cf6b9e903e645c295fadfa6bb0548b0`, 356 × 248 px)  
> **신규 제작**: 연금술/마법 연구소 버섯 하우스 (`356 × 248 px`, 투명 RGBA, 정면 탑다운 뷰, 내부 고립 영역 투명화 완벽 처리)

---

## 1. 세부 투명화 처리 결과

- **수정 요청**:
  - 좌측 허브 건조대 사이의 흰색 공간
  - 우측 연금술 테이블 다리 및 선반 사이사이의 빈 공간
- **처리 내역**:
  1. **허브 건조대**: 나무 걸이와 묶여있는 허브 줄기/잎사귀 사이의 갇힌 배경(Area: 798, 620, 14 픽셀)을 정밀 검출하여 투명(Alpha=0)으로 제거.
  2. **연금술 테이블**: 테이블 상판과 가로 지지대 사이(Area: 346 픽셀), 테이블 다리 4개 사이 및 바닥 접지 공간(Area: 4206 픽셀), 시약병 거치대 사이 빈 틈을 전부 투명하게 관통 처리.
  3. **외곽선 마감**: 프레임 안쪽의 경계선도 동일하게 따뜻한 짙은 갈색(`#4a2a1c`) 디프린지와 부드러운 서브픽셀 AA를 적용하여 흰 테두리 없이 잔디/돌길 지형이 자연스럽게 투과되도록 마감.

---

## 2. 대장간 vs 최종 투명화 연구소 비교 검증 시트

![Research Lab Front Comparison Sheet](file:///C:/Users/윤민호/.gemini/antigravity-ide/brain/c9ad8fa4-2c5f-44c6-91ed-f2d4373c8c0b/researchlab_front_comparison.png)

---

## 3. 에셋 스펙 및 피벗

| 항목 | 수치 / 내용 |
|---|---|
| **캔버스 규격** | **`356 × 248 px`** (대장간 공식 스프라이트와 1:1 동일) |
| **바운딩 박스** | 가로 265px × 세로 238px (중심 정렬, 하단 접지 여백 2px) |
| **권장 피벗(Pivot)** | **`(0.5, 0.0)`** (하단 중앙 접지점) |
| **포맷** | 32-bit PNG (RGBA, 투명 배경 및 내부 홀 투명화 완료) |

---

## 4. 최종 납품 파일

- **🌟 [완성본] 연구소 스프라이트**: [researchlab_front_clean.png](file:///c:/minho/메이플월드/docs/design/art/researchlab/researchlab_front_clean.png)
- **비교 검증 시트**: [preview_front_comparison.png](file:///c:/minho/메이플월드/docs/design/art/researchlab/preview_front_comparison.png)
- **투명화 처리 스크립트**: [fix_holes.py](file:///c:/minho/메이플월드/docs/design/art/researchlab/fix_holes.py)
