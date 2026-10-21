# 경직 5타·밤/안개와 광원 완화 (2026-10-21)

## 반영

- 트래퍼 단검 투척 StaggerEvery 3→5: 1·6·11·16… 적중 경직. 기존 공격자/몬스터별 집계, 3초 초과 미적중 및 리스폰 초기화 유지. CSV 다른 셀 보존, Monster 주석만 동기화(판정 코드 변경 없음).
- 야외 밤 강도0.52→0.58, 안개 입자 알파0.32→0.36, 막 알파0.10→0.12. 기존 부드러운 일몰/일출·안개 전환 유지.
- 마을(town)은 야외 대비55% 강도. 빛 주변은 거리에 따른 smoothstep 완화 후1.5초 지수 보간. 마을과 광원 중 가장 강한 완화만 사용(중첩 곱셈 없음).
- 광원은 item_dataset.EnvironmentLightRadius/EnvironmentLightStrength 데이터: 화로4유닛/55% 감소, 요리 냄비3유닛/50% 감소(각각 IsSmelting일 때만); 정원의 등불5유닛/60% 감소(상시). 최대 감소는 중심 기준이고 경계에서는0으로 이어진다. 가구 ItemId를 @Sync로 전달하여 배치/복원된 가구의 키를 클라이언트도 읽는다.
- 현재 맵 가구 후보는1초 주기 캐시, 가까운 광원의 거리·가동 상태만 프레임별 계산. 새 타이머·입자·머티리얼 없음. ReliefAffected=true인 안개만 입자·막을 완화하고 비는 유지. 밤 카메라 세기는 같은 완화 배율 적용.

## 검증

- node scripts/test_environment_stagger_20261021.cjs: 실제 mLua 본문을 기존 fengari/Lua5.3에서 실행. 경직1/6/11/16·공격자/대상 분리·3초 공백·근접 경직 유지, 야외/마을/불 반경·경계·가동/꺼짐·비활성/철거·광원 중첩·맵 이동·조회 캐시·보간·안개 입자/막·낮 비네트0·비 미변경 PASS. MSW 렌더/네트워크는 대역이며 게임 내 시각 확인을 뜻하지 않는다.
- 관련 mLua3개 LSP Error0/Warning0. 데이터 열 실재 확인364/추적불가242/불일치0, 설정값 불일치0.
- 아이템128행 기존54열 전부 보존, 새 광원 열2개만 추가. 날씨는 fog의 ParticleColor/HazeColor 및 신규 ReliefAffected 외 값 보존. HUD .ui의 UIHUDController 저장 컴포넌트는 Enable만 있어 이전0.52 기본값을 덮는 별도 저장값 없음(.ui 변경 없음).
- Native Entity.GetChildComponentsByTypeName 및 기존 Furnace.IsSmelting @Sync 확인. MaterialService/AreaParticle API 조회로 ClientOnly 머티리얼 변경·입자 Color 지원 확인, 기존 NightVignette.material 속성 이름 대조. 머티리얼 파일 변경 없음.
- Maker refresh ok. Build **2026-10-21 18:56:07 KST Error0 / Warning16(기존 모델 경고18:00:04) / Info922**, 신규 환경 메서드 미정의 참조0. refresh 뒤 경직5·안개 설정 재확인. diff --check 통과.

## 제작자 확인 상태

- 제작자 보고: 이전 몬스터/보스 HP·AP/SP 가격·수량 구매·개수 제한 등 나머지 항목은 점검 완료. 기기/개별 시나리오 상세는 미기재로 기록하며 에이전트 실행 증거와 구분한다.
- 이번 변경의 남은 Play: 1·6·11타 간격 체감, 야외 밤/안개 농도, 마을 입출입·가동 화로/냄비·등불 접근/이탈·철거 후 복귀의 시각 전환. AGENTS P7에 따라 에이전트 Play/입력은 수행하지 않음.
