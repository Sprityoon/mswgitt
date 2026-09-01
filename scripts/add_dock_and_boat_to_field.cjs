/**
 * scripts/add_dock_and_boat_to_field.cjs
 * 
 * template_field.map에 Furniture_Pier와 Furniture_Boat(귀환 나룻배 포탈) 엔티티를 추가하여
 * 메이커 맵 에디터에서 마우스로 자유롭게 위치를 조절할 수 있도록 합니다.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const mapPath = path.join(ROOT, "map/template_field.map");

const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const ents = mapJson.ContentProto.Entities;
const mapPathStr = "/maps/template_field";

const dockX = -3.0;
const dockY = -22.0;

// 1. Furniture_Pier (선착장 부두)
let pierEnt = ents.find(e => e.jsonString && (e.jsonString.name === "Furniture_Pier" || e.jsonString.name === "Pier"));
if (!pierEnt) {
  const pierUuid = "p" + Math.random().toString(16).slice(2, 9) + "-3333-4444-8888-" + Math.random().toString(16).slice(2, 14);
  pierEnt = {
    id: pierUuid,
    path: `${mapPathStr}/Furniture_Pier`,
    componentNames: "MOD.Core.TransformComponent,MOD.Core.SpriteRendererComponent,script.PlaceableFurniture",
    jsonString: {
      name: "Furniture_Pier",
      path: `${mapPathStr}/Furniture_Pier`,
      nameEditable: true,
      enable: true,
      visible: true,
      localize: false,
      displayOrder: 0,
      pathConstraints: "///",
      revision: 1,
      origin: {
        type: "Model",
        entry_id: "furniture_pier",
        sub_entity_id: null,
        root_entity_id: null,
        replaced_model_id: null
      },
      modelId: "furniture_pier",
      "@components": [
        {
          "@type": "MOD.Core.TransformComponent",
          "Position": { "x": dockX, "y": dockY + 1.2, "z": 0.0 },
          "Scale": { "x": 0.25, "y": 0.25, "z": 1.0 },
          "Rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
          "QuaternionRotation": { "x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0 },
          "ZRotation": 0.0,
          "Enable": true
        },
        {
          "@type": "MOD.Core.SpriteRendererComponent",
          "SortingLayer": "MapLayer5",
          "OrderInLayer": 2,
          "SpriteRUID": "8d356cf966cd47a3a972e5bcf952c51c",
          "IgnoreMapLayerCheck": true,
          "Color": { "r": 1, "g": 1, "b": 1, "a": 1 },
          "Enable": true
        },
        {
          "@type": "script.PlaceableFurniture",
          "ItemId": "Pier",
          "BlocksMovement": false,
          "IsWalkable": true,
          "Enable": true
        }
      ],
      "@version": 1
    }
  };
  ents.push(pierEnt);
  console.log(` - Created Furniture_Pier at (${dockX}, ${dockY + 1.2}) in template_field.map`);
}

// 2. Furniture_Boat (출항/귀환 나룻배 포탈)
let boatEnt = ents.find(e => e.jsonString && (e.jsonString.name === "Furniture_Boat" || e.jsonString.name === "Boat"));
if (!boatEnt) {
  const boatUuid = "b" + Math.random().toString(16).slice(2, 9) + "-5555-4444-8888-" + Math.random().toString(16).slice(2, 14);
  boatEnt = {
    id: boatUuid,
    path: `${mapPathStr}/Furniture_Boat`,
    componentNames: "MOD.Core.TransformComponent,MOD.Core.SpriteRendererComponent,MOD.Core.TriggerComponent,script.PortalGate,script.PlaceableFurniture",
    jsonString: {
      name: "Furniture_Boat",
      path: `${mapPathStr}/Furniture_Boat`,
      nameEditable: true,
      enable: true,
      visible: true,
      localize: false,
      displayOrder: 0,
      pathConstraints: "///",
      revision: 1,
      origin: {
        type: "Model",
        entry_id: "furniture_boat",
        sub_entity_id: null,
        root_entity_id: null,
        replaced_model_id: null
      },
      modelId: "furniture_boat",
      "@components": [
        {
          "@type": "MOD.Core.TransformComponent",
          "Position": { "x": dockX, "y": dockY - 0.8, "z": 0.0 },
          "Scale": { "x": 0.8, "y": 0.8, "z": 1.0 },
          "Rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
          "QuaternionRotation": { "x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0 },
          "ZRotation": 0.0,
          "Enable": true
        },
        {
          "@type": "MOD.Core.SpriteRendererComponent",
          "SortingLayer": "MapLayer5",
          "OrderInLayer": 15,
          "SpriteRUID": "d1e1d2b20a104e17950d35ec8860c349",
          "IgnoreMapLayerCheck": true,
          "Color": { "r": 1, "g": 1, "b": 1, "a": 1 },
          "Enable": true
        },
        {
          "@type": "MOD.Core.TriggerComponent",
          "BoxSize": { "x": 2.5, "y": 2.0 },
          "ColliderOffset": { "x": 0.0, "y": 0.0 },
          "Enable": true
        },
        {
          "@type": "script.PortalGate",
          "DestinationGroup": "town",
          "PortalColor": "white",
          "TargetMapName": "town",
          "TargetPosition": { "x": 10.0, "y": -2.0 },
          "Enable": true
        },
        {
          "@type": "script.PlaceableFurniture",
          "ItemId": "Boat",
          "BlocksMovement": false,
          "Enable": true
        }
      ],
      "@version": 1
    }
  };
  ents.push(boatEnt);
  console.log(` - Created Furniture_Boat at (${dockX}, ${dockY - 0.8}) in template_field.map`);
}

fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully added Pier and Boat to template_field.map!");
