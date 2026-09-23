const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../js/game.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../css/styles.css"), "utf8");
const achievementIds = [...source.match(/const ACHIEVEMENTS = \[([\s\S]*?)\n  \];/)[1]
  .matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
const sprite = (width, height) => ({ width, height, mask: new Uint8Array(width * height).fill(1) });

// Aislamos física y estado sin escribir el progreso real del navegador.
// Las colisiones de transparencia se prueban con máscaras explícitas más abajo.
function game(width = 390, height = 844, mobile = true, profileOverrides = {}) {
  let random = 0.2;
  let rewardedAdResult = true;
  const rewardedAdCalls = [];
  const nodes = new Map();
  const element = () => ({ hidden: true, textContent: "", value: "", dataset: {}, style: { setProperty() {} },
    classList: { toggle() {} }, setAttribute() {}, addEventListener() {}, append() {}, replaceChildren() {}, focus() {},
    open: false, readOnly: false, showModal() { this.open = true; }, close() { this.open = false; },
    getBoundingClientRect: () => ({ width, height }), getContext: () => ({ setTransform() {} }) });
  const document = { getElementById: (id) => {
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
  }, createElement: element, querySelectorAll: () => [], querySelector: () => element(),
  body: element(), documentElement: {} };
  class Audio {
    constructor() { this.duration = 4.388571428571429; this.playCalls = 0; this.currentTime = 0; }
    addEventListener() {}
    pause() {}
    play() { this.playCalls += 1; return Promise.resolve(); }
    cloneNode() { return new Audio(); }
  }
  const math = Object.create(Math);
  math.random = () => random;
  const browserWindow = { devicePixelRatio: 1,
    matchMedia: (query) => ({ matches: query.includes("orientation: portrait")
      ? mobile && height > width : mobile }), setTimeout() {}, clearTimeout() {},
    ufoRunShowRewardedAd: async ({ placement }) => {
      rewardedAdCalls.push(placement); return rewardedAdResult;
    } };
  const scope = { document, Audio, Math: math, performance: { now: () => 0 }, window: browserWindow,
    localStorage: { getItem: () => JSON.stringify({ credits: 22, bestScore: 16,
      ownedSkins: ["classic"], selectedSkin: "classic", achievements: achievementIds,
      achievementStats: { gamesStarted: 1 }, ...profileOverrides }), setItem() {} },
    fixtureSprite: sprite };
  const cutoff = source.indexOf('  canvas.addEventListener("pointerdown"');
  assert(cutoff > 0);
  vm.runInNewContext(source.slice(0, cutoff) + `
    getUfoSprite = () => fixtureSprite(55, 38);
    getPlanetSprite = () => fixtureSprite(80, 80);
    getSprite = (name) => fixtureSprite(name.startsWith("spike") ? 100 : name.startsWith("asteroid") ? 64 : 50,
      name.startsWith("spike") ? SPIKE_HEIGHT : name.startsWith("asteroid") ? 64 : 50);
    planetSprites = [{ imageName: "test" }];
    buildShopInterface(); buildAchievementsInterface(); resizeGame(); startGame(); flightStarted = true;
    globalThis.api = {
      resizeGame, startGame: () => { startGame(); flightStarted = true; },
      beginWaiting: () => { startGame(); }, jump,
      createSpikes, activateRandomPlanet, activateStar, activateAsteroid,
      moveDiagonal, moveFlyingItem, showShop, showRanking, selectDifficulty, confirmPlayerName,
      startBossBattle, startBossWarning, finishBossBattle, pauseGame, resumeGame,
      beginNameEdit, confirmNameEdit, unlockAdmin, adminAddCoins, adminEnableInvincibility, adminTestBoss,
      handleCoinAd, handleContinueAd,
      opaqueOverlap, spriteRect, finishFrameAsGameOver, updateGame, findAudioStartOffset,
      tick: () => { ufoY = HEIGHT / 2; jumpVelocity = -GRAVITY; updateGame(); },
      safeTick: () => { ufoY = HEIGHT / 2; jumpVelocity = -GRAVITY; invincible = true;
        invincibleTime = 0; updateGame(); },
      clear: () => { spikes = []; planetActive = false; planetPending = false;
        powerupActive = false; starPending = false; asteroidPending = false;
        specialSpawnCooldown = 0; asteroids = []; },
      expirePlanet: () => { planetX = -PLANET_SIZE - 1; },
      setScore: (value) => { score = value; },
      setSpikeSpeed: (value) => { spikeSpeed = value; },
      setCredits: (value) => { profile.credits = value; syncInterface(); },
      bossProjectileAtPlayer: () => { bossProjectiles = [{ x: UFO_X, y: HEIGHT / 2,
        size: 22, velocityX: 0, velocityY: 0 }]; },
      bossNearEnd: () => { bossTimeFrames = bossDurationFrames() - 1; bossProjectiles = []; },
      bossWarningNearEnd: () => { bossWarningFrames = BOSS_WARNING_FRAMES - 1; },
      passed: (count) => { passedObstacles = count - 1;
        spikes = [{ topX: UFO_X - 102, bottomX: UFO_X - 102,
          topY: -SPIKE_HEIGHT, bottomY: HEIGHT, counted: false }]; },
      planetAtPlayer: () => { planetActive = true; currentPlanet = planetSprites[0];
        planetX = UFO_X + 10; planetY = HEIGHT / 2; planetVelocityY = 0; },
      starAtPlayer: () => { powerupActive = true; powerupX = UFO_X + 10;
        powerupY = HEIGHT / 2; powerupVelocityY = 0.8; },
      asteroidAtPlayer: () => { asteroids = [{ x: UFO_X + 10, y: HEIGHT / 2,
        velocityY: 1, imageName: "asteroid", spriteName: "asteroid", size: 64 }]; },
      endShield: () => { invincible = false; invincibleTime = 0; },
      shieldAtBoundary: (position, velocity) => { invincible = true; ufoY = position; jumpVelocity = velocity; },
      effectAtEnd: () => { invincible = true; invincibleTime = invincibilityDurationFrames - 1; },
      starFar: () => { powerupActive = true; powerupX = WIDTH - 50;
        powerupY = 180; powerupVelocityY = 1; },
      read: () => ({ state, WIDTH, HEIGHT, ufoY, jumpVelocity, spikeHeight: SPIKE_HEIGHT, score, credits: profile.credits,
        invincible, invincibleTime, invincibilityDurationFrames, continueUsed,
        invincibilityCountdown: Math.max(1, Math.ceil((invincibilityDurationFrames - invincibleTime) / FPS)),
        planetActive, planetX, planetY,
        planetVelocityY, powerupActive, powerupX, powerupY, powerupVelocityY,
        feedback: feedback.map(item => item.text), asteroids: asteroids.length,
        asteroidItems: asteroids.map(item => ({ ...item })),
        positions: spikes.map(item => item.topX), nextStarAt, nextAsteroidAt,
        coinAdsToday: profile.coinAdsToday, difficulty: currentDifficulty,
        selectedDifficulty: profile.difficulty, spikeSpeed, spikeFrequency,
        playerName: profile.playerName, playerNameConfirmed: profile.playerNameConfirmed,
        bestScores: { ...profile.bestScores }, flightStarted,
        starPending, planetPending, asteroidPending, specialSpawnCooldown,
        bossActive, bossWarningActive, bossWarningFrames, bossWarningDurationFrames: BOSS_WARNING_FRAMES,
        bossCompleted, bossDefeatAnimating, bossDefeatFrames, bossTimeFrames,
        bossDurationFrames: bossDurationFrames(), bossDefeatAnimationFrames: BOSS_DEFEAT_ANIMATION_FRAMES,
        bossProjectiles: bossProjectiles.length,
        gamePaused, adminInfiniteInvincibility, achievements: [...profile.achievements],
        achievementStats: { ...profile.achievementStats },
        portraitSpeedMultiplier: DIFFICULTIES[currentDifficulty].mobilePortraitSpeedMultiplier,
        portraitIntervalMultiplier: DIFFICULTIES[currentDifficulty].mobilePortraitIntervalMultiplier,
        scoreSoundPlays: scoreSound.playCalls, invincibilitySoundPlays: invincibilitySound.playCalls,
        rankings: Object.fromEntries(Object.entries(profile.rankings)
          .map(([key, entries]) => [key, entries.map(item => ({ ...item }))])) }),
    };})();`, scope);
  return { api: scope.api, nodes, random: (value) => { random = value; },
    adResult: (value) => { rewardedAdResult = value; }, adCalls: rewardedAdCalls,
    rotate: (w, h) => { width = w; height = h; scope.api.resizeGame(); } };
}

test("Rutas de assets válidas y pinchos nuevos de 100x200", () => {
  const paths = [...source.matchAll(/:\s*"(src\/[^\"]+)"/g)].map(match => match[1]);
  // Respeta la capitalización de Git para el servidor Linux de Vercel.
  const tracked = require("node:child_process").execFileSync("git", ["ls-files", "src"], {
    cwd: path.join(__dirname, ".."), encoding: "utf8" }).split(/\r?\n/);
  for (const file of paths) { assert(fs.existsSync(path.join(__dirname, "..", file)), file); assert(tracked.includes(file), file); }
  for (const name of ["pincho_alto", "pincho_bajo"]) {
    const filename = name === "pincho_alto" ? "Pincho_alto.png" : "Pincho_bajo.png";
    const png = fs.readFileSync(path.join(__dirname, "../src/" + filename));
    assert.equal(png.readUInt32BE(16), 100); assert.equal(png.readUInt32BE(20), 200);
  }
});

test("Cada skin tiene variante muerta y las skins de países cuestan lo mismo", () => {
  const skinBlock = source.match(/const SKINS = \[([\s\S]*?)\n  \];/)[1];
  const skins = [...skinBlock.matchAll(/imageName: "([^"]+)", deadImageName: "([^"]+)"/g)];
  assert.equal(skins.length, 6);
  assert(skinBlock.includes('id: "venezuela"'));
  assert(skinBlock.includes('id: "argentina"'));
  assert.equal((skinBlock.match(/cost: COUNTRY_SKIN_COST/g) || []).length, 2);
  for (const [, live, dead] of skins) {
    assert(source.includes(`${live}: "src/`), live);
    assert(source.includes(`${dead}: "src/`), dead);
  }
  assert(source.includes('asteroid: "src/Obstaculos/Asteroide.png"'));
  assert(source.includes("dead ? selectedSkin().deadImageName"));
  assert(!source.includes("COLOR_CHANGE_FREQUENCY"));
  assert(!source.includes("colorIndex"));
});

test("La intro incluye marca B&Z y créditos en el orden solicitado", () => {
  assert(html.includes('src="src/BZStudios_presenta.png"'));
  assert(html.includes('src="src/Logo_bz.png"'));
  const luis = html.indexOf("Luis Zabala");
  const agustin = html.indexOf("Agustín Bustamante");
  assert(luis >= 0 && agustin > luis);
  assert.equal((html.match(/Creador · Desarrollador · Tester/g) || []).length, 4);
  assert(source.includes('state = "menu";\n    syncInterface();\n    introElement.hidden = false;'));
});

test("Las zonas transparentes no colisionan; los píxeles opacos sí", () => {
  const { api } = game();
  const transparent = sprite(3, 3); transparent.mask.fill(0); transparent.mask[4] = 1;
  const dot = sprite(1, 1);
  assert.equal(api.opaqueOverlap(api.spriteRect(transparent, 10, 10), api.spriteRect(dot, 10, 10)), false);
  assert.equal(api.opaqueOverlap(api.spriteRect(transparent, 10, 10), api.spriteRect(dot, 11, 11)), true);
});

test("Los planetas aparecen antes y varían su altura", () => {
  const g = game(); g.api.passed(3); g.api.tick();
  assert.equal(g.api.read().planetActive, true);
  const first = g.api.read().planetY;
  g.api.clear(); g.random(0.8); g.api.activateRandomPlanet();
  assert.notEqual(g.api.read().planetY, first);
});

test("Estrella cada 18 obstáculos y asteroide cada 10 desfasado 5", () => {
  const before = game();
  before.api.passed(4); before.api.tick(); assert.equal(before.api.read().powerupActive, false);
  const firstAsteroid = game();
  firstAsteroid.api.passed(5); firstAsteroid.api.tick();
  assert.equal(firstAsteroid.api.read().asteroidPending, true); // El planeta pendiente conserva su turno.
  assert.equal(firstAsteroid.api.read().nextAsteroidAt, 15);
  const star = game();
  star.api.selectDifficulty("easy"); star.api.startGame();
  star.api.passed(18); star.api.tick(); assert.equal(star.api.read().starPending, true);
  assert.equal(star.api.read().nextStarAt, 36);
});

test("Los dos asteroides se intercalan en cada aparición", () => {
  const g = game();
  g.api.clear(); g.api.activateAsteroid();
  const first = g.api.read().asteroidItems[0].imageName;
  g.api.clear(); g.api.activateAsteroid();
  const second = g.api.read().asteroidItems[0].imageName;
  g.api.clear(); g.api.activateAsteroid();
  const third = g.api.read().asteroidItems[0].imageName;
  assert.equal([first, second, third].join(","), "asteroid,asteroid2,asteroid");
});

test("Planetas, estrellas y asteroides se ordenan sin aparecer juntos", () => {
  const g = game();
  g.api.clear(); g.api.activateRandomPlanet(); g.api.activateStar(); g.api.activateAsteroid();
  let state = g.api.read();
  assert.equal(state.planetActive, true);
  assert.equal(state.powerupActive, false);
  assert.equal(state.asteroids, 0);
  assert.equal(state.starPending, true);
  assert.equal(state.asteroidPending, true);

  g.api.expirePlanet(); g.api.tick();
  assert.equal(g.api.read().specialSpawnCooldown, 48);
  for (let index = 0; index < 48; index += 1) g.api.tick();
  state = g.api.read();
  assert.equal(state.powerupActive, false);
  assert.equal(state.asteroids, 1);
  assert.equal(state.starPending, true);
});

test("Las tres dificultades aplican sus reglas de velocidad y asteroides", () => {
  const easy = game(); easy.api.selectDifficulty("easy"); easy.api.startGame();
  assert.equal(easy.api.read().difficulty, "easy");
  assert.equal(easy.api.read().spikeSpeed, 2.35); assert.equal(easy.api.read().spikeFrequency, 110);
  easy.api.passed(6); easy.api.tick();
  assert.equal(easy.api.read().spikeSpeed, 2.6); assert.equal(easy.api.read().spikeFrequency, 107);
  easy.api.clear(); easy.api.passed(20); easy.api.tick(); assert.equal(easy.api.read().asteroids, 0);

  const hard = game(); hard.api.selectDifficulty("hard"); hard.api.startGame();
  hard.api.passed(3); hard.api.tick();
  assert.equal(hard.api.read().difficulty, "hard"); assert.equal(hard.api.read().asteroidPending, true);
  assert.equal(hard.api.read().nextAsteroidAt, 7.5);
});

test("El sonido de puntuación usa inmediatamente el audio precargado", () => {
  const g = game(); g.api.passed(1); g.api.tick();
  assert.equal(g.api.read().score, 1); assert.equal(g.api.read().scoreSoundPlays, 1);
  const samples = new Float32Array(1000); samples[240] = 0.5;
  assert.equal(g.api.findAudioStartOffset({ sampleRate: 1000, numberOfChannels: 1, length: 1000,
    getChannelData: () => samples }), 0.236);
});

test("El nombre se solicita una vez y queda confirmado en el perfil", () => {
  const g = game();
  assert.equal(g.api.confirmPlayerName(""), false);
  assert.equal(g.api.read().playerNameConfirmed, false);
  assert.equal(g.api.confirmPlayerName("Luís_27"), true);
  assert.equal(g.api.read().playerName, "LUÍS_27");
  assert.equal(g.api.read().playerNameConfirmed, true);
});

test("El nombre queda bloqueado y cambiarlo cuesta 100 monedas", () => {
  const g = game();
  assert.equal(g.nodes.get("player-name").readOnly, true);
  assert.equal(g.api.beginNameEdit(), false);
  g.api.setCredits(120);
  assert.equal(g.api.beginNameEdit(), true);
  assert.equal(g.api.confirmNameEdit("Nova"), true); // Confirma el pago y muestra el campo.
  assert.equal(g.api.confirmNameEdit("Nova"), true);
  assert.equal(g.api.read().playerName, "NOVA");
  assert.equal(g.api.read().credits, 20);
});

test("La partida espera el primer impulso antes de activar la física", () => {
  const g = game(); g.api.beginWaiting();
  const initial = g.api.read();
  for (let index = 0; index < 30; index += 1) g.api.updateGame();
  assert.equal(g.api.read().ufoY, initial.ufoY);
  assert.equal(g.api.read().positions.length, 0);
  assert.equal(g.api.read().flightStarted, false);
  g.api.jump(); g.api.updateGame();
  assert.equal(g.api.read().flightStarted, true);
  assert.notEqual(g.api.read().ufoY, initial.ufoY);
});

test("Recoger planeta suma +1 con animación y conserva monedas previas", () => {
  const g = game(); g.api.planetAtPlayer(); g.api.tick();
  assert.equal(g.api.read().score, 1); assert(g.api.read().feedback.includes("+1"));
  assert.equal(g.api.read().credits, 22);
  g.api.finishFrameAsGameOver(); g.api.finishFrameAsGameOver();
  assert.equal(g.api.read().credits, 23); // Premio otorgado una sola vez.
});

test("Estrella duplica la invencibilidad y reproduce el sonido dos veces", () => {
  const g = game(); g.api.starAtPlayer(); g.api.tick();
  assert(g.api.read().invincible); assert(g.api.read().feedback.includes("INVENCIBLE"));
  assert.equal(g.api.read().powerupActive, false);
  assert.equal(g.api.read().invincibilityDurationFrames, 702);
  assert.equal(g.api.read().invincibilityCountdown, 9);
  for (let i = 0; i < 700; i++) g.api.tick();
  assert.equal(g.api.read().invincibilitySoundPlays, 2);
  assert.equal(g.api.read().invincibleTime, 701); assert(g.api.read().invincible);
  g.api.tick(); assert.equal(g.api.read().invincible, false);
});

test("En móvil planeta, estrella y asteroide nacen a la derecha y avanzan horizontalmente", () => {
  const g = game();
  g.api.clear(); g.api.activateRandomPlanet();
  const planetBefore = g.api.read(); assert(planetBefore.planetX > planetBefore.WIDTH);
  g.api.tick(); const planetAfter = g.api.read();
  assert(planetAfter.planetX < planetBefore.planetX); assert.equal(planetAfter.planetY, planetBefore.planetY);

  g.api.clear(); g.api.activateStar();
  const starBefore = g.api.read(); assert(starBefore.powerupX > starBefore.WIDTH);
  g.api.tick(); const starAfter = g.api.read();
  assert(starAfter.powerupX < starBefore.powerupX); assert.equal(starAfter.powerupY, starBefore.powerupY);

  g.api.clear(); g.api.activateAsteroid();
  const asteroidBefore = g.api.read().asteroidItems[0]; assert(asteroidBefore.x > g.api.read().WIDTH);
  g.api.tick(); const asteroidAfter = g.api.read().asteroidItems[0];
  assert(asteroidAfter.x < asteroidBefore.x); assert.equal(asteroidAfter.y, asteroidBefore.y);
  assert.equal(asteroidBefore.x - asteroidAfter.x,
    8 * g.api.read().portraitSpeedMultiplier * g.api.read().WIDTH / 800);
  assert.equal(asteroidBefore.size, 48);
});

test("En móvil vertical hay más espacio entre pinchos y entre cada par", () => {
  const portrait = game();
  const spikes = portrait.api.createSpikes(500);
  assert.equal(spikes.bottomY - (spikes.topY + portrait.api.read().spikeHeight), 240);
  for (let index = 0; index < 140; index += 1) portrait.api.safeTick();
  assert.equal(portrait.api.read().positions.length, 0);
  portrait.api.safeTick(); assert.equal(portrait.api.read().positions.length, 1);

  const landscape = game(844, 390, true);
  const landscapeSpikes = landscape.api.createSpikes(500);
  assert.equal(landscapeSpikes.bottomY - (landscapeSpikes.topY + landscape.api.read().spikeHeight), 180);
  landscape.api.activateAsteroid();
  assert.equal(landscape.api.read().asteroidItems[0].size, 64);
});

test("Las tres dificultades son más rápidas en móvil vertical", () => {
  const values = [];
  for (const difficulty of ["easy", "normal", "hard"]) {
    const g = game(); g.api.selectDifficulty(difficulty); g.api.startGame();
    values.push(g.api.read().portraitSpeedMultiplier);
  }
  assert.deepEqual(values, [1.12, 1.25, 1.45]);
  assert(values.every((value) => value > 1));
});

test("La ayuda, Hangar y ranking por dificultad están disponibles", () => {
  assert(html.includes('id="shop-button" class="action secondary" type="button">Hangar</button>'));
  assert(html.includes('id="help-button"'));
  assert(html.includes('id="ranking-button"'));
  for (const text of ["Tu UFO", "Pinchos", "Techo y suelo", "Planetas", "Estrella", "Asteroides"]) {
    assert(html.includes(text), text);
  }
  for (const difficulty of ["easy", "normal", "hard"]) {
    assert(html.includes(`data-ranking-difficulty="${difficulty}"`));
  }
});

test("El jefe avisa durante 3 segundos antes de aparecer y suspende los pinchos", () => {
  const g = game();
  g.api.setScore(99); g.api.passed(100); g.api.tick();
  let state = g.api.read();
  assert.equal(state.score, 100);
  assert.equal(state.bossWarningActive, true);
  assert.equal(state.bossActive, false);
  assert.equal(state.bossWarningDurationFrames, 3 * 80);
  g.api.bossWarningNearEnd(); g.api.safeTick();
  state = g.api.read();
  assert.equal(state.bossWarningActive, false);
  assert.equal(state.bossActive, true);
  assert.equal(state.positions.length, 0);
  assert.equal(state.bossDurationFrames, 30 * 80);
  for (let index = 0; index < 200; index += 1) g.api.safeTick();
  state = g.api.read();
  assert.equal(state.bossActive, true);
  assert.equal(state.positions.length, 0);
  assert(state.bossProjectiles > 0);
  assert(html.includes('id="boss-hud"'));
  assert(html.includes("Devorador cósmico"));
});

test("Sobrevivir 30 segundos derrota al jefe y entrega la recompensa", () => {
  const g = game(); g.api.setScore(100); g.api.startBossBattle();
  g.api.bossNearEnd(); g.api.safeTick();
  assert.equal(g.api.read().bossDefeatAnimating, true);
  for (let index = 0; index < g.api.read().bossDefeatAnimationFrames; index += 1) g.api.safeTick();
  const state = g.api.read();
  assert.equal(state.bossActive, false);
  assert.equal(state.bossCompleted, true);
  assert.equal(state.score, 110);
  assert.equal(state.credits, 72);
});

test("Los proyectiles del jefe destruyen al UFO sin invencibilidad", () => {
  const g = game(); g.api.setScore(100); g.api.startBossBattle();
  g.api.bossProjectileAtPlayer(); g.api.tick();
  assert.equal(g.api.read().state, "gameover");
});

test("El ranking conserva el mejor resultado local de cada partida", () => {
  const g = game(); g.api.planetAtPlayer(); g.api.tick(); g.api.finishFrameAsGameOver();
  const ranking = g.api.read().rankings.normal;
  assert.equal(ranking.length, 1); assert.equal(ranking[0].name, "PILOTO");
  assert.equal(ranking[0].score, 1);
});

test("El mejor puntaje local se guarda por separado en cada dificultad", () => {
  const g = game();
  assert.equal(JSON.stringify(g.api.read().bestScores), JSON.stringify({ easy: 0, normal: 16, hard: 0 }));
  g.api.selectDifficulty("easy"); g.api.startGame();
  g.api.planetAtPlayer(); g.api.tick(); g.api.finishFrameAsGameOver();
  assert.equal(JSON.stringify(g.api.read().bestScores), JSON.stringify({ easy: 1, normal: 16, hard: 0 }));
});

test("El panel F2 exige 9701 y ofrece herramientas de prueba", () => {
  const g = game();
  assert.equal(g.api.unlockAdmin("1234"), false);
  assert.equal(g.api.adminAddCoins(), false);
  assert.equal(g.api.unlockAdmin("9701"), true);
  assert.equal(g.api.adminAddCoins(), true);
  assert.equal(g.api.read().credits, 122);
  assert.equal(g.api.adminEnableInvincibility(), true);
  assert.equal(g.api.read().invincible, true);
  assert.equal(g.api.adminTestBoss(), true);
  assert.equal(g.api.read().bossActive, true);
  assert.equal(g.api.read().bossWarningActive, false);
  assert.equal(g.api.adminEnableInvincibility(), false);
  assert.equal(g.api.read().invincible, false);
});

test("La tienda entrega 50 monedas por anuncio y respeta el máximo diario de 10", async () => {
  const g = game(); g.api.showShop();
  for (let index = 0; index < 11; index += 1) await g.api.handleCoinAd();
  assert.equal(g.api.read().credits, 522);
  assert.equal(g.api.read().coinAdsToday, 10);
  assert.equal(g.adCalls.length, 10);
  assert.equal(g.nodes.get("coin-ad-button").disabled, true);
});

test("Un anuncio no completado no concede monedas", async () => {
  const g = game(); g.api.showShop(); g.adResult(false);
  await g.api.handleCoinAd();
  assert.equal(g.api.read().credits, 22);
  assert.equal(g.api.read().coinAdsToday, 0);
});

test("El anuncio permite continuar una vez y no duplica monedas ya guardadas", async () => {
  const g = game();
  g.api.planetAtPlayer(); g.api.tick();
  g.api.asteroidAtPlayer(); g.api.tick();
  assert.equal(g.api.read().state, "gameover"); assert.equal(g.api.read().credits, 23);
  await g.api.handleContinueAd();
  assert.equal(g.api.read().state, "playing"); assert.equal(g.api.read().continueUsed, true);
  assert.equal(g.api.read().invincible, true); assert.equal(g.adCalls.at(-1), "continue");
  g.api.planetAtPlayer(); g.api.tick();
  g.api.endShield(); g.api.asteroidAtPlayer(); g.api.tick();
  assert.equal(g.api.read().state, "gameover"); assert.equal(g.api.read().credits, 24);
});

test("En escritorio los planetas avanzan sólo en X; estrellas y asteroides conservan la diagonal", () => {
  const g = game(1280, 720, false);
  g.api.clear(); g.api.activateRandomPlanet();
  const planetBefore = g.api.read(); g.api.tick(); const planetAfter = g.api.read();
  assert.equal(planetAfter.planetY, planetBefore.planetY);
  assert(planetAfter.planetX < planetBefore.planetX);
  g.api.clear(); g.api.activateStar();
  const starBefore = g.api.read(); g.api.tick(); const starAfter = g.api.read();
  assert.notEqual(starAfter.powerupY, starBefore.powerupY);
  g.api.clear(); g.api.activateAsteroid();
  const asteroidBefore = g.api.read().asteroidItems[0]; g.api.tick();
  assert.notEqual(g.api.read().asteroidItems[0].y, asteroidBefore.y);
});

test("Cada aparición móvil obtiene una altura aleatoria", () => {
  const low = game(); low.random(0.15); low.api.clear(); low.api.activateRandomPlanet();
  const lowPlanet = low.api.read().planetY; low.api.clear(); low.api.activateStar();
  const lowStar = low.api.read().powerupY; low.api.clear(); low.api.activateAsteroid();
  const lowAsteroid = low.api.read().asteroidItems[0].y;

  const high = game(); high.random(0.85); high.api.clear(); high.api.activateRandomPlanet();
  const highPlanet = high.api.read().planetY; high.api.clear(); high.api.activateStar();
  const highStar = high.api.read().powerupY; high.api.clear(); high.api.activateAsteroid();
  const highAsteroid = high.api.read().asteroidItems[0].y;
  assert.notEqual(lowPlanet, highPlanet);
  assert.notEqual(lowStar, highStar);
  assert.notEqual(lowAsteroid, highAsteroid);
});

test("Acabar invencibilidad no teletransporta otra estrella activa", () => {
  const g = game(); g.api.effectAtEnd(); g.api.starFar();
  const before = g.api.read(); g.api.tick(); const after = g.api.read();
  assert.equal(after.powerupX,
    before.powerupX - 4 * before.portraitSpeedMultiplier * before.WIDTH / 800);
  assert.equal(after.powerupY, before.powerupY);
  assert(after.powerupActive); assert.equal(after.invincible, false);
});

test("Diagonal continua con rebote, sin teletransporte", () => {
  const { api } = game(); const item = { x: 300, y: 21, velocityY: -2 };
  api.moveDiagonal(item, 64, 4); assert(item.x < 300); assert.equal(item.y, 20);
  assert.equal(item.velocityY, 2); api.moveDiagonal(item, 64, 4); assert.equal(item.y, 22);
});

test("Asteroides matan, salvo durante invencibilidad", () => {
  const normal = game(); normal.api.asteroidAtPlayer(); normal.api.tick();
  assert.equal(normal.api.read().state, "gameover");
  const shield = game(); shield.api.starAtPlayer(); shield.api.tick();
  shield.api.asteroidAtPlayer(); shield.api.tick(); assert.equal(shield.api.read().state, "playing");
});

test("Se conserva separación móvil y estado al girar la pantalla", () => {
  const g = game(); for (let i = 0; i < 140; i++) g.api.safeTick();
  assert.equal(g.api.read().positions.length, 0); g.api.safeTick();
  assert.equal(g.api.read().positions.length, 1);
  assert(g.api.read().positions[0] > g.api.read().WIDTH);
  g.rotate(844, 390); const after = g.api.read();
  assert.equal(after.state, "playing"); assert.equal(after.credits, 22);
  assert.equal(after.HEIGHT, 600); assert.equal(after.spikeHeight, 600);
  const desktop = game(1280, 720, false);
  for (let i = 0; i < 90; i++) desktop.api.safeTick();
  assert.equal(desktop.api.read().positions.length, 0); desktop.api.safeTick();
  assert.equal(desktop.api.read().positions.length, 1);
  assert(desktop.api.read().positions[0] > desktop.api.read().WIDTH);
});

test("Los umbrales del jefe respetan cada dificultad", () => {
  for (const [difficulty, threshold] of [["easy", 50], ["normal", 75], ["hard", 100]]) {
    const g = game(); g.api.selectDifficulty(difficulty); g.api.startGame();
    g.api.setScore(threshold - 1);
    assert.equal(g.api.startBossWarning(), false);
    g.api.setScore(threshold);
    assert.equal(g.api.startBossWarning(), true);
  }
});

test("Pausa y reanuda la partida sin aceptar impulsos", () => {
  const g = game();
  const before = g.api.read().ufoY;
  const velocityBefore = g.api.read().jumpVelocity;
  assert.equal(g.api.pauseGame(), true);
  assert.equal(g.api.read().gamePaused, true);
  assert.equal(g.nodes.get("pause-dialog").open, true);
  g.api.jump();
  assert.equal(g.api.read().ufoY, before);
  assert.equal(g.api.read().jumpVelocity, velocityBefore);
  g.api.resumeGame();
  assert.equal(g.api.read().gamePaused, false);
  assert.equal(g.nodes.get("pause-dialog").open, false);
});

test("Los logros se guardan una sola vez y entregan su recompensa", () => {
  const g = game(390, 844, true, { credits: 0, bestScore: 0,
    bestScores: { easy: 0, normal: 0, hard: 0 }, achievements: [],
    achievementStats: {} });
  assert(g.api.read().achievements.includes("first-flight"));
  assert.equal(g.api.read().credits, 10);
  g.api.planetAtPlayer(); g.api.tick();
  assert(g.api.read().achievements.includes("new-world"));
  assert.equal(g.api.read().credits, 15);
  g.api.planetAtPlayer(); g.api.tick();
  assert.equal(g.api.read().credits, 15);
});

test("El menú incluye los 22 logros y sus dos sonidos", () => {
  assert.equal(achievementIds.length, 22);
  assert(html.includes('id="achievements-button"'));
  assert(html.includes('id="achievements-screen"'));
  assert(source.includes('new Audio("src/musica/logro.mp3")'));
  assert(source.includes('new Audio("src/musica/logro-dificil.mp3")'));
});

test("La invencibilidad bloquea techo y suelo sin atravesarlos", () => {
  const ceiling = game(); ceiling.api.shieldAtBoundary(-30, -5); ceiling.api.updateGame();
  assert.equal(ceiling.api.read().state, "playing");
  assert.equal(ceiling.api.read().ufoY, 0);
  const floor = game(); floor.api.shieldAtBoundary(9999, 5); floor.api.updateGame();
  assert.equal(floor.api.read().state, "playing");
  assert.equal(floor.api.read().ufoY, floor.api.read().HEIGHT - 38);
});

test("El jefe dura 20, 30 y 40 segundos según la dificultad", () => {
  for (const [difficulty, seconds] of [["easy", 20], ["normal", 30], ["hard", 40]]) {
    const g = game(); g.api.selectDifficulty(difficulty); g.api.startGame();
    assert.equal(g.api.read().bossDurationFrames, seconds * 80);
  }
});

test("Cada jefe y la victoria en las tres dificultades tienen logro", () => {
  const g = game(390, 844, true, { credits: 0, bestScore: 0,
    bestScores: { easy: 0, normal: 0, hard: 0 }, achievements: [], achievementStats: {} });
  for (const [difficulty, threshold] of [["easy", 50], ["normal", 75], ["hard", 100]]) {
    g.api.selectDifficulty(difficulty); g.api.startGame(); g.api.setScore(threshold);
    g.api.startBossBattle(); g.api.finishBossBattle();
    for (let index = 0; index < g.api.read().bossDefeatAnimationFrames; index += 1) g.api.safeTick();
  }
  for (const id of ["easy-boss", "normal-boss", "cosmic-nightmare", "boss-trinity"]) {
    assert(g.api.read().achievements.includes(id), id);
  }
});

test("Los objetos especiales mantienen el ritmo cuando aumenta la velocidad", () => {
  const g = game(); g.api.setSpikeSpeed(10);
  g.api.clear(); g.api.activateStar(); const starBefore = g.api.read().powerupX; g.api.tick();
  assert.equal(starBefore - g.api.read().powerupX,
    10 * g.api.read().portraitSpeedMultiplier * g.api.read().WIDTH / 800);
  g.api.clear(); g.api.activateAsteroid(); const asteroidBefore = g.api.read().asteroidItems[0].x; g.api.tick();
  assert.equal(asteroidBefore - g.api.read().asteroidItems[0].x,
    20 * g.api.read().portraitSpeedMultiplier * g.api.read().WIDTH / 800);
});

test("La pausa detiene el bucle y existe un control táctil", () => {
  assert(source.includes('if (state === "playing" && !gamePaused) {\n      accumulator += elapsed;'));
  assert(html.includes('id="pause-button"'));
  assert(source.includes('"pause-button": pauseGame'));
});

test("El acceso admin móvil usa pulsación de 3 segundos en logo y puntaje", () => {
  assert(source.includes("const HOLD_DURATION_MS = 3000"));
  assert(source.includes('bindAdminLongPress(document.getElementById("menu-brand-logo"))'));
  assert(source.includes("bindAdminLongPress(gameHud)"));
  assert(html.includes('id="menu-brand-logo"'));
  assert(html.includes('id="game-hud" class="game-hud admin-hold-target"'));
});

test("El menú no usa scroll y el ranking muestra carga estable", () => {
  assert(css.includes('.interface[data-state="menu"] { overflow: hidden; }'));
  assert(source.includes('cell.textContent = "Cargando clasificación..."'));
  assert(/state = "ranking";[\s\S]{0,160}loadGlobalRanking\(rankingDifficulty\);\s+syncInterface\(\)/.test(source));
});
