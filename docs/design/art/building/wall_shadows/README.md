# 건축 벽 접촉 그림자 (2026-10-07)

[wall_shadow_tile.png](./wall_shadow_tile.png)는 위쪽 접촉선이 짙고 아래로 투명해지는 1254×1254 RGBA 타일이다. AI 생성 텍스처에 미세한 질감 편차가 있으나 200×65px의 좁은 띠로 반복할 때 거슬리는 경계가 없는지 [기존 오두막 전후 미리보기](./preview_before_after.png)에서 검토했다. 등록 PNG는 원본 그대로이며 미리보기만 축소·회전·합성했다. 측정 알파 최대 216; 렌더 색 알파 0.5를 곱해 접촉선 최대 약 42%로 사용한다.

## 등록·연결

제작자가 등록한 RUID `edaf8aba812440329291dde23e8b4123`를 `BuildingManager.WallShadowRUID`와 그림자 모델 SpriteRUID에 연결했다. **캔버스 1254×1254 유지, 피벗 중앙(0.5,0.5), Bilinear 필터 권장**. `WallShadowTexturePx=1254`, `WallShadowDepth=0.65`, `WallShadowOpacity=0.5`.

`BuildingWallShadow.model`은 ModelBuilder로 만든 native Transform/SpriteRenderer 전용 모델. 충돌·점유·터치가 없다. 기본값은 등록된 그림자와 비활성 상태이며 BuildingManager가 생성 후 활성화한다. 타일셋 등록 없이 타일 크기의 반복 스프라이트로 그린다.

`BuildingManager`가 열린 칸의 인접 벽·창문·닫힌 문을 검사한다. 한 장을 0/90/180/270도로 돌려 네 변에 반복 배치하고, 모서리는 투명도가 겹쳐 접촉 그늘을 더 짙게 만든다. 바닥 레이어 `MapLayer3`, OrderInLayer 1로 가구/플레이어 아래에 그린다. 건축·철거·문 열기/닫기·저장 복원 시 다시 계산하고 제거된 변은 엔티티도 삭제한다. 벽 방향/문 방향 자체는 바꾸지 않는다.

**RUID 연결·모델 검증·그림자 변 계산 정적 검증 완료**. Maker MCP 없음 → **refresh 검증 보류 · 런타임 검증 보류(제작자 수행)**. 실제 레이어 정렬·벽 밑 접지 위치·반복 이음새·열린 문 그늘 제거를 제작자가 확인한다.
