// Built-in Mastermind levels.
import { DEFAULT_COLORS } from './shapes.js';

function colors(n) {
    return DEFAULT_COLORS.slice(0, n);
}

export const builtInLevels = [
    {
        id: 'builtin-1',
        name: 'First Steps',
        difficulty: 'easy',
        config: {
            codeLength: 3,
            maxGuesses: 10,
            colors: colors(4),
            allowDuplicates: false,
            pipShape: 'circle',
            feedbackShape: 'circle',
            colorHints: true,
        },
        secret: null,
        winMessage: 'Nice! You cracked your first code.',
    },
    {
        id: 'builtin-2',
        name: 'Classic Mastermind',
        difficulty: 'medium',
        config: {
            codeLength: 4,
            maxGuesses: 10,
            colors: colors(6),
            allowDuplicates: true,
            pipShape: 'circle',
            feedbackShape: 'circle',
            colorHints: false,
        },
        secret: null,
        winMessage: 'Code cracked! A true codebreaker.',
    },
    {
        id: 'builtin-3',
        name: 'Star Cipher',
        difficulty: 'medium',
        config: {
            codeLength: 4,
            maxGuesses: 9,
            colors: colors(6),
            allowDuplicates: true,
            pipShape: 'star',
            feedbackShape: 'diamond',
            colorHints: false,
        },
        secret: null,
        winMessage: 'The stars align — cipher solved!',
    },
    {
        id: 'builtin-4',
        name: 'Triple Threat',
        difficulty: 'hard',
        config: {
            codeLength: 5,
            maxGuesses: 10,
            colors: colors(7),
            allowDuplicates: true,
            pipShape: 'triangle',
            feedbackShape: 'triangle',
            colorHints: false,
        },
        secret: null,
        winMessage: 'Five pegs, no mercy — brilliantly done!',
    },
    {
        id: 'builtin-5',
        name: 'Grandmaster',
        difficulty: 'hard',
        config: {
            codeLength: 6,
            maxGuesses: 12,
            colors: colors(8),
            allowDuplicates: true,
            pipShape: 'hexagon',
            feedbackShape: 'hexagon',
            colorHints: false,
        },
        secret: null,
        winMessage: 'Grandmaster status: achieved.',
    },
    {
        id: 'builtin-6',
        name: 'The Locked Vault',
        difficulty: 'medium',
        config: {
            codeLength: 4,
            maxGuesses: 8,
            colors: colors(6),
            allowDuplicates: false,
            pipShape: 'diamond',
            feedbackShape: 'heart',
            colorHints: true,
        },
        // A fixed solution - the same code every play.
        secret: [4, 1, 5, 2],
        winMessage: 'The vault swings open. The treasure is yours!',
    },
];
