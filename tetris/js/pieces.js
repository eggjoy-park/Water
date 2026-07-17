export const PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export const PIECE_COLORS = {
    I: '#00f0f0',
    J: '#0000f0',
    L: '#f0a000',
    O: '#f0f000',
    S: '#00f000',
    T: '#a000f0',
    Z: '#f00000',
};

export const PIECE_SHAPES = {
    I: [
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ],
    ],
    J: [
        [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        [
            [0, 1, 1],
            [0, 1, 0],
            [0, 1, 0],
        ],
        [
            [0, 0, 0],
            [1, 1, 1],
            [0, 0, 1],
        ],
        [
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 0],
        ],
    ],
    L: [
        [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ],
        [
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 1],
        ],
        [
            [0, 0, 0],
            [1, 1, 1],
            [1, 0, 0],
        ],
        [
            [1, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
        ],
    ],
    O: [
        [
            [1, 1],
            [1, 1],
        ],
        [
            [1, 1],
            [1, 1],
        ],
        [
            [1, 1],
            [1, 1],
        ],
        [
            [1, 1],
            [1, 1],
        ],
    ],
    S: [
        [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ],
        [
            [0, 1, 0],
            [0, 1, 1],
            [0, 0, 1],
        ],
        [
            [0, 0, 0],
            [0, 1, 1],
            [1, 1, 0],
        ],
        [
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 0],
        ],
    ],
    T: [
        [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        [
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 0],
        ],
        [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ],
        [
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 0],
        ],
    ],
    Z: [
        [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ],
        [
            [0, 0, 1],
            [0, 1, 1],
            [0, 1, 0],
        ],
        [
            [0, 0, 0],
            [1, 1, 0],
            [0, 1, 1],
        ],
        [
            [0, 1, 0],
            [1, 1, 0],
            [1, 0, 0],
        ],
    ],
};

export const SRS_KICKS = {
    JLSTZ: [
        [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    ],
    I: [
        [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    ],
    O: [
        [[0, 0]],
        [[0, 0]],
        [[0, 0]],
        [[0, 0]],
    ],
};

export function createPiece(type) {
    const shapes = PIECE_SHAPES[type];
    return {
        type,
        shape: shapes[0],
        rotation: 0,
        x: 3,
        y: -1,
        color: PIECE_COLORS[type],
    };
}

export function getRotatedShape(piece, rotation) {
    return PIECE_SHAPES[piece.type][rotation];
}

export function rotateCW(piece) {
    const newRotation = (piece.rotation + 1) % 4;
    return {
        ...piece,
        rotation: newRotation,
        shape: PIECE_SHAPES[piece.type][newRotation],
    };
}

export function rotateCCW(piece) {
    const newRotation = (piece.rotation + 3) % 4;
    return {
        ...piece,
        rotation: newRotation,
        shape: PIECE_SHAPES[piece.type][newRotation],
    };
}

export function getSRSKicks(piece, fromRotation, toRotation) {
    const key = piece.type === 'I' ? 'I' : piece.type === 'O' ? 'O' : 'JLSTZ';
    const table = SRS_KICKS[key];
    const index = fromRotation;
    return table[index] || [[0, 0]];
}

export function tryRotate(piece, board, direction) {
    const fromRotation = piece.rotation;
    const toRotation = direction === 'cw' ? (fromRotation + 1) % 4 : (fromRotation + 3) % 4;
    const kicks = getSRSKicks(piece, fromRotation, toRotation);

    for (const [dx, dy] of kicks) {
        const testPiece = {
            ...piece,
            rotation: toRotation,
            shape: PIECE_SHAPES[piece.type][toRotation],
            x: piece.x + dx,
            y: piece.y + dy,
        };
        if (board.isValid(testPiece)) {
            return testPiece;
        }
    }
    return null;
}

export function getGhostY(piece, board) {
    let y = piece.y;
    while (board.isValid({ ...piece, y: y + 1 })) {
        y++;
    }
    return y;
}