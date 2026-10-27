(() => {
  "use strict";

  // Browsers forbid pixel-mask reads from file:// images. Production is static HTTPS.
  if (window.location.protocol === "file:") {
    document.getElementById("loading-message").textContent =
      "Open UFO RUN through a website or a local static web server to play.";
    return;
  }

  const canvas = document.getElementById("game");
  const context = canvas.getContext("2d");
  const Flight = window.UfoFlightRules;
  if (!Flight || !window.ufoRunCrazy || !window.UFO_CRAZY_CONFIG) {
    window.ufoLoading.fail("A game file could not load. Check your connection and try again.");
    return;
  }
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let WIDTH = 800;
  let HEIGHT = 600;
  const FPS = Flight.FPS;
  const FIXED_STEP_MS = 1000 / FPS;

  const BLUE = "rgb(50, 120, 240)";

  let UFO_X = 150;
  const UFO_WIDTH = 64;
  const UFO_HEIGHT = 44;
  const GRAVITY = 0.23;
  const JUMP_IMPULSE = -5.9;
  const MAX_FALL_SPEED = 7.6;

  const SPIKE_WIDTH = 100;
  const SPIKE_SOURCE_HEIGHT = 200;
  let SPIKE_HEIGHT = 600;
  const INITIAL_SPIKE_FREQUENCY = Flight.pacing("normal", 0).intervalFrames;
  const INITIAL_SPIKE_SPEED = Flight.pacing("normal", 0).speed;
  const mobileLayoutQuery = window.matchMedia(
    "(pointer: coarse), (max-width: 700px), (orientation: landscape) and (max-height: 550px)",
  );
  const portraitQuery = window.matchMedia("(orientation: portrait)");

  const POWERUP_SIZE = 50;
  const POWERUP_SPEED = 4;
  const ASTEROID_SPEED = POWERUP_SPEED * 2;
  const INVINCIBILITY_FALLBACK_SECONDS = 5;
  const PLANET_SIZE = 80;
  const PLANET_OBSTACLE_INTERVAL = 3;
  const STAR_OBSTACLE_INTERVAL = 12;
  const FIRST_STAR_AT = 5;
  const ASTEROID_SIZE = 64;
  const ASTEROID_OBSTACLE_INTERVAL = 10;
  const ASTEROID_IMAGE_NAMES = ["asteroid", "asteroid2"];
  const COIN_AD_REWARD = 50;
  const DAILY_COIN_AD_LIMIT = 10;
  const CONTINUE_COIN_COST = 100;
  const SCORE_AUDIO_FALLBACK_OFFSET_SECONDS = 0.12;
  const SCORE_AUDIO_SILENCE_THRESHOLD = 0.012;
  const ACHIEVEMENT_TOAST_DURATION_MS = 2200;
  const SPECIAL_SPAWN_COOLDOWN_FRAMES = 48;
  const BOSS_WARNING_FRAMES = FPS * 3;
  const BOSS_DEFEAT_ANIMATION_FRAMES = Math.round(FPS * 1.8);
  const BOSS_SCORE_REWARD = 10;
  const BOSS_COIN_REWARD = 50;
  const DIFFICULTIES = Flight.difficulties;


  const PROFILE_STORAGE_KEY = "ufoRunCrazyGamesProfileV1";
  const COUNTRY_SKIN_COST = 480;
  const SKINS = [
    { id: "classic", name: "CLASSIC", imageName: "ufo", deadImageName: "ufoGreenDead", cost: 0, accent: "rgb(64, 210, 122)" },
    { id: "nova", name: "RED NOVA", imageName: "ufoRed", deadImageName: "ufoRedDead", cost: 120, accent: "rgb(235, 74, 80)" },
    { id: "solar", name: "SOLAR", imageName: "ufoYellow", deadImageName: "ufoYellowDead", cost: 240, accent: "rgb(255, 205, 62)" },
    { id: "pulsar", name: "BLUE PULSAR", imageName: "ufoBlue", deadImageName: "ufoBlueDead", cost: 360, accent: "rgb(68, 154, 255)" },
    { id: "venezuela", name: "VENEZUELA", imageName: "ufoVenezuela", deadImageName: "ufoVenezuelaDead", cost: COUNTRY_SKIN_COST, accent: "rgb(255, 205, 62)" },
    { id: "argentina", name: "ARGENTINA", imageName: "ufoArgentina", deadImageName: "ufoArgentinaDead", cost: COUNTRY_SKIN_COST, accent: "rgb(107, 207, 246)" },
  ];

  const ACHIEVEMENTS = [
    { id: "first-flight", title: "First Liftoff", description: "Start your first run", reward: 10, type: "games", target: 1 },
    { id: "space-cadet", title: "Space Cadet", description: "Score 10 points on Normal or Hard", reward: 10, type: "score", target: 10 },
    { id: "veteran-pilot", title: "Veteran Pilot", description: "Score 25 points on Normal or Hard", reward: 15, type: "score", target: 25 },
    { id: "galactic-ace", title: "Galactic Ace", description: "Score 50 points on Normal or Hard", reward: 25, type: "score", target: 50 },
    { id: "space-centurion", title: "Space Centurion", description: "Score 100 points on Normal or Hard", reward: 40, type: "score", target: 100 },
    { id: "ufo-legend", title: "UFO RUN Legend", description: "Score 200 points on Normal or Hard", reward: 100, type: "score", target: 200, difficult: true },
    { id: "new-world", title: "New World", description: "Collect your first planet", reward: 5, type: "planets", target: 1 },
    { id: "solar-cartographer", title: "Solar Cartographer", description: "Discover all 9 planets", reward: 40, type: "unique-planets", target: 9 },
    { id: "planet-hunter", title: "Planet Hunter", description: "Collect 50 planets in total", reward: 30, type: "planets", target: 50 },
    { id: "stellar-energy", title: "Stellar Energy", description: "Collect your first star", reward: 5, type: "stars", target: 1 },
    { id: "untouchable", title: "Untouchable", description: "Collect 5 stars in total", reward: 15, type: "stars", target: 5 },
    { id: "rock-dodger", title: "Rock Dodger", description: "Dodge 50 asteroids", reward: 15, type: "asteroids", target: 50 },
    { id: "asteroid-field", title: "Asteroid Field", description: "Dodge 150 asteroids", reward: 35, type: "asteroids", target: 150, difficult: true },
    { id: "clean-flight", title: "Clean Flight", description: "Score 30 on Normal or Hard without shields or a second chance", reward: 25, type: "clean-score", target: 30 },
    { id: "absolute-mastery", title: "Absolute Mastery", description: "Score 100 on Normal or Hard without shields or a second chance", reward: 100, type: "clean-score", target: 100, difficult: true },
    { id: "easy-boss", title: "Rookie Hunter", description: "Defeat the boss on Easy", reward: 40, type: "boss-difficulty", difficulty: "easy", target: 1 },
    { id: "normal-boss", title: "Devourer Devoured", description: "Defeat the boss on Normal", reward: 60, type: "boss-difficulty", difficulty: "normal", target: 1 },
    { id: "cosmic-nightmare", title: "Cosmic Nightmare", description: "Defeat the boss on Hard", reward: 100, type: "boss-difficulty", difficulty: "hard", target: 1, difficult: true },
    { id: "boss-trinity", title: "Cosmic Conqueror", description: "Defeat the boss on all three difficulties", reward: 150, type: "all-bosses", target: 3, difficult: true },
    { id: "complete-pilot", title: "All-Round Pilot", description: "Score 60 on all three difficulties", reward: 40, type: "difficulty-mastery", target: 3, difficult: true },
    { id: "galactic-collector", title: "Galactic Collector", description: "Unlock every ship", reward: 50, type: "skins", target: SKINS.length, difficult: true },
    { id: "national-pride", title: "National Pride", description: "Score 100 on Hard with Argentina or Venezuela", reward: 20, type: "national-score", target: 100, difficult: true },
  ];

  const backgroundSources = ["src/fondo.jpg", "src/Fondo-2.png", "src/Fondo-3.png"];

  // Identical source crops are baked by tools/crazygames/prepare-assets.cjs.
  // The browser only decodes the 80px sprites it actually renders.
  const planetCropSources = ["planetMercury", "planetVenus", "planetEarth", "planetMars",
    "planetJupiter", "planetSaturn", "planetUranus", "planetNeptune", "planetPluto"]
    .map((imageName) => ({ imageName, x: 0, y: 0, width: 80, height: 80 }));

  const imageSources = {
    background: "src/fondo.jpg",
    background2: "src/Fondo-2.png",
    background3: "src/Fondo-3.png",
    ufo: "src/ufo_principal.png",
    ufoGreenDead: "src/ufo_verde_muerto.png",
    ufoRed: "src/ufo_rojo.png",
    ufoRedDead: "src/ufo_rojo_muerto.png",
    ufoYellow: "src/ufo_amarillo.png",
    ufoYellowDead: "src/ufo_amarillo_muerto.png",
    ufoBlue: "src/ufo_azul.png",
    ufoBlueDead: "src/ufo_azul_muerto.png",
    ufoVenezuela: "src/ufo_venezuela.png",
    ufoVenezuelaDead: "src/ufo_venezuela_muerto.png",
    ufoArgentina: "src/ufo_argentina.png",
    ufoArgentinaDead: "src/ufo_argentina_muert.png",
    powerup: "src/powerup_star.png",
    spikeTop: "src/Pincho_alto.png",
    spikeBottom: "src/Pincho_bajo.png",
    asteroid: "src/Obstaculos/Asteroide.png",
    asteroid2: "src/Obstaculos/asteroide_2.png",
    cosmicBoss: "src/boss_cosmico.png",
    planetMercury: "src/planetas/Mercurio.png",
    planetVenus: "src/planetas/Venus.png",
    planetEarth: "src/planetas/Tierra.png",
    planetMars: "src/planetas/Marte.png",
    planetJupiter: "src/planetas/Jupiter.png",
    planetSaturn: "src/planetas/Saturno.png",
    planetUranus: "src/planetas/Urano.png",
    planetNeptune: "src/planetas/Neptuno.png",
    planetPluto: "src/planetas/Pluton.png",
  };

  const images = {};
  let planetSprites = [];

  const backgroundMusic = new Audio("src/musica/musica_fondo_2.mp3");
  const deathSound = new Audio("src/musica/sonido_muerte.mp3");
  const scoreSound = new Audio("src/musica/sonido_puntaje.mp3");
  const invincibilitySound = new Audio("src/musica/sonido_invencibilidad.mp3");
  const achievementSound = new Audio("src/musica/logro.mp3");
  const difficultAchievementSound = new Audio("src/musica/logro-dificil.mp3");
  let scoreAudioContext = null;
  let scoreAudioBuffer = null;
  let scoreAudioStartOffset = SCORE_AUDIO_FALLBACK_OFFSET_SECONDS;

  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.22;
  deathSound.volume = 0.27;
  scoreSound.volume = 0.23;
  invincibilitySound.volume = 0.28;
  achievementSound.volume = 0.3;
  difficultAchievementSound.volume = 0.32;

  let invincibilitySoundFrames = Math.round(INVINCIBILITY_FALLBACK_SECONDS * FPS);
  let invincibilityDurationFrames = invincibilitySoundFrames;

  function syncInvincibilityDuration() {
    if (Number.isFinite(invincibilitySound.duration) && invincibilitySound.duration > 0) {
      invincibilitySoundFrames = Flight.shieldFrames(invincibilitySound.duration);
      invincibilityDurationFrames = invincibilitySoundFrames;
    }
    return invincibilityDurationFrames;
  }

  invincibilitySound.addEventListener("loadedmetadata", syncInvincibilityDuration);

  for (const audio of [backgroundMusic, deathSound, scoreSound, invincibilitySound,
    achievementSound, difficultAchievementSound]) {
    audio.preload = audio === backgroundMusic ? "metadata" : "auto";
  }

  let state = "loading";
  let animationFrameId = 0;
  let previousTime = performance.now();
  let accumulator = 0;
  let backgroundIndex = 0;
  let gamesStarted = 0;
  let shopMessage = "";
  let shopMessageUntil = 0;
  let lastReward = 0;
  let creditedScore = 0;
  let continueUsed = false;
  let continueAdMessage = "One second chance per run";
  let adRequestPending = false;
  let introTimers = [];
  let gamePaused = false;
  let adAudioSuspended = window.ufoRunCrazy.isAdActive();
  let runRewardOfferShown = false;
  let orientationDialogDeferred = false;
  let pageAudioSuspended = document.hidden;
  let transitionPending = false;
  const activeEffects = new Set();
  let pauseOwner = "";
  let achievementToastTimer = 0;
  const achievementQueue = [];

  function localDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatPoints(value) {
    const points = Math.max(0, Math.trunc(Number(value) || 0));
    if (points < 100000) return String(points);
    const units = ["", "K", "M", "B", "T", "Q"];
    const unitIndex = Math.min(Math.floor(Math.log10(points) / 3), units.length - 1);
    const scaled = points / 1000 ** unitIndex;
    const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    const factor = 10 ** decimals;
    const compact = Math.floor(scaled * factor) / factor;
    return `${compact}${units[unitIndex]}`;
  }

  function normalizeRankings(value) {
    const result = { easy: [], normal: [], hard: [] };
    for (const difficulty of Object.keys(DIFFICULTIES)) {
      if (!Array.isArray(value?.[difficulty])) continue;
      result[difficulty] = value[difficulty].map((entry, index) => ({
        id: typeof entry?.id === "string" ? entry.id : `legacy-${difficulty}-${index}`,
        name: "PILOT",
        score: Math.max(0, Math.trunc(Number(entry?.score) || 0)),
      })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
    }
    return result;
  }

  function normalizeBestScores(value, legacyBestScore = 0) {
    const result = { easy: 0, normal: 0, hard: 0 };
    for (const difficulty of Object.keys(DIFFICULTIES)) {
      result[difficulty] = Math.max(0, Math.trunc(Number(value?.[difficulty]) || 0));
    }
    if (!value || typeof value !== "object") {
      result.normal = Math.max(0, Math.trunc(Number(legacyBestScore) || 0));
    }
    return result;
  }

  function normalizeAchievementStats(value) {
    const number = (entry) => Math.max(0, Math.trunc(Number(entry) || 0));
    return {
      gamesStarted: number(value?.gamesStarted),
      planetsCollected: number(value?.planetsCollected),
      planetIds: Array.isArray(value?.planetIds) ? [...new Set(value.planetIds.filter((id) =>
        planetCropSources.some((planet) => planet.imageName === id)))] : [],
      starsCollected: number(value?.starsCollected),
      asteroidsPassed: number(value?.asteroidsPassed),
      bossesDefeated: number(value?.bossesDefeated),
      hardBossesDefeated: number(value?.hardBossesDefeated),
      bossDefeatsByDifficulty: {
        easy: number(value?.bossDefeatsByDifficulty?.easy),
        normal: number(value?.bossDefeatsByDifficulty?.normal),
        hard: Math.max(number(value?.bossDefeatsByDifficulty?.hard), number(value?.hardBossesDefeated)),
      },
      cleanBestScore: number(value?.cleanBestScore),
      nationalBestScore: number(value?.nationalBestScore),
    };
  }

  function loadProfile() {
    const fallback = {
      credits: 0,
      bestScores: normalizeBestScores(),
      ownedSkins: ["classic"],
      selectedSkin: "classic",
      soundEnabled: true,
      onboardingDone: false,
      coinAdDay: localDayKey(),
      coinAdsToday: 0,
      difficulty: "normal",
      rankings: normalizeRankings(),
      achievements: [],
      achievementStats: normalizeAchievementStats(),
    };

    try {
      const stored = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
      if (!stored || typeof stored !== "object") {
        return fallback;
      }
      const ownedSkins = Array.isArray(stored.ownedSkins)
        ? stored.ownedSkins.filter((id) => SKINS.some((skin) => skin.id === id))
        : ["classic"];
      if (!ownedSkins.includes("classic")) {
        ownedSkins.unshift("classic");
      }
      const selectedSkin = ownedSkins.includes(stored.selectedSkin) ? stored.selectedSkin : "classic";
      return {
        credits: Math.max(0, Math.trunc(Number(stored.credits) || 0)),
        bestScores: normalizeBestScores(stored.bestScores, stored.bestScore),
        ownedSkins,
        selectedSkin,
        soundEnabled: stored.soundEnabled !== false,
        onboardingDone: stored.onboardingDone === true,
        coinAdDay: typeof stored.coinAdDay === "string" ? stored.coinAdDay : localDayKey(),
        coinAdsToday: Math.max(0, Math.min(DAILY_COIN_AD_LIMIT,
          Math.trunc(Number(stored.coinAdsToday) || 0))),
        difficulty: DIFFICULTIES[stored.difficulty] ? stored.difficulty : "normal",
        rankings: normalizeRankings(stored.rankings),
        achievements: Array.isArray(stored.achievements) ? stored.achievements.filter((id) =>
          ACHIEVEMENTS.some((achievement) => achievement.id === id)) : [],
        achievementStats: normalizeAchievementStats(stored.achievementStats),
      };
    } catch (_error) {
      return fallback;
    }
  }

  let profile = loadProfile();
  function saveProfile() {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (_error) {
      // El juego sigue funcionando si el navegador bloquea el almacenamiento local.
    }
  }

  function refreshDailyAdCounter() {
    const today = localDayKey();
    if (profile.coinAdDay === today) return;
    profile.coinAdDay = today;
    profile.coinAdsToday = 0;
    saveProfile();
  }

  function selectedSkin() {
    return SKINS.find((skin) => skin.id === profile.selectedSkin) || SKINS[0];
  }

  let ufoY = HEIGHT / 2;
  let jumpVelocity = 0;
  let spikeCounter = 0;
  let spikeFrequency = INITIAL_SPIKE_FREQUENCY;
  let spikeSpeed = INITIAL_SPIKE_SPEED;
  let currentDifficulty = profile.difficulty;
  let rankingDifficulty = profile.difficulty;
  let currentRunId = "";
  let spikes = [];
  let score = 0;
  let passedObstacles = 0;
  let invincible = false;
  let invincibleTime = 0;
  let runUsedInvincibility = false;
  let powerupActive = false;
  let powerupX = WIDTH;
  let powerupY = HEIGHT / 2;
  let planetActive = false;
  let planetPending = false;
  let nextPlanetAt = PLANET_OBSTACLE_INTERVAL;
  let planetX = WIDTH;
  let planetY = HEIGHT / 2;
  let planetVelocityY = 0;
  let currentPlanet = null;
  let planetGate = null;
  let starGate = null;
  let powerupVelocityY = 0;
  let nextStarAt = FIRST_STAR_AT;
  let starPending = false;
  let nextAsteroidAt = ASTEROID_OBSTACLE_INTERVAL / 2;
  let nextAsteroidImageIndex = 0;
  let asteroidPending = false;
  let specialSpawnCooldown = 0;
  const specialSpawnOrder = ["planet", "asteroid", "star"];
  let specialSpawnCursor = 0;
  let asteroids = [];
  let bossActive = false;
  let bossCompleted = false;
  let bossTimeFrames = 0;
  let bossX = WIDTH;
  let bossY = HEIGHT / 2;
  let bossProjectileCounter = 0;
  let bossVolleyCount = 0;
  let bossProjectiles = [];
  let bossDefeatAnimating = false;
  let bossDefeatFrames = 0;
  let feedback = [];
  let flightStarted = false;
  let bossWarningActive = false;
  let bossWarningFrames = 0;
  let runFrames = 0;
  let runPlanets = 0;
  let runPreviousBest = 0;
  let celebratedBest = false;
  let deathReason = "spikes";
  let gatesCreated = 0;
  let previousGapCenter = HEIGHT / 2;
  let gatePattern = "level";
  let planetBag = [];
  let tutorialVisible = false;
  let launchAssistFrames = 0;
  let manualBoostReceived = false;
  let needsRender = true;
  let lastProgressLabel = "";
  const particles = Array.from({ length: 80 }, () => ({ life: 0 }));
  let nextParticle = 0;
  const spriteCache = new Map();
  const asteroidCropCache = new Map();

  const interfaceElement = document.getElementById("interface");
  const introElement = document.getElementById("intro-screen");
  const gameHud = document.getElementById("game-hud");
  const screenElements = {
    menu: document.getElementById("menu-screen"),
    shop: document.getElementById("shop-screen"),
    help: document.getElementById("help-screen"),
    ranking: document.getElementById("ranking-screen"),
    achievements: document.getElementById("achievements-screen"),
    gameover: document.getElementById("gameover-screen"),
  };
  const skinCards = new Map();
  const achievementCards = new Map();
  let interfaceState = "loading";

  function buildShopInterface() {
    const grid = document.getElementById("shop-grid");
    for (const skin of SKINS) {
      const card = document.createElement("article");
      card.className = "skin-card";
      card.style.setProperty("--skin-accent", skin.accent);
      const heading = document.createElement("h3");
      heading.textContent = skin.name;
      const preview = document.createElement("img");
      preview.src = imageSources[skin.imageName];
      preview.alt = `${skin.name} ship`;
      const ownership = document.createElement("p");
      const button = document.createElement("button");
      button.type = "button";
      button.addEventListener("click", () => handleSkinAction(skin));
      card.append(heading, preview, ownership, button);
      grid.append(card);
      skinCards.set(skin.id, { card, ownership, button });
    }
  }

  function buildAchievementsInterface() {
    const grid = document.getElementById("achievements-grid");
    for (const achievement of ACHIEVEMENTS) {
      const card = document.createElement("article");
      card.className = `achievement-card${achievement.difficult ? " difficult" : ""}`;
      const badge = document.createElement("span");
      badge.className = "achievement-badge";
      badge.textContent = "?";
      const title = document.createElement("h3");
      const description = document.createElement("p");
      const footer = document.createElement("footer");
      const progressText = document.createElement("span");
      const reward = document.createElement("strong");
      const track = document.createElement("div");
      const fill = document.createElement("span");
      track.className = "achievement-progress";
      track.append(fill);
      title.textContent = achievement.title;
      description.textContent = achievement.description;
      reward.textContent = `+${achievement.reward} coins`;
      footer.append(progressText, reward);
      card.append(badge, title, description, footer, track);
      grid.append(card);
      achievementCards.set(achievement.id, { card, badge, progressText, fill });
    }
  }

  function achievementProgress(achievement) {
    const stats = profile.achievementStats;
    const eligibleScore = currentDifficulty === "normal" || currentDifficulty === "hard" ? score : 0;
    switch (achievement.type) {
      case "games": return stats.gamesStarted;
      case "score": return Math.max(profile.bestScores.normal, profile.bestScores.hard, eligibleScore);
      case "planets": return stats.planetsCollected;
      case "unique-planets": return stats.planetIds.length;
      case "stars": return stats.starsCollected;
      case "asteroids": return stats.asteroidsPassed;
      case "clean-score": return stats.cleanBestScore;
      case "bosses": return stats.bossesDefeated;
      case "hard-bosses": return stats.hardBossesDefeated;
      case "boss-difficulty": return stats.bossDefeatsByDifficulty[achievement.difficulty] || 0;
      case "all-bosses": return Object.values(stats.bossDefeatsByDifficulty).filter((wins) => wins > 0).length;
      case "difficulty-mastery": return Object.keys(DIFFICULTIES).filter((difficulty) =>
        Math.max(profile.bestScores[difficulty], currentDifficulty === difficulty ? score : 0) >= 60).length;
      case "skins": return profile.ownedSkins.length;
      case "national-score": return stats.nationalBestScore;
      default: return 0;
    }
  }

  function renderAchievements() {
    document.getElementById("achievement-count").textContent =
      `${profile.achievements.length} / ${ACHIEVEMENTS.length}`;
    for (const achievement of ACHIEVEMENTS) {
      const elements = achievementCards.get(achievement.id);
      if (!elements) continue;
      const unlocked = profile.achievements.includes(achievement.id);
      const progress = Math.min(achievement.target, achievementProgress(achievement));
      elements.card.classList.toggle("unlocked", unlocked);
      elements.badge.textContent = unlocked ? "🏆" : "?";
      elements.progressText.textContent = unlocked ? "Completed" : `${progress} / ${achievement.target}`;
      elements.fill.style.transform = `scaleX(${achievement.target ? progress / achievement.target : 0})`;
    }
  }

  function showNextAchievement() {
    if (achievementToastTimer || !achievementQueue.length) return;
    // Let the first control lesson breathe before showing earned rewards.
    if (state === "playing" && runFrames < FPS * 4) return;
    const achievement = achievementQueue.shift();
    const toast = document.getElementById("achievement-toast");
    document.getElementById("achievement-toast-title").textContent = achievement.title;
    document.getElementById("achievement-toast-description").textContent = achievement.description;
    document.getElementById("achievement-toast-reward").textContent = `+${achievement.reward} coins`;
    toast.classList.toggle("difficult", achievement.difficult === true);
    toast.hidden = false;
    playEffect(achievement.difficult ? difficultAchievementSound : achievementSound);
    achievementToastTimer = window.setTimeout(() => {
      toast.hidden = true;
      achievementToastTimer = 0;
      showNextAchievement();
    }, ACHIEVEMENT_TOAST_DURATION_MS);
  }

  function checkAchievements() {
    if (state === "playing" && (currentDifficulty === "normal" || currentDifficulty === "hard") &&
      !runUsedInvincibility && !continueUsed) {
      profile.achievementStats.cleanBestScore = Math.max(profile.achievementStats.cleanBestScore, score);
    }
    if (state === "playing" && currentDifficulty === "hard" &&
      ["argentina", "venezuela"].includes(profile.selectedSkin)) {
      profile.achievementStats.nationalBestScore = Math.max(profile.achievementStats.nationalBestScore, score);
    }
    const unlocked = ACHIEVEMENTS.filter((achievement) =>
      !profile.achievements.includes(achievement.id) && achievementProgress(achievement) >= achievement.target);
    if (!unlocked.length) return [];
    for (const achievement of unlocked) {
      profile.achievements.push(achievement.id);
      profile.credits += achievement.reward;
      achievementQueue.push(achievement);
    }
    saveProfile();
    syncInterface();
    showNextAchievement();
    return unlocked.map((achievement) => achievement.id);
  }

  function renderRanking() {
    const body = document.getElementById("ranking-body");
    const subtitle = document.getElementById("ranking-subtitle");
    body.replaceChildren();
    const entries = profile.rankings[rankingDifficulty];
    subtitle.textContent = "Best flights on this device";
    if (!entries.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.className = "ranking-empty";
      cell.textContent = "No scores on this difficulty yet";
      row.append(cell);
      body.append(row);
      return;
    }
    entries.forEach((entry, index) => {
      const row = document.createElement("tr");
      for (const [columnIndex, value] of [index + 1, entry.name, entry.score].entries()) {
        const cell = document.createElement("td");
        cell.textContent = columnIndex === 2 ? formatPoints(value) : String(value);
        row.append(cell);
      }
      body.append(row);
    });
  }

  function recordRankingScore() {
    if (score <= 0 || !currentRunId) return;
    const entries = profile.rankings[currentDifficulty];
    const existing = entries.find((entry) => entry.id === currentRunId);
    if (existing) {
      existing.score = Math.max(existing.score, score);
      existing.name = "PILOT";
    } else {
      entries.push({ id: currentRunId, name: "PILOT", score });
    }
    entries.sort((a, b) => b.score - a.score);
    profile.rankings[currentDifficulty] = entries.slice(0, 10);
  }

  function syncInterface() {
    refreshDailyAdCounter();
    syncOrientation();
    window.ufoRunCrazy.gameplay(state === "playing" && !gamePaused && !document.hidden && !portraitQuery.matches);
    interfaceElement.dataset.state = state;
    document.getElementById("toolbar").hidden = ["loading", "intro", "name"].includes(state);
    document.getElementById("loading-screen").hidden = state !== "loading";
    introElement.hidden = state !== "intro";
    document.querySelector(".wallet").hidden = state === "playing";
    // Credits remain in Flight guide, away from the quick retry action.
    document.getElementById("authors-footer").hidden = true;
    document.getElementById("invincible-label").hidden = state !== "playing" || !invincible;
    document.getElementById("boss-hud").hidden = state !== "playing" || !bossActive;
    document.getElementById("flight-start-prompt").hidden = state !== "playing" || flightStarted || gamePaused;
    gameHud.hidden = state !== "playing";
    interfaceElement.hidden = !screenElements[state];
    for (const [name, screen] of Object.entries(screenElements)) {
      screen.hidden = name !== state;
    }
    if (interfaceState !== state) {
      interfaceElement.scrollTop = 0;
      interfaceState = state;
      needsRender = true;
    }
    document.querySelectorAll("[data-credits]").forEach((element) => {
      element.textContent = formatPoints(profile.credits);
    });
    document.querySelectorAll("[data-best-score]").forEach((element) => {
      const difficulty = ["playing", "gameover"].includes(state) ? currentDifficulty : profile.difficulty;
      element.textContent = formatPoints(profile.bestScores[difficulty]);
    });
    const skin = selectedSkin();
    document.getElementById("equipped-preview").src = imageSources[skin.imageName];
    document.getElementById("equipped-name").textContent = skin.name;
    document.getElementById("equipped-name").style.color = skin.accent;
    document.getElementById("back-button").hidden = !["shop", "help", "ranking", "achievements"].includes(state);
    const soundButton = document.getElementById("sound-button");
    soundButton.setAttribute("aria-pressed", String(!profile.soundEnabled));
    soundButton.disabled = window.ufoRunCrazy.isMuted();
    soundButton.setAttribute("aria-label", window.ufoRunCrazy.isMuted() ? "Sound disabled by platform" : profile.soundEnabled ? "Mute sound" : "Enable sound");
    document.getElementById("pause-button").hidden = state !== "playing";
    document.getElementById("final-score").textContent = formatPoints(score);
    document.getElementById("run-reward").textContent = `+${lastReward} coins saved`;
    document.getElementById("run-outcome").textContent = score > runPreviousBest ? "NEW PERSONAL BEST" : "MISSION OVER";
    document.getElementById("result-title").textContent = score > runPreviousBest ? "You went further." : "One more flight?";
    document.getElementById("death-hint").textContent = Flight.deathHints[deathReason] || Flight.deathHints.spikes;
    document.getElementById("run-stats").textContent = `${passedObstacles} gates · ${runPlanets} planets · ${Math.floor(runFrames / FPS)}s`;
    document.getElementById("flight-tutorial").hidden = state !== "playing" || gamePaused || !tutorialVisible;
    document.getElementById("flight-progress").hidden = state !== "playing" || bossActive || bossWarningActive || bossDefeatAnimating;
    const nextGoal = Flight.nextTarget(profile.bestScores[profile.difficulty], profile.bestScores[profile.difficulty],
      DIFFICULTIES[profile.difficulty].bossTriggerScore, false);
    document.getElementById("menu-goal").textContent = `Next target: ${nextGoal.label}`;
    document.getElementById("shop-status").textContent = shopMessage && performance.now() < shopMessageUntil
      ? shopMessage : "Earn coins by flying past obstacles";
    const coinAdsRemaining = Math.max(0, DAILY_COIN_AD_LIMIT - profile.coinAdsToday);
    const coinAdButton = document.getElementById("coin-ad-button");
    const rewardedWait = window.ufoRunCrazy.rewardedWaitSeconds();
    coinAdButton.textContent = adRequestPending && state === "shop"
      ? "Loading ad..." : coinAdsRemaining === 0 ? "Daily limit reached" : rewardedWait > 0 ? `Next ad in ${rewardedWait}s` : `Watch ad +${COIN_AD_REWARD}`;
    const adsAvailable = window.ufoRunCrazy.isAvailable();
    document.getElementById("coin-ad-offer").hidden = !adsAvailable;
    const continueOffer = window.UFO_CRAZY_CONFIG.monetizationEnabled && gamesStarted % 3 === 0 && gamesStarted > 0 && score > 0 && !continueUsed &&
      (adsAvailable && rewardedWait === 0 || profile.credits >= CONTINUE_COIN_COST);
    document.getElementById("continue-ad-offer").hidden = !continueOffer;
    if (state === "gameover" && continueOffer) runRewardOfferShown = true;
    const paidContinue = document.getElementById("continue-coins-button");
    paidContinue.disabled = adRequestPending || profile.credits < CONTINUE_COIN_COST;
    coinAdButton.disabled = adRequestPending || transitionPending || coinAdsRemaining === 0 || rewardedWait > 0;
    document.getElementById("coin-ad-remaining").textContent = coinAdsRemaining === 1
      ? "1 ad available today" : `${coinAdsRemaining} ads available today`;
    const continueAdButton = document.getElementById("continue-ad-button");
    continueAdButton.hidden = continueUsed || !adsAvailable || rewardedWait > 0;
    continueAdButton.disabled = adRequestPending;
    continueAdButton.innerHTML = adRequestPending && state === "gameover"
      ? "Loading ad..." : '<span aria-hidden="true">▶</span> Watch ad to continue';
    document.getElementById("continue-ad-status").textContent = continueUsed
      ? "Second chance already used" : continueAdMessage;
    document.querySelectorAll("[data-difficulty]").forEach((button) => {
      const selected = button.dataset.difficulty === profile.difficulty;
      button.setAttribute("aria-checked", String(selected));
    });
    document.getElementById("difficulty-description").textContent = DIFFICULTIES[profile.difficulty].description;
    document.querySelectorAll("[data-ranking-difficulty]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.rankingDifficulty === rankingDifficulty));
    });
    if (state === "ranking") renderRanking();
    if (state === "achievements") renderAchievements();
    for (const skin of SKINS) {
      const elements = skinCards.get(skin.id);
      const owned = profile.ownedSkins.includes(skin.id);
      const equipped = profile.selectedSkin === skin.id;
      elements.card.classList.toggle("owned", owned);
      elements.card.classList.toggle("equipped", equipped);
      elements.ownership.textContent = owned ? "Owned" : "Unlock";
      elements.button.textContent = equipped ? "Equipped" : owned ? "Equip" : `${skin.cost} coins`;
      elements.button.disabled = equipped;
      elements.button.setAttribute("aria-label", equipped ? `${skin.name} equipped` : owned
        ? `Equip ${skin.name}` : `Buy ${skin.name} for ${skin.cost} coins`);
    }
  }

  function resizeGame() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height || bounds.width < bounds.height) return;
    const oldWidth = WIDTH;
    const oldHeight = HEIGHT;
    const oldSpikeHeight = SPIKE_HEIGHT;
    const aspect = bounds.width / bounds.height;
    WIDTH = 600 * aspect;
    HEIGHT = 600;
    UFO_X = WIDTH * 0.1875;
    SPIKE_HEIGHT = Math.max(SPIKE_SOURCE_HEIGHT, Math.ceil(HEIGHT));
    const centerShift = (HEIGHT - oldHeight) / 2;
    ufoY = Math.max(1, Math.min(HEIGHT - UFO_HEIGHT, ufoY * HEIGHT / oldHeight));
    for (const spike of spikes) {
      spike.topX *= WIDTH / oldWidth;
      spike.bottomX *= WIDTH / oldWidth;
      spike.topY += centerShift - (SPIKE_HEIGHT - oldSpikeHeight);
      spike.bottomY += centerShift;
    }
    powerupX *= WIDTH / oldWidth;
    planetX *= WIDTH / oldWidth;
    powerupY += centerShift;
    planetY += centerShift;
    powerupY = Math.max(20, Math.min(HEIGHT - POWERUP_SIZE - 20, powerupY));
    planetY = Math.max(20, Math.min(HEIGHT - PLANET_SIZE - 20, planetY));
    for (const asteroid of asteroids) {
      asteroid.x *= WIDTH / oldWidth;
      if (Number.isFinite(asteroid.minY) && Number.isFinite(asteroid.maxY)) {
        asteroid.minY = Math.max(20, Math.min(HEIGHT - asteroid.size - 20, asteroid.minY + centerShift));
        asteroid.maxY = Math.max(asteroid.minY,
          Math.min(HEIGHT - asteroid.size - 20, asteroid.maxY + centerShift));
      }
      asteroid.y = Math.max(asteroid.minY ?? 0,
        Math.min(asteroid.maxY ?? HEIGHT - asteroid.size, asteroid.y + centerShift));
    }
    bossX *= WIDTH / oldWidth;
    bossY += centerShift;
    for (const projectile of bossProjectiles) {
      projectile.x *= WIDTH / oldWidth;
      projectile.y = Math.max(0, Math.min(HEIGHT - projectile.size, projectile.y + centerShift));
    }
    for (const item of feedback) {
      item.x *= WIDTH / oldWidth;
      item.y += centerShift;
    }
    if (SPIKE_HEIGHT !== oldSpikeHeight) {
      spriteCache.delete("spikeTop");
      spriteCache.delete("spikeBottom");
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.round(bounds.width * pixelRatio);
    const nextHeight = Math.round(bounds.height * pixelRatio);
    if (canvas.width !== nextWidth) canvas.width = nextWidth;
    if (canvas.height !== nextHeight) canvas.height = nextHeight;
    context.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    needsRender = true;
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error(`Could not load ${source}`)), { once: true });
      image.src = source;
    });
  }

  async function loadAssets() {
    const entries = Object.entries(imageSources);
    window.ufoLoading.plan([...entries.map(([name]) => name), "cover", "brand", "audio", "font", "sprites"]);
    // The portal handshake runs in parallel; an unavailable SDK must not hold
    // an otherwise ready game on the loading screen for its network timeout.
    void window.ufoRunCrazy.initialize();
    const coverReady = loadImage("src/loading-cover.webp").then(() => window.ufoLoading.complete("cover"));
    const brandReady = loadImage("src/Logo_bz.png").then(() => window.ufoLoading.complete("brand"));
    const spritesReady = Promise.all(entries.map(async ([name, source]) => {
      const image = await loadImage(source);
      window.ufoLoading.complete(name, "Loading the galaxy...");
      return image;
    })).then(async (loaded) => {
      entries.forEach(([name], index) => {
        images[name] = loaded[index];
      });
      planetSprites = planetCropSources.map((crop) => ({
        image: images[crop.imageName],
        ...crop,
      }));
      // Prepare alpha collision masks before play, while reporting real progress.
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      for (const name of ASTEROID_IMAGE_NAMES) {
        getSprite(name);
      }
      getSprite("spikeTop");
      getSprite("spikeBottom");
      for (const planet of planetSprites) {
        currentPlanet = planet;
        getPlanetSprite();
      }
      currentPlanet = null;
      window.ufoLoading.complete("sprites", "Preparing your ship...");
    });
    await Promise.all([
      spritesReady,
      prepareScoreAudio().then(() => window.ufoLoading.complete("audio", "Preparing flight audio...")),
      document.fonts.load('74px "UFO Run"').then(() => window.ufoLoading.complete("font")),
      coverReady, brandReady,
    ]);
    applyBackground();
    window.ufoLoading.finish();
    window.ufoRunCrazy.loadingFinished();
  }

  async function prepareScoreAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || typeof window.fetch !== "function") return;
    try {
      scoreAudioContext = new AudioContextClass();
      const response = await window.fetch("src/musica/sonido_puntaje.mp3");
      if (!response.ok) return;
      scoreAudioBuffer = await scoreAudioContext.decodeAudioData(await response.arrayBuffer());
      scoreAudioStartOffset = findAudioStartOffset(scoreAudioBuffer);
    } catch (_error) {
      scoreAudioContext = null;
      scoreAudioBuffer = null;
    }
  }

  function findAudioStartOffset(buffer) {
    if (!buffer || !Number.isFinite(buffer.sampleRate) || !buffer.numberOfChannels) {
      return SCORE_AUDIO_FALLBACK_OFFSET_SECONDS;
    }
    let firstAudibleSample = buffer.length;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const samples = buffer.getChannelData(channel);
      for (let index = 0; index < samples.length; index += 1) {
        if (Math.abs(samples[index]) >= SCORE_AUDIO_SILENCE_THRESHOLD) {
          firstAudibleSample = Math.min(firstAudibleSample, index);
          break;
        }
      }
    }
    if (firstAudibleSample === buffer.length) return SCORE_AUDIO_FALLBACK_OFFSET_SECONDS;
    return Math.max(0, firstAudibleSample / buffer.sampleRate - 0.004);
  }

  function applyBackground() {
    document.body.style.backgroundImage = `url("${backgroundSources[backgroundIndex]}")`;
  }

  function playAudio(audio, restart = false) {
    if (!profile.soundEnabled || window.ufoRunCrazy.isMuted() || adAudioSuspended || pageAudioSuspended) {
      return;
    }
    if (restart) {
      try {
        audio.currentTime = 0;
      } catch (_error) {
        // Algunos navegadores no permiten cambiar currentTime antes de cargar el audio.
      }
    }
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  }

  function playEffect(source) {
    if (!profile.soundEnabled || window.ufoRunCrazy.isMuted() || adAudioSuspended || pageAudioSuspended) return;
    const effect = source.cloneNode();
    effect.volume = source.volume;
    activeEffects.add(effect);
    effect.addEventListener("ended", () => activeEffects.delete(effect), { once: true });
    effect.addEventListener("error", () => activeEffects.delete(effect), { once: true });
    playAudio(effect);
  }

  function playUiSound() {
    if (!profile.soundEnabled || window.ufoRunCrazy.isMuted() || adAudioSuspended || pageAudioSuspended || !scoreAudioContext) return;
    scoreAudioContext.resume().catch(() => {});
    const oscillator = scoreAudioContext.createOscillator();
    const gain = scoreAudioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(640, scoreAudioContext.currentTime);
    gain.gain.setValueAtTime(0.025, scoreAudioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, scoreAudioContext.currentTime + 0.045);
    oscillator.connect(gain);
    gain.connect(scoreAudioContext.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start();
    oscillator.stop(scoreAudioContext.currentTime + 0.05);
  }

  function playScoreSound() {
    if (!profile.soundEnabled || window.ufoRunCrazy.isMuted() || adAudioSuspended || pageAudioSuspended) return;
    if (scoreAudioContext && scoreAudioBuffer) {
      if (scoreAudioContext.state === "suspended") scoreAudioContext.resume().catch(() => {});
      const source = scoreAudioContext.createBufferSource();
      const gain = scoreAudioContext.createGain();
      source.buffer = scoreAudioBuffer;
      gain.gain.value = scoreSound.volume;
      source.connect(gain);
      gain.connect(scoreAudioContext.destination);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      source.start(0, Math.min(scoreAudioStartOffset, scoreAudioBuffer.duration / 4));
      return;
    }
    // Fallback para navegadores sin Web Audio: reutiliza el audio ya precargado.
    stopAudio(scoreSound, true);
    try {
      scoreSound.currentTime = SCORE_AUDIO_FALLBACK_OFFSET_SECONDS;
    } catch (_error) {
      // El archivo todavía puede estar cargándose.
    }
    playAudio(scoreSound);
  }

  function clearIntroTimers() {
    introTimers.forEach((timer) => window.clearTimeout(timer));
    introTimers = [];
  }

  function finishIntro() {
    clearIntroTimers();
    if (state === "intro") state = "menu";
    syncInterface();
  }

  function revealMenuBehindIntro() {
    if (state !== "intro") return;
    state = "menu";
    syncInterface();
    introElement.hidden = false;
    introElement.dataset.phase = "outro";
  }

  function startIntro() {
    clearIntroTimers();
    state = "intro";
    introElement.dataset.phase = "studio";
    syncInterface();
    introTimers.push(window.setTimeout(() => {
      if (state === "intro") introElement.dataset.phase = "credits";
    }, 2300));
    introTimers.push(window.setTimeout(revealMenuBehindIntro, 5900));
    introTimers.push(window.setTimeout(finishIntro, 6550));
  }

  function openDialog(dialog) {
    if (dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.open = true;
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.open = false;
  }

  function pauseForModal(owner, mute = true) {
    if (state !== "playing" || gamePaused) return;
    gamePaused = true;
    pauseOwner = owner;
    accumulator = 0;
    if (mute) {
      silenceGameAudio();
    }
    syncInterface();
  }

  function resumeFromModal(owner) {
    if (!gamePaused || pauseOwner !== owner) return;
    gamePaused = false;
    pauseOwner = "";
    accumulator = 0;
    if (profile.soundEnabled) {
      playAudio(backgroundMusic);
      if (invincible) playAudio(invincibilitySound);
    }
    syncInterface();
    canvas.focus({ preventScroll: true });
  }

  function pauseGame() {
    if (state !== "playing" || gamePaused) return false;
    pauseForModal("pause");
    openDialog(document.getElementById("pause-dialog"));
    return true;
  }

  function resumeGame() {
    if (portraitQuery.matches || window.ufoRunCrazy.isAdPending() || transitionPending || document.hidden) return;
    scoreAudioContext?.resume().catch(() => {});
    closeDialog(document.getElementById("pause-dialog"));
    resumeFromModal("pause");
  }

  function silenceGameAudio() {
    for (const audio of [backgroundMusic, invincibilitySound, scoreSound, deathSound,
      achievementSound, difficultAchievementSound, ...activeEffects]) stopAudio(audio);
    activeEffects.clear();
    scoreAudioContext?.suspend().catch(() => {});
  }

  function handleAdState(event) {
    adAudioSuspended = event.detail.active;
    document.getElementById("ad-request-overlay").hidden = !event.detail.pending || event.detail.active;
    if (event.detail.pending) {
      pauseForModal("advertisement", event.detail.active);
      if (event.detail.active) silenceGameAudio();
    } else if (state === "playing" && gamePaused && pauseOwner === "advertisement") {
      pauseOwner = "pause";
      openDialog(document.getElementById("pause-dialog"));
    }
    accumulator = 0;
    previousTime = performance.now();
    syncInterface();
  }

  async function requestGameStart() {
    if (portraitQuery.matches || transitionPending || adRequestPending || window.ufoRunCrazy.isAdPending()) return;
    transitionPending = true;
    scoreAudioContext?.resume().catch(() => {});
    try {
      // CrazyGames supplies its own preroll. Only a completed round may request a
      // midgame ad, and never a round that already offered a rewarded continue.
      const shown = state === "gameover" && !runRewardOfferShown && !continueUsed
        ? await window.ufoRunCrazy.showMidgame() : false;
      startGame();
      if (shown || document.hidden) pauseGame();
    } finally {
      transitionPending = false;
      syncInterface();
    }
  }

  function requestMainMenu() {
    if (transitionPending || adRequestPending || window.ufoRunCrazy.isAdPending()) return;
    showMainMenu();
  }

  function syncOrientation() {
    const portrait = portraitQuery.matches;
    document.getElementById("rotate-screen").hidden = !portrait;
    const pauseDialog = document.getElementById("pause-dialog");
    if (portrait) {
      if (state === "playing" && !gamePaused) {
        gamePaused = true;
        pauseOwner = "orientation";
        accumulator = 0;
        silenceGameAudio();
      }
      if (pauseDialog.open) {
        orientationDialogDeferred = true;
        closeDialog(pauseDialog);
      }
    } else if (state === "playing" && gamePaused && (pauseOwner === "orientation" || orientationDialogDeferred)) {
      pauseOwner = "pause";
      orientationDialogDeferred = false;
      openDialog(pauseDialog);
    } else if (state !== "playing") {
      orientationDialogDeferred = false;
    }
  }

  function stopAudio(audio, rewind = false) {
    audio.pause();
    if (rewind) {
      try {
        audio.currentTime = 0;
      } catch (_error) {
        // El audio todavía puede no tener metadatos disponibles.
      }
    }
  }

  function startGame() {
    closeDialog(document.getElementById("pause-dialog"));
    gamePaused = false;
    pauseOwner = "";
    scoreAudioContext?.resume().catch(() => {});
    if (gamesStarted > 0) {
      backgroundIndex = (backgroundIndex + 1) % backgroundSources.length;
    }
    gamesStarted += 1;
    applyBackground();

    ufoY = HEIGHT / 2;
    jumpVelocity = 0;
    flightStarted = true;
    spikeCounter = 0;
    currentDifficulty = profile.difficulty;
    const difficulty = DIFFICULTIES[currentDifficulty];
    const pace = Flight.pacing(currentDifficulty, 0);
    spikeFrequency = pace.intervalFrames;
    spikeSpeed = pace.speed;
    currentRunId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    gatesCreated = 0;
    previousGapCenter = HEIGHT / 2;
    gatePattern = "level";
    spikes = [createSpikes(WIDTH * 0.82)];
    score = 0;
    creditedScore = 0;
    passedObstacles = 0;
    invincible = false;
    invincibleTime = 0;
    runUsedInvincibility = false;
    powerupActive = false;
    powerupX = WIDTH;
    powerupY = HEIGHT / 2;
    planetActive = false;
    planetPending = false;
    nextPlanetAt = PLANET_OBSTACLE_INTERVAL;
    planetX = WIDTH;
    planetY = HEIGHT / 2;
    planetVelocityY = 0;
    currentPlanet = null;
    planetGate = null;
    starGate = null;
    powerupVelocityY = 0;
    nextStarAt = FIRST_STAR_AT;
    starPending = false;
    nextAsteroidAt = difficulty.asteroidInterval ? difficulty.asteroidInterval / 2 : Number.POSITIVE_INFINITY;
    nextAsteroidImageIndex = 0;
    asteroidPending = false;
    specialSpawnCooldown = 0;
    specialSpawnCursor = 0;
    asteroids = [];
    bossActive = false;
    bossWarningActive = false;
    bossWarningFrames = 0;
    bossCompleted = false;
    bossTimeFrames = 0;
    bossX = WIDTH;
    bossY = HEIGHT / 2;
    bossProjectileCounter = 0;
    bossVolleyCount = 0;
    bossProjectiles = [];
    bossDefeatAnimating = false;
    bossDefeatFrames = 0;
    feedback = [];
    particles.forEach((particle) => { particle.life = 0; });
    runFrames = 0;
    runPlanets = 0;
    runPreviousBest = profile.bestScores[currentDifficulty];
    celebratedBest = false;
    deathReason = "spikes";
    tutorialVisible = !profile.onboardingDone;
    launchAssistFrames = tutorialVisible ? Math.round(FPS * 1.4) : 0;
    manualBoostReceived = false;
    jumpVelocity = launchAssistFrames ? 0 : JUMP_IMPULSE;
    lastProgressLabel = "";
    lastReward = 0;
    continueUsed = false;
    runRewardOfferShown = false;
    continueAdMessage = "One second chance per run";
    adRequestPending = false;
    shopMessage = "";
    accumulator = 0;
    state = "playing";
    profile.achievementStats.gamesStarted += 1;
    saveProfile();
    gameHud.textContent = "Score: 0";
    syncInterface();
    checkAchievements();

    stopAudio(invincibilitySound, true);
    if (!gamePaused) playAudio(backgroundMusic, true);
    canvas.focus({ preventScroll: true });
  }

  function showMainMenu() {
    closeDialog(document.getElementById("pause-dialog"));
    gamePaused = false;
    pauseOwner = "";
    state = "menu";
    syncInterface();
    accumulator = 0;
    stopAudio(backgroundMusic, true);
    stopAudio(invincibilitySound, true);
  }

  function showShop() {
    state = "shop";
    accumulator = 0;
    shopMessage = "";
    syncInterface();
    stopAudio(backgroundMusic, true);
    stopAudio(invincibilitySound, true);
  }

  function showHelp() {
    state = "help";
    accumulator = 0;
    syncInterface();
    stopAudio(backgroundMusic, true);
    stopAudio(invincibilitySound, true);
  }

  function showRanking() {
    rankingDifficulty = profile.difficulty;
    state = "ranking";
    accumulator = 0;
    syncInterface();
    stopAudio(backgroundMusic, true);
    stopAudio(invincibilitySound, true);
  }

  function showAchievements() {
    state = "achievements";
    accumulator = 0;
    syncInterface();
    stopAudio(backgroundMusic, true);
    stopAudio(invincibilitySound, true);
  }

  function selectDifficulty(difficulty) {
    if (!DIFFICULTIES[difficulty]) return;
    profile.difficulty = difficulty;
    rankingDifficulty = difficulty;
    saveProfile();
    syncInterface();
  }

  function selectRankingDifficulty(difficulty) {
    if (!DIFFICULTIES[difficulty]) return;
    rankingDifficulty = difficulty;
    syncInterface();
  }

  function toggleSound() {
    if (window.ufoRunCrazy.isMuted()) return;
    profile.soundEnabled = !profile.soundEnabled;
    saveProfile();
    syncInterface();
    if (!profile.soundEnabled) {
      silenceGameAudio();
    } else if (state === "playing" && !gamePaused && !document.hidden && !window.ufoRunCrazy.isAdPending()) {
      playAudio(backgroundMusic);
    }
  }

  function handleSkinAction(skin) {
    if (adRequestPending || transitionPending || window.ufoRunCrazy.isAdPending()) return;
    if (profile.selectedSkin === skin.id) {
      return;
    }

    if (profile.ownedSkins.includes(skin.id)) {
      profile.selectedSkin = skin.id;
      shopMessage = `${skin.name} EQUIPPED`;
    } else if (profile.credits >= skin.cost) {
      profile.credits -= skin.cost;
      profile.ownedSkins.push(skin.id);
      profile.selectedSkin = skin.id;
      shopMessage = `${skin.name} UNLOCKED`;
    } else {
      shopMessage = `NEED ${skin.cost - profile.credits} COINS`;
    }

    shopMessageUntil = performance.now() + 1800;
    saveProfile();
    syncInterface();
    checkAchievements();
    window.setTimeout(syncInterface, 1850);
  }

  async function requestRewardedAd(placement) {
    if (typeof window.ufoRunShowRewardedAd !== "function") return false;
    try {
      return await window.ufoRunShowRewardedAd({ placement }) === true;
    } catch (_error) {
      return false;
    }
  }

  async function handleCoinAd() {
    if (state !== "shop" || adRequestPending) return;
    refreshDailyAdCounter();
    if (profile.coinAdsToday >= DAILY_COIN_AD_LIMIT) {
      shopMessage = "DAILY LIMIT REACHED";
      shopMessageUntil = performance.now() + 2200;
      syncInterface();
      return;
    }

    adRequestPending = true;
    shopMessage = "LOADING AD";
    shopMessageUntil = Number.POSITIVE_INFINITY;
    syncInterface();
    const completed = await requestRewardedAd("shop-coins");
    adRequestPending = false;
    if (completed) {
      profile.credits += COIN_AD_REWARD;
      profile.coinAdsToday += 1;
      shopMessage = `+${COIN_AD_REWARD} COINS`;
      saveProfile();
    } else {
      shopMessage = "AD UNAVAILABLE";
    }
    shopMessageUntil = performance.now() + 2400;
    syncInterface();
    window.setTimeout(syncInterface, 2450);
  }

  function reviveAfterContinue() {
    continueUsed = true;
    continueAdMessage = "Second chance already used";
    ufoY = HEIGHT / 2 - UFO_HEIGHT / 2;
    jumpVelocity = 0;
    flightStarted = true;
    const safeRight = UFO_X + UFO_WIDTH + SPIKE_WIDTH;
    spikes = spikes.filter((spike) => spike.topX > safeRight);
    asteroids = asteroids.filter((asteroid) => asteroid.x > safeRight);
    bossProjectiles = [];
    invincible = true;
    invincibleTime = 0;
    runUsedInvincibility = true;
    syncInvincibilityDuration();
    state = "playing";
    accumulator = 0;
    syncInterface();
    playAudio(backgroundMusic, true);
    playAudio(invincibilitySound, true);
    canvas.focus({ preventScroll: true });
  }

  function handlePaidContinue() {
    if (state !== "gameover" || continueUsed || adRequestPending || profile.credits < CONTINUE_COIN_COST) return;
    profile.credits -= CONTINUE_COIN_COST;
    saveProfile();
    reviveAfterContinue();
    pauseGame();
  }

  async function handleContinueAd() {
    if (state !== "gameover" || continueUsed || adRequestPending) return;
    adRequestPending = true;
    continueAdMessage = "Loading ad...";
    syncInterface();
    const completed = await requestRewardedAd("continue");
    adRequestPending = false;
    if (completed) {
      reviveAfterContinue();
      pauseGame();
      return;
    }
    continueAdMessage = "Ad unavailable. Please try again later.";
    syncInterface();
  }

  function jump() {
    if (state === "playing" && !gamePaused && !document.hidden && !window.ufoRunCrazy.isAdPending()) {
      if (!flightStarted) {
        flightStarted = true;
        syncInterface();
      }
      jumpVelocity = JUMP_IMPULSE;
      manualBoostReceived = true;
      launchAssistFrames = 0;
      emitParticles(UFO_X + 5, ufoY + UFO_HEIGHT * 0.65, "#50dcff", 5);
    }
  }

  function createSpikes(x) {
    if (gatesCreated > 0 && gatesCreated % 5 === 0) {
      const choices = Flight.patterns.filter((pattern) => pattern !== gatePattern);
      gatePattern = choices[Math.floor(Math.random() * choices.length)];
    }
    const plan = Flight.gatePlan({ difficulty: currentDifficulty, index: gatesCreated,
      previousCenter: previousGapCenter, height: HEIGHT, pattern: gatePattern });
    previousGapCenter = plan.center;
    gatesCreated += 1;
    return {
      topX: x,
      topY: plan.top - SPIKE_HEIGHT,
      bottomX: x,
      bottomY: plan.bottom,
      pattern: gatePattern,
      counted: false,
    };
  }

  function randomBetween(min, max) {
    return min + Math.random() * Math.max(0, max - min);
  }

  function safeGapY(spike, size, preferredY = null) {
    const min = Math.max(20, spike.topY + SPIKE_HEIGHT + 12);
    const max = Math.min(HEIGHT - size - 20, spike.bottomY - size - 12);
    if (max < min) return Math.max(20, Math.min(HEIGHT - size - 20, (min + max) / 2));
    return preferredY === null ? randomBetween(min, max) : Math.max(min, Math.min(max, preferredY));
  }

  function collectibleY(size, x = spawnFromRight(size)) {
    const ahead = spikes.filter((spike) => spike.topX + SPIKE_WIDTH > UFO_X)
      .sort((a, b) => Math.abs(a.topX - x) - Math.abs(b.topX - x))[0];
    if (ahead) return safeGapY(ahead, size);
    return randomBetween(60, HEIGHT - size - 60);
  }

  function keepCollectibleClearOfSpikes(x, y, size) {
    const overlapping = spikes.filter((spike) => x < spike.topX + SPIKE_WIDTH && x + size > spike.topX)
      .sort((a, b) => Math.abs(a.topX - x) - Math.abs(b.topX - x))[0];
    return overlapping ? safeGapY(overlapping, size, y) : y;
  }

  function randomScreenY(size) {
    return randomBetween(20, HEIGHT - size - 20);
  }

  function spawnFromRight(size) {
    return WIDTH + size + 24;
  }

  function specialItemActive() {
    return planetActive || powerupActive || asteroids.length > 0;
  }

  function beginSpecialSpawnCooldown() {
    specialSpawnCooldown = SPECIAL_SPAWN_COOLDOWN_FRAMES;
  }

  function trySpawnPendingSpecial() {
    if (specialItemActive() || specialSpawnCooldown > 0) return;
    const pending = { planet: planetPending, asteroid: asteroidPending, star: starPending && !invincible };
    for (let offset = 0; offset < specialSpawnOrder.length; offset += 1) {
      const index = (specialSpawnCursor + offset) % specialSpawnOrder.length;
      const type = specialSpawnOrder[index];
      if (!pending[type]) continue;
      specialSpawnCursor = (index + 1) % specialSpawnOrder.length;
      if (type === "planet") activateRandomPlanet();
      else if (type === "asteroid") activateAsteroid();
      else activateStar();
      return;
    }
  }

  function activateRandomPlanet() {
    if (specialItemActive() || specialSpawnCooldown > 0) {
      planetPending = true;
      return;
    }
    const gate = collectibleGate();
    if (!gate) { planetPending = true; return; }
    if (!planetBag.length) planetBag = Flight.shuffledBag(planetSprites.length);
    currentPlanet = planetSprites[planetBag.pop()];
    planetGate = gate;
    planetX = gate.topX + (SPIKE_WIDTH - PLANET_SIZE) / 2;
    planetY = safeGapY(gate, PLANET_SIZE);
    planetVelocityY = 0;
    planetActive = true;
    planetPending = false;
  }

  function activateStar() {
    // No reutilizar ni recolocar una estrella que ya está atravesando la pantalla.
    if (specialItemActive() || specialSpawnCooldown > 0 || invincible) {
      starPending = true;
      return;
    }
    const gate = collectibleGate();
    if (!gate) { starPending = true; return; }
    starGate = gate;
    powerupX = gate.topX + (SPIKE_WIDTH - POWERUP_SIZE) / 2;
    powerupY = safeGapY(gate, POWERUP_SIZE);
    powerupVelocityY = (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.6, 1);
    powerupActive = true;
    starPending = false;
  }

  function collectibleGate() {
    // Attach rewards to an opening while it is still outside the viewport.
    // They then share its velocity and never jump vertically to dodge a wall.
    return spikes.find((gate) => gate.topX >= WIDTH + 24) || null;
  }

  function activateAsteroid() {
    if (specialItemActive() || specialSpawnCooldown > 0) {
      asteroidPending = true;
      return;
    }
    const imageName = ASTEROID_IMAGE_NAMES[nextAsteroidImageIndex];
    nextAsteroidImageIndex = (nextAsteroidImageIndex + 1) % ASTEROID_IMAGE_NAMES.length;
    const size = ASTEROID_SIZE;
    const x = spawnFromRight(size);
    const lane = asteroidSafeLane(size, x);
    asteroids.push({
      x,
      y: randomBetween(lane.minY, lane.maxY),
      minY: lane.minY,
      maxY: lane.maxY,
      velocityY: (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.8, 1.4),
      imageName,
      spriteName: imageName,
      size,
      counted: false,
    });
    addFeedback("INCOMING", WIDTH - 90, (lane.minY + lane.maxY + size) / 2, "#d5b5ff", 55);
    asteroidPending = false;
  }

  function asteroidSafeLane(size, x) {
    const margin = 18;
    const screenMinY = 20;
    const screenMaxY = Math.max(screenMinY, HEIGHT - size - 20);
    const nearestSpike = spikes
      .filter((spike) => spike.topX + SPIKE_WIDTH > UFO_X)
      .sort((left, right) => Math.abs(left.topX - x) - Math.abs(right.topX - x))[0];
    const gapTop = nearestSpike ? nearestSpike.topY + SPIKE_HEIGHT : HEIGHT * 0.38;
    const gapBottom = nearestSpike ? nearestSpike.bottomY : HEIGHT * 0.62;
    const lanes = [];
    const topMaxY = Math.min(screenMaxY, gapTop - size - margin);
    const bottomMinY = Math.max(screenMinY, gapBottom + margin);
    if (topMaxY >= screenMinY) lanes.push({ minY: screenMinY, maxY: topMaxY });
    if (bottomMinY <= screenMaxY) lanes.push({ minY: bottomMinY, maxY: screenMaxY });
    if (!lanes.length) return { minY: screenMinY, maxY: screenMaxY };
    return lanes[Math.floor(Math.random() * lanes.length)];
  }

  function moveDiagonal(item, size, speed) {
    const minY = Number.isFinite(item.minY) ? item.minY : 20;
    const maxY = Number.isFinite(item.maxY) ? item.maxY : HEIGHT - size - 20;
    item.x -= speed * WIDTH / 800;
    item.y += item.velocityY;
    if (item.y < minY) {
      item.y = minY;
      item.velocityY = Math.abs(item.velocityY);
    } else if (item.y > maxY) {
      item.y = maxY;
      item.velocityY = -Math.abs(item.velocityY);
    }
  }

  function moveFlyingItem(item, size, speed) {
    if (!mobileLayoutQuery.matches) {
      moveDiagonal(item, size, speed);
      return;
    }
    item.x -= speed * WIDTH / 800;
  }

  function moveHorizontalItem(item, speed) {
    item.x -= speed * WIDTH / 800;
  }

  function addFeedback(text, x, y, color, duration = 80) {
    if (feedback.length >= 8) feedback.shift();
    feedback.push({ text, x, y, color, age: 0, duration });
  }

  function emitParticles(x, y, color, count = 10) {
    if (reducedMotionQuery.matches) return;
    for (let index = 0; index < count; index++) {
      const particle = particles[nextParticle];
      nextParticle = (nextParticle + 1) % particles.length;
      Object.assign(particle, { x, y, color, vx: randomBetween(-2.8, 1.6),
        vy: randomBetween(-1.8, 1.8), life: randomBetween(16, 34), size: Math.random() < 0.6 ? 3 : 5 });
    }
  }

  function updateParticles(step = 1) {
    for (const particle of particles) {
      if (particle.life <= 0) continue;
      particle.life -= step;
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vx *= 0.97 ** step;
    }
  }

  function dismissTutorial() {
    tutorialVisible = false;
    profile.onboardingDone = true;
    saveProfile();
    syncInterface();
    canvas.focus({ preventScroll: true });
  }

  function rasterSprite(surface) {
    const pixels = surface.getContext("2d").getImageData(0, 0, surface.width, surface.height).data;
    const mask = new Uint8Array(surface.width * surface.height);
    for (let index = 0; index < mask.length; index += 1) {
      mask[index] = pixels[index * 4 + 3] > 100 ? 1 : 0;
    }
    return { image: surface, width: surface.width, height: surface.height, mask };
  }

  function spriteSurface(width, height) {
    const surface = document.createElement("canvas");
    surface.width = width;
    surface.height = height;
    surface.getContext("2d").imageSmoothingEnabled = false;
    return surface;
  }

  function getSprite(name) {
    if (spriteCache.has(name)) return spriteCache.get(name);
    let surface;
    if (name === "spikeTop" || name === "spikeBottom") {
      // Conserva el extremo original 100x200; repite el cuerpo sin estirar sus puntas.
      surface = spriteSurface(SPIKE_WIDTH, SPIKE_HEIGHT);
      const ctx = surface.getContext("2d");
      const top = name === "spikeTop";
      const tipY = top ? SPIKE_HEIGHT - SPIKE_SOURCE_HEIGHT : 0;
      ctx.drawImage(images[name], 0, tipY);
      const bodyStart = top ? 0 : SPIKE_SOURCE_HEIGHT;
      const bodyEnd = top ? tipY : SPIKE_HEIGHT;
      for (let y = bodyStart; y < bodyEnd; y += 160) {
        const height = Math.min(160, bodyEnd - y);
        ctx.drawImage(images[name], 0, top ? 0 : 40, 100, height, 0, y, 100, height);
      }
    } else if (name.startsWith("asteroid")) {
      const sourceName = name;
      const targetSize = ASTEROID_SIZE;
      const source = images[sourceName];
      let crop = asteroidCropCache.get(sourceName);
      if (source.width === targetSize && source.height === targetSize) {
        crop = { left: 0, top: 0, width: targetSize, height: targetSize };
      }
      if (!crop) {
        const scan = spriteSurface(source.width, source.height);
        scan.getContext("2d").drawImage(source, 0, 0);
        const data = scan.getContext("2d").getImageData(0, 0, source.width, source.height).data;
        let left = source.width, right = 0, top = source.height, bottom = 0;
        for (let y = 0; y < source.height; y += 1) {
          for (let x = 0; x < source.width; x += 1) {
            if (data[(y * source.width + x) * 4 + 3] > 100) {
              left = Math.min(left, x); right = Math.max(right, x);
              top = Math.min(top, y); bottom = Math.max(bottom, y);
            }
          }
        }
        crop = { left, top, width: right - left + 1, height: bottom - top + 1 };
        asteroidCropCache.set(sourceName, crop);
      }
      surface = spriteSurface(targetSize, targetSize);
      surface.getContext("2d").drawImage(source, crop.left, crop.top, crop.width, crop.height,
        0, 0, targetSize, targetSize);
    } else {
      surface = spriteSurface(POWERUP_SIZE, POWERUP_SIZE);
      surface.getContext("2d").drawImage(images[name], 0, 0, POWERUP_SIZE, POWERUP_SIZE);
    }
    const sprite = rasterSprite(surface);
    spriteCache.set(name, sprite);
    return sprite;
  }

  function getPlanetSprite() {
    const key = currentPlanet.imageName;
    if (spriteCache.has(key)) return spriteCache.get(key);
    const surface = spriteSurface(PLANET_SIZE, PLANET_SIZE);
    const crop = currentPlanet;
    const scale = Math.min(PLANET_SIZE / crop.width, PLANET_SIZE / crop.height);
    const width = crop.width * scale, height = crop.height * scale;
    surface.getContext("2d").drawImage(crop.image, crop.x, crop.y, crop.width, crop.height,
      (PLANET_SIZE - width) / 2, (PLANET_SIZE - height) / 2, width, height);
    const sprite = rasterSprite(surface);
    spriteCache.set(key, sprite);
    return sprite;
  }

  function selectedUfoImageName(dead = false) {
    return dead ? selectedSkin().deadImageName : selectedSkin().imageName;
  }

  function getUfoSprite(dead = false) {
    const name = selectedUfoImageName(dead);
    const angle = jumpVelocity < 0 ? -10 : 10;
    const key = name + ":" + angle;
    if (spriteCache.has(key)) return spriteCache.get(key);
    const radians = -angle * Math.PI / 180;
    const width = Math.ceil(UFO_WIDTH * Math.cos(radians) + UFO_HEIGHT * Math.abs(Math.sin(radians)));
    const height = Math.ceil(UFO_HEIGHT * Math.cos(radians) + UFO_WIDTH * Math.abs(Math.sin(radians)));
    const surface = spriteSurface(width, height);
    const ctx = surface.getContext("2d");
    ctx.translate(width / 2, height / 2);
    ctx.rotate(radians);
    ctx.drawImage(images[name], -UFO_WIDTH / 2, -UFO_HEIGHT / 2, UFO_WIDTH, UFO_HEIGHT);
    const sprite = rasterSprite(surface);
    spriteCache.set(key, sprite);
    return sprite;
  }

  function spriteRect(sprite, x, y) {
    return { sprite, x: Math.trunc(x), y: Math.trunc(y), width: sprite.width, height: sprite.height };
  }

  function rectanglesOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
      a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function opaqueOverlap(a, b) {
    if (!rectanglesOverlap(a, b)) return false;
    const left = Math.max(a.x, b.x), right = Math.min(a.x + a.width, b.x + b.width);
    const top = Math.max(a.y, b.y), bottom = Math.min(a.y + a.height, b.y + b.height);
    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        if (a.sprite.mask[(y - a.y) * a.width + x - a.x] &&
          b.sprite.mask[(y - b.y) * b.width + x - b.x]) return true;
      }
    }
    return false;
  }

  function collidesWithSpikes(ufoRect) {
    for (const spike of spikes) {
      if (opaqueOverlap(ufoRect, spriteRect(getSprite("spikeTop"), spike.topX, spike.topY)) ||
        opaqueOverlap(ufoRect, spriteRect(getSprite("spikeBottom"), spike.bottomX, spike.bottomY))) return true;
    }
    return false;
  }

  function finishFrameAsGameOver() {
    if (state !== "playing") return;
    emitParticles(UFO_X + UFO_WIDTH / 2, ufoY + UFO_HEIGHT / 2, "#ff8a89", 24);
    lastReward = Math.max(0, score - creditedScore);
    profile.credits += lastReward;
    creditedScore += lastReward;
    profile.bestScores[currentDifficulty] = Math.max(profile.bestScores[currentDifficulty], score);
    checkAchievements();
    recordRankingScore();
    saveProfile();
    state = "gameover";
    tutorialVisible = false;
    continueAdMessage = continueUsed
      ? "Second chance already used" : "One second chance per run";
    syncInterface();
    accumulator = 0;
    stopAudio(backgroundMusic);
    stopAudio(invincibilitySound, true);
    showNextAchievement();
  }

  function endInvincibility(rewindSound = true, force = false) {
    if (!invincible) return;
    clampUfoToBounds(getUfoSprite());
    invincible = false;
    invincibleTime = 0;
    if (rewindSound) stopAudio(invincibilitySound, true);
  }

  function clampUfoToBounds(sprite = getUfoSprite()) {
    const maxY = Math.max(0, HEIGHT - sprite.height);
    if (ufoY < 0) {
      ufoY = 0;
      jumpVelocity = Math.max(0, jumpVelocity);
    } else if (ufoY > maxY) {
      ufoY = maxY;
      jumpVelocity = Math.min(0, jumpVelocity);
    }
  }

  function bossDimensions() {
    const width = Math.min(WIDTH * 0.54, 460);
    const source = images.cosmicBoss;
    const aspect = source?.width && source?.height ? source.height / source.width : 0.5;
    return { width, height: width * aspect };
  }

  function bossDurationFrames() {
    return DIFFICULTIES[currentDifficulty].bossDurationSeconds * FPS;
  }

  function bossTargetX(dimensions) {
    return WIDTH - dimensions.width + 18;
  }

  function startBossWarning() {
    if (bossWarningActive || bossActive || bossDefeatAnimating || bossCompleted ||
      score < DIFFICULTIES[currentDifficulty].bossTriggerScore) return false;
    bossWarningActive = true;
    bossWarningFrames = 0;
    powerupActive = false;
    planetActive = false;
    asteroids = [];
    starPending = false;
    planetPending = false;
    asteroidPending = false;
    specialSpawnCooldown = 0;
    addFeedback("WARNING", WIDTH / 2, HEIGHT * 0.35, "#ff5b69", BOSS_WARNING_FRAMES);
    return true;
  }

  function startBossBattle() {
    if (bossActive || bossDefeatAnimating || bossCompleted ||
      score < DIFFICULTIES[currentDifficulty].bossTriggerScore) return false;
    const dimensions = bossDimensions();
    bossWarningActive = false;
    bossWarningFrames = 0;
    bossActive = true;
    bossTimeFrames = 0;
    bossX = WIDTH + 32;
    bossY = Math.max(90, HEIGHT * 0.24 - dimensions.height / 2);
    bossProjectileCounter = 0;
    bossVolleyCount = 0;
    bossProjectiles = [];
    bossDefeatAnimating = false;
    bossDefeatFrames = 0;
    spikes = [];
    spikeCounter = 0;
    powerupActive = false;
    planetActive = false;
    asteroids = [];
    starPending = false;
    planetPending = false;
    asteroidPending = false;
    specialSpawnCooldown = 0;
    addFeedback("COSMIC BOSS!", WIDTH / 2, HEIGHT * 0.42, "#d881ff", 150);
    syncInterface();
    return true;
  }

  function checkBossTrigger() {
    if (!bossCompleted && !bossActive && !bossDefeatAnimating && !bossWarningActive &&
      score >= DIFFICULTIES[currentDifficulty].bossTriggerScore) startBossWarning();
  }

  function updateBossWarning(ufoRect, speedMultiplier) {
    let hit = false;
    for (const spike of spikes) {
      spike.topX -= spikeSpeed * speedMultiplier * WIDTH / 800;
      spike.bottomX -= spikeSpeed * speedMultiplier * WIDTH / 800;
      if (!invincible && (opaqueOverlap(ufoRect, spriteRect(getSprite("spikeTop"), spike.topX, spike.topY)) ||
        opaqueOverlap(ufoRect, spriteRect(getSprite("spikeBottom"), spike.bottomX, spike.bottomY)))) hit = true;
    }
    spikes = spikes.filter((spike) => spike.topX + SPIKE_WIDTH > 0);
    bossWarningFrames += 1;
    if (bossWarningFrames >= BOSS_WARNING_FRAMES && !hit) startBossBattle();
    return hit;
  }

  function createBossProjectile(targetY) {
    const dimensions = bossDimensions();
    const size = 16;
    const x = bossX + dimensions.width * 0.08;
    const y = bossY + dimensions.height * 0.55;
    const dx = UFO_X + UFO_WIDTH / 2 - x;
    const dy = targetY - y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const speed = DIFFICULTIES[currentDifficulty].bossProjectileSpeed * Math.max(0.72, WIDTH / 800);
    bossProjectiles.push({ x, y, size, velocityX: dx / length * speed, velocityY: dy / length * speed });
  }

  function fireBossVolley() {
    bossVolleyCount += 1;
    const targetY = ufoY + UFO_HEIGHT / 2;
    if (bossVolleyCount % 4 === 0) {
      createBossProjectile(targetY - 90);
      createBossProjectile(targetY);
      createBossProjectile(targetY + 90);
    } else {
      createBossProjectile(targetY);
    }
  }

  function finishBossBattle() {
    if (!bossActive) return;
    bossActive = false;
    bossDefeatAnimating = true;
    bossDefeatFrames = 0;
    bossProjectiles = [];
    bossTimeFrames = bossDurationFrames();
  }

  function completeBossDefeat() {
    if (!bossDefeatAnimating) return;
    bossDefeatAnimating = false;
    bossCompleted = true;
    window.ufoRunCrazy.happytime();
    score += BOSS_SCORE_REWARD;
    profile.credits += BOSS_COIN_REWARD;
    profile.achievementStats.bossesDefeated += 1;
    if (currentDifficulty === "hard") profile.achievementStats.hardBossesDefeated += 1;
    profile.achievementStats.bossDefeatsByDifficulty[currentDifficulty] += 1;
    spikeCounter = 0;
    addFeedback(`BOSS DEFEATED! +${BOSS_SCORE_REWARD}`, WIDTH / 2, HEIGHT * 0.42, "#50dcff", 190);
    saveProfile();
    syncInterface();
    checkAchievements();
  }

  function updateBossDefeatAnimation() {
    bossDefeatFrames += 1;
    bossY += 1.5 + bossDefeatFrames * 0.035;
    bossX += Math.sin(bossDefeatFrames / 8) * 1.25;
    if (bossDefeatFrames >= BOSS_DEFEAT_ANIMATION_FRAMES) completeBossDefeat();
  }

  function updateBossBattle(ufoRect) {
    const dimensions = bossDimensions();
    const targetX = bossTargetX(dimensions);
    bossX += (targetX - bossX) * 0.045;
    bossY = Math.max(58, HEIGHT * 0.34 - dimensions.height / 2 + Math.sin(bossTimeFrames / 34) * 42);
    bossProjectileCounter += 1;
    if (bossProjectileCounter >= DIFFICULTIES[currentDifficulty].bossProjectileInterval && bossX < WIDTH - 20) {
      bossProjectileCounter = 0;
      fireBossVolley();
    }

    let hit = false;
    for (const projectile of bossProjectiles) {
      projectile.x += projectile.velocityX;
      projectile.y += projectile.velocityY;
      if (!invincible && rectanglesOverlap(ufoRect, {
        x: projectile.x, y: projectile.y, width: projectile.size, height: projectile.size,
      })) { hit = true; deathReason = "boss"; }
    }
    bossProjectiles = bossProjectiles.filter((projectile) => projectile.x + projectile.size >= -20 &&
      projectile.x <= WIDTH + 20 && projectile.y + projectile.size >= -20 && projectile.y <= HEIGHT + 20);
    bossTimeFrames += 1;
    if (bossTimeFrames >= bossDurationFrames() && !hit) finishBossBattle();
    return hit;
  }

  function finishGameplayUpdate(diedThisFrame) {
    const protectedThisFrame = invincible;
    if (invincible) {
      invincibleTime += 1;
      if (invincibleTime >= invincibilityDurationFrames) {
        endInvincibility();
        // No modificar la posición de ninguna estrella al terminar el efecto.
      }
    }
    feedback.forEach((item) => { item.age += 1; });
    feedback = feedback.filter((item) => item.age < item.duration);
    updateParticles();
    if (runFrames % 6 === 0) emitParticles(UFO_X + 3, ufoY + UFO_HEIGHT * 0.65, "#50dcff", 1);
    if (achievementQueue.length && !achievementToastTimer) showNextAchievement();

    if (diedThisFrame && !protectedThisFrame) {
      playEffect(deathSound);
      finishFrameAsGameOver();
    }
  }

  function updateGame() {
    const difficulty = DIFFICULTIES[currentDifficulty];
    const portraitSpeedMultiplier = 1;
    if (!flightStarted) return;
    runFrames += 1;
    if (specialSpawnCooldown > 0) specialSpawnCooldown -= 1;
    if (launchAssistFrames > 0 && !manualBoostReceived) {
      launchAssistFrames -= 1;
      if (!launchAssistFrames) jumpVelocity = JUMP_IMPULSE;
    } else {
      jumpVelocity = Math.min(MAX_FALL_SPEED, jumpVelocity + GRAVITY);
      ufoY += jumpVelocity;
    }
    const ufoSprite = getUfoSprite();
    if (invincible) clampUfoToBounds(ufoSprite);
    const ufoRect = spriteRect(ufoSprite, UFO_X, ufoY);
    let diedThisFrame = !invincible && (ufoRect.y < 0 || ufoRect.y + ufoRect.height > HEIGHT);
    if (diedThisFrame) deathReason = ufoRect.y < 0 ? "ceiling" : "floor";

    if (bossWarningActive) {
      diedThisFrame = updateBossWarning(ufoRect, portraitSpeedMultiplier) || diedThisFrame;
      finishGameplayUpdate(diedThisFrame);
      return;
    }

    if (bossActive) {
      diedThisFrame = updateBossBattle(ufoRect) || diedThisFrame;
      finishGameplayUpdate(diedThisFrame);
      return;
    }

    if (bossDefeatAnimating) {
      updateBossDefeatAnimation();
      finishGameplayUpdate(diedThisFrame);
      return;
    }

    spikeCounter += 1;
    const spawnInterval = spikeFrequency;
    if (spikeCounter > spawnInterval) {
      spikes.push(createSpikes(spawnFromRight(SPIKE_WIDTH)));
      spikeCounter = 0;
    }

    const remainingSpikes = [];
    for (const spike of spikes) {
      spike.topX -= spikeSpeed * portraitSpeedMultiplier * WIDTH / 800;
      spike.bottomX -= spikeSpeed * portraitSpeedMultiplier * WIDTH / 800;
      if (spike.topX + SPIKE_WIDTH <= 0) continue;
      remainingSpikes.push(spike);
      if (!spike.counted && UFO_X > spike.topX + SPIKE_WIDTH) {
        spike.counted = true;
        passedObstacles += 1;
        score += 1;
        emitParticles(UFO_X + UFO_WIDTH, ufoY + UFO_HEIGHT / 2, "#83f5d1", 8);
        if (!celebratedBest && runPreviousBest > 0 && score > runPreviousBest) {
          celebratedBest = true;
          addFeedback("NEW BEST", UFO_X + 100, ufoY - 35, "#ffd648", 100);
          playUiSound();
        } else if ([5, 10, 25, 50].includes(score)) {
          addFeedback(`${score} POINTS`, WIDTH / 2, 115, "#50dcff", 85);
        }
        if (tutorialVisible && passedObstacles >= 2) dismissTutorial();
        playScoreSound();
        checkAchievements();
        checkBossTrigger();
        if (!bossActive && !bossWarningActive) {
          const pace = Flight.pacing(currentDifficulty, passedObstacles);
          spikeSpeed = pace.speed;
          spikeFrequency = pace.intervalFrames;
        }
        if (!bossActive && !bossWarningActive && passedObstacles >= nextPlanetAt) {
          planetPending = true;
          nextPlanetAt += PLANET_OBSTACLE_INTERVAL;
        }
        if (!bossActive && !bossWarningActive && passedObstacles >= nextStarAt) {
          starPending = true;
          nextStarAt += STAR_OBSTACLE_INTERVAL;
        }
        if (!bossActive && !bossWarningActive && difficulty.asteroidInterval && passedObstacles >= nextAsteroidAt) {
          asteroidPending = true;
          nextAsteroidAt += difficulty.asteroidInterval;
        }
      }
    }
    spikes = bossActive ? [] : remainingSpikes;
    if (bossWarningActive) {
      finishGameplayUpdate(diedThisFrame);
      return;
    }
    if (bossActive) {
      diedThisFrame = updateBossBattle(ufoRect) || diedThisFrame;
      finishGameplayUpdate(diedThisFrame);
      return;
    }

    if (powerupActive) {
      const star = { x: powerupX, y: powerupY, velocityY: powerupVelocityY };
      const starSpeed = spikeSpeed * portraitSpeedMultiplier;
      moveHorizontalItem(star, starSpeed);
      powerupX = starGate ? starGate.topX + (SPIKE_WIDTH - POWERUP_SIZE) / 2 : star.x;
      powerupY = star.y;
      powerupVelocityY = star.velocityY;
      if (opaqueOverlap(ufoRect, spriteRect(getSprite("powerup"), powerupX, powerupY))) {
        invincible = true;
        invincibleTime = 0;
        runUsedInvincibility = true;
        profile.achievementStats.starsCollected += 1;
        syncInvincibilityDuration();
        powerupActive = false;
        beginSpecialSpawnCooldown();
        addFeedback("INVINCIBLE", UFO_X + UFO_WIDTH / 2, ufoY - 42, "#ffd648");
        emitParticles(powerupX, powerupY, "#ffd648", 20);
        playAudio(invincibilitySound, true);
        checkAchievements();
      } else if (powerupX + POWERUP_SIZE < 0) {
        powerupActive = false;
        beginSpecialSpawnCooldown();
      }
    }

    if (planetActive) {
      planetX = planetGate ? planetGate.topX + (SPIKE_WIDTH - PLANET_SIZE) / 2
        : planetX - spikeSpeed * portraitSpeedMultiplier * WIDTH / 800;
      if (opaqueOverlap(ufoRect, spriteRect(getPlanetSprite(), planetX, planetY))) {
        score += 1;
        runPlanets += 1;
        profile.achievementStats.planetsCollected += 1;
        if (!profile.achievementStats.planetIds.includes(currentPlanet.imageName)) {
          profile.achievementStats.planetIds.push(currentPlanet.imageName);
        }
        playScoreSound();
        addFeedback("+1", planetX + PLANET_SIZE / 2, planetY, "#50dcff");
        emitParticles(planetX + PLANET_SIZE / 2, planetY + PLANET_SIZE / 2, "#50dcff", 16);
        planetActive = false;
        beginSpecialSpawnCooldown();
        checkBossTrigger();
        checkAchievements();
      } else if (planetX + PLANET_SIZE < 0) {
        planetActive = false;
        beginSpecialSpawnCooldown();
      }
    }

    const asteroidWasActive = asteroids.length > 0;
    for (const asteroid of asteroids) {
      const asteroidSpeed = Math.max(ASTEROID_SPEED, spikeSpeed * 2) * portraitSpeedMultiplier;
      moveFlyingItem(asteroid, asteroid.size, asteroidSpeed);
      if (!asteroid.counted && UFO_X > asteroid.x + asteroid.size) {
        asteroid.counted = true;
        profile.achievementStats.asteroidsPassed += 1;
        checkAchievements();
      }
      if (!invincible && opaqueOverlap(ufoRect,
        spriteRect(getSprite(asteroid.spriteName), asteroid.x, asteroid.y))) {
        diedThisFrame = true;
        deathReason = "asteroid";
      }
    }
    asteroids = asteroids.filter((asteroid) => asteroid.x + asteroid.size >= 0);
    if (asteroidWasActive && asteroids.length === 0) beginSpecialSpawnCooldown();
    if (!diedThisFrame) trySpawnPendingSpecial();
    if (!invincible && collidesWithSpikes(ufoRect)) {
      diedThisFrame = true;
      deathReason = "spikes";
    }

    finishGameplayUpdate(diedThisFrame);
  }

  function drawSprite(sprite, x, y) {
    context.imageSmoothingEnabled = false;
    context.drawImage(sprite.image, Math.trunc(x), Math.trunc(y));
  }

  function drawSpikes() {
    for (const spike of spikes) {
      drawSprite(getSprite("spikeTop"), spike.topX, spike.topY);
      drawSprite(getSprite("spikeBottom"), spike.bottomX, spike.bottomY);
    }
  }

  function drawBossBattle() {
    if (!bossActive && !bossDefeatAnimating) return;
    const dimensions = bossDimensions();
    context.save();
    context.imageSmoothingEnabled = false;
    context.shadowColor = "#632dff";
    context.shadowBlur = 18;
    if (bossDefeatAnimating) {
      const progress = bossDefeatFrames / BOSS_DEFEAT_ANIMATION_FRAMES;
      context.globalAlpha = Math.max(0, 1 - progress * 0.75);
      context.translate(bossX + dimensions.width / 2, bossY + dimensions.height / 2);
      context.rotate(progress * 1.35);
      context.drawImage(images.cosmicBoss, -dimensions.width / 2, -dimensions.height / 2,
        Math.trunc(dimensions.width), Math.trunc(dimensions.height));
    } else {
      // Tres cortes del sprite se desplazan de forma independiente para dar
      // vida a la cabeza, el cuerpo y la cola sin perder el pixel art original.
      const slices = [0, 0.3, 0.72, 1];
      for (let index = 0; index < slices.length - 1; index += 1) {
        const start = slices[index], end = slices[index + 1];
        const sourceY = Math.floor(images.cosmicBoss.height * start);
        const sourceHeight = Math.ceil(images.cosmicBoss.height * (end - start));
        const destinationY = bossY + dimensions.height * start;
        const destinationHeight = dimensions.height * (end - start);
        const sway = index === 0 ? Math.sin(bossTimeFrames / 7) * 5
          : index === 2 ? Math.sin(bossTimeFrames / 9 + 1.8) * 7 : Math.sin(bossTimeFrames / 13) * 2;
        context.drawImage(images.cosmicBoss, 0, sourceY, images.cosmicBoss.width, sourceHeight,
          Math.trunc(bossX + sway), Math.trunc(destinationY),
          Math.trunc(dimensions.width), Math.ceil(destinationHeight));
      }
    }
    context.restore();

    if (bossActive && bossProjectileCounter >= DIFFICULTIES[currentDifficulty].bossProjectileInterval - 22) {
      // A visible charge cue precedes every volley; it is not a damaging projectile.
      const mouthX = bossX + dimensions.width * 0.08;
      const mouthY = bossY + dimensions.height * 0.55;
      context.strokeStyle = "#ffd648";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(mouthX, mouthY, 15, 0, Math.PI * 2);
      context.stroke();
    }

    for (const projectile of bossProjectiles) {
      const x = Math.trunc(projectile.x), y = Math.trunc(projectile.y), size = projectile.size;
      context.save();
      context.fillStyle = "#371078";
      context.shadowColor = "#50dcff";
      context.shadowBlur = 12;
      context.fillRect(x, y, size, size);
      context.fillStyle = "#d94cff";
      context.fillRect(x + 3, y + 3, size - 6, size - 6);
      context.fillStyle = "#eaffff";
      context.fillRect(x + Math.floor(size / 2) - 2, y + Math.floor(size / 2) - 2, 4, 4);
      context.restore();
    }
  }

  function drawBossWarning() {
    if (!bossWarningActive) return;
    const seconds = Math.max(1, Math.ceil((BOSS_WARNING_FRAMES - bossWarningFrames) / FPS));
    context.save();
    context.fillStyle = "rgba(23,7,30,.92)";
    const boxWidth = Math.min(WIDTH * 0.65, 450);
    context.fillRect((WIDTH - boxWidth) / 2, 72, boxWidth, 104);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "#000";
    context.shadowBlur = 8;
    context.fillStyle = "#ff5b69";
    context.font = '26px "UFO Run", monospace';
    context.fillText("BOSS INCOMING", WIDTH / 2, 103);
    context.fillStyle = "#eef7ff";
    context.font = '14px "UFO Run", monospace';
    context.fillText("Dodge the volleys. Survive to win.", WIDTH / 2, 130);
    context.fillStyle = "#ffd648";
    context.font = '22px "UFO Run", monospace';
    context.fillText(String(seconds), WIDTH / 2, 157);
    context.restore();
  }

  function drawWorld() {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    drawSpikes();
    if (planetActive && currentPlanet) drawSprite(getPlanetSprite(), planetX, planetY);
    if (powerupActive) drawSprite(getSprite("powerup"), powerupX, powerupY);
    for (const asteroid of asteroids) drawSprite(getSprite(asteroid.spriteName), asteroid.x, asteroid.y);
    drawBossBattle();
  }

  function drawFeedback() {
    const reducedMotion = reducedMotionQuery.matches;
    for (const item of feedback) {
      const progress = item.age / item.duration;
      context.save();
      context.globalAlpha = Math.min(1, (1 - progress) * 3);
      context.font = '22px "UFO Run", monospace';
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillStyle = item.color;
      context.shadowColor = "#000";
      context.shadowBlur = 5;
      context.fillText(item.text, Math.max(90, Math.min(WIDTH - 90, item.x)),
        Math.max(55, item.y - (reducedMotion ? 0 : progress * 48)));
      context.restore();
    }
  }

  function drawInvincibilityCountdown(sprite) {
    const remainingFrames = Math.max(0, invincibilityDurationFrames - invincibleTime);
    const remainingSeconds = Math.max(1, Math.ceil(remainingFrames / FPS));
    context.save();
    context.font = '18px "UFO Run", monospace';
    context.textAlign = "center";
    context.textBaseline = "bottom";
    context.lineWidth = 4;
    context.strokeStyle = "rgba(0,0,0,.9)";
    context.fillStyle = "#ffd648";
    const x = UFO_X + sprite.width / 2;
    const y = Math.max(26, ufoY - 9);
    const label = `${remainingSeconds}s`;
    context.strokeText(label, x, y);
    context.fillText(label, x, y);
    context.restore();
  }

  function render() {
    if (state === "loading") return;
    if (!["playing", "gameover"].includes(state)) {
      context.clearRect(0, 0, WIDTH, HEIGHT);
      needsRender = false;
      return;
    }
    drawWorld();
    for (const particle of particles) {
      if (particle.life <= 0) continue;
      context.globalAlpha = Math.min(1, particle.life / 12);
      context.fillStyle = particle.color;
      context.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
    }
    context.globalAlpha = 1;
    if (state === "playing" || state === "gameover") {
      const sprite = getUfoSprite(state === "gameover");
      drawSprite(sprite, UFO_X, ufoY);
      if (invincible && state === "playing") {
        context.save();
        context.strokeStyle = "#50dcff";
        context.lineWidth = 2;
        context.shadowColor = "#50dcff";
        context.shadowBlur = 10;
        context.beginPath();
        context.ellipse(UFO_X + sprite.width / 2, ufoY + sprite.height / 2,
          sprite.width / 2 + 8, sprite.height / 2 + 8, 0, 0, Math.PI * 2);
        context.stroke();
        context.restore();
        drawInvincibilityCountdown(sprite);
      }
    }
    if (state === "playing" && !gamePaused && !document.hidden && !window.ufoRunCrazy.isAdPending()) {
      drawFeedback();
      drawBossWarning();
      const scoreLabel = "Score: " + formatPoints(score);
      document.getElementById("invincible-label").hidden = !invincible;
      if (gameHud.textContent !== scoreLabel) gameHud.textContent = scoreLabel;
      const goal = Flight.nextTarget(score, runPreviousBest, DIFFICULTIES[currentDifficulty].bossTriggerScore, bossCompleted);
      const progressLabel = `Next: ${goal.label} · ${score}/${goal.score}`;
      if (progressLabel !== lastProgressLabel) {
        document.getElementById("flight-target").textContent = progressLabel;
        document.getElementById("flight-progress-fill").style.transform = `scaleX(${Math.min(1, score / goal.score)})`;
        lastProgressLabel = progressLabel;
      }
      if (bossActive) {
        const durationFrames = bossDurationFrames();
        const remainingRatio = Math.max(0, (durationFrames - bossTimeFrames) / durationFrames);
        document.getElementById("boss-timer").textContent = `${Math.max(0,
          Math.ceil((durationFrames - bossTimeFrames) / FPS))}s`;
        document.getElementById("boss-time-fill").style.transform = `scaleX(${remainingRatio})`;
      }
    }
  }

  function frame(now) {
    const elapsed = Math.min(now - previousTime, 100);
    previousTime = now;

    if (state === "playing" && !gamePaused && !document.hidden && !window.ufoRunCrazy.isAdPending()) {
      accumulator += elapsed;
      while (accumulator >= FIXED_STEP_MS && state === "playing" && !gamePaused && !document.hidden && !window.ufoRunCrazy.isAdPending()) {
        updateGame();
        accumulator -= FIXED_STEP_MS;
      }
    } else {
      accumulator = 0;
    }

    if (state === "gameover" && !document.hidden) updateParticles(elapsed / FIXED_STEP_MS);

    if (state === "playing" || state === "gameover" || needsRender) render();
    animationFrameId = requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    if (!gamePaused) jump();
  });

  window.addEventListener("keydown", (event) => {
    if (portraitQuery.matches || window.ufoRunCrazy.isAdPending() || transitionPending || adRequestPending || document.hidden) return;
    if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]")) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // Native button activation stays accessible; gameplay keys never scroll the portal.
    if ((event.code === "Space" || event.code === "Enter") &&
      event.target instanceof HTMLElement && event.target.closest("button")) return;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    if (state === "intro" && event.code === "Enter") {
      event.preventDefault();
      finishIntro();
    } else if (state === "playing" && event.code === "KeyP") {
      event.preventDefault();
      if (gamePaused && pauseOwner === "pause") resumeGame();
      else pauseGame();
    } else if (state === "playing" && ["Space", "ArrowUp", "KeyW"].includes(event.code) && !gamePaused) {
      event.preventDefault();
      jump();
    } else if (state === "menu" && (event.code === "Space" || event.code === "Enter")) {
      event.preventDefault();
      void requestGameStart();
    } else if (state === "menu" && event.code === "KeyT") {
      event.preventDefault();
      showShop();
    } else if (["shop", "help", "ranking", "achievements"].includes(state) && event.code === "Backspace") {
      event.preventDefault();
      showMainMenu();
    } else if (state === "gameover" && ["KeyR", "Enter", "Space"].includes(event.code)) {
      event.preventDefault();
      void requestGameStart();
    }
  });

  buildShopInterface();
  buildAchievementsInterface();
  for (const [id, handler] of Object.entries({
    "play-button": requestGameStart,
    "restart-button": requestGameStart,
    "shop-button": showShop,
    "help-button": showHelp,
    "ranking-button": showRanking,
    "achievements-button": showAchievements,
    "back-button": showMainMenu,
    "menu-button": requestMainMenu,
    "coin-ad-button": handleCoinAd,
    "continue-ad-button": handleContinueAd,
    "continue-coins-button": handlePaidContinue,
    "sound-button": toggleSound,
    "pause-button": pauseGame,
    "skip-intro-button": finishIntro,
    "credits-button": startIntro,
    "skip-tutorial-button": dismissTutorial,
    "resume-button": resumeGame,
    "pause-restart-button": requestGameStart,
    "pause-menu-button": requestMainMenu,
  })) {
    document.getElementById(id).addEventListener("click", () => {
      if (window.ufoRunCrazy.isAdPending() || transitionPending || adRequestPending) return;
      playUiSound();
      handler();
    });
  }
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!adRequestPending && !transitionPending && !window.ufoRunCrazy.isAdPending()) selectDifficulty(button.dataset.difficulty);
    });
  });
  document.querySelectorAll("[data-ranking-difficulty]").forEach((button) => {
    button.addEventListener("click", () => selectRankingDifficulty(button.dataset.rankingDifficulty));
  });
  document.getElementById("pause-dialog").addEventListener("cancel", (event) => {
    event.preventDefault();
    resumeGame();
  });
  window.addEventListener("ufo-crazy-ad-state", handleAdState);
  window.addEventListener("ufo-crazy-availability", syncInterface);
  window.addEventListener("ufo-crazy-audio", () => {
    if (window.ufoRunCrazy.isMuted()) silenceGameAudio();
    else if (state === "playing" && !gamePaused && !document.hidden) playAudio(backgroundMusic);
    syncInterface();
  });
  portraitQuery.addEventListener("change", () => { resizeGame(); syncInterface(); });
  window.setInterval(() => {
    if (["shop", "gameover"].includes(state) && window.ufoRunCrazy.isAvailable()) syncInterface();
  }, 1000);
  document.addEventListener("fullscreenchange", syncInterface);
  document.addEventListener("webkitfullscreenchange", syncInterface);
  document.addEventListener("visibilitychange", () => {
    pageAudioSuspended = document.hidden;
    if (document.hidden) {
      if (state === "playing" && !gamePaused) pauseGame();
      silenceGameAudio();
    }
    accumulator = 0;
    previousTime = performance.now();
  });
  window.addEventListener("blur", () => {
    pageAudioSuspended = true;
    if (state === "playing" && !gamePaused) pauseGame();
    silenceGameAudio();
  });
  window.addEventListener("focus", () => {
    pageAudioSuspended = document.hidden;
  });
  syncOrientation();
  resizeGame();
  if (window.ResizeObserver) {
    new ResizeObserver(resizeGame).observe(canvas);
  } else {
    window.addEventListener("resize", resizeGame);
  }

  loadAssets()
    .then(() => {
      showMainMenu();
      previousTime = performance.now();
      animationFrameId = requestAnimationFrame(frame);
    })
    .catch((error) => {
      cancelAnimationFrame(animationFrameId);
      context.fillStyle = "#000";
      context.fillRect(0, 0, WIDTH, HEIGHT);
      context.fillStyle = BLUE;
      context.font = '30px "UFO Run", monospace';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("Could not load game assets", WIDTH / 2, HEIGHT / 2);
      window.ufoLoading.fail("Could not load the game. Check your connection and try again.");
      document.getElementById("retry-loading-button").hidden = false;
      console.error(error);
    });
})();
