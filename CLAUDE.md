# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

GitHub remote: `https://github.com/marinadruck/firstclaudeproject.git` (branch: `main`)

## Git Workflow

Every `git commit` automatically triggers a push to `origin/main` via a PostToolUse hook in `.claude/settings.json`. There is no need to run `git push` manually after committing.

Routine git operations (`add`, `commit`, `push origin`, `pull`, `fetch`, `checkout`, `switch`, `merge`, `stash`, `tag`) are pre-approved and will not prompt for permission. Destructive commands (`reset --hard`, `push --force`, `branch -D`, `clean`) always require explicit confirmation before running.

### Commit discipline

Commit and push to GitHub frequently throughout all work — after completing each meaningful unit of work (a new feature, a bug fix, a refactor, a config change). Never leave significant progress uncommitted. Commit messages must be clean and descriptive: summarise *what* changed and *why* in the subject line, using the imperative mood (e.g. `Add user auth`, `Fix off-by-one in pagination`, `Refactor API client to use fetch`). This ensures the full history is always recoverable from GitHub.
