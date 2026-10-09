"use strict";
// Technical export of AI surface art: fixed 64px grid, deliberate ramps,
// periodic borders, editable PXG, and unchanged project fringe alpha masks.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '../../../..');
const codecSource = fs.readFileSync(path.join(ROOT, 'scripts/generate_biome_tiles.cjs'), 'utf8');
const encoderSource = codecSource.slice(codecSource.indexOf('// ---- PNG Encode'), codecSource.indexOf('const TILES_12'));
const ctx = { Buffer, zlib };
vm.createContext(ctx);
vm.runInContext(encoderSource + '\nthis.encode = encodePngRgba;', ctx);
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const suffixes = ['LT','T','RT','L','R','LD','D','RD','LTCorner','RTCorner','LDCorner','RDCorner'];
const palettes = {
  Rock: ['625c55','746d62','867e71','9a9181','afa694','c2b7a3','6b7475','7a8587','89969a','9ba9ab','abb7b7','bbc5c2','cbd2cb','dbe0d5'],
  Snow: ['a5c3dc','b6d0e5','c5e0ef','d4e9f2','e4f0f4','eef5f5','f7f8f1','fffbee']
};
function decode(file) {
  const b = fs.readFileSync(file);
  if (!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw Error('Not PNG: '+file);
  const w=b.readUInt32BE(16), h=b.readUInt32BE(20), depth=b[24], type=b[25];
  if (depth!==8 || ![2,6].includes(type) || b[28]!==0) throw Error('Expected RGB/RGBA 8-bit noninterlaced PNG: '+file);
  const bpp=type===6?4:3, chunks=[];
  for(let p=8;p<b.length;) { const n=b.readUInt32BE(p); if(b.toString('ascii',p+4,p+8)==='IDAT') chunks.push(b.subarray(p+8,p+8+n)); p+=12+n; }
  const raw=zlib.inflateSync(Buffer.concat(chunks)), rows=[], data=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++) {
    const row=Buffer.alloc(w*bpp), f=raw[y*(w*bpp+1)];
    if(f>4) throw Error('Unsupported PNG filter');
    for(let i=0;i<row.length;i++) {
      const a=i>=bpp?row[i-bpp]:0, u=y?rows[y-1][i]:0, c=y&&i>=bpp?rows[y-1][i-bpp]:0;
      const p=a+u-c, pa=Math.abs(p-a), pb=Math.abs(p-u), pc=Math.abs(p-c);
      const predictor=f===1?a:f===2?u:f===3?Math.floor((a+u)/2):f===4?(pa<=pb&&pa<=pc?a:pb<=pc?u:c):0;
      row[i]=(raw[y*(w*bpp+1)+1+i]+predictor)&255;
    }
    rows.push(row);
    for(let x=0;x<w;x++) { const j=(y*w+x)*4; for(let k=0;k<3;k++) data[j+k]=row[x*bpp+k]; data[j+3]=bpp===4?row[x*bpp+3]:255; }
  }
  return {w,h,data};
}
function save(file,img) { fs.writeFileSync(file,ctx.encode(img.w,img.h,img.data)); }
function blank(w,h) { return {w,h,data:Buffer.alloc(w*h*4)}; }
function paste(dst,src,x0,y0) { for(let y=0;y<src.h;y++) src.data.copy(dst.data,((y+y0)*dst.w+x0)*4,y*src.w*4,(y+1)*src.w*4); }
function scale(src,n) { const o=blank(src.w*n,src.h*n); for(let y=0;y<o.h;y++) for(let x=0;x<o.w;x++) src.data.copy(o.data,(y*o.w+x)*4,(Math.floor(y/n)*src.w+Math.floor(x/n))*4,(Math.floor(y/n)*src.w+Math.floor(x/n))*4+4); return o; }
function repeat(img,n) { const o=blank(img.w*n,img.h*n); for(let y=0;y<n;y++) for(let x=0;x<n;x++) paste(o,img,x*img.w,y*img.h); return o; }
function rgba(hex) { return [...hex.match(/../g).map(x=>parseInt(x,16)),255]; }
function writePxg(name,keys) { const pal=palettes[name], chars='abcdefghijklmn'; fs.writeFileSync(path.join(__dirname,name+'.pxg'),['PXG 1','size 64 64','// AI first pass; fixed palette and periodic cluster cleanup',...pal.map((c,i)=>chars[i]+' #'+c),'grid',...Array.from({length:64},(_,y)=>keys.slice(y*64,y*64+64).map(k=>chars[k]).join('')),''].join('\n')); }
function readPxg(name) { const lines=fs.readFileSync(path.join(__dirname,name+'.pxg'),'utf8').split(/\r?\n/), p=new Map(); let start=lines.indexOf('grid'); if(lines[0]!=='PXG 1'||lines[1]!=='size 64 64'||start<0) throw Error('Invalid PXG'); for(const l of lines.slice(2,start)) if(!l.startsWith('//')) { const [k,c]=l.split(/\s+/); if(k&&c) p.set(k,rgba(c.slice(1))); } const rows=lines.slice(start+1,start+65); if(rows.length!==64||rows.some(r=>r.length!==64)) throw Error('Invalid PXG dimensions'); const o=blank(64,64); rows.join('').split('').forEach((k,i)=>{ if(!p.has(k)) throw Error('Invalid palette key'); Buffer.from(p.get(k)).copy(o.data,i*4); }); return o; }
function draft(name) {
  const src=decode(path.join(__dirname,name.toLowerCase()+'_generated.png')), pal=palettes[name].map(rgba), colors=[];
  // Dominant palette per cell keeps broad stepped contours crisp.
  for(let y=0;y<64;y++) for(let x=0;x<64;x++) {
    const votes=new Array(pal.length).fill(0);
    for(let yy=Math.floor(y*src.h/64);yy<Math.floor((y+1)*src.h/64);yy++) for(let xx=Math.floor(x*src.w/64);xx<Math.floor((x+1)*src.w/64);xx++) {
      const j=(yy*src.w+xx)*4; let best=0,score=Infinity;
      pal.forEach((p,k)=>{ const d=p.slice(0,3).reduce((a,v,c)=>a+(v-src.data[j+c])**2,0); if(d<score) {score=d;best=k;} }); votes[best]++;
    }
    colors.push(votes.indexOf(Math.max(...votes)));
  }
  // Match opposite edges, using existing ramp colors rather than blurry resampling.
  function nearest(a,b) { const c=pal[a].map((v,k)=>(v+pal[b][k])/2); let best=0,score=Infinity; pal.forEach((p,k)=>{const d=p.slice(0,3).reduce((s,v,j)=>s+(v-c[j])**2,0);if(d<score){score=d;best=k;}});return best; }
  for(let d=2;d>=0;d--) {
    for(let y=0;y<64;y++) {const a=y*64+d,b=y*64+63-d; const k=nearest(colors[a],colors[b]);colors[a]=k;colors[b]=k;}
    for(let x=0;x<64;x++) {const a=d*64+x,b=(63-d)*64+x; const k=nearest(colors[a],colors[b]);colors[a]=k;colors[b]=k;}
  }
  const wrap=(x,y)=>((y+64)%64)*64+(x+64)%64;
  // Remove isolated one-pixel grain; preserve broad material regions.
  for(let pass=0;pass<3;pass++) { const old=colors.slice(); for(let y=0;y<64;y++) for(let x=0;x<64;x++) {const i=y*64+x, counts=new Map();for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(dx||dy){const k=old[wrap(x+dx,y+dy)];counts.set(k,(counts.get(k)||0)+1);}const sorted=[...counts].sort((a,b)=>b[1]-a[1]);if((counts.get(old[i])||0)<2 && sorted[0][1]>=4) colors[i]=sorted[0][0];} }
  // Final paired outer contour after cleanup.
  for(let y=0;y<64;y++) colors[y*64+63]=colors[y*64];
  for(let x=0;x<64;x++) colors[63*64+x]=colors[x];
  writePxg(name,colors);
}
function exportAssets() {
  const tsFile=path.join(ROOT,'RootDesk/MyDesk/wall.tileset'), tsBytes=fs.readFileSync(tsFile), ts=JSON.parse(tsBytes).ContentProto.Json;
  const manifest={version:1,tileset:'RootDesk/MyDesk/wall.tileset',sourceTilesetSha256:hash(tsBytes),fringeOrder:suffixes,tiles:[]};
  fs.mkdirSync(path.join(__dirname,'tiles'),{recursive:true});
  const overview=blank(1024,768);
  for(const [row,name] of ['Rock','Snow'].entries()) {
    const base=readPxg(name), all=[base], old=decode(path.join(ROOT,'tileimg',name.toLowerCase()+'.png'));
    for(const suffix of suffixes) {const m=decode(path.join(ROOT,'tileimg','Soil'+suffix+'.png')),o=blank(64,64);if(m.w!==64||m.h!==64)throw Error('Invalid mask size');base.data.copy(o.data);for(let i=0;i<4096;i++)o.data[i*4+3]=m.data[i*4+3];all.push(o);}
    const strip=blank(768,64), atlas=blank(832,64);
    all.forEach((o,i)=>{const tileName=name+(i?suffixes[i-1]:''),file='tiles/'+tileName+'.png';save(path.join(__dirname,file),o);paste(atlas,o,i*64,0);if(i)paste(strip,o,(i-1)*64,0);const index=ts.datas.findIndex(t=>t.Name===tileName);if(index<0||ts.datas[index].IsCollidable!==false)throw Error('Tileset mismatch: '+tileName);manifest.tiles.push({name:tileName,index,oldRuid:ts.datas[index].Id,file,sha256:hash(fs.readFileSync(path.join(__dirname,file))),alphaSha256:hash(Buffer.from(Array.from({length:4096},(_,j)=>o.data[j*4+3])))});});
    save(path.join(__dirname,name+'_fringe_12.png'),strip);save(path.join(__dirname,name+'_atlas_13.png'),atlas);
    save(path.join(__dirname,name+'_repeat_2x2.png'),repeat(base,2));save(path.join(__dirname,name+'_repeat_4x4.png'),scale(repeat(base,4),2));
    paste(overview,scale(repeat(old,2),3),0,row*384);paste(overview,scale(repeat(base,2),3),384,row*384);
    const grass=decode(path.join(ROOT,'tileimg/new grass/4.png')), soil=decode(path.join(ROOT,'tileimg/FullSoil.png'));
    const patch=blank(256,256);for(let y=0;y<256;y++)for(let x=0;x<256;x++) {const bg=x<128?grass:soil;bg.data.copy(patch.data,(y*256+x)*4,((y%64)*64+x%64)*4,((y%64)*64+x%64)*4+4);}
    // Island with the four existing convex fringe tiles.
    for(const [suffix,x,y] of [['LT',64,64],['RT',128,64],['LD',64,128],['RD',128,128]]) {const o=all[suffixes.indexOf(suffix)+1];for(let yy=0;yy<64;yy++)for(let xx=0;xx<64;xx++) {const j=(yy*64+xx)*4,k=((y+yy)*256+x+xx)*4,a=o.data[j+3]/255;for(let c=0;c<3;c++)patch.data[k+c]=Math.round(o.data[j+c]*a+patch.data[k+c]*(1-a));patch.data[k+3]=255;}}
    save(path.join(__dirname,name+'_fringe_preview.png'),scale(patch,3));paste(overview,scale(base,4),768,row*384+64);
  }
  save(path.join(__dirname,'comparison.png'),overview);
  fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log('Exported 26 64x64 RGBA tiles; existing mask alpha and palette order retained.');
}
function verify() {
  const m=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'))),ts=JSON.parse(fs.readFileSync(path.join(ROOT,m.tileset))).ContentProto.Json;
  for(const t of m.tiles) {const b=fs.readFileSync(path.join(__dirname,t.file)),o=decode(path.join(__dirname,t.file));if(o.w!==64||o.h!==64||hash(b)!==t.sha256)throw Error('Asset mismatch '+t.name);if(ts.datas[t.index].Name!==t.name||ts.datas[t.index].IsCollidable!==false)throw Error('Palette mismatch');const name=t.name.startsWith('Rock')?'Rock':'Snow',suffix=t.name.slice(name.length);const mask=suffix?decode(path.join(ROOT,'tileimg/Soil'+suffix+'.png')):null;for(let i=0;i<4096;i++)if(o.data[i*4+3]!== (mask?mask.data[i*4+3]:255))throw Error('Alpha mismatch '+t.name);}
  for(const name of ['Rock','Snow']) {const o=readPxg(name);for(let i=0;i<64;i++)for(let c=0;c<4;c++)if(o.data[(i*64)*4+c]!==o.data[(i*64+63)*4+c]||o.data[i*4+c]!==o.data[(63*64+i)*4+c])throw Error('Seam mismatch '+name);}
  console.log('PASS: 26 assets, 64px dimensions, hashes, 24 exact fringe alpha masks, opaque bases, periodic border pixels, tileset indexes/names/collision flags.');
}
const command=process.argv[2];
if(command==='draft') {if(!process.argv.includes('--reset')&&['Rock','Snow'].some(n=>fs.existsSync(path.join(__dirname,n+'.pxg'))))throw Error('PXG artwork exists; use export to preserve edits, or draft --reset to discard edits');for(const name of ['Rock','Snow'])draft(name);exportAssets();verify();}
else if(command==='export') {exportAssets();verify();}
else if(command==='verify')verify();
else throw Error('Usage: node docs/design/art/biome_ground_v2/export.cjs draft|export|verify');
