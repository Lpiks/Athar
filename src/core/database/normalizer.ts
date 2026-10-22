/**
 * Athar (أَثَر) Arabic Text Normalizer for SQLite FTS5 Search
 *
 * Implements deterministic typo-tolerant normalization:
 * - Strips all Tashkeel/Harakat (Fatha, Damma, Kasra, Tanwin, Sukun, Shadda)
 * - Expands Quranic dagger alif (\u0670) to regular Alef (\u0627)
 * - Normalizes Alef variants ([إأآٱ] -> ا)
 * - Normalizes Alef Maqsura (ى -> ي)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Hamza variants ([ؤئ] -> ء)
 * - Strips Quranic recitation/pause marks and Tatweel/Kashida (\u0640)
 */

const DIACRITICS_REGEX = /[\u0617-\u061A\u064B-\u0652\u06D6-\u06ED\u0640]/g;
const ALEF_REGEX = /[إأآٱ]/g;
const HAMZA_REGEX = /[ؤئ]/g;

export function normalizeArabicForSearch(input: string): string {
  if (!input) return '';

  let text = input;

  // 1. Expand superscript dagger alif to regular Alef
  text = text.replace(/\u0670/g, 'ا');

  // 2. Strip diacritics, recitation marks, tatweel
  text = text.replace(DIACRITICS_REGEX, '');

  // 3. Normalize Alef variants
  text = text.replace(ALEF_REGEX, 'ا');

  // 4. Normalize common spelling variants
  text = text.replace(/الرحمان/g, 'الرحمن');
  text = text.replace(/هاذا/g, 'هذا');
  text = text.replace(/هاؤلاء/g, 'هؤلاء');
  text = text.replace(/لاكن/g, 'لكن');

  // 5. Normalize Yaa / Alef Maqsura and Taa Marbuta
  text = text.replace(/ى/g, 'ي');
  text = text.replace(/ة/g, 'ه');

  // 6. Normalize Hamza variants
  text = text.replace(HAMZA_REGEX, 'ء');

  // 7. Collapse whitespace
  return text.replace(/\s+/g, ' ').trim();
}
