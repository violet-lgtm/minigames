// Level Storage System
export const Storage = {
    // Save a custom level
    saveLevel(level) {
        const levels = this.getCustomLevels();
        const existingIndex = levels.findIndex(l => l.id === level.id);

        if (existingIndex >= 0) {
            levels[existingIndex] = level;
        } else {
            levels.push(level);
        }

        localStorage.setItem('wire-puzzle-custom-levels', JSON.stringify(levels));
    },

    // Get all custom levels
    getCustomLevels() {
        const data = localStorage.getItem('wire-puzzle-custom-levels');
        return data ? JSON.parse(data) : [];
    },

    // Get a specific level by ID
    getLevel(levelId) {
        const levels = this.getCustomLevels();
        return levels.find(l => l.id === levelId);
    },

    // Delete a custom level
    deleteLevel(levelId) {
        const levels = this.getCustomLevels();
        const filtered = levels.filter(l => l.id !== levelId);
        localStorage.setItem('wire-puzzle-custom-levels', JSON.stringify(filtered));
    },

    // Store level for testing (temporary)
    setTestLevel(level) {
        sessionStorage.setItem('wire-puzzle-test-level', JSON.stringify(level));
    },

    // Get test level
    getTestLevel() {
        const data = sessionStorage.getItem('wire-puzzle-test-level');
        if (data) {
            sessionStorage.removeItem('wire-puzzle-test-level');
            return JSON.parse(data);
        }
        return null;
    },

    // Export level as JSON file
    exportLevel(level) {
        const json = JSON.stringify(level, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${level.name || 'level'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    // Import level from JSON file
    async importLevel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const level = JSON.parse(e.target.result);
                    resolve(level);
                } catch (error) {
                    reject(new Error('Invalid level file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
};
