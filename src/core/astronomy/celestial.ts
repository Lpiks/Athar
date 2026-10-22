/**
 * Athar (أَثَر) Celestial Astronomy Engine
 * First-Principles Solar Mechanics & Spherical Trigonometry
 *
 * Implements high-precision algorithms based on Jean Meeus ("Astronomical Algorithms")
 * for solar coordinates, Equation of Time (EqT), Solar Declination (δ),
 * Hour Angle (H), and Meridian Transit.
 *
 * 100% Offline, Deterministic, Zero Floating-Point Placeholders.
 */

export interface SolarCoordinates {
  /** Julian Date */
  readonly julianDate: number;
  /** Julian Centuries since J2000.0 */
  readonly julianCenturies: number;
  /** Solar Declination in radians */
  readonly declinationRad: number;
  /** Solar Declination in degrees (-23.44° to +23.44°) */
  readonly declinationDeg: number;
  /** Right Ascension in radians */
  readonly rightAscensionRad: number;
  /** Right Ascension in degrees */
  readonly rightAscensionDeg: number;
  /** Equation of Time in minutes */
  readonly equationOfTimeMinutes: number;
  /** Apparent Solar Longitude in degrees */
  readonly apparentLongitudeDeg: number;
}

export class CelestialMath {
  /** Standard gravitational radius of Earth in km */
  public static readonly EARTH_RADIUS_KM = 6371.0088;

  /** Standard Solar Zenith angles for atmospheric refraction and semi-diameter */
  public static readonly STANDARD_SUNRISE_SUNSET_ALTITUDE_DEG = -0.8333333333; // 50 arcminutes

  /**
   * Convert Degrees to Radians
   */
  public static degToRad(deg: number): number {
    return (deg * Math.PI) / 180.0;
  }

  /**
   * Convert Radians to Degrees
   */
  public static radToDeg(rad: number): number {
    return (rad * 180.0) / Math.PI;
  }

  /**
   * Normalize an angle to [0, 360) degrees
   */
  public static normalizeAngle(deg: number): number {
    let result = deg % 360.0;
    if (result < 0) {
      result += 360.0;
    }
    return result;
  }

  /**
   * Normalize time to [0, 24) hours
   */
  public static normalizeHours(hours: number): number {
    let result = hours % 24.0;
    if (result < 0) {
      result += 24.0;
    }
    return result;
  }

  /**
   * Calculate Julian Date for a Gregorian calendar date and UTC time.
   * Based on Meeus, Astronomical Algorithms Chapter 7.
   */
  public static calculateJulianDate(
    year: number,
    month: number,
    day: number,
    utcHour: number = 12.0
  ): number {
    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }

    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);

    const dayFraction = utcHour / 24.0;
    const jd =
      Math.floor(365.25 * (y + 4716)) +
      Math.floor(30.6001 * (m + 1)) +
      day +
      dayFraction +
      b -
      1524.5;

    return jd;
  }

  /**
   * Calculate Julian Centuries from J2000.0 epoch
   */
  public static julianCenturies(julianDate: number): number {
    return (julianDate - 2451545.0) / 36525.0;
  }

  /**
   * Computes exact solar coordinates: Declination, Right Ascension,
   * Equation of Time (EqT), and Apparent Longitude for a given Julian Date.
   */
  public static computeSolarCoordinates(julianDate: number): SolarCoordinates {
    const T = this.julianCenturies(julianDate);

    // Geometric Mean Longitude of the Sun (degrees)
    const L0 = this.normalizeAngle(280.46646 + 36000.76983 * T + 0.0003032 * T * T);

    // Geometric Mean Anomaly of the Sun (degrees)
    const M_deg = this.normalizeAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const M_rad = this.degToRad(M_deg);

    // Eccentricity of Earth's orbit
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;

    // Sun's Equation of the Center C (degrees)
    const C_deg =
      (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M_rad) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * M_rad) +
      0.000289 * Math.sin(3 * M_rad);

    // Sun's True Longitude (degrees)
    const trueLongitude = this.normalizeAngle(L0 + C_deg);

    // Sun's Apparent Longitude λ corrected for nutation and aberration
    const omega = 125.04 - 1934.136 * T;
    const lambda_deg = this.normalizeAngle(
      trueLongitude - 0.00569 - 0.00478 * Math.sin(this.degToRad(omega))
    );
    const lambda_rad = this.degToRad(lambda_deg);

    // Mean Obliquity of the Ecliptic ε0 (degrees)
    const eps0 =
      23.43929111 -
      0.013004167 * T -
      0.000000164 * T * T +
      0.0000005036 * T * T * T;

    // Corrected Obliquity ε with nutation
    const eps_deg = eps0 + 0.00256 * Math.cos(this.degToRad(omega));
    const eps_rad = this.degToRad(eps_deg);

    // Solar Declination δ
    const sinDelta = Math.sin(eps_rad) * Math.sin(lambda_rad);
    const delta_rad = Math.asin(sinDelta);
    const delta_deg = this.radToDeg(delta_rad);

    // Right Ascension α (radians & degrees)
    const alpha_rad = Math.atan2(
      Math.cos(eps_rad) * Math.sin(lambda_rad),
      Math.cos(lambda_rad)
    );
    const alpha_deg = this.normalizeAngle(this.radToDeg(alpha_rad));

    // Equation of Time (EqT) in minutes
    // EqT = 4 * (L0 - α) [where angles are in degrees, 4 min per degree]
    const y = Math.tan(eps_rad / 2) * Math.tan(eps_rad / 2);
    const L0_rad = this.degToRad(L0);

    const eqtRad =
      y * Math.sin(2 * L0_rad) -
      2 * e * Math.sin(M_rad) +
      4 * e * y * Math.sin(M_rad) * Math.cos(2 * L0_rad) -
      0.5 * y * y * Math.sin(4 * L0_rad) -
      1.25 * e * e * Math.sin(2 * M_rad);

    // 1 radian difference = 4 * 180 / π minutes = 229.183 minutes
    const equationOfTimeMinutes = this.radToDeg(eqtRad) * 4.0;

    return {
      julianDate,
      julianCenturies: T,
      declinationRad: delta_rad,
      declinationDeg: delta_deg,
      rightAscensionRad: alpha_rad,
      rightAscensionDeg: alpha_deg,
      equationOfTimeMinutes,
      apparentLongitudeDeg: lambda_deg,
    };
  }

  /**
   * Calculate Solar Transit (Solar Noon) in local civil decimal hours
   *
   * @param equationOfTimeMinutes Equation of Time in minutes
   * @param longitude Observer longitude in degrees (East positive, West negative)
   * @param timezoneOffsetHours Timezone offset from UTC in hours (e.g., +1 for Algeria)
   * @returns Solar noon time in decimal hours [0, 24)
   */
  public static calculateSolarTransit(
    equationOfTimeMinutes: number,
    longitude: number,
    timezoneOffsetHours: number
  ): number {
    // Noon in UTC: 12.0 - longitude / 15.0 - EqT / 60.0
    const transitUtc = 12.0 - longitude / 15.0 - equationOfTimeMinutes / 60.0;
    const localTransit = transitUtc + timezoneOffsetHours;
    return this.normalizeHours(localTransit);
  }

  /**
   * Calculate Hour Angle (H) in decimal hours for a given target solar altitude angle.
   *
   * cos(H) = (sin(altitude) - sin(latitude) * sin(declination)) / (cos(latitude) * cos(declination))
   *
   * @param latitude Observer latitude in degrees
   * @param declination Solar declination in degrees
   * @param altitude Target solar altitude angle in degrees (e.g. -18° for Fajr)
   * @returns Hour angle in decimal hours, or null if the sun never reaches this altitude (polar day/night)
   */
  public static calculateHourAngle(
    latitude: number,
    declination: number,
    altitude: number
  ): number | null {
    const latRad = this.degToRad(latitude);
    const declRad = this.degToRad(declination);
    const altRad = this.degToRad(altitude);

    const cosH =
      (Math.sin(altRad) - Math.sin(latRad) * Math.sin(declRad)) /
      (Math.cos(latRad) * Math.cos(declRad));

    if (cosH > 1.0 || cosH < -1.0) {
      // The sun never reaches this altitude on this day
      return null;
    }

    const hRad = Math.acos(cosH);
    const hDeg = this.radToDeg(hRad);
    return hDeg / 15.0; // 15 degrees per hour
  }

  /**
   * Calculate solar altitude angle for Asr prayer based on shadow factor.
   *
   * Jurisprudence standard:
   * Shadow length at Asr = Shadow at solar noon (Zawal) + (shadowFactor * object height)
   * Angle: arccot(shadowFactor + tan(|latitude - declination|))
   *
   * @param latitude Observer latitude in degrees
   * @param declination Solar declination in degrees
   * @param shadowFactor 1 for Maliki/Shafi'i/Hanbali, 2 for Hanafi
   * @returns Target altitude in degrees
   */
  public static calculateAsrAltitude(
    latitude: number,
    declination: number,
    shadowFactor: number = 1.0
  ): number {
    const latRad = this.degToRad(latitude);
    const declRad = this.degToRad(declination);
    const deltaAngle = Math.abs(latRad - declRad);

    const cotanAlt = shadowFactor + Math.tan(deltaAngle);
    const altRad = Math.atan(1.0 / cotanAlt);
    return this.radToDeg(altRad);
  }

  /**
   * Atmospheric refraction and elevation correction for sunrise/sunset
   *
   * @param elevationMeters Observer height above sea level in meters
   * @returns Adjusted altitude in degrees
   */
  public static getAdjustedSunriseSunsetAltitude(elevationMeters: number = 0): number {
    // 0.833° standard refraction (34') + solar semi-diameter (16')
    let baseAltitude = this.STANDARD_SUNRISE_SUNSET_ALTITUDE_DEG;
    if (elevationMeters > 0) {
      // Dip of horizon: 0.0347 * sqrt(height in meters) degrees
      const dip = 0.0347 * Math.sqrt(elevationMeters);
      baseAltitude -= dip;
    }
    return baseAltitude;
  }
}
