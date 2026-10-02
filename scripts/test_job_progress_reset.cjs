'use strict';
// Execute the actual mlua method bodies in Lua 5.3 with MSW services mocked.
// Usage: node scripts/test_job_progress_reset.cjs <path-to-fengari>
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const fengari=require(path.resolve(process.argv[2] || 'scratch/job-reset-tests/node_modules/fengari'));
const {lua,lauxlib,lualib,to_luastring,to_jsstring}=fengari;
const {read}=require('./skill_pipeline_csv.cjs');
const source=fs.readFileSync('RootDesk/MyDesk/Player/Scripts/PlayerController.mlua','utf8');
function method(name, input=source, owner='PC') {
 const re=new RegExp('\\tmethod \\w+ '+name+'\\(([^)]*)\\)([\\s\\S]*?)\\n\\tend');
 const match=input.match(re); assert(match,name);
 let body=match[2];
 // mlua continue -> native Lua repeat/break, scoped inside its existing for loop.
 body=body.replace(/(for i = 1, ds:GetRowCount\(\) do)([\s\S]*?)(\n\t\t\tend)/g,'$1 repeat$2\n until true$3').replace(/\bcontinue\b/g,'break');
 return 'function '+owner+':'+name+'('+match[1].split(',').map(a=>a.trim().split(/\s+/).pop()).filter(Boolean).join(',')+')'+body+'\nend';
}
function literal(value) {
 if(Array.isArray(value)) return '{'+value.map(literal).join(',')+'}';
 if(value && typeof value==='object') return '{'+Object.entries(value).map(([k,v])=>'['+literal(k)+']='+literal(v)).join(',')+'}';
 return JSON.stringify(value);
}
const skills=read('RootDesk/MyDesk/Player/DataSets/SkillDataSet.csv').rows;
const items=read('RootDesk/MyDesk/item/DataSets/item_dataset.csv').rows;
const shop=read('RootDesk/MyDesk/item/DataSets/ShopItemDataSet.csv').rows;
for (const item of items.filter(r=>r.UseReset)) {
 assert(['AP','JobSP'].includes(item.UseReset)); assert.equal(item.Category,'consumable');
 assert(!item.UseBuffId && !item.UseUnlockId && !item.UseAnimalId && !item.UsePetId && !item.DeathEffect);
 const offers=shop.filter(r=>r.Name===item.Name); assert.equal(offers.length,4);
 assert.equal(new Set(offers.map(r=>r.BuyPrice)).size,1,'Server first Name match must agree with vendor price');
 assert(offers.every(r=>Number(r.BuyPrice)>0 && r.SellPrice==='0'));
 assert.deepEqual(offers.map(r=>r.Vendor).sort(),['barnkeeper','blacksmith','researcher','vendor']);
}
assert.equal(items.filter(r=>r.UseReset).length,2);
const pm=fs.readFileSync('RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua','utf8');
const migration=pm.slice(pm.indexOf('\t\t\t\tpc.JobBranchResetVersion = math.max'),pm.indexOf('\t\t\t\t-- T64: 낚시 숙련'));
assert(migration.includes('BuildProgressReset("All")'));
assert.equal((pm.match(/if branchMigrated then self:MarkPlayerDirty\(userId\) else self.DirtyPlayers\[userId\] = false end/g)||[]).length,4);
assert(pm.includes('jobBranchResetVersion = capJobBranchResetVersion,'));
const code=`
local function copy(t) if type(t) ~= 'table' then return t end local out={} for k,v in pairs(t) do out[k]=copy(v) end return out end
local json={} local serial=0
_HttpService={JSONEncode=function(_,t) serial=serial+1 local key='json'..serial json[key]=copy(t) return key end,
 JSONDecode=function(_,key) assert(json[key], 'invalid JSON') return copy(json[key]) end}
local rows=${literal(skills)}
for _,row in ipairs(rows) do row.GetItem=function(self,key) return self[key] end end
local ds={GetRowCount=function() return #rows end,GetCell=function(_,i,key) return rows[i][key] end,
 FindRow=function(_,key,value) for _,row in ipairs(rows) do if row[key]==value then return row end end end}
_DataService={GetTable=function() return ds end}
local dirty=0 _PersistenceManager={MarkPlayerDirty=function() dirty=dirty+1 end}
log=function() end log_error=function() end
PC={}
function PC:SkillText(row,key) return row and row[key] or '' end
function PC:SkillNumber(row,key,fallback) return tonumber(self:SkillText(row,key)) or fallback end
function PC:ApplyDerivedStats() self.derived=(self.derived or 0)+1 end
function PC:SanitizeEquippedSkills() local levels=_HttpService:JSONDecode(self.SkillLevelsJson) for i,id in ipairs(self.equipped) do if not levels[id] or levels[id]<1 then self.equipped[i]='' end end end
${method('BuildProgressReset')}
${method('ApplyProgressReset')}
local function migrate(pc,data)
 local branchMigrated=false local slot=1 local userId='test'
 ${migration}
 return branchMigrated
end
local function player(levels)
 return setmetatable({StatStr=1,StatDex=2,StatInt=3,StatSpi=4,StatVit=5,AP=7,SP=4,JobId='alchemist',
 SkillLevelsJson=_HttpService:JSONEncode(levels or {acid_potion=3,fireball=5,ember_crystal=2,power_strike=2,armor_break=1}),
 Entity={PlayerComponent={UserId='test'}},equipped={'acid_potion','power_strike','fireball',''}},{__index=PC})
end
local p=player() local initial=p.SkillLevelsJson
local plan=p:BuildProgressReset('AP') assert(plan.ap==15 and plan.sp==0)
assert(p.AP==7 and p.StatStr==1 and p.SkillLevelsJson==initial,'planning must not mutate')
p:ApplyProgressReset(plan) assert(p.AP==22 and p.SP==4 and p.StatVit==0 and p.SkillLevelsJson==initial)
assert(p:BuildProgressReset('AP')==nil,'repeat AP reset must not consume')
p=player() plan=p:BuildProgressReset('JobSP') assert(plan.sp==12,'old Lv5 and tier3 cost2 must refund in full')
p:ApplyProgressReset(plan) local levels=_HttpService:JSONDecode(p.SkillLevelsJson)
assert(p.SP==16 and p.AP==7 and p.StatStr==1)
assert(levels.power_strike==2 and levels.armor_break==1 and levels.fireball==nil,'preserve common/other jobs')
assert(p.equipped[1]=='' and p.equipped[2]=='power_strike' and p.equipped[3]=='')
assert(p:BuildProgressReset('JobSP')==nil,'repeat SP reset must not consume')
p=player() assert(migrate(p,{}) and p.JobBranchResetVersion==1 and p.AP==22 and p.SP==16)
assert(not migrate(p,{jobBranchResetVersion=1}) and p.AP==22 and p.SP==16,'persisted version prevents repeated refund')
local p2=player() assert(migrate(p2,{}) and p2.AP==22,'separate slot has independent migration')
local bad=player() bad.SkillLevelsJson='broken' local before=bad.AP
assert(bad:BuildProgressReset('All')==nil and not migrate(bad,{}) and bad.AP==before and bad.JobBranchResetVersion==0,'invalid levels must not wipe stats or stamp version')
local empty=player({power_strike=2}) empty.JobId='' assert(empty:BuildProgressReset('JobSP')==nil)
local old=ds ds=nil assert(empty:BuildProgressReset('All')==nil) ds=old
assert(empty:BuildProgressReset('unsupported')==nil)
assert(dirty==2,'paid reset marks dirty; migration defers dirty until full load completes')
-- Execute the actual inventory RPC: ownership, inventory availability, successful remove, and no-op refusal.
local itemRows=${literal(items)}
for _,row in ipairs(itemRows) do row.GetItem=function(self,key) return self[key] end end
local itemDs={FindRow=function(_,key,value) for _,row in ipairs(itemRows) do if row[key]==value then return row end end end}
_DataService.GetTable=function(_,name) if name=='item_dataset' then return itemDs end return ds end
isvalid=function(x) return x~=nil end senderUserId='test'
function PC:ShowMineFeedback(text) self.feedback=text end
INV={}
${method('ServerRequestUseItem',fs.readFileSync('RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua','utf8'),'INV')}
local function inventory(pc)
 return setmetatable({count=2,failRemove=false,Entity={PlayerComponent={UserId='test'},GetComponent=function() return pc end},
 GetBaseItemName=function(_,name) return name end,GetItemCount=function(self) return self.count end,
 RemoveItem=function(self) if self.failRemove then return false end self.count=self.count-1 return true end},{__index=INV})
end
p=player() local inv=inventory(p)
senderUserId='other' inv:ServerRequestUseItem('Oblivion Potion') assert(inv.count==2 and p.AP==7)
senderUserId='test' inv.count=0 inv:ServerRequestUseItem('Oblivion Potion') assert(p.AP==7)
inv.count=2 inv.failRemove=true inv:ServerRequestUseItem('Oblivion Potion') assert(inv.count==2 and p.AP==7)
inv.failRemove=false inv:ServerRequestUseItem('Oblivion Potion') assert(inv.count==1 and p.AP==22)
inv:ServerRequestUseItem('Oblivion Potion') assert(inv.count==1 and p.AP==22,'empty AP must not consume')
inv:ServerRequestUseItem('Oblivion Scroll') assert(inv.count==0 and p.SP==16)
-- Same multiplier in authoritative damage and the client detail estimate.
function PC:GetSkillCore() return 100 end
function PC:GetPassiveBonus(key) if key=='ThrowDamagePct' then return 0.2 end return 0 end
function PC:GetEffectiveSkillLevel() return 1 end
function PC:GetEffectiveDamageMultiplier() return 1 end
function PC:IsDamageSkillRow() return true end
function PC:GetSkillScaleStat(row) return row.ScaleStat end
function PC:GetStatLabel(stat) return stat end
${method('ComputeSkillDamage')}
${method('GetSkillDamageLine')}
assert(p:ComputeSkillDamage('axe_rain',1)==120)
assert(p:ComputeSkillDamage('acid_potion',1)==100)
assert(string.find(p:GetSkillDamageLine(ds:FindRow('SkillId','axe_rain')),'120',1,true))
print('PASS: actual Lua reset/migration/RPC; totals, old Lv5, common skills, slots, repeats, saves, malformed data, sender, removal, damage/UI parity; 8 mentor offers.')
`;
const state=lauxlib.luaL_newstate(); lualib.luaL_openlibs(state);
const result=lauxlib.luaL_dostring(state,to_luastring(code));
if(result!==lua.LUA_OK) throw Error(to_jsstring(lua.lua_tostring(state,-1)));
lua.lua_close(state);
