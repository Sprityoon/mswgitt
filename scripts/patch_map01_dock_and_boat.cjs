const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const mapPath = path.join(ROOT, "map/map01.map");

const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const ents = mapJson.ContentProto.Entities;

// Remove any existing Furniture_Pier or Furniture_Boat entities to avoid duplicates
const filteredEnts = ents.filter(e => {
  const name = e.jsonString && e.jsonString.name;
  return name !== "Furniture_Pier" && name !== "Furniture_Boat" && name !== "Pier" && name !== "Boat";
});

// Pier Entity (Wood Pier Deck)
const pierId = "7a8b9c0d-1111-4444-8888-000000000001";
const pierEnt = {
  id: pierId,
  path: "/maps/map01/Furniture_Pier",
  componentNames: "MOD.Core.TransformComponent,MOD.Core.SpriteRendererComponent,script.PlaceableFurniture",
  jsonString: {
    name: "Furniture_Pier",
    path: "/maps/map01/Furniture_Pier",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 30,
    pathConstraints: "///",
    revision: 1,
    origin: {
      type: "Model",
      entry_id: "furniture_pier",
      sub_entity_id: null,
      root_entity_id: pierId,
      replaced_model_id: null
    },
    modelId: "furniture_pier",
    "@components": [
      {
        "@type": "MOD.Core.TransformComponent",
        "Rotation": { "x": 0, "y": 0, "z": 0 },
        "Position": { "x": 0, "y": -23.8, "z": 0 },
        "QuaternionRotation": { "x": 0, "y": 0, "z": 0, "w": 1 },
        "Scale": { "x": 0.25, "y": 0.25, "z": 1 },
        "ZRotation": 0,
        "Enable": true
      },
      {
        "@type": "MOD.Core.SpriteRendererComponent",
        "ActionSheet": {},
        "DrawMode": 0,
        "EndFrameIndex": 2147483647,
        "FlipX": false,
        "FlipY": false,
        "IgnoreMapLayerCheck": true,
        "OrderInLayer": 2,
        "PlayRate": 1,
        "RenderSetting": 0,
        "SortingLayer": "MapLayer5",
        "SpriteRUID": "8d356cf966cd47a3a972e5bcf952c51c",
        "StartFrameIndex": 0,
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

// Boat Entity (Wooden Rowboat Departure Portal)
const boatId = "7a8b9c0d-2222-4444-8888-000000000002";
const boatEnt = {
  id: boatId,
  path: "/maps/map01/Furniture_Boat",
  componentNames: "MOD.Core.TransformComponent,MOD.Core.SpriteRendererComponent,MOD.Core.TriggerComponent,script.PortalGate,script.PlaceableFurniture",
  jsonString: {
    name: "Furniture_Boat",
    path: "/maps/map01/Furniture_Boat",
    nameEditable: true,
    enable: true,
    visible: true,
    localize: false,
    displayOrder: 31,
    pathConstraints: "///",
    revision: 1,
    origin: {
      type: "Model",
      entry_id: "furniture_boat",
      sub_entity_id: null,
      root_entity_id: boatId,
      replaced_model_id: null
    },
    modelId: "furniture_boat",
    "@components": [
      {
        "@type": "MOD.Core.TransformComponent",
        "Rotation": { "x": 0, "y": 0, "z": 0 },
        "Position": { "x": 0, "y": -25.8, "z": 0 },
        "QuaternionRotation": { "x": 0, "y": 0, "z": 0, "w": 1 },
        "Scale": { "x": 0.8, "y": 0.8, "z": 1 },
        "ZRotation": 0,
        "Enable": true
      },
      {
        "@type": "MOD.Core.SpriteRendererComponent",
        "ActionSheet": {},
        "DrawMode": 0,
        "EndFrameIndex": 2147483647,
        "FlipX": false,
        "FlipY": false,
        "IgnoreMapLayerCheck": true,
        "OrderInLayer": 20,
        "PlayRate": 1,
        "RenderSetting": 0,
        "SortingLayer": "MapLayer5",
        "SpriteRUID": "d1e1d2b20a104e17950d35ec8860c349",
        "StartFrameIndex": 0,
        "Color": { "r": 1, "g": 1, "b": 1, "a": 1 },
        "Enable": true
      },
      {
        "@type": "MOD.Core.TriggerComponent",
        "BoxSize": { "x": 2, "y": 2 },
        "ColliderOffset": { "x": 0, "y": 0 },
        "IsPassive": true,
        "IsLegacy": false,
        "Enable": true
      },
      {
        "@type": "script.PortalGate",
        "TargetMapName": "town",
        "TargetPosition": { "x": 10, "y": -2 },
        "InteractLabel": "마을로 출항하기",
        "PortalColor": "white",
        "DestinationGroup": "town",
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

filteredEnts.push(pierEnt);
filteredEnts.push(boatEnt);

mapJson.ContentProto.Entities = filteredEnts;
fs.writeFileSync(mapPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully patched map01.map with Furniture_Pier and Furniture_Boat entities!");
