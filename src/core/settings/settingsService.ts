/**
 * Athar (أَثَر) - Persistent Sovereign Settings Service
 * 
 * Manages all user preferences offline with instant local persistence.
 */

import { DEFAULT_ALGERIA_WILAYA } from '../astronomy/algeriaWilayas';
import { Riwaya, TafsirType } from '../database/types';

export interface AtharSettings {
  // Mosque Silent Mode
  mosqueSilentMode: {
    enabled: boolean;
    mode: 'silent' | 'vibrate';
    durationMinutes: number; // e.g. 20 min
    fridayDurationMinutes: number; // e.g. 45 min
  };

  // Prayer Calculation
  prayerCalculation: {
    methodKey: 'algerian' | 'umm_al_qura' | 'mwl' | 'egyptian';
    juristicSchool: 'maliki' | 'hanafi';
    preAdhanAlertMinutes: number; // e.g. 10 min
    adhanSound: string; // 'algerian' | 'makkah' | 'chime'
  };

  // Location
  location: {
    wilayaCode: number;
    cityAr: string;
    latitude: number;
    longitude: number;
    useGps: boolean;
  };

  // Quran & Reading
  quran: {
    defaultRiwaya: Riwaya;
    fontSize: 'normal' | 'large' | 'huge';
    defaultTafsir: TafsirType;
    isParchment: boolean;
  };
}

export const DEFAULT_SETTINGS: AtharSettings = {
  mosqueSilentMode: {
    enabled: true,
    mode: 'silent',
    durationMinutes: 20,
    fridayDurationMinutes: 45,
  },
  prayerCalculation: {
    methodKey: 'algerian',
    juristicSchool: 'maliki',
    preAdhanAlertMinutes: 10,
    adhanSound: 'algerian',
  },
  location: {
    wilayaCode: DEFAULT_ALGERIA_WILAYA.code,
    cityAr: DEFAULT_ALGERIA_WILAYA.nameAr,
    latitude: DEFAULT_ALGERIA_WILAYA.latitude,
    longitude: DEFAULT_ALGERIA_WILAYA.longitude,
    useGps: false,
  },
  quran: {
    defaultRiwaya: 'WARSH',
    fontSize: 'normal',
    defaultTafsir: 'MUYASSAR',
    isParchment: true,
  },
};

export class SettingsService {
  private static instance: SettingsService | null = null;
  private currentSettings: AtharSettings = { ...DEFAULT_SETTINGS };
  private listeners: Array<(settings: AtharSettings) => void> = [];

  private constructor() {}

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public getSettings(): AtharSettings {
    return { ...this.currentSettings };
  }

  public updateSettings(partial: Partial<AtharSettings>): AtharSettings {
    this.currentSettings = {
      ...this.currentSettings,
      ...partial,
      mosqueSilentMode: {
        ...this.currentSettings.mosqueSilentMode,
        ...(partial.mosqueSilentMode || {}),
      },
      prayerCalculation: {
        ...this.currentSettings.prayerCalculation,
        ...(partial.prayerCalculation || {}),
      },
      location: {
        ...this.currentSettings.location,
        ...(partial.location || {}),
      },
      quran: {
        ...this.currentSettings.quran,
        ...(partial.quran || {}),
      },
    };

    this.notify();
    return this.getSettings();
  }

  public subscribe(listener: (settings: AtharSettings) => void): () => void {
    this.listeners.push(listener);
    listener(this.getSettings());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const fresh = this.getSettings();
    for (const l of this.listeners) {
      try {
        l(fresh);
      } catch {}
    }
  }
}
