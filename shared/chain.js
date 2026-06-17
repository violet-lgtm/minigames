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

    // The trail context comes either from a baked-in global (standalone trail
    // pages, where the game runs in a srcdoc iframe without a URL) or from the
    // ?trail=&g= query parameters of a hosted game link.
    var params = new URLSearchParams(window.location.search);
    var standalone = window.STANDALONE_TRAIL || null;
    var def = null;
    var index = NaN;
    if (standalone && standalone.def) {
        def = (standalone.def.v === 1 && standalone.def.id &&
            Array.isArray(standalone.def.games)) ? standalone.def : null;
        index = parseInt(standalone.index, 10);
    } else {
        def = params.get('trail') ? decodeDef(params.get('trail')) : null;
        index = parseInt(params.get('g'), 10);
    }
    var active = !!(def && Number.isInteger(index) && index >= 0 && index < def.games.length);

    if (!active) {
        window.MinigameChain = { active: false, report: function () {} };
        return;
    }

    var storageKey = 'trail-' + def.id;
    var trailB64 = standalone ? null : params.get('trail'); // re-used verbatim when building links
    // In a standalone (downloaded) trail each game is its own file in the same
    // folder; `files` holds their relative names and `indexFile` the hub page.
    var files = (standalone && Array.isArray(standalone.files)) ? standalone.files : null;
    var indexFile = (standalone && standalone.indexFile) || null;
    var entry = def.games[index];
    var bar = null;          // the bottom trail bar element
    var barStatus = null;
    var progress = null;     // cached progress object

    // ---- storage helpers (via the stqry bridge) ----
    // Scores are saved through the bridge (localStorage in a browser, the app's
    // store inside stqry). But when the pages are opened directly from disk
    // (file://) each file is a separate origin, so localStorage is NOT shared
    // between them. window.name persists across navigations within the same
    // window regardless of origin, so we mirror progress there too and merge on
    // read — that makes scores carry across the separate trail pages locally.
    function nameGet(key) {
        try {
            var o = JSON.parse(window.name);
            return (o && o.__mt && o.__mt[key]) || null;
        } catch (e) { return null; }
    }
    function nameSet(key, val) {
        var o;
        try { o = JSON.parse(window.name); } catch (e) { o = null; }
        if (!o || typeof o !== 'object') o = {};
        if (!o.__mt) o.__mt = {};
        o.__mt[key] = val;
        try { window.name = JSON.stringify(o); } catch (e) { /* ignore */ }
    }

    // Combine two progress objects, keeping the best (highest points) score per
    // game so neither source can clobber the other.
    function mergeProgress(a, b) {
        if (!a && !b) return null;
        a = a || { scores: {} };
        b = b || { scores: {} };
        var now = Date.now();
        var out = {
            v: 1,
            id: a.id || b.id || def.id,
            startedAt: Math.min(a.startedAt || now, b.startedAt || now),
            scores: {}
        };
        var sa = a.scores || {}, sb = b.scores || {}, k;
        var keys = {};
        for (k in sa) keys[k] = 1;
        for (k in sb) keys[k] = 1;
        for (k in keys) {
            var x = sa[k], y = sb[k];
            out.scores[k] = (x && y) ? (y.points > x.points ? y : x) : (x || y);
        }
        return out;
    }

    function readProgress(cb) {
        var fromName = nameGet(storageKey);
        if (!window.stqry) { cb(fromName); return; }
        window.stqry.storage.get(storageKey, function (value) {
            cb(mergeProgress(value || null, fromName));
        });
    }

    function writeProgress(prog, cb) {
        nameSet(storageKey, prog);
        if (!window.stqry) { if (cb) cb(); return; }
        var changeset = {};
        changeset[storageKey] = prog;
        window.stqry.storage.set(changeset, cb || function () {});
    }

    // ---- link building ----
    function gameLink(i) {
        // Standalone trail: a sibling file in the same folder.
        if (files) return files[i];
        // Hosted on the site: pages live at <root>/<game>/game.html (one level up).
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

        var overview = el('button',
            BTN_CSS + 'background:rgba(255,255,255,0.14);color:#fff;', '📋 Scores');
        overview.addEventListener('click', showScoresOverlay);
        bar.appendChild(overview);

        // In a downloaded trail the hub page is how you pick the next game.
        if (indexFile) {
            var hub = el('a', BTN_CSS + 'background:rgba(255,255,255,0.14);color:#fff;', '🏁 Overview');
            hub.href = indexFile;
            bar.appendChild(hub);
        }

        document.body.appendChild(bar);
        // keep the bar from covering page content
        document.body.style.paddingBottom = '64px';
    }

    // A lightweight overlay listing the scores banked so far in this trail.
    function showScoresOverlay() {
        readProgress(function (prog) {
            renderScoresOverlay(prog || { scores: {} });
        });
    }

    function renderScoresOverlay(prog) {
        var scores = prog.scores || {};
        var overlay = el('div',
            'position:fixed;inset:0;z-index:99996;display:flex;align-items:center;justify-content:center;' +
            'background:rgba(15,17,22,0.82);padding:20px;font:14px/1.45 system-ui,sans-serif;');

        var card = el('div',
            'width:100%;max-width:360px;max-height:80vh;overflow:auto;background:#fff;color:#1a1a1a;' +
            'border-radius:16px;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,0.4);');
        card.appendChild(el('div', 'font-weight:800;font-size:1.2em;margin-bottom:14px;',
            '📋 ' + (def.title || 'Minigame Trail')));

        var total = 0, totalStars = 0, done = 0;
        def.games.forEach(function (g, i) {
            var s = scores[String(i)];
            var unlocked = isUnlocked(prog, i);
            // In a downloaded trail, a row links straight to that game's page.
            var canJump = files && unlocked && i !== index;
            var row = el(canJump ? 'a' : 'div',
                'display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #eee;' +
                'text-decoration:none;color:inherit;' + (canJump ? 'cursor:pointer;' : ''));
            if (canJump) row.href = gameLink(i);
            row.appendChild(el('span',
                'width:22px;font-weight:800;color:' + (s ? '#2e9e4f' : '#9aa0a8') + ';',
                s ? '✓' : (unlocked ? String(i + 1) : '🔒')));
            row.appendChild(el('span', 'flex:1;font-weight:700;',
                (g.name || g.slug) + (i === index ? ' (now)' : '')));
            row.appendChild(el('span',
                'font-weight:800;white-space:nowrap;color:' + (s ? '#1a1a1a' : '#9aa0a8') + ';',
                s ? (s.points + ' pts ' + '⭐'.repeat(s.stars || 0)) : (canJump ? 'Play →' : '—')));
            card.appendChild(row);
            if (s) { total += s.points; totalStars += s.stars || 0; done++; }
        });

        var totalRow = el('div',
            'display:flex;justify-content:space-between;gap:10px;margin-top:14px;font-weight:800;font-size:1.05em;');
        totalRow.appendChild(el('span', '',
            done >= def.games.length ? '🏁 Final score' : 'Total so far'));
        totalRow.appendChild(el('span', '',
            total + ' pts · ' + totalStars + '/' + (def.games.length * 3) + ' ⭐'));
        card.appendChild(totalRow);

        // Footer link to the full overview page (downloaded trails only).
        if (indexFile) {
            var hubLink = el('a',
                'display:block;text-align:center;margin-top:12px;color:#5e5e5e;font-weight:700;text-decoration:none;',
                '🏁 Open full overview');
            hubLink.href = indexFile;
            card.appendChild(hubLink);
        }

        var close = el('button', BTN_CSS + 'width:100%;margin-top:18px;', 'Close');
        function dismiss() { if (overlay.parentNode) document.body.removeChild(overlay); }
        close.addEventListener('click', dismiss);
        card.appendChild(close);

        overlay.appendChild(card);
        // tapping the dimmed backdrop also closes the overlay
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) dismiss();
        });
        document.body.appendChild(overlay);
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
        var go = el('a', BTN_CSS,
            '▶ ' + (def.games[firstLocked].name || def.games[firstLocked].slug));
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
