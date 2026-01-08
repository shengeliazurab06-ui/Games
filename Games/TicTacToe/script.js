const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const difficultySelect = document.getElementById("difficulty");
const scorePlayerEl = document.getElementById("scorePlayer");
const scoreBotEl = document.getElementById("scoreBot");
const scoreDrawEl = document.getElementById("scoreDraw");
const particleCanvas = document.getElementById("particleCanvas");
const rulesBtn = document.getElementById("rulesBtn");
const rulesModal = document.getElementById("rulesModal");
const closeRulesBtn = document.getElementById("closeRulesBtn");
const undoBtn = document.getElementById("undoBtn");
const replayBtn = document.getElementById("replayBtn");

const PLAYER_X = "X";
const PLAYER_O = "O";
let currentPlayer = PLAYER_X;
let board = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;
let difficulty = "easy";
let moveHistory = [];
let gameHistory = [];
let scores = {
    player: 0,
    bot: 0,
    draw: 0,
    theme: 'neon',
    streak: 0
};

const winningCombinations = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const theme = scores.theme;

    switch (theme) {
        case 'medieval': playMedievalSound(type); break;
        case 'retro': playRetroSound(type); break;
        case 'fantasy': playFantasySound(type); break;
        case 'dark': playDarkSound(type); break;
        case 'light': playLightSound(type); break;
        case 'scifi': playSciFiSound(type); break;
        case 'nature': playNatureSound(type); break;
        case 'halloween': playHalloweenSound(type); break;
        case 'christmas': playChristmasSound(type); break;
        case 'neon': default: playNeonSound(type); break;
    }
}

function playTone(freq, type, duration, vol = 0.1, slideTo = null) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
    }
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playNeonSound(type) {
    if (type === 'move') {
        playTone(800, 'sawtooth', 0.1, 0.05, 100);
    } else if (type === 'win') {
        playTone(200, 'square', 0.6, 0.1, 600);
    }
}

function playMedievalSound(type) {
    if (type === 'move') {
        playTone(500, 'triangle', 0.3, 0.2, 100);
        playTone(550, 'square', 0.2, 0.1, 150);
    } else if (type === 'win') {
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'triangle', 1.5, 0.1), i * 100);
        });
    }
}

function playRetroSound(type) {
    if (type === 'move') {
        playTone(440, 'square', 0.1, 0.1);
    } else if (type === 'win') {
        [440, 554, 659, 880].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'square', 0.2, 0.1), i * 80);
        });
    }
}

function playFantasySound(type) {
    if (type === 'move') {
        playTone(600, 'sine', 0.5, 0.1);
    } else if (type === 'win') {
        [523.25, 659.25, 783.99].forEach(freq => {
            playTone(freq, 'sine', 1.0, 0.1);
        });
    }
}

function playDarkSound(type) {
    if (type === 'move') {
        playTone(100, 'sine', 0.2, 0.3);
    } else if (type === 'win') {
        playTone(150, 'triangle', 1.0, 0.2, 50);
    }
}

function playLightSound(type) {
    
    if (type === 'move') {
        playTone(1200, 'sine', 0.05, 0.1);
    } else if (type === 'win') {
        playTone(800, 'sine', 0.4, 0.1, 1200);
    }
}

function playSciFiSound(type) {
    if (type === 'move') {
        playTone(1000, 'sawtooth', 0.1, 0.1, 200);
    } else if (type === 'win') {
        playTone(300, 'square', 0.1, 0.1);
        setTimeout(() => playTone(600, 'square', 0.1, 0.1), 100);
        setTimeout(() => playTone(1200, 'square', 0.4, 0.1, 2000), 200);
    }
}

function playNatureSound(type) {
    if (type === 'move') {
        playTone(200, 'triangle', 0.05, 0.2);
    } else if (type === 'win') {
        playTone(1500, 'sine', 0.1, 0.1, 2000);
        setTimeout(() => playTone(2000, 'sine', 0.2, 0.1, 1500), 100);
    }
}

function playHalloweenSound(type) {
    if (type === 'move') {
        playTone(300, 'sine', 0.3, 0.1, 100);
    } else if (type === 'win') {
        [220, 261, 311, 440].forEach((freq, i) => {
             setTimeout(() => playTone(freq, 'triangle', 0.5, 0.1), i * 150);
        });
    }
}

function playChristmasSound(type) {
    if (type === 'move') {
        playTone(2000, 'sine', 0.2, 0.1);
        playTone(2500, 'triangle', 0.2, 0.05);
    } else if (type === 'win') {
        const note = 659.25;
        playTone(note, 'sine', 0.2, 0.2);
        setTimeout(() => playTone(note, 'sine', 0.2, 0.2), 200);
        setTimeout(() => playTone(note, 'sine', 0.4, 0.2), 400);
    }
}

function initializeGame() {
    loadState();
    cells.forEach(cell => cell.addEventListener("click", cellClick));
    restartBtn.addEventListener("click", resetGame);
    difficultySelect.addEventListener("change", (e) => {
        difficulty = e.target.value;
        saveState();
    });
    themeSelect.addEventListener("change", (e) => switchTheme(e.target.value));
    startGameBtn.addEventListener("click", startIntro);
    
    undoBtn.addEventListener("click", undoMove);
    replayBtn.addEventListener("click", replayGame);

    // Modal Event Listeners
    rulesBtn.addEventListener("click", () => rulesModal.classList.add("active"));
    closeRulesBtn.addEventListener("click", () => rulesModal.classList.remove("active"));
    window.addEventListener("click", (e) => { if (e.target === rulesModal) rulesModal.classList.remove("active"); });
    
    statusText.textContent = `SYSTEM READY. PLAYER X START.`;
}

function startIntro() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    introOverlay.style.opacity = "0";
    setTimeout(() => {
        introOverlay.style.display = "none";
    }, 1000);
    playSound('move');
}

function loadState() {
    const saved = localStorage.getItem('tictactoe_save');
    if (saved) {
        const data = JSON.parse(saved);
        scores = data.scores;
        difficulty = data.difficulty || 'easy';
        if (!scores.streak) scores.streak = 0;
        let theme = data.theme || 'neon';
        if (theme === 'elegant') theme = 'neon';
        difficultySelect.value = difficulty;
        switchTheme(theme);
        themeSelect.value = theme;
        updateScoreboard();
    }
}

function saveState() {
    const data = {
        scores: scores,
        difficulty: difficulty,
        theme: themeSelect.value
    };
    localStorage.setItem('tictactoe_save', JSON.stringify(data));
}

function switchTheme(theme) {
    document.body.className = `theme-${theme}`;
    scores.theme = theme;
    saveState();
}

function updateScoreboard() {
    scorePlayerEl.textContent = scores.player;
    scoreBotEl.textContent = scores.bot;
    scoreDrawEl.textContent = scores.draw;
}

function cellClick() {
    const index = this.getAttribute("data-index");

    if (board[index] !== "" || !gameActive || currentPlayer === PLAYER_O) return;

    updateCell(this, index);
    checkResult();
}

function updateCell(cell, index) {
    board[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase(), "taken");
    moveHistory.push({ index: index, player: currentPlayer });
    gameHistory.push({ index: index, player: currentPlayer });
    playSound('move');
}

function switchPlayer() {
    currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
    statusText.textContent = currentPlayer === PLAYER_X ? "PLAYER TURN" : "AI PROCESSING...";
    
    if (currentPlayer === PLAYER_O && gameActive) {
        setTimeout(botMove, 700);
    }
}

function checkResult() {
    let roundWon = false;
    for (let i = 0; i < winningCombinations.length; i++) {
        const [a, b, c] = winningCombinations[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            highlightWin(a, b, c);
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusText.textContent = currentPlayer === PLAYER_X ? "VICTORY ACHIEVED" : "SYSTEM DEFEATED YOU";
        if (currentPlayer === PLAYER_X) {
            scores.player++;
            scores.streak++;
            triggerExplosion();
        } else {
            scores.bot++;
            scores.streak = 0;
        }
        updateScoreboard();
        saveState();
        gameActive = false;
        playSound('win');
        return;
    }

    if (!board.includes("")) {
        statusText.textContent = "STALEMATE DETECTED";
        scores.draw++;
        updateScoreboard();
        saveState();
        gameActive = false;
        return;
    }

    switchPlayer();
}

function highlightWin(a, b, c) {
    cells[a].classList.add('win');
    cells[b].classList.add('win');
    cells[c].classList.add('win');
}

function botMove() {
    let index;
    
    if (difficulty === "easy") {
        index = getRandomMove();
    } else if (difficulty === "medium") {
        index = getMediumMove();
    } else {
        const analysis = getBestMoveWithViz();
        index = analysis.bestMove;
    }

    const cell = document.querySelector(`.cell[data-index='${index}']`);
    updateCell(cell, index);
    checkResult();
}

function getRandomMove() {
    let available = board.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
    return available[Math.floor(Math.random() * available.length)];
}

function getMediumMove() {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] === PLAYER_O && board[b] === PLAYER_O && board[c] === "") return c;
        if (board[a] === PLAYER_O && board[c] === PLAYER_O && board[b] === "") return b;
        if (board[b] === PLAYER_O && board[c] === PLAYER_O && board[a] === "") return a;
    }
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] === PLAYER_X && board[b] === PLAYER_X && board[c] === "") return c;
        if (board[a] === PLAYER_X && board[c] === PLAYER_X && board[b] === "") return b;
        if (board[b] === PLAYER_X && board[c] === PLAYER_X && board[a] === "") return a;
    }
    return getRandomMove();
}

function getBestMoveWithViz() {
    let bestScore = -Infinity;
    let move;
    let evaluatedMoves = [];
    
    for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
            board[i] = PLAYER_O;
            let score = minimax(board, 0, false);
            board[i] = "";
            
            evaluatedMoves.push({ index: i, score: score });
            
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        } else {
            evaluatedMoves.push({ index: i, score: null });
        }
    }
    return { bestMove: move, moves: evaluatedMoves };
}

function undoMove() {
    if (!gameActive || moveHistory.length === 0) return;
    
    if (moveHistory.length > 0) {
        const lastMove = moveHistory.pop();
        board[lastMove.index] = "";
        const cell = document.querySelector(`.cell[data-index='${lastMove.index}']`);
        cell.textContent = "";
        cell.classList.remove("x", "o", "taken");
    }

    if (moveHistory.length > 0) {
        const lastMove = moveHistory.pop();
        board[lastMove.index] = "";
        const cell = document.querySelector(`.cell[data-index='${lastMove.index}']`);
        cell.textContent = "";
        cell.classList.remove("x", "o", "taken");
    }
    
    currentPlayer = PLAYER_X;
    statusText.textContent = "PLAYER TURN";
    gameActive = true;
}

function replayGame() {
    if (gameHistory.length === 0) return;
    resetGame(false);
    gameActive = false;
    statusText.textContent = "REPLAYING...";
    
    gameHistory.forEach((move, i) => {
        setTimeout(() => {
            const cell = document.querySelector(`.cell[data-index='${move.index}']`);
            cell.textContent = move.player;
            cell.classList.add(move.player.toLowerCase(), "taken");
            playSound('move');
        }, i * 500);
    });
}

function minimax(newBoard, depth, isMaximizing) {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
            return newBoard[a] === PLAYER_O ? 10 - depth : depth - 10;
        }
    }
    if (!newBoard.includes("")) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (newBoard[i] === "") {
                newBoard[i] = PLAYER_O;
                let score = minimax(newBoard, depth + 1, false);
                newBoard[i] = "";
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (newBoard[i] === "") {
                newBoard[i] = PLAYER_X;
                let score = minimax(newBoard, depth + 1, true);
                newBoard[i] = "";
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function resetGame(clearHistory = true) {
    board.fill("");
    gameActive = true;
    currentPlayer = PLAYER_X;
    moveHistory = [];
    if (clearHistory) gameHistory = [];
    statusText.textContent = "SYSTEM REBOOTED. PLAYER X START.";
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("x", "o", "taken", "win");
    });
    
    if (clearHistory && gameHistory.length > 0) {
        replayBtn.style.display = 'inline-block';
    }
}

const particleCtx = particleCanvas.getContext("2d");
particleCanvas.width = window.innerWidth;
particleCanvas.height = window.innerHeight;
let particles = [];
let animationId = null;

function triggerExplosion() {
    particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 4 + 2,
            color: ['#00f3ff', '#ff00ff', '#00ff41'][Math.floor(Math.random() * 3)],
            life: 100
        });
    }
    if (!animationId) animateParticles();
}

function animateParticles() {
    if (particles.length === 0) {
        animationId = null;
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        return;
    }
    
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.size *= 0.96;
        
        particleCtx.globalAlpha = p.life / 100;
        particleCtx.fillStyle = p.color;
        particleCtx.shadowBlur = 15;
        particleCtx.shadowColor = p.color;
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fill();
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
    animationId = requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
});

initializeGame();
