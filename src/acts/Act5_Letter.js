/**
 * Act 5 — The Personal Letter
 * 
 * Sincere, intimate handwritten card experience:
 * - Calmer, warm atmosphere following the birthday celebration
 * - Physical-looking ivory envelope with gold accents & 3D wax seal
 * - Realistic flap-opening and card unfolding mechanics
 * - Crossfaded acoustic letter music (06_letter.mp3) with envelope SFX
 * - Configuration-driven content strictly read from BIRTHDAY_CONFIG.letter
 * - Progressive paragraph reveal with gentle timing and skip/fast-forward support
 * - Final signature moment with delicate particle motes & "Continue to Memories →"
 * - Emits LETTER_OPENED and LETTER_COMPLETED
 */

import gsap from 'gsap';
import { SCENES } from '../core/SceneManager.js';
import { sceneManager } from '../core/SceneManager.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';
import { BIRTHDAY_CONFIG } from '../config/content.config.js';
import { ParticleEmitter } from '../utils/particles.js';

export class Act5_Letter {
  constructor() {
    this.id = SCENES.ACT_5;
    this.container = null;
    this.element = null;
    this.cleanups = [];
    this.envelopeTL = null;
    this.revealTL = null;
    this.isOpened = false;
    this.isRevealed = false;
  }

  async enter(hostElement) {
    this.container = hostElement;
    this.cleanups = [];
    this.isOpened = false;
    this.isRevealed = false;

    // Resolve Letter Content safely from BIRTHDAY_CONFIG
    const recipient = BIRTHDAY_CONFIG.recipientName && BIRTHDAY_CONFIG.recipientName !== 'YOUR_NAME_HERE'
      ? BIRTHDAY_CONFIG.recipientName
      : 'Friend';

    let greetingText = BIRTHDAY_CONFIG.letter?.greeting || 'Dear [Name],';
    greetingText = greetingText.replace(/\[Name\]/gi, recipient).replace(/\[recipientName\]/gi, recipient);

    const rawParagraphs = BIRTHDAY_CONFIG.letter?.paragraphs;
    const paragraphs = (Array.isArray(rawParagraphs) && rawParagraphs.length > 0)
      ? rawParagraphs
      : ['[Your personal message will appear here.]'];

    const closingText = (typeof BIRTHDAY_CONFIG.letter?.closing === 'string')
      ? BIRTHDAY_CONFIG.letter.closing
      : 'With love and best wishes,';
    const signatureText = BIRTHDAY_CONFIG.letter?.signature || 'Vignesh';

    // Create Act 5 DOM Structure
    this.element = document.createElement('div');
    this.element.className = 'act5-stage';
    this.element.id = 'act5-stage';
    this.element.innerHTML = `
      <!-- Background Ambient Glow & Motes -->
      <div class="act5-bg-glow" id="act5BgGlow"></div>
      <div class="act5-motes" id="act5Motes"></div>

      <!-- Intimate Prompt Heading -->
      <div class="act5-prompt-wrap" id="act5PromptWrap">
        <h2 class="act5-prompt-title" id="act5PromptTitle">I wrote something for you.</h2>
        <p class="act5-prompt-sub" id="act5PromptSub">Open it</p>
      </div>

      <!-- Envelope 3D Stage -->
      <div class="act5-envelope-viewport" id="act5EnvelopeViewport">
        <div class="act5-envelope" id="act5Envelope" role="button" tabindex="0" aria-label="Open personal letter">
          
          <!-- Back layer of envelope -->
          <div class="act5-env-back"></div>

          <!-- Inside Letter Card -->
          <article class="act5-letter-card" id="act5LetterCard" role="region" aria-label="Personal birthday letter">
            <div class="act5-letter-inner" id="act5LetterInner">
              <div class="act5-card-border-frame"></div>
              
              <!-- Subtle decorative crest -->
              <div class="act5-letter-header-decor">
                <span class="act5-decor-line"></span>
                <span class="act5-decor-heart">❦</span>
                <span class="act5-decor-line"></span>
              </div>

              <!-- Main Letter Body -->
              <div class="act5-letter-body" id="act5LetterBody">
                <h3 class="act5-letter-greeting" id="act5Greeting">${greetingText}</h3>
                
                <div class="act5-letter-paragraphs" id="act5Paragraphs">
                  ${paragraphs.map((p, idx) => `
                    <p class="act5-letter-p" id="letterP${idx}">${p}</p>
                  `).join('')}
                </div>

                <div class="act5-letter-sign-block" id="act5SignBlock">
                  ${closingText ? `<p class="act5-letter-closing" id="act5Closing">${closingText}</p>` : ''}
                  <p class="act5-letter-signature" id="act5Signature">${signatureText}</p>
                </div>
              </div>

              <!-- Footer Progression Button -->
              <div class="act5-letter-footer" id="act5Footer">
                <button class="act5-continue-btn" id="act5ContinueBtn" type="button" aria-label="Continue to Memories gallery">
                  <span>Continue to Memories</span>
                  <svg class="act5-arrow-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Front envelope folded pocket -->
          <div class="act5-env-pocket"></div>
          <div class="act5-env-bottom-fold"></div>

          <!-- Top Fold Triangular Flap -->
          <div class="act5-env-top-flap" id="act5TopFlap">
            <div class="act5-top-flap-triangle"></div>
          </div>

          <!-- Crimson-Gold Wax Seal -->
          <div class="act5-wax-seal" id="act5WaxSeal" role="button" tabindex="0" aria-label="Break wax seal and open letter">
            <div class="act5-seal-outer">
              <div class="act5-seal-inner">
                <span class="act5-seal-emblem">❤</span>
              </div>
            </div>
            <div class="act5-seal-glow"></div>
          </div>

        </div>
      </div>

      <!-- Quick Fast-Forward Button for Letter Reveal -->
      <button class="act5-skip-btn" id="act5SkipBtn" type="button">Tap to reveal all</button>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    // 1. Spawn subtle ambient drifting particles
    const motesEl = this.element.querySelector('#act5Motes');
    if (motesEl) {
      const cleanupMotes = ParticleEmitter.spawnFloatingMotes(motesEl, 10);
      this.cleanups.push(cleanupMotes);
    }

    // 2. Play subtle initial entrance animation for envelope & prompt
    this.runEntranceAnimation();

    // 3. Attach User Interaction Listeners
    this.bindEvents();
  }

  runEntranceAnimation() {
    const promptTitle = this.element.querySelector('#act5PromptTitle');
    const promptSub = this.element.querySelector('#act5PromptSub');
    const envelope = this.element.querySelector('#act5Envelope');
    const waxSeal = this.element.querySelector('#act5WaxSeal');

    gsap.set(envelope, { opacity: 0, y: 50, scale: 0.92 });
    gsap.set(waxSeal, { scale: 0, rotation: -20 });

    const entranceTL = gsap.timeline();
    entranceTL
      .to(promptTitle, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 0.2)
      .to(promptSub, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.6)
      .to(envelope, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.0,
        ease: 'back.out(1.2)'
      }, 0.5)
      .to(waxSeal, {
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: 'back.out(1.8)'
      }, 1.1);
  }

  bindEvents() {
    const envelope = this.element.querySelector('#act5Envelope');
    const waxSeal = this.element.querySelector('#act5WaxSeal');
    const letterCard = this.element.querySelector('#act5LetterCard');
    const skipBtn = this.element.querySelector('#act5SkipBtn');
    const continueBtn = this.element.querySelector('#act5ContinueBtn');

    // 1. Envelope opening trigger
    const openHandler = (e) => {
      e.stopPropagation();
      this.openEnvelope();
    };

    const keyOpenHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openEnvelope();
      }
    };

    if (waxSeal) {
      waxSeal.addEventListener('click', openHandler);
      waxSeal.addEventListener('keydown', keyOpenHandler);
      this.cleanups.push(() => {
        waxSeal.removeEventListener('click', openHandler);
        waxSeal.removeEventListener('keydown', keyOpenHandler);
      });
    }

    if (envelope) {
      envelope.addEventListener('click', openHandler);
      envelope.addEventListener('keydown', keyOpenHandler);
      this.cleanups.push(() => {
        envelope.removeEventListener('click', openHandler);
        envelope.removeEventListener('keydown', keyOpenHandler);
      });
    }

    // 2. Fast-forward / Skip typewriter animation
    const fastForwardHandler = (e) => {
      e.stopPropagation();
      this.fastForwardReveal();
    };

    if (skipBtn) {
      skipBtn.addEventListener('click', fastForwardHandler);
      this.cleanups.push(() => skipBtn.removeEventListener('click', fastForwardHandler));
    }

    if (letterCard) {
      letterCard.addEventListener('click', (e) => {
        // If clicking continue button, don't just skip
        if (e.target.closest('#act5ContinueBtn')) return;
        if (this.isOpened && !this.isRevealed) {
          this.fastForwardReveal();
        }
      });
    }

    // 3. Continue Button Trigger
    if (continueBtn) {
      const continueHandler = (e) => {
        e.stopPropagation();
        this.proceedToMemories();
      };
      continueBtn.addEventListener('click', continueHandler);
      this.cleanups.push(() => continueBtn.removeEventListener('click', continueHandler));
    }
  }

  openEnvelope() {
    if (this.isOpened) return;
    this.isOpened = true;

    const waxSeal = this.element.querySelector('#act5WaxSeal');
    const topFlap = this.element.querySelector('#act5TopFlap');
    const letterCard = this.element.querySelector('#act5LetterCard');
    const promptWrap = this.element.querySelector('#act5PromptWrap');
    const bgGlow = this.element.querySelector('#act5BgGlow');
    const skipBtn = this.element.querySelector('#act5SkipBtn');

    // 1. Play envelope open sound effect & crossfade music to 06_letter.mp3
    audioManager.playSFX(AUDIO_TRACKS.ENVELOPE_OPEN, 0.95);
    audioManager.crossfadeMusic(AUDIO_TRACKS.LETTER, 800, true, 0.75);

    // 2. Emit event
    eventBus.emit(EVENTS.LETTER_OPENED);

    // 3. Wax seal burst particles
    if (waxSeal) {
      const rect = waxSeal.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      ParticleEmitter.spawnBurst(this.element, {
        x: cx,
        y: cy,
        count: 14,
        type: 'gold',
        minDistance: 20,
        maxDistance: 80,
        duration: 0.6
      });
    }

    this.envelopeTL = gsap.timeline({
      onComplete: () => {
        letterCard.classList.add('expanded');
        // Show skip button softly
        if (skipBtn) {
          skipBtn.style.display = 'block';
          gsap.to(skipBtn, { opacity: 0.7, duration: 0.4 });
        }
        // Start reading reveal sequence
        this.runTextReveal();
      }
    });

    // Animate wax seal pop & top flap fold
    this.envelopeTL
      .to(waxSeal, {
        scale: 1.25,
        opacity: 0,
        y: -15,
        duration: 0.25,
        ease: 'power2.out'
      }, 0)
      .to(promptWrap, {
        opacity: 0,
        y: -15,
        duration: 0.5,
        ease: 'power2.in'
      }, 0.1)
      .to(topFlap, {
        rotationX: -180,
        duration: 0.65,
        ease: 'power2.inOut'
      }, 0.15)
      .to(bgGlow, {
        opacity: 0.35,
        duration: 1.0
      }, 0.2)
      // Letter card emerges out of pocket and expands forward
      .set(letterCard, { opacity: 1, zIndex: 6 }, 0.35)
      .to(letterCard, {
        y: '-=120',
        duration: 0.6,
        ease: 'power2.out'
      }, 0.35)
      .to(letterCard, {
        y: '0%',
        scale: 1,
        duration: 0.75,
        ease: 'power2.out'
      }, 0.85);
  }

  runTextReveal() {
    const greeting = this.element.querySelector('#act5Greeting');
    const paragraphEls = Array.from(this.element.querySelectorAll('.act5-letter-p'));
    const closing = this.element.querySelector('#act5Closing');
    const signature = this.element.querySelector('#act5Signature');
    const footer = this.element.querySelector('#act5Footer');
    const skipBtn = this.element.querySelector('#act5SkipBtn');

    this.revealTL = gsap.timeline({
      onComplete: () => {
        this.completeReveal();
      }
    });

    // Sequence: Greeting -> Paragraphs -> Closing -> Signature -> Footer
    this.revealTL
      .to(greeting, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out'
      }, 0.1);

    let currentTime = 0.8;

    paragraphEls.forEach((pEl, index) => {
      // Pause between paragraphs
      currentTime += 0.35;
      this.revealTL.to(pEl, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: 'power2.out'
      }, currentTime);
      currentTime += 0.6;
    });

    // Closing (if present)
    if (closing) {
      currentTime += 0.3;
      this.revealTL.to(closing, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, currentTime);
    }

    // Signature
    currentTime += 0.4;
    this.revealTL
      .call(() => {
        // Play gentle sparkle SFX during signature moment
        audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.6);
        
        // Spawn tiny drifting heart motes around the card
        const card = this.element.querySelector('#act5LetterCard');
        if (card) {
          const rect = card.getBoundingClientRect();
          ParticleEmitter.spawnBurst(this.element, {
            x: rect.right - 60,
            y: rect.bottom - 90,
            count: 10,
            type: 'gold',
            minDistance: 20,
            maxDistance: 70,
            duration: 1.2
          });
        }
      }, null, currentTime)
      .to(signature, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, currentTime);

    // Footer button reveal
    currentTime += 0.6;
    this.revealTL.to(footer, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'back.out(1.4)'
    }, currentTime);
  }

  fastForwardReveal() {
    if (this.isRevealed) return;
    if (this.revealTL) {
      this.revealTL.progress(1);
    }
    this.completeReveal();
  }

  completeReveal() {
    this.isRevealed = true;
    const skipBtn = this.element.querySelector('#act5SkipBtn');
    if (skipBtn) {
      gsap.to(skipBtn, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          skipBtn.style.display = 'none';
        }
      });
    }

    const greeting = this.element.querySelector('#act5Greeting');
    const paragraphEls = Array.from(this.element.querySelectorAll('.act5-letter-p'));
    const closing = this.element.querySelector('#act5Closing');
    const signature = this.element.querySelector('#act5Signature');
    const footer = this.element.querySelector('#act5Footer');

    const revealItems = [greeting, ...paragraphEls, signature, footer];
    if (closing) revealItems.push(closing);

    gsap.set(revealItems, {
      opacity: 1,
      y: 0
    });
  }

  proceedToMemories() {
    // 1. Play soft sparkle click feedback
    audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.5);

    // 2. Emit milestone event
    eventBus.emit(EVENTS.LETTER_COMPLETED);

    // 3. Transition toward Act 6 (which is currently a stub)
    sceneManager.transitionTo(SCENES.ACT_6);
  }

  async exit() {
    if (this.envelopeTL) {
      this.envelopeTL.kill();
      this.envelopeTL = null;
    }
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
