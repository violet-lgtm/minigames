/*
 * Shared lightweight i18n engine for the minigames.
 *
 * Modelled on Reaction Slots' original self-contained i18n, lifted into one
 * place so every game shares the same machinery and the same language menu.
 *
 *   var I = window.MiniI18n.create({ ns: 'truckJam', strings: { en, nl, de } });
 *   I.t(key, vars)   -> a translated string ({placeholders} filled from vars)
 *   I.tf(key)        -> the raw value (for arrays such as feature lists)
 *   I.onChange(cb)   -> run cb(lang) whenever the language changes
 *   I.set(code)      -> switch language
 *   I.applyStatic()  -> (re)apply every [data-i18n] element's text
 *   I.lang           -> current language code
 *
 * Language priority:
 *   1. The language baked into an active trail, so every game played as part
 *      of one trail stays in a single language (see trailLang()).
 *   2. The player's own saved choice (localStorage, per game namespace).
 *   3. The browser language.
 *   4. English.
 *
 * When a trail dictates the language the floating language menu is hidden —
 * the trail owns that choice and switching mid-trail would break consistency.
 */
window.MiniI18n = (function () {
    'use strict';

    var DEFAULT_LANGS = [
        { code: 'en', label: 'EN', flag: '🇬🇧' },
        { code: 'nl', label: 'NL', flag: '🇳🇱' },
        { code: 'de', label: 'DE', flag: '🇩🇪' },
    ];

    // The language menu is styled once per page from here, so a game only needs
    // to load this script (not duplicate the CSS) to get a consistent menu.
    // Falls back to sensible colours when a game's theme vars are absent.
    var STYLE_ID = 'mini-i18n-style';
    var CSS =
        '.lang-menu{position:fixed;top:14px;right:14px;display:flex;gap:4px;' +
        'background:var(--surface,#fff);border:1px solid var(--surface-border,#e7e7e7);' +
        'border-radius:22px;padding:4px;box-shadow:0 2px 8px rgba(0,0,0,0.12);z-index:300;}' +
        '.lang-btn{display:inline-flex;align-items:center;gap:5px;border:none;background:none;' +
        'color:var(--text-secondary,#5e5e5e);font-family:inherit;font-size:0.82em;font-weight:700;' +
        'padding:6px 11px;border-radius:18px;cursor:pointer;transition:background 0.15s,color 0.15s;}' +
        '.lang-btn:hover{background:var(--option-bg,#dcdcdc);}' +
        '.lang-btn.active{background:var(--accent,#f6b62e);color:var(--text-primary,#1a1a1a);}' +
        '.lang-flag{font-size:1.05em;line-height:1;}' +
        '@media (max-width:768px){.lang-menu{top:10px;right:10px;}' +
        '.lang-btn{padding:5px 8px;font-size:0.78em;}}';

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = CSS;
        (document.head || document.documentElement).appendChild(s);
    }

    // Read the language baked into an active trail, if any. Works for both
    // hosted links (?trail=<b64 def>) and downloaded standalone pages
    // (window.STANDALONE_TRAIL.def). Returns a language code or null.
    function trailLang() {
        try {
            var st = window.STANDALONE_TRAIL;
            if (st && st.def && st.def.lang) return st.def.lang;
        } catch (e) { /* ignore */ }
        try {
            var b64 = new URLSearchParams(window.location.search).get('trail');
            if (b64) {
                var def = JSON.parse(decodeURIComponent(escape(atob(b64))));
                if (def && def.lang) return def.lang;
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function create(config) {
        var T = config.strings || {};
        var LANGS = (config.langs || DEFAULT_LANGS).filter(function (L) { return T[L.code]; });
        var KEY = (config.ns || 'minigame') + '.lang';
        var listeners = [];
        var lang = 'en';
        var menuEl = null;
        var locked = false; // a trail is dictating the language

        function detect() {
            var tl = trailLang();
            if (tl && T[tl]) { locked = true; return tl; }
            try {
                var saved = localStorage.getItem(KEY);
                if (saved && T[saved]) return saved;
            } catch (e) { /* ignore */ }
            var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
            return T[nav] ? nav : 'en';
        }

        function raw(key) {
            var v = T[lang] && T[lang][key];
            return v != null ? v : (T.en ? T.en[key] : undefined);
        }

        function t(key, vars) {
            var s = raw(key);
            if (s == null) return key;
            if (vars) {
                for (var k in vars) s = s.split('{' + k + '}').join(vars[k]);
            }
            return s;
        }

        // For non-string values (e.g. a features array).
        function tf(key) { return raw(key); }

        function applyStatic(root) {
            (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
                el.textContent = t(el.getAttribute('data-i18n'));
            });
        }

        function notify() {
            listeners.forEach(function (cb) { try { cb(lang); } catch (e) { /* ignore */ } });
        }

        function set(code) {
            if (!T[code]) return;
            lang = code;
            try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
            document.documentElement.lang = lang;
            updateMenu();
            applyStatic(document);
            notify();
        }

        function onChange(cb) { listeners.push(cb); }

        function buildMenu() {
            if (locked) return; // the trail owns the language; no switcher
            injectStyle();
            menuEl = document.createElement('div');
            menuEl.className = 'lang-menu';
            menuEl.setAttribute('aria-label', 'Language');
            LANGS.forEach(function (L) {
                var b = document.createElement('button');
                b.className = 'lang-btn';
                b.dataset.lang = L.code;
                b.innerHTML = '<span class="lang-flag">' + L.flag + '</span>' + L.label;
                b.addEventListener('click', function () { set(L.code); });
                menuEl.appendChild(b);
            });
            document.body.appendChild(menuEl);
            updateMenu();
        }

        function updateMenu() {
            if (!menuEl) return;
            menuEl.querySelectorAll('.lang-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.lang === lang);
            });
        }

        function init() {
            lang = detect();
            document.documentElement.lang = lang;
            buildMenu();
            applyStatic(document);
            notify();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

        return {
            t: t,
            tf: tf,
            onChange: onChange,
            set: set,
            applyStatic: applyStatic,
            get lang() { return lang; },
            get locked() { return locked; },
        };
    }

    return { create: create, trailLang: trailLang };
})();
