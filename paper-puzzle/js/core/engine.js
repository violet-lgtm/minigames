// PaperPuzzleEngine — irregular triangulated puzzle
//
// The image is split by a seeded point-insertion triangulation:
//   • 4 rectangle corners + N random interior points are triangulated
//   • Each triangle becomes one torn-paper piece
//   • Internal edges get jagged torn paths; boundary edges are straight
//
// No grid structure exists — triangles vary freely in size and shape.

function seededRng(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = Math.imul(31, s) + seed.charCodeAt(i) | 0;
  }
  s = s || 1;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

// Is point p strictly inside CW triangle (a,b,c)?  (Y-down screen coords)
function ptInTri(p, a, b, c) {
  const s = (u, v) => (v.x - u.x) * (p.y - u.y) - (v.y - u.y) * (p.x - u.x);
  return s(a, b) >= 0 && s(b, c) >= 0 && s(c, a) >= 0;
}

// Edge key: always lower-idx vertex first so shared edges map to the same string
function eKey(a, b) {
  return a.idx < b.idx ? `${a.idx}_${b.idx}` : `${b.idx}_${a.idx}`;
}

export class PaperPuzzleEngine {
  constructor(level) {
    // level: { name, seed, imageW, imageH, numPoints, drawImage }
    this.level = level;
    this.cutMap = new Map(); // edgeKey → [{x,y}…] world-space torn points va→vb
    this.pieces = [];
    this.draggedPiece = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.completed = false;
    this.snapThreshold = 36;
    this._zCount = 0;
    this._buildMesh();
  }

  // ── Mesh construction ───────────────────────────────────────────────────────

  _buildMesh() {
    const { imageW: W, imageH: H, numPoints: N, seed } = this.level;
    const rng = seededRng(seed + '_mesh');

    // Vertices — 4 corners, then N random interior points
    const margin = Math.min(W, H) * 0.14;
    const verts = [
      { x: 0, y: 0, idx: 0 },
      { x: W, y: 0, idx: 1 },
      { x: W, y: H, idx: 2 },
      { x: 0, y: H, idx: 3 },
    ];
    for (let i = 0; i < N; i++) {
      verts.push({
        x: margin + rng() * (W - 2 * margin),
        y: margin + rng() * (H - 2 * margin),
        idx: 4 + i,
      });
    }

    // Seed triangulation: two CW right-triangles covering the rectangle
    let tris = [
      [verts[0], verts[1], verts[2]], // TL TR BR
      [verts[0], verts[2], verts[3]], // TL BR BL
    ];

    // Insert each interior vertex — split its containing triangle into 3
    for (let i = 4; i < verts.length; i++) {
      const p = verts[i];
      const hit = tris.findIndex(t => ptInTri(p, t[0], t[1], t[2]));
      if (hit === -1) continue;
      const [t] = tris.splice(hit, 1);
      tris.push([t[0], t[1], p], [t[1], t[2], p], [t[2], t[0], p]);
    }

    // Count how many triangles reference each edge
    const edgeCnt = new Map();
    for (const tri of tris) {
      for (let e = 0; e < 3; e++) {
        const k = eKey(tri[e], tri[(e + 1) % 3]);
        edgeCnt.set(k, (edgeCnt.get(k) || 0) + 1);
      }
    }

    // Generate torn-edge cut paths for internal edges (count === 2)
    const cutRng = seededRng(seed + '_cuts');
    for (const [key, cnt] of edgeCnt) {
      if (cnt !== 2) continue;
      const [ia, ib] = key.split('_').map(Number);
      const va = verts.find(v => v.idx === ia);
      const vb = verts.find(v => v.idx === ib);
      this.cutMap.set(key, this._genCut(va, vb, cutRng));
    }

    // Build one piece per triangle
    for (let i = 0; i < tris.length; i++) {
      const tri = tris[i];
      const cx = (tri[0].x + tri[1].x + tri[2].x) / 3;
      const cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
      // Bounding circle radius² for hit-testing (invariant under rotation)
      const boundR2 = Math.max(...tri.map(v => (v.x - cx) ** 2 + (v.y - cy) ** 2));

      const edges = tri.map((a, e) => {
        const b = tri[(e + 1) % 3];
        const key = eKey(a, b);
        return {
          key,
          isBorder: edgeCnt.get(key) === 1,
          // Canonical cut direction is lower-idx→higher-idx.
          // If this triangle traverses a→b with a.idx > b.idx, iterate cut reversed.
          reversed: a.idx > b.idx,
        };
      });

      this.pieces.push({
        id: i,
        verts: tri,     // [{x,y,idx}] in puzzle-space (0,0 = puzzle top-left)
        cx, cy,         // centroid in puzzle-space
        imgOffX: cx,    // used for image positioning and target calculation
        imgOffY: cy,
        boundR2,
        edges,
        x: 0, y: 0,    // current canvas position of centroid
        targetX: 0, targetY: 0,
        rotation: 0,
        snapped: false,
        z: this._zCount++,
      });
    }
  }

  // World-space torn-edge points from va to vb (canonical: va.idx < vb.idx)
  _genCut(va, vb, rng) {
    const dx = vb.x - va.x, dy = vb.y - va.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const n = Math.max(8, Math.floor(len / 7));
    const perpX = -dy / len, perpY = dx / len; // CCW perpendicular

    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const off = (i > 0 && i < n) ? (rng() - 0.5) * 54 : 0;
      pts.push({ x: va.x + t * dx + off * perpX, y: va.y + t * dy + off * perpY });
    }
    // Single smoothing pass (endpoints pinned at va and vb)
    for (let i = 1; i < pts.length - 1; i++) {
      pts[i].x = (pts[i - 1].x + pts[i].x * 2 + pts[i + 1].x) / 4;
      pts[i].y = (pts[i - 1].y + pts[i].y * 2 + pts[i + 1].y) / 4;
    }
    return pts;
  }

  // ── Game state ──────────────────────────────────────────────────────────────

  setTargets(puzzleX, puzzleY) {
    for (const p of this.pieces) {
      p.targetX = puzzleX + p.imgOffX;
      p.targetY = puzzleY + p.imgOffY;
    }
  }

  pile(canvasW, canvasH) {
    const { imageW, imageH, seed } = this.level;
    const rng = seededRng(seed + '_pile' + Date.now());
    const cx = canvasW / 2, cy = canvasH / 2;
    const sx = imageW * 0.10, sy = imageH * 0.10;
    const maxRot = Math.PI / 7;
    for (const p of this.pieces) {
      p.x = cx + (rng() - 0.5) * 2 * sx;
      p.y = cy + (rng() - 0.5) * 2 * sy;
      p.rotation = (rng() - 0.5) * 2 * maxRot;
      p.snapped = false;
    }
  }

  getPieceAt(x, y) {
    let best = null;
    for (const p of this.pieces) {
      // Quick bounding-circle reject before the exact test
      const dx = x - p.x, dy = y - p.y;
      if (dx * dx + dy * dy >= p.boundR2) continue;

      // Transform click into piece-local space (undo translation + rotation)
      let lx = dx, ly = dy;
      if (p.rotation) {
        const cos = Math.cos(-p.rotation);
        const sin = Math.sin(-p.rotation);
        lx = dx * cos - dy * sin;
        ly = dx * sin + dy * cos;
      }

      // Exact point-in-triangle test using piece-local vertices (centroid = 0,0)
      const [a, b, c] = p.verts.map(v => ({ x: v.x - p.cx, y: v.y - p.cy }));
      const pt = { x: lx, y: ly };
      if (ptInTri(pt, a, b, c) && (!best || p.z > best.z)) best = p;
    }
    return best;
  }

  startDrag(piece, mx, my) {
    this.draggedPiece = piece;
    this.dragOffsetX = mx - piece.x;
    this.dragOffsetY = my - piece.y;
    piece.z = this._zCount++;
    piece.snapped = false;
    piece.rotation = 0; // straighten when lifted from pile
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
    const dx = p.x - p.targetX, dy = p.y - p.targetY;
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
    for (const p of this.pieces) { p.z = this._zCount++; p.snapped = false; }
    this.pile(canvasW, canvasH);
  }
}
