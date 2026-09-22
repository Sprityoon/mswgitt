"use strict";
// F2 바위 지대(rocky) 전리품·스폰·드롭 데이터셋 반영 스크립트. 멱등(재실행 안전).
//
//   item_dataset.csv            신규 전리품 4종 (stump_wood / stump_leaf / iron_fragment / horn_fragment)
//   MonsterSpawnDataSet.csv     rocky 라인업을 stump / iron_hog / horn_mushroom 으로 교체
//   ItemDropDataSet.csv         F2 몬스터 드롭 테이블
//   MonsterCoinDropDataSet.csv  F2 몬스터 코인 드롭
//
// 출처: docs/design/story/hunting-grounds-ruid-index.md §2
//       docs/design/story/hunting-grounds-ecosystem-plan.md §2.2 / §5
//
// 🔴 함정 규칙 51 — CSV 값에 쉼표를 넣지 않는다(설명문 포함). 아래 문자열 전부 쉼표 없음.
// 🔴 원본의 BOM / 개행(CRLF) 을 보존해 Maker 재직렬화와의 무의미한 diff 를 막는다.

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
	fs.writeFileSync(csv.file, (csv.bom ? "﻿" : "") + text, "utf8");
}

function colIndex(csv, name) {
	const i = csv.header.split(",").indexOf(name);
	if (i < 0) throw new Error(`${path.basename(csv.file)}: column '${name}' not found`);
	return i;
}

// 첫 컬럼(또는 지정 키 컬럼 조합)이 같은 행이 이미 있는지
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
// 1. item_dataset.csv — F2 전리품 4종
// ---------------------------------------------------------------------------
// 컬럼이 37개라 수기 나열은 위험하다. 같은 성격(Category=resource)의 F1 전리품 행을
// 템플릿으로 삼아 복제하고, 정체성 컬럼만 덮어쓴다 → 컬럼 밀림 원천 차단.
console.log("[1/4] item_dataset.csv");
const itemCsv = readCsv(P.item);
const IDX_ID = colIndex(itemCsv, "id");
const TEMPLATE_ID = "pig_ribbon";
const templateLine = itemCsv.lines.slice(1).find((l) => l.split(",")[IDX_ID] === TEMPLATE_ID);
if (!templateLine) {
	throw new Error(`item_dataset.csv: template row '${TEMPLATE_ID}' not found — F1 데이터가 먼저 반영되어야 한다`);
}
const templateFields = templateLine.split(",");

const F2_ITEMS = [
	{
		id: "stump_wood",
		name: "Hardwood Log",
		display: "단단한 장작",
		icon: "575d2c78875f477db84dacc947a4bc86", // 「장작」 32x32
		desc: "스텀프의 밑동에서 떼어낸 단단한 장작. 고강도 목공술 연구의 핵심 재료.",
	},
	{
		id: "stump_leaf",
		name: "Stump Leaf",
		display: "스텀프 잎사귀",
		icon: "5e1d4e3045e34112ae743469df9b9b94", // 「나뭇잎」 28x28
		desc: "스텀프 머리에 돋은 질긴 잎사귀. 고원의 거친 바람에도 좀처럼 마르지 않는다.",
	},
	{
		id: "iron_fragment",
		name: "Iron Fragment",
		display: "철 조각",
		icon: "798c9751297543519cea1984b7b0333f", // 「아이언 호그의 철발굽」 28x24
		desc: "아이언호그의 갑주에서 떨어져 나온 철 조각. 강화 단조 공정 연구에 쓰인다.",
	},
	{
		id: "horn_fragment",
		name: "Horn Fragment",
		display: "뿔 조각",
		icon: "49b3f12c200044b591eeada1ae93a38d", // 「뿔버섯의 갓」 32x28
		desc: "뿔버섯의 단단한 뿔이 부러져 남은 조각. 바위 틈에서 자란 탓에 광물처럼 무겁다.",
	},
];

const IDX_NAME = colIndex(itemCsv, "Name");
const IDX_DISPLAY = colIndex(itemCsv, "DisplayName");
const IDX_ICON = colIndex(itemCsv, "IconRUID");
const IDX_DESC = colIndex(itemCsv, "Description");

for (const it of F2_ITEMS) {
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
// 2. MonsterSpawnDataSet.csv — rocky 라인업 교체
// ---------------------------------------------------------------------------
// 기획서 §2.2 의 rocky 라인업은 stump / iron_hog / horn_mushroom 3종이다.
// 기존 rocky 의 slime / boar 행은 "기존 3종 재탕" 구조라 제거한다(F1 earth_field 는 유지).
// 신규 종은 모델 기본값에 티어를 반영했으므로 배율 1.0/1.0 (색인 §1.4 규칙).
console.log("[2/4] MonsterSpawnDataSet.csv");
const spawnCsv = readCsv(P.spawn);
const ROCKY_ROWS = [
	"rocky,stump,70,1.0,1.0",
	"rocky,iron_hog,60,1.0,1.0",
	"rocky,horn_mushroom,60,1.6,1.5", // 기존 행 유지 (색인 §2)
];
const rebuilt = [spawnCsv.header];
let rockyEmitted = false;
for (const line of spawnCsv.lines.slice(1)) {
	if (line.startsWith("rocky,")) {
		if (!rockyEmitted) {
			rockyEmitted = true;
			for (const r of ROCKY_ROWS) rebuilt.push(r);
		}
		continue; // 기존 rocky 행은 전부 대체
	}
	rebuilt.push(line);
}
if (!rockyEmitted) for (const r of ROCKY_ROWS) rebuilt.push(r);
spawnCsv.lines = rebuilt;
console.log("  rocky -> " + ROCKY_ROWS.map((r) => r.split(",")[1]).join(" / "));
writeCsv(spawnCsv);

// ---------------------------------------------------------------------------
// 3. ItemDropDataSet.csv — F2 드롭 테이블
// ---------------------------------------------------------------------------
// 컬럼: SourceId,BiomeId,ItemId,MinCount,MaxCount,Probability,NaturalLoot,GuaranteeQuestIds
// stone_golem 의 iron_ore 대량 드롭은 Monster.BossDropItem(5~10 고정) 쪽이 담당하므로
// 여기서는 중복되지 않게 레시피·테마 전리품만 배정한다(슬라임킹 선례와 동일).
console.log("[3/4] ItemDropDataSet.csv");
const dropCsv = readCsv(P.drop);
const D_SRC = colIndex(dropCsv, "SourceId");
const D_ITEM = colIndex(dropCsv, "ItemId");
const F2_DROPS = [
	["stump", "", "stump_wood", "1", "2", "0.55", "true", ""],
	["stump", "", "stump_leaf", "1", "2", "0.35", "", ""],
	["iron_hog", "", "iron_fragment", "1", "2", "0.4", "", ""],
	["iron_hog", "", "raw_meat", "1", "2", "0.6", "true", ""],
	["horn_mushroom", "", "horn_fragment", "1", "1", "0.35", "", ""],
	["stone_golem", "", "iron_fragment", "3", "6", "1.0", "true", ""],
	["stone_golem", "", "recipe_scroll_iron", "1", "1", "0.6", "", ""],
];
for (const row of F2_DROPS) appendRow(dropCsv, row, [D_SRC, D_ITEM]);
writeCsv(dropCsv);

// ---------------------------------------------------------------------------
// 4. MonsterCoinDropDataSet.csv — F2 코인 드롭
// ---------------------------------------------------------------------------
// 컬럼: MonsterId,DropChance,MinAmount,MaxAmount,DisplayName,IconRUID
// IconRUID 는 반드시 sprite 타입(각 몬스터 stand.frame0) — 색인 §0 규칙 1.
console.log("[4/4] MonsterCoinDropDataSet.csv");
const coinCsv = readCsv(P.coin);
const C_ID = colIndex(coinCsv, "MonsterId");
const F2_COINS = [
	["stump", "0.8", "3", "6", "스텀프", "f56c99756461437d9c2bfda85fd4093b"],
	["iron_hog", "0.9", "4", "8", "아이언호그", "759e69bf58dc43ad9defed90b48b9048"],
	["stone_golem", "1.0", "20", "35", "스톤골렘", "2e477c29e6f6411ead7d0462a50f52df"],
];
for (const row of F2_COINS) appendRow(coinCsv, row, [C_ID]);
writeCsv(coinCsv);

// --- 자체 검산: 전 파일 컬럼 수 일치 확인 -----------------------------------
// 🔴 함정 규칙 51 대응 — 기존 행에는 쉼표를 담기 위해 큰따옴표로 감싼 필드가 있다
//    (shovel / hoe / water_spade 의 Description). 단순 split(",") 로 세면 거짓 양성이
//    나므로 따옴표를 인식하는 카운터로 검산한다.
function countFields(line) {
	let n = 1;
	let inQuote = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (c === '"') inQuote = !inQuote;
		else if (c === "," && !inQuote) n++;
	}
	return n;
}

for (const f of Object.values(P)) {
	const csv = readCsv(f);
	const n = countFields(csv.header);
	const bad = csv.lines
		.map((l, i) => [i + 1, countFields(l)])
		.filter((x) => x[1] !== n);
	console.log(
		`  ${path.basename(f)}: cols=${n} rows=${csv.lines.length - 1} ` +
			(bad.length ? `⚠ mismatch ${JSON.stringify(bad)}` : "✅ 컬럼 일치")
	);
}

console.log("F2 ecosystem datasets applied.");
