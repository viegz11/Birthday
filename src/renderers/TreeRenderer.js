/**
 * TreeRenderer - Canvas 2D Procedural Heart Blossom Tree Engine
 * 
 * High-performance, cinematic procedural tree rendering engine:
 * - Pre-rendered offscreen blossom sprites with layered color gradients & specular highlights
 * - Precise parametric heart polygon point-in-polygon sampling for a dense, lush canopy
 * - Multi-tier recursive organic branches with bark gradients and root system
 * - Depth layers: Background soft-focus bokeh, midground velvety canopy, foreground glowing blooms
 * - Dynamic growth timeline synchronized with Act 7 & Act 8 (0.0 to 1.0)
 * - Living breathing animation: gentle wind sway, falling drifting petals, ground accumulation
 * - Shimmering stardust sparkles, atmospheric god rays, and radiant golden halo
 */

import { eventBus, EVENTS } from '../core/EventBus.js';
import { audioManager, AUDIO_TRACKS } from '../core/AudioManager.js';

// Helpers
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt, 0, 255);
  const g = clamp(((n >> 8) & 255) + amt, 0, 255);
  const b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

// Blossom palette pairings (inner highlight -> outer petal tone)
const BLOSSOM_PALETTES = [
  { c0: '#ffe8f2', c1: '#ff6595', name: 'rose' },
  { c0: '#ffd5e5', c1: '#f43f5e', name: 'blush' },
  { c0: '#ffccd8', c1: '#e11d48', name: 'cherry' },
  { c0: '#ffe2d1', c1: '#fb923c', name: 'peach' },
  { c0: '#fef3c7', c1: '#f59e0b', name: 'amber' },
  { c0: '#fffbeb', c1: '#fbbf24', name: 'gold' },
  { c0: '#ffd8ec', c1: '#ec4899', name: 'magenta' }
];

const SPRITE_SIZE = 140;

function heartShapePath(ctx, x, top, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, top + h * 0.28);
  ctx.bezierCurveTo(x, top, x - w * 0.5, top, x - w * 0.5, top + h * 0.28);
  ctx.bezierCurveTo(x - w * 0.5, top + h * 0.60, x - w * 0.16, top + h * 0.80, x, top + h);
  ctx.bezierCurveTo(x + w * 0.16, top + h * 0.80, x + w * 0.5, top + h * 0.60, x + w * 0.5, top + h * 0.28);
  ctx.bezierCurveTo(x + w * 0.5, top, x, top, x, top + h * 0.28);
  ctx.closePath();
}

function makeBlossomSprite({ c0, c1 }, soft) {
  const cv = document.createElement('canvas');
  cv.width = SPRITE_SIZE;
  cv.height = SPRITE_SIZE;
  const c = cv.getContext('2d');
  const w = SPRITE_SIZE * 0.64;
  const h = SPRITE_SIZE * 0.60;
  const x = SPRITE_SIZE / 2;
  const top = SPRITE_SIZE * 0.16;

  // Soft romantic drop shadow
  c.save();
  c.shadowColor = 'rgba(180, 20, 70, 0.35)';
  c.shadowBlur = SPRITE_SIZE * 0.09;
  c.shadowOffsetY = SPRITE_SIZE * 0.04;
  c.fillStyle = c1;
  heartShapePath(c, x, top, w, h);
  c.fill();
  c.restore();

  // Radial Gradient Body
  const grad = c.createRadialGradient(x - w * 0.2, top + h * 0.2, h * 0.05, x, top + h * 0.45, h * 0.95);
  grad.addColorStop(0, c0);
  grad.addColorStop(0.55, c1);
  grad.addColorStop(1, shade(c1, -28));
  heartShapePath(c, x, top, w, h);
  c.fillStyle = grad;
  c.fill();

  // Inner Petal Depth & Specular Sheen
  c.save();
  heartShapePath(c, x, top, w, h);
  c.clip();

  const depthGrad = c.createLinearGradient(0, top, 0, top + h);
  depthGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  depthGrad.addColorStop(0.65, 'rgba(120, 10, 45, 0)');
  depthGrad.addColorStop(1, 'rgba(120, 10, 45, 0.32)');
  c.fillStyle = depthGrad;
  c.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  // Specular gleam
  c.globalAlpha = 0.65;
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.ellipse(x - w * 0.16, top + h * 0.25, w * 0.18, h * 0.12, -0.5, 0, Math.PI * 2);
  c.fill();
  c.restore();

  if (!soft) return cv;

  // For soft background blossoms, apply subtle blur
  const cvSoft = document.createElement('canvas');
  cvSoft.width = cvSoft.height = SPRITE_SIZE;
  const cSoft = cvSoft.getContext('2d');
  cSoft.filter = 'blur(2.8px)';
  cSoft.drawImage(cv, 0, 0);
  cSoft.filter = 'none';
  cSoft.globalCompositeOperation = 'source-atop';
  cSoft.globalAlpha = 0.4;
  cSoft.fillStyle = '#fff0ea';
  cSoft.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return cvSoft;
}

function makeBokehOrb(rgb) {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, `rgba(${rgb}, 0.85)`);
  g.addColorStop(0.45, `rgba(${rgb}, 0.2)`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  return cv;
}

function makeSparkleSprite() {
  const S = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const m = S / 2;

  const g = c.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
  g.addColorStop(0.25, 'rgba(255, 238, 195, 0.6)');
  g.addColorStop(1, 'rgba(255, 238, 195, 0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(m, m, m, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = 'rgba(255, 255, 255, 0.95)';
  c.translate(m, m);
  for (let k = 0; k < 2; k++) {
    c.beginPath();
    c.moveTo(0, -m);
    c.quadraticCurveTo(0, 0, m, 0);
    c.quadraticCurveTo(0, 0, 0, m);
    c.quadraticCurveTo(0, 0, -m, 0);
    c.quadraticCurveTo(0, 0, 0, -m);
    c.fill();
    c.rotate(Math.PI / 4);
    c.scale(0.5, 0.5);
  }
  return cv;
}

export class TreeRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.isRunning = false;
    this.rafId = 0;
    this.startTime = 0;
    this.lastTime = 0;

    // Growth state (0.0 to 1.0)
    this.growthProgress = 0;
    this.isFullyBloomed = false;
    this.sparkleMilestones = { m1: false, m2: false, m3: false };

    // Geometry data
    this.heartPoly = null;
    this.branches = [];
    this.roots = [];
    this.blossoms = [];
    this.fallingPetals = [];
    this.groundPetals = [];
    this.bokehOrbs = [];
    this.twinkles = [];
    this.godRays = [];

    // Tree layout anchors
    this.cx = 0;
    this.cy = 0;
    this.rx = 0;
    this.ry = 0;
    this.groundY = 0;
    this.canopyScale = 1;

    // Cached Sprites
    this.sprites = { crisp: [], soft: [] };
    this.bokehSprites = [];
    this.sparkleSprite = null;

    this.initSprites();
  }

  initSprites() {
    this.sprites = {
      crisp: BLOSSOM_PALETTES.map(p => makeBlossomSprite(p, false)),
      soft: BLOSSOM_PALETTES.map(p => makeBlossomSprite(p, true))
    };
    this.bokehSprites = [
      makeBokehOrb('255,224,188'),
      makeBokehOrb('255,196,214'),
      makeBokehOrb('255,238,210'),
      makeBokehOrb('251,113,133')
    ];
    this.sparkleSprite = makeSparkleSprite();
  }

  buildHeartPoly() {
    const raw = [];
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    const steps = 180;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      raw.push([x, y]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const hw = (maxX - minX) / 2;
    const hh = (maxY - minY) / 2;
    this.heartPoly = raw.map(([x, y]) => [(x - midX) / hw, (y - midY) / hh]);
  }

  pointInHeart(u, v) {
    if (!this.heartPoly) return false;
    let inside = false;
    const p = this.heartPoly;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const xi = p[i][0], yi = p[i][1];
      const xj = p[j][0], yj = p[j][1];
      if (((yi > v) !== (yj > v)) && (u < ((xj - xi) * (v - yi)) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  init() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.generateStructure();
  }

  resize() {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = this.canvas.clientWidth || window.innerWidth;
    this.height = this.canvas.clientHeight || window.innerHeight;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);

    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    const W = this.width;
    const H = this.height;
    const isMobile = W < 768;
    const isWide = W / H > 1.2;

    // Center and crown dimensions
    this.cx = W * 0.5;
    // Keep canopy high enough on mobile so letter text below has ample room
    this.cy = H * (isMobile ? 0.32 : (isWide ? 0.36 : 0.34));
    this.groundY = H * (isMobile ? 0.90 : 0.93);

    // Lush, grand heart canopy radius
    this.ry = isMobile
      ? Math.min(H * 0.28, W * 0.42)
      : Math.min(H * 0.32, W * 0.36);
    this.rx = this.ry * 1.18;
    this.canopyScale = this.ry / 120;

    this.buildHeartPoly();
    this.generateStructure();
  }

  generateStructure() {
    const W = this.width;
    const H = this.height;
    const cx = this.cx;
    const cy = this.cy;
    const rx = this.rx;
    const ry = this.ry;
    const groundY = this.groundY;
    const isMobile = W < 768;

    this.branches = [];
    this.roots = [];
    this.blossoms = [];
    this.fallingPetals = [];
    this.groundPetals = [];
    this.bokehOrbs = [];
    this.twinkles = [];
    this.godRays = [];

    // 1. Ambient God Rays
    for (let i = 0; i < 7; i++) {
      this.godRays.push({
        angle: -0.4 + (i / 6) * 0.8,
        width: 70 + Math.random() * 60,
        alpha: 0.04 + Math.random() * 0.05,
        pulseSpeed: 0.7 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2
      });
    }

    // 2. Floating Bokeh Orbs
    const orbCount = isMobile ? 8 : 14;
    for (let i = 0; i < orbCount; i++) {
      this.bokehOrbs.push({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(W * 0.06, W * 0.16),
        vy: rand(-8, -20),
        drift: rand(-0.4, 0.4),
        phase: rand(0, Math.PI * 2),
        alpha: rand(0.06, 0.16),
        sprite: this.bokehSprites[Math.floor(Math.random() * this.bokehSprites.length)]
      });
    }

    // 3. Roots at trunk base
    const rootCount = isMobile ? 6 : 8;
    for (let i = 0; i < rootCount; i++) {
      const dir = (i / (rootCount - 1) - 0.5) * 2;
      const rootLen = (isMobile ? 40 : 65) * (0.7 + Math.random() * 0.5);
      this.roots.push({
        x0: cx + dir * 6,
        y0: groundY - 2,
        cpX: cx + dir * rootLen * 0.7,
        cpY: groundY + 2,
        x1: cx + dir * rootLen * 1.5,
        y1: groundY + Math.random() * 12 + 4,
        width: 5.5 * (1 - Math.abs(dir) * 0.3),
        growthStart: 0.0,
        growthEnd: 0.18
      });
    }

    // 4. Procedural Branch Hierarchy
    const trunkW = Math.max(12, W * 0.026);
    const trunkTopY = cy + ry * 0.62;
    const limbLen = ry * 0.58;

    const insidePx = (x, y, margin = 0.95) => {
      const u = (x - cx) / (rx * margin);
      const v = (y - cy) / (ry * margin);
      return this.pointInHeart(u, v);
    };

    const barkColor = (depth) => {
      const lightness = 22 + depth * 4;
      return `hsl(348, 28%, ${lightness}%)`;
    };

    const addBranch = (x, y, ang, len, w0, depth, t0) => {
      let ex = x + Math.cos(ang) * len;
      let ey = y + Math.sin(ang) * len;
      let clipped = false;

      if (!insidePx(ex, ey) && depth > 0) {
        let lo = 0, hi = 1;
        for (let k = 0; k < 12; k++) {
          const mid = (lo + hi) / 2;
          const tx = x + Math.cos(ang) * len * mid;
          const ty = y + Math.sin(ang) * len * mid;
          if (insidePx(tx, ty)) lo = mid;
          else hi = mid;
        }
        ex = x + Math.cos(ang) * len * lo;
        ey = y + Math.sin(ang) * len * lo;
        clipped = true;
      }

      const mx = (x + ex) / 2;
      const my = (y + ey) / 2;
      const perp = ang + Math.PI / 2;
      const bend = rand(-1, 1) * len * 0.12;
      const w1 = w0 * 0.68;

      this.branches.push({
        x1: x,
        y1: y,
        cx: mx + Math.cos(perp) * bend,
        cy: my + Math.sin(perp) * bend,
        x2: ex,
        y2: ey,
        w0,
        w1,
        growthStart: t0,
        growthEnd: Math.min(0.68, t0 + Math.max(0.12, 0.28 - depth * 0.03)),
        depth,
        color: barkColor(depth)
      });

      return { ex, ey, w1, clipped };
    };

    const grow = (x, y, ang, len, w, depth, t0) => {
      const r = addBranch(x, y, ang, len, w, depth, t0);
      if (r.clipped || depth >= 5 || len < ry * 0.07) return;

      const childT0 = t0 + (0.28 - depth * 0.03) * 0.5;
      const n = Math.random() < 0.5 ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const spread = 0.58 * (i - (n - 1) / 2) + rand(-0.18, 0.18);
        const lift = -0.06 + rand(-0.04, 0.04);
        grow(r.ex, r.ey, ang + spread + lift, len * rand(0.72, 0.84), r.w1, depth + 1, childT0 + i * 0.03);
      }
    };

    // Main Trunk
    addBranch(cx, groundY, -Math.PI / 2, groundY - trunkTopY, trunkW, 0, 0.05);

    // Primary Limbs
    const limbCount = 3;
    for (let i = 0; i < limbCount; i++) {
      const ang = -Math.PI / 2 + 0.64 * (i - (limbCount - 1) / 2) + rand(-0.1, 0.1);
      grow(cx, trunkTopY, ang, limbLen, trunkW * 0.72, 1, 0.18 + i * 0.04);
    }

    // 5. Dense Blossom Heart Canopy Distribution
    const blossomCount = Math.round(clamp(rx * ry / 38, 480, 720));
    const baseBox = clamp(Math.min(W, H) * 0.12, 34, 76);
    let guard = 0;

    while (this.blossoms.length < blossomCount && guard < blossomCount * 45) {
      guard++;
      const u = rand(-1.05, 1.05);
      const v = rand(-1.05, 1.05);
      if (!this.pointInHeart(u, v)) continue;

      const bx = cx + u * rx + rand(-5, 5);
      const by = cy + v * ry + rand(-5, 5);
      const distFromCenter = clamp01(Math.hypot(u, v) / 1.15);

      // Growth timing: inner blossoms open earlier (from 0.40), outer blossoms unfold progressively
      const spawnProgress = 0.40 + distFromCenter * 0.45 + rand(0, 0.12);
      const soft = Math.random() < 0.38;
      const paletteIdx = (Math.random() * BLOSSOM_PALETTES.length) | 0;

      this.blossoms.push({
        x: bx,
        y: by,
        paletteIdx,
        soft,
        box: baseBox * (soft ? rand(0.65, 0.9) : rand(0.82, 1.2)),
        rot: rand(-0.6, 0.6),
        swaySpeed: rand(1.2, 2.2),
        swayAmp: rand(1.5, 4.0),
        swayPhase: rand(0, Math.PI * 2),
        spawnProgress: Math.min(0.96, spawnProgress)
      });
    }

    // Sort blossoms: soft in background, then top-to-bottom for natural visual overlap
    this.blossoms.sort((a, b) => (a.soft === b.soft ? a.y - b.y : a.soft ? -1 : 1));

    // 6. Falling Petals Pool
    const fallingCount = isMobile ? 22 : 32;
    for (let i = 0; i < fallingCount; i++) {
      this.fallingPetals.push({
        x: cx + rand(-rx * 0.9, rx * 0.9),
        y: cy + rand(-ry * 0.8, ry * 0.9),
        vy: rand(18, 38),
        vx: rand(-12, 12),
        swaySpeed: rand(1.4, 2.5),
        swayAmp: rand(14, 28),
        phase: rand(0, Math.PI * 2),
        box: baseBox * rand(0.32, 0.55),
        paletteIdx: (Math.random() * BLOSSOM_PALETTES.length) | 0,
        rot: rand(0, Math.PI * 2),
        vRot: rand(-1.5, 1.5),
        landY: groundY + rand(-4, 18)
      });
    }

    // 7. Ground Petals
    const groundCount = isMobile ? 35 : 65;
    for (let i = 0; i < groundCount; i++) {
      this.groundPetals.push({
        x: cx + rand(-rx * 1.1, rx * 1.1),
        y: groundY + rand(-6, 20),
        box: baseBox * rand(0.3, 0.5),
        paletteIdx: (Math.random() * BLOSSOM_PALETTES.length) | 0,
        rot: rand(0, Math.PI * 2),
        alpha: rand(0.6, 0.95),
        spawnProgress: 0.62 + rand(0, 0.32)
      });
    }
  }

  setProgress(p) {
    this.growthProgress = clamp01(p);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastTime = this.startTime;

    const loop = (now) => {
      if (!this.isRunning) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      const elapsed = (now - this.startTime) / 1000;
      this.lastTime = now;

      this.update(elapsed, dt);
      this.render(elapsed, dt);

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  update(elapsed, dt) {
    const p = this.growthProgress;

    // Check Sparkle Milestones SFX
    if (p >= 0.55 && !this.sparkleMilestones.m1) {
      this.sparkleMilestones.m1 = true;
      audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.5);
    }
    if (p >= 0.80 && !this.sparkleMilestones.m2) {
      this.sparkleMilestones.m2 = true;
      audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.65);
    }
    if (p >= 0.98 && !this.sparkleMilestones.m3) {
      this.sparkleMilestones.m3 = true;
      audioManager.playSFX(AUDIO_TRACKS.SPARKLE, 0.8);
    }

    if (p >= 1.0 && !this.isFullyBloomed) {
      this.isFullyBloomed = true;
      eventBus.emit(EVENTS.TREE_BLOOMED);
    }

    // Update Falling Petals (starts after blossoms bloom, p > 0.6)
    if (p > 0.6) {
      this.fallingPetals.forEach(petal => {
        petal.y += petal.vy * dt;
        petal.x += (petal.vx + Math.sin(elapsed * petal.swaySpeed + petal.phase) * petal.swayAmp) * dt;
        petal.rot += petal.vRot * dt;

        // Reset once fallen past landing threshold
        if (petal.y >= petal.landY || petal.x < -20 || petal.x > this.width + 20) {
          petal.y = this.cy + rand(-this.ry * 0.7, this.ry * 0.4);
          petal.x = this.cx + rand(-this.rx * 0.8, this.rx * 0.8);
          petal.rot = rand(0, Math.PI * 2);
        }
      });
    }

    // Update Twinkle Sparkles
    if (p > 0.75 && this.twinkles.length < 10 && Math.random() < 0.4) {
      const b = this.blossoms[(Math.random() * this.blossoms.length) | 0];
      if (b && p >= b.spawnProgress) {
        this.twinkles.push({
          x: b.x,
          y: b.y,
          size: rand(18, 38),
          rot: rand(0, Math.PI * 2),
          age: 0,
          life: rand(0.6, 1.1)
        });
      }
    }

    for (let i = this.twinkles.length - 1; i >= 0; i--) {
      const tw = this.twinkles[i];
      tw.age += dt;
      if (tw.age >= tw.life) {
        this.twinkles.splice(i, 1);
      }
    }
  }

  render(elapsed, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const p = this.growthProgress;
    const cx = this.cx;
    const cy = this.cy;
    const rx = this.rx;
    const ry = this.ry;
    const groundY = this.groundY;

    ctx.clearRect(0, 0, W, H);

    // 1. Atmospheric God Rays
    if (p > 0.25) {
      const rayAlpha = Math.min(1, (p - 0.25) / 0.6);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      this.godRays.forEach(ray => {
        const pulse = 1 + Math.sin(elapsed * ray.pulseSpeed + ray.phase) * 0.22;
        const grad = ctx.createRadialGradient(cx, cy - ry * 0.2, 10, cx + Math.sin(ray.angle) * H, cy + Math.cos(ray.angle) * H, ray.width * 2.2);
        grad.addColorStop(0, `rgba(255, 225, 170, ${ray.alpha * rayAlpha * pulse})`);
        grad.addColorStop(0.5, `rgba(251, 113, 133, ${ray.alpha * 0.45 * rayAlpha * pulse})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, cy - ry * 0.2);
        ctx.lineTo(cx + Math.sin(ray.angle - 0.14) * H, cy + Math.cos(ray.angle - 0.14) * H);
        ctx.lineTo(cx + Math.sin(ray.angle + 0.14) * H, cy + Math.cos(ray.angle + 0.14) * H);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    }

    // 2. Ground Horizon Illumination
    if (p > 0.08) {
      const glowA = Math.min(0.38, p * 0.4);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const groundGrad = ctx.createRadialGradient(cx, groundY + 4, 15, cx, groundY + 4, W * 0.55);
      groundGrad.addColorStop(0, `rgba(255, 215, 150, ${glowA})`);
      groundGrad.addColorStop(0.5, `rgba(225, 29, 72, ${glowA * 0.45})`);
      groundGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = groundGrad;
      ctx.beginPath();
      ctx.ellipse(cx, groundY + 4, W * 0.48, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Floating Bokeh Orbs
    if (p > 0.15) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      this.bokehOrbs.forEach(o => {
        o.y += o.vy * dt;
        o.x += Math.sin(elapsed * 0.4 + o.phase) * o.drift;
        if (o.y < -o.r) {
          o.y = H + o.r;
          o.x = rand(0, W);
        }
        ctx.globalAlpha = o.alpha * Math.min(1, p * 1.5);
        ctx.drawImage(o.sprite, o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
      });
      ctx.restore();
    }

    // 4. Roots
    if (p > 0.0) {
      this.roots.forEach(root => {
        if (p < root.growthStart) return;
        const prog = Math.min(1, (p - root.growthStart) / (root.growthEnd - root.growthStart));
        const eased = easeOutCubic(prog);

        ctx.strokeStyle = '#321016';
        ctx.lineWidth = root.width;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(root.x0, root.y0);
        const curEndX = root.x0 + (root.x1 - root.x0) * eased;
        const curEndY = root.y0 + (root.y1 - root.y0) * eased;
        const curCpX = root.x0 + (root.cpX - root.x0) * eased;
        const curCpY = root.y0 + (root.cpY - root.y0) * eased;
        ctx.quadraticCurveTo(curCpX, curCpY, curEndX, curEndY);
        ctx.stroke();
      });
    }

    // 5. Branches
    this.branches.forEach(b => {
      if (p < b.growthStart) return;
      const bProg = Math.min(1, (p - b.growthStart) / (b.growthEnd - b.growthStart));
      const eased = easeOutCubic(bProg);

      ctx.strokeStyle = b.color;
      ctx.lineWidth = lerp(b.w0, b.w1, eased);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      const curEndX = b.x1 + (b.x2 - b.x1) * eased;
      const curEndY = b.y1 + (b.y2 - b.y1) * eased;
      const curCpX = b.x1 + (b.cx - b.x1) * eased;
      const curCpY = b.y1 + (b.cy - b.y1) * eased;
      ctx.quadraticCurveTo(curCpX, curCpY, curEndX, curEndY);
      ctx.stroke();
    });

    // 6. Canopy Blossoms (Pre-rendered Sprites with Living Wind Oscillation & Breath)
    const breathe = 1 + Math.sin(elapsed * 0.8) * 0.014;

    this.blossoms.forEach(b => {
      if (p < b.spawnProgress) return;
      const bOpenProg = Math.min(1, (p - b.spawnProgress) / 0.14);
      const scaleEased = Math.max(0, easeOutBack(bOpenProg));
      const alpha = clamp01(bOpenProg * 1.6) * (b.soft ? 0.82 : 1.0);

      const settled = clamp01((p - b.spawnProgress - 0.14) / 0.2);
      const sway = settled * Math.sin(elapsed * b.swaySpeed + b.swayPhase) * b.swayAmp;
      const rise = (1 - easeOutCubic(bOpenProg)) * b.box * 0.35;

      const bx = cx + (b.x - cx) * breathe + sway;
      const by = cy + (b.y - cy) * breathe - rise;
      const sprite = (b.soft ? this.sprites.soft : this.sprites.crisp)[b.paletteIdx];

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(b.rot + sway * 0.015);
      ctx.globalAlpha = alpha;
      const curSize = b.box * scaleEased;
      ctx.drawImage(sprite, -curSize * 0.5, -curSize * 0.48, curSize, curSize);
      ctx.restore();
    });

    // 7. Shimmering Stardust Sparkles on Blossoms
    if (this.twinkles.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      this.twinkles.forEach(tw => {
        const k = tw.age / tw.life;
        const alpha = Math.sin(k * Math.PI);
        const sz = tw.size * (0.6 + 0.4 * alpha);
        ctx.save();
        ctx.translate(tw.x, tw.y);
        ctx.rotate(tw.rot + k * 1.4);
        ctx.globalAlpha = alpha;
        ctx.drawImage(this.sparkleSprite, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      });
      ctx.restore();
    }

    // 8. Ground Petals Accumulation
    if (p > 0.62) {
      this.groundPetals.forEach(gp => {
        if (p < gp.spawnProgress) return;
        const gpAlpha = Math.min(1, (p - gp.spawnProgress) / 0.15) * gp.alpha;
        const sprite = this.sprites.crisp[gp.paletteIdx];

        ctx.save();
        ctx.translate(gp.x, gp.y);
        ctx.rotate(gp.rot);
        ctx.globalAlpha = gpAlpha;
        ctx.drawImage(sprite, -gp.box * 0.5, -gp.box * 0.5, gp.box, gp.box);
        ctx.restore();
      });
    }

    // 9. Falling Petals Drifting in Wind
    if (p > 0.6) {
      this.fallingPetals.forEach(fp => {
        const sprite = this.sprites.crisp[fp.paletteIdx];
        ctx.save();
        ctx.translate(fp.x, fp.y);
        ctx.rotate(fp.rot);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(sprite, -fp.box * 0.5, -fp.box * 0.5, fp.box, fp.box);
        ctx.restore();
      });
    }

    // 10. Canopy Crown Radiant Halo at Full Bloom
    if (p > 0.82) {
      const haloAlpha = Math.min(0.36, (p - 0.82) / 0.18 * 0.36);
      const haloPulse = 1 + Math.sin(elapsed * 1.4) * 0.06;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const haloGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rx * 1.5 * haloPulse);
      haloGrad.addColorStop(0, `rgba(255, 235, 185, ${haloAlpha})`);
      haloGrad.addColorStop(0.5, `rgba(251, 113, 133, ${haloAlpha * 0.55})`);
      haloGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, rx * 1.5 * haloPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  destroy() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }
}
