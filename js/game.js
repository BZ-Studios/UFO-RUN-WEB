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
  const mobileLayoutQuery = window.matchMedia(
    "(pointer: coarse), (max-width: 700px), (orientation: landscape) and (max-height: 550px)",
  );

  const POWERUP_SIZE = 50;
  const POWERUP_SPEED = 4;
  const INVINCIBILITY_FALLBACK_SECONDS = 5;
  const PLANET_SIZE = 80;
  const PLANET_OBSTACLE_INTERVAL = 3;
  const STAR_OBSTACLE_INTERVAL = 12;
  const ASTEROID_SIZE = 64;
  const ASTEROID_OBSTACLE_INTERVAL = 10;
  const ASTEROID_IMAGE_NAMES = ["asteroid", "asteroid2"];


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
  let introTimers = [];

  function loadProfile() {
    const fallback = {
      credits: 0,
      bestScore: 0,
      ownedSkins: ["classic"],
      selectedSkin: "classic",
      soundEnabled: true,
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
        bestScore: Math.max(0, Math.trunc(Number(stored.bestScore) || 0)),
        ownedSkins,
        selectedSkin,
        soundEnabled: stored.soundEnabled !== false,
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

  function selectedSkin() {
    return SKINS.find((skin) => skin.id === profile.selectedSkin) || SKINS[0];
  }

  let ufoY = HEIGHT / 2;
  let jumpVelocity = 0;
  let spikeCounter = 0;
  let spikeFrequency = INITIAL_SPIKE_FREQUENCY;
  let spikeSpeed = INITIAL_SPIKE_SPEED;
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
  let asteroids = [];
  let feedback = [];
  const spriteCache = new Map();

  const interfaceElement = document.getElementById("interface");
  const introElement = document.getElementById("intro-screen");
  const gameHud = document.getElementById("game-hud");
  const screenElements = {
    menu: document.getElementById("menu-screen"),
    shop: document.getElementById("shop-screen"),
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

  function syncInterface() {
    document.getElementById("toolbar").hidden = state === "loading" || state === "intro";
    introElement.hidden = state !== "intro";
    document.querySelector(".wallet").hidden = state === "playing";
    document.getElementById("authors-footer").hidden = state !== "gameover";
    document.getElementById("invincible-label").hidden = state !== "playing" || !invincible;
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
      element.textContent = String(profile.bestScore);
    });
    const skin = selectedSkin();
    document.getElementById("equipped-preview").src = imageSources[skin.imageName];
    document.getElementById("equipped-name").textContent = skin.name;
    document.getElementById("equipped-name").style.color = skin.accent;
    document.getElementById("back-button").hidden = state !== "shop";
    const soundButton = document.getElementById("sound-button");
    soundButton.setAttribute("aria-pressed", String(!profile.soundEnabled));
    soundButton.setAttribute("aria-label", profile.soundEnabled ? "Silenciar sonido" : "Activar sonido");
    document.getElementById("fullscreen-button").hidden = !document.documentElement.requestFullscreen;
    document.getElementById("final-score").textContent = String(score);
    document.getElementById("run-reward").textContent = `+${lastReward} monedas guardadas`;
    document.getElementById("shop-status").textContent = shopMessage && performance.now() < shopMessageUntil
      ? shopMessage : "Gana monedas superando obstáculos";
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
      asteroid.y = Math.max(0, Math.min(HEIGHT - ASTEROID_SIZE, asteroid.y + centerShift));
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
    await document.fonts.load('74px "UFO Run"');
    applyBackground();
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
    if (gamesStarted > 0) {
      backgroundIndex = (backgroundIndex + 1) % backgroundSources.length;
    }
    gamesStarted += 1;
    applyBackground();

    ufoY = HEIGHT / 2;
    jumpVelocity = 0;
    spikeCounter = 0;
    spikeFrequency = INITIAL_SPIKE_FREQUENCY;
    spikeSpeed = INITIAL_SPIKE_SPEED;
    spikes = [];
    score = 0;
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
    nextAsteroidAt = ASTEROID_OBSTACLE_INTERVAL / 2;
    nextAsteroidImageIndex = 0;
    asteroids = [];
    feedback = [];
    lastReward = 0;
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

  function jump() {
    if (state === "playing") {
      jumpVelocity = JUMP_IMPULSE;
    }
  }

  function createSpikes(x) {
    const spread = Math.min(150, HEIGHT * 0.18);
    const gapCenter = randomBetween(HEIGHT / 2 - spread, HEIGHT / 2 + spread);
    return {
      topX: x,
      topY: gapCenter - 90 - SPIKE_HEIGHT,
      bottomX: x,
      bottomY: gapCenter + 90,
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

  function activateRandomPlanet() {
    if (planetActive || powerupActive) {
      planetPending = true;
      return;
    }
    currentPlanet = planetSprites[Math.floor(Math.random() * planetSprites.length)];
    planetX = spawnFromRight(PLANET_SIZE);
    planetY = mobileLayoutQuery.matches ? randomScreenY(PLANET_SIZE) : collectibleY(PLANET_SIZE);
    planetVelocityY = (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.6, 1);
    planetActive = true;
    planetPending = false;
  }

  function activateStar() {
    // No reutilizar ni recolocar una estrella que ya está atravesando la pantalla.
    if (powerupActive || planetActive || invincible) {
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
    const imageName = ASTEROID_IMAGE_NAMES[nextAsteroidImageIndex];
    nextAsteroidImageIndex = (nextAsteroidImageIndex + 1) % ASTEROID_IMAGE_NAMES.length;
    asteroids.push({
      x: spawnFromRight(ASTEROID_SIZE),
      y: randomBetween(40, HEIGHT - ASTEROID_SIZE - 40),
      velocityY: (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.8, 1.4),
      imageName,
    });
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

  function addFeedback(text, x, y, color) {
    feedback.push({ text, x, y, color, age: 0, duration: 80 });
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
    } else if (name === "asteroid" || name === "asteroid2") {
      const source = images[name];
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
      surface = spriteSurface(ASTEROID_SIZE, ASTEROID_SIZE);
      surface.getContext("2d").drawImage(source, left, top, right - left + 1, bottom - top + 1,
        0, 0, ASTEROID_SIZE, ASTEROID_SIZE);
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
    lastReward = Math.max(0, score);
    profile.credits += lastReward;
    profile.bestScore = Math.max(profile.bestScore, score);
    saveProfile();
    state = "gameover";
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

  function updateGame() {
    jumpVelocity += GRAVITY;
    ufoY += jumpVelocity;
    const ufoRect = spriteRect(getUfoSprite(), UFO_X, ufoY);
    let diedThisFrame = ufoRect.y < 0 || ufoRect.y + ufoRect.height > HEIGHT;

    spikeCounter += 1;
    const spawnInterval = mobileLayoutQuery.matches
      ? Math.ceil(spikeFrequency * MOBILE_SPIKE_INTERVAL_MULTIPLIER) : spikeFrequency;
    if (spikeCounter > spawnInterval) {
      spikes.push(createSpikes(spawnFromRight(SPIKE_WIDTH)));
      spikeCounter = 0;
    }

    const remainingSpikes = [];
    for (const spike of spikes) {
      spike.topX -= spikeSpeed * WIDTH / 800;
      spike.bottomX -= spikeSpeed * WIDTH / 800;
      if (spike.topX + SPIKE_WIDTH <= 0) continue;
      remainingSpikes.push(spike);
      if (!spike.counted && UFO_X > spike.topX + SPIKE_WIDTH) {
        spike.counted = true;
        passedObstacles += 1;
        score += 1;
        playEffect(scoreSound);
        if (passedObstacles < 44 && passedObstacles % 4 === 0) {
          spikeSpeed += 0.5;
          spikeFrequency -= 5;
        }
        if (passedObstacles >= nextPlanetAt) {
          planetPending = true;
          nextPlanetAt += PLANET_OBSTACLE_INTERVAL;
        }
        if (passedObstacles >= nextStarAt) {
          activateStar();
          nextStarAt += STAR_OBSTACLE_INTERVAL;
        }
        if (passedObstacles >= nextAsteroidAt) {
          activateAsteroid();
          nextAsteroidAt += ASTEROID_OBSTACLE_INTERVAL;
        }
      }
    }
    spikes = remainingSpikes;

    if (powerupActive) {
      const star = { x: powerupX, y: powerupY, velocityY: powerupVelocityY };
      moveFlyingItem(star, POWERUP_SIZE, POWERUP_SPEED);
      powerupX = star.x;
      powerupY = star.y;
      powerupVelocityY = star.velocityY;
      if (opaqueOverlap(ufoRect, spriteRect(getSprite("powerup"), powerupX, powerupY))) {
        invincible = true;
        invincibleTime = 0;
        syncInvincibilityDuration();
        powerupActive = false;
        addFeedback("INVENCIBLE", UFO_X + UFO_WIDTH / 2, ufoY - 42, "#ffd648");
        playAudio(invincibilitySound, true);
      } else if (powerupX + POWERUP_SIZE < 0) {
        powerupActive = false;
      }
    }

    if (starPending && !powerupActive && !planetActive && !invincible) activateStar();
    if (planetPending && !powerupActive && !planetActive && !starPending) activateRandomPlanet();
    if (planetActive) {
      const planet = { x: planetX, y: planetY, velocityY: planetVelocityY };
      moveFlyingItem(planet, PLANET_SIZE, spikeSpeed);
      planetX = planet.x;
      planetY = planet.y;
      planetVelocityY = planet.velocityY;
      if (opaqueOverlap(ufoRect, spriteRect(getPlanetSprite(), planetX, planetY))) {
        score += 1;
        playEffect(scoreSound);
        addFeedback("+1", planetX + PLANET_SIZE / 2, planetY, "#50dcff");
        planetActive = false;
      } else if (planetX + PLANET_SIZE < 0) {
        planetActive = false;
      }
    }

    for (const asteroid of asteroids) {
      moveFlyingItem(asteroid, ASTEROID_SIZE, POWERUP_SPEED);
      if (!invincible && opaqueOverlap(ufoRect, spriteRect(getSprite(asteroid.imageName), asteroid.x, asteroid.y))) {
        diedThisFrame = true;
      }
    }
    asteroids = asteroids.filter((asteroid) => asteroid.x + ASTEROID_SIZE >= 0);
    if (!invincible && collidesWithSpikes(ufoRect)) diedThisFrame = true;

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

  function drawWorld() {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    drawSpikes();
    if (planetActive && currentPlanet) drawSprite(getPlanetSprite(), planetX, planetY);
    if (powerupActive) drawSprite(getSprite("powerup"), powerupX, powerupY);
    for (const asteroid of asteroids) drawSprite(getSprite(asteroid.imageName), asteroid.x, asteroid.y);
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
      const scoreLabel = "Puntaje: " + score;
      document.getElementById("invincible-label").hidden = !invincible;
      if (gameHud.textContent !== scoreLabel) gameHud.textContent = scoreLabel;
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
    } else if (state === "shop" && event.code === "Escape") {
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
    "back-button": showMainMenu,
    "menu-button": showMainMenu,
    "sound-button": toggleSound,
    "fullscreen-button": toggleFullscreen,
    "skip-intro-button": finishIntro,
  })) {
    document.getElementById(id).addEventListener("click", handler);
  }
  resizeGame();
  if (window.ResizeObserver) {
    new ResizeObserver(resizeGame).observe(canvas);
  } else {
    window.addEventListener("resize", resizeGame);
  }

  loadAssets()
    .then(() => {
      startIntro();
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
