'use strict';
// Actual mLua methods in Lua; MSW entities/services are small test doubles.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {read} = require('./skill_pipeline_csv.cjs');
const {lua,lauxlib,lualib,to_luastring,to_jsstring} = require(path.resolve('scratch/job-reset-tests/node_modules/fengari'));
const cropPath='RootDesk/MyDesk/MapObjects/DataSets/CropDataSet.csv';
const crops=read(cropPath).rows;
const items=read('RootDesk/MyDesk/item/DataSets/item_dataset.csv').rows;
const shops=read('RootDesk/MyDesk/item/DataSets/ShopItemDataSet.csv').rows;
const cooking=read('RootDesk/MyDesk/Furniture/DataSets/CookingRecipeDataSet.csv').rows;
const itemNames=new Set(items.map(r=>r.Name));
assert.equal(crops.length,6);
assert.equal(itemNames.size,items.length);
const spriteFiles=fs.readdirSync('RootDesk/MyDesk/MapObjects/Sprites/Crops').filter(x=>x.endsWith('.sprite'));
const ruids=new Set(spriteFiles.map(f=>JSON.parse(fs.readFileSync('RootDesk/MyDesk/MapObjects/Sprites/Crops/'+f)).EntryKey.replace('sprite://','')));
for(const r of crops){
  assert(itemNames.has(r.SeedItem) && itemNames.has(r.HarvestItem));
  assert.equal(r.StageSprites.split('|').length,+r.GrowthStages);
  assert.equal(r.StageScales.split('|').length,+r.GrowthStages);
  for(const id of r.StageSprites.split('|'))assert(ruids.has(id));
  assert(shops.some(s=>s.Name===r.SeedItem && +s.BuyPrice>0));
  assert(shops.some(s=>s.Name===r.HarvestItem && +s.SellPrice>0));
  assert(cooking.some(c=>[c.Ing1Name,c.Ing2Name,c.Ing3Name].includes(r.HarvestItem)));
}
for(const r of cooking)for(const n of [r.RecipeName,r.Ing1Name,r.Ing2Name,r.Ing3Name].filter(Boolean))assert(itemNames.has(n),n);
function method(owner,name,src){
  const m=src.match(new RegExp('\\tmethod \\w+ '+name+'\\(([^)]*)\\)([\\s\\S]*?)\\n\\tend'));
  assert(m,name);
  return `function ${owner}:${name}(${m[1].split(',').map(x=>x.trim().split(/\s+/).pop()).filter(Boolean).join(',')})${m[2]}\nend`;
}
function literal(v){
  if(Array.isArray(v))return '{'+v.map(literal).join(',')+'}';
  if(v && typeof v==='object')return '{'+Object.entries(v).map(([k,v])=>'['+literal(k)+']='+literal(v)).join(',')+'}';
  return JSON.stringify(v);
}
const crop=fs.readFileSync('RootDesk/MyDesk/MapObjects/Scripts/Crop.mlua','utf8');
const sp=fs.readFileSync('RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua','utf8');
const inv=fs.readFileSync('RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua','utf8');
const code=`
log=function() end
isvalid=function(v) return type(v)=='table' and not v.destroyed end
Vector3=function(x,y,z) return {x=x,y=y,z=z} end
local now=10000 os.time=function() return now end
local rows=${literal(crops)} local itemRows=${literal(items.filter(r=>r.CropCareAction))}
for _,r in ipairs(rows) do r.GetItem=function(self,k) return self[k] end end
for _,r in ipairs(itemRows) do r.GetItem=function(self,k) return self[k] end end
_DataService={GetTable=function(_,name) return {FindRow=function(_,key,value) for _,r in ipairs(name=='item_dataset' and itemRows or rows) do if r[key]==value then return r end end end} end}
SP={}
${['GetAimBlockOrigin','ResolveCropBlockOrigin','GetCropPlantPosition','GetOccupiedAnchorPosition','AddPlacedFurniture'].map(n=>method('SP',n,sp)).join('\n')}
function SP:IsPlantableFarmCell(_,x,y) return x>=2 and x<=3 and y>=4 and y<=5 end
for x=2,3 do for y=4,5 do for dx=-1,1 do for dy=-1,1 do
 local b=SP:ResolveCropBlockOrigin({},x,y,dx,dy)
 assert(b.ok and b.x==2 and b.y==4,'single plot moved between subcells')
end end end end
assert(not SP:ResolveCropBlockOrigin({},1,4,1,0).ok,'outside plot accepted')
for _,r in ipairs(rows) do local p=SP:GetCropPlantPosition(r.SeedItem,2,4) assert(p.x==3 and math.abs(p.y-5.435)<0.00001) end
MON={}
${['GetCropRow','GetElapsedSeconds','ComputeStage','IsMature','ApplyCare','TryRegrow','RollHarvestCount','PersistState','ApplyWeatherGrowthBoost'].map(n=>method('MON',n,crop)).join('\n')}
function MON:RefreshGrowthVisual() self.CurrentStage=self:ComputeStage() end
local map={Name='Home_owner'} local grids={} local placements={} local dirty=0
_HttpService={JSONDecode=function(_,v) return v end,JSONEncode=function(_,v) return v end}
_PersistenceManager={MarkPlayerDirty=function() dirty=dirty+1 end,CheckGuestPermission=function() return true end}
_ResourceSpawner={GetGridToEntity=function() return grids end,GetPlacedFurnitureJson=function() return placements end,SetPlacedFurnitureJson=function(_,_,v) placements=v end}
local function plant(row)
 local e={CurrentMap=map} local c=setmetatable({Entity=e,SeedItem=row.SeedItem,PlantedAtUnix=now,CurrentStage=1,WateredStage=0,IsFertilized=false},{__index=MON})
 e.GetComponent=function(_,name)
  if name=='script.Crop' then return c end
  if name=='script.ResourceOccupiedArea' then return {OffsetXMin=0,OffsetXMax=1,OffsetYMin=0,OffsetYMax=1} end
 end
 grids={['2_4']={entity=e,pivotX=2,pivotY=4},['3_4']={entity=e,pivotX=2,pivotY=4}}
 placements={{x=2,y=4,plantedAt=now,itemName=row.SeedItem}}
 return c
end
for _,r in ipairs(rows) do
 local c=plant(r) local duration=tonumber(r.StageDuration) local stages=tonumber(r.GrowthStages)
 assert(c:ComputeStage()==1 and not c:IsMature())
 assert(c:ApplyCare('water') and c.PlantedAtUnix==now-math.floor(duration*0.5))
 assert(not c:ApplyCare('water'),'repeated watering accepted')
 assert(c:ApplyCare('fertilize') and not c:ApplyCare('fertilize'))
 for i=1,40 do assert(c:RollHarvestCount()>=tonumber(r.MinYield)+1) end
 assert(placements[1].isFertilized and placements[1].wateredStage==1)
 assert(grids['3_4'].plantedAt==c.PlantedAtUnix)
 c.PlantedAtUnix=now-stages*duration assert(c:IsMature() and c:ComputeStage()==stages)
 assert(not c:ApplyCare('water') and not c:ApplyCare('fertilize'))
 local regrow=tonumber(r.RegrowStage)
 assert(c:TryRegrow()==(regrow>0))
 if regrow>0 then assert(c:ComputeStage()==regrow and not c:IsMature() and not c.IsFertilized and c.WateredStage==0) end
end
local c=plant(rows[1]) c:ApplyWeatherGrowthBoost(2) assert(placements[1].plantedAt==now-2 and dirty>0)
-- Placement registration must preserve the sprite-root correction after initial spawn.
SP.GetPlacedFurnitureJson=_ResourceSpawner.GetPlacedFurnitureJson
SP.SetPlacedFurnitureJson=_ResourceSpawner.SetPlacedFurnitureJson
SP.GetGridToEntity=_ResourceSpawner.GetGridToEntity
SP.GetSpawnedEntities=function() return {} end
c.Entity.TransformComponent={WorldPosition={x=3,y=5.435,z=0}}
placements={}
SP:AddPlacedFurniture(map.Name,c.SeedItem,2,4,c.Entity)
assert(math.abs(c.Entity.TransformComponent.WorldPosition.y-5.435)<0.00001,'registration overwrote corrected root')
INV={}
${method('INV','ServerRequestCropCare',inv)}
local count=2 local pc={LastDirectionX=1,LastDirectionY=0,ShowMineFeedback=function() end}
local user={PlayerComponent={UserId='owner'},CurrentMap=map,TransformComponent={WorldPosition={x=1,y=4}},GetComponent=function() return pc end}
local i=setmetatable({Entity=user,QuickSlotsJson={'Compost'},SelectedQuickSlotIndex=1,_T={},SafeDecodeJson=function(_,x) return x end,GetBaseItemName=function(_,x) return x end,HasItem=function() return count>0 end,RemoveItem=function() count=count-1 return true end},{__index=INV})
senderUserId='intruder' _UtilLogic={ServerElapsedSeconds=100}
i:ServerRequestCropCare('Compost',2,4) assert(count==2 and not c.IsFertilized)
senderUserId='owner' i:ServerRequestCropCare('Compost',99,99) assert(count==2)
i:ServerRequestCropCare('Watering Can',2,4) assert(count==2)
i:ServerRequestCropCare('Compost',2,4) assert(count==1 and c.IsFertilized)
_UtilLogic.ServerElapsedSeconds=101 i:ServerRequestCropCare('Compost',2,4) assert(count==1,'duplicate fertilizer consumed')
print('PASS actual Lua: plot corners/directions, shared root alignment, six crops growth/yield, care deduplication, regrowth, placement-state persistence, server ownership/selection/range and consume-on-success; data references.')
`;
const state=lauxlib.luaL_newstate();lualib.luaL_openlibs(state);
const result=lauxlib.luaL_dostring(state,to_luastring(code));
if(result!==lua.LUA_OK)throw Error(to_jsstring(lua.lua_tostring(state,-1)));
lua.lua_close(state);
