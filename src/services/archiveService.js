// ---------------------------------------------------------------------------
// archiveService — Soft delete / arsip produk via localStorage.
// Menyimpan item yang diarsip agar bisa di-restore kapan saja.
// ---------------------------------------------------------------------------

const ARCHIVE_KEY = 'bore_barrel_archived_guns'

/**
 * Get all archived gun IDs.
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
    const raw = localStorage.getItem(`${ARCHIVE_KEY}_data`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Archive (soft-delete) a gun object.
 */
export const archiveGun = (gun) => {
  try {
    // Track IDs
    const ids = getArchivedIds()
    if (!ids.includes(gun.id)) {
      ids.push(gun.id)
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(ids))
    }

    // Track full data
    const guns = getArchivedGuns()
    if (!guns.find((g) => g.id === gun.id)) {
      guns.unshift({ ...gun, archivedAt: new Date().toISOString() })
      localStorage.setItem(`${ARCHIVE_KEY}_data`, JSON.stringify(guns))
    }
    return { success: true }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * Restore an archived gun (remove from archive).
 */
export const restoreGun = (gunId) => {
  try {
    const ids = getArchivedIds().filter((id) => id !== gunId)
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(ids))

    const guns = getArchivedGuns().filter((g) => g.id !== gunId)
    localStorage.setItem(`${ARCHIVE_KEY}_data`, JSON.stringify(guns))

    return { success: true }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * Permanently delete an archived gun.
 */
export const permanentlyDeleteGun = (gunId) => {
  return restoreGun(gunId) // same logic: just remove from archive list
}

/**
 * Check if a gun is archived.
 */
export const isArchived = (gunId) => {
  return getArchivedIds().includes(gunId)
}

export default {
  getArchivedIds,
  getArchivedGuns,
  archiveGun,
  restoreGun,
  permanentlyDeleteGun,
  isArchived,
}
