/**
 * Athar (أَثَر) Sovereign Quran & Tafsir Vault — Type Definitions
 */

export type Riwaya = 'HAFS' | 'WARSH';

export type TafsirType = 'MUYASSAR' | 'SAADI';

export interface Surah {
  readonly id: number;
  readonly name_ar: string;
  readonly name_en: string;
  readonly name_transliteration: string;
  readonly type: 'meccan' | 'medinan';
  readonly total_ayahs: number;
  readonly page_number: number;
}

export interface Ayah {
  readonly id: number;
  readonly surah_id: number;
  readonly ayah_number: number;
  readonly juz_number: number;
  readonly hizb_number: number;
  readonly rub_number: number;
  readonly page_number: number;
  readonly text_hafs: string;
  readonly text_warsh: string;
  readonly text_clean: string;
  readonly tafsir_muyassar: string;
  readonly tafsir_saadi: string;
}

export interface AyahView {
  readonly id: number;
  readonly surah_id: number;
  readonly surah_name_ar?: string;
  readonly ayah_number: number;
  readonly juz_number: number;
  readonly hizb_number: number;
  readonly rub_number: number;
  readonly page_number: number;
  readonly text: string;
  readonly riwaya: Riwaya;
  readonly tafsir_muyassar: string;
  readonly tafsir_saadi: string;
}

export interface SearchMatch {
  readonly id: number;
  readonly surah_id: number;
  readonly surah_name_ar: string;
  readonly ayah_number: number;
  readonly text: string;
  readonly snippet?: string;
}
