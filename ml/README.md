# Devanagari Recognition — Two Models

## Model 1: Character CNN (DHCD)

- **Dataset**: 92K images, 46 classes, 32×32
- **Architecture**: [Conv2D→MaxPool] x3 → Dropout → Dense → Softmax
- **Output**: `model_char.h5` → `public/dhcd/tfjs_model/` + `class_labels.json`

See [dhcd/README.md](dhcd/README.md).

## Model 2: Word CRNN (IIIT-HW-Dev)

- **Dataset**: 95K handwritten words, IIIT-HW-Dev
- **Architecture**: CNN → BiLSTM x2 → CTC
- **Output**: `model_word.h5` → `public/dhcd/word_tfjs_model/` + `charlist.json`

See [word/README.md](word/README.md).

## JS Integration

```ts
import { loadBothModels, charRecognize, wordRecognize, recognize } from "@/lib/recognize";

loadBothModels();

// Character: 32×32 pixels
const r = await charRecognize(pixels);

// Word: canvas
const w = await wordRecognize(canvas);

// Auto-detect by aspect ratio
const result = await recognize(canvas);
```
