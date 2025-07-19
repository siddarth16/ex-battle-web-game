/**
 * UI Management System for Ex Battle
 * Handles screen transitions, button interactions, settings, and HUD updates
 */

class UIManager {
    constructor() {
        this.currentScreen = 'loading-screen';
        this.isInitialized = false;
        this.settingsOpen = false;
        
        // Button sound effects
        this.soundEnabled = true;
        
        // Mobile detection
        this.isMobile = isMobile();
        
        // Settings values
        this.settings = {
            masterVolume: 50,
            musicVolume: 70,
            sfxVolume: 80,
            colorblindMode: false,
            reducedMotion: false
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateVolumeDisplays();
        this.isInitialized = true;
    }
    
    setupEventListeners() {
        // Main menu buttons
        this.addButtonListener('start-game', () => {
            this.startGame();
        });
        
        this.addButtonListener('customize', () => {
            this.showCustomization();
        });
        
        this.addButtonListener('achievements', () => {
            this.showAchievements();
        });
        
        this.addButtonListener('settings', () => {
            this.openSettings();
        });
        
        // Game over buttons
        this.addButtonListener('restart-game', () => {
            this.restartGame();
        });
        
        this.addButtonListener('back-to-menu', () => {
            this.backToMenu();
        });
        
        // Victory screen buttons
        this.addButtonListener('new-game-plus', () => {
            this.startNewGamePlus();
        });
        
        // Boss intro button
        this.addButtonListener('boss-continue', () => {
            this.continueToBoss();
        });
        
        // Settings modal
        this.setupSettingsModal();
        
        // Volume sliders
        this.setupVolumeSliders();
        
        // Accessibility options
        this.setupAccessibilityOptions();
        
        // Ability buttons
        this.setupAbilityButtons();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    addButtonListener(id, callback) {
        const button = getElement(id);
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.soundEnabled) {
                    audioManager.playUISound('click');
                }
                callback();
            });
            
            // Add hover effect
            button.addEventListener('mouseenter', () => {
                if (this.soundEnabled) {
                    audioManager.playUISound('hover');
                }
                button.classList.add('glow-effect');
            });
            
            button.addEventListener('mouseleave', () => {
                button.classList.remove('glow-effect');
            });
        }
    }
    
    setupSettingsModal() {
        const settingsModal = getElement('settings-modal');
        const closeBtn = settingsModal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSettings();
            });
        }
        
        // Close on outside click
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettings();
                }
            });
        }
    }
    
    setupVolumeSliders() {
        const sliders = {
            'master-volume': (value) => {
                this.settings.masterVolume = value;
                audioManager.setMasterVolume(value / 100);
            },
            'music-volume': (value) => {
                this.settings.musicVolume = value;
                audioManager.setMusicVolume(value / 100);
            },
            'sfx-volume': (value) => {
                this.settings.sfxVolume = value;
                audioManager.setSfxVolume(value / 100);
            }
        };
        
        Object.keys(sliders).forEach(id => {
            const slider = getElement(id);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    sliders[id](value);
                    this.saveSettings();
                });
            }
        });
    }
    
    setupAccessibilityOptions() {
        const colorblindCheckbox = getElement('colorblind-mode');
        const reducedMotionCheckbox = getElement('reduced-motion');
        
        if (colorblindCheckbox) {
            colorblindCheckbox.addEventListener('change', (e) => {
                this.settings.colorblindMode = e.target.checked;
                this.applyColorblindMode(e.target.checked);
                this.saveSettings();
            });
        }
        
        if (reducedMotionCheckbox) {
            reducedMotionCheckbox.addEventListener('change', (e) => {
                this.settings.reducedMotion = e.target.checked;
                this.applyReducedMotion(e.target.checked);
                this.saveSettings();
            });
        }
    }
    
    setupAbilityButtons() {
        const glowUpBtn = getElement('glow-up-btn');
        const callBestieBtn = getElement('call-bestie-btn');
        
        if (glowUpBtn) {
            glowUpBtn.addEventListener('click', () => {
                if (game && game.player) {
                    game.player.useGlowUp(game);
                }
            });
        }
        
        if (callBestieBtn) {
            callBestieBtn.addEventListener('click', () => {
                if (game && game.player) {
                    game.player.useCallBestie(game);
                }
            });
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Escape':
                    if (this.settingsOpen) {
                        this.closeSettings();
                    } else if (game && game.state === 'playing') {
                        game.pause();
                    }
                    break;
                    
                case 'KeyP':
                    if (game && (game.state === 'playing' || game.state === 'paused')) {
                        game.state === 'playing' ? game.pause() : game.resume();
                    }
                    break;
                    
                case 'KeyM':
                    this.toggleMute();
                    break;
            }
        });
    }
    
    startGame() {
        if (game) {
            game.startGame();
            audioManager.playContextualMusic('gameplay', 1);
        }
    }
    
    restartGame() {
        if (game) {
            game.startGame();
        }
    }
    
    backToMenu() {
        showScreen('main-menu');
        audioManager.playContextualMusic('menu');
        if (game) {
            game.state = 'menu';
        }
    }
    
    startNewGamePlus() {
        // Start game with bonuses from previous run
        if (game) {
            game.startGame();
            // Add bonus stats or items here
            game.player.powerUps.damageBoost += 2;
            game.player.powerUps.speedBoost += 1;
        }
    }
    
    continueToBoss() {
        hideScreen('boss-intro');
        if (game) {
            game.state = 'playing';
        }
    }
    
    showCustomization() {
        // Placeholder for future customization screen
        this.showNotImplemented('Character customization coming soon!');
    }
    
    showAchievements() {
        // Placeholder for future achievements screen
        this.showNotImplemented('Achievements coming soon!');
    }
    
    showNotImplemented(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 107, 157, 0.9);
            color: white;
            padding: 20px;
            border-radius: 12px;
            font-size: 18px;
            z-index: 2000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
    
    openSettings() {
        this.settingsOpen = true;
        const modal = getElement('settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    closeSettings() {
        this.settingsOpen = false;
        const modal = getElement('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    loadSettings() {
        const saved = loadFromStorage('exBattle_uiSettings', {});
        this.settings = { ...this.settings, ...saved };
        
        // Apply loaded settings
        audioManager.setMasterVolume(this.settings.masterVolume / 100);
        audioManager.setMusicVolume(this.settings.musicVolume / 100);
        audioManager.setSfxVolume(this.settings.sfxVolume / 100);
        
        this.applyColorblindMode(this.settings.colorblindMode);
        this.applyReducedMotion(this.settings.reducedMotion);
    }
    
    saveSettings() {
        saveToStorage('exBattle_uiSettings', this.settings);
    }
    
    updateVolumeDisplays() {
        const sliders = {
            'master-volume': this.settings.masterVolume,
            'music-volume': this.settings.musicVolume,
            'sfx-volume': this.settings.sfxVolume
        };
        
        Object.keys(sliders).forEach(id => {
            const slider = getElement(id);
            if (slider) {
                slider.value = sliders[id];
            }
        });
        
        const checkboxes = {
            'colorblind-mode': this.settings.colorblindMode,
            'reduced-motion': this.settings.reducedMotion
        };
        
        Object.keys(checkboxes).forEach(id => {
            const checkbox = getElement(id);
            if (checkbox) {
                checkbox.checked = checkboxes[id];
            }
        });
    }
    
    applyColorblindMode(enabled) {
        if (enabled) {
            document.body.classList.add('colorblind-mode');
        } else {
            document.body.classList.remove('colorblind-mode');
        }
    }
    
    applyReducedMotion(enabled) {
        if (enabled) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
    }
    
    toggleMute() {
        const currentVolume = audioManager.getVolumes().master;
        if (currentVolume > 0) {
            this.previousVolume = currentVolume;
            audioManager.setMasterVolume(0);
        } else {
            audioManager.setMasterVolume(this.previousVolume || 0.5);
        }
    }
    
    updateHealthBar(health, maxHealth) {
        const healthFill = document.querySelector('.health-fill');
        if (healthFill) {
            const percentage = (health / maxHealth) * 100;
            healthFill.style.width = percentage + '%';
            
            // Color coding
            if (percentage > 60) {
                healthFill.style.background = 'var(--gradient-accent)';
            } else if (percentage > 30) {
                healthFill.style.background = 'linear-gradient(135deg, #ffd23f, #ff7f51)';
            } else {
                healthFill.style.background = 'linear-gradient(135deg, #ff4757, #ff6b9d)';
            }
        }
    }
    
    updateScore(score) {
        const scoreElement = getElement('current-score');
        if (scoreElement) {
            scoreElement.textContent = formatNumber(score);
            
            // Animate score increase
            addTempClass(scoreElement, 'bounce-in', 500);
        }
    }
    
    updateLevel(level) {
        const levelElement = getElement('current-level');
        if (levelElement) {
            levelElement.textContent = level;
            
            // Animate level change
            addTempClass(levelElement, 'glow-effect', 1000);
        }
    }
    
    updateAbilityCooldowns(player) {
        const glowUpBtn = getElement('glow-up-btn');
        const callBestieBtn = getElement('call-bestie-btn');
        
        if (glowUpBtn && player) {
            const cooldown = player.getAbilityCooldown('glowUp');
            if (cooldown < 1) {
                glowUpBtn.classList.add('cooldown');
                glowUpBtn.style.opacity = 0.5 + (cooldown * 0.5);
            } else {
                glowUpBtn.classList.remove('cooldown');
                glowUpBtn.style.opacity = 1;
            }
        }
        
        if (callBestieBtn && player) {
            const cooldown = player.getAbilityCooldown('callBestie');
            if (cooldown < 1) {
                callBestieBtn.classList.add('cooldown');
                callBestieBtn.style.opacity = 0.5 + (cooldown * 0.5);
            } else {
                callBestieBtn.classList.remove('cooldown');
                callBestieBtn.style.opacity = 1;
            }
        }
    }
    
    showBossIntro(bossName, bossStory) {
        const nameElement = getElement('boss-name');
        const storyElement = getElement('boss-story');
        
        if (nameElement) nameElement.textContent = bossName;
        if (storyElement) storyElement.innerHTML = `<p>${bossStory}</p>`;
        
        showScreen('boss-intro');
    }
    
    showGameOver(level, score) {
        const levelElement = getElement('final-level');
        const scoreElement = getElement('final-score');
        
        if (levelElement) levelElement.textContent = level;
        if (scoreElement) scoreElement.textContent = formatNumber(score);
        
        showScreen('game-over');
        audioManager.playContextualMusic('gameover');
    }
    
    showVictory(level, score) {
        const levelElement = getElement('victory-level');
        const scoreElement = getElement('victory-score');
        
        if (levelElement) levelElement.textContent = level;
        if (scoreElement) scoreElement.textContent = formatNumber(score);
        
        showScreen('victory-screen');
        audioManager.playContextualMusic('victory');
    }
    
    showLevelComplete() {
        // Create level complete animation
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(255, 107, 157, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1500;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const message = document.createElement('div');
        message.style.cssText = `
            background: var(--gradient-primary);
            color: white;
            padding: 30px;
            border-radius: 16px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            animation: bounceIn 0.6s ease-out;
        `;
        message.textContent = 'Level Complete! ✨';
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);
        
        audioManager.playSound('level_complete');
        
        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        }, 1500);
    }
    
    createFloatingText(x, y, text, color = '#ffffff', duration = 2) {
        // This would be called from the game to show floating damage/score text
        const textElement = document.createElement('div');
        textElement.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-size: 18px;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: floatUp ${duration}s ease-out forwards;
        `;
        textElement.textContent = text;
        
        document.body.appendChild(textElement);
        
        setTimeout(() => {
            if (document.body.contains(textElement)) {
                document.body.removeChild(textElement);
            }
        }, duration * 1000);
    }
    
    showTutorialTip(text, duration = 3000) {
        const tip = document.createElement('div');
        tip.className = 'tutorial-tip';
        tip.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(26, 26, 46, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            font-size: 16px;
            z-index: 1500;
            max-width: 400px;
            text-align: center;
            border: 2px solid var(--primary-pink);
            animation: slideUp 0.3s ease-out;
        `;
        tip.textContent = text;
        
        document.body.appendChild(tip);
        
        setTimeout(() => {
            tip.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(tip)) {
                    document.body.removeChild(tip);
                }
            }, 300);
        }, duration);
    }
    
    // Mobile-specific UI methods
    showMobileControls() {
        const mobileControls = getElement('mobile-controls');
        if (mobileControls && this.isMobile) {
            mobileControls.classList.remove('hidden');
        }
    }
    
    hideMobileControls() {
        const mobileControls = getElement('mobile-controls');
        if (mobileControls) {
            mobileControls.classList.add('hidden');
        }
    }
    
    // Achievement notification
    showAchievementUnlocked(achievement) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--gradient-accent);
            color: white;
            padding: 20px;
            border-radius: 12px;
            font-size: 16px;
            z-index: 2000;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">🏆 Achievement Unlocked!</div>
            <div>${achievement.name}</div>
            <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">${achievement.description}</div>
        `;
        
        document.body.appendChild(notification);
        
        audioManager.playSound('achievement_unlock');
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Add CSS animations for UI effects
const uiStyles = document.createElement('style');
uiStyles.textContent = `
    @keyframes floatUp {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-50px); opacity: 0; }
    }
    
    @keyframes slideUp {
        0% { transform: translateX(-50%) translateY(20px); opacity: 0; }
        100% { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideDown {
        0% { transform: translateX(-50%) translateY(0); opacity: 1; }
        100% { transform: translateX(-50%) translateY(20px); opacity: 0; }
    }
    
    @keyframes slideInRight {
        0% { transform: translateX(100%); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        0% { transform: translateX(0); opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
    }
    
    .colorblind-mode {
        filter: contrast(1.2) brightness(1.1);
    }
    
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
`;
document.head.appendChild(uiStyles);

// Create global UI manager instance
const uiManager = new UIManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} 