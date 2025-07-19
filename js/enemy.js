/**
 * Enemy System for Ex Battle
 * Handles different types of guys and ex-boyfriend bosses
 */

// Base Enemy class
class Enemy {
    constructor(x, y, level = 1) {
        // Position and movement
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = 100 + (level * 10);
        this.baseSpeed = this.speed;
        
        // Physical properties
        this.radius = 18;
        this.health = 50 + (level * 10);
        this.maxHealth = this.health;
        this.level = level;
        
        // AI behavior
        this.state = 'approaching'; // approaching, attacking, stunned, fleeing
        this.target = null;
        this.attackRange = 40;
        this.detectionRange = 200;
        this.lastAttackTime = 0;
        this.attackCooldown = 2000; // milliseconds
        
        // Visual properties
        this.angle = 0;
        this.scale = 1;
        this.color = '#4a90e2';
        this.animationTime = 0;
        this.facingDirection = 1;
        
        // Personality and type
        this.type = 'basic';
        this.personality = 'overconfident';
        this.pickupLines = [];
        this.scoreValue = 100;
        
        // Effects and animations
        this.hitFlash = 0;
        this.knockback = { x: 0, y: 0 };
        this.particles = [];
        
        // Audio cues
        this.voiceClips = [];
        this.lastVoiceTime = 0;
        
        this.init();
    }
    
    init() {
        // Override in subclasses
        this.setupPersonality();
    }
    
    setupPersonality() {
        const personalities = [
            {
                type: 'overconfident',
                color: '#4a90e2',
                speed: 1.2,
                health: 1.0,
                pickupLines: [
                    "Hey gorgeous! 😎",
                    "You look lonely 😏",
                    "I'm different from other guys 🙄"
                ]
            },
            {
                type: 'flirty',
                color: '#e74c3c',
                speed: 0.9,
                health: 0.8,
                pickupLines: [
                    "😘💕",
                    "Beautiful! 💋",
                    "Your eyes sparkle ✨"
                ]
            },
            {
                type: 'creepy',
                color: '#8e44ad',
                speed: 0.7,
                health: 1.3,
                pickupLines: [
                    "I've been watching you 👁️",
                    "You remind me of my ex 😬",
                    "Nice guys finish last 🤢"
                ]
            },
            {
                type: 'mansplainer',
                color: '#f39c12',
                speed: 0.8,
                health: 1.1,
                pickupLines: [
                    "Actually... 🤓",
                    "Let me explain... 📚",
                    "You probably don't know... 🙄"
                ]
            },
            {
                type: 'showoff',
                color: '#2ecc71',
                speed: 1.5,
                health: 0.9,
                pickupLines: [
                    "Check out my car! 🏎️",
                    "I make 6 figures 💰",
                    "I'm basically famous 📸"
                ]
            }
        ];
        
        const chosen = randomChoice(personalities);
        this.personality = chosen.type;
        this.color = chosen.color;
        this.speed = this.baseSpeed * chosen.speed;
        this.health = Math.round(this.health * chosen.health);
        this.maxHealth = this.health;
        this.pickupLines = chosen.pickupLines;
    }
    
    update(deltaTime, game) {
        this.animationTime += deltaTime;
        
        // Update target (usually the player)
        this.target = game.player;
        
        // Update AI behavior
        this.updateAI(deltaTime, game);
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Occasionally say pickup lines
        this.updateVoice(deltaTime);
        
        // Check if dead
        if (this.health <= 0) {
            this.onDeath(game);
        }
    }
    
    updateAI(deltaTime, game) {
        if (!this.target) return;
        
        const distToTarget = distance(this.x, this.y, this.target.x, this.target.y);
        const now = Date.now();
        
        switch (this.state) {
            case 'approaching':
                if (distToTarget <= this.attackRange) {
                    this.state = 'attacking';
                } else if (distToTarget > this.detectionRange) {
                    this.state = 'wandering';
                } else {
                    this.moveTowards(this.target.x, this.target.y, deltaTime);
                }
                break;
                
            case 'attacking':
                if (distToTarget > this.attackRange) {
                    this.state = 'approaching';
                } else if (now - this.lastAttackTime > this.attackCooldown) {
                    this.attack(game);
                }
                break;
                
            case 'stunned':
                // Just wait for stun to wear off
                break;
                
            case 'fleeing':
                this.moveAwayFrom(this.target.x, this.target.y, deltaTime);
                break;
                
            case 'wandering':
                this.wander(deltaTime);
                if (distToTarget <= this.detectionRange) {
                    this.state = 'approaching';
                }
                break;
        }
    }
    
    moveTowards(targetX, targetY, deltaTime) {
        const angle = angleBetween(this.x, this.y, targetX, targetY);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.facingDirection = Math.cos(angle) > 0 ? 1 : -1;
        this.angle = angle;
    }
    
    moveAwayFrom(targetX, targetY, deltaTime) {
        const angle = angleBetween(this.x, this.y, targetX, targetY) + Math.PI;
        this.vx = Math.cos(angle) * this.speed * 1.5; // Flee faster
        this.vy = Math.sin(angle) * this.speed * 1.5;
        this.facingDirection = Math.cos(angle) > 0 ? 1 : -1;
    }
    
    wander(deltaTime) {
        // Random wandering behavior
        if (Math.random() < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.speed * 0.3;
            this.vy = Math.sin(angle) * this.speed * 0.3;
        }
    }
    
    updateMovement(deltaTime) {
        // Apply knockback
        this.vx += this.knockback.x;
        this.vy += this.knockback.y;
        this.knockback.x *= 0.9;
        this.knockback.y *= 0.9;
        
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Apply friction
        this.vx *= 0.9;
        this.vy *= 0.9;
    }
    
    updateEffects(deltaTime) {
        // Hit flash effect
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime * 3;
            this.hitFlash = Math.max(0, this.hitFlash);
        }
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => 
            updateParticle(particle, deltaTime * 60)
        );
    }
    
    updateVoice(deltaTime) {
        const now = Date.now();
        if (now - this.lastVoiceTime > 5000 && Math.random() < 0.01) { // 1% chance every frame, max every 5 seconds
            this.sayPickupLine();
            this.lastVoiceTime = now;
        }
    }
    
    attack(game) {
        this.lastAttackTime = Date.now();
        
        // Different attack patterns based on personality
        switch (this.personality) {
            case 'overconfident':
                this.overconfidentAttack(game);
                break;
            case 'flirty':
                this.flirtyAttack(game);
                break;
            case 'creepy':
                this.creepyAttack(game);
                break;
            case 'mansplainer':
                this.mansplainerAttack(game);
                break;
            case 'showoff':
                this.showoffAttack(game);
                break;
        }
    }
    
    overconfidentAttack(game) {
        // Direct charge attack
        const angle = angleBetween(this.x, this.y, this.target.x, this.target.y);
        this.vx = Math.cos(angle) * this.speed * 2;
        this.vy = Math.sin(angle) * this.speed * 2;
        
        // Check collision with player
        this.checkPlayerCollision(game, 15);
    }
    
    flirtyAttack(game) {
        // Throw heart projectiles
        for (let i = 0; i < 3; i++) {
            const angle = angleBetween(this.x, this.y, this.target.x, this.target.y) + (i - 1) * 0.3;
            const projectile = new EnemyProjectile(
                this.x, this.y,
                Math.cos(angle) * 200,
                Math.sin(angle) * 200,
                '#ff69b4',
                '💖',
                10
            );
            game.projectiles.push(projectile);
        }
    }
    
    creepyAttack(game) {
        // Slow moving but persistent
        this.speed = this.baseSpeed * 0.5;
        const angle = angleBetween(this.x, this.y, this.target.x, this.target.y);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        // Create unsettling particles
        for (let i = 0; i < 5; i++) {
            const particle = createParticle(
                this.x + random(-20, 20),
                this.y + random(-20, 20),
                random(-50, 50),
                random(-50, 50),
                2,
                '#8e44ad',
                random(2, 4)
            );
            this.particles.push(particle);
        }
        
        this.checkPlayerCollision(game, 20);
    }
    
    mansplainerAttack(game) {
        // Text bubble attack
        const projectile = new EnemyProjectile(
            this.x, this.y,
            0, -100, // Goes upward then falls
            '#f39c12',
            'Actually...',
            15
        );
        projectile.gravity = 100;
        game.projectiles.push(projectile);
        
        this.checkPlayerCollision(game, 12);
    }
    
    showoffAttack(game) {
        // Flashy spinning attack
        this.angle += 10 * Math.PI; // Spin fast
        
        // Create bling particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = createParticle(
                this.x + Math.cos(angle) * 30,
                this.y + Math.sin(angle) * 30,
                Math.cos(angle) * 100,
                Math.sin(angle) * 100,
                1,
                '#ffd700',
                random(3, 6)
            );
            this.particles.push(particle);
        }
        
        this.checkPlayerCollision(game, 25);
    }
    
    checkPlayerCollision(game, damage) {
        if (circleCollision(this.x, this.y, this.radius, this.target.x, this.target.y, this.target.radius)) {
            this.target.takeDamage(damage);
            game.addCameraShake(0.5);
        }
    }
    
    sayPickupLine() {
        if (this.pickupLines.length > 0) {
            const line = randomChoice(this.pickupLines);
            this.showTextBubble(line);
        }
    }
    
    showTextBubble(text) {
        // Create floating text effect
        const textEffect = {
            x: this.x,
            y: this.y - 40,
            text: text,
            life: 2,
            opacity: 1,
            
            update: function(deltaTime) {
                this.life -= deltaTime;
                this.y -= 20 * deltaTime; // Float upward
                this.opacity = this.life / 2;
                return this.life > 0;
            },
            
            render: function(ctx) {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                
                // Draw text bubble background
                const textWidth = ctx.measureText(this.text).width;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(this.x - textWidth/2 - 5, this.y - 15, textWidth + 10, 20);
                ctx.strokeRect(this.x - textWidth/2 - 5, this.y - 15, textWidth + 10, 20);
                
                // Draw text
                ctx.fillStyle = '#000000';
                ctx.fillText(this.text, this.x, this.y);
                ctx.restore();
            }
        };
        
        // Add to game effects (assumes game is accessible)
        if (typeof game !== 'undefined') {
            game.effects.push(textEffect);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.hitFlash = 1;
        
        // Create hit particles
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = createParticle(
                this.x,
                this.y,
                Math.cos(angle) * 100,
                Math.sin(angle) * 100,
                0.8,
                '#ff4757',
                random(3, 5)
            );
            this.particles.push(particle);
        }
        
        // Chance to flee when low health
        if (this.health < this.maxHealth * 0.3 && Math.random() < 0.3) {
            this.state = 'fleeing';
        }
    }
    
    onDeath(game) {
        // Create death explosion
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = random(100, 300);
            const particle = createParticle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                random(1, 2),
                this.color,
                random(4, 8)
            );
            game.particles.push(particle);
        }
        
        // Final pickup line
        this.showTextBubble("This isn't over! 😤");
    }
    
    render(ctx) {
        ctx.save();
        
        // Apply hit flash
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = this.hitFlash * 0.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // Transform
        ctx.translate(this.x, this.y);
        ctx.scale(this.facingDirection, 1);
        ctx.scale(this.scale, this.scale);
        
        // Draw body
        this.renderBody(ctx);
        
        // Draw personality-specific features
        this.renderPersonality(ctx);
        
        ctx.restore();
        
        // Render particles
        this.particles.forEach(particle => {
            drawParticle(ctx, particle);
        });
        
        // Render health bar if damaged
        if (this.health < this.maxHealth) {
            this.renderHealthBar(ctx);
        }
    }
    
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
        
        // Basic face
        ctx.fillStyle = '#ffffff';
        
        // Eyes
        ctx.beginPath();
        ctx.arc(-6, -5, 2, 0, Math.PI * 2);
        ctx.arc(6, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Expression based on state
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        switch (this.state) {
            case 'approaching':
                // Confident smile
                ctx.arc(0, 2, 6, 0, Math.PI);
                break;
            case 'attacking':
                // Aggressive expression
                ctx.moveTo(-8, 5);
                ctx.lineTo(8, 5);
                break;
            case 'fleeing':
                // Worried expression
                ctx.arc(0, 8, 6, Math.PI, 0);
                break;
            default:
                // Neutral
                ctx.moveTo(-4, 5);
                ctx.lineTo(4, 5);
        }
        ctx.stroke();
    }
    
    renderPersonality(ctx) {
        // Add personality-specific visual elements
        switch (this.personality) {
            case 'overconfident':
                // Sunglasses
                ctx.fillStyle = '#000000';
                ctx.fillRect(-8, -8, 16, 6);
                break;
                
            case 'flirty':
                // Heart eyes
                ctx.fillStyle = '#ff69b4';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('😍', 0, -2);
                break;
                
            case 'creepy':
                // Shifty eyes
                ctx.fillStyle = '#8e44ad';
                ctx.beginPath();
                ctx.arc(-4, -5, 2, 0, Math.PI * 2);
                ctx.arc(8, -5, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'mansplainer':
                // Glasses and smug expression
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(-8, -8, 16, 6);
                break;
                
            case 'showoff':
                // Bling
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(0, 10, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
    
    renderHealthBar(ctx) {
        const barWidth = 30;
        const barHeight = 4;
        const barY = this.y - this.radius - 10;
        
        ctx.save();
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        
        // Health fill
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : '#ff4757';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        ctx.restore();
    }
}

// Boss Enemy Class for Ex-Boyfriends
class BossEnemy extends Enemy {
    constructor(x, y, level, bossType = 'toxic') {
        super(x, y, level);
        
        // Boss properties
        this.bossType = bossType;
        this.radius = 35;
        this.health = 300 + (level * 50);
        this.maxHealth = this.health;
        this.scoreValue = 1000;
        this.speed = this.baseSpeed * 0.7; // Slower but more powerful
        
        // Boss-specific properties
        this.attackPatterns = [];
        this.currentPattern = 0;
        this.patternTimer = 0;
        this.phase = 1;
        this.maxPhases = 3;
        
        // Special abilities
        this.abilities = [];
        this.lastAbilityTime = 0;
        this.abilityCooldown = 5000;
        
        // Visual effects
        this.aura = { active: true, intensity: 1 };
        this.dramatic = true;
        
        this.setupBoss();
    }
    
    setupBoss() {
        const bossConfigs = {
            toxic: {
                name: "The Toxic Ex",
                color: '#8e44ad',
                story: "Remember him? The one who made everything about himself and never listened to your feelings. Time to show him what you've learned!",
                abilities: ['guilt_trip', 'gaslighting_field', 'emotional_manipulation'],
                attackPatterns: ['circle_strafe', 'guilt_bombs', 'toxic_waves'],
                dialogue: [
                    "You'll never find anyone better than me! 😤",
                    "I was just trying to help you! 🙄",
                    "You're being too sensitive! 😒"
                ]
            },
            clingy: {
                name: "The Clingy Ex",
                color: '#e74c3c',
                story: "The one who couldn't give you space and texted you 47 times in a row. Show him what healthy boundaries look like!",
                abilities: ['suffocating_hug', 'spam_messages', 'guilt_trip'],
                attackPatterns: ['follow_constantly', 'message_spam', 'clingy_tendrils'],
                dialogue: [
                    "Why aren't you texting me back?! 📱",
                    "I just want to spend time with you! 🥺",
                    "We're perfect together! 💕"
                ]
            },
            ghosting: {
                name: "The Ghoster",
                color: '#34495e',
                story: "He disappeared without explanation and then reappeared months later like nothing happened. Time for some closure!",
                abilities: ['disappearing_act', 'false_promises', 'confusion_cloud'],
                attackPatterns: ['phase_in_out', 'mixed_signals', 'vanishing_attacks'],
                dialogue: [
                    "Sorry, I was busy... 👻",
                    "I thought we were just casual? 🤷",
                    "Can we start fresh? 😅"
                ]
            },
            commitment_phobe: {
                name: "The Commitment-Phobe",
                color: '#f39c12',
                story: "Three years of 'I'm not ready for labels' but suddenly he's engaged to someone else. Show him what commitment looks like!",
                abilities: ['commitment_dodge', 'mixed_signals', 'future_fake'],
                attackPatterns: ['evasive_maneuvers', 'label_dodge', 'non_committal'],
                dialogue: [
                    "I just don't want to rush things... ⏰",
                    "Labels are just social constructs! 🏷️",
                    "I need more time to figure myself out! 🤔"
                ]
            },
            narcissist: {
                name: "The Narcissist",
                color: '#2ecc71',
                story: "Everything was always about him. His problems, his achievements, his feelings. Time to center yourself!",
                abilities: ['ego_blast', 'attention_theft', 'mirror_shield'],
                attackPatterns: ['self_centered', 'spotlight_steal', 'ego_attacks'],
                dialogue: [
                    "But enough about you, let's talk about me! 🗣️",
                    "I'm basically perfect! ✨",
                    "This is all your fault! 👆"
                ]
            }
        };
        
        const config = bossConfigs[this.bossType];
        this.name = config.name;
        this.color = config.color;
        this.story = config.story;
        this.abilities = config.abilities;
        this.attackPatterns = config.attackPatterns;
        this.dialogue = config.dialogue;
    }
    
    update(deltaTime, game) {
        super.update(deltaTime, game);
        
        // Update boss-specific behavior
        this.updateBossAI(deltaTime, game);
        this.updatePhases();
        this.updateAura(deltaTime);
    }
    
    updateBossAI(deltaTime, game) {
        this.patternTimer += deltaTime;
        
        // Switch attack patterns
        if (this.patternTimer > 5) { // 5 seconds per pattern
            this.currentPattern = (this.currentPattern + 1) % this.attackPatterns.length;
            this.patternTimer = 0;
        }
        
        // Execute current attack pattern
        this.executeAttackPattern(deltaTime, game);
        
        // Use special abilities
        this.updateAbilities(deltaTime, game);
    }
    
    executeAttackPattern(deltaTime, game) {
        const pattern = this.attackPatterns[this.currentPattern];
        
        switch (pattern) {
            case 'circle_strafe':
                this.circleStrafe(deltaTime, game);
                break;
            case 'guilt_bombs':
                this.guiltBombs(deltaTime, game);
                break;
            case 'toxic_waves':
                this.toxicWaves(deltaTime, game);
                break;
            case 'follow_constantly':
                this.followConstantly(deltaTime, game);
                break;
            case 'message_spam':
                this.messageSpam(deltaTime, game);
                break;
            // Add more patterns as needed
        }
    }
    
    circleStrafe(deltaTime, game) {
        if (!this.target) return;
        
        const centerX = this.target.x;
        const centerY = this.target.y;
        const radius = 150;
        
        this.angle += deltaTime * 2; // Circle speed
        
        const targetX = centerX + Math.cos(this.angle) * radius;
        const targetY = centerY + Math.sin(this.angle) * radius;
        
        this.moveTowards(targetX, targetY, deltaTime);
    }
    
    guiltBombs(deltaTime, game) {
        if (Math.random() < 0.02) { // 2% chance per frame
            const angle = angleBetween(this.x, this.y, this.target.x, this.target.y);
            const projectile = new EnemyProjectile(
                this.x, this.y,
                Math.cos(angle) * 150,
                Math.sin(angle) * 150,
                '#8e44ad',
                "It's your fault! 😢",
                25
            );
            game.projectiles.push(projectile);
        }
    }
    
    toxicWaves(deltaTime, game) {
        // Create expanding toxic waves
        if (Math.random() < 0.01) {
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const projectile = new EnemyProjectile(
                    this.x, this.y,
                    Math.cos(angle) * 100,
                    Math.sin(angle) * 100,
                    this.color,
                    "💀",
                    20
                );
                game.projectiles.push(projectile);
            }
        }
    }
    
    followConstantly(deltaTime, game) {
        // Aggressive following with no personal space
        this.moveTowards(this.target.x, this.target.y, deltaTime);
        this.speed = this.baseSpeed * 1.5;
    }
    
    messageSpam(deltaTime, game) {
        if (Math.random() < 0.05) { // 5% chance
            const messages = [
                "Why aren't you answering? 📱",
                "Hello??? 😠",
                "I can see you're online! 👀"
            ];
            
            const projectile = new EnemyProjectile(
                this.x, this.y,
                random(-100, 100),
                random(-100, 100),
                '#e74c3c',
                randomChoice(messages),
                15
            );
            game.projectiles.push(projectile);
        }
    }
    
    updatePhases() {
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent < 0.33 && this.phase < 3) {
            this.phase = 3;
            this.speed *= 1.5;
            this.attackCooldown *= 0.5;
            this.showTextBubble("Fine! I'll show you who I really am! 😡");
        } else if (healthPercent < 0.66 && this.phase < 2) {
            this.phase = 2;
            this.speed *= 1.2;
            this.showTextBubble("You're making me angry! 😤");
        }
    }
    
    updateAura(deltaTime) {
        this.aura.intensity = 0.5 + 0.5 * Math.sin(this.animationTime * 3);
    }
    
    updateAbilities(deltaTime, game) {
        const now = Date.now();
        if (now - this.lastAbilityTime > this.abilityCooldown) {
            this.useRandomAbility(game);
            this.lastAbilityTime = now;
        }
    }
    
    useRandomAbility(game) {
        const ability = randomChoice(this.abilities);
        
        switch (ability) {
            case 'guilt_trip':
                this.guildTrip(game);
                break;
            case 'gaslighting_field':
                this.gaslightingField(game);
                break;
            case 'emotional_manipulation':
                this.emotionalManipulation(game);
                break;
            // Add more abilities
        }
    }
    
    guildTrip(game) {
        this.showTextBubble("After everything I did for you! 😢");
        // Reduce player's movement speed temporarily
        if (game.player) {
            game.player.speed *= 0.5;
            setTimeout(() => {
                if (game.player) game.player.speed /= 0.5;
            }, 3000);
        }
    }
    
    gaslightingField(game) {
        this.showTextBubble("You're just being dramatic! 🙄");
        // Create confusion effect that reverses controls briefly
        game.addCameraShake(1);
    }
    
    emotionalManipulation(game) {
        this.showTextBubble("I've changed, I promise! 🥺");
        // Create fake powerups that actually damage
        for (let i = 0; i < 3; i++) {
            const fakePickup = {
                x: this.x + random(-100, 100),
                y: this.y + random(-100, 100),
                radius: 15,
                color: '#ff69b4',
                fake: true,
                
                update: function(deltaTime, game) {
                    if (circleCollision(this.x, this.y, this.radius, 
                                       game.player.x, game.player.y, game.player.radius)) {
                        game.player.takeDamage(20);
                        return false; // Remove
                    }
                    return true;
                },
                
                render: function(ctx) {
                    ctx.save();
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('💖', this.x, this.y + 4);
                    ctx.restore();
                }
            };
            game.effects.push(fakePickup);
        }
    }
    
    render(ctx) {
        // Render boss aura
        ctx.save();
        ctx.globalAlpha = this.aura.intensity * 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Render main body (larger)
        super.render(ctx);
        
        // Render boss-specific effects
        this.renderBossEffects(ctx);
    }
    
    renderBossEffects(ctx) {
        // Crown or other boss indicators
        ctx.save();
        ctx.translate(this.x, this.y - this.radius - 15);
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', 0, 0);
        ctx.restore();
    }
}

// Enemy Projectile class
class EnemyProjectile {
    constructor(x, y, vx, vy, color, text = null, damage = 10) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.text = text;
        this.damage = damage;
        this.radius = text ? 15 : 6;
        this.life = 3;
        this.maxLife = 3;
        this.shouldRemove = false;
        this.gravity = 0;
        this.owner = 'enemy';
    }
    
    update(deltaTime, game) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += this.gravity * deltaTime;
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
            return;
        }
        
        // Check collision with player
        if (circleCollision(this.x, this.y, this.radius, 
                           game.player.x, game.player.y, game.player.radius)) {
            game.player.takeDamage(this.damage);
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
        
        if (this.text) {
            // Draw text projectile
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            
            // Background bubble
            const textWidth = ctx.measureText(this.text).width;
            ctx.fillRect(this.x - textWidth/2 - 5, this.y - 10, textWidth + 10, 20);
            ctx.strokeRect(this.x - textWidth/2 - 5, this.y - 10, textWidth + 10, 20);
            
            // Text
            ctx.fillStyle = this.color;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y + 3);
        } else {
            // Draw normal projectile
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = this.color;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
} 