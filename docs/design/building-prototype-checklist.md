# 건축 시험 방 — 제작자 Play 확인

2026-10-05 · 자유 건축 설계의 1단계. **정식 건축 기능이 아닌 격리된 렌더·충돌 시험**이다.

## 진입

1. Maker 편집 모드에서 refresh한다. `building_test` 맵과 `Building/Models`, `Building/Scripts/BuildingRoomPrototype`이 등록됐는지 확인한다.
2. 기존 `DevTools/Scripts/TestModeConfig`의 설정을 확인한다. `EnableTestMode=true`, `TargetMap="building_test"`, `UseCustomPos=false`로 설정 완료(2026-10-05, 이전 TargetMap 값: `"template_field"`).
3. refresh 후 **제작자가 Play**하고 테스트 캐릭터를 선택한다. 기존 테스트 전용 저장 슬롯 101~105를 사용한다. 방 중앙 `(0,0)` 부근으로 이동하는 기존 테스트 진입 경로를 사용한다.
4. 시험 후 Play를 중지하고 `TargetMap` 등 변경한 값을 원래대로 복구한다. 일반 캐릭터/실제 저장 슬롯으로 시험하지 않는다.

맵이 목록에 없거나 워프 실패 로그가 나오면 진행을 멈추고 알려 준다. 다른 맵이나 영지에 시험 타일을 임의로 칠하지 않는다.

## 구성과 제한

- 내부 5×5, 외곽 포함 바닥 7×7(49칸), 일반 벽 23칸, 남쪽 중앙 문 1개. 문이 닫히면 충돌 타일 총 24칸, 열리면 23칸.
- 바닥 `Baram_167`은 별도 `tile1.tileset` 레이어, 벽 `Big Wall`은 `wall.tileset` 레이어다. 기존 영지 `RectTileMap3`의 타일셋 불일치는 이번 시험에서만 피했으며 영지 본체는 아직 수정하지 않았다.
- 문 그림은 공식 나무판자 스프라이트를 사용한 **임시 표식**이다. 벽·바닥 그림도 기존 등록 타일이며 새 건축 아트가 아니다.
- 맵 전체 16개 엔티티(6개 타일맵과 대응 레이어 포함), 맵 컨트롤러 1개, 문 오브젝트 1개와 표시 자식 1개. 벽 칸마다 엔티티·Trigger·OnUpdate·RPC를 만들지 않는다. 성능 수치·지원 한도는 아직 미측정이다.
- 일반 벽은 `MapLayer4`, 아바타는 기존 엔티티 레이어를 사용한다. **낮은 벽/잘린 벽 방식의 기초 시험**이며 개별 벽 Y정렬이나 높은 벽의 자동 숨김을 구현한 것이 아니다.
- `GridSize=1×1`로 현재 게임의 셀 좌표 규약을 유지한다. 그림의 64×64px 규격을 이유로 그리드를 0.64로 바꾸지 않는다.
- Maker Play + 기존 테스트 모드에서만 생성된다. 영지 배치·점유·제작·저장·리스폰과 연결하지 않는다. 정식 가구 배치나 철거 시험은 다음 단계다.

## 확인 항목

| 시나리오 | 기대 결과 | 결과 |
|---|---|---|
| 방 생성 | 바닥 49칸, 벽 23칸, 남쪽 중앙 문. 화면과 셀 경계가 맞음 | 미확인 |
| 북·남·동·서 벽, 네 모서리로 이동 | 통과하지 못함. 보이는 경계와 충돌 경계가 맞음 | 미확인 |
| 벽에 붙어 Alt 점프 | 시각 점프만 발생하며 벽을 넘지 못함 | 미확인 |
| 문을 바라보고 F | 임시 표식이 사라지고 문 한 셀로 출입 가능 | 미확인 |
| 문 밖/안에서 바라보고 F | 닫히며 다시 통행 차단. 한 번 누르면 한 번만 전환 | 미확인 |
| 다른 유저가 문틈에 있을 때 닫기 | 닫힘 거부. 캐릭터를 벽에 끼우지 않음 | 미확인 |
| 먼 곳/다른 방향에서 F | 문 상태가 바뀌지 않음 | 미확인 |
| 남벽·세로벽 옆 캐릭터 | 캐릭터가 읽히며 벽 위에 떠 있는 인상/발 겹침을 평가 | 미확인 |
| 재시작/뒤늦게 입장 | 같은 방·문 상태가 보이고 충돌도 일치 | 미확인 |

문 닫힘 거부는 발 위치와 문 셀 AABB(양쪽 0.3유닛 여유)로 판정한다. 임시 여유값은 Play에서 검토한다. 문 셀에 선 본인은 조준선 조건 때문에 닫기 요청 자체가 성립하지 않을 수 있으므로, 두 플레이어로 문틈 점유를 확인하는 것이 정확하다.

## 로그와 정적 확인

정상 생성의 기대 로그(아직 실측하지 않음):

```text
[BUILD-PROTOTYPE] ready floor=49 wall=23 door=1; no per-wall entities
[BUILD-PROTOTYPE] door=open wallTiles=23
[BUILD-PROTOTYPE] door=closed wallTiles=24
[BUILD-PROTOTYPE] close blocked: player in doorway
```

`missing entity binding`, `missing tilemap component`, `tile readback failed`, `door must match...`가 나오면 화면 확인을 중단하고 원인을 해결한다. 문 요청은 서버에서 요청자·같은 맵·거리·기존 조준 규약·연속 입력을 검증한다.

검사 명령: `node scripts/create_building_prototype.cjs --check`(읽기 전용). `--check` 없이 실행하는 생성기는 대상이 존재하면 중단하므로 Maker 편집 내용을 덮어쓰지 않는다. `.map`에 새 타일 배열을 쓰지 않고 Play 시작 시 이름 기반 `SetTile`/`BoxFill`을 사용한다([공식 RectTileMap 예제](https://maplestoryworlds-creators.nexon.com/ko/docs?postId=589)).

검증 기록: LSP Error 0 / Warning 0, CJS 구문·빌더 구조 검사 통과, 모델 3종 validation 빈 목록, 신규 `.codeblock` 생성 확인, 02:02:18 refresh `status ok`. build는 **01:57:47 스냅샷 유지**(수정된 `.mlua` 저장 02:01:55보다 이전), 기존 몬스터 모델 경고 9건. **build 로그 갱신 미확인**. **런타임 검증 보류(제작자 수행)**.

이 단계가 통과하면 바닥과 가구의 점유 분리 시제품으로 진행한다. 높은 벽 표현이 필요하면 이 시험 결과를 토대로 별도로 렌더 구조를 결정한다.
