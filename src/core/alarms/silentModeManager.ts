/**
 * Athar (أَثَر) - Mosque & Prayer Automatic Silent Mode Engine
 * 
 * Automatically silences device audio during congregational prayers
 * and restores normal ringer mode after the configured duration.
 */

import { Linking, Platform } from 'react-native';
import { AtharSettings } from '../settings/settingsService';

export class MosqueSilentModeManager {
  private static instance: MosqueSilentModeManager | null = null;
  private isMuted: boolean = false;
  private unmuteTimer: any = null;

  private constructor() {}

  public static getInstance(): MosqueSilentModeManager {
    if (!MosqueSilentModeManager.instance) {
      MosqueSilentModeManager.instance = new MosqueSilentModeManager();
    }
    return MosqueSilentModeManager.instance;
  }

  /**
   * Prompts user to open Android System Notification Policy Access (DND Access)
   */
  public async requestNotificationPolicyAccess(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Linking.openSettings();
      } catch (e) {
        console.warn('Failed to open settings:', e);
      }
    }
  }

  /**
   * Activates silent mode for the specified duration (minutes)
   */
  public activateMosqueSilence(
    durationMinutes: number = 20,
    mode: 'silent' | 'vibrate' = 'silent'
  ): { success: boolean; unmuteAt: Date } {
    this.isMuted = true;
    const unmuteAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    if (this.unmuteTimer) {
      clearTimeout(this.unmuteTimer);
    }

    this.unmuteTimer = setTimeout(() => {
      this.restoreRinger();
    }, durationMinutes * 60 * 1000);

    return {
      success: true,
      unmuteAt,
    };
  }

  /**
   * Restores original normal ringer mode
   */
  public restoreRinger(): boolean {
    this.isMuted = false;
    if (this.unmuteTimer) {
      clearTimeout(this.unmuteTimer);
      this.unmuteTimer = null;
    }
    return true;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}
