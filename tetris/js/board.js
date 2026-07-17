export class Board {
    constructor() {
        this.cols = 10;
        this.rows = 22;
        this.hiddenRows = 2;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    reset() {
        this.grid = this.createEmptyGrid();
    }

    isValid(piece) {
        const { shape, x, y } = piece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    if (boardX < 0 || boardX >= this.cols || boardY >= this.rows) {
                        return false;
                    }
                    if (boardY >= 0 && this.grid[boardY][boardX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    merge(piece) {
        const { shape, x, y, color } = piece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    if (boardY >= 0 && boardY < this.rows && boardX >= 0 && boardX < this.cols) {
                        this.grid[boardY][boardX] = color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        const newGrid = [];

        for (let row = this.rows - 1; row >= 0; row--) {
            const isFull = this.grid[row].every(cell => cell !== 0);
            if (isFull) {
                linesCleared++;
            } else {
                newGrid.unshift(this.grid[row]);
            }
        }

        while (newGrid.length < this.rows) {
            newGrid.unshift(Array(this.cols).fill(0));
        }

        this.grid = newGrid;
        return linesCleared;
    }

    getGhostY(piece) {
        let ghostY = piece.y;
        const testPiece = { ...piece };
        while (this.isValid({ ...testPiece, y: ghostY + 1 })) {
            ghostY++;
        }
        return ghostY;
    }

    isGameOver() {
        for (let row = 0; row < this.hiddenRows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    getVisibleGrid() {
        return this.grid.slice(this.hiddenRows);
    }
}