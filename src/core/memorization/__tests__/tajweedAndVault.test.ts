import {
  detectWordTajweedRules,
  getWordTajweedColor,
  TAJWEED_COLORS,
} from '../tajweed';
import { MistakeVaultService } from '../mistakeVault';
import { AyahView } from '../../database/types';

describe('Tajweed & Hifdh Engine Suite', () => {
  describe('Tajweed Rule Detection', () => {
    it('detects Qalqalah on letters of قطب جد with sukoon or at end of word', () => {
      const rules1 = detectWordTajweedRules('يَلِدْ');
      expect(rules1).toContain('QALQALAH_SUGHRA');

      const rules2 = detectWordTajweedRules('الْفَلَقِ');
      expect(rules2).toContain('QALQALAH_KUBRA');
    });

    it('detects Ghunnah Mushaddadah on Nun and Meem with Shaddah', () => {
      const rules = detectWordTajweedRules('إِنَّ');
      expect(rules).toContain('GHUNNAH_MUSHADDADAH');
      expect(getWordTajweedColor(rules)).toBe(TAJWEED_COLORS.GHUNNAH);
    });

    it('detects Iqlab with small meem mark', () => {
      const rules = detectWordTajweedRules('مِنۢ');
      expect(rules).toContain('IQLAB');
    });

    it('detects Taghleez Lam in Warsh recitation', () => {
      const rules = detectWordTajweedRules('الصَّلَاةَ', '', 'WARSH');
      expect(rules).toContain('TAGHLEEZ_LAM_WARSH');
    });

    it('detects Ikhfa Haqiqi when followed by an Ikhfa letter', () => {
      const rules = detectWordTajweedRules('مِنْ', 'قَبْلِ');
      expect(rules).toContain('IKHFA_HAQIQI');
    });
  });

  describe('Mistake Vault & Hifdh Tracker', () => {
    const vault = MistakeVaultService.getInstance();

    beforeEach(() => {
      vault.removeMistake(1, 2, 'الرَّحْمَٰنِ');
    });

    it('flags a weak spot/mistake and retrieves it by page', () => {
      expect(vault.isFlagged(1, 2, 'الرَّحْمَٰنِ')).toBe(false);

      vault.flagMistake(1, 2, 1, 'الرَّحْمَٰنِ', 'tajweed', 'غنة مفقودة');
      expect(vault.isFlagged(1, 2, 'الرَّحْمَٰنِ')).toBe(true);

      const pageMistakes = vault.getMistakesForPage(1);
      expect(pageMistakes.some((m) => m.word_text === 'الرَّحْمَٰنِ')).toBe(true);

      vault.removeMistake(1, 2, 'الرَّحْمَٰنِ');
      expect(vault.isFlagged(1, 2, 'الرَّحْمَٰنِ')).toBe(false);
    });

    it('generates next ayah quiz challenge from page ayahs', () => {
      const mockAyahs: AyahView[] = [
        {
          id: 1,
          surah_id: 1,
          ayah_number: 1,
          juz_number: 1,
          hizb_number: 1,
          rub_number: 1,
          page_number: 1,
          text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          riwaya: 'HAFS',
          tafsir_muyassar: '',
          tafsir_saadi: '',
        },
        {
          id: 2,
          surah_id: 1,
          ayah_number: 2,
          juz_number: 1,
          hizb_number: 1,
          rub_number: 1,
          page_number: 1,
          text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
          riwaya: 'HAFS',
          tafsir_muyassar: '',
          tafsir_saadi: '',
        },
      ];

      const question = vault.generateNextAyahQuiz(mockAyahs, mockAyahs);
      expect(question).not.toBeNull();
      expect(question?.current_ayah_text).toBe('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
      expect(question?.correct_next_ayah_text).toBe('الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ');
      expect(question?.options).toContain('الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ');
    });
  });
});
