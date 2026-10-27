(function (root, factory) {
  "use strict";
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.UfoFlightRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const FPS = 80;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const difficulties = Object.freeze({
    easy: Object.freeze({ name: "Easy", description: "Wide openings · a gentle introduction", initialSpeed: 2.8,
      maxSpeed: 4.1, speedIncrement: 0.026, interval: 1.55, minInterval: 1.36,
      gap: 252, minGap: 224, maxStep: 46, asteroidInterval: 0,
      bossTriggerScore: 50, bossDurationSeconds: 20, bossProjectileInterval: 120, bossProjectileSpeed: 3.4 }),
    normal: Object.freeze({ name: "Normal", description: "Find your rhythm · chase a new best", initialSpeed: 3.3,
      maxSpeed: 5.3, speedIncrement: 0.04, interval: 1.38, minInterval: 1.2,
      gap: 224, minGap: 196, maxStep: 58, asteroidInterval: 0,
      bossTriggerScore: 75, bossDurationSeconds: 30, bossProjectileInterval: 90, bossProjectileSpeed: 4.2 }),
    hard: Object.freeze({ name: "Hard", description: "Tighter routes · fast incoming asteroids", initialSpeed: 3.9,
      maxSpeed: 6.4, speedIncrement: 0.05, interval: 1.24, minInterval: 1.08,
      gap: 210, minGap: 180, maxStep: 68, asteroidInterval: 5,
      bossTriggerScore: 100, bossDurationSeconds: 40, bossProjectileInterval: 65, bossProjectileSpeed: 5 }),
  });
  function pacing(difficulty, gates) {
    const d = difficulties[difficulty] || difficulties.normal;
    const progress = clamp(Number(gates) || 0, 0, 50);
    return {
      speed: Math.min(d.maxSpeed, d.initialSpeed + progress * d.speedIncrement),
      intervalFrames: Math.round(FPS * Math.max(d.minInterval, d.interval - progress * 0.004)),
    };
  }
  const patterns = Object.freeze(["level", "rise", "fall", "weave"]);
  function gatePlan({ difficulty = "normal", index = 0, previousCenter = 300,
    height = 600, pattern = "level", random = Math.random } = {}) {
    const d = difficulties[difficulty] || difficulties.normal;
    const gap = index < 3 ? Math.max(260, d.gap) : Math.max(d.minGap, d.gap - Math.min(index, 50) * 0.6);
    const step = d.maxStep * (0.55 + random() * 0.45);
    let center = index < 3 ? height / 2 + (index - 1) * 10
      : pattern === "rise" ? previousCenter - step
      : pattern === "fall" ? previousCenter + step
      : pattern === "weave" ? previousCenter + (index % 2 ? step : -step)
      : previousCenter + (random() - 0.5) * d.maxStep * 0.55;
    center = clamp(center, Math.max(gap / 2 + 62, height * 0.3),
      Math.min(height - gap / 2 - 62, height * 0.7));
    return { center, gap, top: center - gap / 2, bottom: center + gap / 2, pattern };
  }
  function nextTarget(score, best, bossAt, bossCompleted) {
    const milestones = [5, 10, 25, 50];
    for (const target of milestones) if (score < target && target < bossAt) return { score: target, label: `${target} points` };
    if (!bossCompleted && score < bossAt) return { score: bossAt, label: "Cosmic Devourer" };
    const target = Math.max(Math.floor(score / 10 + 1) * 10, best > score ? best : 0);
    return { score: target, label: best > score && best === target ? "Your best score" : `${target} points` };
  }
  function shuffledBag(length, random = Math.random) {
    const bag = Array.from({ length }, (_, index) => index);
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }
  function shieldFrames(duration) {
    return Math.max(1, Math.round((Number.isFinite(duration) && duration > 0 ? duration : 5) * FPS));
  }
  const deathHints = Object.freeze({
    ceiling: "Let the ship fall before boosting again.",
    floor: "Tap again before the ship drops too low.",
    spikes: "Aim for the middle of each opening.",
    asteroid: "Watch the right edge for incoming asteroids.",
    boss: "Move away from the path of each volley.",
  });
  return Object.freeze({ FPS, clamp, difficulties, patterns, pacing, gatePlan,
    nextTarget, shuffledBag, shieldFrames, deathHints });
});
