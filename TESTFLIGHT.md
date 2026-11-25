# Hot Take → TestFlight

The app already runs in Expo Go (see README). A real build adds the Apple Maps place search
module and the real app icon, and lets friends install without Expo Go.

| | |
| --- | --- |
| Bundle ID | `com.hottake.app` (change in `app.json` if you register a different one) |
| Display name | `Hot Take` |
| EAS project | `@chaikatz/hot-take` (`94b9399f-5d1e-4dfd-9e4c-565cb1caa52d`) |
| Build number | managed by EAS (`appVersionSource: remote`, `autoIncrement: true`) |
| Supabase env | already set in EAS for development, preview and production |

## Steps

1. **Apple Developer** → Identifiers → register `com.hottake.app` (or let EAS do it in step 3).
2. **App Store Connect** → My Apps → **+** → New App → iOS, name "Hot Take" (if taken, e.g.
   "Hot Take: Real Opinions"), bundle ID `com.hottake.app`, SKU `hottake`.
3. On your computer, in this folder:

   ```bash
   npm install
   eas login
   eas build --platform ios --profile production
   ```

   Let EAS create the distribution certificate and provisioning profile.
4. Submit:

   ```bash
   eas submit --platform ios --latest
   ```

5. App Store Connect → Hot Take → **TestFlight** → add yourself under Internal Testing, then
   install from the TestFlight app. For friends: create an External Testing group (needs a short
   Beta App Review the first time) and share the public link.

## Before TestFlight friends sign up

- The production profile sets `EXPO_PUBLIC_ALLOW_TEST_LOGIN=0`, so production builds only accept
  **real SMS codes**. Turn on Supabase phone auth + Twilio first (README → "Turn on real SMS").
  For a quick internal test before SMS works, build the `preview` profile instead
  (`eas build --platform ios --profile preview`), which keeps tester sign-in.

## Before App Store review (not TestFlight blockers)

- Privacy policy URL and privacy nutrition labels (phone number, name, photos, user content,
  coarse location used only for "near me").
- Terms are in-app (shown at sign-up and in Settings) — have a lawyer review `src/legal/terms.ts`.
- Report, block and in-app account deletion are already built.
