/**
 * Transition Manager - Cinematic Scene Handoffs
 * Provides reusable transition effects (Fade, Rose Flood, Golden Light Bloom, Lens Wipes)
 * using GSAP timelines for smooth choreography.
 */

import gsap from 'gsap';

class TransitionManager {
  constructor() {
    this.overlayElements = {
      flood: null,
      bloom: null,
      wipe: null
    };
  }

  /**
   * Registers transition DOM overlays.
   * @param {Object} overlays 
   */
  registerOverlays({ flood, bloom, wipe }) {
    this.overlayElements.flood = flood || null;
    this.overlayElements.bloom = bloom || null;
    this.overlayElements.wipe = wipe || null;
  }

  /**
   * Performs an expanding Rose Flood burst transition (Act 2 -> Act 3).
   * @param {Object} options 
   * @returns {Promise<void>}
   */
  async roseFlood({ originX = 0, originY = 0, duration = 0.6 } = {}) {
    const el = this.overlayElements.flood;
    if (!el) return Promise.resolve();

    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.set(el, { autoAlpha: 1, scale: 0.01, x: originX, y: originY })
        .to(el, {
          scale: 40,
          duration: duration,
          ease: 'power2.in'
        });
    });
  }

  /**
   * Golden Dawn Light Bloom (Act 6 -> Act 7).
   * @param {number} [duration=0.8]
   * @returns {Promise<void>}
   */
  async lightBloom(duration = 0.8) {
    const el = this.overlayElements.bloom;
    if (!el) return Promise.resolve();

    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.set(el, { autoAlpha: 1, scale: 0.01 })
        .to(el, { scale: 35, duration: duration, ease: 'power2.in' })
        .to(el, { autoAlpha: 0, duration: duration * 0.8, ease: 'power2.out' });
    });
  }

  /**
   * Smooth crossfade helper between two container elements.
   * @param {HTMLElement} fromEl 
   * @param {HTMLElement} toEl 
   * @param {number} [duration=0.5] 
   */
  async crossfade(fromEl, toEl, duration = 0.5) {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      if (fromEl) {
        tl.to(fromEl, { autoAlpha: 0, duration: duration * 0.5, ease: 'power1.out' }, 0);
      }
      if (toEl) {
        tl.fromTo(toEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: duration, ease: 'power2.out' }, duration * 0.2);
      }
    });
  }
}

export const transitionManager = new TransitionManager();
