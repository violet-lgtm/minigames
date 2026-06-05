/*
 * Truck Jam - tiny localStorage wrapper for per-level best (fewest) moves and
 * which levels have been cleared. Fails silently if storage is unavailable.
 */
(function () {
    'use strict';
    const KEY = 'truckJam.progress.v1';

    function read() {
        try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
        catch (e) { return {}; }
    }
    function write(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }

    window.TruckJamStore = {
        // Best (lowest) move count recorded for a level, or null.
        getBest(levelId) {
            const d = read();
            return d[levelId] && typeof d[levelId].best === 'number' ? d[levelId].best : null;
        },
        // Record a completed run; keeps the lowest move count. Returns true if it
        // is a new personal best.
        recordWin(levelId, moves) {
            const d = read();
            const prev = d[levelId] && typeof d[levelId].best === 'number' ? d[levelId].best : null;
            const isBest = prev === null || moves < prev;
            d[levelId] = { best: isBest ? moves : prev, cleared: true };
            write(d);
            return isBest;
        },
        isCleared(levelId) {
            const d = read();
            return !!(d[levelId] && d[levelId].cleared);
        },
        clearedCount() {
            const d = read();
            return Object.values(d).filter(x => x && x.cleared).length;
        }
    };
})();
