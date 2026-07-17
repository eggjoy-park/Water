import { PIECE_SHAPES, PIECE_COLORS } from './pieces.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.blockSize = 30;
        this.boardOffsetX = 0;
        this.boardOffsetY = 0;
        this.nextBoxSize = 4;
        this.holdBoxSize = 4;
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const maxWidth = Math.min(95 * window.innerWidth / 100, rect.width);
        const maxHeight = Math.min(90 * window.innerHeight / 100, rect.height);

        this.blockSize = Math.floor(Math.min(
            maxWidth / 26,
            maxHeight / 24
        ));

        this.canvas.width = this.blockSize * 26;
        this.canvas.height = this.blockSize * 24;

        this.boardOffsetX = this.blockSize * 6;
        this.boardOffsetY = this.blockSize * 2;
    }

    draw(board, currentPiece, ghostY, holdPiece, nextPieces, score, level, lines, highScore, gameState) {
        const ctx = this.ctx;
        const bs = this.blockSize;

        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBoard(ctx, bs, board);
        this.drawGrid(ctx, bs);

        if (currentPiece && gameState === 'playing') {
            const displayPiece = { ...currentPiece, y: currentPiece.y - board.hiddenRows };
            const displayGhostY = ghostY - board.hiddenRows;
            this.drawGhostPiece(ctx, bs, displayPiece, displayGhostY);
            this.drawPiece(ctx, bs, displayPiece, this.boardOffsetX, this.boardOffsetY);
        }

        this.drawNextPieces(ctx, bs, nextPieces);
        this.drawHoldPiece(ctx, bs, holdPiece);
        this.drawUI(ctx, bs, score, level, lines, highScore);

        if (gameState === 'paused') {
            this.drawPauseOverlay(ctx, bs);
        } else if (gameState === 'gameover') {
            this.drawGameOver(ctx, bs, score);
        }
    }

    drawBoard(ctx, bs, board) {
        const visibleGrid = board.getVisibleGrid();
        for (let row = 0; row < visibleGrid.length; row++) {
            for (let col = 0; col < 10; col++) {
                const color = visibleGrid[row][col];
                if (color) {
                    this.drawBlock(ctx, bs, col, row, color, this.boardOffsetX, this.boardOffsetY);
                }
            }
        }
    }

    drawGrid(ctx, bs) {
        ctx.strokeStyle = '#1f1f3a';
        ctx.lineWidth = 1;

        for (let col = 0; col <= 10; col++) {
            const x = this.boardOffsetX + col * bs;
            ctx.beginPath();
            ctx.moveTo(x, this.boardOffsetY);
            ctx.lineTo(x, this.boardOffsetY + 20 * bs);
            ctx.stroke();
        }

        for (let row = 0; row <= 20; row++) {
            const y = this.boardOffsetY + row * bs;
            ctx.beginPath();
            ctx.moveTo(this.boardOffsetX, y);
            ctx.lineTo(this.boardOffsetX + 10 * bs, y);
            ctx.stroke();
        }
    }

    drawPiece(ctx, bs, piece, offsetX, offsetY, ghost = false) {
        const { shape, x, y, color } = piece;
        if (ghost) {
            ctx.globalAlpha = 0.25;
        }
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(ctx, bs, x + col, y + row, color, offsetX, offsetY);
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    drawGhostPiece(ctx, bs, piece, ghostY) {
        const ghostPiece = { ...piece, y: ghostY };
        ctx.globalAlpha = 0.2;
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    this.drawBlock(ctx, bs, piece.x + col, ghostY + row, piece.color, this.boardOffsetX, this.boardOffsetY, true);
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    drawBlock(ctx, bs, x, y, color, offsetX, offsetY, outline = false) {
        const px = offsetX + x * bs;
        const py = offsetY + y * bs;
        const padding = Math.max(1, Math.floor(bs * 0.05));
        const size = bs - padding * 2;

        if (outline) {
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(2, Math.floor(bs * 0.08));
            ctx.strokeRect(px + padding, py + padding, size, size);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(px + padding, py + padding, size, size);

            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(px + padding, py + padding, size, Math.max(1, Math.floor(size * 0.2)));

            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(px + padding, py + padding + size - Math.max(1, Math.floor(size * 0.15)), size, Math.max(1, Math.floor(size * 0.15)));
        }
    }

    drawNextPieces(ctx, bs, nextPieces) {
        const startX = this.boardOffsetX + 13 * bs;
        const startY = this.boardOffsetY;
        const boxSize = bs * 4;
        const gap = bs;

        ctx.fillStyle = '#1f1f3a';
        ctx.fillRect(startX, startY, boxSize, boxSize * 3 + gap * 2);

        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const y = startY + i * (boxSize + gap);
            ctx.strokeRect(startX, y, boxSize, boxSize);
        }

        ctx.font = `${Math.max(12, Math.floor(bs * 0.5))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'left';
        ctx.fillText('NEXT', startX, startY - bs * 0.3);

        nextPieces.forEach((piece, index) => {
            const pieceY = startY + index * (boxSize + gap);
            this.drawPreviewPiece(ctx, bs, piece, startX, pieceY);
        });
    }

    drawPreviewPiece(ctx, bs, piece, offsetX, offsetY) {
        const { shape, color } = piece;
        const shapeWidth = shape[0].length;
        const shapeHeight = shape.length;
        const scale = bs * 0.8;
        const boxSize = bs * 4;
        const centerX = offsetX + (boxSize - shapeWidth * scale) / 2;
        const centerY = offsetY + (boxSize - shapeHeight * scale) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawSmallBlock(ctx, scale, col, row, color, centerX, centerY);
                }
            }
        }
    }

    drawSmallBlock(ctx, bs, x, y, color, offsetX, offsetY) {
        const px = offsetX + x * bs;
        const py = offsetY + y * bs;
        const padding = Math.max(1, Math.floor(bs * 0.05));
        const size = bs - padding * 2;

        ctx.fillStyle = color;
        ctx.fillRect(px + padding, py + padding, size, size);

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(px + padding, py + padding, size, Math.max(1, Math.floor(size * 0.2)));

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(px + padding, py + padding + size - Math.max(1, Math.floor(size * 0.15)), size, Math.max(1, Math.floor(size * 0.15)));
    }

    drawHoldPiece(ctx, bs, holdPiece) {
        const startX = bs * 0.5;
        const startY = this.boardOffsetY;
        const boxSize = bs * 4;

        ctx.fillStyle = '#1f1f3a';
        ctx.fillRect(startX, startY, boxSize, boxSize);

        // 테두리 추가로 박스 영역 확인
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, boxSize, boxSize);

        ctx.font = `${Math.max(12, Math.floor(bs * 0.5))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'left';
        ctx.fillText('HOLD', startX, startY - bs * 0.3);

        if (holdPiece) {
            const pieceY = startY;
            const preview = typeof holdPiece === 'string'
                ? { shape: PIECE_SHAPES[holdPiece][0], color: PIECE_COLORS[holdPiece] }
                : holdPiece;
            this.drawPreviewPiece(ctx, bs, preview, startX, pieceY);
        }

        // Key guide below HOLD panel
        this.drawKeyGuide(ctx, bs, startX, startY + boxSize + bs * 0.5, boxSize);
    }

    drawKeyGuide(ctx, bs, startX, startY, boxWidth) {
        const controls = [
            { key: '← →', desc: 'Move' },
            { key: '↑', desc: 'Rotate' },
            { key: '↓', desc: 'Soft Drop' },
            { key: 'Space', desc: 'Hard Drop' },
            { key: 'C / Shift', desc: 'Hold' },
            { key: 'P / Esc', desc: 'Pause' },
        ];

        ctx.fillStyle = '#1f1f3a';
        ctx.fillRect(startX, startY, boxWidth, bs * controls.length * 1.1 + bs * 0.5);

        ctx.font = `${Math.max(10, Math.floor(bs * 0.38))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#888';
        ctx.textAlign = 'left';

        controls.forEach((item, i) => {
            const y = startY + bs * 0.5 + i * bs * 1.1;
            ctx.fillText(item.key, startX + bs * 0.5, y);
            ctx.fillStyle = '#e0e0e0';
            ctx.fillText(item.desc, startX + bs * 2.5, y);
            ctx.fillStyle = '#888';
        });
    }

    drawUI(ctx, bs, score, level, lines, highScore) {
        const startX = this.boardOffsetX + 13 * bs;
        const startY = this.boardOffsetY + 14 * bs;
        const boxWidth = bs * 7;

        ctx.fillStyle = '#1f1f3a';
        ctx.fillRect(startX, startY, boxWidth, bs * 19);

        ctx.font = `${Math.max(11, Math.floor(bs * 0.45))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'left';

        const labels = [
            { label: 'SCORE', value: score.toLocaleString() },
            { label: 'LEVEL', value: level.toString() },
            { label: 'LINES', value: lines.toString() },
        ];

        labels.forEach((item, i) => {
            const y = startY + bs * 1.5 + i * bs * 2.5;
            ctx.fillText(item.label, startX + bs * 0.5, y);
            ctx.font = `${Math.max(14, Math.floor(bs * 0.55))}px 'JetBrains Mono', monospace`;
            ctx.fillText(item.value, startX + bs * 0.5, y + bs * 1.2);
            ctx.font = `${Math.max(11, Math.floor(bs * 0.45))}px 'JetBrains Mono', monospace`;
        });

        if (highScore > 0) {
            const y = startY + bs * 8;
            ctx.fillStyle = '#00d4ff';
            ctx.font = `${Math.max(11, Math.floor(bs * 0.4))}px 'JetBrains Mono', monospace`;
            ctx.fillText('BEST', startX + bs * 0.5, y);
            ctx.font = `${Math.max(14, Math.floor(bs * 0.5))}px 'JetBrains Mono', monospace`;
            ctx.fillText(highScore.toLocaleString(), startX + bs * 0.5, y + bs * 1.1);
        }
    }

    drawPauseOverlay(ctx, bs) {
        ctx.fillStyle = 'rgba(13, 13, 26, 0.85)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#00d4ff';
        ctx.font = `${Math.max(20, Math.floor(bs * 1.2))}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - bs);

        ctx.fillStyle = '#e0e0e0';
        ctx.font = `${Math.max(14, Math.floor(bs * 0.7))}px 'JetBrains Mono', monospace`;
        ctx.fillText('Press P or ESC to Resume', this.canvas.width / 2, this.canvas.height / 2 + bs);
    }

    drawGameOver(ctx, bs, score) {
        ctx.fillStyle = 'rgba(13, 13, 26, 0.9)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#ff4444';
        ctx.font = `${Math.max(24, Math.floor(bs * 1.4))}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - bs * 1.5);

        ctx.fillStyle = '#e0e0e0';
        ctx.font = `${Math.max(18, Math.floor(bs * 1))}px 'JetBrains Mono', monospace`;
        ctx.fillText(`Final Score: ${score.toLocaleString()}`, this.canvas.width / 2, this.canvas.height / 2 + bs * 0.5);

        const highScore = parseInt(localStorage.getItem('tetris_highscore') || '0');
        if (score >= highScore && score > 0) {
            ctx.fillStyle = '#00d4ff';
            ctx.font = `${Math.max(16, Math.floor(bs * 0.9))}px 'JetBrains Mono', monospace`;
            ctx.fillText('NEW HIGH SCORE!', this.canvas.width / 2, this.canvas.height / 2 + bs * 1.8);
        }

        ctx.fillStyle = '#888';
        ctx.font = `${Math.max(12, Math.floor(bs * 0.6))}px 'JetBrains Mono', monospace`;
        ctx.fillText('Click or Tap to Restart', this.canvas.width / 2, this.canvas.height / 2 + bs * 3);
    }
}