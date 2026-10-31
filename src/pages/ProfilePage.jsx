import { useState, useEffect } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Camera,
  Play,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Info,
  Phone,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import archiveService from '../services/archiveService'
import draftStorage, { formatDraftTime } from '../utils/draftStorage'
import { formatPrice } from '../utils/helpers'

/**
 * ProfilePage — User identity, stats, drafts, arsip, About & Contact.
 * Edit nama/bio dilakukan di EditProfilePage (halaman terpisah).
 */
export default function ProfilePage({ onReplaySplash, onNavigate }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState('stats') // 'stats' | 'drafts' | 'archive' | 'about' | 'contact'

  const { favorites } = useFavorites()
  const [drafts, setDrafts] = useState(() => draftStorage.getAllDrafts())
  const [archivedGuns, setArchivedGuns] = useState(() => archiveService.getArchivedGuns())

  // Real-time synchronization saat arsip atau draft berubah
  useEffect(() => {
    const onArchiveUpdate = () => {
      setArchivedGuns(archiveService.getArchivedGuns())
    }
    const onDraftsUpdate = () => {
      setDrafts(draftStorage.getAllDrafts())
    }

    window.addEventListener('archive-updated', onArchiveUpdate)
    window.addEventListener('drafts-updated', onDraftsUpdate)
    return () => {
      window.removeEventListener('archive-updated', onArchiveUpdate)
      window.removeEventListener('drafts-updated', onDraftsUpdate)
    }
  }, [])

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeleteDraft = (draftKey) => {
    draftStorage.deleteDraft(draftKey)
    setDrafts(draftStorage.getAllDrafts())
  }

  const handleRestoreGun = (gunId) => {
    archiveService.restoreGun(gunId)
    setArchivedGuns(archiveService.getArchivedGuns())
  }

  const handlePermanentDelete = (gunId) => {
    archiveService.permanentlyDeleteGun(gunId)
    setArchivedGuns(archiveService.getArchivedGuns())
  }

  const SECTIONS = [
    { id: 'stats', label: 'Statistik' },
    { id: 'drafts', label: `Draft (${drafts.length})` },
    { id: 'archive', label: `Arsip (${archivedGuns.length})` },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ]

  return (
    <div className="profile-page">
      <section
        className="masthead"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}
      >
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">Operator credentials, procurement statistics, and armorer details.</p>
        </div>
        {onReplaySplash && (
          <button type="button" className="btn btn--outline btn--sm" onClick={onReplaySplash}>
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>
          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            {profile.bio && <p className="profile-bio-preview">{profile.bio}</p>}
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button type="button" className="icon-btn" onClick={handleCopyId} title="Copy User ID">
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Edit profile button */}
        {onNavigate && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            style={{ marginTop: '12px' }}
            onClick={() => onNavigate('EditProfile')}
          >
            <Edit2 size={14} /> Edit Profil
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div className="profile-tabs">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`profile-tab ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* === STATISTIK === */}
      {activeSection === 'stats' && (
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Drafts</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{archivedGuns.length}</div>
            <div className="stat-label">Archived Items</div>
          </div>
        </div>
      )}

      {/* === DRAFT === */}
      {activeSection === 'drafts' && (
        <div className="profile-section-content">
          <h3 className="section-title">Draft Tersimpan</h3>
          {drafts.length === 0 ? (
            <p className="detail-empty">Tidak ada draft tersimpan.</p>
          ) : (
            <ul className="draft-list">
              {drafts.map((d) => (
                <li key={d._draftKey} className="draft-item">
                  <div
                    className="draft-info"
                    style={{ cursor: 'pointer', flex: 1 }}
                    onClick={() => onNavigate && onNavigate('Create', { draftId: d.id || 'create' })}
                    title="Klik untuk membuka dan melanjutkan draft ini"
                  >
                    <strong>{d.name || 'Draft tanpa judul'}</strong>
                    <span className="draft-key">
                      {d.savedAt ? formatDraftTime(d.savedAt) : 'Draft lokal'} · Klik untuk lanjut edit
                    </span>
                  </div>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={(e) => { e.stopPropagation(); handleDeleteDraft(d._draftKey) }}
                    title="Hapus draft"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* === ARSIP === */}
      {activeSection === 'archive' && (
        <div className="profile-section-content">
          <h3 className="section-title">Item Diarsip (Soft Delete)</h3>
          {archivedGuns.length === 0 ? (
            <p className="detail-empty">Tidak ada item yang diarsip.</p>
          ) : (
            <ul className="archive-list">
              {archivedGuns.map((gun) => (
                <li key={gun.id} className="archive-item">
                  <img
                    src={gun.image_url || gun.image || '/guns/pistol.svg'}
                    alt={gun.name}
                    className="archive-item-img"
                    loading="lazy"
                  />
                  <div className="archive-item-info">
                    <strong>{gun.name}</strong>
                    <span>{gun.type} · {formatPrice(gun.price)}</span>
                    {gun.archivedAt && (
                      <small>Diarsip: {new Date(gun.archivedAt).toLocaleDateString('id-ID')}</small>
                    )}
                  </div>
                  <div className="archive-item-actions">
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => handleRestoreGun(gun.id)}
                      title="Restore"
                    >
                      <RotateCcw size={13} /> Restore
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => handlePermanentDelete(gun.id)}
                      title="Hapus permanen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* === ABOUT === */}
      {activeSection === 'about' && (
        <div className="profile-section-content">
          <div className="about-section">
            <Info size={28} stroke="var(--brass)" />
            <h3 className="section-title">A one-room armory.</h3>
            <p>
              Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced from
              the bench — no markup theatre, no filler. We stock what works and nothing more.
            </p>
            <p>
              Founded by armorers, for shooters who know exactly what they need. Every listing
              includes caliber, type, and a fair price — specs over spectacle.
            </p>
          </div>
        </div>
      )}

      {/* === CONTACT === */}
      {activeSection === 'contact' && (
        <div className="profile-section-content">
          <div className="contact-section">
            <Phone size={28} stroke="var(--brass)" />
            <h3 className="section-title">Come by the shop.</h3>
            <ul className="contact-list">
              <li>📍 123 Range Road, Jakarta Selatan</li>
              <li>🕐 Selasa – Sabtu, 10:00 – 18:00</li>
              <li>📞 0895-0601-6984</li>
              <li>📧 hello@boreandbarrel.id</li>
            </ul>
            <a
              href="https://wa.me/6289506016984?text=Hi%20Bore%20%26%20Barrel%2C%20saya%20mau%20tanya..."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--wa"
              style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              💬 Chat via WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
