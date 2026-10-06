/**
 * Scene Manager - Master State Machine
 * Manages the linear cinematic journey from ACT_0 through ACT_8.
 * Handles lifecycle mounts, scene cleanups, and transition locks.
 */

import { eventBus } from './EventBus.js';

export const SCENES = {
  ACT_0: 'ACT_0_MYSTERY',
  ACT_1: 'ACT_1_CUPID_BOW',
  ACT_2: 'ACT_2_HEART_BURST',
  ACT_3: 'ACT_3_BIRTHDAY_REVEAL',
  ACT_4: 'ACT_4_CELEBRATION',
  ACT_5: 'ACT_5_PERSONAL_LETTER',
  ACT_6: 'ACT_6_MEMORY_GALLERY',
  ACT_7: 'ACT_7_BLOSSOM_TREE',
  ACT_8: 'ACT_8_FINAL_MESSAGE'
};

export const SCENE_SEQUENCE = [
  SCENES.ACT_0,
  SCENES.ACT_1,
  SCENES.ACT_2,
  SCENES.ACT_3,
  SCENES.ACT_4,
  SCENES.ACT_5,
  SCENES.ACT_6,
  SCENES.ACT_7,
  SCENES.ACT_8
];

class SceneManager {
  constructor() {
    this.container = null;
    this.currentSceneId = null;
    this.currentSceneInstance = null;
    this.registeredActs = new Map();
    this.isTransitioning = false;
  }

  /**
   * Initializes the container DOM host.
   * @param {HTMLElement} containerElement 
   */
  init(containerElement) {
    this.container = containerElement;
  }

  /**
   * Registers an Act instance with its Scene ID.
   * @param {string} sceneId 
   * @param {object} actInstance 
   */
  registerAct(sceneId, actInstance) {
    this.registeredActs.set(sceneId, actInstance);
  }

  /**
   * Returns current active scene ID.
   */
  getCurrentSceneId() {
    return this.currentSceneId;
  }

  get currentScene() {
    return this.currentSceneId;
  }

  /**
   * Performs a transition to target scene with locking to prevent duplicates.
   * @param {string} targetSceneId 
   * @param {object} [transitionOptions={}] 
   */
  async transitionTo(targetSceneId, transitionOptions = {}) {
    if (this.isTransitioning) {
      console.warn(`[SceneManager] Transition in progress. Ignoring request for: ${targetSceneId}`);
      return false;
    }

    const nextAct = this.registeredActs.get(targetSceneId);
    if (!nextAct) {
      console.error(`[SceneManager] Act not registered for scene: ${targetSceneId}`);
      return false;
    }

    this.isTransitioning = true;
    const prevSceneId = this.currentSceneId;
    const prevAct = this.currentSceneInstance;

    try {
      // 1. Exit & unmount previous scene
      if (prevAct && typeof prevAct.exit === 'function') {
        await prevAct.exit(transitionOptions);
      }

      // 2. Update pointers
      this.currentSceneId = targetSceneId;
      this.currentSceneInstance = nextAct;

      // 3. Mount & enter incoming scene
      if (typeof nextAct.enter === 'function') {
        await nextAct.enter(this.container, transitionOptions);
      }

      eventBus.emit('SCENE_CHANGED', {
        previous: prevSceneId,
        current: targetSceneId
      });

      return true;
    } catch (err) {
      console.error(`[SceneManager] Error during transition from ${prevSceneId} to ${targetSceneId}:`, err);
      return false;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Advances sequentially to the next act in the storyline.
   */
  async nextAct(options = {}) {
    if (!this.currentSceneId) {
      return this.transitionTo(SCENE_SEQUENCE[0], options);
    }
    const currentIndex = SCENE_SEQUENCE.indexOf(this.currentSceneId);
    if (currentIndex >= 0 && currentIndex < SCENE_SEQUENCE.length - 1) {
      const nextScene = SCENE_SEQUENCE[currentIndex + 1];
      return this.transitionTo(nextScene, options);
    }
    console.log('[SceneManager] Already at final act.');
    return false;
  }

  /**
   * Restarts the journey from Act 0.
   */
  async restart() {
    return this.transitionTo(SCENES.ACT_0);
  }

  /**
   * Cleans up all acts and references.
   */
  destroy() {
    if (this.currentSceneInstance && typeof this.currentSceneInstance.destroy === 'function') {
      this.currentSceneInstance.destroy();
    }
    this.registeredActs.clear();
    this.currentSceneId = null;
    this.currentSceneInstance = null;
  }
}

export const sceneManager = new SceneManager();
