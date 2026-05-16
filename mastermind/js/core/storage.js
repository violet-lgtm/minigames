// Level storage for the Mastermind game.
const CUSTOM_KEY = 'mastermind-custom-levels';
const TEST_KEY = 'mastermind-test-level';

export const Storage = {
    saveLevel(level) {
        const levels = this.getCustomLevels();
        const idx = levels.findIndex(l => l.id === level.id);
        if (idx >= 0) {
            levels[idx] = level;
        } else {
            levels.push(level);
        }
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(levels));
    },

    getCustomLevels() {
        const data = localStorage.getItem(CUSTOM_KEY);
        try {
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    getLevel(levelId) {
        return this.getCustomLevels().find(l => l.id === levelId);
    },

    deleteLevel(levelId) {
        const filtered = this.getCustomLevels().filter(l => l.id !== levelId);
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(filtered));
    },

    setTestLevel(level) {
        sessionStorage.setItem(TEST_KEY, JSON.stringify(level));
    },

    getTestLevel() {
        const data = sessionStorage.getItem(TEST_KEY);
        if (data) {
            sessionStorage.removeItem(TEST_KEY);
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }
        return null;
    },

    exportLevel(level) {
        const json = JSON.stringify(level, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(level.name || 'level').replace(/[^a-z0-9]+/gi, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importLevel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    resolve(JSON.parse(e.target.result));
                } catch {
                    reject(new Error('Invalid level file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
};
