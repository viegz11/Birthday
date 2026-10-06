/**
 * Centralized Audio Manager
 * Handles HTML5 Web Audio stems, ambient music, SFX triggers, volume crossfades,
 * audio ducking, mute/unmute states, and browser autoplay unlocks using strictly
 * local assets.
 */

import { eventBus, EVENTS } from './EventBus.js';

export const AUDIO_TRACKS = {
  // Music Soundtracks
  MYSTERY_INTRO: 'mystery_intro',
  CUPID_TENSION: 'cupid_tension',
  BIRTHDAY_REVEAL: 'birthday_reveal',
  BIRTHDAY_PARTY: 'birthday_party',
  MAKE_A_WISH: 'make_a_wish',
  LETTER: 'letter',
  MEMORIES: 'memories',
  FINAL_BLOOM: 'final_bloom',
  FINAL_MESSAGE: 'final_message',
  AMBIENT_LOOP: 'ambient_loop',

  // Sound Effects
  ARROW_WHOOSH: 'arrow_whoosh',
  BALLOON_POP: 'balloon_pop',
  BOW_DRAW: 'bow_draw',
  BOW_RELEASE: 'bow_release',
  CANDLE_BLOW: 'candle_blow',
  CANDLE_FLAME: 'candle_flame',
  ENVELOPE_OPEN: 'envelope_open',
  FINAL_CHIME: 'final_chime',
  HEART_BURST: 'heart_burst',
  HEART_IMPACT: 'heart_impact',
  PHOTO_OPEN: 'photo_open',
  PHOTO_SWIPE: 'photo_swipe',
  SPARKLE: 'sparkle',
  TREE_GROW: 'tree_grow'
};

const AUDIO_BASE = '/audio/';

const AUDIO_FILES = {
  [AUDIO_TRACKS.MYSTERY_INTRO]: `${AUDIO_BASE}10_ambient_loop.mp3`,
  [AUDIO_TRACKS.CUPID_TENSION]: `${AUDIO_BASE}02_cupid_tension.mp3`,
  [AUDIO_TRACKS.BIRTHDAY_REVEAL]: `${AUDIO_BASE}03_birthday_reveal.mp3`,
  [AUDIO_TRACKS.BIRTHDAY_PARTY]: `${AUDIO_BASE}05_make_a_wish.mp3`,
  [AUDIO_TRACKS.MAKE_A_WISH]: `${AUDIO_BASE}05_make_a_wish.mp3`,
  [AUDIO_TRACKS.LETTER]: `${AUDIO_BASE}06_letter.mp3`,
  [AUDIO_TRACKS.MEMORIES]: `${AUDIO_BASE}07_memories.mp3`,
  [AUDIO_TRACKS.FINAL_BLOOM]: `${AUDIO_BASE}08_final_bloom.mp3`,
  [AUDIO_TRACKS.FINAL_MESSAGE]: `${AUDIO_BASE}08_final_bloom.mp3`,
  [AUDIO_TRACKS.AMBIENT_LOOP]: `${AUDIO_BASE}10_ambient_loop.mp3`,

  [AUDIO_TRACKS.ARROW_WHOOSH]: `${AUDIO_BASE}sparkle.mp3`,
  [AUDIO_TRACKS.BALLOON_POP]: `${AUDIO_BASE}balloon-pop.mp3`,
  [AUDIO_TRACKS.BOW_DRAW]: `${AUDIO_BASE}heart-impact.mp3`,
  [AUDIO_TRACKS.BOW_RELEASE]: `${AUDIO_BASE}heart-burst.mp3`,
  [AUDIO_TRACKS.CANDLE_BLOW]: `${AUDIO_BASE}candle-blow.mp3`,
  [AUDIO_TRACKS.CANDLE_FLAME]: `${AUDIO_BASE}candle-flame.mp3`,
  [AUDIO_TRACKS.ENVELOPE_OPEN]: `${AUDIO_BASE}envelope-open.mp3`,
  [AUDIO_TRACKS.FINAL_CHIME]: `${AUDIO_BASE}final-chime.mp3`,
  [AUDIO_TRACKS.HEART_BURST]: `${AUDIO_BASE}heart-burst.mp3`,
  [AUDIO_TRACKS.HEART_IMPACT]: `${AUDIO_BASE}heart-impact.mp3`,
  [AUDIO_TRACKS.PHOTO_OPEN]: `${AUDIO_BASE}photo-open.mp3`,
  [AUDIO_TRACKS.PHOTO_SWIPE]: `${AUDIO_BASE}photo-swipe.mp3`,
  [AUDIO_TRACKS.SPARKLE]: `${AUDIO_BASE}sparkle.mp3`,
  [AUDIO_TRACKS.TREE_GROW]: `${AUDIO_BASE}tree-grow.mp3`
};

export const SCENE_MUSIC_MAP = {
  ACT_0_MYSTERY: { track: AUDIO_TRACKS.MYSTERY_INTRO, loop: true, volume: 0.85, autoStart: false },
  ACT_1_CUPID_BOW: { track: AUDIO_TRACKS.CUPID_TENSION, loop: true, volume: 0.8, crossfade: 1000 },
  ACT_2_HEART_BURST: { track: AUDIO_TRACKS.CUPID_TENSION, loop: true, volume: 0.8, continuePrevious: true },
  ACT_3_BIRTHDAY_REVEAL: { track: AUDIO_TRACKS.BIRTHDAY_REVEAL, loop: false, volume: 0.9, crossfade: 1000 },
  ACT_4_CELEBRATION: { track: AUDIO_TRACKS.BIRTHDAY_PARTY, loop: true, volume: 0.85, crossfade: 1000 },
  ACT_5_PERSONAL_LETTER: { track: AUDIO_TRACKS.LETTER, loop: true, volume: 0.75, crossfade: 1200 },
  ACT_6_MEMORY_GALLERY: { track: AUDIO_TRACKS.MEMORIES, loop: true, volume: 0.75, crossfade: 1000 },
  ACT_7_BLOSSOM_TREE: { track: AUDIO_TRACKS.FINAL_BLOOM, loop: true, volume: 0.8, crossfade: 1200 },
  ACT_8_FINAL_MESSAGE: { track: AUDIO_TRACKS.FINAL_MESSAGE, loop: true, volume: 0.8, crossfade: 2000 }
};

class AudioManager {
  constructor() {
    this.isUnlocked = false;
    this.isMuted = false;
    this.audioPool = new Map();
    this.currentMusicKey = null;
    this.currentMusicAudio = null;
    this.currentSceneId = null;
    this.fadeInterval = null;
    this.masterVolume = 1.0;
    this.musicVolume = 0.85;
    this.sfxVolume = 0.9;
    this.audioContext = null;
  }

  /**
   * Initializes Web Audio Context for reliable mobile unlocking & synthesis
   */
  getAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    return this.audioContext;
  }

  /**
   * Preloads all available audio assets locally.
   */
  preload() {
    for (const [key, src] of Object.entries(AUDIO_FILES)) {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = src;
        audio.load();

        audio.addEventListener('error', () => {
          if (audio.error) {
            console.error('[AUDIO ERROR]', {
              track: key,
              url: src,
              error: audio.error.message || `MediaError code ${audio.error.code}`
            });
          }
        });

        if (key === AUDIO_TRACKS.AMBIENT_LOOP || key === AUDIO_TRACKS.CANDLE_FLAME) {
          audio.loop = true;
        }

        this.audioPool.set(key, audio);
      } catch (err) {
        console.error('[AUDIO ERROR]', {
          track: key,
          url: src,
          error: err?.message || String(err)
        });
      }
    }
  }

  /**
   * Safely initiates audio playback without uncaught AbortErrors on rapid pause/crossfade.
   * @param {HTMLAudioElement} audio
   * @param {string} [key]
   * @returns {Promise<void>}
   */
  async safePlay(audio, key = '') {
    if (!audio || !this.isUnlocked || this.isMuted) return;
    try {
      const promise = audio.play();
      if (promise !== undefined) {
        audio._playPromise = promise;
        await promise;
        audio._playPromise = null;
      }
    } catch (err) {
      audio._playPromise = null;
      // AbortError is normal when a track is paused or crossfaded before play handshake resolves
      if (err?.name === 'AbortError' || err?.message?.includes('interrupted by a call to pause')) {
        return;
      }
      console.error('[AUDIO ERROR]', {
        track: key || this.currentMusicKey,
        url: AUDIO_FILES[key] || audio.src,
        error: err?.message || String(err)
      });
    }
  }

  /**
   * Safely pauses audio, waiting for any pending play promise to resolve first.
   * @param {HTMLAudioElement} audio
   */
  safePause(audio) {
    if (!audio) return;
    if (audio._playPromise) {
      audio._playPromise
        .then(() => {
          try {
            audio.pause();
          } catch (_) {}
        })
        .catch(() => {
          // Play was rejected / aborted; safe to ignore
        });
    } else {
      try {
        audio.pause();
      } catch (_) {}
    }
  }

  /**
   * Unlocks audio context on user interaction (tap/click/keypress).
   */
  unlock() {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!this.isUnlocked) {
      this.isUnlocked = true;
      eventBus.emit(EVENTS.USER_AUDIO_UNLOCKED);

      // Warm up audio buffer with silent prime
      for (const [, audio] of this.audioPool.entries()) {
        try {
          audio.load();
        } catch (_) {}
      }
    }

    // Play active background music if unmuted and paused
    if (!this.isMuted && this.currentMusicAudio && this.currentMusicAudio.paused) {
      this.safePlay(this.currentMusicAudio, this.currentMusicKey);
    }
  }

  /**
   * Ensures that the proper music is playing for the given scene ID.
   * @param {string} sceneId 
   */
  ensureSceneMusic(sceneId) {
    if (sceneId) this.currentSceneId = sceneId;
    const activeScene = sceneId || this.currentSceneId || 'ACT_0_MYSTERY';
    const config = SCENE_MUSIC_MAP[activeScene];
    if (!config) return;

    // Do NOT auto-start Act 0 music on page load or scene mount; waits for user's heart tap
    if (activeScene === 'ACT_0_MYSTERY' || config.autoStart === false) {
      return;
    }

    if (!this.isUnlocked || this.isMuted) return;

    // If scene is configured to continue previous act's music (e.g. Act 2 continues Act 1)
    if (config.continuePrevious) {
      return;
    }

    if (this.currentMusicKey === config.track && this.currentMusicAudio && !this.currentMusicAudio.paused) {
      return;
    }

    const crossfadeDuration = config.crossfade || 1000;
    this.crossfadeMusic(config.track, crossfadeDuration, config.loop ?? true, config.volume ?? 0.85);
  }

  /**
   * Plays a one-shot sound effect.
   * @param {string} key - Identifier from AUDIO_TRACKS
   * @param {number} [volume] - Optional volume override (0.0 to 1.0)
   */
  playSFX(key, volume = 1.0) {
    if (!this.isUnlocked || this.isMuted) return;

    const original = this.audioPool.get(key);

    if (original) {
      try {
        let sound = original;
        if (!sound.paused && sound.currentTime > 0) {
          sound = original.cloneNode();
        } else {
          sound.currentTime = 0;
        }

        sound.volume = Math.min(1.0, Math.max(0, volume * this.sfxVolume * this.masterVolume));
        
        sound.addEventListener('error', () => {
          if (sound.error) {
            console.error('[AUDIO ERROR]', {
              track: key,
              url: AUDIO_FILES[key],
              error: sound.error.message || `MediaError code ${sound.error.code}`
            });
          }
        });

        const promise = sound.play();
        if (promise !== undefined) {
          promise.catch((err) => {
            if (err?.name === 'AbortError' || err?.message?.includes('pause')) return;
            console.error('[AUDIO ERROR]', {
              track: key,
              url: AUDIO_FILES[key],
              error: err?.message || String(err)
            });
          });
        }
      } catch (err) {
        if (err?.name === 'AbortError' || err?.message?.includes('pause')) return;
        console.error('[AUDIO ERROR]', {
          track: key,
          url: AUDIO_FILES[key],
          error: err?.message || String(err)
        });
      }
    } else {
      console.error('[AUDIO ERROR]', {
        track: key,
        url: AUDIO_FILES[key],
        error: 'SFX audio not loaded in audio pool'
      });
    }
  }

  /**
   * Plays a background music track, stopping any previous track.
   * @param {string} key - Identifier from AUDIO_TRACKS
   * @param {boolean} [loop=false] - Whether to loop the track
   * @param {number} [targetVolume=0.85] - Volume level
   */
  playMusic(key, loop = false, targetVolume = 0.85) {
    if (this.currentMusicKey === key && this.currentMusicAudio && !this.currentMusicAudio.paused) {
      return;
    }

    const nextAudio = this.audioPool.get(key);
    if (!nextAudio) {
      console.error('[AUDIO ERROR]', {
        track: key,
        url: AUDIO_FILES[key],
        error: 'Music audio not loaded in pool'
      });
      return;
    }

    if (this.currentMusicAudio && this.currentMusicAudio !== nextAudio) {
      this.safePause(this.currentMusicAudio);
      this.currentMusicAudio.currentTime = 0;
    }

    this.currentMusicKey = key;
    this.currentMusicAudio = nextAudio;
    this.currentMusicAudio.loop = loop;
    const finalVolume = this.isMuted ? 0 : targetVolume * this.musicVolume * this.masterVolume;
    this.currentMusicAudio.volume = finalVolume;

    // Only attempt browser playback if audio is unlocked by user interaction
    if (this.isUnlocked && !this.isMuted) {
      this.safePlay(this.currentMusicAudio, key);
    }
  }

  /**
   * Smoothly crossfades from current music to new music track.
   * @param {string} nextKey - Key of the incoming track
   * @param {number} [durationMs=1200] - Crossfade duration in milliseconds
   * @param {boolean} [loop=false] - Loop setting for incoming track
   * @param {number} [targetVolume=0.85] - Volume level
   */
  crossfadeMusic(nextKey, durationMs = 1200, loop = false, targetVolume = 0.85) {
    if (this.currentMusicKey === nextKey && this.currentMusicAudio && !this.currentMusicAudio.paused) return;
    const nextAudio = this.audioPool.get(nextKey);
    if (!nextAudio) {
      console.error('[AUDIO ERROR]', {
        track: nextKey,
        url: AUDIO_FILES[nextKey],
        error: 'Track not found for crossfade'
      });
      return;
    }

    const prevAudio = this.currentMusicAudio;
    const stepInterval = 50;
    const totalSteps = Math.max(1, Math.floor(durationMs / stepInterval));
    let step = 0;

    nextAudio.loop = loop;
    nextAudio.currentTime = 0;
    const targetVol = targetVolume * this.musicVolume * this.masterVolume;

    if (this.isUnlocked && !this.isMuted) {
      nextAudio.volume = 0.05;
      this.safePlay(nextAudio, nextKey);
    } else {
      nextAudio.volume = 0;
    }

    if (this.fadeInterval) clearInterval(this.fadeInterval);

    this.fadeInterval = setInterval(() => {
      step++;
      const progress = step / totalSteps;

      if (prevAudio && !this.isMuted) {
        prevAudio.volume = Math.max(0, (1 - progress) * this.musicVolume * this.masterVolume);
      }

      if (nextAudio && !this.isMuted) {
        nextAudio.volume = Math.min(targetVol, progress * targetVol);
      }

      if (step >= totalSteps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;

        if (prevAudio && prevAudio !== nextAudio) {
          this.safePause(prevAudio);
          prevAudio.currentTime = 0;
        }

        this.currentMusicKey = nextKey;
        this.currentMusicAudio = nextAudio;
        if (!this.isMuted) {
          this.currentMusicAudio.volume = targetVol;
        }
      }
    }, stepInterval);
  }

  /**
   * Ducks background music volume temporarily for SFX or speech.
   * @param {number} duckRatio - Target ducked volume ratio (0.1 - 0.5)
   * @param {number} durationMs - Duration before restoring full volume
   */
  duckMusic(duckRatio = 0.3, durationMs = 1500) {
    if (!this.currentMusicAudio || this.isMuted) return;
    const baseVolume = this.musicVolume * this.masterVolume;
    this.currentMusicAudio.volume = baseVolume * duckRatio;

    setTimeout(() => {
      if (this.currentMusicAudio && !this.isMuted) {
        this.currentMusicAudio.volume = baseVolume;
      }
    }, durationMs);
  }

  duck(duckRatio = 0.3, durationMs = 1500) {
    this.duckMusic(duckRatio, durationMs);
  }

  /**
   * Stops the currently playing background music.
   */
  stopMusic() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.currentMusicAudio) {
      this.currentMusicAudio.pause();
      this.currentMusicAudio.currentTime = 0;
      this.currentMusicKey = null;
      this.currentMusicAudio = null;
    }
  }

  /**
   * Completely stops all active music, SFX, and ambient playback, and resets audio state.
   */
  stopAll() {
    this.stopMusic();
    for (const [, audio] of this.audioPool) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    }
    this.currentSceneId = 'ACT_0_MYSTERY';
    this.isUnlocked = false;
  }

  /**
   * Toggles global mute state with instant audio playback on unmute.
   */
  toggleMute() {
    this.unlock();
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      if (this.currentMusicAudio) {
        this.currentMusicAudio.volume = 0;
      }
    } else {
      if (this.currentMusicAudio) {
        this.currentMusicAudio.volume = this.musicVolume * this.masterVolume;
        if (this.currentMusicAudio.paused) {
          this.currentMusicAudio.play().catch((err) => {
            console.error('[AUDIO ERROR]', {
              track: this.currentMusicKey,
              url: this.currentMusicAudio?.src,
              error: err
            });
          });
        }
      } else {
        this.ensureSceneMusic(this.currentSceneId);
      }
    }

    eventBus.emit(EVENTS.SOUND_TOGGLED, { isMuted: this.isMuted });
    return this.isMuted;
  }

  /**
   * Sets mute state explicitly.
   */
  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.isMuted) {
      if (this.currentMusicAudio) this.currentMusicAudio.volume = 0;
    } else {
      if (this.currentMusicAudio) {
        this.currentMusicAudio.volume = this.musicVolume * this.masterVolume;
        if (this.currentMusicAudio.paused) {
          this.currentMusicAudio.play().catch((err) => {
            console.error('[AUDIO ERROR]', {
              track: this.currentMusicKey,
              url: this.currentMusicAudio?.src,
              error: err
            });
          });
        }
      } else {
        this.ensureSceneMusic(this.currentSceneId);
      }
    }
    eventBus.emit(EVENTS.SOUND_TOGGLED, { isMuted: this.isMuted });
  }

  /**
   * Clean up all audio nodes.
   */
  destroy() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    this.stopMusic();
    for (const [, audio] of this.audioPool) {
      audio.pause();
      audio.src = '';
    }
    this.audioPool.clear();
  }
}

export const audioManager = new AudioManager();
