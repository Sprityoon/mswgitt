// 전체 UI 파일의 DataRef 중첩 래핑 점검 (LEA-3044 예방)
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("C:/minho/메이플월드/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const DIR = "C:/minho/메이플월드/ui";
const EXT = ".u" + "i";
const FIELDS = [
  ["MOD.Core.SpriteGUIRendererComponent", "ImageRUID"],
  ["MOD.Core.ScrollLayoutGroupComponent", "ScrollBarHandleImageRUID"],
  ["MOD.Core.ScrollLayoutGroupComponent", "ScrollBarBgImageRUID"],
  ["MOD.Core.SliderComponent", "FillRectImageRUID"],
  ["MOD.Core.SliderComponent", "HandleImageRUID"],
];

for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith(EXT)) continue;
  const b = UIBuilder.load(path.join(DIR, f));
  let bad = 0, n = 0;
  for (const e of b.listEntities()) {
    for (const [t, fl] of FIELDS) {
      const c = b.getComponent(e.path, t);
      if (!c || !(fl in c)) continue;
      n++;
      const v = c[fl];
      if (v && typeof v === "object" && v.DataId && typeof v.DataId === "object") {
        bad++;
        console.log("  🔴 중첩:", f, "|", e.path.split("/").slice(3).join("/"), "|", fl);
      }
    }
  }
  console.log(`${f.padEnd(24)} DataRef ${String(n).padStart(4)}개 | 중첩 ${bad}건`);
}
