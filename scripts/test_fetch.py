import urllib.request
import json

surahs = [1, 2, 114]
for s in surahs:
    muyassar_url = f"https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/ar-tafsir-muyassar/{s}.json"
    saadi_url = f"https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/ar-tafsir-as-saadi/{s}.json"

    with urllib.request.urlopen(muyassar_url, timeout=10) as r:
        d = json.loads(r.read().decode('utf-8'))
        print(f"Surah {s} Muyassar ayahs: {len(d)}")

    with urllib.request.urlopen(saadi_url, timeout=10) as r:
        d = json.loads(r.read().decode('utf-8'))
        print(f"Surah {s} Saadi ayahs: {len(d)}")
