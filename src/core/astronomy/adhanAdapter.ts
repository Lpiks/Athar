/**
 * Athar (أَثَر) Adhan Adapter
 *
 * Provides a hardened adapter layer over @batoulapps/adhan,
 * pre-configured for the Algerian Ministry of Religious Affairs (18.0° / 17.0°)
 * and Maliki Fiqh, with seamless cross-verification.
 */

import {
  CalculationParameters,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla as AdhanQibla,
} from 'adhan';

import { JuristicSchool } from './methods';

export type AdhanMadhabType = (typeof Madhab)[keyof typeof Madhab];

export class AdhanAdapter {
  /**
   * Builds CalculationParameters for the Algerian Ministry of Religious Affairs:
   * Fajr: 18.0°, Isha: 17.0°, Maliki/Shafi Madhab (shadow factor 1.0)
   */
  public static getAlgerianMinistryParameters(): CalculationParameters {
    const params = new CalculationParameters('Other', 18.0, 17.0);
    params.madhab = Madhab.Shafi; // Madhab.Shafi in adhan corresponds to shadow factor 1 (Maliki & Shafi'i)
    return params;
  }

  /**
   * Convert Athar JuristicSchool to Adhan Madhab
   */
  public static toAdhanMadhab(school: JuristicSchool): AdhanMadhabType {
    return school === JuristicSchool.HANAFI ? Madhab.Hanafi : Madhab.Shafi;
  }

  /**
   * Calculate prayer times via @batoulapps/adhan
   */
  public static calculate(
    date: Date,
    latitude: number,
    longitude: number,
    school: JuristicSchool = JuristicSchool.MALIKI_SHAFI_HANBALI,
    customParams?: CalculationParameters
  ): PrayerTimes {
    const coordinates = new Coordinates(latitude, longitude);
    const params = customParams ?? this.getAlgerianMinistryParameters();
    params.madhab = this.toAdhanMadhab(school);

    return new PrayerTimes(coordinates, date, params);
  }

  /**
   * Calculate Qibla bearing via @batoulapps/adhan
   */
  public static calculateQibla(latitude: number, longitude: number): number {
    const coordinates = new Coordinates(latitude, longitude);
    return AdhanQibla(coordinates);
  }
}
