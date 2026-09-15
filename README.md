# My Vibe mobile

A separate Expo SDK 57 + React Native + TypeScript + Expo Router companion. The existing Next.js web app is unchanged. No production deployment or database modification was performed.

## Open it on your Mac or iPhone

Dependencies are already installed in this folder. Double-click **Run in Simulator.command** to build and launch the iOS app. Double-click **Run on iPhone.command** with your iPhone connected and unlocked to select it and build. The first build installs native dependencies and can take several minutes.

On iPhone, enable Developer Mode when iOS requests it. For a physical-device build, Xcode needs your Apple account and a signing team. Use the generated **ios/MyVibe.xcworkspace** after CocoaPods installation; select the MyVibe target, then Signing & Capabilities and your team. The `.xcworkspace` is created by the first `npm run ios` / CocoaPods installation. The `.xcodeproj` and Podfile have already been generated. Bundle identifier: `app.mikewilley.myvibemobile`.

A development build is the intended path for calendar testing. After the first installation, double-click **Start My Vibe.command** to start Metro and open your installed My Vibe development app. Keep phone and Mac on the same Wi-Fi, or use the USB build workflow. Expo Go is not the acceptance-test target.

Terminal equivalents, from this folder:

```sh
npm ci               # only needed for a fresh checkout
npm run ios          # build and launch iOS Simulator
npm run iphone       # select a connected iPhone
npm run android      # Android Studio emulator or connected Android phone
npm start            # restart the development server after installation
npm run check        # TypeScript + calendar logic tests
```

Xcode is installed on this Mac. This Codex session could not connect to CoreSimulatorService, so native compilation, CocoaPods installation, signing, and real calendar writes have not been verified. If the simulator does not start, open Xcode and install an iOS runtime in Settings → Components. Android builds need Android Studio, a compatible JDK, and an emulator/device.

## First useful screens

- **Home:** native My Vibe branding, upcoming saved plans, Shows, and remaining personal shortcuts (HIIT Timer, family calendar & school links).
- **UVA:** native football and basketball upcoming games from the existing `/api/uva/football` and `/api/uva` feeds (next up, next five per sport, HOME/AWAY).
- **Shows:** real upcoming concerts from ShowSignal’s production Ticketmaster API; Hampton Roads, Richmond, and DC filters; original venue list; ticket links; save a show as a plan; **Open in ShowSignal** opens that concert in the ShowSignal app (`showsignal://concert/{id}`), or the ShowSignal website if the app isn’t installed.
- **My calendar:** month grid with saved My Vibe plans and Google events from calendars already on the device; day selection; Agenda WebView of the public Google Calendar embed; custom plans, editing and removal.
- **Plan details:** title, native date/time pickers, location and notes; separate local save and device-calendar export; **Add to Calendar** with Google calendars listed first; permissions/settings handling; verified “In Calendar” state.

Concert end times default to two hours and are explicitly presented for review. Dates retain an absolute instant and display in the device time zone. Date-only archived shows were not imported as timed events or presented as upcoming.

## Existing code and backend reuse

Inspected `mikewilley-vibe/my-vibe-app`, main commit `33cb8a7c70d4bad01adfc237f13d2051fb63837a` (see SOURCE.md for exact recorded revision). Source review included `app/page.tsx`, `app/shows/page.tsx`, `app/api/concerts/local/route.ts`, `lib/venueUpcoming.ts`, `lib/supabaseServer.ts`, existing data modules and style tokens.

Shows load from ShowSignal’s public `POST /api/v1/ticketmaster/events` endpoint (default `https://concert-finder-eta.vercel.app`; override with `EXPO_PUBLIC_SHOWSIGNAL_API_BASE_URL`). UVA still uses the existing mikewilley.app feeds via `EXPO_PUBLIC_API_BASE_URL`. Ticketmaster secrets stay on the ShowSignal server. `src/reused/concert.ts` and `src/reused/localVenues.ts` are copied from the web repository, with provenance in SOURCE.md. The original palette is retained. No API key is needed for these existing public endpoints. Expo web may be blocked by the API’s CORS; the native app is the intended client.

The existing Supabase client uses a **service role key on the server** for venue monitoring. It is intentionally not copied into the mobile app. There is no existing Supabase sign-in or per-user saved-calendar table in the inspected code. This version therefore stores plans and calendar-event links locally with AsyncStorage, independent of the web Google Calendar embed. It does not sync saved plans between devices or read the family calendar. Supabase venue monitoring continues to run unchanged on the web backend.

A future shared-save phase should first add Supabase Auth and a user-owned plans table with row-level security, then swap the local repository for authenticated sync. Keep device event identifiers local because they differ between devices. Do not expose the existing service role key or add unauthenticated database access to achieve mobile reuse.

## Calendar behavior and limits

Selecting a writable calendar confirms creation. Google-sourced device calendars (detected from `source.name` / `source.type` and common Gmail/Google patterns) are listed first and labeled clearly; other calendars remain available below. My Vibe saves the plan first, requests access for export and for reading Google events on the My calendar tab, writes title/start/end/location/notes and a source link, and stores the resulting native event ID. Concurrent taps share one operation. Before another write, it checks that ID; it also searches all readable calendars around the plan dates for a stable source marker, recovering from a failed local write after event creation. Explicit event-not-found errors allow re-adding; unknown read failures fail closed.

The My calendar tab also loads events from Google-sourced device calendars for the visible month via `expo-calendar` (no Google OAuth or Calendar API). If calendar permission is denied, saved My Vibe plans still show. An in-app Agenda WebView uses the public `calendar.google.com/.../calendar/embed` URL (override with `EXPO_PUBLIC_GOOGLE_CALENDAR_EMBED_URL`; see `.env.example`).

Status is rechecked when the detail screen opens and when the app returns to the foreground. Exported events are edited in the device calendar; the saved My Vibe copy remains separate. Removing a saved plan does not delete the device event, and its link is retained to prevent accidental re-addition of the same concert. Permission revocation produces an unknown state, not a false “In Calendar” state.

This is one-way export, not two-way sync. Duplicate recovery after losing local storage is limited to marker-bearing events near the original plan dates. Reinstallation plus an externally moved event or removed marker cannot be reliably deduplicated. Manually-created equivalent events are not automatically treated as the same plan.

## Validation completed

- TypeScript passes.
- Calendar-engine tests pass: parallel taps, existing ID across calendars, deleted event, failed-link persistence recovery, uncertain reads, and invalid date/title/range.
- Google calendar helper tests pass: source detection, Google-first sorting, choice labels, embed URL validation/override, and Agenda chrome params.
- Expo export passes for iOS, Android, and web.
- iOS and Android native project generation passes.
- The live deployed concert feed returns `ok: true` with real events.
- Browser smoke test: home loads, plan editor opens, title/location/notes save, and the plan remains after a reload.
- Original web checkout has no changes.

Still required on real devices: permission allow/deny/revoke, no writable calendar, chosen-calendar creation with field inspection, two rapid taps, relaunch with “In Calendar”, external event deletion and re-addition, and device time-zone/DST checks. No production calendar event was created during automated testing.
