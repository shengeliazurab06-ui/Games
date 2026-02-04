let playerScore = 0;
let computerScore = 0;
let isProcessing = false;
let timeoutId = null;
let isMuted = localStorage.getItem('isMuted') === 'true';

const playerScoreSpan = document.getElementById('player-score');
const computerScoreSpan = document.getElementById('computer-score');
const resultBanner = document.getElementById('result-banner');
const computerChoiceText = document.getElementById('computer-choice-text');
const winSound = document.getElementById('win-sound');
const loseSound = document.getElementById('lose-sound');
const clickSound = document.getElementById('click-sound');
const historyList = document.getElementById('history-list');
const choicesDiv = document.querySelector('.choices');
const choiceRock = document.getElementById('choice-rock');
const choicePaper = document.getElementById('choice-paper');
const choiceScissors = document.getElementById('choice-scissors');
const playerProgress = document.getElementById('player-progress');
const computerProgress = document.getElementById('computer-progress');

const gameOverModal = document.getElementById('game-over-modal');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMessage = document.getElementById('game-over-message');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const overlay = document.getElementById('overlay');
const instructionsModal = document.getElementById('instructions-modal');
const startGameBtn = document.getElementById('start-game-btn');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

const winningScore = 10;

function addToHistory(playerChoice, computerChoice, result) {
    const li = document.createElement('li');
    let resultClass = result === 'Win' ? 'win' : (result === 'Loss' ? 'lose' : 'draw');
    
    li.innerHTML = `<span>You: ${playerChoice} vs PC: ${computerChoice}</span> <span class="${resultClass}">${result}</span>`;
    
    if (historyList.firstChild) {
        historyList.insertBefore(li, historyList.firstChild);
    } else {
        historyList.appendChild(li);
    }

    if (historyList.children.length > 5) {
        historyList.removeChild(historyList.lastChild);
    }
}

function playSound(sound) {
    if (isMuted) return;
    sound.currentTime = 0;
    sound.play();
}

function updateProgress() {
    playerProgress.style.width = `${(playerScore / winningScore) * 100}%`;
    computerProgress.style.width = `${(computerScore / winningScore) * 100}%`;
}

function play(playerChoice) {
    if (isProcessing) return;
    if (playerScore >= winningScore || computerScore >= winningScore) return;

    isProcessing = true;
    choicesDiv.classList.add('disabled');

    playSound(clickSound);

    computerChoiceText.innerText = "...";

    timeoutId = setTimeout(() => {
        const choices = ['rock', 'paper', 'scissors'];
        const computerChoice = choices[Math.floor(Math.random() * 3)];

        computerChoiceText.innerText = computerChoice;

        resultBanner.className = 'banner'; 

        if (playerChoice === computerChoice) {
            resultBanner.innerText = "It's a Draw!";
            resultBanner.classList.add('draw');
            addToHistory(playerChoice, computerChoice, "Draw");
        } else if (
            (playerChoice === 'rock' && computerChoice === 'scissors') ||
            (playerChoice === 'paper' && computerChoice === 'rock') ||
            (playerChoice === 'scissors' && computerChoice === 'paper')
        ) {
            playerScore++;
            resultBanner.innerText = "You won!";
            playerScoreSpan.innerText = playerScore;
            resultBanner.classList.add('win');
            playSound(winSound);
            addToHistory(playerChoice, computerChoice, "Win");
            updateProgress();
            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 }
            });
        } else {
            computerScore++;
            resultBanner.innerText = "You lost!";
            computerScoreSpan.innerText = computerScore;
            resultBanner.classList.add('lose');
            playSound(loseSound);
            addToHistory(playerChoice, computerChoice, "Loss");
            updateProgress();
        }

        if (playerScore >= winningScore || computerScore >= winningScore) {
            setTimeout(endGame, 500);
        }

        isProcessing = false;
        choicesDiv.classList.remove('disabled');
    }, 1000);
}

function endGame() {
    gameOverModal.style.display = 'block';
    overlay.style.display = 'block';
    
    if (playerScore > computerScore) {
        gameOverTitle.innerText = "Victory!";
        gameOverMessage.innerText = "You won the match!";
        playSound(winSound);
        var duration = 3 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        var random = function(min, max) { return Math.random() * (max - min) + min; };

        var interval = setInterval(function() {
            var timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            var particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    } else {
        gameOverTitle.innerText = "Defeat!";
        gameOverMessage.innerText = "Computer won the match!";
        playSound(loseSound);
    }
}

function resetGame() {
    clearTimeout(timeoutId);
    isProcessing = false;
    choicesDiv.classList.remove('disabled');
    gameOverModal.style.display = 'none';
    overlay.style.display = 'none';
    playerScore = 0;
    computerScore = 0;
    playerScoreSpan.innerText = 0;
    computerScoreSpan.innerText = 0;
    updateProgress();
    resultBanner.innerText = "Get Ready!";
    resultBanner.className = "banner";
    computerChoiceText.innerText = "Click a button to start";
    computerChoiceText.innerText = "Make your move";
    historyList.innerHTML = '';
}

document.addEventListener('keydown', (event) => {
    if (isProcessing) return;
    if (playerScore >= winningScore || computerScore >= winningScore) return;
    
    const key = event.key.toLowerCase();
    let choiceBtn = null;
    
    if (key === 'r') { play('rock'); choiceBtn = choiceRock; }
    else if (key === 'p') { play('paper'); choiceBtn = choicePaper; }
    else if (key === 's') { play('scissors'); choiceBtn = choiceScissors; }

    if (choiceBtn) {
        choiceBtn.classList.add('active-key');
        setTimeout(() => choiceBtn.classList.remove('active-key'), 200);
    }
});

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggleBtn.innerText = theme === 'light' ? '🌙' : '☀️';
}

function toggleSound() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    soundToggleBtn.innerText = isMuted ? '🔇' : '🔊';
}

const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);
soundToggleBtn.innerText = isMuted ? '🔇' : '🔊';

settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
    overlay.style.display = 'block';
});

if (!localStorage.getItem('hasVisited')) {
    instructionsModal.style.display = 'block';
    overlay.style.display = 'block';
    localStorage.setItem('hasVisited', 'true');
}

startGameBtn.addEventListener('click', () => {
    instructionsModal.style.display = 'none';
    overlay.style.display = 'none';
});

function closeModal() {
    settingsModal.style.display = 'none';
    instructionsModal.style.display = 'none';
    gameOverModal.style.display = 'none';
    overlay.style.display = 'none';
}

closeModalBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
});

soundToggleBtn.addEventListener('click', toggleSound);