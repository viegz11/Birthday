/**
 * Act 1 — Cupid's Arrow
 * Interactive Recurve Bow & Arrow Rig.
 * Drag to draw the string, release to launch Cupid's arrow at the beating heart.
 */

import gsap from 'gsap';
import { SCENES, sceneManager } from '../core/SceneManager.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';
import { clamp } from '../utils/math.js';
import { ParticleEmitter } from '../utils/particles.js';

export class Act1_CupidBow {
  constructor() {
    this.id = SCENES.ACT_1;
    this.container = null;
    this.element = null;
    this.cleanups = [];

    // Rig geometry & state
    this.REST_NOCK = 96;
    this.nockProxy = { val: 96 };
    this.svgScale = 1;
    this.arrowBaseX = 0;
    this.arrowBaseY = 0;
    this.maxDraw = 120;
    this.curDraw = 0;
    this.pullUX = 0;
    this.pullUY = 1;
    this.isDrawing = false;
    this.isFired = false;
    this.startPX = 0;
    this.startPY = 0;
    this.startDraw = 0;
    this.beatTL = null;
  }

  async enter(hostElement) {
    this.container = hostElement;
    this.isDrawing = false;
    this.isFired = false;
    this.cleanups = [];

    // Create Act 1 DOM
    this.element = document.createElement('div');
    this.element.className = 'act1-stage';
    this.element.id = 'act1-stage';
    this.element.innerHTML = `
      <div class="act0-motes" id="act1Motes"></div>
      
      <p class="act1-eyebrow" id="act1Eyebrow">take aim&hellip;</p>

      <!-- Target Heart -->
      <div class="target-wrap" id="targetWrap">
        <div class="target-heart-node" id="targetHeartNode">
          <span class="target-glow" id="targetGlow"></span>
          <svg class="target-svg" viewBox="0 0 100 92" aria-hidden="true">
            <defs>
              <radialGradient id="targetHg" cx="38%" cy="30%" r="80%">
                <stop offset="0%"  stop-color="#ffd9e4" />
                <stop offset="42%" stop-color="#ff6f97" />
                <stop offset="82%" stop-color="#d81e57" />
                <stop offset="100%" stop-color="#9d0f3e" />
              </radialGradient>
              <linearGradient id="targetSheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stop-color="rgba(255,255,255,.85)" />
                <stop offset="34%" stop-color="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <path d="M50 86.5C26 68 10.5 53.6 10.5 34.6 10.5 20.4 21 11 33.2 11c8.6 0 14.2 4.7 16.8 11.4C52.6 15.7 58.2 11 66.8 11 79 11 89.5 20.4 89.5 34.6 89.5 53.6 74 68 50 86.5Z" fill="url(#targetHg)" />
            <path d="M50 86.5C26 68 10.5 53.6 10.5 34.6 10.5 20.4 21 11 33.2 11c8.6 0 14.2 4.7 16.8 11.4C52.6 15.7 58.2 11 66.8 11 79 11 89.5 20.4 89.5 34.6 89.5 53.6 74 68 50 86.5Z" fill="url(#targetSheen)" opacity=".7" />
            <ellipse cx="34" cy="30" rx="8.5" ry="5.4" fill="#fff" opacity=".72" style="mix-blend-mode:screen" />
          </svg>
        </div>
      </div>

      <!-- Archery Rig -->
      <div class="archery-rig" id="archeryRig" role="button" tabindex="0" aria-label="Pull the bowstring and release to launch Cupid's arrow">
        <div class="aim-guide" id="aimGuide"></div>

        <svg class="bow-svg" id="bowSvg" viewBox="0 0 460 300" aria-hidden="true">
          <defs>
            <linearGradient id="bowLimb" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0"   stop-color="#4a2a1a" />
              <stop offset=".18" stop-color="#6b3f24" />
              <stop offset=".5"  stop-color="#8a5127" />
              <stop offset=".82" stop-color="#6b3f24" />
              <stop offset="1"   stop-color="#4a2a1a" />
            </linearGradient>
            <linearGradient id="bowLimbHi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="rgba(255,214,160,.8)" />
              <stop offset="1" stop-color="rgba(255,214,160,0)" />
            </linearGradient>
            <linearGradient id="bowGrip" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#2a1a10" />
              <stop offset=".5" stop-color="#5a3822" />
              <stop offset="1" stop-color="#2a1a10" />
            </linearGradient>
          </defs>

          <!-- Bow limbs -->
          <path d="M34 96 C 118 168, 168 240, 230 252 C 292 240, 342 168, 426 96"
                fill="none" stroke="url(#bowLimb)" stroke-width="13" stroke-linecap="round" />
          <path d="M34 96 C 118 168, 168 240, 230 252 C 292 240, 342 168, 426 96"
                fill="none" stroke="url(#bowLimbHi)" stroke-width="3.5" stroke-linecap="round" opacity=".7" />
          <path d="M34 96 C 22 82, 26 70, 40 66" fill="none" stroke="url(#bowLimb)" stroke-width="8" stroke-linecap="round" />
          <path d="M426 96 C 438 82, 434 70, 420 66" fill="none" stroke="url(#bowLimb)" stroke-width="8" stroke-linecap="round" />

          <!-- Leather grip -->
          <rect x="216" y="206" width="28" height="70" rx="9" fill="url(#bowGrip)" />
          <path d="M219 220h22 M219 236h22 M219 252h22" stroke="rgba(0,0,0,.4)" stroke-width="2" />

          <!-- Taut string segments -->
          <line id="bowStrL" x1="40" y1="70" x2="230" y2="96" stroke="#9a8068" stroke-width="2.4" stroke-linecap="round" />
          <line id="bowStrR" x1="420" y1="70" x2="230" y2="96" stroke="#9a8068" stroke-width="2.4" stroke-linecap="round" />
          <circle id="bowServing" cx="230" cy="96" r="4.5" fill="#6f5137" />
        </svg>

        <!-- Cupid's Winged Golden Arrow -->
        <svg class="arrow-svg" id="arrowSvg" viewBox="0 0 64 220" aria-hidden="true">
          <defs>
            <linearGradient id="arrowShaft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#4a2c14" />
              <stop offset=".5" stop-color="#8a5a2c" />
              <stop offset="1" stop-color="#3e2410" />
            </linearGradient>
            <linearGradient id="arrowGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#ffe38c" />
              <stop offset=".45" stop-color="#f4a626" />
              <stop offset="1" stop-color="#a85f0e" />
            </linearGradient>
            <linearGradient id="arrowFeath" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#ff7f9c" />
              <stop offset=".5" stop-color="#e6396a" />
              <stop offset="1" stop-color="#a8154a" />
            </linearGradient>
            <linearGradient id="arrowWing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ffffff" />
              <stop offset="1" stop-color="#ffe0c4" />
            </linearGradient>
          </defs>

          <!-- Shaft -->
          <rect x="29.4" y="30" width="5.2" height="168" rx="2.6" fill="url(#arrowShaft)" />

          <!-- Angel wings -->
          <g>
            <path d="M31 30 C 10 16, 2 20, 4 34 C 12 30, 20 32, 31 40 Z" fill="url(#arrowWing)" stroke="rgba(196,132,58,.7)" stroke-width="1.2"/>
            <path d="M33 30 C 54 16, 62 20, 60 34 C 52 30, 44 32, 33 40 Z" fill="url(#arrowWing)" stroke="rgba(196,132,58,.7)" stroke-width="1.2"/>
          </g>

          <!-- Golden heart arrowhead -->
          <path d="M32 12 C 30 7, 22 6.5, 21.5 13 C 21 18, 27 22, 32 27 C 37 22, 43 18, 42.5 13 C 42 6.5, 34 7, 32 12 Z" fill="url(#arrowGold)" stroke="#a5701a" stroke-width=".8" />
          <ellipse cx="27" cy="13" rx="2.6" ry="1.7" fill="#fff" opacity=".8" style="mix-blend-mode:screen" />

          <!-- Feather fletching -->
          <g>
            <path d="M32 150 C 16 156, 10 178, 15 200 C 24 194, 30 184, 32 176 Z" fill="url(#arrowFeath)" />
            <path d="M32 150 C 48 156, 54 178, 49 200 C 40 194, 34 184, 32 176 Z" fill="url(#arrowFeath)" opacity=".92" />
          </g>
          <path d="M29 200 L32 205 L35 200" fill="none" stroke="#c9a25a" stroke-width="2" stroke-linecap="round"/>
          <circle id="arrowTipMarker" cx="32" cy="9" r="0.6" fill="none" />
        </svg>
      </div>

      <p class="act1-hint" id="act1Hint">pull &amp; release</p>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    // Spawn floating background ambient motes
    const motesEl = this.element.querySelector('#act1Motes');
    if (motesEl) {
      const cleanupMotes = ParticleEmitter.spawnFloatingMotes(motesEl, 10);
      this.cleanups.push(cleanupMotes);
    }

    // Refresh layout measurements
    this.refreshRig();
    this.startHeartbeat();

    // Fade in scene elements
    gsap.fromTo(this.element, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
    gsap.fromTo(['#act1Eyebrow', '#act1Hint'], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.2, ease: 'power2.out', delay: 0.2 });

    // Handle window resize
    const onResize = () => this.refreshRig();
    window.addEventListener('resize', onResize);
    this.cleanups.push(() => window.removeEventListener('resize', onResize));

    // Bind touch / pointer gestures
    this.bindGestures();
  }

  refreshRig() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const archery = this.element?.querySelector('#archeryRig');
    const bow = this.element?.querySelector('#bowSvg');
    const arrow = this.element?.querySelector('#arrowSvg');
    const serving = this.element?.querySelector('#bowServing');
    const targetWrap = this.element?.querySelector('#targetWrap');

    if (!archery || !bow || !arrow || !serving || !targetWrap) return;

    // Responsive placement: Target upper-right (or top center on mobile), Bow lower-left
    const isMobile = W < 600;
    const targetX = isMobile ? W * 0.58 : W * 0.62;
    const targetY = isMobile ? H * 0.26 : H * 0.28;
    const gripX = isMobile ? W * 0.24 : W * 0.22;
    const gripY = isMobile ? H * 0.76 : H * 0.74;

    // Position target heart
    targetWrap.style.left = `${targetX - 44}px`;
    targetWrap.style.top = `${targetY - 40}px`;

    // Calculate aim angle from grip to target
    const aimRad = Math.atan2(targetX - gripX, gripY - targetY);
    this.pullUX = -Math.sin(aimRad);
    this.pullUY = Math.cos(aimRad);

    // Measure local SVG bounds
    this.nockProxy.val = this.REST_NOCK;
    this.applyNock();

    gsap.set(archery, { rotation: 0, scale: 1, x: 0, y: 0 });
    archery.style.left = '0px';
    archery.style.top = '0px';
    gsap.set(arrow, { x: 0, y: 0 });

    const aR = archery.getBoundingClientRect();
    const bR = bow.getBoundingClientRect();
    const sR = serving.getBoundingClientRect();
    const rR = arrow.getBoundingClientRect();

    this.svgScale = bR.width / 460;
    const gripLX = (bR.left - aR.left) + 0.5 * bR.width;
    const gripLY = (bR.top - aR.top) + (240 / 300) * bR.height;
    const nockLX = (sR.left - aR.left) + 0.5 * sR.width;
    const nockLY = (sR.top - aR.top) + 0.5 * sR.height;

    this.arrowBaseX = nockLX - ((rR.left - aR.left) + 0.5 * rR.width);
    this.arrowBaseY = nockLY - ((rR.top - aR.top) + (205 / 220) * rR.height);

    archery.style.left = `${gripX - gripLX}px`;
    archery.style.top = `${gripY - gripLY}px`;

    gsap.set(archery, {
      transformOrigin: `${gripLX}px ${gripLY}px`,
      rotation: (aimRad * 180) / Math.PI
    });
    gsap.set(arrow, { x: this.arrowBaseX, y: this.arrowBaseY });

    this.maxDraw = Math.min(bR.height * 0.72, H * 0.16, 130);
    this.curDraw = 0;
  }

  applyNock() {
    const strL = this.element?.querySelector('#bowStrL');
    const strR = this.element?.querySelector('#bowStrR');
    const serving = this.element?.querySelector('#bowServing');
    const y = this.nockProxy.val;
    if (strL && strR && serving) {
      strL.setAttribute('y2', y);
      strR.setAttribute('y2', y);
      serving.setAttribute('cy', y);
    }
  }

  setDraw(d) {
    this.curDraw = clamp(d, 0, this.maxDraw);
    const arrow = this.element?.querySelector('#arrowSvg');
    const aim = this.element?.querySelector('#aimGuide');

    if (arrow) {
      gsap.set(arrow, { x: this.arrowBaseX, y: this.arrowBaseY + this.curDraw });
    }
    this.nockProxy.val = this.REST_NOCK + this.curDraw / this.svgScale;
    this.applyNock();

    if (aim) {
      gsap.set(aim, { opacity: 0.6 * (this.curDraw / this.maxDraw) });
    }
  }

  startHeartbeat() {
    const heartNode = this.element?.querySelector('#targetHeartNode');
    const glow = this.element?.querySelector('#targetGlow');
    if (!heartNode || !glow) return;

    this.beatTL = gsap.timeline({ repeat: -1, repeatDelay: 0.55 });
    this.beatTL
      .to(heartNode, { scale: 1.08, duration: 0.13, ease: 'power2.out' }, 0)
      .to(glow, { scale: 1.2, opacity: 0.9, duration: 0.13, ease: 'power2.out' }, 0)
      .to(heartNode, { scale: 1.0, duration: 0.2, ease: 'power2.in' }, 0.13)
      .to(heartNode, { scale: 1.05, duration: 0.12, ease: 'power2.out' }, 0.3)
      .to(heartNode, { scale: 1.0, duration: 0.45, ease: 'power2.inOut' }, 0.42)
      .to(glow, { scale: 1.0, opacity: 0.6, duration: 0.65, ease: 'power2.inOut' }, 0.3);
  }

  stopHeartbeat() {
    if (this.beatTL) {
      this.beatTL.kill();
      this.beatTL = null;
    }
  }

  bindGestures() {
    const archery = this.element?.querySelector('#archeryRig');
    if (!archery) return;

    const onPointerDown = (e) => {
      if (this.isFired) return;
      this.isDrawing = true;
      this.startPX = e.clientX;
      this.startPY = e.clientY;
      this.startDraw = this.curDraw;
      try { archery.setPointerCapture(e.pointerId); } catch (_) {}
      
      // Sound: Bow string tension draw
      audioManager.playSFX(AUDIO_TRACKS.BOW_DRAW, 0.7);
      audioManager.crossfadeMusic(AUDIO_TRACKS.CUPID_TENSION, 600, true);
      eventBus.emit(EVENTS.BOW_DRAW_START);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!this.isDrawing || this.isFired) return;
      const proj = (e.clientX - this.startPX) * this.pullUX + (e.clientY - this.startPY) * this.pullUY;
      this.setDraw(this.startDraw + proj);
      eventBus.emit(EVENTS.BOW_DRAW_MOVE, { drawRatio: this.curDraw / this.maxDraw });
    };

    const onPointerUp = () => {
      if (!this.isDrawing || this.isFired) return;
      this.isDrawing = false;
      if (this.curDraw >= this.maxDraw * 0.25) {
        this.fire();
      } else {
        this.springBack();
      }
    };

    const onKeyDown = (e) => {
      if (this.isFired) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.autoFire();
      }
    };

    archery.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    archery.addEventListener('keydown', onKeyDown);

    this.cleanups.push(() => {
      archery.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      archery.removeEventListener('keydown', onKeyDown);
    });
  }

  springBack() {
    const from = this.curDraw;
    gsap.to({ d: from }, {
      d: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.4)',
      onUpdate: () => {
        this.setDraw(gsap.getProperty(this, 'd') || 0);
      }
    });
  }

  autoFire() {
    if (this.isFired) return;
    audioManager.playSFX(AUDIO_TRACKS.BOW_DRAW, 0.8);
    audioManager.crossfadeMusic(AUDIO_TRACKS.CUPID_TENSION, 600, true);

    gsap.to({ d: this.curDraw }, {
      d: this.maxDraw * 0.95,
      duration: 0.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.setDraw(this.maxDraw * 0.95);
      },
      onComplete: () => {
        gsap.delayedCall(0.1, () => this.fire());
      }
    });
  }

  fire() {
    if (this.isFired) return;
    this.isFired = true;
    this.isDrawing = false;
    this.stopHeartbeat();

    eventBus.emit(EVENTS.BOW_RELEASED);

    // Play string release & arrow flight whoosh
    audioManager.playSFX(AUDIO_TRACKS.BOW_RELEASE, 0.85);
    audioManager.playSFX(AUDIO_TRACKS.ARROW_WHOOSH, 0.9);

    const tip = this.element?.querySelector('#arrowTipMarker');
    const targetWrap = this.element?.querySelector('#targetWrap');
    const arrow = this.element?.querySelector('#arrowSvg');
    const aim = this.element?.querySelector('#aimGuide');
    const eyebrow = this.element?.querySelector('#act1Eyebrow');
    const hint = this.element?.querySelector('#act1Hint');

    if (!tip || !targetWrap || !arrow) {
      sceneManager.transitionTo(SCENES.ACT_2);
      return;
    }

    const tipR = tip.getBoundingClientRect();
    const tRect = targetWrap.getBoundingClientRect();
    const tipX = tipR.left + tipR.width / 2;
    const tipY = tipR.top + tipR.height / 2;
    const tcx = tRect.left + tRect.width / 2;
    const tcy = tRect.top + tRect.height / 2;

    const flightDist = Math.hypot(tcx - tipX, tcy - tipY);
    const arrowFlyY = this.arrowBaseY + this.curDraw - flightDist;
    const drawnNock = this.REST_NOCK + this.curDraw / this.svgScale;

    const shotTL = gsap.timeline({
      onComplete: () => {
        // Emit strike event and immediately trigger Act 2
        eventBus.emit(EVENTS.HEART_STRUCK, {
          targetX: tcx,
          targetY: tcy,
          impactX: tcx,
          impactY: tcy
        });
        sceneManager.transitionTo(SCENES.ACT_2, {
          impactX: tcx,
          impactY: tcy
        });
      }
    });

    // 1. String snaps back
    shotTL
      .fromTo(this.nockProxy, { val: drawnNock }, {
        val: this.REST_NOCK,
        duration: 0.45,
        ease: 'elastic.out(1, 0.35)',
        onUpdate: () => this.applyNock()
      }, 0)
      // 2. Arrow shoots toward target along its local axis
      .to(arrow, { y: arrowFlyY, duration: 0.28, ease: 'power2.in' }, 0)
      .to(arrow, { scaleY: 1.15, duration: 0.14, ease: 'power2.in' }, 0)
      .to(arrow, { scaleY: 1.0, duration: 0.1, ease: 'power1.out' }, 0.16)
      .to(aim, { opacity: 0, duration: 0.15 }, 0)
      .to([eyebrow, hint], { opacity: 0, duration: 0.2, ease: 'power1.out' }, 0);
  }

  async exit() {
    this.stopHeartbeat();
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
