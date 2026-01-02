const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highElement = document.getElementById("highScore");
const pauseBtn = document.getElementById("pauseBtn");
const overlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayScore = document.getElementById("overlayScore");
const restartBtn = document.getElementById("restartBtn");
const pauseOverlay = document.getElementById("pauseOverlay");
const resumeBtn = document.getElementById("resumeBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsOverlay = document.getElementById("settingsOverlay");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const soundToggle = document.getElementById("soundToggle");
const difficultySelect = document.getElementById("difficultySelect");
const languageSelect = document.getElementById("languageSelect");
const invincibilityContainer = document.getElementById("invincibilityContainer");
const invincibilityBar = document.getElementById("invincibilityBar");
const achievementsBtn = document.getElementById("achievementsBtn");
const achievementsOverlay = document.getElementById("achievementsOverlay");
const closeAchievementsBtn = document.getElementById("closeAchievementsBtn");
const achievementsList = document.getElementById("achievementsList");
const notificationArea = document.getElementById("notificationArea");
const shopBtn = document.getElementById("shopBtn");
const shopOverlay = document.getElementById("shopOverlay");
const closeShopBtn = document.getElementById("closeShopBtn");
const shopList = document.getElementById("shopList");
const comboDisplay = document.getElementById("comboDisplay");

const box = 20;
let snake, food, direction, nextDirection, score, isPaused, isGameOver;
let speed = 120;
let lastTime = 0;
let invincibleTime = 0;
let particles = [];
let highScore = localStorage.getItem("snakeHighScore") || 0;
let currentLang = localStorage.getItem("snakeLang") || "en";
let comboMultiplier = 1;
let lastEatTime = 0;

let gameStats = JSON.parse(localStorage.getItem("snakeStats")) || {
    totalFood: 0,
    totalGames: 0,
    specialFood: 0,
    currency: 0
};
if (typeof gameStats.currency !== 'number') {
    gameStats.currency = Number(gameStats.currency) || 0;
    localStorage.setItem("snakeStats", JSON.stringify(gameStats));
}

let unlockedAchievements = JSON.parse(localStorage.getItem("snakeAchievements")) || [];
let ownedSkins = JSON.parse(localStorage.getItem("snakeOwnedSkins")) || ["default"];
let currentSkin = localStorage.getItem("snakeCurrentSkin") || "default";

const skins = [
    { id: "default", color: "#00f2ff", price: 0, nameKey: "skin_default", bg: "#0a0b10" },
    { id: "green", color: "#2ea043", price: 100, nameKey: "skin_green", bg: "#051005" },
    { id: "purple", color: "#8250df", price: 250, nameKey: "skin_purple", bg: "#0a0510" },
    { id: "orange", color: "#ff7b00", price: 500, nameKey: "skin_orange", bg: "#100a00" },
    { id: "pink", color: "#ff00d4", price: 750, nameKey: "skin_pink", bg: "#100010" },
    { id: "gold", color: "#ffd700", price: 1000, nameKey: "skin_gold", bg: "#101005" },
    { id: "blue", color: "#0051ff", price: 1200, nameKey: "skin_blue", bg: "#000510" },
    { id: "red", color: "#ff0000", price: 1500, nameKey: "skin_red", bg: "#100000" },
    { id: "white", color: "#ffffff", price: 2000, nameKey: "skin_white", bg: "#1a1b20" },
    { id: "ghost", color: "rgba(255, 255, 255, 0.5)", price: 3000, nameKey: "skin_ghost", bg: "#0a0b10" },
    { id: "matrix", color: "#00FF41", price: 4000, nameKey: "skin_matrix", bg: "#000000" }
];

const achievementsData = [
    { id: "novice", titleKey: "ach_novice", descKey: "desc_novice", condition: (stats) => stats.totalFood >= 10 },
    { id: "glutton", titleKey: "ach_glutton", descKey: "desc_glutton", condition: (stats) => stats.totalFood >= 100 },
    { id: "collector", titleKey: "ach_collector", descKey: "desc_collector", condition: (stats) => stats.specialFood >= 10 },
    { id: "veteran", titleKey: "ach_veteran", descKey: "desc_veteran", condition: (stats) => stats.totalGames >= 10 },
    { id: "master", titleKey: "ach_master", descKey: "desc_master", condition: (stats, currentScore) => currentScore >= 100 }
];

const translations = {
    ka: {
        score: "ქულა",
        highScore: "რეკორდი",
        gameOver: "თამაში დასრულდა",
        restart: "თავიდან დაწყება",
        pause: "პაუზა",
        resume: "გაგრძელება",
        settings: "პარამეტრები",
        sound: "ხმა",
        difficulty: "სირთულე",
        easy: "ადვილი",
        medium: "საშუალო",
        hard: "რთული",
        save: "შენახვა",
        instructions: "გამოიყენეთ ისრები (Arrow Keys) სამართავად",
        language: "ენა",
        achievements: "მიღწევები",
        close: "დახურვა",
        ach_novice: "დამწყები",
        desc_novice: "შეჭამე 10 საჭმელი",
        ach_glutton: "ღორმუცელა",
        desc_glutton: "შეჭამე 100 საჭმელი",
        ach_collector: "კოლექციონერი",
        desc_collector: "შეჭამე 10 სპეციალური საჭმელი",
        ach_veteran: "ვეტერანი",
        desc_veteran: "ითამაშე 10 თამაში",
        ach_master: "ოსტატი",
        desc_master: "დააგროვე 100 ქულა ერთ თამაშში",
        shop: "სკინები",
        currency: "ქულები",
        skin_default: "ნეონი",
        skin_green: "ბუნება",
        skin_purple: "კოსმოსი",
        skin_orange: "ცეცხლი",
        skin_pink: "კიბერპანკი",
        skin_gold: "ოქრო",
        skin_blue: "ოკეანე",
        skin_red: "წითელი",
        skin_white: "სინათლე",
        skin_ghost: "მოჩვენება",
        skin_matrix: "მატრიცა",
        buy: "ყიდვა",
        owned: "ნაყიდია",
        select: "არჩევა",
        selected: "არჩეულია"
    },
    en: {
        score: "Score",
        highScore: "High Score",
        gameOver: "Game Over",
        restart: "Restart",
        pause: "Pause",
        resume: "Resume",
        settings: "Settings",
        sound: "Sound",
        difficulty: "Difficulty",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        save: "Save",
        instructions: "Use Arrow Keys to control",
        language: "Language",
        achievements: "Achievements",
        close: "Close",
        ach_novice: "Novice",
        desc_novice: "Eat 10 food items",
        ach_glutton: "Glutton",
        desc_glutton: "Eat 100 food items",
        ach_collector: "Collector",
        desc_collector: "Eat 10 special food items",
        ach_veteran: "Veteran",
        desc_veteran: "Play 10 games",
        ach_master: "Master",
        desc_master: "Score 100 points in one game",
        shop: "Skins",
        currency: "Points",
        skin_default: "Neon",
        skin_green: "Nature",
        skin_purple: "Space",
        skin_orange: "Fire",
        skin_pink: "Cyberpunk",
        skin_gold: "Gold",
        skin_blue: "Ocean",
        skin_red: "Red",
        skin_white: "Light",
        skin_ghost: "Ghost",
        skin_matrix: "Matrix",
        buy: "Buy",
        owned: "Owned",
        select: "Select",
        selected: "Selected"
    }
};

function updateLanguage() {
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.getAttribute("data-lang");
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });
    languageSelect.value = currentLang;
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const eatAudio = new Audio('audios/eating audio.mp3');

let isSoundOn = true;

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (!isSoundOn) return;

    if (type === 'eat') {
        eatAudio.currentTime = 0;
        eatAudio.play().catch(e => console.log(e));
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}

highElement.innerText = highScore;

let difficulty = "medium";
const difficultySettings = {
    easy: 150,
    medium: 120,
    hard: 80
};

function initGame() {
    snake = [
        {x: 10 * box, y: 10 * box},
        {x: 9 * box, y: 10 * box}
    ];
    direction = "RIGHT";
    nextDirection = "RIGHT";
    score = 0;
    speed = difficultySettings[difficulty];
    isPaused = false;
    isGameOver = false;
    scoreElement.innerText = score;
    overlay.classList.add("hidden");
    pauseOverlay.classList.add("hidden");
    settingsOverlay.classList.add("hidden");
    particles = [];
    invincibleTime = 0;
    comboMultiplier = 1;
    comboDisplay.classList.add("hidden");
    spawnFood();
    
    requestAnimationFrame(gameLoop);
}

const foodTypes = [
    { color: "#ff0055", score: 10, effect: "normal" },
    { color: "#ffd700", score: 30, effect: "bonus" },
    { color: "#9d00ff", score: 15, effect: "slow" },
    { color: "#00eaff", score: 20, effect: "shield" }
];

function spawnFood() {
    const rand = Math.random();
    let type = foodTypes[0];
    if (rand > 0.95) type = foodTypes[3];
    else if (rand > 0.85) type = foodTypes[2];
    else if (rand > 0.75) type = foodTypes[1];

    food = {
        x: Math.floor(Math.random() * (canvas.width / box)) * box,
        y: Math.floor(Math.random() * (canvas.height / box)) * box,
        ...type
    };
}

document.addEventListener("keydown", e => {
    const keys = {37: "LEFT", 38: "UP", 39: "RIGHT", 40: "DOWN"};
    const newDir = keys[e.keyCode];
    if (!newDir) return;

    const opposites = {LEFT: "RIGHT", RIGHT: "LEFT", UP: "DOWN", DOWN: "UP"};
    if (newDir !== opposites[direction]) {
        nextDirection = newDir;
    }
});

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: false});

document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const opposites = {LEFT: "RIGHT", RIGHT: "LEFT", UP: "DOWN", DOWN: "UP"};

    if (Math.abs(diffX) > Math.abs(diffY)) {
        const newDir = diffX > 0 ? "RIGHT" : "LEFT";
        if (newDir !== opposites[direction]) nextDirection = newDir;
    } else {
        const newDir = diffY > 0 ? "DOWN" : "UP";
        if (newDir !== opposites[direction]) nextDirection = newDir;
    }
}, {passive: false});

function gameLoop(timestamp) {
    if (isGameOver) return;
    
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;

    if (!isPaused && deltaTime >= speed) {
        update();
        lastTime = timestamp;
    }

    draw();
    if (!isGameOver) requestAnimationFrame(gameLoop);
}

function draw() {
    const currentSkinObj = skins.find(s => s.id === currentSkin);
    
    ctx.fillStyle = "#0a0b10";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawParticles();

    snake.forEach((seg, i) => {
        const skinColor = currentSkinObj.color;
        ctx.fillStyle = skinColor;
        if (i !== 0) ctx.globalAlpha = 0.7;
        
        if (invincibleTime > 0) {
            ctx.fillStyle = i === 0 ? "#fff" : "#00eaff";
            if (Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.5;
        }

        ctx.shadowBlur = i === 0 ? 15 : 0;
        ctx.shadowColor = skinColor;
        
        if (currentSkin === 'matrix') {
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', seg.x + box/2, seg.y + box/2);
        } else {
            ctx.fillRect(seg.x + 1, seg.y + 1, box - 2, box - 2);
        }
        
        ctx.globalAlpha = 1.0;
        
        if (i === 0) drawEyes(seg.x, seg.y);
    });

    ctx.fillStyle = food.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = food.color;
    ctx.fillRect(food.x + 4, food.y + 4, box - 8, box - 8);
    ctx.shadowBlur = 0;
}

function update() {
    direction = nextDirection;
    if (invincibleTime > 0) {
        invincibleTime -= speed;
        invincibilityContainer.classList.remove('hidden');
        const percentage = (invincibleTime / 10000) * 100;
        invincibilityBar.style.width = percentage + "%";
    } else {
        invincibilityContainer.classList.add('hidden');
    }

    if (Date.now() - lastEatTime > 3000) {
        comboMultiplier = 1;
        comboDisplay.classList.add("hidden");
    }
    
    let headX = snake[0].x;
    let headY = snake[0].y;

    if (direction === "LEFT") headX -= box;
    if (direction === "UP") headY -= box;
    if (direction === "RIGHT") headX += box;
    if (direction === "DOWN") headY += box;

    if (headX < 0 || headX >= canvas.width || headY < 0 || headY >= canvas.height) {
        if (invincibleTime > 0) {
            if (headX < 0) headX = canvas.width - box;
            else if (headX >= canvas.width) headX = 0;
            if (headY < 0) headY = canvas.height - box;
            else if (headY >= canvas.height) headY = 0;
        } else {
            return gameOver();
        }
    }

    if (invincibleTime <= 0 && snake.some(seg => seg.x === headX && seg.y === headY)) {
        return gameOver();
    }

    const newHead = {x: headX, y: headY};

    if (headX === food.x && headY === food.y) {
        const now = Date.now();
        if (now - lastEatTime < 3000) {
            comboMultiplier++;
        } else {
            comboMultiplier = 1;
        }
        lastEatTime = now;
        
        if (comboMultiplier > 1) {
            comboDisplay.innerText = `x${comboMultiplier}`;
            comboDisplay.classList.remove("hidden");
            comboDisplay.style.animation = 'none';
            comboDisplay.offsetHeight;
            comboDisplay.style.animation = null; 
        }

        const points = food.score * comboMultiplier;
        score += points;
        scoreElement.innerText = score;
        createParticles(food.x + box/2, food.y + box/2, food.color);
        playSound('eat');
        
        gameStats.totalFood++;
        if (food.effect !== "normal") gameStats.specialFood++;
        localStorage.setItem("snakeStats", JSON.stringify(gameStats));
        checkAchievements();
        
        if (food.effect === "slow") {
            speed = Math.min(150, speed + 15);
        } else if (food.effect === "shield") {
            invincibleTime = 10000;
        } else if (speed > 50) {
            speed -= 2;
        }
        
        spawnFood();
    } else {
        snake.pop();
    }
    snake.unshift(newHead);
}

function drawGrid() {
    ctx.strokeStyle = "#161b22";
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += box) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function drawEyes(x, y) {
    ctx.fillStyle = "white";
    ctx.shadowBlur = 0;
    let offsetX = 0, offsetY = 0;
    if (direction === "RIGHT") offsetX = 4;
    if (direction === "LEFT") offsetX = -4;
    if (direction === "UP") offsetY = -4;
    if (direction === "DOWN") offsetY = 4;

    ctx.fillRect(x + 5 + offsetX, y + 5 + offsetY, 4, 4);
    ctx.fillRect(x + 11 + offsetX, y + 5 + offsetY, 4, 4);
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color: color
        });
    }
}

function drawParticles() {
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) particles.splice(index, 1);
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1.0;
    });
}

function gameOver() {
    playSound('die');
    
    gameStats.totalGames++;
    gameStats.currency += score;

    localStorage.setItem("snakeStats", JSON.stringify(gameStats));
    checkAchievements();

    isGameOver = true;
    if (score > highScore) {
        localStorage.setItem("snakeHighScore", score);
        highScore = score;
        highElement.innerText = highScore;
    }
    overlayScore.innerText = score;
    overlay.classList.remove("hidden");
}

function checkAchievements() {
    let changed = false;
    achievementsData.forEach(ach => {
        if (!unlockedAchievements.includes(ach.id)) {
            if (ach.condition(gameStats, score)) {
                unlockedAchievements.push(ach.id);
                showNotification(ach);
                changed = true;
            }
        }
    });
    if (changed) {
        localStorage.setItem("snakeAchievements", JSON.stringify(unlockedAchievements));
    }
}

function showNotification(ach) {
    const notif = document.createElement("div");
    notif.className = "notification";
    const title = translations[currentLang][ach.titleKey];
    const desc = translations[currentLang][ach.descKey];
    notif.innerHTML = `<h4>${title}</h4><p>${desc}</p>`;
    notificationArea.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function renderShop() {
    shopList.innerHTML = "";
    
    skins.forEach(skin => {
        const isSelected = currentSkin === skin.id;
        const item = document.createElement("div");
        item.className = `shop-item owned ${isSelected ? "selected" : ""}`;
        
        const name = translations[currentLang][skin.nameKey] || skin.id;
        
        let btnText = "";
        let btnClass = "";

        if (isSelected) {
            btnText = translations[currentLang].selected;
            btnClass = "selected";
        } else {
            btnText = translations[currentLang].select;
            btnClass = "select";
        }

        item.innerHTML = `
            <div class="color-preview" style="background: ${skin.color}; box-shadow: 0 0 10px ${skin.color}"></div>
            <div class="shop-item-name">${name}</div>
            <button class="shop-action-btn ${btnClass}">${btnText}</button>
        `;
        
        const actionBtn = item.querySelector(".shop-action-btn");
        actionBtn.onclick = (e) => {
            e.stopPropagation();
            if (!isSelected) {
                currentSkin = skin.id;
                localStorage.setItem("snakeCurrentSkin", currentSkin);
                renderShop();
            }
        };
        shopList.appendChild(item);
    });
}

pauseBtn.onclick = () => {
    if (!isGameOver) {
        isPaused = true;
        pauseOverlay.classList.remove("hidden");
    }
};

resumeBtn.onclick = () => {
    isPaused = false;
    pauseOverlay.classList.add("hidden");
};

settingsBtn.onclick = () => {
    if (!isGameOver) {
        isPaused = true;
        settingsOverlay.classList.remove("hidden");
    }
};

closeSettingsBtn.onclick = () => {
    isSoundOn = soundToggle.checked;
    difficulty = difficultySelect.value;
    
    currentLang = languageSelect.value;
    localStorage.setItem("snakeLang", currentLang);
    updateLanguage();

    settingsOverlay.classList.add("hidden");
    isPaused = false;
};

achievementsBtn.onclick = () => {
    if (!isGameOver) isPaused = true;
    renderAchievements();
    achievementsOverlay.classList.remove("hidden");
};

closeAchievementsBtn.onclick = () => {
    achievementsOverlay.classList.add("hidden");
    if (!isGameOver && !overlay.classList.contains("hidden")) isPaused = true;
    else if (!isGameOver) isPaused = false;
};

shopBtn.onclick = () => {
    if (!isGameOver) isPaused = true;
    renderShop();
    shopOverlay.classList.remove("hidden");
};

closeShopBtn.onclick = () => {
    shopOverlay.classList.add("hidden");
    if (!isGameOver && !overlay.classList.contains("hidden")) isPaused = true;
    else if (!isGameOver) isPaused = false;
};

function renderAchievements() {
    achievementsList.innerHTML = "";
    achievementsData.forEach(ach => {
        const isUnlocked = unlockedAchievements.includes(ach.id);
        const div = document.createElement("div");
        div.className = `achievement-item ${isUnlocked ? "unlocked" : ""}`;
        const title = translations[currentLang][ach.titleKey];
        const desc = translations[currentLang][ach.descKey];
        div.innerHTML = `
            <div style="font-size: 1.5rem;">${isUnlocked ? "🏆" : "🔒"}</div>
            <div>
                <h3>${title}</h3>
                <p>${desc}</p>
            </div>
        `;
        achievementsList.appendChild(div);
    });
}

restartBtn.onclick = initGame;

updateLanguage();
initGame();