export class Input {
    constructor(game) {
        this.game = game;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.lastTapTime = 0;
        this.longPressTimer = null;
        this.bindKeys();
        this.bindTouch();
        this.bindUI();
    }

    bindKeys() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyC', 'ShiftLeft', 'ShiftRight', 'KeyP', 'Escape'].includes(e.code)) {
                e.preventDefault();
            }

            switch (e.code) {
                case 'ArrowLeft':
                    this.game.move(-1);
                    break;
                case 'ArrowRight':
                    this.game.move(1);
                    break;
                case 'ArrowUp':
                    this.game.rotate('cw');
                    break;
                case 'ArrowDown':
                    this.game.startSoftDrop();
                    break;
                case 'Space':
                    this.game.hardDrop();
                    break;
                case 'KeyC':
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.game.hold();
                    break;
                case 'KeyP':
                case 'Escape':
                    this.game.togglePause();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown') {
                this.game.cancelSoftDrop();
            }
        });
    }

    bindTouch() {
        const canvas = document.getElementById('game');

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.touchStartX = touch.clientX - rect.left;
            this.touchStartY = touch.clientY - rect.top;
            this.touchStartTime = Date.now();

            if (this.longPressTimer) clearTimeout(this.longPressTimer);
            this.longPressTimer = setTimeout(() => {
                this.game.startSoftDrop();
            }, 150);
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            this.game.cancelSoftDrop();

            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const endX = touch.clientX - rect.left;
            const endY = touch.clientY - rect.top;

            const dx = endX - this.touchStartX;
            const dy = endY - this.touchStartY;
            const dt = Date.now() - this.touchStartTime;

            const width = canvas.width;
            const height = canvas.height;
            const thirdW = width / 3;
            const thirdH = height / 3;

            const isDoubleTap = dt < 300 && Date.now() - this.lastTapTime < 300;
            this.lastTapTime = Date.now();

            if (isDoubleTap) {
                this.game.hold();
                return;
            }

            if (dy > 50 && Math.abs(dx) < 50) {
                this.game.hardDrop();
                return;
            }

            const zoneX = this.touchStartX;
            const zoneY = this.touchStartY;

            if (zoneY < thirdH) {
                this.game.rotate('cw');
            } else if (zoneY > height - thirdH) {
            } else if (zoneX < thirdW) {
                this.game.move(-1);
            } else if (zoneX > width - thirdW) {
                this.game.move(1);
            }
        }, { passive: false });

        canvas.addEventListener('touchcancel', () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            this.game.cancelSoftDrop();
        });
    }

    bindUI() {
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.game.togglePause();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.restart();
        });

        document.getElementById('gameover-overlay').addEventListener('click', () => {
            this.game.restart();
        });

        document.getElementById('game').addEventListener('click', () => {
            this.game.audio.resume();
        }, { once: true });

        document.body.addEventListener('click', () => {
            this.game.audio.resume();
        }, { once: true });
    }
}