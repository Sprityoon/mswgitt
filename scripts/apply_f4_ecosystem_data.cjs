"use strict";
// F4 설원(snowfield) 전리품·스폰·드롭 데이터셋 반영 스크립트. 멱등(재실행 안전).
//
//   item_dataset.csv            신규 전리품 5종
//                               (yeti_horn / pepe_beak / white_fang_tail / ice_piece / snow_crystal)
//   MonsterSpawnDataSet.csv     snowfield 라인업을 jr_yeti / pepe / white_fang / yeti 로 교체
//   ItemDropDataSet.csv         F4 몬스터 드롭 테이블
//   MonsterCoinDropDataSet.csv  F4 몬스터 코인 드롭
//
// 🔴 함정 규칙 51 — CSV 값에 쉼표를 넣지 않는다(설명문 포함).
// 🔴 원본의 BOM / 개행(CRLF) 을 보존한다.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const P = {
	item: path.join(ROOT, "RootDesk/MyDesk/item/DataSets/item_dataset.csv"),
	spawn: path.join(ROOT, "RootDesk/MyDesk/Monster/DataSets/MonsterSpawnDataSet.csv"),
	drop: path.join(ROOT, "RootDesk/MyDesk/MapObjects/DataSets/ItemDropDataSet.csv"),
	coin: path.join(ROOT, "RootDesk/MyDesk/Monster/DataSets/MonsterCoinDropDataSet.csv"),
};

// --- CSV I/O (BOM · EOL 보존) ----------------------------------------------
function readCsv(file) {
	const raw = fs.readFileSync(file, "utf8");
	const bom = raw.charCodeAt(0) === 0xfeff;
	const body = bom ? raw.slice(1) : raw;
	const eol = body.includes("\r\n") ? "\r\n" : "\n";
	const lines = body.split(/\r?\n/);
	while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
	return { file, bom, eol, header: lines[0], lines };
}

function writeCsv(csv) {
	const text = csv.lines.join(csv.eol) + csv.eol;
	fs.writeFileSync(csv.file, (csv.bom ? "\ufeff" : "") + text, "utf8");
}

function colIndex(csv, name) {
	const i = csv.header.split(",").indexOf(name);
	if (i < 0) throw new Error(`${path.basename(csv.file)}: column '${name}' not found`);
	return i;
}

function hasRow(csv, keyCols, keyVals) {
	return csv.lines.slice(1).some((l) => {
		const f = l.split(",");
		return keyCols.every((c, n) => f[c] === keyVals[n]);
	});
}

function appendRow(csv, fields, keyCols) {
	if (fields.length !== csv.header.split(",").length) {
		throw new Error(
			`${path.basename(csv.file)}: field count ${fields.length} != header ${csv.header.split(",").length}`
		);
	}
	const keyVals = keyCols.map((c) => fields[c]);
	if (hasRow(csv, keyCols, keyVals)) {
		console.log(`  = skip (exists) ${keyVals.join("/")}`);
		return false;
	}
	csv.lines.push(fields.join(","));
	console.log(`  + ${keyVals.join("/")}`);
	return true;
}

// ---------------------------------------------------------------------------
// 1. item_dataset.csv — F4 전리품 5종
// ---------------------------------------------------------------------------
console.log("[1/4] item_dataset.csv");
const itemCsv = readCsv(P.item);
const IDX_ID = colIndex(itemCsv, "id");
const IDX_NAME = colIndex(itemCsv, "Name");
const IDX_DISPLAY = colIndex(itemCsv, "DisplayName");
const IDX_ICON = colIndex(itemCsv, "IconRUID");
const IDX_DESC = colIndex(itemCsv, "Description");

const TEMPLATE_ID = "pig_ribbon";
const templateLine = itemCsv.lines.slice(1).find((l) => l.split(",")[IDX_ID] === TEMPLATE_ID);
if (!templateLine) {
	throw new Error(`item_dataset.csv: template row '${TEMPLATE_ID}' not found`);
}
const templateFields = templateLine.split(",");

const F4_ITEMS = [
	{
		id: "yeti_horn",
		name: "Yeti Horn",
		display: "예티의 뿔",
		icon: "dd7ced96beb442779692fd10a2146c2c",
		desc: "예티의 정수리에 돋아난 단단한 뿔. 혹한의 냉기를 견디는 장비의 주재료가 된다.",
	},
	{
		id: "pepe_beak",
		name: "Pepe Beak",
		display: "페페의 부리",
		icon: "9f1456e9a8b94732b67fd24cbf9b3649",
		desc: "페페의 단단한 노란 부리. 얼음을 쪼아 물고기를 낚을 만큼 튼튼하다.",
	},
	{
		id: "white_fang_tail",
		name: "White Fang Tail",
		display: "화이트팽의 꼬리",
		icon: "d3db25c3ea694b22b6be28f5961b4e5f",
		desc: "화이트팽의 풍성하고 부드러운 꼬리 털. 방한 장구 제작에 필수적이다.",
	},
	{
		id: "ice_piece",
		name: "Ice Piece",
		display: "얼음 조각",
		icon: "7915c70952ad432f99519ad79bf929a4",
		desc: "만년설 깊은 곳에서 채취된 얼음 조각. 상온에서도 쉽게 녹지 않는다.",
	},
	{
		id: "snow_crystal",
		name: "Snow Crystal",
		display: "눈의 결정",
		icon: "66b0d1e41f8b4c29ab3f7fb447734f2b",
		desc: "정교한 육각형을 띤 차가운 마력 결정. 상위 냉기 장비 제작의 핵심 재료다.",
	},
];

for (const it of F4_ITEMS) {
	for (const v of [it.display, it.desc, it.name]) {
		if (v.includes(",")) throw new Error(`쉼표 금지(함정 규칙 51): ${v}`);
	}
	const f = templateFields.slice();
	f[IDX_ID] = it.id;
	f[IDX_NAME] = it.name;
	f[IDX_DISPLAY] = it.display;
	f[IDX_ICON] = it.icon;
	f[IDX_DESC] = it.desc;
	appendRow(itemCsv, f, [IDX_ID]);
}
writeCsv(itemCsv);

// ---------------------------------------------------------------------------
// 2. MonsterSpawnDataSet.csv — snowfield 교체
// ---------------------------------------------------------------------------
console.log("[2/4] MonsterSpawnDataSet.csv");
const spawnCsv = readCsv(P.spawn);
const S_BIOME = colIndex(spawnCsv, "BiomeId");
const S_MODEL = colIndex(spawnCsv, "MonsterModelId");

const SNOW_SPAWNS = [
	["snowfield", "jr_yeti", "70", "1.0", "1.0"],
	["snowfield", "pepe", "60", "1.0", "1.0"],
	["snowfield", "white_fang", "50", "1.0", "1.0"],
	["snowfield", "yeti", "30", "1.0", "1.0"],
];

// 기존 snowfield 행 제거 (slime/boar/horn_mushroom 등 레거시)
const nonSnowLines = spawnCsv.lines.filter((l, idx) => {
	if (idx === 0) return true;
	const biome = l.split(",")[S_BIOME];
	return biome !== "snowfield";
});
const newSnowLines = SNOW_SPAWNS.map((s) => s.join(","));
spawnCsv.lines = [...nonSnowLines, ...newSnowLines];
writeCsv(spawnCsv);
console.log(`  * updated snowfield spawn table (4 entries)`);

// ---------------------------------------------------------------------------
// 3. ItemDropDataSet.csv — F4 몬스터 드롭
// ---------------------------------------------------------------------------
console.log("[3/4] ItemDropDataSet.csv");
const dropCsv = readCsv(P.drop);
const D_SRC = colIndex(dropCsv, "SourceId");
const D_ITEM = colIndex(dropCsv, "ItemId");

const F4_DROPS = [
	["jr_yeti", "", "ice_piece", "1", "2", "0.6", "true", ""],
	["jr_yeti", "", "snow_crystal", "1", "1", "0.25", "", ""],
	["pepe", "", "pepe_beak", "1", "2", "0.65", "true", ""],
	["pepe", "", "ice_piece", "1", "1", "0.3", "", ""],
	["white_fang", "", "white_fang_tail", "1", "2", "0.6", "true", ""],
	["white_fang", "", "ice_piece", "1", "1", "0.35", "", ""],
	["yeti", "", "yeti_horn", "1", "2", "0.7", "true", ""],
	["yeti", "", "ice_piece", "2", "3", "0.5", "", ""],
	["yeti", "", "snow_crystal", "1", "2", "0.35", "", ""],
	["snowman", "", "snow_crystal", "3", "6", "1.0", "true", ""],
	["snowman", "", "yeti_horn", "2", "4", "0.8", "", ""],
	["snowman", "", "ice_piece", "5", "10", "1.0", "", ""],
];

let dropsAdded = 0;
for (const d of F4_DROPS) {
	if (appendRow(dropCsv, d, [D_SRC, D_ITEM])) dropsAdded++;
}
if (dropsAdded > 0) writeCsv(dropCsv);

// ---------------------------------------------------------------------------
// 4. MonsterCoinDropDataSet.csv — F4 몬스터 코인 드롭
// ---------------------------------------------------------------------------
console.log("[4/4] MonsterCoinDropDataSet.csv");
const coinCsv = readCsv(P.coin);
const C_MONSTER = colIndex(coinCsv, "MonsterId");

const F4_COINS = [
	["jr_yeti", "0.8", "6", "12", "주니어 예티", "88d193963ece41cf9ccf049694539708"],
	["pepe", "0.75", "5", "10", "페페", "bf8942f8b9c14cd0a54c6e0145846111"],
	["white_fang", "0.85", "7", "14", "화이트팽", "1ba6793d996840a5b2ead8db5f4a0f95"],
	["yeti", "0.9", "10", "18", "예티", "cd1951dafaa0467dbb1af4803b612292"],
	["snowman", "1.0", "50", "80", "스노우맨", "8169f13153d74776a3ed9791d4ccc746"],
];

let coinsAdded = 0;
for (const c of F4_COINS) {
	if (appendRow(coinCsv, c, [C_MONSTER])) coinsAdded++;
}
if (coinsAdded > 0) writeCsv(coinCsv);

console.log("F4 ecosystem data successfully applied!");
