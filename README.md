# mealnova-web

Mealnova public website — Next.js 15 (App Router), Tailwind CSS v4, next-intl (`/en`, `/hi`, `/mr`),
TanStack Query. Talks to [mealnova-api](https://github.com/mealnova/mealnova-api) over HTTPS.

## Quickstart

```bash
cp .env.example .env.local      # point at your API (defaults to http://localhost:4000/api/v1)
pnpm install                    # see "Shared packages" below
pnpm dev                        # http://localhost:3000 → redirects to /en
```

## Shared packages (`@mealnova/types`, `@mealnova/shared`)

Consumed from the **committed `vendor/` copies** (`file:vendor/...`) — installs work in CI, Vercel,
and fresh clones with no registry token. To pick up changes from
[mealnova-shared](https://github.com/mealnova/mealnova-shared):

```bash
# with mealnova-shared cloned + built as a sibling directory
pnpm vendor:update && pnpm install
```

For live local development against the sibling instead of the vendored copies, use
`MEALNOVA_LINK_SHARED=1 pnpm install` (don't commit the resulting lockfile churn).

> Once these repos move into the `mealnova` org, the deps can flip to the published
> `@mealnova/*` GitHub Packages — the publish workflow is already committed in mealnova-shared.

## Outage resilience

The site stays usable when the API is down:

- `getBrandSettings()` falls back **live API → committed snapshot → on-brand defaults** (cold pages
  never 500; theme always renders).
- `src/content/snapshot.json` is the committed content snapshot. Refresh it against a healthy API
  with `pnpm snapshot` (uses `SNAPSHOT_API_URL`/`INTERNAL_API_URL`); if the API is unreachable the
  existing snapshot is kept and the command still exits 0, so builds never fail on backend outages.
- `app/global-error.tsx` + `app/[locale]/error.tsx` render friendly fallbacks instead of white screens.
- ISR keeps serving the last-good render while background revalidation fails.

CI builds intentionally point at an unreachable API to prove this keeps working.

## Deployment (Vercel)

1. Import the GitHub repo into Vercel (framework auto-detected).
2. Environment variables: `NEXT_PUBLIC_API_URL` + `INTERNAL_API_URL` (deployed API base, e.g.
   `https://api.mealnova.com/api/v1`) and `GITHUB_TOKEN` (`read:packages`) so `pnpm install` can
   resolve `@mealnova/*` from GitHub Packages.
3. The API's `CORS_ORIGINS` must include the Vercel domain.

No `output: standalone` / custom server — Vercel manages the runtime.
