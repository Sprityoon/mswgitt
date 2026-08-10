const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.read("ui/MainMenuGroup.ui");

function compsOf(e) {
  const js = e.jsonString || {};
  return js["@components"] || [];
}

const rows = [];
for (const e of b.entities) {
  const path = e.path || "";
  for (const c of compsOf(e)) {
    const type = c["@type"] || "";
    if (!type.includes("TextGUIRenderer") && !type.includes("TextInput")) continue;
    rows.push({
      path: path.replace("/ui/MainMenuGroup/", ""),
      kind: type.includes("TextInput") ? "input" : "text",
      BestFit: c.BestFit,
      MinSize: c.MinSize,
      MaxSize: c.MaxSize,
      FontSize: c.FontSize,
      Overflow: c.Overflow,
      HAlign: c.HorizontalAlignment,
      VAlign: c.VerticalAlignment,
      FaceDilate: c.FaceDilate,
      OutlineWidth: c.OutlineWidth,
      Text: String(c.Text || c.PlaceHolder || "").slice(0, 40),
      Color: c.FontColor,
      OutlineColor: c.OutlineColor,
    });
  }
}

rows.sort((a, b) => a.path.localeCompare(b.path));
console.log("count", rows.length);
for (const r of rows) {
  console.log(
    [
      r.kind,
      `BF=${r.BestFit}`,
      `min=${r.MinSize}`,
      `max=${r.MaxSize}`,
      `fs=${r.FontSize}`,
      `ov=${r.Overflow}`,
      `dil=${r.FaceDilate}`,
      `out=${r.OutlineWidth}`,
      r.path,
      JSON.stringify(r.Text),
    ].join("\t")
  );
}

// Heuristic: user-touched = BestFit true with distinctive MaxSize/FontSize
const fitted = rows.filter((r) => r.BestFit === true);
console.log("\nBestFit=true count", fitted.length);
const notFitted = rows.filter((r) => r.kind === "text" && r.BestFit !== true);
console.log("text BestFit=false", notFitted.length);
for (const r of notFitted) console.log("  NEED?", r.path, "fs="+r.FontSize, "max="+r.MaxSize);
