const fs = require('fs');

// Generates detailed HTML5 Canvas rendering script for MapleStory Main Screen Key Art (1920x1080)
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; background: #000; overflow: hidden; }
    canvas { width: 1920px; height: 1080px; display: block; }
  </style>
</head>
<body>
  <canvas id="c" width="1920" height="1080"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');

    // Enable high quality image smoothing
    ctx.imageSmoothingEnabled = true;

    // Helper functions
    function rad(deg) { return deg * Math.PI / 180; }

    // ==================== 1. SKY & ATMOSPHERE ====================
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1080);
    skyGrad.addColorStop(0, '#59bfff');
    skyGrad.addColorStop(0.35, '#9ee1ff');
    skyGrad.addColorStop(0.65, '#d4f2ff');
    skyGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Sun Rays / God Rays
    ctx.save();
    ctx.translate(960, 200);
    ctx.fillStyle = 'rgba(255, 245, 200, 0.08)';
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 1200, rad(i * 22.5 - 5), rad(i * 22.5 + 5));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Sun Glow
    const sunGlow = ctx.createRadialGradient(960, 200, 20, 960, 200, 450);
    sunGlow.addColorStop(0, 'rgba(255, 253, 230, 0.95)');
    sunGlow.addColorStop(0.3, 'rgba(255, 230, 150, 0.5)');
    sunGlow.addColorStop(0.7, 'rgba(255, 210, 130, 0.15)');
    sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(960, 200, 450, 0, Math.PI * 2);
    ctx.fill();

    // Soft Fluffy Volumetric Clouds
    function drawCloud(x, y, scale, opacity) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = \`rgba(255, 255, 255, \${opacity})\`;

      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.arc(45, -20, 45, 0, Math.PI * 2);
      ctx.arc(90, -10, 40, 0, Math.PI * 2);
      ctx.arc(130, 10, 35, 0, Math.PI * 2);
      ctx.arc(60, 20, 45, 0, Math.PI * 2);
      ctx.fill();

      // Cloud Cel-shading underside
      ctx.fillStyle = \`rgba(190, 220, 245, \${opacity * 0.5})\`;
      ctx.beginPath();
      ctx.arc(60, 25, 45, 0.2, Math.PI - 0.2);
      ctx.arc(130, 15, 30, 0, Math.PI - 0.5);
      ctx.fill();
      ctx.restore();
    }

    drawCloud(150, 160, 1.4, 0.9);
    drawCloud(1350, 130, 1.6, 0.85);
    drawCloud(750, 90, 1.0, 0.6);
    drawCloud(1700, 220, 1.1, 0.75);

    // ==================== 2. DISTANT HENESYS MOUNTAINS & HILLS ====================
    // Far Mountains
    const farMtnGrad = ctx.createLinearGradient(0, 400, 0, 1080);
    farMtnGrad.addColorStop(0, '#5ebb3e');
    farMtnGrad.addColorStop(1, '#2c7a1c');
    ctx.fillStyle = farMtnGrad;
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.bezierCurveTo(300, 410, 600, 490, 900, 430);
    ctx.bezierCurveTo(1200, 390, 1600, 480, 1920, 420);
    ctx.lineTo(1920, 1080);
    ctx.lineTo(0, 1080);
    ctx.fill();

    // Windmill on distant ridge
    ctx.save();
    ctx.translate(1480, 370);
    ctx.fillStyle = 'rgba(40, 110, 25, 0.65)';
    ctx.beginPath();
    ctx.moveTo(-15, 90);
    ctx.lineTo(15, 90);
    ctx.lineTo(8, 0);
    ctx.lineTo(-8, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 110, 25, 0.7)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(rad(i * 90)) * 50, Math.sin(rad(i * 90)) * 50);
      ctx.stroke();
    }
    ctx.restore();

    // Midground Ridge
    const midHillGrad = ctx.createLinearGradient(0, 480, 0, 1080);
    midHillGrad.addColorStop(0, '#7ce035');
    midHillGrad.addColorStop(1, '#349419');
    ctx.fillStyle = midHillGrad;
    ctx.beginPath();
    ctx.moveTo(0, 610);
    ctx.bezierCurveTo(450, 500, 950, 600, 1450, 490);
    ctx.bezierCurveTo(1700, 450, 1850, 530, 1920, 510);
    ctx.lineTo(1920, 1080);
    ctx.lineTo(0, 1080);
    ctx.fill();

    // Foreground Rolling Field (3/4 JRPG Angle)
    const foreGrad = ctx.createLinearGradient(0, 600, 0, 1080);
    foreGrad.addColorStop(0, '#9bf73e');
    foreGrad.addColorStop(0.3, '#6dd620');
    foreGrad.addColorStop(1, '#2c7d12');
    ctx.fillStyle = foreGrad;
    ctx.beginPath();
    ctx.moveTo(-50, 670);
    ctx.bezierCurveTo(450, 580, 960, 660, 1480, 570);
    ctx.bezierCurveTo(1750, 530, 1950, 630, 1970, 640);
    ctx.lineTo(1970, 1120);
    ctx.lineTo(-50, 1120);
    ctx.fill();

    // Procedural Grass Blades Texture
    ctx.fillStyle = 'rgba(70, 170, 30, 0.4)';
    for (let i = 0; i < 600; i++) {
      const gx = Math.random() * 1920;
      const gy = 620 + Math.random() * 440;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + (Math.random() * 8 - 4), gy - (8 + Math.random() * 14));
      ctx.lineTo(gx + 3, gy);
      ctx.fill();
    }

    // Dirt Path Curves in Mid Ground
    ctx.fillStyle = '#b88c53';
    ctx.strokeStyle = '#2d1c0c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(380, 720);
    ctx.bezierCurveTo(550, 700, 700, 760, 850, 740);
    ctx.bezierCurveTo(1000, 720, 1200, 780, 1350, 750);
    ctx.lineTo(1350, 775);
    ctx.bezierCurveTo(1200, 805, 1000, 745, 850, 765);
    ctx.bezierCurveTo(700, 785, 550, 725, 380, 745);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ==================== 3. LEFT 1/3: HENESYS MUSHROOM HOUSE & GARDEN ====================
    ctx.save();
    ctx.translate(220, 420);

    // House Drop Shadow
    ctx.fillStyle = 'rgba(20, 40, 10, 0.35)';
    ctx.beginPath();
    ctx.ellipse(150, 310, 170, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Farm Fence
    ctx.fillStyle = '#b87c48';
    ctx.strokeStyle = '#261408';
    ctx.lineWidth = 4;
    // Fence Rails
    ctx.beginPath();
    ctx.rect(-100, 240, 240, 14);
    ctx.rect(-100, 270, 240, 14);
    ctx.fill();
    ctx.stroke();
    // Fence Posts
    for (let px = -90; px <= 130; px += 55) {
      ctx.beginPath();
      ctx.rect(px, 215, 18, 80);
      ctx.fill();
      ctx.stroke();
      // Post Caps
      ctx.beginPath();
      ctx.moveTo(px - 2, 215);
      ctx.lineTo(px + 9, 202);
      ctx.lineTo(px + 20, 215);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Tilled Garden Soil Bed
    ctx.save();
    ctx.translate(140, 250);
    ctx.fillStyle = '#7a4e29';
    ctx.strokeStyle = '#201004';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(0, 0, 280, 130, 20);
    ctx.fill();
    ctx.stroke();

    // Soil Grooves
    ctx.fillStyle = '#543216';
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      ctx.roundRect(15, 20 + r * 36, 250, 18, 8);
      ctx.fill();
    }

    // Carrots in Row 1
    for (let cx = 40; cx <= 220; cx += 60) {
      // Leafy Tops
      ctx.fillStyle = '#3bc425';
      ctx.beginPath();
      ctx.arc(cx, 22, 10, 0, Math.PI * 2);
      ctx.arc(cx - 6, 16, 8, 0, Math.PI * 2);
      ctx.arc(cx + 6, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      // Carrot Top Crown
      ctx.fillStyle = '#ff6b00';
      ctx.beginPath();
      ctx.ellipse(cx, 28, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cabbages in Row 2 & 3
    for (let bx = 55; bx <= 215; bx += 80) {
      ctx.fillStyle = '#4cd631';
      ctx.strokeStyle = '#1d630d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx, 64, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Inner Leaves
      ctx.fillStyle = '#82f76d';
      ctx.beginPath();
      ctx.arc(bx - 3, 62, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4cd631';
      ctx.beginPath();
      ctx.arc(bx, 100, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#82f76d';
      ctx.beginPath();
      ctx.arc(bx - 3, 98, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // MUSHROOM COTTAGE WALL / STALK
    ctx.fillStyle = '#fff4d4';
    ctx.strokeStyle = '#26160a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(50, 180);
    ctx.bezierCurveTo(40, 280, 60, 310, 150, 315);
    ctx.bezierCurveTo(240, 310, 260, 280, 250, 180);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stalk Wood Grain Cel-Shading
    ctx.fillStyle = 'rgba(215, 185, 130, 0.4)';
    ctx.beginPath();
    ctx.moveTo(50, 180);
    ctx.bezierCurveTo(40, 280, 60, 310, 150, 315);
    ctx.lineTo(150, 180);
    ctx.closePath();
    ctx.fill();

    // Front Wooden Door
    ctx.fillStyle = '#8f5323';
    ctx.strokeStyle = '#241205';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(110, 220);
    ctx.bezierCurveTo(150, 200, 190, 220, 190, 313);
    ctx.lineTo(110, 313);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Door Brass Handle & Window
    ctx.fillStyle = '#ffdc33';
    ctx.beginPath();
    ctx.arc(175, 270, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffea75';
    ctx.beginPath();
    ctx.arc(150, 245, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cozy Glowing Windows (Left & Right)
    function drawWindow(wx, wy) {
      ctx.fillStyle = '#fff176';
      ctx.strokeStyle = '#241205';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(wx, wy, 38, 38, 10);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wx + 19, wy); ctx.lineTo(wx + 19, wy + 38);
      ctx.moveTo(wx, wy + 19); ctx.lineTo(wx + 38, wy + 19);
      ctx.stroke();
    }
    drawWindow(62, 210);
    drawWindow(200, 210);

    // Stone Chimney
    ctx.fillStyle = '#7a7a7a';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.rect(205, 30, 42, 120);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(198, 20, 56, 18);
    ctx.fill();
    ctx.stroke();

    // Chimney Smoke Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    function drawSmoke(smx, smy, smr) {
      ctx.beginPath();
      ctx.arc(smx, smy, smr, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSmoke(226, -5, 16);
    drawSmoke(245, -35, 24);
    drawSmoke(270, -75, 34);
    drawSmoke(305, -125, 46);

    // ORANGE MUSHROOM ROOF CAP
    const shroomCapGrad = ctx.createRadialGradient(110, 90, 20, 150, 120, 180);
    shroomCapGrad.addColorStop(0, '#ff7830');
    shroomCapGrad.addColorStop(0.55, '#e63900');
    shroomCapGrad.addColorStop(1, '#941600');

    ctx.fillStyle = shroomCapGrad;
    ctx.strokeStyle = '#1c0700';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 185);
    ctx.bezierCurveTo(150, -30, 310, 185, 310, 185);
    ctx.bezierCurveTo(150, 230, 0, 185, 0, 185);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glossy White Mushroom Spots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(80, 115, 26, 18, -0.3, 0, Math.PI * 2);
    ctx.ellipse(155, 65, 34, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(235, 120, 28, 18, 0.3, 0, Math.PI * 2);
    ctx.ellipse(155, 155, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Roof Highlight Rim
    ctx.strokeStyle = '#ffa166';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(25, 180);
    ctx.bezierCurveTo(150, 210, 285, 180, 285, 180);
    ctx.stroke();

    ctx.restore();

    // ==================== 4. RIGHT 1/3: POND, CRAFT STATION & MAPLE MASCOTS ====================
    ctx.save();
    ctx.translate(1320, 500);

    // Pond Water Body
    const pondGrad = ctx.createRadialGradient(260, 240, 30, 260, 240, 220);
    pondGrad.addColorStop(0, '#6ee7ff');
    pondGrad.addColorStop(0.5, '#2bb3ff');
    pondGrad.addColorStop(1, '#1165d4');

    ctx.fillStyle = pondGrad;
    ctx.strokeStyle = '#0a2c66';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(260, 250, 230, 125, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pond Water Ripples & Highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(230, 230, 170, 80, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Lily Pads & Lotus Flowers
    function drawLilyPad(lx, ly, lr) {
      ctx.fillStyle = '#32b823';
      ctx.strokeStyle = '#12520a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0.3, Math.PI * 2 - 0.3);
      ctx.lineTo(lx, ly);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    drawLilyPad(150, 230, 26);
    drawLilyPad(330, 270, 32);
    drawLilyPad(220, 300, 22);

    // Pink Lotus Flower
    ctx.fillStyle = '#ff66b3';
    ctx.beginPath();
    ctx.arc(335, 265, 10, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Dock / Pier
    ctx.fillStyle = '#a36737';
    ctx.strokeStyle = '#261407';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.rect(60, 170, 120, 55);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#78441f';
    for (let px = 90; px <= 160; px += 30) {
      ctx.beginPath();
      ctx.rect(px, 170, 4, 55);
      ctx.fill();
    }
    // Dock Legs
    ctx.fillStyle = '#5c3214';
    ctx.beginPath();
    ctx.rect(68, 225, 14, 45);
    ctx.rect(158, 225, 14, 45);
    ctx.fill();
    ctx.stroke();

    // Wooden Crafting Chest
    ctx.fillStyle = '#b56d35';
    ctx.strokeStyle = '#241103';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(-40, 200, 75, 55, 6);
    ctx.fill();
    ctx.stroke();
    // Chest Lid Curved Top
    ctx.fillStyle = '#8f4f20';
    ctx.beginPath();
    ctx.moveTo(-40, 205);
    ctx.bezierCurveTo(-40, 185, 35, 185, 35, 205);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Iron Bands & Golden Lock
    ctx.fillStyle = '#424242';
    ctx.fillRect(-26, 188, 9, 67);
    ctx.fillRect(12, 188, 9, 67);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.roundRect(-8, 218, 14, 18, 3);
    ctx.fill();
    ctx.stroke();

    // Crafting Barrel & Tools
    ctx.fillStyle = '#9e5b29';
    ctx.beginPath();
    ctx.ellipse(55, 135, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(31, 135, 48, 48);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.fillRect(31, 147, 48, 5);
    ctx.fillRect(31, 165, 48, 5);

    // Leaning Wooden Hoe
    ctx.strokeStyle = '#613b19';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-10, 260); ctx.lineTo(35, 110);
    ctx.stroke();
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(-18, 265); ctx.lineTo(-4, 255); ctx.lineTo(-12, 275);
    ctx.closePath();
    ctx.fill();

    // MAPLESTORY MASCOTS
    // 1. ORANGE MUSHROOM (주황버섯) MASCOT
    ctx.save();
    ctx.translate(25, 265);
    // Shadow
    ctx.fillStyle = 'rgba(10, 30, 5, 0.4)';
    ctx.beginPath();
    ctx.ellipse(40, 70, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stalk
    ctx.fillStyle = '#fff4db';
    ctx.strokeStyle = '#261608';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(18, 42);
    ctx.bezierCurveTo(10, 68, 25, 72, 40, 72);
    ctx.bezierCurveTo(55, 72, 70, 68, 62, 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Eyes & Blush
    ctx.fillStyle = '#1c0e03';
    ctx.beginPath();
    ctx.ellipse(30, 52, 3.5, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(50, 52, 3.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8888';
    ctx.beginPath();
    ctx.ellipse(22, 58, 6, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(58, 58, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cap
    const mCapGrad = ctx.createRadialGradient(40, 25, 5, 40, 25, 40);
    mCapGrad.addColorStop(0, '#ff7324');
    mCapGrad.addColorStop(1, '#d62d00');
    ctx.fillStyle = mCapGrad;
    ctx.beginPath();
    ctx.moveTo(2, 44);
    ctx.bezierCurveTo(40, -5, 78, 44, 78, 44);
    ctx.bezierCurveTo(40, 54, 2, 44, 2, 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Spots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(24, 26, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(42, 16, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(60, 30, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // 2. SLIME (슬라임) MASCOT
    ctx.save();
    ctx.translate(230, 125);
    // Shadow
    ctx.fillStyle = 'rgba(10, 30, 5, 0.35)';
    ctx.beginPath();
    ctx.ellipse(35, 58, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Translucent Body
    const slimeGrad = ctx.createRadialGradient(25, 20, 5, 35, 35, 35);
    slimeGrad.addColorStop(0, '#86efac');
    slimeGrad.addColorStop(0.7, '#22c55e');
    slimeGrad.addColorStop(1, '#15803d');
    ctx.fillStyle = slimeGrad;
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(8, 40);
    ctx.bezierCurveTo(4, 12, 35, 8, 66, 12);
    ctx.bezierCurveTo(70, 40, 68, 54, 37, 56);
    ctx.bezierCurveTo(6, 54, 12, 40, 8, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Leaf Nub on Head
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.moveTo(37, 8); ctx.bezierCurveTo(28, -8, 37, -14, 37, -14);
    ctx.bezierCurveTo(46, -8, 37, 8, 37, 8);
    ctx.fill();
    ctx.stroke();
    // Eyes & Smile
    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    ctx.arc(26, 30, 4.5, 0, Math.PI * 2);
    ctx.arc(48, 30, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(37, 34, 7, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Shiny Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(22, 20, 7, 4, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Apple Tree on Right Edge
    ctx.save();
    ctx.translate(330, -110);
    // Trunk
    ctx.fillStyle = '#704322';
    ctx.strokeStyle = '#211105';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(60, 160);
    ctx.bezierCurveTo(40, 270, 75, 310, 75, 330);
    ctx.lineTo(115, 330);
    ctx.bezierCurveTo(100, 250, 105, 160, 105, 160);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Foliage Spheres with Cel Shading
    function drawFoliage(cx, cy, cr, col) {
      ctx.fillStyle = col;
      ctx.strokeStyle = '#103d07';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    drawFoliage(50, 120, 78, '#3fb020');
    drawFoliage(125, 90, 88, '#54cc2d');
    drawFoliage(105, 165, 72, '#2f9614');

    // Red Shiny Apples
    function drawApple(ax, ay) {
      ctx.fillStyle = '#ff2b2b';
      ctx.strokeStyle = '#1f0303';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ax, ay, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ax - 3, ay - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    drawApple(40, 110);
    drawApple(115, 68);
    drawApple(145, 125);
    drawApple(80, 165);
    ctx.restore();

    ctx.restore();

    // ==================== 5. FLOATING RED MAPLE LEAVES ====================
    function drawMapleLeaf(mfx, mfy, mscale, mrot) {
      ctx.save();
      ctx.translate(mfx, mfy);
      ctx.rotate(rad(mrot));
      ctx.scale(mscale, mscale);
      ctx.fillStyle = '#ff3333';
      ctx.strokeStyle = '#2b0303';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(8, -12);  ctx.lineTo(22, -18); ctx.lineTo(14, -4);
      ctx.lineTo(28, 5);    ctx.lineTo(12, 10);  ctx.lineTo(16, 25);
      ctx.lineTo(0, 16);
      ctx.lineTo(-16, 25); ctx.lineTo(-12, 10); ctx.lineTo(-28, 5);
      ctx.lineTo(-14, -4); ctx.lineTo(-22, -18);ctx.lineTo(-8, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Leaf Stem
      ctx.beginPath();
      ctx.moveTo(0, 16); ctx.lineTo(0, 30);
      ctx.stroke();
      ctx.restore();
    }

    drawMapleLeaf(480, 220, 1.2, 15);
    drawMapleLeaf(1120, 180, 0.9, -25);
    drawMapleLeaf(1450, 280, 1.4, 35);
    drawMapleLeaf(820, 320, 0.8, -10);
    drawMapleLeaf(1680, 420, 1.1, 45);

  </script>
</body>
</html>
`;

fs.writeFileSync('scratch/detailed_keyart.html', htmlContent, 'utf8');
console.log('scratch/detailed_keyart.html written');
