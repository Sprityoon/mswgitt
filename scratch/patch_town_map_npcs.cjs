const path = require("path");
const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

const mapPath = path.join(__dirname, "..", "map", "town.map");
console.log("Reading town.map via MapBuilder...");
const builder = MapBuilder.read(mapPath);

const targetUpdates = {
  "/maps/town/Villager_ResidentA": {
    npcId: "researcher",
    nameTag: "연구원 엘렌"
  },
  "/maps/town/Villager_ResidentB": {
    npcId: "vendor",
    nameTag: "노점상 마리"
  },
  "/maps/town/Villager_ResidentC": {
    npcId: "blacksmith",
    nameTag: "대장장이 로체"
  },
  "/maps/town/Villager_ResidentD": {
    npcId: "barnkeeper",
    nameTag: "헛간지기 토리"
  }
};

let patchedCount = 0;

for (const entity of builder.entities) {
  const info = targetUpdates[entity.path];
  if (info) {
    console.log(`Found entity: ${entity.path}`);
    const json = entity.jsonString;
    if (json && json["@components"]) {
      for (const comp of json["@components"]) {
        if (comp["@type"] === "script.VillagerDialog") {
          comp.NpcId = info.npcId;
          patchedCount++;
        }
        if (comp["@type"] === "MOD.Core.NameTagComponent") {
          console.log(`  Updating NameTag: ${comp.Name} -> ${info.nameTag}`);
          comp.Name = info.nameTag;
        }
      }
    }
  }
}

console.log(`Total dialog components verified: ${patchedCount}`);
builder.write(mapPath);
console.log("town.map successfully updated.");
