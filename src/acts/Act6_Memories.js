/**
 * Act 6 — The Memory Gallery (Polaroid Scrapbook)
 * 
 * Nostalgic scrapbook journey:
 * - Emotional intro sequence ("Some memories are worth keeping." -> "Our little memories.")
 * - Touch & pointer swipeable card deck with organic Polaroid styling
 * - Configuration-driven memory cards strictly read from src/config/memory.config.js
 * - Smooth image preloading and missing image graceful fallback
 * - Fullscreen photo lightbox with photo-open SFX & metadata
 * - Desktop side controls + keyboard arrows & Escape support
 * - Final memory ending ("And there is one last thing..." -> "Continue →")
 * - Emits MEMORY_CHANGED, PHOTO_OPENED, PHOTO_CLOSED, and LAST_MEMORY_REACHED
 */

import gsap from 'gsap';
import { SCENES } from '../core/SceneManager.js';
import { sceneManager } from '../core/SceneManager.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';
import { MEMORIES } from '../config/memory.config.js';
import { ParticleEmitter } from '../utils/particles.js';

/**
 * Returns a cascade of alternative paths for a memory image to guarantee
 * loading across Vercel, local dev, subpaths, and GitHub raw URLs.
 */
export function getPhotoFallbackChain(rawSrc) {
  if (!rawSrc) return [];
  const fileName = rawSrc.split('/').pop();
  return [
    rawSrc,
    `./gallery/${fileName}`,
    `/gallery/${fileName}`,
    `gallery/${fileName}`,
    `./images/${fileName}`,
    `/images/${fileName}`,
    `images/${fileName}`,
    `./memories/${fileName}`,
    `/memories/${fileName}`,
    `memories/${fileName}`,
    `https://raw.githubusercontent.com/viegz11/Birthday/main/public/gallery/${fileName}`,
    `https://raw.githubusercontent.com/viegz11/Birthday/main/public/memories/${fileName}`
  ];
}

// Global hook for card photo fallback handling
if (typeof window !== 'undefined') {
  window.__handlePhotoError = function(imgEl) {
    if (!imgEl) return;
    const rawSrc = imgEl.getAttribute('data-initial-src') || imgEl.getAttribute('src') || '';
    if (!imgEl._srcChain || imgEl._srcChain.length === 0) {
      imgEl._srcChain = getPhotoFallbackChain(rawSrc);
    }
    const sources = imgEl._srcChain || [];
    let nextIdx = (parseInt(imgEl.dataset.srcIdx, 10) || 0) + 1;
    if (nextIdx < sources.length) {
      imgEl.dataset.srcIdx = String(nextIdx);
      imgEl.src = sources[nextIdx];
    } else {
      imgEl.style.display = 'none';
      const wrapper = imgEl.parentElement;
      if (wrapper) {
        const shimmer = wrapper.querySelector('.act6-photo-shimmer');
        if (shimmer) shimmer.style.display = 'none';
        const placeholder = wrapper.querySelector('.act6-photo-placeholder');
        if (placeholder) placeholder.style.display = 'flex';
      }
    }
  };

  window.__handlePhotoLoad = function(imgEl) {
    if (!imgEl) return;
    imgEl.style.opacity = '1';
    imgEl.style.display = 'block';
    const wrapper = imgEl.parentElement;
    if (wrapper) {
      const shimmer = wrapper.querySelector('.act6-photo-shimmer');
      if (shimmer) shimmer.style.display = 'none';
      const placeholder = wrapper.querySelector('.act6-photo-placeholder');
      if (placeholder) placeholder.style.display = 'none';
    }
  };
}

export class Act6_Memories {
  constructor() {
    this.id = SCENES.ACT_6;
    this.container = null;
    this.element = null;
    this.cleanups = [];
    this.currentIndex = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragCurrentX = 0;
    this.isTransitioning = false;
    this.hasInteracted = false;
    this.lightboxActive = false;
    this.memoriesList = [];
    this.cardElements = [];
  }

  async enter(hostElement) {
    this.container = hostElement;
    this.cleanups = [];
    this.currentIndex = 0;
    this.isDragging = false;
    this.isTransitioning = false;
    this.hasInteracted = false;
    this.lightboxActive = false;

    // Load memories safely from config
    this.memoriesList = (Array.isArray(MEMORIES) && MEMORIES.length > 0)
      ? MEMORIES
      : [
          {
            id: 1,
            image: '/images/img.png',
            tag: 'Memories',
            caption: 'Every moment spent together becomes a treasured memory.',
            date: 'Cherished Days'
          }
        ];

    // Create Act 6 DOM structure
    this.element = document.createElement('div');
    this.element.className = 'act6-stage';
    this.element.id = 'act6-stage';
    this.element.innerHTML = `
      <!-- Background Ambient Glow & Motes -->
      <div class="act6-bg-glow" id="act6BgGlow"></div>
      <div class="act6-motes" id="act6Motes"></div>

      <!-- Intro Narrative Overlay -->
      <div class="act6-intro-overlay" id="act6IntroOverlay">
        <h2 class="act6-intro-title" id="act6IntroTitle">Some memories are worth keeping.</h2>
        <p class="act6-intro-subtitle" id="act6IntroSubtitle">Our little memories.</p>
      </div>

      <!-- Gallery Main Stage -->
      <div class="act6-gallery-viewport" id="act6Viewport">
        
        <!-- Header -->
        <header class="act6-header" id="act6Header">
          <h3 class="act6-header-title">Our Little Memories</h3>
          <p class="act6-header-subtitle">Moments We Treasure</p>
        </header>

        <!-- Desktop Navigation Buttons -->
        <button class="act6-nav-btn act6-nav-prev" id="act6NavPrev" type="button" aria-label="Previous memory" disabled>
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
        <button class="act6-nav-btn act6-nav-next" id="act6NavNext" type="button" aria-label="Next memory">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>

        <!-- Polaroid Card Deck -->
        <div class="act6-card-deck" id="act6CardDeck">
          ${this.memoriesList.map((mem, index) => this.renderCardHtml(mem, index)).join('')}
        </div>

        <!-- Pagination Dots -->
        <div class="act6-dots-container" id="act6Dots">
          ${this.memoriesList.map((_, index) => `
            <button class="act6-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Go to memory ${index + 1}"></button>
          `).join('')}
        </div>

        <!-- Swipe Hint (only initially visible on first card) -->
        <div class="act6-swipe-hint" id="act6SwipeHint">
          <span>Swipe to explore</span>
          <span class="act6-swipe-arrows" aria-hidden="true">→</span>
        </div>

        <!-- Final Memory Ending CTA -->
        <div class="act6-ending-container" id="act6EndingContainer">
          <p class="act6-ending-title">And there is one last thing...</p>
          <button class="act6-continue-btn" id="act6ContinueBtn" type="button">
            <span>Continue</span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

      </div>

      <!-- Fullscreen Lightbox Photo Viewer -->
      <div class="act6-lightbox-overlay" id="act6Lightbox" role="dialog" aria-modal="true" aria-label="Fullscreen photo viewer">
        <button class="act6-lightbox-close" id="act6LightboxClose" type="button" aria-label="Close photo view">✕</button>
        <div class="act6-lightbox-content" id="act6LightboxContent">
          <div class="act6-lightbox-frame">
            <div class="act6-lightbox-shimmer" id="act6LightboxShimmer"></div>
            <img class="act6-lightbox-img" id="act6LightboxImg" src="" alt="Enlarged memory photo" />
            <div class="act6-lightbox-details">
              <div class="act6-lightbox-tag" id="act6LightboxTag"></div>
              <p class="act6-lightbox-caption" id="act6LightboxCaption"></p>
              <div class="act6-lightbox-date" id="act6LightboxDate"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    // Cache card elements and configure photo fallback chains
    this.cardElements = Array.from(this.element.querySelectorAll('.act6-polaroid-card'));
    this.cardElements.forEach((card, idx) => {
      const img = card.querySelector('.act6-photo-img');
      const mem = this.memoriesList[idx];
      if (img && mem && mem.image) {
        img._srcChain = getPhotoFallbackChain(mem.image);
        if (img.complete && img.naturalWidth > 0) {
          if (window.__handlePhotoLoad) window.__handlePhotoLoad(img);
        }
      }
    });

    // 1. Crossfade music to 07_memories.mp3
    audioManager.crossfadeMusic(AUDIO_TRACKS.MEMORIES, 1000, true, 0.7);

    // 2. Spawn gentle ambient motes
    const motesEl = this.element.querySelector('#act6Motes');
    if (motesEl) {
      const cleanupMotes = ParticleEmitter.spawnFloatingMotes(motesEl, 12);
      this.cleanups.push(cleanupMotes);
    }

    // 3. Preload initial images
    this.preloadAdjacentImages(0);

    // 4. Initial card deck positioning
    this.updateCardPositions(false);

    // 5. Attach event listeners
    this.bindEvents();

    // 6. Run Intro narrative transition
    this.runIntroSequence();
  }

  renderCardHtml(memory, index) {
    const hasTag = Boolean(memory.tag && memory.tag.trim());
    const hasDate = Boolean(memory.date && memory.date.trim());
    const hasCaption = Boolean(memory.caption && memory.caption.trim());
    const hasImage = Boolean(memory.image && memory.image.trim());

    // Pseudo-random subtle tilt for tactile charm
    const tilts = [-2.2, 1.8, -1.4, 2.5, -2.8, 1.5];
    const tilt = tilts[index % tilts.length];

    return `
      <article 
        class="act6-polaroid-card" 
        id="polaroid-${index}" 
        data-index="${index}" 
        data-tilt="${tilt}"
        role="button" 
        tabindex="0" 
        aria-label="Memory ${index + 1} of ${this.memoriesList.length}: ${memory.tag || 'Cherished moment'}"
      >
        <!-- Washi Tape Accent -->
        <div class="act6-card-tape"></div>

        <!-- Photo Wrapper -->
        <div class="act6-photo-wrapper">
          <div class="act6-photo-shimmer"></div>
          ${hasImage ? `
            <img 
              class="act6-photo-img" 
              src="${memory.image}" 
              data-initial-src="${memory.image}"
              alt="${memory.tag || 'Memory photo'}" 
              loading="${index === 0 ? 'eager' : 'lazy'}"
              data-src-idx="0"
              onload="if(window.__handlePhotoLoad) window.__handlePhotoLoad(this)"
              onerror="if(window.__handlePhotoError) window.__handlePhotoError(this)"
            />
            <div class="act6-photo-placeholder" style="display: none;">
              <span class="act6-placeholder-icon">📸</span>
              <p class="act6-placeholder-text">Memory Snapshot</p>
            </div>
          ` : `
            <div class="act6-photo-placeholder">
              <span class="act6-placeholder-icon">📸</span>
              <p class="act6-placeholder-text">Add your photo here</p>
            </div>
          `}
          <span class="act6-expand-hint" aria-hidden="true">⤢</span>
        </div>

        <!-- Metadata & Caption -->
        <div class="act6-card-details">
          ${(hasTag || hasDate) ? `
            <div class="act6-card-meta-row">
              ${hasTag ? `<span class="act6-card-tag">${memory.tag}</span>` : '<span></span>'}
              ${hasDate ? `<span class="act6-card-date">${memory.date}</span>` : ''}
            </div>
          ` : ''}
          ${hasCaption ? `<p class="act6-card-caption">${memory.caption}</p>` : ''}
        </div>
      </article>
    `;
  }

  runIntroSequence() {
    const introOverlay = this.element.querySelector('#act6IntroOverlay');
    const introTitle = this.element.querySelector('#act6IntroTitle');
    const introSubtitle = this.element.querySelector('#act6IntroSubtitle');
    const header = this.element.querySelector('#act6Header');
    const swipeHint = this.element.querySelector('#act6SwipeHint');

    const introTL = gsap.timeline({
      onComplete: () => {
        if (introOverlay && introOverlay.parentNode) {
          introOverlay.parentNode.removeChild(introOverlay);
        }
      }
    });

    introTL
      .to(introTitle, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.2)
      .to(introSubtitle, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.8)
      .to([introTitle, introSubtitle], { opacity: 0, y: -10, duration: 0.6, ease: 'power2.in' }, 2.2)
      .to(introOverlay, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 2.6)
      .to(header, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 2.8)
      .to(swipeHint, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 3.0);
  }

  bindEvents() {
    const deck = this.element.querySelector('#act6CardDeck');
    const prevBtn = this.element.querySelector('#act6NavPrev');
    const nextBtn = this.element.querySelector('#act6NavNext');
    const dotsContainer = this.element.querySelector('#act6Dots');
    const lightbox = this.element.querySelector('#act6Lightbox');
    const lightboxClose = this.element.querySelector('#act6LightboxClose');
    const continueBtn = this.element.querySelector('#act6ContinueBtn');

    // 1. Pointer & Touch Drag on Deck
    const onPointerDown = (e) => {
      if (this.isTransitioning || this.lightboxActive) return;
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragCurrentX = e.clientX;
      deck.style.cursor = 'grabbing';
      if (e.target.setPointerCapture) {
        try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || this.isTransitioning || this.lightboxActive) return;
      this.dragCurrentX = e.clientX;
      const deltaX = this.dragCurrentX - this.dragStartX;
      
      // Real-time tactile card drag
      const currentCard = this.cardElements[this.currentIndex];
      if (currentCard) {
        const baseTilt = parseFloat(currentCard.dataset.tilt || 0);
        const dragTilt = baseTilt + (deltaX * 0.05);
        gsap.set(currentCard, {
          x: deltaX,
          rotation: dragTilt,
          ease: 'none'
        });
      }
    };

    const onPointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      deck.style.cursor = '';
      const deltaX = this.dragCurrentX - this.dragStartX;

      // Dismiss swipe hint on first interaction
      this.dismissSwipeHint();

      if (Math.abs(deltaX) > 45) {
        if (deltaX < 0 && this.currentIndex < this.memoriesList.length - 1) {
          this.goToMemory(this.currentIndex + 1, 'left');
        } else if (deltaX > 0 && this.currentIndex > 0) {
          this.goToMemory(this.currentIndex - 1, 'right');
        } else {
          this.resetCurrentCardPosition();
        }
      } else {
        this.resetCurrentCardPosition();
      }
    };

    if (deck) {
      deck.addEventListener('pointerdown', onPointerDown);
      deck.addEventListener('pointermove', onPointerMove);
      deck.addEventListener('pointerup', onPointerUp);
      deck.addEventListener('pointercancel', onPointerUp);

      this.cleanups.push(() => {
        deck.removeEventListener('pointerdown', onPointerDown);
        deck.removeEventListener('pointermove', onPointerMove);
        deck.removeEventListener('pointerup', onPointerUp);
        deck.removeEventListener('pointercancel', onPointerUp);
      });
    }

    // 2. Card Tap to open Fullscreen Lightbox
    this.cardElements.forEach((card, idx) => {
      const clickHandler = (e) => {
        // Prevent opening if user was actively dragging
        if (Math.abs(this.dragCurrentX - this.dragStartX) > 10) return;
        if (idx === this.currentIndex) {
          this.openLightbox(idx);
        } else {
          this.goToMemory(idx, idx > this.currentIndex ? 'left' : 'right');
        }
      };

      const keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openLightbox(idx);
        }
      };

      card.addEventListener('click', clickHandler);
      card.addEventListener('keydown', keyHandler);

      this.cleanups.push(() => {
        card.removeEventListener('click', clickHandler);
        card.removeEventListener('keydown', keyHandler);
      });
    });

    // 3. Desktop Prev / Next Buttons
    if (prevBtn) {
      const prevHandler = () => {
        this.dismissSwipeHint();
        if (this.currentIndex > 0) this.goToMemory(this.currentIndex - 1, 'right');
      };
      prevBtn.addEventListener('click', prevHandler);
      this.cleanups.push(() => prevBtn.removeEventListener('click', prevHandler));
    }

    if (nextBtn) {
      const nextHandler = () => {
        this.dismissSwipeHint();
        if (this.currentIndex < this.memoriesList.length - 1) this.goToMemory(this.currentIndex + 1, 'left');
      };
      nextBtn.addEventListener('click', nextHandler);
      this.cleanups.push(() => nextBtn.removeEventListener('click', nextHandler));
    }

    // 4. Dot Pagination
    if (dotsContainer) {
      const dotHandler = (e) => {
        const dot = e.target.closest('.act6-dot');
        if (!dot) return;
        const targetIdx = parseInt(dot.dataset.index, 10);
        if (!isNaN(targetIdx) && targetIdx !== this.currentIndex) {
          this.dismissSwipeHint();
          this.goToMemory(targetIdx, targetIdx > this.currentIndex ? 'left' : 'right');
        }
      };
      dotsContainer.addEventListener('click', dotHandler);
      this.cleanups.push(() => dotsContainer.removeEventListener('click', dotHandler));
    }

    // 5. Global Keyboard Listener (Arrow keys + Escape)
    const keyNavHandler = (e) => {
      if (this.lightboxActive) {
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowRight' && this.currentIndex < this.memoriesList.length - 1) {
          this.goToMemory(this.currentIndex + 1, 'left');
          this.populateLightbox(this.currentIndex);
        }
        if (e.key === 'ArrowLeft' && this.currentIndex > 0) {
          this.goToMemory(this.currentIndex - 1, 'right');
          this.populateLightbox(this.currentIndex);
        }
        return;
      }

      if (e.key === 'ArrowRight' && this.currentIndex < this.memoriesList.length - 1) {
        this.dismissSwipeHint();
        this.goToMemory(this.currentIndex + 1, 'left');
      } else if (e.key === 'ArrowLeft' && this.currentIndex > 0) {
        this.dismissSwipeHint();
        this.goToMemory(this.currentIndex - 1, 'right');
      }
    };
    window.addEventListener('keydown', keyNavHandler);
    this.cleanups.push(() => window.removeEventListener('keydown', keyNavHandler));

    // 6. Lightbox Close Listeners
    if (lightboxClose) {
      const closeHandler = (e) => {
        e.stopPropagation();
        this.closeLightbox();
      };
      lightboxClose.addEventListener('click', closeHandler);
      this.cleanups.push(() => lightboxClose.removeEventListener('click', closeHandler));
    }

    if (lightbox) {
      const overlayHandler = (e) => {
        if (e.target === lightbox) this.closeLightbox();
      };
      lightbox.addEventListener('click', overlayHandler);
      this.cleanups.push(() => lightbox.removeEventListener('click', overlayHandler));
    }

    // 7. Continue to Act 7 Button Trigger
    if (continueBtn) {
      const continueHandler = (e) => {
        e.stopPropagation();
        this.proceedToAct7();
      };
      continueBtn.addEventListener('click', continueHandler);
      this.cleanups.push(() => continueBtn.removeEventListener('click', continueHandler));
    }
  }

  dismissSwipeHint() {
    if (this.hasInteracted) return;
    this.hasInteracted = true;
    const swipeHint = this.element.querySelector('#act6SwipeHint');
    if (swipeHint) {
      gsap.to(swipeHint, {
        opacity: 0,
        y: 6,
        duration: 0.3,
        onComplete: () => {
          swipeHint.style.display = 'none';
        }
      });
    }
  }

  goToMemory(targetIndex, direction = 'left') {
    if (this.isTransitioning || targetIndex === this.currentIndex) return;
    if (targetIndex < 0 || targetIndex >= this.memoriesList.length) return;

    this.isTransitioning = true;
    const prevIndex = this.currentIndex;
    this.currentIndex = targetIndex;

    // Play subtle swipe SFX
    audioManager.playSFX(AUDIO_TRACKS.PHOTO_SWIPE, 0.65);

    // Emit memory changed event
    eventBus.emit(EVENTS.MEMORY_CHANGED, {
      index: this.currentIndex,
      total: this.memoriesList.length,
      memory: this.memoriesList[this.currentIndex]
    });

    // Preload neighbors
    this.preloadAdjacentImages(this.currentIndex);

    // Animate transition
    const oldCard = this.cardElements[prevIndex];
    const newCard = this.cardElements[this.currentIndex];

    const tl = gsap.timeline({
      onComplete: () => {
        this.isTransitioning = false;
        this.updateCardPositions(true);
        this.updateControlsState();
        if (this.lightboxActive) {
          this.populateLightbox(this.currentIndex);
        }
      }
    });

    if (direction === 'left') {
      // Swiped away to the left
      tl.to(oldCard, {
        x: -window.innerWidth * 0.8,
        rotation: -12,
        opacity: 0.4,
        scale: 0.9,
        duration: 0.4,
        ease: 'power2.in'
      }, 0);
    } else {
      // Swiped away to the right
      tl.to(oldCard, {
        x: window.innerWidth * 0.8,
        rotation: 12,
        opacity: 0.4,
        scale: 0.9,
        duration: 0.4,
        ease: 'power2.in'
      }, 0);
    }

    // Bring new card to foreground
    const baseTilt = parseFloat(newCard.dataset.tilt || 0);
    tl.fromTo(newCard, 
      {
        x: direction === 'left' ? 40 : -40,
        scale: 0.94,
        opacity: 0.8,
        rotation: baseTilt + (direction === 'left' ? 6 : -6)
      },
      {
        x: 0,
        scale: 1,
        opacity: 1,
        rotation: baseTilt,
        duration: 0.45,
        ease: 'power2.out'
      }, 0.1);
  }

  resetCurrentCardPosition() {
    const currentCard = this.cardElements[this.currentIndex];
    if (!currentCard) return;
    const baseTilt = parseFloat(currentCard.dataset.tilt || 0);
    gsap.to(currentCard, {
      x: 0,
      rotation: baseTilt,
      duration: 0.35,
      ease: 'back.out(1.4)'
    });
  }

  updateCardPositions(animated = true) {
    const total = this.cardElements.length;
    this.cardElements.forEach((card, idx) => {
      const baseTilt = parseFloat(card.dataset.tilt || 0);
      const diff = idx - this.currentIndex;

      if (idx === this.currentIndex) {
        // Active foreground card
        card.style.zIndex = '10';
        card.style.pointerEvents = 'auto';
        gsap.to(card, {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          rotation: baseTilt,
          duration: animated ? 0.4 : 0,
          ease: 'power2.out'
        });
      } else if (idx > this.currentIndex) {
        // Upcoming cards stacked behind
        const stackOffset = Math.min(diff, 3);
        card.style.zIndex = `${10 - stackOffset}`;
        card.style.pointerEvents = stackOffset === 1 ? 'auto' : 'none';
        gsap.to(card, {
          x: stackOffset * 10,
          y: stackOffset * 6,
          scale: 1 - stackOffset * 0.04,
          opacity: Math.max(0.4, 1 - stackOffset * 0.25),
          rotation: baseTilt + stackOffset * 1.5,
          duration: animated ? 0.4 : 0,
          ease: 'power2.out'
        });
      } else {
        // Already passed cards
        card.style.zIndex = '1';
        card.style.pointerEvents = 'none';
        gsap.to(card, {
          x: -window.innerWidth * 0.8,
          opacity: 0,
          scale: 0.85,
          duration: animated ? 0.3 : 0
        });
      }
    });

    this.updateControlsState();
  }

  updateControlsState() {
    const prevBtn = this.element.querySelector('#act6NavPrev');
    const nextBtn = this.element.querySelector('#act6NavNext');
    const dots = Array.from(this.element.querySelectorAll('.act6-dot'));
    const endingContainer = this.element.querySelector('#act6EndingContainer');

    if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
    if (nextBtn) nextBtn.disabled = this.currentIndex === this.memoriesList.length - 1;

    dots.forEach((dot, idx) => {
      if (idx === this.currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Check if on final memory
    if (this.currentIndex === this.memoriesList.length - 1) {
      if (endingContainer) {
        endingContainer.style.display = 'flex';
        gsap.to(endingContainer, { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power2.out' });
      }
    } else {
      if (endingContainer) {
        gsap.to(endingContainer, { opacity: 0, y: 10, duration: 0.25, onComplete: () => {
          endingContainer.style.display = 'none';
        }});
      }
    }
  }

  preloadAdjacentImages(index) {
    const indices = [index, index + 1, index - 1];
    indices.forEach(idx => {
      if (idx >= 0 && idx < this.memoriesList.length) {
        const mem = this.memoriesList[idx];
        if (mem && mem.image) {
          const chain = getPhotoFallbackChain(mem.image);
          if (chain.length > 0) {
            const img = new Image();
            img.src = chain[0];
          }
        }
      }
    });
  }

  openLightbox(index) {
    this.lightboxActive = true;
    const lightbox = this.element.querySelector('#act6Lightbox');
    this.populateLightbox(index);

    // Play photo open sound effect
    audioManager.playSFX(AUDIO_TRACKS.PHOTO_OPEN, 0.7);
    eventBus.emit(EVENTS.PHOTO_OPENED, { index, memory: this.memoriesList[index] });

    if (lightbox) {
      lightbox.classList.add('active');
    }
  }

  populateLightbox(index) {
    const memory = this.memoriesList[index];
    if (!memory) return;

    const img = this.element.querySelector('#act6LightboxImg');
    const shimmer = this.element.querySelector('#act6LightboxShimmer');
    const tag = this.element.querySelector('#act6LightboxTag');
    const caption = this.element.querySelector('#act6LightboxCaption');
    const date = this.element.querySelector('#act6LightboxDate');

    if (img) {
      if (memory.image) {
        img.style.display = 'block';
        img.style.opacity = '1';
        if (shimmer) shimmer.style.display = 'block';
        const fallbackChain = getPhotoFallbackChain(memory.image);
        img._srcChain = fallbackChain;
        img.dataset.srcIdx = '0';
        img.onload = () => {
          img.style.opacity = '1';
          img.style.display = 'block';
          if (shimmer) shimmer.style.display = 'none';
        };
        img.onerror = () => {
          let nextIdx = (parseInt(img.dataset.srcIdx, 10) || 0) + 1;
          if (nextIdx < fallbackChain.length) {
            img.dataset.srcIdx = String(nextIdx);
            img.src = fallbackChain[nextIdx];
          } else {
            if (shimmer) shimmer.style.display = 'none';
          }
        };
        img.src = fallbackChain[0] || memory.image;
        img.alt = memory.tag || 'Memory photo';
        if (img.complete && img.naturalWidth > 0) {
          if (shimmer) shimmer.style.display = 'none';
        }
      } else {
        img.style.display = 'none';
        if (shimmer) shimmer.style.display = 'none';
      }
    }

    if (tag) {
      if (memory.tag) {
        tag.textContent = memory.tag;
        tag.style.display = 'inline-block';
      } else {
        tag.style.display = 'none';
      }
    }

    if (caption) {
      if (memory.caption) {
        caption.textContent = memory.caption;
        caption.style.display = 'block';
      } else {
        caption.style.display = 'none';
      }
    }

    if (date) {
      if (memory.date) {
        date.textContent = memory.date;
        date.style.display = 'block';
      } else {
        date.style.display = 'none';
      }
    }
  }

  closeLightbox() {
    if (!this.lightboxActive) return;
    this.lightboxActive = false;
    const lightbox = this.element.querySelector('#act6Lightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
    }
    eventBus.emit(EVENTS.PHOTO_CLOSED);
  }

  proceedToAct7() {
    // 1. Play soft sparkle chime
    audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.6);

    // 2. Emit completion milestone
    eventBus.emit(EVENTS.LAST_MEMORY_REACHED);

    // 3. Warm golden light transition on the final card
    const finalCard = this.cardElements[this.currentIndex];
    const bgGlow = this.element.querySelector('#act6BgGlow');

    const exitTL = gsap.timeline({
      onComplete: () => {
        // Transition toward Act 7 (which is currently a stub)
        sceneManager.transitionTo(SCENES.ACT_7);
      }
    });

    exitTL
      .to(bgGlow, {
        background: 'radial-gradient(circle at 50% 50%, rgba(255, 214, 140, 0.45) 0%, rgba(220, 140, 80, 0.25) 50%, transparent 80%)',
        duration: 1.2,
        ease: 'power2.out'
      }, 0)
      .to(finalCard, {
        scale: 1.06,
        boxShadow: '0 0 50px rgba(255, 214, 140, 0.7)',
        duration: 1.0,
        ease: 'power2.out'
      }, 0)
      .call(() => {
        if (finalCard) {
          const rect = finalCard.getBoundingClientRect();
          ParticleEmitter.spawnBurst(this.element, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            count: 24,
            type: 'gold',
            minDistance: 30,
            maxDistance: 140,
            duration: 1.2
          });
        }
      }, null, 0.4);
  }

  async exit() {
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
