import { useState, useMemo, useEffect } from 'react'
import { RefreshCw, Plus, Loader, AlertCircle, PackageOpen, CheckCircle } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import gunService from '../services/gunService'
import archiveService from '../services/archiveService'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'

/**
 * Catalog page — the main product listing.
 *
 * Data source priority:
 *   1. Live API via useGuns()
 *   2. Local static array (GUNS_LOCAL) when the API is unreachable
 *
 * Features: search, category filter, sort, CRUD actions, soft delete/arsip, detail view.
 */
export default function Catalog({ onNavigate }) {
  // ---- API data ----
  const { guns: apiGuns, loading, error, refetch } = useGuns({ limit: 50 })
  const [useLocal, setUseLocal] = useState(false)
  const [archiveTrigger, setArchiveTrigger] = useState(0)

  // Sync when items are archived, restored, or permanently deleted
  useEffect(() => {
    const onArchiveUpdate = () => setArchiveTrigger((t) => t + 1)
    window.addEventListener('archive-updated', onArchiveUpdate)
    return () => window.removeEventListener('archive-updated', onArchiveUpdate)
  }, [])

  // Decide data source & filter out archived or deleted items
  const rawGuns = useMemo(() => {
    let list = []
    if (useLocal || (error && apiGuns.length === 0)) {
      list = GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    } else {
      list = apiGuns
    }

    const archivedIds = archiveService.getArchivedIds()
    const deletedIds = archiveService.getDeletedIds()

    return list.filter((g) => {
      const gid = g.id || g.name
      return !archivedIds.includes(gid) && !deletedIds.includes(gid)
    })
  }, [apiGuns, error, useLocal, archiveTrigger])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const categories = useMemo(() => extractCategories(rawGuns), [rawGuns])

  const filteredGuns = useMemo(() => {
    let result = rawGuns.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawGuns, search, activeCategory, sortKey, sortOrder])

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  // ---- delete / archive modal state ----
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  const handleArchiveConfirm = () => {
    if (!deleteTarget) return
    archiveService.archiveGun(deleteTarget)
    setSuccessNotice(`"${deleteTarget.name}" berhasil dipindahkan ke Arsip (Soft Delete).`)
    setDeleteTarget(null)
    setTimeout(() => setSuccessNotice(''), 4000)
  }

  const handlePermanentDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const targetId = deleteTarget.id || deleteTarget.name
      archiveService.permanentlyDeleteGun(targetId)
      // Best effort delete on backend server
      if (deleteTarget.id) {
        gunService.deleteGun(deleteTarget.id).catch(() => {})
      }
      setSuccessNotice(`"${deleteTarget.name}" berhasil dihapus permanen.`)
      setDeleteTarget(null)
      setTimeout(() => setSuccessNotice(''), 4000)
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus produk.')
    } finally {
      setDeleting(false)
    }
  }

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={() => setSelectedGun(null)}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onDelete={(g) => { setSelectedGun(null); setDeleteTarget(g) }}
        onArchive={(g) => {
          archiveService.archiveGun(g)
          setSelectedGun(null)
          setSuccessNotice(`"${g.name}" berhasil dipindahkan ke Arsip.`)
          setTimeout(() => setSuccessNotice(''), 4000)
        }}
      />
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      {/* Notifications */}
      {successNotice && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {successNotice}
        </div>
      )}

      <section>
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} piece{filteredGuns.length !== 1 ? 's' : ''}
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={15} /> Add Hardware
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => { setUseLocal(false); refetch() }}
              title="Refresh catalog"
              aria-label="Refresh catalog"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <AdvancedFilter
          search={search}
          onSearchChange={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        {/* Error banner with fallback toggle */}
        {error && !useLocal && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setUseLocal(true)}
            >
              View local catalog
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="loading-state">
            <Loader className="spin" size={28} />
            <p>Loading armory inventory…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredGuns.length === 0 && (
          <div className="empty-state">
            <PackageOpen size={36} stroke="var(--steel)" />
            <p>No matching hardware found.</p>
            {(search || activeCategory !== 'All') && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => { setSearch(''); setActiveCategory('All') }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Catalog grid */}
        {!loading && filteredGuns.length > 0 && (
          <ul className="gun-grid">
            {filteredGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={setSelectedGun}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); refetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      {/* Delete / Archive confirmation modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus atau Arsipkan Produk"
        message={`Pilih tindakan untuk "${deleteTarget?.name}": pindahkan ke Arsip (soft delete, dapat dipulihkan sewaktu-waktu dari profil) atau hapus permanen.`}
        confirmLabel="Pindahkan ke Arsip (Soft Delete)"
        secondaryLabel="Hapus Permanen"
        cancelLabel="Batal"
        loading={deleting}
        onConfirm={handleArchiveConfirm}
        onSecondary={handlePermanentDeleteConfirm}
        onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
      />
      {deleteError && (
        <div className="toast toast--error">{deleteError}</div>
      )}
    </>
  )
}
