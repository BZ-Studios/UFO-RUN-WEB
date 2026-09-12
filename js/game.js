(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const context = canvas.getContext("2d");

  const WIDTH = 800;
  const HEIGHT = 600;
  const FPS = 80;
  const FIXED_STEP_MS = 1000 / FPS;

  const BLUE = "rgb(50, 120, 240)";
  const RED = "rgb(100, 5, 5)";
  const GREEN = "rgb(5, 100, 5)";
  const CYAN = "rgb(80, 220, 255)";
  const PURPLE = "rgb(112, 62, 190)";
  const YELLOW = "rgb(255, 214, 72)";
  const WHITE = "rgb(238, 247, 255)";
  const PANEL = "rgba(5, 10, 28, 0.88)";
  const PANEL_SOFT = "rgba(8, 17, 42, 0.78)";

  const UFO_X = 150;
  const UFO_WIDTH = 55;
  const UFO_HEIGHT = 38;
  const UFO_HITBOX_WIDTH = UFO_WIDTH - 5;
  const UFO_HITBOX_HEIGHT = UFO_HEIGHT - 5;
  const GRAVITY = 0.25;
  const JUMP_IMPULSE = -6;

  const SPIKE_WIDTH = 80;
  const SPIKE_HEIGHT = 400;
  const INITIAL_SPIKE_X = WIDTH;
  const INITIAL_SPIKE_FREQUENCY = 90;
  const INITIAL_SPIKE_SPEED = 3;

  const POWERUP_SIZE = 50;
  const POWERUP_SPEED = 4;
  const INVINCIBILITY_DURATION = 320;
  const COLOR_CHANGE_FREQUENCY = 120;
  const PLANET_SIZE = 80;
  const PLANET_OBSTACLE_INTERVAL = 10;

  const MENU_PLAY_BUTTON = { x: 70, y: 260, width: 360, height: 68 };
  const MENU_SHOP_BUTTON = { x: 70, y: 342, width: 360, height: 58 };
  const SOUND_BUTTON = { x: 682, y: 24, width: 50, height: 42 };
  const FULLSCREEN_BUTTON = { x: 740, y: 24, width: 50, height: 42 };
  const SHOP_BACK_BUTTON = { x: 24, y: 24, width: 126, height: 42 };
  const SHOP_CARD_WIDTH = 320;
  const SHOP_CARD_HEIGHT = 166;
  const GAMEOVER_RESTART_BUTTON = { x: 240, y: 270, width: 320, height: 58 };
  const GAMEOVER_MENU_BUTTON = { x: 240, y: 342, width: 320, height: 52 };

  const PROFILE_STORAGE_KEY = "ufoRunProfileV1";
  const SKINS = [
    { id: "classic", name: "CLASICA", imageName: "ufo", cost: 0, accent: "rgb(64, 210, 122)" },
    { id: "nova", name: "NOVA ROJA", imageName: "ufoRed", cost: 12, accent: "rgb(235, 74, 80)" },
    { id: "solar", name: "SOLAR", imageName: "ufoYellow", cost: 24, accent: "rgb(255, 205, 62)" },
    { id: "pulsar", name: "PULSAR AZUL", imageName: "ufoBlue", cost: 36, accent: "rgb(68, 154, 255)" },
  ];
  const SHOP_CARDS = SKINS.map((skin, index) => ({
    skin,
    x: index % 2 === 0 ? 62 : 418,
    y: index < 2 ? 126 : 326,
    width: SHOP_CARD_WIDTH,
    height: SHOP_CARD_HEIGHT,
  }));

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
    spikeTop: "src/pincho_alto.png",
    spikeBottom: "src/pincho_bajo.png",
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
  let pointerPosition = { x: -1, y: -1 };
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

    stopAudio(invincibilitySound, true);
    playAudio(backgroundMusic, true);
    canvas.focus({ preventScroll: true });
  }

  function showMainMenu() {
    state = "menu";
    accumulator = 0;
    stopAudio(backgroundMusic, true);
    stopAudio(invincibilitySound, true);
  }

  function showShop() {
    state = "shop";
    accumulator = 0;
    shopMessage = "";
    stopAudio(backgroundMusic, true);
    stopAudio(invincibilitySound, true);
  }

  function toggleSound() {
    profile.soundEnabled = !profile.soundEnabled;
    saveProfile();
    if (!profile.soundEnabled) {
      stopAudio(backgroundMusic);
      stopAudio(invincibilitySound);
    } else if (state === "playing") {
      playAudio(backgroundMusic);
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
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
  }

  function jump() {
    if (state === "playing") {
      jumpVelocity = JUMP_IMPULSE;
    }
  }

  function createSpikes(x) {
    const gapOffset = Math.floor(Math.random() * 151);
    return {
      topX: x,
      topY: -190 - gapOffset,
      bottomX: x,
      bottomY: HEIGHT - SPIKE_HEIGHT + 190 - gapOffset,
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
      spikes.push(createSpikes(INITIAL_SPIKE_X));
      spikeCounter = 0;
    }

    const remainingSpikes = [];
    for (const spike of spikes) {
      spike.topX -= spikeSpeed;
      spike.bottomX -= spikeSpeed;

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
      powerupX -= POWERUP_SPEED;
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
      planetX -= spikeSpeed;
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

  function roundedRectanglePath(x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
  }

  function drawDimOverlay(opacity = 0.55) {
    context.fillStyle = `rgba(0, 3, 14, ${opacity})`;
    context.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function drawPanel(rectangle, fill = PANEL, border = "rgba(94, 145, 255, 0.55)", radius = 12) {
    context.save();
    context.shadowColor = "rgba(25, 90, 255, 0.3)";
    context.shadowBlur = 18;
    roundedRectanglePath(rectangle.x, rectangle.y, rectangle.width, rectangle.height, radius);
    context.fillStyle = fill;
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = border;
    context.lineWidth = 2;
    context.stroke();
    context.restore();
  }

  function drawText(text, size, color, x, y) {
    context.fillStyle = color;
    context.font = `${size}px "UFO Run"`;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText(text, x, y);
  }

  function drawCenteredText(text, size, color, y) {
    context.font = `${size}px "UFO Run"`;
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillStyle = color;
    context.fillText(text, WIDTH / 2, y);
  }

  function drawCenteredTextIn(text, size, color, rectangle, verticalOffset = 0) {
    context.font = `${size}px "UFO Run"`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = color;
    context.fillText(text, rectangle.x + rectangle.width / 2, rectangle.y + rectangle.height / 2 + verticalOffset);
  }

  function drawCreditIcon(x, y, size = 20) {
    context.save();
    context.fillStyle = YELLOW;
    context.shadowColor = "rgba(255, 214, 72, 0.75)";
    context.shadowBlur = 8;
    context.beginPath();
    for (let index = 0; index < 8; index += 1) {
      const angle = -Math.PI / 2 + (index * Math.PI) / 4;
      const radius = index % 2 === 0 ? size / 2 : size / 4;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (index === 0) {
        context.moveTo(px, py);
      } else {
        context.lineTo(px, py);
      }
    }
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawCreditBadge() {
    const badge = { x: 536, y: 24, width: 138, height: 42 };
    drawPanel(badge, "rgba(7, 14, 34, 0.94)", "rgba(255, 214, 72, 0.7)", 18);
    drawCreditIcon(badge.x + 25, badge.y + 21, 22);
    drawCenteredTextIn(String(profile.credits), 24, WHITE, {
      x: badge.x + 42,
      y: badge.y,
      width: badge.width - 48,
      height: badge.height,
    });
  }

  function isHovered(button) {
    return pointInside(pointerPosition, button);
  }

  function drawActionButton(button, label, accent, options = {}) {
    const hovered = isHovered(button);
    const fill = options.primary
      ? hovered ? "rgba(19, 151, 92, 0.98)" : "rgba(7, 112, 68, 0.96)"
      : hovered ? "rgba(38, 34, 84, 0.98)" : PANEL_SOFT;
    drawPanel(button, fill, hovered ? accent : "rgba(91, 119, 207, 0.62)", options.primary ? 14 : 10);
    if (options.icon === "play") {
      context.fillStyle = WHITE;
      context.beginPath();
      context.moveTo(button.x + 28, button.y + button.height / 2 - 11);
      context.lineTo(button.x + 28, button.y + button.height / 2 + 11);
      context.lineTo(button.x + 47, button.y + button.height / 2);
      context.closePath();
      context.fill();
    } else if (options.icon === "shop") {
      context.strokeStyle = accent;
      context.lineWidth = 3;
      context.strokeRect(button.x + 24, button.y + 23, 24, 20);
      context.beginPath();
      context.moveTo(button.x + 28, button.y + 23);
      context.quadraticCurveTo(button.x + 36, button.y + 10, button.x + 44, button.y + 23);
      context.stroke();
    }
    const textRectangle = options.icon
      ? { x: button.x + 62, y: button.y, width: button.width - 84, height: button.height }
      : button;
    drawCenteredTextIn(label, options.fontSize || 27, options.primary ? WHITE : accent, textRectangle);
  }

  function drawTopControls() {
    drawCreditBadge();
    drawPanel(SOUND_BUTTON, "rgba(7, 14, 34, 0.94)", isHovered(SOUND_BUTTON) ? CYAN : "rgba(91, 119, 207, 0.62)", 10);
    const soundColor = profile.soundEnabled ? CYAN : "rgb(150, 165, 190)";
    context.fillStyle = soundColor;
    context.fillRect(SOUND_BUTTON.x + 11, SOUND_BUTTON.y + 17, 8, 10);
    context.beginPath();
    context.moveTo(SOUND_BUTTON.x + 19, SOUND_BUTTON.y + 17);
    context.lineTo(SOUND_BUTTON.x + 28, SOUND_BUTTON.y + 11);
    context.lineTo(SOUND_BUTTON.x + 28, SOUND_BUTTON.y + 33);
    context.lineTo(SOUND_BUTTON.x + 19, SOUND_BUTTON.y + 27);
    context.closePath();
    context.fill();
    context.strokeStyle = soundColor;
    context.lineWidth = 2;
    context.beginPath();
    if (profile.soundEnabled) {
      context.arc(SOUND_BUTTON.x + 27, SOUND_BUTTON.y + 22, 8, -0.75, 0.75);
      context.arc(SOUND_BUTTON.x + 27, SOUND_BUTTON.y + 22, 13, -0.62, 0.62);
    } else {
      context.moveTo(SOUND_BUTTON.x + 34, SOUND_BUTTON.y + 14);
      context.lineTo(SOUND_BUTTON.x + 43, SOUND_BUTTON.y + 30);
      context.moveTo(SOUND_BUTTON.x + 43, SOUND_BUTTON.y + 14);
      context.lineTo(SOUND_BUTTON.x + 34, SOUND_BUTTON.y + 30);
    }
    context.stroke();
    drawPanel(FULLSCREEN_BUTTON, "rgba(7, 14, 34, 0.94)", isHovered(FULLSCREEN_BUTTON) ? CYAN : "rgba(91, 119, 207, 0.62)", 10);
    context.strokeStyle = CYAN;
    context.lineWidth = 2;
    const fx = FULLSCREEN_BUTTON.x + 14;
    const fy = FULLSCREEN_BUTTON.y + 11;
    context.beginPath();
    context.moveTo(fx + 8, fy);
    context.lineTo(fx, fy);
    context.lineTo(fx, fy + 8);
    context.moveTo(fx + 14, fy);
    context.lineTo(fx + 22, fy);
    context.lineTo(fx + 22, fy + 8);
    context.moveTo(fx, fy + 12);
    context.lineTo(fx, fy + 20);
    context.lineTo(fx + 8, fy + 20);
    context.moveTo(fx + 22, fy + 12);
    context.lineTo(fx + 22, fy + 20);
    context.lineTo(fx + 14, fy + 20);
    context.stroke();
  }

  function drawButton(button, color, label, labelX) {
    drawPanel(button, color, "rgba(87, 150, 255, 0.75)", 10);
    drawText(label, 30, WHITE, labelX, button.y + 10);
  }

  function drawCenteredButton(button, color, label) {
    drawPanel(button, color, "rgba(87, 150, 255, 0.75)", 10);
    drawCenteredTextIn(label, 30, WHITE, button);
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

  function drawUfoPreview(image, x, y, width = 126, height = 87) {
    context.save();
    context.imageSmoothingEnabled = false;
    context.shadowColor = "rgba(80, 220, 255, 0.8)";
    context.shadowBlur = 20;
    context.drawImage(image, Math.trunc(x), Math.trunc(y), width, height);
    context.restore();
  }

  function renderMenu() {
    drawBackground();
    drawDimOverlay(0.58);
    drawTopControls();

    drawText("UFO", 70, WHITE, 70, 78);
    drawText("RUN", 70, CYAN, 70, 141);
    drawText("VUELA  ESQUIVA  EXPLORA", 15, "rgb(161, 184, 228)", 73, 218);

    drawActionButton(MENU_PLAY_BUTTON, "JUGAR", CYAN, { primary: true, icon: "play", fontSize: 32 });
    drawActionButton(MENU_SHOP_BUTTON, "TIENDA DE NAVES", PURPLE, { icon: "shop", fontSize: 23 });

    const activeSkin = selectedSkin();
    const bob = Math.sin(performance.now() / 480) * 8;
    drawUfoPreview(images[activeSkin.imageName], 560, 165 + bob, 150, 104);
    drawCenteredTextIn(activeSkin.name, 16, activeSkin.accent, { x: 530, y: 284, width: 210, height: 32 });

    drawPanel({ x: 70, y: 425, width: 360, height: 84 }, "rgba(7, 14, 34, 0.7)", "rgba(91, 119, 207, 0.42)", 10);
    drawText("ESPACIO / CLIC", 18, WHITE, 92, 443);
    drawText("para impulsarte", 16, "rgb(158, 178, 215)", 92, 474);

    drawText("MEJOR PUNTAJE", 15, "rgb(150, 173, 214)", 590, 445);
    drawText(String(profile.bestScore), 43, CYAN, 590, 468);
    drawText("Cada punto ganado se guarda como credito", 13, "rgb(130, 151, 192)", 70, 548);
  }

  function shopActionButton(card) {
    return {
      x: card.x + 157,
      y: card.y + 104,
      width: 143,
      height: 42,
    };
  }

  function renderShop() {
    drawBackground();
    drawDimOverlay(0.72);
    drawTopControls();

    drawActionButton(SHOP_BACK_BUTTON, "VOLVER", CYAN, { fontSize: 18 });
    drawCenteredText("HANGAR", 43, WHITE, 24);
    drawCenteredText("ELIGE TU NAVE", 15, CYAN, 77);

    for (const card of SHOP_CARDS) {
      const owned = profile.ownedSkins.includes(card.skin.id);
      const equipped = profile.selectedSkin === card.skin.id;
      const border = equipped ? card.skin.accent : "rgba(91, 119, 207, 0.58)";
      drawPanel(card, equipped ? "rgba(16, 28, 57, 0.96)" : PANEL, border, 12);

      drawText(card.skin.name, 20, equipped ? card.skin.accent : WHITE, card.x + 18, card.y + 16);
      drawUfoPreview(images[card.skin.imageName], card.x + 28, card.y + 57, 102, 70);

      const actionButton = shopActionButton(card);
      if (equipped) {
        drawActionButton(actionButton, "EQUIPADA", card.skin.accent, { fontSize: 15 });
      } else if (owned) {
        drawActionButton(actionButton, "EQUIPAR", card.skin.accent, { fontSize: 16 });
      } else {
        drawActionButton(actionButton, `${card.skin.cost} CR`, YELLOW, { fontSize: 18 });
      }

      drawText(owned ? "EN TU COLECCION" : "DESBLOQUEAR", 12, "rgb(143, 166, 210)", card.x + 162, card.y + 73);
    }

    if (shopMessage && performance.now() < shopMessageUntil) {
      drawCenteredText(shopMessage, 17, YELLOW, 523);
    } else {
      drawCenteredText("GANA CREDITOS SUPERANDO OBSTACULOS", 13, "rgb(147, 169, 210)", 525);
    }
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

    drawText(`Puntaje: ${score}`, 30, BLUE, 10, 10);
  }

  function renderGameOver() {
    drawBackground();

    drawRotatedAtTopLeft(images.ufoDead, UFO_X, Math.trunc(ufoY), 10);
    context.imageSmoothingEnabled = false;
    context.drawImage(images.powerup, powerupX, powerupY, POWERUP_SIZE, POWERUP_SIZE);
    drawPlanet();
    drawSpikes();
    drawDimOverlay(0.7);
    drawCreditBadge();

    drawCenteredText("MISION TERMINADA", 48, WHITE, 70);
    drawCenteredText(`PUNTAJE ${score}`, 30, CYAN, 148);
    drawCenteredText(`+${lastReward} CREDITOS GUARDADOS`, 16, YELLOW, 202);

    drawActionButton(GAMEOVER_RESTART_BUTTON, "REINICIAR", CYAN, { primary: true, fontSize: 25 });
    drawActionButton(GAMEOVER_MENU_BUTTON, "MENU PRINCIPAL", PURPLE, { fontSize: 20 });

    drawCenteredText(`MEJOR PUNTAJE  ${profile.bestScore}`, 16, "rgb(161, 184, 228)", 430);
    drawCenteredText("CREDITOS", 13, "rgb(112, 140, 192)", 510);
    drawCenteredText("LUIS ZABALA  /  AGUSTIN BUSTAMANTE", 13, "rgb(151, 174, 214)", 535);
  }

  function render() {
    if (state === "menu") {
      renderMenu();
    } else if (state === "shop") {
      renderShop();
    } else if (state === "playing") {
      renderPlaying();
    } else if (state === "gameover") {
      renderGameOver();
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

  function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * WIDTH) / bounds.width,
      y: ((event.clientY - bounds.top) * HEIGHT) / bounds.height,
    };
  }

  function pointInside(point, rectangle) {
    return (
      point.x >= rectangle.x &&
      point.x < rectangle.x + rectangle.width &&
      point.y >= rectangle.y &&
      point.y < rectangle.y + rectangle.height
    );
  }

  canvas.addEventListener("pointermove", (event) => {
    pointerPosition = canvasPoint(event);
    const interactive =
      (state === "menu" && (
        pointInside(pointerPosition, MENU_PLAY_BUTTON) ||
        pointInside(pointerPosition, MENU_SHOP_BUTTON) ||
        pointInside(pointerPosition, SOUND_BUTTON) ||
        pointInside(pointerPosition, FULLSCREEN_BUTTON)
      )) ||
      (state === "shop" && (
        pointInside(pointerPosition, SHOP_BACK_BUTTON) ||
        pointInside(pointerPosition, SOUND_BUTTON) ||
        pointInside(pointerPosition, FULLSCREEN_BUTTON) ||
        SHOP_CARDS.some((card) => pointInside(pointerPosition, shopActionButton(card)))
      )) ||
      (state === "gameover" && (
        pointInside(pointerPosition, GAMEOVER_RESTART_BUTTON) ||
        pointInside(pointerPosition, GAMEOVER_MENU_BUTTON)
      ));
    canvas.style.cursor = interactive ? "pointer" : "default";
  });

  canvas.addEventListener("pointerleave", () => {
    pointerPosition = { x: -1, y: -1 };
    canvas.style.cursor = "default";
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    const point = canvasPoint(event);

    if (state === "menu") {
      if (pointInside(point, SOUND_BUTTON)) {
        toggleSound();
      } else if (pointInside(point, FULLSCREEN_BUTTON)) {
        toggleFullscreen();
      } else if (pointInside(point, MENU_PLAY_BUTTON)) {
        startGame();
      } else if (pointInside(point, MENU_SHOP_BUTTON)) {
        showShop();
      }
    } else if (state === "shop") {
      if (pointInside(point, SOUND_BUTTON)) {
        toggleSound();
      } else if (pointInside(point, FULLSCREEN_BUTTON)) {
        toggleFullscreen();
      } else if (pointInside(point, SHOP_BACK_BUTTON)) {
        showMainMenu();
      } else {
        const selectedCard = SHOP_CARDS.find((card) => pointInside(point, shopActionButton(card)));
        if (selectedCard) {
          handleSkinAction(selectedCard.skin);
        }
      }
    } else if (state === "gameover") {
      if (pointInside(point, GAMEOVER_RESTART_BUTTON)) {
        startGame();
      } else if (pointInside(point, GAMEOVER_MENU_BUTTON)) {
        showMainMenu();
      }
    } else {
      jump();
    }
  });

  window.addEventListener("keydown", (event) => {
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

  loadAssets()
    .then(() => {
      state = "menu";
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
