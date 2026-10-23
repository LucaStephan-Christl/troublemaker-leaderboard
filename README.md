# 🏆 Troublemaker-Board

Das Büro-Troublemaker-Leaderboard als Web-App: Fälle melden, von einer anderen Person im **Tribunal** bestätigen lassen, und eine ziemlich animierte Rangliste kürt den/die **Troublemaker:in** des Monats.

Plan, Regeln und Datenmodell: [PLAN.md](PLAN.md)

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Motion · Drizzle ORM · Neon Postgres · Vercel

## Seiten

| Route | Was |
|---|---|
| `/` | Rangliste mit Podium, animierten Rangwechseln, Überhol-Konfetti (Woche / Monat / Gesamt) |
| `/melden` | Fall melden: Täter:in (Namenssuche + Roulette 🎰), Opfer, Kategorie (Suche oder neu anlegen), Notiz |
| `/tribunal` | Offene Fälle per Swipe oder ← → bestätigen/ablehnen, eigene Fälle im Blick |
| `/insights` | Hall of Shame: Fall aller Zeiten, Opfer des Monats, Rivalen-Duell, Heatmap, Punkte-Rennen, Abzeichen |
| `/tv` | Vollbild-Modus für den Büro-Bildschirm (rotiert automatisch) |

## Spielregeln

- **Keine Accounts.** Beim ersten Besuch wählt man seinen Namen (Ehrensache, wird im Browser gemerkt). Wechseln über den Button oben rechts.
- Ein Fall braucht **eine Bestätigung** einer *anderen* Person, um zu zählen. **Zwei Ablehnungen** kippen ihn.
- Wer einen Fall gemeldet hat und wer abgestimmt hat, wird nie angezeigt (die API liefert es gar nicht aus).
- Bestätigt der/die Beschuldigte den Fall selbst, ist das ein **Geständnis** (+10 % Punkte).
- Maximal 10 Meldungen pro Person und 24 h.
- Kategorien gibt es nur, wenn jemand sie in der App anlegt (Name, Emoji, 1–10 Punkte). Beim Melden lassen sie sich durchsuchen; findet die Suche nichts, kann man den Suchbegriff direkt als neue Kategorie anlegen. Die Demo-Kategorien stehen nur im Dev-Seed.
- Ton ist standardmäßig aus (🔇 oben rechts) – alle Sounds werden live synthetisiert.

## Team anpassen

1. `src/config/coworkers.ts` – echte Namen eintragen (die `id` danach nicht mehr ändern, sie steht in der DB).
2. Profilbilder: Datei in `public/avatars/` legen (z. B. `anna.jpg`) und im Eintrag `photo: "/avatars/anna.jpg"` setzen. Ohne Foto wird das Emoji gezeigt.

## Lokal starten

```bash
npm install
npm run dev
```

Ohne `DATABASE_URL` läuft lokal ein eingebettetes Postgres (PGlite, Daten in `.data/`, gelöscht mit `npm run db:reset-local`) – keine Installation nötig.
Fake-Daten (inkl. Demo-Kategorien) für Tests/Screenshots: `curl -X POST localhost:3000/api/dev/seed` (nur in Entwicklung verfügbar).

```bash
npm test          # Regeln (Vitest)
npm run lint
npm run build
```

## Deployment (Vercel + Neon)

1. Repo bei Vercel importieren (Framework: Next.js, keine Einstellungen nötig).
2. Im Vercel-Projekt unter **Storage → Neon (Marketplace)** eine Postgres-Datenbank hinzufügen. Das setzt `DATABASE_URL` automatisch.
3. Deployen. `npm run build` führt vorher die Migrationen aus `drizzle/` aus (`scripts/migrate.mts`).

Schema ändern: `src/db/schema.ts` anpassen → `npm run db:generate` → die neue SQL-Datei in `drizzle/` mit committen.

> Die Seite hat keinen Passwort-Schutz (Entscheidung: reine Ehrensache) und ist per `noindex` von Suchmaschinen ausgeschlossen. Wer die URL kennt, kann mitspielen. Wenn das mal stört: Vercel „Deployment Protection“ oder ein Passcode in einer Middleware.
