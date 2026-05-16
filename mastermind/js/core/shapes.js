// Pip / peg shape definitions and shared peg-building helpers.

export const PIP_SHAPES = {
    circle:   { name: 'Circle',   clip: 'circle(50%)' },
    square:   { name: 'Square',   clip: 'inset(0%)' },
    rounded:  { name: 'Rounded',  clip: 'inset(0% round 24%)' },
    triangle: { name: 'Triangle', clip: 'polygon(50% 2%, 98% 96%, 2% 96%)' },
    diamond:  { name: 'Diamond',  clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
    star:     { name: 'Star',     clip: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
    hexagon:  { name: 'Hexagon',  clip: 'polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0% 50%)' },
    heart:    { name: 'Heart',    clip: 'polygon(50% 100%, 14% 62%, 2% 38%, 9% 16%, 29% 9%, 50% 26%, 71% 9%, 91% 16%, 98% 38%, 86% 62%)' },
    shield:   { name: 'Shield',   clip: 'polygon(50% 0%, 100% 12%, 100% 55%, 50% 100%, 0% 55%, 0% 12%)' },
};

// Default color palette (used for built-in levels and as editor starting point).
export const DEFAULT_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#e67e22',
    '#9b59b6', '#1abc9c', '#ff79c6', '#ecf0f1', '#7f8c8d'
];

export function shapeClipPath(shapeId) {
    return (PIP_SHAPES[shapeId] || PIP_SHAPES.circle).clip;
}

// Choose readable label color for a given background hex.
export function contrastColor(hex) {
    const c = (hex || '#888888').replace('#', '');
    if (c.length < 6) return '#fff';
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.62 ? '#1a1a2e' : '#ffffff';
}

/**
 * Build a peg element.
 * opts: { colorHex, shapeId, size, label, state }
 * state: 'filled' | 'empty' | 'masked'
 */
export function buildPeg({ colorHex = '#888888', shapeId = 'circle', size = 46, label = '', state = 'filled' }) {
    const slot = document.createElement('div');
    slot.className = 'peg-slot';
    slot.style.width = size + 'px';
    slot.style.height = size + 'px';

    const shape = document.createElement('div');
    shape.className = 'peg-shape';
    const clip = shapeClipPath(shapeId);
    shape.style.clipPath = clip;
    shape.style.webkitClipPath = clip;

    if (state === 'empty') {
        shape.style.background = 'rgba(255, 255, 255, 0.08)';
    } else if (state === 'masked') {
        shape.style.background = 'rgba(255, 255, 255, 0.16)';
    } else {
        shape.style.background = colorHex;
        shape.style.boxShadow = 'inset 0 -3px 6px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.25)';
    }
    slot.appendChild(shape);

    if (state === 'masked') {
        const lab = document.createElement('span');
        lab.className = 'peg-label';
        lab.textContent = '?';
        slot.appendChild(lab);
    } else if (label && state === 'filled') {
        const lab = document.createElement('span');
        lab.className = 'peg-label';
        lab.textContent = label;
        lab.style.color = contrastColor(colorHex);
        slot.appendChild(lab);
    }
    return slot;
}
