/**
 * T100 — 가구 Trigger 박스 재조정: 인접 셀 aim 확장(WIDER) 제거
 * 제약: |offY| + boxH/2 ≤ 0.5  (셀 중심 피벗, Scale=1)
 */
const path = require("path");
const { ModelBuilder, vector2 } = require(
  path.join(__dirname, "..", ".claude", "skills", "msw-general", "scripts", "model", "msw_model_builder.cjs")
);

const SPECS = [
  // F 상호작용 대상 — footprint 1셀과 SAME 강제
  { file: "Furniture_Bed", box: [0.9, 0.7], off: [0, -0.1] },
  { file: "Furniture_CookingPot", box: [0.85, 0.65], off: [0, -0.1] },
  { file: "Furniture_Furnace", box: [0.9, 0.7], off: [0, -0.1] },
  { file: "Furniture_WoodenChest", box: [0.85, 0.65], off: [0, -0.1] },
  { file: "Furniture_MonsterWard", box: [0.85, 0.65], off: [0, -0.1] },
  // AnimalPen: F 경로 없음. 차단용으로 폭만 넓힘(aim 무관). 세로는 1셀 유지.
  { file: "Furniture_AnimalPen", box: [1.2, 0.85], off: [0, -0.1] },
];

const DIR = path.join("RootDesk", "MyDesk", "Furniture", "Models");

function triggerHit(boxW, boxH, offX, offY, aimDx, aimDy) {
  const cx = 0.5 + offX, cy = 0.5 + offY;
  const minX = cx - boxW / 2, maxX = cx + boxW / 2;
  const minY = cy - boxH / 2, maxY = cy + boxH / 2;
  const eps = 0.001;
  return aimDx + 1 > minX - eps && aimDx < maxX + eps && aimDy + 1 > minY - eps && aimDy < maxY + eps;
}

for (const spec of SPECS) {
  const fp = path.join(DIR, `${spec.file}.model`);
  const b = ModelBuilder.read(fp);
  b.value("MOD.Core.TriggerComponent", "BoxSize", vector2(spec.box[0], spec.box[1]), "vector2")
    .value("MOD.Core.TriggerComponent", "ColliderOffset", vector2(spec.off[0], spec.off[1]), "vector2")
    .value("MOD.Core.TriggerComponent", "IsPassive", true, "bool")
    .write(fp);
  const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const hits = dirs.map(([dx, dy]) => `${dx},${dy}=${triggerHit(spec.box[0], spec.box[1], spec.off[0], spec.off[1], dx, dy)}`).join(" ");
  console.log(`OK ${spec.file} Box=${spec.box} Off=${spec.off} | ${hits}`);
}
