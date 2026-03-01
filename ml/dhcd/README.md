# DHCD Devanagari Character Recognition

Train a CNN on the DHCD dataset and use it in the browser via TF.js.

## Prerequisites

```bash
pip install -r requirements.txt
# tensorflow, tensorflowjs, numpy
```

## Steps

### 1. Download dataset

```bash
python download.py
```

Downloads `dataset.npz` (~95MB) from GitHub. If that fails, manually download from:
- [GitHub](https://github.com/Prasanna1991/DHCD_Dataset) → `dataset/dataset.npz` → place in `ml/dhcd/data/`
- [UCI](https://archive.ics.uci.edu/dataset/389/devanagari+handwritten+character+dataset)
- [Kaggle](https://www.kaggle.com/datasets/rishianand/devanagari-character-dataset) (requires `kaggle.json` in `~/.kaggle/`)

### 2. Train

```bash
python train.py
```

Output: `model_char.h5`

### 3. Convert to TF.js

```bash
# Linux/macOS
./convert.sh

# Windows
.\convert.ps1
```

Output: `public/dhcd/tfjs_model/model.json` + weight shards

### 4. Export class mapping (optional)

```bash
python export_mapping.py
```

Output: `public/dhcd/class_labels.json` and `classes.json`

## Class mapping

DHCD labels 0–45 map to:
- 0–9: Devanagari digits ० १ २ ३ ४ ५ ६ ७ ८ ९
- 10–45: Consonants क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह क्ष त्र ज्ञ

Verify against your dataset if using a different source (e.g. Kaggle folder structure).

## Usage in app

```ts
import { loadBothModels, charRecognize, wordRecognize, recognize } from "@/lib/recognize";

// Warm up (call once on app init)
loadBothModels();

// Character: 32×32 binarized pixels
const charResult = await charRecognize(pixels32x32);
if (charResult) console.log(charResult.char, charResult.confidence); // e.g. "क", 0.92

// Word: canvas element (resized to 128×32 internally)
const wordResult = await wordRecognize(canvas);
if (wordResult) console.log(wordResult.text, wordResult.confidence);

// Auto-detect by aspect ratio (tall/square = char, wide = word)
const result = await recognize(canvas);
```
