/**
 * Player Character for Ex Battle
 * Handles player movement, attacks, abilities, and rendering
 */

class Player {
    constructor(x, y) {
        // Position and movement
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = 300; // pixels per second
        this.friction = 0.85;
        this.acceleration = 1200;
        
        // Physical properties
        this.radius = 20;
        this.health = 100;
        this.maxHealth = 100;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.invulnerabilityDuration = 1.5; // seconds
        
        // Visual properties
        this.angle = 0;
        this.targetAngle = 0;
        this.scale = 1;
        this.color = '#ff6b9d';
        this.outfitColor = '#a855f7';
        this.accessoryColor = '#06d6a0';
        
        // Attack system
        this.attackStyles = [
            { name: 'Hair Whip', damage: 25, range: 80, cooldown: 0.3, color: '#ff6b9d' },
            { name: 'Purse Swing', damage: 35, range: 60, cooldown: 0.4, color: '#a855f7' },
            { name: 'Witty Comeback', damage: 20, range: 120, cooldown: 0.2, color: '#06d6a0' },
            { name: 'Dance Move', damage: 40, range: 70, cooldown: 0.5, color: '#ffd23f' }
        ];
        this.currentAttackStyle = 0;
        this.lastAttackTime = 0;
        this.attackAnimation = { active: false, time: 0, duration: 0.2 };
        
        // Special abilities
        this.abilities = {
            glowUp: {
                name: 'Glow Up Mode',
                cooldown: 15000, // 15 seconds
                duration: 5000,  // 5 seconds
                lastUsed: 0,
                active: false,
                endTime: 0
            },
            callBestie: {
                name: 'Call Your Bestie',
                cooldown: 20000, // 20 seconds
                duration: 3000,  // 3 seconds
                lastUsed: 0,
                active: false,
                endTime: 0
            }
        };
        
        // Power-ups and upgrades
        this.powerUps = {
            speedBoost: 0,
            damageBoost: 0,
            healthBoost: 0,
            attackSpeedBoost: 0
        };
        
        // Animation states
        this.animationState = 'idle'; // idle, walking, attacking, special
        this.animationTime = 0;
        this.walkCycle = 0;
        
        // Particle effects
        this.trailParticles = [];
        this.auraParticles = [];
        
        // Customization (unlockable)
        this.outfit = 'default';
        this.hairstyle = 'default';
        this.accessories = [];
        
        // Stats tracking
        this.stats = {
            totalDamageDealt: 0,
            enemiesKilled: 0,
            distanceTraveled: 0,
            abilitiesUsed: 0
        };
        
        // Initialize
        this.updateAttackStyle();
    }
    
    /**
     * Update player logic
     */
    update(deltaTime, game) {
        // Update timers
        this.animationTime += deltaTime;
        this.updateInvulnerability(deltaTime);
        this.updateAbilities(deltaTime);
        this.updateAttackAnimation(deltaTime);
        
        // Handle input and movement
        this.handleInput(deltaTime, game);
        this.updateMovement(deltaTime);
        this.updatePhysics(deltaTime);
        
        // Update visual effects
        this.updateParticles(deltaTime);
        this.updateAnimations(deltaTime);
        
        // Check boundaries
        this.checkBoundaries(game);
        
        // Update stats
        this.updateStats(deltaTime);
        
        // Auto-upgrade attack style based on level
        this.updateAttackStyle(game);
    }
    
    /**
     * Handle input for movement and actions
     */
    handleInput(deltaTime, game) {
        const input = game.getMovementInput();
        
        // Movement
        if (input.x !== 0 || input.y !== 0) {
            this.vx += input.x * this.acceleration * deltaTime;
            this.vy += input.y * this.acceleration * deltaTime;
            
            // Update target angle for rotation
            this.targetAngle = Math.atan2(input.y, input.x);
            this.animationState = 'walking';
        } else {
            this.animationState = 'idle';
        }
        
        // Attack
        if (game.isAttackPressed()) {
            this.attack(game);
        }
        
        // Special abilities (keyboard only)
        if (game.isKeyPressed('KeyQ') || game.isKeyPressed('Digit1')) {
            this.useGlowUp(game);
        }
        
        if (game.isKeyPressed('KeyE') || game.isKeyPressed('Digit2')) {
            this.useCallBestie(game);
        }
    }
    
    /**
     * Update movement with inertia
     */
    updateMovement(deltaTime) {
        // Apply speed limits with power-up bonuses
        const maxSpeed = this.speed + (this.powerUps.speedBoost * 50);
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        if (currentSpeed > maxSpeed) {
            this.vx = (this.vx / currentSpeed) * maxSpeed;
            this.vy = (this.vy / currentSpeed) * maxSpeed;
        }
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update position
        const oldX = this.x;
        const oldY = this.y;
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Calculate distance traveled for stats
        const distance = Math.sqrt((this.x - oldX) ** 2 + (this.y - oldY) ** 2);
        this.stats.distanceTraveled += distance;
    }
    
    /**
     * Update physics and rotation
     */
    updatePhysics(deltaTime) {
        // Smooth rotation
        let angleDiff = this.targetAngle - this.angle;
        
        // Handle angle wrapping
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        this.angle += angleDiff * deltaTime * 8; // Rotation speed
        
        // Normalize angle
        if (this.angle > Math.PI) this.angle -= 2 * Math.PI;
        if (this.angle < -Math.PI) this.angle += 2 * Math.PI;
    }
    
    /**
     * Update particle effects
     */
    updateParticles(deltaTime) {
        // Glow Up mode particles
        if (this.abilities.glowUp.active) {
            this.createAuraParticles();
        }
        
        // Movement trail
        if (Math.sqrt(this.vx * this.vx + this.vy * this.vy) > 100) {
            this.createTrailParticles();
        }
        
        // Update existing particles
        this.trailParticles = this.trailParticles.filter(particle => 
            updateParticle(particle, deltaTime * 60)
        );
        
        this.auraParticles = this.auraParticles.filter(particle => 
            updateParticle(particle, deltaTime * 60)
        );
    }
    
    /**
     * Create aura particles for special abilities
     */
    createAuraParticles() {
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.radius + Math.random() * 20;
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            
            const particle = createParticle(
                x, y,
                Math.cos(angle) * 30,
                Math.sin(angle) * 30,
                1,
                '#ffd23f',
                random(3, 6)
            );
            particle.gravity = 0;
            this.auraParticles.push(particle);
        }
    }
    
    /**
     * Create trail particles
     */
    createTrailParticles() {
        const particle = createParticle(
            this.x + random(-5, 5),
            this.y + random(-5, 5),
            -this.vx * 0.1 + random(-20, 20),
            -this.vy * 0.1 + random(-20, 20),
            0.5,
            this.color,
            random(2, 4)
        );
        particle.gravity = 0;
        this.trailParticles.push(particle);
    }
    
    /**
     * Update animations
     */
    updateAnimations(deltaTime) {
        if (this.animationState === 'walking') {
            this.walkCycle += deltaTime * 6; // Walk cycle speed
            this.scale = 1 + Math.sin(this.walkCycle) * 0.05; // Subtle bounce
        } else {
            this.scale = lerp(this.scale, 1, deltaTime * 5);
        }
        
        // Breathing effect when idle
        if (this.animationState === 'idle') {
            this.scale = 1 + Math.sin(this.animationTime * 2) * 0.02;
        }
    }
    
    /**
     * Check boundaries and wrap around screen
     */
    checkBoundaries(game) {
        // Keep player within reasonable bounds but allow some off-screen movement
        const margin = 50;
        
        if (this.x < -margin) this.x = game.width + margin;
        if (this.x > game.width + margin) this.x = -margin;
        if (this.y < -margin) this.y = game.height + margin;
        if (this.y > game.height + margin) this.y = -margin;
    }
    
    /**
     * Update attack style based on game progression
     */
    updateAttackStyle(game) {
        if (!game) return;
        
        // Change attack style every few levels
        const newStyle = Math.min(
            Math.floor((game.level - 1) / 3),
            this.attackStyles.length - 1
        );
        
        if (newStyle !== this.currentAttackStyle) {
            this.currentAttackStyle = newStyle;
            // Show message about new attack style
            this.showAttackStyleMessage();
        }
    }
    
    /**
     * Show attack style upgrade message
     */
    showAttackStyleMessage() {
        const style = this.attackStyles[this.currentAttackStyle];
        // This would integrate with the UI system to show a temporary message
        console.log(`New Attack Style: ${style.name}!`);
    }
    
    /**
     * Perform attack
     */
    attack(game) {
        const now = Date.now();
        const style = this.attackStyles[this.currentAttackStyle];
        const cooldown = style.cooldown - (this.powerUps.attackSpeedBoost * 0.05);
        
        if (now - this.lastAttackTime < cooldown * 1000) {
            return; // Still in cooldown
        }
        
        this.lastAttackTime = now;
        this.animationState = 'attacking';
        this.attackAnimation = { active: true, time: 0, duration: 0.2 };
        
        // Create attack projectile or area effect
        this.createAttackEffect(game, style);
        
        // Create visual effects
        this.createAttackParticles(style);
        
        // Camera shake
        game.addCameraShake(0.3);
        
        // Play sound effect (will be implemented in audio.js)
        // AudioManager.playSound('attack_' + style.name.toLowerCase().replace(' ', '_'));
    }
    
    /**
     * Create attack effect
     */
    createAttackEffect(game, style) {
        const damage = style.damage + (this.powerUps.damageBoost * 5);
        
        // Check for enemies in range
        game.enemies.forEach(enemy => {
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            if (dist <= style.range) {
                // Deal damage
                enemy.takeDamage(damage);
                
                // Create hit effect
                this.createHitEffect(enemy.x, enemy.y, style.color);
                
                // Knockback
                const angle = angleBetween(this.x, this.y, enemy.x, enemy.y);
                enemy.vx += Math.cos(angle) * 200;
                enemy.vy += Math.sin(angle) * 200;
                
                // Update stats
                this.stats.totalDamageDealt += damage;
                if (enemy.health <= 0) {
                    this.stats.enemiesKilled++;
                }
            }
        });
        
        // Special attack effects based on style
        switch (this.currentAttackStyle) {
            case 0: // Hair Whip
                this.createHairWhipEffect(game, style);
                break;
            case 1: // Purse Swing
                this.createPurseSwingEffect(game, style);
                break;
            case 2: // Witty Comeback
                this.createWittyComebackEffect(game, style);
                break;
            case 3: // Dance Move
                this.createDanceMoveEffect(game, style);
                break;
        }
    }
    
    /**
     * Create hair whip effect
     */
    createHairWhipEffect(game, style) {
        // Create a sweeping area effect
        for (let i = 0; i < 8; i++) {
            const angle = this.angle + (i - 4) * 0.3;
            const x = this.x + Math.cos(angle) * style.range * 0.8;
            const y = this.y + Math.sin(angle) * style.range * 0.8;
            
            const particle = createParticle(
                x, y,
                Math.cos(angle) * 100,
                Math.sin(angle) * 100,
                0.3,
                style.color,
                random(3, 6)
            );
            game.particles.push(particle);
        }
    }
    
    /**
     * Create purse swing effect
     */
    createPurseSwingEffect(game, style) {
        // Create a circular swing effect
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * style.range;
            const y = this.y + Math.sin(angle) * style.range;
            
            const particle = createParticle(
                x, y,
                Math.cos(angle) * 50,
                Math.sin(angle) * 50,
                0.4,
                style.color,
                random(4, 7)
            );
            game.particles.push(particle);
        }
    }
    
    /**
     * Create witty comeback effect
     */
    createWittyComebackEffect(game, style) {
        // Create text-like projectiles
        for (let i = 0; i < 5; i++) {
            const angle = this.angle + (i - 2) * 0.2;
            const projectile = new Projectile(
                this.x, this.y,
                Math.cos(angle) * 400,
                Math.sin(angle) * 400,
                style.color,
                'player',
                style.damage
            );
            game.projectiles.push(projectile);
        }
    }
    
    /**
     * Create dance move effect
     */
    createDanceMoveEffect(game, style) {
        // Create spinning effect
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * style.range * 0.7;
            const y = this.y + Math.sin(angle) * style.range * 0.7;
            
            const particle = createParticle(
                x, y,
                Math.cos(angle) * 80,
                Math.sin(angle) * 80,
                0.6,
                style.color,
                random(5, 8)
            );
            particle.gravity = 0;
            game.particles.push(particle);
        }
    }
    
    /**
     * Create attack particles
     */
    createAttackParticles(style) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = random(50, 150);
            const particle = createParticle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                random(0.3, 0.8),
                style.color,
                random(3, 6)
            );
            this.trailParticles.push(particle);
        }
    }
    
    /**
     * Create hit effect
     */
    createHitEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = random(100, 200);
            const particle = createParticle(
                x + random(-10, 10),
                y + random(-10, 10),
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                random(0.5, 1),
                color,
                random(4, 8)
            );
            this.trailParticles.push(particle);
        }
    }
    
    /**
     * Use Glow Up ability
     */
    useGlowUp(game) {
        const ability = this.abilities.glowUp;
        const now = Date.now();
        
        if (now - ability.lastUsed < ability.cooldown || ability.active) {
            return;
        }
        
        ability.lastUsed = now;
        ability.active = true;
        ability.endTime = now + ability.duration;
        
        // Apply glow up effects
        this.invulnerable = true;
        this.speed *= 1.5;
        this.powerUps.damageBoost += 3;
        
        // Visual effects
        game.addCameraShake(0.5);
        this.createGlowUpEffect(game);
        
        // Update stats
        this.stats.abilitiesUsed++;
        
        console.log('✨ Glow Up Mode Activated! ✨');
    }
    
    /**
     * Use Call Bestie ability
     */
    useCallBestie(game) {
        const ability = this.abilities.callBestie;
        const now = Date.now();
        
        if (now - ability.lastUsed < ability.cooldown || ability.active) {
            return;
        }
        
        ability.lastUsed = now;
        ability.active = true;
        ability.endTime = now + ability.duration;
        
        // Spawn bestie helper (temporary ally)
        this.spawnBestie(game);
        
        // Update stats
        this.stats.abilitiesUsed++;
        
        console.log('👯 Your bestie has your back! 👯');
    }
    
    /**
     * Create glow up visual effect
     */
    createGlowUpEffect(game) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = random(100, 300);
            const particle = createParticle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                random(1, 2),
                randomChoice(['#ffd23f', '#ff6b9d', '#a855f7']),
                random(5, 10)
            );
            particle.gravity = 0;
            game.particles.push(particle);
        }
    }
    
    /**
     * Spawn bestie helper
     */
    spawnBestie(game) {
        // Create a temporary ally that helps attack enemies
        const bestie = {
            x: this.x + random(-50, 50),
            y: this.y + random(-50, 50),
            life: 3000, // 3 seconds
            radius: 15,
            color: '#06d6a0',
            
            update: function(deltaTime, game) {
                this.life -= deltaTime * 1000;
                
                // Find nearest enemy
                let nearestEnemy = null;
                let nearestDist = Infinity;
                
                game.enemies.forEach(enemy => {
                    const dist = distance(this.x, this.y, enemy.x, enemy.y);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                });
                
                // Move towards nearest enemy
                if (nearestEnemy && nearestDist > 30) {
                    const angle = angleBetween(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                    this.x += Math.cos(angle) * 200 * deltaTime;
                    this.y += Math.sin(angle) * 200 * deltaTime;
                }
                
                // Attack nearby enemies
                game.enemies.forEach(enemy => {
                    const dist = distance(this.x, this.y, enemy.x, enemy.y);
                    if (dist < 40) {
                        enemy.takeDamage(30);
                        
                        // Create hit effect
                        for (let i = 0; i < 5; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const particle = createParticle(
                                enemy.x,
                                enemy.y,
                                Math.cos(angle) * 100,
                                Math.sin(angle) * 100,
                                0.5,
                                this.color,
                                random(3, 6)
                            );
                            game.particles.push(particle);
                        }
                    }
                });
                
                return this.life > 0;
            },
            
            render: function(ctx) {
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw bestie face (simple emoji-style)
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('👯', this.x, this.y + 4);
                ctx.restore();
            }
        };
        
        game.effects.push(bestie);
    }
    
    /**
     * Update abilities
     */
    updateAbilities(deltaTime) {
        const now = Date.now();
        
        // Check Glow Up expiration
        if (this.abilities.glowUp.active && now >= this.abilities.glowUp.endTime) {
            this.abilities.glowUp.active = false;
            this.invulnerable = false;
            this.speed /= 1.5;
            this.powerUps.damageBoost -= 3;
            console.log('Glow Up Mode ended');
        }
        
        // Check Call Bestie expiration
        if (this.abilities.callBestie.active && now >= this.abilities.callBestie.endTime) {
            this.abilities.callBestie.active = false;
            console.log('Your bestie had to go');
        }
    }
    
    /**
     * Update invulnerability
     */
    updateInvulnerability(deltaTime) {
        if (this.invulnerable && !this.abilities.glowUp.active) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    /**
     * Update attack animation
     */
    updateAttackAnimation(deltaTime) {
        if (this.attackAnimation.active) {
            this.attackAnimation.time += deltaTime;
            if (this.attackAnimation.time >= this.attackAnimation.duration) {
                this.attackAnimation.active = false;
                this.animationState = 'idle';
            }
        }
    }
    
    /**
     * Update stats
     */
    updateStats(deltaTime) {
        // Stats are updated in various methods
    }
    
    /**
     * Take damage
     */
    takeDamage(damage) {
        if (this.invulnerable) return;
        
        this.health -= damage;
        this.health = Math.max(0, this.health);
        
        // Start invulnerability period
        this.invulnerable = true;
        this.invulnerabilityTime = this.invulnerabilityDuration;
        
        // Visual feedback
        this.createDamageEffect();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * Create damage effect
     */
    createDamageEffect() {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = createParticle(
                this.x,
                this.y,
                Math.cos(angle) * 100,
                Math.sin(angle) * 100,
                0.8,
                '#ff4757',
                random(3, 6)
            );
            this.trailParticles.push(particle);
        }
    }
    
    /**
     * Handle player death
     */
    die() {
        // Create death effect
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = createParticle(
                this.x,
                this.y,
                Math.cos(angle) * 200,
                Math.sin(angle) * 200,
                random(1, 3),
                randomChoice(['#ff6b9d', '#a855f7', '#06d6a0']),
                random(5, 10)
            );
            this.trailParticles.push(particle);
        }
        
        // Game over will be handled by the game
    }
    
    /**
     * Heal player
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth + (this.powerUps.healthBoost * 20), this.health + amount);
    }
    
    /**
     * Apply power-up
     */
    applyPowerUp(type, amount = 1) {
        if (this.powerUps.hasOwnProperty(type)) {
            this.powerUps[type] += amount;
        }
    }
    
    /**
     * Render player
     */
    render(ctx) {
        ctx.save();
        
        // Apply invulnerability flashing
        if (this.invulnerable && !this.abilities.glowUp.active) {
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.02);
        }
        
        // Apply glow effect for abilities
        if (this.abilities.glowUp.active) {
            ctx.shadowColor = '#ffd23f';
            ctx.shadowBlur = 20;
        }
        
        // Transform
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.scale(this.scale, this.scale);
        
        // Draw character body
        this.renderBody(ctx);
        
        // Draw outfit
        this.renderOutfit(ctx);
        
        // Draw hair/accessories
        this.renderHair(ctx);
        this.renderAccessories(ctx);
        
        // Draw attack animation
        if (this.attackAnimation.active) {
            this.renderAttackAnimation(ctx);
        }
        
        ctx.restore();
        
        // Render particles
        this.renderPlayerParticles(ctx);
        
        // Render health bar (above player)
        this.renderHealthBar(ctx);
    }
    
    /**
     * Render player body
     */
    renderBody(ctx) {
        // Main body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Body outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Face features
        ctx.fillStyle = '#ffffff';
        
        // Eyes
        ctx.beginPath();
        ctx.arc(-6, -5, 2, 0, Math.PI * 2);
        ctx.arc(6, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Smile
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, 8, 0, Math.PI);
        ctx.stroke();
    }
    
    /**
     * Render outfit
     */
    renderOutfit(ctx) {
        ctx.fillStyle = this.outfitColor;
        
        // Simple outfit representation
        ctx.beginPath();
        ctx.arc(0, 8, this.radius * 0.8, 0, Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    /**
     * Render hair
     */
    renderHair(ctx) {
        ctx.fillStyle = '#8b4513'; // Brown hair
        
        // Hair strands
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * (this.radius + 5);
            const y = Math.sin(angle) * (this.radius + 5);
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Render accessories
     */
    renderAccessories(ctx) {
        if (this.accessories.includes('earrings')) {
            ctx.fillStyle = this.accessoryColor;
            ctx.beginPath();
            ctx.arc(-this.radius + 2, 0, 2, 0, Math.PI * 2);
            ctx.arc(this.radius - 2, 0, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.accessories.includes('necklace')) {
            ctx.strokeStyle = this.accessoryColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, this.radius + 5, this.radius * 0.7, -Math.PI * 0.3, -Math.PI * 0.7);
            ctx.stroke();
        }
    }
    
    /**
     * Render attack animation
     */
    renderAttackAnimation(ctx) {
        const progress = this.attackAnimation.time / this.attackAnimation.duration;
        const style = this.attackStyles[this.currentAttackStyle];
        
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 3;
        
        // Different animations for different attack styles
        switch (this.currentAttackStyle) {
            case 0: // Hair Whip
                ctx.beginPath();
                ctx.arc(0, 0, style.range * progress, 0, Math.PI);
                ctx.stroke();
                break;
                
            case 1: // Purse Swing
                ctx.beginPath();
                ctx.arc(0, 0, style.range * progress, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 2: // Witty Comeback
                ctx.font = '16px Arial';
                ctx.fillStyle = style.color;
                ctx.textAlign = 'center';
                ctx.fillText('💬', style.range * progress, 0);
                break;
                
            case 3: // Dance Move
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const x = Math.cos(angle) * style.range * progress;
                    const y = Math.sin(angle) * style.range * progress;
                    ctx.moveTo(0, 0);
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }
    
    /**
     * Render player particles
     */
    renderPlayerParticles(ctx) {
        this.trailParticles.forEach(particle => {
            drawParticle(ctx, particle);
        });
        
        this.auraParticles.forEach(particle => {
            drawParticle(ctx, particle);
        });
    }
    
    /**
     * Render health bar
     */
    renderHealthBar(ctx) {
        const barWidth = 40;
        const barHeight = 6;
        const barY = this.y - this.radius - 15;
        
        ctx.save();
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        
        // Health fill
        const healthPercent = this.health / this.maxHealth;
        const fillColor = healthPercent > 0.6 ? '#00ff88' : 
                         healthPercent > 0.3 ? '#ffd23f' : '#ff4757';
        
        ctx.fillStyle = fillColor;
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        
        ctx.restore();
    }
    
    /**
     * Get ability cooldown progress (for UI)
     */
    getAbilityCooldown(abilityName) {
        const ability = this.abilities[abilityName];
        if (!ability) return 0;
        
        const now = Date.now();
        const timeSinceUse = now - ability.lastUsed;
        
        if (timeSinceUse >= ability.cooldown) return 1; // Ready
        
        return timeSinceUse / ability.cooldown;
    }
    
    /**
     * Use special ability (called from mobile buttons)
     */
    useSpecialAbility() {
        // Default to Glow Up
        this.useGlowUp(game);
    }
}

// Simple Projectile class for ranged attacks
class Projectile {
    constructor(x, y, vx, vy, color, owner, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.owner = owner;
        this.damage = damage;
        this.radius = 4;
        this.life = 2; // seconds
        this.maxLife = 2;
        this.shouldRemove = false;
    }
    
    update(deltaTime, game) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
            return;
        }
        
        // Check collision with enemies (if player projectile)
        if (this.owner === 'player') {
            game.enemies.forEach(enemy => {
                if (circleCollision(this.x, this.y, this.radius, enemy.x, enemy.y, enemy.radius)) {
                    enemy.takeDamage(this.damage);
                    this.shouldRemove = true;
                    
                    // Create hit effect
                    for (let i = 0; i < 5; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const particle = createParticle(
                            this.x, this.y,
                            Math.cos(angle) * 100,
                            Math.sin(angle) * 100,
                            0.5,
                            this.color,
                            random(2, 4)
                        );
                        game.particles.push(particle);
                    }
                }
            });
        }
        
        // Check bounds
        if (this.x < -100 || this.x > game.width + 100 || 
            this.y < -100 || this.y > game.height + 100) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        
        // Draw projectile with glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw trail
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(this.x - this.vx * 0.01, this.y - this.vy * 0.01, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
} 