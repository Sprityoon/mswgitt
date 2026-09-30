"""propkit — Track A painter: MapleStory-style cartoon props, drawn by code (Pillow only).

Why this exists: world props in an MSW game sit next to official MapleStory art —
smooth painted shapes, warm dark outlines, cel shading with soft gradients, rim light.
Pixel-art rules (no AA, text grids) produce the wrong look there. This kit draws
layered shapes on a supersampled canvas and downsamples once, so edges come out
anti-aliased like the official sprites.

Usage (from a per-asset draw script):

    import sys; sys.path.insert(0, "<skill>/scripts")
    from propkit import Canvas, C, flame_points, preview_sheet
    cv = Canvas(256, 240, ss=4)            # logical px; internal = 4x
    body = cv.ellipse(128, 150, 90, 80)    # masks are 'L' images in internal px
    cv.part(body, fill=("#d9774a", "#b4552f", 100), outline="#4a2a1c", width=3)
    cv.shade(body, "#8c3b22", dx=10, dy=8, blur=6, alpha=0.45)
    cv.export("out.png")

All coordinates/lengths are LOGICAL pixels (the size of the exported PNG), y grows down.
Painting order = back to front. `part()` paints the outline under the fill, so a part
drawn later automatically outlines itself over earlier parts (MapleStory-style part lines).
"""
from __future__ import annotations

import math
import os
import random
from typing import Iterable, Sequence

from PIL import Image, ImageChops, ImageDraw, ImageFilter


# ───────────────────────── colors ─────────────────────────
def C(h: str | Sequence[int], a: float | None = None) -> tuple[int, int, int, int]:
    """'#rrggbb' / '#rrggbbaa' / (r,g,b[,a]) -> RGBA tuple. `a` (0..1) overrides alpha."""
    if isinstance(h, str):
        s = h.lstrip("#")
        r, g, b = int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16)
        al = int(s[6:8], 16) if len(s) >= 8 else 255
    else:
        r, g, b = h[0], h[1], h[2]
        al = h[3] if len(h) > 3 else 255
    if a is not None:
        al = int(round(255 * max(0.0, min(1.0, a))))
    return (r, g, b, al)


def mix(c0, c1, t: float):
    """Linear mix of two colors (hex or tuple), t=0 -> c0."""
    a, b = C(c0), C(c1)
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(4))


def shift_value(c, dv: float):
    """Lighten (dv>0) / darken (dv<0) toward white/black by |dv| (0..1)."""
    return mix(c, "#ffffff" if dv > 0 else "#000000", abs(dv))


# ───────────────────────── canvas ─────────────────────────
class Canvas:
    def __init__(self, w: int, h: int, ss: int = 4):
        self.w, self.h, self.ss = w, h, ss
        self.W, self.H = w * ss, h * ss
        self.img = Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))

    # --- helpers -------------------------------------------------------
    def S(self, v: float) -> float:
        return v * self.ss

    def blank(self, v: int = 0) -> Image.Image:
        return Image.new("L", (self.W, self.H), v)

    # --- mask builders (logical coords) ---------------------------------
    def ellipse(self, cx, cy, rx, ry) -> Image.Image:
        m = self.blank()
        s = self.ss
        ImageDraw.Draw(m).ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=255)
        return m

    def circle(self, cx, cy, r) -> Image.Image:
        return self.ellipse(cx, cy, r, r)

    def rect(self, x0, y0, x1, y1, r: float = 0) -> Image.Image:
        m = self.blank()
        s = self.ss
        box = [x0 * s, y0 * s, x1 * s, y1 * s]
        d = ImageDraw.Draw(m)
        if r > 0:
            d.rounded_rectangle(box, radius=r * s, fill=255)
        else:
            d.rectangle(box, fill=255)
        return m

    def poly(self, pts: Iterable[tuple[float, float]]) -> Image.Image:
        m = self.blank()
        s = self.ss
        ImageDraw.Draw(m).polygon([(x * s, y * s) for x, y in pts], fill=255)
        return m

    def arch(self, cx, bottom, half_w, top) -> Image.Image:
        """Door/oven-mouth shape: straight sides from `bottom` up, semicircular-ish top reaching `top`."""
        rise = min(half_w, bottom - top)
        spring = top + rise  # y where the curve starts
        m = self.rect(cx - half_w, spring, cx + half_w, bottom)
        # 위쪽 반원만 — 원 전체를 합치면 아래 절반이 bottom 밑으로 삐져나온다(dome 과 같은 함정).
        cap = self.intersect(self.ellipse(cx, spring, half_w, rise),
                             self.rect(cx - half_w - 2, top - 2, cx + half_w + 2, spring + 0.5))
        return self.union(m, cap)

    def dome(self, cx, bottom, half_w_base, half_w_top, shoulder_y, top) -> Image.Image:
        """Beehive/kiln body: trapezoid from bottom to shoulder + half-ellipse cap up to `top`."""
        pts = [(cx - half_w_base, bottom), (cx + half_w_base, bottom), (cx + half_w_top, shoulder_y), (cx - half_w_top, shoulder_y)]
        # 캡은 타원의 위쪽 절반만 — 전체 타원을 합치면 아래 절반이 bottom 밑으로 삐져나와 바닥에 곡선 자국이 생긴다.
        cap = self.intersect(self.ellipse(cx, shoulder_y, half_w_top, shoulder_y - top),
                             self.rect(cx - half_w_top - 2, top - 2, cx + half_w_top + 2, shoulder_y + 0.5))
        return self.union(self.poly(pts), cap)

    # --- mask algebra ----------------------------------------------------
    @staticmethod
    def union(*ms: Image.Image) -> Image.Image:
        out = ms[0]
        for m in ms[1:]:
            out = ImageChops.lighter(out, m)
        return out

    @staticmethod
    def intersect(a: Image.Image, b: Image.Image) -> Image.Image:
        return ImageChops.multiply(a, b)

    @staticmethod
    def subtract(a: Image.Image, b: Image.Image) -> Image.Image:
        return ImageChops.subtract(a, b)

    def shift(self, m: Image.Image, dx: float, dy: float) -> Image.Image:
        out = self.blank()
        out.paste(m, (int(round(dx * self.ss)), int(round(dy * self.ss))))
        return out

    def grow(self, m: Image.Image, r: float) -> Image.Image:
        """Round dilation by r logical px (blur + low threshold keeps curves smooth)."""
        if r <= 0:
            return m
        sigma = max(1.0, r * self.ss / 1.28)
        b = m.filter(ImageFilter.GaussianBlur(sigma))
        return b.point(lambda v: 255 if v >= 26 else int(v * 255 / 26))

    def shrink(self, m: Image.Image, r: float) -> Image.Image:
        inv = ImageChops.invert(m)
        return ImageChops.invert(self.grow(inv, r))

    def soften(self, m: Image.Image, r: float) -> Image.Image:
        return m.filter(ImageFilter.GaussianBlur(max(0.5, r * self.ss))) if r > 0 else m

    @staticmethod
    def scale_alpha(m: Image.Image, a: float) -> Image.Image:
        return m.point(lambda v: int(v * a))

    # --- painting ----------------------------------------------------------
    def paint(self, m: Image.Image, color, alpha: float = 1.0) -> None:
        col = C(color)
        layer = Image.new("RGBA", (self.W, self.H), col[:3] + (0,))
        am = m if (alpha >= 1.0 and col[3] == 255) else m.point(lambda v: int(v * alpha * col[3] / 255))
        layer.putalpha(am)
        self.img = Image.alpha_composite(self.img, layer)

    def _gradient_img(self, m: Image.Image, c0, c1, angle_deg: float) -> Image.Image:
        """RGBA image filling the mask bbox with a linear gradient c0 -> c1 along angle (0=left->right, 90=top->bottom)."""
        bbox = m.getbbox() or (0, 0, self.W, self.H)
        bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d = int(math.hypot(bw, bh)) + 4
        g = Image.linear_gradient("L").resize((d, d))  # top->bottom
        g = g.rotate(90 - angle_deg, resample=Image.BILINEAR)
        g = g.crop(((d - bw) // 2, (d - bh) // 2, (d - bw) // 2 + bw, (d - bh) // 2 + bh))
        full = self.blank()
        full.paste(g, (bbox[0], bbox[1]))
        a = Image.new("RGBA", (self.W, self.H), C(c0))
        b = Image.new("RGBA", (self.W, self.H), C(c1))
        return Image.composite(b, a, full)

    def gradient(self, m: Image.Image, c0, c1, angle: float = 90, alpha: float = 1.0) -> None:
        """Colors may carry alpha ('#rrggbb00' -> fades out); final alpha = color alpha x mask x alpha."""
        grad = self._gradient_img(m, c0, c1, angle)
        am = m if alpha >= 1 else self.scale_alpha(m, alpha)
        grad.putalpha(ImageChops.multiply(grad.getchannel("A"), am))
        self.img = Image.alpha_composite(self.img, grad)

    def radial(self, m: Image.Image, c_center, c_edge, cx, cy, r, alpha: float = 1.0) -> None:
        g = Image.radial_gradient("L")  # 256x256, 0 at center -> 255 edge (~ at radius 128)
        size = int(r * 2 * self.ss * 128 / 128)
        g = g.resize((max(2, size), max(2, size)))
        full = Image.new("L", (self.W, self.H), 255)
        full.paste(g, (int(cx * self.ss - size / 2), int(cy * self.ss - size / 2)))
        a = Image.new("RGBA", (self.W, self.H), C(c_center))
        b = Image.new("RGBA", (self.W, self.H), C(c_edge))
        img = Image.composite(b, a, full)
        am = m if alpha >= 1 else self.scale_alpha(m, alpha)
        img.putalpha(ImageChops.multiply(img.getchannel("A"), am))
        self.img = Image.alpha_composite(self.img, img)

    def part(self, m: Image.Image, fill, outline="#4a2a1c", width: float = 3.0) -> None:
        """Outline (painted under) + fill. `fill` = color, or (c_top, c_bottom[, angle]) gradient."""
        if outline and width > 0:
            self.paint(self.grow(m, width), outline)
        if isinstance(fill, tuple) and len(fill) in (2, 3) and not isinstance(fill[0], int):
            ang = fill[2] if len(fill) == 3 else 90
            self.gradient(m, fill[0], fill[1], ang)
        else:
            self.paint(m, fill)

    def shade(self, m: Image.Image, color, dx: float, dy: float, blur: float = 4, alpha: float = 0.45) -> None:
        """Form shadow: the side of `m` facing away from the light (light comes from -dx,-dy)."""
        band = self.subtract(m, self.shift(m, -dx, -dy))
        band = self.intersect(self.soften(band, blur), m)
        self.paint(band, color, alpha)

    def light(self, m: Image.Image, color, dx: float, dy: float, blur: float = 3, alpha: float = 0.5) -> None:
        """Rim/key light on the side facing the light (light direction = -dx,-dy)."""
        band = self.subtract(m, self.shift(m, dx, dy))
        band = self.intersect(self.soften(band, blur), m)
        self.paint(band, color, alpha)

    def glow(self, m: Image.Image, color, radius: float, alpha: float = 0.6) -> None:
        self.paint(self.soften(m, radius), color, alpha)

    # --- export ------------------------------------------------------------
    def nudge(self, dx: float, dy: float = 0) -> None:
        """Move the whole drawing (logical px) — use to center the opaque bbox on the pivot column."""
        moved = Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))
        moved.paste(self.img, (int(round(dx * self.ss)), int(round(dy * self.ss))))
        self.img = moved

    def image(self) -> Image.Image:
        """Downsampled RGBA at logical size (premultiplied resize -> no dark fringes)."""
        pm = self.img.convert("RGBa")
        return pm.resize((self.w, self.h), Image.LANCZOS).convert("RGBA")

    def export(self, path: str, dot: int | None = None, colors: int = 64) -> dict:
        """Save the PNG. `dot` = '살짝 도트화' finish (see pixelize) — the default for this project's world props."""
        img = self.image()
        if dot and dot > 1:
            img = pixelize(img, dot=dot, colors=colors)
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        img.save(path)
        bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        info = {"path": path, "size": img.size, "bbox": bbox}
        if bbox:
            info["bottom_margin"] = self.h - bbox[3]
            info["center_x_offset"] = (bbox[0] + bbox[2]) / 2 - self.w / 2
        return info


# ───────────────────────── '살짝 도트화' 마감 ─────────────────────────
def pixelize(img: Image.Image, dot: int = 2, colors: int = 64, alpha_cut: int = 110,
             selout: float = 0.5, selout_min_lum: float = 70.0) -> Image.Image:
    """Painted RGBA -> hi-res pixel art at the same size.

    1. shrink to a dot-px grid (premultiplied LANCZOS) — `dot` = how many output px one art pixel covers
       (match the terrain: 64px tile shown at 100 screen px = 1.56 screen px per dot; a 256px prop at Scale 0.75 -> dot 2)
    2. binary alpha (alpha >= alpha_cut) — pixel art has no soft edges; paint glows/smoke opaque if they must survive
    3. palette limit (median cut, no dither) — keeps ramps deliberate instead of thousands of gradient shades
    4. silhouette selout — light pixels on the outer border become a darker version of themselves (colored outline)
    5. NEAREST back to the original size (pivot/canvas unchanged)
    """
    W, H = img.size
    gw, gh = max(1, W // dot), max(1, H // dot)
    small = img.convert("RGBa").resize((gw, gh), Image.LANCZOS).convert("RGBA")
    a = small.getchannel("A").point(lambda v: 255 if v >= alpha_cut else 0)
    rgb = Image.new("RGB", (gw, gh), (74, 42, 28))
    rgb.paste(small.convert("RGB"), mask=a)
    q = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGBA")
    q.putalpha(a)
    px = q.load()
    border = []
    for y in range(gh):
        for x in range(gw):
            if px[x, y][3] == 0:
                continue
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if nx < 0 or ny < 0 or nx >= gw or ny >= gh or px[nx, ny][3] == 0:
                    border.append((x, y))
                    break
    for x, y in border:
        r, g, b, al = px[x, y]
        if 0.299 * r + 0.587 * g + 0.114 * b > selout_min_lum:
            px[x, y] = (int(r * selout), int(g * selout), int(b * selout), al)
    return q.resize((gw * dot, gh * dot), Image.NEAREST)


# ───────────────────────── shapes ─────────────────────────
def flame_points(cx, base, w, h, lean: float = 0.0, n: int = 48):
    """Teardrop flame outline (logical px): round bottom of width w at `base`, tip at base-h leaning by `lean` px."""
    pts = []
    for i in range(n + 1):
        t = i / n  # 0..1 around
        ang = t * 2 * math.pi
        # base circle-ish bottom blended into a pointed top
        x = math.sin(ang)
        y = -math.cos(ang)
        # stretch the upper half into a point
        up = max(0.0, -y)  # 0 at equator/bottom, 1 at top
        px = cx + x * (w / 2) * (1 - up ** 1.6 * 0.95) + lean * up ** 2
        py = base - w / 2 + y * (w / 2) - up * (h - w)
        pts.append((px, py))
    return pts


def rand(seed: int) -> random.Random:
    return random.Random(seed)


# ───────────────────────── previews ─────────────────────────
BG = {
    "grass": ("#7fae4f", "#74a346"),
    "sand": ("#e3c98f", "#d8bc7f"),
    "snow": ("#eef3f7", "#dfe8ef"),
    "dirt": ("#b98a5a", "#ad7e50"),
    "checker": ("#cfcfcf", "#ffffff"),
}


def _tile_bg(w: int, h: int, kind: str, cell: int = 32) -> Image.Image:
    a, b = BG[kind]
    bg = Image.new("RGBA", (w, h), C(a))
    d = ImageDraw.Draw(bg)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if (x // cell + y // cell) % 2:
                d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=C(b))
    return bg


def _real_tile_bg(w: int, h: int, tile_png: str, tile_px: int) -> Image.Image:
    t = Image.open(tile_png).convert("RGBA").resize((tile_px, tile_px), Image.NEAREST)
    bg = Image.new("RGBA", (w, h))
    for y in range(0, h, tile_px):
        for x in range(0, w, tile_px):
            bg.paste(t, (x, y))
    return bg


def preview_sheet(items: Sequence[tuple[str, str, float]], out: str, bgs=("grass", "sand", "snow", "checker"),
                  zoom: int = 1, tiles: dict | None = None, tile_px: int = 100) -> str:
    """items = [(label, png_path, in_game_scale)]. Renders every item on every background at in-game scale (x zoom).
    `tiles` = {"name": "tileimg/FullGrass.png", ...} adds rows on the project's REAL terrain tiles (64px tile -> tile_px
    screen px, NEAREST) — the only honest way to judge whether a prop's dot density matches the ground."""
    ims = []
    for label, p, sc in items:
        im = Image.open(p).convert("RGBA")
        s = sc * zoom
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.NEAREST if s >= 1 else Image.BOX)
        ims.append((label, im))
    rows = [(k, None) for k in bgs] + [(k, v) for k, v in (tiles or {}).items()]
    pad = 16
    cw = sum(im.width for _, im in ims) + pad * (len(ims) + 1)
    ch = max(im.height for _, im in ims) + pad * 2 + 14
    sheet = Image.new("RGBA", (cw, ch * len(rows)), (0, 0, 0, 255))
    for bi, (kind, tile_png) in enumerate(rows):
        row = _real_tile_bg(cw, ch, tile_png, tile_px * zoom) if tile_png else _tile_bg(cw, ch, kind)
        d = ImageDraw.Draw(row)
        x = pad
        for label, im in ims:
            row.alpha_composite(im, (x, ch - pad - 14 - im.height))
            d.text((x, ch - pad - 10), label, fill=(20, 20, 20, 255) if kind not in ("grass",) else (255, 255, 255, 255))
            x += im.width + pad
        sheet.paste(row, (0, bi * ch))
    sheet.save(out)
    return out


if __name__ == "__main__":
    # 외부 이미지(이미지 생성 AI 결과·손그림)를 같은 규격으로 '살짝 도트화' 마감:
    #   python propkit.py pixelize in.png out.png --dot 2 --colors 72 [--width 256]
    import argparse

    ap = argparse.ArgumentParser(description="propkit CLI")
    sub = ap.add_subparsers(dest="cmd", required=True)
    pz = sub.add_parser("pixelize", help="painted/AI image -> hi-res pixel art at game dot density")
    pz.add_argument("src")
    pz.add_argument("dst")
    pz.add_argument("--dot", type=int, default=2)
    pz.add_argument("--colors", type=int, default=72)
    pz.add_argument("--width", type=int, default=0, help="resize to this width first (keeps aspect; LANCZOS)")
    args = ap.parse_args()
    src = Image.open(args.src).convert("RGBA")
    if args.width and args.width != src.width:
        h = round(src.height * args.width / src.width)
        src = src.convert("RGBa").resize((args.width, h), Image.LANCZOS).convert("RGBA")
    out_img = pixelize(src, dot=args.dot, colors=args.colors)
    out_img.save(args.dst)
    print(args.dst, out_img.size)
