/*
 * Truck Jam - core engine
 * A "parking slide" puzzle (Rush Hour family): vehicles sit on a grid and slide
 * only along their own axis. Clear a path so the target lorry can roll out the
 * exit gate on the right.
 *
 * Works in the browser (attaches to window.TruckJam) and in Node (module.exports)
 * so the very same logic powers the game and the level-verification script.
 *
 * Vehicle definition (level data):
 *   { id, x, y, len, dir, kind, color, isTarget }
 *     x, y   - top-left cell (0-indexed, col/row)
 *     len    - length in cells (2 = rigid truck/van, 3 = articulated lorry)
 *     dir    - 'h' (extends to the right) or 'v' (extends downward)
 *     kind   - cosmetic vehicle type (see TRUCK_KINDS)
 *
 * A "move" = sliding one vehicle any number of free cells in one direction
 * (classic Rush Hour scoring).
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') window.TruckJam = api;
})(this, function () {
    'use strict';

    const DEFAULT_WIDTH = 6;
    const DEFAULT_HEIGHT = 6;

    // Build a working board from a level definition. Clones the vehicles so the
    // original level data is never mutated.
    function createBoard(level) {
        const width = level.width || DEFAULT_WIDTH;
        const height = level.height || DEFAULT_HEIGHT;
        const vehicles = level.vehicles.map((v, i) => ({
            id: v.id != null ? v.id : 'v' + i,
            x: v.x,
            y: v.y,
            len: v.len,
            dir: v.dir,
            kind: v.kind || 'truck',
            color: v.color || null,
            isTarget: !!v.isTarget
        }));
        const target = vehicles.find(v => v.isTarget);
        return {
            width,
            height,
            // Row the exit gate sits on (defaults to the target's row).
            exitRow: level.exitRow != null ? level.exitRow : (target ? target.y : 2),
            vehicles
        };
    }

    // List the cells a vehicle currently occupies.
    function cellsOf(v) {
        const cells = [];
        for (let i = 0; i < v.len; i++) {
            cells.push(v.dir === 'h' ? [v.x + i, v.y] : [v.x, v.y + i]);
        }
        return cells;
    }

    // Build an occupancy grid mapping "x,y" -> vehicle id (optionally skip one id).
    function occupancy(board, skipId) {
        const map = new Map();
        for (const v of board.vehicles) {
            if (v.id === skipId) continue;
            for (const [cx, cy] of cellsOf(v)) map.set(cx + ',' + cy, v.id);
        }
        return map;
    }

    // The range of along-axis positions a vehicle can legally slide to right now,
    // including its current position. Returns { min, max } for the leading coord
    // (x for 'h', y for 'v').
    function slideRange(board, vehicle) {
        const occ = occupancy(board, vehicle.id);
        const horizontal = vehicle.dir === 'h';
        const cur = horizontal ? vehicle.x : vehicle.y;
        const limit = (horizontal ? board.width : board.height) - vehicle.len;
        const fixed = horizontal ? vehicle.y : vehicle.x;

        const occupied = (pos) => {
            // Is the single new leading cell at `pos` free?
            const key = horizontal ? (pos + ',' + fixed) : (fixed + ',' + pos);
            return occ.has(key);
        };

        let min = cur;
        while (min - 1 >= 0 && !occupied(min - 1)) min--;
        let max = cur;
        while (max + 1 <= limit && !occupied(max + 1 + vehicle.len - 1)) max++;
        return { min, max };
    }

    // Has the target lorry reached the exit (right wall on the exit row)?
    function isSolved(board) {
        const t = board.vehicles.find(v => v.isTarget);
        return t && t.dir === 'h' && t.y === board.exitRow &&
            (t.x + t.len) === board.width;
    }

    // Compact string key of a board state for BFS de-duplication. Vehicle order
    // is stable, so we only need each vehicle's leading coordinate.
    function stateKey(board) {
        return board.vehicles.map(v => v.dir === 'h' ? v.x : v.y).join(',');
    }

    function cloneVehicles(board) {
        return board.vehicles.map(v => ({ ...v }));
    }

    // Breadth-first search for the shortest solution.
    // Returns { solvable, moves } where moves is an ordered list of
    // { id, dir, to } steps, or null if unsolvable.
    function solve(level, maxStates) {
        const start = createBoard(level);
        maxStates = maxStates || 200000;

        if (isSolved(start)) return { solvable: true, moves: [] };

        const startKey = stateKey(start);
        const visited = new Set([startKey]);
        // Each queue entry: { vehicles, key }
        let queue = [{ vehicles: cloneVehicles(start), key: startKey }];
        // prev[key] = { key: parentKey, move: {id, dir, to} }
        const prev = new Map();
        let solvedKey = null;
        let count = 0;

        while (queue.length && !solvedKey) {
            const next = [];
            for (const node of queue) {
                if (++count > maxStates) return { solvable: false, moves: null, exhausted: true };
                const board = { width: start.width, height: start.height, exitRow: start.exitRow, vehicles: node.vehicles };

                for (let vi = 0; vi < board.vehicles.length; vi++) {
                    const v = board.vehicles[vi];
                    const horizontal = v.dir === 'h';
                    const cur = horizontal ? v.x : v.y;
                    const { min, max } = slideRange(board, v);

                    for (let pos = min; pos <= max; pos++) {
                        if (pos === cur) continue;
                        const moved = node.vehicles.map((mv, idx) =>
                            idx === vi ? { ...mv, [horizontal ? 'x' : 'y']: pos } : mv);
                        const movedBoard = { width: start.width, height: start.height, exitRow: start.exitRow, vehicles: moved };
                        const key = stateKey(movedBoard);
                        if (visited.has(key)) continue;
                        visited.add(key);
                        const dir = horizontal
                            ? (pos > cur ? 'right' : 'left')
                            : (pos > cur ? 'down' : 'up');
                        prev.set(key, { key: node.key, move: { id: v.id, dir, to: pos } });
                        if (isSolved(movedBoard)) { solvedKey = key; break; }
                        next.push({ vehicles: moved, key });
                    }
                    if (solvedKey) break;
                }
                if (solvedKey) break;
            }
            queue = next;
        }

        if (!solvedKey) return { solvable: false, moves: null };

        // Reconstruct the path.
        const moves = [];
        let k = solvedKey;
        while (prev.has(k)) {
            const step = prev.get(k);
            moves.unshift(step.move);
            k = step.key;
        }
        return { solvable: true, moves };
    }

    return {
        DEFAULT_WIDTH,
        DEFAULT_HEIGHT,
        createBoard,
        cellsOf,
        occupancy,
        slideRange,
        isSolved,
        stateKey,
        solve
    };
});
