/**
 * scripts/setup_editor_portals_for_template_boss.cjs
 * 
 * template_boss.map에 사용자가 메이커 에디터에서 자유롭게 마우스로 배치하고 옮길 수 있는
 * 표준 Furniture_Portal 엔티티(Portal, PortalToHunt03)를 맵 씬에 등록합니다.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const mapPath = path.join(ROOT, "map/template_boss.map");

const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
let ents = mapJson.ContentProto.Entities;
const mapPathStr = "/maps/template_boss";

function ensurePortalEntity(name, x, y, targetMap, targetPos) {
  let pEnt = ents.find(e => e.jsonString && e.jsonString.name === name);
  if (!pEnt) {
    pEnt = {
      id: crypto.randomUUID(),
      path: `${mapPathStr}/${name}`,
      componentNames: "MOD.Core.TransformComponent,MOD.Core.SpriteRendererComponent,MOD.Core.TriggerComponent,script.PortalGate",
      jsonString: {
        name: name,
        path: `${mapPathStr}/${name}`,
        nameEditable: true,
        enable: true,
        visible: true,
        localize: false,
        displayOrder: 0,
        pathConstraints: "///",
        revision: 1,
        origin: {
          type: "Model",
          entry_id: "f2d3a4b5-67c8-49d0-bfd1-ebd3c4a2a1b1",
          sub_entity_id: null,
          root_entity_id: null,
          replaced_model_id: null
        },
        modelId: "f2d3a4b5-67c8-49d0-bfd1-ebd3c4a2a1b1",
        "@components": [
          {
            "@type": "MOD.Core.TransformComponent",
            "Position": { "x": x, "y": y, "z": 0.0 },
            "Scale": { "x": 1.0, "y": 1.0, "z": 1.0 },
            "Rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
            "QuaternionRotation": { "x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0 },
            "ZRotation": 0.0,
            "Enable": true
          },
          {
            "@type": "MOD.Core.SpriteRendererComponent",
            "SortingLayer": "MapLayer5",
            "OrderInLayer": 15,
            "SpriteRUID": "aba58d2139ca4736bab39f6b4c39aa37",
            "IgnoreMapLayerCheck": true,
            "Color": { "r": 1, "g": 1, "b": 1, "a": 1 },
            "Enable": true
          },
          {
            "@type": "MOD.Core.TriggerComponent",
            "BoxSize": { "x": 1.5, "y": 2.0 },
            "ColliderOffset": { "x": 0.0, "y": 0.0 },
            "Enable": true
          },
          {
            "@type": "script.PortalGate",
            "DestinationGroup": targetMap === "Home" ? "home" : "hunt",
            "PortalColor": targetMap === "Home" ? "blue" : "white",
            "TargetMapName": targetMap,
            "TargetPosition": { "x": targetPos.x, "y": targetPos.y },
            "Enable": true
          }
        ],
        "@version": 1
      }
    };
    ents.push(pEnt);
    console.log(` - Created Portal '${name}' at (${x}, ${y}) in template_boss.map`);
  }
}

// 보스룸 귀환 포탈 (Portal -> Home) 및 이전 사냥터 포탈 (PortalToHunt03 -> hunt03)
ensurePortalEntity("Portal", 0.0, -8.0, "Home", { x: -3.0, y: 0.0 });
ensurePortalEntity("PortalToHunt03", 0.0, -7.0, "hunt03", { x: 8.0, y: 0.0 });

mapJson.ContentProto.Entities = ents;
fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully setup editor portals for template_boss.map!");
