# activity-card

> Digital name card + collab-match wall for in-person events.
> Built for AI MEETS HER (femcode collective, Tokyo 2026) — generalised for future events.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- **GitHub Issues as data backend** — each card = one Issue with `card` label, body = JSON payload
- Vercel deploy

## Visual

Retro cyberpunk / Y2K — pure black bg, hot-pink (#E47BA8) with grain noise, Anton display + JetBrains Mono. Mirrors event poster.

## Backend setup

Cards are stored as Issues in a separate public repo: <https://github.com/Jada-Q/activity-card-data>

To set up your own data repo:

1. `gh repo create <owner>/<your-data-repo> --public --add-readme`
2. `gh label create card --repo <owner>/<your-data-repo> --description "A digital name card row" --color "E47BA8"`

## Local dev

1. Make sure `gh auth status` shows you logged in with `repo` scope
2. Copy env:

   ```bash
   GH_T=$(gh auth token)
   printf 'GITHUB_TOKEN=%s\nGITHUB_REPO=Jada-Q/activity-card-data\n' "$GH_T" > .env.local
   ```

3. `pnpm install && pnpm dev` → <http://localhost:3021>

## Routes

- `/` — Landing (poster-style hero + 2 CTAs)
- `/create` — Form to submit a digital name card
- `/people` — Card wall with search + tag filter (auto-revalidates every 10s)

## Deploy

```bash
cd /path/to/activity-card && vercel --prod
```

In Vercel project settings → Environment Variables, add:
- `GITHUB_TOKEN` — a fine-grained PAT scoped to the data repo (Issues: Write). Don't use your full-scope CLI token in prod.
- `GITHUB_REPO` — e.g. `Jada-Q/activity-card-data`

## Known limits

- **List-after-create eventual consistency**: GitHub's labelled-issue list endpoint takes 3-5s to index newly created issues. The `/create` page holds a success state for 3.5s before redirecting to `/people` so users land on a populated wall.
- **Rate limit**: 5000 requests/hour per token. A 50-person event with frequent refreshes is comfortably under.

## Transferring ownership (post-event)

1. **Data repo** (`activity-card-data`): GitHub Settings → Transfer ownership to organiser, or grant them admin and remove yourself
2. **App repo** (`activity-card`): same
3. **Vercel project**: Settings → Transfer Project (organiser must have a Vercel account)
4. Organiser creates her own fine-grained PAT on her data repo, updates Vercel `GITHUB_TOKEN` env var
