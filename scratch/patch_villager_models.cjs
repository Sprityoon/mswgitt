const path = require("path");
const { ModelBuilder } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");

const models = [
  { file: "Villager_ResidentA.model", npcId: "researcher" },
  { file: "Villager_ResidentB.model", npcId: "vendor" },
  { file: "Villager_ResidentC.model", npcId: "blacksmith" },
  { file: "Villager_ResidentD.model", npcId: "barnkeeper" }
];

for (const m of models) {
  const modelPath = path.join(__dirname, "..", "RootDesk", "MyDesk", "NPC", "Models", m.file);
  console.log(`Patching ${m.file} NpcId -> ${m.npcId}...`);
  const b = ModelBuilder.read(modelPath);
  b.value("script.VillagerDialog", "NpcId", m.npcId, "string");
  b.write(modelPath);
  console.log(`Successfully patched ${m.file}`);
}
