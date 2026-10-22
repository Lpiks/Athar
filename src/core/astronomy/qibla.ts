/**
 * Athar (أَثَر) Qibla Direction & Geodesic Navigation Engine
 *
 * Implements great-circle spherical geodesy pointing precisely
 * to the Kaaba in Mecca Al-Mukarramah (21.4225° N, 39.8262° E).
 *
 * All formulas use double-precision trigonometric functions.
 */

import { CelestialMath } from './celestial';

export interface QiblaResult {
  /** Observer latitude */
  readonly latitude: number;
  /** Observer longitude */
  readonly longitude: number;
  /** Bearing in degrees clockwise from True North [0, 360) */
  readonly bearingDegrees: number;
  /** Great-circle geodesic distance to Kaaba in kilometers */
  readonly distanceKm: number;
  /** Compass quadrant / 16-point compass label (e.g. "ENE", "SE") */
  readonly cardinalDirection: string;
}

export class QiblaCalculator {
  /**
   * Geographic coordinates of the Holy Kaaba in Mecca, Saudi Arabia
   * Latitude: 21° 25' 21.0" N (21.4224779°)
   * Longitude: 39° 49' 34.3" E (39.8261818°)
   */
  public static readonly MECCA_LATITUDE = 21.4224779;
  public static readonly MECCA_LONGITUDE = 39.8261818;

  private static readonly CARDINAL_POINTS = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];

  /**
   * Calculate exact Qibla bearing and geodesic distance from any location on Earth.
   *
   * Spherical forward azimuth formula:
   * θ = atan2(sin(Δλ), cos(φ1) * tan(φ2) - sin(φ1) * cos(Δλ))
   *
   * @param latitude Observer latitude in decimal degrees (-90 to +90)
   * @param longitude Observer longitude in decimal degrees (-180 to +180)
   * @returns Complete Qibla calculation results
   */
  public static calculateQibla(latitude: number, longitude: number): QiblaResult {
    // If the observer is at the Kaaba itself
    if (
      Math.abs(latitude - this.MECCA_LATITUDE) < 0.0001 &&
      Math.abs(longitude - this.MECCA_LONGITUDE) < 0.0001
    ) {
      return {
        latitude,
        longitude,
        bearingDegrees: 0,
        distanceKm: 0,
        cardinalDirection: 'N',
      };
    }

    const phi1 = CelestialMath.degToRad(latitude);
    const phi2 = CelestialMath.degToRad(this.MECCA_LATITUDE);
    const deltaLambda = CelestialMath.degToRad(this.MECCA_LONGITUDE - longitude);

    // Forward azimuth (bearing)
    const y = Math.sin(deltaLambda);
    const x =
      Math.cos(phi1) * Math.tan(phi2) -
      Math.sin(phi1) * Math.cos(deltaLambda);

    const bearingRad = Math.atan2(y, x);
    const bearingDeg = CelestialMath.normalizeAngle(CelestialMath.radToDeg(bearingRad));

    // Great-circle geodesic distance using Haversine formula
    const deltaPhi = CelestialMath.degToRad(this.MECCA_LATITUDE - latitude);
    const sinHalfDeltaPhi = Math.sin(deltaPhi / 2.0);
    const sinHalfDeltaLambda = Math.sin(deltaLambda / 2.0);

    const a =
      sinHalfDeltaPhi * sinHalfDeltaPhi +
      Math.cos(phi1) * Math.cos(phi2) * sinHalfDeltaLambda * sinHalfDeltaLambda;

    const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1.0 - a)));
    const distanceKm = CelestialMath.EARTH_RADIUS_KM * c;

    // Determine cardinal compass heading
    const index = Math.round(bearingDeg / 22.5) % 16;
    const cardinalDirection = this.CARDINAL_POINTS[index];

    return {
      latitude,
      longitude,
      bearingDegrees: Number(bearingDeg.toFixed(4)),
      distanceKm: Number(distanceKm.toFixed(2)),
      cardinalDirection,
    };
  }

  /**
   * Determine the compass deflection relative to a device's current heading.
   *
   * @param qiblaBearing Qibla bearing from True North in degrees [0, 360)
   * @param compassHeading Device compass heading from True North in degrees [0, 360)
   * @returns Signed deflection angle in degrees (-180 to +180).
   *          0 means the device is pointing directly towards the Kaaba.
   *          Positive means turn right, negative means turn left.
   */
  public static calculateDeflection(
    qiblaBearing: number,
    compassHeading: number
  ): number {
    let diff = (qiblaBearing - compassHeading) % 360.0;
    if (diff > 180.0) {
      diff -= 360.0;
    } else if (diff < -180.0) {
      diff += 360.0;
    }
    return Number(diff.toFixed(2));
  }
}
