/**
 * Utility Functions for Ex Battle Game
 * Contains math helpers, DOM utilities, collision detection, and other commonly used functions
 */

// ===== MATH UTILITIES =====

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

/**
 * Get distance between two points
 */
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get angle between two points (in radians)
 */
function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Convert radians to degrees
 */
function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 */
function degToRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Generate random number between min and max
 */
function random(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Choose random element from array
 */
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Normalize a vector (make it unit length)
 */
function normalize(x, y) {
    const length = Math.sqrt(x * x + y * y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
}

// ===== COLLISION DETECTION =====

/**
 * Check if two circles collide
 */
function circleCollision(x1, y1, r1, x2, y2, r2) {
    const dist = distance(x1, y1, x2, y2);
    return dist < (r1 + r2);
}

/**
 * Check if two rectangles collide
 */
function rectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * Check if a point is inside a rectangle
 */
function pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
}

/**
 * Check if a point is inside a circle
 */
function pointInCircle(x, y, circleX, circleY, radius) {
    return distance(x, y, circleX, circleY) <= radius;
}

// ===== DOM UTILITIES =====

/**
 * Get element by ID with error checking
 */
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with ID '${id}' not found`);
    }
    return element;
}

/**
 * Show screen with fade transition
 */
function showScreen(screenId) {
    // Hide all screens first
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show target screen with fade in
    const targetScreen = getElement(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('fade-in');
        
        // Remove fade-in class after animation
        setTimeout(() => {
            targetScreen.classList.remove('fade-in');
        }, 300);
    }
}

/**
 * Hide screen with fade transition
 */
function hideScreen(screenId) {
    const screen = getElement(screenId);
    if (screen) {
        screen.classList.add('fade-out');
        setTimeout(() => {
            screen.classList.add('hidden');
            screen.classList.remove('fade-out');
        }, 300);
    }
}

/**
 * Add CSS class with optional duration
 */
function addTempClass(element, className, duration = 1000) {
    element.classList.add(className);
    setTimeout(() => {
        element.classList.remove(className);
    }, duration);
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ===== ANIMATION UTILITIES =====

/**
 * Simple easing functions
 */
const Easing = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    bounce: t => {
        if (t < 1/2.75) {
            return 7.5625 * t * t;
        } else if (t < 2/2.75) {
            return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
        } else if (t < 2.5/2.75) {
            return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
        }
    }
};

/**
 * Animate a value over time
 */
function animate(from, to, duration, easing = Easing.linear, callback = null) {
    const startTime = Date.now();
    
    function frame() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = from + (to - from) * easing(progress);
        
        if (callback) callback(value, progress);
        
        if (progress < 1) {
            requestAnimationFrame(frame);
        }
    }
    
    requestAnimationFrame(frame);
}

// ===== PARTICLE SYSTEM UTILITIES =====

/**
 * Create a particle effect
 */
function createParticle(x, y, vx, vy, life, color = '#ff6b9d', size = 3) {
    return {
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        life: life,
        maxLife: life,
        color: color,
        size: size,
        gravity: 0.1,
        friction: 0.98
    };
}

/**
 * Update particle
 */
function updateParticle(particle, deltaTime) {
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    particle.vy += particle.gravity * deltaTime;
    particle.vx *= particle.friction;
    particle.vy *= particle.friction;
    particle.life -= deltaTime;
    
    return particle.life > 0;
}

/**
 * Draw particle
 */
function drawParticle(ctx, particle) {
    const alpha = particle.life / particle.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ===== PERFORMANCE UTILITIES =====

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// ===== LOCAL STORAGE UTILITIES =====

/**
 * Save data to localStorage with error handling
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

/**
 * Load data from localStorage with error handling
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Remove data from localStorage
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Failed to remove from localStorage:', error);
        return false;
    }
}

// ===== DEVICE DETECTION =====

/**
 * Check if device is mobile
 */
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if device supports touch
 */
function isTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ===== COLOR UTILITIES =====

/**
 * Convert HSL to RGB
 */
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r, g, b;
    
    if (h < 1/6) {
        r = c; g = x; b = 0;
    } else if (h < 2/6) {
        r = x; g = c; b = 0;
    } else if (h < 3/6) {
        r = 0; g = c; b = x;
    } else if (h < 4/6) {
        r = 0; g = x; b = c;
    } else if (h < 5/6) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }
    
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

/**
 * Create gradient color string
 */
function createGradient(ctx, x1, y1, x2, y2, colors) {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
}

// ===== VECTOR2D CLASS =====
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(vector) {
        return new Vector2D(this.x + vector.x, this.y + vector.y);
    }
    
    subtract(vector) {
        return new Vector2D(this.x - vector.x, this.y - vector.y);
    }
    
    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
    
    divide(scalar) {
        return new Vector2D(this.x / scalar, this.y / scalar);
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const mag = this.magnitude();
        return mag > 0 ? this.divide(mag) : new Vector2D();
    }
    
    distanceTo(vector) {
        return this.subtract(vector).magnitude();
    }
    
    angleTo(vector) {
        return Math.atan2(vector.y - this.y, vector.x - this.x);
    }
    
    copy() {
        return new Vector2D(this.x, this.y);
    }
}

// ===== EXPORT FOR NODE.JS (if running in Node environment) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        clamp, lerp, distance, angleBetween, radToDeg, degToRad,
        random, randomInt, randomChoice, normalize,
        circleCollision, rectCollision, pointInRect, pointInCircle,
        getElement, showScreen, hideScreen, addTempClass, formatNumber,
        Easing, animate,
        createParticle, updateParticle, drawParticle,
        debounce, throttle,
        saveToStorage, loadFromStorage, removeFromStorage,
        isMobile, isTouch,
        hslToRgb, createGradient,
        Vector2D
    };
} 