// PaperPuzzleRenderer — all canvas drawing

export class PaperPuzzleRenderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;
    this._imgCache = null;
    this._puzzleX = 0;
    this._puzzleY = 0;
    this._snapFlashes = new Map(); // pieceId → snap timestamp
    this._bgCanvas = null;
    this._pathCache = new Map(); // pieceId → Path2D (shape never changes)
  }

  setPuzzleOrigin(x, y) {
    this._puzzleX = x;
    this._puzzleY = y;
  }

  invalidateCache() {
    this._imgCache = null;
    this._bgCanvas = null;
    this._pathCache = new Map();
  }

  render(timestamp) {
    const { ctx, canvas, engine } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawBackground();
    this._drawGuide();

    // Snapped pieces render first (bottom), then unsnapped by z order.
    // Reuse the same array to avoid per-frame allocation.
    if (!this._sorted) this._sorted = [];
    const sorted = this._sorted;
    sorted.length = 0;
    for (const p of engine.pieces) sorted.push(p);
    sorted.sort((a, b) => {
      if (a.snapped !== b.snapped) return a.snapped ? -1 : 1;
      return a.z - b.z;
    });
    for (const piece of sorted) {
      if (piece === engine.draggedPiece) continue;
      this._drawPiece(piece, false, timestamp);
    }

    if (engine.draggedPiece) {
      this._drawPiece(engine.draggedPiece, true, timestamp);
    }

    if (engine.completed) {
      this._drawCompletion();
    }
  }

  // ── Background ──────────────────────────────────────────────────────────────

  _drawBackground() {
    if (this._bgCanvas) { this.ctx.drawImage(this._bgCanvas, 0, 0); return; }
    const { canvas } = this;
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const c = off.getContext('2d');

    c.fillStyle = '#c4976a';
    c.fillRect(0, 0, off.width, off.height);

    const vig = c.createRadialGradient(
      off.width / 2, off.height / 2, off.width * 0.2,
      off.width / 2, off.height / 2, off.width * 0.85,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.35)');
    c.fillStyle = vig;
    c.fillRect(0, 0, off.width, off.height);

    const rng = this._rng(42);
    c.globalAlpha = 0.12;
    for (let i = 0; i < 32; i++) {
      const y = (i / 32) * off.height + (rng() - 0.5) * 30;
      const amp = 4 + rng() * 8;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= off.width; x += 18) {
        c.lineTo(x, y + Math.sin(x * 0.018 + i * 1.3) * amp);
      }
      c.strokeStyle = rng() > 0.5 ? '#7a4e1a' : '#a06020';
      c.lineWidth = 0.7 + rng() * 1.6;
      c.stroke();
    }
    c.globalAlpha = 1;

    this._bgCanvas = off;
    this.ctx.drawImage(off, 0, 0);
  }

  // ── Puzzle outline ──────────────────────────────────────────────────────────

  _drawGuide() {
    const { ctx, engine, _puzzleX: px, _puzzleY: py } = this;
    const { imageW: W, imageH: H } = engine.level;

    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, W, H);
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Image cache ─────────────────────────────────────────────────────────────

  _getImg() {
    if (this._imgCache) return this._imgCache;
    const { imageW: w, imageH: h, drawImage } = this.engine.level;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawImage(off.getContext('2d'), w, h);
    this._imgCache = off;
    return off;
  }

  // ── Piece path (piece-local coords, centroid = 0,0) ─────────────────────────
  //
  // Vertices are stored in puzzle-space; we subtract the centroid (cx,cy)
  // to get piece-local coords for the path.
  //
  // Each edge is either:
  //   isBorder=true  → straight lineTo next vertex
  //   isBorder=false → world-space cut points from cutMap, subtracted by centroid,
  //                    traversed forward or reversed depending on canonical direction

  _piecePath(piece) {
    const { verts, edges, cx, cy } = piece;
    const { cutMap } = this.engine;
    const path = new Path2D();

    path.moveTo(verts[0].x - cx, verts[0].y - cy);

    const n = verts.length;
    for (let i = 0; i < n; i++) {
      const edge = edges[i];
      const nextV = verts[(i + 1) % n];

      if (edge.isBorder) {
        path.lineTo(nextV.x - cx, nextV.y - cy);
      } else {
        const pts = cutMap.get(edge.key);
        if (edge.reversed) {
          for (let j = pts.length - 1; j >= 0; j--) {
            path.lineTo(pts[j].x - cx, pts[j].y - cy);
          }
        } else {
          for (const pt of pts) {
            path.lineTo(pt.x - cx, pt.y - cy);
          }
        }
      }
    }

    path.closePath();
    return path;
  }

  // ── Draw a single piece ─────────────────────────────────────────────────────

  // Return a cached Path2D for the piece — built once, reused every frame.
  _getPath(piece) {
    let p = this._pathCache.get(piece.id);
    if (!p) { p = this._piecePath(piece); this._pathCache.set(piece.id, p); }
    return p;
  }

  _drawPiece(piece, isDragged, timestamp) {
    const { ctx } = this;
    const img = this._getImg();
    const path = this._getPath(piece);

    ctx.save();
    ctx.translate(piece.x, piece.y);
    if (piece.rotation) ctx.rotate(piece.rotation);
    if (isDragged) ctx.scale(1.045, 1.045);

    // Drop shadow — fill shape so canvas shadow API casts it correctly
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = isDragged ? 22 : 10;
    ctx.shadowOffsetX = isDragged ? 6 : 2;
    ctx.shadowOffsetY = isDragged ? 14 : 6;
    ctx.fillStyle = '#555';
    ctx.fill(path);
    ctx.restore();

    // Clip to piece shape and render image portion
    ctx.save();
    ctx.clip(path);
    ctx.drawImage(img, -piece.imgOffX, -piece.imgOffY);
    ctx.restore();

    // Paper-edge: white highlight then dark shadow line
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = 2.5;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke(path);

    ctx.restore();

    // Snap-flash green glow (outside main save/restore to avoid being clipped)
    if (piece.snapped) {
      const flash = this._snapFlashes.get(piece.id);
      let alpha = 0.3;
      if (flash !== undefined) {
        const age = timestamp - flash;
        alpha = age < 400 ? 0.85 * (1 - age / 400) + 0.3 : 0.3;
      }
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.strokeStyle = `rgba(80,220,80,${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke(this._getPath(piece));
      ctx.restore();
    }
  }

  recordSnap(piece, timestamp) {
    this._snapFlashes.set(piece.id, timestamp);
  }

  // ── Snap proximity hint ─────────────────────────────────────────────────────

  _drawSnapHint(piece) {
    const { ctx } = this;
    const dx = piece.x - piece.targetX;
    const dy = piece.y - piece.targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Show hint within 2.5× the piece's bounding radius
    const threshold = Math.sqrt(piece.boundR2) * 2.5;
    if (dist > threshold) return;

    const alpha = (1 - dist / threshold) * 0.65;
    ctx.save();
    ctx.translate(piece.targetX, piece.targetY);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(120,210,255,0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.stroke(this._piecePath(piece));
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Completion overlay ──────────────────────────────────────────────────────

  _drawCompletion() {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.font = 'bold 52px "Segoe UI", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Puzzle Complete!', cx, cy - 28);

    ctx.font = '26px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillText('All pieces in place!', cx, cy + 24);
    ctx.restore();
  }

  // ── Deterministic RNG for background ────────────────────────────────────────

  _rng(seed) {
    let s = seed | 1;
    return () => {
      s ^= s << 13; s ^= s >> 17; s ^= s << 5;
      return (s >>> 0) / 0x100000000;
    };
  }
}
