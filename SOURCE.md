# Reused source

Repository: https://github.com/mikewilley-vibe/my-vibe-app
Branch inspected: main
Commit: 33cb8a7c70d4bad01adfc237f13d2051fb63837a
Inspected: 2026-09-13

Exact copies:
- `lib/concerts/types.ts` → `src/reused/concert.ts`
- `app/data/localVenues.ts` → `src/reused/localVenues.ts`

Adapted into native components:
- `app/page.tsx`: personal-home shortcuts and section purpose.
- `app/globals.css`: paper, ink, muted, harbor, fog, signal palette.

Reused without changing the server:
- ShowSignal `POST /api/v1/ticketmaster/events` (production `https://concert-finder-eta.vercel.app`), mapped to the existing Concert type.
- `/api/uva` (basketball) and `/api/uva/football` schedule endpoints on mikewilley.app. The native UVA tab filters to the next five upcoming games per sport, matching `app/uva/page.tsx`.

No server secret or Supabase service role credential is bundled.
