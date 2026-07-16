# Drew Miller — custom North Shore agent site

A public marketing + tools site for Drew Miller, built to escape Squarespace 7.0 lock-in while keeping every sold-property URL for SEO.

## What’s in v1

- **277 sold listing pages** imported from the Squarespace export (same URL slugs)
- **Sales map** + address → nearby previous sales
- **Appraisal lead form**
- **Admin live desk** (`/admin`) with Trade Me / homes.co.nz / OneRoof / Ray White URL import (House Kiwi DNA)
- **RateMyAgent** surfaced as a primary CTA
- Sitemap + canonical metadata for SEO

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL
- Leaflet maps + OpenStreetMap Nominatim geocoding

## Local setup

```bash
docker compose up -d          # local Postgres
cp .env.example .env          # edit AUTH_SECRET
npm install
npx prisma migrate deploy
# Either re-import content:
npm run db:import
# Or copy an existing local SQLite dump into Postgres:
# npm run db:push-sqlite
npm run db:geocode 40         # optional: pin sales on the map
npm run dev
```

Admin login (from `.env`):

- Email: `admin@drewmiller.co.nz`
- Password: `changeme`

## Deploy (GitHub → Railway)

1. Push to `busydesign/drewmiller`
2. In Railway: **New Project → Deploy from GitHub** → select this repo
3. **Add Postgres** plugin and link it to the web service (`DATABASE_URL`)
4. Set variables on the web service:
   - `AUTH_SECRET` — long random string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_SITE_URL` — Railway public URL (update after first deploy)
5. Deploy. Migrations run on start (`prisma migrate deploy`)
6. Copy local listing data into Railway Postgres:

```bash
# From your machine, with Railway DATABASE_URL:
DATABASE_URL="postgresql://..." npm run db:push-sqlite
```

## Content sources

- `../drewmiller-migration/export` — pages, HTML, images
- `data/drew-miller-rma-sales.json` — RateMyAgent sales seed
- `public/migration-images` → symlink to migration image archive

## Product direction

This is the public face. House Kiwi remains the deeper workspace/tooling product. Shared strengths (URL import, maps, comps, RMA) are being brought into a brand site people can actually find on Google.
