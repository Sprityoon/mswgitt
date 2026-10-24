# Maker 등록용 아틀라스

- **기본 24px border**: [Cabin_atlas_24px_border_door_fixed_8x6.png](Cabin_atlas_24px_border_door_fixed_8x6.png)
- outer edge + wall 변형: [Cabin_atlas_24px_outer_edge_door_fixed_8x6.png](Cabin_atlas_24px_outer_edge_door_fixed_8x6.png)

두 PNG 모두 **512×384px / 8열×6행 / 타일64×64px / 여백0 / 간격0**이다. 투명 배경을 유지하며 글자·가이드·테두리 패딩을 넣지 않았다.

순서는 왼쪽→오른쪽, 위→아래다. 첫 줄0~7, 둘째 줄8~15, 마지막 줄40~47. 기존 번호와 같은 순서다. 닫힌 문과 열린 문/그림자 후속 보정까지 포함한07·08 폴더를 사용했다.

생성 후 PNG를 다시 열어48개 셀 각각이 원본64×64 RGBA와 완전히 같은지 검증했다. 양쪽 아틀라스 모두48/48 통과. 투명 픽셀의 RGB도 보존한다.

좌표표: [atlas-layout.json](atlas-layout.json) (좌상단 원점, row/column은0부터).

재생성: `06_door_repair_work/export_atlas.py`. 스트립과 원본 개별 타일은 보존했다. Maker 등록·게임 반영은 제작자가 진행한다.
