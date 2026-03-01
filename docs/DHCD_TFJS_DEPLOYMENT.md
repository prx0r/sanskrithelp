# DHCD TF.js — Long-Term Deployment

## Architecture: Client-Side Inference

The Devanagari recognition models run **in the browser** via TensorFlow.js. This is the recommended approach for:

| Requirement | How it works |
|-------------|--------------|
| **Embedded** | Models are bundled with the app. No external API. |
| **Multiple users** | Each user's browser loads the model once (cached). Inference runs locally. No server GPU. |
| **Local server** | Next.js serves model files from `public/dhcd/` as static assets. Run `npm run dev` or `npm start`. |
| **Scalable** | No server-side inference. 100 users = 100 browsers doing their own inference. |

## Flow

```
User browser                    Your server (Next.js)
     │                                    │
     │  GET /dhcd/tfjs_model/model.json   │
     │ ─────────────────────────────────>│  (static file)
     │  GET /dhcd/tfjs_model/group1.bin   │
     │ ─────────────────────────────────>│  (static file)
     │                                    │
     │  Model loaded, inference in browser │
     │  (no further server requests)       │
```

- **Model files** (`model.json` + `group*.bin`) live in `public/dhcd/tfjs_model/` and `public/dhcd/word_tfjs_model/`
- Next.js serves `public/` at the root URL
- TF.js fetches these once per session (browser caches them)
- All recognition runs in the user's browser — no server compute

## Deployment Options

### 1. Local development
```bash
npm run dev
# Models at public/dhcd/ served from http://localhost:3000/dhcd/...
```

### 2. Local production
```bash
npm run build && npm start
# Same. Static files from .next/static and public/
```

### 3. Vercel / Netlify / any static host
- `public/` is deployed as static assets
- Models are served from your domain
- No backend needed for recognition

### 4. Self-hosted (Docker, VPS, etc.)
- Build: `npm run build`
- Run: `npm start` or serve the output
- Models in `public/` go with the build

## One-Time Setup: Model Conversion

Models must be converted from Keras `.h5` to TF.js format. This is done **once** (or when you retrain):

1. Run `ml/convert_to_tfjs_colab.ipynb` in [Google Colab](https://colab.research.google.com)
2. Download the zip
3. Unpack into `public/dhcd/` (use `scripts/unpack-tfjs-models.ps1` or manual copy)
4. Commit the model files to git (or include in your deploy artifact)

Model files are ~2–5 MB total. Fine to commit.

## Alternatives (Not Recommended Here)

| Approach | Pros | Cons |
|----------|------|------|
| **Server-side Python + TF** | Full TF features | Needs GPU server, scales poorly, higher cost |
| **Cloud Vision API** | No model hosting | Per-request cost, latency, privacy |
| **TF.js in browser** ✓ | Free, fast, private, scales | Model must be converted once |

For embedded, multi-user, local-server use, TF.js client-side is the standard choice.
