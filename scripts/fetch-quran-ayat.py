#!/usr/bin/env python3
"""
Fetch a curated daily-ayah set from the canonical alquran.cloud API.
We specify only verse REFERENCES (surah:ayah coordinates). All Arabic
(Uthmani) and English (Saheeh International) TEXT comes verbatim from the API —
never authored or edited by hand. Output is committed so the app is offline-safe
and the text is auditable against the Mushaf by surah:ayah.

Run: python3 scripts/fetch-quran-ayat.py
"""
import json, sys, time, urllib.request

API = "https://api.alquran.cloud/v1/ayah/{ref}/editions/quran-uthmani,en.sahih"

# Curated references — well-known verses of remembrance, patience, mercy, hope.
REFS = [
    "2:152","2:153","2:155","2:186","2:216","2:286",
    "3:8","3:139","3:159","3:173","3:200",
    "6:59","7:23","8:46","9:40","9:51",
    "11:88","12:87","13:11","13:28","14:7",
    "16:97","16:128","17:80","20:114","23:118",
    "25:74","29:69","39:53","40:60","41:30",
    "46:13","47:7","49:13","50:16",
    "53:39","54:17","55:13","57:4",
    "64:11","65:2","65:3","65:7",
    "67:2","93:5","94:5","94:6","94:8",
]

def fetch(ref):
    url = API.format(ref=ref)
    with urllib.request.urlopen(url, timeout=30) as r:
        d = json.load(r)
    if d.get("code") != 200:
        return None
    ar = next(e for e in d["data"] if e["edition"]["identifier"] == "quran-uthmani")
    en = next(e for e in d["data"] if e["edition"]["identifier"] == "en.sahih")
    return {
        "surah": ar["surah"]["number"],
        "ayah": ar["numberInSurah"],
        "ref": f'{ar["surah"]["number"]}:{ar["numberInSurah"]}',
        "surahNameAr": ar["surah"]["name"],
        "surahNameEn": ar["surah"]["englishName"],
        "arabic": ar["text"],
        "translation": en["text"],
    }

out, failed = [], []
for ref in REFS:
    try:
        v = fetch(ref)
        if v: out.append(v); print("ok ", ref, "→", v["surahNameEn"], v["ayah"])
        else: failed.append(ref); print("SKIP(non-200)", ref)
    except Exception as e:
        failed.append(ref); print("ERR ", ref, e)
    time.sleep(0.15)

doc = {
    "_source": "https://alquran.cloud (api.alquran.cloud v1)",
    "_arabicEdition": "quran-uthmani (Uthmani script)",
    "_translationEdition": "en.sahih (Saheeh International)",
    "_note": "Arabic + translation are fetched verbatim from the canonical API and never hand-edited. Audit by surah:ayah against any Mushaf.",
    "_count": len(out),
    "verses": out,
}
with open("src/lib/data/quran-ayat.json", "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
print(f"\nWROTE {len(out)} verses, {len(failed)} failed: {failed}")
