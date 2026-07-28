const fs = require('fs');
const path = require('path');

function removeFishingSpotFromMap(mapPath) {
  if (!fs.existsSync(mapPath)) return;
  const content = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  
  function filterEntities(obj) {
    if (Array.isArray(obj)) {
      return obj.filter(item => {
        if (item && item.jsonString && item.jsonString.name === 'FishingSpot') {
          console.log(`Removing FishingSpot entry from ${path.basename(mapPath)}`);
          return false;
        }
        filterEntities(item);
        return true;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          obj[key] = filterEntities(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          filterEntities(obj[key]);
        }
      }
    }
    return obj;
  }

  filterEntities(content);
  fs.writeFileSync(mapPath, JSON.stringify(content, null, 2), 'utf8');
}

const map01Path = path.join(__dirname, '../map/map01.map');
const fieldPath = path.join(__dirname, '../map/template_field.map');

removeFishingSpotFromMap(map01Path);
removeFishingSpotFromMap(fieldPath);
