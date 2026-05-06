// PaperPuzzleEngine — pure game logic, no rendering
//
// Each grid cell is split diagonally into two triangular pieces:
//   Triangle A — upper-right triangle (TL, TR, BR vertices of cell)
//   Triangle B — lower-left  triangle (TL, BR, BL vertices of cell)
//
// Three families of cuts are generated:
//   hCuts[row][col] — horizontal tear between row `row` and row `row+1`
//   vCuts[col][row] — vertical   tear between col `col` and col `col+1`
//   dCuts[row][col] — diagonal   tear across cell (col, row), TL→BR

function seededRng(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = Math.imul(31, s) + seed.charCodeAt(i) | 0;
  }
  s = s || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

export class PaperPuzzleEngine {
  constructor(level) {
    this.level = level; // { name, cols, rows, pieceW, pieceH, seed, drawImage }
    this.hCuts = [];
    this.vCuts = [];
    this.dCuts = [];
    this.pieces = [];
    this.draggedPiece = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.completed = false;
    this.snapThreshold = 38;
    this._zCount = 0;
    this._buildCuts();
    this._buildPieces();
  }

  _buildCuts() {
    const { cols, rows, pieceW, pieceH, seed } = this.level;
    const diagLen = Math.sqrt(pieceW * pieceW + pieceH * pieceH);

    for (let r = 0; r < rows - 1; r++) {
      this.hCuts[r] = [];
      for (let c = 0; c < cols; c++) {
        this.hCuts[r][c] = this._edge(pieceW, `${seed}_h${r}_${c}`);
      }
    }
    for (let c = 0; c < cols - 1; c++) {
      this.vCuts[c] = [];
      for (let r = 0; r < rows; r++) {
        this.vCuts[c][r] = this._edge(pieceH, `${seed}_v${c}_${r}`);
      }
    }
    // Diagonal cuts — one per cell, always present
    for (let r = 0; r < rows; r++) {
      this.dCuts[r] = [];
      for (let c = 0; c < cols; c++) {
        this.dCuts[r][c] = this._edge(diagLen, `${seed}_d${r}_${c}`);
      }
    }
  }

  // Returns {t, off}[] for a torn edge of `length` px.
  // t=0 and t=1 are pinned at off=0 so corners meet cleanly.
  _edge(length, seedStr) {
    const rng = seededRng(seedStr);
    const n = Math.max(10, Math.floor(length / 6));
    const pts = [{ t: 0, off: 0 }];
    for (let i = 1; i < n; i++) {
      pts.push({ t: i / n, off: (rng() - 0.5) * 58 });
    }
    pts.push({ t: 1, off: 0 });
    // Single smoothing pass — keeps jaggedness while removing single spikes
    for (let i = 1; i < pts.length - 1; i++) {
      pts[i].off = (pts[i - 1].off + pts[i].off * 2 + pts[i + 1].off) / 4;
    }
    return pts;
  }

  // Two triangular pieces per grid cell.
  // Piece centroid is used as the drag/snap anchor point.
  //
  // Cell-local coordinate system (cell centre = origin, cell spans ±pw/2, ±ph/2):
  //   Triangle A centroid in cell-local: ( pw/6, -ph/6)
  //   Triangle B centroid in cell-local: (-pw/6,  ph/6)
  //
  // imgOffX/Y = centroid distance from puzzle top-left, used for image rendering.
  _buildPieces() {
    const { cols, rows, pieceW: pw, pieceH: ph } = this.level;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Triangle A — upper-right (TL, TR, BR)
        this.pieces.push({
          id: (r * cols + c) * 2,
          type: 'A',
          cellCol: c, cellRow: r,
          x: 0, y: 0,
          targetX: 0, targetY: 0,
          imgOffX: c * pw + 2 * pw / 3,
          imgOffY: r * ph + ph / 3,
          rotation: 0,
          snapped: false,
          z: this._zCount++,
        });
        // Triangle B — lower-left (TL, BR, BL)
        this.pieces.push({
          id: (r * cols + c) * 2 + 1,
          type: 'B',
          cellCol: c, cellRow: r,
          x: 0, y: 0,
          targetX: 0, targetY: 0,
          imgOffX: c * pw + pw / 3,
          imgOffY: r * ph + 2 * ph / 3,
          rotation: 0,
          snapped: false,
          z: this._zCount++,
        });
      }
    }
  }

  setTargets(puzzleX, puzzleY) {
    for (const p of this.pieces) {
      p.targetX = puzzleX + p.imgOffX;
      p.targetY = puzzleY + p.imgOffY;
    }
  }

  // Stack all pieces in a small pile at the canvas centre.
  pile(canvasW, canvasH) {
    const { pieceW, pieceH, seed } = this.level;
    const rng = seededRng(seed + '_pile' + Date.now());
    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const spreadX = pieceW * 0.12;
    const spreadY = pieceH * 0.12;
    const maxRot  = Math.PI / 7; // ±~26°

    for (const p of this.pieces) {
      p.x        = cx + (rng() - 0.5) * 2 * spreadX;
      p.y        = cy + (rng() - 0.5) * 2 * spreadY;
      p.rotation = (rng() - 0.5) * 2 * maxRot;
      p.snapped  = false;
    }
  }

  // Hit-test: circumscribed-circle radius works at any rotation angle.
  getPieceAt(x, y) {
    const { pieceW, pieceH } = this.level;
    const r2 = (pieceW * pieceW + pieceH * pieceH) / 4;
    let best = null;
    for (const p of this.pieces) {
      const dx = x - p.x, dy = y - p.y;
      if (dx * dx + dy * dy < r2) {
        if (!best || p.z > best.z) best = p;
      }
    }
    return best;
  }

  startDrag(piece, mx, my) {
    this.draggedPiece = piece;
    this.dragOffsetX = mx - piece.x;
    this.dragOffsetY = my - piece.y;
    piece.z = this._zCount++;
    piece.snapped = false;
    piece.rotation = 0; // straighten paper as you lift it from the pile
  }

  moveDrag(mx, my) {
    if (!this.draggedPiece) return;
    this.draggedPiece.x = mx - this.dragOffsetX;
    this.draggedPiece.y = my - this.dragOffsetY;
  }

  endDrag() {
    if (!this.draggedPiece) return false;
    const p = this.draggedPiece;
    this.draggedPiece = null;
    const dx = p.x - p.targetX;
    const dy = p.y - p.targetY;
    if (Math.sqrt(dx * dx + dy * dy) < this.snapThreshold) {
      p.x = p.targetX;
      p.y = p.targetY;
      p.snapped = true;
      this.completed = this.pieces.every(q => q.snapped);
      return true;
    }
    return false;
  }

  reset(canvasW, canvasH) {
    this.completed = false;
    this._zCount = 0;
    for (const p of this.pieces) {
      p.z = this._zCount++;
      p.snapped = false;
    }
    this.pile(canvasW, canvasH);
  }
}
