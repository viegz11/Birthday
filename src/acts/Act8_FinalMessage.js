/**
 * Act 8 — The Final Birthday Message
 * 
 * Sentimental, emotionally uplifting closing sequence:
 * - Living procedural Canvas 2D heart blossom tree in continuous ambient holding state
 * - Gentle blossom wind sway, falling petals, soft god rays, ground glow & halo
 * - Crossfaded background soundtrack (09_final_message.mp3)
 * - Sequential GSAP text reveal:
 *   1. "May your year bloom beautifully."
 *   2. "Happy Birthday, [recipientName] ❤️" (with single final-chime.mp3 SFX)
 *   3. Supporting lines from BIRTHDAY_CONFIG.finalMessage.lines
 * - Subtle, elegant "Experience it again" replay control that cleanly returns to Act 0
 * - Fully accessible with reduced-motion support and keyboard navigation
 */

import gsap from 'gsap';
import { SCENES, sceneManager } from '../core/SceneManager.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';
import { BIRTHDAY_CONFIG } from '../config/content.config.js';
import { TreeRenderer } from '../renderers/TreeRenderer.js';
import { ParticleEmitter } from '../utils/particles.js';

export class Act8_FinalMessage {
  constructor() {
    this.id = SCENES.ACT_8;
    this.container = null;
    this.element = null;
    this.treeRenderer = null;
    this.revealTL = null;
    this.cleanups = [];
    this.resizeObserver = null;
    this.isReplaying = false;
  }

  async enter(hostElement) {
    this.container = hostElement;
    this.cleanups = [];
    this.isReplaying = false;

    // Check accessibility reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Recipient & Content resolution from BIRTHDAY_CONFIG
    const recipientName = BIRTHDAY_CONFIG.recipientName || 'Friend';
    
    // Supporting lines (filter out any empty strings and the opening blessing if already configured)
    const rawLines = Array.isArray(BIRTHDAY_CONFIG.finalMessage?.lines)
      ? BIRTHDAY_CONFIG.finalMessage.lines
      : [];

    const firstBlessingLine = "May your year bloom beautifully.";

    // Filter supporting lines so we do not duplicate the opening line
    const supportingLines = rawLines.filter(line => {
      if (typeof line !== 'string') return false;
      const trimmed = line.trim();
      return trimmed.length > 0 && trimmed.toLowerCase() !== firstBlessingLine.toLowerCase();
    });

    // Build DOM Structure
    this.element = document.createElement('div');
    this.element.className = 'act8-stage';
    this.element.id = 'act8-stage';
    this.element.innerHTML = `
      <!-- Deep Cinematic Warm Atmosphere -->
      <div class="act8-atmosphere" id="act8Atmosphere"></div>
      <div class="act8-vignette"></div>
      <div class="act8-ground-glow" id="act8GroundGlow"></div>
      <div class="act8-motes" id="act8Motes"></div>

      <!-- Living Completed Blossom Tree Canvas -->
      <canvas class="act8-canvas" id="act8Canvas"></canvas>

      <!-- Atmospheric Text Gradient Scrim (Non-blocking) -->
      <div class="act8-text-scrim"></div>

      <!-- Final Message Cinematic Card & Text Frame -->
      <div class="act8-content-wrap" id="act8ContentWrap" role="region" aria-label="Final Birthday Wishes">
        <!-- 1. Opening Blessing -->
        <p class="act8-first-line" id="act8FirstLine">${firstBlessingLine}</p>

        <!-- 2. Main Hero Birthday Greeting -->
        <h1 class="act8-hero-title" id="act8HeroTitle">
          Happy Birthday, <span class="act8-name-highlight">${recipientName}</span> <span class="act8-heart-icon" aria-hidden="true">❤️</span>
        </h1>

        <!-- 3. Supporting Sentiments -->
        <div class="act8-supporting-wrap" id="act8SupportingWrap">
          ${supportingLines.map((line, idx) => `
            <p class="act8-supporting-line" id="act8Line${idx}">${line}</p>
          `).join('')}
        </div>

        <!-- 4. Subtle Replay Action -->
        <div class="act8-replay-wrap" id="act8ReplayWrap">
          <button class="act8-replay-btn" id="act8ReplayBtn" type="button" aria-label="Experience the birthday journey again from the beginning">
            <svg class="act8-replay-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Experience it again</span>
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    // 1. Initialize Living TreeRenderer on Canvas in fully bloomed state
    const canvas = this.element.querySelector('#act8Canvas');
    this.treeRenderer = new TreeRenderer(canvas);
    this.treeRenderer.init();
    this.treeRenderer.setProgress(1.0);
    this.treeRenderer.isFullyBloomed = true;
    this.treeRenderer.start();

    // 2. Attach Resize Observer
    this.resizeObserver = new ResizeObserver(() => {
      if (this.treeRenderer) {
        this.treeRenderer.resize();
        this.treeRenderer.setProgress(1.0);
      }
    });
    this.resizeObserver.observe(this.element);
    this.cleanups.push(() => {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    });

    // 3. Spawn subtle ambient motes
    const motesEl = this.element.querySelector('#act8Motes');
    if (motesEl) {
      const cleanupMotes = ParticleEmitter.spawnFloatingMotes(motesEl, 14);
      this.cleanups.push(cleanupMotes);
    }

    // 4. Music Transition: Smooth crossfade to 09_final_message.mp3
    audioManager.crossfadeMusic(AUDIO_TRACKS.FINAL_MESSAGE, 2000, true);

    // 5. Attach Replay Button Event Handler
    const replayBtn = this.element.querySelector('#act8ReplayBtn');
    if (replayBtn) {
      const handleReplayClick = (e) => {
        e.stopPropagation();
        this.handleReplay();
      };
      replayBtn.addEventListener('click', handleReplayClick);
      this.cleanups.push(() => {
        replayBtn.removeEventListener('click', handleReplayClick);
      });
    }

    // 6. Execute Sequential GSAP Text Entrance Timeline
    this.runTextRevealSequence(prefersReducedMotion, supportingLines.length);
  }

  /**
   * Orchestrates the pacing and reveal of the final birthday message.
   */
  runTextRevealSequence(prefersReducedMotion, lineCount) {
    const firstLine = this.element.querySelector('#act8FirstLine');
    const heroTitle = this.element.querySelector('#act8HeroTitle');
    const supportingLinesEls = this.element.querySelectorAll('.act8-supporting-line');
    const replayWrap = this.element.querySelector('#act8ReplayWrap');
    const groundGlow = this.element.querySelector('#act8GroundGlow');
    const atmosphere = this.element.querySelector('#act8Atmosphere');

    // Set initial atmosphere state
    if (groundGlow) gsap.set(groundGlow, { opacity: 0.65 });
    if (atmosphere) gsap.set(atmosphere, { opacity: 0.8 });

    if (prefersReducedMotion) {
      // Reduced motion: Fast gentle fades
      const reducedTL = gsap.timeline();
      this.revealTL = reducedTL;

      reducedTL
        .to(firstLine, { opacity: 1, duration: 0.6 }, 0.4)
        .to(heroTitle, {
          opacity: 1,
          duration: 0.8,
          onStart: () => {
            audioManager.playSFX(AUDIO_TRACKS.FINAL_CHIME, 0.7);
          }
        }, 1.2)
        .to(supportingLinesEls, { opacity: 1, duration: 0.6, stagger: 0.3 }, 2.2)
        .call(() => {
          eventBus.emit(EVENTS.FINAL_MESSAGE_REVEALED);
        }, null, 2.6)
        .to(replayWrap, { opacity: 1, duration: 0.6 }, 3.2);

      return;
    }

    // Standard Cinematic Entrance Timeline
    const masterTL = gsap.timeline();
    this.revealTL = masterTL;

    masterTL
      // A. Brief breathing pause with living tree, then reveal first line
      .to(firstLine, {
        opacity: 1,
        y: 0,
        duration: 1.3,
        ease: 'power2.out'
      }, 0.8)

      // B. Pause, then reveal Hero Title ("Happy Birthday, [NAME] ❤️")
      .to(heroTitle, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: 'power2.out',
        onStart: () => {
          // Play single celebratory final chime
          audioManager.playSFX(AUDIO_TRACKS.FINAL_CHIME, 0.75);
        }
      }, 2.4)

      // C. Pause, then sequentially reveal supporting sentiment lines
      .to(supportingLinesEls, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        stagger: 0.85,
        ease: 'power2.out'
      }, 4.2)

      // D. Emit final milestone
      .call(() => {
        eventBus.emit(EVENTS.FINAL_MESSAGE_REVEALED);
      }, null, 4.2 + lineCount * 0.85)

      // E. Hold pause, then subtly reveal the "Experience it again" replay control
      .to(replayWrap, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power2.out'
      }, 5.5 + lineCount * 0.85);
  }

  /**
   * Graceful replay handler: resets audio, cleans up resources, and transitions back to Act 0.
   */
  handleReplay() {
    if (this.isReplaying) return;
    this.isReplaying = true;

    const replayBtn = this.element.querySelector('#act8ReplayBtn');
    if (replayBtn) replayBtn.disabled = true;

    // Emit replay event
    eventBus.emit(EVENTS.REPLAY_REQUESTED);

    // Fade out text overlay and scene smoothly
    gsap.to(this.element, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: async () => {
        // 1. Stop all playing audio & reset unlocked state so interaction is required on Act 0
        audioManager.stopAll();

        // 2. Destroy tree renderer
        if (this.treeRenderer) {
          this.treeRenderer.destroy();
          this.treeRenderer = null;
        }

        // 3. Reset SceneManager back to Act 0
        await sceneManager.transitionTo(SCENES.ACT_0);
      }
    });
  }

  async exit() {
    if (this.revealTL) {
      this.revealTL.kill();
      this.revealTL = null;
    }
    if (this.treeRenderer) {
      this.treeRenderer.destroy();
      this.treeRenderer = null;
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
