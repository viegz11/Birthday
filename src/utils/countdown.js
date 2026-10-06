/**
 * Birthday Experience - Countdown & Gate System
 * 
 * Target: 07-10-2026 00:00:00 (October 7, 2026 00:00 IST)
 * Mode 1: PRE_BIRTHDAY -> Counts down HH:MM:SS to 07-10-2026 00:00
 * Mode 2: UNLOCKED_LIVE -> Direct unlock (00:00 to 00:05)
 * Mode 3: POST_WINDOW_22S -> After 00:05, every site load starts a 22s countdown
 */

export const COUNTDOWN_CONFIG = {
  // Target Birthday Date: Oct 7, 2026 00:00:00 IST (+05:30)
  targetDateStr: "2026-10-07T00:00:00+05:30",
  
  // After-window cutoff: Oct 7, 2026 00:05:00 IST (+05:30)
  afterWindowStr: "2026-10-07T00:05:00+05:30",
  
  // Duration in seconds for post-window countdown on every load
  postWindowSeconds: 22
};

export class CountdownManager {
  static getTargetDates() {
    const target = new Date(COUNTDOWN_CONFIG.targetDateStr);
    const afterWindow = new Date(COUNTDOWN_CONFIG.afterWindowStr);
    return { target, afterWindow };
  }

  static getStatus(now = new Date()) {
    const { target, afterWindow } = CountdownManager.getTargetDates();
    const nowTime = now.getTime();
    const targetTime = target.getTime();
    const afterWindowTime = afterWindow.getTime();

    if (nowTime < targetTime) {
      const remainingMs = Math.max(0, targetTime - nowTime);
      return {
        mode: 'PRE_BIRTHDAY',
        unlocked: false,
        remainingMs
      };
    } else if (nowTime >= targetTime && nowTime < afterWindowTime) {
      return {
        mode: 'UNLOCKED_LIVE',
        unlocked: true,
        remainingMs: 0
      };
    } else {
      // Opened after 00:05:00 -> Start 22s countdown timer on every session load
      return {
        mode: 'POST_WINDOW_22S',
        unlocked: false,
        durationSec: COUNTDOWN_CONFIG.postWindowSeconds
      };
    }
  }

  static formatTime(remainingMs) {
    const totalSec = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n) => String(n).padStart(2, '0');
    return {
      hours: pad(hours),
      mins: pad(mins),
      secs: pad(secs),
      totalSec
    };
  }
}
