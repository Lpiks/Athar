/**
 * Athar (أَثَر) - Native Ringer & Do Not Disturb Module
 *
 * Provides direct access to Android AudioManager and NotificationManager
 * for true physical device silencing during congregational prayer times.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';

export interface AtharRingerInterface {
  /**
   * Checks whether the user has granted Do Not Disturb (Notification Policy) access.
   */
  isDndAccessGranted(): Promise<boolean>;

  /**
   * Opens Android Settings -> Special App Access -> Do Not Disturb Access.
   */
  openDndSettings(): Promise<boolean>;

  /**
   * Sets physical ringer mode to 'silent', 'vibrate', or 'normal'.
   */
  setRingerMode(mode: 'silent' | 'vibrate' | 'normal'): Promise<boolean>;

  /**
   * Returns current physical ringer mode: 'silent', 'vibrate', 'normal', or 'unknown'.
   */
  getRingerMode(): Promise<'silent' | 'vibrate' | 'normal' | 'unknown'>;
}

const NativeRinger = requireOptionalNativeModule<AtharRingerInterface>('AtharRinger');

export const isNativeRingerAvailable = (): boolean => {
  return NativeRinger !== null;
};

export const isDndAccessGranted = async (): Promise<boolean> => {
  if (NativeRinger) {
    try {
      return await NativeRinger.isDndAccessGranted();
    } catch {
      return false;
    }
  }
  return false;
};

export const openDndSettings = async (): Promise<boolean> => {
  if (NativeRinger) {
    try {
      return await NativeRinger.openDndSettings();
    } catch {
      return false;
    }
  }
  return false;
};

export const setRingerMode = async (mode: 'silent' | 'vibrate' | 'normal'): Promise<boolean> => {
  if (NativeRinger) {
    try {
      return await NativeRinger.setRingerMode(mode);
    } catch (e) {
      console.warn('Native ringer error:', e);
      return false;
    }
  }
  console.log(`[AtharRinger Fallback] Requested ringer mode: ${mode} (Native module not available in Expo Go)`);
  return false;
};

export const getRingerMode = async (): Promise<'silent' | 'vibrate' | 'normal' | 'unknown'> => {
  if (NativeRinger) {
    try {
      return await NativeRinger.getRingerMode();
    } catch {
      return 'unknown';
    }
  }
  return 'unknown';
};

export default {
  isNativeRingerAvailable,
  isDndAccessGranted,
  openDndSettings,
  setRingerMode,
  getRingerMode,
};
