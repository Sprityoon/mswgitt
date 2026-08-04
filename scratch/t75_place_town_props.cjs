/**
 * T75 — 마을 소품 P1~P11 .model 생성 + town.map 배치
 * T100 회피책: 순수 데코 = Trigger+YSortSprite만 (Occ/상호작용 스크립트 없음)
 * 차단 소품 = Trigger + ResourceOccupiedArea(BlocksMovement)
 */
"use strict";
const path = require("path");
const fs = require("fs");
const {
  ModelBuilder,
  vector2,
  vector3,
} = require(path.join(__dirname, "..", ".claude", "skills", "msw-general", "scripts", "model", "msw_model_builder.cjs"));
const { MapBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-general", "scripts", "map", "msw_map_builder.cjs"));

const TEMPLATE = path.join(
  __dirname,
  "..",
  ".claude",
  "skills",
  "msw-general",
  "models",
  "MapObject.model"
);
const OUT_DIR = path.join("RootDesk", "MyDesk", "MapObjects", "Models");

// artwork-spec §4 검증 완료 RUID
const PROPS = [
  {
    id: "P1",
    name: "Prop_LampPost",
    ruid: "055b5b19b938480ba40cb6549bdc4da8",
    occ: false,
    box: [0.45, 0.5],
    off: [0, -0.1],
    places: [
      [5, 2], [-5, 2], [5, -8], [-5, -8],
      [12, 0], [-12, 0], [0, 8], [0, -10],
    ],
  },
  {
    id: "P2",
    name: "Prop_StakeFence",
    ruid: "e43df25f64ba4673acb95e84814aed2e",
    occ: true,
    box: [3.2, 0.55],
    off: [0, -0.1],
    places: [[-14, 4], [14, 4], [-14, -10], [14, -10]],
  },
  {
    id: "P3",
    name: "Prop_WhiteFence",
    ruid: "58c7377fb81d439f9d097683224b1dbc",
    occ: true,
    box: [3.4, 0.6],
    off: [0, -0.1],
    places: [[8, 7], [4, 7], [10, 3]],
  },
  {
    id: "P4",
    name: "Prop_Signpost",
    ruid: "be45d53696de43ffa3c659cc53a03529",
    occ: false,
    box: [0.5, 0.5],
    off: [0, -0.1],
    places: [[2, 9], [-2, -12], [14, 1]],
  },
  {
    id: "P5",
    name: "Prop_Bench",
    ruid: "9c977980eb414e149878c027f8a30755",
    occ: false,
    box: [0.9, 0.45],
    off: [0, -0.1],
    places: [[2.5, -2], [-2.5, -2], [2.5, 1.2], [-2.5, 1.2]],
  },
  {
    id: "P6",
    name: "Prop_FlowerBed",
    ruid: "77a93f102bf2486db210803a14267fb7",
    occ: false,
    box: [0.9, 0.5],
    off: [0, -0.1],
    places: [[3, -5], [-3, -5], [-7, 3], [7, 3], [-1, 5], [1, -7]],
  },
  {
    id: "P7",
    name: "Prop_Barrel",
    ruid: "6db04f1549554ff09a51f949c93108d5",
    occ: true,
    box: [0.9, 0.65],
    off: [0, -0.1],
    places: [[16.5, 3], [17.5, 5], [-6.5, -7.5]],
  },
  {
    id: "P8",
    name: "Prop_CrateStack",
    ruid: "a1899b99ce5c4bbf80265a2b55977b27",
    occ: true,
    box: [0.95, 0.7],
    off: [0, -0.1],
    places: [[-5.2, -5.2], [-7.2, -7.2], [17, 2.8]],
  },
  {
    id: "P9",
    name: "Prop_JarSet",
    ruid: "b3d52eecbd114f629c8ff05d36de4de7",
    occ: false,
    box: [0.7, 0.45],
    off: [0, -0.1],
    places: [[-4.2, 3.8], [-15.2, 3.2], [-11.2, 10.2]],
  },
  {
    id: "P10",
    name: "Prop_Cart",
    ruid: "9ae1efe54bd54f33ac437082312b1d69",
    occ: true,
    box: [1.5, 0.7],
    off: [0, -0.1],
    places: [[-4.5, -10], [15.5, 2.2]],
  },
  {
    id: "P11",
    name: "Prop_Banner",
    ruid: "b4f985e6aff343c5984f8e5d6e70a891",
    occ: false,
    box: [0.4, 0.5],
    off: [0, -0.1],
    places: [[-6.5, -5], [-3.5, -6.5], [5.2, 5.2], [7.5, 5.2]],
  },
];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const p of PROPS) {
  const out = path.join(OUT_DIR, `${p.name}.model`);
  const b = ModelBuilder.fromTemplate(TEMPLATE, p.name);
  b.component("MOD.Core.TriggerComponent")
    .component("script.YSortSprite")
    .value("MOD.Core.SpriteRendererComponent", "SpriteRUID", p.ruid, "string")
    .value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer5", "string")
    .value("MOD.Core.SpriteRendererComponent", "OrderInLayer", 2, "int")
    .value("MOD.Core.TriggerComponent", "BoxSize", vector2(p.box[0], p.box[1]), "vector2")
    .value("MOD.Core.TriggerComponent", "ColliderOffset", vector2(p.off[0], p.off[1]), "vector2")
    .value("MOD.Core.TriggerComponent", "IsPassive", true, "bool")
    .value("MOD.Core.TriggerComponent", "IsLegacy", false, "bool")
    .value("script.YSortSprite", "Dynamic", false, "bool")
    .value("script.YSortSprite", "IsUnit", false, "bool")
    .value("script.YSortSprite", "SortYOffset", 0, "float");

  if (p.occ) {
    b.component("script.ResourceOccupiedArea")
      .value("script.ResourceOccupiedArea", "BlocksMovement", true, "bool")
      .value("script.ResourceOccupiedArea", "OffsetXMin", 0, "float")
      .value("script.ResourceOccupiedArea", "OffsetXMax", 0, "float")
      .value("script.ResourceOccupiedArea", "OffsetYMin", 0, "float")
      .value("script.ResourceOccupiedArea", "OffsetYMax", 0, "float");
  }

  b.write(out);
  console.log(`MODEL ${p.id} ${p.name} occ=${p.occ} places=${p.places.length}`);
}

const map = MapBuilder.read("map/town.map");
let placed = 0;
for (const p of PROPS) {
  const modelPath = path.join(OUT_DIR, `${p.name}.model`);
  p.places.forEach((xy, i) => {
    const entName = `${p.name}_${i + 1}`;
    if (map.find(entName)) {
      console.log(`SKIP exists ${entName}`);
      return;
    }
    map.placeModel(entName, modelPath, {
      pos: [xy[0], xy[1], 0],
      componentOverrides: {
        "MOD.Core.SpriteRendererComponent": {
          SortingLayer: "MapLayer5",
          OrderInLayer: 2,
        },
      },
    });
    placed++;
  });
}
map.write("map/town.map");
console.log(`PLACED ${placed} instances on town.map`);
