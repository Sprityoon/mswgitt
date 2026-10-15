"use strict";
// 기존 CSV 소유권·아이템 키·슬롯/강화 파이프라인을 유지하는 투척 밸런스 패치.
const { read, write } = require("./skill_pipeline_csv.cjs");
const path = "RootDesk/MyDesk/";
function column(data, name) {
  if (!data.headers.includes(name)) data.headers.push(name);
}
function patch(data, key, id, values) {
  const row = data.rows.find(r => r[key] === id);
  if (!row) throw Error(`Missing ${key}: ${id}`);
  Object.assign(row, values);
}
function upsert(data, key, values) {
  const row = data.rows.find(r => r[key] === values[key]);
  if (row) Object.assign(row, values);
  else data.rows.push(values);
}
const skillPath = path + "Player/DataSets/SkillDataSet.csv";
const skills = read(skillPath);
for (const name of ["EquipBypassStat", "EquipBypassLabel", "ProjectileSpawnDistance"]) column(skills, name);
for (const id of ["hand_axe_throw", "gigantic_rock", "shatter_scatter"]) {
  patch(skills, "SkillId", id, { EquipBypassStat: "HandAxePouch", EquipBypassLabel: "주먹도끼 주머니" });
}
patch(skills, "SkillId", "hand_axe_throw", {
  Cooldown: "1.5", DamageMultiplier: "1.2", DamagePerLevel: "0.15", SkillPower: "8", ProjectileLife: "0.65",
  Description: "주먹도끼를 들고 1개를 던지는 단발 투척입니다. 주먹도끼 주머니 장비 효과가 있으면 다른 무기를 든 채 가방의 탄약을 씁니다.",
});
patch(skills, "SkillId", "shatter_scatter", {
  Cooldown: "3", DamageMultiplier: "1.1", DamagePerLevel: "0.2", SpreadDegrees: "40",
  ProjectileSize: "1.0", ProjectileScale: "0.8", ProjectileSpawnDistance: "0.4", Knockback: "0",
  Description: "주먹도끼 1개와 MP로 5개의 파편을 부채꼴로 흩뿌립니다. 근접할수록 여러 파편이 적중하며 적을 밀어내지 않습니다. 주머니 장비 효과로 직접 들기를 생략할 수 있습니다.",
});
write(skillPath, skills);

const basicPath = path + "Player/DataSets/WeaponAttackDataSet.csv";
const basics = read(basicPath);
column(basics, "ProjectileSpawnDistance");
patch(basics, "Key", "Dagger_Throw_1", { Multiplier: "1.15", ProjectileSpawnDistance: "0.4" });
write(basicPath, basics);

const itemPath = path + "item/DataSets/item_dataset.csv";
const items = read(itemPath);
const genericDrop = items.rows.find(r => r.Name === "Boar Leather");
if (!genericDrop) throw Error("Missing generic item drop model");
const icon = "c3149183777c4089b830c192e2a8ca53";
upsert(items, "Name", {
  id: "hand_axe_pouch", Name: "Hand Axe Pouch", DisplayName: "주먹도끼 주머니",
  ModelName: genericDrop.ModelName, EntryId: genericDrop.EntryId,
  Category: "equipment", ToolPower: "0", IconRUID: icon, Rarity: "Uncommon", Tradable: "true",
  Description: "주먹도끼를 꺼내 던지기 편한 가죽 주머니. 보조 장비로 착용하거나 모루에서 상의의 마법 부여 슬롯 하나에 합칠 수 있습니다.",
  MaxStack: "1", Attack: "0", MagicAttack: "0", SkillAttack: "0", Defense: "0",
  EquipSlot: "shield", EquipLevel: "5", Walkable: "false",
  PerkStat: "HandAxePouch", PerkValue: "1",
  PerkDesc: "주먹도끼 주머니: 다른 무기를 든 채 주먹도끼 투척 계열을 사용할 수 있습니다. 탄약 보유·소모는 필요합니다. 보유만 해서는 효과가 없습니다.",
});
write(itemPath, items);

const recipePath = path + "item/DataSets/RecipeDataSet.csv";
const recipes = read(recipePath);
upsert(recipes, "RecipeName", {
  RecipeName: "Hand Axe Pouch", Desc: "보조 장비 · 주먹도끼를 가방 탄약으로 투척 · 상의 마법 부여 파츠 겸용",
  Icon: icon, Ing1Name: "Boar Leather", Ing1Count: "6", Ing2Name: "Copper Bar", Ing2Count: "2",
  Tier: "2", Category: "equipment", UnlockId: "", UnlockHint: "",
});
write(recipePath, recipes);

const partPath = path + "item/DataSets/EnchantPartDataSet.csv";
const parts = read(partPath);
column(parts, "ValueFormat");
const part = { PartId: "Hand Axe Pouch", DisplayName: "주먹도끼 주머니", TargetSlot: "armor",
  StatType: "HandAxePouch", StatLabel: "주먹도끼 주머니", Pct: "false", ValueFormat: "flag",
  MinResearchLv: "2", SWeightScale: "1" };
// 기능의 유무만 결정한다. 등급으로 피해·탄약 보존을 추가하지 않는다.
for (const grade of ["D", "C", "B", "A", "S"]) {
  part[`Val${grade}_Min`] = "1";
  part[`Val${grade}_Max`] = "1";
}
upsert(parts, "PartId", part);
write(partPath, parts);
console.log("Applied: held-weapon balance data, 3 conditional throw skills, dagger, pouch recipe and armor enchant");
