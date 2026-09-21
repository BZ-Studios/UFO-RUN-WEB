const { test } = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/scores.js");

function responseRecorder() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.payload = JSON.parse(value); },
  };
}

test("La API limpia nombres y valida puntuaciones antes de guardarlas", async () => {
  assert.equal(handler.cleanName("  Luís! 👽_27  "), "LUÍS _27");

  const response = responseRecorder();
  await handler({ method: "POST", body: { difficulty: "imposible", name: "Ana", score: 12 }, headers: {} }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, "Invalid score");
});

test("La API devuelve el top global desde Redis", async (context) => {
  const oldUrl = process.env.KV_REST_API_URL;
  const oldToken = process.env.KV_REST_API_TOKEN;
  const oldFetch = global.fetch;
  context.after(() => {
    if (oldUrl === undefined) delete process.env.KV_REST_API_URL; else process.env.KV_REST_API_URL = oldUrl;
    if (oldToken === undefined) delete process.env.KV_REST_API_TOKEN; else process.env.KV_REST_API_TOKEN = oldToken;
    global.fetch = oldFetch;
  });
  process.env.KV_REST_API_URL = "https://redis.example";
  process.env.KV_REST_API_TOKEN = "test-token";
  global.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), ["ZREVRANGE", "ufo-run:ranking:normal", 0, 9, "WITHSCORES"]);
    return { ok: true, json: async () => ({ result: ["ANA", "14", "LUIS", "9"] }) };
  };

  const response = responseRecorder();
  await handler({ method: "GET", query: { difficulty: "normal" }, headers: {} }, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload.scores, [{ name: "ANA", score: 14 }, { name: "LUIS", score: 9 }]);
});
