// ui8 스킨 조립 키트 (2026-10-17) — 조각 PNG(ui8p_*)를 UI 엔티티 아래 "Skin" 자식으로 앵커 조립한다.
// Maker 가져오기 스프라이트는 9-slice 경계를 줄 수 없어서(UI8_README.md) 조각 + 앵커로 늘린다.
//  skin9(b, path, asset, opt) : 9조각(모서리 고정·가장자리 한 축·가운데 양축 stretch)
//  skin3(b, path, asset, opt) : 3조각(양 끝은 엔티티 높이에 맞춰 비율 축소, 가운데 가로 stretch)
//  simple(b, path, asset)     : 늘리지 않는 단일 이미지(슬롯·아이콘·HUD 버튼·토글)
// 공통: 본체 스프라이트는 투명(alpha 0, 레이캐스트 유지)으로 두고 Skin 을 형제 중 맨 아래(먼저 그림)로 둔다.
// 호버 색·상태 전환(선택/비활성)은 런타임 UI8Skin(@Logic)이 Skin 조각에 칠한다.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const PACK = path.join(root, "docs", "design", "ui", "msw_custom_ui_assets_pack");
// 등록된 ui8*.sprite 를 매번 다시 훑어 RUID 표를 만든다(추가 등록분 자동 반영) → ui8_ruids.json 갱신
function scanRuids() {
  const out = {};
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (/^ui8[ps]?_.*\.sprite$/.test(f.name)) {
        const j = JSON.parse(fs.readFileSync(p, "utf8")).ContentProto.Json;
        out[j.name] = j.resource_guid;
      }
    }
  };
  walk(path.join(root, "RootDesk"));
  fs.writeFileSync(path.join(PACK, "ui8_ruids.json"), JSON.stringify(out, null, 1));
  return out;
}
const RUID = scanRuids();
const META = JSON.parse(fs.readFileSync(path.join(PACK, "ui8_pieces.json"), "utf8"));
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const UIT = "MOD.Core.UITransformComponent";
const NINE = ["tl", "t", "tr", "l", "c", "r", "bl", "b", "br"];
const THREE = ["l", "c", "r"];

function ruid(name) {
  const r = RUID[name];
  if (!r) throw new Error("ui8 RUID 없음: " + name);
  return r;
}
const pieceRuid = (asset, k) => ruid(asset.replace(/^ui8_/, "ui8p_") + "_" + k);

// 빌더 생성자는 그룹 기준 상대 경로를 받는다
const rel = (full) => full.replace(/^\/ui\/[^/]+\//, "");

function rectOf(b, p) {
  const t = b.getComponent(p, UIT);
  if (!t) throw new Error("UITransform 없음: " + p);
  return [Number(t.RectSize.x), Number(t.RectSize.y)];
}

// 직속 자식(이름 → 엔티티) 목록을 displayOrder 순으로
function childrenOf(b, p) {
  const full = b.find(p).path;
  return b.listEntities()
    .filter((e) => e.path.startsWith(full + "/") && e.path.slice(full.length + 1).indexOf("/") < 0)
    .map((e) => ({ path: e.path, order: Number(b.find(e.path).jsonString.displayOrder || 0) }))
    .sort((a, c) => a.order - c.order);
}

// Skin 을 맨 아래로: 나머지 형제는 기존 순서를 지키며 1부터 다시 번호
function sendToBack(b, p, name) {
  const target = b.find(p).path + "/" + name;  // 절대 경로(조회·patch 용)
  const kids = childrenOf(b, p).filter((k) => k.path !== target);
  b.patch(target, { display_order: 0 });
  kids.forEach((k, i) => b.patch(k.path, { display_order: i + 1 }));
}

function piece(b, p, ruidStr, anchor, rect, offMin, offMax) {
  b.sprite(p, { anchor, pos: [0, 0], rect_size: rect, image_ruid: ruidStr, color: "#FFFFFF", sprite_type: 0, raycast: false });
  if (offMin) {
    const t = b.getComponent(p, UIT);
    const parent = p.slice(0, p.lastIndexOf("/"));
    const [w, h] = rectOf(b, parent);
    // Offset만 늘리면 명시 RectSize에는 겹침이 빠진다(pitfalls #10).
    b.patchComponent(p, UIT, {
      OffsetMin: { x: offMin[0], y: offMin[1] }, OffsetMax: { x: offMax[0], y: offMax[1] },
      RectSize: { x: w * (t.AnchorsMax.x - t.AnchorsMin.x) + offMax[0] - offMin[0], y: h * (t.AnchorsMax.y - t.AnchorsMin.y) + offMax[1] - offMin[1] },
      anchoredPosition: { x: offMin[0] * (1 - t.Pivot.x) + offMax[0] * t.Pivot.x, y: offMin[1] * (1 - t.Pivot.y) + offMax[1] * t.Pivot.y },
    });
  }
}

function hideOwn(b, p) {
  const s = b.getComponent(p, SPR);
  if (s) b.patchComponent(p, SPR, { Color: { r: 1, g: 1, b: 1, a: 0 } });
}

function resetSkin(b, p) {
  const sp = rel(b.find(p).path) + "/Skin";
  if (b.find(sp)) b.remove(sp);
  return sp;
}

// 9조각. opt.k = 모서리 배율(기본 1), opt.inset = 바깥으로 늘릴 픽셀(그림자 여백 보정용, 기본 0)
function skin9(b, p, asset, opt = {}) {
  const m = META[asset];
  if (!m || m.kind !== 9) throw new Error("9조각 에셋 아님: " + asset);
  const k = opt.k ?? 1;
  const [W, H] = rectOf(b, p);
  const [L0, R0, T0, B0] = m.border;
  const L = Math.round(L0 * k), R = Math.round(R0 * k), T = Math.round(T0 * k), B = Math.round(B0 * k);
  // 늘어나는 조각은 이웃 아래로 겹쳐 틈을 막는다. 1px 로는 화면 축소(1920→실해상도) + 조각 가장자리 반투명 샘플링 때문에
  // 바닥띠 위에 배경이 비치는 가는 줄이 생겼다(2026-10-20 제작자 보고) → 4px.
  const o = 4;
  // 모서리를 줄여 쓰면(k<1) 최근접 축소로 둥근 선이 깨진다 → 그 크기로 미리 줄인 조각 세트(build_ui8_piece_sized.py,
  // ui8p_<이름>_s<모서리px>_*)가 등록돼 있으면 그것을 1:1 로 쓴다.
  const sized = asset + "_s" + L;
  const pa = k < 1 && RUID[sized.replace(/^ui8_/, "ui8p_") + "_tl"] ? sized : asset;
  const sp = resetSkin(b, p);
  b.empty(sp, { anchor: "stretch", pos: [0, 0], rect_size: [W, H] });
  const P = (n) => sp + "/" + n;
  piece(b, P("c"), pieceRuid(pa, "c"), "stretch", [W - L - R, H - T - B], [L - o, B - o], [-(R - o), -(T - o)]);
  piece(b, P("t"), pieceRuid(pa, "t"), "stretch-top", [W - L - R, T], [L - o, -T], [-(R - o), 0]);
  piece(b, P("b"), pieceRuid(pa, "b"), "stretch-bottom", [W - L - R, B], [L - o, 0], [-(R - o), B]);
  piece(b, P("l"), pieceRuid(pa, "l"), "stretch-left", [L, H - T - B], [0, B - o], [L, -(T - o)]);
  piece(b, P("r"), pieceRuid(pa, "r"), "stretch-right", [R, H - T - B], [-R, B - o], [0, -(T - o)]);
  piece(b, P("tl"), pieceRuid(pa, "tl"), "top-left", [L, T]);
  piece(b, P("tr"), pieceRuid(pa, "tr"), "top-right", [R, T]);
  piece(b, P("bl"), pieceRuid(pa, "bl"), "bottom-left", [L, B]);
  piece(b, P("br"), pieceRuid(pa, "br"), "bottom-right", [R, B]);
  hideOwn(b, p);
  sendToBack(b, p, "Skin");
  return b;
}

// 3조각. 양 끝 폭 = 원본 경계 × (엔티티 높이 / 원본 높이). opt.h = 높이를 따로 정할 때(세로 가운데 정렬)
function skin3(b, p, asset, opt = {}) {
  const m = META[asset];
  if (!m || m.kind !== 3) throw new Error("3조각 에셋 아님: " + asset);
  const [W, H] = rectOf(b, p);
  const h = opt.h ?? H;
  const s = h / m.size[1];
  let L = Math.round(m.border[0] * s), R = Math.round(m.border[1] * s);
  if (L + R > W) { const f = W / (L + R); L = Math.floor(L * f); R = Math.floor(R * f); }
  const o = Math.min(2, Math.floor(Math.min(L, R) / 2)); // 9조각과 같은 이유로 가운데를 양 끝 아래로 겹침
  const sp = resetSkin(b, p);
  if (h === H) b.empty(sp, { anchor: "stretch", pos: [0, 0], rect_size: [W, H] });
  else {
    b.empty(sp, { anchor: "stretch-middle", pos: [0, 0], rect_size: [W, h] });
    b.patchComponent(sp, UIT, { OffsetMin: { x: 0, y: -h / 2 }, OffsetMax: { x: 0, y: h / 2 } });
  }
  piece(b, sp + "/c", pieceRuid(asset, "c"), "stretch", [W - L - R, h], [L - o, 0], [-(R - o), 0]);
  piece(b, sp + "/l", pieceRuid(asset, "l"), "stretch-left", [L, h], [0, 0], [L, 0]);
  piece(b, sp + "/r", pieceRuid(asset, "r"), "stretch-right", [R, h], [-R, 0], [0, 0]);
  hideOwn(b, p);
  sendToBack(b, p, "Skin");
  return b;
}

// 단일 이미지: 엔티티 자기 스프라이트를 바꾼다(늘리지 않는 것). opt.preserve: 0 None / 1 AspectOnly
function simple(b, p, asset, opt = {}) {
  // 표시 폭에 맞춰 미리 줄인 그림(ui8s_<이름>_<폭>, build_ui8_sized.py)이 등록돼 있으면 그것을 쓴다
  const [W] = rectOf(b, p);
  const sized = asset.replace(/^ui8_/, "ui8s_") + "_" + Math.round(W);
  if (RUID[sized]) asset = sized;
  const upd = { ImageRUID: { DataId: ruid(asset) }, Color: { r: 1, g: 1, b: 1, a: opt.alpha ?? 1 }, Type: 0 };
  if (opt.preserve != null) upd.PreserveSprite = opt.preserve;
  if (b.getComponent(p, SPR)) b.patchComponent(p, SPR, upd);
  else throw new Error("스프라이트 없음: " + p);
  return b;
}

// 자기 글자가 있는 버튼·탭·줄: 조각 자식이 글자를 덮으므로(자식이 위에 그려짐) 통째 그림을 늘려 쓴다.
// ButtonComponent ColorTint 호버가 그대로 동작한다.
function full(b, p, asset) {
  const sp = rel(b.find(p).path) + "/Skin";
  if (b.find(sp)) b.remove(sp);
  return simple(b, p, asset);
}

// 글자를 가진 고정 상자: 같은 부모 안, 바로 앞(아래) 형제로 배경 엔티티를 만들어 조각을 깐다.
// 런타임에 움직이거나 켜고 끄는 엔티티에는 쓰지 않는다(배경이 따라가지 않음).
function backdrop(b, p, skinFn) {
  const full = b.find(p).path;
  const parentFull = full.replace(/\/[^/]+$/, "");
  const name = full.slice(parentFull.length + 1);
  const relParent = /^\/ui\/[^/]+$/.test(parentFull) ? "" : rel(parentFull);
  const backRel = relParent ? relParent + "/" + name + "_Back" : name + "_Back";
  if (b.find(backRel)) b.remove(backRel);
  const t = b.getComponent(p, UIT);
  b.empty(backRel, { anchor: "middle-center", pos: [0, 0], rect_size: [Number(t.RectSize.x), Number(t.RectSize.y)] });
  const copy = {};
  for (const k of ["AlignmentOption", "AnchorsMin", "AnchorsMax", "Pivot", "anchoredPosition", "RectSize", "OffsetMin", "OffsetMax"]) copy[k] = JSON.parse(JSON.stringify(t[k]));
  b.patchComponent(backRel, UIT, copy);
  skinFn(backRel);
  hideOwn(b, p);
  // 형제 순서: 배경을 대상 바로 앞으로
  const kids = childrenOf(b, relParent || "/").map((k) => k.path).filter((x) => x !== b.find(backRel).path);
  const out = [];
  for (const k of kids) { if (k === full) out.push(b.find(backRel).path); out.push(k); }
  out.forEach((k, i) => b.patch(k, { display_order: i }));
  return backRel;
}

// 런타임 형제 렌더 순서 = .ui 파일 안 엔티티 배열 순서다(displayOrder 값이 아님 — 2026-10-20 Play 실측:
// displayOrder 0 인 Skin 이 배열 맨 뒤라 형제 글자·게이지를 전부 덮었다). 저장 직전에 배열을 깊이 우선으로 다시 깐다.
// 기존 엔티티는 원래 배열 순서를 그대로 두고, ui8 이 만든 것만 옮긴다: "Skin" = 형제 맨 앞, "<X>_Back" = X 바로 앞.
function normalizeOrder(b) {
  const ents = b.entities;
  const byPath = new Map(ents.map((e, i) => [e.path, { e, i }]));
  const kids = new Map();
  const roots = [];
  for (const { e, i } of byPath.values()) {
    const parent = e.path.replace(/\/[^/]+$/, "");
    if (byPath.has(parent) && parent !== e.path) {
      if (!kids.has(parent)) kids.set(parent, []);
      kids.get(parent).push({ e, i });
    } else roots.push({ e, i });
  }
  const nameOf = (x) => x.e.path.slice(x.e.path.lastIndexOf("/") + 1);
  const arrange = (list) => {
    // 원래 보이던 순서 = (displayOrder, 배열 순서). 새로 만든 Skin/_Back 만 옮기고 나머지는 이 순서를 지킨다.
    const dord = (x) => Number(x.e.jsonString.displayOrder) || 0;
    const isPieces = list.length > 0 && list.every((x) => /\/Skin\/(c|t|b|l|r|tl|tr|bl|br)$/.test(x.e.path));
    const pieceOrder = ["c", "t", "b", "l", "r", "tl", "tr", "bl", "br"];
    const orig = list.slice().sort(isPieces
      ? (a, c) => pieceOrder.indexOf(nameOf(a)) - pieceOrder.indexOf(nameOf(c))
      : (a, c) => dord(a) - dord(c) || a.i - c.i);
    const skin = orig.filter((x) => nameOf(x) === "Skin");
    const backs = new Map(orig.filter((x) => nameOf(x).endsWith("_Back")).map((x) => [nameOf(x).slice(0, -5), x]));
    const res = [...skin];
    for (const x of orig) {
      const n = nameOf(x);
      if (n === "Skin" || n.endsWith("_Back")) continue;
      if (backs.has(n)) { res.push(backs.get(n)); backs.delete(n); }
      res.push(x);
    }
    for (const x of backs.values()) res.push(x); // 짝 없는 배경(대상이 사라진 경우)은 뒤에
    return res;
  };
  const out = [];
  // displayOrder 도 정렬 결과대로 0,1,2… 로 다시 매긴다. 런타임은 displayOrder 가 다르면 그것을 먼저 따르고
  // 같을 때만 배열 순서를 따른다(2026-10-20: 배열상 ItemIcon 앞인 ItemIcon_Back(displayOrder 33)이 맨 위에 그려짐).
  const walk = (node) => {
    out.push(node.e);
    arrange(kids.get(node.e.path) || []).forEach((k, idx) => {
      k.e.jsonString.displayOrder = idx;
      walk(k);
    });
  };
  roots.sort((a, c) => a.i - c.i).forEach(walk);
  if (out.length !== ents.length) throw new Error("normalizeOrder: 엔티티 수 불일치 " + out.length + "/" + ents.length);
  ents.length = 0;
  out.forEach((e) => ents.push(e));
  return b;
}

// 런타임 UI8Skin 이 쓰는 RUID 표(Lua) — 변형 이름 → 조각 RUID
// full = 통째 그림 RUID(글자 있는 버튼용), 나머지 = 조각 RUID
function luaVariantTable() {
  const lines = [];
  for (const [asset, m] of Object.entries(META)) {
    const keys = m.kind === 9 ? NINE : THREE;
    const name = asset.replace(/^ui8_/, "");
    const parts = [`full = "${ruid(asset)}"`, ...keys.map((k) => `${k} = "${pieceRuid(asset, k)}"`)];
    lines.push(`\t\tt["${name}"] = { ${parts.join(", ")} }`);
  }
  // 늘리지 않는 단일 그림(칸·토글·아이콘 등)도 통째 변형으로 넣는다
  for (const [n, r] of Object.entries(RUID)) {
    if (!n.startsWith("ui8_") || META[n]) continue;
    lines.push(`\t\tt["${n.replace(/^ui8_/, "")}"] = { full = "${r}" }`);
  }
  return lines.join("\n");
}

module.exports = { normalizeOrder, rel, full, backdrop, RUID, META, ruid, pieceRuid, skin9, skin3, simple, hideOwn, sendToBack, rectOf, childrenOf, luaVariantTable };
