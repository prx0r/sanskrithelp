# Devanagari Recognition — TF.js Models

This folder holds the converted TensorFlow.js models for browser-based recognition.

## 404? Models not converted yet

If you see `Request to /dhcd/tfjs_model/model.json failed with status code 404`:

1. **Run the Colab notebook** to convert your `.h5` models:
   - Open [colab.research.google.com](https://colab.research.google.com)
   - File → Upload notebook → select `ml/convert_to_tfjs_colab.ipynb`
   - Run all cells; upload `model_char.h5`, `model_word.h5`, `charlist.json` when prompted
   - Download `dhcd_tfjs_all.zip`

2. **Unpack** into this folder:
   ```powershell
   # From project root
   .\scripts\unpack-tfjs-models.ps1 -ZipPath path\to\dhcd_tfjs_all.zip
   ```
   Or manually: unzip, copy `tfjs_char/*` → `tfjs_model/`, `tfjs_word/*` → `word_tfjs_model/`

3. **Test** at http://localhost:3000/draw

## Expected layout

```
public/dhcd/
├── tfjs_model/        ← char model (from tfjs_char/)
│   ├── model.json
│   └── group*.bin
├── word_tfjs_model/   ← word model (from tfjs_word/)
│   ├── model.json
│   └── group*.bin
├── class_labels.json
├── charlist.json
└── classes.json
```

See `docs/TFJS_MODEL_CONVERSION.md` for full instructions.
