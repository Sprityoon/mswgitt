const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapFiles = ["map/map01.map", "map/town.map", "map/template_field.map", "map/template_boss.map"];

mapFiles.forEach(rel => {
  const mapPath = path.resolve(__dirname, "..", rel);
  if (!fs.existsSync(mapPath)) return;
  const data = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  let fixedCount = 0;
  if (data.ContentProto && data.ContentProto.Entities) {
    data.ContentProto.Entities.forEach(e => {
      if (e.id && !guidRegex.test(e.id)) {
        const oldId = e.id;
        e.id = crypto.randomUUID();
        console.log(`[FIX] ${rel} entity '${e.jsonString ? e.jsonString.name : "unnamed"}' id: ${oldId} -> ${e.id}`);
        fixedCount++;
      }
    });
  }
  if (fixedCount > 0) {
    fs.writeFileSync(mapPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`Successfully fixed ${fixedCount} invalid GUIDs in ${rel}`);
  }
});
