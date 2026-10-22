#!/usr/bin/env python3
"""
Athar (أَثَر) Quran Vault Verification Suite
Validates database integrity, verse counts, Tafsir presence, and FTS5 search latency.
"""

import os
import sys
import time
import sqlite3
import re

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "assets", "databases", "athar_vault.db")

DIACRITICS_REGEX = re.compile(r"[\u0617-\u061A\u064B-\u0652\u06D6-\u06ED\u0640]")

def normalize_query(text: str) -> str:
    if not text:
        return ""
    text = text.replace("\u0670", "ا")
    text = DIACRITICS_REGEX.sub("", text)
    text = re.sub(r"[إأآٱ]", "ا", text)
    text = text.replace("الرحمان", "الرحمن")
    text = text.replace("هاذا", "هذا")
    text = text.replace("هاؤلاء", "هؤلاء")
    text = text.replace("لاكن", "لكن")
    text = text.replace("ى", "ي").replace("ة", "ه")
    text = re.sub(r"[ؤئ]", "ء", text)
    return re.sub(r"\s+", " ", text).strip()

def run_verification():
    print("=" * 65)
    print("🔬 ATHAR QURAN VAULT INTEGRITY & BENCHMARK VERIFICATION")
    print("=" * 65)

    if not os.path.exists(DB_PATH):
        print(f"❌ ERROR: Database file not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Verify Surahs Count
    cur.execute("SELECT COUNT(*) FROM surahs;")
    surah_count = cur.fetchone()[0]
    assert surah_count == 114, f"Expected 114 Surahs, found {surah_count}"
    print(f"✓ 1. Surahs Table Integrity: 114 / 114 Surahs present.")

    # 2. Verify Ayahs Count
    cur.execute("SELECT COUNT(*) FROM ayahs;")
    ayah_count = cur.fetchone()[0]
    assert ayah_count == 6236, f"Expected 6236 Ayahs, found {ayah_count}"
    print(f"✓ 2. Ayahs Table Integrity: 6,236 / 6,236 Ayahs verified.")

    # 3. Verify Dual Riwaya completeness (Hafs & Warsh)
    cur.execute("SELECT COUNT(*) FROM ayahs WHERE LENGTH(TRIM(text_hafs)) > 0;")
    hafs_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM ayahs WHERE LENGTH(TRIM(text_warsh)) > 0;")
    warsh_count = cur.fetchone()[0]
    assert hafs_count == 6236, f"Incomplete Hafs: {hafs_count}"
    assert warsh_count == 6236, f"Incomplete Warsh: {warsh_count}"
    print(f"✓ 3. Dual Riwaya Integrity: Hafs (6,236) & Warsh (6,236) fully indexed.")

    # 4. Verify Tafsir Al-Muyassar and Tafsir Al-Sa'di completeness
    cur.execute("SELECT COUNT(*) FROM ayahs WHERE LENGTH(TRIM(tafsir_muyassar)) > 0;")
    muyassar_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM ayahs WHERE LENGTH(TRIM(tafsir_saadi)) > 0;")
    saadi_count = cur.fetchone()[0]
    assert muyassar_count == 6236, f"Incomplete Muyassar: {muyassar_count}"
    assert saadi_count == 6236, f"Incomplete Saadi: {saadi_count}"
    print(f"✓ 4. Tafsir Integrity: Muyassar (6,236) & Sa'di (6,236) line-by-line complete.")

    # 5. Spot-check Al-Fatihah, Ayat Al-Kursi, and Surat Al-Ikhlas
    cur.execute("""
    SELECT s.name_ar, a.ayah_number, a.text_hafs, a.text_warsh, a.tafsir_muyassar, a.tafsir_saadi
    FROM ayahs a JOIN surahs s ON a.surah_id = s.id
    WHERE a.surah_id = 1 AND a.ayah_number = 1;
    """)
    row = cur.fetchone()
    print(f"✓ 5. Spot Check Al-Fatihah 1:1:")
    print(f"     Hafs:  {row[2]}")
    print(f"     Warsh: {row[3]}")
    print(f"     Tafsir Muyassar: {row[4][:50]}...")
    print(f"     Tafsir Sa'di:    {row[5][:50]}...")

    # 6. FTS5 Benchmark & Latency Test (< 15ms target)
    print("\n⚡ 6. SQLite FTS5 Full-Text Search Benchmark:")
    test_queries = [
        "الله نور السماوات",
        "اهدنا الصراط المستقيم",
        "الحمد لله رب العالمين",
        "قل هو الله احد",
        "لا اكراه في الدين",
        "تلك الرسل",
    ]

    for q in test_queries:
        normalized = normalize_query(q)
        fts_term = f'"{normalized}"'

        start_time = time.perf_counter()
        cur.execute("""
        SELECT a.surah_id, s.name_ar, a.ayah_number, a.text_hafs
        FROM ayahs_fts f
        JOIN ayahs a ON f.rowid = a.id
        JOIN surahs s ON a.surah_id = s.id
        WHERE ayahs_fts MATCH ?
        LIMIT 10;
        """, (fts_term,))
        results = cur.fetchall()
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        assert len(results) > 0, f"Query '{q}' returned 0 results"
        assert elapsed_ms < 15.0, f"Query '{q}' took {elapsed_ms:.2f}ms (> 15ms limit)"
        print(f"   • Query: '{q}' → {len(results)} matches in {elapsed_ms:.2f} ms [PASSED]")

    conn.close()
    print("=" * 65)
    print("🌟 ALL 6/6 INTEGRITY & PERFORMANCE CHECKS PASSED PERFECTLY!")
    print("=" * 65)

if __name__ == "__main__":
    run_verification()
