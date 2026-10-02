'use strict';
// Branch metadata, topology and registration checks for phased job-tree authoring.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {read} = require('./skill_pipeline_csv.cjs');
const base = 'RootDesk/MyDesk/Player/DataSets/';
const skills = read(base+'SkillDataSet.csv');
const branches = read(base+'JobBranchDataSet.csv');
const keys = new Set();
const jobs = new Set();
for (const row of branches.rows) {
 const key = row.JobId+'|'+row.Branch;
 assert(!keys.has(key), 'Duplicate branch '+key); keys.add(key); jobs.add(row.JobId);
 assert(['main','sub'].includes(row.Branch), 'Invalid branch '+key);
 assert(['STR','DEX','INT','SPI'].includes(row.ScaleStat), 'Invalid stat '+key);
 assert(row.Name && row.Description, 'Missing branch text '+key);
}
for (const job of jobs) for (const branch of ['main','sub']) assert(keys.has(job+'|'+branch), 'Missing branch '+job);
const ids = new Map(skills.rows.map(r=>[r.SkillId,r]));
assert.equal(ids.size,skills.rows.length,'Duplicate SkillId');
const occupied = new Set();
let count=0;
for (const row of skills.rows) {
 if (!jobs.has(row.JobId) || row.JobVariantOf) {
  assert(!row.Branch, 'Branch outside job tree '+row.SkillId); continue;
 }
 count++;
 if (row.Branch) assert(keys.has(row.JobId+'|'+row.Branch), 'Unknown branch '+row.SkillId);
 for (const key of ['TreeRow','TreeCol']) assert(/^[1-3]$/.test(row[key]), 'Invalid coordinate '+row.SkillId);
 const slot=row.JobId+'|'+row.TreeRow+'|'+row.TreeCol;
 assert(!occupied.has(slot), 'Overlapping slot '+slot); occupied.add(slot);
 const seen=new Set([row.SkillId]);
 let current=row;
 while(current.ParentSkillId) {
  const parent=ids.get(current.ParentSkillId);
  assert(parent, 'Missing parent '+current.SkillId);
  assert.equal(parent.JobId,row.JobId,'Cross-job parent '+current.SkillId);
  assert(!seen.has(parent.SkillId),'Parent cycle '+row.SkillId); seen.add(parent.SkillId);
  current=parent;
 }
}
// Skill window contract (2026-10-02): prerequisites exist only as upgrade/evolve links, and each job skill has its own category tab.
const CATS=new Set(['combat','install','summon','mobility','support','passive','gather']);
let linked=0;
for (const row of skills.rows) {
 if (row.JobVariantOf) continue;
 const hasParent=!!row.ParentSkillId, link=row.LinkType||'';
 assert(['','upgrade','evolve'].includes(link), 'Invalid LinkType '+row.SkillId);
 assert.equal(hasParent, link!=='', 'Prerequisite without upgrade/evolve link (or link without parent) '+row.SkillId);
 if (hasParent) linked++;
 if (row.Category) assert(CATS.has(row.Category), 'Invalid Category '+row.SkillId);
 if (jobs.has(row.JobId)) assert(row.Category, 'Job skill without Category '+row.SkillId);
}
const wrapper=JSON.parse(fs.readFileSync(base+'JobBranchDataSet.userdataset','utf8'));
assert.equal(wrapper.ContentProto.Json.name,'JobBranchDataSet');
assert.equal(wrapper.EntryKey,'userdataset://'+wrapper.ContentProto.Json.id);
assert.equal(wrapper.ContentProto.Json.serveronly,false,'Client UI needs branch data');
console.log('PASS: '+count+' job skills, '+branches.rows.length+' branches; unique 3×3 slots, valid parents, client registration; '+linked+' upgrade/evolve links, categories set.');
