# Rock · Snow 지형 타일 리드로우

2026-10-07. **이미지 제작·정적 검증 완료 / Maker 등록·wall.tileset 연결 대기.**

최종 등록 파일은 **`tiles/`의 PNG 26장**이다. 모두 64×64, RGBA이며 기본 타일 1장과 프린지 12장씩이다. 고해상도 `*_generated.png`와 확대 미리보기는 중간물 또는 검토용이며 등록하지 않는다.

## 디자인 기준

- 64px 네 칸이 128px 한 덩어리로 보이는 게임 배치에 맞춰 작은 자갈·눈 입자를 없앴다.
- Rock: 약 16~28px 크기의 넓은 돌 면, 회색과 청록 기운의 절제된 명암. 작은 점무늬 대신 큰 면으로 재질을 구분한다.
- Snow: 넓은 밝은 바탕과 두 개의 완만한 눈 둔덕. 둔덕은 약 30px 폭이며 외곽은 조용한 단색으로 처리해 반복 경계의 끊김을 줄였다.
- 새 질감은 image_gen으로 제작하고 64px 팔레트 격자로 내보낸 뒤 고립 픽셀 정리와 바위 팔레트 보정을 적용했다. 편집 원본은 `Rock.pxg`, `Snow.pxg`다.
- 기존 `tileimg/Soil*.png`의 프린지 알파를 그대로 사용했다. 기존 Rock/Snow 12종 스트립과 이 마스크의 알파 일치도 사전 확인했다.
- 기본·외곽·안쪽 코너만 교체한다. 현재 tileset에 없는 대각선 타일이나 새 런타임 규칙을 추가하지 않는다.

## 미리보기

- [기존/신규 비교](comparison.png): 위 Rock, 아래 Snow. 왼쪽 기존 2×2, 가운데 신규 2×2, 오른쪽 신규 단일 타일 확대.
- [Rock 4×4 반복](Rock_repeat_4x4.png), [Snow 4×4 반복](Snow_repeat_4x4.png).
- [Rock 잔디·흙 경계](Rock_fringe_preview.png), [Snow 잔디·흙 경계](Snow_fringe_preview.png). 실제 게임 스크린샷이 아닌 로컬 합성 미리보기다.
- `*_atlas_13.png`: 기본 + 프린지 12종, 832×64.
- `*_fringe_12.png`: 프린지만 12종, 768×64.

스트립의 프린지 순서는 `LT, T, RT, L, R, LD, D, RD, LTCorner, RTCorner, LDCorner, RDCorner`이다. 이 순서는 **wall.tileset의 기존 팔레트 순서와 다르므로** 인덱스 순서대로 붙여 넣지 않는다. `manifest.json`의 이름·기존 인덱스가 대응 기준이다.

## Maker 등록 및 연결

1. `tiles/`의 PNG 26장을 Sprite로 등록한다. 파일명과 등록 이름을 동일하게 유지한다. `biome_ground_v2_tiles.zip`도 같은 26장만 포함한다.
2. 발급된 **Sprite RUID**를 `registered-ruids.template.json`의 이름별 값에 채워 별도 `registered-ruids.json`으로 저장하거나, 파일명별 RUID 목록을 Codex에 전달한다.
3. 프로젝트 루트에서 연결 변경을 미리 확인한다.

   ```powershell
   node docs/design/art/biome_ground_v2/apply.cjs docs/design/art/biome_ground_v2/registered-ruids.json
   ```

4. 등록 RUID 대응을 확인한 후 적용한다.

   ```powershell
   node docs/design/art/biome_ground_v2/apply.cjs docs/design/art/biome_ground_v2/registered-ruids.json --apply
   ```

도구는 총 261개 팔레트의 기존 Name·인덱스·IsCollidable을 확인하고 **Rock/Snow 26개 Id만** 바꾼다. 누락·추가 이름, 중복 GUID, 잘못된 GUID 형식, 기존 RUID 변경을 거부한다. 실제 적용 시 변경 직전 tileset 백업과 저장 후 재읽기 검증을 수행한다. 템플릿의 null은 등록 전 표시이며 tileset에는 기록되지 않는다. 현재 `wall.tileset`은 변경하지 않았다.

## 검증

```powershell
node docs/design/art/biome_ground_v2/export.cjs verify
```

- 26장 전부 64×64, 파일 SHA-256 일치, 기본 타일 완전 불투명.
- 프린지 24장 × 4,096픽셀의 알파가 기존 방향별 마스크와 일치.
- 기본 타일의 좌우·상하 경계 픽셀 일치. 반복 배치 및 잔디/흙 합성은 두 차례 수정·시각 검토했다.
- 안전 교체 도구는 메모리 내 가상 RUID로 26개 Id만 변경되는지 검증하고, 잘못된 값·중복·범위 밖 이름의 거부를 확인했다. 실제 tileset에는 가상 RUID를 쓰지 않았다.
- 이 세션에서 Maker refresh·로그·리소스 등록 도구가 노출되지 않아 **refresh 검증 보류**. 빌드 오류 개수는 확인하지 않았다.
- **런타임 검증 보류(제작자 수행)**: 등록 후 기존 Rock/Snow 맵에서 2×2 연결, 네 방향 외곽·안쪽 코너, 타일 필터링과 축척을 확인한다.

편집된 PXG에서 재출력할 때는 `export.cjs export`를 사용한다. `draft --reset`은 이미지 생성 중간물에서 초안을 다시 만들어 수동 팔레트 보정을 덮어쓰므로 최종본 재출력에 사용하지 않는다. 기존 `tileimg/`와 Sand는 변경하지 않았다.
