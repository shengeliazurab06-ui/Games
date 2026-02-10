document.addEventListener('DOMContentLoaded', () => {
    const playerGrid = document.getElementById('player-board');
    const enemyGrid = document.getElementById('enemy-board');
    const shipDock = document.getElementById('ship-dock');
    const rotateBtn = document.getElementById('rotate-btn');
    const startBtn = document.getElementById('start-btn');
    const randomizeBtn = document.getElementById('randomize-btn');
    const restartBtn = document.getElementById('restart-btn');
    const soundBtn = document.getElementById('sound-btn');
    const statusText = document.getElementById('status-text');
    const turnIndicator = document.getElementById('turn-indicator');
    const radarBtn = document.getElementById('radar-btn');
    const statsBtn = document.getElementById('stats-btn');
    const statsModal = document.getElementById('stats-modal');
    const closeModalBtn = statsModal.querySelector('.close-btn');
    const statWins = document.getElementById('stat-wins');
    const statLosses = document.getElementById('stat-losses');
    const statAccuracy = document.getElementById('stat-accuracy');
    const timerDisplay = document.getElementById('timer');
    const bgMusic = document.getElementById('bg-music');
    const setupControls = document.getElementById('setup-controls');
    const gameControls = document.getElementById('game-controls');

    const width = 10;
    const shipSizes = [5, 4, 3, 3, 2];
    let playerSquares = [];
    let enemySquares = [];
    let isHorizontal = true;
    let isGameOver = false;
    let currentPlayer = 'user';
    let soundEnabled = true;
    let draggedElement = null;
    let dropSucceeded = false;
    let radarUses = 1;
    let playerShots = 0;
    let playerHits = 0;
    
    let potentialTargets = [];
    let lastHitIndex = null;

    let timerInterval;
    const TURN_TIME_LIMIT = 10;

    function createBoard(grid, squares) {
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement('div');
            square.dataset.id = i;
            square.classList.add('cell');
            grid.appendChild(square);
            squares.push(square);
        }
    }

    createBoard(playerGrid, playerSquares);
    createBoard(enemyGrid, enemySquares);

    const shipConfig = [5, 4, 3, 3, 2];
    const ships = shipConfig.map((size, index) => ({
        name: `ship-${index}`,
        id: index,
        size: size,
        hits: 0,
        directions: [
            Array.from({ length: size }, (_, i) => i),
            Array.from({ length: size }, (_, i) => i * width)
        ]
    }));
    
    const enemyShips = JSON.parse(JSON.stringify(ships));

    function playSound(type) {
        if (!soundEnabled) return;
        const audio = document.getElementById(`snd-${type}`);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    }

    function createDockShips() {
        shipDock.innerHTML = '';
        ships.forEach((ship, index) => {
            const shipDiv = document.createElement('div');
            shipDiv.classList.add('ship-preview');
            shipDiv.draggable = true;
            shipDiv.dataset.id = index;
            shipDiv.style.width = `${ship.size * 30}px`;
            shipDiv.style.height = '30px';

            const shipBody = document.createElement('div');
            shipBody.classList.add('ship-body');
            shipDiv.classList.add(`ship-size-${ship.size}`);
            shipDiv.appendChild(shipBody);
            
            shipDiv.addEventListener('dragstart', dragStart);
            shipDock.appendChild(shipDiv);
        });
    }
    createDockShips();

    rotateBtn.addEventListener('click', () => {
        isHorizontal = !isHorizontal;
        rotateBtn.textContent = isHorizontal ? "Rotate: Horizontal" : "Rotate: Vertical";
    });

    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            bgMusic.play().catch(() => {});
        } else {
            bgMusic.pause();
        }
        soundBtn.textContent = soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off";
    });

    function startMusic() {
        if (soundEnabled && bgMusic.paused) {
            bgMusic.play().then(() => {
                document.removeEventListener('click', startMusic);
                document.removeEventListener('keydown', startMusic);
            }).catch(() => {});
        }
    }

    document.addEventListener('click', startMusic);
    document.addEventListener('keydown', startMusic);

    if (soundEnabled) bgMusic.play().catch(() => {});

    randomizeBtn.addEventListener('click', () => {
        resetPlayerBoard();
        ships.forEach(ship => generateRandomShip(ship, playerSquares, 'ship', false));
        shipDock.innerHTML = '';
        startBtn.disabled = false;
        statusText.textContent = "Ships placed! Ready to start.";
    });

    function resetPlayerBoard() {
        playerSquares.forEach(square => {
            square.className = 'cell';
            delete square.dataset.ship;
        });
        const shipContainers = playerGrid.querySelectorAll('.ship-container');
        shipContainers.forEach(container => container.remove());
        createDockShips();
        startBtn.disabled = true;
    }

    function generateRandomShip(ship, squares, className, isEnemy) {
        let randomDirection = Math.floor(Math.random() * 2);
        let current = ship.directions[randomDirection];
        let isTaken = false;
        let randomStart;

        if (randomDirection === 0) { // Horizontal
            randomStart = Math.floor(Math.random() * (width * width - (ship.size - 1)));
            const isAtRightEdge = (randomStart % width) + ship.size > width;
            if (isAtRightEdge) randomStart -= (ship.size - 1);
        } else { // Vertical
            randomStart = Math.floor(Math.random() * (width * width - (width * (ship.size - 1))));
        }

        for (let i = 0; i < ship.size; i++) {
            if (squares[randomStart + current[i]].classList.contains('ship') || 
                squares[randomStart + current[i]].classList.contains('taken')) {
                isTaken = true;
            }
        }

        if (!isTaken) {
            current.forEach(idx => {
                const square = squares[randomStart + idx];
                square.classList.add('taken');
                if (!isEnemy) {
                    square.classList.add(className);
                }
                square.dataset.ship = ship.name;
                if (isEnemy) {
                    square.dataset.shipIndex = ship.id;
                }
            });

            if (!isEnemy) { 
                const shipContainer = document.createElement('div');
                shipContainer.classList.add('ship-container');
                shipContainer.classList.add(`ship-size-${ship.size}`);
                const shipBody = document.createElement('div');
                shipBody.classList.add('ship-body');
                shipContainer.appendChild(shipBody);

                shipContainer.style.width = `${ship.size * 30}px`;
                shipContainer.style.height = '30px';
                
                const row = Math.floor(randomStart / width);
                const col = randomStart % width;
                
                shipContainer.style.top = `${row * 30}px`;

                if (randomDirection === 1) { // Vertical
                    shipContainer.style.left = `${(col + 1) * 30}px`;
                    shipContainer.style.transform = 'rotate(90deg)';
                } else {
                    shipContainer.style.left = `${col * 30}px`;
                }
                
                shipContainer.draggable = true;
                shipContainer.dataset.id = ship.id;
                shipContainer.dataset.startId = randomStart;
                shipContainer.dataset.horizontal = (randomDirection === 0);
                shipContainer.addEventListener('dragstart', dragStartFromBoard);
                shipContainer.addEventListener('dragend', handleBoardShipDragEnd);
                shipContainer.style.pointerEvents = 'auto';
                playerGrid.appendChild(shipContainer);
            }
        } else {
            generateRandomShip(ship, squares, className, isEnemy);
        }
    }

    function handleBoardShipDragEnd() {
        if (!dropSucceeded) {
            const ship = ships[this.dataset.id];
            const wasHorizontal = this.dataset.horizontal === 'true';
            const oldIndices = getShipIndices(parseInt(this.dataset.startId), ship.size, wasHorizontal);
            if (oldIndices) {
                oldIndices.forEach(index => {
                    playerSquares[index].classList.add('taken', 'ship');
                    playerSquares[index].dataset.ship = ship.name;
                });
            }
        }

        this.style.visibility = 'visible';
        draggedElement = null;
    }

    let draggedShipIdx;

    function dragStart(e) {
        draggedShipIdx = this.dataset.id;
    }

    function dragStartFromBoard(e) {
        draggedShipIdx = this.dataset.id;
        draggedElement = this;
        dropSucceeded = false;

        const ship = ships[draggedShipIdx];
        const wasHorizontal = this.dataset.horizontal === 'true';
        const oldIndices = getShipIndices(parseInt(this.dataset.startId), ship.size, wasHorizontal);
        if (oldIndices) {
            oldIndices.forEach(index => {
                playerSquares[index].classList.remove('taken', 'ship');
                delete playerSquares[index].dataset.ship;
            });
        }

        setTimeout(() => {
            if (draggedElement) draggedElement.style.visibility = 'hidden';
        }, 0);
    }


    playerSquares.forEach(square => {
        square.addEventListener('dragover', e => e.preventDefault());
        square.addEventListener('dragenter', e => e.preventDefault());
        square.addEventListener('dragenter', dragEnter);
        square.addEventListener('dragleave', dragLeave);
        square.addEventListener('drop', dragDrop);
    });

    function getShipIndices(startId, shipSize, horizontal = isHorizontal) {
        let indices = [];
        if (horizontal) {
            if ((startId % width) + shipSize > width) return null;
            for(let i=0; i<shipSize; i++) indices.push(startId + i);
        } else {
            if (startId + width * (shipSize - 1) >= width * width) return null;
            for(let i=0; i<shipSize; i++) indices.push(startId + i * width);
        }
        return indices;
    }

    function dragEnter(e) {
        e.preventDefault();
        const ship = ships[draggedShipIdx];
        const startId = parseInt(this.dataset.id);
        const indices = getShipIndices(startId, ship.size, isHorizontal);

        if (indices) {
            const isTaken = indices.some(index => playerSquares[index].classList.contains('taken'));
            const className = isTaken ? 'preview-invalid' : 'preview-valid';
            indices.forEach(idx => playerSquares[idx].classList.add(className));
        }
    }

    function dragLeave() {
        playerSquares.forEach(sq => {
            sq.classList.remove('preview-valid');
            sq.classList.remove('preview-invalid');
        });
    }

    function dragDrop() {
        dragLeave();

        const ship = ships[draggedShipIdx];
        const startId = parseInt(this.dataset.id);
        const shipIndices = getShipIndices(startId, ship.size, isHorizontal);

        if (!shipIndices || shipIndices.some(index => playerSquares[index].classList.contains('taken'))) {
            return;
        }

        shipIndices.forEach(index => {
            playerSquares[index].classList.add('taken', 'ship');
            playerSquares[index].dataset.ship = ship.name;
        });

        if (draggedElement) {
            dropSucceeded = true;

            const row = Math.floor(startId / width);
            const col = startId % width;

            draggedElement.style.top = `${row * 30}px`;
            draggedElement.dataset.startId = startId;
            draggedElement.dataset.horizontal = isHorizontal;

            if (!isHorizontal) {
                draggedElement.style.left = `${(col + 1) * 30}px`;
                draggedElement.style.transform = 'rotate(90deg)';
            } else {
                draggedElement.style.left = `${col * 30}px`;
                draggedElement.style.transform = 'rotate(0deg)';
            }

            const body = draggedElement.querySelector('.ship-body');
            body.classList.remove('drop-animation');
            void body.offsetWidth;
            body.classList.add('drop-animation');
        } else {

            const shipContainer = document.createElement('div');
            shipContainer.classList.add('ship-container');
            shipContainer.classList.add(`ship-size-${ship.size}`);
            const shipBody = document.createElement('div');
            shipBody.classList.add('ship-body');
            shipContainer.appendChild(shipBody);
            shipContainer.style.width = `${ship.size * 30}px`;
            shipContainer.style.height = '30px';
            const row = Math.floor(startId / width);
            const col = startId % width;
            shipContainer.style.top = `${row * 30}px`;
            if (!isHorizontal) {
                shipContainer.style.left = `${(col + 1) * 30}px`;
                shipContainer.style.transform = 'rotate(90deg)';
            } else {
                shipContainer.style.left = `${col * 30}px`;
            }
            
            shipContainer.draggable = true;
            shipContainer.dataset.id = draggedShipIdx;
            shipContainer.dataset.startId = startId;
            shipContainer.dataset.horizontal = isHorizontal;
            shipContainer.addEventListener('dragstart', dragStartFromBoard);
            shipContainer.addEventListener('dragend', handleBoardShipDragEnd);
            shipContainer.style.pointerEvents = 'auto';
            playerGrid.appendChild(shipContainer);

            const dockShip = shipDock.querySelector(`[data-id="${draggedShipIdx}"]`);
            if(dockShip) dockShip.remove();
        }

        if (shipDock.children.length === 0) {
            startBtn.disabled = false;
            statusText.textContent = "All ships placed! Press Start.";
        }
    }

    startBtn.addEventListener('click', () => {
        playerShots = 0;
        playerHits = 0;
        radarUses = 1;
        radarBtn.disabled = false;
        enemyShips.forEach(ship => generateRandomShip(ship, enemySquares, 'ship', true));
        
        setupControls.classList.add('hidden');
        gameControls.classList.remove('hidden');
        statusText.textContent = "Your Turn! Fire at the Enemy Board.";
        turnIndicator.textContent = "Your Turn";
        timerDisplay.classList.remove('hidden');
        startTurnTimer();
        playGame();
    });

    restartBtn.addEventListener('click', () => {
        location.reload();
    });

    function playGame() {
        if (isGameOver) return;
        
        enemySquares.forEach(square => {
            square.addEventListener('click', function(e) {
                if (isGameOver || currentPlayer !== 'user') return;
                playerShots++;
                if (square.classList.contains('hit') || square.classList.contains('miss')) return;

                stopTurnTimer();
                playSound('shoot');
                revealSquare(square);
            });
        });
    }

    function revealSquare(square) {
        if (square.classList.contains('taken')) {
            square.classList.add('hit');
            playSound('hit');
            statusText.textContent = "It's a HIT!";
            playerHits++;
            
            const shipId = square.dataset.shipIndex;
            const ship = enemyShips.find(s => s.id == shipId);
            ship.hits++;
            if (ship.hits === ship.size) {
                playSound('sunk');
                statusText.textContent = `You sunk the Enemy's ${ship.name}!`;
                enemySquares.forEach(sq => {
                    if (sq.dataset.shipIndex == shipId) sq.classList.add('sunk');
                });
            }

            checkForWin();
        } else {
            square.classList.add('miss');
            playSound('miss');
            statusText.textContent = "Miss!";
            
            currentPlayer = 'enemy';
            turnIndicator.textContent = "Enemy Turn";
            timerDisplay.classList.add('hidden');
            if (!isGameOver) {
                setTimeout(enemyTurn, 1000);
            }
        }
    }

    function enemyTurn() {
        if (isGameOver) return;
        statusText.textContent = "Enemy Turn...";
        turnIndicator.textContent = "Enemy Turn";

        let targetIndex;
        
        if (potentialTargets.length > 0) {
            targetIndex = potentialTargets.pop();
        } else {
            do {
                targetIndex = Math.floor(Math.random() * width * width);
            } while (playerSquares[targetIndex].classList.contains('hit') || 
                     playerSquares[targetIndex].classList.contains('miss'));
        }

        const square = playerSquares[targetIndex];

        if (square.classList.contains('hit') || square.classList.contains('miss')) {
            enemyTurn();
            return;
        }

        playSound('shoot');
        setTimeout(() => {
        if (square.classList.contains('taken')) {
            square.classList.add('hit');
            playSound('hit');
            statusText.textContent = "Enemy Hit your ship!";

            addNeighborsToTargets(targetIndex);
            
            checkForWin();

            if (!isGameOver) {
                setTimeout(enemyTurn, 1000);
            }
        } else {
            square.classList.add('miss');
            playSound('miss');
            statusText.textContent = "Enemy Missed.";
            
            currentPlayer = 'user';
            turnIndicator.textContent = "Your Turn";
            statusText.textContent = "Your Turn";
            timerDisplay.classList.remove('hidden');
            startTurnTimer();
        }
        }, 200);
    }

    function addNeighborsToTargets(index) {
        const neighbors = [];
        const row = Math.floor(index / width);
        const col = index % width;

        if (row > 0) neighbors.push(index - width);
        if (row < width - 1) neighbors.push(index + width);
        if (col > 0) neighbors.push(index - 1);
        if (col < width - 1) neighbors.push(index + 1);

        neighbors.sort(() => Math.random() - 0.5);

        neighbors.forEach(n => {
            if (!playerSquares[n].classList.contains('hit') && 
                !playerSquares[n].classList.contains('miss') &&
                !potentialTargets.includes(n)) {
                potentialTargets.push(n);
            }
        });
    }

    function checkForWin() {
        const allPlayerShipsSunk = ships.every(ship => ship.hits === ship.size);
        const allEnemyShipsSunk = enemyShips.every(ship => ship.hits === ship.size);

        if (allEnemyShipsSunk) {
            isGameOver = true;
            statusText.textContent = "YOU WIN!";
            turnIndicator.textContent = "GAME OVER";
            playSound('win');
            statusText.style.color = "#2ecc71";
            updateGameStats(true);
            stopTurnTimer();
            timerDisplay.classList.add('hidden');
        } else if (allPlayerShipsSunk) {
            isGameOver = true;
            statusText.textContent = "YOU LOSE!";
            turnIndicator.textContent = "GAME OVER";
            playSound('lose');
            statusText.style.color = "#e74c3c";
            updateGameStats(false);
        }
    }

    function startTurnTimer() {
        stopTurnTimer();
        let timeLeft = TURN_TIME_LIMIT;
        timerDisplay.textContent = `Time: ${timeLeft}`;
        timerDisplay.style.color = "#f1c40f";

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Time: ${timeLeft}`;
            if (timeLeft <= 3) timerDisplay.style.color = "#e74c3c";

            if (timeLeft <= 0) {
                stopTurnTimer();
                statusText.textContent = "Time's up! Random shot fired.";
                makeRandomMove();
            }
        }, 1000);
    }

    function stopTurnTimer() {
        clearInterval(timerInterval);
    }

    function makeRandomMove() {
        let targetIndex;
        do {
            targetIndex = Math.floor(Math.random() * width * width);
        } while (enemySquares[targetIndex].classList.contains('hit') || 
                 enemySquares[targetIndex].classList.contains('miss'));
        
        const square = enemySquares[targetIndex];
        playSound('shoot');
        revealSquare(square);
    }

    function useRadar() {
        if (isGameOver || currentPlayer !== 'user' || radarUses <= 0) return;

        radarUses--;
        radarBtn.textContent = `📡 Radar (${radarUses} use)`;
        radarBtn.disabled = true;

        const unhitShipSquares = enemySquares.filter(square => 
            square.classList.contains('taken') && !square.classList.contains('hit')
        );

        if (unhitShipSquares.length > 0) {
            const targetSquare = unhitShipSquares[Math.floor(Math.random() * unhitShipSquares.length)];
            statusText.textContent = "Radar detected an enemy vessel!";
            targetSquare.classList.add('radar-found');
            setTimeout(() => {
                targetSquare.classList.remove('radar-found');
            }, 2000);
        } else {
            statusText.textContent = "Radar found nothing. All ships might be sunk!";
        }
    }

    function updateGameStats(didPlayerWin) {
        let stats = JSON.parse(localStorage.getItem('battleshipStats')) || { wins: 0, losses: 0, totalShots: 0, totalHits: 0 };
        
        if (didPlayerWin) stats.wins++;
        else stats.losses++;

        stats.totalShots += playerShots;
        stats.totalHits += playerHits;

        localStorage.setItem('battleshipStats', JSON.stringify(stats));
    }

    function updateStatsDisplay() {
        let stats = JSON.parse(localStorage.getItem('battleshipStats')) || { wins: 0, losses: 0, totalShots: 0, totalHits: 0 };
        
        statWins.textContent = stats.wins;
        statLosses.textContent = stats.losses;
        
        const accuracy = stats.totalShots > 0 ? ((stats.totalHits / stats.totalShots) * 100).toFixed(1) : 0;
        statAccuracy.textContent = `${accuracy}%`;
    }

    function showStats() {
        updateStatsDisplay();
        statsModal.classList.remove('hidden');
    }

    function hideStats() {
        statsModal.classList.add('hidden');
    }

    radarBtn.addEventListener('click', useRadar);
    statsBtn.addEventListener('click', showStats);
    closeModalBtn.addEventListener('click', hideStats);
    statsModal.addEventListener('click', (e) => { if (e.target === statsModal) hideStats(); });
});