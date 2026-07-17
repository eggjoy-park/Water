export class Audio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    beep(frequency, duration, type = 'sine', volume = 0.1, delay = 0) {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const oscillator = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        const startTime = this.ctx.currentTime + delay;
        const endTime = startTime + duration;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);

        oscillator.connect(gain);
        gain.connect(this.ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(endTime + 0.05);
    }

    playMove() {
        this.beep(440, 0.05, 'sine', 0.08);
    }

    playRotate() {
        this.beep(660, 0.05, 'square', 0.08);
    }

    playSoftDrop() {
        this.beep(330, 0.03, 'sine', 0.05);
    }

    playHardDrop() {
        this.beep(220, 0.1, 'triangle', 0.12);
    }

    playLineClear(lines) {
        const baseFreq = 880;
        this.beep(baseFreq + lines * 100, 0.15, 'sine', 0.1);
        this.beep(baseFreq * 1.5 + lines * 50, 0.15, 'sine', 0.07, 0.05);
    }

    playLevelUp() {
        this.beep(523, 0.15, 'sine', 0.1);
        this.beep(659, 0.15, 'sine', 0.1, 0.1);
        this.beep(784, 0.2, 'sine', 0.1, 0.2);
        this.beep(1047, 0.3, 'sine', 0.1, 0.35);
    }

    playGameOver() {
        const notes = [440, 349, 294, 262];
        notes.forEach((freq, i) => {
            this.beep(freq, 0.3, 'sawtooth', 0.1, i * 0.2);
        });
    }

    playHold() {
        this.beep(550, 0.08, 'sine', 0.08);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

export const audio = new Audio();