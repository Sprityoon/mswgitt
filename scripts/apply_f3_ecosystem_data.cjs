"use strict";
// F3 모래 사막(desert) 전리품·스폰·드롭 데이터셋 반영 스크립트. 멱등(재실행 안전).
//
//   item_dataset.csv            신규 전리품 7종
//                               (soft_sand / mole_claw / cactus_thorn / cactus_flower /
//                                scorpion_stinger / chitin_shell / snake_scale)
//   MonsterSpawnDataSet.csv     desert 라인업을 moredji / catus / scorpion / bellamoa 로 교체
//   ItemDropDataSet.csv         F3 몬스터 드롭 테이블
//   MonsterCoinDropDataSet.csv  F3 몬스터 코인 드롭
//
// 출처: docs/design/story/hunting-grounds-ruid-index.md §3
//       docs/design/story/hunting-grounds-ecosystem-plan.md §2.3 / §3.3 / §4
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

// 지정 키 컬럼 조합이 같은 행이 이미 있는지
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
// 1. item_dataset.csv — F3 전리품 7종
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

const F3_ITEMS = [
	{
		id: "soft_sand",
		name: "Soft Sand",
		display: "고운 모래",
		icon: "c9dcfd4f2a504e0fa3626a58adb41662", // 「금모래」 32x32
		desc: "모래 언덕 깊은 곳에서만 퍼 올릴 수 있는 입자가 고운 모래. 유리와 주형의 바탕이 된다.",
	},
	{
		id: "mole_claw",
		name: "Mole Claw",
		display: "두더지 발톱",
		icon: "ab192dce46c34c3b9d932a78cf4e7ae8", // 「몰 킹의 발톱」 32x32
		desc: "모래두지가 굴을 파는 데 쓰던 단단한 발톱. 곡괭이 날 보강재로 탐나는 물건이다.",
	},
	{
		id: "cactus_thorn",
		name: "Cactus Thorn",
		display: "선인장 가시",
		icon: "24d371e7bfaf4ff2a6a49a5e0c4d5082", // 「선인장의 가시」 28x28
		desc: "카투스가 쏘아 보내는 곧고 날카로운 가시. 바늘과 낚싯바늘 재료로 쓰인다.",
	},
	{
		id: "cactus_flower",
		name: "Cactus Flower",
		display: "카투스의 꽃",
		icon: "2a02777a2e134cc792db8b2c2b626890", // 「카투스의 꽃」 32x32
		desc: "몇 해에 한 번 피는 카투스의 꽃. 건조 지대 보습 기법 연구의 핵심 시료다.",
	},
	{
		id: "scorpion_stinger",
		name: "Scorpion Stinger",
		display: "전갈 독침",
		icon: "02178d88a24a49cf9418513cf11ebeb1", // 「전갈의 독침」 28x28
		desc: "스콜피온의 꼬리 끝에서 떼어낸 독침. 다루기 까다롭지만 독성 중화 연구의 출발점이다.",
	},
	{
		id: "chitin_shell",
		name: "Chitin Shell",
		display: "키틴질 껍질",
		icon: "ad259c087aff47c7ba21e205e32b4495", // 「붉은 등껍질」 32x32
		desc: "사막 절지류의 등을 덮고 있던 두꺼운 껍질. 가볍고도 질겨 방어구 덧댐재로 알맞다.",
	},
	{
		id: "snake_scale",
		name: "Snake Scale",
		display: "방울뱀 비늘",
		icon: "42f339e91dd042908d1bef5ebfed05c1", // 「뱀 비늘」 32x28
		desc: "벨라모아가 모래 능선을 미끄러질 때 벗겨진 비늘. 햇빛을 받으면 노을빛으로 일렁인다.",
	},
];

const IDX_NAME = colIndex(itemCsv, "Name");
const IDX_DISPLAY = colIndex(itemCsv, "DisplayName");
const IDX_ICON = colIndex(itemCsv, "IconRUID");
const IDX_DESC = colIndex(itemCsv, "Description");

for (const it of F3_ITEMS) {
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
// 2. MonsterSpawnDataSet.csv — desert 라인업 교체
// ---------------------------------------------------------------------------
// 기획서 §2.3 의 desert 라인업은 moredji / catus / scorpion / bellamoa 4종이다.
// 기존 desert 의 slime / boar / horn_mushroom 행은 "기존 3종 배율 재탕" 구조라 제거한다
// (F1 earth_field · F2 rocky · F4 snowfield 행은 건드리지 않는다).
// 신규 종은 모델 기본값에 티어를 반영했으므로 배율 1.0/1.0 (색인 §1.4 규칙).
console.log("[2/4] MonsterSpawnDataSet.csv");
const spawnCsv = readCsv(P.spawn);
const DESERT_ROWS = [
	"desert,moredji,70,1.0,1.0",
	"desert,catus,60,1.0,1.0",
	"desert,scorpion,50,1.0,1.0",
	"desert,bellamoa,40,1.0,1.0",
];
const rebuilt = [spawnCsv.header];
let desertEmitted = false;
for (const line of spawnCsv.lines.slice(1)) {
	if (line.startsWith("desert,")) {
		if (!desertEmitted) {
			desertEmitted = true;
			for (const r of DESERT_ROWS) rebuilt.push(r);
		}
		continue; // 기존 desert 행은 전부 대체
	}
	rebuilt.push(line);
}
if (!desertEmitted) for (const r of DESERT_ROWS) rebuilt.push(r);
spawnCsv.lines = rebuilt;
console.log("  desert -> " + DESERT_ROWS.map((r) => r.split(",")[1]).join(" / "));
writeCsv(spawnCsv);

// ---------------------------------------------------------------------------
// 3. ItemDropDataSet.csv — F3 드롭 테이블
// ---------------------------------------------------------------------------
// 컬럼: SourceId,BiomeId,ItemId,MinCount,MaxCount,Probability,NaturalLoot,GuaranteeQuestIds
// deu 의 soft_sand 대량 드롭은 Monster.BossDropItem(6~12 고정) 쪽이 담당하므로
// 여기서는 중복되지 않게 테마 전리품·레시피만 배정한다(스톤골렘·슬라임킹 선례와 동일).
//
// 퀘스트 연계:
//   232 Kill,moredji,5      — 처치 카운트라 드롭율과 무관
//   233 Gather,cactus_thorn,6 — catus 가 유일 공급원. 0.5 x 1~2개면 12~15마리로 달성
//   234 Kill,scorpion,4     — 처치 카운트
//   236 Kill,deu,1          — 보스전
console.log("[3/4] ItemDropDataSet.csv");
const dropCsv = readCsv(P.drop);
const D_SRC = colIndex(dropCsv, "SourceId");
const D_ITEM = colIndex(dropCsv, "ItemId");
const F3_DROPS = [
	["moredji", "", "soft_sand", "2", "4", "0.6", "true", ""],
	["moredji", "", "mole_claw", "1", "1", "0.3", "", ""],
	["catus", "", "cactus_thorn", "1", "2", "0.5", "true", ""],
	["catus", "", "cactus_flower", "1", "1", "0.2", "", ""],
	["scorpion", "", "chitin_shell", "1", "2", "0.5", "true", ""],
	["scorpion", "", "scorpion_stinger", "1", "1", "0.35", "", ""],
	["bellamoa", "", "snake_scale", "1", "2", "0.55", "true", ""],
	["bellamoa", "", "soft_sand", "1", "2", "0.3", "", ""],
	["deu", "", "chitin_shell", "3", "6", "1.0", "true", ""],
	["deu", "", "cactus_flower", "2", "4", "0.7", "", ""],
	["deu", "", "recipe_scroll_iron", "1", "1", "0.5", "", ""],
];
for (const row of F3_DROPS) appendRow(dropCsv, row, [D_SRC, D_ITEM]);
writeCsv(dropCsv);

// ---------------------------------------------------------------------------
// 4. MonsterCoinDropDataSet.csv — F3 코인 드롭
// ---------------------------------------------------------------------------
// 컬럼: MonsterId,DropChance,MinAmount,MaxAmount,DisplayName,IconRUID
// IconRUID 는 반드시 sprite 타입(각 몬스터 stand.frame0) — 색인 §0 규칙 1.
console.log("[4/4] MonsterCoinDropDataSet.csv");
const coinCsv = readCsv(P.coin);
const C_ID = colIndex(coinCsv, "MonsterId");
const F3_COINS = [
	["moredji", "0.8", "5", "9", "모래두지", "af9af6bbc9fc4e6888bfc2b373452461"],
	["catus", "0.8", "5", "9", "카투스", "1676b4bf2726447bb7e6d5c0a6f688bf"],
	["scorpion", "0.85", "6", "11", "스콜피온", "3a08f067718d42f192d85fe5c9553175"],
	["bellamoa", "0.8", "5", "9", "벨라모아", "bf29803a9a7342f8911706a37593dfb6"],
	["deu", "1.0", "35", "55", "데우", "a0fa0c0915a64041943e08c6a38e9db8"],
];
for (const row of F3_COINS) appendRow(coinCsv, row, [C_ID]);
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
	const bad = csv.lines.map((l, i) => [i + 1, countFields(l)]).filter((x) => x[1] !== n);
	console.log(
		`  ${path.basename(f)}: cols=${n} rows=${csv.lines.length - 1} ` +
			(bad.length ? `⚠ mismatch ${JSON.stringify(bad)}` : "✅ 컬럼 일치")
	);
}

// --- 자체 검산: 드롭/코인이 참조하는 ItemId·MonsterId 가 실재하는지 ----------
const itemIds = new Set(readCsv(P.item).lines.slice(1).map((l) => l.split(",")[IDX_ID]));
const missing = F3_DROPS.map((r) => r[2]).filter((id) => !itemIds.has(id));
console.log(
	missing.length ? `  ⚠ item_dataset 미등록 ItemId: ${[...new Set(missing)].join(", ")}` : "  ✅ 드롭 ItemId 전부 item_dataset 등록됨"
);

console.log("F3 ecosystem datasets applied.");
