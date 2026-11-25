# Hot Take 🔥

**AI powered only by real human opinions.**

Verified real people post hot takes — a 0.0–10.0 rating, a short opinion and photos — on
restaurants, dishes, films, anything. Everyone else explores them on a feed, a map, and an AI
chatbot that answers only from what members have posted.

iOS-first, built with Expo + Supabase (same setup as Vintage). See [SPEC.md](SPEC.md) for the
spec and [CLAUDE.md](CLAUDE.md) for how the code is organised.

## Try it on your iPhone (2 minutes, no build)

1. Install **Expo Go** from the App Store.
2. Open this link on the iPhone (or scan its QR code with the Camera app):

   `exp://u.expo.dev/94b9399f-5d1e-4dfd-9e4c-565cb1caa52d?channel-name=preview&runtime-version=exposdk:58.0.0`

   It always loads the newest version published to the `preview` channel.
3. **I have an invite code** → enter a founder invite code (ask Chai) → your phone number →
   the **tester code** (SMS isn't switched on yet, so the app falls back to tester sign-in) →
   your name → real name or Anonymous → agree → you're in, with 5 invites of your own.

What works in Expo Go: everything, except that place search uses OpenStreetMap instead of Apple
Maps (the Apple Maps module needs a real build — see TESTFLIGHT.md).

### Publish a new version to phones

```bash
npm install
eas update --branch preview --environment preview --message "what changed"
```

Everyone on the link above gets it the next time they open the app (Expo Go: pull down to reload).

### Run from your computer instead

```bash
npm install
npm run phone          # scan the QR code in the terminal with your iPhone (same Wi-Fi)
```

## Backend

Supabase project `pwlfjesboijlxnfinbnf`. Everything lives in `supabase/`:

- `migrations/` — tables, row level security, and the SQL functions the app calls.
- `functions/ask` — the Hot Take AI (Claude, called only from here).
- `functions/test-login` — temporary tester sign-in while SMS is off.
- `functions/delete-account` — in-app account deletion (Apple requirement).

### Turn on the real AI

Until `ANTHROPIC_API_KEY` is set, the chatbot runs in **basic mode**: it still answers only from
takes, but lists the best matches instead of writing an answer. To switch Claude on:
Supabase dashboard → Edge Functions → Secrets → add `ANTHROPIC_API_KEY`.

### Turn on real SMS codes

Supabase dashboard → Authentication → Sign In / Providers → Phone → enable, and connect Twilio
(or another SMS provider). The app uses real SMS automatically once it works. Then switch tester
sign-in off:

```sql
delete from private.settings where key = 'tester_code';
```

### Invite codes

Each member gets 5. To mint founder codes (no inviter):

```sql
select private.mint_invites(null, 10);
select code from public.invites where inviter_id is null and used_at is null;
```
