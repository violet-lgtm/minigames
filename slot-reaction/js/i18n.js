/* Reaction Slots - lightweight i18n + language selector.
 * Exposes window.SlotI18n with: t(key, vars), tf(key) for arrays,
 * onChange(cb), set(code), and a `lang` getter. Self-initialises on load,
 * builds a fixed language menu, and applies [data-i18n] text automatically.
 */
window.SlotI18n = (function () {
    'use strict';

    const T = {
        en: {
            doc_title: 'Reaction Slots',
            subtitle: 'Three reels are spinning. Stop each one the instant the lucky 7 hits the line!',
            play: '🎮 Play Game',
            features: [
                'A pure reaction-time test disguised as a slot machine',
                'Stop all 3 spinning reels on the glowing target symbol',
                'Each reel spins faster than the last',
                'Millisecond-accurate timing and PERFECT / GREAT / GOOD ratings',
                'Land a neighbouring symbol? Still bag partial NEAR points',
                'Hit the target on multiple reels for a ×2 / ×3 combo multiplier',
                'Tracks your best score locally',
                'Play with a tap, click, or the spacebar',
            ],
            stat_reel: 'Reel',
            stat_score: 'Score',
            stat_combo: 'Combo',
            stat_best: 'Best',
            banner: 'Stop each reel on {sym} as it crosses the line',
            hint: 'Tip: tap STOP, click, or press {key} to lock the active reel.',
            key_space: 'Space',
            btn_start: 'START',
            btn_stop: 'STOP',
            btn_again: 'PLAY AGAIN',
            modal_playagain: '🔄 Play Again',
            modal_back: '← Go back',
            newbest: '🏆 New best score!',
            pts: ' pts',
            title_jackpot: '🎉 JACKPOT! Flawless!',
            title_triple: '🎯 Triple combo!',
            title_sharp: '🔥 Sharp reflexes!',
            title_complete: 'Round Complete!',
            title_practise: 'Keep practising!',
            rating_perfect: 'PERFECT',
            rating_great: 'GREAT',
            rating_good: 'GOOD',
            rating_near: 'NEAR',
            rating_miss: 'MISS',
            reel_label: 'Reel {n}',
            detail_off: '{ms}ms off',
            detail_near: 'next to goal',
            detail_miss: 'off target',
            combo_line: '🎯 {hits}× lucky {sym} combo',
        },
        nl: {
            doc_title: 'Reaction Slots',
            subtitle: 'Drie rollen draaien. Stop elke rol op het moment dat de gelukkige 7 de lijn raakt!',
            play: '🎮 Spelen',
            features: [
                'Een echte reactietest, vermomd als gokkast',
                'Stop alle 3 draaiende rollen op het oplichtende doelsymbool',
                'Elke rol draait sneller dan de vorige',
                'Timing op de milliseconde met PERFECT / GEWELDIG / GOED',
                'Net naast het doel? Je krijgt nog deels DICHTBIJ-punten',
                'Raak het doel op meerdere rollen voor een ×2 / ×3 combo',
                'Houdt je beste score lokaal bij',
                'Speel met een tik, klik of de spatiebalk',
            ],
            stat_reel: 'Rol',
            stat_score: 'Score',
            stat_combo: 'Combo',
            stat_best: 'Beste',
            banner: 'Stop elke rol op {sym} wanneer die de lijn passeert',
            hint: 'Tip: tik op STOP, klik, of druk op {key} om de actieve rol vast te zetten.',
            key_space: 'Spatie',
            btn_start: 'START',
            btn_stop: 'STOP',
            btn_again: 'OPNIEUW',
            modal_playagain: '🔄 Opnieuw spelen',
            modal_back: '← Ga terug',
            newbest: '🏆 Nieuwe topscore!',
            pts: ' ptn',
            title_jackpot: '🎉 JACKPOT! Foutloos!',
            title_triple: '🎯 Triple combo!',
            title_sharp: '🔥 Scherpe reflexen!',
            title_complete: 'Ronde voltooid!',
            title_practise: 'Blijf oefenen!',
            rating_perfect: 'PERFECT',
            rating_great: 'GEWELDIG',
            rating_good: 'GOED',
            rating_near: 'DICHTBIJ',
            rating_miss: 'MIS',
            reel_label: 'Rol {n}',
            detail_off: '{ms}ms ernaast',
            detail_near: 'naast het doel',
            detail_miss: 'ver ernaast',
            combo_line: '🎯 {hits}× gelukkige {sym} combo',
        },
        de: {
            doc_title: 'Reaction Slots',
            subtitle: 'Drei Walzen drehen sich. Stoppe jede genau dann, wenn die Glücks-7 die Linie trifft!',
            play: '🎮 Spielen',
            features: [
                'Ein echter Reaktionstest, getarnt als Spielautomat',
                'Stoppe alle 3 drehenden Walzen auf dem leuchtenden Zielsymbol',
                'Jede Walze dreht sich schneller als die vorige',
                'Timing auf die Millisekunde mit PERFEKT / SUPER / GUT',
                'Knapp daneben? Es gibt trotzdem teilweise KNAPP-Punkte',
                'Triff das Ziel auf mehreren Walzen für einen ×2 / ×3 Combo',
                'Speichert deine Bestleistung lokal',
                'Spiele mit Tippen, Klicken oder der Leertaste',
            ],
            stat_reel: 'Walze',
            stat_score: 'Punkte',
            stat_combo: 'Combo',
            stat_best: 'Beste',
            banner: 'Stoppe jede Walze auf {sym}, wenn sie die Linie kreuzt',
            hint: 'Tipp: Tippe auf STOPP, klicke oder drücke {key}, um die aktive Walze zu stoppen.',
            key_space: 'Leertaste',
            btn_start: 'START',
            btn_stop: 'STOPP',
            btn_again: 'NOCHMAL',
            modal_playagain: '🔄 Nochmal spielen',
            modal_back: '← Zurück',
            newbest: '🏆 Neue Bestleistung!',
            pts: ' Pkt',
            title_jackpot: '🎉 JACKPOT! Makellos!',
            title_triple: '🎯 Dreifach-Combo!',
            title_sharp: '🔥 Schnelle Reflexe!',
            title_complete: 'Runde geschafft!',
            title_practise: 'Weiter üben!',
            rating_perfect: 'PERFEKT',
            rating_great: 'SUPER',
            rating_good: 'GUT',
            rating_near: 'KNAPP',
            rating_miss: 'DANEBEN',
            reel_label: 'Walze {n}',
            detail_off: '{ms}ms daneben',
            detail_near: 'neben dem Ziel',
            detail_miss: 'weit daneben',
            combo_line: '🎯 {hits}× Glücks-{sym}-Combo',
        },
    };

    const LANGS = [
        { code: 'en', label: 'EN', flag: '🇬🇧' },
        { code: 'nl', label: 'NL', flag: '🇳🇱' },
        { code: 'de', label: 'DE', flag: '🇩🇪' },
    ];
    const KEY = 'reactionSlots.lang';
    const listeners = [];
    let lang = 'en';
    let menuEl = null;

    function detect() {
        try {
            const saved = localStorage.getItem(KEY);
            if (saved && T[saved]) return saved;
        } catch (e) { /* ignore */ }
        const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
        return T[nav] ? nav : 'en';
    }

    function raw(key) {
        const v = T[lang] && T[lang][key];
        return v != null ? v : T.en[key];
    }

    function t(key, vars) {
        let s = raw(key);
        if (s == null) return key;
        if (vars) {
            for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
        }
        return s;
    }

    // For non-string values (e.g. the features array).
    function tf(key) { return raw(key); }

    function applyStatic(root) {
        (root || document).querySelectorAll('[data-i18n]').forEach((el) => {
            el.textContent = t(el.getAttribute('data-i18n'));
        });
    }

    function notify() {
        listeners.forEach((cb) => { try { cb(lang); } catch (e) { /* ignore */ } });
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
        menuEl = document.createElement('div');
        menuEl.className = 'lang-menu';
        menuEl.setAttribute('aria-label', 'Language');
        LANGS.forEach((L) => {
            const b = document.createElement('button');
            b.className = 'lang-btn';
            b.dataset.lang = L.code;
            b.innerHTML = '<span class="lang-flag">' + L.flag + '</span>' + L.label;
            b.addEventListener('click', () => set(L.code));
            menuEl.appendChild(b);
        });
        document.body.appendChild(menuEl);
        updateMenu();
    }

    function updateMenu() {
        if (!menuEl) return;
        menuEl.querySelectorAll('.lang-btn').forEach((b) => {
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
        t,
        tf,
        onChange,
        set,
        applyStatic,
        get lang() { return lang; },
    };
})();
