# 농사 확장·중단 작업 인계 (2026-10-22)

## 추적 결과

- 작업 시작 HEAD 68efe23. Claude의 미커밋 요리·퀘스트·NPC·맵 변경은 유지했다. RootDesk/MyDesk의 CSV·스크립트와 docs/tasks.md, farming-quest-loop.md 및 등록 RUID 맵을 대조했다.
- 이미 추가된 ResolveCropBlockOrigin/GetPlaceFootprint=2, 클라이언트 요청·미리보기 및 서버 2×2 밭 검증을 재사용한다. 냄비 아이콘 a2e014bf3a26458b904efd9781238e5d는 item_dataset·RecipeDataSet·Item_CookingPot에 이미 연결돼 있었다.
- 수정 전 Maker Play 캡처: maker_play_20261022_175859_473.png, maker_play_20261022_180044_609.png, maker_play_20261022_183620_055.png(출력 위치: 사용자 AppData/LocalLow/nexon/MapleStory Worlds/McpScreenshots). 당근 그림의 바닥이 밭 중심 아래로 내려가 보임을 확인했다. 초기 메뉴 상태는 활성 슬롯0, 이후 런타임 TestModeConfig를 켜서 기존 격리 슬롯101로 전환했다. 실제 저장 슬롯1~5를 테스트에 사용하지 않았다. 진단 스니펫의 GetActiveItem(없는 메서드), 메뉴 컨트롤러 위치 추정에서 각각 1건 오류를 냈으며 제품 코드 오류와 구분한다. 잘못된 프로브는 반복하지 않았다.

## 구현

- CropDataSet.VisualOffsetY=0.435: PNG 중앙 피벗64px와 바닥선122px 차이58px ×0.75 ÷100. 그림 바닥을 2×2 밭 중심에 놓는다. GetCropPlantPosition을 파종·복원·씨앗 미리보기에서 공유. 논리 점유/저장은 기존 원점 좌표를 유지한다. 씨앗 주머니 대신 실제 첫 단계 그림을 미리보기로 사용한다.
- Crop_Carrot 기반 ModelBuilder 복제로 신규 모델5개. 전부 점유0..1×0..1, 스케일0.75, BlocksMovement=false. 기존 당근 모델도 현재 데이터의 첫 단계 RUID/배율로 갱신. 작물6종 총24장의 등록 그림을 연결했다.

| 작물 | 최초 성장 | 수확 | 씨앗 가격 | 수확물 판매가 | 재수확 |
|---|---:|---:|---:|---:|---|
| 당근 |45초|1~3|10|5|없음|
| 밀 |90초|2~4|10|5|없음|
| 감자 |180초|2~5|16|8|없음|
| 토마토 |240초|2~3|25|10|2단계 복귀, 기본180초|
| 딸기 |450초|1~3|50|20|3단계 복귀, 기본270초|
| 황금 호박 |1200초|1~2|100|60|없음|

- 씨앗5종은 토리(barnkeeper)의 씨앗 품목. 초기화 주문서의 가격/구매 제한 정책을 변경하지 않았다.
- 수확물5종은 등록된 성숙 작물 그림을 아이콘으로 사용한다(별도 수확물 아이콘 추가 제작 없음). item_dataset의 Name 키와 기존 Item_Grass 드롭 모델 경로를 재사용한다.
- 요리4종 추가: 밀죽(밀2/8초), 구운 감자(감자2/8초), 딸기 타르트(딸기2·밀2·달걀1/12초), 황금 호박 수프(황금 호박1·당근1/15초). 기존 음식 아이콘·채집/이동 버프를 재사용한다. 새 요리 전용 그림과 새 버프 종류는 만들지 않았다. 오믈렛의 부재료는 토마토1, 야채 볶음은 감자1·당근1·토마토1. 당근 수프/온보딩 재료는 보존했다.
- 물뿌리개: 토리30코인 또는 나무2·돌2로 제작, 퀵슬롯 선택 후 작물 조준 Ctrl. 단계마다 한 번 반 단계 시간 가속(정수 초). 성숙/같은 단계 중복 거절. 가속으로 단계가 넘어가도 연타 재가속을 막는다.
- 퇴비: 토리8코인 또는 풀3·달걀1로 제작, 작물 조준 Ctrl. 성공 때만1개 소비, 최소 수확량+1. 같은 수확 주기 중복/성숙 후 사용은 거절. 원안의 미구현 가축 부산물 대신 실제 재료를 사용했다.
- 물뿌리개 손 그림은 아바타 아이템이 아닌 sprite이므로 CostumeManager에 넘기지 않고 밭 조준 미리보기로 연결했다. 퇴비도 아이콘 미리보기. 새 아바타 모션은 만들지 않았다.
- 토마토·딸기는 수확 후 엔티티/점유를 유지하고 RegrowStage로 복귀. 물주기·퇴비는 수확 주기마다 초기화. 원안의 표시 단계와 재수확 시간 계산이 서로 맞지 않아 현재 ComputeStage 규칙에 맞춰 **실제 표시 단계2/3**을 우선한다(따라서 기본 재수확180/270초, 물주기·비 가속 별도).
- Crop.PersistState: 기존 배치 JSON의 plantedAt/wateredStage/isFertilized와 GridToEntity.plantedAt 갱신, 영지 소유자 dirty. 복원 시 필드 주입, 구 세이브 공란은0/false. 비 가속도 같은 저장 경로로 보존. DataStorage 신규 호출·추가 Yield 없음.
- ServerRequestCropCare: sender/선택 키/소유/거리3.5/전방/영지 mine 권한/쿨다운0.25 검증. 마을 사용 금지. 작물 외 타격은 사용 안내 후 종료.

## 검증

- scripts/test_farming_20261022.cjs PASS: 실제 mLua 메서드를 Fengari Lua에서 실행. 단일 밭4칸×방향9종의 원점 동일, 바깥 거절, 공용 위치, 6종 단계/성숙/최소수확, 물주기·퇴비 중복, 재수확, 배치 상태 저장, 서버 위조 caller/선택/거리·성공 때만 소비. 작물→아이템→판매→레시피·등록 스프라이트 참조 대조.
- 관련 mLua5개 LSP Error0/Warning0. 최종 미리보기 변경 후 PlayerController 재검사도0/0.
- check_dataset_columns.cjs: 실제367/동적 추적불가255/없는열0, 설정1/불일치0. 추적불가는 전수 검증을 뜻하지 않는다.
- ModelBuilder6종 validation 오류0. 신규 아이템16행, 총144행. 기존128행 중 변경은 Carrot Seed의 PreviewRUID/PreviewScale/FootprintSize뿐(시작 시점 스냅샷 대비).
- refresh status ok. 최신 build **2026-10-22 18:44:32 KST, Error0/Warning16(기존)/Info973**. git diff --check 통과.
- 수정본 Play 재시작은 자동 승인 검토가 거절: '현재 턴에 개발자가 요청하지 않은 Play 실행 금지'. 우회하지 않았다. **수정 전 캡처와 수정본 정적/빌드 검증을 구분하며, 수정본 Play는 승인 대기.**

## 수정본 Play 확인 순서

1. 런타임 TestModeConfig를 서버/클라에서만 켜고 격리 슬롯101로 진입(디스크 기본 false는 유지).
2. 단일2×2 밭을 만들고 씨앗 조준을 네 칸·상하좌우에서 확인. 미리보기/파종된 당근의 뿌리가 밭 중심에 있는지 캡처. 재접속 복원도 비교.
3. 신규5종 실제 파종·단계 교체·성숙 수확. 토마토/딸기 줄기 유지와 다음 주기 확인.
4. 물주기/퇴비 Ctrl 성공·중복·미성숙/성숙·퇴비 수량, 저장 복원. 토리 구매 수량/가격, 냄비10종 요리와 재료 소비/수거, 기존 당근 퀘스트 회귀.
5. 테스트 종료 뒤 Stop. 테스트 모드가 디스크 false인지 확인.

## 2026-10-22 Play 후속 — 설치 등록 덮어쓰기 수정

제작자의 Play/캡처 허용 후 격리 슬롯101 진입. 네 조준 셀 모두 원점(2,0)→그림 위치(3,1.435)를 반환하고 실제 TryMine 파종도 같은 좌표였으나, 다음 서버 조회에서(3,1.0)으로 되돌아감을 재현했다. AddPlacedFurniture가 GetOccupiedAnchorPosition으로 보정 좌표를 덮는 원인 확인. 설치 등록에도 GetCropPlantPosition을 적용했고 실제 AddPlacedFurniture 본문 회귀 검사를 추가해 PASS. LSP0/0, refresh ok, build18:52:50 Error0/Warning16/Info973. 재확인 Play 진행 중.

### Play 증거 (18:53~18:59)

- 격리 슬롯101에서 새 당근 TryMine → 실제 파종/등록/성숙 후(3,1.435) 유지. 네 칸의 공용 원점 동일 확인. [수정 전](farming-20261022/before.png) · [수정 후](farming-20261022/after.png) · [6종 성숙](farming-20261022/six-crops.png) · [요리 UI](farming-20261022/cooking-ui.png).
- 신규5종 실제 모델 스폰/단계 스왑/성숙과 24개 등록 그림 중 성숙6장 렌더 확인. 시간을 앞당긴 테스트이며 20분 자연 성장 대기는 하지 않았다.
- TileDurabilityManager.HitResource 실제 수확 경로로 토마토2단계/딸기3단계 복귀·엔티티/점유 유지. 실제 PlayerController.TryMine→ServerRequestCropCare RPC 물주기/퇴비 성공, 퇴비3→2, 중복 뒤2 유지. 배치 JSON의 plantedAt/wateredStage/isFertilized 일치.
- CookingPot 실제 RequestCook 예약·RequestCollect 수거, 신규4음식 각1개 가방 확인. 처음 세 요리 중 일부는 테스트에서 OnUpdate(1000)를 연속 호출해 가속했는데 엔진의 프레임 갱신과 겹쳐 Berry Tart 중복 로그/호박 누락을 내는 프로브 실패가 있었다. 이를 제품 정상 흐름의 오류로 확정하지 않고, 해당 방식은 중단했다. 호박 수프는 다시 정상 RequestCook 후15초 자연 타이머 완료(18:58:35→18:58:50), 수거1개(18:59:10)를 확인했다. 요리 엔진 자체는 수정하지 않았다.
- 해당 제품 경로의 새 LEA 오류 없음. 실패한 진단 assert는 위 프로브 오류로 구분한다. 재접속 복원 확인 진행 중.

### 최종 Play 결과 (19:01:30)

재시작 후 격리 슬롯101의 저장 데이터를 다시 로드했다. 작물6종 모두 원래 원점과 보정된 그림 위치로 복원됨을 실제 서버 값으로 확인. 토마토의 IsFertilized=true/WateredStage=2, 퇴비2개 복원 PASS. 테스트 밭의 지형 변경은 persist=false로 만든 임시 환경이므로 이 재접속 확인은 작물/돌봄 데이터 복원 검사이며 지형 델타 재생 검사는 아니다. 테스트 종료 후 Maker Stop, 디스크 TestModeConfig.EnableTestMode=false 유지.

이 기록의 앞부분에 남긴 Play 승인 대기/진행 중은 당시 상태이며 이제 해소됐다. 수정본 핵심 경로(당근 실제 TryMine 파종·성숙 위치, 신규 모델5종·재수확·돌봄 RPC·새 음식 수거·재접속 상태)는 확인했다. 신규 씨앗5종 각각의 상점 클릭 구매와 20분 자연 성장 전체 대기, 모든 성장 단계24장 육안 전수 확인은 하지 않았다.
