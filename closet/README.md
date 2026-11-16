# Valet Wardrobe

Valet plans outfits from the clothes you already own. It reads the weather forecast and your calendar, learns your style from a short interview, and lays out a week of outfits every Sunday.

## What it does

- **Today**: one outfit for the day, drawn as a flat-lay board, with the reasons behind it (rain, a showing, a piece you haven't worn in a while). Tap a piece to swap or lock it, shuffle the rest, then log it as worn.
- **Week**: seven days of outfits that avoid repeating tops, bottoms and dresses. Re-plans automatically on your planning day (Sunday by default). Each day reads its own forecast and calendar events: an open house gets comfortable shoes, a listing presentation gets polish, a workout adds a gym-kit reminder.
- **Closet**: every piece with photo or a colored drawing, price, store, designer, purchase date, size, status (laundry, tailor, storage, donate) and a wear log.
- **Looks**: saved outfits, suggested capsules with an outfit count and sample combinations, a smart shopping list of staples ranked by how many of your pieces each would pair with, and a wishlist that shows what a purchase would add before you buy it.
- **Insights**: closet value, cost per wear, best and worst value pieces, sleeping pieces, wear heatmap, wears by category and weekday, spending by store and month, and your color palette.
- **Trips**: destination weather (forecast, or last year's weather for later dates), an outfit per day and a mix-and-match packing list.

## Getting pieces in

- Photos, one or many. Valet detects the main color.
- Paste an order confirmation email or order page (Stitch Fix, Nordstrom, Gap, Old Navy, Banana Republic, Athleta, Amazon or any store).
- CSV spreadsheet with forgiving column matching.
- Inside Claude: search Gmail for order emails from 25+ clothing stores, and let Claude tag photos.

Stitch Fix, Nordstrom and Gap Inc. do not offer an API for customers' purchase history, so there is no direct login connection; order emails and order pages are the route in.

## Two ways to run it

| | Stand-alone (`index.html`) | Inside Claude (`artifact.html`) |
|---|---|---|
| Install to phone home screen, works offline | Yes | No |
| Live weather forecast | Yes (Open-Meteo) | Typical weather unless Claude saves a forecast |
| Calendar | Import an `.ics` file | Live Google Calendar |
| Gmail order import, photo auto-tagging, "Ask Claude" | No | Yes |
| Where data lives | This browser only (back up from Profile) | Synced with the artifact, any device |

### Stand-alone hosting

The folder is a static site. With GitHub Pages enabled on this repository's default branch, it is served at `/closet/` once this folder is merged. On iPhone, open it in Safari, tap Share, then Add to Home Screen.

## Development

Edit files in `src/`, then rebuild both copies:

```
node closet/build.mjs
```

No dependencies. `src/engine.js` holds the outfit scoring; `src/data.js` holds categories, colors, occasions, formulas and the calendar keyword rules.
