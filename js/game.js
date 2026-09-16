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
  const UFO_HITBOX_WIDTH = UFO_WIDTH - 5;
  const UFO_HITBOX_HEIGHT = UFO_HEIGHT - 5;
  const GRAVITY = 0.25;
  const JUMP_IMPULSE = -6;

  const SPIKE_WIDTH = 80;
  let SPIKE_HEIGHT = 400;
  const INITIAL_SPIKE_FREQUENCY = 90;
  const INITIAL_SPIKE_SPEED = 3;

  const POWERUP_SIZE = 50;
  const POWERUP_SPEED = 4;
  const INVINCIBILITY_DURATION = 320;
  const COLOR_CHANGE_FREQUENCY = 120;
  const PLANET_SIZE = 80;
  const PLANET_OBSTACLE_INTERVAL = 10;


  const PROFILE_STORAGE_KEY = "ufoRunProfileV1";
  const SKINS = [
    { id: "classic", name: "CLASICA", imageName: "ufo", cost: 0, accent: "rgb(64, 210, 122)" },
    { id: "nova", name: "NOVA ROJA", imageName: "ufoRed", cost: 12, accent: "rgb(235, 74, 80)" },
    { id: "solar", name: "SOLAR", imageName: "ufoYellow", cost: 24, accent: "rgb(255, 205, 62)" },
    { id: "pulsar", name: "PULSAR AZUL", imageName: "ufoBlue", cost: 36, accent: "rgb(68, 154, 255)" },
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
    ufo: "src/ufo_principal.png",
    ufoDead: "src/ufo_muerto.png",
    ufoRed: "src/ufo_rojo.png",
    ufoYellow: "src/ufo_amarillo.png",
    ufoBlue: "src/ufo_azul.png",
    powerup: "src/powerup_star.png",
    spikeTop: "src/pincho_alto.jpg",
    spikeBottom: "src/pincho_bajo.jpg",
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
  let multicolor = [];
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
  let colorIndex = 0;
  let colorChangeTime = 0;
  let scoreSoundActive = false;
  let planetActive = false;
  let planetPending = false;
  let nextPlanetAt = PLANET_OBSTACLE_INTERVAL;
  let planetX = WIDTH;
  let planetY = HEIGHT / 2;
  let currentPlanet = null;

  const interfaceElement = document.getElementById("interface");
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
    document.getElementById("run-reward").textContent = `+${lastReward} créditos guardados`;
    document.getElementById("shop-status").textContent = shopMessage && performance.now() < shopMessageUntil
      ? shopMessage : "Gana créditos superando obstáculos";
    for (const skin of SKINS) {
      const elements = skinCards.get(skin.id);
      const owned = profile.ownedSkins.includes(skin.id);
      const equipped = profile.selectedSkin === skin.id;
      elements.card.classList.toggle("owned", owned);
      elements.card.classList.toggle("equipped", equipped);
      elements.ownership.textContent = owned ? "En tu colección" : "Desbloquear";
      elements.button.textContent = equipped ? "Equipada" : owned ? "Equipar" : `${skin.cost} créditos`;
      elements.button.disabled = equipped;
      elements.button.setAttribute("aria-label", equipped ? `${skin.name} equipada` : owned
        ? `Equipar ${skin.name}` : `Comprar ${skin.name} por ${skin.cost} créditos`);
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
    SPIKE_HEIGHT = Math.max(400, HEIGHT);
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
    multicolor = [images.ufo, images.ufoRed, images.ufoYellow, images.ufoBlue];
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
    colorIndex = 0;
    colorChangeTime = 0;
    scoreSoundActive = false;
    planetActive = false;
    planetPending = false;
    nextPlanetAt = PLANET_OBSTACLE_INTERVAL;
    planetX = WIDTH;
    planetY = HEIGHT / 2;
    currentPlanet = null;
    lastReward = 0;
    shopMessage = "";
    accumulator = 0;
    state = "playing";
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
      shopMessage = `FALTAN ${skin.cost - profile.credits} CREDITOS`;
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
    const gapCenter = HEIGHT / 2 + 75 - Math.floor(Math.random() * 151);
    return {
      topX: x,
      topY: gapCenter - 90 - SPIKE_HEIGHT,
      bottomX: x,
      bottomY: gapCenter + 90,
      counted: false,
    };
  }

  function activateRandomPlanet() {
    if (planetActive || powerupActive) {
      planetPending = true;
      return;
    }
    currentPlanet = planetSprites[Math.floor(Math.random() * planetSprites.length)];
    planetX = WIDTH;
    planetY = HEIGHT / 2;
    planetActive = true;
    planetPending = false;
  }

  function rectanglesOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function collidesWithSpikes(ufoRect) {
    for (const spike of spikes) {
      const topRect = {
        x: Math.trunc(spike.topX),
        y: Math.trunc(spike.topY),
        width: SPIKE_WIDTH,
        height: SPIKE_HEIGHT,
      };
      const bottomRect = {
        x: Math.trunc(spike.bottomX),
        y: Math.trunc(spike.bottomY),
        width: SPIKE_WIDTH,
        height: SPIKE_HEIGHT,
      };
      if (rectanglesOverlap(ufoRect, topRect) || rectanglesOverlap(ufoRect, bottomRect)) {
        return true;
      }
    }
    return false;
  }

  function finishFrameAsGameOver() {
    lastReward = Math.max(0, score);
    profile.credits += lastReward;
    profile.bestScore = Math.max(profile.bestScore, score);
    saveProfile();
    state = "gameover";
    syncInterface();
    accumulator = 0;
  }

  function updateGame() {
    let diedThisFrame = false;

    jumpVelocity += GRAVITY;
    ufoY += jumpVelocity;

    if (ufoY >= HEIGHT || ufoY <= 0) {
      playEffect(deathSound);
      if (invincible) {
        stopAudio(invincibilitySound, true);
      }
      diedThisFrame = true;
    }

    spikeCounter += 1;
    if (spikeCounter > spikeFrequency) {
      spikes.push(createSpikes(WIDTH));
      spikeCounter = 0;
    }

    const remainingSpikes = [];
    for (const spike of spikes) {
      spike.topX -= spikeSpeed * WIDTH / 800;
      spike.bottomX -= spikeSpeed * WIDTH / 800;

      if (spike.topX + SPIKE_WIDTH > 0) {
        remainingSpikes.push(spike);

        if (!spike.counted && UFO_X > spike.topX && !scoreSoundActive) {
          scoreSoundActive = true;
          playEffect(scoreSound);
        }

        if (!spike.counted && UFO_X > spike.topX + SPIKE_WIDTH) {
          spike.counted = true;
          passedObstacles += 1;
          score += 1;
          scoreSoundActive = false;

          if (passedObstacles < 44 && passedObstacles % 4 === 0) {
            spikeSpeed += 0.5;
            spikeFrequency -= 5;
          }

          if (passedObstacles % 4 === 0 && !planetActive && !planetPending) {
            powerupActive = true;
          }

          if (passedObstacles >= nextPlanetAt) {
            planetPending = true;
            nextPlanetAt += PLANET_OBSTACLE_INTERVAL;
          }
        }
      }
    }

    spikes = remainingSpikes;

    colorChangeTime += spikeCounter;
    if (colorChangeTime > COLOR_CHANGE_FREQUENCY) {
      colorIndex = (colorIndex + 1) % multicolor.length;
      colorChangeTime = 0;
    }

    const ufoRect = {
      x: UFO_X,
      y: Math.trunc(ufoY),
      width: UFO_HITBOX_WIDTH,
      height: UFO_HITBOX_HEIGHT,
    };

    if (powerupActive) {
      powerupX -= POWERUP_SPEED * WIDTH / 800;
      const powerupRect = {
        x: Math.trunc(powerupX),
        y: Math.trunc(powerupY),
        width: POWERUP_SIZE,
        height: POWERUP_SIZE,
      };

      if (rectanglesOverlap(ufoRect, powerupRect)) {
        playAudio(invincibilitySound, true);
        invincible = true;
        powerupActive = false;
        powerupX = WIDTH;
      }

      if (powerupX + POWERUP_SIZE < 0) {
        powerupActive = false;
        powerupX = WIDTH;
      }
    }

    if (planetPending && !powerupActive && !planetActive) {
      activateRandomPlanet();
    }

    if (planetActive) {
      planetX -= spikeSpeed * WIDTH / 800;
      const planetRect = {
        x: Math.trunc(planetX),
        y: Math.trunc(planetY),
        width: PLANET_SIZE,
        height: PLANET_SIZE,
      };

      if (rectanglesOverlap(ufoRect, planetRect)) {
        score += 2;
        playEffect(scoreSound);
        planetActive = false;
        planetX = WIDTH;
      }

      if (planetX + PLANET_SIZE < 0) {
        planetActive = false;
        planetX = WIDTH;
      }
    }

    if (collidesWithSpikes(ufoRect) && !invincible) {
      playEffect(deathSound);
      diedThisFrame = true;
    }

    if (invincible) {
      invincibleTime += 1;
      if (invincibleTime > INVINCIBILITY_DURATION) {
        stopAudio(invincibilitySound, true);
        invincible = false;
        invincibleTime = 0;
        powerupX = WIDTH;
        powerupY = HEIGHT / 2;
      }
    }

    if (diedThisFrame) {
      finishFrameAsGameOver();
    }
  }

  function drawBackground() {
    context.clearRect(0, 0, WIDTH, HEIGHT);
  }




  function rotatedBounds(width, height, degrees) {
    const radians = Math.abs((degrees * Math.PI) / 180);
    return {
      width: Math.ceil(width * Math.cos(radians) + height * Math.sin(radians)),
      height: Math.ceil(width * Math.sin(radians) + height * Math.cos(radians)),
    };
  }

  function drawRotatedAtTopLeft(image, x, y, degrees) {
    const bounds = rotatedBounds(image.width, image.height, degrees);
    context.save();
    context.imageSmoothingEnabled = false;
    context.translate(x + bounds.width / 2, y + bounds.height / 2);
    context.rotate((-degrees * Math.PI) / 180);
    context.drawImage(image, -image.width / 2, -image.height / 2);
    context.restore();
  }

  function drawSpikes() {
    context.imageSmoothingEnabled = false;
    for (const spike of spikes) {
      context.drawImage(
        images.spikeTop,
        Math.trunc(spike.topX),
        Math.trunc(spike.topY),
        SPIKE_WIDTH,
        SPIKE_HEIGHT,
      );
      context.drawImage(
        images.spikeBottom,
        Math.trunc(spike.bottomX),
        Math.trunc(spike.bottomY),
        SPIKE_WIDTH,
        SPIKE_HEIGHT,
      );
    }

  }

  function drawPlanet() {
    if (!planetActive || !currentPlanet) {
      return;
    }
    const scale = Math.min(
      PLANET_SIZE / currentPlanet.width,
      PLANET_SIZE / currentPlanet.height,
    );
    const drawWidth = currentPlanet.width * scale;
    const drawHeight = currentPlanet.height * scale;
    const drawX = Math.trunc(planetX) + (PLANET_SIZE - drawWidth) / 2;
    const drawY = Math.trunc(planetY) + (PLANET_SIZE - drawHeight) / 2;

    context.imageSmoothingEnabled = true;
    context.drawImage(
      currentPlanet.image,
      currentPlanet.x,
      currentPlanet.y,
      currentPlanet.width,
      currentPlanet.height,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    );
  }


  function renderPlaying() {
    drawBackground();
    drawSpikes();

    const angle = jumpVelocity < 0 ? -10 : 10;
    const sprite = invincible ? multicolor[colorIndex] : images[selectedSkin().imageName];
    drawRotatedAtTopLeft(sprite, UFO_X, Math.trunc(ufoY), angle);

    if (powerupActive) {
      context.imageSmoothingEnabled = false;
      context.drawImage(
        images.powerup,
        Math.trunc(powerupX),
        Math.trunc(powerupY),
        POWERUP_SIZE,
        POWERUP_SIZE,
      );
    }

    drawPlanet();

    const scoreLabel = `Puntaje: ${score}`;
    if (gameHud.textContent !== scoreLabel) gameHud.textContent = scoreLabel;
  }


  function render() {
    if (state === "playing") {
      renderPlaying();
    } else {
      drawBackground();
      if (state === "gameover") {
        drawSpikes();
        drawPlanet();
        drawRotatedAtTopLeft(images.ufoDead, UFO_X, Math.trunc(ufoY), 10);
      }
    }
  }

  function frame(now) {
    const elapsed = now - previousTime;
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
    if (state === "playing" && event.code === "Space") {
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
      state = "menu";
      syncInterface();
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
