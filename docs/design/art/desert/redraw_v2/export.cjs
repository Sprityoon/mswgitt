"use strict";
// Reproducible technical extraction/formatting; image_gen supplies the artwork.
const fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../../../..');
const specs=[
  {name:'dead_tree',label:'Dead tree',w:512,h:640,dot:3,scale:0.5,colors:48},
  {name:'yucca_flower',label:'Flowering yucca',w:384,h:448,dot:3,scale:0.5,colors:56},
  {name:'animal_bone',label:'Animal skull',w:256,h:224,dot:3,scale:0.5,colors:40}
];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function decode(file) {
  const b=fs.readFileSync(file),w=b.readUInt32BE(16),h=b.readUInt32BE(20),type=b[25],bpp=type===6?4:3;
  if(b[24]!==8||![2,6].includes(type)||b[28]!==0)throw Error('Expected RGB/RGBA 8-bit noninterlaced PNG');
  const chunks=[];for(let p=8;p<b.length;){const n=b.readUInt32BE(p);if(b.toString('ascii',p+4,p+8)==='IDAT')chunks.push(b.subarray(p+8,p+8+n));p+=n+12;}
  const raw=zlib.inflateSync(Buffer.concat(chunks)),data=Buffer.alloc(w*h*4),rows=[];
  for(let y=0;y<h;y++){const row=Buffer.alloc(w*bpp),f=raw[y*(w*bpp+1)];if(f>4)throw Error('Invalid filter');for(let i=0;i<row.length;i++){const a=i>=bpp?row[i-bpp]:0,u=y?rows[y-1][i]:0,c=y&&i>=bpp?rows[y-1][i-bpp]:0,p=a+u-c,pa=Math.abs(p-a),pb=Math.abs(p-u),pc=Math.abs(p-c),q=f===1?a:f===2?u:f===3?Math.floor((a+u)/2):f===4?(pa<=pb&&pa<=pc?a:pb<=pc?u:c):0;row[i]=(raw[y*(w*bpp+1)+1+i]+q)&255;}rows.push(row);for(let x=0;x<w;x++){const j=(y*w+x)*4;for(let k=0;k<3;k++)data[j+k]=row[x*bpp+k];data[j+3]=bpp===4?row[x*bpp+3]:255;}}
  return {w,h,data};
}
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function chunk(type,data){const l=Buffer.alloc(4),t=Buffer.from(type),c=Buffer.alloc(4);l.writeUInt32BE(data.length);let v=0xffffffff;for(const b of Buffer.concat([t,data]))v=crcTable[(v^b)&255]^(v>>>8);c.writeUInt32BE((v^0xffffffff)>>>0);return Buffer.concat([l,t,data,c]);}
function save(file,o){const h=Buffer.alloc(13);h.writeUInt32BE(o.w);h.writeUInt32BE(o.h,4);h[8]=8;h[9]=6;const raw=Buffer.alloc((o.w*4+1)*o.h);for(let y=0;y<o.h;y++)o.data.copy(raw,y*(o.w*4+1)+1,y*o.w*4,(y+1)*o.w*4);fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));}
function blank(w,h){return {w,h,data:Buffer.alloc(w*h*4)};}
function bbox(o,threshold=128){let x0=o.w,y0=o.h,x1=-1,y1=-1,count=0;for(let y=0;y<o.h;y++)for(let x=0;x<o.w;x++)if(o.data[(y*o.w+x)*4+3]>=threshold){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);count++;}if(!count)throw Error('Empty sprite');return {x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1,count};}
function resize(o,w,h){const r=blank(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=(Math.min(o.h-1,Math.floor((y+.5)*o.h/h))*o.w+Math.min(o.w-1,Math.floor((x+.5)*o.w/w)))*4;o.data.copy(r.data,(y*w+x)*4,j,j+4);}return r;}
function composite(dst,src,x0,y0){for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++){if(x+x0<0||y+y0<0||x+x0>=dst.w||y+y0>=dst.h)continue;const j=(y*src.w+x)*4,k=((y+y0)*dst.w+x+x0)*4,a=src.data[j+3]/255,da=dst.data[k+3]/255,oa=a+da*(1-a);if(!oa)continue;for(let c=0;c<3;c++)dst.data[k+c]=Math.round((src.data[j+c]*a+dst.data[k+c]*da*(1-a))/oa);dst.data[k+3]=Math.round(oa*255);}}
function extract(o){const b=bbox(o,17),r=blank(b.w+32,b.h+18);for(let y=0;y<b.h;y++)o.data.copy(r.data,((y+16)*r.w+16)*4,((b.y0+y)*o.w+b.x0)*4,((b.y0+y)*o.w+b.x1+1)*4);for(let j=0;j<r.data.length;j+=4)if(r.data[j+3]<=16)r.data.fill(0,j,j+4);return r;}
function fit(o,w,h,margin=8,bottom=2){const b=bbox(o,32),crop=blank(b.w,b.h);for(let y=0;y<b.h;y++)o.data.copy(crop.data,y*b.w*4,((b.y0+y)*o.w+b.x0)*4,((b.y0+y)*o.w+b.x1+1)*4);const s=Math.min((w-2*margin)/b.w,(h-margin-bottom)/b.h),r=resize(crop,Math.max(1,Math.floor(b.w*s)),Math.max(1,Math.floor(b.h*s))),dst=blank(w,h);composite(dst,r,Math.floor((w-r.w)/2),h-bottom-r.h);return dst;}
function centerIcon(o){const b=bbox(o),r=blank(o.w,o.h);composite(r,o,Math.round((o.w-1-b.x0-b.x1)/2),Math.round((o.h+1-b.y0-b.y1)/2));return r;}
function palette(o,n){const hist=new Map();for(let j=0;j<o.data.length;j+=4)if(o.data[j+3]>=128){const rgb=[0,1,2].map(k=>Math.min(255,(o.data[j+k]>>3)*8+4)),key=rgb.join(',');const v=hist.get(key)||{rgb,count:0};v.count++;hist.set(key,v);}let boxes=[[...hist.values()]];
  function range(box){return [0,1,2].map(c=>Math.max(...box.map(v=>v.rgb[c]))-Math.min(...box.map(v=>v.rgb[c])));}
  while(boxes.length<n){const candidates=boxes.map((box,i)=>({box,i,r:range(box),score:Math.max(...range(box))*Math.sqrt(box.reduce((s,v)=>s+v.count,0))})).filter(v=>v.box.length>1).sort((a,b)=>b.score-a.score);if(!candidates.length)break;const {box,i,r}=candidates[0],axis=r.indexOf(Math.max(...r));box.sort((a,b)=>a.rgb[axis]-b.rgb[axis]);const half=box.reduce((s,v)=>s+v.count,0)/2;let sum=0,cut=1;for(let j=0;j<box.length-1;j++){sum+=box[j].count;cut=j+1;if(sum>=half)break;}boxes.splice(i,1,box.slice(0,cut),box.slice(cut));}
  return boxes.map(box=>{const sum=box.reduce((s,v)=>s+v.count,0);return [0,1,2].map(c=>Math.round(box.reduce((s,v)=>s+v.rgb[c]*v.count,0)/sum));});
}
function pixelize(o,dot,colors){const pal=palette(o,colors),r=blank(o.w,o.h),cache=new Map();function nearest(rgb){const key=rgb.join(',');if(cache.has(key))return cache.get(key);let p=pal[0],best=Infinity;for(const v of pal){const d=v.reduce((s,c,k)=>s+(c-rgb[k])**2,0);if(d<best){best=d;p=v;}}cache.set(key,p);return p;}
  for(let y=0;y<o.h;y+=dot)for(let x=0;x<o.w;x+=dot){let count=0,alpha=0,votes=new Map();for(let yy=y;yy<Math.min(o.h,y+dot);yy++)for(let xx=x;xx<Math.min(o.w,x+dot);xx++){const j=(yy*o.w+xx)*4;alpha+=o.data[j+3];count++;if(o.data[j+3]>=128){const p=nearest([...o.data.subarray(j,j+3)]),key=p.join(',');votes.set(key,(votes.get(key)||0)+1);}}if(alpha/count<128||!votes.size)continue;const rgb=[...votes].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number);for(let yy=y;yy<Math.min(o.h,y+dot);yy++)for(let xx=x;xx<Math.min(o.w,x+dot);xx++){const j=(yy*o.w+xx)*4;Buffer.from([...rgb,255]).copy(r.data,j);}}
  // Smooth isolated interior shade cells only; silhouettes and narrow twigs remain.
  if(dot>1){const old=Buffer.from(r.data);for(let y=dot;y<r.h-dot;y+=dot)for(let x=dot;x<r.w-dot;x+=dot){const i=(y*r.w+x)*4,own=old.subarray(i,i+3).toString('hex'),votes=new Map();let solid=old[i+3]===255;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy){const j=((y+dy*dot)*r.w+x+dx*dot)*4;if(old[j+3]!==255)solid=false;const k=old.subarray(j,j+3).toString('hex');votes.set(k,(votes.get(k)||0)+1);}if(!solid||votes.has(own))continue;const best=[...votes].sort((a,b)=>b[1]-a[1])[0];if(best[1]<4)continue;const rgb=Buffer.from(best[0],'hex');for(let yy=y;yy<Math.min(r.h,y+dot);yy++)for(let xx=x;xx<Math.min(r.w,x+dot);xx++)rgb.copy(r.data,(yy*r.w+xx)*4);}}
  // Translate only: retain the selected pixel clusters and bottom-center pivot.
  const b=bbox(r),dx=Math.round((r.w-1-b.x0-b.x1)/2),dy=r.h-3-b.y1,out=blank(r.w,r.h);composite(out,r,dx,dy);return out;
}
function background(w,h,kind){const o=blank(w,h),tile=kind==='checker'?null:decode(path.join(ROOT,kind==='grass'?'tileimg/new grass/4.png':kind==='soil'?'tileimg/FullSoil.png':'docs/design/art/biome_ground_v2/tiles/Snow.png'));for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=(y*w+x)*4;if(tile){const k=(Math.floor(y/1.5625)%tile.h*tile.w+Math.floor(x/1.5625)%tile.w)*4;tile.data.copy(o.data,j,k,k+4);}else{const c=((x>>4)+(y>>4))%2?56:43;Buffer.from([c,c+3,c+6,255]).copy(o.data,j);}}return o;}
function verify(manifest){for(const t of manifest.assets){for(const [kind,file] of Object.entries(t.files)){const o=decode(path.join(__dirname,file)),b=bbox(o);if(hash(fs.readFileSync(path.join(__dirname,file)))!==t.hashes[kind])throw Error('Hash mismatch');if(kind==='sprite'){if(o.w!==t.canvas[0]||o.h!==t.canvas[1])throw Error('Wrong dimensions');if(Math.abs((b.x0+b.x1+1)/2-o.w/2)>2||o.h-1-b.y1>2||b.x0<2||b.y0<2||o.w-1-b.x1<2)throw Error('Composition mismatch '+t.name);for(let j=3;j<o.data.length;j+=4)if(![0,255].includes(o.data[j]))throw Error('Nonbinary game alpha');}for(const j of [3,(o.w-1)*4+3,((o.h-1)*o.w)*4+3,o.data.length-1])if(o.data[j]!==0)throw Error('Opaque corner');}}
  console.log('PASS: 3 assets, master/sprite/icon hashes, transparent corners, sprite dimensions, binary game alpha, bottom-center baseline and clear top/side margins.');
}
function main(){if(process.argv[2]==='verify'){verify(JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8')));return;}
  for(const dir of ['masters','sprites','icons'])fs.mkdirSync(path.join(__dirname,dir),{recursive:true});
  const manifest={version:2,source:'source.jpg',sourceSha256:hash(fs.readFileSync(path.join(__dirname,'source.jpg'))),generation:'image_gen referenced redraw, one call per asset',assets:[]},showcase=background(1400,800,'checker'),game=blank(1400,960);
  const outputs=[];
  for(const s of specs){const src=decode(path.join(__dirname,'generated',s.name+'.png')),master=extract(src),sprite=pixelize(fit(master,s.w,s.h),s.dot,s.colors),icon=centerIcon(pixelize(fit(master,128,128,8,8),1,48));const files={master:'masters/'+s.name+'.png',sprite:'sprites/'+s.name+'.png',icon:'icons/'+s.name+'.png'},imgs={master,sprite,icon},hashes={};for(const [kind,file] of Object.entries(files)){save(path.join(__dirname,file),imgs[kind]);hashes[kind]=hash(fs.readFileSync(path.join(__dirname,file)));}const b=bbox(sprite);manifest.assets.push({name:s.name,files,hashes,generatedCanvas:[src.w,src.h],masterCanvas:[master.w,master.h],canvas:[s.w,s.h],dot:s.dot,recommendedScale:s.scale,worldWidthPx:b.w*s.scale,worldHeightPx:b.h*s.scale,pivot:[s.w/2,0],bbox:[b.x0,b.y0,b.x1,b.y1]});outputs.push(sprite);}
  outputs.forEach((o,i)=>{const cap=resize(o,Math.round(o.w*0.9),Math.round(o.h*0.9));composite(showcase,cap,[10,520,1020][i],720-cap.h);composite(showcase,decode(path.join(__dirname,'icons',specs[i].name+'.png')),[160,650,1100][i],32);});save(path.join(__dirname,'preview.png'),showcase);
  for(const [row,kind] of ['grass','soil','snow'].entries()){const panel=background(1400,320,kind);outputs.forEach((o,i)=>{const cap=resize(o,Math.round(o.w*.5),Math.round(o.h*.5));composite(panel,cap,[80,470,770][i],310-cap.h);});const neighbor=decode(path.join(ROOT,'docs/design/art/furnace/furnace_idle.png'));composite(panel,resize(neighbor,192,204),1100,104);composite(game,panel,0,row*320);}save(path.join(__dirname,'preview_game.png'),game);
  // Transparent master collection, not a substitute for the three independent PNGs.
  const sheet=blank(1536,640);specs.forEach((s,i)=>{const m=decode(path.join(__dirname,'masters',s.name+'.png')),b=bbox(m),height=i===0?590:i===1?520:360,scale=Math.min(470/b.w,height/b.h),r=resize(m,Math.round(m.w*scale),Math.round(m.h*scale));composite(sheet,r,i*512+Math.floor((512-r.w)/2),616-r.h);});save(path.join(__dirname,'redrawn_collection.png'),sheet);
  fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');verify(manifest);console.log(JSON.stringify(manifest.assets.map(t=>({name:t.name,master:t.masterCanvas,sprite:t.canvas,bbox:t.bbox})),null,2));
}
if(require.main===module)main();
module.exports={decode,bbox,background,save};
