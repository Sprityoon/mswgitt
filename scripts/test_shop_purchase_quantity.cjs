'use strict';
// 실제 mLua 메서드를 Lua 5.3에서 실행한다. MSW의 네트워크/인벤토리/UI만 대역 사용. Play 대체 아님.
// node scripts/test_shop_purchase_quantity.cjs [--stage] [fengari 경로]
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const staged = process.argv.includes('--stage');
const dir = staged ? 'scratch/shop-quantity-stage-20261021/' : 'RootDesk/MyDesk/';
const inv = fs.readFileSync(dir + (staged ? 'PlayerInventory.mlua' : 'Player/Scripts/PlayerInventory.mlua'), 'utf8');
const ui = fs.readFileSync(dir + (staged ? 'UIShopController.mlua' : 'UI/Scripts/UIShopController.mlua'), 'utf8');
const fengari = require(path.resolve(process.argv.slice(2).find(x => x !== '--stage') || 'scratch/job-reset-tests/node_modules/fengari'));
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = fengari;
const { read } = require('./skill_pipeline_csv.cjs');
const offers = read(staged ? dir + 'ShopItemDataSet.csv' : 'RootDesk/MyDesk/item/DataSets/ShopItemDataSet.csv').rows;
const items = read('RootDesk/MyDesk/item/DataSets/item_dataset.csv').rows;
const resetNames = items.filter(r => ['AP', 'JobSP'].includes(r.UseReset)).map(r => r.Name);
assert.equal(resetNames.length, 2);
for (const name of resetNames) {
  const rows = offers.filter(r => r.Name === name);
  assert.equal(rows.length, 4);
  assert(rows.every(r => +r.BuyPrice === 150 && +r.RepeatBuyPrice === 3000 && +r.MaxBuyCount === 1 && +r.SellPrice === 0));
}
for (const name of new Set(offers.map(r => r.Name))) {
  assert.equal(new Set(offers.filter(r => r.Name === name).map(r => [r.BuyPrice, r.RepeatBuyPrice, r.MaxBuyCount].join('/'))).size, 1, 'vendor mismatch: ' + name);
}
function method(owner, name, source) {
  const match = source.match(new RegExp('\\tmethod \\w+ ' + name + '\\(([^)]*)\\)([\\s\\S]*?)\\n\\tend'));
  assert(match, name);
  return 'function ' + owner + ':' + name + '(' + match[1].split(',').map(a => a.trim().split(/\s+/).pop()).filter(Boolean).join(',') + ')' + match[2] + '\nend';
}
function literal(value) {
  if (Array.isArray(value)) return '{' + value.map(literal).join(',') + '}';
  if (value && typeof value === 'object') return '{' + Object.entries(value).map(([k, v]) => '[' + literal(k) + ']=' + literal(v)).join(',') + '}';
  return JSON.stringify(value);
}
const serverMethods = ['GetShopBuyPrice', 'GetShopMaxBuyCount', 'BuyShopItem', 'ServerRequestBuyItem', 'ServerRequestBuyQuantity', 'SafeDecodeJson', 'SafeEncodeJson'];
const uiMethods = ['InitBuyQuantity', 'OpenBuyQuantity', 'RefreshBuyQuantity', 'SetBuyCount', 'ChangeBuyCount', 'SetBuyButtonActive', 'CloseBuyQuantity', 'ConfirmBuyQuantity', 'SetAnyText', 'OnSlotClick', 'Close'];
assert(inv.includes('method void ServerRequestBuyItem(string itemName)'));
assert(!ui.includes('inv:ServerRequestBuyItem(item.name)'), 'slot click must not buy immediately');
assert(!method('INV', 'BuyShopItem', inv).match(/\bwait\(|GetAndWait|SetAndWait/), 'purchase must not yield between validation/history/payment');
const save = fs.readFileSync('RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua', 'utf8');
for (const line of ['inv.ShopPurchasesJson = data.shopPurchases or "{}"', 'inv.ShopPurchasesJson = "{}"', 'local capShopPurchases = inv.ShopPurchasesJson or "{}"', 'shopPurchases = capShopPurchases,']) assert(save.includes(line));
const normal = offers.find(r => !resetNames.includes(r.Name) && +r.BuyPrice > 0);
assert(normal);
const code = `
local function copy(t) if type(t)~='table' then return t end local c={} for k,v in pairs(t) do c[k]=copy(v) end return c end
local json={['{}']={}} local serial=0
_HttpService={JSONEncode=function(_,t) serial=serial+1 local key='json'..serial json[key]=copy(t) return key end, JSONDecode=function(_,key) return copy(json[key]) end}
local function dataset(rows)
 for _,row in ipairs(rows) do row.GetItem=function(self,key) return self[key] end end
 return {FindRow=function(_,key,value) for _,row in ipairs(rows) do if row[key]==value then return row end end end}
end
local offers=${literal(offers)} local shop=dataset(offers) local catalog=dataset(${literal(items)})
_DataService={GetTable=function(_,name) if name=='ShopItemDataSet' then return shop elseif name=='item_dataset' then return catalog end end}
local dirty=0 _PersistenceManager={MarkPlayerDirty=function() dirty=dirty+1 end}
log=function() end log_warning=function() end isvalid=function(x) return x~=nil and x~=false end senderUserId='alice'
INV={}
${serverMethods.map(n => method('INV', n, inv)).join('\n')}
local function player(coin,history)
 return setmetatable({Coin=coin or 10000,ShopPurchasesJson=history or '{}',Items={},Entity={PlayerComponent={UserId='alice'}},
 ConsolidateCurrencyItems=function() end, ClientShowFeedback=function(self,msg) self.feedback=msg end,
 RemoveItem=function(self,name,n) if self.failRemove or self.Coin<n then return false end self.Coin=self.Coin-n return true end,
 AddItem=function(self,name,n) self.Items[name]=(self.Items[name] or 0)+n return name end},{__index=INV})
end
local resets=${literal(resetNames)}
for _,name in ipairs(resets) do
 local p=player() local before=p.Coin
 assert(p:GetShopMaxBuyCount(name)==1 and p:GetShopBuyPrice(name)==150)
 for _,n in ipairs({-1,0,1.5,2,99,1000000}) do p:ServerRequestBuyQuantity(name,n,150) assert(p.Coin==before and p.Items[name]==nil and p.ShopPurchasesJson=='{}','invalid quantity mutated state') end
 senderUserId='other' p:ServerRequestBuyQuantity(name,1,150) p:ServerRequestBuyItem(name) assert(p.Coin==before and p.Items[name]==nil)
 senderUserId='alice' p.failRemove=true p:ServerRequestBuyQuantity(name,1,150) assert(p.Coin==before and p.ShopPurchasesJson=='{}') p.failRemove=false
 p:ServerRequestBuyQuantity(name,1,150) assert(p.Coin==before-150 and p.Items[name]==1 and p:GetShopBuyPrice(name)==3000)
 local after=p.Coin p:ServerRequestBuyQuantity(name,1,150) assert(p.Coin==after and p.Items[name]==1,'stale first-price duplicate was charged')
 p:ServerRequestBuyQuantity(name,1,0) p:ServerRequestBuyQuantity(name,1,-1) assert(p.Coin==after)
 p:ServerRequestBuyQuantity(name,2,3000) assert(p.Coin==after and p.Items[name]==1,'repeat quantity lock failed')
 p:ServerRequestBuyQuantity(name,1,3000) assert(p.Coin==after-3000 and p.Items[name]==2)
 assert(player(10000,p.ShopPurchasesJson):GetShopBuyPrice(name)==3000,'saved history not honored')
 assert(player():GetShopBuyPrice(name)==150,'other slot/old save must start independently')
 local poor=player(149) poor:ServerRequestBuyQuantity(name,1,150) assert(poor.Coin==149 and poor.Items[name]==nil and poor.ShopPurchasesJson=='{}')
 local legacy=player() legacy:ServerRequestBuyItem(name) legacy:ServerRequestBuyItem(name) assert(legacy.Coin==6850 and legacy.Items[name]==2,'legacy RPC bypassed repeat price')
end
local p=player() p:ServerRequestBuyQuantity(resets[1],1,150) assert(p:GetShopBuyPrice(resets[2])==150,'AP and SP histories must be independent')
-- Even a future mistaken bulk limit must never discount a batch of repeated-price items.
local row=shop:FindRow('Name',resets[1]) local old=row.MaxBuyCount row.MaxBuyCount='99' assert(p:GetShopMaxBuyCount(resets[1])==1) row.MaxBuyCount=old
local normal=${literal(normal.Name)} local unit=${+normal.BuyPrice} p=player(unit*7)
p:ServerRequestBuyQuantity(normal,7,unit) assert(p.Coin==0 and p.Items[normal]==7,'batch total/quantity mismatch')
local after=p.Coin p:ServerRequestBuyQuantity(normal,1,unit) assert(p.Coin==after and p.Items[normal]==7)
p=player(unit*100) p:ServerRequestBuyQuantity(normal,100,unit) assert(p.Items[normal]==nil) p:ServerRequestBuyQuantity(normal,99,unit) assert(p.Items[normal]==99 and p.Coin==unit)
-- Run actual client selection/confirm methods against lightweight UI entities and the same server methods.
UI={}
${uiMethods.map(n => method('UI', n, ui)).join('\n')}
_UIButtonStyle={SetActive=function(_,b,on) b.ButtonComponent.Enable=on end}
local function view(inv)
 local children={} for _,name in ipairs({'ItemName','UnitPrice','LimitText','CountText','TotalPrice','BtnMinus','BtnPlus','BtnMin','BtnMax','BtnBuy','BtnCancel','BtnClose'}) do
  children[name]={TextGUIRendererComponent={Text=''},ButtonComponent={Enable=true},ConnectEvent=function(_,_,callback) return callback end}
 end
 local playerEntity={GetComponent=function() return inv end} _UserService={LocalPlayer=playerEntity}
 return setmetatable({_T={},buyPopup={Enable=false},buyCard={GetChildByName=function(_,name) return children[name] end},buyHandlers={},Entity={Enable=true},currentTab='buy',shopItems={{name=normal}}},{__index=UI}),children
end
ButtonClickEvent={} p=player(unit*200) local u,fields=view(p) u:InitBuyQuantity() assert(#u.buyHandlers==7)
u:OnSlotClick(1) assert(u.buyPopup.Enable and p.Items[normal]==nil,'slot click purchased immediately')
u:SetBuyCount(1000) assert(u._T.buyCount==99) u:ChangeBuyCount(-98) assert(u._T.buyCount==1)
u:SetBuyCount(7) u:ConfirmBuyQuantity() assert(p.Items[normal]==7 and p.Coin==unit*193 and not u.buyPopup.Enable)
u:ConfirmBuyQuantity() assert(p.Items[normal]==7,'duplicate confirm purchased twice')
u:OpenBuyQuantity(normal) u:CloseBuyQuantity() assert(p.Items[normal]==7)
p=player() u,fields=view(p) u:OpenBuyQuantity(resets[1]) u:SetBuyCount(99)
assert(u._T.buyCount==1 and not fields.BtnPlus.ButtonComponent.Enable and not fields.BtnMax.ButtonComponent.Enable)
assert(fields.CountText.TextGUIRendererComponent.Text=='1개' and fields.LimitText.TextGUIRendererComponent.Text=='한 번에 1개만 구매할 수 있습니다.')
u.shopItems[1]={name=normal} u:ConfirmBuyQuantity() assert(p.Items[resets[1]]==1 and p.Items[normal]==nil,'selected item changed under the modal')
u:OpenBuyQuantity(resets[1]) assert(u._T.buyPrice==3000) u:Close() assert(not u.Entity.Enable and not u.buyPopup.Enable)
p=player(1) u,fields=view(p) u:OpenBuyQuantity(resets[1]) assert(not fields.BtnBuy.ButtonComponent.Enable)
print('PASS actual Lua: batch total, 99 cap, reset 1 cap, AP/SP independent repeat prices, stale price, forged sender, insufficient funds, failed debit, saved/old/other-slot histories, legacy RPC, selection/cancel/double-confirm/locked UI.')
`;
const state = lauxlib.luaL_newstate();
lualib.luaL_openlibs(state);
const result = lauxlib.luaL_dostring(state, to_luastring(code));
if (result !== lua.LUA_OK) throw Error(to_jsstring(lua.lua_tostring(state, -1)));
lua.lua_close(state);
