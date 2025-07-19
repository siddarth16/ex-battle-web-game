/**
 * Main Initialization File for Ex Battle
 * Ties all game systems together and handles overall game flow
 */

// Global game instance
let game;

// Boss configurations for each level
const BOSS_CONFIGS = {
    5: { type: 'toxic', name: 'The Toxic Ex' },
    10: { type: 'clingy', name: 'The Clingy Ex' },
    15: { type: 'ghosting', name: 'The Ghoster' },
    20: { type: 'commitment_phobe', name: 'The Commitment-Phobe' },
    25: { type: 'narcissist', name: 'The Narcissist' }
};

// Tutorial messages
const TUTORIAL_MESSAGES = [
    { level: 1, message: "Use arrow keys or WASD to move around! 🎮" },
    { level: 1, message: "Press spacebar or tap to attack! 💪", delay: 3000 },
    { level: 2, message: "Collect power-ups to get stronger! ✨", delay: 1000 },
    { level: 3, message: "Use Q for Glow Up mode and E to Call Your Bestie! 👯", delay: 2000 },
    { level: 5, message: "Boss incoming! Watch out for attack patterns! 👑", delay: 1000 }
];

/**
 * Initialize the game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

/**
 * Initialize all game systems
 */
async function initializeGame() {
    try {
        console.log('🎮 Initializing Ex Battle...');
        
        // Initialize game instance
        game = new Game();
        
        // Setup global error handling
        setupErrorHandling();
        
        // Setup performance monitoring
        setupPerformanceMonitoring();
        
        // Setup browser compatibility checks
        checkBrowserCompatibility();
        
        // Initialize audio system
        await initializeAudio();
        
        // Setup game event listeners
        setupGameEventListeners();
        
        // Setup powerup selection callbacks
        setupPowerupCallbacks();
        
        // Setup boss battle integration
        setupBossIntegration();
        
        // Setup tutorial system
        setupTutorialSystem();
        
        // Setup achievement system
        setupAchievementSystem();
        
        // Start background music for menu
        audioManager.playContextualMusic('menu');
        
        console.log('✅ Game initialization complete!');
        
    } catch (error) {
        console.error('❌ Game initialization failed:', error);
        showInitializationError(error);
    }
}

/**
 * Initialize audio system with user interaction
 */
async function initializeAudio() {
    // Audio context requires user interaction in modern browsers
    document.addEventListener('click', async () => {
        await audioManager.resume();
    }, { once: true });
    
    document.addEventListener('keydown', async () => {
        await audioManager.resume();
    }, { once: true });
    
    document.addEventListener('touchstart', async () => {
        await audioManager.resume();
    }, { once: true });
}

/**
 * Setup global error handling
 */
function setupErrorHandling() {
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        
        // Don't crash the game for minor errors
        if (game && game.isRunning) {
            // Create error notification
            uiManager.showNotImplemented(`Error: ${event.error.message}. Game continuing...`);
        }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        event.preventDefault(); // Prevent console error
    });
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring() {
    let lastPerformanceCheck = Date.now();
    
    setInterval(() => {
        if (game && game.isRunning) {
            const now = Date.now();
            const timeDiff = now - lastPerformanceCheck;
            
            // Check for performance issues
            if (game.fps < 30 && timeDiff > 5000) { // Low FPS for 5+ seconds
                console.warn('⚠️ Low FPS detected, reducing particle count');
                
                // Reduce particle count
                game.particles = game.particles.slice(0, Math.floor(game.particles.length / 2));
                
                // Reduce enemy particle effects
                game.enemies.forEach(enemy => {
                    enemy.particles = enemy.particles.slice(0, Math.floor(enemy.particles.length / 2));
                });
            }
            
            lastPerformanceCheck = now;
        }
    }, 5000);
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
    const requirements = {
        webGL: () => {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        },
        audioContext: () => !!(window.AudioContext || window.webkitAudioContext),
        localStorage: () => {
            try {
                return 'localStorage' in window && window.localStorage !== null;
            } catch (e) {
                return false;
            }
        },
        requestAnimationFrame: () => !!window.requestAnimationFrame
    };
    
    const missing = [];
    Object.keys(requirements).forEach(feature => {
        if (!requirements[feature]()) {
            missing.push(feature);
        }
    });
    
    if (missing.length > 0) {
        console.warn('⚠️ Missing browser features:', missing);
        uiManager.showNotImplemented(`Your browser may not support all features. Missing: ${missing.join(', ')}`);
    }
}

/**
 * Setup game event listeners for UI integration
 */
function setupGameEventListeners() {
    // Override game methods to integrate with UI
    const originalGameOver = game.gameOver.bind(game);
    game.gameOver = function() {
        originalGameOver();
        uiManager.showGameOver(this.level, this.score);
    };
    
    const originalVictory = game.victory.bind(game);
    game.victory = function() {
        originalVictory();
        uiManager.showVictory(this.level, this.score);
    };
    
    const originalCompleteLevel = game.completeLevel.bind(game);
    game.completeLevel = function() {
        // Check if it's a boss level
        if (BOSS_CONFIGS[this.level + 1]) {
            const bossConfig = BOSS_CONFIGS[this.level + 1];
            uiManager.showBossIntro(bossConfig.name, getBossStory(bossConfig.type));
        } else {
            uiManager.showLevelComplete();
            originalCompleteLevel();
        }
    };
    
    // Setup HUD updates
    const originalUpdateHUD = game.updateHUD.bind(game);
    game.updateHUD = function() {
        originalUpdateHUD();
        
        if (this.player) {
            uiManager.updateHealthBar(this.player.health, this.player.maxHealth);
            uiManager.updateAbilityCooldowns(this.player);
        }
        
        uiManager.updateScore(this.score);
        uiManager.updateLevel(this.level);
    };
}

/**
 * Setup powerup selection callbacks
 */
function setupPowerupCallbacks() {
    powerupSelectionManager.onSelectionComplete = (powerupType) => {
        if (game && game.player) {
            // Create a temporary powerup to apply its effect
            const tempPowerup = new Powerup(0, 0, powerupType);
            tempPowerup.applyEffect(game);
            
            // Continue game
            game.state = 'playing';
        }
    };
}

/**
 * Setup boss battle integration
 */
function setupBossIntegration() {
    // Override boss intro continue button
    const originalContinueToBoss = uiManager.continueToBoss.bind(uiManager);
    uiManager.continueToBoss = function() {
        originalContinueToBoss();
        
        // Spawn the appropriate boss
        const bossConfig = BOSS_CONFIGS[game.level];
        if (bossConfig) {
            spawnBoss(bossConfig);
            audioManager.playContextualMusic('boss');
        }
    };
}

/**
 * Spawn a boss enemy
 */
function spawnBoss(config) {
    if (!game) return;
    
    const centerX = game.width / 2;
    const centerY = game.height / 2;
    
    const boss = new BossEnemy(centerX, centerY - 100, game.level, config.type);
    game.enemies.push(boss);
    
    // Clear regular enemies
    game.enemies = game.enemies.filter(enemy => enemy instanceof BossEnemy);
    
    // Boss intro effects
    game.addCameraShake(2);
    
    // Create dramatic entrance particles
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = random(50, 200);
        const particle = createParticle(
            centerX + Math.cos(angle) * distance,
            centerY + Math.sin(angle) * distance,
            -Math.cos(angle) * 100,
            -Math.sin(angle) * 100,
            random(2, 4),
            boss.color,
            random(5, 10)
        );
        game.particles.push(particle);
    }
}

/**
 * Get boss story text
 */
function getBossStory(bossType) {
    const stories = {
        toxic: "Remember him? The one who made everything about himself and never listened to your feelings. Time to show him what you've learned!",
        clingy: "The one who couldn't give you space and texted you 47 times in a row. Show him what healthy boundaries look like!",
        ghosting: "He disappeared without explanation and then reappeared months later like nothing happened. Time for some closure!",
        commitment_phobe: "Three years of 'I'm not ready for labels' but suddenly he's engaged to someone else. Show him what commitment looks like!",
        narcissist: "Everything was always about him. His problems, his achievements, his feelings. Time to center yourself!"
    };
    
    return stories[bossType] || "An ex from your past has appeared. Time to face the music!";
}

/**
 * Setup tutorial system
 */
function setupTutorialSystem() {
    let shownTutorials = new Set();
    
    // Check for tutorial messages
    setInterval(() => {
        if (!game || game.state !== 'playing') return;
        
        TUTORIAL_MESSAGES.forEach(tutorial => {
            const key = `${tutorial.level}-${tutorial.message}`;
            
            if (game.level === tutorial.level && !shownTutorials.has(key)) {
                setTimeout(() => {
                    if (game.level === tutorial.level) { // Still on same level
                        uiManager.showTutorialTip(tutorial.message);
                        shownTutorials.add(key);
                    }
                }, tutorial.delay || 0);
            }
        });
    }, 1000);
}

/**
 * Setup achievement system
 */
function setupAchievementSystem() {
    const achievements = {
        firstKill: { 
            name: "First Strike", 
            description: "Defeat your first enemy",
            condition: () => game.enemiesKilled >= 1
        },
        speedDemon: {
            name: "Speed Demon",
            description: "Kill 10 enemies in 30 seconds",
            condition: () => checkSpeedKills()
        },
        untouchable: {
            name: "Untouchable",
            description: "Complete a level without taking damage",
            condition: () => checkUntouchedLevel()
        },
        bossSlayer: {
            name: "Boss Slayer",
            description: "Defeat your first boss",
            condition: () => game.level > 5
        },
        levelMaster: {
            name: "Level Master",
            description: "Reach level 10",
            condition: () => game.level >= 10
        }
    };
    
    let unlockedAchievements = new Set(loadFromStorage('exBattle_achievements', []));
    
    // Check achievements periodically
    setInterval(() => {
        if (!game || game.state !== 'playing') return;
        
        Object.keys(achievements).forEach(key => {
            if (!unlockedAchievements.has(key) && achievements[key].condition()) {
                unlockAchievement(key, achievements[key]);
                unlockedAchievements.add(key);
                saveToStorage('exBattle_achievements', Array.from(unlockedAchievements));
            }
        });
    }, 1000);
}

/**
 * Check speed kills achievement
 */
function checkSpeedKills() {
    // This would need to track kill timestamps
    // Simplified for now
    return false;
}

/**
 * Check untouched level achievement
 */
function checkUntouchedLevel() {
    // This would need to track damage taken per level
    // Simplified for now
    return false;
}

/**
 * Unlock an achievement
 */
function unlockAchievement(key, achievement) {
    console.log(`🏆 Achievement unlocked: ${achievement.name}`);
    uiManager.showAchievementUnlocked(achievement);
    audioManager.playSound('achievement_unlock');
}

/**
 * Handle initialization errors
 */
function showInitializationError(error) {
    const errorScreen = document.createElement('div');
    errorScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: var(--gradient-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    errorScreen.innerHTML = `
        <div style="text-align: center; color: white; max-width: 500px; padding: 20px;">
            <h1 style="color: var(--primary-pink); margin-bottom: 20px;">⚠️ Initialization Error</h1>
            <p style="margin-bottom: 20px;">Sorry, there was an error starting the game:</p>
            <p style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; font-family: monospace;">
                ${error.message}
            </p>
            <button onclick="location.reload()" style="
                margin-top: 20px;
                padding: 10px 20px;
                background: var(--gradient-primary);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
            ">
                Reload Page
            </button>
        </div>
    `;
    
    document.body.appendChild(errorScreen);
}

/**
 * Auto-save game progress
 */
function setupAutoSave() {
    setInterval(() => {
        if (game && game.state === 'playing') {
            const gameState = {
                level: game.level,
                score: game.score,
                playerHealth: game.player?.health || 100,
                powerUps: game.player?.powerUps || {},
                timestamp: Date.now()
            };
            
            saveToStorage('exBattle_autoSave', gameState);
        }
    }, 30000); // Auto-save every 30 seconds
}

/**
 * Load saved game progress
 */
function loadSavedGame() {
    const savedGame = loadFromStorage('exBattle_autoSave');
    
    if (savedGame && Date.now() - savedGame.timestamp < 24 * 60 * 60 * 1000) { // Within 24 hours
        // Show continue option
        const continueBtn = document.createElement('button');
        continueBtn.textContent = `Continue (Level ${savedGame.level})`;
        continueBtn.className = 'btn btn-secondary';
        continueBtn.style.marginTop = '10px';
        
        continueBtn.addEventListener('click', () => {
            game.startGame();
            game.level = savedGame.level;
            game.score = savedGame.score;
            if (game.player) {
                game.player.health = savedGame.playerHealth;
                game.player.powerUps = { ...game.player.powerUps, ...savedGame.powerUps };
            }
            continueBtn.remove();
        });
        
        const menuButtons = document.querySelector('.menu-buttons');
        if (menuButtons) {
            menuButtons.appendChild(continueBtn);
        }
    }
}

// Initialize auto-save and load saved game
setupAutoSave();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadSavedGame, 1000); // Load after UI is ready
});

// Handle page visibility changes (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (game) {
        if (document.hidden) {
            game.pause();
        } else {
            game.resume();
        }
    }
});

// Handle window focus/blur
window.addEventListener('blur', () => {
    if (game) game.pause();
});

window.addEventListener('focus', () => {
    if (game && game.state === 'paused') game.resume();
});

// Export for debugging
window.game = game;
window.audioManager = audioManager;
window.uiManager = uiManager;

console.log('🎮 Ex Battle - Level Up Your Life! 💅✨');
console.log('Ready to take on your past? Let\'s go!');

// Development helpers (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.devTools = {
        skipToLevel: (level) => {
            if (game) {
                game.level = level;
                console.log(`Skipped to level ${level}`);
            }
        },
        addScore: (amount) => {
            if (game) {
                game.score += amount;
                console.log(`Added ${amount} score`);
            }
        },
        godMode: () => {
            if (game && game.player) {
                game.player.invulnerable = true;
                game.player.health = 999;
                console.log('God mode activated');
            }
        },
        spawnPowerup: (type = 'health') => {
            if (game && game.player) {
                const powerup = new Powerup(game.player.x + 50, game.player.y, type);
                game.powerups.push(powerup);
                console.log(`Spawned ${type} powerup`);
            }
        }
    };
    
    console.log('🛠️ Development tools available: window.devTools');
} 