# Cloudflare Pages migration (PR #43 alternative)

## Why
Original PR #43 proposes a dedicated ECS Fargate service (~$36/mo) to remove the
collision risk between Next-ShopFront and the shared `shop_droplinked_com_service`.
This document describes the **$0 alternative**: deploy to Cloudflare Pages via
`@opennextjs/cloudflare`.

## Cost
- Free tier: 500 builds/mo, 100K req/day, unlimited bandwidth.
- Commercial use permitted on free tier.
- Bypasses ECS entirely; the shared `shop_droplinked_com_service` keeps serving
  shop.droplinked.com without contention.

## Operator activation checklist

1. **Create CF Pages project** (one-time)
   - Cloudflare Dashboard → Workers & Pages → Create → Pages → Direct Upload
   - Project name: `next-shopfront`
   - Skip wizard; we deploy via GitHub Actions.

2. **Mint CF API token**
   - https://dash.cloudflare.com/profile/api-tokens → Create
   - Template: "Edit Cloudflare Workers" (covers Pages)
   - Permissions: Account → Cloudflare Pages → Edit
   - Save token value.

3. **Push GitHub secrets** (run locally):
   ```bash
   gh secret set CLOUDFLARE_API_TOKEN -R droplinked/Next-ShopFront -b "<token>"
   gh secret set CLOUDFLARE_ACCOUNT_ID -R droplinked/Next-ShopFront -b "<account-id>"
   ```

4. **Bind runtime env vars** (CF dashboard → Settings → Environment variables)
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - Set on both Production + Preview.

5. **First deploy**
   ```bash
   gh workflow run cf-pages.yml -R droplinked/Next-ShopFront --ref main
   ```

6. **Wire custom domain** (after first green deploy)
   - CF Pages → next-shopfront → Custom domains → Add `shop.droplinked.com`
   - Update Route 53 CNAME or move zone to CF.

7. **Decommission ECS path** (after 48h soak)
   - Set `shop_droplinked_com_service` desiredCount=0
   - Delete ECR repo + task-def revisions (keep last 3 for rollback)

## Rollback
If CF deploy breaks: re-scale `shop_droplinked_com_service` to 1; CNAME flips back
in <60s via DNS update. Original ECS Dockerfile + task-def unchanged in this PR.

## Local dev
Unchanged: `npm run dev` → `next dev` (no CF emulation needed for app code).
Optional CF runtime emulation: `npx wrangler pages dev .open-next/dist`.
