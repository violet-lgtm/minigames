/*
 * Standalone trail page builder.
 *
 * buildTrailPage() bundles a whole trail — hub screen plus every game — into
 * ONE self-contained HTML file that can be hosted anywhere on its own.
 *
 * How the file works at runtime:
 *  - Each game was built with buildStandalonePage() (level baked in via
 *    window.STANDALONE_LEVEL, trail context via window.STANDALONE_TRAIL) and
 *    is embedded as a base64 string, played inside an <iframe srcdoc>.
 *  - The game's bundled stqry bridge detects the iframe and sends its
 *    storage calls to the hub via postMessage; the hub implements the
 *    parent side of the STQRY protocol and delegates to its OWN stqry
 *    bridge — so scores persist via localStorage in a browser and via the
 *    stqry app when the trail page is hosted inside its WebView.
 *  - The hub shows progress, per-game scores, locks (ordered mode) and the
 *    final score, exactly like trail/results.html.
 */
import { buildStandalonePage } from './standalone.js';

function b64utf8(str) {
    return btoa(unescape(encodeURIComponent(str)));
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

/**
 * Pure template: returns the hub page HTML.
 *
 * @param {Object} opts
 * @param {Object} opts.def trail definition { v, id, title, mode, games }
 * @param {string[]} opts.bundles base64(utf8) standalone HTML per game
 * @param {string} opts.bridgeSrc stqry-bridge.js source to inline
 * @returns {string}
 */
export function hubPageSource({ def, bundles, bridgeSrc }) {
    return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n' +
'<title>' + (def.title || 'Minigame Trail').replace(/</g, '&lt;') + '</title>\n' +
'<script>\n' +
'// Storage fallback for hosts that block web storage (sandboxed iframes, file://).\n' +
'(function () {\n' +
'    function memStorage() {\n' +
'        var m = {};\n' +
'        return {\n' +
'            getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },\n' +
'            setItem: function (k, v) { m[k] = String(v); },\n' +
'            removeItem: function (k) { delete m[k]; },\n' +
'            clear: function () { m = {}; }\n' +
'        };\n' +
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
'.game-card { background: #fff; border: 1px solid #e7e7e7; border-radius: 14px; padding: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }\n' +
'.game-card.locked { opacity: 0.55; }\n' +
'.game-card .num { width: 34px; height: 34px; border-radius: 50%; background: #ececec; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }\n' +
'.game-card.done .num { background: #2e9e4f; color: #fff; }\n' +
'.game-card .info { flex: 1; min-width: 0; }\n' +
'.game-card .name { font-weight: 800; }\n' +
'.game-card .detail { font-size: 0.82em; color: #5e5e5e; margin-top: 2px; }\n' +
'.game-card .score { text-align: right; flex-shrink: 0; }\n' +
'.game-card .pts { font-weight: 800; font-size: 1.15em; }\n' +
'.game-card .stars { font-size: 0.85em; letter-spacing: 1px; }\n' +
'.btn { display: inline-block; border: 0; border-radius: 10px; padding: 9px 16px; font: inherit; font-weight: 800; cursor: pointer; text-decoration: none; background: #f6b62e; color: #1a1a1a; white-space: nowrap; }\n' +
'.btn:hover { background: #e2a31c; }\n' +
'.btn-ghost { background: #ececec; }\n' +
'.btn-ghost:hover { background: #ddd; }\n' +
'.footer-row { text-align: center; margin-top: 18px; }\n' +
'#player { display: none; position: fixed; inset: 0; z-index: 9999; background: #fff; flex-direction: column; }\n' +
'#player.open { display: flex; }\n' +
'#playerBar { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #14161c; color: #fff; }\n' +
'#playerBar .title { font-weight: 800; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n' +
'#playerFrame { flex: 1; width: 100%; border: 0; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="wrap">\n' +
'    <header>\n' +
'        <h1 id="trailTitle"></h1>\n' +
'        <span class="mode-badge" id="modeBadge"></span>\n' +
'    </header>\n' +
'    <div class="final-panel" id="finalPanel">\n' +
'        <div id="finalGreeting" style="font-weight:800;">🎉 Trail complete!</div>\n' +
'        <div class="big"><span id="finalPts">0</span> pts</div>\n' +
'        <div class="grade" id="finalGrade"></div>\n' +
'        <p id="finalStars" style="color:#5e5e5e;margin-top:6px;"></p>\n' +
'    </div>\n' +
'    <div class="progress-panel">\n' +
'        <div class="stat"><div class="label">Games</div><div class="value" id="doneVal">0/0</div></div>\n' +
'        <div class="stat"><div class="label">Score</div><div class="value" id="ptsVal">0</div></div>\n' +
'        <div class="stat"><div class="label">Stars</div><div class="value" id="starsVal">0</div></div>\n' +
'    </div>\n' +
'    <div id="gameList"></div>\n' +
'    <div class="footer-row">\n' +
'        <button class="btn btn-ghost" id="resetBtn">↺ Restart Trail</button>\n' +
'    </div>\n' +
'</div>\n' +
'<div id="player">\n' +
'    <div id="playerBar">\n' +
'        <button class="btn" id="backBtn">← Trail</button>\n' +
'        <span class="title" id="playerTitle"></span>\n' +
'    </div>\n' +
'    <iframe id="playerFrame" allow="fullscreen"></iframe>\n' +
'</div>\n' +
'<script>\n' +
'(function () {\n' +
'    "use strict";\n' +
'    var DEF = ' + asciiJson(def) + ';\n' +
'    var GAME_PAGES = ' + JSON.stringify(bundles) + ';\n' +
'    var storageKey = "trail-" + DEF.id;\n' +
'    var N = DEF.games.length;\n' +
'    var currentGame = -1;\n' +
'\n' +
'    function fromB64(s) { return decodeURIComponent(escape(atob(s))); }\n' +
'    function byId(id) { return document.getElementById(id); }\n' +
'\n' +
'    byId("trailTitle").textContent = "🏁 " + (DEF.title || "Minigame Trail");\n' +
'    byId("modeBadge").textContent = DEF.mode === "ordered" ? "➡️ Play in order" : "🔀 Play in any order";\n' +
'\n' +
'    function isDone(prog, i) { return !!(prog && prog.scores && prog.scores[String(i)]); }\n' +
'    function isUnlocked(prog, i) {\n' +
'        if (DEF.mode !== "ordered") return true;\n' +
'        for (var j = 0; j < i; j++) if (!isDone(prog, j)) return false;\n' +
'        return true;\n' +
'    }\n' +
'\n' +
'    function nativeSummary(slug, n) {\n' +
'        if (!n) return "";\n' +
'        switch (slug) {\n' +
'            case "truck-jam":     return n.moves + " moves (par " + n.par + ")";\n' +
'            case "mastermind":    return n.guesses + "/" + n.maxGuesses + " guesses";\n' +
'            case "wire-puzzle":   return n.moves + " moves";\n' +
'            case "slot-reaction": return n.score + " pts, " + n.hits + "/" + n.reels + " hits";\n' +
'            case "block-stack":   return n.blocks + " blocks stacked";\n' +
'            case "paper-puzzle":  return n.pieces ? n.pieces + " pieces placed" : "solved";\n' +
'            default: return "";\n' +
'        }\n' +
'    }\n' +
'\n' +
'    function render(prog) {\n' +
'        var scores = (prog && prog.scores) || {};\n' +
'        var done = 0, totalPts = 0, totalStars = 0;\n' +
'        var list = byId("gameList");\n' +
'        list.innerHTML = "";\n' +
'        DEF.games.forEach(function (g, i) {\n' +
'            var s = scores[String(i)];\n' +
'            var unlocked = isUnlocked(prog, i);\n' +
'            var card = document.createElement("div");\n' +
'            card.className = "game-card" + (s ? " done" : "") + (!unlocked ? " locked" : "");\n' +
'            var num = document.createElement("div");\n' +
'            num.className = "num";\n' +
'            num.textContent = s ? "✓" : (i + 1);\n' +
'            card.appendChild(num);\n' +
'            var info = document.createElement("div");\n' +
'            info.className = "info";\n' +
'            var name = document.createElement("div");\n' +
'            name.className = "name";\n' +
'            name.textContent = g.name || g.slug;\n' +
'            info.appendChild(name);\n' +
'            var detail = document.createElement("div");\n' +
'            detail.className = "detail";\n' +
'            detail.textContent = s ? nativeSummary(g.slug, s.native)\n' +
'                : (unlocked ? "Not played yet" : "Locked — finish the games before it");\n' +
'            info.appendChild(detail);\n' +
'            card.appendChild(info);\n' +
'            if (s) {\n' +
'                done++; totalPts += s.points; totalStars += s.stars || 0;\n' +
'                var sc = document.createElement("div");\n' +
'                sc.className = "score";\n' +
'                sc.innerHTML = "<div class=\\"pts\\">" + s.points + "</div>" +\n' +
'                    "<div class=\\"stars\\">" + "⭐".repeat(s.stars || 0) + "</div>";\n' +
'                card.appendChild(sc);\n' +
'            }\n' +
'            if (unlocked) {\n' +
'                var play = document.createElement("button");\n' +
'                play.className = "btn" + (s ? " btn-ghost" : "");\n' +
'                play.textContent = s ? "Improve" : "Play →";\n' +
'                play.addEventListener("click", function () { openGame(i); });\n' +
'                card.appendChild(play);\n' +
'            } else {\n' +
'                var lock = document.createElement("span");\n' +
'                lock.textContent = "🔒";\n' +
'                card.appendChild(lock);\n' +
'            }\n' +
'            list.appendChild(card);\n' +
'        });\n' +
'        byId("doneVal").textContent = done + "/" + N;\n' +
'        byId("ptsVal").textContent = totalPts;\n' +
'        byId("starsVal").textContent = totalStars + "/" + N * 3;\n' +
'        var finalPanel = byId("finalPanel");\n' +
'        if (done === N && N > 0) {\n' +
'            finalPanel.classList.add("visible");\n' +
'            byId("finalPts").textContent = totalPts;\n' +
'            byId("finalStars").textContent = totalStars + " of " + N * 3 + " stars";\n' +
'            var pct = totalPts / (N * 100);\n' +
'            byId("finalGrade").textContent =\n' +
'                pct >= 0.9 ? "🏆 Outstanding!" : pct >= 0.7 ? "🥇 Great run!"\n' +
'                : pct >= 0.5 ? "🥈 Well done!" : "🥉 Trail completed!";\n' +
'            if (window.stqry && stqry.user) {\n' +
'                stqry.user.get(function (user) {\n' +
'                    if (user && user.name && !user.isGuest) {\n' +
'                        byId("finalGreeting").textContent = "🎉 Trail complete, " + user.name + "!";\n' +
'                    }\n' +
'                });\n' +
'            }\n' +
'        } else {\n' +
'            finalPanel.classList.remove("visible");\n' +
'        }\n' +
'    }\n' +
'\n' +
'    function refresh() {\n' +
'        stqry.storage.get(storageKey, function (value) { render(value || null); });\n' +
'    }\n' +
'\n' +
'    function openGame(i) {\n' +
'        stqry.storage.get(storageKey, function (prog) {\n' +
'            if (!isUnlocked(prog, i)) return;\n' +
'            currentGame = i;\n' +
'            byId("playerTitle").textContent = DEF.games[i].name || DEF.games[i].slug;\n' +
'            byId("playerFrame").srcdoc = fromB64(GAME_PAGES[i]);\n' +
'            byId("player").classList.add("open");\n' +
'        });\n' +
'    }\n' +
'\n' +
'    function closeGame() {\n' +
'        currentGame = -1;\n' +
'        byId("player").classList.remove("open");\n' +
'        byId("playerFrame").srcdoc = "";\n' +
'        refresh();\n' +
'    }\n' +
'\n' +
'    byId("backBtn").addEventListener("click", closeGame);\n' +
'    byId("resetBtn").addEventListener("click", function () {\n' +
'        if (!confirm("Restart the trail? All saved scores will be cleared.")) return;\n' +
'        stqry.storage.remove(storageKey, refresh);\n' +
'    });\n' +
'\n' +
'    // ---- parent side of the STQRY protocol for the embedded games ----\n' +
'    // The game\'s bundled bridge detects it runs in an iframe and posts its\n' +
'    // storage calls here; we delegate to OUR bridge (localStorage in a\n' +
'    // browser, the stqry app when this page runs inside its WebView).\n' +
'    window.addEventListener("message", function (e) {\n' +
'        var frame = byId("playerFrame");\n' +
'        if (!frame.contentWindow || e.source !== frame.contentWindow) return;\n' +
'        var msg;\n' +
'        try { msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch (err) { return; }\n' +
'        if (!msg || !msg.action) return;\n' +
'        var d = msg.data || {};\n' +
'        function respond() {\n' +
'            if (!msg.callbackId) return;\n' +
'            e.source.postMessage(JSON.stringify({\n' +
'                action: "callback", callbackId: msg.callbackId,\n' +
'                args: Array.prototype.slice.call(arguments)\n' +
'            }), "*");\n' +
'        }\n' +
'        switch (msg.action) {\n' +
'            case "storage.get":\n' +
'                stqry.storage.get(d.key, function (v) { respond(v); }, d.storageKey);\n' +
'                break;\n' +
'            case "storage.set":\n' +
'                stqry.storage.set(d.changeset, function () { respond(); refresh(); }, d.storageKey);\n' +
'                break;\n' +
'            case "storage.remove":\n' +
'                stqry.storage.remove(d.key, function () { respond(); refresh(); }, d.storageKey);\n' +
'                break;\n' +
'            case "storage.clear":\n' +
'                stqry.storage.clear(function () { respond(); refresh(); }, d.storageKey);\n' +
'                break;\n' +
'            case "minigameTrail.goto":\n' +
'                if (typeof d.index === "number") openGame(d.index);\n' +
'                break;\n' +
'        }\n' +
'    });\n' +
'\n' +
'    // Cross-tab / in-app updates.\n' +
'    window.addEventListener("stqryStorageUpdated", refresh);\n' +
'    window.addEventListener("storage", refresh);\n' +
'\n' +
'    refresh();\n' +
'})();\n' +
'</' + 'script>\n' +
'</body>\n' +
'</html>\n';
}

/**
 * Build the complete standalone trail page.
 *
 * @param {Object} opts
 * @param {Object} opts.def trail definition { v, id, title, mode, games }
 * @param {Array}  opts.levels per-game level payload to bake in (or null),
 *                 parallel to def.games
 * @returns {Promise<string>} the hub page HTML with all games embedded
 */
export async function buildTrailPage({ def, levels }) {
    const bundles = [];
    for (let i = 0; i < def.games.length; i++) {
        const g = def.games[i];
        const html = await buildStandalonePage({
            gamePage: '../' + g.slug + '/game.html',
            level: levels[i] || null,
            title: (g.name || g.slug) + ' – ' + (def.title || 'Trail'),
            inject: { STANDALONE_TRAIL: { def: def, index: i } },
        });
        bundles.push(b64utf8(html));
    }
    const res = await fetch('../shared/stqry-bridge.js', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Could not load the stqry bridge (HTTP ' + res.status + ')');
    const bridgeSrc = await res.text();
    return hubPageSource({ def, bundles, bridgeSrc });
}
