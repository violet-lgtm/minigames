/*
 * Standalone trail builder (multi-file).
 *
 * buildTrailFiles() turns a trail into a SET of files that can be zipped and
 * hosted as a folder — each page behind its own link:
 *
 *   <folder>/index.html                 the hub / final-score overview
 *   <folder>/game-1-<slug>.html         each game, standalone, level baked in
 *   <folder>/game-2-<slug>.html
 *   <folder>/assets/game-2.jpg          images stored as real, compressed files
 *
 * Why multi-file:
 *  - Each game page is independently hostable (its own URL / stqry screen).
 *  - Images (paper-puzzle photos) are written as separate JPEG/PNG files
 *    instead of base64 data URLs, so they aren't inflated ~33% and aren't
 *    double-encoded inside a bundle. The page references them by relative URL.
 *
 * Cross-page state: every page loads the stqry bridge, so scores persist in
 * localStorage when the folder is served over HTTP (same origin) and in the
 * stqry app when the pages are hosted as its screens. The hub reads them back.
 * Navigation between pages uses ordinary links (baked into each game via
 * window.STANDALONE_TRAIL.files / .indexFile, read by shared/chain.js).
 */
import { buildStandalonePage, pageFileName } from './standalone.js';

// Overview/hub strings for the downloaded trail's index page, in the trail's
// chosen language (def.lang). Baked into the generated page so the standalone
// overview matches the games (which inherit def.lang via window.STANDALONE_TRAIL).
const HUB_STRINGS = {
    en: {
        default_title: 'Minigame Trail',
        mode_ordered: '➡️ Play in order',
        mode_free: '🔀 Play in any order',
        lbl_games: 'Games', lbl_score: 'Score', lbl_stars: 'Stars',
        greeting: '🎉 Trail complete!',
        greeting_named: '🎉 Trail complete, {name}!',
        pts_unit: 'pts',
        stars_of: '{stars} of {max} stars',
        grade_outstanding: '🏆 Outstanding!',
        grade_great: '🥇 Great run!',
        grade_welldone: '🥈 Well done!',
        grade_completed: '🥉 Trail completed!',
        detail_notplayed: 'Not played yet',
        detail_locked: 'Locked',
        btn_play: 'Play →',
        btn_restart: '↺ Restart Trail',
        confirm_restart: 'Restart the trail? All saved scores will be cleared.',
        ns_truck: '{moves} moves (par {par})',
        ns_master: '{guesses}/{max} guesses',
        ns_wire: '{moves} moves',
        ns_slot: '{score} pts, {hits}/{reels} hits',
        ns_block: '{blocks} blocks stacked',
        ns_paper_pieces: '{pieces} pieces placed',
        ns_paper_solved: 'solved',
    },
    nl: {
        default_title: 'Minigame-route',
        mode_ordered: '➡️ Op volgorde spelen',
        mode_free: '🔀 In willekeurige volgorde',
        lbl_games: 'Spellen', lbl_score: 'Score', lbl_stars: 'Sterren',
        greeting: '🎉 Route voltooid!',
        greeting_named: '🎉 Route voltooid, {name}!',
        pts_unit: 'ptn',
        stars_of: '{stars} van {max} sterren',
        grade_outstanding: '🏆 Uitstekend!',
        grade_great: '🥇 Sterke run!',
        grade_welldone: '🥈 Goed gedaan!',
        grade_completed: '🥉 Route voltooid!',
        detail_notplayed: 'Nog niet gespeeld',
        detail_locked: 'Vergrendeld',
        btn_play: 'Spelen →',
        btn_restart: '↺ Route opnieuw',
        confirm_restart: 'Route opnieuw starten? Alle opgeslagen scores worden gewist.',
        ns_truck: '{moves} zetten (par {par})',
        ns_master: '{guesses}/{max} pogingen',
        ns_wire: '{moves} zetten',
        ns_slot: '{score} ptn, {hits}/{reels} raak',
        ns_block: '{blocks} blokken gestapeld',
        ns_paper_pieces: '{pieces} stukjes geplaatst',
        ns_paper_solved: 'opgelost',
    },
    de: {
        default_title: 'Minigame-Pfad',
        mode_ordered: '➡️ Der Reihe nach spielen',
        mode_free: '🔀 In beliebiger Reihenfolge',
        lbl_games: 'Spiele', lbl_score: 'Punkte', lbl_stars: 'Sterne',
        greeting: '🎉 Pfad abgeschlossen!',
        greeting_named: '🎉 Pfad abgeschlossen, {name}!',
        pts_unit: 'Pkt',
        stars_of: '{stars} von {max} Sternen',
        grade_outstanding: '🏆 Hervorragend!',
        grade_great: '🥇 Starker Lauf!',
        grade_welldone: '🥈 Gut gemacht!',
        grade_completed: '🥉 Pfad abgeschlossen!',
        detail_notplayed: 'Noch nicht gespielt',
        detail_locked: 'Gesperrt',
        btn_play: 'Spielen →',
        btn_restart: '↺ Pfad neu starten',
        confirm_restart: 'Pfad neu starten? Alle gespeicherten Punkte werden gelöscht.',
        ns_truck: '{moves} Züge (Par {par})',
        ns_master: '{guesses}/{max} Versuche',
        ns_wire: '{moves} Züge',
        ns_slot: '{score} Pkt, {hits}/{reels} Treffer',
        ns_block: '{blocks} Blöcke gestapelt',
        ns_paper_pieces: '{pieces} Teile platziert',
        ns_paper_solved: 'gelöst',
    },
};

async function fetchText(url) {
    const res = await fetch(new URL(url, window.location.href), { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
    return res.text();
}

// A loader that fetches each absolute URL at most once per build. Shared
// dependencies (the stqry bridge, chain.js, common.css, module graphs) are
// pulled in by every game page; without this they'd be refetched once per
// game. Keyed on the resolved href; caches the in-flight promise so parallel
// callers dedupe too. Scoped to one buildTrailFiles call, so it never serves
// stale bytes across separate builds (fetchText still bypasses the HTTP cache).
function memoLoader() {
    const cache = new Map();
    return url => {
        const href = new URL(url, window.location.href).href;
        if (!cache.has(href)) cache.set(href, fetchText(href));
        return cache.get(href);
    };
}

function asciiJson(obj) {
    return JSON.stringify(obj)
        .replace(/[\u0080-\uffff]/g,
            c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
        .replace(/<\//g, '<\\/');
}

function escapeScriptText(js) {
    return js.replace(/<\/script/gi, '<\\/script');
}

function slugify(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'game';
}

const EXT_BY_MIME = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'image/gif': 'gif',
};

// Decode a base64 data URL into raw bytes + a file extension. Returns null for
// anything that isn't a base64 data URL (left inline, untouched).
function dataUrlToBytes(dataUrl) {
    if (typeof dataUrl !== 'string' || dataUrl.slice(0, 5) !== 'data:') return null;
    const comma = dataUrl.indexOf(',');
    if (comma === -1 || dataUrl.lastIndexOf(';base64', comma) === -1) return null;
    const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
    const bin = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, ext: EXT_BY_MIME[mime] || 'img' };
}

/**
 * Pure template: the hub / overview page. Game cards link to sibling files.
 *
 * @param {Object} opts
 * @param {Object} opts.def trail definition { v, id, title, mode, games }
 * @param {string[]} opts.files per-game relative filenames (parallel to games)
 * @param {string} opts.bridgeSrc stqry-bridge.js source to inline
 */
export function indexPageSource({ def, files, bridgeSrc }) {
    return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n' +
'<title>' + (def.title || 'Minigame Trail').replace(/</g, '&lt;') + '</title>\n' +
'<script>\n' +
'// Storage fallback for hosts that block web storage.\n' +
'(function () {\n' +
'    function memStorage() {\n' +
'        var m = {};\n' +
'        return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },\n' +
'            setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; }, clear: function () { m = {}; } };\n' +
'    }\n' +
'    try { window.localStorage.getItem("-probe-"); window.sessionStorage.getItem("-probe-"); }\n' +
'    catch (e) {\n' +
'        try { Object.defineProperty(window, "localStorage", { value: memStorage() }); } catch (e2) {}\n' +
'        try { Object.defineProperty(window, "sessionStorage", { value: memStorage() }); } catch (e2) {}\n' +
'    }\n' +
'})();\n' +
'</' + 'script>\n' +
'<script>\n' + escapeScriptText(bridgeSrc) + '\n</' + 'script>\n' +
'<style>\n' +
'* { margin: 0; padding: 0; box-sizing: border-box; }\n' +
'body { font-family: system-ui, -apple-system, sans-serif; background: #f4f4f6; color: #1a1a1a; min-height: 100vh; padding: 20px 14px 40px; }\n' +
'.wrap { max-width: 560px; margin: 0 auto; }\n' +
'header { text-align: center; margin-bottom: 16px; }\n' +
'header h1 { font-size: 1.5em; }\n' +
'.mode-badge { display: inline-block; font-size: 0.75em; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; background: #fff; border: 1px solid #e7e7e7; border-radius: 20px; padding: 4px 12px; margin-top: 6px; color: #5e5e5e; }\n' +
'.progress-panel { background: #fff; border: 1px solid #e7e7e7; border-radius: 16px; padding: 16px; margin-bottom: 14px; display: flex; justify-content: space-around; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }\n' +
'.stat .label { font-size: 0.72em; font-weight: 700; color: #5e5e5e; text-transform: uppercase; }\n' +
'.stat .value { font-size: 1.6em; font-weight: 800; }\n' +
'.final-panel { display: none; background: linear-gradient(160deg, #fff8e6, #ffefc2); border: 2px solid #e2a31c; border-radius: 16px; padding: 22px 16px; margin-bottom: 14px; text-align: center; }\n' +
'.final-panel.visible { display: block; }\n' +
'.final-panel .big { font-size: 2.6em; font-weight: 800; color: #e2a31c; line-height: 1.1; }\n' +
'.final-panel .grade { font-size: 1.3em; margin: 6px 0; }\n' +
'.game-card { background: #fff; border: 1px solid #e7e7e7; border-radius: 14px; padding: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); text-decoration: none; color: inherit; }\n' +
'.game-card.locked { opacity: 0.55; }\n' +
'.game-card .num { width: 34px; height: 34px; border-radius: 50%; background: #ececec; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }\n' +
'.game-card.done .num { background: #2e9e4f; color: #fff; }\n' +
'.game-card .info { flex: 1; min-width: 0; }\n' +
'.game-card .name { font-weight: 800; }\n' +
'.game-card .detail { font-size: 0.82em; color: #5e5e5e; margin-top: 2px; }\n' +
'.game-card .score { text-align: right; flex-shrink: 0; }\n' +
'.game-card .pts { font-weight: 800; font-size: 1.15em; }\n' +
'.game-card .stars { font-size: 0.85em; letter-spacing: 1px; }\n' +
'.go { font-weight: 800; color: #e2a31c; flex-shrink: 0; }\n' +
'.btn { display: inline-block; border: 0; border-radius: 10px; padding: 9px 16px; font: inherit; font-weight: 800; cursor: pointer; background: #ececec; color: #1a1a1a; }\n' +
'.footer-row { text-align: center; margin-top: 18px; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="wrap">\n' +
'    <header><h1 id="trailTitle"></h1><span class="mode-badge" id="modeBadge"></span></header>\n' +
'    <div class="final-panel" id="finalPanel">\n' +
'        <div id="finalGreeting" style="font-weight:800;">🎉 Trail complete!</div>\n' +
'        <div class="big"><span id="finalPts">0</span><span id="finalPtsUnit"> pts</span></div>\n' +
'        <div class="grade" id="finalGrade"></div>\n' +
'        <p id="finalStars" style="color:#5e5e5e;margin-top:6px;"></p>\n' +
'    </div>\n' +
'    <div class="progress-panel">\n' +
'        <div class="stat"><div class="label">Games</div><div class="value" id="doneVal">0/0</div></div>\n' +
'        <div class="stat"><div class="label">Score</div><div class="value" id="ptsVal">0</div></div>\n' +
'        <div class="stat"><div class="label">Stars</div><div class="value" id="starsVal">0</div></div>\n' +
'    </div>\n' +
'    <div id="gameList"></div>\n' +
'    <div class="footer-row"><button class="btn" id="resetBtn">↺ Restart Trail</button></div>\n' +
'</div>\n' +
'<script>\n' +
'(function () {\n' +
'    "use strict";\n' +
'    var DEF = ' + asciiJson(def) + ';\n' +
'    var FILES = ' + JSON.stringify(files) + ';\n' +
'    var storageKey = "trail-" + DEF.id;\n' +
'    var N = DEF.games.length;\n' +
'    var STR = ' + asciiJson(HUB_STRINGS) + ';\n' +
'    var LANG = (DEF.lang && STR[DEF.lang]) ? DEF.lang : "en";\n' +
'    document.documentElement.lang = LANG;\n' +
'    function L(key, vars) {\n' +
'        var s = (STR[LANG] && STR[LANG][key]); if (s == null) s = STR.en[key];\n' +
'        if (s == null) return key;\n' +
'        if (vars) { for (var k in vars) s = s.split("{" + k + "}").join(vars[k]); }\n' +
'        return s;\n' +
'    }\n' +
'    function byId(id) { return document.getElementById(id); }\n' +
'    byId("trailTitle").textContent = "🏁 " + (DEF.title || L("default_title"));\n' +
'    byId("modeBadge").textContent = DEF.mode === "ordered" ? L("mode_ordered") : L("mode_free");\n' +
'    byId("finalGreeting").textContent = L("greeting");\n' +
'    byId("finalPtsUnit").textContent = " " + L("pts_unit");\n' +
'    byId("resetBtn").textContent = L("btn_restart");\n' +
'    (function () { var labels = document.querySelectorAll(".progress-panel .stat .label");\n' +
'        if (labels[0]) labels[0].textContent = L("lbl_games");\n' +
'        if (labels[1]) labels[1].textContent = L("lbl_score");\n' +
'        if (labels[2]) labels[2].textContent = L("lbl_stars"); })();\n' +
'    function isDone(prog, i) { return !!(prog && prog.scores && prog.scores[String(i)]); }\n' +
'    function isUnlocked(prog, i) {\n' +
'        if (DEF.mode !== "ordered") return true;\n' +
'        for (var j = 0; j < i; j++) if (!isDone(prog, j)) return false;\n' +
'        return true;\n' +
'    }\n' +
'    function nativeSummary(slug, n) {\n' +
'        if (!n) return "";\n' +
'        switch (slug) {\n' +
'            case "truck-jam":     return L("ns_truck", { moves: n.moves, par: n.par });\n' +
'            case "mastermind":    return L("ns_master", { guesses: n.guesses, max: n.maxGuesses });\n' +
'            case "wire-puzzle":   return L("ns_wire", { moves: n.moves });\n' +
'            case "slot-reaction": return L("ns_slot", { score: n.score, hits: n.hits, reels: n.reels });\n' +
'            case "block-stack":   return L("ns_block", { blocks: n.blocks });\n' +
'            case "paper-puzzle":  return n.pieces ? L("ns_paper_pieces", { pieces: n.pieces }) : L("ns_paper_solved");\n' +
'            default: return "";\n' +
'        }\n' +
'    }\n' +
'    function render(prog) {\n' +
'        var scores = (prog && prog.scores) || {};\n' +
'        var done = 0, totalPts = 0, totalStars = 0;\n' +
'        var list = byId("gameList"); list.innerHTML = "";\n' +
'        DEF.games.forEach(function (g, i) {\n' +
'            var s = scores[String(i)];\n' +
'            var unlocked = isUnlocked(prog, i);\n' +
'            var card = document.createElement(unlocked ? "a" : "div");\n' +
'            card.className = "game-card" + (s ? " done" : "") + (!unlocked ? " locked" : "");\n' +
'            if (unlocked) card.href = FILES[i];\n' +
'            var num = document.createElement("div"); num.className = "num";\n' +
'            num.textContent = s ? "✓" : (unlocked ? (i + 1) : "🔒"); card.appendChild(num);\n' +
'            var info = document.createElement("div"); info.className = "info";\n' +
'            var name = document.createElement("div"); name.className = "name";\n' +
'            name.textContent = g.name || g.slug; info.appendChild(name);\n' +
'            var detail = document.createElement("div"); detail.className = "detail";\n' +
'            detail.textContent = s ? nativeSummary(g.slug, s.native) : (unlocked ? L("detail_notplayed") : L("detail_locked"));\n' +
'            info.appendChild(detail); card.appendChild(info);\n' +
'            if (s) {\n' +
'                done++; totalPts += s.points; totalStars += s.stars || 0;\n' +
'                var sc = document.createElement("div"); sc.className = "score";\n' +
'                sc.innerHTML = "<div class=\\"pts\\">" + s.points + "</div><div class=\\"stars\\">" + "⭐".repeat(s.stars || 0) + "</div>";\n' +
'                card.appendChild(sc);\n' +
'            } else if (unlocked) {\n' +
'                var go = document.createElement("div"); go.className = "go"; go.textContent = L("btn_play"); card.appendChild(go);\n' +
'            }\n' +
'            list.appendChild(card);\n' +
'        });\n' +
'        byId("doneVal").textContent = done + "/" + N;\n' +
'        byId("ptsVal").textContent = totalPts;\n' +
'        byId("starsVal").textContent = totalStars + "/" + N * 3;\n' +
'        var fp = byId("finalPanel");\n' +
'        if (done === N && N > 0) {\n' +
'            fp.classList.add("visible");\n' +
'            byId("finalPts").textContent = totalPts;\n' +
'            byId("finalStars").textContent = L("stars_of", { stars: totalStars, max: N * 3 });\n' +
'            var pct = totalPts / (N * 100);\n' +
'            byId("finalGrade").textContent = pct >= 0.9 ? L("grade_outstanding") : pct >= 0.7 ? L("grade_great") : pct >= 0.5 ? L("grade_welldone") : L("grade_completed");\n' +
'            if (window.stqry && stqry.user) { stqry.user.get(function (u) { if (u && u.name && !u.isGuest) byId("finalGreeting").textContent = L("greeting_named", { name: u.name }); }); }\n' +
'        } else { fp.classList.remove("visible"); }\n' +
'    }\n' +
'    function refresh() { stqry.storage.get(storageKey, function (v) { render(v || null); }); }\n' +
'    byId("resetBtn").addEventListener("click", function () {\n' +
'        if (!confirm(L("confirm_restart"))) return;\n' +
'        stqry.storage.remove(storageKey, refresh);\n' +
'    });\n' +
'    window.addEventListener("stqryStorageUpdated", refresh);\n' +
'    window.addEventListener("storage", refresh);\n' +
'    refresh();\n' +
'})();\n' +
'</' + 'script>\n' +
'</body>\n' +
'</html>\n';
}

/**
 * Build all files for a downloadable trail.
 *
 * @param {Object} opts
 * @param {Object} opts.def trail definition { v, id, title, mode, games }
 * @param {Array}  opts.levels per-game level payload (or null), parallel to games
 * @returns {Promise<{ folder: string, files: Array<{name, data}> }>}
 */
export async function buildTrailFiles({ def, levels }) {
    const folder = (pageFileName(def.title + ' trail').replace(/\.html$/, '')) || 'trail';
    const gameFiles = def.games.map((g, i) => 'game-' + (i + 1) + '-' + slugify(g.slug) + '.html');
    const files = [];

    const load = memoLoader();
    const bridgeSrc = await load('../shared/stqry-bridge.js');

    for (let i = 0; i < def.games.length; i++) {
        const g = def.games[i];
        let level = levels[i] || null;

        // Pull big base64 images out into their own compressed files.
        if (level && level.img) {
            const decoded = dataUrlToBytes(level.img);
            if (decoded) {
                const assetName = 'assets/game-' + (i + 1) + '.' + decoded.ext;
                files.push({ name: folder + '/' + assetName, data: decoded.bytes });
                level = Object.assign({}, level, { img: assetName });
            }
        }

        const html = await buildStandalonePage({
            gamePage: '../' + g.slug + '/game.html',
            level,
            title: (g.name || g.slug) + ' – ' + (def.title || 'Trail'),
            inject: {
                STANDALONE_TRAIL: { def, index: i, files: gameFiles, indexFile: 'index.html' },
            },
            load,
        });
        files.push({ name: folder + '/' + gameFiles[i], data: html });
    }

    files.push({ name: folder + '/index.html', data: indexPageSource({ def, files: gameFiles, bridgeSrc }) });
    return { folder, files };
}
