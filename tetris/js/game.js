import { Board } from './board.js';
import { Renderer } from './renderer.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { createPiece, tryRotate, getGhostY } from './pieces.js';

const PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
const SCORE_TABLE = [0, 100, 300, 500, 800];
const LINES_PER_LEVEL = 10;
const BASE_DROP_INTERVAL = 1000;
const MIN_DROP_INTERVAL = 100;

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.board = new Board();
        this.renderer = new Renderer(canvas);
        this.audio = new Audio();
        this.input = new Input(this);
        this.audio.init();

        this.state = 'playing';
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.highScore = parseInt(localStorage.getItem('tetris_highscore') || '0', 10);

        this.bag = [];
        this.nextQueue = [];
        this.holdPiece = null;
        this.canHold = true;

        this.currentPiece = null;
        this.ghostY = 0;

        this.dropInterval = BASE_DROP_INTERVAL;
        this.dropAccumulator = 0;
        this.lastTime = 0;
        this.softDropActive = false;

        this.initBag();
        this.fillQueue();
        this.spawnPiece();

        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    initBag() {
        this.bag = [...PIECE_TYPES].sort(() => Math.random() - 0.5);
    }

    getNextPiece() {
        if (this.bag.length === 0) {
            this.initBag();
        }
        return this.bag.pop();
    }

    fillQueue() {
        while (this.nextQueue.length < 3) {
            const type = this.getNextPiece();
            this.nextQueue.push(createPiece(type));
        }
    }

    spawnPiece() {
        const piece = this.nextQueue.shift();
        this.fillQueue();
        this.currentPiece = piece;
        this.ghostY = getGhostY(this.currentPiece, this.board);

        if (!this.board.isValid(this.currentPiece) || this.board.isGameOver()) {
            this.gameOver();
        }
        this.canHold = true;
    }

    move(dx) {
        if (this.state !== 'playing') return;
        const newX = this.currentPiece.x + dx;
        if (this.board.isValid({ ...this.currentPiece, x: newX })) {
            this.currentPiece.x = newX;
            this.ghostY = getGhostY(this.currentPiece, this.board);
            this.audio.playMove();
        }
    }

    rotate(direction) {
        if (this.state !== 'playing') return;
        const rotated = tryRotate(this.currentPiece, this.board, direction);
        if (rotated) {
            this.currentPiece = rotated;
            this.ghostY = getGhostY(this.currentPiece, this.board);
            this.audio.playRotate();
        }
    }

    softDrop() {
        if (this.state !== 'playing') return;
        const newY = this.currentPiece.y + 1;
        if (this.board.isValid({ ...this.currentPiece, y: newY })) {
            this.currentPiece.y = newY;
            this.score += 1;
            this.ghostY = getGhostY(this.currentPiece, this.board);
            this.audio.playSoftDrop();
            return true;
        }
        return false;
    }

    startSoftDrop() {
        this.softDropActive = true;
        this.softDropInterval = setInterval(() => {
            if (this.state === 'playing' && this.softDropActive) {
                this.softDrop();
            }
        }, 50);
    }

    cancelSoftDrop() {
        this.softDropActive = false;
        if (this.softDropInterval) {
            clearInterval(this.softDropInterval);
            this.softDropInterval = null;
        }
    }

    hardDrop() {
        if (this.state !== 'playing') return;
        const dropDistance = this.ghostY - this.currentPiece.y;
        this.score += dropDistance * 2;
        this.currentPiece.y = this.ghostY;
        this.audio.playHardDrop();
        this.lockPiece();
    }

    hold() {
        if (this.state !== 'playing' || !this.canHold) return;
        this.canHold = false;

        const holdType = this.currentPiece.type;
        if (this.holdPiece === null) {
            this.holdPiece = holdType;
            this.spawnPiece();
        } else {
            const tempType = this.holdPiece;
            this.holdPiece = holdType;
            this.currentPiece = createPiece(tempType);
            this.ghostY = getGhostY(this.currentPiece, this.board);
        }
        this.audio.playHold();
    }

    lockPiece() {
        this.board.merge(this.currentPiece);
        const linesCleared = this.board.clearLines();
        if (linesCleared > 0) {
            this.updateScore(linesCleared);
            this.audio.playLineClear(linesCleared);
        }
        this.spawnPiece();
        if (this.state === 'gameover') return;
    }

    updateScore(linesCleared) {
        this.lines += linesCleared;
        this.score += SCORE_TABLE[linesCleared] * this.level;

        const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(MIN_DROP_INTERVAL, BASE_DROP_INTERVAL - (this.level - 1) * 66.67);
            this.audio.playLevelUp();
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetris_highscore', this.highScore.toString());
        }
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.playGameOver();
        this.showGameOver();
    }

    showGameOver() {
        const overlay = document.getElementById('gameover-overlay');
        document.getElementById('final-score').textContent = `Final Score: ${this.score}`;
        document.getElementById('high-score').textContent = `High Score: ${this.highScore}`;
        overlay.classList.remove('hidden');
    }

    hideGameOver() {
        document.getElementById('gameover-overlay').classList.add('hidden');
    }

    togglePause() {
        if (this.state === 'gameover') return;
        this.state = this.state === 'playing' ? 'paused' : 'playing';
        const overlay = document.getElementById('pause-overlay');
        if (this.state === 'paused') {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    restart() {
        this.hideGameOver();
        this.board.reset();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = BASE_DROP_INTERVAL;
        this.bag = [];
        this.nextQueue = [];
        this.holdPiece = null;
        this.canHold = true;
        this.initBag();
        this.fillQueue();
        this.spawnPiece();
        this.state = 'playing';
        this.lastTime = performance.now();
    }

    gameLoop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        if (this.state === 'playing') {
            this.dropAccumulator += dt;
            if (this.dropAccumulator >= this.dropInterval) {
                if (!this.softDrop()) {
                    this.lockPiece();
                }
                this.dropAccumulator = 0;
            }
            this.ghostY = getGhostY(this.currentPiece, this.board);
        }

        this.renderer.draw(
            this.board,
            this.currentPiece,
            this.ghostY,
            this.holdPiece,
            this.nextQueue,
            this.score,
            this.level,
            this.lines,
            this.highScore,
            this.state
        );

        requestAnimationFrame(this.gameLoop);
    }
}