/*
 * Standalone level page builder — shared by every minigame's editor.
 *
 * buildStandalonePage() fetches a game's play page (game.html), inlines its
 * stylesheets and scripts (bundling ES-module imports into a single script),
 * and bakes the given level in as `window.STANDALONE_LEVEL`. The result is one
 * self-contained HTML file that can be hosted anywhere — its own web page,
 * independent of this site.
 *
 * Each game's play page opts in by checking `window.STANDALONE_LEVEL` before
 * its normal level-selection logic.
 */

async function fetchText(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
    return res.text();
}

// Matches whole-line import statements (the only form used in this repo):
//   import { A, B } from './x.js';   import X from './x.js';   import './x.js';
function importRe() {
    return /^[ \t]*import\s+(?:(?:[\w$]+|\*\s+as\s+[\w$]+|\{[^}]*\})\s+from\s+)?['"]([^'"]+)['"]\s*;?[ \t]*$/gm;
}

// Matches exported top-level declarations: export const/let/var/function/class/async function.
function exportDeclRe() {
    return /^([ \t]*)export[ \t]+(const|let|var|function|class|async[ \t]+function)[ \t]+([A-Za-z_$][\w$]*)/gm;
}

// Turn one module's source into a scoped chunk that exposes only its exports
// to the shared bundle scope (so module-private helpers can't collide).
function moduleChunk(code, label) {
    const names = [];
    const stripped = code
        .replace(importRe(), '')
        .replace(exportDeclRe(), (m, ws, kind, name) => {
            names.push(name);
            return `${ws}${kind} ${name}`;
        });
    const list = names.join(', ');
    return `// ── bundled module: ${label} ──\n` +
        `const { ${list} } = (() => {\n${stripped}\nreturn { ${list} };\n})();\n`;
}

// Depth-first collection of a module graph, emitting dependencies before
// the modules that import them.
async function collectModules(code, baseUrl, seen, chunks) {
    const specs = [...code.matchAll(importRe())].map(m => m[1]);
    for (const spec of specs) {
        const depUrl = new URL(spec, baseUrl);
        if (seen.has(depUrl.href)) continue;
        seen.add(depUrl.href);
        const depCode = await fetchText(depUrl);
        await collectModules(depCode, depUrl, seen, chunks);
        chunks.push(moduleChunk(depCode, depUrl.pathname.split('/').slice(-2).join('/')));
    }
}

// A closing </script> inside inlined code would end the script element early.
// It only ever appears inside string literals here, where <\/ is equivalent.
function escapeScriptText(js) {
    return js.replace(/<\/script/gi, '<\\/script');
}

function bootstrapSource(level) {
    const json = JSON.stringify(level).replace(/<\//g, '<\\/');
    return `
// Injected by the level exporter — this page is fully self-contained.
window.STANDALONE_LEVEL = ${json};
(function () {
    // Some hosts (sandboxed iframes, file://) block web storage entirely;
    // fall back to an in-memory stand-in so the game still runs.
    function memStorage() {
        var m = {};
        return {
            getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
            setItem: function (k, v) { m[k] = String(v); },
            removeItem: function (k) { delete m[k]; },
            clear: function () { m = {}; }
        };
    }
    try {
        window.localStorage.getItem('-probe-');
        window.sessionStorage.getItem('-probe-');
    } catch (e) {
        try { Object.defineProperty(window, 'localStorage', { value: memStorage() }); } catch (e2) {}
        try { Object.defineProperty(window, 'sessionStorage', { value: memStorage() }); } catch (e2) {}
    }
})();
`;
}

/**
 * Build a single-file HTML page for the given level.
 *
 * @param {Object} opts
 * @param {string} [opts.gamePage='game.html'] play page, relative to the calling page
 * @param {Object} opts.level level data the game should boot straight into
 * @param {string} [opts.title] <title> for the exported page
 * @returns {Promise<string>} complete HTML source
 */
export async function buildStandalonePage({ gamePage = 'game.html', level, title }) {
    const pageUrl = new URL(gamePage, window.location.href);
    const doc = new DOMParser().parseFromString(await fetchText(pageUrl), 'text/html');

    // Inline every stylesheet.
    for (const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))) {
        const css = await fetchText(new URL(link.getAttribute('href'), pageUrl));
        const style = doc.createElement('style');
        style.textContent = css;
        link.replaceWith(style);
    }

    // The level (plus a storage fallback) must be defined before any game script runs.
    const boot = doc.createElement('script');
    boot.textContent = bootstrapSource(level);
    doc.head.insertBefore(boot, doc.head.firstChild);

    // Inline classic <script src="..."> files in place (order preserved).
    for (const s of Array.from(doc.querySelectorAll('script[src]'))) {
        const js = await fetchText(new URL(s.getAttribute('src'), pageUrl));
        const inline = doc.createElement('script');
        inline.textContent = escapeScriptText(js);
        s.replaceWith(inline);
    }

    // Bundle inline ES-module scripts: dependencies first, then the page script
    // with its import statements stripped.
    for (const s of Array.from(doc.querySelectorAll('script[type="module"]'))) {
        const chunks = [];
        await collectModules(s.textContent, pageUrl, new Set(), chunks);
        const main = s.textContent.replace(importRe(), '');
        const inline = doc.createElement('script');
        inline.type = 'module'; // no imports remain; keeps strict-mode + deferred semantics
        inline.textContent = escapeScriptText(chunks.join('\n') + '\n' + main);
        s.replaceWith(inline);
    }

    if (title) doc.title = title;
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

/** Trigger a browser download of the generated page. */
export function downloadPage(filename, html) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Safe .html filename from a level name. */
export function pageFileName(name) {
    const slug = String(name || 'level').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return (slug || 'level') + '.html';
}

/**
 * Convenience wrapper used by the editors: validate → build → download,
 * with a friendly error if fetching fails (e.g. opened from file://).
 */
export async function exportStandalonePage({ gamePage = 'game.html', level, gameTitle }) {
    try {
        const html = await buildStandalonePage({
            gamePage,
            level,
            title: `${level.name || 'Custom Level'} – ${gameTitle}`,
        });
        downloadPage(pageFileName(level.name), html);
        alert('Standalone page downloaded!\n\nThe file is fully self-contained — host it anywhere ' +
            '(any web server, GitHub Pages, a CMS upload…) and it works as its own web page.');
    } catch (err) {
        alert('Could not build the standalone page: ' + err.message +
            '\n\nNote: this feature needs the site to be served over HTTP(S).');
    }
}
