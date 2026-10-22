/**
 * Athar (أَثَر) Sovereign Mistake Vault & Hifdh Quiz Engine (سجل الأخطاء ومواضع التعثر)
 *
 * Tracks user-flagged memory and Tajweed errors during self-testing,
 * enabling targeted revision on tricky passages and Mutashabihat.
 */

import { AyahView, Riwaya } from '../database/types';
import { SURAHS_CATALOG } from '../database/data/surahsData';
import { detectWordTajweedRules, TAJWEED_RULES_CATALOG, TajweedRuleType } from './tajweed';

export interface FlaggedMistake {
  readonly id: string;
  readonly surah_id: number;
  readonly surah_name_ar: string;
  readonly ayah_number: number;
  readonly page_number: number;
  readonly word_text: string;
  readonly mistake_type: 'memory' | 'tajweed' | 'tashkeel';
  readonly note?: string;
  readonly timestamp: number;
  review_count: number;
}

export interface NextAyahQuizQuestion {
  readonly surah_name_ar: string;
  readonly current_ayah_number: number;
  readonly current_ayah_text: string;
  readonly correct_next_ayah_number: number;
  readonly correct_next_ayah_text: string;
  readonly options: string[]; // 3 choices: 1 correct, 2 distractors
  readonly tajweed_hint?: string;
}

export class MistakeVaultService {
  private static instance: MistakeVaultService | null = null;
  private mistakesMap: Map<string, FlaggedMistake> = new Map();

  private constructor() {
    // Seed with empty initial state
  }

  public static getInstance(): MistakeVaultService {
    if (!MistakeVaultService.instance) {
      MistakeVaultService.instance = new MistakeVaultService();
    }
    return MistakeVaultService.instance;
  }

  private makeKey(surahId: number, ayahNumber: number, wordText: string): string {
    return `${surahId}_${ayahNumber}_${wordText.trim()}`;
  }

  /**
   * Flag an error or weak spot during self-memorization
   */
  public flagMistake(
    surahId: number,
    ayahNumber: number,
    pageNumber: number,
    wordText: string,
    mistakeType: 'memory' | 'tajweed' | 'tashkeel' = 'memory',
    note?: string
  ): FlaggedMistake {
    const key = this.makeKey(surahId, ayahNumber, wordText);
    const surahName = SURAHS_CATALOG.find((s) => s.id === surahId)?.name_ar || 'سورة';

    const existing = this.mistakesMap.get(key);
    if (existing) {
      existing.review_count += 1;
      return existing;
    }

    const newMistake: FlaggedMistake = {
      id: key,
      surah_id: surahId,
      surah_name_ar: surahName,
      ayah_number: ayahNumber,
      page_number: pageNumber,
      word_text: wordText.trim(),
      mistake_type: mistakeType,
      note,
      timestamp: Date.now(),
      review_count: 1,
    };

    this.mistakesMap.set(key, newMistake);
    return newMistake;
  }

  /**
   * Unflag/remove a mastered mistake
   */
  public removeMistake(surahId: number, ayahNumber: number, wordText: string): boolean {
    const key = this.makeKey(surahId, ayahNumber, wordText);
    return this.mistakesMap.delete(key);
  }

  /**
   * Check if a specific word/ayah is tagged as a mistake
   */
  public isFlagged(surahId: number, ayahNumber: number, wordText: string): boolean {
    const key = this.makeKey(surahId, ayahNumber, wordText);
    return this.mistakesMap.has(key);
  }

  /**
   * Get all flagged mistakes for a specific Medina Mushaf page
   */
  public getMistakesForPage(pageNumber: number): FlaggedMistake[] {
    const result: FlaggedMistake[] = [];
    for (const mistake of this.mistakesMap.values()) {
      if (mistake.page_number === pageNumber) {
        result.push(mistake);
      }
    }
    return result;
  }

  /**
   * Get all flagged mistakes across the entire Quran
   */
  public getAllMistakes(): FlaggedMistake[] {
    return Array.from(this.mistakesMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Total count of active mistakes
   */
  public getTotalCount(): number {
    return this.mistakesMap.size;
  }

  /**
   * Generate an Ayah Linking Quiz Question from a list of Ayahs on a page
   */
  public generateNextAyahQuiz(
    pageAyahs: AyahView[],
    allQuranAyahs: AyahView[]
  ): NextAyahQuizQuestion | null {
    if (pageAyahs.length < 2) return null;

    // Pick a random ayah that is not the last one on page
    const sourceIdx = Math.floor(Math.random() * (pageAyahs.length - 1));
    const current = pageAyahs[sourceIdx];
    const correctNext = pageAyahs[sourceIdx + 1];

    // Pick 2 distractors from other ayahs in Quran
    const distractors: string[] = [];
    let attempts = 0;
    while (distractors.length < 2 && attempts < 20) {
      attempts++;
      const randIdx = Math.floor(Math.random() * allQuranAyahs.length);
      const cand = allQuranAyahs[randIdx];
      if (
        cand.id !== correctNext.id &&
        cand.id !== current.id &&
        !distractors.includes(cand.text)
      ) {
        distractors.push(cand.text);
      }
    }

    // Fallback distractors if list is short
    if (distractors.length < 2) {
      distractors.push('إِنَّ اللَّهَ غَفُورٌ رَّحِيمٌ');
      distractors.push('وَاللَّهُ عَلِيمٌ حَكِيمٌ');
    }

    // Shuffle options
    const options = [correctNext.text, distractors[0], distractors[1]].sort(
      () => Math.random() - 0.5
    );

    const surahName = SURAHS_CATALOG.find((s) => s.id === current.surah_id)?.name_ar || 'سورة';

    return {
      surah_name_ar: surahName,
      current_ayah_number: current.ayah_number,
      current_ayah_text: current.text,
      correct_next_ayah_number: correctNext.ayah_number,
      correct_next_ayah_text: correctNext.text,
      options,
    };
  }
}
