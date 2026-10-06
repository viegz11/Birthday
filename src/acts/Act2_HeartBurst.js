/**
 * Act 2 — The Heart Burst & Rose Flood
 * Arrow embeds into the heart -> shudder recoil -> expansion -> massive cinematic burst.
 * A rich rose flood rapidly expands from the heart impact coordinate to swallow the viewport,
 * directly becoming the background field for Act 3.
 */

import gsap from 'gsap';
import { SCENES, sceneManager } from '../core/SceneManager.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';
import { ParticleEmitter } from '../utils/particles.js';

export class Act2_HeartBurst {
  constructor() {
    this.id = SCENES.ACT_2;
    this.container = null;
    this.element = null;
    this.cleanups = [];
  }

  async enter(hostElement, data = {}) {
    this.container = hostElement;
    this.cleanups = [];

    const W = window.innerWidth;
    const H = window.innerHeight;

    const impactX = data.impactX ?? (W * 0.58);
    const impactY = data.impactY ?? (H * 0.28);

    // Create Act 2 DOM
    this.element = document.createElement('div');
    this.element.className = 'act2-stage';
    this.element.id = 'act2-stage';
    this.element.innerHTML = `
      <!-- Struck Heart container at impact coordinates -->
      <div class="target-wrap" id="burstHeartWrap" style="left: ${impactX - 44}px; top: ${impactY - 40}px;">
        <div class="target-heart-node" id="burstHeartNode">
          <span class="target-glow" id="burstGlow" style="opacity: 1;"></span>
          <svg class="target-svg" viewBox="0 0 100 92" aria-hidden="true">
            <defs>
              <radialGradient id="burstHg" cx="38%" cy="30%" r="80%">
                <stop offset="0%"  stop-color="#ffd9e4" />
                <stop offset="42%" stop-color="#ff6f97" />
                <stop offset="82%" stop-color="#d81e57" />
                <stop offset="100%" stop-color="#9d0f3e" />
              </radialGradient>
              <linearGradient id="burstSheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stop-color="rgba(255,255,255,.95)" />
                <stop offset="34%" stop-color="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <path d="M50 86.5C26 68 10.5 53.6 10.5 34.6 10.5 20.4 21 11 33.2 11c8.6 0 14.2 4.7 16.8 11.4C52.6 15.7 58.2 11 66.8 11 79 11 89.5 20.4 89.5 34.6 89.5 53.6 74 68 50 86.5Z" fill="url(#burstHg)" />
            <path d="M50 86.5C26 68 10.5 53.6 10.5 34.6 10.5 20.4 21 11 33.2 11c8.6 0 14.2 4.7 16.8 11.4C52.6 15.7 58.2 11 66.8 11 79 11 89.5 20.4 89.5 34.6 89.5 53.6 74 68 50 86.5Z" fill="url(#burstSheen)" opacity=".8" />
          </svg>
        </div>
      </div>

      <!-- Expanding Rose Flood Circle originating from impact point -->
      <div id="roseFloodCircle" style="
        position: absolute;
        left: ${impactX}px;
        top: ${impactY}px;
        width: 140px;
        height: 140px;
        margin-left: -70px;
        margin-top: -70px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 40%, #ff6f97 0%, #d81e57 45%, #7a0c2d 85%, #420417 100%);
        transform: scale(0.001);
        pointer-events: none;
        z-index: 10;
      "></div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    const burstHeartWrap = this.element.querySelector('#burstHeartWrap');
    const burstHeartNode = this.element.querySelector('#burstHeartNode');
    const burstGlow = this.element.querySelector('#burstGlow');
    const roseFloodCircle = this.element.querySelector('#roseFloodCircle');

    // Calculate maximum radius to swallow screen from impact position
    const maxDist = Math.hypot(
      Math.max(impactX, W - impactX),
      Math.max(impactY, H - impactY)
    );
    const floodScale = (maxDist * 1.3) / 70;

    // Orchestrate Impact & Burst Timeline
    const burstTL = gsap.timeline({
      onComplete: () => {
        eventBus.emit(EVENTS.HEART_BURST);
        sceneManager.transitionTo(SCENES.ACT_3);
      }
    });

    // 1. Arrow strike impact: heart flashes & recoils
    burstTL
      .call(() => {
        audioManager.playSFX(AUDIO_TRACKS.HEART_IMPACT, 0.95);
        // Small pre-burst spark particles
        ParticleEmitter.spawnBurst(this.element, {
          x: impactX,
          y: impactY,
          count: 8,
          type: 'spark',
          minDistance: 20,
          maxDistance: 60,
          duration: 0.4
        });
      }, null, 0)
      .to(burstHeartWrap, { x: 8, y: -10, duration: 0.06, ease: 'power2.out' }, 0)
      .to(burstHeartNode, { scaleX: 1.25, scaleY: 0.85, duration: 0.06, ease: 'power2.out' }, 0)
      .to(burstGlow, { scale: 1.6, opacity: 1, duration: 0.08 }, 0)
      .to(burstHeartWrap, { x: 0, y: 0, duration: 0.2, ease: 'power2.out' }, 0.08)
      .to(burstHeartNode, { scaleX: 1.0, scaleY: 1.0, duration: 0.18, ease: 'power2.inOut' }, 0.08)
      
      // 2. Tiny pause / anticipation before expansion (t = 0.28s)
      .to(burstHeartNode, { scale: 1.35, duration: 0.16, ease: 'power2.in' }, 0.28)
      
      // 3. Heart explosion & massive particle burst (t = 0.44s)
      .call(() => {
        audioManager.playSFX(AUDIO_TRACKS.HEART_BURST, 1.0);
        audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.8);

        // Explode dense mix of hearts, sparks, and gold motes
        ParticleEmitter.spawnBurst(this.element, {
          x: impactX,
          y: impactY,
          count: 24,
          type: 'heart',
          minDistance: 60,
          maxDistance: 240,
          duration: 1.2
        });
        ParticleEmitter.spawnBurst(this.element, {
          x: impactX,
          y: impactY,
          count: 20,
          type: 'spark',
          minDistance: 40,
          maxDistance: 280,
          duration: 1.0
        });
        ParticleEmitter.spawnBurst(this.element, {
          x: impactX,
          y: impactY,
          count: 14,
          type: 'gold',
          minDistance: 50,
          maxDistance: 200,
          duration: 1.1
        });
      }, null, 0.44)
      .to(burstHeartWrap, { opacity: 0, scale: 1.8, duration: 0.12, ease: 'power2.out' }, 0.44)
      
      // 4. Rose flood expands outward to swallow screen
      .fromTo(roseFloodCircle, { scale: 0.02 }, {
        scale: floodScale,
        duration: 0.55,
        ease: 'power2.inOut'
      }, 0.46);
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
