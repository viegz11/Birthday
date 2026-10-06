/**
 * Lightweight, decoupled Event Bus for the cinematic birthday film.
 * Allows independent communication between Acts, AudioManager, and SceneManager.
 */

export const EVENTS = {
  USER_AUDIO_UNLOCKED: 'USER_AUDIO_UNLOCKED',
  SOUND_TOGGLED: 'SOUND_TOGGLED',
  
  // Act 0 - Mystery
  MYSTERY_HEART_TAPPED: 'MYSTERY_HEART_TAPPED',
  
  // Act 1 - Cupid's Arrow
  BOW_DRAW_START: 'BOW_DRAW_START',
  BOW_DRAW_MOVE: 'BOW_DRAW_MOVE',
  BOW_RELEASED: 'BOW_RELEASED',
  
  // Act 2 - Heart Burst
  HEART_STRUCK: 'HEART_STRUCK',
  HEART_BURST: 'HEART_BURST',
  
  // Act 3 - Birthday Reveal
  BIRTHDAY_REVEAL_START: 'BIRTHDAY_REVEAL_START',
  BIRTHDAY_REVEAL_COMPLETE: 'BIRTHDAY_REVEAL_COMPLETE',
  
  // Act 4 - Celebration & Wishes
  CELEBRATION_STAGED: 'CELEBRATION_STAGED',
  BALLOON_POPPED: 'BALLOON_POPPED',
  CANDLE_LIT: 'CANDLE_LIT',
  CANDLES_BLOWN: 'CANDLES_BLOWN',
  
  // Act 5 - Personal Letter
  LETTER_OPENED: 'LETTER_OPENED',
  LETTER_COMPLETED: 'LETTER_COMPLETED',
  
  // Act 6 - Memory Gallery
  MEMORY_CHANGED: 'MEMORY_CHANGED',
  PHOTO_OPENED: 'PHOTO_OPENED',
  PHOTO_CLOSED: 'PHOTO_CLOSED',
  LAST_MEMORY_REACHED: 'LAST_MEMORY_REACHED',
  
  // Act 7 - Blossom Tree
  SEED_GERMINATED: 'SEED_GERMINATED',
  TREE_GROWTH_START: 'TREE_GROWTH_START',
  TREE_BLOOMED: 'TREE_BLOOMED',
  
  // Act 8 - Final Message
  FINAL_MESSAGE_REVEALED: 'FINAL_MESSAGE_REVEALED',
  REPLAY_REQUESTED: 'REPLAY_REQUESTED'
};

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  once(event, callback) {
    const unregister = this.on(event, (...args) => {
      unregister();
      callback(...args);
    });
    return unregister;
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error handling event "${event}":`, error);
        }
      });
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
