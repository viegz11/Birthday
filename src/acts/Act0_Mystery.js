/**
 * Act 0 — The Mystery & Countdown Gate
 * "A little something... for you."
 * A minimal warm opening with a glowing, beating heart and dynamic countdown gate.
 * Target Birthday: 07-10-2026 00:00:00.
 * Post-window (after 00:05:00): Starts a 22-second countdown overlay on every session load.
 */

import gsap from 'gsap';
import { SCENES, sceneManager } from '../core/SceneManager.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';
import { ParticleEmitter } from '../utils/particles.js';
import { BIRTHDAY_CONFIG } from '../config/content.config.js';
import { CountdownManager } from '../utils/countdown.js';

export class Act0_Mystery {
  constructor() {
    this.id = SCENES.ACT_0;
    this.container = null;
    this.element = null;
    this.cleanups = [];
    this.heartBeatTL = null;
    this.isTriggered = false;
    this.countdownTimer = null;
    this.countdownSec = 22;
  }

  async enter(hostElement) {
    this.container = hostElement;
    this.isTriggered = false;
    this.cleanups = [];

    const recipientName = BIRTHDAY_CONFIG.recipientName || 'chinna pulla';

    // Create Act 0 DOM Stage
    this.element = document.createElement('div');
    this.element.className = 'act0-stage';
    this.element.id = 'act0-stage';
    this.element.innerHTML = `
      <div class="act0-motes" id="act0Motes"></div>
      
      <!-- Main Heart Content Stage -->
      <div class="act0-content" id="act0Content">
        <div class="act0-title-wrap">
          <p class="act0-eyebrow" id="act0Eyebrow">a little something&hellip;</p>
          <h1 class="act0-main-title" id="act0Title">for you.</h1>
        </div>

        <button class="act0-heart-button" id="act0HeartBtn" type="button" aria-label="Tap the beating heart to open your surprise">
          <span class="act0-heart-glow" id="act0Glow" aria-hidden="true"></span>
          <svg class="act0-heart-svg" id="act0HeartSvg" viewBox="0 0 100 92" aria-hidden="true">
            <defs>
              <radialGradient id="act0Hg" cx="38%" cy="30%" r="80%">
                <stop offset="0%"  stop-color="#ffd9e4" />
                <stop offset="42%" stop-color="#ff6f97" />
                <stop offset="82%" stop-color="#d81e57" />
                <stop offset="100%" stop-color="#9d0f3e" />
              </radialGradient>
              <linearGradient id="act0Sheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stop-color="rgba(255,255,255,.9)" />
                <stop offset="34%" stop-color="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <path d="M50 86.5C26 68 10.5 53.6 10.5 34.6 10.5 20.4 21 11 33.2 11c8.6 0 14.2 4.7 16.8 11.4C52.6 15.7 58.2 11 66.8 11 79 11 89.5 20.4 89.5 34.6 89.5 53.6 74 68 50 86.5Z" fill="url(#act0Hg)" />
            <path d="M50 86.5C26 68 10.5 53.6 10.5 34.6 10.5 20.4 21 11 33.2 11c8.6 0 14.2 4.7 16.8 11.4C52.6 15.7 58.2 11 66.8 11 79 11 89.5 20.4 89.5 34.6 89.5 53.6 74 68 50 86.5Z" fill="url(#act0Sheen)" opacity=".7" />
            <ellipse cx="34" cy="30" rx="8.5" ry="5.4" fill="#fff" opacity=".75" style="mix-blend-mode:screen" />
          </svg>
        </button>

        <p class="act0-hint" id="act0Hint">
          <span>tap the heart</span>
        </p>
      </div>

      <!-- Dynamic Countdown & Gate Overlay -->
      <div class="countdown-overlay" id="cdOverlay" style="display: none;">
        <div class="countdown-card" id="cdCard">
          <p class="countdown-eyebrow" id="cdEyebrow">Counting down to ${this.escapeHtml(recipientName)}'s birthday... ✨</p>
          <h2 class="countdown-title" id="cdTitle">07 October 2026</h2>

          <!-- Mode 1: Pre-Birthday HH:MM:SS Grid -->
          <div class="countdown-timer-grid" id="cdGrid">
            <div class="countdown-unit">
              <div class="countdown-num-box"><span class="countdown-num" id="cdHours">00</span></div>
              <span class="countdown-label">Hours</span>
            </div>
            <span class="countdown-colon">:</span>
            <div class="countdown-unit">
              <div class="countdown-num-box"><span class="countdown-num" id="cdMins">00</span></div>
              <span class="countdown-label">Mins</span>
            </div>
            <span class="countdown-colon">:</span>
            <div class="countdown-unit">
              <div class="countdown-num-box"><span class="countdown-num" id="cdSecs">00</span></div>
              <span class="countdown-label">Secs</span>
            </div>
          </div>

          <!-- Mode 2: 22-Second Radial Timer for Post-Window Session Loads -->
          <div class="countdown-22s-wrap" id="cd22sWrap" style="display: none;">
            <svg class="countdown-svg-ring" viewBox="0 0 130 130" aria-hidden="true">
              <defs>
                <linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#ffd98f" />
                  <stop offset="50%" stop-color="#e8c582" />
                  <stop offset="100%" stop-color="#ea5880" />
                </linearGradient>
              </defs>
              <circle class="countdown-ring-bg" cx="65" cy="65" r="60" />
              <circle class="countdown-ring-bar" id="cdRingBar" cx="65" cy="65" r="60" />
            </svg>
            <span class="countdown-22s-num" id="cd22sNum">22</span>
          </div>

          <!-- Unlock / Open Button -->
          <button class="countdown-skip-btn" id="cdSkipBtn" type="button">
            <span>Open Surprise Now &rarr;</span>
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    // 1. Spawn floating background ambient motes
    const motesEl = this.element.querySelector('#act0Motes');
    if (motesEl) {
      const cleanupMotes = ParticleEmitter.spawnFloatingMotes(motesEl, 10);
      this.cleanups.push(cleanupMotes);
    }

    // 2. Setup Heart Breathing Animation
    this.setupHeartAnimations();

    // 3. Evaluate & Initialize Countdown System State
    this.initCountdownSystem();
  }

  setupHeartAnimations() {
    const eyebrow = this.element.querySelector('#act0Eyebrow');
    const title = this.element.querySelector('#act0Title');
    const heartBtn = this.element.querySelector('#act0HeartBtn');
    const hint = this.element.querySelector('#act0Hint');
    const glow = this.element.querySelector('#act0Glow');
    const heartSvg = this.element.querySelector('#act0HeartSvg');

    const introTL = gsap.timeline();
    introTL
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
      .to(title, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
      .fromTo(heartBtn, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.4)' }, '-=0.4')
      .to(hint, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.2');

    // Heart breathing loop
    this.heartBeatTL = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
    this.heartBeatTL
      .to(heartSvg, { scale: 1.08, duration: 0.14, ease: 'power2.out' }, 0)
      .to(glow, { scale: 1.25, opacity: 0.9, duration: 0.14, ease: 'power2.out' }, 0)
      .to(heartSvg, { scale: 1.0, duration: 0.22, ease: 'power2.in' }, 0.14)
      .to(heartSvg, { scale: 1.05, duration: 0.12, ease: 'power2.out' }, 0.36)
      .to(heartSvg, { scale: 1.0, duration: 0.45, ease: 'power2.inOut' }, 0.48)
      .to(glow, { scale: 1.0, opacity: 0.6, duration: 0.65, ease: 'power2.inOut' }, 0.36);

    // Bind interaction handler
    const handleTap = (e) => {
      e.stopPropagation();
      this.triggerMysteryHeart();
    };

    heartBtn.addEventListener('click', handleTap);
    this.element.addEventListener('click', handleTap);
    this.cleanups.push(() => {
      heartBtn.removeEventListener('click', handleTap);
      this.element.removeEventListener('click', handleTap);
    });
  }

  initCountdownSystem() {
    const status = CountdownManager.getStatus();
    const overlay = this.element.querySelector('#cdOverlay');
    const eyebrow = this.element.querySelector('#cdEyebrow');
    const title = this.element.querySelector('#cdTitle');
    const grid = this.element.querySelector('#cdGrid');
    const wrap22s = this.element.querySelector('#cd22sWrap');
    const skipBtn = this.element.querySelector('#cdSkipBtn');

    if (status.mode === 'UNLOCKED_LIVE') {
      // Direct live unlock (Oct 7 between 00:00 and 00:05)
      if (overlay) overlay.style.display = 'none';
      return;
    }

    if (!overlay) return;
    overlay.style.display = 'flex';

    if (status.mode === 'PRE_BIRTHDAY') {
      // Mode 1: Real-time countdown HH:MM:SS to 07-10-2026 00:00:00
      grid.style.display = 'flex';
      wrap22s.style.display = 'none';
      if (skipBtn) skipBtn.style.display = 'inline-flex';

      const updateClock = () => {
        const curStatus = CountdownManager.getStatus();
        if (curStatus.remainingMs <= 0 || curStatus.mode !== 'PRE_BIRTHDAY') {
          this.unlockFromCountdown();
          return;
        }
        const { hours, mins, secs } = CountdownManager.formatTime(curStatus.remainingMs);
        const hEl = this.element.querySelector('#cdHours');
        const mEl = this.element.querySelector('#cdMins');
        const sEl = this.element.querySelector('#cdSecs');
        if (hEl) hEl.textContent = hours;
        if (mEl) mEl.textContent = mins;
        if (sEl) sEl.textContent = secs;
      };

      updateClock();
      this.countdownTimer = setInterval(updateClock, 1000);
      this.cleanups.push(() => clearInterval(this.countdownTimer));

      if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.unlockFromCountdown();
        });
      }
    } else if (status.mode === 'POST_WINDOW_22S') {
      // Mode 2: Opened after 00:05:00 -> Starts 22-second countdown overlay on every session load
      grid.style.display = 'none';
      wrap22s.style.display = 'flex';
      if (eyebrow) eyebrow.textContent = `Your birthday journey begins in... ✨`;
      if (title) title.textContent = `${BIRTHDAY_CONFIG.recipientName}'s Special Day`;
      if (skipBtn) skipBtn.style.display = 'inline-flex';

      this.countdownSec = 22;
      const numEl = this.element.querySelector('#cd22sNum');
      const ringBar = this.element.querySelector('#cdRingBar');
      const circumference = 377; // 2 * PI * 60

      const update22s = () => {
        this.countdownSec--;
        if (numEl) numEl.textContent = String(Math.max(0, this.countdownSec));
        
        if (ringBar) {
          const progress = (22 - this.countdownSec) / 22;
          const offset = circumference * progress;
          ringBar.style.strokeDashoffset = String(offset);
        }

        if (this.countdownSec <= 0) {
          this.unlockFromCountdown();
        }
      };

      this.countdownTimer = setInterval(update22s, 1000);
      this.cleanups.push(() => clearInterval(this.countdownTimer));

      if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.unlockFromCountdown();
        });
      }
    }
  }

  unlockFromCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    const overlay = this.element.querySelector('#cdOverlay');
    const card = this.element.querySelector('#cdCard');

    if (!overlay) return;

    // Trigger celebratory sparkles & sounds on unlock
    audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.9);

    const rect = card ? card.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    ParticleEmitter.spawnBurst(this.element, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      count: 20,
      type: 'gold',
      minDistance: 40,
      maxDistance: 150,
      duration: 1.0
    });

    gsap.to(overlay, {
      opacity: 0,
      scale: 1.05,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => {
        overlay.style.display = 'none';
      }
    });
  }

  triggerMysteryHeart() {
    if (this.isTriggered) return;
    this.isTriggered = true;

    // 1. Ensure audio context is unlocked
    audioManager.unlock();

    // 2. Play soundtrack & sparkle SFX
    audioManager.playMusic(AUDIO_TRACKS.MYSTERY_INTRO, true, 0.85);
    audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.9);

    // 3. Emit event
    eventBus.emit(EVENTS.MYSTERY_HEART_TAPPED);

    // 4. Stop continuous heartbeat and do a celebratory pulse
    if (this.heartBeatTL) {
      this.heartBeatTL.kill();
      this.heartBeatTL = null;
    }

    const heartBtn = this.element.querySelector('#act0HeartBtn');
    const rect = heartBtn ? heartBtn.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 5. Spawn small heart burst particles
    ParticleEmitter.spawnBurst(this.element, {
      x: centerX,
      y: centerY,
      count: 14,
      type: 'heart',
      minDistance: 30,
      maxDistance: 110,
      duration: 0.8
    });

    // 6. Pulse heart, fade text, and transition into Act 1
    const exitTL = gsap.timeline({
      onComplete: () => {
        sceneManager.transitionTo(SCENES.ACT_1);
      }
    });

    exitTL
      .to(heartBtn, { scale: 1.25, duration: 0.24, ease: 'power2.out' })
      .to(['#act0Eyebrow', '#act0Title', '#act0Hint'], { opacity: 0, y: -10, duration: 0.35, ease: 'power2.in' }, 0)
      .to(this.element, { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, 0.25);
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async exit() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.heartBeatTL) {
      this.heartBeatTL.kill();
      this.heartBeatTL = null;
    }
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  destroy() {
    this.exit();
    this.container = null;
  }
}
