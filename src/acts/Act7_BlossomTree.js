/**
 * Act 7 — The Heart Blossom Tree
 * 
 * Cinematic climax of the birthday experience:
 * - Opening narrative: "And there is one last thing..."
 * - Glowing golden seed descends with luminous light trail
 * - Ground touchdown trigger: particle burst, golden ripple, tree-grow SFX
 * - Background music crossfaded to 08_final_bloom.mp3
 * - Progressive organic Canvas 2D tree growth: roots -> trunk -> branches -> layered blossoms -> radiant heart canopy
 * - Restrained palette: blush, soft pink, rose, ivory, champagne, gold
 * - Floating petals, ambient motes, and cinematic god rays
 * - Emits SEED_GERMINATED, TREE_GROWTH_START, and TREE_BLOOMED
 */

import gsap from 'gsap';
import { SCENES, sceneManager } from '../core/SceneManager.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';
import { TreeRenderer } from '../renderers/TreeRenderer.js';
import { ParticleEmitter } from '../utils/particles.js';

export class Act7_BlossomTree {
  constructor() {
    this.id = SCENES.ACT_7;
    this.container = null;
    this.element = null;
    this.treeRenderer = null;
    this.growthTL = null;
    this.cleanups = [];
    this.resizeObserver = null;
    this.isBloomed = false;
  }

  async enter(hostElement) {
    this.container = hostElement;
    this.cleanups = [];
    this.isBloomed = false;

    // Check accessibility reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const growthDuration = prefersReducedMotion ? 3.0 : 9.0;

    // Build DOM structure
    this.element = document.createElement('div');
    this.element.className = 'act7-stage';
    this.element.id = 'act7-stage';
    this.element.innerHTML = `
      <!-- Deep Cinematic Warm Atmosphere -->
      <div class="act7-atmosphere" id="act7Atmosphere"></div>
      <div class="act7-vignette"></div>
      <div class="act7-ground-glow" id="act7GroundGlow"></div>
      <div class="act7-motes" id="act7Motes"></div>

      <!-- Main Canvas for Tree, Blossoms, God Rays, and Petals -->
      <canvas class="act7-canvas" id="act7Canvas"></canvas>

      <!-- Opening Narrative Text Overlay -->
      <div class="act7-intro-wrap" id="act7IntroWrap">
        <p class="act7-intro-text" id="act7IntroText">And there is one last thing...</p>
      </div>

      <!-- Golden Glowing Seed -->
      <div class="act7-seed-container" id="act7SeedContainer">
        <div class="act7-seed-glow"></div>
        <div class="act7-seed-core"></div>
        <div class="act7-seed-trail" id="act7SeedTrail"></div>
      </div>

      <!-- Ground Touchdown Ripple Effect -->
      <div class="act7-ground-ripple" id="act7GroundRipple"></div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    // 1. Initialize TreeRenderer on Canvas
    const canvas = this.element.querySelector('#act7Canvas');
    this.treeRenderer = new TreeRenderer(canvas);
    this.treeRenderer.init();

    // 2. Attach Resize Observer for responsive canvas scaling
    this.resizeObserver = new ResizeObserver(() => {
      if (this.treeRenderer) {
        this.treeRenderer.resize();
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
    const motesEl = this.element.querySelector('#act7Motes');
    if (motesEl) {
      const cleanupMotes = ParticleEmitter.spawnFloatingMotes(motesEl, 12);
      this.cleanups.push(cleanupMotes);
    }

    // 4. Start TreeRenderer loop in idle/waiting state
    this.treeRenderer.start();

    // 5. Start 08_final_bloom.mp3 as golden seed transition begins
    audioManager.crossfadeMusic(AUDIO_TRACKS.FINAL_BLOOM, 1200, true, 0.8);

    // 6. Run the master cinematic entrance sequence
    this.runIntroSequence(growthDuration);
  }

  runIntroSequence(growthDuration) {
    const introWrap = this.element.querySelector('#act7IntroWrap');
    const introText = this.element.querySelector('#act7IntroText');
    const seedContainer = this.element.querySelector('#act7SeedContainer');
    const groundRipple = this.element.querySelector('#act7GroundRipple');
    const groundGlow = this.element.querySelector('#act7GroundGlow');
    const atmosphere = this.element.querySelector('#act7Atmosphere');

    const seedStartX = window.innerWidth * 0.5;
    const seedStartY = window.innerHeight * 0.38;
    const groundY = this.treeRenderer ? this.treeRenderer.groundY : window.innerHeight * 0.82;

    // Set initial seed coordinates
    gsap.set(seedContainer, {
      x: seedStartX,
      y: seedStartY,
      opacity: 0,
      scale: 0.2
    });

    const masterTL = gsap.timeline();
    this.growthTL = masterTL;

    // A. Intro Text ("And there is one last thing...")
    masterTL
      .to(introText, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: 'power2.out'
      }, 0.3)
      .to(introText, {
        opacity: 0,
        y: -10,
        duration: 0.8,
        ease: 'power2.in'
      }, 2.4)
      .set(introWrap, { display: 'none' })

      // B. Seed Emergence & Glow
      .to(seedContainer, {
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: 'back.out(1.6)'
      }, 3.0)
      .to(seedContainer, {
        scale: 1.2,
        duration: 0.5,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut'
      }, 3.8)

      // C. Seed Descends to Ground
      .to(seedContainer, {
        y: groundY,
        duration: 1.6,
        ease: 'power2.in',
        onStart: () => {
          const trail = this.element.querySelector('#act7SeedTrail');
          if (trail) trail.classList.add('active');
        }
      }, 4.6)

      // D. Touchdown Moment: Seed bursts into ground
      .call(() => {
        // Hide seed
        if (seedContainer) seedContainer.style.display = 'none';

        // Play tree-grow SFX on ground impact
        audioManager.playSFX(AUDIO_TRACKS.TREE_GROW, 0.85);

        // Emit lifecycle events
        eventBus.emit(EVENTS.SEED_GERMINATED);
        eventBus.emit(EVENTS.TREE_GROWTH_START);

        // Spawn golden spark burst at touchdown position
        ParticleEmitter.spawnBurst(this.element, {
          x: seedStartX,
          y: groundY,
          count: 22,
          type: 'gold',
          minDistance: 20,
          maxDistance: 90,
          duration: 0.9
        });

        // Trigger golden ripple expansion
        if (groundRipple) {
          gsap.set(groundRipple, {
            left: seedStartX,
            top: groundY,
            scale: 0.1,
            opacity: 0.9,
            display: 'block'
          });
          gsap.to(groundRipple, {
            scale: 3.5,
            opacity: 0,
            duration: 1.4,
            ease: 'power2.out',
            onComplete: () => {
              groundRipple.style.display = 'none';
            }
          });
        }
      }, null, 6.2)

      // E. Progressive Tree Growth on Canvas (0.0 to 1.0)
      .to(this.treeRenderer, {
        growthProgress: 1.0,
        duration: growthDuration,
        ease: 'power1.inOut',
        onUpdate: () => {
          // Keep TreeRenderer progress state synchronized
          const p = this.treeRenderer.growthProgress;
          if (groundGlow) {
            gsap.set(groundGlow, { opacity: Math.min(0.6, p * 0.65) });
          }
          if (atmosphere) {
            gsap.set(atmosphere, { opacity: 0.4 + p * 0.6 });
          }
        },
        onComplete: () => {
          this.isBloomed = true;
          eventBus.emit(EVENTS.TREE_BLOOMED);
          gsap.delayedCall(1.6, () => {
            sceneManager.transitionTo(SCENES.ACT_8);
          });
        }
      }, 6.3);
  }

  async exit() {
    if (this.growthTL) {
      this.growthTL.kill();
      this.growthTL = null;
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
