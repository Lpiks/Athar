/**
 * Athar (أَثَر) - Mosque & Prayer Automatic Silent Mode Engine
 * 
 * Automatically silences device audio during congregational prayers
 * and restores normal ringer mode after the configured duration.
 * Communicates directly with Android AudioManager & NotificationManager via AtharRinger.
 */

import { Linking, Platform } from 'react-native';
import {
  isDndAccessGranted,
  openDndSettings,
  setRingerMode,
  getRingerMode,
  isNativeRingerAvailable,
} from '../../../modules/athar-ringer';

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
   * Checks whether Do Not Disturb / Notification Policy Access is granted
   */
  public async hasDndAccess(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        return await isDndAccessGranted();
      } catch {
        return false;
      }
    }
    return true;
  }

  /**
   * Prompts user to open Android System Notification Policy Access (DND Access)
   */
  public async requestNotificationPolicyAccess(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        const opened = await openDndSettings();
        if (!opened) {
          await Linking.openSettings();
        }
      } catch (e) {
        console.warn('Failed to open settings:', e);
        try {
          await Linking.openSettings();
        } catch {}
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

    // Trigger native hardware ringer mode change
    if (Platform.OS === 'android') {
      setRingerMode(mode).catch((err) => {
        console.warn('[MosqueSilentMode] Error setting ringer mode:', err);
      });
    }

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

    // Restore native hardware ringer to normal
    if (Platform.OS === 'android') {
      setRingerMode('normal').catch((err) => {
        console.warn('[MosqueSilentMode] Error restoring normal ringer:', err);
      });
    }

    return true;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public async getPhysicalRingerMode(): Promise<'silent' | 'vibrate' | 'normal' | 'unknown'> {
    if (Platform.OS === 'android') {
      return await getRingerMode();
    }
    return 'unknown';
  }

  public isNativeModuleLoaded(): boolean {
    return isNativeRingerAvailable();
  }
}
