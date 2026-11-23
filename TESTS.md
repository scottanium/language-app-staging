# Allons-y test checklist

Automated tests live in `tests/` in this workspace, not in the GitHub repo. Scott feel-tests on the staging site; he does not need to read code.

## Automated (run after every change)

```
# from the french-app workspace
node tests/decks.test.js
# 4 tests, expect: 5 themes, 100 unique cards, starter text unchanged

node tests/config.test.js
# 3 tests, expect: live keys stay allonsy-v1, staging keys are prefixed

# serve staging-upload under /allons-y-staging/, then:
ALLONSY_URL=http://127.0.0.1:8780/allons-y-staging/ node tests/staging-load.test.js
# 1 test, expect: STAGING banner, allonsy-staging-v1 storage and cache, 100 cards, no console errors

# serve both live-candidate and staging-upload under one origin, then:
node tests/cache-isolation.test.js
# 1 test, expect: each copy deletes only its own cache prefix; other apps' caches stay
```

Live storage and cache names must stay `allonsy-v1` so existing progress is not left behind.

## Staging load checks (automated or by hand)

- A yellow **STAGING** bar is clearly visible at the top.
- The browser console has no errors.
- Saved progress uses the `allonsy-staging-v1` key (live uses `allonsy-v1`).
- The service worker cache name is `allonsy-staging-v1`.
- The app loads under a `/allons-y-staging/` path (manifest `start_url` and `scope` are `./index.html` and `./`; script and service-worker paths are relative).
- Flashcards still show 5 themes and 100 cards.

## Feel-testing on staging (Scott, on the phone)

Open https://scottanium.github.io/allons-y-staging/ (after it is uploaded)

- [ ] The yellow STAGING bar is at the top.
- [ ] Open Greetings, flip a card, tap Again / Good / Easy, and hear the French with the speaker button.
- [ ] Take a short quiz and finish it.
- [ ] Check Progress: reviews and streak look right.
- [ ] Export a backup, then Import it back, and confirm it asks before replacing.
- [ ] Confirm the live app at https://scottanium.github.io/allons-y/ still has its own progress (staging must not mix with live).

If any of those fail, do not go live.
