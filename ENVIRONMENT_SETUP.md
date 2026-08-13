# Environment Setup

Copy `.env.example` to `.env` and fill in what you have. Nothing here is
required to browse the UI — every integration degrades to an honest
"not configured" state rather than failing or faking data.

| Variable | Required for | Where to get it | Restart needed? |
|---|---|---|---|
| `DATABASE_URL` | Persisting farms/policies/predictions instead of demo data | Create a project at neon.tech, copy the pooled connection string | Yes, restart `next dev` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Farm Map, Risk Analysis Step 1 (draw/search), Overview heatmap | Sign up at mapbox.com → Account → Tokens → copy the default public token (`pk.`) | Yes |
| `ML_SERVICE_URL` | Real ML risk predictions instead of the mock predictor | The base URL of your running FastAPI service, e.g. `http://localhost:8000` | Yes |
| `WEATHER_API_KEY` | Only if you swap the default provider (Open-Meteo needs no key) | Depends on the provider you choose in `lib/weather/provider.ts` | Yes |
| `SATELLITE_CLIENT_ID` / `SATELLITE_CLIENT_SECRET` | NDVI data from Sentinel Hub | Create an OAuth client at apps.sentinel-hub.com | Yes |

Notes:
- `NEXT_PUBLIC_MAPBOX_TOKEN` is the only variable safe to expose to the browser — it's a
  public token by design. Everything else stays server-side.
- Never commit `.env`. `.gitignore` already excludes it.
- After changing `.env`, stop and restart `npm run dev` — Next.js only reads env files on boot.
