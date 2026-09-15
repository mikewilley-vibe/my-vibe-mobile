# My Vibe integrations

My Vibe is the personal hub. Sibling apps stay independent. This file is the contract for pieces that are live in the app versus waiting on an external API, URL, or credential.

## Live now

| Source | How it shows up | Data |
| --- | --- | --- |
| Personal / My Vibe | Calendar month grid | Saved plans on this device (`src/store.ts`) |
| Google Calendar | Calendar Family embed + native month grid | Device calendars via `expo-calendar`; family embed via `EXPO_PUBLIC_GOOGLE_CALENDAR_EMBED_URL` |
| ShowSignal | Shows tab; saved concerts on the month grid as source `showsignal` | Existing `POST /api/v1/ticketmaster/events` |
| UVA Sports | UVA tab (unchanged schedule/results) **and** Calendar month grid | Existing `GET /api/uva/football` and `GET /api/uva` on `EXPO_PUBLIC_API_BASE_URL` |

Launch opens **Calendar**. Family Google Calendar is the first section; the native multi-source month grid (formerly the Home hero) is reused below it from `src/HomeMonthCalendar.tsx`. Apps and projects live on **My Projects**. The Home route is hidden from the tab bar but kept as an importable module.

## Calendar sources

Normalized events are `MonthEvent` objects (`src/monthGrid.ts`) with a required `source`:

`personal` | `google` | `showsignal` | `uva-sports` | `sweatshift`

`src/calendarMerge.ts` is the only merge path. Calendar does not treat every item as the same kind internally. Compact source chips under the grid toggle visibility (stored in AsyncStorage key `my-vibe:calendar-sources:v1`). That is a settings hook, not a full Settings screen.

HapsHere is reserved as a later calendar source. It is an app link today, not a feed.

## UVA sports on the month calendar

Reuse the existing mikewilley.app feeds. Do not hard-code a season in UI components.

Catalog: `src/uvaSports.ts` (`UVA_SPORT_CATALOG`).

**Enabled today:** Football, Men's Basketball.

**Catalogued, not fetched:** Baseball, Women's Basketball, Lacrosse, Soccer. Their `feedPath` values are the expected mikewilley.app paths when those feeds exist. They are `enabled: false` so My Vibe will not call them or pretend they are live.

To add a sport:

1. Confirm the feed exists and returns the game shape below.
2. Set that catalog row to `enabled: true` (or append a new row).
3. The month grid and merge layer pick it up. Extend the UVA tab sections if you want the same sport listed there.

Game fields (shown only when present): headline `UVA vs Opponent` (home/neutral) or `UVA at Opponent` (away); date; start time; home/away; venue; TV/network; sport. Midnight Eastern (or a `YYYY-MM-DD` date, or `timeUnknown` / `kickoffTbd` on the payload) is treated as time TBA — the grid will not invent a kickoff or a network.

Expected feed item (already used by the UVA tab, with optional extras):

```json
{
  "id": "string",
  "opponent": "Duke",
  "date": "ISO-8601",
  "location": "home | away | neutral",
  "result": "win | loss | pending",
  "note": "Location: John Paul Jones Arena",
  "sourceUrl": "https://...",
  "sport": "football",
  "venue": "Scott Stadium",
  "network": "ACCN",
  "timeUnknown": false
}
```

Pull-to-refresh on the UVA tab busts a 5-minute in-memory cache so Calendar and UVA stay on one schedule.

## SweatShift (not live)

SweatShift is an independent Expo HIIT timer. Its public privacy policy states workouts stay on-device; this repo has no SweatShift HTTP API.

My Vibe-side client: `src/sweatshift.ts`.

- If `EXPO_PUBLIC_SWEATSHIFT_API_BASE_URL` is unset (default), the client returns `status: "unconfigured"` and **zero workouts**. Nothing is faked as live.
- When SweatShift adds a public API, set that env var (no trailing slash, no secrets in the repo). The client will call:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/workouts` | Timed workouts to overlay on the month grid |
| GET | `/workouts/:id` | One workout (reserved; not called yet) |
| GET | `/workout-history` | History (reserved; not called yet) |

Documented JSON item: `{ "id", "title", "startsAt", "endsAt?", "notes?" }` or `{ "start", "end" }` aliases. Auth, if needed later, must be an env-driven header — do not hard-code credentials.

Native scheme used for “Open SweatShift”: `workouttimermobile://` (from the public SweatShift app.json). Optional `EXPO_PUBLIC_SWEATSHIFT_URL` if a website should be the fallback.

## HapsHere (app link, URL not bundled)

No HapsHere URL exists in this repository’s config. **My Apps** shows HapsHere as **URL needed**.

Set `EXPO_PUBLIC_HAPSHERE_URL` (https) and/or `EXPO_PUBLIC_HAPSHERE_SCHEME` to enable Open. Do not commit a guessed production host. Private GitHub is not linked from the project card.

Add another ecosystem app by appending `src/hubApps.ts` (`hubApps()`).

## My Projects

Data file: `src/projects.ts` (`PROJECTS`). Adding a project is appending an object: `name`, `description`, `type`, `status`, and optional public `url` / `githubUrl` / `appStoreUrl` / `image`. Types: Website, iOS App, Web App, Experiment, AI, Business. Status: Live, In Development, Archived.

Aliases still work: `shortDescription`, `category`, `website`, `github`, `appStore`. Concert Finder is the former name of ShowSignal — do not add a second card.

Never put a private repository URL on `github` / `githubUrl`.

## Verify locally

```sh
npm ci
npm run check    # tsc --noEmit && unit tests
```

There is no lint script in this package.

Manual: Calendar lands first with Family embed on top and the native month grid below; the grid still pages months and shows saved plans; Google events still appear when Calendar permission is granted; UVA games overlay with source “UVA Sports”; tapping a game shows known details only; My Projects tab lists catalog cards from `src/projects.ts`; HapsHere stays URL-needed unless env is set.
