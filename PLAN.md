# 🏆 Mobbing Leaderboard — Plan & Tech Stack

A joke web app that replaces the office whiteboard: coworkers submit "mobbing incidents"
(harmless office pranks and bullying-as-a-bit), one other coworker has to confirm each one,
and a very animated leaderboard crowns the **Mobbing-König:in**.

> Tone: Schadenfreude, not actual harm. Incident types are curated by us (see below), every
> incident needs a second person's OK, and anything that's not funny can be rejected.

---

## 1. Core rules

| Rule | Decision |
|---|---|
| Accounts | None. Coworkers are hardcoded in `src/config/coworkers.ts`. |
| "Who am I?" | First visit: pick your name from a list (stored in `localStorage` + cookie). Honor system, plus an optional shared team passcode (`SITE_PASSCODE` env var) so outsiders can't open the site. |
| Submitting | Pick **who did it** (the "Täter:in"), pick a **category** (fixed point value), optional **victim**, optional one-line description. |
| Approving | **One** other coworker confirms → incident becomes *committed* and points count. Approver ≠ submitter. |
| Rejecting | **Two** rejections (≠ submitter) → incident is thrown out ("Verfahren eingestellt"). |
| Anonymity | The submitter and the approver are stored (needed for the rules) but **never** returned by any API. UI only says "ein:e Kolleg:in hat bestätigt". |
| Self-incidents | You can't accuse yourself (boring). The accused *may* approve their own incident → "Geständnis" bonus (+10 %). |
| Spam protection | Max N submissions per person per day (server-side, keyed on the picked identity + IP hash). |
| Seasons | Leaderboard has views: *Diese Woche / Dieser Monat / Gesamt*. Monthly winner gets archived in the Hall of Fame. |

## 2. Pages & features

### `/` — The Leaderboard (the star)
- Podium for top 3 with gold/silver/bronze glow, crown 👑 on #1 with sparkles; last place gets a halo 😇 ("Gutmensch des Monats").
- Rows re-order with **animated layout transitions** when points change; points **count up**.
- Overtaking someone triggers confetti + airhorn + a toast: *"Jonas überholt Sarah!"*
- Period toggle (week / month / all-time), live refresh via polling.
- Live ticker at the bottom with the latest committed incidents.

### `/submit` — Incident einreichen
- Step-by-step flow with big tappable category cards (emoji + points, e.g. "🪑 Stuhl versteckt — 5 Pkt").
- Täter:in picker as a **slot-machine / roulette** reel (can also tap directly).
- On submit: a "ZUR PRÜFUNG VORGELEGT" rubber stamp slams onto the screen.

### `/tribunal` — Das Tribunal (approvals)
- Tinder-style **swipe cards** of pending incidents (not your own): swipe right = ✅ bestätigt, left = ❌ abgelehnt.
- Stamp slam + screen shake + sound on approval. Buttons as fallback for desktop/a11y.
- Badge with the number of open cases in the nav.

### `/insights` — Hall of Shame & Statistiken
- 🥇 **Highest-point incident** ever, incident of the week.
- 🎯 **Opfer des Monats** (most-targeted coworker), 🔥 **Serientäter** (longest streak of consecutive days).
- ⚔️ **Rivalry duel**: the pair with the most incidents between them (head-to-head bar).
- 📊 Category breakdown (bar/donut), 🗓️ weekday × time heatmap ("Montags 9 Uhr ist Hochsaison").
- 📈 Points race: animated line/bar-chart-race over time.
- 🏅 Auto-awarded **badges** (e.g. "Erstes Blut", "Hattrick" = 3 in one day, "Unantastbar" = zero incidents this month).
- Per-person profile drawer: totals, favorite category, nemesis.

### `/tv` — Büro-Bildschirm Modus
- Fullscreen, auto-rotating slides (leaderboard → latest incidents → insight of the day), huge type, live updates. Perfect for the screen next to the old whiteboard.

### Easter eggs
- Konami code → "Boss Mode" (everyone's points flip to negative for 5 seconds).
- Clicking the crown → airhorn. Sound is **off by default** (mute toggle, remembered locally).

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | First-class Vercel support, server actions / route handlers, one repo for UI + API. |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (Radix) | Fast to build, accessible primitives, easy theming (dark "arena" look). |
| Animation | **Motion** (`motion/react`, ex-Framer Motion) | Layout animations for rank changes, drag gestures for swipe cards, springs. |
| Effects | `canvas-confetti`, small custom SVG/CSS (stamps, sparkles), **`use-sound`** (Howler) for sound effects | Cheap, lightweight, funny. |
| Charts | **Recharts** (or visx if we need the bar-chart race) | Simple, React-native, themeable. |
| Database | **Neon Postgres** (Vercel Marketplace integration) | Free tier, one-click on Vercel, real SQL for the insights/aggregations. |
| ORM | **Drizzle ORM** + `drizzle-kit` migrations | Typed, light, great with serverless/Neon. |
| Data fetching | **SWR** polling every ~5 s (leaderboard / tribunal / tv) | Works great on serverless, no websocket infra. Can upgrade to Pusher/Ably later if we want true realtime. |
| Validation | **Zod** | Shared schemas for forms + API. |
| Rate limiting | Simple DB-based counter (or Upstash Ratelimit if needed) | Avoid extra services unless necessary. |
| Tests | **Vitest** (scoring/rules logic) + **Playwright** (smoke test of submit → approve flow) | The rules engine is the part worth testing. |
| Tooling | pnpm, ESLint, Prettier | |
| Hosting | **Vercel** (+ Neon for DB) | As requested. Env vars: `DATABASE_URL`, `SITE_PASSCODE`, `IP_HASH_SALT`. |

## 4. Data model (Drizzle / Postgres)

Hardcoded in code (no tables): **coworkers**, **categories** (id, label, emoji, points).

```
incidents
  id              uuid pk
  accused_id      text        -- coworker id (from config)
  victim_id       text null   -- optional
  category_id     text        -- from config
  points          int         -- snapshot of category points at submit time
  note            text null   -- max ~140 chars
  submitted_by    text        -- coworker id; NEVER exposed via API
  status          enum('pending','committed','rejected')
  confessed       bool        -- accused approved their own incident
  created_at      timestamptz
  decided_at      timestamptz null

votes
  id              uuid pk
  incident_id     uuid fk
  voter_id        text        -- NEVER exposed via API
  verdict         enum('approve','reject')
  created_at      timestamptz
  unique (incident_id, voter_id)

badges_awarded     -- optional; can also be computed on the fly
  coworker_id, badge_id, period, awarded_at
```

Leaderboard = `SUM(points)` of `committed` incidents grouped by `accused_id`, filtered by period.
All "insights" are SQL aggregations / derived in a `lib/insights.ts` module.

## 5. Project structure

```
src/
  app/
    (site)/page.tsx            # leaderboard
    submit/page.tsx
    tribunal/page.tsx
    insights/page.tsx
    tv/page.tsx
    api/…                      # route handlers (incidents, votes, leaderboard, insights)
  components/                  # Podium, LeaderboardRow, SwipeCard, Stamp, Confetti, …
  config/
    coworkers.ts               # hardcoded team
    categories.ts              # incident types + points
  db/                          # drizzle schema, client, migrations
  lib/
    rules.ts                   # approve/reject logic (pure, unit-tested)
    insights.ts                # stats & badges
    identity.ts                # "who am I" cookie helpers + passcode check
```

## 6. Milestones

1. **Foundation** — Next.js + Tailwind + shadcn scaffold, theme, nav, coworker/category config, Drizzle + Neon schema & migrations.
2. **Core loop** — identity picker, submit flow, tribunal (approve/reject), rules engine + tests, basic leaderboard.
3. **Animation pass** — podium, animated rank changes, count-up, confetti/overtake toast, stamps, swipe cards, sound toggle.
4. **Insights** — Hall of Shame cards, rivalry duel, heatmap, category chart, badges, profile drawer.
5. **TV mode & polish** — `/tv`, easter eggs, mobile polish, a11y (`prefers-reduced-motion` turns off the heavy animations).
6. **Deploy** — GitHub push, Vercel project, Neon integration, env vars, seed demo data for the first screenshot.

## 7. Open questions (defaults in bold)

1. **Coworker names** — need the list (name, optional emoji/nickname; photos optional).
2. **Language** — **German UI** (matches the joke) or English?
3. **Category list** — I'll propose ~12 funny starter categories with points; you tweak them.
4. **Identity** — **honor system + shared passcode** (no accounts) — OK, or do you want a per-person PIN so nobody can approve "as someone else"?
5. **Database** — **Neon Postgres via Vercel** OK?
6. **Realtime** — **polling every few seconds** is enough, or do you want true live push?
