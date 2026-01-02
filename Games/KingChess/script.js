const boardElement = document.getElementById('chessboard');
const statusElement = document.getElementById('status');
let selectedSquare = null;
let currentPlayer = 'white';
let gameBoard = [];
let isGameOver = false;
let moveHistory = [];
let botTimeoutId = null;
let searchDepth = 3;
let capturedPieces = { white: [], black: [] };

let castlingRights = {
    white: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false },
    black: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false }
};
let enPassantTarget = null;

const pieces = {
    white: { r: '♖', n: '♘', b: '♗', q: '♕', k: '♔', p: '♙' }, 
    black: { r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', p: '♟' }
};

const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const sounds = {
    move: new Audio('Sounds/move.mp3'),
    capture: new Audio('Sounds/capture.mp3'),
    check: new Audio('Sounds/check.mp3'),
    checkmate: new Audio('Sounds/GameOver(Checkmate).mp3'),
    stalemate: new Audio('Sounds/Game Over(Stalemate).mp3'),
    start: new Audio('Sounds/start.mp3'),
    castling: new Audio('Sounds/Castling.mp3')
};

const pawnTable = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];

const knightTable = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

const bishopTable = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];

const reverseArray = (array) => array.slice().reverse();
const blackPawnTable = reverseArray(pawnTable);
const blackKnightTable = reverseArray(knightTable);
const blackBishopTable = reverseArray(bishopTable);


function initGame() {
    gameBoard = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
    castlingRights = {
        white: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false },
        black: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false }
    };
    enPassantTarget = null;
    capturedPieces = { white: [], black: [] };
    renderBoard();
    updateCapturedUI();
    statusElement.innerText = "Game Started! Your Turn";
    sounds.start.play().catch(() => {});
}

function setDifficulty(level) {
    if (level === 'easy') searchDepth = 1;
    else if (level === 'medium') searchDepth = 2;
    else searchDepth = 3;
}

function updateCapturedUI() {
    const whiteContainer = document.getElementById('captured-white');
    const blackContainer = document.getElementById('captured-black');
    
    whiteContainer.innerHTML = '';
    blackContainer.innerHTML = '';
    
    capturedPieces.white.forEach(p => {
        const el = document.createElement('div');
        el.className = 'captured-piece';
        el.innerText = pieces.white[p.toLowerCase()];
        el.style.color = '#fff';
        el.style.textShadow = '0 0 2px #000';
        whiteContainer.appendChild(el);
    });
    
    capturedPieces.black.forEach(p => {
        const el = document.createElement('div');
        el.className = 'captured-piece';
        el.innerText = pieces.black[p.toLowerCase()];
        el.style.color = '#000';
        el.style.textShadow = '0 0 1px #fff';
        blackContainer.appendChild(el);
    });
}

function renderBoard() {
    boardElement.innerHTML = '';
    
    let validMoves = [];
    if (selectedSquare) {
        const selRow = parseInt(selectedSquare.dataset.row);
        const selCol = parseInt(selectedSquare.dataset.col);
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isMoveLegal(selRow, selCol, r, c, 'white')) {
                    validMoves.push({r, c});
                }
            }
        }
    }

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            
            const piece = gameBoard[row][col];
            if (piece) {
                const color = piece === piece.toUpperCase() ? 'white' : 'black';
                square.innerText = pieces[color][piece.toLowerCase()];
                square.dataset.color = color;
            }
            
            if (selectedSquare && parseInt(selectedSquare.dataset.row) === row && parseInt(selectedSquare.dataset.col) === col) {
                square.classList.add('selected');
            }

            if (validMoves.some(m => m.r === row && m.c === col)) {
                if (piece) {
                    square.classList.add('capture-hint');
                } else {
                    const hint = document.createElement('div');
                    hint.className = 'move-hint';
                    square.appendChild(hint);
                }
            }

            square.onclick = () => handleSquareClick(row, col);
            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (isGameOver || currentPlayer === 'black') return;

    const clickedPiece = gameBoard[row][col];
    const isWhitePiece = clickedPiece && clickedPiece === clickedPiece.toUpperCase();

    if (selectedSquare) {
        const fromRow = parseInt(selectedSquare.dataset.row);
        const fromCol = parseInt(selectedSquare.dataset.col);

        if (fromRow === row && fromCol === col) {
            selectedSquare = null;
            renderBoard();
            return;
        }

        if (isWhitePiece) {
            selectedSquare = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
            renderBoard();
            return;
        }

        if (isMoveLegal(fromRow, fromCol, row, col, 'white')) {
            makeMove(fromRow, fromCol, row, col);
            selectedSquare = null;
            currentPlayer = 'black';
            statusElement.innerText = "Opponent's Turn";
            
            if (botTimeoutId) clearTimeout(botTimeoutId);
            botTimeoutId = setTimeout(makeAiMove, 800);
        } else {
            selectedSquare = null;
            renderBoard();
        }
    } else {
        if (isWhitePiece) {
            selectedSquare = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
            renderBoard();
        }
    }
}

function promotePawn(board, row, col) {
    const piece = board[row][col];
    if (piece === 'P' && row === 0) {
        board[row][col] = 'Q';
    } else if (piece === 'p' && row === 7) {
        board[row][col] = 'q';
    }
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    recordHistory();
    const piece = gameBoard[fromRow][fromCol];
    const type = piece.toLowerCase();
    const color = piece === piece.toUpperCase() ? 'white' : 'black';
    let isCapture = gameBoard[toRow][toCol] !== null;
    let isCastling = false;

    if (gameBoard[toRow][toCol]) {
        const captured = gameBoard[toRow][toCol];
        const capColor = captured === captured.toUpperCase() ? 'white' : 'black';
        capturedPieces[capColor].push(captured);
    }

    if (type === 'p' && Math.abs(fromCol - toCol) === 1 && !gameBoard[toRow][toCol]) {
        const captured = gameBoard[fromRow][toCol];
        const capColor = captured === captured.toUpperCase() ? 'white' : 'black';
        capturedPieces[capColor].push(captured);
        
        gameBoard[fromRow][toCol] = null;
        isCapture = true;
    }

    if (type === 'k' && Math.abs(fromCol - toCol) === 2) {
        isCastling = true;
        if (toCol > fromCol) {
            gameBoard[fromRow][5] = gameBoard[fromRow][7];
            gameBoard[fromRow][7] = null;
        } else {
            gameBoard[fromRow][3] = gameBoard[fromRow][0];
            gameBoard[fromRow][0] = null;
        }
    }

    if (type === 'p' && Math.abs(fromRow - toRow) === 2) {
        enPassantTarget = { r: (fromRow + toRow) / 2, c: fromCol };
    } else {
        enPassantTarget = null;
    }

    if (type === 'k') castlingRights[color].kingMoved = true;
    if (type === 'r' && fromCol === 0) castlingRights[color].rookLeftMoved = true;
    if (type === 'r' && fromCol === 7) castlingRights[color].rookRightMoved = true;

    gameBoard[toRow][toCol] = gameBoard[fromRow][fromCol];
    gameBoard[fromRow][fromCol] = null;
    
    promotePawn(gameBoard, toRow, toCol);

    let soundToPlay = sounds.move;
    if (isCastling) {
        soundToPlay = sounds.castling;
    } else if (isCapture) {
        soundToPlay = sounds.capture;
    }
    soundToPlay.currentTime = 0;
    soundToPlay.play().catch(() => {});

    updateCapturedUI();
    renderBoard();
}

function recordHistory() {
    moveHistory.push({
        board: JSON.parse(JSON.stringify(gameBoard)),
        player: currentPlayer,
        castling: JSON.parse(JSON.stringify(castlingRights)),
        enPassant: enPassantTarget ? {...enPassantTarget} : null,
        gameOver: isGameOver,
        captured: JSON.parse(JSON.stringify(capturedPieces))
    });
}

function undoMove() {
    if (botTimeoutId) {
        clearTimeout(botTimeoutId);
        botTimeoutId = null;
    }

    if (moveHistory.length === 0) return;

    let stateToRestore = null;

    if (currentPlayer === 'black') {
        stateToRestore = moveHistory.pop();
    } else {
        if (moveHistory.length >= 2) {
            moveHistory.pop();
            stateToRestore = moveHistory.pop();
        } else {
            stateToRestore = moveHistory.pop();
        }
    }

    if (stateToRestore) {
        gameBoard = stateToRestore.board;
        currentPlayer = stateToRestore.player;
        castlingRights = stateToRestore.castling;
        enPassantTarget = stateToRestore.enPassant;
        capturedPieces = stateToRestore.captured;
        isGameOver = false;
        
        statusElement.innerText = `${currentPlayer === 'white' ? "Your Turn" : "Opponent's Turn"}`;
        statusElement.style.color = ""; 
        renderBoard();
        updateCapturedUI();
    }
}

function isPseudoValidMove(r1, c1, r2, c2, board, color, ignoreCastling = false) {
    if (!board[r1][c1]) return false;

    const piece = board[r1][c1];
    const target = board[r2][c2];
    
    if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) return false;

    if (target) {
        const isTargetWhite = target === target.toUpperCase();
        const isPieceWhite = color === 'white';
        if (isTargetWhite === isPieceWhite) return false;
    }

    const type = piece.toLowerCase();
    const dx = Math.abs(c2 - c1);
    const dy = Math.abs(r2 - r1);

    if (type === 'p') {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        if (c1 === c2 && !target) {
            if (r2 === r1 + direction) return true;
            if (r1 === startRow && r2 === r1 + 2 * direction && !board[r1 + direction][c1]) return true;
        }
        if (Math.abs(c1 - c2) === 1 && r2 === r1 + direction && target) return true;
        
        if (Math.abs(c1 - c2) === 1 && r2 === r1 + direction && !target) {
            if (enPassantTarget && enPassantTarget.r === r2 && enPassantTarget.c === c2) return true;
        }
        return false;
    }

    if (type === 'n') {
        return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
    }

    if (type === 'k') {
        if (dx <= 1 && dy <= 1) return true;

        if (!ignoreCastling && dx === 2 && dy === 0) {
            const startRow = color === 'white' ? 7 : 0;
            if (r1 !== startRow || c1 !== 4) return false;
            
            const rights = castlingRights[color];
            if (rights.kingMoved) return false;

            if (c2 === 6) {
                if (rights.rookRightMoved) return false;
                if (board[r1][5] || board[r1][6]) return false;
                if (!board[r1][7] || board[r1][7].toLowerCase() !== 'r') return false;
                if (isSquareUnderAttack(r1, 4, board, color) || isSquareUnderAttack(r1, 5, board, color)) return false;
                return true;
            }
            else if (c2 === 2) {
                if (rights.rookLeftMoved) return false;
                if (board[r1][3] || board[r1][2] || board[r1][1]) return false;
                if (!board[r1][0] || board[r1][0].toLowerCase() !== 'r') return false;
                if (isSquareUnderAttack(r1, 4, board, color) || isSquareUnderAttack(r1, 3, board, color)) return false;
                return true;
            }
        }

        return dx <= 1 && dy <= 1;
    }

    if (type === 'r' || type === 'b' || type === 'q') {
        if (type === 'r' && dx !== 0 && dy !== 0) return false;
        if (type === 'b' && dx !== dy) return false;
        if (type === 'q' && (dx !== 0 && dy !== 0 && dx !== dy)) return false;

        const stepX = c2 > c1 ? 1 : (c2 < c1 ? -1 : 0);
        const stepY = r2 > r1 ? 1 : (r2 < r1 ? -1 : 0);
        
        let curX = c1 + stepX;
        let curY = r1 + stepY;
        
        while (curX !== c2 || curY !== r2) {
            if (board[curY][curX]) return false;
            curX += stepX;
            curY += stepY;
        }
        return true;
    }

    return false;
}

function isMoveLegal(r1, c1, r2, c2, color) {
    if (!isPseudoValidMove(r1, c1, r2, c2, gameBoard, color)) return false;

    const savedTarget = gameBoard[r2][c2];
    const savedPiece = gameBoard[r1][c1];
    
    gameBoard[r2][c2] = savedPiece;
    gameBoard[r1][c1] = null;
    
    let enPassantCaptured = null;
    if (gameBoard[r2][c2].toLowerCase() === 'p' && Math.abs(c2 - c1) === 1 && !savedTarget) {
        enPassantCaptured = gameBoard[r1][c2];
        gameBoard[r1][c2] = null;
    }

    const inCheck = isKingInCheck(gameBoard, color);

    if (enPassantCaptured) gameBoard[r1][c2] = enPassantCaptured;
    gameBoard[r1][c1] = savedPiece;
    gameBoard[r2][c2] = savedTarget;

    return !inCheck;
}

function isSquareUnderAttack(targetR, targetC, board, color) {
    const opponentColor = color === 'white' ? 'black' : 'white';
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const piece = board[r][c];
            if(piece) {
                const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';
                if(pieceColor === opponentColor) {
                    if(isPseudoValidMove(r, c, targetR, targetC, board, opponentColor, true)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function isKingInCheck(board, color) {
    let kingR, kingC;
    const kingChar = color === 'white' ? 'K' : 'k';
    
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            if(board[r][c] === kingChar) {
                kingR = r;
                kingC = c;
                break;
            }
        }
    }
    
    if (kingR === undefined) return true;
    return isSquareUnderAttack(kingR, kingC, board, color);
}

function checkGameState() {
    const moves = getAllValidMoves(gameBoard, currentPlayer);
    const inCheck = isKingInCheck(gameBoard, currentPlayer);

    if (moves.length === 0) {
        isGameOver = true;
        if (inCheck) {
            if (currentPlayer === 'white') {
                statusElement.innerText = "You Lose!";
                const restartBtn = document.getElementById('restartBtn');
                if (restartBtn) restartBtn.innerText = "Try Again";
            } else {
                statusElement.innerText = "You Win!";
            }
            statusElement.style.color = "red";
            sounds.checkmate.play().catch(() => {});
        } else {
            statusElement.innerText = "Draw (Stalemate)!";
            sounds.stalemate.play().catch(() => {});
        }
        return true;
    }

    if (inCheck) {
        statusElement.innerText = `${currentPlayer === 'white' ? "Your Turn" : "Opponent's Turn"} (Check!)`;
        sounds.check.play().catch(() => {});
    } else {
        statusElement.innerText = `${currentPlayer === 'white' ? "Your Turn" : "Opponent's Turn"}`;
    }
    return false;
}

function makeAiMove() {
    if (checkGameState()) return;

    statusElement.innerText = 'Opponent is thinking...';
    
    setTimeout(() => {
        if (currentPlayer !== 'black') return;
        const bestMove = getBestMove(gameBoard, searchDepth);
        if (bestMove) {
            makeMove(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC);
            currentPlayer = 'white';
            checkGameState();
        }
    }, 10);
}

function getBestMove(board, depth) {
    let bestMoves = [];
    let bestValue = -Infinity;
    let alpha = -Infinity;
    let beta = Infinity;
    
    const moves = getAllValidMoves(board, 'black');
    
    moves.sort((a, b) => {
        const pieceA = board[a.toR][a.toC] ? 10 : 0;
        const pieceB = board[b.toR][b.toC] ? 10 : 0;
        return pieceB - pieceA;
    });

    for (const move of moves) {
        const savedTarget = board[move.toR][move.toC];
        const savedPiece = board[move.fromR][move.fromC];
        
        board[move.toR][move.toC] = savedPiece;
        board[move.fromR][move.fromC] = null;
        promotePawn(board, move.toR, move.toC);

        const boardValue = minimax(board, depth - 1, alpha, beta, false);

        board[move.fromR][move.fromC] = savedPiece;
        board[move.toR][move.toC] = savedTarget;

        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMoves = [move];
        } else if (boardValue === bestValue) {
            bestMoves.push(move);
        }
        alpha = Math.max(alpha, bestValue);
    }
    
    if (bestMoves.length > 0) {
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    return null;
}

function minimax(board, depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
        return evaluateBoard(board);
    }

    const color = isMaximizing ? 'black' : 'white';
    const moves = getAllValidMoves(board, color);

    if (moves.length === 0) {
        if (isKingInCheck(board, color)) {
            return isMaximizing ? -Infinity : Infinity;
        }
        return 0;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const savedTarget = board[move.toR][move.toC];
            const savedPiece = board[move.fromR][move.fromC];
            
            board[move.toR][move.toC] = savedPiece;
            board[move.fromR][move.fromC] = null;
            promotePawn(board, move.toR, move.toC);

            const score = minimax(board, depth - 1, alpha, beta, false);
            
            board[move.fromR][move.fromC] = savedPiece;
            board[move.toR][move.toC] = savedTarget;

            maxEval = Math.max(maxEval, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const savedTarget = board[move.toR][move.toC];
            const savedPiece = board[move.fromR][move.fromC];
            
            board[move.toR][move.toC] = savedPiece;
            board[move.fromR][move.fromC] = null;
            promotePawn(board, move.toR, move.toC);

            const score = minimax(board, depth - 1, alpha, beta, true);
            
            board[move.fromR][move.fromC] = savedPiece;
            board[move.toR][move.toC] = savedTarget;

            minEval = Math.min(minEval, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function getAllValidMoves(board, color) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            
            const isWhite = piece === piece.toUpperCase();
            if ((color === 'white' && !isWhite) || (color === 'black' && isWhite)) continue;

            for (let tr = 0; tr < 8; tr++) {
                for (let tc = 0; tc < 8; tc++) {
                    if (isPseudoValidMove(r, c, tr, tc, board, color)) {
                        const savedTarget = board[tr][tc];
                        const savedPiece = board[r][c];
                        
                        board[tr][tc] = savedPiece;
                        board[r][c] = null;
                        
                        if (!isKingInCheck(board, color)) {
                            moves.push({ fromR: r, fromC: c, toR: tr, toC: tc });
                        }
                        
                        board[r][c] = savedPiece;
                        board[tr][tc] = savedTarget;
                    }
                }
            }
        }
    }
    return moves;
}

function evaluateBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                const type = piece.toLowerCase();
                let val = pieceValues[type] || 0;
                
                if (type === 'p') val += (piece === 'P' ? pawnTable[r][c] : blackPawnTable[r][c]);
                if (type === 'n') val += (piece === 'N' ? knightTable[r][c] : blackKnightTable[r][c]);
                if (type === 'b') val += (piece === 'B' ? bishopTable[r][c] : blackBishopTable[r][c]);

                score += piece === piece.toUpperCase() ? -val : val;
            }
        }
    }
    return score;
}

initGame();