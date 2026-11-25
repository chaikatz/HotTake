# Hot Take — notes for Claude

Read SPEC.md first. It is the source of truth for what gets built.

## Rules

- **Build one phase at a time.** Plan first, then build only that phase.
- **Nothing outside SPEC.md gets built without Chai's approval.** New ideas go in LATER.md.
- **The Claude API key never ships in the app.** It lives only in Supabase edge function
  secrets (`ANTHROPIC_API_KEY`) and is used only by `supabase/functions/ask`.
- Commit every time something works.

## Stack

- **App:** Expo SDK 58 + Expo Router + TypeScript (same setup as Vintage-Social). Routes in
  `app/`, everything else in `src/`. React Query for data, Reanimated for animation.
- **Native module:** `modules/hottake-places` — Apple MapKit place search (MKLocalSearch). Not in
  Expo Go; there `src/api/places.ts` falls back to Photon (OpenStreetMap) so the flow still works.
- **Backend:** Supabase project `pwlfjesboijlxnfinbnf` ("chaikatz's Project", us-west-2).
  - `supabase/migrations/` — schema, RLS, RPC functions. The spec's `users` table is `profiles`.
  - All reads that show an author go through SECURITY DEFINER functions (`take_cards`, etc.) so
    real names, phones and display choices never leave the DB except as the chosen display name.
  - Edge functions: `ask` (the Hot Take AI), `test-login` (tester sign-in), `delete-account`.
- **Env:** `.env` holds only public values (Supabase URL + anon key). Committed on purpose.

## Tester sign-in (temporary)

SMS isn't switched on in Supabase yet. When `signInWithOtp` fails with a provider error, the app
switches to tester mode and the `test-login` function accepts the shared tester code stored in
`private.settings` (key `tester_code`). Turn it off before launch:

```sql
delete from private.settings where key = 'tester_code';
```

and set `EXPO_PUBLIC_ALLOW_TEST_LOGIN=0` in the production profile in `eas.json` (it's 1 during the
TestFlight phase).

## Useful commands

```bash
npm run typecheck          # TypeScript
npm run phone              # Expo Go on your phone (same Wi-Fi)
eas update --branch preview --message "..."   # publish to Expo Go / builds on the preview channel
```
