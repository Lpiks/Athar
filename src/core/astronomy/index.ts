/**
 * Athar (أَثَر) Astronomical Suite — Public API
 *
 * Sovereign, 100% Offline, Deterministic Celestial Mechanics & Prayer Computation.
 */

export * from './celestial';
export * from './methods';
export * from './qibla';
export * from './prayerTimes';
export * from './adhanAdapter';

import { PrayerTimesResult, PrayerTimeCalculator, PrayerEngineOptions, Prayer } from './prayerTimes';
import { QiblaCalculator, QiblaResult } from './qibla';
import { autoDetectMethodByCoordinates, CALCULATION_METHODS, CalculationMethodParameters, JuristicSchool } from './methods';

export interface PrayerNameLocalization {
  ar: string;
  en: string;
  fr: string;
}

export const PRAYER_NAMES: Record<Prayer, PrayerNameLocalization> = {
  [Prayer.FAJR]: { ar: 'الفجر', en: 'Fajr', fr: 'Fajr' },
  [Prayer.SUNRISE]: { ar: 'الشروق', en: 'Sunrise', fr: 'Lever du soleil' },
  [Prayer.DHUHR]: { ar: 'الظهر', en: 'Dhuhr', fr: 'Dhuhr' },
  [Prayer.ASR]: { ar: 'العصر', en: 'Asr', fr: 'Asr' },
  [Prayer.MAGHRIB]: { ar: 'المغرب', en: 'Maghrib', fr: 'Maghrib' },
  [Prayer.ISHA]: { ar: 'العشاء', en: 'Isha', fr: 'Icha' },
};

export const NIGHT_EVENT_NAMES = {
  midnight: { ar: 'نصف الليل', en: 'Islamic Midnight', fr: 'Milieu de la nuit' },
  firstThird: { ar: 'ثلث الليل الأول', en: 'First Third of the Night', fr: 'Premier tiers de la nuit' },
  lastThird: { ar: 'ثلث الليل الأخير (التهجد)', en: 'Last Third of the Night (Tahajjud)', fr: 'Dernier tiers de la nuit' },
};

/**
 * Primary high-level interface for the Athar Astronomical Suite
 */
export class AtharAstronomicalSuite {
  /**
   * Computes deterministic prayer times for a given date, coordinates, and optional configuration.
   * If no method is supplied, automatically adapts the method to the geographical coordinates.
   */
  public static getPrayerTimes(
    date: Date,
    latitude: number,
    longitude: number,
    options?: PrayerEngineOptions
  ): PrayerTimesResult {
    const resolvedMethod = options?.method ?? autoDetectMethodByCoordinates(latitude, longitude);
    return PrayerTimeCalculator.calculate(date, latitude, longitude, {
      ...options,
      method: resolvedMethod,
    });
  }

  /**
   * Computes great-circle Qibla direction, bearing, and distance to Mecca.
   */
  public static getQibla(latitude: number, longitude: number): QiblaResult {
    return QiblaCalculator.calculateQibla(latitude, longitude);
  }

  /**
   * Format Date to 24-hour time "HH:mm"
   */
  public static formatTime24(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Format millisecond duration to human-readable string "Xh Ym Zs"
   */
  public static formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');

    return `${hStr}:${mStr}:${sStr}`;
  }
}
