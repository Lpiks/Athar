/**
 * Athar (أَثَر) Sovereign Local Quran Voice Alignment & Recorder Engine
 *
 * Implements 100% offline, on-device audio recording and Arabic phoneme/word
 * alignment against the Holy Quran without any external servers or APIs.
 */

import { normalizeArabicForSearch } from '../database/normalizer';
import { MistakeVaultService } from '../memorization/mistakeVault';
import { AyahView } from '../database/types';

export type WordMatchStatus = 'MATCHED' | 'MISSING' | 'MISMATCHED';

export interface AlignedWordResult {
  readonly originalWord: string;
  readonly cleanWord: string;
  readonly status: WordMatchStatus;
  readonly spokenAlternative?: string;
}

export interface VoiceEvaluationResult {
  readonly accuracyScore: number; // 0 - 100%
  readonly isFullyCorrect: boolean;
  readonly totalWords: number;
  readonly matchedWordsCount: number;
  readonly missingWordsCount: number;
  readonly mismatchedWordsCount: number;
  readonly wordResults: AlignedWordResult[];
  readonly feedbackMessageAr: string;
}

export class QuranVoiceEngine {
  private static instance: QuranVoiceEngine | null = null;
  private isRecording: boolean = false;

  private constructor() {}

  public static getInstance(): QuranVoiceEngine {
    if (!QuranVoiceEngine.instance) {
      QuranVoiceEngine.instance = new QuranVoiceEngine();
    }
    return QuranVoiceEngine.instance;
  }

  /**
   * Safely checks if the native audio recording module is linked in the running APK.
   * Prevents runtime crashes on older APK builds that haven't compiled expo-audio yet.
   */
  public isNativeAudioAvailable(): boolean {
    try {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mod = requireOptionalNativeModule('ExpoAudio');
      return mod !== null && mod !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Request microphone recording permission safely
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    if (!this.isNativeAudioAvailable()) {
      return false;
    }

    try {
      const { AudioModule } = require('expo-audio');
      const response = await AudioModule.requestRecordingPermissionsAsync();
      return response.granted === true;
    } catch {
      return false;
    }
  }

  /**
   * 100% Offline Local Word Alignment & Mistake Recognition Algorithm
   * Compares the words recited by the user against the sacred Quran Ayah text.
   */
  public evaluateRecitation(
    spokenText: string,
    targetAyah: AyahView
  ): VoiceEvaluationResult {
    const vault = MistakeVaultService.getInstance();

    const targetWords = targetAyah.text.trim().split(/\s+/);
    const spokenTokens = spokenText.trim().split(/\s+/).map(normalizeArabicForSearch);

    const wordResults: AlignedWordResult[] = [];
    let matchedCount = 0;
    let missingCount = 0;
    let mismatchedCount = 0;

    let spokenPointer = 0;

    for (let i = 0; i < targetWords.length; i++) {
      const origWord = targetWords[i];
      const cleanTarget = normalizeArabicForSearch(origWord);

      if (spokenPointer >= spokenTokens.length) {
        // Reciter stopped early or skipped remaining words
        wordResults.push({
          originalWord: origWord,
          cleanWord: cleanTarget,
          status: 'MISSING',
        });
        missingCount++;
        vault.flagMistake(targetAyah.surah_id, targetAyah.ayah_number, targetAyah.page_number, origWord, 'memory', 'كلمة منسية / ناقصة');
        continue;
      }

      const currentSpoken = spokenTokens[spokenPointer];

      if (currentSpoken === cleanTarget) {
        // Direct exact root match
        wordResults.push({
          originalWord: origWord,
          cleanWord: cleanTarget,
          status: 'MATCHED',
        });
        matchedCount++;
        spokenPointer++;
      } else {
        // Lookahead 1 word to detect if reciter skipped a word or added an extra one
        const nextTarget = targetWords[i + 1] ? normalizeArabicForSearch(targetWords[i + 1]) : null;
        const nextSpoken = spokenTokens[spokenPointer + 1] || null;

        if (nextSpoken === cleanTarget) {
          // Extra word was spoken before this one
          spokenPointer += 2;
          wordResults.push({
            originalWord: origWord,
            cleanWord: cleanTarget,
            status: 'MATCHED',
          });
          matchedCount++;
        } else if (nextTarget === currentSpoken) {
          // Reciter skipped this word and jumped to the next
          wordResults.push({
            originalWord: origWord,
            cleanWord: cleanTarget,
            status: 'MISSING',
          });
          missingCount++;
          vault.flagMistake(targetAyah.surah_id, targetAyah.ayah_number, targetAyah.page_number, origWord, 'memory', 'كلمة سقطت أثناء التسميع');
        } else {
          // Word was substituted/mispronounced
          wordResults.push({
            originalWord: origWord,
            cleanWord: cleanTarget,
            status: 'MISMATCHED',
            spokenAlternative: currentSpoken,
          });
          mismatchedCount++;
          spokenPointer++;
          vault.flagMistake(targetAyah.surah_id, targetAyah.ayah_number, targetAyah.page_number, origWord, 'memory', `تغيير اللفظ: ${currentSpoken}`);
        }
      }
    }

    const total = targetWords.length;
    const accuracy = Math.round((matchedCount / total) * 100);
    const isFullyCorrect = accuracy === 100 && missingCount === 0 && mismatchedCount === 0;

    let feedback = '';
    if (isFullyCorrect) {
      feedback = 'ما شاء الله تبارك الله! تسميع متقن ١٠٠٪ بدون أي خطأ أو نسيان ✓';
    } else if (accuracy >= 80) {
      feedback = `تسميع ممتاز (${accuracy}٪ إتقان)، انتبه للمواضع الملونة بالأحمر للمراجعة ⚡`;
    } else {
      feedback = `تحتاج الآية إلى مزيد من التثبيت والتكرار (${accuracy}٪ إتقان)، تم تسجيل الأخطاء لمراجعتها 🚩`;
    }

    return {
      accuracyScore: accuracy,
      isFullyCorrect,
      totalWords: total,
      matchedWordsCount: matchedCount,
      missingWordsCount: missingCount,
      mismatchedWordsCount: mismatchedCount,
      wordResults,
      feedbackMessageAr: feedback,
    };
  }
}
