/**
 * Audio System for Ex Battle
 * Handles background music, sound effects, and voice clips
 */

class AudioManager {
    constructor() {
        // Audio context for Web Audio API
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        // Audio buffers
        this.audioBuffers = new Map();
        this.musicTracks = new Map();
        this.soundEffects = new Map();
        
        // Current playing audio
        this.currentMusic = null;
        this.activeSounds = new Set();
        
        // Volume settings
        this.volumes = {
            master: 0.5,
            music: 0.7,
            sfx: 0.8
        };
        
        // Audio enabled state
        this.enabled = true;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        
        // Music playlist
        this.musicPlaylist = [
            'level_1', 'level_2', 'level_3', 'boss_theme', 'victory_theme'
        ];
        this.currentTrackIndex = 0;
        
        // Synthesized audio generation
        this.oscillators = new Map();
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            // Connect gain nodes
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Set initial volumes
            this.updateVolumes();
            
            // Generate synthesized audio
            this.generateAudio();
            
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.enabled = false;
        }
    }
    
    /**
     * Resume audio context (required for browser autoplay policies)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    /**
     * Generate synthesized audio since we don't have actual audio files
     */
    generateAudio() {
        // Generate background music tracks
        this.generateMusicTrack('level_1', {
            tempo: 120,
            key: 'C',
            mood: 'upbeat',
            duration: 60
        });
        
        this.generateMusicTrack('level_2', {
            tempo: 140,
            key: 'D',
            mood: 'energetic',
            duration: 60
        });
        
        this.generateMusicTrack('boss_theme', {
            tempo: 100,
            key: 'Am',
            mood: 'dramatic',
            duration: 90
        });
        
        this.generateMusicTrack('victory_theme', {
            tempo: 130,
            key: 'G',
            mood: 'triumphant',
            duration: 30
        });
        
        // Generate sound effects
        this.generateSoundEffect('attack_hair_whip', { type: 'whip', pitch: 440 });
        this.generateSoundEffect('attack_purse_swing', { type: 'swing', pitch: 330 });
        this.generateSoundEffect('attack_witty_comeback', { type: 'zap', pitch: 550 });
        this.generateSoundEffect('attack_dance_move', { type: 'sparkle', pitch: 660 });
        
        this.generateSoundEffect('enemy_hit', { type: 'impact', pitch: 200 });
        this.generateSoundEffect('enemy_death', { type: 'explosion', pitch: 150 });
        this.generateSoundEffect('player_hurt', { type: 'hurt', pitch: 300 });
        
        this.generateSoundEffect('powerup_collect', { type: 'pickup', pitch: 800 });
        this.generateSoundEffect('level_complete', { type: 'success', pitch: 500 });
        this.generateSoundEffect('ability_glow_up', { type: 'magic', pitch: 600 });
        this.generateSoundEffect('ability_call_bestie', { type: 'summon', pitch: 450 });
        
        this.generateSoundEffect('ui_click', { type: 'click', pitch: 400 });
        this.generateSoundEffect('ui_hover', { type: 'hover', pitch: 350 });
    }
    
    /**
     * Generate a music track using Web Audio API
     */
    generateMusicTrack(name, config) {
        const duration = config.duration;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        // Generate based on mood and tempo
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const time = i / sampleRate;
                let sample = 0;
                
                // Generate music based on config
                switch (config.mood) {
                    case 'upbeat':
                        sample = this.generateUpbeatMusic(time, config);
                        break;
                    case 'energetic':
                        sample = this.generateEnergeticMusic(time, config);
                        break;
                    case 'dramatic':
                        sample = this.generateDramaticMusic(time, config);
                        break;
                    case 'triumphant':
                        sample = this.generateTriumphantMusic(time, config);
                        break;
                }
                
                channelData[i] = sample * 0.3; // Keep volume reasonable
            }
        }
        
        this.musicTracks.set(name, buffer);
    }
    
    generateUpbeatMusic(time, config) {
        const freq1 = 261.63; // C note
        const freq2 = 329.63; // E note
        const freq3 = 392.00; // G note
        
        const beat = Math.floor(time * config.tempo / 60 * 4) % 4;
        const melody = Math.sin(2 * Math.PI * (freq1 + freq2 * beat) * time) * 0.3;
        const bass = Math.sin(2 * Math.PI * freq1 * 0.5 * time) * 0.2;
        const rhythm = Math.sin(2 * Math.PI * freq3 * time) * 0.1 * (beat % 2);
        
        return melody + bass + rhythm;
    }
    
    generateEnergeticMusic(time, config) {
        const freq1 = 293.66; // D note
        const freq2 = 369.99; // F# note
        
        const melody = Math.sin(2 * Math.PI * freq1 * time) * 0.4;
        const harmony = Math.sin(2 * Math.PI * freq2 * time) * 0.2;
        const beat = Math.sin(2 * Math.PI * 2 * time) * 0.3;
        
        return melody + harmony + beat;
    }
    
    generateDramaticMusic(time, config) {
        const freq1 = 220.00; // A note
        const freq2 = 261.63; // C note
        
        const ominous = Math.sin(2 * Math.PI * freq1 * time) * 0.5;
        const tension = Math.sin(2 * Math.PI * freq2 * 0.5 * time) * 0.3;
        const tremolo = (1 + Math.sin(2 * Math.PI * 6 * time)) * 0.5;
        
        return (ominous + tension) * tremolo;
    }
    
    generateTriumphantMusic(time, config) {
        const freq1 = 392.00; // G note
        const freq2 = 493.88; // B note
        const freq3 = 587.33; // D note
        
        const fanfare = Math.sin(2 * Math.PI * freq1 * time) * 0.4;
        const harmony1 = Math.sin(2 * Math.PI * freq2 * time) * 0.3;
        const harmony2 = Math.sin(2 * Math.PI * freq3 * time) * 0.2;
        
        return fanfare + harmony1 + harmony2;
    }
    
    /**
     * Generate a sound effect
     */
    generateSoundEffect(name, config) {
        const duration = this.getSoundDuration(config.type);
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const time = i / sampleRate;
            let sample = 0;
            
            switch (config.type) {
                case 'whip':
                    sample = this.generateWhipSound(time, duration, config.pitch);
                    break;
                case 'swing':
                    sample = this.generateSwingSound(time, duration, config.pitch);
                    break;
                case 'zap':
                    sample = this.generateZapSound(time, duration, config.pitch);
                    break;
                case 'sparkle':
                    sample = this.generateSparkleSound(time, duration, config.pitch);
                    break;
                case 'impact':
                    sample = this.generateImpactSound(time, duration, config.pitch);
                    break;
                case 'explosion':
                    sample = this.generateExplosionSound(time, duration, config.pitch);
                    break;
                case 'hurt':
                    sample = this.generateHurtSound(time, duration, config.pitch);
                    break;
                case 'pickup':
                    sample = this.generatePickupSound(time, duration, config.pitch);
                    break;
                case 'success':
                    sample = this.generateSuccessSound(time, duration, config.pitch);
                    break;
                case 'magic':
                    sample = this.generateMagicSound(time, duration, config.pitch);
                    break;
                case 'summon':
                    sample = this.generateSummonSound(time, duration, config.pitch);
                    break;
                case 'click':
                    sample = this.generateClickSound(time, duration, config.pitch);
                    break;
                case 'hover':
                    sample = this.generateHoverSound(time, duration, config.pitch);
                    break;
            }
            
            channelData[i] = sample;
        }
        
        this.soundEffects.set(name, buffer);
    }
    
    getSoundDuration(type) {
        const durations = {
            whip: 0.3,
            swing: 0.2,
            zap: 0.15,
            sparkle: 0.4,
            impact: 0.2,
            explosion: 0.8,
            hurt: 0.3,
            pickup: 0.3,
            success: 1.0,
            magic: 0.6,
            summon: 0.5,
            click: 0.1,
            hover: 0.05
        };
        return durations[type] || 0.2;
    }
    
    generateWhipSound(time, duration, pitch) {
        const envelope = Math.exp(-time * 10);
        const swoosh = Math.sin(2 * Math.PI * pitch * (1 - time / duration) * time) * envelope;
        const crack = Math.random() * 0.3 * envelope * (time < 0.05 ? 1 : 0);
        return swoosh + crack;
    }
    
    generateSwingSound(time, duration, pitch) {
        const envelope = Math.exp(-time * 8);
        const swing = Math.sin(2 * Math.PI * pitch * time) * envelope;
        const whoosh = Math.random() * 0.2 * envelope;
        return swing + whoosh;
    }
    
    generateZapSound(time, duration, pitch) {
        const envelope = Math.exp(-time * 15);
        const zap = Math.sin(2 * Math.PI * pitch * time) * envelope;
        const crackle = Math.random() * 0.4 * envelope;
        return zap + crackle;
    }
    
    generateSparkleSound(time, duration, pitch) {
        const envelope = Math.sin(Math.PI * time / duration);
        const sparkle = Math.sin(2 * Math.PI * pitch * time) * envelope;
        const shimmer = Math.sin(2 * Math.PI * pitch * 1.5 * time) * envelope * 0.5;
        return sparkle + shimmer;
    }
    
    generateImpactSound(time, duration, pitch) {
        const envelope = Math.exp(-time * 20);
        const thud = Math.sin(2 * Math.PI * pitch * time) * envelope;
        const noise = Math.random() * 0.5 * envelope;
        return thud + noise;
    }
    
    generateExplosionSound(time, duration, pitch) {
        const envelope = Math.exp(-time * 3);
        const rumble = Math.sin(2 * Math.PI * pitch * time) * envelope;
        const noise = Math.random() * 0.7 * envelope;
        const boom = Math.sin(2 * Math.PI * pitch * 0.5 * time) * envelope;
        return rumble + noise + boom;
    }
    
    generateHurtSound(time, duration, pitch) {
        const envelope = Math.exp(-time * 8);
        const whine = Math.sin(2 * Math.PI * pitch * (1 + time) * time) * envelope;
        return whine;
    }
    
    generatePickupSound(time, duration, pitch) {
        const envelope = Math.sin(Math.PI * time / duration);
        const chime = Math.sin(2 * Math.PI * pitch * time) * envelope;
        const sparkle = Math.sin(2 * Math.PI * pitch * 2 * time) * envelope * 0.3;
        return chime + sparkle;
    }
    
    generateSuccessSound(time, duration, pitch) {
        const envelope = Math.sin(Math.PI * time / duration);
        const fanfare = Math.sin(2 * Math.PI * pitch * time) * envelope;
        const harmony = Math.sin(2 * Math.PI * pitch * 1.25 * time) * envelope * 0.7;
        const overtone = Math.sin(2 * Math.PI * pitch * 1.5 * time) * envelope * 0.5;
        return fanfare + harmony + overtone;
    }
    
    generateMagicSound(time, duration, pitch) {
        const envelope = Math.sin(Math.PI * time / duration);
        const magic = Math.sin(2 * Math.PI * pitch * time) * envelope;
        const shimmer = Math.sin(2 * Math.PI * pitch * 1.618 * time) * envelope * 0.6;
        const twinkle = Math.random() * 0.3 * envelope;
        return magic + shimmer + twinkle;
    }
    
    generateSummonSound(time, duration, pitch) {
        const envelope = 1 - time / duration;
        const call = Math.sin(2 * Math.PI * pitch * time) * envelope;
        const echo = Math.sin(2 * Math.PI * pitch * 0.8 * time) * envelope * 0.5;
        return call + echo;
    }
    
    generateClickSound(time, duration, pitch) {
        const envelope = Math.exp(-time * 50);
        const click = Math.sin(2 * Math.PI * pitch * time) * envelope;
        return click;
    }
    
    generateHoverSound(time, duration, pitch) {
        const envelope = Math.exp(-time * 20);
        const hover = Math.sin(2 * Math.PI * pitch * time) * envelope;
        return hover;
    }
    
    /**
     * Play background music
     */
    playMusic(trackName, loop = true, fadeIn = true) {
        if (!this.enabled || !this.musicEnabled) return;
        
        this.resume(); // Resume audio context if needed
        
        // Stop current music
        this.stopMusic();
        
        const buffer = this.musicTracks.get(trackName);
        if (!buffer) {
            console.warn(`Music track '${trackName}' not found`);
            return;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        source.connect(this.musicGain);
        
        if (fadeIn) {
            this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.musicGain.gain.linearRampToValueAtTime(
                this.volumes.music, 
                this.audioContext.currentTime + 1
            );
        }
        
        source.start();
        this.currentMusic = source;
        
        // Auto-advance to next track when finished (if not looping)
        if (!loop) {
            source.addEventListener('ended', () => {
                this.playNextTrack();
            });
        }
    }
    
    /**
     * Stop background music
     */
    stopMusic(fadeOut = true) {
        if (this.currentMusic) {
            if (fadeOut) {
                this.musicGain.gain.linearRampToValueAtTime(
                    0, 
                    this.audioContext.currentTime + 0.5
                );
                setTimeout(() => {
                    if (this.currentMusic) {
                        this.currentMusic.stop();
                        this.currentMusic = null;
                    }
                }, 500);
            } else {
                this.currentMusic.stop();
                this.currentMusic = null;
            }
        }
    }
    
    /**
     * Play next track in playlist
     */
    playNextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicPlaylist.length;
        const nextTrack = this.musicPlaylist[this.currentTrackIndex];
        this.playMusic(nextTrack);
    }
    
    /**
     * Play sound effect
     */
    playSound(soundName, volume = 1, pitch = 1, delay = 0) {
        if (!this.enabled || !this.sfxEnabled) return;
        
        this.resume(); // Resume audio context if needed
        
        const buffer = this.soundEffects.get(soundName);
        if (!buffer) {
            console.warn(`Sound effect '${soundName}' not found`);
            return;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.playbackRate.value = pitch;
        
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);
        gainNode.gain.value = volume;
        
        source.start(this.audioContext.currentTime + delay);
        
        // Track active sounds
        this.activeSounds.add(source);
        source.addEventListener('ended', () => {
            this.activeSounds.delete(source);
        });
        
        return source;
    }
    
    /**
     * Play multiple sounds in sequence
     */
    playSoundSequence(sounds, interval = 0.1) {
        sounds.forEach((sound, index) => {
            this.playSound(sound.name, sound.volume || 1, sound.pitch || 1, index * interval);
        });
    }
    
    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.volumes.master = clamp(volume, 0, 1);
        this.updateVolumes();
    }
    
    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.volumes.music = clamp(volume, 0, 1);
        this.updateVolumes();
    }
    
    /**
     * Set sound effects volume
     */
    setSfxVolume(volume) {
        this.volumes.sfx = clamp(volume, 0, 1);
        this.updateVolumes();
    }
    
    /**
     * Update all volume settings
     */
    updateVolumes() {
        if (this.masterGain) {
            this.masterGain.gain.value = this.volumes.master;
        }
        if (this.musicGain) {
            this.musicGain.gain.value = this.volumes.music;
        }
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.volumes.sfx;
        }
    }
    
    /**
     * Enable/disable audio
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopMusic();
            this.stopAllSounds();
        }
    }
    
    /**
     * Enable/disable music
     */
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }
    
    /**
     * Enable/disable sound effects
     */
    setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
        if (!enabled) {
            this.stopAllSounds();
        }
    }
    
    /**
     * Stop all sound effects
     */
    stopAllSounds() {
        this.activeSounds.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Already stopped
            }
        });
        this.activeSounds.clear();
    }
    
    /**
     * Create voice synthesis for character dialogue
     */
    speakText(text, voice = 'default') {
        if (!this.enabled || !window.speechSynthesis) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice based on character
        switch (voice) {
            case 'player':
                utterance.pitch = 1.2;
                utterance.rate = 1.1;
                utterance.volume = 0.8;
                break;
            case 'enemy':
                utterance.pitch = 0.8;
                utterance.rate = 0.9;
                utterance.volume = 0.7;
                break;
            case 'boss':
                utterance.pitch = 0.6;
                utterance.rate = 0.8;
                utterance.volume = 0.9;
                break;
            default:
                utterance.pitch = 1.0;
                utterance.rate = 1.0;
                utterance.volume = 0.8;
        }
        
        window.speechSynthesis.speak(utterance);
    }
    
    /**
     * Play contextual music based on game state
     */
    playContextualMusic(context, level = 1) {
        switch (context) {
            case 'menu':
                this.playMusic('level_1', true);
                break;
            case 'gameplay':
                const trackIndex = Math.min(level - 1, 2);
                const track = ['level_1', 'level_2', 'level_3'][trackIndex];
                this.playMusic(track, true);
                break;
            case 'boss':
                this.playMusic('boss_theme', true);
                break;
            case 'victory':
                this.playMusic('victory_theme', false);
                break;
            case 'gameover':
                this.stopMusic();
                this.playSound('player_hurt');
                break;
        }
    }
    
    /**
     * Create audio feedback for UI interactions
     */
    playUISound(action) {
        switch (action) {
            case 'click':
                this.playSound('ui_click');
                break;
            case 'hover':
                this.playSound('ui_hover', 0.5);
                break;
            case 'back':
                this.playSound('ui_click', 1, 0.8);
                break;
            case 'confirm':
                this.playSound('ui_click', 1, 1.2);
                break;
        }
    }
    
    /**
     * Get current volumes for UI
     */
    getVolumes() {
        return { ...this.volumes };
    }
    
    /**
     * Get audio status
     */
    getStatus() {
        return {
            enabled: this.enabled,
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled,
            musicPlaying: !!this.currentMusic,
            activeSounds: this.activeSounds.size
        };
    }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
} 