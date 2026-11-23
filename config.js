/* Language App environment and settings.
 * Live and staging use the same files. The only difference is STAGING:
 *   true  -> test site (banner, separate saves, separate cache)
 *   false -> live site
 * Safe in both the page and the service worker (no document access required).
 * Pattern copied from /workspace/pwa-shared-snippets/ (copy, not a runtime import).
 */
var AllonsyConfig = {
  STAGING: true,
  VERSION: "v1",
  APP_SLUG: "language-app",
  TZ: "America/Indianapolis",
  DAILY_GOAL_DEFAULT: 10,
  QUIZ_LENGTH: 10
};

AllonsyConfig.STORAGE_KEY = AllonsyConfig.STAGING
  ? AllonsyConfig.APP_SLUG + "-staging-" + AllonsyConfig.VERSION
  : AllonsyConfig.APP_SLUG + "-" + AllonsyConfig.VERSION;

AllonsyConfig.CACHE_NAME = AllonsyConfig.STAGING
  ? AllonsyConfig.APP_SLUG + "-staging-" + AllonsyConfig.VERSION
  : AllonsyConfig.APP_SLUG + "-" + AllonsyConfig.VERSION;

// Previous name was Allons-y. Keep these so existing progress can be copied once.
AllonsyConfig.OLD_STORAGE_KEY = AllonsyConfig.STAGING
  ? "allonsy-staging-" + AllonsyConfig.VERSION
  : "allonsy-" + AllonsyConfig.VERSION;

(function () {
  if (typeof document === "undefined") return;
  function applyStagingBanner() {
    if (!AllonsyConfig.STAGING) return;
    var banner = document.getElementById("stagingBanner");
    if (banner) banner.classList.remove("hidden");
    if (document.body) document.body.classList.add("is-staging");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyStagingBanner);
  } else {
    applyStagingBanner();
  }
})();
