'use strict';
// 실제 mLua 메서드 실행 검사. MSW 렌더/네트워크는 대역이며 Play 확인은 별도다.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const fengari = require(path.resolve(process.argv[2] || 'scratch/job-reset-tests/node_modules/fengari'));
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = fengari;
const { read } = require('./skill_pipeline_csv.cjs');
const hud = fs.readFileSync('RootDesk/MyDesk/UI/Scripts/UIHUDController.mlua', 'utf8');
const monster = fs.readFileSync('RootDesk/MyDesk/Monster/Scripts/Monster.mlua', 'utf8');
const basic = read('RootDesk/MyDesk/Player/DataSets/WeaponAttackDataSet.csv');
const items = read('RootDesk/MyDesk/item/DataSets/item_dataset.csv').rows;
const weather = read('RootDesk/MyDesk/Weather/DataSets/WeatherDataSet.csv').rows;
const dagger = basic.rows.find(r => r.Key === 'Dagger_Throw_1');
const spirit = basic.rows.find(r => r.Key === 'Nature_Tap_1');
const rangedBasics = [dagger, spirit];
for (const row of rangedBasics) assert.equal(+row.StaggerEvery, 5);
assert(basic.rows.filter(r => !rangedBasics.includes(r)).every(r => !r.StaggerEvery));
assert.equal(basic.headers.length, 31);
const fog = weather.find(r => r.WeatherId === 'fog');
assert.equal(fog.ParticleColor.split('|')[3], '0.36');
assert.equal(fog.HazeColor.split('|')[3], '0.12');
assert.equal(fog.ReliefAffected, 'true');
assert(weather.filter(r => r !== fog).every(r => r.ReliefAffected !== 'true'));
const lightItems = items.filter(r => +r.EnvironmentLightRadius > 0);
assert.deepEqual(lightItems.map(r => r.Name).sort(), ['Cooking Pot', 'Furnace', 'Garden Lantern']);
assert(fs.readFileSync('RootDesk/MyDesk/Furniture/Scripts/PlaceableFurniture.mlua', 'utf8').includes('@Sync property string ItemId'));
function method(owner, name, source) {
  const m = source.match(new RegExp('\\tmethod \\w+ ' + name + '\\(([^)]*)\\)([\\s\\S]*?)\\n\\tend'));
  assert(m, name);
  return `function ${owner}:${name}(${m[1].split(',').map(a => a.trim().split(/\s+/).pop()).filter(Boolean).join(',')})${m[2]}\nend`;
}
const prop = name => +hud.match(new RegExp('property number ' + name + ' = ([0-9.]+)'))[1];
assert.equal(prop('NightVignetteIntensity'), 0.58);
function literal(v) {
  if (Array.isArray(v)) return '{' + v.map(literal).join(',') + '}';
  if (v && typeof v === 'object') return '{' + Object.entries(v).map(([k, value]) => '[' + literal(k) + ']=' + literal(value)).join(',') + '}';
  return JSON.stringify(v);
}
const code = `
log=function() end
isvalid=function(x) return type(x)=='table' and not x.destroyed end
Color=function(r,g,b,a) return {r=r,g=g,b=b,a=a} end
_UtilLogic={ElapsedSeconds=0}
local rows=${literal(lightItems)}
for _,row in ipairs(rows) do row.GetItem=function(self,key) return self[key] end end
_DataService={GetTable=function() return {FindRow=function(_,key,name) for _,r in ipairs(rows) do if r[key]==name then return r end end end} end}
HUD={}
${['ScanEnvironmentLights','GetEnvironmentReliefTarget','EnvironmentParticleColor','UpdateEnvironmentRelief','OnUpdate','ApplyEnvironmentVignette'].map(n => method('HUD', n, hud)).join('\n')}
local function map(name)
 return {Name=name,furniture={},scans=0,GetChildComponentsByTypeName=function(self) self.scans=self.scans+1 return self.furniture end}
end
local field=map('hunt01') local town=map('town')
local p={CurrentMap=field,TransformComponent={WorldPosition={x=0,y=0}}}
local h=setmetatable({_T={},EnvironmentTownMapName='town',TownEnvironmentScale=${prop('TownEnvironmentScale')},EnvironmentLightScanSeconds=${prop('EnvironmentLightScanSeconds')},EnvironmentReliefFadeSeconds=${prop('EnvironmentReliefFadeSeconds')},WeatherHazeFadeSeconds=${prop('WeatherHazeFadeSeconds')},NightVignetteIntensity=${prop('NightVignetteIntensity')},WeatherVignetteScale=0,MaxVignetteIntensity=0.9,VignetteSmoothness=0.65,NightVignetteColor=Color(0.04,0.06,0.18,1)},{__index=HUD})
_UserService={LocalPlayer=p}
local function close(a,b) assert(math.abs(a-b)<0.00001,tostring(a)..' != '..tostring(b)) end
local function light(name,at,isFire)
 local f=isFire and {IsSmelting=true} or nil
 local e={CurrentMap=at,EnabledInHierarchy=true,TransformComponent={WorldPosition={x=0,y=0}},GetComponent=function() return f end}
 local pf={Entity=e,ItemId=name,EnableInHierarchy=true} table.insert(at.furniture,pf)
 return e,pf,f
end
close(h:GetEnvironmentReliefTarget(p),1)
p.CurrentMap=town close(h:GetEnvironmentReliefTarget(p),0.55)
local e,pf,fire=light('Furnace',field,true)
p.CurrentMap=field _UtilLogic.ElapsedSeconds=1 close(h:GetEnvironmentReliefTarget(p),0.45)
p.TransformComponent.WorldPosition.x=2 close(h:GetEnvironmentReliefTarget(p),0.725)
p.TransformComponent.WorldPosition.x=4 close(h:GetEnvironmentReliefTarget(p),1)
p.TransformComponent.WorldPosition.x=0 fire.IsSmelting=false close(h:GetEnvironmentReliefTarget(p),1)
fire.IsSmelting=true pf.EnableInHierarchy=false close(h:GetEnvironmentReliefTarget(p),1)
pf.EnableInHierarchy=true e.EnabledInHierarchy=false close(h:GetEnvironmentReliefTarget(p),1)
e.EnabledInHierarchy=true e.destroyed=true close(h:GetEnvironmentReliefTarget(p),1) e.destroyed=false
local scans=field.scans _UtilLogic.ElapsedSeconds=1.9 h:GetEnvironmentReliefTarget(p) assert(field.scans==scans,'scans ran per frame')
local lamp=light('Garden Lantern',field,false) _UtilLogic.ElapsedSeconds=2.01 close(h:GetEnvironmentReliefTarget(p),0.4)
light('Garden Lantern',field,false) _UtilLogic.ElapsedSeconds=3.1 close(h:GetEnvironmentReliefTarget(p),0.4)
e.CurrentMap=town lamp.CurrentMap=town field.furniture={} _UtilLogic.ElapsedSeconds=4.2 close(h:GetEnvironmentReliefTarget(p),1)
-- No sources from the previous map; entering/leaving town is interpolated rather than snapped.
p.CurrentMap=town h._T.EnvironmentReliefScale=1 h:UpdateEnvironmentRelief(0.1)
assert(h._T.EnvironmentReliefScale>0.55 and h._T.EnvironmentReliefScale<1)
for i=1,120 do h:UpdateEnvironmentRelief(1/60) end
assert(math.abs(h._T.EnvironmentReliefScale-0.55)<0.01)
p.CurrentMap=field h:UpdateEnvironmentRelief(0.1) assert(h._T.EnvironmentReliefScale<1 and h._T.EnvironmentReliefScale>0.55)
-- Fog particles fade, rain remains unchanged, and each newly configured emitter gets current relief.
h._T.EnvironmentReliefScale=0.55
local cfg={color=Color(0.9,0.92,0.95,0.36),relief=true}
close(h:EnvironmentParticleColor(cfg).a,0.198)
close(h:EnvironmentParticleColor({color=Color(1,1,1,0.6),relief=false}).a,0.6)
p.CurrentMap=town h._T.WeatherGridCfg=cfg h._T.WeatherGridCells={one={AreaParticleComponent={Color=cfg.color}}}
h._T.EnvironmentParticleScale=nil h:UpdateEnvironmentRelief(0)
close(h._T.WeatherGridCells.one.AreaParticleComponent.Color.a,0.198)
-- Actual camera method uses the same attenuation and reaches zero in daylight.
local intensity=0 local camera={Entity={Name='camera'},ChangeMaterial=function() end}
_CameraService={GetCurrentCameraComponent=function() return camera end}
_MaterialService={ChangeMaterialProperty=function(_,_,values) intensity=values.Intensity end}
h._T.VignetteMaterialId='material' h:ApplyEnvironmentVignette(1,Color(0,0,0,0)) close(intensity,0.319)
h:ApplyEnvironmentVignette(0,Color(0,0,0,0)) close(intensity,0)
-- Actual haze update attenuates smoothly and clears when the weather ends.
h._T.WeatherReliefAffected=true h._T.WeatherHazeTarget=Color(0.88,0.9,0.93,0.12)
h._T.WeatherHaze={SpriteRendererComponent={Color=Color(0.88,0.9,0.93,0.12)},Enable=true}
h:OnUpdate(0.1) local alpha=h._T.WeatherHaze.SpriteRendererComponent.Color.a assert(alpha<0.12 and alpha>0.066)
for i=1,240 do h:OnUpdate(1/60) end close(h._T.WeatherHaze.SpriteRendererComponent.Color.a,0.066)
h._T.WeatherHazeTarget=Color(0,0,0,0) for i=1,300 do h:OnUpdate(1/60) end assert(not h._T.WeatherHaze.Enable)
-- Exact existing server stagger policy with the newly authored interval.
MON={}
${method('MON','IsKnockbackAllowed',monster)}
local combat={PendingSkillId='',PendingStaggerEvery=${+dagger.StaggerEvery}}
local attacker={Id='one',GetComponent=function() return combat end}
local attacker2={Id='two',GetComponent=function() return combat end}
local function mob() return setmetatable({_T={},StaggerResetSeconds=3,GetSkillStatus=function() return nil end},{__index=MON}) end
local m
for _,interval in ipairs({${rangedBasics.map(r => +r.StaggerEvery).join(',')}}) do
 combat.PendingStaggerEvery=interval m=mob() local hits={}
 for n=1,16 do _UtilLogic.ElapsedSeconds=n*0.1 if m:IsKnockbackAllowed(attacker) then table.insert(hits,n) end end
 assert(table.concat(hits,',')=='1,6,11,16')
end
assert(m:IsKnockbackAllowed(attacker2) and mob():IsKnockbackAllowed(attacker),'attacker/target counters shared')
_UtilLogic.ElapsedSeconds=5 assert(m:IsKnockbackAllowed(attacker),'idle reset lost')
combat.PendingStaggerEvery=0 for n=1,6 do assert(m:IsKnockbackAllowed(attacker),'melee policy changed') end
print('PASS actual Lua: Trapper/Wildkeeper stagger1/6/11/16, counters/idle reset; field/town/light radius, burning/off/disabled/deleted/stacking, cached scans, map transitions, smooth relief, fog/rain, camera/haze fade.')
`;
const state = lauxlib.luaL_newstate(); lualib.luaL_openlibs(state);
const result = lauxlib.luaL_dostring(state, to_luastring(code));
if (result !== lua.LUA_OK) throw Error(to_jsstring(lua.lua_tostring(state, -1)));
lua.lua_close(state);
