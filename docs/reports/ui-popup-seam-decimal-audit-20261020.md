# 팝업 실금 — 소수 좌표 정적 점검 (2026-10-20)

요청: 여러 팝업에 남은 미세한 실금이 소수점 이하 수치 때문인지 확인.

## 확인 결과

- UIBuilder로 UI 11개 파일, 엔티티 1,996개를 읽음. 스킨 76개 / 조각 504개.
- 조각의 RectSize·anchoredPosition·OffsetMin/Max에 소수 값 없음. 부모 앵커·피벗을 재귀 반영한 1920×1080 기준 경계도 전부 정수(비정수 0개).
- Skin 및 조각의 명시 RectSize와 부모 크기·앵커·Offset으로 계산한 크기 불일치 0개.
- 9조각 판 46개: 가운데와 상하좌우 가장자리의 기하학적 겹침 모두 4px.
- 스킨 상위 체인 UIScale·Scale 전부 1, Rotation 전부 0. 조각 SpriteGUIRenderer LocalPosition 0, LocalScale 1.
- 예: 가방 가운데 조각은 820×524, anchoredPosition (0,-4), OffsetMin (40,84), OffsetMax (-40,-92). 기존 겹침 보정은 파일에 남아 있음.
- 일부 아이콘·제목·HUD에는 소수 값이 있으나 공통 팝업 프레임 조각의 좌표가 아님. 예: 워프 제목 (9.9998,158.0002), 모루 Divider의 높이 3 때문에 생긴 ±0.5 경계. 이것을 일괄 반올림할 근거는 없음.

## 판단과 남은 확인

파일에 저장된 소수 좌표 또는 크기 불일치가 공통 실금의 원인이라는 증거는 없다. 실제 표시 해상도로 스케일되면 정수 UI 좌표도 물리 화면에서 소수 픽셀 위치가 될 수 있으므로 렌더 단계의 영향까지 배제한 결과는 아니다.

현재 BP.blueprintatlas 및 대응 packedatlas에 팝업 프레임 9조각 전부가 포함되어 있고 padding=4, filtermode=2다. 이 값의 의미·필터 영향은 이번 검사에서 확정하지 않았다. 조각별 이미지 경계/색 차이, 아틀라스 샘플링과 화면 축소를 다음 대조 대상으로 둔다. 기존 로컬 조립 미리보기만 확인했으며 현재 Play 화면 재현 증거는 수집하지 않았다.

게임 파일·스프라이트·아틀라스 설정은 변경하지 않음. Maker get_current_map: status ok, map01, edit. 읽기 전용 진단이므로 refresh/build 및 Play는 수행하지 않음. 실제 실금 원인은 미확정, 해결 주장 없음.

## 후속: 원본 픽셀·화면 축소·아틀라스 점검

- 실행 도구: scratch/audit_ui8_seams.py (Pillow). 게임 에셋을 읽고 scratch/ui8-seam-audit/에만 비교 PNG와 pixels.json 생성.
- popup_frame 원본 c(483×97), t(483×96), b(483×88): 모든 화소 alpha=255. 내부 수평 절단선의 원본 RGB 최대 차이: 위 4/255, 아래 3/255(평균 최대 채널 차이 0.72/0.46). 원본 자체에 투명한 수평 틈은 없음. l/r의 투명 화소는 외곽 실루엣이므로 전체를 불투명하게 만드는 방식은 부적절.
- 현재 4px 겹침 순서로 900×700 합성. Point/Bilinear·겹침 0/4 비교 이미지 생성 및 시각 확인. 가로 접합부에 뚫린 선은 재현되지 않음(미세한 원본 질감 차이는 있음).
- 합성한 판을 화면 폭 960·1280·1440·1920 비율(0.5·2/3·0.75·1)로 Bilinear 축소: 종이 내부 alpha 범위 모두 255~255(assert 통과). 이는 합성 후 축소하는 Pillow 검사이며, 조각별 GPU 래스터화·아틀라스 UV·밉맵·압축은 재현하지 않음. 따라서 실게임의 소수 픽셀/색 실금까지 배제하는 증거가 아님.
- BP.blueprintatlas / 대응 packedatlas: 2048×2048, padding=4, filtermode=2. MSW 공식 Command Console 문서 필터 열거는 0 Point / 1 Bilinear / 2 Trilinear. padding 4는 AtlasBlueprint 공식 권장값. 패딩을 틀린 값으로 단정하지 않음.
- 실제 리소스 메타데이터 조회: useratlas b784e516503047b5a92fdff8cc003b22 존재, 버전 6ad7275cd303be7be2875a90. 가운데 조각 버전 6ad3301d4d4cb431f4317066은 로컬 .sprite 및 packedatlas 참조와 일치. 아틀라스 썸네일 API는 available=false여서 실제 패킹 텍스처의 가장자리 화소·밉맵은 확인 못 함.
- Maker MCP help 조회: 현재 명령 목록에 아틀라스 Pack/필터 변경 명령 없음. 계정 리소스 수정·재업로드·Play·입력·화면 캡처는 수행하지 않음.

### 다음 대조를 위한 구체적 조건

Maker AtlasBlueprint Editor에서 기존 BP 선택 → padding 4와 나머지 조건은 유지 → Filter Mode만 Trilinear에서 Bilinear로 변경 → Pack → 같은 팝업·같은 화면 크기로 제작자 Play 대조. 선이 사라지면 아틀라스 필터 경로에 원인이 있다는 근거가 된다. 그대로면 필터를 원래 값으로 돌려 비교하며 실제 접합부 화소를 조사해야 한다. 이번 턴은 원인 후보를 좁힌 진단이며, 필터가 원인이라고 확정하거나 실금이 해결됐다고 주장하지 않는다.

출처: [MSW AtlasBlueprint](https://maplestoryworlds-creators.nexon.com/ko/docs/?postId=1039), [MSW Command Console 필터 열거](https://maplestoryworlds-creators.nexon.com/en/docs/?postId=1195), [Unity mipmap과 Trilinear](https://docs.unity.com/en-us/engine/6000.5/manual/materials-and-shaders/textures/textures-getting-started/texture-mipmaps-introduction). Unity 문서는 필터 일반 원리의 참고이며 MSW의 밉맵 활성 상태를 입증하지 않는다.

## 제작자 재패킹 후 확인

- 로컬 BP.blueprintatlas 및 대응 packedatlas 모두 filtermode=1(Bilinear), padding=4, 2048×2048. 로컬 수정 시각 2026-10-20 19:24:55 KST.
- 원본 목록과 패킹 결과의 RUID 110개가 정확히 일치(누락 0·추가 0). 팝업 프레임 9조각 모두 포함, 조각 버전 참조 유지.
- 서버 useratlas 메타데이터는 직전 조회와 같은 버전 6ad7275cd303be7be2875a90 / 수정 시각 17:33:32 KST. 필터가 로컬 설정으로 적용되는지, 서버 반영 지연인지 이 조회만으로 구분 못 함. 이를 재패킹 실패로 단정하지 않음.
- Maker normal 로그 987개 중 atlas/packing/패킹/아틀라스/해당 RUID 관련 기록 0건. 패킹 성공·실패를 로그로 판정할 근거 없음.
- 로컬 Bilinear 설정 반영까지 확인. 실제 Play 화면의 실금 개선 여부는 제작자 답변 대기. 에이전트는 Play·입력·캡처·리소스 변경을 수행하지 않음.

## 실제 정보창 Play 캡처 및 런타임 대조 (제작자 요청)

2026-10-20 19:28~19:32 KST. Maker map01 edit → Play → 정보창 UICharacterController.Open → 비교 → Stop. 저장 슬롯은 선택하지 않았고, 메뉴를 클라이언트에서 잠시 숨겨 프레임을 관찰했다. 캐릭터 수치/장비 검증은 수행하지 않았다.

- 원본 캡처: scratch/ui8-seam-audit/capture-before.png (896×504, MCP simulated resolution 1920×1080). 팝업 아래쪽 수평선과 좌우 수직선이 실제로 보임.
- 런타임 확인: popup Scale/UIScale 모두 (1,1,1), c=1150×524, b=1150×88. 저장 값에 있던 4px 겹침 크기가 런타임에도 반영돼 있음.
- x=450의 종이 정상색은 RGB (242,231,203), 원본 선 y=374는 (185,177,155). 즉 실제 어두운 1픽셀 선이다.
- 가장자리 조각 숨김(center-only): 기존 y=374의 어두운 선이 없어짐. 가장자리 조각을 되살리고 c를 마지막에 그림(center-last): 선이 y=375로 이동, RGB (197,188,165). 선이 맨 위 조각 사각 경계에 따라 이동함.
- 캡처 비율 896/1920 기준으로 각 조각의 전역 경계를 반올림해 Offset/RectSize/anchoredPosition을 일치시킨 런타임 대조(snapped)에서도 y=375 RGB (191,183,160) 선이 남음. 캡처 배율을 기준으로 한 진단이므로 엔진 실제 render target의 완전한 픽셀 정렬을 보증하는 테스트는 아님.
- b/l/r를 c와 같은 불투명 종이 RUID로 바꾼 대조(same-texture)에서도 y=375 RGB (191,183,160)으로 유지. 원본 상하 조각 사이 색 차이만으로는 설명되지 않음.
- 결론: 파일의 소수점 오차보다 조각별 렌더링 사각 경계에서 발생하는 어두운 선으로 범위를 좁힘. 아틀라스 UV/알파/샘플링 중 어느 내부 단계인지는 미확정. 순서 변경·캡처 배율 반올림은 해결책이 아님.
- 실제 캡처 5장과 확대 비교 actual-bottom-comparison.png 보존. 런타임 probe [VRF][SEAM-AB] 4건 확인. 해당 19:28 이후 Error 로그 0. 기존 build 스냅샷은 18:40:57로 신규 빌드 성공 증거로 사용하지 않음.
- 임시 변경은 메모리에서만 수행했고 Play Stop으로 종료했다. .ui/.mlua/아틀라스/계정 리소스 변경 없음. 실금 해결 주장은 하지 않음.
