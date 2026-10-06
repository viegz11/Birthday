/**
 * Act 4 — The Birthday Celebration / Make A Wish
 * 
 * Sequentially staged celebration:
 * - Warming ambient lights and floating golden motes
 * - Swaying celebratory banner
 * - Interactive poppable balloons
 * - Floral and party hat accents
 * - Tiered artisanal birthday cake on ceramic pedestal
 * - Sequential candle ignition with flame audio
 * - "Make a wish..." title & interaction hint
 * - Candle extinguishing sequence with smoke curls, sound effects, audio ducking,
 *   and scene lighting dimming.
 * - Emits CANDLES_BLOWN.
 */

import gsap from 'gsap';
import { SCENES, sceneManager } from '../core/SceneManager.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';
import { ParticleEmitter } from '../utils/particles.js';

export class Act4_Celebration {
  constructor() {
    this.id = SCENES.ACT_4;
    this.container = null;
    this.element = null;
    this.cleanups = [];
    this.stagingTL = null;
    this.floatTweens = [];
    this.isCandlesBlown = false;
    this.isStagingComplete = false;
  }

  async enter(hostElement) {
    this.container = hostElement;
    this.isCandlesBlown = false;
    this.isStagingComplete = false;
    this.cleanups = [];
    this.floatTweens = [];

    // Create Act 4 DOM
    this.element = document.createElement('div');
    this.element.className = 'act4-stage';
    this.element.id = 'act4-stage';
    this.element.innerHTML = `
      <!-- Background Ambient Glow -->
      <div class="act4-bg-glow" id="act4BgGlow"></div>

      <!-- Floating Ambient Gold Sparks -->
      <div class="act0-motes" id="act4Motes"></div>

      <!-- Birthday Banner at Top (Vector Pennant Garland) -->
      <div class="act4-banner-wrap" id="act4Banner">
        <svg class="act4-banner-svg" viewBox="0 0 540 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <linearGradient id="pennantRose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ff7597" />
              <stop offset="100%" stop-color="#d61e56" />
            </linearGradient>
            <linearGradient id="pennantGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffe082" />
              <stop offset="100%" stop-color="#d4af37" />
            </linearGradient>
            <linearGradient id="pennantRuby" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#e83e6d" />
              <stop offset="100%" stop-color="#910d32" />
            </linearGradient>
            <linearGradient id="pennantChampagne" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fff3d6" />
              <stop offset="100%" stop-color="#e5b869" />
            </linearGradient>
          </defs>
          <path d="M 15 15 Q 140 70, 270 75 Q 400 70, 525 15" fill="none" stroke="#e6c582" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
          <path d="M 30 18 Q 145 58, 270 62 Q 395 58, 510 18" fill="none" stroke="rgba(255, 220, 150, 0.45)" stroke-width="1.2" stroke-dasharray="4 6"/>
          
          <!-- Pennants -->
          <polygon points="45,28 78,38 61,84" fill="url(#pennantRose)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
          <polygon points="98,43 134,53 116,98" fill="url(#pennantGold)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
          <polygon points="152,58 190,66 171,112" fill="url(#pennantRuby)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
          <polygon points="208,68 248,73 228,118" fill="url(#pennantChampagne)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
          <polygon points="292,73 332,68 312,118" fill="url(#pennantRose)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
          <polygon points="350,66 388,58 369,112" fill="url(#pennantGold)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
          <polygon points="406,53 442,43 424,98" fill="url(#pennantRuby)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
          <polygon points="462,38 495,28 479,84" fill="url(#pennantChampagne)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>

          <!-- Decorative Tassel Beads -->
          <circle cx="270" cy="75" r="4.5" fill="#ffe082"/>
          <circle cx="140" cy="67" r="3.5" fill="#ffb8cf"/>
          <circle cx="400" cy="67" r="3.5" fill="#ffb8cf"/>
        </svg>
      </div>

      <!-- Party Hat (Vector Cone with Gold Stars & Pom-pom) -->
      <div class="act4-hat-wrap" id="act4Hat">
        <svg class="act4-hat-svg" viewBox="0 0 100 120" aria-hidden="true">
          <defs>
            <linearGradient id="act4HatBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ff6f97" />
              <stop offset="50%" stop-color="#d81e57" />
              <stop offset="100%" stop-color="#7a0f30" />
            </linearGradient>
            <linearGradient id="act4HatGold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#fff0b3" />
              <stop offset="50%" stop-color="#e8c582" />
              <stop offset="100%" stop-color="#aa8014" />
            </linearGradient>
          </defs>
          <path d="M 50 16 L 86 100 Q 50 114 14 100 Z" fill="url(#act4HatBody)" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.45))"/>
          <path d="M 38 42 Q 50 46 62 42 L 65 50 Q 50 55 35 50 Z" fill="url(#act4HatGold)" opacity="0.95"/>
          <path d="M 26 68 Q 50 76 74 68 L 78 78 Q 50 86 22 78 Z" fill="url(#act4HatGold)" opacity="0.95"/>
          <circle cx="50" cy="30" r="3.2" fill="#ffe082"/>
          <circle cx="42" cy="60" r="3.2" fill="#ffe082"/>
          <circle cx="58" cy="60" r="3.2" fill="#ffe082"/>
          <circle cx="50" cy="94" r="3.8" fill="#ffe082"/>
          <!-- Fluffy Pom-pom -->
          <circle cx="50" cy="14" r="10" fill="#ffd54f" filter="drop-shadow(0 0 10px rgba(255,213,79,0.85))"/>
          <circle cx="50" cy="14" r="6" fill="#fff9c4"/>
          <!-- Gold bottom fringe -->
          <path d="M 14 100 Q 50 114 86 100" fill="none" stroke="#ffe082" stroke-width="4.5" stroke-linecap="round"/>
        </svg>
      </div>

      <!-- Floral Accents (Vector Sakura Blossoms) -->
      <div class="act4-floral act4-floral-tl" id="act4FloralTL">
        <svg class="act4-floral-svg" viewBox="0 0 60 60" aria-hidden="true">
          <defs>
            <radialGradient id="act4PetalTL" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff5f8"/>
              <stop offset="60%" stop-color="#ff8fab"/>
              <stop offset="100%" stop-color="#d81e57"/>
            </radialGradient>
          </defs>
          <g transform="translate(30,30)">
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTL)" transform="rotate(0)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTL)" transform="rotate(72)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTL)" transform="rotate(144)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTL)" transform="rotate(216)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTL)" transform="rotate(288)"/>
            <circle cx="0" cy="0" r="5" fill="#ffe082"/>
            <circle cx="0" cy="0" r="2" fill="#ffffff"/>
          </g>
        </svg>
      </div>
      <div class="act4-floral act4-floral-tr" id="act4FloralTR">
        <svg class="act4-floral-svg" viewBox="0 0 60 60" aria-hidden="true">
          <defs>
            <radialGradient id="act4PetalTR" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff5f8"/>
              <stop offset="60%" stop-color="#ff8fab"/>
              <stop offset="100%" stop-color="#d81e57"/>
            </radialGradient>
          </defs>
          <g transform="translate(30,30)">
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTR)" transform="rotate(0)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTR)" transform="rotate(72)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTR)" transform="rotate(144)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTR)" transform="rotate(216)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalTR)" transform="rotate(288)"/>
            <circle cx="0" cy="0" r="5" fill="#ffe082"/>
            <circle cx="0" cy="0" r="2" fill="#ffffff"/>
          </g>
        </svg>
      </div>
      <div class="act4-floral act4-floral-bl" id="act4FloralBL">
        <svg class="act4-floral-svg" viewBox="0 0 60 60" aria-hidden="true">
          <defs>
            <radialGradient id="act4PetalBL" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff5f8"/>
              <stop offset="60%" stop-color="#ff8fab"/>
              <stop offset="100%" stop-color="#d81e57"/>
            </radialGradient>
          </defs>
          <g transform="translate(30,30)">
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBL)" transform="rotate(0)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBL)" transform="rotate(72)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBL)" transform="rotate(144)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBL)" transform="rotate(216)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBL)" transform="rotate(288)"/>
            <circle cx="0" cy="0" r="5" fill="#ffe082"/>
            <circle cx="0" cy="0" r="2" fill="#ffffff"/>
          </g>
        </svg>
      </div>
      <div class="act4-floral act4-floral-br" id="act4FloralBR">
        <svg class="act4-floral-svg" viewBox="0 0 60 60" aria-hidden="true">
          <defs>
            <radialGradient id="act4PetalBR" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff5f8"/>
              <stop offset="60%" stop-color="#ff8fab"/>
              <stop offset="100%" stop-color="#d81e57"/>
            </radialGradient>
          </defs>
          <g transform="translate(30,30)">
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBR)" transform="rotate(0)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBR)" transform="rotate(72)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBR)" transform="rotate(144)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBR)" transform="rotate(216)"/>
            <ellipse cx="0" cy="-14" rx="7" ry="12" fill="url(#act4PetalBR)" transform="rotate(288)"/>
            <circle cx="0" cy="0" r="5" fill="#ffe082"/>
            <circle cx="0" cy="0" r="2" fill="#ffffff"/>
          </g>
        </svg>
      </div>

      <!-- Floating Interactive Vector Balloons (Tap to pop) -->
      <div class="act4-balloon act4-balloon-l1" id="balloonL1" role="button" tabindex="0" aria-label="Pop rose balloon">
        <svg class="act4-balloon-svg" viewBox="0 0 80 130" aria-hidden="true">
          <defs>
            <radialGradient id="balloonRoseL1" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stop-color="#ffd5e3" />
              <stop offset="35%" stop-color="#ff6b95" />
              <stop offset="75%" stop-color="#d61e56" />
              <stop offset="100%" stop-color="#7a0a2c" />
            </radialGradient>
          </defs>
          <path d="M 40 10 C 64 10 76 30 76 54 C 76 78 52 92 43 98 L 37 98 C 28 92 4 78 4 54 C 4 30 16 10 40 10 Z" fill="url(#balloonRoseL1)" filter="drop-shadow(0 8px 18px rgba(0,0,0,0.38))"/>
          <ellipse cx="26" cy="32" rx="9" ry="16" transform="rotate(-25 26 32)" fill="#ffffff" opacity="0.5" style="mix-blend-mode: overlay;"/>
          <polygon points="35,98 45,98 48,105 32,105" fill="#9e123c"/>
          <path d="M 40 105 Q 46 113 36 121 Q 42 127 38 130" fill="none" stroke="rgba(255, 230, 200, 0.75)" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="act4-balloon act4-balloon-l2" id="balloonL2" role="button" tabindex="0" aria-label="Pop gold balloon">
        <svg class="act4-balloon-svg" viewBox="0 0 80 130" aria-hidden="true">
          <defs>
            <radialGradient id="balloonGoldL2" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stop-color="#fff8db" />
              <stop offset="35%" stop-color="#ffd54f" />
              <stop offset="75%" stop-color="#d4af37" />
              <stop offset="100%" stop-color="#7a550a" />
            </radialGradient>
          </defs>
          <path d="M 40 10 C 64 10 76 30 76 54 C 76 78 52 92 43 98 L 37 98 C 28 92 4 78 4 54 C 4 30 16 10 40 10 Z" fill="url(#balloonGoldL2)" filter="drop-shadow(0 8px 18px rgba(0,0,0,0.38))"/>
          <ellipse cx="26" cy="32" rx="9" ry="16" transform="rotate(-25 26 32)" fill="#ffffff" opacity="0.55" style="mix-blend-mode: overlay;"/>
          <polygon points="35,98 45,98 48,105 32,105" fill="#96680a"/>
          <path d="M 40 105 Q 46 113 36 121 Q 42 127 38 130" fill="none" stroke="rgba(255, 230, 200, 0.75)" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="act4-balloon act4-balloon-r1" id="balloonR1" role="button" tabindex="0" aria-label="Pop gold balloon">
        <svg class="act4-balloon-svg" viewBox="0 0 80 130" aria-hidden="true">
          <defs>
            <radialGradient id="balloonGoldR1" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stop-color="#fff8db" />
              <stop offset="35%" stop-color="#ffd54f" />
              <stop offset="75%" stop-color="#d4af37" />
              <stop offset="100%" stop-color="#7a550a" />
            </radialGradient>
          </defs>
          <path d="M 40 10 C 64 10 76 30 76 54 C 76 78 52 92 43 98 L 37 98 C 28 92 4 78 4 54 C 4 30 16 10 40 10 Z" fill="url(#balloonGoldR1)" filter="drop-shadow(0 8px 18px rgba(0,0,0,0.38))"/>
          <ellipse cx="26" cy="32" rx="9" ry="16" transform="rotate(-25 26 32)" fill="#ffffff" opacity="0.55" style="mix-blend-mode: overlay;"/>
          <polygon points="35,98 45,98 48,105 32,105" fill="#96680a"/>
          <path d="M 40 105 Q 46 113 36 121 Q 42 127 38 130" fill="none" stroke="rgba(255, 230, 200, 0.75)" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="act4-balloon act4-balloon-r2" id="balloonR2" role="button" tabindex="0" aria-label="Pop rose balloon">
        <svg class="act4-balloon-svg" viewBox="0 0 80 130" aria-hidden="true">
          <defs>
            <radialGradient id="balloonRoseR2" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stop-color="#ffd5e3" />
              <stop offset="35%" stop-color="#ff6b95" />
              <stop offset="75%" stop-color="#d61e56" />
              <stop offset="100%" stop-color="#7a0a2c" />
            </radialGradient>
          </defs>
          <path d="M 40 10 C 64 10 76 30 76 54 C 76 78 52 92 43 98 L 37 98 C 28 92 4 78 4 54 C 4 30 16 10 40 10 Z" fill="url(#balloonRoseR2)" filter="drop-shadow(0 8px 18px rgba(0,0,0,0.38))"/>
          <ellipse cx="26" cy="32" rx="9" ry="16" transform="rotate(-25 26 32)" fill="#ffffff" opacity="0.5" style="mix-blend-mode: overlay;"/>
          <polygon points="35,98 45,98 48,105 32,105" fill="#9e123c"/>
          <path d="M 40 105 Q 46 113 36 121 Q 42 127 38 130" fill="none" stroke="rgba(255, 230, 200, 0.75)" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>

      <!-- Main Stage Content: Wish Text + Artisanal Cake -->
      <div class="act4-stage-content" id="act4Content">
        <h2 class="act4-wish-heading" id="act4Heading">Make a wish&hellip;</h2>

        <!-- Artisanal Birthday Cake Rig -->
        <div class="act4-cake-rig" id="act4CakeRig" role="button" tabindex="0" aria-label="Tap the birthday cake candles to make a wish and blow them out">
          <!-- Warm Candle Glow on Cake -->
          <div class="act4-cake-glow" id="act4CakeGlow"></div>

          <!-- Candles Container -->
          <div class="act4-candles-row" id="act4CandlesRow">
            <!-- Candle 1 -->
            <div class="act4-candle" id="candle1">
              <div class="act4-candle-wick"></div>
              <div class="act4-flame-wrap" id="flame1">
                <span class="act4-flame-glow"></span>
                <span class="act4-flame-body"></span>
              </div>
              <span class="act4-smoke" id="smoke1"></span>
            </div>

            <!-- Candle 2 -->
            <div class="act4-candle" id="candle2">
              <div class="act4-candle-wick"></div>
              <div class="act4-flame-wrap" id="flame2">
                <span class="act4-flame-glow"></span>
                <span class="act4-flame-body"></span>
              </div>
              <span class="act4-smoke" id="smoke2"></span>
            </div>

            <!-- Candle 3 -->
            <div class="act4-candle" id="candle3">
              <div class="act4-candle-wick"></div>
              <div class="act4-flame-wrap" id="flame3">
                <span class="act4-flame-glow"></span>
                <span class="act4-flame-body"></span>
              </div>
              <span class="act4-smoke" id="smoke3"></span>
            </div>
          </div>

          <!-- Layered Artisanal Cake SVG -->
          <svg class="act4-cake-svg" id="act4CakeSvg" viewBox="0 0 320 280" aria-hidden="true">
            <defs>
              <!-- Cake Stand Gradients -->
              <linearGradient id="standG" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stop-color="#e3d6c8" />
                <stop offset="50%"  stop-color="#fff8f2" />
                <stop offset="100%" stop-color="#d6c3b2" />
              </linearGradient>
              <linearGradient id="standGold" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stop-color="#d4af37" />
                <stop offset="50%"  stop-color="#fdf3cd" />
                <stop offset="100%" stop-color="#aa820a" />
              </linearGradient>

              <!-- Bottom Tier Cake Body -->
              <linearGradient id="cakeBottomG" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stop-color="#5a2230" />
                <stop offset="25%"  stop-color="#7a2e41" />
                <stop offset="70%"  stop-color="#8a3449" />
                <stop offset="100%" stop-color="#4e1c28" />
              </linearGradient>

              <!-- Top Tier Cake Body -->
              <linearGradient id="cakeTopG" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stop-color="#6e2b3c" />
                <stop offset="35%"  stop-color="#8c364c" />
                <stop offset="80%"  stop-color="#9a3c54" />
                <stop offset="100%" stop-color="#581f2c" />
              </linearGradient>

              <!-- Cream & Frosting -->
              <linearGradient id="creamG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="#ffffff" />
                <stop offset="60%"  stop-color="#fff3e6" />
                <stop offset="100%" stop-color="#f5dcce" />
              </linearGradient>

              <!-- Gold Accents -->
              <linearGradient id="pearlGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stop-color="#fff4cc" />
                <stop offset="60%"  stop-color="#f0c242" />
                <stop offset="100%" stop-color="#a87a0e" />
              </linearGradient>

              <filter id="cakeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.45" />
              </filter>
            </defs>

            <!-- 1. Pedestal Base & Stand -->
            <g id="cakePedestal">
              <!-- Plate Shadow -->
              <ellipse cx="160" cy="254" rx="138" ry="16" fill="rgba(0,0,0,0.35)" />
              
              <!-- Pedestal Foot -->
              <path d="M125 258 C125 250 142 246 160 246 C178 246 195 250 195 258 Z" fill="url(#standG)" />
              <path d="M142 248 C142 232 148 226 148 222 L172 222 C172 226 178 232 178 248 Z" fill="url(#standG)" />
              <ellipse cx="160" cy="222" rx="16" ry="3" fill="url(#standGold)" />

              <!-- Scalloped Ceramic Plate Platter -->
              <ellipse cx="160" cy="218" rx="136" ry="18" fill="url(#standG)" stroke="url(#standGold)" stroke-width="2" />
              <ellipse cx="160" cy="216" rx="126" ry="14" fill="#faf4ed" />
            </g>

            <!-- 2. Bottom Tier (Tier 1) -->
            <g id="cakeTierBottom">
              <!-- Tier Base Cylinder -->
              <path d="M54 158 C54 158 54 198 54 204 C54 218 101 226 160 226 C219 226 266 218 266 204 C266 198 266 158 266 158 Z" fill="url(#cakeBottomG)" />
              
              <!-- Bottom Tier Top Ellipse -->
              <ellipse cx="160" cy="158" rx="106" ry="15" fill="#9e3e56" />

              <!-- Bottom Tier Cream Swags & Drips -->
              <path d="M54 158 C68 174 88 176 102 164 C118 176 138 176 152 164 C168 176 188 176 202 164 C218 176 238 176 252 164 C258 160 262 158 266 158 C266 158 266 162 266 168 C248 184 228 182 212 170 C198 184 178 184 162 170 C148 184 128 184 112 170 C98 184 78 184 62 170 C56 165 54 158 54 158 Z" fill="url(#creamG)" />

              <!-- Gold Pearls along bottom border -->
              <circle cx="70" cy="208" r="3.2" fill="url(#pearlGold)" />
              <circle cx="95" cy="216" r="3.2" fill="url(#pearlGold)" />
              <circle cx="125" cy="221" r="3.2" fill="url(#pearlGold)" />
              <circle cx="160" cy="223" r="3.6" fill="url(#pearlGold)" />
              <circle cx="195" cy="221" r="3.2" fill="url(#pearlGold)" />
              <circle cx="225" cy="216" r="3.2" fill="url(#pearlGold)" />
              <circle cx="250" cy="208" r="3.2" fill="url(#pearlGold)" />
            </g>

            <!-- 3. Top Tier (Tier 2) -->
            <g id="cakeTierTop">
              <!-- Tier Body -->
              <path d="M88 108 C88 108 88 144 88 150 C88 162 120 168 160 168 C200 168 232 162 232 150 C232 144 232 108 232 108 Z" fill="url(#cakeTopG)" />
              
              <!-- Tier Top Surface -->
              <ellipse cx="160" cy="108" rx="72" ry="12" fill="#b04762" />

              <!-- Cream Frosting Top & Drips -->
              <ellipse cx="160" cy="106" rx="68" ry="11" fill="url(#creamG)" />
              <path d="M88 108 C96 122 108 124 118 114 C128 126 142 126 152 116 C162 126 178 126 188 116 C198 126 212 124 222 114 C228 110 232 108 232 108 C232 112 230 118 226 122 C216 130 204 128 194 120 C184 130 170 130 160 120 C150 130 136 130 126 120 C116 130 104 128 94 120 C90 115 88 108 88 108 Z" fill="url(#creamG)" />

              <!-- Berry & Gold Rosettes on Top -->
              <circle cx="118" cy="104" r="5" fill="#d81e57" />
              <circle cx="160" cy="102" r="5.5" fill="#d81e57" />
              <circle cx="202" cy="104" r="5" fill="#d81e57" />
              
              <circle cx="138" cy="107" r="3.2" fill="url(#pearlGold)" />
              <circle cx="182" cy="107" r="3.2" fill="url(#pearlGold)" />
            </g>
          </svg>
        </div>

        <p class="act4-wish-hint" id="act4Hint">tap the candles to blow them out</p>
      </div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    // 1. Crossfade music to 04_birthday_party.mp3
    audioManager.crossfadeMusic(AUDIO_TRACKS.BIRTHDAY_PARTY, 1000, true, 0.85);

    // 2. Spawn ambient floating gold motes
    const motesEl = this.element.querySelector('#act4Motes');
    if (motesEl) {
      const cleanupMotes = ParticleEmitter.spawnFloatingMotes(motesEl, 12);
      this.cleanups.push(cleanupMotes);
    }

    // 3. Bind Balloon & Candle interactions
    this.bindInteractions();

    // 4. Run Sequential Staging Timeline
    this.runStagingSequence();
  }

  runStagingSequence() {
    const banner = this.element.querySelector('#act4Banner');
    const hat = this.element.querySelector('#act4Hat');
    const florallTL = this.element.querySelector('#act4FloralTL');
    const florallTR = this.element.querySelector('#act4FloralTR');
    const florallBL = this.element.querySelector('#act4FloralBL');
    const florallBR = this.element.querySelector('#act4FloralBR');
    
    const balloonL1 = this.element.querySelector('#balloonL1');
    const balloonL2 = this.element.querySelector('#balloonL2');
    const balloonR1 = this.element.querySelector('#balloonR1');
    const balloonR2 = this.element.querySelector('#balloonR2');

    const cakeRig = this.element.querySelector('#act4CakeRig');
    const heading = this.element.querySelector('#act4Heading');
    const hint = this.element.querySelector('#act4Hint');

    const candle1 = this.element.querySelector('#candle1');
    const candle2 = this.element.querySelector('#candle2');
    const candle3 = this.element.querySelector('#candle3');

    const flame1 = this.element.querySelector('#flame1');
    const flame2 = this.element.querySelector('#flame2');
    const flame3 = this.element.querySelector('#flame3');
    const cakeGlow = this.element.querySelector('#act4CakeGlow');

    // Reset initial states
    gsap.set([balloonL1, balloonL2, balloonR1, balloonR2], { opacity: 0, y: 80, scale: 0.8 });
    gsap.set(cakeRig, { opacity: 0, y: 60, scale: 0.88, pointerEvents: 'none' });
    gsap.set(hint, { opacity: 0, pointerEvents: 'none' });
    gsap.set(cakeGlow, { opacity: 0 });

    this.stagingTL = gsap.timeline({
      onComplete: () => {
        this.isStagingComplete = true;
        gsap.set(cakeRig, { pointerEvents: 'auto' });
        gsap.set(hint, { pointerEvents: 'auto' });
        eventBus.emit(EVENTS.CELEBRATION_STAGED);
        this.startGentleFloats();
      }
    });

    // Step 1: Banner sways down from top
    this.stagingTL
      .to(banner, {
        y: 0,
        duration: 1.0,
        ease: 'back.out(1.2)'
      }, 0.2)
      // Step 2: Balloons float up from bottom left & right
      .to([balloonL1, balloonL2, balloonR1, balloonR2], {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power2.out'
      }, 0.6)
      // Step 3: Florals and Hat appear
      .to([florallTL, florallTR, florallBL, florallBR], {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.4)'
      }, 1.0)
      .to(hat, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'bounce.out'
      }, 1.2)
      // Step 4: Cake floats in and settles
      .to(cakeRig, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.0,
        ease: 'back.out(1.1)'
      }, 1.4)
      // Step 5: Candles emerge from top of cake
      .to([candle1, candle2, candle3], {
        opacity: 1,
        scaleY: 1,
        duration: 0.6,
        stagger: 0.12,
        ease: 'back.out(1.5)'
      }, 2.1)
      // Step 6: Candles ignite one by one with sound effect
      .call(() => {
        audioManager.playSFX(AUDIO_TRACKS.CANDLE_FLAME, 0.5);
        eventBus.emit(EVENTS.CANDLE_LIT, { index: 1 });
      }, null, 2.6)
      .to(flame1, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, 2.6)
      .to(cakeGlow, { opacity: 0.4, duration: 0.4 }, 2.6)
      
      .call(() => {
        audioManager.playSFX(AUDIO_TRACKS.CANDLE_FLAME, 0.6);
        eventBus.emit(EVENTS.CANDLE_LIT, { index: 2 });
      }, null, 2.9)
      .to(flame2, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, 2.9)
      .to(cakeGlow, { opacity: 0.7, duration: 0.4 }, 2.9)

      .call(() => {
        audioManager.playSFX(AUDIO_TRACKS.CANDLE_FLAME, 0.7);
        eventBus.emit(EVENTS.CANDLE_LIT, { index: 3 });
        this.isStagingComplete = true;
        gsap.set(cakeRig, { pointerEvents: 'auto' });
        gsap.set(hint, { pointerEvents: 'auto' });
      }, null, 3.2)
      .to(flame3, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, 3.2)
      .to(cakeGlow, { opacity: 1, duration: 0.4 }, 3.2)

      // Step 7: "Make a wish..." Title & Hint Reveal
      .to(heading, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 3.5)
      .to(hint, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 3.8);
  }

  startGentleFloats() {
    const balloons = [
      { el: this.element.querySelector('#balloonL1'), dy: 10, rot: -4, dur: 3.2 },
      { el: this.element.querySelector('#balloonL2'), dy: 14, rot: 5, dur: 3.8 },
      { el: this.element.querySelector('#balloonR1'), dy: 12, rot: -5, dur: 3.5 },
      { el: this.element.querySelector('#balloonR2'), dy: 15, rot: 4, dur: 4.0 }
    ];

    balloons.forEach(({ el, dy, rot, dur }) => {
      if (!el) return;
      const tw = gsap.to(el, {
        y: `+=${dy}`,
        rotation: `+=${rot}`,
        duration: dur,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      this.floatTweens.push(tw);
    });

    const banner = this.element.querySelector('#act4Banner');
    if (banner) {
      const bannerTw = gsap.to(banner, {
        rotation: 1.5,
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      this.floatTweens.push(bannerTw);
    }
  }

  bindInteractions() {
    // 1. Balloon Popping
    const balloons = [
      this.element.querySelector('#balloonL1'),
      this.element.querySelector('#balloonL2'),
      this.element.querySelector('#balloonR1'),
      this.element.querySelector('#balloonR2')
    ];

    balloons.forEach((balloon) => {
      if (!balloon) return;
      const popHandler = (e) => {
        e.stopPropagation();
        this.popBalloon(balloon);
      };
      const keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.popBalloon(balloon);
        }
      };

      balloon.addEventListener('click', popHandler);
      balloon.addEventListener('keydown', keyHandler);
      this.cleanups.push(() => {
        balloon.removeEventListener('click', popHandler);
        balloon.removeEventListener('keydown', keyHandler);
      });
    });

    // 2. Cake & Candle Extinguishing
    const cakeRig = this.element.querySelector('#act4CakeRig');
    const hint = this.element.querySelector('#act4Hint');

    const blowHandler = (e) => {
      e.stopPropagation();
      if (this.isCandlesBlown) return;
      this.extinguishCandles();
    };

    const keyBlowHandler = (e) => {
      if (this.isCandlesBlown) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        this.extinguishCandles();
      }
    };

    if (cakeRig) {
      cakeRig.addEventListener('click', blowHandler);
      cakeRig.addEventListener('keydown', keyBlowHandler);
      this.cleanups.push(() => {
        cakeRig.removeEventListener('click', blowHandler);
        cakeRig.removeEventListener('keydown', keyBlowHandler);
      });
    }

    if (hint) {
      hint.addEventListener('click', blowHandler);
      this.cleanups.push(() => {
        hint.removeEventListener('click', blowHandler);
      });
    }

    // Global keyboard listener for Space / B to extinguish candles
    window.addEventListener('keydown', keyBlowHandler);
    this.cleanups.push(() => window.removeEventListener('keydown', keyBlowHandler));
  }

  popBalloon(balloonEl) {
    if (!balloonEl || balloonEl.dataset.popped === 'true') return;
    balloonEl.dataset.popped = 'true';

    // Play pop sound
    audioManager.playSFX(AUDIO_TRACKS.BALLOON_POP, 0.85);
    eventBus.emit(EVENTS.BALLOON_POPPED);

    const rect = balloonEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Spawn colorful balloon spark particles
    ParticleEmitter.spawnBurst(this.element, {
      x: cx,
      y: cy,
      count: 16,
      type: 'gold',
      minDistance: 30,
      maxDistance: 120,
      duration: 0.7
    });

    gsap.to(balloonEl, {
      scale: 1.3,
      opacity: 0,
      duration: 0.16,
      ease: 'power2.out',
      onComplete: () => {
        balloonEl.style.visibility = 'hidden';
      }
    });
  }

  extinguishCandles() {
    if (this.isCandlesBlown) return;
    this.isCandlesBlown = true;

    if (this.stagingTL) {
      this.stagingTL.kill();
      this.stagingTL = null;
    }    // 1. Play candle blow audio immediately at full volume & subtle sparkle chime
    audioManager.playSFX(AUDIO_TRACKS.CANDLE_BLOW, 1.0);
    audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.7);

    // 2. Duck background music slightly for emotional depth
    audioManager.duck(0.25, 4500);

    const flames = [
      this.element.querySelector('#flame1'),
      this.element.querySelector('#flame2'),
      this.element.querySelector('#flame3')
    ];
    const smokes = [
      this.element.querySelector('#smoke1'),
      this.element.querySelector('#smoke2'),
      this.element.querySelector('#smoke3')
    ];
    const cakeGlow = this.element.querySelector('#act4CakeGlow');
    const bgGlow = this.element.querySelector('#act4BgGlow');
    const heading = this.element.querySelector('#act4Heading');
    const hint = this.element.querySelector('#act4Hint');

    const cakeRig = this.element.querySelector('#act4CakeRig');
    const cakeRect = cakeRig ? cakeRig.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const cakeCenterX = cakeRect.left + cakeRect.width / 2;
    const cakeTopY = cakeRect.top + 60;

    this.blowTL = gsap.timeline({
      onComplete: () => {
        // Emit completion event for milestone tracking
        eventBus.emit(EVENTS.CANDLES_BLOWN);
        // Let candle smoke and wish moment linger briefly, then transition to Act 5 Letter
        this.nextActCall = gsap.delayedCall(2.2, () => {
          if (this.element && this.element.parentNode) {
            sceneManager.transitionTo(SCENES.ACT_5);
          }
        });
      }
    });

    // 1. User clicks candle -> blow sound starts FIRST immediately.
    // Flames flutter & tilt under wind pressure during blow sound, then AFTER blow sound plays (~0.8s), flames turn OFF.
    this.blowTL
      .to(flames, {
        rotation: 32,
        scaleX: 1.4,
        scaleY: 0.7,
        x: '+=12',
        duration: 0.4,
        repeat: 1,
        yoyo: true,
        ease: 'sine.inOut'
      }, 0)
      .to(flames, {
        scale: 0,
        opacity: 0,
        rotation: 50,
        duration: 0.25,
        stagger: 0.04,
        ease: 'power2.out'
      }, 0.8)
      // 2. Candle glow & room background smoothly dims AFTER flames turn off at 0.8s
      .to(cakeGlow, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.85)
      .to(bgGlow, { opacity: 0.15, duration: 1.2, ease: 'power2.out' }, 0.85)
      // 3. Smoke curls rise softly from candle wicks after flames go out
      .to(smokes, {
        opacity: 0.85,
        scale: 1.6,
        y: -38,
        duration: 1.4,
        stagger: 0.08,
        ease: 'power1.out'
      }, 0.9)
      .to(smokes, {
        opacity: 0,
        duration: 0.6
      }, 1.7)
      // 4. Update heading text softly
      .to(heading, {
        opacity: 0,
        y: -6,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          if (heading) heading.textContent = 'Wish made ✨';
        }
      }, 1.0)
      .to(heading, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out'
      }, 1.4)
      .to(hint, {
        opacity: 0,
        y: 6,
        duration: 0.4,
        ease: 'power2.in'
      }, 0.3)
      // 5. Delicate celebratory sparkle particles from the cake at extinguishing
      .call(() => {
        ParticleEmitter.spawnBurst(this.element, {
          x: cakeCenterX,
          y: cakeTopY,
          count: 20,
          type: 'gold',
          minDistance: 30,
          maxDistance: 160,
          duration: 1.3
        });
      }, null, 0.85);
  }

  async exit() {
    if (this.stagingTL) {
      this.stagingTL.kill();
      this.stagingTL = null;
    }
    if (this.blowTL) {
      this.blowTL.kill();
      this.blowTL = null;
    }
    if (this.nextActCall) {
      this.nextActCall.kill();
      this.nextActCall = null;
    }
    this.floatTweens.forEach(tw => tw.kill());
    this.floatTweens = [];
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
