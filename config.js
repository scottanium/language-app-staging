/* Allons-y environment and settings.
 * Live and staging use the same files. The only difference is STAGING:
 *   true  -> test site (banner, separate saves, separate cache)
 *   false -> live site
 * Safe in both the page and the service worker (no document access required).
 */
var AllonsyConfig = {
  STAGING: true,
  VERSION: "v1",
  TZ: "America/Indianapolis",
  DAILY_GOAL_DEFAULT: 10,
  QUIZ_LENGTH: 10
};

AllonsyConfig.STORAGE_KEY = AllonsyConfig.STAGING
  ? "allonsy-staging-" + AllonsyConfig.VERSION
  : "allonsy-" + AllonsyConfig.VERSION;

AllonsyConfig.CACHE_NAME = AllonsyConfig.STAGING
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
