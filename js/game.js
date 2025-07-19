/**
 * Core Game Engine for Ex Battle
 * Handles game loop, canvas rendering, state management, and core game logic
 */

class Game {
    constructor() {
        // Canvas and rendering
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        
        // Game timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        
        // Game state
        this.state = 'loading'; // loading, menu, playing, paused, gameOver, victory
        this.isRunning = false;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];
        this.particles = [];
        this.effects = [];
        
        // Game data
        this.level = 1;
        this.score = 0;
        this.enemiesKilled = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        // Level management
        this.levelConfig = {
            enemiesPerLevel: 10,
            enemySpawnRate: 2000, // milliseconds
            difficultyMultiplier: 1.2
        };
        this.enemiesSpawned = 0;
        this.lastEnemySpawn = 0;
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.touch = { x: 0, y: 0, down: false };
        
        // Screens and UI
        this.camera = { x: 0, y: 0, shake: 0 };
        this.background = { offset: 0, speed: 50 };
        
        // Audio
        this.soundEnabled = true;
        this.musicEnabled = true;
        
        // Mobile support
        this.isMobile = isMobile();
        this.isTouch = isTouch();
        
        // Performance monitoring
        this.performance = {
            drawCalls: 0,
            entities: 0,
            particles: 0
        };
        
        // Game settings
        this.settings = {
            difficulty: 'normal', // easy, normal, hard
            volume: {
                master: 0.5,
                music: 0.7,
                sfx: 0.8
            },
            accessibility: {
                colorblindMode: false,
                reducedMotion: false
            }
        };
        
        this.init();
    }
    
    /**
     * Initialize the game
     */
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadSettings();
        this.showLoadingScreen();
        
        // Start loading assets
        setTimeout(() => {
            this.finishLoading();
        }, 2000); // Simulate loading time
    }
    
    /**
     * Setup canvas and rendering context
     */
    setupCanvas() {
        this.canvas = getElement('game-canvas');
        if (!this.canvas) {
            console.error('Game canvas not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Set canvas properties for crisp rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    /**
     * Resize canvas to fit screen
     */
    resizeCanvas() {
        const pixelRatio = window.devicePixelRatio || 1;
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width * pixelRatio;
        this.canvas.height = this.height * pixelRatio;
        
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.scale(pixelRatio, pixelRatio);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        
        // Window events
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const savedSettings = loadFromStorage('exBattle_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        saveToStorage('exBattle_settings', this.settings);
    }
    
    /**
     * Show loading screen
     */
    showLoadingScreen() {
        showScreen('loading-screen');
    }
    
    /**
     * Finish loading and show main menu
     */
    finishLoading() {
        this.state = 'menu';
        showScreen('main-menu');
        
        // Initialize mobile controls if needed
        if (this.isMobile) {
            this.setupMobileControls();
        }
    }
    
    /**
     * Setup mobile controls
     */
    setupMobileControls() {
        const mobileControls = getElement('mobile-controls');
        if (mobileControls) {
            mobileControls.classList.remove('hidden');
            
            // Setup virtual joystick
            this.setupVirtualJoystick();
            
            // Setup action buttons
            this.setupActionButtons();
        }
    }
    
    /**
     * Setup virtual joystick for mobile
     */
    setupVirtualJoystick() {
        const movementPad = document.querySelector('.movement-pad');
        const stick = document.querySelector('.movement-stick');
        
        if (!movementPad || !stick) return;
        
        let isActive = false;
        let startPos = { x: 0, y: 0 };
        let currentPos = { x: 0, y: 0 };
        
        const handleStart = (e) => {
            isActive = true;
            const rect = movementPad.getBoundingClientRect();
            startPos = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        };
        
        const handleMove = (e) => {
            if (!isActive) return;
            
            const touch = e.touches ? e.touches[0] : e;
            currentPos = { x: touch.clientX, y: touch.clientY };
            
            const dx = currentPos.x - startPos.x;
            const dy = currentPos.y - startPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 40;
            
            if (distance > maxDistance) {
                const angle = Math.atan2(dy, dx);
                currentPos.x = startPos.x + Math.cos(angle) * maxDistance;
                currentPos.y = startPos.y + Math.sin(angle) * maxDistance;
            }
            
            stick.style.transform = `translate(-50%, -50%) translate(${currentPos.x - startPos.x}px, ${currentPos.y - startPos.y}px)`;
            
            // Update movement input
            this.updateVirtualMovement(dx / maxDistance, dy / maxDistance);
        };
        
        const handleEnd = () => {
            isActive = false;
            stick.style.transform = 'translate(-50%, -50%)';
            this.updateVirtualMovement(0, 0);
        };
        
        movementPad.addEventListener('touchstart', handleStart);
        movementPad.addEventListener('touchmove', handleMove);
        movementPad.addEventListener('touchend', handleEnd);
        
        movementPad.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    /**
     * Update virtual movement input
     */
    updateVirtualMovement(x, y) {
        this.virtualInput = { x, y };
    }
    
    /**
     * Setup action buttons for mobile
     */
    setupActionButtons() {
        const attackBtn = document.querySelector('.attack-btn');
        const specialBtn = document.querySelector('.special-btn');
        
        if (attackBtn) {
            attackBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleVirtualAttack();
            });
        }
        
        if (specialBtn) {
            specialBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleVirtualSpecial();
            });
        }
    }
    
    /**
     * Handle virtual attack input
     */
    handleVirtualAttack() {
        if (this.player && this.state === 'playing') {
            this.player.attack();
        }
    }
    
    /**
     * Handle virtual special input
     */
    handleVirtualSpecial() {
        if (this.player && this.state === 'playing') {
            this.player.useSpecialAbility();
        }
    }
    
    /**
     * Start new game
     */
    startGame() {
        this.state = 'playing';
        this.level = 1;
        this.score = 0;
        this.enemiesKilled = 0;
        this.startTime = Date.now();
        this.enemiesSpawned = 0;
        this.lastEnemySpawn = 0;
        
        // Clear all arrays
        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];
        this.particles = [];
        this.effects = [];
        
        // Create player
        this.player = new Player(this.width / 2, this.height / 2);
        
        // Show game screen
        showScreen('game-screen');
        
        // Start game loop
        this.start();
        
        // Update UI
        this.updateHUD();
    }
    
    /**
     * Start game loop
     */
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * Stop game loop
     */
    stop() {
        this.isRunning = false;
    }
    
    /**
     * Pause game
     */
    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
        }
    }
    
    /**
     * Resume game
     */
    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.lastTime = performance.now();
        }
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Cap delta time to prevent spiral of death
        this.deltaTime = Math.min(this.deltaTime, 1/30);
        
        // Update FPS counter
        this.updateFPS();
        
        // Update game state
        if (this.state === 'playing') {
            this.update();
        }
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update FPS counter
     */
    updateFPS() {
        this.frameCount++;
        this.fpsUpdateTime += this.deltaTime;
        
        if (this.fpsUpdateTime >= 1) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = 0;
        }
    }
    
    /**
     * Update game logic
     */
    update() {
        // Update elapsed time
        this.elapsedTime = Date.now() - this.startTime;
        
        // Update player
        if (this.player) {
            this.player.update(this.deltaTime, this);
        }
        
        // Update enemies
        this.updateEnemies();
        
        // Update projectiles
        this.updateProjectiles();
        
        // Update powerups
        this.updatePowerups();
        
        // Update particles
        this.updateParticles();
        
        // Update effects
        this.updateEffects();
        
        // Update camera
        this.updateCamera();
        
        // Update background
        this.updateBackground();
        
        // Spawn enemies
        this.spawnEnemies();
        
        // Check level completion
        this.checkLevelCompletion();
        
        // Update HUD
        this.updateHUD();
        
        // Update performance stats
        this.updatePerformanceStats();
    }
    
    /**
     * Update enemies
     */
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.deltaTime, this);
            
            // Remove dead enemies
            if (enemy.health <= 0) {
                this.onEnemyKilled(enemy);
                this.enemies.splice(i, 1);
            }
        }
    }
    
    /**
     * Update projectiles
     */
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(this.deltaTime, this);
            
            // Remove expired projectiles
            if (projectile.shouldRemove) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    /**
     * Update powerups
     */
    updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.update(this.deltaTime, this);
            
            // Remove collected powerups
            if (powerup.collected) {
                this.powerups.splice(i, 1);
            }
        }
    }
    
    /**
     * Update particles
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const alive = updateParticle(particle, this.deltaTime * 60); // Convert to 60fps equivalent
            
            if (!alive) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Update effects
     */
    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update(this.deltaTime);
            
            if (effect.finished) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    /**
     * Update camera
     */
    updateCamera() {
        // Camera shake
        if (this.camera.shake > 0) {
            this.camera.shake -= this.deltaTime * 5;
            this.camera.shake = Math.max(0, this.camera.shake);
        }
        
        // Follow player
        if (this.player) {
            this.camera.x = lerp(this.camera.x, this.player.x - this.width / 2, this.deltaTime * 2);
            this.camera.y = lerp(this.camera.y, this.player.y - this.height / 2, this.deltaTime * 2);
        }
    }
    
    /**
     * Update background
     */
    updateBackground() {
        this.background.offset += this.background.speed * this.deltaTime;
        if (this.background.offset > 100) {
            this.background.offset = 0;
        }
    }
    
    /**
     * Spawn enemies
     */
    spawnEnemies() {
        const now = Date.now();
        const spawnRate = this.levelConfig.enemySpawnRate / Math.pow(this.levelConfig.difficultyMultiplier, this.level - 1);
        
        if (now - this.lastEnemySpawn > spawnRate && 
            this.enemiesSpawned < this.levelConfig.enemiesPerLevel * this.level) {
            
            this.spawnEnemy();
            this.lastEnemySpawn = now;
            this.enemiesSpawned++;
        }
    }
    
    /**
     * Spawn a single enemy
     */
    spawnEnemy() {
        // Choose spawn position outside screen
        const margin = 100;
        let x, y;
        
        const side = randomInt(0, 3);
        switch (side) {
            case 0: // Top
                x = randomInt(-margin, this.width + margin);
                y = -margin;
                break;
            case 1: // Right
                x = this.width + margin;
                y = randomInt(-margin, this.height + margin);
                break;
            case 2: // Bottom
                x = randomInt(-margin, this.width + margin);
                y = this.height + margin;
                break;
            case 3: // Left
                x = -margin;
                y = randomInt(-margin, this.height + margin);
                break;
        }
        
        // Create enemy (will be implemented in enemy.js)
        if (typeof Enemy !== 'undefined') {
            const enemy = new Enemy(x, y, this.level);
            this.enemies.push(enemy);
        }
    }
    
    /**
     * Check if level is complete
     */
    checkLevelCompletion() {
        if (this.enemiesSpawned >= this.levelConfig.enemiesPerLevel * this.level && 
            this.enemies.length === 0) {
            this.completeLevel();
        }
    }
    
    /**
     * Complete current level
     */
    completeLevel() {
        this.level++;
        this.enemiesSpawned = 0;
        
        // Check for boss level
        if (this.level % 5 === 1 && this.level > 1) {
            this.showBossIntro();
        } else {
            this.showPowerupSelection();
        }
    }
    
    /**
     * Show boss introduction
     */
    showBossIntro() {
        this.state = 'paused';
        showScreen('boss-intro');
        // Boss intro logic will be implemented later
    }
    
    /**
     * Show power-up selection
     */
    showPowerupSelection() {
        this.state = 'paused';
        showScreen('powerup-screen');
        // Powerup selection logic will be implemented in powerups.js
    }
    
    /**
     * Handle enemy killed
     */
    onEnemyKilled(enemy) {
        this.enemiesKilled++;
        this.score += enemy.scoreValue || 100;
        
        // Create particle effect
        this.createDeathEffect(enemy.x, enemy.y);
        
        // Chance to drop powerup
        if (Math.random() < 0.1) { // 10% chance
            this.spawnPowerup(enemy.x, enemy.y);
        }
    }
    
    /**
     * Create death effect
     */
    createDeathEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            const particle = createParticle(
                x + random(-10, 10),
                y + random(-10, 10),
                random(-100, 100),
                random(-100, 100),
                random(1, 2),
                randomChoice(['#ff6b9d', '#a855f7', '#06d6a0']),
                random(2, 5)
            );
            this.particles.push(particle);
        }
    }
    
    /**
     * Spawn powerup
     */
    spawnPowerup(x, y) {
        // Powerup spawning logic will be implemented in powerups.js
        if (typeof Powerup !== 'undefined') {
            const powerup = new Powerup(x, y);
            this.powerups.push(powerup);
        }
    }
    
    /**
     * Update HUD
     */
    updateHUD() {
        const healthFill = document.querySelector('.health-fill');
        const levelSpan = getElement('current-level');
        const scoreSpan = getElement('current-score');
        
        if (healthFill && this.player) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            healthFill.style.width = healthPercent + '%';
        }
        
        if (levelSpan) {
            levelSpan.textContent = this.level;
        }
        
        if (scoreSpan) {
            scoreSpan.textContent = formatNumber(this.score);
        }
    }
    
    /**
     * Update performance statistics
     */
    updatePerformanceStats() {
        this.performance.entities = this.enemies.length + this.projectiles.length + this.powerups.length;
        this.performance.particles = this.particles.length;
    }
    
    /**
     * Render game
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Save context for camera transform
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Apply camera shake
        if (this.camera.shake > 0) {
            const shakeX = (Math.random() - 0.5) * this.camera.shake * 10;
            const shakeY = (Math.random() - 0.5) * this.camera.shake * 10;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Render background
        this.renderBackground();
        
        // Render game objects
        this.renderPowerups();
        this.renderEnemies();
        if (this.player) {
            this.player.render(this.ctx);
        }
        this.renderProjectiles();
        this.renderEffects();
        
        // Restore context
        this.ctx.restore();
        
        // Render particles (no camera transform)
        this.renderParticles();
        
        // Render debug info in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.renderDebugInfo();
        }
    }
    
    /**
     * Render background
     */
    renderBackground() {
        // Animated gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        const offset = this.background.offset / 100;
        
        gradient.addColorStop(0, `hsl(${280 + offset * 20}, 70%, 30%)`);
        gradient.addColorStop(0.5, `hsl(${200 + offset * 30}, 80%, 40%)`);
        gradient.addColorStop(1, `hsl(${160 + offset * 25}, 90%, 45%)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.camera.x - 100, this.camera.y - 100, this.width + 200, this.height + 200);
        
        // Add animated patterns
        this.renderBackgroundPattern();
    }
    
    /**
     * Render background pattern
     */
    renderBackgroundPattern() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.1;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        const offsetX = (this.camera.x + this.background.offset) % gridSize;
        const offsetY = (this.camera.y + this.background.offset * 0.7) % gridSize;
        
        for (let x = -gridSize; x < this.width + gridSize; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - offsetX, this.camera.y);
            this.ctx.lineTo(x - offsetX, this.camera.y + this.height);
            this.ctx.stroke();
        }
        
        for (let y = -gridSize; y < this.height + gridSize; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.camera.x, y - offsetY);
            this.ctx.lineTo(this.camera.x + this.width, y - offsetY);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Render enemies
     */
    renderEnemies() {
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx);
        });
    }
    
    /**
     * Render projectiles
     */
    renderProjectiles() {
        this.projectiles.forEach(projectile => {
            projectile.render(this.ctx);
        });
    }
    
    /**
     * Render powerups
     */
    renderPowerups() {
        this.powerups.forEach(powerup => {
            powerup.render(this.ctx);
        });
    }
    
    /**
     * Render effects
     */
    renderEffects() {
        this.effects.forEach(effect => {
            effect.render(this.ctx);
        });
    }
    
    /**
     * Render particles
     */
    renderParticles() {
        this.particles.forEach(particle => {
            drawParticle(this.ctx, particle);
        });
    }
    
    /**
     * Render debug information
     */
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 120);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        
        let y = 25;
        this.ctx.fillText(`FPS: ${this.fps}`, 15, y); y += 15;
        this.ctx.fillText(`Entities: ${this.performance.entities}`, 15, y); y += 15;
        this.ctx.fillText(`Particles: ${this.performance.particles}`, 15, y); y += 15;
        this.ctx.fillText(`Level: ${this.level}`, 15, y); y += 15;
        this.ctx.fillText(`Score: ${this.score}`, 15, y); y += 15;
        this.ctx.fillText(`State: ${this.state}`, 15, y); y += 15;
        this.ctx.fillText(`Camera: ${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}`, 15, y);
        
        this.ctx.restore();
    }
    
    /**
     * Add camera shake
     */
    addCameraShake(intensity = 1) {
        this.camera.shake = Math.max(this.camera.shake, intensity);
    }
    
    /**
     * Game over
     */
    gameOver() {
        this.state = 'gameOver';
        this.stop();
        
        // Update final stats
        getElement('final-level').textContent = this.level;
        getElement('final-score').textContent = formatNumber(this.score);
        
        showScreen('game-over');
        
        // Save high score
        this.saveHighScore();
    }
    
    /**
     * Victory
     */
    victory() {
        this.state = 'victory';
        this.stop();
        
        // Update victory stats
        getElement('victory-level').textContent = this.level;
        getElement('victory-score').textContent = formatNumber(this.score);
        
        showScreen('victory-screen');
        
        // Save high score
        this.saveHighScore();
    }
    
    /**
     * Save high score
     */
    saveHighScore() {
        const highScores = loadFromStorage('exBattle_highScores', []);
        highScores.push({
            score: this.score,
            level: this.level,
            date: new Date().toISOString(),
            time: this.elapsedTime
        });
        
        // Sort by score and keep top 10
        highScores.sort((a, b) => b.score - a.score);
        highScores.splice(10);
        
        saveToStorage('exBattle_highScores', highScores);
    }
    
    // ===== INPUT HANDLERS =====
    
    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        // Prevent default for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
            e.preventDefault();
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    handleMouseDown(e) {
        this.mouse.down = true;
        this.updateMousePosition(e);
    }
    
    handleMouseUp(e) {
        this.mouse.down = false;
    }
    
    handleMouseMove(e) {
        this.updateMousePosition(e);
    }
    
    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        this.touch.down = true;
        this.updateTouchPosition(e);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.touch.down = false;
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        this.updateTouchPosition(e);
    }
    
    updateTouchPosition(e) {
        if (e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            this.touch.x = e.touches[0].clientX - rect.left;
            this.touch.y = e.touches[0].clientY - rect.top;
        }
    }
    
    /**
     * Check if key is pressed
     */
    isKeyPressed(key) {
        return !!this.keys[key];
    }
    
    /**
     * Get movement input
     */
    getMovementInput() {
        let x = 0;
        let y = 0;
        
        // Keyboard input
        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA')) x -= 1;
        if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD')) x += 1;
        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW')) y -= 1;
        if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS')) y += 1;
        
        // Virtual joystick input
        if (this.virtualInput) {
            x += this.virtualInput.x;
            y += this.virtualInput.y;
        }
        
        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const magnitude = Math.sqrt(x * x + y * y);
            x /= magnitude;
            y /= magnitude;
        }
        
        return { x, y };
    }
    
    /**
     * Check if attack input is pressed
     */
    isAttackPressed() {
        return this.isKeyPressed('Space') || this.mouse.down || this.touch.down;
    }
}

// Create global game instance
let game; 