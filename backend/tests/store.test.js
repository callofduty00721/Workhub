import { describe, it, expect, beforeEach, vi } from "vitest";
import { cacheGet, cacheSet, incrCounter } from "../src/utils/store.js";

// No REDIS_URL is set in the test environment, so these exercise the
// in-memory fallback path — the same one every dev/single-instance
// deployment without Redis actually runs on.
describe("store (in-memory fallback, no REDIS_URL)", () => {
  it("returns undefined for a key that was never set", async () => {
    expect(await cacheGet("nonexistent:key")).toBeUndefined();
  });

  it("round-trips a value through cacheSet/cacheGet", async () => {
    await cacheSet("test:value", { hello: "world" }, 60);
    expect(await cacheGet("test:value")).toEqual({ hello: "world" });
  });

  it("expires a cached value after its TTL", async () => {
    vi.useFakeTimers();
    await cacheSet("test:ttl", "will-expire", 1);
    expect(await cacheGet("test:ttl")).toBe("will-expire");
    vi.advanceTimersByTime(1100);
    expect(await cacheGet("test:ttl")).toBeUndefined();
    vi.useRealTimers();
  });

  it("increments a counter starting from 1", async () => {
    const key = `test:counter:${Date.now()}`;
    expect(await incrCounter(key, 60)).toBe(1);
    expect(await incrCounter(key, 60)).toBe(2);
    expect(await incrCounter(key, 60)).toBe(3);
  });
});
