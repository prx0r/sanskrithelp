# Word CRNN (IIIT-HW-Dev)

CRNN + CTC for Devanagari word/phrase recognition.

## Dataset

IIIT-HW-Dev: 95K handwritten words, http://preon.iiit.ac.in/~kartik/IIIT-HW-Dev.zip

## Steps

```bash
pip install -r requirements.txt
python download.py
python train.py
./convert.sh   # or .\convert.ps1
```

Output: `public/dhcd/word_tfjs_model/`, `public/dhcd/charlist.json`

## Architecture

CNN (4 conv layers) → BiLSTM x2 → Dense → CTC decode. Input: 128×32 grayscale.
