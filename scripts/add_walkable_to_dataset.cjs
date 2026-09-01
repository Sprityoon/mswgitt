const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const csvPath = path.join(ROOT, "RootDesk/MyDesk/item/DataSets/item_dataset.csv");
let content = fs.readFileSync(csvPath, "utf8");

// Handle BOM if present
let hasBOM = false;
if (content.charCodeAt(0) === 0xFEFF) {
  hasBOM = true;
  content = content.slice(1);
}

const lines = content.split(/\r?\n/);
if (lines.length < 2) process.exit(1);

const header = lines[0];
const cols = header.split(",");

let walkableIdx = cols.indexOf("Walkable");
if (walkableIdx === -1) {
  cols.push("Walkable");
  walkableIdx = cols.length - 1;
  lines[0] = cols.join(",");
}

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.length === 0) continue;
  const rowCols = lines[i].split(",");
  while (rowCols.length < cols.length) {
    rowCols.push("");
  }
  const id = rowCols[0].trim();
  const name = rowCols[1].trim();

  // Set Walkable true for pier
  if (id === "pier" || name === "Pier") {
    rowCols[walkableIdx] = "true";
  } else {
    rowCols[walkableIdx] = "false";
  }
  lines[i] = rowCols.join(",");
}

const outContent = (hasBOM ? "\uFEFF" : "") + lines.join("\r\n");
fs.writeFileSync(csvPath, outContent, "utf8");
console.log("Successfully added Walkable column to item_dataset.csv!");
