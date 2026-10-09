"use strict";
// Technical downsampling only. Original artwork and connected engine assets stay intact.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const {decode, bbox, save, background} = require('../../desert/redraw_v2/export.cjs');
const ROOT = path.resolve(__dirname, '../../../../..');
const {ModelBuilder} = require(path.join(ROOT, '.agents/skills/msw-general/scripts/model/msw_model_builder.cjs'));
const sourceDir = path.dirname(__dirname);
const sourceManifest = JSON.parse(fs.readFileSync(path.join(sourceDir, 'asset-manifest.json'), 'utf8'));
const specs = [
  {key:'cooking_pot',model:'CookingPot',itemName:'Cooking Pot'},
  {key:'bed',model:'Bed',itemName:'Bed'},
  {key:'animal_pen',model:'AnimalPen',itemName:'Animal Pen'}
];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const blank = (w,h) => ({w,h,data:Buffer.alloc(w*h*4)});
// Exact uniform canvas transform about the center pivot. Area-average premultiplied
// alpha prevents halos; no silhouette crop, stretch, pixel palette or recoloring.
function fitCentered(src, size) {
  const k = size/Math.max(src.w,src.h), out = blank(size,size), pixelArea = 1/(k*k);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const x0=(x-size/2)/k+src.w/2, x1=x0+1/k;
    const y0=(y-size/2)/k+src.h/2, y1=y0+1/k;
    let a=0,r=0,g=0,b=0;
    for(let sy=Math.max(0,Math.floor(y0));sy<Math.min(src.h,Math.ceil(y1));sy++) {
      const wy=Math.max(0,Math.min(y1,sy+1)-Math.max(y0,sy));
      for(let sx=Math.max(0,Math.floor(x0));sx<Math.min(src.w,Math.ceil(x1));sx++) {
        const weight=wy*Math.max(0,Math.min(x1,sx+1)-Math.max(x0,sx));
        const j=(sy*src.w+sx)*4, wa=weight*src.data[j+3];
        a+=wa; r+=wa*src.data[j]; g+=wa*src.data[j+1]; b+=wa*src.data[j+2];
      }
    }
    const j=(y*size+x)*4, alpha=Math.round(a/pixelArea);
    if(alpha) {out.data[j]=Math.round(r/a);out.data[j+1]=Math.round(g/a);out.data[j+2]=Math.round(b/a);out.data[j+3]=alpha;}
  }
  return {img:out,k};
}
function composite(dst,src,x0,y0) {
  x0=Math.round(x0);y0=Math.round(y0);
  for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++) {
    if(x+x0<0||y+y0<0||x+x0>=dst.w||y+y0>=dst.h)continue;
    const j=(y*src.w+x)*4,t=((y+y0)*dst.w+x+x0)*4,a=src.data[j+3]/255;
    for(let c=0;c<3;c++)dst.data[t+c]=Math.round(src.data[j+c]*a+dst.data[t+c]*(1-a));
    dst.data[t+3]=255;
  }
}
function resizePreview(src,k) {
  const w=Math.round(src.w*k),h=Math.round(src.h*k),out=blank(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
    const sx=Math.min(src.w-1,Math.floor((x+.5)*src.w/w)),sy=Math.min(src.h-1,Math.floor((y+.5)*src.h/h));
    src.data.copy(out.data,(y*w+x)*4,(sy*src.w+sx)*4,(sy*src.w+sx)*4+4);
  }
  return out;
}
function centered(dst,img,cx,cy){composite(dst,img,cx-img.w/2,cy-img.h/2);}
const axes = v => [v.x,v.y];
function edgeWorld(img,scale) {
  const b=bbox(img);return [(b.x0-img.w/2)*scale,(b.y0-img.h/2)*scale,(b.x1+1-img.w/2)*scale,(b.y1+1-img.h/2)*scale];
}
function verify(manifest) {
  for(const asset of manifest.assets) for(const kind of ['icon','sprite']) {
    const m=asset.images[kind],old=decode(path.join(sourceDir,m.file)),img=decode(path.join(__dirname,m.file));
    if(hash(path.join(sourceDir,m.file))!==m.sourceSha256||hash(path.join(__dirname,m.file))!==m.sha256)throw Error('Hash mismatch '+m.file);
    const size=kind==='icon'?128:256;
    if(img.w!==size||img.h!==size)throw Error('Wrong output dimensions');
    for(const i of [3,(img.w-1)*4+3,((img.h-1)*img.w)*4+3,img.data.length-1])if(img.data[i]!==0)throw Error('Corner is not transparent');
    const oldScale=kind==='icon'?asset.integration.oldDropModelScale[0]:asset.integration.oldModelScale[0];
    const newScale=kind==='icon'?asset.integration.newDropModelScale[0]:asset.integration.newModelScale[0];
    const oldEdges=edgeWorld(old,oldScale),newEdges=edgeWorld(img,newScale);
    m.maxWorldEdgeDifferencePx=Math.max(...oldEdges.map((v,i)=>Math.abs(v-newEdges[i])));
    if(m.maxWorldEdgeDifferencePx>2)throw Error('World footprint drift '+m.file);
  }
  for(const {integration:i} of manifest.assets) for(let axis=0;axis<2;axis++) {
    if(Math.abs(i.oldTriggerBox[axis]*i.oldModelScale[axis]-i.newTriggerBox[axis]*i.newModelScale[axis])>1e-10)throw Error('Trigger world size drift');
    if(Math.abs(i.oldColliderOffset[axis]*i.oldModelScale[axis]-i.newColliderOffset[axis]*i.newModelScale[axis])>1e-10)throw Error('Trigger offset drift');
  }
  console.log('PASS: 6 PNG dimensions, source/output hashes, transparent corners, center transform, world silhouette edges <=2px, exact Trigger world size/offset preservation.');
}
function main() {
  if(process.argv[2]==='verify') {verify(JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8')));return;}
  const manifestPath=path.join(__dirname,'manifest.json');
  if(fs.existsSync(manifestPath)&&JSON.parse(fs.readFileSync(manifestPath,'utf8')).registration.startsWith('connected'))throw Error('Assets already connected; use verify. Re-export requires reviewing the source/model scale baseline first.');
  const manifest={version:1,method:'premultiplied-alpha area average, uniform fit of original canvas, center pivot preserved',registration:'pending Maker import; existing RUIDs/models unchanged',pivot:[0.5,0.5],assets:[],totals:{beforeBytes:0,afterBytes:0,beforeRGBA8Bytes:0,afterRGBA8Bytes:0}};
  const preview=background(1120,960,'checker'),game=background(1120,960,'grass');
  for(const [index,spec] of specs.entries()) {
    const prior=sourceManifest[spec.key],furniturePath='RootDesk/MyDesk/Furniture/Models/Furniture_'+spec.model+'.model',dropPath='RootDesk/MyDesk/item/Models/Item_'+spec.model+'.model';
    const model=ModelBuilder.read(path.join(ROOT,furniturePath)),drop=ModelBuilder.read(path.join(ROOT,dropPath));
    const scale=axes(model.getValue('MOD.Core.TransformComponent','Scale')),dropScale=axes(drop.getValue('MOD.Core.TransformComponent','Scale'));
    const box=axes(model.getValue('MOD.Core.TriggerComponent','BoxSize')),offset=axes(model.getValue('MOD.Core.TriggerComponent','ColliderOffset'));
    const item={key:spec.key,itemName:spec.itemName,images:{},integration:{furniturePath,dropPath,oldIconRUID:prior.icon_ruid,oldSpriteRUID:prior.sprite_ruid,oldModelScale:scale,oldDropModelScale:dropScale,oldTriggerBox:box,oldColliderOffset:offset,occupiedAreaUnchanged:true}};
    for(const kind of ['sprite','icon']) {
      const file=spec.key+'_'+kind+'.png',src=decode(path.join(sourceDir,file)),size=kind==='icon'?128:256,{img,k}=fitCentered(src,size);
      save(path.join(__dirname,file),img);
      const beforeBytes=fs.statSync(path.join(sourceDir,file)).size,afterBytes=fs.statSync(path.join(__dirname,file)).size;
      item.images[kind]={file,sourceCanvas:[src.w,src.h],canvas:[size,size],resizeFactor:k,sourceSha256:hash(path.join(sourceDir,file)),sha256:hash(path.join(__dirname,file)),beforeBytes,afterBytes,beforeRGBA8Bytes:src.w*src.h*4,afterRGBA8Bytes:size*size*4,opaqueBounds:bbox(img)};
      for(const n of ['beforeBytes','afterBytes','beforeRGBA8Bytes','afterRGBA8Bytes'])manifest.totals[n]+=item.images[kind][n];
      if(kind==='sprite') {
        item.integration.newModelScale=scale.map(v=>v/k);item.integration.newTriggerBox=box.map(v=>v*k);item.integration.newColliderOffset=offset.map(v=>v*k);item.integration.newPreviewScale=prior.preview_scale/k;
        const oldDisplay=resizePreview(src,scale[0]),newDisplay=resizePreview(img,scale[0]/k);
        for(const panel of [preview,game]) {centered(panel,oldDisplay,170,index*320+160);centered(panel,newDisplay,450,index*320+160);}
      } else {
        item.integration.newDropModelScale=dropScale.map(v=>v/k);item.integration.newDropScaleMultiplier=prior.drop_scale_multiplier/k;
        for(const panel of [preview,game]){centered(panel,resizePreview(src,48/src.w),710,index*320+100);centered(panel,resizePreview(img,48/img.w),850,index*320+100);centered(panel,img,990,index*320+190);}
      }
    }
    manifest.assets.push(item);
  }
  verify(manifest);
  for(const [file,img] of [['preview.png',preview],['preview_game.png',game]])save(path.join(__dirname,file),img);
  fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(manifest.totals,null,2));
  console.log(JSON.stringify(manifest.assets.map(a=>({key:a.key,scale:a.integration.newModelScale,drop:a.integration.newDropModelScale,previewScale:a.integration.newPreviewScale,dropMultiplier:a.integration.newDropScaleMultiplier})),null,2));
}
if(require.main===module)main();
module.exports={fitCentered};
