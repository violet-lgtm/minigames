// PaperPuzzleRenderer — all canvas drawing

export class PaperPuzzleRenderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;
    this._imgCache = null;
    this._puzzleX = 0;
    this._puzzleY = 0;
    this._snapFlashes = new Map(); // pieceId → timestamp of snap
    this._bgCanvas = null;
  }

  setPuzzleOrigin(x, y) {
    this._puzzleX = x;
    this._puzzleY = y;
  }

  invalidateCache() {
    this._imgCache = null;
    this._bgCanvas = null;
  }

  render(timestamp) {
    const { ctx, canvas, engine } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawBackground();
    this._drawGuide();

    const sorted = [...engine.pieces].sort((a, b) => a.z - b.z);
    for (const piece of sorted) {
      if (piece === engine.draggedPiece) continue;
      this._drawPiece(piece, false, timestamp);
    }

    if (engine.draggedPiece) {
      this._drawSnapHint(engine.draggedPiece);
      this._drawPiece(engine.draggedPiece, true, timestamp);
    }

    if (engine.completed) {
      this._drawCompletion();
    }
  }

  // ── Background ──────────────────────────────────────────────────────────────

  _drawBackground() {
    if (this._bgCanvas) {
      this.ctx.drawImage(this._bgCanvas, 0, 0);
      return;
    }
    const { canvas } = this;
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const c = off.getContext('2d');

    // Cork/wood base colour
    c.fillStyle = '#c4976a';
    c.fillRect(0, 0, off.width, off.height);

    // Subtle vignette
    const vig = c.createRadialGradient(
      off.width / 2, off.height / 2, off.width * 0.2,
      off.width / 2, off.height / 2, off.width * 0.85
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.35)');
    c.fillStyle = vig;
    c.fillRect(0, 0, off.width, off.height);

    // Wood grain lines
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

  // ── Puzzle outline guide ────────────────────────────────────────────────────

  _drawGuide() {
    const { ctx, engine, _puzzleX: px, _puzzleY: py } = this;
    const { cols, rows, pieceW, pieceH } = engine.level;
    const W = cols * pieceW;
    const H = rows * pieceH;

    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, W, H);
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let c = 1; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(px + c * pieceW, py);
      ctx.lineTo(px + c * pieceW, py + H);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(px, py + r * pieceH);
      ctx.lineTo(px + W, py + r * pieceH);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Image cache ─────────────────────────────────────────────────────────────

  _getImg() {
    if (this._imgCache) return this._imgCache;
    const { cols, rows, pieceW, pieceH, drawImage } = this.engine.level;
    const w = cols * pieceW;
    const h = rows * pieceH;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawImage(off.getContext('2d'), w, h);
    this._imgCache = off;
    return off;
  }

  // ── Torn edge path for a triangular piece (piece-local coords, centroid = 0,0) ─
  //
  // Each grid cell is split along its TL→BR diagonal into:
  //   Triangle A  (upper-right): vertices TL, TR, BR of cell
  //   Triangle B  (lower-left):  vertices TL, BR, BL of cell
  //
  // Piece-local vertex positions (pw = pieceW, ph = pieceH):
  //   A: TL=(-2pw/3,-ph/3)  TR=(pw/3,-ph/3)  BR=(pw/3, 2ph/3)
  //   B: TL=(-pw/3,-2ph/3)  BR=(2pw/3,ph/3)  BL=(-pw/3, ph/3)
  //
  // Diagonal cut points at parameter t (0→1, TL→BR of cell):
  //   cell-local base = (-pw/2 + t*pw, -ph/2 + t*ph)
  //   perp direction  = (-ph, pw) / diagLen   (rotated 90° CCW from diagonal)
  //   A piece-local   = base + off*perp - centroid_A
  //   B piece-local   = base + off*perp - centroid_B

  _piecePath(piece) {
    const { type, cellCol: c, cellRow: r } = piece;
    const { cols, rows, pieceW: pw, pieceH: ph } = this.engine.level;
    const { hCuts, vCuts, dCuts } = this.engine;
    const diagLen = Math.sqrt(pw * pw + ph * ph);
    const perpX = -ph / diagLen; // perpendicular to diagonal
    const perpY =  pw / diagLen;
    const path = new Path2D();

    if (type === 'A') {
      // ── Triangle A: TL → (top edge) → TR → (right edge) → BR → (diagonal rev) → TL ──

      path.moveTo(-2 * pw / 3, -ph / 3); // TL

      // TOP edge (left → right): shared with A of cell (c, r-1) bottom / border
      if (r === 0) {
        path.lineTo(pw / 3, -ph / 3);
      } else {
        for (const pt of hCuts[r - 1][c]) {
          // hCut point cell-local: (-pw/2 + t*pw, -ph/2 + off)
          // piece-local A: subtract centroid (pw/6, -ph/6)
          path.lineTo(-2 * pw / 3 + pt.t * pw, -ph / 3 + pt.off);
        }
      }

      // RIGHT edge (top → bottom): shared with B of cell (c+1, r) left / border
      if (c === cols - 1) {
        path.lineTo(pw / 3, 2 * ph / 3);
      } else {
        for (const pt of vCuts[c][r]) {
          // vCut point cell-local: (pw/2 + off, -ph/2 + t*ph)
          // piece-local A: subtract centroid (pw/6, -ph/6)
          path.lineTo(pw / 3 + pt.off, -ph / 3 + pt.t * ph);
        }
      }

      // DIAGONAL (BR → TL, reversed): shared with triangle B in same cell
      const dcut = dCuts[r][c];
      for (let i = dcut.length - 1; i >= 0; i--) {
        const pt = dcut[i];
        path.lineTo(
          -2 * pw / 3 + pt.t * pw + pt.off * perpX,
          -ph / 3     + pt.t * ph + pt.off * perpY,
        );
      }

      path.closePath();

    } else {
      // ── Triangle B: TL → (diagonal fwd) → BR → (bottom edge rev) → BL → (left edge rev) → TL ──

      path.moveTo(-pw / 3, -2 * ph / 3); // TL

      // DIAGONAL (TL → BR, forward): shared with triangle A in same cell
      for (const pt of dCuts[r][c]) {
        path.lineTo(
          -pw / 3 + pt.t * pw + pt.off * perpX,
          -2 * ph / 3 + pt.t * ph + pt.off * perpY,
        );
      }

      // BOTTOM edge (right → left, reversed): shared with B of cell (c, r+1) top / border
      if (r === rows - 1) {
        path.lineTo(-pw / 3, ph / 3);
      } else {
        const cut = hCuts[r][c];
        for (let i = cut.length - 1; i >= 0; i--) {
          // piece-local B: subtract centroid (-pw/6, ph/6)
          path.lineTo(-pw / 3 + cut[i].t * pw, ph / 3 + cut[i].off);
        }
      }

      // LEFT edge (bottom → top, reversed): shared with A of cell (c-1, r) right / border
      if (c === 0) {
        path.lineTo(-pw / 3, -2 * ph / 3);
      } else {
        const cut = vCuts[c - 1][r];
        for (let i = cut.length - 1; i >= 0; i--) {
          // piece-local B: subtract centroid (-pw/6, ph/6)
          path.lineTo(-pw / 3 + cut[i].off, -2 * ph / 3 + cut[i].t * ph);
        }
      }

      path.closePath();
    }

    return path;
  }

  // ── Draw a single piece ─────────────────────────────────────────────────────

  _drawPiece(piece, isDragged, timestamp) {
    const { ctx } = this;
    const img = this._getImg();
    const path = this._piecePath(piece);

    ctx.save();
    ctx.translate(piece.x, piece.y);
    if (piece.rotation) ctx.rotate(piece.rotation);
    if (isDragged) ctx.scale(1.045, 1.045);

    // Drop shadow: fill the shape, canvas shadow creates the blur
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = isDragged ? 22 : 10;
    ctx.shadowOffsetX = isDragged ? 6 : 2;
    ctx.shadowOffsetY = isDragged ? 14 : 6;
    ctx.fillStyle = '#555';
    ctx.fill(path);
    ctx.restore(); // shadow gone

    // Clip to piece shape and draw the image
    ctx.save();
    ctx.clip(path);
    ctx.drawImage(img, -piece.imgOffX, -piece.imgOffY);
    ctx.restore();

    // Paper-edge highlight (white outer, dark inner)
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = 2.5;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke(path);

    ctx.restore();

    // Snap-flash green glow (drawn in canvas coords to avoid clip issues)
    if (piece.snapped) {
      const flash = this._snapFlashes.get(piece.id);
      let alpha = 0.55;
      if (flash !== undefined) {
        const age = timestamp - flash;
        alpha = age < 400 ? 0.85 * (1 - age / 400) + 0.3 : 0.3;
      }
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.strokeStyle = `rgba(80,220,80,${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke(this._piecePath(piece));
      ctx.restore();
    }
  }

  recordSnap(piece, timestamp) {
    this._snapFlashes.set(piece.id, timestamp);
  }

  // ── Snap proximity hint ─────────────────────────────────────────────────────

  _drawSnapHint(piece) {
    const { ctx } = this;
    const { pieceW: pw } = this.engine.level;
    const dx = piece.x - piece.targetX;
    const dy = piece.y - piece.targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > pw * 1.6) return;

    const alpha = (1 - dist / (pw * 1.6)) * 0.65;
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

  // ── Simple deterministic RNG ────────────────────────────────────────────────

  _rng(seed) {
    let s = seed | 1;
    return () => {
      s ^= s << 13; s ^= s >> 17; s ^= s << 5;
      return (s >>> 0) / 0x100000000;
    };
  }
}
