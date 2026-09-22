"use strict";

const VALID_DIFFICULTIES = new Set(["easy", "normal", "hard"]);
const DAILY_SUBMISSION_LIMIT = 50;

function cleanName(value) {
  return String(value || "").trim().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 12).toUpperCase();
}

function storageConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN,
  };
}

async function redis(command) {
  const config = storageConfig();
  if (!config.url || !config.token) {
    const error = new Error("Ranking storage is not configured");
    error.code = "STORAGE_NOT_CONFIGURED";
    throw error;
  }
  const response = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`Ranking storage responded with ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

function send(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function requestIp(request) {
  return String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "unknown")
    .split(",")[0].trim().replace(/[^a-zA-Z0-9:._-]/g, "").slice(0, 80);
}

async function enforceRateLimit(request) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `ufo-run:score-limit:${day}:${requestIp(request)}`;
  const attempts = Number(await redis(["INCR", key]));
  if (attempts === 1) await redis(["EXPIRE", key, 86400]);
  return attempts <= DAILY_SUBMISSION_LIMIT;
}

async function handler(request, response) {
  const method = request.method || "GET";
  try {
    if (method === "GET") {
      const difficulty = String(request.query?.difficulty || "normal");
      if (!VALID_DIFFICULTIES.has(difficulty)) return send(response, 400, { error: "Invalid difficulty" });
      const values = await redis(["ZREVRANGE", `ufo-run:ranking:${difficulty}`, 0, 9, "WITHSCORES"]);
      const scores = [];
      for (let index = 0; index < values.length; index += 2) {
        scores.push({ name: values[index], score: Number(values[index + 1]) || 0 });
      }
      return send(response, 200, { difficulty, scores });
    }

    if (method === "POST") {
      let body = request.body || {};
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (_error) { body = {}; }
      }
      const difficulty = String(body.difficulty || "");
      const name = cleanName(body.name);
      const score = Math.trunc(Number(body.score));
      if (!VALID_DIFFICULTIES.has(difficulty) || !name || !Number.isFinite(score) || score < 1 || score > 1000000) {
        return send(response, 400, { error: "Invalid score" });
      }
      if (!await enforceRateLimit(request)) return send(response, 429, { error: "Daily submission limit reached" });
      await redis(["ZADD", `ufo-run:ranking:${difficulty}`, "GT", score, name]);
      return send(response, 200, { saved: true });
    }

    response.setHeader("Allow", "GET, POST");
    return send(response, 405, { error: "Method not allowed" });
  } catch (error) {
    if (error.code === "STORAGE_NOT_CONFIGURED") {
      return send(response, 503, { error: "Global ranking is not configured" });
    }
    console.error(error);
    return send(response, 500, { error: "Ranking service unavailable" });
  }
}

module.exports = handler;
module.exports.cleanName = cleanName;
module.exports.storageConfig = storageConfig;
