# Hot Take → TestFlight

The app already runs in Expo Go (see README). A real build adds the Apple Maps place search
module and the real app icon, and lets friends install without Expo Go.

| | |
| --- | --- |
| Bundle ID | `com.chaikatz.hottake` (change in `app.json` if you register a different one) |
| Display name | `Hot Take` |
| EAS project | `@chaikatz/hot-take` (`94b9399f-5d1e-4dfd-9e4c-565cb1caa52d`) |
| Build number | managed by EAS (`appVersionSource: remote`, `autoIncrement: true`) |
| Supabase env | already set in EAS for development, preview and production |

## Steps

1. **Apple Developer** → Identifiers → register `com.chaikatz.hottake` (or let EAS do it in step 3).
2. **App Store Connect** → My Apps → **+** → New App → iOS, name "Hot Take" (if taken, e.g.
   "Hot Take: Real Opinions"), bundle ID `com.chaikatz.hottake`, SKU `hottake`.
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

- During the TestFlight phase the production profile keeps tester sign-in available
  (`EXPO_PUBLIC_ALLOW_TEST_LOGIN=1`); it only works while `private.settings.tester_code` exists,
  so the real switch is server-side. Before the App Store launch set it to `0` in `eas.json`
  and delete the tester code.

## Before App Store review (not TestFlight blockers)

- Privacy policy URL and privacy nutrition labels (phone number, name, photos, user content,
  coarse location used only for "near me").
- Terms are in-app (shown at sign-up and in Settings) — have a lawyer review `src/legal/terms.ts`.
- Report, block and in-app account deletion are already built.
