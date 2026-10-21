(() => {
  "use strict";

  const gameId = String(window.UFO_GD_CONFIG?.gameId || "").trim();
  const SDK_URL = "https://html5.api.gamedistribution.com/main.min.js";
  let ready = false;
  let adActive = false;
  let pending = null;
  let loadTimer = 0;
  let preloading = false;
  let preloadFailed = false;

  function dispatch(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function available() {
    return ready && typeof window.gdsdk?.showAd === "function";
  }

  function setAdActive(active) {
    if (adActive === active) return;
    adActive = active;
    dispatch("ufo-gd-ad-state", { active });
  }

  function finish(request, succeeded = false) {
    if (!request || pending !== request) return;
    window.clearTimeout(request.startTimer);
    pending = null;
    setAdActive(false);
    // The SDK promise closing successfully is not proof of a watched reward.
    request.resolve(request.type === "rewarded" ? succeeded && request.rewarded : request.shown);
  }

  function disable() {
    ready = false;
    window.clearTimeout(loadTimer);
    if (pending) finish(pending, false);
    setAdActive(false);
    dispatch("ufo-gd-availability");
  }

  function preloadRewarded() {
    if (!available() || preloading || preloadFailed || pending ||
      typeof window.gdsdk.preloadAd !== "function") return;
    preloading = true;
    try {
      Promise.resolve(window.gdsdk.preloadAd("rewarded"))
        .catch(() => { preloadFailed = true; })
        .finally(() => { preloading = false; });
    } catch (_error) {
      preloading = false;
      preloadFailed = true;
    }
  }

  function onEvent(event) {
    switch (event?.name) {
      case "SDK_READY":
        window.clearTimeout(loadTimer);
        ready = true;
        dispatch("ufo-gd-availability");
        preloadRewarded();
        break;
      case "SDK_GAME_PAUSE":
        if (pending) {
          pending.shown = true;
          window.clearTimeout(pending.startTimer);
        }
        setAdActive(true);
        break;
      case "SDK_REWARDED_WATCH_COMPLETE":
        if (pending?.type === "rewarded") pending.rewarded = true;
        break;
      case "SDK_GAME_START": {
        const request = pending;
        if (request) {
          // Allow completion events delivered in this same SDK turn to settle.
          window.setTimeout(() => finish(request, true), 0);
        } else {
          setAdActive(false);
        }
        break;
      }
      case "SDK_ERROR":
        disable();
        break;
      case "AD_ERROR":
        if (pending) finish(pending, false);
        else setAdActive(false);
        break;
    }
  }

  function show(type) {
    if (!available() || pending || adActive) return Promise.resolve(false);
    return new Promise((resolve) => {
      const request = { type, resolve, rewarded: false, shown: false, startTimer: 0 };
      pending = request;
      setAdActive(true);
      // Only time out an ad that has not started. Never unpause under a playing ad.
      request.startTimer = window.setTimeout(() => {
        if (!request.shown) {
          finish(request, false);
          ready = false;
          dispatch("ufo-gd-availability");
        }
      }, 12000);
      try {
        const result = window.gdsdk.showAd(type);
        if (result && typeof result.then === "function") {
          result.then(() => finish(request, true), () => finish(request, false));
        }
      } catch (_error) {
        finish(request, false);
      }
    });
  }

  window.ufoRunGD = Object.freeze({
    isAvailable: available,
    isAdActive: () => adActive,
    showInterstitial: () => show("interstitial"),
    preloadRewarded,
  });
  window.ufoRunShowRewardedAd = ({ placement } = {}) => {
    if (!["continue", "shop-coins"].includes(placement)) return Promise.resolve(false);
    return show("rewarded");
  };

  // A missing ID must not prevent the independent game from starting.
  if (!gameId) return;
  window.GD_OPTIONS = {
    gameId,
    advertisementSettings: { locale: "en", debug: false, autoplay: false },
    onEvent,
  };
  const script = document.createElement("script");
  script.id = "gamedistribution-jssdk";
  script.src = SDK_URL;
  script.async = true;
  script.addEventListener("error", disable, { once: true });
  loadTimer = window.setTimeout(disable, 10000);
  document.head.append(script);
})();
