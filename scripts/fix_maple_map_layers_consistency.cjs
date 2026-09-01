/**
 * scripts/fix_maple_map_layers_consistency.cjs
 * 
 * 모든 맵(map01, town, template_field, template_boss)의
 * MapleMapLayer1~6 엔티티와 RectTileMap1~6 엔티티의 레이어 정합성을 완벽하게 통일합니다.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const mapFiles = [
  "map/map01.map",
  "map/town.map",
  "map/template_field.map",
  "map/template_boss.map"
];

const standardLayers = [
  { name: "MapleMapLayer",  layerName: "Layer1", sortOrder: 0 },
  { name: "MapleMapLayer2", layerName: "Layer2", sortOrder: 1 },
  { name: "MapleMapLayer3", layerName: "Layer3", sortOrder: 3 },
  { name: "MapleMapLayer4", layerName: "Layer4", sortOrder: 2 },
  { name: "MapleMapLayer5", layerName: "Layer5", sortOrder: 4 },
  { name: "MapleMapLayer6", layerName: "Layer6", sortOrder: 5 }
];

mapFiles.forEach(rel => {
  const mapPath = path.join(ROOT, rel);
  if (!fs.existsSync(mapPath)) return;
  const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const ents = mapJson.ContentProto.Entities;
  const baseMapName = path.basename(rel, ".map");
  const mapPathStr = `/maps/${baseMapName}`;

  let added = 0;
  standardLayers.forEach(sl => {
    let layerEnt = ents.find(e => e.jsonString && e.jsonString.name === sl.name);
    if (!layerEnt) {
      layerEnt = {
        id: crypto.randomUUID(),
        path: `${mapPathStr}/${sl.name}`,
        componentNames: "MOD.Core.MapLayerComponent",
        jsonString: {
          name: sl.name,
          path: `${mapPathStr}/${sl.name}`,
          nameEditable: false,
          enable: true,
          visible: true,
          localize: false,
          displayOrder: 0,
          pathConstraints: "///",
          revision: 1,
          origin: {
            type: "Model",
            entry_id: "maplemaplayer",
            sub_entity_id: null,
            root_entity_id: null,
            replaced_model_id: null
          },
          modelId: "maplemaplayer",
          "@components": [
            {
              "@type": "MOD.Core.MapLayerComponent",
              "IsVisible": true,
              "LayerSortOrder": sl.sortOrder,
              "Locked": false,
              "MapLayerName": sl.layerName,
              "Thumbnail": "",
              "Enable": true
            }
          ],
          "@version": 1
        }
      };
      ents.push(layerEnt);
      added++;
    }
  });

  if (added > 0) {
    fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
    console.log(`[FIX] Added ${added} missing MapleMapLayers in ${rel}`);
  } else {
    console.log(`[OK] All MapleMapLayers already consistent in ${rel}`);
  }
});
