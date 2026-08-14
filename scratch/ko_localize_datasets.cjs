"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\r") continue;
    else if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r[0] || "") !== "");
}

function esc(s) {
  s = String(s ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCSV(filePath, rows, meta) {
  const body = rows.map((r) => r.map(esc).join(",")).join(meta.nl) + meta.nl;
  fs.writeFileSync(filePath, meta.bom + body, "utf8");
}

function loadCSV(rel) {
  const filePath = path.join(ROOT, rel);
  const buf = fs.readFileSync(filePath);
  const bom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const text = buf.toString("utf8").replace(/^\uFEFF/, "");
  const nl = text.includes("\r\n") ? "\r\n" : "\n";
  return { filePath, rows: parseCSV(text), meta: { bom: bom ? "\uFEFF" : "", nl } };
}

const DISPLAY = {
  Wood: "나무",
  Stone: "돌",
  "Copper Ore": "구리 광석",
  Grass: "풀",
  "Hand Axe": "손도끼",
  "Stone Pickaxe": "돌 곡괭이",
  "Stone Axe": "돌 도끼",
  "Wooden Chest": "나무 상자",
  Furnace: "화로",
  "Iron Ore": "철 광석",
  "Copper Bar": "구리 주괴",
  "Iron Bar": "철 주괴",
  "Wood Floor": "나무 바닥",
  Portal: "포탈",
  "Copper Pickaxe": "구리 곡괭이",
  "Copper Axe": "구리 도끼",
  "Iron Pickaxe": "철 곡괭이",
  "Iron Axe": "철 도끼",
  Coin: "코인",
  Bed: "침대",
  Shovel: "삽",
  Hoe: "호미",
  "Grass Seed": "풀씨",
  "Carrot Seed": "당근 씨앗",
  Carrot: "당근",
  "Recipe Scroll: Copper Tools": "제작 두루마리: 구리 도구",
  "Recipe Scroll: Iron Tools": "제작 두루마리: 철 도구",
  "Roasted Grass": "구운 풀",
  "Carrot Soup": "당근 수프",
  "Veggie Stir Fry": "야채 볶음",
  "Feast Dish": "잔치 요리",
  "Cooking Pot": "조리 냄비",
  "Fishing Rod": "낚싯대",
  Carp: "잉어",
  Shrimp: "새우",
  Salmon: "연어",
  Tuna: "참치",
  "Raw Meat": "생고기",
  "Roasted Meat": "구운 고기",
  "Animal Pen": "가축우리",
  Egg: "달걀",
  Wool: "양털",
  "Chicken Ticket": "닭 입주권",
  "Sheep Ticket": "양 입주권",
  "Egg Omelette": "달걀 오믈렛",
  "Dog Whistle": "개 호루라기",
  "Monster Ward": "몬스터 와드",
  "Water Spade": "물삽",
};

const DESC = {
  Wood: "부드러운 나뭇가지. 기초 도구를 만드는 데 쓰입니다.",
  Stone: "흔한 돌. 도구와 건물을 만드는 데 쓰입니다.",
  "Copper Ore": "구리 광석 덩어리. 제련하면 구리 주괴가 됩니다.",
  Grass: "부드러운 들풀. 묶거나 보온에 쓸 수 있습니다.",
  "Hand Axe": "주먹에 쥔 거친 돌. 나무를 베는 가장 원시적인 도구입니다.",
  "Stone Pickaxe": "단단한 돌 곡괭이. 큰 돌을 캐는 데 알맞습니다.",
  "Stone Axe": "개량된 도끼. 나무를 더 빨리 벱니다.",
  "Wooden Chest": "남는 재료를 넣어 두는 간단한 상자입니다.",
  Furnace: "광석을 금속 주괴로 제련하는 돌 화로입니다.",
  "Iron Ore": "철 광석 덩어리. 제련하면 철 주괴가 됩니다.",
  "Copper Bar": "정제된 구리 주괴. 중간 단계 제작에 쓰입니다.",
  "Iron Bar": "단단한 철 주괴. 상위 제작에 쓰입니다.",
  "Wood Floor": "구조물을 짓는 나무 바닥 타일입니다.",
  Portal: "다른 맵으로 이동하는 마법 포탈입니다.",
  "Copper Pickaxe": "정제된 구리 곡괭이. 광석을 캐는 데 효율적입니다.",
  "Copper Axe": "정제된 구리 도끼. 나무를 베는 데 효율적입니다.",
  "Iron Pickaxe": "단단한 철 곡괭이. 상위 채광에 필요합니다.",
  "Iron Axe": "단단한 철 도끼. 상위 벌목에 필요합니다.",
  Coin: "상점에서 물건을 살 때 쓰는 화폐입니다.",
  Bed: "편안한 나무 침대. 누워 체력과 스태미나를 회복합니다.",
  Shovel: "단단한 삽. 영지에 흙길을 팝니다.",
  Hoe: "단단한 호미. 광장과 밭을 위한 흙 구덩이를 팝니다.",
  "Grass Seed": "풀씨 한 줌. 맨땅에 뿌려 녹지를 되돌립니다.",
  "Carrot Seed": "당근 씨앗. 호미로 간 흙 구덩이에 심습니다.",
  Carrot: "갓 수확한 당근. 팔거나 요리에 씁니다.",
  "Recipe Scroll: Copper Tools": "고대 두루마리. 사용하면 구리 도구 제작법을 배웁니다.",
  "Recipe Scroll: Iron Tools": "고대 두루마리. 사용하면 철 도구 제작법을 배웁니다.",
  "Roasted Grass": "살짝 구운 풀. 채집 집중을 조금 올려 줍니다.",
  "Carrot Soup": "따뜻한 당근 수프. 채집 능력을 올려 줍니다.",
  "Veggie Stir Fry": "가벼운 야채 볶음. 이동 속도를 올려 줍니다.",
  "Feast Dish": "푸짐한 잔치 요리. 채집 집중이 크게 오릅니다.",
  "Cooking Pot": "음식 버프를 만드는 조리 냄비입니다.",
  "Fishing Rod": "나무로 만든 간단한 낚싯대입니다.",
  Carp: "흔한 민물고기입니다.",
  Shrimp: "작은 새우입니다.",
  Salmon: "강에서 잡은 신선한 연어입니다.",
  Tuna: "크고 귀한 참치입니다.",
  "Raw Meat": "멧돼지 생고기. 냄비에 구우면 푸짐한 식사가 됩니다.",
  "Roasted Meat": "육즙 가득한 구운 고기. 공격력을 올려 줍니다.",
  "Animal Pen": "가축을 기르는 나무 우리. 영지 농장에 설치합니다.",
  Egg: "신선한 달걀. 요리하거나 납품할 수 있습니다.",
  Wool: "부드러운 양털. 제작하거나 납품할 수 있습니다.",
  "Chicken Ticket": "영지 가축우리 근처에서 사용해 닭을 들입니다.",
  "Sheep Ticket": "영지 가축우리 근처에서 사용해 양을 들입니다.",
  "Egg Omelette": "폭신한 오믈렛. 채집 집중을 조금 올려 줍니다.",
  "Dog Whistle": "개 동료를 부르는 호루라기. 사용해도 소모되지 않습니다.",
  "Monster Ward": "몬스터를 멀리 떨어뜨려 낚시를 안전하게 합니다. 사냥터·보스맵에서 효과적입니다.",
  "Water Spade": "맨땅에 2x2 물웅덩이를 파는 넓은 삽입니다.",
};

const RECIPE_DESC = {
  "Hand Axe": "돌로 만든 간단한 도끼. 나무를 벨 때 씁니다.",
  "Stone Pickaxe": "광석을 캐고 큰 돌을 깨는 단단한 도구입니다.",
  "Stone Axe": "돌과 나무로 만든 도끼. 나무를 더 빨리 벱니다.",
  "Wooden Chest": "남는 재료를 넣어 두는 간단한 상자입니다.",
  Bed: "나무 침대. 누워 체력과 스태미나를 회복합니다.",
  Furnace: "광석을 제련하는 돌 화로입니다.",
  "Cooking Pot": "버프 음식을 만드는 조리 냄비입니다.",
  "Wood Floor": "건축용 나무 바닥 타일입니다.",
  Shovel: "흙길을 파는 단단한 삽입니다.",
  Hoe: "풀 테두리 흙 구덩이를 파는 호미입니다.",
  "Grass Seed": "맨땅에 풀을 심어 녹지를 되돌립니다.",
  "Roasted Grass": "살짝 구운 풀. 먹으면 채집 집중이 조금 오릅니다.",
  "Copper Pickaxe": "정제된 구리 곡괭이입니다.",
  "Copper Axe": "정제된 구리 도끼입니다.",
  "Iron Pickaxe": "단단한 철 곡괭이입니다.",
  "Iron Axe": "단단한 철 도끼입니다.",
  "Fishing Rod": "나무로 만든 간단한 낚싯대입니다.",
  "Animal Pen": "영지 농장에 두는 가축우리입니다.",
  "Monster Ward": "낚시 중 몬스터를 멀리 떨어뜨립니다. 사냥터·보스맵에 설치하세요.",
  "Water Spade": "영지에 연못을 만드는 넓은 삽입니다.",
};

function patchItemDataset() {
  const { filePath, rows, meta } = loadCSV("RootDesk/MyDesk/item/DataSets/item_dataset.csv");
  const header = rows[0];
  let nameIdx = header.indexOf("Name");
  let descIdx = header.indexOf("Description");
  let dispIdx = header.indexOf("DisplayName");
  if (nameIdx < 0) throw new Error("item_dataset: Name column missing");
  if (dispIdx < 0) {
    header.splice(nameIdx + 1, 0, "DisplayName");
    dispIdx = nameIdx + 1;
    if (descIdx > nameIdx) descIdx += 1;
    for (let i = 1; i < rows.length; i++) rows[i].splice(dispIdx, 0, "");
  }
  const missing = [];
  for (let i = 1; i < rows.length; i++) {
    const name = rows[i][nameIdx];
    if (!DISPLAY[name]) missing.push(name);
    rows[i][dispIdx] = DISPLAY[name] || name;
    if (descIdx >= 0 && DESC[name]) rows[i][descIdx] = DESC[name];
  }
  if (missing.length) throw new Error("missing DisplayName: " + missing.join(", "));
  writeCSV(filePath, rows, meta);
  console.log("item_dataset.csv rows=" + (rows.length - 1) + " DisplayName inserted");
}

function patchRecipe() {
  const { filePath, rows, meta } = loadCSV("RootDesk/MyDesk/item/DataSets/RecipeDataSet.csv");
  const header = rows[0];
  const nameIdx = header.indexOf("RecipeName");
  const descIdx = header.indexOf("Desc");
  const missing = [];
  for (let i = 1; i < rows.length; i++) {
    const name = rows[i][nameIdx];
    if (!RECIPE_DESC[name]) missing.push(name);
    else rows[i][descIdx] = RECIPE_DESC[name];
  }
  if (missing.length) throw new Error("missing recipe Desc: " + missing.join(", "));
  writeCSV(filePath, rows, meta);
  console.log("RecipeDataSet.csv Desc Koreanized");
}

function patchBiome() {
  const { filePath, rows, meta } = loadCSV("RootDesk/MyDesk/MapObjects/DataSets/BiomeDataSet.csv");
  const map = {
    "Green Island": "초록 섬",
    "Earth Field": "흙 벌판",
    Rocky: "바위 지대",
    Desert: "사막",
    Snowfield: "설원",
  };
  const idx = rows[0].indexOf("DisplayName");
  for (let i = 1; i < rows.length; i++) {
    const v = rows[i][idx];
    if (map[v]) rows[i][idx] = map[v];
  }
  writeCSV(filePath, rows, meta);
  console.log("BiomeDataSet.csv DisplayName Koreanized");
}

function patchQuest() {
  const { filePath, rows, meta } = loadCSV("RootDesk/MyDesk/QuestAndAchievement/DataSets/QuestDataSet.csv");
  const idx = rows[0].indexOf("ProgressingDesc");
  const repl = {
    "C 키로 제작창을 열고 손도끼(Hand Axe)를 제작하세요.": "C 키로 제작창을 열고 손도끼를 제작하세요.",
    "나무를 베어 Wood 5개를 모으세요.": "나무를 베어 나무 5개를 모으세요.",
    "제작창에서 돌 곡괭이(Stone Pickaxe)를 제작하세요.": "제작창에서 돌 곡괭이를 제작하세요.",
    "곡괭이로 돌을 캐 Stone 3개를 모으세요.": "곡괭이로 돌을 캐 돌 3개를 모으세요.",
    "나무 상자(Wooden Chest)를 제작한 뒤 Ctrl로 설치하세요.": "나무 상자를 제작한 뒤 Ctrl로 설치하세요.",
    "풀(Grass)을 5개 채집해 촌장에게 보고하세요.": "풀을 5개 채집해 촌장에게 보고하세요.",
  };
  let n = 0;
  for (let i = 1; i < rows.length; i++) {
    const v = rows[i][idx];
    if (repl[v]) {
      rows[i][idx] = repl[v];
      n++;
    }
  }
  writeCSV(filePath, rows, meta);
  console.log("QuestDataSet.csv ProgressingDesc patched=" + n);
}

function patchAnimal() {
  const { filePath, rows, meta } = loadCSV("RootDesk/MyDesk/MapObjects/DataSets/AnimalDataSet.csv");
  const header = rows[0];
  let dispIdx = header.indexOf("DisplayName");
  const idIdx = header.indexOf("AnimalId");
  const names = { Chicken: "닭", Sheep: "양", Cat: "고양이" };
  if (dispIdx < 0) {
    header.splice(idIdx + 1, 0, "DisplayName");
    dispIdx = idIdx + 1;
    for (let i = 1; i < rows.length; i++) rows[i].splice(dispIdx, 0, "");
  }
  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][idIdx];
    rows[i][dispIdx] = names[id] || id;
  }
  writeCSV(filePath, rows, meta);
  console.log("AnimalDataSet.csv DisplayName inserted");
}

patchItemDataset();
patchRecipe();
patchBiome();
patchQuest();
patchAnimal();
console.log("datasets done");
