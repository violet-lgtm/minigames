/*
 * Minigame Trail runtime.
 *
 * Lets a set of minigames be strung together into a "trail" that is played
 * inside the stqry app (or any browser). Each game link carries the trail
 * definition; scores are saved through the stqry storage bridge
 * (shared/stqry-bridge.js, which must be loaded before this script) so a
 * final overview page (trail/results.html) can show them all.
 *
 * Link format (produced by trail/builder.html):
 *   <game>/game.html?...own-level-params...&trail=<b64 trail def>&g=<index>
 *
 * Trail definition:
 *   {
 *     v: 1,
 *     id: 'trail-x1y2',
 *     title: 'Museum Trail',
 *     mode: 'free' | 'ordered',
 *     games: [ { slug, name, url }, ... ]   // url relative to the repo root
 *   }
 *
 * Stored progress (stqry.storage key 'trail-<id>'):
 *   { v: 1, id, startedAt, scores: { '<index>': { points, stars, native, ms, at } } }
 *
 * Games call:  window.MinigameChain.report({ points, stars, native })
 * on their win screen. points is 0-100, stars 1-3, native is the game's own
 * stats (moves, guesses, ...). Repeat plays keep the best points.
 */
(function () {
    'use strict';

    var loadedAt = Date.now();

    // ---- parse the trail parameters from the query string ----
    function decodeDef(b64) {
        try {
            var json = decodeURIComponent(escape(atob(b64)));
            var def = JSON.parse(json);
            if (!def || def.v !== 1 || !def.id || !Array.isArray(def.games)) return null;
            return def;
        } catch (e) {
            return null;
        }
    }

    var params = new URLSearchParams(window.location.search);
    var def = params.get('trail') ? decodeDef(params.get('trail')) : null;
    var index = parseInt(params.get('g'), 10);
    var active = !!(def && Number.isInteger(index) && index >= 0 && index < def.games.length);

    if (!active) {
        window.MinigameChain = { active: false, report: function () {} };
        return;
    }

    var storageKey = 'trail-' + def.id;
    var trailB64 = params.get('trail'); // re-used verbatim when building links
    var entry = def.games[index];
    var bar = null;          // the bottom trail bar element
    var barStatus = null;
    var progress = null;     // cached progress object

    // ---- storage helpers (via the stqry bridge) ----
    function readProgress(cb) {
        if (!window.stqry) { cb(null); return; }
        window.stqry.storage.get(storageKey, function (value) {
            cb(value || null);
        });
    }

    function writeProgress(prog, cb) {
        if (!window.stqry) { if (cb) cb(); return; }
        var changeset = {};
        changeset[storageKey] = prog;
        window.stqry.storage.set(changeset, cb || function () {});
    }

    // ---- link building ----
    // Pages live at <root>/<game>/game.html, so the repo root is one level up.
    function gameLink(i) {
        var url = def.games[i].url;
        var hash = '';
        var hashPos = url.indexOf('#');
        if (hashPos !== -1) {
            hash = url.slice(hashPos);
            url = url.slice(0, hashPos);
        }
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        return '../' + url + sep + 'trail=' + encodeURIComponent(trailB64) + '&g=' + i + hash;
    }

    function resultsLink() {
        return '../trail/results.html?trail=' + encodeURIComponent(trailB64);
    }

    function isDone(prog, i) {
        return !!(prog && prog.scores && prog.scores[String(i)]);
    }

    // In ordered mode, game i is unlocked once every earlier game has a score.
    function isUnlocked(prog, i) {
        if (def.mode !== 'ordered') return true;
        for (var j = 0; j < i; j++) {
            if (!isDone(prog, j)) return false;
        }
        return true;
    }

    // ---- UI: trail bar + lock overlay ----
    function el(tag, css, text) {
        var node = document.createElement(tag);
        if (css) node.style.cssText = css;
        if (text) node.textContent = text;
        return node;
    }

    var BTN_CSS = 'display:inline-block;padding:8px 14px;border-radius:10px;border:0;' +
        'background:#f6b62e;color:#1a1a1a;font:inherit;font-weight:800;cursor:pointer;' +
        'text-decoration:none;white-space:nowrap;';

    function buildBar() {
        bar = el('div',
            'position:fixed;left:0;right:0;bottom:0;z-index:99990;display:flex;align-items:center;' +
            'justify-content:center;gap:12px;flex-wrap:wrap;padding:10px 14px;' +
            'background:rgba(20,22,28,0.92);color:#fff;font:14px/1.4 system-ui,sans-serif;' +
            'box-shadow:0 -4px 16px rgba(0,0,0,0.35);');

        var label = el('span', 'font-weight:800;');
        label.textContent = (def.title || 'Minigame Trail') + ' · ' +
            (index + 1) + ' / ' + def.games.length;
        bar.appendChild(label);

        barStatus = el('span', 'color:#cfcfcf;');
        bar.appendChild(barStatus);

        var overview = el('a',
            BTN_CSS + 'background:rgba(255,255,255,0.14);color:#fff;', '📋 Overview');
        overview.href = resultsLink();
        bar.appendChild(overview);

        document.body.appendChild(bar);
        // keep the bar from covering page content
        document.body.style.paddingBottom = '64px';
    }

    function showLockOverlay(prog) {
        var firstLocked = 0;
        while (isDone(prog, firstLocked)) firstLocked++;
        var overlay = el('div',
            'position:fixed;inset:0;z-index:99995;display:flex;align-items:center;justify-content:center;' +
            'background:rgba(15,17,22,0.94);color:#fff;font:16px/1.5 system-ui,sans-serif;' +
            'text-align:center;padding:24px;');
        var card = el('div', 'max-width:340px;');
        card.appendChild(el('div', 'font-size:2.4em;margin-bottom:10px;', '🔒'));
        card.appendChild(el('div', 'font-weight:800;font-size:1.2em;margin-bottom:8px;',
            'This game is still locked'));
        card.appendChild(el('p', 'color:#cfcfcf;margin-bottom:18px;',
            'This trail is played in a set order. Up next:'));
        var go = el('a', BTN_CSS, '▶ ' + (def.games[firstLocked].name || def.games[firstLocked].slug));
        go.href = gameLink(firstLocked);
        card.appendChild(go);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
    }

    // Trail pages are their own little world: hide links back into the site.
    function hideSiteNav() {
        var sel = 'a[href="index.html"], a[href="./"], .back-link';
        document.querySelectorAll(sel).forEach(function (a) { a.style.display = 'none'; });
    }

    // ---- boot ----
    function init() {
        hideSiteNav();
        buildBar();
        readProgress(function (prog) {
            if (!prog) {
                prog = { v: 1, id: def.id, startedAt: Date.now(), scores: {} };
                writeProgress(prog);
            }
            progress = prog;
            if (!isUnlocked(prog, index)) {
                showLockOverlay(prog);
                return;
            }
            if (isDone(prog, index)) {
                var s = prog.scores[String(index)];
                barStatus.textContent = 'Best: ' + s.points + ' pts ' + '⭐'.repeat(s.stars || 0);
            } else {
                barStatus.textContent = 'Finish the game to bank your score!';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ---- the API games call on their win screens ----
    function report(result) {
        var points = Math.max(0, Math.min(100, Math.round(Number(result.points) || 0)));
        var stars = Math.max(1, Math.min(3, Math.round(Number(result.stars) || 1)));
        readProgress(function (prog) {
            if (!prog) prog = { v: 1, id: def.id, startedAt: Date.now(), scores: {} };
            var key = String(index);
            var prev = prog.scores[key];
            if (!prev || points > prev.points) {
                prog.scores[key] = {
                    points: points,
                    stars: stars,
                    native: result.native || {},
                    ms: Date.now() - loadedAt,
                    at: Date.now()
                };
            }
            progress = prog;
            writeProgress(prog, function () {
                if (!barStatus) return;
                var s = prog.scores[key];
                barStatus.textContent = (prev && points <= prev.points)
                    ? 'Saved — best stays ' + s.points + ' pts'
                    : '✓ Saved: ' + s.points + ' pts ' + '⭐'.repeat(s.stars);
            });
        });
    }

    window.MinigameChain = { active: true, def: def, index: index, report: report };
})();
