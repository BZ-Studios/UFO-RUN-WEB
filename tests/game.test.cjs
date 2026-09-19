const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../js/game.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const sprite = (width, height) => ({ width, height, mask: new Uint8Array(width * height).fill(1) });

// Aislamos física y estado sin escribir el progreso real del navegador.
// Las colisiones de transparencia se prueban con máscaras explícitas más abajo.
function game(width = 390, height = 844, mobile = true) {
  let random = 0.2;
  const nodes = new Map();
  const element = () => ({ hidden: true, textContent: "", style: { setProperty() {} },
    classList: { toggle() {} }, setAttribute() {}, addEventListener() {}, append() {}, focus() {},
    getBoundingClientRect: () => ({ width, height }), getContext: () => ({ setTransform() {} }) });
  const document = { getElementById: (id) => {
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
  }, createElement: element, querySelectorAll: () => [], querySelector: () => element(),
  body: element(), documentElement: {} };
  class Audio {
    constructor() { this.duration = 4.388571428571429; }
    addEventListener() {}
    pause() {}
    play() { return Promise.resolve(); }
    cloneNode() { return new Audio(); }
  }
  const math = Object.create(Math);
  math.random = () => random;
  const scope = { document, Audio, Math: math, performance: { now: () => 0 },
    window: { devicePixelRatio: 1, matchMedia: () => ({ matches: mobile }), setTimeout() {} },
    localStorage: { getItem: () => JSON.stringify({ credits: 22, bestScore: 16,
      ownedSkins: ["classic"], selectedSkin: "classic" }), setItem() {} },
    fixtureSprite: sprite };
  const cutoff = source.indexOf('  canvas.addEventListener("pointerdown"');
  assert(cutoff > 0);
  vm.runInNewContext(source.slice(0, cutoff) + `
    getUfoSprite = () => fixtureSprite(55, 38);
    getPlanetSprite = () => fixtureSprite(80, 80);
    getSprite = (name) => fixtureSprite(name.startsWith("spike") ? 100 : name === "asteroid" ? 64 : 50,
      name.startsWith("spike") ? SPIKE_HEIGHT : name === "asteroid" ? 64 : 50);
    planetSprites = [{ imageName: "test" }];
    buildShopInterface(); resizeGame(); startGame();
    globalThis.api = {
      resizeGame, activateRandomPlanet, activateStar, activateAsteroid, moveDiagonal, moveFlyingItem,
      opaqueOverlap, spriteRect, finishFrameAsGameOver, updateGame,
      tick: () => { ufoY = HEIGHT / 2; jumpVelocity = -GRAVITY; updateGame(); },
      safeTick: () => { ufoY = HEIGHT / 2; jumpVelocity = -GRAVITY; invincible = true;
        invincibleTime = 0; updateGame(); },
      clear: () => { spikes = []; planetActive = false; planetPending = false;
        powerupActive = false; starPending = false; asteroids = []; },
      passed: (count) => { passedObstacles = count - 1;
        spikes = [{ topX: UFO_X - 102, bottomX: UFO_X - 102,
          topY: -SPIKE_HEIGHT, bottomY: HEIGHT, counted: false }]; },
      planetAtPlayer: () => { planetActive = true; currentPlanet = planetSprites[0];
        planetX = UFO_X + 10; planetY = HEIGHT / 2; planetVelocityY = 0; },
      starAtPlayer: () => { powerupActive = true; powerupX = UFO_X + 10;
        powerupY = HEIGHT / 2; powerupVelocityY = 0.8; },
      asteroidAtPlayer: () => { asteroids = [{ x: UFO_X + 10, y: HEIGHT / 2, velocityY: 1 }]; },
      effectAtEnd: () => { invincible = true; invincibleTime = invincibilityDurationFrames - 1; },
      starFar: () => { powerupActive = true; powerupX = WIDTH - 50;
        powerupY = 180; powerupVelocityY = 1; },
      read: () => ({ state, WIDTH, HEIGHT, spikeHeight: SPIKE_HEIGHT, score, credits: profile.credits,
        invincible, invincibleTime, invincibilityDurationFrames,
        invincibilityCountdown: Math.max(1, Math.ceil((invincibilityDurationFrames - invincibleTime) / FPS)),
        planetActive, planetX, planetY,
        planetVelocityY, powerupActive, powerupX, powerupY, powerupVelocityY,
        feedback: feedback.map(item => item.text), asteroids: asteroids.length,
        asteroidItems: asteroids.map(item => ({ ...item })),
        positions: spikes.map(item => item.topX), nextStarAt, nextAsteroidAt }),
    };})();`, scope);
  return { api: scope.api, nodes, random: (value) => { random = value; },
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

test("Estrella cada 12 obstáculos, asteroide cada 12 desfasado 6", () => {
  const g = game();
  g.api.passed(4); g.api.tick(); assert.equal(g.api.read().powerupActive, false);
  g.api.clear(); g.api.passed(6); g.api.tick(); assert.equal(g.api.read().asteroids, 1);
  g.api.clear(); g.api.passed(12); g.api.tick(); assert.equal(g.api.read().powerupActive, true);
  assert.equal(g.api.read().nextStarAt, 24);
  g.api.clear(); g.api.passed(18); g.api.tick(); assert.equal(g.api.read().asteroids, 1);
  assert.equal(g.api.read().nextAsteroidAt, 30);
});

test("Recoger planeta suma +1 con animación y conserva monedas previas", () => {
  const g = game(); g.api.planetAtPlayer(); g.api.tick();
  assert.equal(g.api.read().score, 1); assert(g.api.read().feedback.includes("+1"));
  assert.equal(g.api.read().credits, 22);
  g.api.finishFrameAsGameOver(); g.api.finishFrameAsGameOver();
  assert.equal(g.api.read().credits, 23); // Premio otorgado una sola vez.
});

test("Estrella muestra INVENCIBLE y el efecto dura lo mismo que su audio", () => {
  const g = game(); g.api.starAtPlayer(); g.api.tick();
  assert(g.api.read().invincible); assert(g.api.read().feedback.includes("INVENCIBLE"));
  assert.equal(g.api.read().powerupActive, false);
  assert.equal(g.api.read().invincibilityDurationFrames, 351);
  assert.equal(g.api.read().invincibilityCountdown, 5);
  for (let i = 0; i < 349; i++) g.api.tick();
  assert.equal(g.api.read().invincibleTime, 350); assert(g.api.read().invincible);
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
});

test("En escritorio planeta, estrella y asteroide mantienen movimiento diagonal", () => {
  const g = game(1280, 720, false);
  g.api.clear(); g.api.activateRandomPlanet();
  const planetBefore = g.api.read(); g.api.tick(); const planetAfter = g.api.read();
  assert.notEqual(planetAfter.planetY, planetBefore.planetY);
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
  assert.equal(after.powerupX, before.powerupX - 4 * before.WIDTH / 800);
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
  const g = game(); for (let i = 0; i < 149; i++) g.api.safeTick();
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
