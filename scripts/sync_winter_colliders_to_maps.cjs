// 모델의 Trigger/PhysicsCollider BoxSize·ColliderOffset 을 맵 인스턴스에도 맞춘다. 위치·스케일은 건드리지 않는다.
// 사용: node scripts/sync_winter_colliders_to_maps.cjs [모델파일명 정규식]  (기본 "_Winter_", 사막 = "_Desert_")
const fs = require("fs");
const path = require("path");
const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");
const { ModelBuilder } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");
const root = path.join(__dirname, "..");
const modelsDir = path.join(root, "RootDesk", "MyDesk", "MapObjects", "Models");
const comps = ["MOD.Core.TriggerComponent", "MOD.Core.PhysicsColliderComponent"];
const log = console.log;
console.log = () => {};
const pattern = new RegExp(process.argv[2] || "_Winter_");
const tag = (process.argv[2] || "winter").replace(/[^A-Za-z]/g, "").toLowerCase();
const byId = {};
let nullTargets = 0;
for (const f of fs.readdirSync(modelsDir).filter((f) => pattern.test(f))) {
  const m = ModelBuilder.load(path.join(modelsDir, f));
  nullTargets += m.values.filter((v) => v.TargetType == null && /Box|Offset/.test(v.Name)).length;
  const get = (t, n) => (m.values.find((v) => v.TargetType === t && v.Name === n) || {}).Value;
  byId[m.model_id] = Object.fromEntries(comps.map((c) => [c, { BoxSize: get(c, "BoxSize"), ColliderOffset: get(c, "ColliderOffset") }]));
}
log(`models(${pattern}) ${Object.keys(byId).length}, property-level collider overrides ${nullTargets}`);
for (const f of fs.readdirSync(path.join(root, "map")).filter((f) => f.endsWith(".map"))) {
  const mapPath = path.join(root, "map", f);
  const map = MapBuilder.read(mapPath);
  const targets = map.listEntities().filter((e) => byId[e.modelId]);
  if (!targets.length) continue;
  fs.copyFileSync(mapPath, path.join(root, "scratch", `${path.basename(f, ".map")}-before-${tag}colliders-20261007.map`));
  let patched = 0;
  for (const e of targets) {
    for (const c of comps) {
      const want = byId[e.modelId][c];
      const cur = map.component(e.path, c);
      if (!want.BoxSize || !cur) continue;
      map.patchComponent(e.path, c, {
        BoxSize: { ...cur.BoxSize, x: want.BoxSize.x, y: want.BoxSize.y },
        ColliderOffset: { ...cur.ColliderOffset, x: want.ColliderOffset.x, y: want.ColliderOffset.y },
      });
      patched++;
    }
  }
  map.write(mapPath);
  const check = MapBuilder.read(mapPath);
  const ok = targets.filter((e) => {
    const t = check.component(e.path, comps[0]);
    return t && t.BoxSize.x === byId[e.modelId][comps[0]].BoxSize.x && t.ColliderOffset.y === byId[e.modelId][comps[0]].ColliderOffset.y;
  }).length;
  log(`${f}: ${targets.length} instances, ${patched} components patched, readback ok ${ok}/${targets.length}`);
}
