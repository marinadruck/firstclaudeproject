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

**API:** `src/app/api/stock/[ticker]/route.ts` — single `GET` endpoint. Currently returns mock data from `src/lib/mock-data.ts`. To connect real APIs, only this file needs to change; components are fully decoupled from the data source.

**Signal logic:** `src/lib/signals.ts` — pure `computeSignal(mentionCount, sentimentScore)` function. Thresholds are constants at the top; easy to tune. Currently: ≥ 100 mentions → High Attention, ≤ 20 → Low Attention, otherwise Watch.

**Mock data:** `src/lib/mock-data.ts` — five tickers pre-seeded (AAPL, TSLA, NVDA, MSFT, GME) each with 30-day price history and 5–8 headlines. Unknown tickers return `null` → 404.

**Types:** all shared interfaces live in `src/types/index.ts` (`StockData`, `Headline`, `PricePoint`, `Signal`).

## Git Workflow

Every `git commit` automatically triggers a push to `origin/main` via a PostToolUse hook in `.claude/settings.json`. There is no need to run `git push` manually after committing.

Routine git operations (`add`, `commit`, `push origin`, `pull`, `fetch`, `checkout`, `switch`, `merge`, `stash`, `tag`) are pre-approved and will not prompt for permission. Destructive commands (`reset --hard`, `push --force`, `branch -D`, `clean`) always require explicit confirmation before running.

### Commit discipline

Commit and push to GitHub frequently throughout all work — after completing each meaningful unit of work (a new feature, a bug fix, a refactor, a config change). Never leave significant progress uncommitted. Commit messages must be clean and descriptive: summarise *what* changed and *why* in the subject line, using the imperative mood (e.g. `Add user auth`, `Fix off-by-one in pagination`, `Refactor API client to use fetch`). This ensures the full history is always recoverable from GitHub.
