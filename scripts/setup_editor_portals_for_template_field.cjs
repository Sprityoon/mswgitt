/**
 * scripts/setup_editor_portals_for_template_field.cjs
 * 
 * template_field.map에서 임시 부두/배를 제거하고,
 * 사용자가 메이커 에디터에서 자유롭게 마우스로 배치하고 옮길 수 있는
 * 표준 Furniture_Portal 엔티티(Portal, PortalToHunt02)를 맵 씬에 등록합니다.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const mapPath = path.join(ROOT, "map/template_field.map");

const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
let ents = mapJson.ContentProto.Entities;
const mapPathStr = "/maps/template_field";

// 1. 임시 부두/배 엔티티 제거
ents = ents.filter(e => {
  const name = e.jsonString ? e.jsonString.name : "";
  return name !== "Furniture_Pier" && name !== "Furniture_Boat" && name !== "Pier" && name !== "Boat";
});

// 2. 표준 포탈 엔티티 헬퍼
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
            "SpriteRUID": "aba58d2139ca4736bab39f6b4c39aa37", // 메이플스토리 표준 포탈 스프라이트
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
    console.log(` - Created Portal '${name}' at (${x}, ${y}) in template_field.map`);
  }
}

// 기본 귀환 포탈 (Portal -> Home) 및 다음 구역 포탈 (PortalToHunt02 -> hunt02)
ensurePortalEntity("Portal", 0.0, -15.0, "Home", { x: -3.0, y: 0.0 });
ensurePortalEntity("PortalToHunt02", 15.0, 0.0, "hunt02", { x: 0.0, y: 0.0 });

mapJson.ContentProto.Entities = ents;
fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully setup editor portals for template_field.map!");
