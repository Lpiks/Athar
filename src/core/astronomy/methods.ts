/**
 * Athar (أَثَر) Calculation Methods & Jurisprudence Configuration
 *
 * Configured specifically for Algerian & Maghrebi heritage (Maliki Fiqh,
 * Algerian Ministry of Religious Affairs 18.0° / 17.0°),
 * with global adaptation for international worshippers.
 */

export enum JuristicSchool {
  /**
   * Maliki / Shafi'i / Hanbali: Single-shadow factor (s = 1).
   * Standard across Algeria, North Africa, and the vast majority of the Islamic world.
   */
  MALIKI_SHAFI_HANBALI = 'MALIKI_SHAFI_HANBALI',

  /**
   * Hanafi: Double-shadow factor (s = 2).
   */
  HANAFI = 'HANAFI',
}

export enum HighLatitudeRule {
  NONE = 'NONE',
  MIDDLE_OF_THE_NIGHT = 'MIDDLE_OF_THE_NIGHT',
  ONE_SEVENTH = 'ONE_SEVENTH',
  ANGLE_BASED = 'ANGLE_BASED',
}

export interface CalculationMethodParameters {
  readonly id: string;
  readonly nameEn: string;
  readonly nameAr: string;
  /** Sun depression angle for Fajr below the horizon in degrees */
  readonly fajrAngle: number;
  /** Sun depression angle for Isha below the horizon in degrees (if intervalMinutes is undefined) */
  readonly ishaAngle?: number;
  /** Fixed minutes after Maghrib for Isha (e.g., 90 min for Umm Al-Qura) */
  readonly ishaIntervalMinutes?: number;
  /** Sun depression angle for Maghrib (standard is 0.833° sunset, or custom e.g. 4.5° for Tehran) */
  readonly maghribAngle?: number;
  /** Default Juristic school for Asr */
  readonly defaultSchool: JuristicSchool;
  /** Safety buffer in minutes added to Dhuhr after exact solar noon */
  readonly dhuhrMinutesBuffer: number;
}

export const CALCULATION_METHODS: Record<string, CalculationMethodParameters> = {
  /**
   * Algerian Ministry of Religious Affairs and Wakfs (وزارة الشؤون الدينية والأوقاف)
   * The sovereign Algerian standard: Fajr 18.0°, Isha 17.0°, Maliki shadow factor (s = 1).
   */
  ALGERIA: {
    id: 'ALGERIA',
    nameEn: 'Algerian Ministry of Religious Affairs',
    nameAr: 'وزارة الشؤون الدينية والأوقاف الجزائرية',
    fajrAngle: 18.0,
    ishaAngle: 17.0,
    defaultSchool: JuristicSchool.MALIKI_SHAFI_HANBALI,
    dhuhrMinutesBuffer: 1.0,
  },

  /**
   * Muslim World League (MWL - رابطة العالم الإسلامي)
   */
  MUSLIM_WORLD_LEAGUE: {
    id: 'MUSLIM_WORLD_LEAGUE',
    nameEn: 'Muslim World League (MWL)',
    nameAr: 'رابطة العالم الإسلامي',
    fajrAngle: 18.0,
    ishaAngle: 17.0,
    defaultSchool: JuristicSchool.MALIKI_SHAFI_HANBALI,
    dhuhrMinutesBuffer: 1.0,
  },

  /**
   * Umm Al-Qura University, Makkah (جامعة أم القرى - مكة المكرمة)
   * Fajr 18.5°, Isha fixed at 90 minutes after Maghrib.
   */
  UMM_AL_QURA: {
    id: 'UMM_AL_QURA',
    nameEn: 'Umm Al-Qura University, Makkah',
    nameAr: 'جامعة أم القرى - مكة المكرمة',
    fajrAngle: 18.5,
    ishaIntervalMinutes: 90.0,
    defaultSchool: JuristicSchool.MALIKI_SHAFI_HANBALI,
    dhuhrMinutesBuffer: 1.0,
  },

  /**
   * Egyptian General Authority of Survey (الهيئة المصرية العامة للمساحة)
   */
  EGYPTIAN: {
    id: 'EGYPTIAN',
    nameEn: 'Egyptian General Authority of Survey',
    nameAr: 'الهيئة المصرية العامة للمساحة',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    defaultSchool: JuristicSchool.MALIKI_SHAFI_HANBALI,
    dhuhrMinutesBuffer: 1.0,
  },

  /**
   * Islamic Society of North America (ISNA)
   */
  ISNA: {
    id: 'ISNA',
    nameEn: 'Islamic Society of North America (ISNA)',
    nameAr: 'الجمعية الإسلامية لأمريكا الشمالية',
    fajrAngle: 15.0,
    ishaAngle: 15.0,
    defaultSchool: JuristicSchool.MALIKI_SHAFI_HANBALI,
    dhuhrMinutesBuffer: 1.0,
  },

  /**
   * Union des Organisations Islamiques de France (UOIF) / Muslims of France (12.0°)
   */
  FRANCE_UOIF: {
    id: 'FRANCE_UOIF',
    nameEn: 'France UOIF (12.0°)',
    nameAr: 'اتحاد المنظمات الإسلامية في فرنسا (12°)',
    fajrAngle: 12.0,
    ishaAngle: 12.0,
    defaultSchool: JuristicSchool.MALIKI_SHAFI_HANBALI,
    dhuhrMinutesBuffer: 1.0,
  },
};

/**
 * Coordinate bounding box detector for automatic method selection via GPS
 */
export function autoDetectMethodByCoordinates(
  latitude: number,
  longitude: number
): CalculationMethodParameters {
  // Algeria bounding box: Lat 18.9°N to 37.2°N, Lon -8.7°W to 12.0°E
  if (
    latitude >= 18.9 &&
    latitude <= 37.2 &&
    longitude >= -8.7 &&
    longitude <= 12.0
  ) {
    return CALCULATION_METHODS.ALGERIA;
  }

  // Arabian Peninsula (Saudi Arabia, UAE, Qatar, Oman, Bahrain, Kuwait, Yemen)
  // Lat 12.0°N to 32.5°N, Lon 34.0°E to 60.0°E
  if (
    latitude >= 12.0 &&
    latitude <= 32.5 &&
    longitude >= 34.0 &&
    longitude <= 60.0
  ) {
    return CALCULATION_METHODS.UMM_AL_QURA;
  }

  // Egypt, Sudan, Levant, North-East Africa
  if (
    latitude >= 3.0 &&
    latitude <= 34.0 &&
    longitude >= 24.0 &&
    longitude <= 36.0
  ) {
    return CALCULATION_METHODS.EGYPTIAN;
  }

  // France and neighboring Western Europe
  if (
    latitude >= 41.0 &&
    latitude <= 51.5 &&
    longitude >= -5.5 &&
    longitude <= 10.0
  ) {
    return CALCULATION_METHODS.FRANCE_UOIF;
  }

  // North America (USA & Canada)
  if (
    latitude >= 24.0 &&
    latitude <= 70.0 &&
    longitude >= -170.0 &&
    longitude <= -50.0
  ) {
    return CALCULATION_METHODS.ISNA;
  }

  // Universal Fallback: Muslim World League
  return CALCULATION_METHODS.MUSLIM_WORLD_LEAGUE;
}
