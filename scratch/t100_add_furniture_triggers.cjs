/**
 * T100 Change ③ — 가구 6종 TriggerComponent 부여 (ModelBuilder)
 * BoxSize: 접지면 기준 · 현행 AimFootprint 실효 범위(1셀)와 정합
 * IsPassive=true (T81) · Scale=1 전제(규칙 14)
 */
const path = require("path");
const { ModelBuilder, vector2 } = require(
  path.join(__dirname, "..", ".claude", "skills", "msw-general", "scripts", "model", "msw_model_builder.cjs")
);

// 현행 IsAimTarget footprint 경로: Bed W/H=2여도 floor((2-1)/2)=0 → 실효 1셀.
// Trigger AABB도 약 1셀 커버로 맞추면 F 거리 회귀 0.
const SPECS = [
  { file: "Furniture_Bed", box: [0.95, 0.75], off: [0, -0.15], note: "실효 footprint 1셀 정합 (AimFootprintW=2는 수식상 무확장)" },
  { file: "Furniture_CookingPot", box: [0.9, 0.7], off: [0, -0.15], note: "AimFootprint 1×1" },
  { file: "Furniture_Furnace", box: [0.95, 0.8], off: [0, -0.15], note: "AimFootprint 1×1" },
  { file: "Furniture_WoodenChest", box: [0.9, 0.7], off: [0, -0.15], note: "AimFootprint 1×1" },
  { file: "Furniture_AnimalPen", box: [1.4, 1.0], off: [0, -0.2], note: "F경로 없음·차단 박스만 약간 큼" },
  { file: "Furniture_MonsterWard", box: [0.9, 0.8], off: [0, -0.15], note: "BlocksMovement=false — 정렬용 Trigger만" },
];

const DIR = path.join("RootDesk", "MyDesk", "Furniture", "Models");

for (const spec of SPECS) {
  const fp = path.join(DIR, `${spec.file}.model`);
  const b = ModelBuilder.read(fp);
  if (b.hasComponent("MOD.Core.TriggerComponent") || b.hasComponent("TriggerComponent")) {
    console.log(`SKIP already has Trigger: ${spec.file}`);
    continue;
  }
  b.component("MOD.Core.TriggerComponent")
    .value("MOD.Core.TriggerComponent", "BoxSize", vector2(spec.box[0], spec.box[1]), "vector2")
    .value("MOD.Core.TriggerComponent", "ColliderOffset", vector2(spec.off[0], spec.off[1]), "vector2")
    .value("MOD.Core.TriggerComponent", "IsPassive", true, "bool")
    .value("MOD.Core.TriggerComponent", "IsLegacy", false, "bool")
    .write(fp);
  const comps = b.listComponents();
  const hasT = comps.some((c) => c.includes("TriggerComponent"));
  console.log(`OK ${spec.file} Trigger=${hasT} BoxSize=(${spec.box}) Offset=(${spec.off}) — ${spec.note}`);
}

console.log("Done.");
