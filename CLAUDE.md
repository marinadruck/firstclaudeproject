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

**API:** `src/app/api/stock/[ticker]/route.ts` — single `GET` endpoint. Fetches real price data from Finnhub (`currentPrice`, `priceChangePercent`, `priceHistory`) and overlays it on mock data (sentiment, mentions, headlines). Falls back to full mock on any Finnhub error.

**Finnhub client:** `src/lib/finnhub.ts` — two exports: `fetchRealPriceData(ticker)` calls `/quote` for real-time price (30s cache); `fetchCompanyProfile(ticker)` calls `/stock/profile2` to validate a ticker exists and retrieve the company name (24h cache, returns `{ companyName, exists }`). Free tier only; `/stock/candle` (price history) requires a paid plan so `priceHistory` stays mock.

**NewsAPI client:** `src/lib/newsapi.ts` — queries `/v2/everything` for up to 25 recent headlines per ticker, scores each with finance-specific positive/negative keywords (exported as `scoreHeadline`), and generates `newsMentionCount`, `sentimentExplanation`, and `headlines`. Caches 5 minutes. Falls back to mock on any error. Key in `NEWS_API_KEY` env var.

**Reddit client:** `src/lib/reddit.ts` — fetches up to 25 posts each from r/wallstreetbets, r/stocks, and r/investing using the public unauthenticated `/search.json` endpoint (no API key required). Reuses `scoreHeadline` from newsapi.ts. Caches 5 minutes. Reddit failure falls back to news-only sentiment. Requires `User-Agent: StockSentimentDashboard/1.0` header.

**Sentiment blending:** Combined `sentimentScore` = 70% news + 30% Reddit (computed in route.ts). `mentionCount` = total; `newsMentionCount` and `redditMentionCount` are per-source breakdowns shown in the UI subtitle.

**Environment variables** in `.env.local` (never committed):
- `FINNHUB_API_KEY` — free key from https://finnhub.io
- `NEWS_API_KEY` — free key from https://newsapi.org (100 req/day on developer tier)
- Reddit requires no API key — uses public unauthenticated endpoint

**Recommendation engine:** `src/lib/recommendations.ts` — pure `computeRecommendation(input)` function. Takes `sentimentScore`, `mentionCount`, `newsMentionCount`, `redditMentionCount`, `signal`, and `priceChangePercent`; returns `priceOutlook` and `recommendation` using 12 priority-ordered rules (hype detection, bullish/bearish alignment, price–sentiment divergence). Called in route.ts after real sentiment is resolved; falls back to mock values if news fetch fails entirely.

**Signal logic:** `src/lib/signals.ts` — pure `computeSignal(mentionCount, sentimentScore)` function. Thresholds are constants at the top; easy to tune. Currently: ≥ 100 mentions → High Attention, ≤ 20 → Low Attention, otherwise Watch.

**Mock data:** `src/lib/mock-data.ts` — five tickers pre-seeded (AAPL, TSLA, NVDA, MSFT, GME) each with 30-day price history and 5–8 headlines. `getMockData` is now used only to provide `priceHistory` for seeded tickers; 404 validation uses `fetchCompanyProfile` instead, so any valid US ticker is supported. Unknown tickers get `priceHistory: []` and real data from Finnhub + NewsAPI + Reddit.

**Types:** all shared interfaces live in `src/types/index.ts` (`StockData`, `Headline`, `PricePoint`, `Signal`).

## Git Workflow

Every `git commit` automatically triggers a push to `origin/main` via a PostToolUse hook in `.claude/settings.json`. There is no need to run `git push` manually after committing.

Routine git operations (`add`, `commit`, `push origin`, `pull`, `fetch`, `checkout`, `switch`, `merge`, `stash`, `tag`) are pre-approved and will not prompt for permission. Destructive commands (`reset --hard`, `push --force`, `branch -D`, `clean`) always require explicit confirmation before running.

### Commit discipline

Commit and push to GitHub frequently throughout all work — after completing each meaningful unit of work (a new feature, a bug fix, a refactor, a config change). Never leave significant progress uncommitted. Commit messages must be clean and descriptive: summarise *what* changed and *why* in the subject line, using the imperative mood (e.g. `Add user auth`, `Fix off-by-one in pagination`, `Refactor API client to use fetch`). This ensures the full history is always recoverable from GitHub.
