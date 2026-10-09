// town.map GrownGrass(공식 맵 오브젝트 — 모델은 builder로 못 고침, pitfalls #13) 인스턴스에 YSortSprite 를 붙인다.
// 없으면 고정 OrderInLayer(0/5)로 남아 Y 정렬되는 모든 물체(6000+) 아래에 항상 깔린다 (2026-10-07).
const fs = require("fs");
const path = require("path");
const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");
const root = path.join(__dirname, "..");
const mapPath = path.join(root, "map", "town.map");
const log = console.log;
console.log = () => {};
const backup = path.join(root, "scratch", "town-before-grassysort-20261007.map");
if (!fs.existsSync(backup)) fs.copyFileSync(mapPath, backup); // 재실행 시 첫 백업을 덮지 않는다
const map = MapBuilder.read(mapPath);
const grass = map.listEntities().filter((e) => /^GrownGrass/.test(e.name));
// 잔디 스프라이트(88×104, 피벗 43,52 = 그림 한가운데)라 엔티티 위치는 바닥보다 0.52×Scale 위다.
// Trigger·충돌 박스가 없어 접지선 = 위치 + SortYOffset 이므로 오프셋으로 그림 바닥까지 내린다.
const PIVOT_TO_BOTTOM = 0.52;
let added = 0;
for (const e of grass) {
  const t = map.component(e.path, "MOD.Core.TransformComponent");
  const sy = t && t.Scale && typeof t.Scale.y === "number" ? Math.abs(t.Scale.y) : 1;
  const offset = -Math.round(PIVOT_TO_BOTTOM * sy * 1000) / 1000;
  map.upsertComponent(e.path, "script.YSortSprite", { "@type": "script.YSortSprite", Enable: true, Dynamic: false, IsUnit: false, SortYOffset: offset });
  added++;
}
map.write(mapPath);
const check = MapBuilder.read(mapPath);
const ok = check.listEntities().filter((e) => /^GrownGrass/.test(e.name) && check.component(e.path, "script.YSortSprite") && /script\.YSortSprite/.test(check.find(e.path).componentNames));
log(`GrownGrass ${grass.length}, added ${added}, verified ${ok.length}`);
