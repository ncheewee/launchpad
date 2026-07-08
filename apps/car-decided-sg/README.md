# Car, Decided.

A public, no-login Singapore new-car recommender for the 100 Apps Launchpad. It combines user-adjustable priorities, an editable 10-year ownership model, source-stamped vehicle data and visibly separate owner sentiment.

## Run locally

Serve the repository with any static server, for example:

```sh
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Checks

```sh
npm run check
```

## What v1 does

- Recommends one winner, one heart-led alternative and one wildcard.
- Scores reliability, safety, comfort, technology, performance, service support, family space and calculated value using user-controlled weights.
- Calculates purchase, flat-rate financing, energy, LTA road tax, insurance, maintenance, repair reserve, charger/shared costs and end-of-year-10 value.
- Allows up to four cars in comparison and per-car overrides.
- Saves preferences only in browser `localStorage`.
- Keeps official specifications, dealer/market prices and social evidence distinct.

## Data boundary

The July 8, 2026 dataset is a representative set of nine new Singapore SUVs, not the entire market. Prices are snapshots and may depend on COE, financing, insurance or trade-in conditions. The app highlights older snapshots and expects users to override them with dealer quotations.

Quality scores and repair/residual estimates are planning inputs, not measured guarantees. Social themes are manually curated and confidence-labelled; they do not silently alter factual specifications.

## Static deployment

The app has no build step and works on GitHub Pages. Publish the repository root, then add a Launchpad entry pointing to the deployed HTTPS URL.
