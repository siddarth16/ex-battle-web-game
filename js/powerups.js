/**
 * Power-ups System for Ex Battle
 * Handles collectibles, temporary upgrades, and power-up selection screen management
 */

class Powerup {
    constructor(x, y, type = null) {
        this.x = x;
        this.y = y;
        this.type = type || this.getRandomType();
        this.collected = false;
        
        // Visual properties
        this.radius = 15;
        this.color = this.getTypeColor();
        this.icon = this.getTypeIcon();
        this.scale = 1;
        this.rotation = 0;
        this.floatOffset = 0;
        this.glowIntensity = 0;
        
        // Animation
        this.animationTime = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        // Particle effects
        this.particles = [];
        this.lastParticleTime = 0;
        
        // Collection properties
        this.magnetRange = 60;
        this.magnetForce = 300;
        this.vx = 0;
        this.vy = 0;
        
        // Lifetime
        this.maxLifetime = 15; // 15 seconds before disappearing
        this.lifetime = this.maxLifetime;
        this.blinkTime = 3; // Start blinking in last 3 seconds
        
        this.init();
    }
    
    init() {
        // Set up type-specific properties
        const config = this.getTypeConfig();
        this.name = config.name;
        this.description = config.description;
        this.effect = config.effect;
        this.rarity = config.rarity;
        this.value = config.value;
    }
    
    getRandomType() {
        const types = [
            'health',
            'speed',
            'damage',
            'attackSpeed',
            'shield',
            'magnet',
            'multishot',
            'freezeTime',
            'confidence',
            'selfLove',
            'redFlag'
        ];
        
        // Weighted random selection based on rarity
        const weights = {
            'health': 25,
            'speed': 20,
            'damage': 20,
            'attackSpeed': 15,
            'shield': 10,
            'magnet': 15,
            'multishot': 8,
            'freezeTime': 5,
            'confidence': 12,
            'selfLove': 8,
            'redFlag': 2
        };
        
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const type of types) {
            random -= weights[type];
            if (random <= 0) {
                return type;
            }
        }
        
        return 'health'; // Fallback
    }
    
    getTypeConfig() {
        const configs = {
            health: {
                name: "Self-Care Heart",
                description: "Restore health and boost max health",
                effect: { type: 'heal', amount: 30, maxHealthBoost: 10 },
                rarity: 'common',
                value: 50
            },
            speed: {
                name: "Lightning Heels",
                description: "Increased movement speed",
                effect: { type: 'stat', stat: 'speed', multiplier: 1.3, duration: 10 },
                rarity: 'common',
                value: 75
            },
            damage: {
                name: "Confidence Boost",
                description: "Increased attack damage",
                effect: { type: 'stat', stat: 'damage', multiplier: 1.5, duration: 15 },
                rarity: 'common',
                value: 100
            },
            attackSpeed: {
                name: "Quick Wit",
                description: "Faster attack speed",
                effect: { type: 'stat', stat: 'attackSpeed', multiplier: 1.4, duration: 12 },
                rarity: 'common',
                value: 80
            },
            shield: {
                name: "Protective Aura",
                description: "Temporary invulnerability shield",
                effect: { type: 'shield', duration: 5 },
                rarity: 'uncommon',
                value: 150
            },
            magnet: {
                name: "Charisma Field",
                description: "Attract nearby powerups",
                effect: { type: 'magnet', range: 150, duration: 20 },
                rarity: 'uncommon',
                value: 120
            },
            multishot: {
                name: "Multitasking Master",
                description: "Attacks hit multiple targets",
                effect: { type: 'multishot', count: 3, duration: 10 },
                rarity: 'rare',
                value: 200
            },
            freezeTime: {
                name: "Time Out",
                description: "Slow down all enemies",
                effect: { type: 'timeFreeze', slowFactor: 0.3, duration: 8 },
                rarity: 'rare',
                value: 250
            },
            confidence: {
                name: "Confidence Star",
                description: "Boost all stats temporarily",
                effect: { type: 'allStats', multiplier: 1.2, duration: 15 },
                rarity: 'uncommon',
                value: 180
            },
            selfLove: {
                name: "Self-Love Heart",
                description: "Gradual health regeneration",
                effect: { type: 'regeneration', rate: 5, duration: 30 },
                rarity: 'uncommon',
                value: 160
            },
            redFlag: {
                name: "Red Flag Detector",
                description: "Enemies take damage when approaching",
                effect: { type: 'aura', damage: 10, range: 80, duration: 20 },
                rarity: 'legendary',
                value: 500
            }
        };
        
        return configs[this.type] || configs.health;
    }
    
    getTypeColor() {
        const colors = {
            health: '#00ff88',
            speed: '#00d4ff',
            damage: '#ff6b9d',
            attackSpeed: '#ffd23f',
            shield: '#a855f7',
            magnet: '#06d6a0',
            multishot: '#ff7f51',
            freezeTime: '#87ceeb',
            confidence: '#ffd700',
            selfLove: '#ff69b4',
            redFlag: '#ff4757'
        };
        
        return colors[this.type] || '#ffffff';
    }
    
    getTypeIcon() {
        const icons = {
            health: '💖',
            speed: '⚡',
            damage: '💪',
            attackSpeed: '🏃',
            shield: '🛡️',
            magnet: '🧲',
            multishot: '🎯',
            freezeTime: '⏰',
            confidence: '⭐',
            selfLove: '❤️',
            redFlag: '🚩'
        };
        
        return icons[this.type] || '✨';
    }
    
    update(deltaTime, game) {
        this.animationTime += deltaTime;
        this.lifetime -= deltaTime;
        
        // Check if expired
        if (this.lifetime <= 0) {
            this.collected = true; // Mark for removal
            return;
        }
        
        // Update animations
        this.updateAnimations(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Check for player collection
        this.checkCollection(game);
        
        // Update magnet effect
        this.updateMagnetism(game, deltaTime);
    }
    
    updateAnimations(deltaTime) {
        // Floating animation
        this.floatOffset = Math.sin(this.animationTime * 3 + this.pulsePhase) * 5;
        
        // Rotation
        this.rotation += deltaTime * 2;
        
        // Pulsing scale
        this.scale = 1 + Math.sin(this.animationTime * 4 + this.pulsePhase) * 0.1;
        
        // Glow intensity
        this.glowIntensity = 0.5 + 0.5 * Math.sin(this.animationTime * 6 + this.pulsePhase);
        
        // Blinking when about to expire
        if (this.lifetime <= this.blinkTime) {
            this.glowIntensity *= (this.lifetime % 0.5 < 0.25) ? 1 : 0.3;
        }
    }
    
    updateParticles(deltaTime) {
        const now = Date.now();
        
        // Create ambient particles
        if (now - this.lastParticleTime > 200) { // Every 200ms
            this.createAmbientParticles();
            this.lastParticleTime = now;
        }
        
        // Update existing particles
        this.particles = this.particles.filter(particle => 
            updateParticle(particle, deltaTime * 60)
        );
    }
    
    createAmbientParticles() {
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.radius + Math.random() * 20;
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            
            const particle = createParticle(
                x, y,
                Math.cos(angle) * 20,
                Math.sin(angle) * 20,
                1,
                this.color,
                random(2, 4)
            );
            particle.gravity = 0;
            this.particles.push(particle);
        }
    }
    
    checkCollection(game) {
        if (!game.player) return;
        
        const dist = distance(this.x, this.y, game.player.x, game.player.y);
        if (dist <= this.radius + game.player.radius) {
            this.collect(game);
        }
    }
    
    updateMagnetism(game, deltaTime) {
        if (!game.player) return;
        
        const dist = distance(this.x, this.y, game.player.x, game.player.y);
        if (dist <= this.magnetRange) {
            const angle = angleBetween(this.x, this.y, game.player.x, game.player.y);
            const force = this.magnetForce * (1 - dist / this.magnetRange);
            
            this.vx += Math.cos(angle) * force * deltaTime;
            this.vy += Math.sin(angle) * force * deltaTime;
            
            // Apply movement
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            
            // Apply friction
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
    }
    
    collect(game) {
        if (this.collected) return;
        
        this.collected = true;
        
        // Apply effect
        this.applyEffect(game);
        
        // Create collection particles
        this.createCollectionEffect(game);
        
        // Play sound
        audioManager.playSound('powerup_collect');
        
        // Show collection message
        this.showCollectionMessage(game);
        
        // Update score
        game.score += this.value;
    }
    
    applyEffect(game) {
        const player = game.player;
        const effect = this.effect;
        
        switch (effect.type) {
            case 'heal':
                player.heal(effect.amount);
                if (effect.maxHealthBoost) {
                    player.maxHealth += effect.maxHealthBoost;
                    player.health = Math.min(player.health + effect.maxHealthBoost, player.maxHealth);
                }
                break;
                
            case 'stat':
                this.applyStatEffect(player, effect);
                break;
                
            case 'shield':
                this.applyShieldEffect(player, effect);
                break;
                
            case 'magnet':
                this.applyMagnetEffect(game, effect);
                break;
                
            case 'multishot':
                this.applyMultishotEffect(player, effect);
                break;
                
            case 'timeFreeze':
                this.applyTimeFreezeEffect(game, effect);
                break;
                
            case 'allStats':
                this.applyAllStatsEffect(player, effect);
                break;
                
            case 'regeneration':
                this.applyRegenerationEffect(player, effect);
                break;
                
            case 'aura':
                this.applyAuraEffect(player, effect);
                break;
        }
    }
    
    applyStatEffect(player, effect) {
        const originalValue = player[effect.stat];
        player[effect.stat] *= effect.multiplier;
        
        // Set timer to revert effect
        setTimeout(() => {
            player[effect.stat] = originalValue;
        }, effect.duration * 1000);
    }
    
    applyShieldEffect(player, effect) {
        player.invulnerable = true;
        
        setTimeout(() => {
            player.invulnerable = false;
        }, effect.duration * 1000);
    }
    
    applyMagnetEffect(game, effect) {
        // Increase magnet range for all powerups
        game.powerups.forEach(powerup => {
            powerup.magnetRange = Math.max(powerup.magnetRange, effect.range);
        });
        
        setTimeout(() => {
            game.powerups.forEach(powerup => {
                powerup.magnetRange = 60; // Reset to default
            });
        }, effect.duration * 1000);
    }
    
    applyMultishotEffect(player, effect) {
        const originalAttack = player.attack.bind(player);
        
        player.attack = function(game) {
            for (let i = 0; i < effect.count; i++) {
                const angle = (i - (effect.count - 1) / 2) * 0.3;
                // Create multiple projectiles with different angles
                originalAttack.call(this, game, angle);
            }
        };
        
        setTimeout(() => {
            player.attack = originalAttack;
        }, effect.duration * 1000);
    }
    
    applyTimeFreezeEffect(game, effect) {
        // Slow down all enemies
        game.enemies.forEach(enemy => {
            enemy.speed *= effect.slowFactor;
        });
        
        setTimeout(() => {
            game.enemies.forEach(enemy => {
                enemy.speed /= effect.slowFactor;
            });
        }, effect.duration * 1000);
    }
    
    applyAllStatsEffect(player, effect) {
        const originalSpeed = player.speed;
        const originalAttackDamage = player.attackStyles[player.currentAttackStyle].damage;
        
        player.speed *= effect.multiplier;
        player.attackStyles.forEach(style => {
            style.damage *= effect.multiplier;
        });
        
        setTimeout(() => {
            player.speed = originalSpeed;
            player.attackStyles.forEach(style => {
                style.damage /= effect.multiplier;
            });
        }, effect.duration * 1000);
    }
    
    applyRegenerationEffect(player, effect) {
        const interval = setInterval(() => {
            if (player.health < player.maxHealth) {
                player.heal(effect.rate);
            }
        }, 1000);
        
        setTimeout(() => {
            clearInterval(interval);
        }, effect.duration * 1000);
    }
    
    applyAuraEffect(player, effect) {
        const auraEffect = {
            x: player.x,
            y: player.y,
            range: effect.range,
            damage: effect.damage,
            lastDamageTime: 0,
            lifetime: effect.duration,
            
            update: function(deltaTime, game) {
                this.x = game.player.x;
                this.y = game.player.y;
                this.lifetime -= deltaTime;
                
                const now = Date.now();
                if (now - this.lastDamageTime > 500) { // Damage every 500ms
                    game.enemies.forEach(enemy => {
                        const dist = distance(this.x, this.y, enemy.x, enemy.y);
                        if (dist <= this.range) {
                            enemy.takeDamage(this.damage);
                        }
                    });
                    this.lastDamageTime = now;
                }
                
                return this.lifetime > 0;
            },
            
            render: function(ctx) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = '#ff4757';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        game.effects.push(auraEffect);
    }
    
    createCollectionEffect(game) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = random(100, 250);
            const particle = createParticle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                random(0.8, 1.5),
                this.color,
                random(4, 8)
            );
            game.particles.push(particle);
        }
    }
    
    showCollectionMessage(game) {
        const message = {
            x: this.x,
            y: this.y - 30,
            text: this.name,
            life: 2,
            opacity: 1,
            color: this.color,
            
            update: function(deltaTime) {
                this.life -= deltaTime;
                this.y -= 50 * deltaTime;
                this.opacity = this.life / 2;
                return this.life > 0;
            },
            
            render: function(ctx) {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                
                ctx.strokeText(this.text, this.x, this.y);
                ctx.fillText(this.text, this.x, this.y);
                ctx.restore();
            }
        };
        
        game.effects.push(message);
    }
    
    render(ctx) {
        ctx.save();
        
        // Apply position and transformations
        ctx.translate(this.x, this.y + this.floatOffset);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 * this.glowIntensity;
        
        // Main body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#000000';
        ctx.font = `${this.radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 2);
        
        ctx.restore();
        
        // Render particles
        this.particles.forEach(particle => {
            drawParticle(ctx, particle);
        });
    }
}

// Power-up Selection Screen Manager
class PowerupSelectionManager {
    constructor() {
        this.isActive = false;
        this.selectedPowerups = [];
        this.onSelectionComplete = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Power-up option click handlers
        document.querySelectorAll('.powerup-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const powerupType = e.target.dataset.powerup;
                this.selectPowerup(powerupType);
            });
        });
    }
    
    show(callback) {
        this.isActive = true;
        this.onSelectionComplete = callback;
        this.generateRandomOptions();
        showScreen('powerup-screen');
    }
    
    hide() {
        this.isActive = false;
        hideScreen('powerup-screen');
    }
    
    generateRandomOptions() {
        const powerupTypes = [
            'speed', 'damage', 'health', 'attackSpeed', 'shield',
            'magnet', 'multishot', 'confidence', 'selfLove'
        ];
        
        // Select 3 random powerups
        const options = [];
        const usedTypes = new Set();
        
        while (options.length < 3) {
            const type = randomChoice(powerupTypes);
            if (!usedTypes.has(type)) {
                usedTypes.add(type);
                options.push(this.createPowerupOption(type));
            }
        }
        
        // Update UI
        const optionElements = document.querySelectorAll('.powerup-option');
        optionElements.forEach((element, index) => {
            if (options[index]) {
                const option = options[index];
                element.dataset.powerup = option.type;
                element.querySelector('h3').textContent = option.name;
                element.querySelector('p').textContent = option.description;
                element.style.backgroundColor = option.color + '33'; // Add transparency
                element.style.borderColor = option.color;
            }
        });
    }
    
    createPowerupOption(type) {
        const tempPowerup = new Powerup(0, 0, type);
        return {
            type: type,
            name: tempPowerup.name,
            description: tempPowerup.description,
            color: tempPowerup.color,
            effect: tempPowerup.effect
        };
    }
    
    selectPowerup(type) {
        if (!this.isActive) return;
        
        // Apply the powerup effect to the player
        if (this.onSelectionComplete) {
            this.onSelectionComplete(type);
        }
        
        // Play selection sound
        audioManager.playSound('powerup_collect');
        
        // Hide screen
        this.hide();
    }
}

// Collectible items that appear during gameplay
class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'selfLove', 'confidence', 'redFlag'
        this.collected = false;
        
        this.radius = 12;
        this.color = this.getTypeColor();
        this.icon = this.getTypeIcon();
        this.value = this.getTypeValue();
        
        this.animationTime = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.sparkleTime = 0;
        
        this.magnetRange = 50;
        this.vx = 0;
        this.vy = 0;
    }
    
    getTypeColor() {
        const colors = {
            selfLove: '#ff69b4',
            confidence: '#ffd700',
            redFlag: '#ff4757'
        };
        return colors[this.type] || '#ffffff';
    }
    
    getTypeIcon() {
        const icons = {
            selfLove: '💖',
            confidence: '⭐',
            redFlag: '🚩'
        };
        return icons[this.type] || '✨';
    }
    
    getTypeValue() {
        const values = {
            selfLove: 25,
            confidence: 50,
            redFlag: 100
        };
        return values[this.type] || 10;
    }
    
    update(deltaTime, game) {
        this.animationTime += deltaTime;
        this.sparkleTime += deltaTime;
        
        // Bobbing animation
        this.y += Math.sin(this.animationTime * 3 + this.bobOffset) * 20 * deltaTime;
        
        // Check collection
        if (game.player) {
            const dist = distance(this.x, this.y, game.player.x, game.player.y);
            
            if (dist <= this.magnetRange) {
                // Move towards player
                const angle = angleBetween(this.x, this.y, game.player.x, game.player.y);
                this.vx += Math.cos(angle) * 200 * deltaTime;
                this.vy += Math.sin(angle) * 200 * deltaTime;
                
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
                
                this.vx *= 0.9;
                this.vy *= 0.9;
            }
            
            if (dist <= this.radius + game.player.radius) {
                this.collect(game);
            }
        }
    }
    
    collect(game) {
        if (this.collected) return;
        
        this.collected = true;
        game.score += this.value;
        
        // Type-specific effects
        switch (this.type) {
            case 'selfLove':
                game.player.heal(15);
                break;
            case 'confidence':
                game.player.powerUps.damageBoost += 1;
                break;
            case 'redFlag':
                // Special effect - reveal enemy weak points
                game.enemies.forEach(enemy => {
                    enemy.weakened = true;
                    setTimeout(() => {
                        enemy.weakened = false;
                    }, 5000);
                });
                break;
        }
        
        // Create collection effect
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = createParticle(
                this.x, this.y,
                Math.cos(angle) * 150,
                Math.sin(angle) * 150,
                1,
                this.color,
                random(3, 6)
            );
            game.particles.push(particle);
        }
        
        audioManager.playSound('powerup_collect', 0.8, 1.2);
    }
    
    render(ctx) {
        if (this.collected) return;
        
        ctx.save();
        
        // Sparkle effect
        if (this.sparkleTime % 1 < 0.1) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
        }
        
        // Main body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.font = `${this.radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y + 2);
        
        ctx.restore();
    }
}

// Global power-up selection manager
const powerupSelectionManager = new PowerupSelectionManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Powerup, PowerupSelectionManager, Collectible };
} 