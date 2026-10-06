/**
 * Reusable Particle System Foundation
 * Supports HTML/SVG particle bursts, floating motes, sparkles, and Canvas particle pools.
 */

import gsap from 'gsap';
import { rand, pick } from './math.js';

export class ParticleEmitter {
  /**
   * Spawns an SVG or DOM particle burst from a specific coordinate.
   * @param {HTMLElement} container 
   * @param {Object} options 
   */
  static spawnBurst(container, {
    x = 0,
    y = 0,
    count = 16,
    colors = ['#ff6f97', '#ffb14e', '#ff8fae', '#ffd36a', '#e23b67'],
    minSize = 6,
    maxSize = 18,
    minDistance = 40,
    maxDistance = 160,
    duration = 0.9,
    type = 'heart' // 'heart' | 'spark' | 'circle'
  } = {}) {
    const fragment = document.createDocumentFragment();
    const particles = [];

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      const size = rand(minSize, maxSize);
      const color = pick(colors);

      el.className = `particle-burst particle--${type}`;
      el.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        margin: -${size / 2}px 0 0 -${size / 2}px;
        pointer-events: none;
        z-index: 10;
      `;

      if (type === 'heart') {
        el.innerHTML = `
          <svg viewBox="0 0 24 22" width="100%" height="100%">
            <path d="M12 20C5.5 15 1.5 11.4 1.5 6.9 1.5 3.6 4 1.5 7 1.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3 0 5.5 2.1 5.5 5.4C23.5 11.4 19.5 15 12 20Z" fill="${color}"/>
          </svg>
        `;
      } else if (type === 'spark') {
        el.style.borderRadius = '50%';
        el.style.background = `radial-gradient(circle, #fff, ${color} 60%, transparent 70%)`;
      } else {
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
      }

      fragment.appendChild(el);
      particles.push(el);
    }

    container.appendChild(fragment);

    // Animate outwards
    particles.forEach(el => {
      const angle = rand(-Math.PI, Math.PI);
      const distance = rand(minDistance, maxDistance);
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance - rand(0, 30);

      gsap.to(el, {
        x: endX,
        y: endY,
        rotation: rand(-180, 180),
        scale: rand(0.5, 1.2),
        duration: rand(duration * 0.7, duration * 1.3),
        ease: 'power2.out'
      });

      gsap.to(el, {
        opacity: 0,
        duration: 0.4,
        delay: rand(duration * 0.4, duration * 0.8),
        ease: 'power1.in',
        onComplete: () => el.remove()
      });
    });
  }

  /**
   * Spawns floating background ambient motes inside a container.
   * @param {HTMLElement} container 
   * @param {number} count 
   * @returns {() => void} Cleanup function to stop animations and remove motes
   */
  static spawnFloatingMotes(container, count = 12) {
    const motes = [];
    for (let i = 0; i < count; i++) {
      const m = document.createElement('span');
      const size = rand(4, 10);
      m.className = 'ambient-mote';
      m.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${rand(5, 95)}%;
        top: ${rand(10, 95)}%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,236,214,0.9), rgba(255,206,180,0.15) 55%, transparent 72%);
        pointer-events: none;
      `;
      container.appendChild(m);
      motes.push(m);

      gsap.set(m, { opacity: rand(0.2, 0.7) });
      gsap.to(m, {
        y: -rand(30, 120),
        x: rand(-20, 20),
        duration: rand(6, 12),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: -rand(0, 6)
      });
    }

    return () => {
      motes.forEach(m => {
        gsap.killTweensOf(m);
        m.remove();
      });
    };
  }
}
