// ---------------------------------------------------------------------------
// draftStorage.js — auto-save / restore form drafts via localStorage.
//
// Drafts are keyed by a string id:
//   'create'              → the Create form
//   '<uuid>'              → the Edit form for a specific product
//
// Each draft is stored under  `gun_draft_<id>`  and its companion
// timestamp under  `gun_draft_<id>_ts`.
// ---------------------------------------------------------------------------

const PREFIX = 'gun_draft_'
const TS_SUFFIX = '_ts'

const notifyDraftChange = () => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('drafts-updated'))
    }
  } catch {
    // ignore
  }
}

/**
 * Persist a draft object.
 * @param {Object} draftData — arbitrary JSON-serializable form state
 * @param {string} draftId   — 'create' or a product UUID
 * @returns {boolean} true on success
 */
export const saveDraft = (draftData, draftId = 'create') => {
  try {
    const key = `${PREFIX}${draftId}`
    const ts = new Date().toISOString()
    const name = draftData?.formData?.name || draftData?.name || ''
    localStorage.setItem(key, JSON.stringify({ ...draftData, name, savedAt: ts }))
    localStorage.setItem(`${key}${TS_SUFFIX}`, ts)
    notifyDraftChange()
    return true
  } catch {
    return false
  }
}

/**
 * Load a previously saved draft.
 * @returns {Object|null}
 */
export const loadDraft = (draftId = 'create') => {
  try {
    const raw = localStorage.getItem(`${PREFIX}${draftId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Remove a draft and its timestamp from storage.
 */
export const deleteDraft = (draftId = 'create') => {
  try {
    // Handle either raw key or id
    const key = draftId.startsWith(PREFIX) ? draftId : `${PREFIX}${draftId}`
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}${TS_SUFFIX}`)
    notifyDraftChange()
    return true
  } catch {
    return false
  }
}

/**
 * Check whether a draft exists.
 */
export const hasDraft = (draftId = 'create') => {
  try {
    return localStorage.getItem(`${PREFIX}${draftId}`) !== null
  } catch {
    return false
  }
}

/**
 * Return the ISO-8601 timestamp string of the last save, or null.
 */
export const getDraftTimestamp = (draftId = 'create') => {
  try {
    return localStorage.getItem(`${PREFIX}${draftId}${TS_SUFFIX}`)
  } catch {
    return null
  }
}

/**
 * Human-readable "time ago" label for a draft timestamp.
 */
export const formatDraftTime = (timestamp) => {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} mnt lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam lalu`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} hari lalu`
  return new Date(timestamp).toLocaleDateString('id-ID')
}

/**
 * Return all existing draft ids.
 */
export const getAllDraftIds = () => {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX) && !k.endsWith(TS_SUFFIX))
      .map((k) => k.slice(PREFIX.length))
  } catch {
    return []
  }
}

/**
 * Return all existing drafts with full metadata.
 */
export const getAllDrafts = () => {
  try {
    const list = []
    const seen = new Set()
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith(PREFIX) || key.startsWith('bore_barrel_draft_') || key.startsWith('recipe_draft_')) &&
        !key.endsWith(TS_SUFFIX)
      ) {
        if (seen.has(key)) continue
        seen.add(key)
        try {
          const raw = localStorage.getItem(key)
          const data = raw ? JSON.parse(raw) : {}
          const id = key.startsWith(PREFIX) ? key.slice(PREFIX.length) : key
          const ts = localStorage.getItem(`${key}${TS_SUFFIX}`) || data?.savedAt || null
          const displayName =
            data?.formData?.name ||
            data?.name ||
            (id === 'create' ? 'Draft Hardware Baru' : `Draft ${id}`)
          list.push({
            id,
            key,
            _draftKey: key,
            name: displayName,
            savedAt: ts,
            data,
          })
        } catch {
          // ignore corrupted
        }
      }
    }
    return list.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0))
  } catch {
    return []
  }
}

/**
 * Remove every gun draft from storage.
 */
export const clearAllDrafts = () => {
  getAllDraftIds().forEach(deleteDraft)
}

export default {
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  getDraftTimestamp,
  formatDraftTime,
  getAllDraftIds,
  getAllDrafts,
  clearAllDrafts,
}
