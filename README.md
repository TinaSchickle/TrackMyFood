# TrackMyFood

PWA zum Tracken von Essen und Beobachtungen für Tina und Pascal (React + Vite + Supabase, Deployment über GitHub Actions nach GitHub Pages).

## Einrichtung
1. `supabase-setup.sql` im Supabase-SQL-Editor ausführen.
2. Repo-Secrets `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` anlegen (Settings → Secrets and variables → Actions).
3. Settings → Pages → Source: **GitHub Actions**.
4. Lokal: `.env.example` nach `.env.local` kopieren, `npm install`, `npm run dev`.

Datum und Uhrzeit werden als deutsche Ortszeit (Europe/Berlin) gespeichert.
