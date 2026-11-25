# Hot Take — MVP spec

The MVP exists to prove one thing: 100 invited people in New York post takes weekly
without being paid. Everything below serves that test. Hot Take is Plan B behind Vintage,
so the scope is deliberately small.

## Brand and feel

- **Name:** Hot Take. Final. The chatbot is the Hot Take AI for now; its own name comes later.
- **Working tagline:** "AI powered only by real human opinions."
- **Name risk:** the App Store already has several similar names (HotTake: Sports Takes & Debates,
  HotTakes: No-Risk Sports Picks, Hot Take: Debate Party Game). Ship as "Hot Take" plus the tagline
  for now. Run a USPTO trademark search or ask a trademark attorney before spending on branding.
- **Feel:** loud and playful in colour, clean and premium in layout. Fun, with emojis.
- **References:** the clean chat feel of ChatGPT and Claude, mixed with the energy of Instagram and Snapchat.
- **Design bar:** as if an incredible designer built it for a Thrive portfolio company.
- **Simplicity first:** easy to use, nothing overcomplicated. When in doubt, cut.

## In scope for v1

- **Access:** invite only. A new user needs an invite code from an existing member. First invites go out in New York.
- **Sign-up:** phone number with SMS code, plus real name. One account per number. This is the "verified human" bar for the MVP.
- **Display choice:** each user chooses to appear under their real name or as Anonymous on their takes and in chatbot answers.
- **Post a take:** a subject (required), the take in up to 280 characters (required), a rating from 0.0 to 10.0 (required), up to 4 photos (optional), a location (optional).
- **Subjects:** a take can be about anything: a restaurant, a dish, a product, a film, an idea. When posting, the user searches existing subjects first so takes on the same thing land together, and creates a new subject only if none exists. Place subjects are found through Apple MapKit search.
- **Heat meter:** the rating control visibly heats up as the rating climbs. It should be the most satisfying thing in the app.
- **Spicy badge:** a take that lands far from the crowd gets a spicy badge. Default rule: 2 or more points away from the subject's average once the subject has 5 takes.
- **Feed:** newest takes first, with subject, rating, take and any photos.
- **Map:** pins for every subject that has a location. Tap a pin to open the subject page.
- **Subject page:** average rating, number of takes, all takes on that subject.
- **Chatbot (the Hot Take AI):** answers only from takes in the database, says whose take it is (real name or Anonymous, per that user's choice), and says "No takes on that yet" when there is nothing.
- **Agree / disagree:** one tap on any take. This is the fun and the argument.
- **Profile:** your takes and your take count.
- **Report and block:** report a take, block a user. Apple expects this for apps with user content.

## Out of scope for v1

- Paying users, ads, business accounts or anything paid.
- Followers, DMs, comments.
- Android and web.
- Open sign-up. Invite only until the base is strong.
- Stronger identity checks than a phone number and real name.

## Recommended stack

| Layer | Choice | Why |
| --- | --- | --- |
| iOS app | Same framework and project setup as Vintage (Expo + Expo Router) | Known TestFlight path |
| Backend | Supabase: auth, Postgres, storage, edge functions | Phone login, database and photo storage in one place |
| Place search | Apple MapKit search | Free, no extra account |
| Map | Apple MapKit | Native and free |
| AI | Claude API, called only from a Supabase edge function | Keeps the API key off the phone |
| Take retrieval | Plain SQL filters (area, keyword, rating) | No vector search needed until there are thousands of takes |

## Data model

| Table | Key fields |
| --- | --- |
| users (`profiles`) | id, phone, real_name, display_mode (real or anonymous), invited_by, created_at |
| invites | code, inviter_id, used_by, used_at |
| subjects | id, name, category, is_place, address, lat, lng (location fields optional) |
| takes | id, user_id, subject_id, rating, text, created_at |
| take_photos | id, take_id, storage_path, position |
| reactions | take_id, user_id, type (agree or disagree) |
| reports | id, take_id, reporter_id, reason, created_at |
| blocks | blocker_id, blocked_id |

## How the chatbot stays honest

1. The app sends the question, plus the user's location if they share it, to an edge function.
2. The function pulls candidate takes from the database using SQL only: by subject, keyword, category, rating and, for places, area.
3. It sends only those takes to the model, with a strict rule: answer from these takes alone, attribute each claim to its author's display name (real name or Anonymous) and rating, use no outside knowledge.
4. If no takes match, the function returns "No takes on that yet" without calling the model.
5. The response includes the take IDs so the app shows the actual takes as cards under the answer.

## Success test

- 100 invited users in New York posting weekly, unpaid.
- If that happens, release more invites. If not, fix the posting experience before anything else.
