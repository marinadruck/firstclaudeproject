# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

GitHub remote: `https://github.com/marinadruck/firstclaudeproject.git` (branch: `main`)

## Dev Commands

```bash
npm install       # first-time setup
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build (also type-checks)
npm run lint      # ESLint
```

Requires Node.js ≥ 18. Install via `brew install node` if not present.

## Architecture

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Recharts

**Entry point:** `src/app/page.tsx` — server component that reads `?ticker=` from the URL and renders `<SearchBar>` + `<Dashboard>`. The ticker flows down as a prop; no client-side router state needed.

**API:** `src/app/api/stock/[ticker]/route.ts` — single `GET` endpoint. Validates the ticker via `fetchCompanyProfile`, then fetches real data from Finnhub (price), Alpha Vantage (history), NewsAPI (sentiment), and Reddit in parallel. Any failed source falls back to neutral defaults (zeros, empty arrays, "Awaiting…" copy) — no fabricated values.

**Alpha Vantage client:** `src/lib/alphavantage.ts` — calls `TIME_SERIES_DAILY` for 30-day closing prices, parses `"4. close"` field. Caches 12 hours per ticker. Throws on rate limit (`"Note"` field in response) or missing key — route falls back to empty `priceHistory: []`.

**Finnhub client:** `src/lib/finnhub.ts` — two exports: `fetchRealPriceData(ticker)` calls `/quote` for real-time price (30s cache); `fetchCompanyProfile(ticker)` calls `/stock/profile2` to validate a ticker exists and retrieve the company name (24h cache, returns `{ companyName, exists }`). Free tier only; `/stock/candle` (price history) requires a paid plan so `priceHistory` comes from Alpha Vantage.

**NewsAPI client:** `src/lib/newsapi.ts` — queries `/v2/everything` for up to 25 recent headlines per ticker, scores each with finance-specific positive/negative keywords (exported as `scoreHeadline`), and generates `newsMentionCount`, `sentimentExplanation`, and `headlines`. Caches 5 minutes. Key in `NEWS_API_KEY` env var.

**Reddit client:** `src/lib/reddit.ts` — fetches up to 25 posts each from r/wallstreetbets, r/stocks, and r/investing using the public unauthenticated `/search.json` endpoint (no API key required). Reuses `scoreHeadline` from newsapi.ts. Caches 5 minutes. Reddit failure falls back to news-only sentiment. Requires `User-Agent: StockSentimentDashboard/1.0` header.

**Sentiment blending:** Combined `sentimentScore` = 70% news + 30% Reddit (computed in route.ts). `mentionCount` = total; `newsMentionCount` and `redditMentionCount` are per-source breakdowns shown in the UI subtitle.

**Environment variables** in `.env.local` (never committed):
- `FINNHUB_API_KEY` — free key from https://finnhub.io
- `ALPHA_VANTAGE_API_KEY` — free key from https://www.alphavantage.co/support/#api-key (25 req/day on free tier; price history cached 12 hours)
- `NEWS_API_KEY` — free key from https://newsapi.org (100 req/day on developer tier)
- Reddit requires no API key — uses public unauthenticated endpoint

**Recommendation engine:** `src/lib/recommendations.ts` — pure `computeRecommendation(input)` function. Takes `sentimentScore`, `mentionCount`, `newsMentionCount`, `redditMentionCount`, `signal`, and `priceChangePercent`; returns `priceOutlook` and `recommendation` using 12 priority-ordered rules (hype detection, bullish/bearish alignment, price–sentiment divergence). Only called when real sentiment data is available; neutral defaults used otherwise.

**Signal logic:** `src/lib/signals.ts` — pure `computeSignal(mentionCount, sentimentScore)` function. Thresholds are constants at the top; easy to tune. Currently: ≥ 100 mentions → High Attention, ≤ 20 → Low Attention, otherwise Watch.

**Types:** all shared interfaces live in `src/types/index.ts` (`StockData`, `Headline`, `PricePoint`, `Signal`).

## Git Workflow

Every `git commit` automatically triggers a push to `origin/main` via a PostToolUse hook in `.claude/settings.json`. There is no need to run `git push` manually after committing.

Routine git operations (`add`, `commit`, `push origin`, `pull`, `fetch`, `checkout`, `switch`, `merge`, `stash`, `tag`) are pre-approved and will not prompt for permission. Destructive commands (`reset --hard`, `push --force`, `branch -D`, `clean`) always require explicit confirmation before running.

### Commit discipline

Commit and push to GitHub frequently throughout all work — after completing each meaningful unit of work (a new feature, a bug fix, a refactor, a config change). Never leave significant progress uncommitted. Commit messages must be clean and descriptive: summarise *what* changed and *why* in the subject line, using the imperative mood (e.g. `Add user auth`, `Fix off-by-one in pagination`, `Refactor API client to use fetch`). This ensures the full history is always recoverable from GitHub.
