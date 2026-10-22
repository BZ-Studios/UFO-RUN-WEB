(() => {
  "use strict";
  const config = window.UFO_CRAZY_CONFIG;
  let sdk = null;
  let initialized = false;
  let adsEnabled = config.monetizationEnabled === true;
  let adActive = false;
  let adPending = false;
  let platformMuted = false;
  let playing = false;
  let loading = true;
  let initPromise = null;
  let lastRewardedAt = -Infinity;

  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const supported = () => initialized && ["local", "crazygames"].includes(sdk?.environment);
  const adsAvailable = () => supported() && adsEnabled && typeof sdk.ad?.requestAd === "function";

  function safely(call) {
    try {
      const result = call();
      if (result?.catch) result.catch(() => {});
    } catch (_error) { /* An unavailable portal must never stop the game. */ }
  }

  function applySettings(settings) {
    platformMuted = settings?.muteAudio === true;
    emit("ufo-crazy-audio", { muted: platformMuted });
  }

  function notifyGameplay(active) {
    const next = active === true && !adPending && !adActive;
    if (next === playing) return;
    playing = next;
    if (supported()) safely(() => next ? sdk.game.gameplayStart() : sdk.game.gameplayStop());
  }

  async function initialize() {
    if (initPromise) return initPromise;
    initPromise = new Promise((resolve) => {
      if (window.location.protocol === "file:") { resolve(false); return; }
      let finished = false;
      const finish = (ok) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        emit("ufo-crazy-availability");
        resolve(ok);
      };
      const timer = window.setTimeout(() => finish(false), 8000);
      const script = document.createElement("script");
      script.src = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
      script.async = true;
      script.id = "crazygames-jssdk";
      script.addEventListener("error", () => finish(false), { once: true });
      script.addEventListener("load", async () => {
        try {
          const candidate = window.CrazyGames?.SDK;
          if (!candidate || candidate.environment === "disabled") { finish(false); return; }
          await candidate.init();
          if (finished || !["local", "crazygames"].includes(candidate.environment)) { finish(false); return; }
          sdk = candidate;
          initialized = true;
          applySettings(sdk.game.settings);
          sdk.game.addSettingsChangeListener?.(applySettings);
          if (loading) safely(() => sdk.game.loadingStart());
          finish(true);
        } catch (_error) { finish(false); }
      }, { once: true });
      document.head.append(script);
    });
    return initPromise;
  }

  function requestAd(type) {
    if (!adsAvailable() || adPending || adActive) return Promise.resolve(false);
    return new Promise((resolve) => {
      adPending = true;
      notifyGameplay(false);
      emit("ufo-crazy-ad-state", { pending: true, active: false });
      let settled = false;
      const finish = (success) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(startTimer);
        adPending = false;
        adActive = false;
        if (success && type === "rewarded") lastRewardedAt = performance.now();
        emit("ufo-crazy-ad-state", { pending: false, active: false });
        emit("ufo-crazy-availability");
        resolve(success);
      };
      const startTimer = window.setTimeout(() => {
        if (!adActive) { adsEnabled = false; finish(false); }
      }, 12000);
      try {
        // v3's ad method still completes through callbacks. Its returned promise
        // means the request was sent, not that a rewarded video was completed.
        const result = sdk.ad.requestAd(type, {
          adStarted: () => {
            if (settled) return;
            adActive = true;
            window.clearTimeout(startTimer);
            emit("ufo-crazy-ad-state", { pending: true, active: true });
          },
          adFinished: () => finish(true),
          adError: (error) => {
            if (error?.code === "adsDisabledBasicLaunch") adsEnabled = false;
            finish(false);
          },
        });
        if (result?.catch) result.catch(() => finish(false));
      } catch (_error) { finish(false); }
    });
  }

  window.ufoRunCrazy = Object.freeze({
    initialize,
    isAvailable: adsAvailable,
    isAdActive: () => adActive,
    isAdPending: () => adPending,
    isMuted: () => platformMuted,
    gameplay: notifyGameplay,
    loadingFinished: () => {
      loading = false;
      if (supported()) safely(() => sdk.game.loadingStop());
    },
    happytime: () => { if (supported()) safely(() => sdk.game.happytime()); },
    rewardedWaitSeconds: () => Math.max(0, Math.ceil((lastRewardedAt + config.rewardedCooldownSeconds * 1000 - performance.now()) / 1000)),
    showMidgame: () => requestAd("midgame"),
  });
  window.ufoRunShowRewardedAd = ({ placement } = {}) => {
    if (!["continue", "shop-coins"].includes(placement) || window.ufoRunCrazy.rewardedWaitSeconds() > 0) return Promise.resolve(false);
    return requestAd("rewarded");
  };
})();
