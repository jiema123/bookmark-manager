---
description: Deploy the application to Cloudflare Pages
---

1. Build the application for Cloudflare Pages
```bash
pnpm run pages:build
```

2. Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy .vercel/output/static
```
