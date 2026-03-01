# Cloudflare Build Configuration

This Next.js app uses **OpenNext** for Cloudflare Workers. The standard `next build` does **not** produce the output OpenNext needs.

## Required Cloudflare Settings

In **Cloudflare Dashboard** → **Workers & Pages** → your project → **Settings** → **Builds**:

| Setting | Value |
|---------|-------|
| **Build command** | `bash scripts/cloudflare-build.sh` |
| **Deploy command** | `npx wrangler deploy` |

Or alternatively:
- **Build command:** `npx opennextjs-cloudflare build`
- **Deploy command:** `npx wrangler deploy`

**Important:** If your Cloudflare project has "Build command" set to `next build` or `npm run build` and it's still running `next build`, the framework preset may be overriding it. Change it explicitly to one of the values above.

## Environment Variables

Add in Cloudflare → Settings → Variables:
- `CHUTES_API_KEY` — your Chutes.ai API key
