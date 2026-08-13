# Setup Guide

Quick path to a running instance.

## 1. Frontend only (demo data, no keys)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Everything works except the maps (labeled
"not configured") and real ML predictions (uses the mock predictor).

## 2. Add maps

1. Create a free Mapbox account → Tokens → copy the default public token.
2. `cp .env.example .env`, set `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxx`.
3. Restart `npm run dev`.

## 3. Add the ML service

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

In `.env`: `ML_SERVICE_URL=http://localhost:8000`, restart the frontend.
Without a trained `model/model.pkl`, this still runs — on the mock predictor,
now server-side instead of client-side, with the same `isMock: true` flag.

## 4. Add the database

1. Create a free project at neon.tech, copy the connection string.
2. In `.env`: `DATABASE_URL=postgresql://...`
3. `npx drizzle-kit push` to create the tables from `db/schema.ts`.
4. Note: the Farms/Policies/Notifications pages still read `lib/demo-data`
   today — wiring them to the database means writing the `/api/farms` etc.
   routes and swapping the page-level data source. Not done in this build.

## 5. Train a real model

You need a labeled dataset (rainfall, temperature, humidity, soil moisture,
NDVI, and a `crop_failure` 0/1 label per record). Then:

```bash
cd ml-service
python training/train.py --data path/to/dataset.csv
```

This writes `model/model.pkl`; the FastAPI service picks it up automatically
on next restart and reports `isMock: false`.

## 6. Production build check

```bash
npm run lint
npm run build
```

Both pass cleanly as of this build.
