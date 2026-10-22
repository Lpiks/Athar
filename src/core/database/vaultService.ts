/**
 * Athar (أَثَر) Sovereign Quran & Tafsir Vault Service
 *
 * Implements high-performance, offline-first SQLite access using expo-sqlite.
 * Features:
 * - WAL journal mode and NORMAL synchronous pragmas for maximum throughput.
 * - Dual Riwaya support (Hafs 'an 'Asim & Warsh 'an Nafi').
 * - Line-by-line Tafsir Al-Muyassar and Tafsir Al-Sa'di.
 * - Sub-millisecond full-text search (< 15ms) via SQLite FTS5 with diacritic stripping.
 */

import * as SQLite from 'expo-sqlite';
import { Ayah, AyahView, Riwaya, SearchMatch, Surah, TafsirType } from './types';
import { normalizeArabicForSearch } from './normalizer';

export class QuranVaultService {
  private static instance: QuranVaultService | null = null;
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  public static readonly DB_NAME = 'athar_vault.db';

  private constructor() {}

  /**
   * Get singleton instance of the Quran Vault Service
   */
  public static getInstance(): QuranVaultService {
    if (!QuranVaultService.instance) {
      QuranVaultService.instance = new QuranVaultService();
    }
    return QuranVaultService.instance;
  }

  /**
   * Initializes the database connection and configures hardened SQLite pragmas.
   * Auto-extracts the pre-packaged 49MB Quran & Tafsir vault asset on mobile if not present.
   */
  public async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      let isReady = false;
      try {
        this.db = await SQLite.openDatabaseAsync(QuranVaultService.DB_NAME);
        const check = await this.db.getFirstAsync<{ count: number }>(
          "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='surahs';"
        );
        if (check && check.count > 0) {
          isReady = true;
        }
      } catch {
        isReady = false;
      }

      if (!isReady) {
        if (this.db) {
          try {
            await this.db.closeAsync();
          } catch {}
          this.db = null;
        }

        const dbAsset = require('../../../assets/databases/athar_vault.db');
        await SQLite.importDatabaseFromAssetAsync(QuranVaultService.DB_NAME, {
          assetId: dbAsset,
          forceOverwrite: true,
        });

        this.db = await SQLite.openDatabaseAsync(QuranVaultService.DB_NAME);
      }

      // Execute performance and concurrency pragmas
      if (this.db) {
        await this.db.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA synchronous = NORMAL;
          PRAGMA cache_size = -64000;
          PRAGMA temp_store = MEMORY;
        `);
      }
    })();

    await this.initPromise;
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Failed to initialize Athar SQLite Quran Vault.');
    }
    return this.db;
  }

  /**
   * Retrieve all 114 Surahs ordered by revelation/mushaf sequence
   */
  public async getSurahs(): Promise<Surah[]> {
    const db = await this.getDb();
    return await db.getAllAsync<Surah>(
      'SELECT id, name_ar, name_en, name_transliteration, type, total_ayahs, page_number FROM surahs ORDER BY id ASC;'
    );
  }

  /**
   * Retrieve metadata for a single Surah
   */
  public async getSurah(surahId: number): Promise<Surah | null> {
    const db = await this.getDb();
    return await db.getFirstAsync<Surah>(
      'SELECT id, name_ar, name_en, name_transliteration, type, total_ayahs, page_number FROM surahs WHERE id = ?;',
      [surahId]
    );
  }

  /**
   * Retrieve all Ayahs for a given Surah with selected Riwaya (Hafs or Warsh)
   */
  public async getAyahsBySurah(
    surahId: number,
    riwaya: Riwaya = 'WARSH'
  ): Promise<AyahView[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<Ayah>(
      `SELECT id, surah_id, ayah_number, juz_number, hizb_number, rub_number, page_number,
              text_hafs, text_warsh, text_clean, tafsir_muyassar, tafsir_saadi
       FROM ayahs
       WHERE surah_id = ?
       ORDER BY ayah_number ASC;`,
      [surahId]
    );

    return rows.map((row) => ({
      id: row.id,
      surah_id: row.surah_id,
      ayah_number: row.ayah_number,
      juz_number: row.juz_number,
      hizb_number: row.hizb_number,
      rub_number: row.rub_number,
      page_number: row.page_number,
      text: riwaya === 'WARSH' ? row.text_warsh : row.text_hafs,
      riwaya,
      tafsir_muyassar: row.tafsir_muyassar,
      tafsir_saadi: row.tafsir_saadi,
    }));
  }

  /**
   * Retrieve a specific Ayah by Surah ID and Ayah Number
   */
  public async getAyah(
    surahId: number,
    ayahNumber: number,
    riwaya: Riwaya = 'WARSH'
  ): Promise<AyahView | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<Ayah>(
      `SELECT id, surah_id, ayah_number, juz_number, hizb_number, rub_number, page_number,
              text_hafs, text_warsh, text_clean, tafsir_muyassar, tafsir_saadi
       FROM ayahs
       WHERE surah_id = ? AND ayah_number = ?;`,
      [surahId, ayahNumber]
    );

    if (!row) return null;

    return {
      id: row.id,
      surah_id: row.surah_id,
      ayah_number: row.ayah_number,
      juz_number: row.juz_number,
      hizb_number: row.hizb_number,
      rub_number: row.rub_number,
      page_number: row.page_number,
      text: riwaya === 'WARSH' ? row.text_warsh : row.text_hafs,
      riwaya,
      tafsir_muyassar: row.tafsir_muyassar,
      tafsir_saadi: row.tafsir_saadi,
    };
  }

  /**
   * Retrieve Ayahs by Juz number (1 to 30)
   */
  public async getAyahsByJuz(
    juzNumber: number,
    riwaya: Riwaya = 'WARSH'
  ): Promise<AyahView[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<Ayah>(
      `SELECT id, surah_id, ayah_number, juz_number, hizb_number, rub_number, page_number,
              text_hafs, text_warsh, text_clean, tafsir_muyassar, tafsir_saadi
       FROM ayahs
       WHERE juz_number = ?
       ORDER BY surah_id ASC, ayah_number ASC;`,
      [juzNumber]
    );

    return rows.map((row) => ({
      id: row.id,
      surah_id: row.surah_id,
      ayah_number: row.ayah_number,
      juz_number: row.juz_number,
      hizb_number: row.hizb_number,
      rub_number: row.rub_number,
      page_number: row.page_number,
      text: riwaya === 'WARSH' ? row.text_warsh : row.text_hafs,
      riwaya,
      tafsir_muyassar: row.tafsir_muyassar,
      tafsir_saadi: row.tafsir_saadi,
    }));
  }

  /**
   * Retrieve line-by-line Tafsir for an Ayah
   */
  public async getTafsir(
    surahId: number,
    ayahNumber: number,
    tafsirType: TafsirType = 'MUYASSAR'
  ): Promise<string> {
    const db = await this.getDb();
    const column = tafsirType === 'SAADI' ? 'tafsir_saadi' : 'tafsir_muyassar';
    const row = await db.getFirstAsync<{ tafsir: string }>(
      `SELECT ${column} AS tafsir FROM ayahs WHERE surah_id = ? AND ayah_number = ?;`,
      [surahId, ayahNumber]
    );
    return row?.tafsir ?? '';
  }

  /**
   * Instant SQLite FTS5 Full-Text Search (< 15ms target)
   *
   * @param query User search query (with or without diacritics/tashkeel)
   * @param riwaya Selected reading text to display in results
   * @param limit Maximum results (default: 50)
   */
  public async search(
    query: string,
    riwaya: Riwaya = 'WARSH',
    limit: number = 50
  ): Promise<SearchMatch[]> {
    const db = await this.getDb();
    const normalized = normalizeArabicForSearch(query);
    if (!normalized) return [];

    // FTS5 phrase or prefix query
    const ftsTerm = `"${normalized}"*`;
    const textColumn = riwaya === 'WARSH' ? 'a.text_warsh' : 'a.text_hafs';

    const sql = `
      SELECT a.id, a.surah_id, s.name_ar AS surah_name_ar, a.ayah_number, ${textColumn} AS text,
             snippet(ayahs_fts, 2, '<mark>', '</mark>', '...', 15) AS snippet
      FROM ayahs_fts f
      JOIN ayahs a ON f.rowid = a.id
      JOIN surahs s ON a.surah_id = s.id
      WHERE ayahs_fts MATCH ?
      ORDER BY a.surah_id ASC, a.ayah_number ASC
      LIMIT ?;
    `;

    return await db.getAllAsync<SearchMatch>(sql, [ftsTerm, limit]);
  }

  /**
   * Verify Vault statistics (114 Surahs, 6,236 Ayahs, Dual Riwaya, Dual Tafsir)
   */
  public async getStats(): Promise<{
    totalSurahs: number;
    totalAyahs: number;
    hafsAyahs: number;
    warshAyahs: number;
    muyassarCount: number;
    saadiCount: number;
  }> {
    const db = await this.getDb();
    const surahRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM surahs;'
    );
    const ayahRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM ayahs;'
    );
    const hafsRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM ayahs WHERE LENGTH(TRIM(text_hafs)) > 0;'
    );
    const warshRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM ayahs WHERE LENGTH(TRIM(text_warsh)) > 0;'
    );
    const muyassarRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM ayahs WHERE LENGTH(TRIM(tafsir_muyassar)) > 0;'
    );
    const saadiRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM ayahs WHERE LENGTH(TRIM(tafsir_saadi)) > 0;'
    );

    return {
      totalSurahs: surahRow?.count ?? 0,
      totalAyahs: ayahRow?.count ?? 0,
      hafsAyahs: hafsRow?.count ?? 0,
      warshAyahs: warshRow?.count ?? 0,
      muyassarCount: muyassarRow?.count ?? 0,
      saadiCount: saadiRow?.count ?? 0,
    };
  }

  /**
   * Closes the database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initPromise = null;
    }
  }
}
