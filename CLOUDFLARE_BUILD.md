# Cloudflare Build Configuration

This Next.js app uses **OpenNext** for Cloudflare Workers. The standard `next build` does **not** produce the output OpenNext needs.

## Required Cloudflare Settings

In **Cloudflare Dashboard** → **Workers & Pages** → your project → **Settings** → **Builds**:

| Setting | Value |
|---------|-------|
| **Build command** | `npx opennextjs-cloudflare build` |
| **Deploy command** | `npx wrangler deploy` |

**Critical:** Do NOT use `npm run build` as the build command. That runs `next build` only and produces `.next` — but the deploy needs `.open-next` which OpenNext creates. Use `npx opennextjs-cloudflare build` directly so OpenNext runs `next build` internally and then transforms the output.

## Environment Variables

Add in Cloudflare → Settings → Variables:
- `CHUTES_API_KEY` — your Chutes.ai API key
