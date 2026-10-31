import { useState, useEffect, useCallback } from 'react'
import gunService from '../services/gunService'
import { getCache, setCache, invalidateCacheByPrefix } from './useQueryCache'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
// Implements query caching (5 min TTL) to avoid redundant network requests.
//
// Returns { guns, loading, error, pagination, refetch }.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  // Serialise params so the effect re-runs when they change.
  const paramKey = JSON.stringify(params)
  const cacheKey = `guns:${paramKey}`

  const fetchGuns = useCallback(async (forceRefresh = false) => {
    // --- Query Cache check ---
    if (!forceRefresh) {
      const cached = getCache(cacheKey)
      if (cached) {
        setGuns(cached.data || [])
        setPagination(cached.pagination || null)
        setLoading(false)
        setError(null)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      // Race against a 5-second timeout so the UI doesn't hang
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Server tidak merespons. Menampilkan data lokal.')), 5000)
      )

      const response = await Promise.race([gunService.getGuns(params), timeoutPromise])

      if (response.success) {
        const result = { data: response.data || [], pagination: response.pagination || null }
        setCache(cacheKey, result) // cache for 5 minutes
        setGuns(result.data)
        setPagination(result.pagination)
      } else {
        setError(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      setError(err.message || 'Tidak dapat menghubungi server. Menampilkan data lokal.')
      setGuns([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey, cacheKey])

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  // refetch() clears cache and re-fetches fresh data
  const refetch = useCallback(() => {
    invalidateCacheByPrefix('guns:')
    fetchGuns(true)
  }, [fetchGuns])

  return { guns, loading, error, pagination, refetch }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its UUID.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const [gun, setGun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cacheKey = `gun:${id}`

  const fetchGun = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }

    // Cache check
    const cached = getCache(cacheKey)
    if (cached) {
      setGun(cached)
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGunById(id)

      if (response.success) {
        setCache(cacheKey, response.data)
        setGun(response.data)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.')
      setGun(null)
    } finally {
      setLoading(false)
    }
  }, [id, cacheKey])

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  return { gun, loading, error, refetch: fetchGun }
}
