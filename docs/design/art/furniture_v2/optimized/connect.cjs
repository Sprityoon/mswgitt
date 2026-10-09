"use strict";
// Apply only the already-reviewed resource/scale changes; preserve other cells.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'../../../../..');
const {ModelBuilder,vector2,vector3}=require(path.join(ROOT,'.agents/skills/msw-general/scripts/model/msw_model_builder.cjs'));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
const ruids=JSON.parse(fs.readFileSync(path.join(__dirname,'ruids.json'),'utf8'));
const C={sprite:'MOD.Core.SpriteRendererComponent',transform:'MOD.Core.TransformComponent',trigger:'MOD.Core.TriggerComponent'};
const close=(a,b)=>Math.abs(a-b)<1e-10;
function checkXY(actual,wanted,label){assert(close(actual.x,wanted[0])&&close(actual.y,wanted[1]),label);}
function parseCSV(text){
  const rows=[];let row=[],pos=text.startsWith('\uFEFF')?1:0;
  while(pos<text.length){
    const start=pos;let value='';
    if(text[pos]==='"'){
      pos++;let closed=false;
      while(pos<text.length){if(text[pos]==='"'){if(text[pos+1]==='"'){value+='"';pos+=2;}else{pos++;closed=true;break;}}else value+=text[pos++];}
      assert(closed,'Unclosed CSV quote');
    }else while(pos<text.length&&![',','\r','\n'].includes(text[pos]))value+=text[pos++];
    row.push({start,end:pos,value});
    if(text[pos]===','){pos++;if(pos===text.length)row.push({start:pos,end:pos,value:''});continue;}
    if(text[pos]==='\r')pos++;
    if(text[pos]==='\n')pos++;
    rows.push(row);row=[];
  }
  if(row.length)rows.push(row);
  return rows;
}
function table(file){const text=fs.readFileSync(path.join(ROOT,file),'utf8'),rows=parseCSV(text);return{file,text,rows,header:rows[0].map(c=>c.value),edits:[]};}
function rowBy(t,column,value){const i=t.header.indexOf(column);assert(i>=0,'Missing column '+column);const found=t.rows.slice(1).filter(r=>r[i]?.value===value);assert.equal(found.length,1,'Unique row '+value);assert.equal(found[0].length,t.header.length,'Column alignment '+value);return found[0];}
function cell(t,row,column,oldValue,newValue){
  const i=t.header.indexOf(column);assert(i>=0,'Missing column '+column);const c=row[i];
  assert([String(oldValue),String(newValue)].includes(c.value),'Unexpected '+column+' value: '+c.value);
  t.edits.push({...c,newValue:String(newValue),column,row});
}
function patchedText(t){let output=t.text;for(const e of [...t.edits].sort((a,b)=>b.start-a.start))output=output.slice(0,e.start)+e.newValue+output.slice(e.end);return output;}
function set(b,target,name,value,type){
  b.value(target,name,value,type);
  for(const prop of b.snapshot().properties){
    if(prop.link_property===name&&prop.link_target?.type?.split(',')[0]===target&&b.listValues().some(v=>v.TargetType==null&&v.Name===prop.name))b.value(null,prop.name,value,type);
  }
}
function checkUntouched(before,after,edited){
  const remove=s=>{const o=structuredClone(s);o.values=o.values.filter(v=>!edited.has((v.target_type||'')+'|'+v.name));return o;};
  assert.deepEqual(remove(after),remove(before),'Unrelated model fields changed');
}
function modelPlan(asset,kind){
  const i=asset.integration,p=kind==='sprite'?i.furniturePath:i.dropPath,b=ModelBuilder.read(path.join(ROOT,p)),before=b.snapshot();
  const oldRUID=kind==='sprite'?i.oldSpriteRUID:i.oldIconRUID,newRUID=ruids[asset.images[kind].file];
  const current=b.getValue(C.sprite,'SpriteRUID'),already=current===newRUID;
  assert([oldRUID,newRUID].includes(current),'Unexpected RUID '+p);
  const oldScale=kind==='sprite'?i.oldModelScale:i.oldDropModelScale,newScale=kind==='sprite'?i.newModelScale:i.newDropModelScale;
  const originalScale=b.getValue(C.transform,'Scale');checkXY(originalScale,already?newScale:oldScale,'Scale preflight '+p);
  const edited=new Set([C.sprite+'|SpriteRUID',C.transform+'|Scale']);
  for(const prop of before.properties)if([C.sprite,C.transform,C.trigger].some(c=>prop.link_target?.type?.split(',')[0]===c)&&['SpriteRUID','Scale','BoxSize','ColliderOffset'].includes(prop.link_property))edited.add('|'+prop.name);
  set(b,C.sprite,'SpriteRUID',newRUID,'string');set(b,C.transform,'Scale',vector3(...newScale,originalScale.z),'vector3');
  if(kind==='sprite'){
    checkXY(b.getValue(C.trigger,'BoxSize'),already?i.newTriggerBox:i.oldTriggerBox,'Trigger preflight '+p);
    checkXY(b.getValue(C.trigger,'ColliderOffset'),already?i.newColliderOffset:i.oldColliderOffset,'Offset preflight '+p);
    set(b,C.trigger,'BoxSize',vector2(...i.newTriggerBox),'vector2');set(b,C.trigger,'ColliderOffset',vector2(...i.newColliderOffset),'vector2');
    edited.add(C.trigger+'|BoxSize');edited.add(C.trigger+'|ColliderOffset');
    if(b.hasComponent('script.Furnace'))for(const name of ['IdleSpriteRUID','ActiveSpriteRUID']){
      assert([oldRUID,newRUID].includes(b.getValue('script.Furnace',name)),'Furnace resource preflight');set(b,'script.Furnace',name,newRUID,'string');edited.add('script.Furnace|'+name);
    }
    for(let axis=0;axis<2;axis++)assert(close(i.oldTriggerBox[axis]*oldScale[axis],i.newTriggerBox[axis]*newScale[axis]),'World Trigger size');
  }
  assert.deepEqual(b.validate(),[],'Model validation');checkUntouched(before,b.snapshot(),edited);
  return{path:p,b,before,after:b.snapshot(),edited};
}
function main(){
  const apply=process.argv.includes('--apply'),verify=process.argv.includes('--verify');
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT,'Environment/config'),'utf8')).CoreVersion,'26.7.0.0');
  assert.equal(Object.values(ruids).length,6);assert.equal(new Set(Object.values(ruids)).size,6);
  for(const r of Object.values(ruids))assert(/^[a-f0-9]{32}$/.test(r),'Invalid RUID');
  const item=table('RootDesk/MyDesk/item/DataSets/item_dataset.csv'),recipe=table('RootDesk/MyDesk/item/DataSets/RecipeDataSet.csv'),plans=[];
  for(const a of manifest.assets){
    const i=a.integration,old=JSON.parse(fs.readFileSync(path.join(__dirname,'../asset-manifest.json'),'utf8'))[a.key];
    const row=rowBy(item,'Name',a.itemName),recipeRow=rowBy(recipe,'RecipeName',a.itemName);
    cell(item,row,'IconRUID',i.oldIconRUID,ruids[a.images.icon.file]);cell(item,row,'PreviewRUID',i.oldSpriteRUID,ruids[a.images.sprite.file]);
    cell(item,row,'PreviewScale',old.preview_scale,i.newPreviewScale);cell(item,row,'DropScaleMultiplier',old.drop_scale_multiplier,i.newDropScaleMultiplier);
    cell(recipe,recipeRow,'Icon',i.oldIconRUID,ruids[a.images.icon.file]);
    plans.push(modelPlan(a,'sprite'),modelPlan(a,'icon'));
  }
  for(const t of [item,recipe]){
    const result=parseCSV(patchedText(t));assert.equal(result.length,t.rows.length);assert.equal(patchedText(t).startsWith('\uFEFF'),t.text.startsWith('\uFEFF'));
    for(let r=0;r<t.rows.length;r++)for(let c=0;c<t.rows[r].length;c++){
      const edit=t.edits.find(e=>e.row===t.rows[r]&&t.header[c]===e.column);assert.equal(result[r][c].value,edit?edit.newValue:t.rows[r][c].value,'CSV untouched cell');
      if(verify&&edit)assert.equal(t.rows[r][c].value,edit.newValue,'CSV not yet connected');
    }
  }
  if(verify)for(const p of plans)assert.deepEqual(p.before,p.after,'Model not yet connected');
  if(apply){
    for(const p of plans){p.b.write(path.join(ROOT,p.path));const read=ModelBuilder.read(path.join(ROOT,p.path));assert.deepEqual(read.validate(),[]);assert.deepEqual(read.snapshot(),p.after,'Model readback');}
    for(const t of [item,recipe]){const wanted=patchedText(t);fs.writeFileSync(path.join(ROOT,t.file),wanted,'utf8');assert.equal(fs.readFileSync(path.join(ROOT,t.file),'utf8'),wanted,'CSV readback');}
  }
  console.log((apply?'APPLIED':verify?'VERIFIED':'DRY RUN')+': 6 models, 15 CSV cells, no unrelated model fields/cells changed, BOM and existing line endings preserved, Trigger world size unchanged.');
}
main();
