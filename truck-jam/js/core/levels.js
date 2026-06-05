/*
 * Truck Jam - level catalogue.
 *
 * Each level holds a raw vehicle layout (verified solvable by the BFS solver in
 * engine.js, with `par` set to the solver's optimal move count). The geometry
 * is decorated at load time with a European-lorry livery (colour + cosmetic
 * "kind") so every yard looks hand-painted without hand-authoring each truck.
 *
 * Vehicle kinds are purely cosmetic (how the truck is drawn):
 *   rigid  - short box truck (len 2)
 *   van    - panel van (len 2)
 *   artic  - articulated lorry: cab + curtain-side trailer (len 3)
 *   tanker - cab + cylindrical tank (len 3)
 */
(function () {
    'use strict';

    // Livery palette for the obstacle lorries (the target is always red).
    // Loosely inspired by the colours you see rolling down a European motorway.
    const LIVERIES = [
        { color: '#2f6fb0', name: 'Blue hauler' },     // blue
        { color: '#2e9e57', name: 'Green freight' },   // green
        { color: '#e8932a', name: 'Orange transit' },  // orange
        { color: '#7a55c0', name: 'Purple cargo' },    // purple
        { color: '#13a3a3', name: 'Teal logistics' },  // teal
        { color: '#c0476e', name: 'Rose courier' },    // pink/rose
        { color: '#5b6b7a', name: 'Slate carrier' },   // slate
        { color: '#b07d2f', name: 'Amber transport' }, // amber/brown
        { color: '#3f8f3f', name: 'Olive express' },   // olive
        { color: '#4a5db0', name: 'Indigo lines' }     // indigo
    ];

    function kindFor(len, idx) {
        if (len >= 3) return idx % 2 === 0 ? 'artic' : 'tanker';
        return idx % 2 === 0 ? 'rigid' : 'van';
    }

    // Turn a bare geometry array into fully-decorated vehicles.
    function decorate(vehicles) {
        let liveryIdx = 0;
        return vehicles.map((v, i) => {
            if (v.isTarget) {
                return {
                    ...v,
                    kind: v.len >= 3 ? 'artic' : 'rigid',
                    color: '#e23b2e',
                    name: 'Your lorry',
                    isTarget: true
                };
            }
            const livery = LIVERIES[liveryIdx % LIVERIES.length];
            liveryIdx++;
            return {
                ...v,
                kind: kindFor(v.len, i),
                color: livery.color,
                name: livery.name
            };
        });
    }

    // Raw, solver-verified layouts (geometry only).
    const RAW = [
        {
            id: 'depot-1',
            name: 'Loading Bay',
            blurb: 'Just one lorry stands between you and the gate.',
            par: 2,
            vehicles: [
                { id: 'target', x: 1, y: 2, len: 2, dir: 'h', isTarget: true },
                { id: 'v0', x: 3, y: 3, len: 2, dir: 'v' },
                { id: 'v1', x: 5, y: 3, len: 2, dir: 'v' },
                { id: 'v4', x: 4, y: 3, len: 2, dir: 'v' },
                { id: 'v5', x: 3, y: 1, len: 2, dir: 'v' },
                { id: 'v7', x: 0, y: 5, len: 3, dir: 'h' }
            ]
        },
        {
            id: 'depot-2',
            name: 'Morning Shift',
            blurb: 'Shuffle a couple of trailers aside to roll out.',
            par: 5,
            vehicles: [
                { id: 'target', x: 1, y: 2, len: 2, dir: 'h', isTarget: true },
                { id: 'v1', x: 4, y: 0, len: 3, dir: 'v' },
                { id: 'v2', x: 1, y: 5, len: 2, dir: 'h' },
                { id: 'v3', x: 2, y: 0, len: 2, dir: 'h' },
                { id: 'v4', x: 3, y: 3, len: 3, dir: 'h' },
                { id: 'v5', x: 1, y: 3, len: 2, dir: 'v' }
            ]
        },
        {
            id: 'depot-3',
            name: 'Tight Yard',
            blurb: 'The exit lane is boxed in on both sides.',
            par: 6,
            vehicles: [
                { id: 'target', x: 2, y: 2, len: 2, dir: 'h', isTarget: true },
                { id: 'v0', x: 2, y: 3, len: 3, dir: 'v' },
                { id: 'v1', x: 4, y: 5, len: 2, dir: 'h' },
                { id: 'v2', x: 5, y: 0, len: 2, dir: 'v' },
                { id: 'v4', x: 4, y: 0, len: 3, dir: 'v' },
                { id: 'v6', x: 1, y: 0, len: 2, dir: 'h' }
            ]
        },
        {
            id: 'depot-4',
            name: 'Gridlock',
            blurb: 'Long trailers everywhere — find the chain reaction.',
            par: 8,
            vehicles: [
                { id: 'target', x: 0, y: 2, len: 2, dir: 'h', isTarget: true },
                { id: 'v0', x: 2, y: 5, len: 3, dir: 'h' },
                { id: 'v1', x: 0, y: 3, len: 3, dir: 'v' },
                { id: 'v2', x: 2, y: 0, len: 3, dir: 'v' },
                { id: 'v3', x: 1, y: 3, len: 3, dir: 'v' },
                { id: 'v6', x: 5, y: 3, len: 3, dir: 'v' }
            ]
        },
        {
            id: 'depot-5',
            name: 'Rush Hour',
            blurb: 'Everything is in the way. Think several moves ahead.',
            par: 10,
            vehicles: [
                { id: 'target', x: 0, y: 2, len: 2, dir: 'h', isTarget: true },
                { id: 'v0', x: 2, y: 0, len: 3, dir: 'v' },
                { id: 'v2', x: 4, y: 0, len: 2, dir: 'v' },
                { id: 'v3', x: 1, y: 5, len: 3, dir: 'h' },
                { id: 'v4', x: 5, y: 1, len: 3, dir: 'v' },
                { id: 'v5', x: 0, y: 3, len: 3, dir: 'h' }
            ]
        },
        {
            id: 'depot-6',
            name: 'Logistics Knot',
            blurb: 'A proper tangle. Untangle the depot to escape.',
            par: 13,
            vehicles: [
                { id: 'target', x: 1, y: 2, len: 2, dir: 'h', isTarget: true },
                { id: 'v0', x: 3, y: 3, len: 2, dir: 'h' },
                { id: 'v1', x: 2, y: 5, len: 3, dir: 'h' },
                { id: 'v3', x: 0, y: 0, len: 2, dir: 'v' },
                { id: 'v4', x: 3, y: 0, len: 3, dir: 'v' },
                { id: 'v6', x: 1, y: 4, len: 2, dir: 'v' },
                { id: 'v7', x: 5, y: 3, len: 3, dir: 'v' }
            ]
        },
        {
            id: 'depot-7',
            name: 'Full House',
            blurb: 'Nine lorries, one way out. A real head-scratcher.',
            par: 15,
            vehicles: [
                { id: 'target', x: 1, y: 2, len: 2, dir: 'h', isTarget: true },
                { id: 'v0', x: 0, y: 2, len: 2, dir: 'v' },
                { id: 'v1', x: 3, y: 0, len: 3, dir: 'v' },
                { id: 'v2', x: 5, y: 4, len: 2, dir: 'v' },
                { id: 'v3', x: 4, y: 0, len: 3, dir: 'v' },
                { id: 'v6', x: 3, y: 3, len: 2, dir: 'h' },
                { id: 'v7', x: 2, y: 5, len: 2, dir: 'h' },
                { id: 'v8', x: 2, y: 4, len: 2, dir: 'h' },
                { id: 'v10', x: 1, y: 4, len: 2, dir: 'v' }
            ]
        },
        {
            id: 'depot-8',
            name: 'Depot Deadlock',
            blurb: 'The toughest yard. Every lorry matters — plan the whole route.',
            par: 16,
            vehicles: [
                { id: 'target', x: 1, y: 2, len: 2, dir: 'h', isTarget: true },
                { id: 'v0', x: 1, y: 4, len: 2, dir: 'v' },
                { id: 'v2', x: 5, y: 0, len: 3, dir: 'v' },
                { id: 'v3', x: 3, y: 2, len: 2, dir: 'v' },
                { id: 'v5', x: 4, y: 4, len: 2, dir: 'h' },
                { id: 'v6', x: 1, y: 0, len: 2, dir: 'h' },
                { id: 'v7', x: 4, y: 0, len: 3, dir: 'v' },
                { id: 'v8', x: 4, y: 3, len: 2, dir: 'h' },
                { id: 'v9', x: 3, y: 4, len: 2, dir: 'v' }
            ]
        }
    ];

    window.TruckJamLevels = RAW.map(lvl => ({
        id: lvl.id,
        name: lvl.name,
        blurb: lvl.blurb,
        par: lvl.par,
        width: 6,
        height: 6,
        exitRow: 2,
        vehicles: decorate(lvl.vehicles)
    }));
})();
