'use strict';
// Exact horizontal pixel reflection requested by the developer; no resampling.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const src=fs.readFileSync('scripts/generate_diagonal_fringe_tiles.cjs','utf8');
const scope={require,Buffer};vm.createContext(scope);
vm.runInContext('const zlib=require("node:zlib");'+src.slice(src.indexOf('// ---- PNG Decode'),src.indexOf('function blendPixel'))+'\nthis.decode=decodePngRgba;this.encode=encodePngRgba;',scope);
const dir='tileimg/new grass';
const mapping={GrassLT:'0.png',GrassT:'1.png',GrassRT:'2.png',GrassL:'3.png',FullGrass:'4.png',GrassR:'5.png',GrassLD:'6.png',GrassD:'7.png',GrassRD:'8.png',GrassRDCorner:'9.png',GrassLDCorner:'10.png',GrassRTCorner:'11.png',SubGrassRTLD:'12.png',GrassLTCorner:'13.png',SubGrassLTRD:'SubGrassLTRD.png'};
const original=scope.decode(fs.readFileSync(path.join(dir,'12.png'))), pixels=Buffer.alloc(original.data.length);
assert.equal(original.w,64);assert.equal(original.h,64);
for(let y=0;y<64;y++)for(let x=0;x<64;x++)original.data.copy(pixels,(y*64+x)*4,(y*64+63-x)*4,(y*64+64-x)*4);
const mirrored=scope.encode(64,64,pixels);
assert(scope.decode(mirrored).data.equals(pixels));
fs.writeFileSync(path.join(dir,'SubGrassLTRD.png'),mirrored);
const wallPath='RootDesk/MyDesk/wall.tileset',wall=fs.readFileSync(wallPath),tiles=JSON.parse(wall).ContentProto.Json.datas;
const backup='scratch/grass-replacement-before-20261001';fs.mkdirSync(backup,{recursive:true});
const backupWall=path.join(backup,'wall.tileset');if(!fs.existsSync(backupWall))fs.writeFileSync(backupWall,wall);
const manifest=Object.entries(mapping).map(([name,file])=>{
 const index=tiles.findIndex(t=>t.Name===name);assert(index>=0,name);
 const bytes=fs.readFileSync(path.join(dir,file));assert.equal(bytes[24],8);assert.equal(bytes[25],6);assert.equal(bytes[28],0);
 const img=scope.decode(bytes);assert.equal(img.w,64);assert.equal(img.h,64);
 const local=path.join('tileimg',name+'.png');if(fs.existsSync(local)&&!fs.existsSync(path.join(backup,name+'.png')))fs.copyFileSync(local,path.join(backup,name+'.png'));
 return {name,index,guid:tiles[index].Id,file:path.join(dir,file).replaceAll('\\','/'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
});
assert.equal(new Set(manifest.map(r=>r.guid)).size,15);
fs.writeFileSync('tileimg/new grass/replacement-manifest.json',JSON.stringify({tileset:wallPath,tilesetSha256:crypto.createHash('sha256').update(wall).digest('hex'),mirror:{source:'12.png',output:'SubGrassLTRD.png',operation:'horizontal reflection, RGBA pixel exact'},tiles:manifest},null,2)+'\n');
console.log(JSON.stringify(manifest));
