// PaperPuzzleEngine — irregular polygon puzzle
//
// Tessellation:
//   1. Random interior points are inserted into a seeded triangulation.
//   2. ~55% of adjacent triangle pairs are merged into quadrilaterals,
//      producing a natural mix of triangles and quads with no grid feel.
//   3. Internal edges get jagged torn paths; border edges stay straight.

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

// Point-in-triangle test for CW triangles (used during triangulation only)
function ptInTri(p, a, b, c) {
  const s = (u, v) => (v.x - u.x) * (p.y - u.y) - (v.y - u.y) * (p.x - u.x);
  return s(a, b) >= 0 && s(b, c) >= 0 && s(c, a) >= 0;
}

// Ray-casting point-in-polygon — works for any simple polygon (tri, quad, etc.)
function ptInPoly(px, py, verts) {
  let inside = false;
  const n = verts.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = verts[i].x, yi = verts[i].y;
    const xj = verts[j].x, yj = verts[j].y;
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Canonical edge key — lower vertex index always first
function eKey(a, b) {
  return a.idx < b.idx ? `${a.idx}_${b.idx}` : `${b.idx}_${a.idx}`;
}

export class PaperPuzzleEngine {
  constructor(level) {
    // level: { name, seed, imageW, imageH, numPoints, drawImage }
    this.level = level;
    this.cutMap = new Map(); // edgeKey → [{x,y}…] world-space torn points
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

    // Vertices: 4 corners + N random interior points
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
      [verts[0], verts[1], verts[2]],
      [verts[0], verts[2], verts[3]],
    ];

    // Insert each interior vertex by splitting its containing triangle into 3
    for (let i = 4; i < verts.length; i++) {
      const p = verts[i];
      const hit = tris.findIndex(t => ptInTri(p, t[0], t[1], t[2]));
      if (hit === -1) continue;
      const [t] = tris.splice(hit, 1);
      tris.push([t[0], t[1], p], [t[1], t[2], p], [t[2], t[0], p]);
    }

    // Edge counts across the triangle mesh (used for merge eligibility)
    const triEdgeCnt = new Map();
    for (const tri of tris) {
      for (let e = 0; e < 3; e++) {
        const k = eKey(tri[e], tri[(e + 1) % 3]);
        triEdgeCnt.set(k, (triEdgeCnt.get(k) || 0) + 1);
      }
    }

    // Merge ~55% of adjacent triangle pairs into quadrilaterals
    const mergeRng = seededRng(seed + '_merge');
    const finalPolys = this._mergeTriangles(tris, triEdgeCnt, mergeRng);

    // Recount edges across the final (mixed tri/quad) polygon set
    const polyEdgeCnt = new Map();
    for (const poly of finalPolys) {
      const n = poly.length;
      for (let e = 0; e < n; e++) {
        const k = eKey(poly[e], poly[(e + 1) % n]);
        polyEdgeCnt.set(k, (polyEdgeCnt.get(k) || 0) + 1);
      }
    }

    // Generate torn-edge cut paths for every internal edge (count === 2)
    const cutRng = seededRng(seed + '_cuts');
    for (const [key, cnt] of polyEdgeCnt) {
      if (cnt !== 2) continue;
      const [ia, ib] = key.split('_').map(Number);
      const va = verts.find(v => v.idx === ia);
      const vb = verts.find(v => v.idx === ib);
      this.cutMap.set(key, this._genCut(va, vb, cutRng));
    }

    // Build one piece per polygon
    for (let i = 0; i < finalPolys.length; i++) {
      const poly = finalPolys[i];
      const n = poly.length;
      const cx = poly.reduce((s, v) => s + v.x, 0) / n;
      const cy = poly.reduce((s, v) => s + v.y, 0) / n;
      const boundR2 = Math.max(...poly.map(v => (v.x - cx) ** 2 + (v.y - cy) ** 2));

      const edges = poly.map((a, e) => {
        const b = poly[(e + 1) % n];
        const key = eKey(a, b);
        return {
          key,
          isBorder: polyEdgeCnt.get(key) === 1,
          // Canonical cut direction is lower-idx→higher-idx.
          // reversed=true means this piece traverses the edge high→low.
          reversed: a.idx > b.idx,
        };
      });

      this.pieces.push({
        id: i,
        verts: poly,
        cx, cy,
        imgOffX: cx,
        imgOffY: cy,
        boundR2,
        edges,
        x: 0, y: 0,
        targetX: 0, targetY: 0,
        rotation: 0,
        snapped: false,
        z: this._zCount++,
      });
    }
  }

  // Randomly merge adjacent triangle pairs into quadrilaterals.
  // Returns the final list of polygons (mix of 3- and 4-vertex arrays).
  _mergeTriangles(tris, triEdgeCnt, rng) {
    // Map each internal edge to the two triangle indices that share it
    const edgeToTris = new Map();
    for (let i = 0; i < tris.length; i++) {
      for (let e = 0; e < 3; e++) {
        const k = eKey(tris[i][e], tris[i][(e + 1) % 3]);
        if (triEdgeCnt.get(k) !== 2) continue;
        if (!edgeToTris.has(k)) edgeToTris.set(k, []);
        edgeToTris.get(k).push(i);
      }
    }

    // Shuffle internal edges for a random merge order
    const intEdges = [...edgeToTris.keys()];
    for (let i = intEdges.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [intEdges[i], intEdges[j]] = [intEdges[j], intEdges[i]];
    }

    const used = new Set();
    const result = [];

    for (const key of intEdges) {
      if (rng() > 0.55) continue; // ~55% of eligible edges get dissolved
      const [ti, tj] = edgeToTris.get(key);
      if (used.has(ti) || used.has(tj)) continue;

      const [vidxA, vidxB] = key.split('_').map(Number);

      // Determine which triangle has edge va→vb (forward) vs vb→va (reversed)
      let t1 = tris[ti], t2 = tris[tj];
      for (let e = 0; e < 3; e++) {
        if (tris[ti][e].idx === vidxB && tris[ti][(e + 1) % 3].idx === vidxA) {
          t1 = tris[tj]; t2 = tris[ti]; break;
        }
      }

      const va    = t1.find(v => v.idx === vidxA);
      const vb    = t1.find(v => v.idx === vidxB);
      const apex1 = t1.find(v => v.idx !== vidxA && v.idx !== vidxB);
      const apex2 = t2.find(v => v.idx !== vidxA && v.idx !== vidxB);

      // Merged quad [va, apex2, vb, apex1] is CW (verified geometrically)
      result.push([va, apex2, vb, apex1]);
      used.add(ti);
      used.add(tj);
    }

    // Keep triangles that were not consumed by a merge
    for (let i = 0; i < tris.length; i++) {
      if (!used.has(i)) result.push(tris[i]);
    }
    return result;
  }

  // World-space torn-edge points from va to vb (canonical: va.idx < vb.idx)
  _genCut(va, vb, rng) {
    const dx = vb.x - va.x, dy = vb.y - va.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const n = Math.max(8, Math.floor(len / 7));
    const perpX = -dy / len, perpY = dx / len;

    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const off = (i > 0 && i < n) ? (rng() - 0.5) * 54 : 0;
      pts.push({ x: va.x + t * dx + off * perpX, y: va.y + t * dy + off * perpY });
    }
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

  // Scatter pieces freely across the whole canvas (including centre)
  pile(canvasW, canvasH) {
    const { imageW, imageH, seed } = this.level;
    const rng = seededRng(seed + '_pile' + Date.now());
    const padX = imageW * 0.25;
    const padY = imageH * 0.25;
    const maxRot = Math.PI / 5;
    for (const p of this.pieces) {
      p.x = padX + rng() * (canvasW - 2 * padX);
      p.y = padY + rng() * (canvasH - 2 * padY);
      p.rotation = (rng() - 0.5) * 2 * maxRot;
      p.snapped = false;
    }
  }

  getPieceAt(x, y) {
    let best = null;
    for (const p of this.pieces) {
      // Fast bounding-circle cull
      const dx = x - p.x, dy = y - p.y;
      if (dx * dx + dy * dy >= p.boundR2) continue;

      // Transform into piece-local space (undo translation + rotation)
      let lx = dx, ly = dy;
      if (p.rotation) {
        const cos = Math.cos(-p.rotation);
        const sin = Math.sin(-p.rotation);
        lx = dx * cos - dy * sin;
        ly = dx * sin + dy * cos;
      }

      // Exact point-in-polygon test against piece-local vertices
      const localVerts = p.verts.map(v => ({ x: v.x - p.cx, y: v.y - p.cy }));
      if (ptInPoly(lx, ly, localVerts) && (!best || p.z > best.z)) best = p;
    }
    return best;
  }

  startDrag(piece, mx, my) {
    this.draggedPiece = piece;
    this.dragOffsetX = mx - piece.x;
    this.dragOffsetY = my - piece.y;
    piece.z = this._zCount++;
    piece.snapped = false;
    piece.rotation = 0;
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
