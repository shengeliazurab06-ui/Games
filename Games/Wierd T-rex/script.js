const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreValue');
const highScoreDisplay = document.getElementById('highScoreValue');
const gameOverScreen = document.querySelector('.game-over-screen');
const restartText = document.getElementById('restartText');
const leaderboardList = document.getElementById('leaderboardList');
const shopModal = document.getElementById('shopModal');
const shopGrid = document.getElementById('shopGrid');
const shopBalance = document.getElementById('shopBalance');
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
const soundBtn = document.getElementById('soundBtn');
const achieveModal = document.getElementById('achieveModal');
const achieveGrid = document.getElementById('achieveGrid');
const menuAchieveBtn = document.getElementById('menuAchieveBtn');

const GRAVITY = 0.6;
const JUMP_FORCE = -11;
const DOUBLE_JUMP_FORCE = -10;
const INITIAL_GAME_SPEED = 4.5;
const MAX_GAME_SPEED = 18;
const GAME_SPEED_INCREMENT = 0.0003;
const DAY_NIGHT_CYCLE_DURATION = 2000; 

const SKINS = [
    { id: 'default', name: 'Classic', cost: 0, color: '#4CAF50' },
    { id: 'red', name: 'Red Rex', cost: 100, color: '#FF5252' },
    { id: 'blue', name: 'Blue Jay', cost: 250, color: '#2196F3' },
    { id: 'plasma', name: 'Plasma', cost: 500, color: '#9C27B0' },
    { id: 'gold', name: 'Midas', cost: 1000, color: '#FFD700' },
    { id: 'neon', name: 'Matrix', cost: 2000, color: '#00FF00' }
];

const ACHIEVEMENTS = [
    { id: 'novice_runner', title: 'Novice Runner', desc: 'Reach 500 score in one run', target: 500, type: 'score', reward: 100 },
    { id: 'pro_runner', title: 'Pro Runner', desc: 'Reach 2000 score in one run', target: 2000, type: 'score', reward: 500 },
    { id: 'marathon', title: 'Marathon', desc: 'Reach 5000 score in one run', target: 5000, type: 'score', reward: 1000 },
    { id: 'coin_collector', title: 'Coin Collector', desc: 'Collect 50 coins total', target: 50, type: 'total_coins', reward: 200 },
    { id: 'treasure_hunter', title: 'Treasure Hunter', desc: 'Collect 500 coins total', target: 500, type: 'total_coins', reward: 1000 },
    { id: 'rich_dino', title: 'Rich Dino', desc: 'Collect 2000 coins total', target: 2000, type: 'total_coins', reward: 5000 },
    { id: 'jumper', title: 'Jumper', desc: 'Jump 100 times total', target: 100, type: 'total_jumps', reward: 150 },
    { id: 'sky_walker', title: 'Sky Walker', desc: 'Jump 1000 times total', target: 1000, type: 'total_jumps', reward: 1500 },
    { id: 'shield_master', title: 'Shield Master', desc: 'Collect 10 shields total', target: 10, type: 'total_shields', reward: 300 }
];

let wallet = parseInt(localStorage.getItem('dinoWallet')) || 0;
let ownedSkins = JSON.parse(localStorage.getItem('dinoOwnedSkins')) || ['default'];
let currentSkinId = localStorage.getItem('dinoCurrentSkin') || 'default';
let leaderboard = JSON.parse(localStorage.getItem('dinoLeaderboard')) || [];
let achievementsProgress = JSON.parse(localStorage.getItem('dinoAchievements')) || {};
let totalStats = JSON.parse(localStorage.getItem('dinoTotalStats')) || { coins: 0, jumps: 0, shields: 0 };

let gameSpeed;
let score;
let highScore;
let level = 1;
let coins = 0;
let isGameOver;
let isPaused = false;
let isHackerMode = false;
let hackerTimer = 0;
let isMuted = false;
let player;
let obstacles = [];
let collectibles = [];
let floatingTexts = [];
let audioCtx;
let particles = [];
let backgroundLayers = [];
let obstacleTimer;
let gameTime = 0;
let isDay = true;
let shakeIntensity = 0;
let cameraY = 0;
let keys = {};
let lastTime = 0;

function setupMobileControls() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        restartText.textContent = "Tap to Restart";
    }

    let controls = document.getElementById('mobile-controls');
    if (!controls) {
        controls = document.createElement('div');
        controls.id = 'mobile-controls';
        
        const duckBtn = document.createElement('div');
        duckBtn.innerText = 'DUCK';
        duckBtn.className = 'mobile-btn';
        
        const jumpBtn = document.createElement('div');
        jumpBtn.innerText = 'JUMP';
        jumpBtn.className = 'mobile-btn';

        controls.appendChild(duckBtn);
        controls.appendChild(jumpBtn);
        document.body.appendChild(controls);

        duckBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowDown'] = true; });
        duckBtn.addEventListener('touchend', (e) => { e.preventDefault(); keys['ArrowDown'] = false; });
        
        jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); handleJumpInput(); });
        
        document.addEventListener('touchstart', (e) => {
            if (isGameOver && e.target.closest('.game-over-screen')) {
                init();
            }
        }, { passive: false });
    }
}

const palettes = {
    day: {
        skyTop: '#87CEEB',
        skyBottom: '#E0F7FA',
        sun: '#FFD700',
        moon: 'transparent',
        ground: '#F0F0F0',
        groundDetail: '#E0E0E0',
        mountains: '#A8DADC',
        hills: '#C8E6C9',
        text: '#333'
    },
    night: {
        skyTop: '#0B1026',
        skyBottom: '#2B32B2',
        sun: 'transparent',
        moon: '#FEFCD7',
        ground: '#1a1a2e',
        groundDetail: '#252540',
        mountains: '#16213E',
        hills: '#0F3460',
        text: '#E0E0E0'
    }
};

function playSound(type) {
    if (!audioCtx || isMuted) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'jump') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.linearRampToValueAtTime(500, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start();
        oscillator.stop(now + 0.1);
    } else if (type === 'doubleJump') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, now);
        oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start();
        oscillator.stop(now + 0.15);
    } else if (type === 'coin') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1200, now);
        oscillator.frequency.setValueAtTime(1600, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.1);
        oscillator.start();
        oscillator.stop(now + 0.1);
    } else if (type === 'shield') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.linearRampToValueAtTime(600, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
        oscillator.start();
        oscillator.stop(now + 0.3);
    } else if (type === 'gameOver') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start();
        oscillator.stop(now + 0.5);
    }
}

class Player {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.originalW = w;
        this.originalH = h;

        this.dy = 0;
        this.isGrounded = true;
        this.isDucking = false;
        this.jumps = 0;
        this.hasShield = false;

        this.runFrame = 0;
        this.frameTimer = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        
        this.scaleX = 1;
        this.scaleY = 1;
    }

    draw() {
        ctx.save();
        if (currentSkinId === 'neon' && !isGameOver && Math.random() < 0.1) {
            ctx.translate((Math.random() - 0.5) * 10, 0);
            ctx.globalAlpha = 0.7;
        }

        ctx.translate(this.x + this.w / 2, this.y + this.h);
        ctx.scale(this.scaleX, this.scaleY);
        ctx.translate(-(this.x + this.w / 2), -(this.y + this.h));

        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w, 0, Math.PI * 2);
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00FFFF';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        const skin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];
        let color = isGameOver ? '#555' : skin.color;
        
        if (currentSkinId === 'neon' && !isGameOver) {
            color = '#002200';
        }
        if (isHackerMode && !isGameOver) color = '#00FF00';
        ctx.fillStyle = color;

        const headSize = this.isDucking ? 25 : 30;
        const bodyW = this.isDucking ? 50 : 35;
        const bodyH = this.isDucking ? 25 : 40;
        
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + bodyH/2 + 10);
        ctx.lineTo(this.x - 20, this.y + bodyH/2 - 5);
        ctx.lineTo(this.x + 10, this.y + bodyH + 5);
        ctx.fill();

        if (this.isDucking) {
            ctx.fillRect(this.x, this.y + 20, bodyW, bodyH);
        } else {
            ctx.fillRect(this.x, this.y + 10, bodyW, bodyH);
        }

        const headX = this.x + bodyW - 10;
        const headY = this.isDucking ? this.y + 20 : this.y;
        ctx.fillRect(headX, headY, headSize, headSize - 5);
        
        ctx.fillRect(headX + 5, headY + headSize - 5, headSize - 10, 8);

        if (!this.isBlinking && !isGameOver) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headX + 18, headY + 8, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(headX + 19, headY + 8, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = color;

        if (currentSkinId === 'neon' && !isGameOver) {
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 10px monospace';
            
            const bX = this.x;
            const bY = this.isDucking ? this.y + 20 : this.y + 10;
            const bW = this.isDucking ? 50 : 35;
            const bH = this.isDucking ? 25 : 40;
            
            for(let i=0; i<6; i++) {
                const tx = bX + Math.random() * (bW - 5);
                const ty = bY + 8 + Math.random() * (bH - 10);
                ctx.fillText(Math.random() > 0.5 ? '1' : '0', tx, ty);
            }
            
            const hX = this.x + bW - 10;
            const hY = this.isDucking ? this.y + 20 : this.y;
            const hS = this.isDucking ? 25 : 30;
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', hX + 5, hY + 15);
            
            ctx.fillStyle = color;
        }

        if (!this.isDucking) {
            ctx.fillRect(this.x + bodyW, this.y + 25, 8, 4);
            ctx.fillRect(this.x + bodyW + 6, this.y + 25, 2, 6);
        }

        const legL = 15;
        const legW = 6;
        const legX = this.x + 10;
        const legY = this.y + bodyH + (this.isDucking ? 20 : 10);

        if (this.isGrounded && !isGameOver) {
            if (this.runFrame === 0) {
                this.drawLeg(legX, legY, legW, legL, 0);
                this.drawLeg(legX + 12, legY, legW, legL, -5);
            } else if (this.runFrame === 1) {
                this.drawLeg(legX, legY, legW, legL, -5);
                this.drawLeg(legX + 12, legY, legW, legL, 0);
            } else if (this.runFrame === 2) {
                this.drawLeg(legX, legY, legW, legL, -10);
                this.drawLeg(legX + 12, legY, legW, legL, 5);
            } else {
                this.drawLeg(legX, legY, legW, legL, 0);
                this.drawLeg(legX + 12, legY, legW, legL, 0);
            }
        } else {
            this.drawLeg(legX, legY, legW, legL, -5);
            this.drawLeg(legX + 12, legY, legW, legL, -2);
        }

        ctx.restore();
    }

    drawLeg(x, y, w, h, offset) {
        ctx.fillRect(x, y + offset, w, h);
        ctx.fillRect(x, y + h + offset, w + 4, 4);
    }

    update(groundHeight) {
        this.frameTimer++;
        if (this.frameTimer % 5 === 0) {
            this.runFrame = (this.runFrame + 1) % 4;
        }

        this.blinkTimer++;
        if (this.blinkTimer > 150) {
            this.isBlinking = true;
            if (this.blinkTimer > 160) {
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        }

        if (!this.isGrounded) {
            this.dy += GRAVITY;
        }
        
        this.y += this.dy;

        const groundY = groundHeight - this.h;
        if (this.y > groundY) {
            if (!this.isGrounded) {
                this.scaleY = 0.8;
                this.scaleX = 1.2;
                playSound('land');
                createDust(this.x + this.w/2, groundHeight);
                shakeScreen(2);
            }
            this.y = groundY;
            this.dy = 0;
            this.isGrounded = true;
            this.jumps = 0;
        }

        this.scaleX += (1 - this.scaleX) * 0.1;
        this.scaleY += (1 - this.scaleY) * 0.1;

        this.draw();
    }

    jump() {
        if (this.isGrounded || (this.jumps < MAX_JUMPS && this.jumps > 0)) {
            this.dy = this.isGrounded ? JUMP_FORCE : DOUBLE_JUMP_FORCE;
            this.isGrounded = false;
            this.jumps++;
            totalStats.jumps++;
            
            this.scaleY = 1.2;
            this.scaleX = 0.8;
            
            createDust(this.x + this.w/2, this.y + this.h);
            playSound('jump');
            if (this.jumps === 2) playSound('doubleJump');
        }
    }

    duck(shouldBeDucking) {
        if (shouldBeDucking && !this.isDucking) {
            this.isDucking = true;
            this.h = this.originalH * 0.6;
            this.w = this.originalW * 1.2;
            this.y += this.originalH * 0.4;
        } else if (!shouldBeDucking && this.isDucking) {
            this.isDucking = false;
            this.h = this.originalH;
            this.w = this.originalW;
            this.y -= this.originalH * 0.4;
        }
    }

    getHitbox() {
        return { 
            x: this.x + 10, 
            y: this.y + 10, 
            width: this.w - 20, 
            height: this.h - 15 
        };
    }
}

class Entity {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.type = type;
        this.markedForDeletion = false;
        this.frameTimer = 0;
    }
    update() {
        this.x -= gameSpeed;
        if (this.x + this.w < 0) this.markedForDeletion = true;
        this.draw();
    }
    draw() { ctx.fillRect(this.x, this.y, this.w, this.h); }
    getHitbox() { 
        const padding = 5;
        return { 
            x: this.x + padding, 
            y: this.y + padding, 
            width: this.w - padding * 2, 
            height: this.h - padding * 2 
        }; 
    }
}

class Obstacle extends Entity {
    draw() {
        ctx.fillStyle = '#2E7D32';
        if (isHackerMode) ctx.fillStyle = '#00FF00';
        
        if (this.type.includes('cactus')) {
            const w = this.w;
            const h = this.h;
            const x = this.x;
            const y = this.y;
            
            ctx.fillRect(x + w * 0.35, y, w * 0.3, h);
            ctx.fillRect(x, y + h * 0.3, w * 0.2, h * 0.08);
            ctx.fillRect(x, y + h * 0.15, w * 0.15, h * 0.23);
            ctx.fillRect(x + w * 0.65, y + h * 0.4, w * 0.2, h * 0.08);
            ctx.fillRect(x + w * 0.85, y + h * 0.2, w * 0.15, h * 0.28);
            
            ctx.fillStyle = '#1B5E20';
            if (!isHackerMode) {
                ctx.fillRect(x + w * 0.4, y + h * 0.1, 2, 2);
                ctx.fillRect(x + w * 0.4, y + h * 0.3, 2, 2);
                ctx.fillRect(x + w * 0.4, y + h * 0.5, 2, 2);
                ctx.fillRect(x + w * 0.4, y + h * 0.7, 2, 2);
            }

        } else if (this.type === 'bird') {
            this.frameTimer++;
            const wingY = Math.sin(this.frameTimer * 0.2) * 15;
            
            ctx.fillStyle = isHackerMode ? '#00FF00' : (isDay ? '#795548' : '#4E342E');
            
            ctx.beginPath();
            ctx.ellipse(this.x + this.w/2, this.y + this.h/2, this.w/2, this.h/4, 0, 0, Math.PI*2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y + this.h/2);
            ctx.lineTo(this.x - 15, this.y + this.h/2 + 5);
            ctx.lineTo(this.x + 25, this.y + this.h/2 - 10);
            ctx.lineTo(this.x + 15, this.y + this.h/2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.w/2, this.y + this.h/2);
            ctx.lineTo(this.x + this.w/2 - 10, this.y + this.h/2 - 25 + wingY);
            ctx.lineTo(this.x + this.w/2 + 20, this.y + this.h/2 - 25 + wingY);
            ctx.lineTo(this.x + this.w/2 + 5, this.y + this.h/2);
            ctx.fill();
        }
    }
}

class Collectible extends Entity {
    draw() {
        if (this.type === 'coin') {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w/2, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 'shield') {
            ctx.fillStyle = '#00FFFF';
            ctx.beginPath();
            ctx.moveTo(this.x + this.w/2, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h/3);
            ctx.lineTo(this.x + this.w/2, this.y + this.h);
            ctx.lineTo(this.x, this.y + this.h/3);
            ctx.fill();
        } else if (this.type === 'hacker') {
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = '#00FF00';
            ctx.font = '20px monospace';
            ctx.fillText('101', this.x, this.y + 20);
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
    }
}

class Particle {
    constructor(x, y, color, speedY) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2 - gameSpeed;
        this.speedY = speedY || (Math.random() - 0.5) * 2;
        this.color = color;
        this.life = 1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class FloatingText {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.life = 1.0;
        this.dy = -1;
    }
    update() {
        this.y += this.dy;
        this.life -= 0.02;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px "VT323", monospace';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

function createDust(x, y) {
    for(let i=0; i<5; i++) {
        particles.push(new Particle(x, y, isDay ? '#ccc' : '#555', -Math.random()*2));
    }
}

class BackgroundLayer {
    constructor(drawFunc, speedModifier) {
        this.drawFunc = drawFunc;
        this.speedModifier = speedModifier;
        this.x = 0;
    }
    update() {
        this.x -= gameSpeed * this.speedModifier;
        if (this.x <= -canvas.width) this.x = 0;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, 0);
        this.drawFunc();
        ctx.translate(canvas.width, 0);
        this.drawFunc();
        ctx.restore();
    }
}

function drawSky() {
    if (isHackerMode) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.font = '14px monospace';
        for(let i=0; i<50; i++) {
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', Math.random() * canvas.width, Math.random() * canvas.height);
        }
        return;
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const p = isDay ? palettes.day : palettes.night;
    gradient.addColorStop(0, p.skyTop);
    gradient.addColorStop(1, p.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height + 200;
    const radius = canvas.height + 100;
    const angle = (gameTime / DAY_NIGHT_CYCLE_DURATION) * Math.PI * 2 - Math.PI/2;
    
    const sunX = cx + Math.cos(angle) * radius;
    const sunY = cy + Math.sin(angle) * radius;
    const moonX = cx + Math.cos(angle + Math.PI) * radius;
    const moonY = cy + Math.sin(angle + Math.PI) * radius;

    ctx.fillStyle = palettes.day.sun;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'orange';
    ctx.beginPath(); ctx.arc(sunX, sunY, 40, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = palettes.night.moon;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'white';
    ctx.beginPath(); ctx.arc(moonX, moonY, 30, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
}

function drawClouds() {
    if (isHackerMode) return;
    ctx.fillStyle = isDay ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)';
    
    const y = canvas.height * 0.15;
    const positions = [0.1, 0.35, 0.6, 0.85];

    positions.forEach(p => {
        const cx = canvas.width * p;
        ctx.beginPath();
        ctx.arc(cx, y, 30, 0, Math.PI * 2);
        ctx.arc(cx + 25, y - 10, 35, 0, Math.PI * 2);
        ctx.arc(cx + 50, y, 30, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawMountains() {
    ctx.fillStyle = isDay ? palettes.day.mountains : palettes.night.mountains;
    if (isHackerMode) ctx.fillStyle = '#003300';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.8);
    for(let i=0; i<=canvas.width; i+=100) {
        ctx.lineTo(i, canvas.height * 0.6 - Math.random()*50);
    }
    ctx.lineTo(canvas.width, canvas.height * 0.8);
    ctx.fill();
}

function drawHills() {
    ctx.fillStyle = isDay ? palettes.day.hills : palettes.night.hills;
    if (isHackerMode) ctx.fillStyle = '#004400';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for(let i=0; i<=canvas.width; i+=50) {
        ctx.lineTo(i, canvas.height * 0.75 - Math.sin(i*0.01)*20);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();
}

function shakeScreen(intensity) {
    shakeIntensity = intensity;
}

function setCanvasSize() {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    
    const groundHeight = canvas.height * 0.8;
    if (player) {
        if (player.isGrounded) player.y = groundHeight - player.h;
    }
}

function init() {
    setCanvasSize();
    setupMobileControls();
    isGameOver = false;
    isPaused = false;
    isHackerMode = false;
    hackerTimer = 0;
    shopModal.classList.remove('active');
    score = 0;
    coins = 0;
    level = 1;
    gameSpeed = INITIAL_GAME_SPEED;
    obstacles = [];
    collectibles = [];
    particles = [];
    floatingTexts = [];
    keys = {};
    lastTime = 0;
    gameTime = 0;
    
    highScore = localStorage.getItem('dinoHighScore') || 0;
    highScoreDisplay.textContent = Math.floor(highScore);

    const groundHeight = canvas.height * 0.8;
    player = new Player(50, groundHeight - 50, 40, 50);

    backgroundLayers = [
        new BackgroundLayer(drawClouds, 0.1),
        new BackgroundLayer(drawMountains, 0.2),
        new BackgroundLayer(drawHills, 0.5)
    ];

    gameOverScreen.style.opacity = '0';
    gameOverScreen.style.pointerEvents = 'none';
    updateUI();

    spawnObstacle();
    spawnCollectible();
    animate();
}

function spawnObstacle() {
    if (isGameOver) return;
    if (isPaused) {
        obstacleTimer = setTimeout(spawnObstacle, 100);
        return;
    }

    const groundHeight = canvas.height * 0.8;
    
    let type = 'cactusSmall';
    if (level > 1 && Math.random() > 0.7) type = 'bird';
    else if (level > 1 && Math.random() > 0.6) type = 'cactusDouble';
    else if (Math.random() > 0.7) type = 'cactusLarge';
    
    if (type === 'bird') {
        const r = Math.random();
        let y = groundHeight - 40;
        if (r > 0.33) y = groundHeight - 75;
        if (r > 0.66) y = groundHeight - 110;
        obstacles.push(new Obstacle(canvas.width, y, 40, 30, 'bird'));
    } else if (type === 'cactusDouble') {
        obstacles.push(new Obstacle(canvas.width, groundHeight - 50, 60, 50, 'cactusDouble'));
    } else if (type === 'cactusLarge') {
        obstacles.push(new Obstacle(canvas.width, groundHeight - 65, 35, 65, 'cactusLarge'));
    } else {
        obstacles.push(new Obstacle(canvas.width, groundHeight - 45, 30, 45, 'cactusSmall'));
    }

    const minTime = 1000 / (gameSpeed/5);
    const maxTime = 2500 / (gameSpeed/5);
    const nextSpawnTime = Math.random() * (maxTime - minTime) + minTime;
    obstacleTimer = setTimeout(spawnObstacle, nextSpawnTime);
}

function spawnCollectible() {
    if (isGameOver) return;
    if (isPaused) {
        setTimeout(spawnCollectible, 100);
        return;
    }
    const groundHeight = canvas.height * 0.8;
    
    if (Math.random() > 0.5) {
        const r = Math.random();
        let type = 'coin';
        if (r > 0.95) type = 'hacker';
        else if (r > 0.8) type = 'shield';
        const y = groundHeight - (Math.random() * 100 + 30);
        collectibles.push(new Collectible(canvas.width, y, 30, 30, type));
    }
    
    setTimeout(spawnCollectible, Math.random() * 5000 + 3000);
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

function endGame() {
    isGameOver = true;
    playSound('gameOver');
    clearTimeout(obstacleTimer);
    
    wallet += coins;
    localStorage.setItem('dinoWallet', wallet);
    localStorage.setItem('dinoTotalStats', JSON.stringify(totalStats));

    const finalScore = Math.floor(score);
    leaderboard.push({ score: finalScore, date: new Date().toLocaleDateString() });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('dinoLeaderboard', JSON.stringify(leaderboard));
    
    checkAchievements();

    renderLeaderboard();

    gameOverScreen.style.opacity = '1';
    gameOverScreen.style.pointerEvents = 'auto';
    shakeScreen(10);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
        highScoreDisplay.textContent = Math.floor(highScore);
    }
}

function checkAchievements() {
    let changed = false;
    ACHIEVEMENTS.forEach(ach => {
        if (achievementsProgress[ach.id]) return;

        let completed = false;
        if (ach.type === 'score' && score >= ach.target) completed = true;
        if (ach.type === 'total_coins' && totalStats.coins >= ach.target) completed = true;
        if (ach.type === 'total_jumps' && totalStats.jumps >= ach.target) completed = true;
        if (ach.type === 'total_shields' && totalStats.shields >= ach.target) completed = true;

        if (completed) {
            achievementsProgress[ach.id] = true;
            wallet += ach.reward;
            floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 2, `🏆 ${ach.title}`));
            playSound('coin');
            changed = true;
        }
    });

    if (changed) {
        localStorage.setItem('dinoAchievements', JSON.stringify(achievementsProgress));
        localStorage.setItem('dinoWallet', wallet);
    }
}

function renderAchievements() {
    achieveGrid.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
        const isCompleted = achievementsProgress[ach.id];
        const item = document.createElement('div');
        item.className = `achieve-item ${isCompleted ? 'completed' : ''}`;
        
        let progress = 0;
        if (ach.type === 'score') progress = Math.floor(highScore);
        else if (ach.type === 'total_coins') progress = totalStats.coins;
        else if (ach.type === 'total_jumps') progress = totalStats.jumps;
        else if (ach.type === 'total_shields') progress = totalStats.shields;

        if (progress > ach.target) progress = ach.target;

        item.innerHTML = `
            <div class="achieve-info">
                <div class="achieve-title">${ach.title}</div>
                <div class="achieve-desc">${ach.desc} (${progress}/${ach.target})</div>
            </div>
            <div class="achieve-reward">+${ach.reward} 💰</div>
            <div class="achieve-status">${isCompleted ? '✅' : '🔒'}</div>
        `;
        achieveGrid.appendChild(item);
    });
}

function renderLeaderboard() {
    leaderboardList.innerHTML = leaderboard.map((entry, index) => 
        `<li>#${index + 1} - ${entry.score.toString().padStart(5, '0')} <span style="font-size:0.8em; opacity:0.7">(${entry.date})</span></li>`
    ).join('');
}

function renderShop() {
    shopBalance.textContent = wallet;
    shopGrid.innerHTML = '';
    
    SKINS.forEach(skin => {
        const isOwned = ownedSkins.includes(skin.id);
        const isEquipped = currentSkinId === skin.id;
        
        const item = document.createElement('div');
        item.className = `shop-item ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        
        let actionText = isEquipped ? 'EQUIPPED' : (isOwned ? 'EQUIP' : `${skin.cost} COINS`);
        
        item.innerHTML = `
            <div class="shop-item-name" style="color:${skin.color}">${skin.name}</div>
            <div class="shop-item-cost">${actionText}</div>
        `;
        
        item.onclick = () => handleShopAction(skin);
        shopGrid.appendChild(item);
    });
}

function handleShopAction(skin) {
    if (ownedSkins.includes(skin.id)) {
        currentSkinId = skin.id;
        localStorage.setItem('dinoCurrentSkin', currentSkinId);
        playSound('jump');
    } else {
        if (wallet >= skin.cost) {
            wallet -= skin.cost;
            ownedSkins.push(skin.id);
            currentSkinId = skin.id;
            
            localStorage.setItem('dinoWallet', wallet);
            localStorage.setItem('dinoOwnedSkins', JSON.stringify(ownedSkins));
            localStorage.setItem('dinoCurrentSkin', currentSkinId);
            playSound('coin');
        } else {
            shakeScreen(5);
        }
    }
    renderShop();
}

function updateUI() {
    const color = isDay ? palettes.day.text : palettes.night.text;
    document.querySelector('.ui-container').style.color = color;
    const scoreStr = Math.floor(score).toString().padStart(5, '0');
    scoreDisplay.textContent = scoreStr;
    highScoreDisplay.textContent = Math.floor(highScore).toString().padStart(5, '0');
}

function animate() {
    if (isPaused) return;

    const now = performance.now();
    const deltaTime = (now - (lastTime || now)) / 1000;
    lastTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (shakeIntensity > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeIntensity *= 0.9;
        if (shakeIntensity < 0.5) shakeIntensity = 0;
    }
    
    cameraY = (gameSpeed - INITIAL_GAME_SPEED) * 2;
    ctx.translate(0, cameraY);

    gameTime += gameSpeed * 0.1;
    isDay = Math.sin(gameTime / DAY_NIGHT_CYCLE_DURATION) > 0;
    
    drawSky();
    backgroundLayers.forEach(layer => {
        layer.update();
        layer.draw();
    });

    const groundHeight = canvas.height * 0.8;
    ctx.fillStyle = isDay ? palettes.day.ground : palettes.night.ground;
    if (isHackerMode) ctx.fillStyle = '#002200';
    ctx.fillRect(0, groundHeight, canvas.width, canvas.height - groundHeight);
    ctx.fillStyle = isDay ? palettes.day.groundDetail : palettes.night.groundDetail;
    ctx.fillRect(0, groundHeight, canvas.width, 10);

    if (!isGameOver) {
        player.duck(keys['ArrowDown'] || keys['KeyS']);
        player.update(groundHeight);

        obstacles = obstacles.filter(o => o.x + o.w > 0);
        obstacles.forEach(obstacle => {
            obstacle.update();
            if (checkCollision(player.getHitbox(), obstacle.getHitbox())) {
                if (player.hasShield) {
                    player.hasShield = false;
                    obstacle.markedForDeletion = true;
                    playSound('shield');
                    shakeScreen(5);
                } else {
                    endGame();
                }
            }
        });
        obstacles = obstacles.filter(o => !o.markedForDeletion);

        collectibles = collectibles.filter(c => c.x + c.w > 0);
        collectibles.forEach(c => {
            c.update();
            if (checkCollision(player.getHitbox(), c.getHitbox())) {
                c.markedForDeletion = true;
                if (c.type === 'coin') {
                    coins += 25;
                    score += 50;
                    totalStats.coins += 25;
                    floatingTexts.push(new FloatingText(c.x, c.y, "+25"));
                    playSound('coin');
                } else if (c.type === 'shield') {
                    player.hasShield = true;
                    playSound('coin');
                } else if (c.type === 'hacker') {
                    isHackerMode = true;
                    totalStats.shields++;
                    hackerTimer = 10;
                    playSound('shield');
                    floatingTexts.push(new FloatingText(c.x, c.y, "HACKER MODE"));
                }
            }
        });
        collectibles = collectibles.filter(c => !c.markedForDeletion);

        score += deltaTime * 10;
        if (gameSpeed < MAX_GAME_SPEED) gameSpeed += GAME_SPEED_INCREMENT * (deltaTime * 60);
        if (isHackerMode) {
            hackerTimer -= deltaTime;
            if (hackerTimer <= 0) isHackerMode = false;
        }
        
        const newLevel = Math.floor(score / 500) + 1;
        if (newLevel > level) {
            level = newLevel;
            playSound('coin');
        }

        updateUI();
    } else {
        player.draw();
        obstacles.forEach(o => o.draw());
    }

    floatingTexts = floatingTexts.filter(t => t.life > 0);
    floatingTexts.forEach(t => {
        t.update();
        t.draw();
    });

    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    ctx.restore();
    if (!isGameOver) requestAnimationFrame(animate);
}

function handleJumpInput() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (isGameOver) {
        init();
    } else {
        player.jump();
    }
}

function pauseGame() {
    if (isGameOver) return;
    isPaused = true;
}

function resumeGame() {
    if (isGameOver) return;
    isPaused = false;
    lastTime = performance.now();
    animate();
}

function togglePause() {
    if (isPaused) resumeGame(); else pauseGame();
}

function toggleSound() {
    isMuted = !isMuted;
    soundBtn.textContent = isMuted ? "🔊 SOUND: OFF" : "🔊 SOUND: ON";
}

window.addEventListener('resize', () => {
    if (!isGameOver) {
        setCanvasSize();
    }
});

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJumpInput();
    }
    if (e.code === 'KeyP') {
        togglePause();
    }
    if (isGameOver && e.code === 'Space') {
        init();
    }
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

restartText.addEventListener('click', () => { if (isGameOver) init(); });

settingsBtn.addEventListener('click', () => {
    settingsMenu.classList.toggle('active');
    if (!isGameOver) {
        if (settingsMenu.classList.contains('active')) pauseGame();
        else resumeGame();
    }
});

soundBtn.addEventListener('click', toggleSound);

document.getElementById('menuShopBtn').addEventListener('click', () => {
    renderShop();
    settingsMenu.classList.remove('active');
    shopModal.classList.add('active');
});

menuAchieveBtn.addEventListener('click', () => {
    renderAchievements();
    settingsMenu.classList.remove('active');
    achieveModal.classList.add('active');
});

document.getElementById('closeAchieveBtn').addEventListener('click', () => {
    achieveModal.classList.remove('active');
    if (!isGameOver) resumeGame();
});

document.getElementById('closeShopBtn').addEventListener('click', () => {
    shopModal.classList.remove('active');
    if (!isGameOver) resumeGame();
});

init();