'use strict';
// 스킬 · 직업 · 퀘스트 데이터의 상호 참조 무결성 검사.
//
// 이 파이프라인은 CSV 한 칸의 오타가 런타임 에러 없이 조용히 죽는다.
// (없는 아이템 이름 -> 퀘스트 영원히 미완 / 없는 Status -> 스킬 효과 무시 등)
// 그래서 "소비하는 쪽 코드"를 직접 훑어 허용 집합을 만들고, 데이터를 그 집합에 대조한다.
// 허용 집합을 여기에 하드코딩하면 코드가 바뀔 때 검사기가 먼저 거짓말을 하게 된다.
//
//   node scripts/check_skill_quest_pipeline.cjs
//
// 종료 코드 0 = 이상 없음, 1 = 결함.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);

// ── CSV ─────────────────────────────────────────────────────────────
function readCsv(rel) {
  const text = fs.readFileSync(P(rel), 'utf8').replace(/^﻿/, '');
  const rows = [];
  let field = '', record = [], quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { record.push(field); field = ''; }
    else if (c === '\n') { record.push(field); rows.push(record); record = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || record.length) { record.push(field); rows.push(record); }
  const headers = rows.shift().map(h => h.trim());
  return rows
    .filter(r => r.some(v => v.trim() !== ''))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const src = rel => fs.readFileSync(P(rel), 'utf8');
const val = (row, key) => (row[key] ?? '').trim();

// ── 소비 코드에서 허용 집합을 추출한다 ───────────────────────────────
const PC = src('RootDesk/MyDesk/Player/Scripts/PlayerController.mlua');
const MONSTER = src('RootDesk/MyDesk/Monster/Scripts/Monster.mlua');
const MONSTER_AI = src('RootDesk/MyDesk/Monster/Scripts/MonsterAI.mlua');

// 패시브는 PlayerController 밖에서도 읽힌다(채집은 PlayerInventory, 가축은 축사 쪽).
// 소비처를 한 파일로 좁히면 멀쩡한 스킬을 결함으로 부르게 된다.
function allMlua(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) allMlua(full, out);
    else if (e.name.endsWith('.mlua') && !e.name.endsWith('.d.mlua')) out.push(full);
  }
  return out;
}
const ALL_MLUA = allMlua(P('RootDesk')).map(f => fs.readFileSync(f, 'utf8')).join('\n');

// 시전 분기표: local supported = { Melee = true, ... }
function supportedSkillTypes() {
  const m = PC.match(/local\s+supported\s*=\s*\{([^}]*)\}/);
  if (!m) return null;
  return new Set([...m[1].matchAll(/(\w+)\s*=\s*true/g)].map(x => x[1]));
}

// GetSkillStatus("X") 로 실제 효과가 붙은 상태이상만 인정한다.
function handledStatuses() {
  const s = new Set();
  for (const f of [MONSTER, MONSTER_AI]) {
    for (const m of f.matchAll(/GetSkillStatus\(\s*"([^"]+)"\s*\)/g)) s.add(m[1]);
  }
  return s;
}

// GetPassiveBonus("X") 로 읽히는 스탯 + 전용 경로로 소비되는 스탯.
function consumedPassiveStats() {
  const s = new Set();
  for (const m of ALL_MLUA.matchAll(/GetPassiveBonus\(\s*"([^"]+)"\s*\)/g)) s.add(m[1]);
  // 담금질 피부는 보유 아이템 조건부라 GetPassiveBonus 를 타지 않고
  // RefreshTemperedSkin -> _T.TemperedReduction 전용 경로로 소비된다.
  const tempered = PC.match(/method void RefreshTemperedSkin\(\)[\s\S]*?\n\tend/);
  if (tempered) {
    for (const m of tempered[0].matchAll(/SkillText\(row,\s*"PassiveStat"\)\s*==\s*"([^"]+)"/g)) s.add(m[1]);
    // 스킬 id 로 직접 찾는 형태도 허용 대상에 넣는다.
    for (const m of tempered[0].matchAll(/FindRow\(\s*"SkillId"\s*,\s*"([^"]+)"\s*\)/g)) {
      s.add('@skill:' + m[1]);
    }
  }
  return s;
}

// ── 데이터 로드 ──────────────────────────────────────────────────────
const skills = readCsv('RootDesk/MyDesk/Player/DataSets/SkillDataSet.csv');
const items = readCsv('RootDesk/MyDesk/item/DataSets/item_dataset.csv');
const quests = readCsv('RootDesk/MyDesk/QuestAndAchievement/DataSets/QuestDataSet.csv');
const conds = readCsv('RootDesk/MyDesk/QuestAndAchievement/DataSets/QuestConditionDataSet.csv');
const coinDrops = readCsv('RootDesk/MyDesk/Monster/DataSets/MonsterCoinDropDataSet.csv');

const itemNames = new Set(items.map(r => val(r, 'Name')).filter(Boolean));
const skillIds = new Set(skills.map(r => val(r, 'SkillId')).filter(Boolean));
const questIds = new Set(quests.map(r => val(r, 'Id')).filter(Boolean));
const monsterIds = new Set(coinDrops.map(r => val(r, 'MonsterId')).filter(Boolean));
const jobIds = new Set(skills.map(r => val(r, 'JobId')).filter(Boolean));

// town.map 에 실제로 배치된 NpcId (퀘스트를 주고받을 수 있는 NPC)
function placedNpcIds() {
  const out = new Set();
  const mapPath = P('map', 'town' + '.map');
  if (!fs.existsSync(mapPath)) return null;
  const raw = fs.readFileSync(mapPath, 'utf8');
  for (const m of raw.matchAll(/"NpcId"\s*:\s*"([^"]*)"/g)) if (m[1]) out.add(m[1]);
  return out;
}

// ── 검사 ─────────────────────────────────────────────────────────────
const problems = [];
const notes = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

const types = supportedSkillTypes();
const statuses = handledStatuses();
const passives = consumedPassiveStats();

if (!types) notes.push('PlayerController 의 supported 분기표를 찾지 못해 Type 검사를 건너뛴다');

for (const r of skills) {
  const id = val(r, 'SkillId');
  if (!id) continue;
  const at = `skill ${id}`;

  for (const col of ['ConsumeItem', 'RequireEquippedItem', 'PassiveItem']) {
    const v = val(r, col);
    if (v && !itemNames.has(v)) fail(at, `${col} "${v}" 가 item_dataset.Name 에 없다`);
  }

  const parent = val(r, 'ParentSkillId');
  if (parent) {
    if (!skillIds.has(parent)) fail(at, `ParentSkillId "${parent}" 가 없는 스킬이다`);
    else {
      const p = skills.find(x => val(x, 'SkillId') === parent);
      if (val(p, 'JobId') !== val(r, 'JobId')) {
        fail(at, `선행 "${parent}" 의 JobId 가 달라(${val(p, 'JobId') || '공용'} vs ${val(r, 'JobId') || '공용'}) 같은 탭에서 계보가 끊긴다`);
      }
    }
  }

  const uq = val(r, 'UnlockQuestId');
  if (uq && !questIds.has(uq)) fail(at, `UnlockQuestId ${uq} 가 QuestDataSet 에 없다`);

  const job = val(r, 'JobId');
  if (job && !val(r, 'JobName')) fail(at, `JobId "${job}" 인데 JobName 이 비어 GetJobName 이 빈 문자열을 돌려준다`);

  const ty = val(r, 'Type');
  if (types && ty && ty !== 'Passive' && !types.has(ty)) {
    fail(at, `Type "${ty}" 가 시전 분기표에 없어 시전이 조용히 무시된다`);
  }

  for (const col of ['Status', 'ComboStatus']) {
    const v = val(r, col);
    if (v && !statuses.has(v)) fail(at, `${col} "${v}" 를 처리하는 코드가 없어 효과가 적용되지 않는다`);
  }

  for (const col of ['PassiveStat', 'PassiveStat2']) {
    const v = val(r, col);
    if (v && !passives.has(v) && !passives.has('@skill:' + id)) {
      fail(at, `${col} "${v}" 를 읽는 곳이 없어 패시브가 아무 효과도 내지 않는다`);
    }
  }

  const lv = Number(val(r, 'RequiredLevel') || 0);
  const plv = Number(val(r, 'ParentRequiredLevel') || 0);
  const maxParent = parent ? Number(val(skills.find(x => val(x, 'SkillId') === parent), 'MaxLevel') || 0) : 0;
  if (parent && plv > maxParent) {
    fail(at, `ParentRequiredLevel ${plv} 이 선행의 MaxLevel ${maxParent} 보다 커 영원히 해금되지 않는다`);
  }
  if (lv < 0) fail(at, `RequiredLevel 이 음수다`);
}

const npcs = placedNpcIds();
if (npcs === null) notes.push('town.map 을 읽지 못해 NPC 배치 검사를 건너뛴다');

const condByQuest = new Map();
for (const c of conds) {
  const id = val(c, 'Id');
  if (!condByQuest.has(id)) condByQuest.set(id, []);
  condByQuest.get(id).push(c);
}

for (const r of quests) {
  const id = val(r, 'Id');
  if (!id) continue;
  const at = `quest ${id}`;

  for (const col of ['RewardItems', 'ConsumeItems']) {
    const v = val(r, col);
    if (!v) continue;
    for (const part of v.split('|')) {
      const name = part.split(':')[0].trim();
      if (name && !itemNames.has(name)) fail(at, `${col} 의 "${name}" 이 item_dataset.Name 에 없다`);
    }
  }

  const prev = val(r, 'LinkedPrevId');
  if (prev && !questIds.has(prev)) fail(at, `LinkedPrevId ${prev} 가 없는 퀘스트다`);

  if (npcs) {
    for (const col of ['GiverNpcId', 'TurnInNpcId']) {
      const v = val(r, col);
      if (v && !npcs.has(v)) fail(at, `${col} "${v}" 가 town.map 에 배치돼 있지 않아 수락/보고할 수 없다`);
    }
  }

  const rj = val(r, 'RewardJobId');
  if (rj && !jobIds.has(rj)) fail(at, `RewardJobId "${rj}" 를 가진 스킬이 없어 GetJobName 이 빈 값이 되고 수락 자체가 막힌다`);
  const qj = val(r, 'RequiredJobId');
  if (qj && qj !== 'novice' && !jobIds.has(qj)) fail(at, `RequiredJobId "${qj}" 가 존재하지 않는 직업이다`);

  const cs = condByQuest.get(id);
  if (!cs || cs.length === 0) fail(at, `조건 행이 하나도 없어 완료할 수 없다`);
}

for (const c of conds) {
  const id = val(c, 'Id');
  const at = `cond ${id}/${val(c, 'CondEnum')}`;
  if (!questIds.has(id)) { fail(at, `대응하는 퀘스트 ${id} 가 QuestDataSet 에 없다`); continue; }
  const arg = val(c, 'CondArg');
  const kind = val(c, 'CondEnum');
  if (!arg) continue;
  if (kind === 'Kill' && !monsterIds.has(arg)) fail(at, `대상 몬스터 "${arg}" 가 MonsterCoinDropDataSet 에 없다`);
  if (kind === 'Gather' && !itemNames.has(arg)) fail(at, `수집 대상 "${arg}" 가 item_dataset.Name 에 없다`);
  if (kind === 'LearnSkill' && !skillIds.has(arg)) fail(at, `대상 스킬 "${arg}" 가 SkillDataSet 에 없다`);
}

// ── 보고 ─────────────────────────────────────────────────────────────
console.log(`스킬 ${skills.length} · 퀘스트 ${quests.length} · 조건 ${conds.length} · 아이템 ${itemNames.size}`);
console.log(`시전 Type ${types ? [...types].sort().join(' ') : '(미확인)'}`);
console.log(`처리되는 Status ${[...statuses].sort().join(' ')}`);
console.log(`소비되는 PassiveStat ${[...passives].sort().join(' ')}`);
for (const n of notes) console.log(`  참고: ${n}`);

if (problems.length === 0) {
  console.log('\n결함 없음');
  process.exit(0);
}
console.log(`\n결함 ${problems.length}건`);
for (const p of problems) console.log('  - ' + p);
process.exit(1);
