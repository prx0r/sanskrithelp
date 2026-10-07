# Language resources (Hindi + Sanskrit)

Local disk exports for `sanskrit.help` learning paths. Personal/reference use.

## Hindi

| Path | What | Size | Notes |
|------|------|-----:|-------|
| `hindi/snell_teach_yourself_hindi_conversation_2005.pdf` | Rupert Snell, *Teach Yourself Hindi Conversation* (2005) | 4.5M | **Scanned PDF** — no text layer; dialogue curriculum for conversation drills. |
| `hindi/bhatia_colloquial_hindi_2008.pdf` | Tej K. Bhatia, *Colloquial Hindi* (2008) | 3.1M | Full beginner course; **text extractable**. |
| `anki/complete_hindi_snell_anki.apkg` | *Complete Hindi — Teach Yourself* (Rupert Snell) Anki deck | 42M | 1223 notes, 2446 cards, hypertts mp3 audio in media. |
| `anki/complete_hindi_snell_notes.jsonl` | Same deck, notes as JSONL (no audio) | 0.3M | `{id, hindi, english, tags}` — ready for drills. |
| `anki/complete_hindi_snell_vocab.json` | App-shaped vocab array from the deck | ~0.2M | `{id, count, items:[{hindi, english, tags}]}`. |
| `extracted/colloquial_hindi_full.txt` | Full pdftotext of Bhatia | 90K+ | Raw layout text. |
| `extracted/colloquial_hindi_dialogues.jsonl` | Speaker-tagged dialogue units from Bhatia | varies | `{id, source, speakers, lines[{speaker,text}], n_turns}`. |
| `extracted/colloquial_hindi_sample.txt` | First ~60 pages text | 90K | Quick sample. |
| `extracted/snell_conversation_sample.txt` | pdftotext of Snell PDF | ~0 | Empty — PDF is image-only; use Anki + manual OCR if needed. |

**Alignment with app:** existing Hindi product data lives in `public/memory/hindi/` (corpus, scenarios, Osho scenes). This folder is the **coursebook + vocab source layer**, not a drop-in for those scene JSONs.

## Sanskrit (Jibananda Vidyasagara / completeworks, text-sized)

Classical pedagogy & philosophy PDFs kept **under ~10MB** each. Huge scanned grammars (Siddhanta Kaumudi parts, Sabda Sagara HR, Panchatantra HR, etc.) stay on local disk only.

| File | Why it's here |
|------|----------------|
| `Samskrita_Sikshamanjari_Part_1_-_..._1907.pdf` | **Sanskrit primer / siksha** — closest to a learner's manual in the set |
| `Muktikopanishad_-_..._1872.pdf` | Upanishadic Q&A tradition (teacher–student) |
| `Ashtabakra_Sanhita_with_Sanskrit_Tika_-_....pdf` | Ashtakra dialogue (instructional) |
| `Bhashapaparichheda_-_..._1902.pdf` | Grammar / philosophy of language |
| `Kalapa_Vyakaranam_-_..._1884_LQ.pdf` | Grammar (low-quality scan) |
| `Tarkasangraha_English_Translation_-_..._1872.pdf` | **English** Nyaya primer — good for bilingual drills |
| `Tarkamritam_-_..._1938.pdf` | Logic primer |
| `Vedanta_Paribhasha_-_..._1875.pdf` | Vedanta terminology |
| `Mimamsa_Paribhasha_-_..._1905.pdf` | Mīmāṃsā terminology |
| `Sabdasakti_Prakasika_-_..._1904.pdf` | Word-power / philosophy of language |
| `Vaiseshikadarsana_-_..._1886.pdf` | Vaiśeṣika darśana |
| `Sankhyakarika_with_Gaudapadabhashya_-_..._1892.pdf` | Sāṅkhya kārikā + commentary |
| `Atmatattvaviveka_of_Udayanacharya_-_..._1873.pdf` | Atma-tattva-viveka debate text |

**Not copied (too large for git):** Siddhanta Kaumudi P1/P2 (~220–245MB), Sabda Sagara HR, Patanjala Darsanam, Rudra Yamala, Sisupalavadha, Atharvanopanishad, etc. Paths under `/home/box/Documents/cw2/` and `/home/box/Documents/completeworks/`.

## How to use

```bash
# vocab drills from Snell deck
python3 -c "import json;d=json.load(open('data/language-resources/anki/complete_hindi_snell_vocab.json'));print(d['count'], d['items'][0])"

# dialogue units
wc -l data/language-resources/extracted/colloquial_hindi_dialogues.jsonl
```

Import Anki: Anki → File → Import → `anki/complete_hindi_snell_anki.apkg`.

## Provenance

- Snell / Bhatia PDFs + Anki from local `~/Downloads` (Anna’s Archive dumps).
- Sanskrit PDFs from `~/Documents/completeworks/100/` + `cw2` (Jibananda Vidyasagara press scans).
- Packed 2026-10-07 for `prx0r/sanskrithelp`.
- Copyright: commercial coursebooks — personal study/reference; do not redistribute outside your own use.
