const path = require("path");
const { ModelBuilder } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");
const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

const NEW_RUID = "f3d2ac233b034f3b959f140916470b48";
const modelFilepath = path.join(__dirname, "..", "RootDesk", "MyDesk", "MapObjects", "Models", "Prop_LampPost.model");
const mapFilepath = path.join(__dirname, "..", "map", "town.map");

console.log("[1/2] Updating Prop_LampPost.model with RUID:", NEW_RUID);

// 1. Update Prop_LampPost.model via ModelBuilder
const model = ModelBuilder.load(modelFilepath);
model.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", NEW_RUID, "string");
model.write(modelFilepath);

console.log("[2/2] Placing Prop_LampPost in town.map via MapBuilder...");

// 2. Place in town.map via MapBuilder
const map = MapBuilder.read(mapFilepath);

// If an entity with the same name exists, remove it first for idempotency
const entityName = "Prop_LampPost";
if (map.find(entityName)) {
  console.log(`Entity ${entityName} already exists in town.map, replacing...`);
  map.remove(entityName);
}

// Place model at (2, -2, 0) - near plaza center for easy selection in Maker
map.placeModel(entityName, modelFilepath, {
  pos: [2, -2, 0]
});

map.write(mapFilepath);

console.log(`Successfully placed ${entityName} at (2, -2, 0) in town.map!`);
