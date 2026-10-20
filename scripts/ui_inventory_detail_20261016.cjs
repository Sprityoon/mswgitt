// 가방 안에 아이템 상세 패널 통합 (2026-10-16)
// 전: 6열 격자(실사용 폭 462)가 680 칸 왼쪽에만 차고 오른쪽이 비어 있었으며, 상세 카드는 가방 밖 오른쪽에 떠서 HUD 를 가렸다.
// 후: 가방 900×700 / 종이 820×520 — 왼쪽 격자 470, 오른쪽 상세 패널 300×468(격자와 같은 높이·윗변).
// 규칙 10: stretch 자식은 RectSize 를 따르므로 앵커·크기를 명시한다. 재실행 가능(멱등). 백업: scratch/ui-before-invdetail-20261016/
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const root = path.join(__dirname, "..");
const file = path.join(root, "ui", "PopupGroup.ui");
const backupDir = path.join(root, "scratch", "ui-before-invdetail-20261016");
fs.mkdirSync(backupDir, { recursive: true });
if (!fs.existsSync(path.join(backupDir, "PopupGroup.ui"))) fs.copyFileSync(file, path.join(backupDir, "PopupGroup.ui"));

const W = 900, H = 700;
const b = UIBuilder.load(file);
const P = "InventoryPopup";
const mc = (pos, size) => ({ anchor: "middle-center", pivot: [0.5, 0.5], pos, rect_size: size });

b.patch(P, { rect_size: [W, H] });
b.patch(`${P}/Bg`, mc([0, 0], [W, H]));
b.patch(`${P}/Paper`, mc([0, 0], [820, 520]));
// 종이 안쪽 x -410~410: 격자 -394~76, 간격 16, 상세 92~392
b.patch(`${P}/Grid`, mc([-159, -18], [470, 468]));
b.patch(`${P}/Tooltip`, mc([242, -18], [300, 468]));
b.patch(`${P}/Tooltip/Bg`, mc([0, 0], [300, 468]));
// 버리기 확인창 덮개도 가방 크기에 맞춘다
b.patch(`${P}/DiscardPopup`, mc([0, 0], [W, H]));
b.patch(`${P}/DiscardPopup/Dim`, mc([0, 0], [W, H]));

b.write(file);
console.log("done");
