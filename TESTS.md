# Language App test checklist

Automated tests live in `tests/` in this workspace, not in the GitHub repo. Scott feel-tests on the staging site; he does not need to read code.

## Automated (run after every change)

```
# from the french-app workspace
node tests/decks.test.js
# 4 tests, expect: 5 themes, 100 unique cards, starter text unchanged

node tests/config.test.js
# 3 tests, expect: live keys are language-app-v1, staging keys are language-app-staging-v1

node tests/migration.test.js
# copies old allonsy-* saves into the new keys once, leaves the old keys in place,
# and does not overwrite a new save or mix live progress into staging

# serve staging-upload under /language-app-staging/, then:
LANGUAGE_APP_URL=http://127.0.0.1:8780/language-app-staging/ node tests/staging-load.test.js
# 1 test, expect: STAGING banner, Language App title, language-app-staging-v1 storage and cache, 100 cards, no console errors

# serve both live-candidate and staging-upload under one origin, then:
node tests/cache-isolation.test.js
# 1 test, expect: each copy deletes only its own language-app cache prefix
# plus leftover allonsy-* caches; other apps' caches stay
```

## Staging load checks (automated or by hand)

- A yellow **STAGING** bar is clearly visible at the top.
- The heading says Language App.
- The browser console has no errors.
- Saved progress uses the `language-app-staging-v1` key (live uses `language-app-v1`).
- The service worker cache name is `language-app-staging-v1`.
- The app loads under a `/language-app-staging/` path (manifest `start_url` and `scope` are `./index.html` and `./`; script and service-worker paths are relative).
- Flashcards still show 5 themes and 100 cards.

## Feel-testing on staging (Scott, on the phone)

Open https://scottanium.github.io/language-app-staging/ (after it is uploaded)

- [ ] The yellow STAGING bar is at the top, and the name Language App is on the home screen.
- [ ] Open Greetings, flip a card, tap Again / Good / Easy, and hear the French with the speaker button.
- [ ] Take a short quiz and finish it.
- [ ] Check Progress: reviews and streak look right. If you already had Allons-y progress, it should still be there.
- [ ] Export a backup, then Import it back, and confirm it asks before replacing.
- [ ] Confirm the live app at https://scottanium.github.io/language-app/ still has its own progress (staging must not mix with live).

If any of those fail, do not go live.
