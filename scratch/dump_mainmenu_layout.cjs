const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.read("ui/MainMenuGroup.ui");

function compsOf(e) {
  return (e.jsonString || {})["@components"] || [];
}
function getXform(e) {
  return compsOf(e).find((c) => (c["@type"] || "").includes("UITransform")) || null;
}
function getText(e) {
  return compsOf(e).find((c) => (c["@type"] || "").includes("TextGUIRenderer")) || null;
}
function getSprite(e) {
  return compsOf(e).find((c) => (c["@type"] || "").includes("SpriteGUIRenderer")) || null;
}

const interesting = b.entities.filter((e) =>
  /TitlePanel\/(Logo|Tagline|Hint|Btn|Sign)|SlotPanel\/(Subtitle|Notebook|BtnBack|Slot1)|CustomizePanel\/Frame\/(Title|BtnStart|BtnLook|Error|NameInput|HairName)/.test(
    e.path || ""
  )
);

for (const e of interesting) {
  const x = getXform(e);
  const t = getText(e);
  const s = getSprite(e);
  console.log("\n==", (e.path || "").replace("/ui/MainMenuGroup/", ""), "==");
  if (x) {
    console.log(
      "xform",
      JSON.stringify({
        anchorMin: x.AnchorsMin,
        anchorMax: x.AnchorsMax,
        pivot: x.Pivot,
        pos: x.anchoredPosition,
        size: x.RectSize,
        offsetMin: x.OffsetMin,
        offsetMax: x.OffsetMax,
      })
    );
  }
  if (t) {
    console.log(
      "text",
      JSON.stringify({
        BestFit: t.BestFit,
        FontSize: t.FontSize,
        MinSize: t.MinSize,
        MaxSize: t.MaxSize,
        FaceDilate: t.FaceDilate,
        OutlineWidth: t.OutlineWidth,
        OutlineColor: t.OutlineColor,
        FontColor: t.FontColor,
        Font: t.Font,
        H: t.HorizontalAlignment,
        V: t.VerticalAlignment,
        Text: t.Text,
      })
    );
  }
  if (s) {
    console.log(
      "sprite",
      JSON.stringify({
        Color: s.Color,
        ImageRUID: s.ImageRUID,
        ImageType: s.ImageType,
        RaycastTarget: s.RaycastTarget,
      })
    );
  }
}
