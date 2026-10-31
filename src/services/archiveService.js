// ---------------------------------------------------------------------------
// archiveService — Soft delete / arsip produk via localStorage.
// Menyimpan item yang diarsip agar bisa di-restore kapan saja,
// serta melacak item yang dihapus permanen.
// ---------------------------------------------------------------------------

const ARCHIVE_KEY = 'bore_barrel_archived_guns'
const ARCHIVE_DATA_KEY = `${ARCHIVE_KEY}_data`
const DELETED_KEY = 'bore_barrel_deleted_guns'

const notifyChange = () => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('archive-updated'))
    }
  } catch {
    // ignore
  }
}

/**
 * Get all archived gun IDs (soft deleted).
 */
export const getArchivedIds = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Get all archived gun objects.
 */
export const getArchivedGuns = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_DATA_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Get all permanently deleted gun IDs.
 */
export const getDeletedIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Check if a gun is archived.
 */
export const isArchived = (gunId) => {
  if (!gunId) return false
  return getArchivedIds().includes(gunId)
}

/**
 * Check if a gun is permanently deleted.
 */
export const isDeleted = (gunId) => {
  if (!gunId) return false
  return getDeletedIds().includes(gunId)
}

/**
 * Archive (soft-delete) a gun object.
 */
export const archiveGun = (gun) => {
  if (!gun) return { success: false }
  const gunId = gun.id || gun.name
  try {
    // 1. Remove from permanently deleted if present
    const del = getDeletedIds().filter((id) => id !== gunId)
    localStorage.setItem(DELETED_KEY, JSON.stringify(del))

    // 2. Track ID
    const ids = getArchivedIds()
    if (!ids.includes(gunId)) {
      ids.push(gunId)
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(ids))
    }

    // 3. Track full object
    const guns = getArchivedGuns()
    const existingIndex = guns.findIndex((g) => (g.id || g.name) === gunId)
    const archivedItem = {
      ...gun,
      id: gunId,
      archivedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      guns[existingIndex] = archivedItem
    } else {
      guns.unshift(archivedItem)
    }
    localStorage.setItem(ARCHIVE_DATA_KEY, JSON.stringify(guns))

    notifyChange()
    return { success: true }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * Restore an archived gun (returns it back to catalog).
 */
export const restoreGun = (gunId) => {
  try {
    const ids = getArchivedIds().filter((id) => id !== gunId)
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(ids))

    const guns = getArchivedGuns().filter((g) => (g.id || g.name) !== gunId)
    localStorage.setItem(ARCHIVE_DATA_KEY, JSON.stringify(guns))

    const del = getDeletedIds().filter((id) => id !== gunId)
    localStorage.setItem(DELETED_KEY, JSON.stringify(del))

    notifyChange()
    return { success: true }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * Permanently delete an archived gun or any gun.
 * Item will never reappear in Catalog or Archive.
 */
export const permanentlyDeleteGun = (gunId) => {
  try {
    // Remove from archive lists
    const ids = getArchivedIds().filter((id) => id !== gunId)
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(ids))

    const guns = getArchivedGuns().filter((g) => (g.id || g.name) !== gunId)
    localStorage.setItem(ARCHIVE_DATA_KEY, JSON.stringify(guns))

    // Add to permanently deleted list
    const del = getDeletedIds()
    if (!del.includes(gunId)) {
      del.push(gunId)
      localStorage.setItem(DELETED_KEY, JSON.stringify(del))
    }

    notifyChange()
    return { success: true }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

export default {
  getArchivedIds,
  getArchivedGuns,
  getDeletedIds,
  archiveGun,
  restoreGun,
  permanentlyDeleteGun,
  isArchived,
  isDeleted,
}
