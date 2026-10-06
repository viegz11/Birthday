/**
 * Math and interpolation utilities
 */

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * Quadratic bezier point calculation.
 */
export const quad = (p0, cp, p1, t) => {
  const m = 1 - t;
  const a = m * m;
  const k = 2 * m * t;
  const d = t * t;
  return {
    x: a * p0.x + k * cp.x + d * p1.x,
    y: a * p0.y + k * cp.y + d * p1.y
  };
};

/**
 * Adjust hex color brightness/shade.
 */
export function shadeColor(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = clamp((n >> 16) + amt, 0, 255);
  const g = clamp(((n >> 8) & 255) + amt, 0, 255);
  const b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
