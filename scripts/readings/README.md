# Kashmir Shaivism Readings — Audio Pipeline

Pre-generate audio for each verse/sūtra in three modes:
- **Sanskrit only** — indic-parler-tts
- **Parallel** — Sanskrit → 1.2s pause → English (Kokoro)
- **English only** — Kokoro

## Prerequisites

```bash
pip install indic-transliteration pydub requests
```

- **Sabdakrida** running for Sanskrit: `python -m uvicorn sabdakrida.main:app --port 8010`
- **CHUTES_API_KEY** in `.env.local` or environment for English TTS (Kokoro, male voice `am_adam`)

Add to `.env.local`:
```
CHUTES_API_KEY=your-chutes-api-key
```

## Order of Work

1. **Pratyabhijñāhṛdayam** (20 sūtras)
   ```bash
   python scripts/readings/fetch_pratyabhijna.py
   python scripts/readings/generate_audio.py --text pratyabhijna_hrdayam --limit 3  # test
   python scripts/readings/generate_audio.py --text pratyabhijna_hrdayam
   ```

2. **Śiva Sūtras** (77) — extract from Subhash Kak PDF + Hareesh blog
3. **Vijñānabhairava** (112) — vijnanabhairavatantra.com + Jaideva Singh djvu
4. **Spanda Kārikās** (53) — sanskrit-trikashaivism.com scrape

## Output Structure

```
public/content/readings/
  pratyabhijna_hrdayam/
    units.json
    audio/
      ph_001_sa.mp3
      ph_001_parallel.mp3
      ph_001_en.mp3
      ...
```

## Sources

- Pratyabhijñāhṛdayam: https://sanskritdocuments.org/doc_shiva/pratyabhijnahridayam.itx (fallback: embedded)
- Śiva Sūtras: https://sanskritdocuments.org/doc_shiva/shivasuutra.pdf, https://hareesh.org/blog/2023/12/7/the-shiva-sutras
- Vijñānabhairava: http://www.vijnanabhairavatantra.com/, https://archive.org/stream/...
- Spanda Kārikās: https://www.sanskrit-trikashaivism.com/en/spanda-karikas-normal-translation-trika-scriptures-non-dual-shaivism-of-kashmir/564
