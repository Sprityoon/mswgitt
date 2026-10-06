// template_field / field_earth: Deco_MushroomCluster -> Deco_RockTree, Deco_FlowerBushYellow -> Deco_Bush
const fs = require("fs");
const path = require("path");
const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

const root = path.join(__dirname, "..");
const modelsDir = path.join(root, "RootDesk", "MyDesk", "MapObjects", "Models");
const swap = { deco_mushroom_cluster: "Deco_RockTree", deco_flower_bush_yellow: "Deco_Bush" };

for (const f of ["template_field", "field_earth"]) {
  const mapPath = path.join(root, "map", `${f}.map`);
  fs.copyFileSync(mapPath, path.join(root, "scratch", `${f}-before-decoswap-20261007.map`));
  const map = MapBuilder.read(mapPath);
  const targets = map.listEntities().filter((e) => swap[e.modelId]);
  for (const e of targets) {
    const t = map.component(e.path, "MOD.Core.TransformComponent");
    const pos = [t.Position.x, t.Position.y, t.Position.z];
    const modelName = swap[e.modelId];
    const newName = e.name.replace(/Deco_(MushroomCluster|FlowerBushYellow)/, modelName);
    map.remove(e.path);
    if (map.find(newName)) throw new Error(`duplicate ${newName}`);
    map.placeModel(newName, path.join(modelsDir, `${modelName}.model`), { pos });
    console.log(`${f}: ${e.name} -> ${newName} (${pos.join(", ")})`);
  }
  map.write(mapPath);
  const left = MapBuilder.read(mapPath).listEntities().filter((e) => swap[e.modelId]).length;
  console.log(`${f}: replaced ${targets.length}, remaining ${left}`);
}
