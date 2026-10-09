"use strict";
// tiles/ PNG 를 msw-mcp(asset_create_account_resource_storage_item)로 계정 Sprite 에 업로드하고
// registered-ruids.json 을 만든다. 이미 값이 있는 이름은 건너뛴다(재실행 안전).
// 토큰은 .mcp.json 에서 읽기만 하고 출력하지 않는다.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8'));
const server = (cfg.mcpServers || cfg.servers)['msw-mcp'];
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const outPath = path.join(__dirname, 'registered-ruids.ugc.json');
const out = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};
for (const [k, v] of Object.entries(JSON.parse(process.argv[2] || '{}'))) out[k] = v;

let sessionId = null;
let rpcId = 1;
async function rpc(method, params, notify = false) {
  const headers = { ...server.headers, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const body = { jsonrpc: '2.0', method, params };
  if (!notify) body.id = rpcId++;
  const res = await fetch(server.url, { method: 'POST', headers, body: JSON.stringify(body) });
  const sid = res.headers.get('mcp-session-id');
  if (sid) sessionId = sid;
  if (notify) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} HTTP ${res.status}: ${text.slice(0, 300)}`);
  const json = text.trim().startsWith('{') ? JSON.parse(text)
    : JSON.parse(text.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5)).pop());
  if (json.error) throw new Error(`${method}: ${JSON.stringify(json.error)}`);
  return json.result;
}
async function tool(name, args) {
  const r = await rpc('tools/call', { name, arguments: args });
  const txt = (r.content || []).map(c => c.text || '').join('');
  if (r.isError) throw new Error(`${name}: ${txt.slice(0, 300)}`);
  return JSON.parse(txt);
}

(async () => {
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'upload-tiles', version: '1' } });
  await rpc('notifications/initialized', {}, true);
  for (const t of manifest.tiles) {
    if (out[t.name]) { console.log(`skip ${t.name} ${out[t.name]}`); continue; }
    const file = path.join(__dirname, t.file);
    const buf = fs.readFileSync(file);
    const base = { category: 'sprite', subcategory: 'background', name: t.name,
      description: `biome_ground_v2 ${t.name} ground tile 64x64`, contentLength: buf.length };
    const step1 = await tool('asset_create_account_resource_storage_item', base);
    const put = await fetch(step1.presignedUrl, { method: 'PUT', body: buf, headers: { 'Content-Length': String(buf.length) } });
    if (!put.ok) throw new Error(`PUT ${t.name} HTTP ${put.status}`);
    const step2 = await tool('asset_create_account_resource_storage_item', { ...base, fileUrl: step1.presignedUrl });
    const ruid = step2.result.ugcInfo.ruid;
    if (!/^[0-9a-f]{32}$/.test(ruid)) throw new Error(`bad ruid for ${t.name}`);
    out[t.name] = ruid;
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
    console.log(`uploaded ${t.name} ${ruid}`);
  }
  console.log(`done ${Object.keys(out).length}/26`);
  if (process.argv.includes('--props')) {
    // 도트 타일: 확대 시 번짐·이음매 방지
    for (const t of manifest.tiles) {
      await tool('asset_update_resource_storage_info', { guid: out[t.name],
        properties: [{ key: 'filter_mode', value: 'Point' }, { key: 'wrap_mode', value: 'Clamp' }] });
      console.log(`props ${t.name}`);
    }
  }
})().catch(e => { console.error(e.message); process.exit(1); });
