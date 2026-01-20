// Wire Puzzle Themes
export const themes = {
    default: {
        name: 'Default (Purple)',
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
        }
    },
    dark: {
        name: 'Dark Mode',
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
        }
    },
    ocean: {
        name: 'Ocean Blue',
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
        }
    },
    sunset: {
        name: 'Sunset',
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
        }
    },
    forest: {
        name: 'Forest Green',
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

        this.currentTheme = themeId;
        this.saveTheme(themeId);
    }

    getThemeList() {
        return Object.entries(themes).map(([id, theme]) => ({
            id,
            name: theme.name
        }));
    }
}
