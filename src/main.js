/**
 * Main Application Entry Point - Phase 1 Foundation
 */

import './styles/theme.css';
import './styles/lens.css';
import './styles/main.css';

import { eventBus, EVENTS } from './core/EventBus.js';
import { audioManager } from './core/AudioManager.js';
import { sceneManager, SCENES } from './core/SceneManager.js';
import { transitionManager } from './core/TransitionManager.js';

// Act Stubs
import { Act0_Mystery } from './acts/Act0_Mystery.js';
import { Act1_CupidBow } from './acts/Act1_CupidBow.js';
import { Act2_HeartBurst } from './acts/Act2_HeartBurst.js';
import { Act3_Reveal } from './acts/Act3_Reveal.js';
import { Act4_Celebration } from './acts/Act4_Celebration.js';
import { Act5_Letter } from './acts/Act5_Letter.js';
import { Act6_Memories } from './acts/Act6_Memories.js';
import { Act7_BlossomTree } from './acts/Act7_BlossomTree.js';
import { Act8_FinalMessage } from './acts/Act8_FinalMessage.js';

class BirthdayApplication {
  constructor() {
    this.stage = document.getElementById('stage');
    this.soundToggleBtn = document.getElementById('soundToggle');
    this.isSoundMuted = false;
  }

  init() {
    console.log('[BirthdayApplication] Initializing Foundation & Infrastructure...');

    // 1. Preload audio library
    audioManager.preload();

    // 2. Setup user interaction unlock listener
    const handleFirstInteraction = () => {
      audioManager.unlock();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    // 3. Register sound toggle UI
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isSoundMuted = audioManager.toggleMute();
        this.updateSoundToggleUI();

        if (!this.isSoundMuted) {
          audioManager.ensureSceneMusic(sceneManager.currentScene);
        }
      });
    }

    // 4. Register Transition Overlays
    transitionManager.registerOverlays({
      flood: document.getElementById('roseFlood'),
      bloom: document.getElementById('lightBloom'),
      wipe: null
    });

    // 5. Initialize Scene Manager and Register all 9 Acts
    sceneManager.init(this.stage);
    sceneManager.registerAct(SCENES.ACT_0, new Act0_Mystery());
    sceneManager.registerAct(SCENES.ACT_1, new Act1_CupidBow());
    sceneManager.registerAct(SCENES.ACT_2, new Act2_HeartBurst());
    sceneManager.registerAct(SCENES.ACT_3, new Act3_Reveal());
    sceneManager.registerAct(SCENES.ACT_4, new Act4_Celebration());
    sceneManager.registerAct(SCENES.ACT_5, new Act5_Letter());
    sceneManager.registerAct(SCENES.ACT_6, new Act6_Memories());
    sceneManager.registerAct(SCENES.ACT_7, new Act7_BlossomTree());
    sceneManager.registerAct(SCENES.ACT_8, new Act8_FinalMessage());

    // 6. Listen for sound toggle event changes
    eventBus.on(EVENTS.SOUND_TOGGLED, ({ isMuted }) => {
      this.isSoundMuted = isMuted;
      this.updateSoundToggleUI();
    });

    eventBus.on('SCENE_CHANGED', ({ current }) => {
      audioManager.ensureSceneMusic(current);
    });

    // 7. Start linear journey from Act 0
    sceneManager.transitionTo(SCENES.ACT_0);

    console.log('[BirthdayApplication] Foundation Ready.');
  }

  updateSoundToggleUI() {
    if (!this.soundToggleBtn) return;
    const soundOnSvg = this.soundToggleBtn.querySelector('.sound-on-svg');
    const soundOffSvg = this.soundToggleBtn.querySelector('.sound-off-svg');
    if (soundOnSvg && soundOffSvg) {
      soundOnSvg.style.display = this.isSoundMuted ? 'none' : 'block';
      soundOffSvg.style.display = this.isSoundMuted ? 'block' : 'none';
    }
    this.soundToggleBtn.setAttribute('aria-label', this.isSoundMuted ? 'Sound is muted. Tap to turn sound ON' : 'Sound is ON. Tap to mute');
    this.soundToggleBtn.title = this.isSoundMuted ? 'Turn Sound ON' : 'Mute Sound';
    if (this.isSoundMuted) {
      this.soundToggleBtn.classList.add('sound-muted');
      this.soundToggleBtn.classList.remove('sound-active');
    } else {
      this.soundToggleBtn.classList.remove('sound-muted');
      this.soundToggleBtn.classList.add('sound-active');
    }
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new BirthdayApplication();
  app.init();
});
