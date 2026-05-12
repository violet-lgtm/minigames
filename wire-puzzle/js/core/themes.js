// Wire Puzzle Themes
export const themes = {
    default: {
        name: 'Default (Purple)',
        backgroundImage: null, // null means use gradient
        colors: {
            '--bg-gradient-start': '#1a1a2e',
            '--bg-gradient-end': '#16213e',
            '--primary-color': '#FFD700',
            '--primary-gradient-start': '#FFD700',
            '--primary-gradient-end': '#FFA500',
            '--secondary-gradient-start': '#667eea',
            '--secondary-gradient-end': '#764ba2',
            '--accent-color': '#667eea',
            '--text-primary': '#fff',
            '--text-secondary': '#aaa',
            '--canvas-border': '#667eea',
            '--canvas-bg': '#0f0f1e',
            '--panel-bg': 'rgba(255, 255, 255, 0.05)',
            '--panel-border': 'rgba(255, 255, 255, 0.1)'
        },
        tiles: {
            wirePowered: '#FFD700',
            wireUnpowered: '#666',
            gridLine: '#333',
            canvasBg: '#1a1a1a',
            poweredGlow: 'rgba(255, 215, 0, 0.1)',
            lockIcon: '#fff',
            railTrack: 'rgba(102, 126, 234, 0.4)',
            railCap: 'rgba(102, 126, 234, 0.6)',
            draggableBorder: 'rgba(102, 126, 234, 0.8)'
        }
    },
    dark: {
        name: 'Dark Mode',
        backgroundImage: null,
        colors: {
            '--bg-gradient-start': '#0a0a0a',
            '--bg-gradient-end': '#1a1a1a',
            '--primary-color': '#4ade80',
            '--primary-gradient-start': '#4ade80',
            '--primary-gradient-end': '#22c55e',
            '--secondary-gradient-start': '#3b82f6',
            '--secondary-gradient-end': '#1d4ed8',
            '--accent-color': '#3b82f6',
            '--text-primary': '#fff',
            '--text-secondary': '#9ca3af',
            '--canvas-border': '#3b82f6',
            '--canvas-bg': '#000',
            '--panel-bg': 'rgba(255, 255, 255, 0.03)',
            '--panel-border': 'rgba(255, 255, 255, 0.08)'
        },
        tiles: {
            wirePowered: '#4ade80',
            wireUnpowered: '#666',
            gridLine: '#333',
            canvasBg: '#000',
            poweredGlow: 'rgba(74, 222, 128, 0.1)',
            lockIcon: '#fff',
            railTrack: 'rgba(59, 130, 246, 0.4)',
            railCap: 'rgba(59, 130, 246, 0.6)',
            draggableBorder: 'rgba(59, 130, 246, 0.8)'
        }
    },
    ocean: {
        name: 'Ocean Blue',
        backgroundImage: null,
        colors: {
            '--bg-gradient-start': '#0f2027',
            '--bg-gradient-end': '#203a43',
            '--primary-color': '#00d4ff',
            '--primary-gradient-start': '#00d4ff',
            '--primary-gradient-end': '#0099cc',
            '--secondary-gradient-start': '#2c5364',
            '--secondary-gradient-end': '#0f2027',
            '--accent-color': '#00d4ff',
            '--text-primary': '#fff',
            '--text-secondary': '#b0d4e3',
            '--canvas-border': '#00d4ff',
            '--canvas-bg': '#0a1520',
            '--panel-bg': 'rgba(0, 212, 255, 0.05)',
            '--panel-border': 'rgba(0, 212, 255, 0.1)'
        },
        tiles: {
            wirePowered: '#00d4ff',
            wireUnpowered: '#666',
            gridLine: '#1a3a43',
            canvasBg: '#0a1520',
            poweredGlow: 'rgba(0, 212, 255, 0.1)',
            lockIcon: '#fff',
            railTrack: 'rgba(0, 212, 255, 0.4)',
            railCap: 'rgba(0, 212, 255, 0.6)',
            draggableBorder: 'rgba(0, 212, 255, 0.8)'
        }
    },
    sunset: {
        name: 'Sunset',
        backgroundImage: null,
        colors: {
            '--bg-gradient-start': '#2d1b2e',
            '--bg-gradient-end': '#4a2545',
            '--primary-color': '#ff6b6b',
            '--primary-gradient-start': '#ff6b6b',
            '--primary-gradient-end': '#ee5a6f',
            '--secondary-gradient-start': '#f093fb',
            '--secondary-gradient-end': '#f5576c',
            '--accent-color': '#ff6b6b',
            '--text-primary': '#fff',
            '--text-secondary': '#e0b0d5',
            '--canvas-border': '#f093fb',
            '--canvas-bg': '#1a0f1e',
            '--panel-bg': 'rgba(240, 147, 251, 0.05)',
            '--panel-border': 'rgba(240, 147, 251, 0.1)'
        },
        tiles: {
            wirePowered: '#ff6b6b',
            wireUnpowered: '#666',
            gridLine: '#3a2540',
            canvasBg: '#1a0f1e',
            poweredGlow: 'rgba(255, 107, 107, 0.1)',
            lockIcon: '#fff',
            railTrack: 'rgba(240, 147, 251, 0.4)',
            railCap: 'rgba(240, 147, 251, 0.6)',
            draggableBorder: 'rgba(240, 147, 251, 0.8)'
        }
    },
    forest: {
        name: 'Forest Green',
        backgroundImage: null,
        colors: {
            '--bg-gradient-start': '#1a2f1a',
            '--bg-gradient-end': '#0d1f0d',
            '--primary-color': '#7cff7c',
            '--primary-gradient-start': '#7cff7c',
            '--primary-gradient-end': '#4ade80',
            '--secondary-gradient-start': '#3d6b3d',
            '--secondary-gradient-end': '#2d5a2d',
            '--accent-color': '#4ade80',
            '--text-primary': '#fff',
            '--text-secondary': '#b0e0b0',
            '--canvas-border': '#4ade80',
            '--canvas-bg': '#0a150a',
            '--panel-bg': 'rgba(76, 222, 128, 0.05)',
            '--panel-border': 'rgba(76, 222, 128, 0.1)'
        },
        tiles: {
            wirePowered: '#7cff7c',
            wireUnpowered: '#666',
            gridLine: '#2a3a2a',
            canvasBg: '#0a150a',
            poweredGlow: 'rgba(124, 255, 124, 0.1)',
            lockIcon: '#fff',
            railTrack: 'rgba(76, 222, 128, 0.4)',
            railCap: 'rgba(76, 222, 128, 0.6)',
            draggableBorder: 'rgba(76, 222, 128, 0.8)'
        }
    },
    blueprint: {
        name: 'Blueprint',
        backgroundImage: 'data:image/svg+xml,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(109,179,242,0.08)" stroke-width="0.5"/%3E%3C/pattern%3E%3Cpattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"%3E%3Crect width="100" height="100" fill="url(%23smallGrid)"/%3E%3Cpath d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(109,179,242,0.15)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="200" height="200" fill="%23082542"/%3E%3Crect width="200" height="200" fill="url(%23grid)"/%3E%3C/svg%3E',
        colors: {
            '--bg-gradient-start': '#082542',
            '--bg-gradient-end': '#0d3a5f',
            '--primary-color': '#ffffff',
            '--primary-gradient-start': '#ffffff',
            '--primary-gradient-end': '#d0e8ff',
            '--secondary-gradient-start': '#4a90e2',
            '--secondary-gradient-end': '#2874d0',
            '--accent-color': '#6db3f2',
            '--text-primary': '#ffffff',
            '--text-secondary': '#b8d4f0',
            '--canvas-border': '#6db3f2',
            '--canvas-bg': '#051829',
            '--panel-bg': 'rgba(109, 179, 242, 0.12)',
            '--panel-border': 'rgba(109, 179, 242, 0.3)'
        },
        tiles: {
            wirePowered: '#ffffff',
            wireUnpowered: '#3a6b8a',
            gridLine: 'rgba(109, 179, 242, 0.15)',
            canvasBg: '#051829',
            poweredGlow: 'rgba(255, 255, 255, 0.12)',
            lockIcon: '#ffffff',
            railTrack: 'rgba(109, 179, 242, 0.4)',
            railCap: 'rgba(109, 179, 242, 0.7)',
            draggableBorder: 'rgba(109, 179, 242, 0.85)'
        }
    }
};

export class ThemeManager {
    constructor() {
        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    loadTheme() {
        const saved = localStorage.getItem('wire-puzzle-theme');
        return saved && themes[saved] ? saved : 'default';
    }

    saveTheme(themeId) {
        localStorage.setItem('wire-puzzle-theme', themeId);
    }

    applyTheme(themeId) {
        if (!themes[themeId]) {
            themeId = 'default';
        }

        const theme = themes[themeId];
        const root = document.documentElement;

        // Apply CSS variables
        Object.entries(theme.colors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Apply background image if available
        if (theme.backgroundImage) {
            document.body.style.backgroundImage = `url("${theme.backgroundImage}")`;
            document.body.style.backgroundSize = '100px 100px'; // Adjust for tiling
            document.body.style.backgroundAttachment = 'fixed';
        } else {
            document.body.style.backgroundImage = '';
        }

        this.currentTheme = themeId;
        this.saveTheme(themeId);
    }

    getThemeList() {
        return Object.entries(themes).map(([id, theme]) => ({
            id,
            name: theme.name
        }));
    }

    getCurrentTheme() {
        return themes[this.currentTheme] || themes.default;
    }

    getTileTheme() {
        const theme = this.getCurrentTheme();
        return theme.tiles || themes.default.tiles;
    }
}
