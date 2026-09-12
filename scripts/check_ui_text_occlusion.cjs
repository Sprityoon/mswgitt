// 형제 중 '나중에 그려지는 불투명 스프라이트'가 앞 형제를 덮는지 전수 점검한다.
const { UIBuilder } = require("C:/minho/메이플월드/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.load("C:/minho/메이플월드/ui/PopupGroup.ui");
const ents = b.build().ContentProto.Entities;
const idx = new Map();
ents.forEach((e, i) => idx.set(e.path, i));

const ANCHOR = { 0:[.5,.5],1:[0,.5],2:[1,.5],3:[.5,1],4:[0,1],5:[1,1],6:[.5,0],7:[0,0],8:[1,0],9:[.5,1],10:[.5,.5],11:[.5,0],12:[0,.5],13:[.5,.5],14:[1,.5],15:[.5,.5] };
function tf(path) {
  const t = b.getComponent(path, "MOD.Core.UITransformComponent");
  if (!t) return null;
  const ap = t.AnchoredPosition || t.anchoredPosition || { x: 0, y: 0 };
  return { align: t.AlignmentOption | 0, pos: [ap.x || 0, ap.y || 0], size: [t.RectSize.x, t.RectSize.y], pivot: [t.Pivot ? t.Pivot.x : .5, t.Pivot ? t.Pivot.y : .5] };
}
// 부모 기준 로컬 사각형
function localRect(path) {
  const t = tf(path); if (!t) return null;
  const parent = path.split("/").slice(0, -1).join("/");
  const pt = tf(parent);
  const pw = pt ? pt.size[0] : 1920, ph = pt ? pt.size[1] : 1080;
  const a = ANCHOR[t.align] || [.5, .5];
  const px = (a[0] - .5) * pw + t.pos[0], py = (a[1] - .5) * ph + t.pos[1];
  const cx = px + (.5 - t.pivot[0]) * t.size[0], cy = py + (.5 - t.pivot[1]) * t.size[1];
  return { l: cx - t.size[0] / 2, r: cx + t.size[0] / 2, b: cy - t.size[1] / 2, t: cy + t.size[1] / 2 };
}
function isOpaqueSprite(path) {
  const s = b.getComponent(path, "MOD.Core.SpriteGUIRendererComponent");
  if (!s) return false;
  if (b.getComponent(path, "MOD.Core.TextComponent") || b.getComponent(path, "MOD.Core.TextGUIRendererComponent")) return false;
  if (b.getComponent(path, "MOD.Core.ButtonComponent")) return false;
  const c = s.Color || { a: 1 };
  return (c.a === undefined ? 1 : c.a) >= 0.95;
}
function hasText(path) {
  return !!(b.getComponent(path, "MOD.Core.TextComponent") || b.getComponent(path, "MOD.Core.TextGUIRendererComponent"));
}

const hits = [];
for (const e of ents) {
  const p = e.path;
  if (!hasText(p)) continue;
  const parent = p.split("/").slice(0, -1).join("/");
  const rect = localRect(p); if (!rect) continue;
  const sibs = ents.filter((q) => {
    const rel = q.path.slice(parent.length + 1);
    return q.path.startsWith(parent + "/") && !rel.includes("/") && q.path !== p;
  });
  for (const s of sibs) {
    if (idx.get(s.path) <= idx.get(p)) continue;      // 나중에 그려지는 것만
    if (!isOpaqueSprite(s.path)) continue;
    const r2 = localRect(s.path); if (!r2) continue;
    const ox = Math.min(rect.r, r2.r) - Math.max(rect.l, r2.l);
    const oy = Math.min(rect.t, r2.t) - Math.max(rect.b, r2.b);
    const area = (rect.r - rect.l) * (rect.t - rect.b);
    if (ox > 0 && oy > 0 && (ox * oy) / area > 0.8) {   // 80% 이상 덮임
      hits.push(`${p.replace("/ui/PopupGroup/", "")}  <=덮임=  ${s.path.split("/").pop()} (idx ${idx.get(p)} < ${idx.get(s.path)}, ${Math.round(ox)}x${Math.round(oy)})`);
    }
  }
}
console.log(hits.length ? "가려진 텍스트 " + hits.length + "건:" : "가려진 텍스트 없음");
hits.forEach((h) => console.log("  " + h));
