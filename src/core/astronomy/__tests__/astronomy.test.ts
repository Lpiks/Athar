/**
 * Athar (أَثَر) Celestial Astronomy Verification Test Suite
 *
 * Validates deterministic prayer times, Qibla geodesic math,
 * and night subdivisions across Algiers, Oran, Constantine, Mecca, and Paris.
 */

import {
  CelestialMath,
  QiblaCalculator,
  PrayerTimeCalculator,
  AtharAstronomicalSuite,
  AdhanAdapter,
  CALCULATION_METHODS,
  JuristicSchool,
  Prayer,
} from '../index';

describe('1. Celestial Mechanics & First-Principles Determinism', () => {
  test('Julian Date calculation matches Meeus standard', () => {
    // Meeus Example: 1987 January 27 at 0h TT is JD 2446822.5
    const jd = CelestialMath.calculateJulianDate(1987, 1, 27, 0.0);
    expect(jd).toBeCloseTo(2446822.5, 4);

    // J2000.0 epoch: 2000 January 1.5 is JD 2451545.0
    const jdJ2000 = CelestialMath.calculateJulianDate(2000, 1, 1, 12.0);
    expect(jdJ2000).toBeCloseTo(2451545.0, 4);
  });

  test('Solar Declination and Equation of Time within astronomical physical bounds', () => {
    // Sample across the solstices and equinoxes
    const testDates = [
      new Date('2026-03-20T12:00:00Z'), // Equinox
      new Date('2026-06-21T12:00:00Z'), // Summer Solstice
      new Date('2026-09-22T12:00:00Z'), // Autumn Equinox
      new Date('2026-12-21T12:00:00Z'), // Winter Solstice
    ];

    for (const d of testDates) {
      const jd = CelestialMath.calculateJulianDate(
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
        12.0
      );
      const coords = CelestialMath.computeSolarCoordinates(jd);

      // Solar declination must be within Earth axial tilt (-23.45° to +23.45°)
      expect(coords.declinationDeg).toBeGreaterThanOrEqual(-23.6);
      expect(coords.declinationDeg).toBeLessThanOrEqual(23.6);

      // Equation of time in minutes is bounded within [-17, +17]
      expect(coords.equationOfTimeMinutes).toBeGreaterThanOrEqual(-17.0);
      expect(coords.equationOfTimeMinutes).toBeLessThanOrEqual(17.0);
    }
  });

  test('Summer solstice produces positive maximum declination ~ +23.4°', () => {
    const jd = CelestialMath.calculateJulianDate(2026, 6, 21, 12.0);
    const coords = CelestialMath.computeSolarCoordinates(jd);
    expect(coords.declinationDeg).toBeCloseTo(23.44, 0.5);
  });

  test('Winter solstice produces negative maximum declination ~ -23.4°', () => {
    const jd = CelestialMath.calculateJulianDate(2026, 12, 21, 12.0);
    const coords = CelestialMath.computeSolarCoordinates(jd);
    expect(coords.declinationDeg).toBeCloseTo(-23.44, 0.5);
  });
});

describe('2. Great-Circle Qibla Geodesic Verification', () => {
  // Verified coordinates
  const ALGIERS = { lat: 36.7538, lon: 3.0588 };
  const ORAN = { lat: 35.6987, lon: -0.6349 };
  const CONSTANTINE = { lat: 36.365, lon: 6.6147 };
  const MECCA = { lat: 21.4224779, lon: 39.8261818 };
  const PARIS = { lat: 48.8566, lon: 2.3522 };

  test('Qibla from Algiers points East-South-East (~105.4°)', () => {
    const qibla = QiblaCalculator.calculateQibla(ALGIERS.lat, ALGIERS.lon);
    // Great-circle forward azimuth from Algiers to Mecca is ~105.4°
    expect(qibla.bearingDegrees).toBeGreaterThan(104.0);
    expect(qibla.bearingDegrees).toBeLessThan(107.0);
    // Geodesic distance ~ 3950 to 4050 km
    expect(qibla.distanceKm).toBeGreaterThan(3900);
    expect(qibla.distanceKm).toBeLessThan(4100);
    expect(qibla.cardinalDirection).toBe('ESE');
  });

  test('Qibla from Oran points ~100.9°', () => {
    const qibla = QiblaCalculator.calculateQibla(ORAN.lat, ORAN.lon);
    expect(qibla.bearingDegrees).toBeGreaterThan(99.0);
    expect(qibla.bearingDegrees).toBeLessThan(103.0);
    expect(qibla.distanceKm).toBeGreaterThan(4200);
    expect(qibla.distanceKm).toBeLessThan(4400);
  });

  test('Qibla from Constantine points ~108.2°', () => {
    const qibla = QiblaCalculator.calculateQibla(CONSTANTINE.lat, CONSTANTINE.lon);
    expect(qibla.bearingDegrees).toBeGreaterThan(107.0);
    expect(qibla.bearingDegrees).toBeLessThan(110.0);
  });

  test('Qibla from Paris points ~119.2°', () => {
    const qibla = QiblaCalculator.calculateQibla(PARIS.lat, PARIS.lon);
    expect(qibla.bearingDegrees).toBeGreaterThan(117.0);
    expect(qibla.bearingDegrees).toBeLessThan(121.0);
    expect(qibla.distanceKm).toBeGreaterThan(4400);
    expect(qibla.distanceKm).toBeLessThan(4600);
  });

  test('Qibla at Mecca itself returns 0 distance', () => {
    const qibla = QiblaCalculator.calculateQibla(MECCA.lat, MECCA.lon);
    expect(qibla.distanceKm).toBe(0);
  });

  test('Cross-verification: Athar Qibla vs AdhanAdapter Qibla', () => {
    const atharAlgiers = QiblaCalculator.calculateQibla(ALGIERS.lat, ALGIERS.lon).bearingDegrees;
    const adhanAlgiers = AdhanAdapter.calculateQibla(ALGIERS.lat, ALGIERS.lon);
    expect(atharAlgiers).toBeCloseTo(adhanAlgiers, 1);

    const atharParis = QiblaCalculator.calculateQibla(PARIS.lat, PARIS.lon).bearingDegrees;
    const adhanParis = AdhanAdapter.calculateQibla(PARIS.lat, PARIS.lon);
    expect(atharParis).toBeCloseTo(adhanParis, 1);
  });
});

describe('3. Asr Shadow Factor: Maliki (s = 1) vs Hanafi (s = 2)', () => {
  const ALGIERS = { lat: 36.7538, lon: 3.0588 };
  const testDate = new Date('2026-10-22T12:00:00+01:00');

  test('Maliki single-shadow Asr strictly precedes Hanafi double-shadow Asr', () => {
    const malikiTimes = PrayerTimeCalculator.calculate(testDate, ALGIERS.lat, ALGIERS.lon, {
      school: JuristicSchool.MALIKI_SHAFI_HANBALI,
    });

    const hanafiTimes = PrayerTimeCalculator.calculate(testDate, ALGIERS.lat, ALGIERS.lon, {
      school: JuristicSchool.HANAFI,
    });

    // Hanafi Asr occurs strictly after Maliki Asr
    const diffMinutes =
      (hanafiTimes.asr.getTime() - malikiTimes.asr.getTime()) / (1000 * 60);

    expect(diffMinutes).toBeGreaterThan(30); // Typically 40-60 minutes later
    expect(malikiTimes.asr.getTime()).toBeLessThan(hanafiTimes.asr.getTime());
  });
});

describe('4. Algerian Ministry Standards (18.0° / 17.0°)', () => {
  const ALGIERS = { lat: 36.7538, lon: 3.0588 };
  const testDate = new Date('2026-10-22T00:00:00+01:00');

  test('Chronological ordering of all daily prayers is strictly maintained', () => {
    const times = PrayerTimeCalculator.calculate(testDate, ALGIERS.lat, ALGIERS.lon, {
      method: CALCULATION_METHODS.ALGERIA,
      school: JuristicSchool.MALIKI_SHAFI_HANBALI,
    });

    expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
    expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
    expect(times.dhuhr.getTime()).toBeLessThan(times.asr.getTime());
    expect(times.asr.getTime()).toBeLessThan(times.maghrib.getTime());
    expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
  });

  test('Cross-verification: First-Principles vs AdhanAdapter for Algiers', () => {
    const firstPrinciples = PrayerTimeCalculator.calculate(
      testDate,
      ALGIERS.lat,
      ALGIERS.lon,
      {
        method: CALCULATION_METHODS.ALGERIA,
        school: JuristicSchool.MALIKI_SHAFI_HANBALI,
      }
    );

    const adhanTimes = AdhanAdapter.calculate(
      testDate,
      ALGIERS.lat,
      ALGIERS.lon,
      JuristicSchool.MALIKI_SHAFI_HANBALI
    );

    // Both should match within <= 1 minute (due to slight rounding or delta-T in solar libraries)
    const maxDiffMinutes = (d1: Date, d2: Date) =>
      Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60);

    expect(maxDiffMinutes(firstPrinciples.fajr, adhanTimes.fajr)).toBeLessThanOrEqual(1.5);
    expect(maxDiffMinutes(firstPrinciples.sunrise, adhanTimes.sunrise)).toBeLessThanOrEqual(1.5);
    expect(maxDiffMinutes(firstPrinciples.dhuhr, adhanTimes.dhuhr)).toBeLessThanOrEqual(1.5);
    expect(maxDiffMinutes(firstPrinciples.asr, adhanTimes.asr)).toBeLessThanOrEqual(1.5);
    expect(maxDiffMinutes(firstPrinciples.maghrib, adhanTimes.maghrib)).toBeLessThanOrEqual(1.5);
    expect(maxDiffMinutes(firstPrinciples.isha, adhanTimes.isha)).toBeLessThanOrEqual(1.5);
  });
});

describe('5. Night Subdivisions & Last Third (ثلث الليل الأخير for Tahajjud)', () => {
  const ALGIERS = { lat: 36.7538, lon: 3.0588 };
  const testDate = new Date('2026-10-22T00:00:00+01:00');

  test('Islamic Midnight and Last Third are mathematically accurate', () => {
    const times = PrayerTimeCalculator.calculate(testDate, ALGIERS.lat, ALGIERS.lon);

    // Midnight is strictly after Maghrib and Isha
    expect(times.midnight.getTime()).toBeGreaterThan(times.isha.getTime());

    // First Third is between Maghrib and Midnight
    expect(times.firstThirdOfTheNight.getTime()).toBeGreaterThan(times.maghrib.getTime());
    expect(times.firstThirdOfTheNight.getTime()).toBeLessThan(times.midnight.getTime());

    // Last Third is strictly after Midnight
    expect(times.lastThirdOfTheNight.getTime()).toBeGreaterThan(times.midnight.getTime());

    // Night duration checks
    // Midnight should be halfway between Maghrib and the point where Last Third is 2/3
    const maghribTime = times.maghrib.getTime();
    const midnightTime = times.midnight.getTime();
    const lastThirdTime = times.lastThirdOfTheNight.getTime();

    const halfNightMs = midnightTime - maghribTime;
    const twoThirdsNightMs = lastThirdTime - maghribTime;

    // Check ratio: twoThirds / half should be (2/3) / (1/2) = 4/3 ~ 1.3333
    expect(twoThirdsNightMs / halfNightMs).toBeCloseTo(4.0 / 3.0, 2);
  });
});

describe('6. Multi-City Validation: Oran, Constantine, Mecca, and Paris', () => {
  const testDate = new Date('2026-10-22T00:00:00Z');

  test('Oran calculation produces realistic prayer times', () => {
    const times = AtharAstronomicalSuite.getPrayerTimes(testDate, 35.6987, -0.6349);
    expect(times.fajr).toBeInstanceOf(Date);
    expect(times.dhuhr).toBeInstanceOf(Date);
    expect(times.maghrib).toBeInstanceOf(Date);
  });

  test('Constantine calculation produces realistic prayer times', () => {
    const times = AtharAstronomicalSuite.getPrayerTimes(testDate, 36.365, 6.6147);
    expect(times.fajr).toBeInstanceOf(Date);
    // In Algeria, Constantine is East of Algiers, so prayer times must precede Algiers!
    const algiersTimes = AtharAstronomicalSuite.getPrayerTimes(testDate, 36.7538, 3.0588);
    expect(times.dhuhr.getTime()).toBeLessThan(algiersTimes.dhuhr.getTime());
    expect(times.maghrib.getTime()).toBeLessThan(algiersTimes.maghrib.getTime());
  });

  test('Mecca calculation with Umm Al-Qura produces Isha 90 minutes after Maghrib', () => {
    const times = AtharAstronomicalSuite.getPrayerTimes(testDate, 21.4225, 39.8262, {
      method: CALCULATION_METHODS.UMM_AL_QURA,
    });
    const diffMinutes = (times.isha.getTime() - times.maghrib.getTime()) / (1000 * 60);
    expect(diffMinutes).toBeCloseTo(90.0, 1);
  });

  test('Paris calculation with France UOIF (12.0°)', () => {
    const times = AtharAstronomicalSuite.getPrayerTimes(testDate, 48.8566, 2.3522, {
      method: CALCULATION_METHODS.FRANCE_UOIF,
    });
    expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
    expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
  });
});

describe('7. Current Prayer State & Arc of the Day Progression', () => {
  const ALGIERS = { lat: 36.7538, lon: 3.0588 };
  const testDate = new Date('2026-10-22T00:00:00+01:00');
  const times = PrayerTimeCalculator.calculate(testDate, ALGIERS.lat, ALGIERS.lon);

  test('Identifies Dhuhr interval when simulated at Dhuhr + 30 min', () => {
    const simulatedNow = new Date(times.dhuhr.getTime() + 30 * 60 * 1000);
    const state = PrayerTimeCalculator.getCurrentPrayerState(times, simulatedNow);

    expect(state.currentPrayer).toBe(Prayer.DHUHR);
    expect(state.nextPrayer).toBe(Prayer.ASR);
    expect(state.remainingMs).toBeGreaterThan(0);
    expect(state.intervalProgress).toBeGreaterThan(0.0);
    expect(state.intervalProgress).toBeLessThan(1.0);
  });

  test('Countdown format returns valid string', () => {
    const formatted = AtharAstronomicalSuite.formatCountdown(3665000); // 1h 1m 5s
    expect(formatted).toBe('01:01:05');
  });
});
