"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// 1. item_dataset.csv
const itemCsvPath = path.join(ROOT, "RootDesk/MyDesk/item/DataSets/item_dataset.csv");
let itemCsv = fs.readFileSync(itemCsvPath, "utf8").trim();
const newItems = [
  "pig_ribbon,Pig Ribbon,돼지 리본,Item_Wood,2cb8f37e-ef6b-4e17-86fb-d940f18a7412,resource,,0,0c2847f2816d47f092f8348122008d7b,,Common,true,리본돼지가 매고 있던 앙증맞은 붉은 리본.,,,,,,,,,,,,,,,,,,,0,0,0,0,false,",
  "orange_mushroom_cap,Orange Mushroom Cap,주황버섯 갓,Item_Wood,2cb8f37e-ef6b-4e17-86fb-d940f18a7412,resource,,0,0ed1b7cbeece48fa87e5f9ea37096d8d,,Common,true,주황버섯의 탱탱하고 탄력 있는 주황빛 갓.,,,,,,,,,,,,,,,,,,,0,0,0,0,false,",
  "boar_leather,Boar Leather,멧돼지 가죽,Item_Wood,2cb8f37e-ef6b-4e17-86fb-d940f18a7412,resource,,0,0168adce54424b6abd9e6bc9db2ddb36,,Common,true,거칠고 질긴 멧돼지 가죽. 방어구와 가방 제작의 기초 소재.,,,,,,,,,,,,,,,,,,,0,0,0,0,false,"
];

for (const itemLine of newItems) {
  const id = itemLine.split(",")[0];
  if (!itemCsv.includes(`${id},`)) {
    itemCsv += "\n" + itemLine;
    console.log(`Added ${id} to item_dataset.csv`);
  }
}
fs.writeFileSync(itemCsvPath, itemCsv + "\n", "utf8");

// 2. MonsterSpawnDataSet.csv
const spawnCsvPath = path.join(ROOT, "RootDesk/MyDesk/Monster/DataSets/MonsterSpawnDataSet.csv");
let spawnLines = fs.readFileSync(spawnCsvPath, "utf8").trim().split(/\r?\n/);
let updatedSpawn = [];
for (const line of spawnLines) {
  if (line.startsWith("earth_field,slime,")) {
    updatedSpawn.push("earth_field,slime,70,1.0,1.0");
  } else if (line.startsWith("earth_field,boar,")) {
    updatedSpawn.push("earth_field,ribbon_pig,60,1.0,1.0");
    updatedSpawn.push("earth_field,orange_mushroom,40,1.0,1.0");
    updatedSpawn.push("earth_field,boar,30,1.4,1.2");
  } else {
    updatedSpawn.push(line);
  }
}
fs.writeFileSync(spawnCsvPath, updatedSpawn.join("\n") + "\n", "utf8");
console.log("Updated MonsterSpawnDataSet.csv");

// 3. MonsterCoinDropDataSet.csv
const coinCsvPath = path.join(ROOT, "RootDesk/MyDesk/Monster/DataSets/MonsterCoinDropDataSet.csv");
let coinCsv = fs.readFileSync(coinCsvPath, "utf8").trim();
if (!coinCsv.includes("ribbon_pig,")) {
  coinCsv += "\nribbon_pig,0.6,1,2,리본돼지,95ee32092238462dbdbe65591979bf18";
  console.log("Added ribbon_pig to MonsterCoinDropDataSet.csv");
}
if (!coinCsv.includes("orange_mushroom,")) {
  coinCsv += "\norange_mushroom,0.75,2,4,주황버섯,ca3a6ed536d24949b79d3f7b430cb82a";
  console.log("Added orange_mushroom to MonsterCoinDropDataSet.csv");
}
fs.writeFileSync(coinCsvPath, coinCsv + "\n", "utf8");

// 4. ItemDropDataSet.csv
const dropCsvPath = path.join(ROOT, "RootDesk/MyDesk/MapObjects/DataSets/ItemDropDataSet.csv");
let dropCsv = fs.readFileSync(dropCsvPath, "utf8").trim();
const newDrops = [
  "ribbon_pig,,raw_meat,1,1,0.5,true,",
  "ribbon_pig,,pig_ribbon,1,1,0.25,,",
  "orange_mushroom,,orange_mushroom_cap,1,2,0.45,true,",
  "boar,,boar_leather,1,1,0.3,,"
];
for (const dropLine of newDrops) {
  const parts = dropLine.split(",");
  const key = `${parts[0]},${parts[1]},${parts[2]}`;
  if (!dropCsv.includes(key)) {
    dropCsv += "\n" + dropLine;
    console.log(`Added ${key} to ItemDropDataSet.csv`);
  }
}
fs.writeFileSync(dropCsvPath, dropCsv + "\n", "utf8");

console.log("All F1 ecosystem datasets applied successfully!");
