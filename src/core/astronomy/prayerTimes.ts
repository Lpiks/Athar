/**
 * Athar (أَثَر) Deterministic Prayer Times Engine
 *
 * Implements pure offline celestial mechanics for all five daily prayers,
 * sunrise, midnight, and the Last Third of the Night (ثلث الليل الأخير).
 */

import { CelestialMath } from './celestial';
import {
  CalculationMethodParameters,
  CALCULATION_METHODS,
  HighLatitudeRule,
  JuristicSchool,
} from './methods';

export enum Prayer {
  FAJR = 'fajr',
  SUNRISE = 'sunrise',
  DHUHR = 'dhuhr',
  ASR = 'asr',
  MAGHRIB = 'maghrib',
  ISHA = 'isha',
}

export interface PrayerTimesResult {
  readonly date: Date;
  readonly fajr: Date;
  readonly sunrise: Date;
  readonly dhuhr: Date;
  readonly asr: Date;
  readonly maghrib: Date;
  readonly isha: Date;
  /** Islamic Midnight (halfway between Maghrib and tomorrow's Fajr) */
  readonly midnight: Date;
  /** First Third of the Night (Maghrib + 1/3 of the night duration) */
  readonly firstThirdOfTheNight: Date;
  /** Last Third of the Night (Maghrib + 2/3 of the night duration - Tahajjud window) */
  readonly lastThirdOfTheNight: Date;
}

export interface CurrentPrayerState {
  readonly currentPrayer: Prayer | 'none';
  readonly nextPrayer: Prayer;
  readonly currentPrayerTime: Date;
  readonly nextPrayerTime: Date;
  /** Remaining time in milliseconds to next prayer */
  readonly remainingMs: number;
  /** Fraction (0.0 to 1.0) representing progression through the current prayer interval */
  readonly intervalProgress: number;
}

export interface PrayerEngineOptions {
  method?: CalculationMethodParameters;
  school?: JuristicSchool;
  highLatitudeRule?: HighLatitudeRule;
  elevationMeters?: number;
  /** Manual offsets in minutes added to each prayer: [fajr, sunrise, dhuhr, asr, maghrib, isha] */
  minuteOffsets?: {
    fajr?: number;
    sunrise?: number;
    dhuhr?: number;
    asr?: number;
    maghrib?: number;
    isha?: number;
  };
}

export class PrayerTimeCalculator {
  /**
   * Calculate prayer times for a specific calendar date and coordinates.
   *
   * @param date Calendar date (year, month, day in local civil time)
   * @param latitude Observer latitude in decimal degrees
   * @param longitude Observer longitude in decimal degrees
   * @param options Configuration options
   */
  public static calculate(
    date: Date,
    latitude: number,
    longitude: number,
    options?: PrayerEngineOptions
  ): PrayerTimesResult {
    const method = options?.method ?? CALCULATION_METHODS.ALGERIA;
    const school = options?.school ?? method.defaultSchool ?? JuristicSchool.MALIKI_SHAFI_HANBALI;
    const shadowFactor = school === JuristicSchool.HANAFI ? 2.0 : 1.0;
    const highLatitudeRule = options?.highLatitudeRule ?? HighLatitudeRule.MIDDLE_OF_THE_NIGHT;
    const elevation = options?.elevationMeters ?? 0.0;
    const offsets = options?.minuteOffsets;

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-based month
    const day = date.getDate();

    // Local timezone offset in hours (e.g. UTC+1 -> 1.0)
    // Note: getTimezoneOffset() returns minutes between UTC and local, inverted.
    const tzOffsetHours = -date.getTimezoneOffset() / 60.0;

    // Approximate Julian Date at local noon
    const jdNoon = CelestialMath.calculateJulianDate(year, month, day, 12.0 - tzOffsetHours);
    const solarCoords = CelestialMath.computeSolarCoordinates(jdNoon);

    // Exact Solar Transit (Solar Noon)
    const solarTransitHours = CelestialMath.calculateSolarTransit(
      solarCoords.equationOfTimeMinutes,
      longitude,
      tzOffsetHours
    );

    // Dhuhr: Solar noon + safety margin
    const dhuhrBufferHours = (method.dhuhrMinutesBuffer ?? 1.0) / 60.0;
    let dhuhrHours = solarTransitHours + dhuhrBufferHours;

    // Sunrise & Sunset altitude
    const sunriseSunsetAlt = CelestialMath.getAdjustedSunriseSunsetAltitude(elevation);
    const haSunriseSunset = CelestialMath.calculateHourAngle(
      latitude,
      solarCoords.declinationDeg,
      sunriseSunsetAlt
    );

    if (haSunriseSunset === null) {
      throw new Error(`Extreme latitude (${latitude}°): sun does not rise/set on ${date.toISOString()}`);
    }

    let sunriseHours = solarTransitHours - haSunriseSunset;
    let sunsetHours = solarTransitHours + haSunriseSunset;

    // Maghrib: if method specifies custom angle, calculate; otherwise sunset
    let maghribHours = sunsetHours;
    if (method.maghribAngle !== undefined) {
      const haMaghrib = CelestialMath.calculateHourAngle(
        latitude,
        solarCoords.declinationDeg,
        -method.maghribAngle
      );
      if (haMaghrib !== null) {
        maghribHours = solarTransitHours + haMaghrib;
      }
    }

    // Asr: Maliki (s = 1) or Hanafi (s = 2)
    const asrAltitude = CelestialMath.calculateAsrAltitude(
      latitude,
      solarCoords.declinationDeg,
      shadowFactor
    );
    const haAsr = CelestialMath.calculateHourAngle(
      latitude,
      solarCoords.declinationDeg,
      asrAltitude
    );
    let asrHours = haAsr !== null ? solarTransitHours + haAsr : solarTransitHours + 3.0;

    // Fajr: Angle-based
    let haFajr = CelestialMath.calculateHourAngle(
      latitude,
      solarCoords.declinationDeg,
      -method.fajrAngle
    );

    // Isha: Angle-based or fixed interval
    let ishaHours: number;
    let haIsha: number | null = null;
    if (method.ishaIntervalMinutes !== undefined) {
      ishaHours = maghribHours + method.ishaIntervalMinutes / 60.0;
    } else {
      haIsha = CelestialMath.calculateHourAngle(
        latitude,
        solarCoords.declinationDeg,
        -(method.ishaAngle ?? 17.0)
      );
      ishaHours = haIsha !== null ? solarTransitHours + haIsha : maghribHours + 1.5;
    }

    let fajrHours = haFajr !== null ? solarTransitHours - haFajr : sunriseHours - 1.5;

    // Handle High Latitude Adjustments if angles fail or nights are short
    const nightDurationHours = 24.0 - (sunsetHours - sunriseHours);
    if (haFajr === null || haIsha === null) {
      if (highLatitudeRule === HighLatitudeRule.MIDDLE_OF_THE_NIGHT) {
        fajrHours = sunriseHours - nightDurationHours / 2.0;
        if (method.ishaIntervalMinutes === undefined) {
          ishaHours = sunsetHours + nightDurationHours / 2.0;
        }
      } else if (highLatitudeRule === HighLatitudeRule.ONE_SEVENTH) {
        fajrHours = sunriseHours - nightDurationHours / 7.0;
        if (method.ishaIntervalMinutes === undefined) {
          ishaHours = sunsetHours + nightDurationHours / 7.0;
        }
      } else if (highLatitudeRule === HighLatitudeRule.ANGLE_BASED) {
        fajrHours = sunriseHours - (nightDurationHours * method.fajrAngle) / 60.0;
        if (method.ishaIntervalMinutes === undefined) {
          ishaHours = sunsetHours + (nightDurationHours * (method.ishaAngle ?? 17.0)) / 60.0;
        }
      }
    }

    // Apply manual minute offsets if configured
    if (offsets?.fajr) fajrHours += offsets.fajr / 60.0;
    if (offsets?.sunrise) sunriseHours += offsets.sunrise / 60.0;
    if (offsets?.dhuhr) dhuhrHours += offsets.dhuhr / 60.0;
    if (offsets?.asr) asrHours += offsets.asr / 60.0;
    if (offsets?.maghrib) maghribHours += offsets.maghrib / 60.0;
    if (offsets?.isha) ishaHours += offsets.isha / 60.0;

    // Convert decimal hours to Date instances
    const fajrDate = this.hoursToDate(date, fajrHours);
    const sunriseDate = this.hoursToDate(date, sunriseHours);
    const dhuhrDate = this.hoursToDate(date, dhuhrHours);
    const asrDate = this.hoursToDate(date, asrHours);
    const maghribDate = this.hoursToDate(date, maghribHours);
    const ishaDate = this.hoursToDate(date, ishaHours);

    // Calculate tomorrow's Fajr for night subdivisions
    const tomorrow = new Date(date.getTime() + 86400000);
    const tomorrowJd = CelestialMath.calculateJulianDate(
      tomorrow.getFullYear(),
      tomorrow.getMonth() + 1,
      tomorrow.getDate(),
      12.0 - tzOffsetHours
    );
    const tomorrowCoords = CelestialMath.computeSolarCoordinates(tomorrowJd);
    const tomorrowTransit = CelestialMath.calculateSolarTransit(
      tomorrowCoords.equationOfTimeMinutes,
      longitude,
      tzOffsetHours
    );
    const tomorrowHaFajr =
      CelestialMath.calculateHourAngle(
        latitude,
        tomorrowCoords.declinationDeg,
        -method.fajrAngle
      ) ?? 1.5;
    let tomorrowFajrHours = tomorrowTransit - tomorrowHaFajr;
    if (offsets?.fajr) tomorrowFajrHours += offsets.fajr / 60.0;
    const tomorrowFajrDate = this.hoursToDate(tomorrow, tomorrowFajrHours);

    // Islamic Night Subdivisions
    // Night duration = tomorrowFajrDate - maghribDate
    const nightDurationMs = tomorrowFajrDate.getTime() - maghribDate.getTime();

    // Midnight = Maghrib + 1/2 of night
    const midnight = new Date(maghribDate.getTime() + nightDurationMs * 0.5);

    // First Third = Maghrib + 1/3 of night
    const firstThirdOfTheNight = new Date(maghribDate.getTime() + nightDurationMs * (1.0 / 3.0));

    // Last Third (ثلث الليل الأخير) = Maghrib + 2/3 of night (or tomorrowFajr - 1/3)
    const lastThirdOfTheNight = new Date(maghribDate.getTime() + nightDurationMs * (2.0 / 3.0));

    return {
      date,
      fajr: fajrDate,
      sunrise: sunriseDate,
      dhuhr: dhuhrDate,
      asr: asrDate,
      maghrib: maghribDate,
      isha: ishaDate,
      midnight,
      firstThirdOfTheNight,
      lastThirdOfTheNight,
    };
  }

  /**
   * Determine the current active prayer and countdown to next prayer.
   *
   * @param prayerTimes Calculated prayer times for the day
   * @param now Current timestamp (defaults to new Date())
   */
  public static getCurrentPrayerState(
    prayerTimes: PrayerTimesResult,
    now: Date = new Date()
  ): CurrentPrayerState {
    const t = now.getTime();
    const pFajr = prayerTimes.fajr.getTime();
    const pSunrise = prayerTimes.sunrise.getTime();
    const pDhuhr = prayerTimes.dhuhr.getTime();
    const pAsr = prayerTimes.asr.getTime();
    const pMaghrib = prayerTimes.maghrib.getTime();
    const pIsha = prayerTimes.isha.getTime();

    let currentPrayer: Prayer | 'none' = 'none';
    let nextPrayer: Prayer = Prayer.FAJR;
    let currentPrayerTime: Date = prayerTimes.isha;
    let nextPrayerTime: Date = prayerTimes.fajr;

    if (t >= pIsha) {
      currentPrayer = Prayer.ISHA;
      nextPrayer = Prayer.FAJR;
      currentPrayerTime = prayerTimes.isha;
      // Next Fajr is tomorrow morning (+24h approx from today's fajr)
      nextPrayerTime = new Date(prayerTimes.fajr.getTime() + 86400000);
    } else if (t >= pMaghrib) {
      currentPrayer = Prayer.MAGHRIB;
      nextPrayer = Prayer.ISHA;
      currentPrayerTime = prayerTimes.maghrib;
      nextPrayerTime = prayerTimes.isha;
    } else if (t >= pAsr) {
      currentPrayer = Prayer.ASR;
      nextPrayer = Prayer.MAGHRIB;
      currentPrayerTime = prayerTimes.asr;
      nextPrayerTime = prayerTimes.maghrib;
    } else if (t >= pDhuhr) {
      currentPrayer = Prayer.DHUHR;
      nextPrayer = Prayer.ASR;
      currentPrayerTime = prayerTimes.dhuhr;
      nextPrayerTime = prayerTimes.asr;
    } else if (t >= pSunrise) {
      currentPrayer = Prayer.SUNRISE;
      nextPrayer = Prayer.DHUHR;
      currentPrayerTime = prayerTimes.sunrise;
      nextPrayerTime = prayerTimes.dhuhr;
    } else if (t >= pFajr) {
      currentPrayer = Prayer.FAJR;
      nextPrayer = Prayer.SUNRISE;
      currentPrayerTime = prayerTimes.fajr;
      nextPrayerTime = prayerTimes.sunrise;
    } else {
      // Early morning before Fajr: current interval is previous day's Isha
      currentPrayer = Prayer.ISHA;
      nextPrayer = Prayer.FAJR;
      currentPrayerTime = new Date(prayerTimes.isha.getTime() - 86400000);
      nextPrayerTime = prayerTimes.fajr;
    }

    const totalIntervalMs = nextPrayerTime.getTime() - currentPrayerTime.getTime();
    const elapsedMs = Math.max(0, t - currentPrayerTime.getTime());
    const remainingMs = Math.max(0, nextPrayerTime.getTime() - t);
    const intervalProgress =
      totalIntervalMs > 0 ? Math.min(1.0, Math.max(0.0, elapsedMs / totalIntervalMs)) : 0.0;

    return {
      currentPrayer,
      nextPrayer,
      currentPrayerTime,
      nextPrayerTime,
      remainingMs,
      intervalProgress: Number(intervalProgress.toFixed(4)),
    };
  }

  /**
   * Helper to convert decimal hours to a JavaScript Date object on a given reference date
   */
  private static hoursToDate(referenceDate: Date, decimalHours: number): Date {
    const normalized = CelestialMath.normalizeHours(decimalHours);
    const hours = Math.floor(normalized);
    const totalMinutes = (normalized - hours) * 60.0;
    const minutes = Math.floor(totalMinutes);
    const totalSeconds = (totalMinutes - minutes) * 60.0;
    const seconds = Math.floor(totalSeconds);
    const milliseconds = Math.floor((totalSeconds - seconds) * 1000.0);

    const result = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
      hours,
      minutes,
      seconds,
      milliseconds
    );

    return result;
  }
}
