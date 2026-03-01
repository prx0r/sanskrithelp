# TF.js Model Conversion — Devanagari Handwriting (DHCD)

**Preferred: Server-side (like TTS)** — Run Sabdakrida with `uvicorn sabdakrida.main:app --port 8010`. Character recognition uses `model_char.h5` directly; no conversion needed. See `/draw` page.

**Fallback:** Convert to TF.js for in-browser inference when Sabdakrida is unavailable. Use one of the options below.

---

## Option A — Clean venv (Windows, fastest, no upload)

Run in project root:

```powershell
# Create clean env
python -m venv .venv-tfjs
.\.venv-tfjs\Scripts\Activate.ps1

# Install exact compatible versions
pip install "tensorflow==2.15.0" "tensorflowjs==4.17.0"

# Convert char model (layers format for loadLayersModel in browser)
cd ml\dhcd
tensorflowjs_converter --input_format keras --output_format tfjs_layers_model model_char.h5 ..\..\public\dhcd\tfjs_model

# Convert word model
cd ..\word
tensorflowjs_converter --input_format keras --output_format tfjs_layers_model model_word.h5 ..\..\public\dhcd\word_tfjs_model

# Copy charlist
Copy-Item charlist.json ..\..\public\dhcd\
```

**Known issue on Windows:** TensorFlow 2.15 pulls in `tensorflow-decision-forests` → `uvloop`, which does not support Windows. Use Option B (Colab) instead.

**Python version:** TensorFlow 2.15 needs Python 3.8–3.11. If you're on Python 3.12+:

```powershell
python --version  # check first
```

If 3.12+, use Option B (Colab) — it's faster than fighting the environment.

---

## Option B — Colab (2 minutes, zero environment pain)

**Preferred:** Use the notebook at `ml/convert_to_tfjs_colab.ipynb`.

1. Go to [colab.research.google.com](https://colab.research.google.com)
2. **File → Upload notebook** → select `ml/convert_to_tfjs_colab.ipynb` from your project
3. Run all cells. When prompted, upload:
   - `ml/dhcd/model_char.h5`
   - `ml/word/model_word.h5`
   - `ml/word/charlist.json`
4. Download `dhcd_tfjs_all.zip`
5. Unpack:
   ```powershell
   .\scripts\unpack-tfjs-models.ps1 -ZipPath "C:\path\to\dhcd_tfjs_all.zip"
   ```
   Or manually: unzip, copy `tfjs_char/*` → `public/dhcd/tfjs_model/`, `tfjs_word/*` → `public/dhcd/word_tfjs_model/`
6. Test at http://localhost:3000/draw

**Alternative** (paste cells manually): New notebook, paste:

```python
# Cell 1 — install
!pip install "tensorflow==2.15.0" "tensorflowjs==4.17.0" -q

# Cell 2 — upload your .h5 files
from google.colab import files
uploaded = files.upload()  # upload model_char.h5 then model_word.h5

# Cell 3 — convert char model (layers format for loadLayersModel)
!tensorflowjs_converter --input_format keras --output_format tfjs_layers_model model_char.h5 tfjs_char/

# Cell 4 — convert word model
!tensorflowjs_converter --input_format keras --output_format tfjs_layers_model model_word.h5 tfjs_word/

# Cell 5 — sanity check (see notebook), then Cell 6 — zip and download
import shutil
shutil.make_archive('tfjs_models', 'zip', '.', 'tfjs_char')
# repeat for word or zip both together
files.download('tfjs_models.zip')
```

3. Unzip into `public/dhcd/tfjs_model/` and `public/dhcd/word_tfjs_model/`
4. Test at `/draw` — draw a character or word, click Recognize

---

## Post-conversion verification

```powershell
# Should exist and be non-empty
Test-Path public\dhcd\tfjs_model\model.json
Test-Path public\dhcd\word_tfjs_model\model.json

# Check model.json isn't corrupt — layers format has "modelTopology" key
Get-Content public\dhcd\tfjs_model\model.json -TotalCount 1
```

---

## Expected layout after conversion

```
public/dhcd/
├── tfjs_model/
│   ├── model.json
│   └── group*.bin
├── word_tfjs_model/
│   ├── model.json
│   └── group*.bin
├── class_labels.json   # DHCD index → character
├── charlist.json       # word model charset (from ml/word/)
└── classes.json        # backward compat
```

---

## Browser smoke test (after unzip)

Paste in devtools console on your app:

```javascript
const model = await tf.loadLayersModel('/dhcd/tfjs_model/model.json');
console.log('Char model input shape:', model.inputs[0].shape);   // [null, 32, 32, 1]
console.log('Char model output shape:', model.outputs[0].shape); // [null, 46]
```

- **404** → path wrong (check `public/dhcd/tfjs_model/model.json` exists)
- **Schema error** → conversion used graph-model; add `--output_format tfjs_layers_model` to converter

---

## Note on word model accuracy

The word model is trained on only 500 synthetic words. Real-world accuracy will be poor until you use the IIIT-HW-Dev dataset. Get the conversion done first; retrain after.
