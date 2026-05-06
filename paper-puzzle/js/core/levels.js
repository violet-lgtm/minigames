// Level definitions — each level's drawImage(ctx, totalW, totalH) paints
// the complete picture that the puzzle pieces will show fragments of.

function cloud(ctx, x, y, r, color) {
  ctx.fillStyle = color || 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.75, y - r * 0.15, r * 0.72, 0, Math.PI * 2);
  ctx.arc(x - r * 0.65, y - r * 0.05, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
}

function star(ctx, x, y, r) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
  grad.addColorStop(0, 'rgba(255,255,240,1)');
  grad.addColorStop(0.3, 'rgba(255,255,200,0.6)');
  grad.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffde7';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function tree(ctx, x, baseY, trunkH, trunkW, canopyR, foliageColor) {
  ctx.fillStyle = '#5c3d1e';
  ctx.fillRect(x - trunkW / 2, baseY - trunkH, trunkW, trunkH);
  ctx.fillStyle = foliageColor;
  ctx.beginPath();
  ctx.arc(x, baseY - trunkH, canopyR, 0, Math.PI * 2);
  ctx.fill();
}

export const LEVELS = [
  // ────────────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Sunrise',
    difficulty: 'Easy',
    cols: 2,
    rows: 2,
    drawImage(ctx, w, h) {
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
      sky.addColorStop(0, '#1c0e3f');
      sky.addColorStop(0.28, '#c0392b');
      sky.addColorStop(0.58, '#e8724a');
      sky.addColorStop(1, '#f8d16b');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.72);

      // Sun glow
      const sg = ctx.createRadialGradient(w * 0.5, h * 0.64, 0, w * 0.5, h * 0.64, w * 0.28);
      sg.addColorStop(0, 'rgba(255,248,190,0.72)');
      sg.addColorStop(0.55, 'rgba(255,160,40,0.3)');
      sg.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, h * 0.28, w, h * 0.44);

      // Sun disc
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.64, w * 0.078, 0, Math.PI * 2);
      ctx.fillStyle = '#fff9c4';
      ctx.fill();

      // Landscape silhouette
      ctx.fillStyle = '#0e1f0e';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.70);
      ctx.bezierCurveTo(w * 0.12, h * 0.56, w * 0.28, h * 0.63, w * 0.42, h * 0.69);
      ctx.bezierCurveTo(w * 0.56, h * 0.75, w * 0.72, h * 0.59, w, h * 0.66);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Ground gradient
      const grd = ctx.createLinearGradient(0, h * 0.70, 0, h);
      grd.addColorStop(0, '#2e5a27');
      grd.addColorStop(1, '#1a3318');
      ctx.fillStyle = grd;
      ctx.fillRect(0, h * 0.72, w, h * 0.28);

      // Clouds
      cloud(ctx, w * 0.18, h * 0.18, w * 0.1, 'rgba(255,190,140,0.55)');
      cloud(ctx, w * 0.75, h * 0.12, w * 0.13, 'rgba(255,180,130,0.5)');
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 2,
    name: 'Starry Night',
    difficulty: 'Easy',
    cols: 2,
    rows: 2,
    drawImage(ctx, w, h) {
      // Night sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.78);
      sky.addColorStop(0, '#05091a');
      sky.addColorStop(0.5, '#0d1b4b');
      sky.addColorStop(1, '#1a2d6b');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.78);

      // Stars
      const rng = (() => { let s = 7; return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0x100000000; }; })();
      for (let i = 0; i < 80; i++) {
        const sx = rng() * w;
        const sy = rng() * h * 0.72;
        const sr = 0.5 + rng() * 1.2;
        star(ctx, sx, sy, sr);
      }

      // Crescent moon
      const mx = w * 0.75, my = h * 0.16, mr = w * 0.07;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fillStyle = '#fff9c4';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx + mr * 0.42, my - mr * 0.1, mr * 0.82, 0, Math.PI * 2);
      ctx.fillStyle = '#0d1b4b';
      ctx.fill();

      // Dark treeline
      ctx.fillStyle = '#050e05';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.78);
      for (let x = 0; x <= w; x += w / 14) {
        const peak = h * 0.66 + Math.sin(x * 0.03) * h * 0.06 + ((x / w * 7) % 1 > 0.5 ? -h * 0.04 : 0);
        ctx.lineTo(x, peak);
      }
      ctx.lineTo(w, h * 0.78);
      ctx.fill();

      // Ground
      ctx.fillStyle = '#06120a';
      ctx.fillRect(0, h * 0.78, w, h * 0.22);
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 3,
    name: 'Tropical Beach',
    difficulty: 'Medium',
    cols: 3,
    rows: 2,
    drawImage(ctx, w, h) {
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.52);
      sky.addColorStop(0, '#1565c0');
      sky.addColorStop(1, '#64b5f6');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.52);

      // Clouds
      cloud(ctx, w * 0.2, h * 0.12, w * 0.08);
      cloud(ctx, w * 0.55, h * 0.08, w * 0.1);
      cloud(ctx, w * 0.82, h * 0.14, w * 0.07);

      // Ocean
      const ocean = ctx.createLinearGradient(0, h * 0.52, 0, h * 0.74);
      ocean.addColorStop(0, '#0097a7');
      ocean.addColorStop(1, '#00bcd4');
      ctx.fillStyle = ocean;
      ctx.fillRect(0, h * 0.52, w, h * 0.22);

      // Wave lines
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const wy = h * 0.56 + i * h * 0.03;
        ctx.beginPath();
        ctx.moveTo(0, wy);
        for (let x = 0; x <= w; x += 12) {
          ctx.lineTo(x, wy + Math.sin(x * 0.04 + i) * 3);
        }
        ctx.stroke();
      }

      // Sandy beach
      const sand = ctx.createLinearGradient(0, h * 0.74, 0, h);
      sand.addColorStop(0, '#f4d58d');
      sand.addColorStop(1, '#e6c46a');
      ctx.fillStyle = sand;
      ctx.fillRect(0, h * 0.74, w, h * 0.26);

      // Palm tree left
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(w * 0.08, h * 0.38, w * 0.025, h * 0.38);
      const leaves = [
        [w * 0.093, h * 0.38, -w * 0.15, -h * 0.12],
        [w * 0.093, h * 0.38, w * 0.18, -h * 0.08],
        [w * 0.093, h * 0.38, -w * 0.08, -h * 0.18],
        [w * 0.093, h * 0.38, w * 0.1, -h * 0.17],
        [w * 0.093, h * 0.38, 0, -h * 0.2],
      ];
      ctx.fillStyle = '#2e7d32';
      for (const [bx, by, lx, ly] of leaves) {
        ctx.beginPath();
        ctx.ellipse(bx + lx / 2, by + ly / 2, Math.abs(lx) / 2 + 4, Math.abs(ly) / 2 + 4, Math.atan2(ly, lx), 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant island
      ctx.fillStyle = '#388e3c';
      ctx.beginPath();
      ctx.ellipse(w * 0.82, h * 0.5, w * 0.06, h * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 4,
    name: 'Mountain Lake',
    difficulty: 'Medium',
    cols: 2,
    rows: 3,
    drawImage(ctx, w, h) {
      const mid = h * 0.5; // water line

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, mid);
      sky.addColorStop(0, '#5c85d6');
      sky.addColorStop(1, '#b8d4f0');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, mid);

      // Mountain peaks
      const peaks = [
        [0, mid, w * 0.25, h * 0.06, w * 0.5, mid],
        [w * 0.3, mid, w * 0.6, h * 0.02, w * 0.9, mid],
        [w * 0.6, mid, w * 0.78, h * 0.1, w, mid],
        [w * 0.8, mid, w, h * 0.08, w, mid],
      ];
      const snowLine = 0.6; // snow covers top 40% of each peak

      for (const [x0, y0, px, py, x1, y1] of peaks) {
        // Rock body
        ctx.fillStyle = '#546e7a';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(px, py);
        ctx.lineTo(x1, y1);
        ctx.fill();

        // Snow cap (upper triangle)
        const snowY = py + (y0 - py) * (1 - snowLine);
        const snowXL = x0 + (px - x0) * (1 - snowLine);
        const snowXR = x1 + (px - x1) * (1 - snowLine);
        ctx.fillStyle = '#eceff1';
        ctx.beginPath();
        ctx.moveTo(snowXL, snowY);
        ctx.lineTo(px, py);
        ctx.lineTo(snowXR, snowY);
        ctx.fill();
      }

      // Lake (bottom half)
      const lake = ctx.createLinearGradient(0, mid, 0, h);
      lake.addColorStop(0, '#4fc3f7');
      lake.addColorStop(1, '#0277bd');
      ctx.fillStyle = lake;
      ctx.fillRect(0, mid, w, h - mid);

      // Reflection of mountains (flipped, faded)
      ctx.save();
      ctx.translate(0, h);
      ctx.scale(1, -1);
      ctx.globalAlpha = 0.38;
      for (const [x0, y0, px, py, x1, y1] of peaks) {
        ctx.fillStyle = '#546e7a';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(px, py);
        ctx.lineTo(x1, y1);
        ctx.fill();
      }
      ctx.restore();

      // Horizontal ripple lines in lake
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const ry = mid + (i + 0.5) * (h - mid) / 8;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        for (let x = 0; x <= w; x += 10) {
          ctx.lineTo(x, ry + Math.sin(x * 0.06 + i * 1.7) * 2);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Foreground pine trees
      ctx.fillStyle = '#1b5e20';
      for (let i = 0; i < 5; i++) {
        const tx = (i / 4) * w;
        const ty = mid;
        const tr = h * 0.04 + (i % 2) * h * 0.01;
        ctx.beginPath();
        ctx.moveTo(tx, ty - tr * 2.5);
        ctx.lineTo(tx - tr, ty);
        ctx.lineTo(tx + tr, ty);
        ctx.fill();
      }
    },
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 5,
    name: 'Autumn Forest',
    difficulty: 'Hard',
    cols: 3,
    rows: 3,
    drawImage(ctx, w, h) {
      // Sky (barely visible through canopy)
      ctx.fillStyle = '#b3cde0';
      ctx.fillRect(0, 0, w, h);

      // Ground
      const ground = ctx.createLinearGradient(0, h * 0.72, 0, h);
      ground.addColorStop(0, '#5d4037');
      ground.addColorStop(1, '#3e2723');
      ctx.fillStyle = ground;
      ctx.fillRect(0, h * 0.72, w, h * 0.28);

      // Leaf litter on ground
      const rng = (() => { let s = 99; return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0x100000000; }; })();
      const leafColors = ['#e65100', '#bf360c', '#f57f17', '#e64a19', '#ff8f00'];
      for (let i = 0; i < 60; i++) {
        const lx = rng() * w;
        const ly = h * 0.74 + rng() * h * 0.24;
        const lr = 4 + rng() * 7;
        ctx.fillStyle = leafColors[Math.floor(rng() * leafColors.length)];
        ctx.beginPath();
        ctx.ellipse(lx, ly, lr, lr * 0.55, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tree trunks
      const treePositions = [0.12, 0.28, 0.46, 0.62, 0.78, 0.92];
      for (const tx of treePositions) {
        const trunkW = w * 0.038 + (tx % 0.3) * w * 0.012;
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(tx * w - trunkW / 2, h * 0.28, trunkW, h * 0.55);
        // Bark texture lines
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        for (let bi = 0; bi < 6; bi++) {
          const by = h * 0.32 + bi * h * 0.07;
          ctx.beginPath();
          ctx.moveTo(tx * w - trunkW / 2, by);
          ctx.bezierCurveTo(tx * w, by + 4, tx * w, by - 4, tx * w + trunkW / 2, by);
          ctx.stroke();
        }
      }

      // Canopy clusters — layered from back to front
      const canopyColors = [
        ['#e65100', '#f57f17'],
        ['#bf360c', '#e64a19'],
        ['#ff8f00', '#ffa000'],
        ['#c62828', '#ef9a9a'],
      ];
      for (let layer = 0; layer < 3; layer++) {
        const baseY = h * (0.08 + layer * 0.07);
        for (let ci = 0; ci < 9 + layer * 3; ci++) {
          const cx = rng() * w * 1.1 - w * 0.05;
          const cy = baseY + rng() * h * 0.22;
          const cr = w * 0.07 + rng() * w * 0.1;
          const palette = canopyColors[Math.floor(rng() * canopyColors.length)];
          const grad = ctx.createRadialGradient(cx - cr * 0.2, cy - cr * 0.3, cr * 0.1, cx, cy, cr);
          grad.addColorStop(0, palette[0]);
          grad.addColorStop(1, palette[1]);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, cr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Sunlight beams through canopy
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#fff9c4';
      for (let sb = 0; sb < 5; sb++) {
        const bx = (sb / 4) * w * 0.8 + w * 0.1;
        ctx.beginPath();
        ctx.moveTo(bx - 8, 0);
        ctx.lineTo(bx + 8, 0);
        ctx.lineTo(bx + 30, h * 0.72);
        ctx.lineTo(bx - 30, h * 0.72);
        ctx.fill();
      }
      ctx.restore();
    },
  },
];
