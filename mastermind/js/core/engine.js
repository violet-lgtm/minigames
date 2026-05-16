// Mastermind game engine - pure logic, no DOM dependencies.

export class MastermindEngine {
    constructor(level) {
        this.level = level;
        this.config = level.config;
        this.onUpdate = null;
        this.reset();
    }

    reset() {
        const fixed = this.level.secret;
        const len = this.config.codeLength;
        if (Array.isArray(fixed) && fixed.length === len &&
            fixed.every(c => Number.isInteger(c) && c >= 0 && c < this.config.colors.length)) {
            this.secret = fixed.slice();
        } else {
            this.secret = this._randomSecret();
        }
        this.guesses = [];
        this.current = new Array(len).fill(null);
        this.won = false;
        this.lost = false;
        this._emit();
    }

    _randomSecret() {
        const { codeLength, allowDuplicates } = this.config;
        const n = this.config.colors.length;
        if (allowDuplicates || codeLength > n) {
            return Array.from({ length: codeLength }, () => Math.floor(Math.random() * n));
        }
        const pool = Array.from({ length: n }, (_, i) => i);
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, codeLength);
    }

    isOver() {
        return this.won || this.lost;
    }

    // Place active color into the first empty slot of the current guess.
    placeColor(colorIndex) {
        if (this.isOver()) return false;
        const slot = this.current.indexOf(null);
        if (slot === -1) return false;
        this.current[slot] = colorIndex;
        this._emit();
        return true;
    }

    setSlot(slot, colorIndex) {
        if (this.isOver()) return;
        if (slot < 0 || slot >= this.config.codeLength) return;
        this.current[slot] = colorIndex;
        this._emit();
    }

    clearSlot(slot) {
        if (this.isOver()) return;
        if (slot < 0 || slot >= this.config.codeLength) return;
        this.current[slot] = null;
        this._emit();
    }

    // Remove the last filled slot (Backspace behaviour).
    removeLast() {
        if (this.isOver()) return;
        for (let i = this.current.length - 1; i >= 0; i--) {
            if (this.current[i] !== null) {
                this.current[i] = null;
                this._emit();
                return;
            }
        }
    }

    clearGuess() {
        if (this.isOver()) return;
        this.current = new Array(this.config.codeLength).fill(null);
        this._emit();
    }

    isGuessComplete() {
        return this.current.every(c => c !== null);
    }

    submitGuess() {
        if (this.isOver() || !this.isGuessComplete()) return false;
        const code = this.current.slice();
        const feedback = this.computeFeedback(code);
        this.guesses.push({ code, feedback });

        if (feedback.exact === this.config.codeLength) {
            this.won = true;
        } else if (this.guesses.length >= this.config.maxGuesses) {
            this.lost = true;
        }
        this.current = new Array(this.config.codeLength).fill(null);
        this._emit();
        return true;
    }

    // Standard Mastermind scoring: exact = right colour & position,
    // partial = right colour, wrong position.
    computeFeedback(code) {
        const secret = this.secret;
        let exact = 0;
        const secretRem = {};
        const guessRem = {};
        for (let i = 0; i < code.length; i++) {
            if (code[i] === secret[i]) {
                exact++;
            } else {
                secretRem[secret[i]] = (secretRem[secret[i]] || 0) + 1;
                guessRem[code[i]] = (guessRem[code[i]] || 0) + 1;
            }
        }
        let partial = 0;
        for (const color in guessRem) {
            partial += Math.min(guessRem[color], secretRem[color] || 0);
        }
        return { exact, partial };
    }

    getState() {
        return {
            secret: this.secret,
            guesses: this.guesses,
            current: this.current,
            won: this.won,
            lost: this.lost,
            guessesUsed: this.guesses.length,
            remaining: this.config.maxGuesses - this.guesses.length,
        };
    }

    _emit() {
        if (this.onUpdate) this.onUpdate(this.getState());
    }
}
