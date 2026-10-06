/**
 * Act 3 — Cinematic Birthday Reveal
 * Kinetic typography blooming out of the deep rose field.
 * Word-by-word masked reveal: "Happy" -> "Birthday" -> "Happy Birthday, [recipientName]"
 * with gold brush underline and subtle ambient particles.
 */

import gsap from 'gsap';
import { SCENES, sceneManager } from '../core/SceneManager.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';
import { BIRTHDAY_CONFIG } from '../config/content.config.js';
import { ParticleEmitter } from '../utils/particles.js';

export class Act3_Reveal {
  constructor() {
    this.id = SCENES.ACT_3;
    this.container = null;
    this.element = null;
    this.cleanups = [];
    this.revealTL = null;
  }

  async enter(hostElement) {
    this.container = hostElement;
    this.cleanups = [];

    const recipientName = BIRTHDAY_CONFIG.recipientName || 'You';
    const subtitle = BIRTHDAY_CONFIG.revealSubtitle || '';

    // Create Act 3 DOM
    this.element = document.createElement('div');
    this.element.className = 'act3-stage';
    this.element.id = 'act3-stage';
    this.element.innerHTML = `
      <!-- Ambient Rose Blobs -->
      <div class="act3-blobs">
        <div class="act3-blob act3-blob-1"></div>
        <div class="act3-blob act3-blob-2"></div>
        <div class="act3-blob act3-blob-3"></div>
      </div>

      <!-- Floating golden sparks / motes -->
      <div class="act0-motes" id="act3Motes"></div>

      <!-- Cinema Camera Wrapper -->
      <div class="act3-camera" id="act3Camera">
        <p class="act3-eyebrow" id="act3Eyebrow">make a wish&hellip;</p>
        
        <div class="act3-headline" id="act3Headline">
          <div class="act3-line">
            <span class="act3-mask">
              <span class="act3-word" id="act3Happy">Happy</span>
            </span>
          </div>
          <div class="act3-line">
            <span class="act3-mask">
              <span class="act3-word" id="act3Birthday">Birthday</span>
            </span>
          </div>
          <div class="act3-line" id="act3NameLineWrap" style="opacity: 0; transform: translateY(14px);">
            <span class="act3-name-line" id="act3NameLine">${this.escapeHtml(recipientName)}</span>
          </div>
        </div>

        <!-- Gold Brush Pen-stroke Underline -->
        <svg class="act3-underline-svg" id="act3Underline" viewBox="0 0 300 26" fill="none" aria-hidden="true">
          <path id="act3UnderlinePath" d="M8 16C56 7 132 4 178 6c30 1 78 5 114 12-40 3-108 4-176 3"
                stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

        ${subtitle ? `<p class="act3-subtitle" id="act3Subtitle">${this.escapeHtml(subtitle)}</p>` : ''}
      </div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    // Crossfade music to 03_birthday_reveal.mp3
    audioManager.crossfadeMusic(AUDIO_TRACKS.BIRTHDAY_REVEAL, 800, false, 0.9);

    // Spawn subtle floating ambient particles
    const motesEl = this.element.querySelector('#act3Motes');
    if (motesEl) {
      const cleanupMotes = ParticleEmitter.spawnFloatingMotes(motesEl, 14);
      this.cleanups.push(cleanupMotes);
    }

    // Split words into character spans for 3D kinetic reveal
    const happyEl = this.element.querySelector('#act3Happy');
    const bdayEl = this.element.querySelector('#act3Birthday');
    const happyChars = this.splitChars(happyEl);
    const bdayChars = this.splitChars(bdayEl);

    const camera = this.element.querySelector('#act3Camera');
    const eyebrow = this.element.querySelector('#act3Eyebrow');
    const nameLineWrap = this.element.querySelector('#act3NameLineWrap');
    const underlinePath = this.element.querySelector('#act3UnderlinePath');
    const subtitleEl = this.element.querySelector('#act3Subtitle');

    // Setup SVG pen-stroke dasharray
    const pathLen = underlinePath.getTotalLength();
    underlinePath.style.strokeDasharray = `${pathLen}`;
    underlinePath.style.strokeDashoffset = `${pathLen}`;

    // Setup initial character 3D transforms
    gsap.set([...happyChars, ...bdayChars], {
      transformPerspective: 600,
      transformOrigin: '50% 100%',
      yPercent: 120,
      rotationX: -80,
      opacity: 0
    });

    // Orchestrate Kinetic Reveal Timeline
    this.revealTL = gsap.timeline({
      onComplete: () => {
        // Emit completion for milestone tracking
        eventBus.emit(EVENTS.BIRTHDAY_REVEAL_COMPLETE);
        // Hold the cinematic reveal briefly then transition to Act 4 Celebration
        gsap.delayedCall(2.2, () => {
          if (this.element && this.element.parentNode) {
            sceneManager.transitionTo(SCENES.ACT_4);
          }
        });
      }
    });

    // Camera slow push-in
    this.revealTL
      .fromTo(camera, { scale: 0.96 }, { scale: 1.04, duration: 4.5, ease: 'sine.out' }, 0)
      // 1. "make a wish..."
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.2)
      // 2. "Happy" staggered characters hinged up
      .to(happyChars, {
        yPercent: 0,
        rotationX: 0,
        opacity: 1,
        duration: 0.65,
        stagger: 0.04,
        ease: 'power3.out'
      }, 0.6)
      // 3. "Birthday" staggered characters hinged up
      .to(bdayChars, {
        yPercent: 0,
        rotationX: 0,
        opacity: 1,
        duration: 0.65,
        stagger: 0.04,
        ease: 'power3.out'
      }, 1.1)
      // 4. Recipient Name reveal
      .to(nameLineWrap, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'back.out(1.3)'
      }, 1.7)
      // 5. Gold pen-stroke underline drawn
      .to(underlinePath, {
        strokeDashoffset: 0,
        duration: 0.7,
        ease: 'power2.inOut'
      }, 2.1);

    // 6. Optional subtitle reveal
    if (subtitleEl) {
      this.revealTL.to(subtitleEl, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, 2.5);
    }
  }

  splitChars(el) {
    if (!el) return [];
    const text = el.textContent || '';
    el.textContent = '';
    return [...text].map((char) => {
      const span = document.createElement('span');
      span.className = 'act3-char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      el.appendChild(span);
      return span;
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async exit() {
    if (this.revealTL) {
      this.revealTL.kill();
      this.revealTL = null;
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
