// Built-in levels
export const builtInLevels = [
    {
        id: 'tutorial-1',
        name: 'Tutorial: Straight Line',
        difficulty: 'easy',
        gridSize: { width: 4, height: 1 },
        tiles: [
            { type: 'power', x: 0, y: 0, rotation: 0, locked: true },
            { type: 'straight', x: 1, y: 0, rotation: 90 },
            { type: 'straight', x: 2, y: 0, rotation: 90 },
            { type: 'light', x: 3, y: 0, rotation: 0, locked: true }
        ]
    },
    {
        id: 'tutorial-2',
        name: 'Tutorial: Simple Corner',
        difficulty: 'easy',
        gridSize: { width: 3, height: 3 },
        tiles: [
            { type: 'power', x: 0, y: 1, rotation: 0, locked: true },
            { type: 'corner', x: 1, y: 1, rotation: 180 },
            { type: 'corner', x: 1, y: 0, rotation: 90 },
            { type: 'light', x: 2, y: 0, rotation: 0, locked: true }
        ]
    },
    {
        id: 'level-1',
        name: 'Easy Path',
        difficulty: 'easy',
        gridSize: { width: 5, height: 3 },
        tiles: [
            { type: 'power', x: 0, y: 1, rotation: 0, locked: true },
            { type: 'corner', x: 1, y: 1, rotation: 0 },
            { type: 'corner', x: 1, y: 0, rotation: 180 },
            { type: 'straight', x: 2, y: 0, rotation: 90 },
            { type: 'corner', x: 3, y: 0, rotation: 90 },
            { type: 'corner', x: 3, y: 1, rotation: 180 },
            { type: 'light', x: 4, y: 1, rotation: 0, locked: true }
        ]
    },
    {
        id: 'level-2',
        name: 'T-Junction',
        difficulty: 'easy',
        gridSize: { width: 4, height: 4 },
        tiles: [
            { type: 'power', x: 0, y: 2, rotation: 0, locked: true },
            { type: 'straight', x: 1, y: 2, rotation: 0 },
            { type: 't-junction', x: 2, y: 2, rotation: 180 },
            { type: 'corner', x: 2, y: 1, rotation: 270 },
            { type: 'corner', x: 1, y: 1, rotation: 0 },
            { type: 'corner', x: 1, y: 0, rotation: 90 },
            { type: 'light', x: 2, y: 0, rotation: 0, locked: true }
        ]
    },
    {
        id: 'level-3',
        name: 'Crossroads',
        difficulty: 'medium',
        gridSize: { width: 5, height: 5 },
        tiles: [
            { type: 'power', x: 0, y: 2, rotation: 0, locked: true },
            { type: 'straight', x: 1, y: 2, rotation: 90 },
            { type: 'cross', x: 2, y: 2, rotation: 0 },
            { type: 'straight', x: 3, y: 2, rotation: 0 },
            { type: 'corner', x: 2, y: 1, rotation: 0 },
            { type: 'corner', x: 3, y: 1, rotation: 180 },
            { type: 'corner', x: 3, y: 3, rotation: 270 },
            { type: 'straight', x: 2, y: 3, rotation: 0 },
            { type: 'light', x: 4, y: 2, rotation: 0, locked: true }
        ]
    },
    {
        id: 'level-4',
        name: 'Zigzag',
        difficulty: 'medium',
        gridSize: { width: 6, height: 4 },
        tiles: [
            { type: 'power', x: 0, y: 0, rotation: 0, locked: true },
            { type: 'corner', x: 1, y: 0, rotation: 270 },
            { type: 'corner', x: 1, y: 1, rotation: 0 },
            { type: 'corner', x: 2, y: 1, rotation: 270 },
            { type: 'corner', x: 2, y: 2, rotation: 0 },
            { type: 'corner', x: 3, y: 2, rotation: 270 },
            { type: 'corner', x: 3, y: 3, rotation: 0 },
            { type: 'straight', x: 4, y: 3, rotation: 90 },
            { type: 'light', x: 5, y: 3, rotation: 0, locked: true }
        ]
    },
    {
        id: 'level-5',
        name: 'Complex Network',
        difficulty: 'hard',
        gridSize: { width: 6, height: 6 },
        tiles: [
            { type: 'power', x: 0, y: 3, rotation: 0, locked: true },
            { type: 'straight', x: 1, y: 3, rotation: 0 },
            { type: 't-junction', x: 2, y: 3, rotation: 90 },
            { type: 'corner', x: 2, y: 2, rotation: 180 },
            { type: 'straight', x: 3, y: 2, rotation: 0 },
            { type: 't-junction', x: 4, y: 2, rotation: 0 },
            { type: 'corner', x: 4, y: 1, rotation: 270 },
            { type: 'corner', x: 3, y: 1, rotation: 180 },
            { type: 't-junction', x: 3, y: 3, rotation: 270 },
            { type: 'corner', x: 3, y: 4, rotation: 90 },
            { type: 'straight', x: 4, y: 4, rotation: 90 },
            { type: 'light', x: 5, y: 4, rotation: 0, locked: true },
            { type: 'cross', x: 2, y: 4, rotation: 0 },
            { type: 'corner', x: 1, y: 4, rotation: 0 },
            { type: 'corner', x: 1, y: 5, rotation: 90 },
            { type: 'straight', x: 2, y: 5, rotation: 90 }
        ]
    },
    {
        id: 'level-6',
        name: 'The Maze',
        difficulty: 'hard',
        gridSize: { width: 7, height: 7 },
        tiles: [
            { type: 'power', x: 0, y: 0, rotation: 0, locked: true },
            { type: 'corner', x: 1, y: 0, rotation: 270 },
            { type: 't-junction', x: 1, y: 1, rotation: 180 },
            { type: 'corner', x: 2, y: 1, rotation: 270 },
            { type: 'straight', x: 2, y: 2, rotation: 180 },
            { type: 't-junction', x: 2, y: 3, rotation: 0 },
            { type: 'straight', x: 3, y: 3, rotation: 90 },
            { type: 'cross', x: 4, y: 3, rotation: 0 },
            { type: 'corner', x: 4, y: 2, rotation: 180 },
            { type: 'straight', x: 5, y: 2, rotation: 0 },
            { type: 't-junction', x: 6, y: 2, rotation: 90 },
            { type: 'corner', x: 6, y: 3, rotation: 180 },
            { type: 'corner', x: 5, y: 3, rotation: 270 },
            { type: 'corner', x: 5, y: 4, rotation: 0 },
            { type: 't-junction', x: 4, y: 4, rotation: 270 },
            { type: 'corner', x: 4, y: 5, rotation: 90 },
            { type: 'straight', x: 5, y: 5, rotation: 90 },
            { type: 'corner', x: 6, y: 5, rotation: 270 },
            { type: 'corner', x: 6, y: 6, rotation: 90 },
            { type: 'light', x: 5, y: 6, rotation: 0, locked: true },
            { type: 'corner', x: 1, y: 2, rotation: 0 },
            { type: 'corner', x: 0, y: 2, rotation: 270 },
            { type: 'straight', x: 0, y: 3, rotation: 180 },
            { type: 'corner', x: 0, y: 4, rotation: 0 }
        ]
    }
];
