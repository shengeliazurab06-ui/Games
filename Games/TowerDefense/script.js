const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;
let scaleRatio = 1;

function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;

        const scaleX = containerWidth / GAME_WIDTH;
        const scaleY = containerHeight / GAME_HEIGHT;
        
        ctx.scale(scaleX, scaleY);
        scaleRatio = { x: scaleX, y: scaleY };
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let money = 200;
let lives = 10;
let enemies = [];
let turrets = [];
let wave = 1;
let isGameOver = false;
let isPaused = false;
let gameStarted = false;
let mouseX = 0;
let mouseY = 0;
let enemiesToSpawn = [];
let spawnFrameCount = 0;
let difficultyMultiplier = 1;
let floatingTexts = [];
let particles = [];
let projectiles = [];
let explosions = [];
let skillPoints = 0;
let isPreparingWave = false;
let currentWeather = 'none';
let weatherParticles = [];
let hero = null;
let isEndlessMode = false;
let maxWaves = 50;
let gameStats = { kills: 0, wavesCleared: 0 };
let decorations = [];
let villagers = [];
let bossWarningTimer = 0;
let bossWarningText = "";

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);


const towerTypes = {
    archer: { name: "Archer", cost: 50, range: 150, damage: 25, cooldown: 78, color: "#27ae60" },
    crossbow: { name: "Crossbow", cost: 100, range: 200, damage: 70, cooldown: 102, color: "#d35400" },
    ice: { name: "Ice Tower", cost: 150, range: 130, damage: 15, cooldown: 60, color: "#3498db" },
    cannon: { name: "Cannon", cost: 200, range: 120, damage: 200, cooldown: 150, color: "#2c3e50" },
    magic: { name: "Magic Tower", cost: 300, range: 180, damage: 120, cooldown: 90, color: "#9b59b6" }
};

const playerSkills = {
    taxMastery: { name: "Tax Mastery", desc: "+15% Gold from Kills", level: 0, maxLevel: 5, cost: 1 },
    engineering: { name: "Engineering", desc: "-10% Tower Cost", level: 0, maxLevel: 5, cost: 1 },
    royalRestoration: { name: "Royal Restoration", desc: "Restore 1 Life (Max 5)", cost: 3, uses: 0, maxUses: 5 }
};

const achievements = [
    { id: 'first_blood', title: "First Blood", desc: "Kill your first enemy", condition: () => gameStats.kills >= 1, unlocked: false },
    { id: 'hunter', title: "Hunter", desc: "Kill 10 enemies", condition: () => gameStats.kills >= 10, unlocked: false },
    { id: 'slayer', title: "Slayer", desc: "Kill 50 enemies", condition: () => gameStats.kills >= 50, unlocked: false },
    { id: 'survivor', title: "Survivor", desc: "Clear 5 waves", condition: () => gameStats.wavesCleared >= 5, unlocked: false }
];

const globalUpgrades = {};
Object.keys(towerTypes).forEach(type => {
    globalUpgrades[type] = { damage: 0, range: 0, speed: 0 };
});
let sideMenuMode = 'upgrades';

let selectedTower = null;
let selectedPlacedTower = null;

const achievementPopup = document.createElement('div');
achievementPopup.id = 'achievement-popup';
document.body.appendChild(achievementPopup);

function checkAchievements() {
    achievements.forEach(ach => {
        if (!ach.unlocked && ach.condition()) {
            ach.unlocked = true;
            showAchievement(ach);
        }
    });
}

function showAchievement(ach) {
    achievementPopup.innerHTML = `<h4>Achievement Unlocked!</h4><span>${ach.title}</span><small>${ach.desc}</small>`;
    achievementPopup.style.right = '20px';
    
    setTimeout(() => {
        achievementPopup.style.right = '-300px';
    }, 4000);
}

const towerImages = {
    archer: new Image(),
    crossbow: new Image(),
    ice: new Image(),
    cannon: new Image(),
    magic: new Image()
};
towerImages.archer.src = 'pictures/ArcherTower.png';
towerImages.crossbow.src = 'pictures/CrossBow.png';
towerImages.ice.src = 'pictures/icetower.png';
towerImages.cannon.src = 'pictures/Canon.png';
towerImages.magic.src = 'pictures/MagicTower.png';

const enemyImages = {
    goblin: new Image(),
    knight: new Image(),
    boss: new Image(),
    skeleton: new Image(),
    troll: new Image(),
    bat: new Image(),
    alchemist: new Image(),
    assassin: new Image(),
    harpy: new Image(),
    dragonBoss: new Image()
};
enemyImages.goblin.src = 'pictures/Goblin.png';
enemyImages.knight.src = 'pictures/CorruptedKnight.png';
enemyImages.boss.src = 'pictures/Boss.png';
enemyImages.skeleton.src = 'pictures/Skeleton.png';
enemyImages.troll.src = 'pictures/foresttrool.png';
enemyImages.bat.src = 'pictures/DarkBat.png';
enemyImages.alchemist.src = 'pictures/Plague Alchemist.png';
enemyImages.assassin.src = 'pictures/Shadow assasin.png';
enemyImages.harpy.src = 'pictures/Harpy.png';
enemyImages.dragonBoss.src = 'pictures/DragonBoss.png';

const decorationImages = {
    tree: new Image(),
    man: new Image(),
    woman: new Image(),
    house: new Image(),
    castle: new Image(),
    princess: new Image(),
    grass: new Image()
};
decorationImages.tree.src = 'pictures/tree.png';
decorationImages.man.src = 'pictures/villigerMan.png';
decorationImages.woman.src = 'pictures/villigerWoman.png';
decorationImages.house.src = 'pictures/VillageHouse.png';
decorationImages.castle.src = 'pictures/Castle.png';
decorationImages.princess.src = 'pictures/Princess.png';
decorationImages.grass.src = 'pictures/grass.png';

const heroImage = new Image();
heroImage.src = 'pictures/HeroKnight.png';

const audio = {
    bgm: new Audio('audios/bgm.mp3.mp3'),
    arrow: new Audio('audios/arrow.mp3.mp3'),
    cannon: new Audio('audios/cannon.mp3.mp3'),
    magic: new Audio('audios/magic.mp3.mp3'),
    ice: new Audio('audios/ice.mp3.mp3'),
    hit: new Audio('audios/hit.mp3'),
    build: new Audio('audios/build.mp3.mp3'),
    sell: new Audio('audios/sell.mp3'),
    levelup: new Audio('audios/levelup.mp3.mp3'),
    gameover: new Audio('audios/gameover.mp3.mp3'),
    victory: new Audio('audios/victory.mp3.mp3'),
    wavestart: new Audio('audios/wavestart.mp3.mp3'),
    heroSlash: new Audio('audios/HeroKnightSlash.mp3.mp3'),
    mainMenu: new Audio('audios/MainMenu.mp3')
};
audio.bgm.loop = true;
audio.bgm.volume = 0.3;
audio.mainMenu.loop = true;
audio.mainMenu.volume= 0.3;

let isMuted = false;

function playSound(name) {
    if (isMuted) return;
    if (audio[name]) {
        const s = new Audio(audio[name].src);
        s.volume = 0.4;
        s.play().catch(e => {});
    }
}

const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
document.body.appendChild(tooltip);

function showTooltip(html, x, y) {
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    
    if (y > window.innerHeight * 0.6) {
        tooltip.style.top = 'auto';
        tooltip.style.bottom = (window.innerHeight - y + 15) + 'px';
    } else {
        tooltip.style.bottom = 'auto';
        tooltip.style.top = (y + 15) + 'px';
    }
    tooltip.style.left = (x + 15) + 'px';
}

function hideTooltip() {
    tooltip.style.display = 'none';
}

function initGameUI() {
    const bottomBar = document.getElementById('bottom-action-bar');
    bottomBar.innerHTML = `
        <div class="hud-section hud-stats">
            <div class="stat-item"><span class="icon">💰</span> <span id="money">${money}</span></div>
            <div class="stat-item"><span class="icon">✨</span> <span id="sp-display">${skillPoints}</span></div>
            <div class="stat-item"><span class="icon">🌊</span> <span id="wave">${wave}</span></div>
            <div class="stat-item"><span class="icon">❤️</span> <span id="lives">${lives}</span></div>
        </div>
        <div class="hud-section hud-shop" id="tower-shop"></div>
        <div class="hud-section hud-controls">
            <button id="btn-skills" class="hud-btn" onclick="toggleSkillsMenu()" title="Skills">⚡</button>
            <button id="btn-mute" class="hud-btn" onclick="toggleMute()" title="Mute/Unmute">🔊</button>
            <button id="btn-pause" class="hud-btn" onclick="togglePause()" title="Pause">II</button>
            <button id="btn-restart" class="hud-btn" onclick="restartGame()" title="Restart">↻</button>
        </div>
    `;
    updateTowerButtons();
}

function toggleSkillsMenu() {
    sideMenuMode = 'skills';
    selectedTower = null;
    selectedPlacedTower = null;
    renderSideMenu();
}

function updateTowerButtons() {
    const shopDiv = document.getElementById('tower-shop');
    if (!shopDiv) return;
    shopDiv.innerHTML = '';
    
    Object.keys(towerTypes).forEach(type => {
        const btn = document.createElement('button');
        const t = towerTypes[type];
        
        let displayCost = t.cost;
        if (playerSkills.engineering.level > 0) {
            displayCost = Math.floor(t.cost * (1 - (playerSkills.engineering.level * 0.05)));
        }

        btn.className = 'tower-btn';
        btn.innerHTML = `<div style="font-size: 24px;">ðŸ°</div><div style="font-size: 10px; margin-top: 2px;">${t.name}</div><div style="color: #f1c40f; font-size: 12px;">${displayCost}</div>`;
        const imgSrc = towerImages[type] ? towerImages[type].src : '';
        const iconHtml = imgSrc ? `<img src="${imgSrc}" style="width: 32px; height: 32px; object-fit: contain; filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));">` : `<div style="font-size: 24px;">🏰</div>`;
        btn.innerHTML = `${iconHtml}<div style="color: #FFD700; font-size: 11px; font-weight: bold; margin-top: 2px;">${displayCost}</div>`;
        btn.onclick = () => {
            selectedTower = type;
            selectedPlacedTower = null;
            Array.from(shopDiv.children).forEach(b => b.style.borderColor = '#7f8c8d');
            btn.style.borderColor = '#ffd700';
            sideMenuMode = 'upgrades';
            renderSideMenu();
        };
        
        btn.onmousemove = (e) => {
            const html = `
                <h3>${t.name}</h3>
                <p>Damage: ${t.damage}</p>
                <p>Range: ${t.range}</p>
                <p>Reload: ${(t.cooldown/60).toFixed(1)}s</p>
                <p style="color: #FFD700">Cost: ${displayCost}</p>
            `;
            showTooltip(html, e.clientX, e.clientY);
        };
        btn.onmouseleave = () => hideTooltip();

        if (selectedTower === type) btn.style.borderColor = '#ffd700';
        shopDiv.appendChild(btn);
    });
}

window.toggleMute = () => {
    isMuted = !isMuted;
    const btn = document.getElementById('btn-mute');
    if (isMuted) {
        audio.bgm.pause();
        audio.mainMenu.pause();
        if(btn) btn.innerText = "🔇";
    } else {
        if (gameStarted) audio.bgm.play().catch(e => {});
        else audio.mainMenu.play().catch(e => {});
        
        if(btn) btn.innerText = "🔊";
    }
};

window.togglePause = () => {
    isPaused = !isPaused;
    const btn = document.getElementById('btn-pause');
    if(btn) btn.innerText = isPaused ? "▶" : "II";
};

window.restartGame = () => {
    if (confirm("Are you sure you want to restart?")) {
        location.reload();
    }
};

// Initialize UI immediately
initGameUI();

const towerOptionsDiv = document.createElement('div');
towerOptionsDiv.id = 'tower-options';
document.body.appendChild(towerOptionsDiv);

function closeTowerOptions() {
    towerOptionsDiv.style.display = 'none';
    selectedPlacedTower = null;
}

const startScreen = document.createElement('div');
startScreen.id = 'start-screen';
startScreen.innerHTML = `
    <h1>MEDIEVAL DEFENSE</h1>
    <div style="display: flex; gap: 20px;">
        <button onclick="startGame(0.6)" style="font-size: 20px; padding: 15px 30px; border-color: #2ecc71;">EASY</button>
        <button onclick="startGame(0.8)" style="font-size: 20px; padding: 15px 30px; border-color: #f1c40f;">MEDIUM</button>
        <button onclick="startGame(1.2)" style="font-size: 20px; padding: 15px 30px; border-color: #c0392b;">HARD</button>
    </div>
    <div style="margin-top: 20px;">
        <label style="font-size: 18px; cursor: pointer;"><input type="checkbox" id="endless-check"> Endless Mode (Infinite Scaling)</label>
    </div>
`;
document.body.appendChild(startScreen);
startScreen.style.display = 'none';

window.startGame = (difficulty) => {
    wave = 1;
    money = 200;
    lives = 10;
    enemies = [];
    turrets = [];
    projectiles = [];
    particles = [];
    explosions = [];
    floatingTexts = [];
    gameStats = { kills: 0, wavesCleared: 0 };
    isGameOver = false;
    isPaused = false;
    enemiesToSpawn = [];
    document.getElementById('money').innerText = money;
    document.getElementById('lives').innerText = lives;
    document.getElementById('wave').innerText = wave;

    isEndlessMode = document.getElementById('endless-check').checked;

    if (isEndlessMode) {
        maxWaves = Infinity;
    } else {
        if (difficulty === 0.6) maxWaves = 50;
        else if (difficulty === 0.8) maxWaves = 100;
        else if (difficulty === 1.2) maxWaves = 150;
    }

    difficultyMultiplier = difficulty;
    startScreen.style.display = 'none';
    gameStarted = true;
    hero = new Hero(canvas.width / 2, canvas.height / 2);
    
    audio.mainMenu.pause();
    audio.mainMenu.currentTime = 0;
    if (!isMuted) audio.bgm.play().catch(e => {});
    startWaveWithTimer();
    renderSideMenu();
};

const gameOverScreen = document.createElement('div');
gameOverScreen.id = 'game-over-screen';
gameOverScreen.innerHTML = `
    <h1>YOU LOST</h1>
    <button id="restart-btn" style="font-size: 24px; padding: 15px 40px;">TRY AGAIN</button>
`;
document.body.appendChild(gameOverScreen);
gameOverScreen.style.display = 'none';

document.getElementById('restart-btn').onclick = () => {
    location.reload();
};

const victoryScreen = document.createElement('div');
victoryScreen.id = 'victory-screen';
victoryScreen.innerHTML = `
    <h1>VICTORY!</h1>
    <h2 style="color: #ffd700; margin-bottom: 20px;">Kingdom is safe you are a true knight</h2>
    <button id="victory-restart-btn" style="font-size: 24px; padding: 15px 40px; border-color: #2ecc71; color: #2ecc71;">PLAY AGAIN</button>
`;
document.body.appendChild(victoryScreen);
victoryScreen.style.display = 'none';

document.getElementById('victory-restart-btn').onclick = () => {
    location.reload();
};

const waveMsgDiv = document.createElement('div');
waveMsgDiv.id = 'wave-message';
document.body.appendChild(waveMsgDiv);

function startWaveWithTimer() {
    playSound('wavestart');
    let timeLeft = 10;

    isPreparingWave = true;
    waveMsgDiv.style.display = 'flex';
    
    const weathers = ['none', 'rain', 'snow'];
    const weatherIndex = Math.floor((wave - 1) / 10) % 3;
    currentWeather = weathers[weatherIndex];
    initWeather();

    waveMsgDiv.innerHTML = `<h1>Wave ${wave}</h1><h2>Prepare: ${timeLeft}</h2>`;
    
    const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            waveMsgDiv.innerHTML = `<h1>Wave ${wave}</h1><h2>Prepare: ${timeLeft}</h2>`;
        } else {
            isPreparingWave = false;
            clearInterval(timer);
            waveMsgDiv.style.display = 'none';
            spawnWave();
        }
    }, 1000);
}

function initWeather() {
    weatherParticles = [];
    let count = 0;
    if (currentWeather === 'rain') count = 150;
    if (currentWeather === 'snow') count = 80;
    
    for(let i=0; i<count; i++) {
        weatherParticles.push(new WeatherParticle(currentWeather));
    }
}

class WeatherParticle {
    constructor(type) {
        this.type = type;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        
        if (type === 'rain') {
            this.vy = Math.random() * 15 + 10;
            this.vx = Math.random() * 1 - 0.5;
            this.len = Math.random() * 15 + 10;
        } else if (type === 'snow') {
            this.vy = Math.random() * 2 + 1;
            this.vx = Math.random() * 2 - 1;
            this.radius = Math.random() * 3 + 1;
        }
    }

    update() {
        this.y += this.vy;
        this.x += this.vx;
        
        if (this.y > canvas.height) {
            this.y = -20;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        if (this.type === 'rain') {
            ctx.strokeStyle = "rgba(173, 216, 230, 0.5)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.vx, this.y + this.len);
            ctx.stroke();
        } else if (this.type === 'snow') {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function renderSideMenu() {
    const container = document.getElementById('dynamic-side-content');
    const title = document.getElementById('panel-title');
    container.innerHTML = '';

    if (sideMenuMode === 'upgrades') {
        let typeToShow = selectedTower;
        if (selectedPlacedTower) typeToShow = selectedPlacedTower.type;
        
        if (!typeToShow) {
            title.innerText = "SELECT A TOWER";
            container.innerHTML = `<div style="text-align:center; padding:20px; color:#777;">Select a tower from the shop or map to see upgrades.</div>`;
            return;
        }

        title.innerText = towerTypes[typeToShow].name.toUpperCase() + " (GLOBAL)";
        const levels = globalUpgrades[typeToShow];

        const stats = [
            { id: 'damage', name: 'Damage', lvl: levels.damage, icon: '⚔️' },
            { id: 'range', name: 'Range', lvl: levels.range, icon: '🏹' },
            { id: 'speed', name: 'Speed', lvl: levels.speed, icon: '⚡' }
        ];

        stats.forEach(s => {
            const cost = Math.floor(100 * Math.pow(2.5, s.lvl));
            const isMax = s.lvl >= 5;
            
            const div = document.createElement('div');
            div.className = 'menu-btn';
            div.style.cursor = 'default';
            div.innerHTML = `
                <div style="width:100%">
                    <div class="upgrade-stat-row">
                        <span>${s.icon} ${s.name}</span>
                        <span>Lvl ${s.lvl}/5</span>
                    </div>
                    ${!isMax ? `<button onclick="window.buyGlobalUpgrade('${typeToShow}', '${s.id}', ${cost})" style="width:100%; margin-top:5px; background:#2F4F4F; border:1px solid #FFD700; color:#FFD700; cursor:pointer;">Upgrade (${cost})</button>` : '<div style="text-align:center; color:#8B0000; font-weight:bold;">MAX LEVEL</div>'}
                </div>
            `;
            container.appendChild(div);
        });

        if (selectedPlacedTower) {
            const sellValue = Math.floor(selectedPlacedTower.totalSpent * 0.5);
            const sellBtn = document.createElement('button');
            sellBtn.className = 'menu-btn';
            sellBtn.style.background = '#8B0000';
            sellBtn.style.color = 'white';
            sellBtn.style.textAlign = 'center';
            sellBtn.style.justifyContent = 'center';
            sellBtn.innerHTML = `SELL TOWER (+${sellValue})`;
            sellBtn.onclick = () => {
                sellTower(selectedPlacedTower);
                selectedPlacedTower = null;
                renderSideMenu();
            };
            container.appendChild(sellBtn);
        }

    } else if (sideMenuMode === 'skills') {
        title.innerText = "KINGDOM SKILLS";

        Object.keys(playerSkills).forEach(key => {
            const skill = playerSkills[key];
            const isMax = (skill.maxLevel && skill.level >= skill.maxLevel) || (skill.maxUses && skill.uses >= skill.maxUses);
            
            const btn = document.createElement('button');
            btn.className = 'menu-btn';
            
            let statusText = "";
            if (skill.maxLevel) statusText = `Lvl ${skill.level}/${skill.maxLevel}`;
            if (skill.maxUses) statusText = `Uses ${skill.uses}/${skill.maxUses}`;

            btn.innerHTML = `
                <div>
                    <div style="font-weight:bold; color:#2c1b12;">${skill.name}</div>
                    <div style="font-size:10px; color:#5d4037;">${skill.desc}</div>
                    <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:12px;">
                        <span style="color:#8B0000; font-weight:bold;">Cost: ${skill.cost} SP</span>
                        <span style="color:#5d4037;">${statusText}</span>
                    </div>
                </div>
            `;
            
            if (skillPoints < skill.cost || isMax) {
                btn.style.opacity = "0.6";
                btn.style.cursor = "not-allowed";
            } else {
                btn.onclick = () => activateSkill(key);
            }
            
            container.appendChild(btn);
        });
    }
}

window.buyGlobalUpgrade = (type, stat, cost) => {
    if (money >= cost && globalUpgrades[type][stat] < 5) {
        money -= cost;
        document.getElementById('money').innerText = money;
        
        globalUpgrades[type][stat]++;
        playSound('build');
        
        turrets.forEach(t => { if(t.type === type) t.updateGlobalStats(); });
        
        renderSideMenu();
    }
};


window.activateSkill = (key) => {
    const skill = playerSkills[key];
    
    if (skill.maxLevel && skill.level >= skill.maxLevel) return;
    if (skill.maxUses && skill.uses >= skill.maxUses) return;

    if (skillPoints >= skill.cost) {
        skillPoints -= skill.cost;
        document.getElementById('sp-display').innerText = skillPoints;

        if (key === 'royalRepair') {
            lives += 1;
            document.getElementById('lives').innerText = lives;
            skill.uses++;
            floatingTexts.push({x: canvas.width/2, y: canvas.height/2, text: "Royal Restoration!", life: 60, color: "#2ecc71"});
        } else {
            skill.level++;
            floatingTexts.push({x: canvas.width/2, y: canvas.height/2, text: skill.name + " Upgraded!", life: 60, color: "#f1c40f"});
            
            if (key === 'engineering') updateTowerButtons();
        }
        
        renderSideMenu();
    }
};

window.toggleSidePanel = () => {
    const panel = document.getElementById('side-panel');
    panel.classList.toggle('open');
};

const w = GAME_WIDTH;
const h = GAME_HEIGHT;
const path = [
    {x: 0, y: h * 0.5},
    {x: w * 0.2, y: h * 0.5},
    {x: w * 0.2, y: h * 0.2},
    {x: w * 0.8, y: h * 0.2},
    {x: w * 0.8, y: h * 0.8},
    {x: w, y: h * 0.8}
];

const towerSpots = [
    {x: w * 0.06, y: h * 0.41}, {x: w * 0.06, y: h * 0.59},
    {x: w * 0.14, y: h * 0.41}, {x: w * 0.14, y: h * 0.59},
    
    {x: w * 0.13, y: h * 0.32}, {x: w * 0.27, y: h * 0.32},

    {x: w * 0.28, y: h * 0.11}, {x: w * 0.28, y: h * 0.29},
    {x: w * 0.38, y: h * 0.11}, {x: w * 0.38, y: h * 0.29},
    {x: w * 0.48, y: h * 0.11}, {x: w * 0.48, y: h * 0.29},
    {x: w * 0.58, y: h * 0.11}, {x: w * 0.58, y: h * 0.29},
    {x: w * 0.68, y: h * 0.11}, {x: w * 0.68, y: h * 0.29},

    {x: w * 0.73, y: h * 0.28}, {x: w * 0.87, y: h * 0.28},
    {x: w * 0.73, y: h * 0.42}, {x: w * 0.87, y: h * 0.42},
    {x: w * 0.73, y: h * 0.56}, {x: w * 0.87, y: h * 0.56},
    {x: w * 0.73, y: h * 0.70}, {x: w * 0.87, y: h * 0.70},

    {x: w * 0.65, y: h * 0.71}, {x: w * 0.65, y: h * 0.89},
    {x: w * 0.55, y: h * 0.71}, {x: w * 0.55, y: h * 0.89}
];


class Castle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 240;
        this.height = 240;
    }
    draw() {
        if (decorationImages.castle.complete && decorationImages.castle.naturalWidth > 0) {
            ctx.drawImage(decorationImages.castle, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
        this.drawFlags();
        this.drawPrincess();
    }

    drawFlags() {
        const time = Date.now() / 200;
        const positions = [
            { dx: -60, dy: -90 },
            { dx: 0, dy: -110 },
            { dx: 60, dy: -90 }
        ];

        ctx.fillStyle = "#c0392b";
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth = 2;

        positions.forEach(pos => {
            const fx = this.x + pos.dx;
            const fy = this.y + pos.dy;
            
            ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + 25); ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(fx, fy);
            for(let i=0; i<25; i++) {
                ctx.lineTo(fx + i, fy + Math.sin(time + i*0.3) * 4 + (i*0.2));
            }
            ctx.lineTo(fx, fy + 15);
            ctx.fill();
        });
    }

    drawPrincess() {
        const kx = this.x;
        const ky = this.y + 20; 
        const bob = Math.sin(Date.now() / 200) * 2;

        if (decorationImages.princess.complete && decorationImages.princess.naturalWidth > 0) {
            ctx.drawImage(decorationImages.princess, kx - 15, ky - 20 + bob, 30, 40);
        }
    }
}

class House {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 60 + Math.random() * 20;
        this.color = Math.random() > 0.5 ? "#8d6e63" : "#795548";
        this.roofColor = Math.random() > 0.5 ? "#5d4037" : "#3e2723";
    }
    draw() {
        if (decorationImages.house.complete && decorationImages.house.naturalWidth > 0) {
            ctx.drawImage(decorationImages.house, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size * 0.8);
            ctx.fillStyle = "#3e2723";
            ctx.fillRect(this.x - this.size/6, this.y + this.size/2 - this.size*0.4, this.size/3, this.size*0.4);
            ctx.fillStyle = this.roofColor;
            ctx.beginPath();
            ctx.moveTo(this.x - this.size/2 - 5, this.y - this.size/2);
            ctx.lineTo(this.x + this.size/2 + 5, this.y - this.size/2);
            ctx.lineTo(this.x, this.y - this.size);
            ctx.fill();
        }
    }
}

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 60 + Math.random() * 40;
        this.swayOffset = Math.random() * 100;
    }
    draw() {
        const sway = Math.sin(Date.now() / 1000 + this.swayOffset) * 2;
        if (decorationImages.tree.complete && decorationImages.tree.naturalWidth > 0) {
            ctx.drawImage(decorationImages.tree, this.x - this.size/2 + sway, this.y - this.size, this.size, this.size);
        } else {
            ctx.fillStyle = "#2ecc71";
            ctx.beginPath(); ctx.arc(this.x + sway, this.y - 20, 20, 0, Math.PI * 2); ctx.fill();
        }
    }
}

class Grass {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    draw() {
        ctx.strokeStyle = "#4caf50";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - 3, this.y - 5);
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 3, this.y - 5);
        ctx.stroke();
    }
}

class Villager {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = x;
        this.targetY = y;
        this.speed = 0.5;
        this.state = 'idle';
        this.timer = 0;
        this.color = ["#f1c40f", "#e67e22", "#3498db", "#9b59b6"][Math.floor(Math.random() * 4)];
        this.gender = Math.random() > 0.5 ? 'man' : 'woman';
    }

    update() {
        if (this.state === 'idle') {
            this.timer++;
            if (this.timer > 100 + Math.random() * 200) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 100;
                this.targetX = this.startX + Math.cos(angle) * dist;
                this.targetY = this.startY + Math.sin(angle) * dist;
                this.state = 'walk';
                this.timer = 0;
            }
        } else if (this.state === 'walk') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 1) {
                this.state = 'idle';
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
    }

    draw() {
        const bob = this.state === 'walk' ? Math.sin(Date.now() / 100) * 2 : 0;
        const img = this.gender === 'man' ? decorationImages.man : decorationImages.woman;
        
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - 15, this.y - 35 + bob, 30, 40);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y - 10 + bob, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(this.x - 4, this.y - 4 + bob, 8, 10);
        }
    }
}

function isSafeDecorationSpot(x, y, radius) {
    if (isPointOnPath(x, y, radius + 60)) return false;

    for (let spot of towerSpots) {
        if (Math.hypot(spot.x - x, spot.y - y) < 60 + radius) return false;
    }

    if (x < 20 || x > canvas.width - 20 || y < 20 || y > canvas.height - 20) return false;

    if (x > canvas.width - 300 && y > canvas.height * 0.5) return false;

    return true;
}

function initDecorations() {
    decorations = [];
    villagers = [];

    decorations.push(new Castle(GAME_WIDTH - 120, GAME_HEIGHT * 0.8 - 80));

    for(let i=0; i<250; i++) {
        let x = Math.random() * GAME_WIDTH;
        let y = Math.random() * GAME_HEIGHT;
        if (isSafeDecorationSpot(x, y, 5)) decorations.push(new Grass(x, y));
    }

    for(let i=0; i<80; i++) {
        let x = Math.random() * GAME_WIDTH;
        let y = Math.random() * GAME_HEIGHT;
        if (isSafeDecorationSpot(x, y, 20)) decorations.push(new Tree(x, y));
    }

    for(let i=0; i<20; i++) {
        let x = Math.random() * GAME_WIDTH;
        let y = Math.random() * GAME_HEIGHT;
        if (isSafeDecorationSpot(x, y, 40)) {
            decorations.push(new House(x, y));
            let vCount = 1 + Math.floor(Math.random() * 3);
            for(let j=0; j<vCount; j++) {
                villagers.push(new Villager(x + Math.random()*30 - 15, y + 20 + Math.random()*20));
            }
        }
    }
}

class Hero {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 3;
        this.range = 80;
        this.damage = 20;
        this.cooldown = 0;
        this.maxCooldown = 144;
        this.color = "#3498db";

        this.level = 1;
        this.xp = 0;
        this.maxXp = 50;
        this.walkOffset = 0;
    }

    update() {
        let moving = false;
        if (keys['ArrowUp'] || keys['KeyW']) { this.y -= this.speed; moving = true; }
        if (keys['ArrowDown'] || keys['KeyS']) { this.y += this.speed; moving = true; }
        if (keys['ArrowLeft'] || keys['KeyA']) { this.x -= this.speed; moving = true; }
        if (keys['ArrowRight'] || keys['KeyD']) { this.x += this.speed; moving = true; }

        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > GAME_WIDTH) this.x = GAME_WIDTH;
        if (this.y > GAME_HEIGHT) this.y = GAME_HEIGHT;

        if (moving) {
            this.walkOffset += 0.2;
        } else {
            this.walkOffset = 0;
        }

        if (this.cooldown > 0) this.cooldown--;
    }

    draw() {
        const bob = Math.sin(this.walkOffset) * 5;

        if (heroImage && heroImage.complete && heroImage.naturalWidth > 0) {
            const size = 60;
            ctx.drawImage(heroImage, this.x - size/2, this.y - size/2 + bob, size, size);
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Lvl ${this.level}`, this.x, this.y - 40);

        ctx.fillStyle = "#333";
        ctx.fillRect(this.x - 20, this.y - 35, 40, 5);
        ctx.fillStyle = "#3498db";
        ctx.fillRect(this.x - 20, this.y - 35, 40 * (this.xp / this.maxXp), 5);
        
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.stroke();
    }

    fire() {
        if (this.cooldown > 0) return;

        let target = enemies.find(e => Math.hypot(e.x - this.x, e.y - this.y) < this.range);

        if (target) {
            target.health -= this.damage;
            this.cooldown = this.maxCooldown;
            playSound('heroSlash');
            particles.push(new Particle(target.x, target.y, "#3498db", 2, 15));
        }
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.maxXp) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp = 0;
        this.maxXp = Math.floor(this.maxXp * 1.5);
        this.damage += 5;
        floatingTexts.push({ x: this.x, y: this.y - 60, text: "LEVEL UP!", life: 60, color: "#00f2ff" });
        playSound('levelup');
    }
}

class Enemy {
    constructor(type) {
        this.x = path[0].x;
        this.y = path[0].y;
        this.pathIndex = 0;
        this.type = type;
        this.slowTimer = 0;

        let endlessMultiplier = isEndlessMode ? Math.pow(1.1, wave) : 1;
        
        if (type === 'dragonboss') {
            this.health = (wave * 300 + 1500) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 0.15;
            this.radius = 60;
            this.color = "#8e44ad";
        } else if (type === 'boss') {
            this.health = (wave * 150 + 800) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 0.2;
            this.radius = 50;
            this.color = "#c0392b";
        } else if (type === 'troll') {
            this.health = (120 + wave * 25) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 0.3;
            this.radius = 40;
            this.color = "#27ae60";
        } else if (type === 'skeleton') {
            this.health = (20 + wave * 5) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 0.9;
            this.radius = 15;
            this.color = "#bdc3c7";
        } else if (type === 'bat') {
            this.health = (25 + wave * 6) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 1.3;
            this.radius = 15;
            this.color = "#8e44ad";
        } else if (type === 'assassin') {
            this.health = (50 + wave * 12) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 1.6;
            this.radius = 20;
            this.color = "#2c3e50";
        } else if (type === 'alchemist') {
            this.health = (60 + wave * 15) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 0.7;
            this.radius = 25;
            this.color = "#16a085";
        } else if (type === 'harpy') {
            this.health = (45 + wave * 10) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 1.4;
            this.radius = 20;
            this.color = "#9b59b6";
        } else if (type === 'fast') {
            this.health = (30 + wave * 8) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 1.0;
            this.radius = 20;
            this.color = "#f1c40f";
        } else if (type === 'armored') {
            this.health = (100 + wave * 20) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 0.3;
            this.radius = 30;
            this.color = "#34495e";
        } else {
            this.health = (60 + wave * 12) * difficultyMultiplier * endlessMultiplier;
            this.baseSpeed = 0.5;
            this.radius = 25;
            this.color = "#2ecc71";
        }
        this.speed = this.baseSpeed;
        this.maxHealth = this.health;
    }

    update() {
        let target = path[this.pathIndex + 1];
        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (this.slowTimer > 0) {
            this.speed = this.baseSpeed * 0.5;
            this.slowTimer--;
        } else {
            this.speed = this.baseSpeed;
        }

        if (dist < 2) {
            this.pathIndex++;
            if (this.pathIndex >= path.length - 1) {
                this.health = 0;
                lives--;
                document.getElementById('lives').innerText = lives;
                if (lives <= 0) {
                    isGameOver = true;
                }
            }
        } else {
            this.x += (dx/dist) * this.speed;
            this.y += (dy/dist) * this.speed;
        }
    }

    draw() {
        const bob = Math.sin(Date.now() / 200) * 3;

        let img = enemyImages.goblin;
        if (this.type === 'armored') img = enemyImages.knight;
        if (this.type === 'boss') img = enemyImages.boss;
        if (this.type === 'skeleton') img = enemyImages.skeleton;
        if (this.type === 'troll') img = enemyImages.troll;
        if (this.type === 'bat') img = enemyImages.bat;
        if (this.type === 'alchemist') img = enemyImages.alchemist;
        if (this.type === 'assassin') img = enemyImages.assassin;
        if (this.type === 'harpy') img = enemyImages.harpy;
        if (this.type === 'dragonboss') img = enemyImages.dragonBoss;

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const wobble = Math.sin(Date.now() / 150) * 0.15; 
            ctx.rotate(wobble);

            ctx.drawImage(img, -this.radius, -this.radius + bob, this.radius * 2, this.radius * 2);
            ctx.restore();
        } else {
            ctx.fillStyle = this.color;
            ctx.strokeStyle = "#1a1a1a";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        if (this.slowTimer > 0) {
            ctx.strokeStyle = "#3498db";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        const barWidth = this.radius * 2;
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, barWidth, 5);
        ctx.fillStyle = "#2ecc71";
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, barWidth * (this.health / this.maxHealth), 5);
        
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - this.radius, this.y - this.radius - 10, barWidth, 5);
    }
}

class Particle {
    constructor(x, y, color, speed, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = life;
        this.maxLife = life;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw() {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Explosion {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 1;
        this.maxRadius = 40;
        this.alpha = 1;
        this.active = true;
    }
    update() {
        this.radius += 2;
        this.alpha -= 0.05;
        if (this.alpha <= 0) this.active = false;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Projectile {
    constructor(x, y, target, type, damage, color) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.type = type;
        this.damage = damage;
        this.color = color;
        this.speed = 10;
        this.active = true;
        this.homing = (type === 'magic');
        
        if (!this.homing) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            this.vx = (dx/dist) * this.speed;
            this.vy = (dy/dist) * this.speed;
        }

        if (type === 'cannon') this.speed = 6;
        if (type === 'ice') this.speed = 8;
        if (type === 'magic') this.speed = 10;
    }

    update() {
        if (this.homing) {
            if (!this.target || this.target.health <= 0) {
                this.active = false;
                return;
            }
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < this.speed) {
                this.x = this.target.x;
                this.y = this.target.y;
                this.hit();
                this.active = false;
            } else {
                this.x += (dx/dist) * this.speed;
                this.y += (dy/dist) * this.speed;
            }
        } else {
            this.x += this.vx;
            this.y += this.vy;

            if (this.target && this.target.health > 0 && Math.hypot(this.target.x - this.x, this.target.y - this.y) < this.target.radius + 10) {
                this.hit();
                this.active = false;
            }
            if (this.x < 0 || this.x > GAME_WIDTH || this.y < 0 || this.y > GAME_HEIGHT) this.active = false;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        let r = 3;
        if (this.type === 'cannon') r = 5;
        if (this.type === 'magic') r = 4;
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    hit() {
        let damage = this.damage;
        let target = this.target;
        playSound('hit');

        const critChance = 0.15;
        const isCrit = Math.random() < critChance;
        if (isCrit) {
            damage *= 2;
            floatingTexts.push({ x: target.x, y: target.y - 20, text: "CRIT!", life: 40, color: "#e74c3c" });
        }

        explosions.push(new Explosion(this.x, this.y, this.color));

        for (let i = 0; i < 5; i++) {
            let color = "#fff";
            let speed = Math.random() * 2 + 1;
            if (this.type === 'archer') color = "#e67e22";
            if (this.type === 'cannon') { color = "#7f8c8d"; speed = Math.random() * 3 + 2; }
            if (this.type === 'crossbow') color = "#f1c40f";
            if (this.type === 'ice') color = "#3498db";
            if (this.type === 'magic') color = "#9b59b6";
            particles.push(new Particle(target.x, target.y, color, speed, 20));
        }

        if (this.type === 'cannon') {
            const aoeRadius = 60;
            enemies.forEach(enemy => {
                if (Math.hypot(enemy.x - target.x, enemy.y - target.y) < aoeRadius) {
                    enemy.health -= damage;
                }
            });
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(target.x, target.y, "#c0392b", Math.random() * 4, 30));
            }
        } else if (this.type === 'ice') {
            target.health -= damage;
            target.slowTimer = 120;
        } else {
            target.health -= damage;
        }
    }
}

function getTowerStats(type) {
    const base = towerTypes[type];
    const levels = globalUpgrades[type];
    
    let damage = base.damage * Math.pow(1.25, levels.damage);
    let range = base.range + (levels.range * 20);
    let cooldown = base.cooldown * Math.pow(0.85, levels.speed);
    
    return { damage, range, cooldown };
}

class Turret {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.stats = { ...towerTypes[type] };
        this.range = this.stats.range;
        this.cooldown = 0;
        this.recoil = 0;
        let baseCost = towerTypes[type].cost;
        if (playerSkills.engineering.level > 0) {
            baseCost = Math.floor(baseCost * Math.pow(0.9, playerSkills.engineering.level));
        }
        this.totalSpent = baseCost;
        this.updateGlobalStats();
    }

    updateGlobalStats() {
        const s = getTowerStats(this.type);
        this.stats.damage = s.damage;
        this.range = s.range;
        this.stats.cooldown = s.cooldown;
    }

    draw() {
        const img = towerImages[this.type];
        
        let drawSize = 120;
        if (this.type === 'crossbow') drawSize = 90;
        if (this.recoil > 0) {
            drawSize = 110;
            this.recoil--;
        }

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - drawSize/2, this.y - drawSize/2, drawSize, drawSize);
        } else {
            ctx.fillStyle = this.stats.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "#ffd700";
        const levels = globalUpgrades[this.type];
        const totalLevels = levels.damage + levels.range + levels.speed;
        for(let i=0; i<totalLevels; i++) {
            ctx.beginPath();
            if (i < 5) ctx.arc(this.x - 10 + i*5, this.y - 30, 2, 0, Math.PI*2);
            else if (i < 10) ctx.arc(this.x - 10 + (i-5)*5, this.y - 35, 2, 0, Math.PI*2);
            ctx.fill();
        }
        
        if (this === selectedPlacedTower) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = "rgba(255, 215, 0, 0.1)";
            ctx.fill();
        }
    }

    fire() {
        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        let target = null;
        let minDist = this.range;

        for (let enemy of enemies) {
            let dx = enemy.x - this.x;
            let dy = enemy.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        }

        if (target) {
            let damage = this.stats.damage;

            projectiles.push(new Projectile(this.x, this.y, target, this.type, damage, this.stats.color));
            
            if (this.type === 'archer' || this.type === 'crossbow') playSound('arrow');
            else if (this.type === 'cannon') playSound('cannon');
            else if (this.type === 'ice') playSound('ice');
            else if (this.type === 'magic') playSound('magic');

            this.cooldown = Math.max(5, this.stats.cooldown);
            this.recoil = 5;
        }
    }
}

function sellTower(tower) {
    const index = turrets.indexOf(tower);
    if (index > -1) {
        turrets.splice(index, 1);
        const refund = Math.floor(tower.stats.cost * 0.5);
        money += refund;
        document.getElementById('money').innerText = money;
        floatingTexts.push({ x: tower.x, y: tower.y, text: "+" + refund, life: 40, color: "#ffd700" });
        playSound('sell');
    }
}

function isPointOnPath(x, y, buffer = 0) {
    const checkDist = 25 + buffer;
    for (let i = 0; i < path.length - 1; i++) {
        let p1 = path[i];
        let p2 = path[i+1];
        
        let A = x - p1.x;
        let B = y - p1.y;
        let C = p2.x - p1.x;
        let D = p2.y - p1.y;

        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = -1;
        if (len_sq != 0) param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = p1.x; yy = p1.y;
        } else if (param > 1) {
            xx = p2.x; yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }

        let dx = x - xx;
        let dy = y - yy;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < checkDist) return true;
    }
    return false;
}

function canPlaceTower(x, y) {
    const minDistance = 100; 
    for (let tower of turrets) {
        let dist = Math.hypot(tower.x - x, tower.y - y);
        if (dist < minDistance) return false;
    }

    for (let dec of decorations) {
        let dist = Math.hypot(dec.x - x, dec.y - y);
        let buffer = (dec instanceof Castle) ? 160 : (dec instanceof House) ? 110 : 70;
        if (dist < buffer) return false;
    }
    
    return true;
}

function isValidPlacement(x, y) {
    if (x < 40 || x > GAME_WIDTH - 40 || y < 40 || y > GAME_HEIGHT - 40) return false;

    if (isPointOnPath(x, y, 35)) return false;

    if (!canPlaceTower(x, y)) return false;
    
    return true;
}

canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / scaleRatio.x;
    mouseY = (e.clientY - rect.top) / scaleRatio.y;

    let hoveredTower = null;
    for (let t of turrets) {
        if (Math.hypot(t.x - mouseX, t.y - mouseY) < 30) {
            hoveredTower = t;
            break;
        }
    }
    
    if (hoveredTower) {
        const t = hoveredTower;
        const html = `
            <h3>${t.stats.name}</h3>
            <p>Damage: ${t.stats.damage.toFixed(0)}</p>
            <p>Range: ${t.range.toFixed(0)}</p>
            <p>Reload: ${(t.stats.cooldown/60).toFixed(1)}s</p>
        `;
        showTooltip(html, e.clientX, e.clientY);
    } else {
        hideTooltip();
    }
};

canvas.ontouchstart = (e) => {
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
};

canvas.onclick = (e) => {
    if (isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scaleRatio.x;
    const clickY = (e.clientY - rect.top) / scaleRatio.y;

    let clickedTower = null;
    for (let t of turrets) {
        if (Math.hypot(t.x - clickX, t.y - clickY) < 30) {
            clickedTower = t;
            break;
        }
    }

    if (clickedTower) {
        selectedPlacedTower = clickedTower;
        selectedTower = null;
        sideMenuMode = 'upgrades';
        renderSideMenu();
        return;
    }

    if (selectedTower) {
        let placeX = clickX;
        let placeY = clickY;

        let closestSpot = null;
        let minDistance = Infinity;

        towerSpots.forEach(spot => {
            const dist = Math.hypot(spot.x - clickX, spot.y - clickY);
            if (dist < minDistance) {
                minDistance = dist;
                closestSpot = spot;
            }
        });

        if (closestSpot && minDistance < 60) {
            placeX = closestSpot.x;
            placeY = closestSpot.y;
        }

        if (isValidPlacement(placeX, placeY)) {
                let cost = towerTypes[selectedTower].cost;
                
                if (playerSkills.engineering.level > 0) {
                    cost = Math.floor(cost * Math.pow(0.9, playerSkills.engineering.level));
                }

                if (money >= cost) {
                    turrets.push(new Turret(placeX, placeY, selectedTower));
                    money -= cost;
                    document.getElementById('money').innerText = money;
                    
                    playSound('build');
                    selectedTower = null;
                    updateTowerButtons();
                }
        }
    } else {
        if (selectedPlacedTower) {
            selectedPlacedTower = null;
            renderSideMenu();
        }
    }
};

function showTowerOptions(x, y) {
    if (!selectedPlacedTower) return;
    const refund = Math.floor(selectedPlacedTower.stats.cost * 0.5);
    towerOptionsDiv.innerHTML = `
        <div style="font-weight:bold; margin-bottom:5px;">${selectedPlacedTower.stats.name}</div>
        <button onclick="sellCurrentTower()" style="background:#c0392b; border-color:#e74c3c; color:white;">Sell (+${refund})</button>
    `;
    towerOptionsDiv.style.left = x + 'px';
    towerOptionsDiv.style.top = y + 'px';
    towerOptionsDiv.style.display = 'flex';
}

function spawnWave() {
    enemiesToSpawn = [];
    if (wave % 10 === 0) {
        bossWarningTimer = 180;
        bossWarningText = "DRAGON ATTACK";
        enemiesToSpawn.push('dragonboss');
        for(let i=0; i<wave; i++) enemiesToSpawn.push('armored');
    } else if (wave % 5 === 0) {
        bossWarningTimer = 180;
        bossWarningText = "BOSS FIGHT";
        enemiesToSpawn.push('boss');
        for(let i=0; i<wave; i++) enemiesToSpawn.push('skeleton');
    } else {
        let count = 5 + Math.floor(wave * 1.5);
        for (let i = 0; i < count; i++) {
            const rand = Math.random();
                if (wave >= 4 && rand < 0.15) enemiesToSpawn.push('assassin');
                else if (wave >= 3 && rand < 0.30) enemiesToSpawn.push('troll');
                else if (wave >= 2 && rand < 0.45) enemiesToSpawn.push('harpy');
                else if (wave >= 3 && rand < 0.55) enemiesToSpawn.push('alchemist');
            else if (wave > 4 && rand < 0.70) enemiesToSpawn.push('armored');
            else if (wave > 3 && rand < 0.80) enemiesToSpawn.push('bat');
            else if (wave > 2 && rand < 0.85) enemiesToSpawn.push('fast');
            else if (rand < 0.95) enemiesToSpawn.push('skeleton');
            else enemiesToSpawn.push('normal');
        }
    }
}

function animate() {
    if (!gameStarted) return requestAnimationFrame(animate);

    if (isGameOver) {
        if (document.getElementById('game-over-screen').style.display !== 'flex') {
            audio.bgm.pause();
            playSound('gameover');
            document.getElementById('game-over-screen').style.display = 'flex';
        }
        return;
    }

    const bgGradient = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_HEIGHT/3, GAME_WIDTH/2, GAME_HEIGHT/2, GAME_HEIGHT);
    bgGradient.addColorStop(0, "#3a5228");
    bgGradient.addColorStop(1, "#1a2612");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.strokeStyle = "#3e2723";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 48;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    
    ctx.strokeStyle = "#795548";
    ctx.lineWidth = 40;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();

    decorations.forEach(d => d.draw());
    
    villagers.forEach(v => {
        if (!isPaused) v.update();
        v.draw();
    });

    if (hero) {
        if (!isPaused) hero.update();
        hero.draw();
        if (!isPaused) hero.fire();
    }

    turrets.forEach(t => {
        t.draw();
        if (!isPaused) t.fire();
    });

    enemies.forEach((enemy, index) => {
        if (!isPaused) enemy.update();
        enemy.draw();
        if (enemy.health <= 0) {
            enemies.splice(index, 1);
            
            let goldGain = 10 + (wave * 0.5);
            if (playerSkills.taxMastery.level > 0) goldGain *= (1 + playerSkills.taxMastery.level * 0.15);
            
            goldGain = Math.floor(goldGain);
            money += goldGain;
            document.getElementById('money').innerText = money;
            if (money >= 50) document.getElementById('money').style.color = "#ffd700";
            
            floatingTexts.push({ x: enemy.x, y: enemy.y, text: "+" + goldGain, life: 30, color: "#ffd700" });

            if (hero) hero.gainXp(10);

            gameStats.kills++;
            checkAchievements();
        }
    });

    if (!isPaused && enemiesToSpawn.length > 0) {
        spawnFrameCount++;
        if (spawnFrameCount % 60 === 0) {
            let type = enemiesToSpawn.shift();
            enemies.push(new Enemy(type));
        }
    } else if (!isPaused && enemiesToSpawn.length === 0 && enemies.length === 0) {
        spawnFrameCount = 0;
        if (spawnFrameCount === 0) {
        }
    }

    if (gameStarted && !isGameOver && !isPaused && !isPreparingWave && enemies.length === 0 && enemiesToSpawn.length === 0) {
        if (!isEndlessMode && wave >= maxWaves) {
            audio.bgm.pause();
            playSound('victory');
            document.getElementById('victory-screen').style.display = 'flex';
            return;
        }

        wave++;
        document.getElementById('wave').innerText = wave;
        gameStats.wavesCleared++;
        
        if (wave % 5 === 0) {
            skillPoints += 2;
            document.getElementById('sp-display').innerText = skillPoints;
            floatingTexts.push({ x: canvas.width/2, y: canvas.height/2, text: "+2 Skill Points!", life: 60, color: "#2ecc71" });
        }

        if (wave % 10 === 0) {
            lives++;
            document.getElementById('lives').innerText = lives;
        }
        checkAchievements();
        startWaveWithTimer();
    }

    floatingTexts.forEach((ft, index) => {
        ctx.fillStyle = ft.color;
        ctx.font = "bold 20px Arial";
        ctx.fillText(ft.text, ft.x, ft.y);
        ft.y -= 1;
        ft.life--;
        if (ft.life <= 0) floatingTexts.splice(index, 1);
    });

    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(index, 1);
    });

    projectiles.forEach((p, index) => {
        p.update();
        p.draw();
        if (!p.active) projectiles.splice(index, 1);
    });

    explosions.forEach((e, index) => {
        e.update();
        e.draw();
        if (!e.active) explosions.splice(index, 1);
    });

    weatherParticles.forEach(p => {
        p.update();
        p.draw();
    });

    if (selectedTower) {
        let renderX = mouseX;
        let renderY = mouseY;
        let isSnapped = false;

        let closestSpot = null;
        let minDistance = Infinity;

        towerSpots.forEach(spot => {
            const dist = Math.hypot(spot.x - mouseX, spot.y - mouseY);
            if (dist < minDistance) {
                minDistance = dist;
                closestSpot = spot;
            }
        });

        if (closestSpot && minDistance < 60) {
            renderX = closestSpot.x;
            renderY = closestSpot.y;
            isSnapped = true;
        }

        const isValid = isValidPlacement(renderX, renderY);
        const range = towerTypes[selectedTower].range;
        
        ctx.beginPath();
        ctx.arc(renderX, renderY, range, 0, Math.PI * 2);
        ctx.fillStyle = isValid ? "rgba(46, 204, 113, 0.2)" : "rgba(139, 0, 0, 0.3)";
        ctx.fill();
        ctx.strokeStyle = isValid ? "rgba(46, 204, 113, 0.5)" : "rgba(231, 76, 60, 0.5)";
        ctx.lineWidth = 2; ctx.stroke();

        const img = towerImages[selectedTower];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.globalAlpha = 0.7;
            ctx.drawImage(img, renderX - 40, renderY - 40, 80, 80);
            ctx.globalAlpha = 1.0;
        }
        
        towerSpots.forEach(spot => {
            const isOccupied = turrets.some(t => Math.hypot(t.x - spot.x, t.y - spot.y) < 10);
            
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, 8, 0, Math.PI * 2);
            if (isOccupied) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
            } else if (spot === closestSpot && isSnapped) {
                ctx.fillStyle = isValid ? "rgba(46, 204, 113, 0.8)" : "rgba(139, 0, 0, 0.8)";
            } else {
                ctx.fillStyle = "rgba(52, 152, 219, 0.4)";
            }
            ctx.fill();
        });
    }

    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "#fff";
        ctx.font = "40px Georgia";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }

    const activeBoss = enemies.find(e => e.type === 'boss' || e.type === 'dragonboss');
    if (activeBoss) {
        const barWidth = 400;
        const barHeight = 25;
        const x = (GAME_WIDTH - barWidth) / 2;
        const y = 20;
        
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = activeBoss.type === 'dragonboss' ? "#8e44ad" : "#c0392b";
        ctx.fillRect(x, y, barWidth * (activeBoss.health / activeBoss.maxHealth), barHeight);
        
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(activeBoss.type === 'dragonboss' ? "DRAGON BOSS" : "BOSS", GAME_WIDTH / 2, y + 18);
    }

    if (bossWarningTimer > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, bossWarningTimer / 60);
        ctx.fillStyle = "#c0392b";
        ctx.font = "bold 80px Arial";
        ctx.textAlign = "center";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 20;
        ctx.fillText(bossWarningText, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.restore();
        bossWarningTimer--;
    }

    requestAnimationFrame(animate);
}


const mainMenu = document.createElement('div');
mainMenu.id = 'main-menu';
mainMenu.innerHTML = `
    <canvas id="menu-bg-canvas"></canvas>
    <h1 class="main-title">MEDIEVAL DEFENSE</h1>
    <div class="menu-buttons">
        <button onclick="showDifficultySelect()">START GAME</button>
        <button onclick="toggleStory()">STORY OF THE GAME</button>
        <button onclick="toggleAchievements()">ACHIEVEMENTS</button>
        <button onclick="toggleCredits()">CREDITS</button>
    </div>
`;
document.body.appendChild(mainMenu);

const storyModal = document.createElement('div');
storyModal.id = 'story-modal';
storyModal.className = 'menu-modal';
storyModal.innerHTML = `
    <h2>Medieval Defense: A Knight's Vow</h2>
    <div style="text-align: left; max-height: 60vh; overflow-y: auto; padding-right: 10px;">
        <p>A dark army is attacking the kingdom. The land is in danger. In the middle of this war, a brave Knight and a Princess are secretly in love.</p>
        <p>The Knight makes a promise: he will defend his home and prove his love through battle. He takes his sword and goes on a dangerous journey. He fights many enemies to keep the Princess safe and show his loyalty.</p>
        <p>This is a classic game of chivalry and courage. Honor, love, and action come together in this medieval adventure. The fate of the kingdom and the Princess is in your hands.</p>
        <p style="text-align: center; font-weight: bold; margin-top: 20px; color: #c0392b;">Will you fight and win?</p>
    </div>
    <button onclick="toggleStory()" style="margin-top: 20px;">CLOSE</button>
`;
document.body.appendChild(storyModal);

const creditsModal = document.createElement('div');
creditsModal.id = 'credits-modal';
creditsModal.className = 'menu-modal';
creditsModal.innerHTML = `
    <h2>Game Credits</h2>
    <div style="text-align: center; width: 100%;">
        <p style="font-size: 20px; margin-bottom: 20px;">Thank you for playing the game</p>
        <p style="font-size: 24px; color: #8B0000; font-weight: bold;">You are a true knight</p>
        <p style="font-size: 12px; margin-top: 40px;">© 2026 All Rights Reserved.</p>
    </div>
    <button onclick="toggleCredits()" style="margin-top: 20px;">CLOSE</button>
`;
document.body.appendChild(creditsModal);

const achievementsModal = document.createElement('div');
achievementsModal.id = 'achievements-modal';
achievementsModal.className = 'menu-modal';
achievementsModal.innerHTML = `
    <h2>ACHIEVEMENTS</h2>
    <div id="achievements-list" style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-height: 300px; overflow-y: auto;"></div>
    <button onclick="toggleAchievements()" style="margin-top: 20px;">CLOSE</button>
`;
document.body.appendChild(achievementsModal);

window.toggleAchievements = () => {
    if (achievementsModal.style.display === 'flex') {
        achievementsModal.style.display = 'none';
    } else {
        const list = document.getElementById('achievements-list');
        list.innerHTML = '';
        achievements.forEach(ach => {
            const item = document.createElement('div');
            item.style.background = 'rgba(0,0,0,0.3)';
            item.style.padding = '10px';
            item.style.borderRadius = '5px';
            item.style.border = ach.unlocked ? '1px solid #2ecc71' : '1px solid #555';
            item.style.color = ach.unlocked ? '#fff' : '#777';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            
            item.innerHTML = `
                <div>
                    <div style="font-weight: bold; color: ${ach.unlocked ? '#ffd700' : '#aaa'}">${ach.title}</div>
                    <div style="font-size: 12px;">${ach.desc}</div>
                </div>
                <div style="font-size: 10px; font-weight: bold; color: ${ach.unlocked ? '#2ecc71' : '#555'}">${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</div>
            `;
            list.appendChild(item);
        });
        achievementsModal.style.display = 'flex';
    }
};

window.showDifficultySelect = () => {
    mainMenu.style.display = 'none';
    startScreen.style.display = 'flex';
};

window.toggleStory = () => {
    storyModal.style.display = storyModal.style.display === 'flex' ? 'none' : 'flex';
};

window.toggleCredits = () => {
    creditsModal.style.display = creditsModal.style.display === 'flex' ? 'none' : 'flex';
};

const allAssets = [
    ...Object.values(towerImages),
    ...Object.values(enemyImages),
    ...Object.values(decorationImages),
    heroImage
];
let loadedCount = 0;

const resourceTimeout = setTimeout(() => {
    console.log("Resources taking too long, forcing start...");
    const btn = document.getElementById('enter-btn');
    if(btn) {
        btn.style.display = 'block';
        btn.onclick = startMainGame;
    }
}, 2000);

function updateLoading() {
    loadedCount++;
    const percent = Math.floor((loadedCount / allAssets.length) * 100);
    if(document.getElementById('loading-bar')) document.getElementById('loading-bar').style.width = percent + '%';

    if (loadedCount >= allAssets.length) {
        clearTimeout(resourceTimeout);
        const btn = document.getElementById('enter-btn');
        if(btn) {
            btn.style.display = 'block';
            btn.onclick = startMainGame;
        }
    }
}

function initMenuParticles() {
    const canvas = document.getElementById('menu-bg-canvas');
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    const particles = [];
    const particleCount = 60;
    
    class MenuParticle {
        constructor() {
            this.x = Math.random() * GAME_WIDTH;
            this.y = Math.random() * GAME_HEIGHT;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.6 - 0.3;
            this.speedY = Math.random() * -0.5 - 0.2;
            this.alpha = Math.random() * 0.6 + 0.2;
            this.wobble = Math.random() * Math.PI * 2;
        }
        update() {
            this.wobble += 0.05;
            this.x += this.speedX + Math.sin(this.wobble) * 0.2;
            this.y += this.speedY;
            if (this.x < 0) this.x = GAME_WIDTH;
            if (this.x > GAME_WIDTH) this.x = 0;
            if (this.y < 0) this.y = GAME_HEIGHT;
            if (this.y > GAME_HEIGHT) this.y = 0;
        }
        draw() {
            ctx.fillStyle = `rgba(255, 200, 50, ${this.alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) particles.push(new MenuParticle());
    
    function animateMenu() {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        particles.forEach(p => { p.update(); p.draw(); });
        if (mainMenu.style.display !== 'none') requestAnimationFrame(animateMenu);
    }
    animateMenu();
}

function startMainGame() {
    const loadingScreen = document.getElementById('loading-screen');
    if(loadingScreen) loadingScreen.style.display = 'none';
    
    mainMenu.style.display = 'flex';
    initDecorations();
    initMenuParticles();
    animate();
    if (!isMuted) audio.mainMenu.play().catch(e => {});
}

allAssets.forEach(img => {
    if (img.complete) {
        updateLoading();
    } else {
        img.onload = updateLoading;
        img.onerror = updateLoading;
    }
});