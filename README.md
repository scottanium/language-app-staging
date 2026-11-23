# Language App

A phone-friendly web app (PWA) that helps a native English speaker learn practical French with flashcards, quizzes, and on-device French text-to-speech. Progress stays on the device. You can export or import a backup. Daily goals and streaks use Indianapolis time (Eastern).

This app was first published as Allons-y. The name and web address are now Language App. Read this file first before changing anything.

## URLs

- Live: https://scottanium.github.io/language-app/
- Staging (test copy, not uploaded yet): https://scottanium.github.io/language-app-staging/

The previous addresses were https://scottanium.github.io/allons-y/ and https://scottanium.github.io/allons-y-staging/. Staging shows a yellow **STAGING** bar at the top. It uses its own saved progress and its own offline cache, so trying the test site will not change or mix with the live app.

Live and staging share the `github.io` origin, so `localStorage` is shared across paths. On first load, if the new save key is empty and an old Allons-y key has data, that data is copied into the new key and the old key is left in place. Live copies `allonsy-v1` to `language-app-v1`. Staging copies `allonsy-staging-v1` to `language-app-staging-v1`.

## Folders

- `data/decks.js` — all themes and cards (content). Add or edit cards here.
- `config.js` — staging flag, version, timezone, daily goal, quiz length, storage key, and cache name.
- `srs.js` — saving, streaks, the spaced-repetition schedule, and the one-time save-key migration.
- `study.js` and `quiz.js` — the flashcard session and the quiz.
- `speech.js` — French text-to-speech.
- `app.js` — screens, buttons, export and import. Do not put new card text in this file.
- `style.css` — look and layout.
- `staging-upload/` — staging package (`STAGING: true`). Upload this to the staging repo only when a staging push is allowed.
- `live-candidate/` — the same files with `STAGING: false`. Do not upload while live pushes are on hold.
- `upload/` — snapshot of the original live v1 publish under the Allons-y name. Keep as history; do not treat it as the current source of truth.
- `tests/` — automated tests. Not part of the GitHub Pages repo.
- `restore-points/` — dated snapshots to roll back a change.

When you change the app, edit the files in this folder, then copy them into `staging-upload/` and `live-candidate/`, keeping the files the same except `config.js` (`STAGING` true vs false). Then rerun the tests in `TESTS.md`.

## How to change common things

- **Switch staging vs live:** in `config.js`, set `STAGING` to `true` (test site) or `false` (live site). That one flag controls the banner, the save key (`language-app-staging-v1` vs `language-app-v1`), and the service-worker cache name. `APP_SLUG` is `language-app`.
- **Add or change cards and themes:** `data/decks.js`. Keep 20 cards per theme unless you also update the tests. Each card needs `id`, `theme`, `fr`, `en`, and `speak`. Nouns should include `gender` (`m` or `f`). Optional `note` is shown on the card.
- **Daily goal, quiz length, timezone, or version:** `config.js`. After changing `VERSION`, bump so the cache name changes and phones pick up the new files.
- **Look and layout:** `style.css`.
- **On-screen wording and flow:** `app.js` and `index.html`.
- **Icons and the Home Screen name:** `icon-192.png`, `icon-512.png`, and `manifest.json`. Keep `start_url` and `scope` as relative paths (`./index.html` and `./`) so the app works under both `/language-app/` and `/language-app-staging/`.

## What not to touch

- Do not put passwords, keys, or tokens in these files, in commits, or on GitHub. This app has none, and it should stay that way.
- Do not point staging at the live save key (`language-app-v1`) or the live cache name (`language-app-v1`).
- Do not remove the one-time migration from the old `allonsy-v1` / `allonsy-staging-v1` keys, and do not delete those old keys after a copy.
- The staging banner, cache-name rule, and cache cleanup follow the copy-paste snippets in `/workspace/pwa-shared-snippets/` (each app stays self-contained; do not import that folder at runtime).
- The service worker must only delete caches in its own family (`language-app-staging-` on staging, `language-app-` but not `language-app-staging-` on live), plus leftover `allonsy-*` caches from the old name. Live and staging share the `github.io` origin, so a cleanup that deletes every other cache will wipe the other copy and any other app on that origin.
- Do not change live https://scottanium.github.io/language-app/ until Scott has tried staging and approved going live on Keel’s list. All live pushes are currently on hold. Further builds stay off live until Scott says yes.
- Do not rewrite whole files for a small fix. Name the file or section, change only that part, and keep a restore point first.
- Do not add accounts, outside libraries, or server-side audio. Speech stays on the device.

## Staging vs live workflow

1. Change files here, then refresh `staging-upload/` with `STAGING: true` in `config.js`.
2. Open the staging URL on a phone and feel-test (see `TESTS.md`).
3. After approval to go live, publish the `live-candidate/` files (`STAGING` already `false`) to the live site.

## Tests

See `TESTS.md`. Run them after every change.
