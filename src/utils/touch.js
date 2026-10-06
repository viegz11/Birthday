/**
 * Touch and Pointer gesture utilities
 * Handles pointerdown, pointermove, pointerup, drag, swipe gesture detection,
 * velocity tracking, and touch cleanup for both mobile and desktop.
 */

export class GestureHandler {
  constructor(element, callbacks = {}) {
    this.element = element;
    this.callbacks = {
      onStart: callbacks.onStart || (() => {}),
      onMove: callbacks.onMove || (() => {}),
      onEnd: callbacks.onEnd || (() => {}),
      onSwipe: callbacks.onSwipe || (() => {}),
      onCancel: callbacks.onCancel || (() => {})
    };

    this.isTracking = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.startTime = 0;
    this.lastTime = 0;
    this.velocityX = 0;
    this.velocityY = 0;

    this.bindEvents();
  }

  bindEvents() {
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);

    this.element.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
  }

  handlePointerDown(e) {
    this.isTracking = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.currentX = e.clientX;
    this.currentY = e.clientY;
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.velocityX = 0;
    this.velocityY = 0;

    try {
      this.element.setPointerCapture(e.pointerId);
    } catch (_) {}

    this.callbacks.onStart({
      x: this.startX,
      y: this.startY,
      pointerId: e.pointerId,
      event: e
    });
  }

  handlePointerMove(e) {
    if (!this.isTracking) return;

    const now = performance.now();
    const dt = Math.max(1, now - this.lastTime);
    
    this.velocityX = (e.clientX - this.currentX) / dt;
    this.velocityY = (e.clientY - this.currentY) / dt;

    this.currentX = e.clientX;
    this.currentY = e.clientY;
    this.lastTime = now;

    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;

    this.callbacks.onMove({
      x: this.currentX,
      y: this.currentY,
      deltaX,
      deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      event: e
    });
  }

  handlePointerUp(e) {
    if (!this.isTracking) return;
    this.isTracking = false;

    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    const duration = performance.now() - this.startTime;

    // Detect swipe (distance > 40px, duration < 400ms or high velocity)
    const isSwipe = (Math.abs(deltaX) > 40 || Math.abs(this.velocityX) > 0.5) && duration < 500;
    let direction = null;

    if (isSwipe) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
      this.callbacks.onSwipe({
        direction,
        deltaX,
        deltaY,
        velocityX: this.velocityX,
        velocityY: this.velocityY
      });
    }

    this.callbacks.onEnd({
      x: this.currentX,
      y: this.currentY,
      deltaX,
      deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isSwipe,
      direction,
      event: e
    });
  }

  handlePointerCancel(e) {
    if (!this.isTracking) return;
    this.isTracking = false;
    this.callbacks.onCancel({ event: e });
  }

  destroy() {
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
  }
}
