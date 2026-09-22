(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const context = canvas.getContext("2d");

  let WIDTH = 800;
  let HEIGHT = 600;
  const FPS = 80;
  const FIXED_STEP_MS = 1000 / FPS;

  const BLUE = "rgb(50, 120, 240)";

  let UFO_X = 150;
  const UFO_WIDTH = 55;
  const UFO_HEIGHT = 38;
  const GRAVITY = 0.25;
  const JUMP_IMPULSE = -6;

  const SPIKE_WIDTH = 100;
  const SPIKE_SOURCE_HEIGHT = 200;
  let SPIKE_HEIGHT = 600;
  const INITIAL_SPIKE_FREQUENCY = 90;
  const INITIAL_SPIKE_SPEED = 3;
  const MOBILE_SPIKE_INTERVAL_MULTIPLIER = 1.65;
  const MOBILE_PORTRAIT_SPIKE_GAP = 240;
  const mobileLayoutQuery = window.matchMedia(
    "(pointer: coarse), (max-width: 700px), (orientation: landscape) and (max-height: 550px)",
  );
  const mobilePortraitQuery = window.matchMedia("(orientation: portrait) and (max-width: 700px)");

  const POWERUP_SIZE = 50;
  const POWERUP_SPEED = 4;
  const ASTEROID_SPEED = POWERUP_SPEED * 2;
  const INVINCIBILITY_FALLBACK_SECONDS = 5;
  const PLANET_SIZE = 80;
  const PLANET_OBSTACLE_INTERVAL = 3;
  const STAR_OBSTACLE_INTERVAL = 12;
  const ASTEROID_SIZE = 64;
  const MOBILE_PORTRAIT_ASTEROID_SIZE = 48;
  const ASTEROID_OBSTACLE_INTERVAL = 10;
  const ASTEROID_IMAGE_NAMES = ["asteroid", "asteroid2"];
  const COIN_AD_REWARD = 50;
  const DAILY_COIN_AD_LIMIT = 10;
  const SCORE_AUDIO_FALLBACK_OFFSET_SECONDS = 0.12;
  const SCORE_AUDIO_SILENCE_THRESHOLD = 0.012;
  const SPECIAL_SPAWN_COOLDOWN_FRAMES = 48;
  const BOSS_TRIGGER_SCORE = 100;
  const BOSS_WARNING_FRAMES = FPS * 3;
  const BOSS_DURATION_FRAMES = FPS * 30;
  const BOSS_SCORE_REWARD = 10;
  const BOSS_COIN_REWARD = 50;
  const NAME_CHANGE_COST = 100;
  const ADMIN_PASSWORD = "9701";
  const DIFFICULTIES = {
    easy: { name: "Fácil", description: "Sin asteroides, velocidad y aumento más suaves",
      initialSpeed: 2.35, initialFrequency: 110, progressionEvery: 6,
      speedIncrement: 0.25, frequencyDecrease: 3, asteroidInterval: 0,
      mobilePortraitSpeedMultiplier: 1.12, mobilePortraitIntervalMultiplier: 1.75,
      bossProjectileInterval: 120, bossProjectileSpeed: 3.4 },
    normal: { name: "Normal", description: "Experiencia original de UFO RUN",
      initialSpeed: INITIAL_SPIKE_SPEED, initialFrequency: INITIAL_SPIKE_FREQUENCY,
      progressionEvery: 4, speedIncrement: 0.5, frequencyDecrease: 5,
      asteroidInterval: ASTEROID_OBSTACLE_INTERVAL,
      mobilePortraitSpeedMultiplier: 1.25, mobilePortraitIntervalMultiplier: 1.55,
      bossProjectileInterval: 90, bossProjectileSpeed: 4.2 },
    hard: { name: "Difícil", description: "El doble de apariciones de asteroides",
      initialSpeed: INITIAL_SPIKE_SPEED, initialFrequency: INITIAL_SPIKE_FREQUENCY,
      progressionEvery: 4, speedIncrement: 0.5, frequencyDecrease: 5,
      asteroidInterval: ASTEROID_OBSTACLE_INTERVAL / 2,
      mobilePortraitSpeedMultiplier: 1.45, mobilePortraitIntervalMultiplier: 1.3,
      bossProjectileInterval: 65, bossProjectileSpeed: 5 },
  };


  const PROFILE_STORAGE_KEY = "ufoRunProfileV1";
  const COUNTRY_SKIN_COST = 48;
  const SKINS = [
    { id: "classic", name: "CLASICA", imageName: "ufo", deadImageName: "ufoGreenDead", cost: 0, accent: "rgb(64, 210, 122)" },
    { id: "nova", name: "NOVA ROJA", imageName: "ufoRed", deadImageName: "ufoRedDead", cost: 12, accent: "rgb(235, 74, 80)" },
    { id: "solar", name: "SOLAR", imageName: "ufoYellow", deadImageName: "ufoYellowDead", cost: 24, accent: "rgb(255, 205, 62)" },
    { id: "pulsar", name: "PULSAR AZUL", imageName: "ufoBlue", deadImageName: "ufoBlueDead", cost: 36, accent: "rgb(68, 154, 255)" },
    { id: "venezuela", name: "VENEZUELA", imageName: "ufoVenezuela", deadImageName: "ufoVenezuelaDead", cost: COUNTRY_SKIN_COST, accent: "rgb(255, 205, 62)" },
    { id: "argentina", name: "ARGENTINA", imageName: "ufoArgentina", deadImageName: "ufoArgentinaDead", cost: COUNTRY_SKIN_COST, accent: "rgb(107, 207, 246)" },
  ];

  const backgroundSources = ["src/fondo.jpg", "src/Fondo-2.png", "src/Fondo-3.png"];

  const planetCropSources = [
    { imageName: "planetMercury", x: 146, y: 54, width: 813, height: 1096 },
    { imageName: "planetVenus", x: 210, y: 53, width: 749, height: 851 },
    { imageName: "planetEarth", x: 132, y: 53, width: 1060, height: 1145 },
    { imageName: "planetMars", x: 97, y: 212, width: 1111, height: 968 },
    { imageName: "planetJupiter", x: 210, y: 54, width: 628, height: 916 },
    { imageName: "planetSaturn", x: 198, y: 53, width: 815, height: 779 },
    { imageName: "planetUranus", x: 146, y: 53, width: 1064, height: 1097 },
    { imageName: "planetNeptune", x: 97, y: 53, width: 1111, height: 1127 },
    { imageName: "planetPluto", x: 425, y: 383, width: 422, height: 380 },
  ];

  const imageSources = {
    background: "src/fondo.jpg",
    background2: "src/Fondo-2.png",
    background3: "src/Fondo-3.png",
    introPresentation: "src/BZStudios_presenta.png",
    brandLogo: "src/Logo_bz.png",
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
  let scoreAudioContext = null;
  let scoreAudioBuffer = null;
  let scoreAudioStartOffset = SCORE_AUDIO_FALLBACK_OFFSET_SECONDS;

  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.4;
  deathSound.volume = 0.3;
  scoreSound.volume = 0.3;
  invincibilitySound.volume = 0.3;

  let invincibilityDurationFrames = Math.round(INVINCIBILITY_FALLBACK_SECONDS * FPS);

  function syncInvincibilityDuration() {
    if (Number.isFinite(invincibilitySound.duration) && invincibilitySound.duration > 0) {
      invincibilityDurationFrames = Math.max(1, Math.round(invincibilitySound.duration * FPS));
    }
    return invincibilityDurationFrames;
  }

  invincibilitySound.addEventListener("loadedmetadata", syncInvincibilityDuration);
  invincibilitySound.addEventListener("ended", () => {
    if (invincible && profile.soundEnabled) endInvincibility(false);
  });

  for (const audio of [backgroundMusic, deathSound, scoreSound, invincibilitySound]) {
    audio.preload = "auto";
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
  let continueAdMessage = "Revive una vez en esta partida";
  let adRequestPending = false;
  let introTimers = [];

  function localDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function cleanPlayerName(value) {
    const cleaned = String(value || "").trim().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 12);
    return cleaned || "PILOTO";
  }

  function normalizeRankings(value) {
    const result = { easy: [], normal: [], hard: [] };
    for (const difficulty of Object.keys(DIFFICULTIES)) {
      if (!Array.isArray(value?.[difficulty])) continue;
      result[difficulty] = value[difficulty].map((entry, index) => ({
        id: typeof entry?.id === "string" ? entry.id : `legacy-${difficulty}-${index}`,
        name: cleanPlayerName(entry?.name),
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

  function loadProfile() {
    const fallback = {
      credits: 0,
      bestScores: normalizeBestScores(),
      ownedSkins: ["classic"],
      selectedSkin: "classic",
      soundEnabled: true,
      coinAdDay: localDayKey(),
      coinAdsToday: 0,
      difficulty: "normal",
      playerName: "PILOTO",
      playerNameConfirmed: false,
      rankings: normalizeRankings(),
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
        coinAdDay: typeof stored.coinAdDay === "string" ? stored.coinAdDay : localDayKey(),
        coinAdsToday: Math.max(0, Math.min(DAILY_COIN_AD_LIMIT,
          Math.trunc(Number(stored.coinAdsToday) || 0))),
        difficulty: DIFFICULTIES[stored.difficulty] ? stored.difficulty : "normal",
        playerName: cleanPlayerName(stored.playerName),
        playerNameConfirmed: stored.playerNameConfirmed === true,
        rankings: normalizeRankings(stored.rankings),
      };
    } catch (_error) {
      return fallback;
    }
  }

  let profile = loadProfile();
  const globalRankings = { easy: null, normal: null, hard: null };
  const globalRankingStatus = { easy: "idle", normal: "idle", hard: "idle" };
  const globalRankingRequestIds = { easy: 0, normal: 0, hard: 0 };

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
  let powerupVelocityY = 0;
  let nextStarAt = STAR_OBSTACLE_INTERVAL;
  let starPending = false;
  let nextAsteroidAt = ASTEROID_OBSTACLE_INTERVAL / 2;
  let nextAsteroidImageIndex = 0;
  let asteroidPending = false;
  let specialSpawnCooldown = 0;
  let asteroids = [];
  let bossActive = false;
  let bossCompleted = false;
  let bossTimeFrames = 0;
  let bossX = WIDTH;
  let bossY = HEIGHT / 2;
  let bossProjectileCounter = 0;
  let bossVolleyCount = 0;
  let bossProjectiles = [];
  let feedback = [];
  let flightStarted = false;
  let bossWarningActive = false;
  let bossWarningFrames = 0;
  let adminUnlocked = false;
  const spriteCache = new Map();

  const interfaceElement = document.getElementById("interface");
  const introElement = document.getElementById("intro-screen");
  const playerNameScreen = document.getElementById("player-name-screen");
  const gameHud = document.getElementById("game-hud");
  const screenElements = {
    menu: document.getElementById("menu-screen"),
    shop: document.getElementById("shop-screen"),
    help: document.getElementById("help-screen"),
    ranking: document.getElementById("ranking-screen"),
    gameover: document.getElementById("gameover-screen"),
  };
  const skinCards = new Map();
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
      preview.alt = `Nave ${skin.name}`;
      const ownership = document.createElement("p");
      const button = document.createElement("button");
      button.type = "button";
      button.addEventListener("click", () => handleSkinAction(skin));
      card.append(heading, preview, ownership, button);
      grid.append(card);
      skinCards.set(skin.id, { card, ownership, button });
    }
  }

  function renderRanking() {
    const body = document.getElementById("ranking-body");
    const subtitle = document.getElementById("ranking-subtitle");
    body.replaceChildren();
    const globalEntries = globalRankings[rankingDifficulty];
    const status = globalRankingStatus[rankingDifficulty];
    const entries = Array.isArray(globalEntries) ? globalEntries : profile.rankings[rankingDifficulty];
    subtitle.textContent = status === "loading"
      ? "Cargando ranking global..."
      : Array.isArray(globalEntries) ? "Mejores pilotos globales" : "Mejores pilotos de este dispositivo";
    if (!entries.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.className = "ranking-empty";
      cell.textContent = "Aún no hay puntuaciones en esta dificultad";
      row.append(cell);
      body.append(row);
      return;
    }
    entries.forEach((entry, index) => {
      const row = document.createElement("tr");
      for (const value of [index + 1, entry.name, entry.score]) {
        const cell = document.createElement("td");
        cell.textContent = String(value);
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
      existing.name = profile.playerName;
    } else {
      entries.push({ id: currentRunId, name: profile.playerName, score });
    }
    entries.sort((a, b) => b.score - a.score);
    profile.rankings[currentDifficulty] = entries.slice(0, 10);
    submitGlobalScore(currentDifficulty, profile.playerName, score);
  }

  function normalizeGlobalScores(value) {
    if (!Array.isArray(value)) return [];
    return value.map((entry) => ({
      name: cleanPlayerName(entry?.name),
      score: Math.max(0, Math.trunc(Number(entry?.score) || 0)),
    })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
  }

  async function loadGlobalRanking(difficulty, force = false) {
    if (!DIFFICULTIES[difficulty] || typeof window.fetch !== "function") return;
    if (!force && (globalRankingStatus[difficulty] === "loading" || Array.isArray(globalRankings[difficulty]))) return;
    const requestId = ++globalRankingRequestIds[difficulty];
    globalRankingStatus[difficulty] = "loading";
    if (state === "ranking" && rankingDifficulty === difficulty) renderRanking();
    try {
      const response = await window.fetch(`/api/scores?difficulty=${encodeURIComponent(difficulty)}`,
        { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Ranking ${response.status}`);
      const payload = await response.json();
      if (requestId !== globalRankingRequestIds[difficulty]) return;
      globalRankings[difficulty] = normalizeGlobalScores(payload.scores);
      globalRankingStatus[difficulty] = "ready";
    } catch (_error) {
      if (requestId !== globalRankingRequestIds[difficulty]) return;
      globalRankings[difficulty] = null;
      globalRankingStatus[difficulty] = "fallback";
    }
    if (state === "ranking" && rankingDifficulty === difficulty) renderRanking();
  }

  async function submitGlobalScore(difficulty, name, submittedScore) {
    if (typeof window.fetch !== "function") return;
    try {
      const response = await window.fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, name, score: submittedScore }),
      });
      if (!response.ok) return;
      globalRankings[difficulty] = null;
      globalRankingStatus[difficulty] = "idle";
      if (state === "ranking" && rankingDifficulty === difficulty) loadGlobalRanking(difficulty, true);
    } catch (_error) {
      // El resultado local permanece disponible si el servicio global no responde.
    }
  }

  function syncInterface() {
    refreshDailyAdCounter();
    document.getElementById("toolbar").hidden = ["loading", "intro", "name"].includes(state);
    introElement.hidden = state !== "intro";
    playerNameScreen.hidden = state !== "name";
    document.querySelector(".wallet").hidden = state === "playing";
    document.getElementById("authors-footer").hidden = state !== "gameover";
    document.getElementById("invincible-label").hidden = state !== "playing" || !invincible;
    document.getElementById("boss-hud").hidden = state !== "playing" || !bossActive;
    document.getElementById("flight-start-prompt").hidden = state !== "playing" || flightStarted;
    gameHud.hidden = state !== "playing";
    interfaceElement.hidden = !screenElements[state];
    for (const [name, screen] of Object.entries(screenElements)) {
      screen.hidden = name !== state;
    }
    if (interfaceState !== state) {
      interfaceElement.scrollTop = 0;
      interfaceState = state;
    }
    document.querySelectorAll("[data-credits]").forEach((element) => {
      element.textContent = String(profile.credits);
    });
    document.querySelectorAll("[data-best-score]").forEach((element) => {
      const difficulty = ["playing", "gameover"].includes(state) ? currentDifficulty : profile.difficulty;
      element.textContent = String(profile.bestScores[difficulty]);
    });
    const skin = selectedSkin();
    document.getElementById("equipped-preview").src = imageSources[skin.imageName];
    document.getElementById("equipped-name").textContent = skin.name;
    document.getElementById("equipped-name").style.color = skin.accent;
    document.getElementById("back-button").hidden = !["shop", "help", "ranking"].includes(state);
    const soundButton = document.getElementById("sound-button");
    soundButton.setAttribute("aria-pressed", String(!profile.soundEnabled));
    soundButton.setAttribute("aria-label", profile.soundEnabled ? "Silenciar sonido" : "Activar sonido");
    document.getElementById("fullscreen-button").hidden = !document.documentElement.requestFullscreen;
    document.getElementById("final-score").textContent = String(score);
    document.getElementById("run-reward").textContent = `+${lastReward} monedas guardadas`;
    document.getElementById("shop-status").textContent = shopMessage && performance.now() < shopMessageUntil
      ? shopMessage : "Gana monedas superando obstáculos";
    const coinAdsRemaining = Math.max(0, DAILY_COIN_AD_LIMIT - profile.coinAdsToday);
    const coinAdButton = document.getElementById("coin-ad-button");
    coinAdButton.textContent = adRequestPending && state === "shop"
      ? "Cargando anuncio..." : coinAdsRemaining > 0 ? `Ver anuncio +${COIN_AD_REWARD}` : "Límite diario alcanzado";
    coinAdButton.disabled = adRequestPending || coinAdsRemaining === 0;
    document.getElementById("coin-ad-remaining").textContent = coinAdsRemaining === 1
      ? "1 anuncio disponible hoy" : `${coinAdsRemaining} anuncios disponibles hoy`;
    const continueAdButton = document.getElementById("continue-ad-button");
    continueAdButton.hidden = continueUsed;
    continueAdButton.disabled = adRequestPending;
    continueAdButton.innerHTML = adRequestPending && state === "gameover"
      ? "Cargando anuncio..." : '<span aria-hidden="true">▶</span> Ver video y continuar';
    document.getElementById("continue-ad-status").textContent = continueUsed
      ? "Continuación utilizada en esta partida" : continueAdMessage;
    document.querySelectorAll("[data-difficulty]").forEach((button) => {
      const selected = button.dataset.difficulty === profile.difficulty;
      button.setAttribute("aria-checked", String(selected));
    });
    document.getElementById("difficulty-description").textContent = DIFFICULTIES[profile.difficulty].description;
    const playerNameInput = document.getElementById("player-name");
    if (playerNameInput.value !== profile.playerName) playerNameInput.value = profile.playerName;
    playerNameInput.readOnly = true;
    document.querySelectorAll("[data-ranking-difficulty]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.rankingDifficulty === rankingDifficulty));
    });
    if (state === "ranking") renderRanking();
    for (const skin of SKINS) {
      const elements = skinCards.get(skin.id);
      const owned = profile.ownedSkins.includes(skin.id);
      const equipped = profile.selectedSkin === skin.id;
      elements.card.classList.toggle("owned", owned);
      elements.card.classList.toggle("equipped", equipped);
      elements.ownership.textContent = owned ? "En tu colección" : "Desbloquear";
      elements.button.textContent = equipped ? "Equipada" : owned ? "Equipar" : `${skin.cost} monedas`;
      elements.button.disabled = equipped;
      elements.button.setAttribute("aria-label", equipped ? `${skin.name} equipada` : owned
        ? `Equipar ${skin.name}` : `Comprar ${skin.name} por ${skin.cost} monedas`);
    }
  }

  function resizeGame() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const oldWidth = WIDTH;
    const oldHeight = HEIGHT;
    const oldSpikeHeight = SPIKE_HEIGHT;
    const aspect = bounds.width / bounds.height;
    WIDTH = aspect < 1 ? 450 : 600 * aspect;
    HEIGHT = aspect < 1 ? 450 / aspect : 600;
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
      asteroid.y = Math.max(0, Math.min(HEIGHT - asteroid.size, asteroid.y + centerShift));
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
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    context.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error(`No se pudo cargar ${source}`)), { once: true });
      image.src = source;
    });
  }

  async function loadAssets() {
    const entries = Object.entries(imageSources);
    const loaded = await Promise.all(entries.map(([, source]) => loadImage(source)));
    entries.forEach(([name], index) => {
      images[name] = loaded[index];
    });
    planetSprites = planetCropSources.map((crop) => ({
      image: images[crop.imageName],
      ...crop,
    }));
    await prepareScoreAudio();
    await document.fonts.load('74px "UFO Run"');
    applyBackground();
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
    if (!profile.soundEnabled) {
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
    const effect = source.cloneNode();
    effect.volume = source.volume;
    playAudio(effect);
  }

  function playScoreSound() {
    if (!profile.soundEnabled) return;
    if (scoreAudioContext && scoreAudioBuffer) {
      if (scoreAudioContext.state === "suspended") scoreAudioContext.resume().catch(() => {});
      const source = scoreAudioContext.createBufferSource();
      const gain = scoreAudioContext.createGain();
      source.buffer = scoreAudioBuffer;
      gain.gain.value = scoreSound.volume;
      source.connect(gain);
      gain.connect(scoreAudioContext.destination);
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

  function showPlayerNameEntry() {
    state = "name";
    const input = document.getElementById("entry-player-name");
    input.value = profile.playerNameConfirmed ? profile.playerName : "";
    document.getElementById("player-name-error").hidden = true;
    syncInterface();
    window.setTimeout(() => input.focus(), 0);
  }

  function confirmPlayerName(rawName) {
    if (!String(rawName || "").trim()) {
      document.getElementById("player-name-error").hidden = false;
      return false;
    }
    profile.playerName = cleanPlayerName(rawName).toUpperCase();
    profile.playerNameConfirmed = true;
    saveProfile();
    startIntro();
    return true;
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

  function beginNameEdit() {
    const error = document.getElementById("name-edit-error");
    if (profile.credits < NAME_CHANGE_COST) {
      error.textContent = `Necesitas ${NAME_CHANGE_COST} monedas para cambiar el nombre.`;
      error.hidden = false;
      openDialog(document.getElementById("name-edit-dialog"));
      return false;
    }
    const input = document.getElementById("new-player-name");
    input.value = profile.playerName;
    error.hidden = true;
    openDialog(document.getElementById("name-edit-dialog"));
    window.setTimeout(() => input.focus(), 0);
    return true;
  }

  function confirmNameEdit(rawName) {
    const input = document.getElementById("new-player-name");
    const error = document.getElementById("name-edit-error");
    const nextName = cleanPlayerName(rawName).toUpperCase();
    if (!String(rawName || "").trim()) {
      error.textContent = "Escribe un nombre válido.";
      error.hidden = false;
      return false;
    }
    if (nextName === profile.playerName) {
      error.textContent = "Escribe un nombre diferente.";
      error.hidden = false;
      return false;
    }
    if (profile.credits < NAME_CHANGE_COST) {
      error.textContent = `Necesitas ${NAME_CHANGE_COST} monedas.`;
      error.hidden = false;
      return false;
    }
    profile.credits -= NAME_CHANGE_COST;
    profile.playerName = nextName;
    profile.playerNameConfirmed = true;
    input.value = nextName;
    saveProfile();
    closeDialog(document.getElementById("name-edit-dialog"));
    syncInterface();
    return true;
  }

  function openAdmin() {
    if (adminUnlocked) {
      document.getElementById("admin-status").textContent = "Selecciona una acción.";
      openDialog(document.getElementById("admin-panel-dialog"));
      return;
    }
    const password = document.getElementById("admin-password");
    password.value = "";
    document.getElementById("admin-password-error").hidden = true;
    openDialog(document.getElementById("admin-login-dialog"));
    window.setTimeout(() => password.focus(), 0);
  }

  function unlockAdmin(rawPassword) {
    if (String(rawPassword) !== ADMIN_PASSWORD) {
      document.getElementById("admin-password-error").hidden = false;
      return false;
    }
    adminUnlocked = true;
    closeDialog(document.getElementById("admin-login-dialog"));
    openAdmin();
    return true;
  }

  function adminAddCoins() {
    if (!adminUnlocked) return false;
    profile.credits += 100;
    saveProfile();
    syncInterface();
    document.getElementById("admin-status").textContent = "+100 monedas agregadas.";
    return true;
  }

  function adminEnableInvincibility() {
    if (!adminUnlocked || state !== "playing") {
      document.getElementById("admin-status").textContent = "Inicia una partida para activar la invencibilidad.";
      return false;
    }
    invincible = true;
    invincibleTime = 0;
    syncInvincibilityDuration();
    playAudio(invincibilitySound, true);
    syncInterface();
    document.getElementById("admin-status").textContent = "Invencibilidad activada.";
    return true;
  }

  function adminTestBoss() {
    if (!adminUnlocked || state !== "playing" || bossActive || bossWarningActive || bossCompleted) {
      document.getElementById("admin-status").textContent = "Inicia una partida sin un jefe activo.";
      return false;
    }
    score = BOSS_TRIGGER_SCORE;
    flightStarted = true;
    startBossWarning();
    document.getElementById("admin-status").textContent = "Prueba de jefe iniciada.";
    return true;
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
    scoreAudioContext?.resume().catch(() => {});
    if (gamesStarted > 0) {
      backgroundIndex = (backgroundIndex + 1) % backgroundSources.length;
    }
    gamesStarted += 1;
    applyBackground();

    ufoY = HEIGHT / 2;
    jumpVelocity = 0;
    flightStarted = false;
    spikeCounter = 0;
    currentDifficulty = profile.difficulty;
    const difficulty = DIFFICULTIES[currentDifficulty];
    spikeFrequency = difficulty.initialFrequency;
    spikeSpeed = difficulty.initialSpeed;
    currentRunId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    spikes = [];
    score = 0;
    creditedScore = 0;
    passedObstacles = 0;
    invincible = false;
    invincibleTime = 0;
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
    powerupVelocityY = 0;
    nextStarAt = STAR_OBSTACLE_INTERVAL;
    starPending = false;
    nextAsteroidAt = difficulty.asteroidInterval ? difficulty.asteroidInterval / 2 : Number.POSITIVE_INFINITY;
    nextAsteroidImageIndex = 0;
    asteroidPending = false;
    specialSpawnCooldown = 0;
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
    feedback = [];
    lastReward = 0;
    continueUsed = false;
    continueAdMessage = "Revive una vez en esta partida";
    adRequestPending = false;
    shopMessage = "";
    accumulator = 0;
    state = "playing";
    gameHud.textContent = "Puntaje: 0";
    syncInterface();

    stopAudio(invincibilitySound, true);
    playAudio(backgroundMusic, true);
    canvas.focus({ preventScroll: true });
  }

  function showMainMenu() {
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
    loadGlobalRanking(rankingDifficulty);
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
    loadGlobalRanking(difficulty);
  }

  function toggleSound() {
    profile.soundEnabled = !profile.soundEnabled;
    saveProfile();
    syncInterface();
    if (!profile.soundEnabled) {
      stopAudio(backgroundMusic);
      stopAudio(invincibilitySound);
    } else if (state === "playing") {
      playAudio(backgroundMusic);
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  function handleSkinAction(skin) {
    if (profile.selectedSkin === skin.id) {
      return;
    }

    if (profile.ownedSkins.includes(skin.id)) {
      profile.selectedSkin = skin.id;
      shopMessage = `${skin.name} EQUIPADA`;
    } else if (profile.credits >= skin.cost) {
      profile.credits -= skin.cost;
      profile.ownedSkins.push(skin.id);
      profile.selectedSkin = skin.id;
      shopMessage = `${skin.name} DESBLOQUEADA`;
    } else {
      shopMessage = `FALTAN ${skin.cost - profile.credits} MONEDAS`;
    }

    shopMessageUntil = performance.now() + 1800;
    saveProfile();
    syncInterface();
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
      shopMessage = "LÍMITE DIARIO ALCANZADO";
      shopMessageUntil = performance.now() + 2200;
      syncInterface();
      return;
    }

    adRequestPending = true;
    shopMessage = "CARGANDO ANUNCIO";
    shopMessageUntil = Number.POSITIVE_INFINITY;
    syncInterface();
    const completed = await requestRewardedAd("shop-coins");
    adRequestPending = false;
    if (completed) {
      profile.credits += COIN_AD_REWARD;
      profile.coinAdsToday += 1;
      shopMessage = `+${COIN_AD_REWARD} MONEDAS`;
      saveProfile();
    } else {
      shopMessage = "ANUNCIO NO DISPONIBLE";
    }
    shopMessageUntil = performance.now() + 2400;
    syncInterface();
    window.setTimeout(syncInterface, 2450);
  }

  function reviveAfterAd() {
    continueUsed = true;
    continueAdMessage = "Continuación utilizada en esta partida";
    ufoY = HEIGHT / 2 - UFO_HEIGHT / 2;
    jumpVelocity = 0;
    flightStarted = true;
    const safeRight = UFO_X + UFO_WIDTH + SPIKE_WIDTH;
    spikes = spikes.filter((spike) => spike.topX > safeRight);
    asteroids = asteroids.filter((asteroid) => asteroid.x > safeRight);
    bossProjectiles = [];
    invincible = true;
    invincibleTime = 0;
    syncInvincibilityDuration();
    state = "playing";
    accumulator = 0;
    syncInterface();
    playAudio(backgroundMusic, true);
    playAudio(invincibilitySound, true);
    canvas.focus({ preventScroll: true });
  }

  async function handleContinueAd() {
    if (state !== "gameover" || continueUsed || adRequestPending) return;
    adRequestPending = true;
    continueAdMessage = "Cargando anuncio...";
    syncInterface();
    const completed = await requestRewardedAd("continue");
    adRequestPending = false;
    if (completed) {
      reviveAfterAd();
      return;
    }
    continueAdMessage = "Anuncio no disponible. Inténtalo de nuevo.";
    syncInterface();
  }

  function jump() {
    if (state === "playing") {
      if (!flightStarted) {
        flightStarted = true;
        syncInterface();
      }
      jumpVelocity = JUMP_IMPULSE;
    }
  }

  function createSpikes(x) {
    const spread = Math.min(150, HEIGHT * 0.18);
    const gapCenter = randomBetween(HEIGHT / 2 - spread, HEIGHT / 2 + spread);
    const gap = mobilePortraitQuery.matches ? MOBILE_PORTRAIT_SPIKE_GAP : 180;
    return {
      topX: x,
      topY: gapCenter - gap / 2 - SPIKE_HEIGHT,
      bottomX: x,
      bottomY: gapCenter + gap / 2,
      counted: false,
    };
  }

  function randomBetween(min, max) {
    return min + Math.random() * Math.max(0, max - min);
  }

  function collectibleY(size) {
    const ahead = spikes.filter((spike) => spike.topX > UFO_X)
      .sort((a, b) => b.topX - a.topX)[0];
    const min = ahead ? ahead.topY + SPIKE_HEIGHT + 12 : 60;
    const max = ahead ? ahead.bottomY - size - 12 : HEIGHT - size - 60;
    return randomBetween(Math.max(20, min), Math.min(HEIGHT - size - 20, max));
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
    if (starPending) {
      if (!invincible) activateStar();
      return;
    }
    if (planetPending) {
      activateRandomPlanet();
    } else if (asteroidPending) {
      activateAsteroid();
    }
  }

  function activateRandomPlanet() {
    if (specialItemActive() || specialSpawnCooldown > 0) {
      planetPending = true;
      return;
    }
    currentPlanet = planetSprites[Math.floor(Math.random() * planetSprites.length)];
    planetX = spawnFromRight(PLANET_SIZE);
    planetY = mobileLayoutQuery.matches ? randomScreenY(PLANET_SIZE) : collectibleY(PLANET_SIZE);
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
    powerupX = spawnFromRight(POWERUP_SIZE);
    powerupY = mobileLayoutQuery.matches ? randomScreenY(POWERUP_SIZE) : collectibleY(POWERUP_SIZE);
    powerupVelocityY = (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.6, 1);
    powerupActive = true;
    starPending = false;
  }

  function activateAsteroid() {
    if (specialItemActive() || specialSpawnCooldown > 0) {
      asteroidPending = true;
      return;
    }
    const imageName = ASTEROID_IMAGE_NAMES[nextAsteroidImageIndex];
    nextAsteroidImageIndex = (nextAsteroidImageIndex + 1) % ASTEROID_IMAGE_NAMES.length;
    const size = mobilePortraitQuery.matches ? MOBILE_PORTRAIT_ASTEROID_SIZE : ASTEROID_SIZE;
    asteroids.push({
      x: spawnFromRight(size),
      y: randomBetween(40, HEIGHT - size - 40),
      velocityY: (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.8, 1.4),
      imageName,
      spriteName: size === ASTEROID_SIZE ? imageName : `${imageName}Small`,
      size,
    });
    asteroidPending = false;
  }

  function moveDiagonal(item, size, speed) {
    item.x -= speed * WIDTH / 800;
    item.y += item.velocityY;
    if (item.y < 20) {
      item.y = 20;
      item.velocityY = Math.abs(item.velocityY);
    } else if (item.y > HEIGHT - size - 20) {
      item.y = HEIGHT - size - 20;
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

  function addFeedback(text, x, y, color, duration = 80) {
    feedback.push({ text, x, y, color, age: 0, duration });
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
      const small = name.endsWith("Small");
      const sourceName = small ? name.slice(0, -5) : name;
      const targetSize = small ? MOBILE_PORTRAIT_ASTEROID_SIZE : ASTEROID_SIZE;
      const source = images[sourceName];
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
      surface = spriteSurface(targetSize, targetSize);
      surface.getContext("2d").drawImage(source, left, top, right - left + 1, bottom - top + 1,
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
    lastReward = Math.max(0, score - creditedScore);
    profile.credits += lastReward;
    creditedScore += lastReward;
    profile.bestScores[currentDifficulty] = Math.max(profile.bestScores[currentDifficulty], score);
    recordRankingScore();
    saveProfile();
    state = "gameover";
    continueAdMessage = continueUsed
      ? "Continuación utilizada en esta partida" : "Revive una vez en esta partida";
    syncInterface();
    accumulator = 0;
    stopAudio(backgroundMusic);
    stopAudio(invincibilitySound, true);
  }

  function endInvincibility(rewindSound = true) {
    if (!invincible) return;
    invincible = false;
    invincibleTime = 0;
    if (rewindSound) stopAudio(invincibilitySound, true);
  }

  function bossDimensions() {
    const width = Math.min(WIDTH * 0.54, 460);
    const source = images.cosmicBoss;
    const aspect = source?.width && source?.height ? source.height / source.width : 0.5;
    return { width, height: width * aspect };
  }

  function startBossWarning() {
    if (bossWarningActive || bossActive || bossCompleted || score < BOSS_TRIGGER_SCORE) return false;
    bossWarningActive = true;
    bossWarningFrames = 0;
    powerupActive = false;
    planetActive = false;
    asteroids = [];
    starPending = false;
    planetPending = false;
    asteroidPending = false;
    specialSpawnCooldown = 0;
    addFeedback("ALERTA", WIDTH / 2, HEIGHT * 0.35, "#ff5b69", BOSS_WARNING_FRAMES);
    return true;
  }

  function startBossBattle() {
    if (bossActive || bossCompleted || score < BOSS_TRIGGER_SCORE) return false;
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
    spikes = [];
    spikeCounter = 0;
    powerupActive = false;
    planetActive = false;
    asteroids = [];
    starPending = false;
    planetPending = false;
    asteroidPending = false;
    specialSpawnCooldown = 0;
    addFeedback("¡JEFE CÓSMICO!", WIDTH / 2, HEIGHT * 0.42, "#d881ff", 150);
    syncInterface();
    return true;
  }

  function checkBossTrigger() {
    if (!bossCompleted && !bossActive && !bossWarningActive && score >= BOSS_TRIGGER_SCORE) startBossWarning();
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
    const size = mobilePortraitQuery.matches ? 18 : 16;
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
    bossCompleted = true;
    bossProjectiles = [];
    bossTimeFrames = BOSS_DURATION_FRAMES;
    score += BOSS_SCORE_REWARD;
    profile.credits += BOSS_COIN_REWARD;
    spikeCounter = 0;
    addFeedback(`¡JEFE SUPERADO! +${BOSS_SCORE_REWARD}`, WIDTH / 2, HEIGHT * 0.42, "#50dcff", 190);
    saveProfile();
    syncInterface();
  }

  function updateBossBattle(ufoRect) {
    const dimensions = bossDimensions();
    const targetX = WIDTH - dimensions.width + 18;
    bossX += (targetX - bossX) * 0.045;
    bossY = Math.max(78, HEIGHT * 0.24 - dimensions.height / 2 + Math.sin(bossTimeFrames / 38) * 18);
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
      })) hit = true;
    }
    bossProjectiles = bossProjectiles.filter((projectile) => projectile.x + projectile.size >= -20 &&
      projectile.x <= WIDTH + 20 && projectile.y + projectile.size >= -20 && projectile.y <= HEIGHT + 20);
    bossTimeFrames += 1;
    if (bossTimeFrames >= BOSS_DURATION_FRAMES && !hit) finishBossBattle();
    return hit;
  }

  function finishGameplayUpdate(diedThisFrame) {
    if (invincible) {
      invincibleTime += 1;
      if (invincibleTime >= invincibilityDurationFrames) {
        endInvincibility();
        // No modificar la posición de ninguna estrella al terminar el efecto.
      }
    }
    feedback.forEach((item) => { item.age += 1; });
    feedback = feedback.filter((item) => item.age < item.duration);

    if (diedThisFrame) {
      playEffect(deathSound);
      finishFrameAsGameOver();
    }
  }

  function updateGame() {
    const difficulty = DIFFICULTIES[currentDifficulty];
    const portraitSpeedMultiplier = mobilePortraitQuery.matches
      ? difficulty.mobilePortraitSpeedMultiplier : 1;
    if (!flightStarted) return;
    if (specialSpawnCooldown > 0) specialSpawnCooldown -= 1;
    jumpVelocity += GRAVITY;
    ufoY += jumpVelocity;
    const ufoRect = spriteRect(getUfoSprite(), UFO_X, ufoY);
    let diedThisFrame = ufoRect.y < 0 || ufoRect.y + ufoRect.height > HEIGHT;

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

    spikeCounter += 1;
    const mobileIntervalMultiplier = mobilePortraitQuery.matches
      ? difficulty.mobilePortraitIntervalMultiplier : MOBILE_SPIKE_INTERVAL_MULTIPLIER;
    const spawnInterval = mobileLayoutQuery.matches
      ? Math.ceil(spikeFrequency * mobileIntervalMultiplier) : spikeFrequency;
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
        playScoreSound();
        checkBossTrigger();
        if (!bossActive && !bossWarningActive && passedObstacles < 44 &&
          passedObstacles % difficulty.progressionEvery === 0) {
          spikeSpeed += difficulty.speedIncrement;
          spikeFrequency = Math.max(48, spikeFrequency - difficulty.frequencyDecrease);
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
      moveFlyingItem(star, POWERUP_SIZE, POWERUP_SPEED * portraitSpeedMultiplier);
      powerupX = star.x;
      powerupY = star.y;
      powerupVelocityY = star.velocityY;
      if (opaqueOverlap(ufoRect, spriteRect(getSprite("powerup"), powerupX, powerupY))) {
        invincible = true;
        invincibleTime = 0;
        syncInvincibilityDuration();
        powerupActive = false;
        beginSpecialSpawnCooldown();
        addFeedback("INVENCIBLE", UFO_X + UFO_WIDTH / 2, ufoY - 42, "#ffd648");
        playAudio(invincibilitySound, true);
      } else if (powerupX + POWERUP_SIZE < 0) {
        powerupActive = false;
        beginSpecialSpawnCooldown();
      }
    }

    if (planetActive) {
      planetX -= spikeSpeed * portraitSpeedMultiplier * WIDTH / 800;
      if (opaqueOverlap(ufoRect, spriteRect(getPlanetSprite(), planetX, planetY))) {
        score += 1;
        playScoreSound();
        addFeedback("+1", planetX + PLANET_SIZE / 2, planetY, "#50dcff");
        planetActive = false;
        beginSpecialSpawnCooldown();
        checkBossTrigger();
      } else if (planetX + PLANET_SIZE < 0) {
        planetActive = false;
        beginSpecialSpawnCooldown();
      }
    }

    const asteroidWasActive = asteroids.length > 0;
    for (const asteroid of asteroids) {
      moveFlyingItem(asteroid, asteroid.size, ASTEROID_SPEED * portraitSpeedMultiplier);
      if (!invincible && opaqueOverlap(ufoRect,
        spriteRect(getSprite(asteroid.spriteName), asteroid.x, asteroid.y))) {
        diedThisFrame = true;
      }
    }
    asteroids = asteroids.filter((asteroid) => asteroid.x + asteroid.size >= 0);
    if (asteroidWasActive && asteroids.length === 0) beginSpecialSpawnCooldown();
    if (!diedThisFrame) trySpawnPendingSpecial();
    if (!invincible && collidesWithSpikes(ufoRect)) diedThisFrame = true;

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
    if (!bossActive) return;
    const dimensions = bossDimensions();
    context.save();
    context.imageSmoothingEnabled = false;
    context.shadowColor = "#632dff";
    context.shadowBlur = 18;
    context.drawImage(images.cosmicBoss, Math.trunc(bossX), Math.trunc(bossY),
      Math.trunc(dimensions.width), Math.trunc(dimensions.height));
    context.restore();

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
    const pulse = 0.16 + Math.abs(Math.sin(bossWarningFrames / 10)) * 0.16;
    const seconds = Math.max(1, Math.ceil((BOSS_WARNING_FRAMES - bossWarningFrames) / FPS));
    context.save();
    context.fillStyle = `rgba(110,0,18,${pulse})`;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "#000";
    context.shadowBlur = 8;
    context.fillStyle = "#ff5b69";
    context.font = `bold ${Math.max(28, Math.min(54, WIDTH * 0.065))}px "UFO Run", monospace`;
    context.fillText("ALERTA", WIDTH / 2, HEIGHT * 0.37);
    context.fillStyle = "#eef7ff";
    context.font = `${Math.max(14, Math.min(24, WIDTH * 0.027))}px "UFO Run", monospace`;
    context.fillText("JEFE APROXIMANDOSE", WIDTH / 2, HEIGHT * 0.47);
    context.fillStyle = "#ffd648";
    context.font = `${Math.max(22, Math.min(38, WIDTH * 0.045))}px "UFO Run", monospace`;
    context.fillText(String(seconds), WIDTH / 2, HEIGHT * 0.57);
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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    context.strokeText(`${remainingSeconds}s`, x, y);
    context.fillText(`${remainingSeconds}s`, x, y);
    context.restore();
  }

  function render() {
    if (state === "loading") return;
    drawWorld();
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
    if (state === "playing") {
      drawFeedback();
      drawBossWarning();
      const scoreLabel = "Puntaje: " + score;
      document.getElementById("invincible-label").hidden = !invincible;
      if (gameHud.textContent !== scoreLabel) gameHud.textContent = scoreLabel;
      if (bossActive) {
        const remainingRatio = Math.max(0, (BOSS_DURATION_FRAMES - bossTimeFrames) / BOSS_DURATION_FRAMES);
        document.getElementById("boss-timer").textContent = `${Math.max(0,
          Math.ceil((BOSS_DURATION_FRAMES - bossTimeFrames) / FPS))}s`;
        document.getElementById("boss-time-fill").style.transform = `scaleX(${remainingRatio})`;
      }
    }
  }

  function frame(now) {
    const elapsed = Math.min(now - previousTime, 100);
    previousTime = now;

    if (state === "playing") {
      accumulator += elapsed;
      while (accumulator >= FIXED_STEP_MS && state === "playing") {
        updateGame();
        accumulator -= FIXED_STEP_MS;
      }
    } else {
      accumulator = 0;
    }

    render();
    animationFrameId = requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    jump();
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "F2") {
      event.preventDefault();
      openAdmin();
      return;
    }
    // Enter/Espacio activan el botón enfocado; Escape mantiene la navegación global.
    if ((event.code === "Space" || event.code === "Enter") &&
      event.target instanceof HTMLElement && event.target.closest("button")) return;
    if (state === "intro" && (event.code === "Escape" || event.code === "Enter")) {
      event.preventDefault();
      finishIntro();
    } else if (state === "playing" && event.code === "Space") {
      event.preventDefault();
      jump();
    } else if (state === "playing" && event.code === "Escape") {
      event.preventDefault();
      showMainMenu();
    } else if (state === "menu" && (event.code === "Space" || event.code === "Enter")) {
      event.preventDefault();
      startGame();
    } else if (state === "menu" && event.code === "KeyT") {
      event.preventDefault();
      showShop();
    } else if (["shop", "help", "ranking"].includes(state) && event.code === "Escape") {
      event.preventDefault();
      showMainMenu();
    } else if (state === "gameover" && (event.code === "KeyR" || event.code === "Enter")) {
      event.preventDefault();
      startGame();
    } else if (state === "gameover" && event.code === "Escape") {
      event.preventDefault();
      showMainMenu();
    }
  });

  buildShopInterface();
  for (const [id, handler] of Object.entries({
    "play-button": startGame,
    "restart-button": startGame,
    "shop-button": showShop,
    "help-button": showHelp,
    "ranking-button": showRanking,
    "back-button": showMainMenu,
    "menu-button": showMainMenu,
    "coin-ad-button": handleCoinAd,
    "continue-ad-button": handleContinueAd,
    "sound-button": toggleSound,
    "fullscreen-button": toggleFullscreen,
    "skip-intro-button": finishIntro,
    "edit-name-button": beginNameEdit,
    "cancel-name-edit": () => closeDialog(document.getElementById("name-edit-dialog")),
    "cancel-admin-login": () => closeDialog(document.getElementById("admin-login-dialog")),
    "admin-add-coins": adminAddCoins,
    "admin-invincibility": adminEnableInvincibility,
    "admin-test-boss": adminTestBoss,
    "admin-close": () => closeDialog(document.getElementById("admin-panel-dialog")),
  })) {
    document.getElementById(id).addEventListener("click", handler);
  }
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
  });
  document.querySelectorAll("[data-ranking-difficulty]").forEach((button) => {
    button.addEventListener("click", () => selectRankingDifficulty(button.dataset.rankingDifficulty));
  });
  document.getElementById("name-edit-form").addEventListener("submit", (event) => {
    event.preventDefault();
    confirmNameEdit(document.getElementById("new-player-name").value);
  });
  document.getElementById("admin-login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    unlockAdmin(document.getElementById("admin-password").value);
  });
  document.getElementById("player-name-form").addEventListener("submit", (event) => {
    event.preventDefault();
    confirmPlayerName(document.getElementById("entry-player-name").value);
  });
  resizeGame();
  if (window.ResizeObserver) {
    new ResizeObserver(resizeGame).observe(canvas);
  } else {
    window.addEventListener("resize", resizeGame);
  }

  loadAssets()
    .then(() => {
      if (profile.playerNameConfirmed) startIntro();
      else showPlayerNameEntry();
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
      context.fillText("Error al cargar los assets", WIDTH / 2, HEIGHT / 2);
      console.error(error);
    });
})();
