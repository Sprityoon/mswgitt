const path = require('path');
const fs = require('fs');
const { ModelBuilder } = require(path.join(__dirname, '../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs'));

const rootDir = path.join(__dirname, '..');

// 1. Dynamic=true, IsUnit=true 3 models: Animal_Chicken, Animal_Sheep, Pet_Dog
const dynamicModels = [
  'RootDesk/MyDesk/MapObjects/Models/Animal_Chicken.model',
  'RootDesk/MyDesk/MapObjects/Models/Animal_Sheep.model',
  'RootDesk/MyDesk/MapObjects/Models/Pet_Dog.model'
];

dynamicModels.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  console.log('Patching dynamic model:', relPath);
  const mb = ModelBuilder.load(fullPath);
  if (!mb.hasComponent('script.YSortSprite')) {
    mb.addComponent('script.YSortSprite');
  }
  mb.value('script.YSortSprite', 'Dynamic', true, 'bool');
  mb.value('script.YSortSprite', 'IsUnit', true, 'bool');
  mb.write(fullPath);
});

// 2. Animal_Cat model (already has YSortSprite with Dynamic=true, update IsUnit=true)
const catPath = path.join(rootDir, 'RootDesk/MyDesk/MapObjects/Models/Animal_Cat.model');
console.log('Patching Animal_Cat model');
const catMb = ModelBuilder.load(catPath);
if (!catMb.hasComponent('script.YSortSprite')) {
  catMb.addComponent('script.YSortSprite');
}
catMb.value('script.YSortSprite', 'Dynamic', true, 'bool');
catMb.value('script.YSortSprite', 'IsUnit', true, 'bool');
catMb.write(catPath);

// 3. NPC 7 models (already have YSortSprite with Dynamic=false, update IsUnit=true)
const npcModels = [
  'RootDesk/MyDesk/NPC/Models/Merchant.model',
  'RootDesk/MyDesk/NPC/Models/Villager_Elder.model',
  'RootDesk/MyDesk/NPC/Models/Villager_Fisher.model',
  'RootDesk/MyDesk/NPC/Models/Villager_ResidentA.model',
  'RootDesk/MyDesk/NPC/Models/Villager_ResidentB.model',
  'RootDesk/MyDesk/NPC/Models/Villager_ResidentC.model',
  'RootDesk/MyDesk/NPC/Models/Villager_ResidentD.model'
];

npcModels.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  console.log('Patching NPC model:', relPath);
  const mb = ModelBuilder.load(fullPath);
  if (!mb.hasComponent('script.YSortSprite')) {
    mb.addComponent('script.YSortSprite');
  }
  mb.value('script.YSortSprite', 'Dynamic', false, 'bool');
  mb.value('script.YSortSprite', 'IsUnit', true, 'bool');
  mb.write(fullPath);
});

console.log('Successfully patched all T97 target models!');
