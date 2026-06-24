/* Paper Puzzle - language strings.
 * The i18n machinery lives in ../../shared/i18n.js (window.MiniI18n); this file
 * just supplies the strings and exposes the instance as window.PaperI18n so the
 * page scripts keep their familiar API (t, tf, onChange, set, lang, ...).
 * When played as part of a trail the language follows the trail automatically.
 */
window.PaperI18n = (function () {
    'use strict';

    const T = {
        en: {
            // index.html
            doc_title: 'Paper Puzzle',
            hero_title: 'Paper Puzzle',
            hero_desc: 'Pieces of torn paper are scattered across your desk. Drag them into place to reveal the hidden picture!',
            feat_drag_title: 'Drag & Drop',
            feat_drag_desc: 'Grab torn pieces and slide them into position',
            feat_snap_title: 'Snap to Fit',
            feat_snap_desc: 'Pieces snap together when close enough',
            feat_puzzles_title: '5 Puzzles',
            feat_puzzles_desc: 'Easy to Hard — beautiful canvas-drawn scenes',
            feat_custom_title: 'Custom Levels',
            feat_custom_desc: 'Upload your own image and share a puzzle link',
            feat_touch_title: 'Touch Ready',
            feat_touch_desc: 'Works on phones and tablets too',
            play_now: 'Play Now →',
            create_custom: 'Create Custom Puzzle',
            all_games: '← All Games',

            // game.html
            game_doc_title: 'Paper Puzzle – Play',
            nav_back: '← Back',
            nav_title: 'Paper Puzzle',
            level_aria: 'Choose level',
            reset: 'Reset',
            win_title: '🎉 Puzzle Complete!',
            win_msg: 'All pieces are in place!',
            next_level: 'Next Level →',
            play_again: 'Play Again',
            custom_name: 'Custom Puzzle',
            custom_win_msg: 'You solved it!',
        },
        nl: {
            // index.html
            doc_title: 'Papierpuzzel',
            hero_title: 'Papierpuzzel',
            hero_desc: 'Stukjes gescheurd papier liggen verspreid over je bureau. Sleep ze op hun plek om de verborgen afbeelding te onthullen!',
            feat_drag_title: 'Slepen & neerzetten',
            feat_drag_desc: 'Pak gescheurde stukjes en schuif ze op hun plek',
            feat_snap_title: 'Vastklikken',
            feat_snap_desc: 'Stukjes klikken vast als ze dichtbij genoeg zijn',
            feat_puzzles_title: '5 puzzels',
            feat_puzzles_desc: 'Makkelijk tot moeilijk — prachtige getekende taferelen',
            feat_custom_title: 'Eigen levels',
            feat_custom_desc: 'Upload je eigen afbeelding en deel een puzzellink',
            feat_touch_title: 'Touch-klaar',
            feat_touch_desc: 'Werkt ook op telefoons en tablets',
            play_now: 'Nu spelen →',
            create_custom: 'Eigen puzzel maken',
            all_games: '← Alle spellen',

            // game.html
            game_doc_title: 'Papierpuzzel – Spelen',
            nav_back: '← Terug',
            nav_title: 'Papierpuzzel',
            level_aria: 'Kies level',
            reset: 'Opnieuw',
            win_title: '🎉 Puzzel voltooid!',
            win_msg: 'Alle stukjes liggen op hun plek!',
            next_level: 'Volgend level →',
            play_again: 'Opnieuw spelen',
            custom_name: 'Eigen puzzel',
            custom_win_msg: 'Je hebt hem opgelost!',
        },
        de: {
            // index.html
            doc_title: 'Papierpuzzle',
            hero_title: 'Papierpuzzle',
            hero_desc: 'Zerrissene Papierstücke liegen über deinen Schreibtisch verstreut. Zieh sie an ihren Platz, um das verborgene Bild aufzudecken!',
            feat_drag_title: 'Ziehen & Ablegen',
            feat_drag_desc: 'Greife zerrissene Stücke und schiebe sie an ihren Platz',
            feat_snap_title: 'Einrasten',
            feat_snap_desc: 'Stücke rasten ein, wenn sie nah genug sind',
            feat_puzzles_title: '5 Puzzles',
            feat_puzzles_desc: 'Leicht bis schwer — wunderschön gezeichnete Szenen',
            feat_custom_title: 'Eigene Level',
            feat_custom_desc: 'Lade dein eigenes Bild hoch und teile einen Puzzle-Link',
            feat_touch_title: 'Touch-bereit',
            feat_touch_desc: 'Funktioniert auch auf Handys und Tablets',
            play_now: 'Jetzt spielen →',
            create_custom: 'Eigenes Puzzle erstellen',
            all_games: '← Alle Spiele',

            // game.html
            game_doc_title: 'Papierpuzzle – Spielen',
            nav_back: '← Zurück',
            nav_title: 'Papierpuzzle',
            level_aria: 'Level wählen',
            reset: 'Zurücksetzen',
            win_title: '🎉 Puzzle gelöst!',
            win_msg: 'Alle Teile sind an ihrem Platz!',
            next_level: 'Nächstes Level →',
            play_again: 'Nochmal spielen',
            custom_name: 'Eigenes Puzzle',
            custom_win_msg: 'Du hast es gelöst!',
        },
    };

    return window.MiniI18n.create({ ns: 'paperPuzzle', strings: T });
})();
