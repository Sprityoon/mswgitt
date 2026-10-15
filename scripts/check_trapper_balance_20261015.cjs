"use strict";
// 설계 회귀: 필수화 방지 화력 예산·상의 파츠 기회비용·실제 데이터 참조를 검사한다. Play 대체 아님.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { read } = require("./skill_pipeline_csv.cjs");
const root = "RootDesk/MyDesk/";
const tables = ["Player/DataSets/SkillDataSet.csv", "Player/DataSets/WeaponAttackDataSet.csv",
  "item/DataSets/item_dataset.csv", "item/DataSets/RecipeDataSet.csv", "item/DataSets/EnchantPartDataSet.csv"];
const [skills, basics, items, recipes, parts] = tables.map(p => read(root + p));
for (const table of [skills, basics, items, recipes, parts]) {
  assert.equal(new Set(table.headers).size, table.headers.length, "duplicate column");
}
const find = (data, key, id) => {
  const rows = data.rows.filter(r => r[key] === id);
  assert.equal(rows.length, 1, `missing/duplicate ${key}=${id}`);
  return rows[0];
};
const axe = find(skills, "SkillId", "hand_axe_throw"), scatter = find(skills, "SkillId", "shatter_scatter");
const dagger = find(basics, "Key", "Dagger_Throw_1"), pouch = find(items, "Name", "Hand Axe Pouch");
const part = find(parts, "PartId", pouch.Name), recipe = find(recipes, "RecipeName", pouch.Name);
assert.equal(pouch.EquipSlot, "shield", "pouch must compete with other auxiliary equipment");
assert.equal(part.TargetSlot, "armor", "pouch enchant must consume a torso slot");
assert.equal(pouch.PerkStat, part.StatType);
assert.equal(part.ValueFormat, "flag");
assert.equal(+pouch.PerkValue, 1);
for (const grade of ["D", "C", "B", "A", "S"]) {
  assert.equal(+part[`Val${grade}_Min`], 1);
  assert.equal(+part[`Val${grade}_Max`], 1, "grades must not add mandatory damage bonuses");
}
for (const id of ["hand_axe_throw", "gigantic_rock", "shatter_scatter"]) {
  const r = find(skills, "SkillId", id);
  assert.equal(r.RequireEquippedItem, "Hand Axe", "default direct-hold risk must remain");
  assert.equal(r.EquipBypassStat, pouch.PerkStat);
  assert.equal(r.ConsumeItem, "Hand Axe");
  assert.equal(+r.ConsumeCount, 1);
}
for (const key of ["Ing1Name", "Ing2Name"]) find(items, "Name", recipe[key]);
assert(+recipe.Ing1Count > 0 && +recipe.Ing2Count > 0 && +recipe.Tier >= 2);
assert.equal(scatter.ParentSkillId, axe.SkillId);
assert.equal(+scatter.ParentRequiredLevel, 3);
assert(+scatter.ManaCost > 0 && +scatter.StaminaCost > +axe.StaminaCost);
assert.equal(+scatter.Knockback, 0, "first pellet must not push the victim out of the volley");
assert(+scatter.ProjectileSpawnDistance <= +scatter.ProjectileSize / 2, "point-blank launch must cover caster frontage");
assert(+dagger.ProjectileSpawnDistance <= +dagger.ProjectileSize / 2);

const pc = fs.readFileSync(root + "Player/Scripts/PlayerController.mlua", "utf8");
const property = name => +pc.match(new RegExp(`property number ${name} = ([0-9.]+)`))[1];
const base = +fs.readFileSync(root + "Player/Scripts/PlayerCombat.mlua", "utf8").match(/property integer BaseDamage = (\d+)/)[1];
const ammo = find(skills, "SkillId", "thrifty_hands"), mastery = find(skills, "SkillId", "throw_mastery");
const throwBonus = +ammo.PassiveValue2 * +ammo.MaxLevel;
const basicBonus = +mastery.PassiveValue2 * +mastery.MaxLevel;
const mul = (r, lv) => +r.DamageMultiplier + +r.DamagePerLevel * (lv - 1);
const cd = (r, lv) => +r.Cooldown + +r.CooldownPerLevel * (lv - 1);
const result = [];
for (const [lv, str, weaponName] of [[10, 20, "Hunter Dagger"], [16, 35, "Veteran Hunter Knife"], [25, 40, "Red Claw Dagger"]]) {
  const weapon = find(items, "Name", weaponName);
  const char = Math.floor(base + (lv - 1) * property("LevelPowerGrowth") + str * property("StatPowerPerPoint"));
  const core = char + +weapon.Attack + +weapon.SkillAttack;
  const raw = (r, skLv) => Math.floor((core + +r.SkillPower) * mul(r, skLv) * (1 + throwBonus));
  // 단검 기본 투척은 스킬 공격력·주먹도끼 기본 위력을 받지 않는 실제 별도 경로다.
  const basicRaw = Math.floor(Math.floor((char + +weapon.Attack) * +dagger.Multiplier) * (1 + basicBonus));
  const basicCd = Math.max(0.2, property("MineCooldown") / (1 + str * property("StrSpeedPerPoint")));
  for (const defense of [0, 10]) {
    const hit = damage => Math.max(1, Math.floor(damage - defense));
    const axeDps = hit(raw(axe, +axe.MaxLevel)) / cd(axe, +axe.MaxLevel);
    const basicDps = hit(basicRaw) / basicCd;
    const scatter3Dps = hit(raw(scatter, +scatter.MaxLevel)) * 3 / cd(scatter, +scatter.MaxLevel);
    const scatter5Dps = hit(raw(scatter, +scatter.MaxLevel)) * 5 / cd(scatter, +scatter.MaxLevel);
    assert(basicDps >= axeDps, `trained dagger sustained fire must not require the axe gimmick: Lv${lv} def${defense} dagger=${basicDps} axe=${axeDps}`);
    assert(scatter3Dps > axeDps && scatter5Dps > scatter3Dps, "upper scatter must reward close accuracy");
    assert(hit(raw(scatter, 1)) * 5 / cd(scatter, 1) > hit(raw(axe, 3)) / cd(axe, 3), "unlocking the upper skill must be an upgrade");
    result.push({ level: lv, weapon: weaponName, defense, daggerDps: +basicDps.toFixed(1), axeDps: +axeDps.toFixed(1), scatter3Dps: +scatter3Dps.toFixed(1), scatter5Dps: +scatter5Dps.toFixed(1) });
  }
}
console.table(result);
console.log("PASS: optional axe budget, dagger sustain, upper-skill burst, equipped-only capability data, armor-only limited enchant, ammo and recipe integrity");
