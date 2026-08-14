import { logger } from "./logger.js";

// Generic key/value store for short-lived state that doesn't belong in
// Mongo: cached read-heavy query results and rate/attempt counters. Uses
// Redis when REDIS_URL is configured (works across multiple instances);
// otherwise falls back to a per-process in-memory Map — real caching and
// real attempt-limiting either way, just not shared across instances until
// Redis is wired up. Same "disabled/degraded until configured" pattern as
// the other optional integrations in this codebase.
const memory = new Map(); // key -> { value, expiresAt: number|null }

function memoryGet(key) {
  const entry = memory.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memory.delete(key);
    return undefined;
  }
  return entry.value;
}

function memorySet(key, value, ttlSeconds) {
  memory.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
}

let redisClient = null;
let redisConnectPromise = null;

async function getRedisClient() {
  if (!process.env.REDIS_URL) return null;
  if (redisClient) return redisClient;
  redisConnectPromise ??= (async () => {
    const { createClient } = await import("redis");
    const client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (err) => logger.error("Redis error", { error: err.message }));
    await client.connect();
    logger.info("Connected to Redis");
    redisClient = client;
    return client;
  })().catch((err) => {
    logger.error("Failed to connect to Redis — falling back to in-memory store", { error: err.message });
    redisConnectPromise = null;
    return null;
  });
  return redisConnectPromise;
}

export async function cacheGet(key) {
  const client = await getRedisClient();
  if (client) {
    const raw = await client.get(key);
    return raw === null ? undefined : JSON.parse(raw);
  }
  return memoryGet(key);
}

export async function cacheSet(key, value, ttlSeconds) {
  const client = await getRedisClient();
  if (client) {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return;
  }
  memorySet(key, value, ttlSeconds);
}

// Atomic-per-instance increment with a TTL — used for OTP-verification
// attempt limiting, where the counter should expire alongside the
// short-lived ticket it's guarding.
export async function incrCounter(key, ttlSeconds) {
  const client = await getRedisClient();
  if (client) {
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, ttlSeconds);
    return count;
  }
  const next = (memoryGet(key) ?? 0) + 1;
  memorySet(key, next, ttlSeconds);
  return next;
}
