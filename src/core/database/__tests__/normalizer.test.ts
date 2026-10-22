/**
 * Athar (أَثَر) Quran Search Normalizer Tests
 */

import { normalizeArabicForSearch } from '../normalizer';

describe('Quran Arabic Normalizer for FTS5', () => {
  test('strips standard tashkeel/diacritics', () => {
    const raw = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
    const normalized = normalizeArabicForSearch(raw);
    expect(normalized).toBe('بسم الله الرحمن الرحيم');
  });

  test('expands dagger alif in Al-Samawat', () => {
    const raw = 'ٱلسَّمَٰوَٰتِ';
    const normalized = normalizeArabicForSearch(raw);
    expect(normalized).toBe('السماوات');
  });

  test('normalizes Alef variants to bare Alef', () => {
    expect(normalizeArabicForSearch('إِنَّا أَنزَلْنَاهُ')).toBe('انا انزلناه');
    expect(normalizeArabicForSearch('آمن')).toBe('امن');
    expect(normalizeArabicForSearch('ٱلْحَمْدُ')).toBe('الحمد');
  });

  test('normalizes Alef Maqsura and Taa Marbuta', () => {
    expect(normalizeArabicForSearch('هُدًى لِّلْمُتَّقِينَ')).toBe('هدي للمتقين');
    expect(normalizeArabicForSearch('الْجَنَّةِ')).toBe('الجنه');
  });

  test('normalizes common spelling variants', () => {
    expect(normalizeArabicForSearch('الرحمان')).toBe('الرحمن');
    expect(normalizeArabicForSearch('هاذا')).toBe('هذا');
    expect(normalizeArabicForSearch('لاكن')).toBe('لكن');
  });

  test('handles empty or whitespace strings', () => {
    expect(normalizeArabicForSearch('')).toBe('');
    expect(normalizeArabicForSearch('   ')).toBe('');
  });
});
