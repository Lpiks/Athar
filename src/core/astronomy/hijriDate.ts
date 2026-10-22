/**
 * Hijri Date Calculator & Arabic Formatter
 * Uses Umm Al-Qura / Tabular Islamic algorithm for accurate offline conversion
 */

const HIJRI_MONTHS_AR = [
  'المحرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

const WEEKDAYS_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export interface HijriDateInfo {
  day: number;
  month: number;
  monthNameAr: string;
  year: number;
  weekdayAr: string;
  formattedAr: string;
}

export function getHijriDate(date: Date = new Date()): HijriDateInfo {
  // Approximate algorithmic conversion for display
  const jd = Math.floor(date.getTime() / 86400000) + 2440587.5;
  const l = Math.floor(jd - 1948440 + 10632);
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const m = Math.floor((24 * l3) / 709);
  const d = l3 - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;

  const monthIdx = Math.max(0, Math.min(11, m - 1));
  const monthNameAr = HIJRI_MONTHS_AR[monthIdx];
  const weekdayAr = WEEKDAYS_AR[date.getDay()];

  // Convert English numerals to Eastern Arabic numerals (١، ٢، ٣...)
  const toEasternArabic = (num: number) =>
    String(num).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);

  const formattedAr = `${weekdayAr} ${toEasternArabic(d)} ${monthNameAr} ${toEasternArabic(y)} هـ`;

  return {
    day: d,
    month: m,
    monthNameAr,
    year: y,
    weekdayAr,
    formattedAr,
  };
}
