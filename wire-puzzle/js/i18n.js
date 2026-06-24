/* Wire Puzzle - language strings.
 * Machinery lives in ../shared/i18n.js (window.MiniI18n); this file supplies the
 * strings and exposes the instance as window.WireI18n. In a trail the language
 * follows the trail automatically.
 */
window.WireI18n = (function () {
    'use strict';

    const T = {
        en: {
            // index.html
            doc_title: 'Wire Puzzle - Connect the Power!',
            title: '⚡ Wire Puzzle',
            tagline: 'Rotate the tiles to connect the power source to the light!',
            play: '🎮 Play Game',
            editor: '🔧 Level Editor',
            custom: '📁 Custom Levels',
            theme_heading: '🎨 Theme',
            features: [
                '8 built-in levels with increasing difficulty',
                'Create your own custom levels',
                'Test your levels instantly',
                'Export and share levels with friends',
                'Track your moves and solve efficiently',
            ],

            // game.html static
            game_doc_title: 'Wire Puzzle - Play',
            page_title_play: 'Play Wire Puzzle',
            selector_title: 'Select a Level',
            selector_title_custom: 'Select a Custom Level',
            page_title_custom: 'Custom Levels',
            page_title_shared: 'Shared Level',
            page_title_default: 'Wire Puzzle',
            btn_reset: '🔄 Reset',
            btn_share: '🔗 Share',
            level_name_placeholder: 'Level Name',
            stat_moves: 'Moves',
            stat_status: 'Status',
            status_solving: 'Solving...',
            status_complete: '✓ Complete!',
            how_to_play: 'How to Play',
            how_line_1: '🖱️ Click on tiles to rotate them',
            how_line_2: '⚡ Connect the power source to the light',
            how_line_3: '🎯 Solve in minimum moves!',
            win_default: '🎉 Level Complete!',
            total_moves: 'Total Moves',
            btn_next: 'Next Level →',
            btn_replay: '🔄 Replay',

            // game.html dynamic
            no_custom_html: '<div class="info-panel"><p>No custom levels found. Create one in the Level Editor!</p><a href="editor.html" class="btn btn-primary">Go to Editor</a></div>',
            invalid_link: 'Invalid level link. Please check the URL and try again.',
            no_level_share: 'No level to share!',
            share_copied: 'Share link copied to clipboard!\n\nAnyone with this link can play this level.',
            confirm_delete: 'Delete level "{name}"?',
        },
        nl: {
            // index.html
            doc_title: 'Draadpuzzel - Verbind de stroom!',
            title: '⚡ Draadpuzzel',
            tagline: 'Draai de tegels om de stroombron met het lampje te verbinden!',
            play: '🎮 Spelen',
            editor: '🔧 Levelmaker',
            custom: '📁 Eigen levels',
            theme_heading: '🎨 Thema',
            features: [
                '8 ingebouwde levels met oplopende moeilijkheid',
                'Maak je eigen levels',
                'Test je levels meteen',
                'Exporteer levels en deel ze met vrienden',
                'Volg je zetten en los efficiënt op',
            ],

            // game.html static
            game_doc_title: 'Draadpuzzel - Spelen',
            page_title_play: 'Draadpuzzel spelen',
            selector_title: 'Kies een level',
            selector_title_custom: 'Kies een eigen level',
            page_title_custom: 'Eigen levels',
            page_title_shared: 'Gedeeld level',
            page_title_default: 'Draadpuzzel',
            btn_reset: '🔄 Reset',
            btn_share: '🔗 Delen',
            level_name_placeholder: 'Levelnaam',
            stat_moves: 'Zetten',
            stat_status: 'Status',
            status_solving: 'Bezig...',
            status_complete: '✓ Voltooid!',
            how_to_play: 'Hoe te spelen',
            how_line_1: '🖱️ Klik op tegels om ze te draaien',
            how_line_2: '⚡ Verbind de stroombron met het lampje',
            how_line_3: '🎯 Los op in zo min mogelijk zetten!',
            win_default: '🎉 Level voltooid!',
            total_moves: 'Totaal aantal zetten',
            btn_next: 'Volgend level →',
            btn_replay: '🔄 Opnieuw',

            // game.html dynamic
            no_custom_html: '<div class="info-panel"><p>Geen eigen levels gevonden. Maak er een in de Levelmaker!</p><a href="editor.html" class="btn btn-primary">Naar de maker</a></div>',
            invalid_link: 'Ongeldige levellink. Controleer de URL en probeer het opnieuw.',
            no_level_share: 'Geen level om te delen!',
            share_copied: 'Deellink gekopieerd naar het klembord!\n\nIedereen met deze link kan dit level spelen.',
            confirm_delete: 'Level "{name}" verwijderen?',
        },
        de: {
            // index.html
            doc_title: 'Kabelrätsel - Verbinde den Strom!',
            title: '⚡ Kabelrätsel',
            tagline: 'Drehe die Kacheln, um die Stromquelle mit der Lampe zu verbinden!',
            play: '🎮 Spielen',
            editor: '🔧 Level-Editor',
            custom: '📁 Eigene Level',
            theme_heading: '🎨 Thema',
            features: [
                '8 eingebaute Level mit steigendem Schwierigkeitsgrad',
                'Erstelle deine eigenen Level',
                'Teste deine Level sofort',
                'Exportiere Level und teile sie mit Freunden',
                'Verfolge deine Züge und löse effizient',
            ],

            // game.html static
            game_doc_title: 'Kabelrätsel - Spielen',
            page_title_play: 'Kabelrätsel spielen',
            selector_title: 'Wähle ein Level',
            selector_title_custom: 'Wähle ein eigenes Level',
            page_title_custom: 'Eigene Level',
            page_title_shared: 'Geteiltes Level',
            page_title_default: 'Kabelrätsel',
            btn_reset: '🔄 Zurücksetzen',
            btn_share: '🔗 Teilen',
            level_name_placeholder: 'Levelname',
            stat_moves: 'Züge',
            stat_status: 'Status',
            status_solving: 'Läuft...',
            status_complete: '✓ Geschafft!',
            how_to_play: 'So wird gespielt',
            how_line_1: '🖱️ Klicke auf Kacheln, um sie zu drehen',
            how_line_2: '⚡ Verbinde die Stromquelle mit der Lampe',
            how_line_3: '🎯 Löse es in möglichst wenigen Zügen!',
            win_default: '🎉 Level geschafft!',
            total_moves: 'Züge insgesamt',
            btn_next: 'Nächstes Level →',
            btn_replay: '🔄 Nochmal',

            // game.html dynamic
            no_custom_html: '<div class="info-panel"><p>Keine eigenen Level gefunden. Erstelle eines im Level-Editor!</p><a href="editor.html" class="btn btn-primary">Zum Editor</a></div>',
            invalid_link: 'Ungültiger Level-Link. Bitte überprüfe die URL und versuche es erneut.',
            no_level_share: 'Kein Level zum Teilen!',
            share_copied: 'Teil-Link in die Zwischenablage kopiert!\n\nJeder mit diesem Link kann dieses Level spielen.',
            confirm_delete: 'Level „{name}“ löschen?',
        },
    };

    return window.MiniI18n.create({ ns: 'wirePuzzle', strings: T });
})();
