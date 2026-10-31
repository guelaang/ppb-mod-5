// ---------------------------------------------------------------------------
// Simple in-memory query cache with TTL (Time-To-Live).
// Prevents redundant API calls when switching tabs.
// ---------------------------------------------------------------------------

const cache = new Map()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 menit

/**
 * Set a cache entry.
 * @param {string} key
 * @param {*} value
 * @param {number} ttl  milliseconds
 */
export const setCache = (key, value, ttl = DEFAULT_TTL) => {
  cache.set(key, { value, expiresAt: Date.now() + ttl })
}

/**
 * Get a cache entry. Returns undefined if missing or expired.
 */
export const getCache = (key) => {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

/**
 * Invalidate a specific cache key.
 */
export const invalidateCache = (key) => {
  cache.delete(key)
}

/**
 * Invalidate all keys starting with a prefix.
 */
export const invalidateCacheByPrefix = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

export default { setCache, getCache, invalidateCache, invalidateCacheByPrefix }
