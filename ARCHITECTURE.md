# Architecture

## Request flow — risk analysis

```
Risk Analysis UI (app/risk-analysis)
  → POST /api/risk/analyze (Next.js API route)
      → lib/ml/riskClient.ts
          → FastAPI /predict-risk  (ml-service/app/main.py)
              → app/predictor.py: RandomForestPredictor (model/model.pkl)
                 or MockPredictor (isMock: true) if no model file exists
          ← { riskScore, riskLevel, factors, modelVersion, isMock }
      → lib/pricing/pricingEngine.ts (calculatePremium)
          — a separate, non-ML rules engine; never conflated with the model output
  ← { prediction, pricing }
```

The ML service answers "what is the estimated risk?" The pricing engine answers
"given that risk, what premium should be recommended?" They are separate modules
on both the Python side and the TypeScript side, and the API response keeps them
as two distinct top-level keys so the UI never presents a multiplier as a model output.

## Data sources — honesty over completeness

Every external integration (`lib/weather`, `lib/satellite`) follows the same shape:
a `Provider` interface, a real implementation, and a status field (`live` /
`not_configured` / `error`) that the UI renders directly. Nothing fabricates a
plausible-looking value when a credential is missing.

## Layers

- `app/` — routes and pages only; no business logic beyond composing components and
  calling `lib/` or `app/api/`.
- `components/` — presentational + a small amount of client state (the risk-analysis
  stepper, map interactivity).
- `lib/pricing`, `lib/weather`, `lib/satellite`, `lib/ml` — the service layer. Pure
  functions / fetch wrappers, no React.
- `db/` — Drizzle schema and Neon client, imported only from API routes (never from
  client components).
- `ml-service/` — independent Python service; the only coupling to the frontend is the
  HTTP contract in `lib/ml/types.ts` / `ml-service/app/schemas.py`, which are kept in
  sync by hand (documented here rather than shared, since the stacks are separate).

## Known gaps (see README "What is NOT included")

Farms/Policies/Notifications pages currently read `lib/demo-data`, not the database —
the schema exists but the CRUD API routes and server-side fetch calls haven't been
written yet.
