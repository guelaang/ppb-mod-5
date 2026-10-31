import { useState } from 'react'
import { ArrowLeft, Camera, Save, Check } from 'lucide-react'
import userService from '../services/userService'

/**
 * EditProfilePage — Edit nama & bio di halaman terpisah (bukan inline di profile).
 * @param {Function} props.onBack  — kembali ke profile
 */
export default function EditProfilePage({ onBack, onSaved }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [feedback, setFeedback] = useState('')
  const [saved, setSaved] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Foto harus di bawah 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatar(ev.target.result)
      setFeedback('')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    const updated = { ...profile, username: username.trim() || 'Shooter', bio: bio.trim(), avatar }
    const result = userService.saveUserProfile(updated)
    if (result.success) {
      setSaved(true)
      setFeedback('Profil berhasil disimpan!')
      setTimeout(() => {
        setSaved(false)
        setFeedback('')
        if (onSaved) onSaved(result.data)
        else if (onBack) onBack()
      }, 1200)
    } else {
      setFeedback('Gagal menyimpan profil.')
    }
  }

  return (
    <div className="edit-profile-page">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Profile
      </button>

      <section className="masthead">
        <h1 className="display">Edit Profil</h1>
        <p className="lede">Ubah nama, bio, dan foto profil kamu.</p>
      </section>

      <form className="edit-profile-form" onSubmit={handleSave}>
        {/* Avatar upload */}
        <div className="edit-avatar-wrap">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="edit-avatar-img" />
          ) : (
            <div className="edit-avatar-placeholder">
              <Camera size={36} />
            </div>
          )}
          <label htmlFor="edit-avatar-input" className="btn btn--outline btn--sm" style={{ cursor: 'pointer' }}>
            <Camera size={14} /> Ganti Foto
            <input
              id="edit-avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="edit-name" className="form-label">Nama / Callsign</label>
          <input
            id="edit-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nama panggilanmu"
            className="form-input"
            maxLength={40}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-bio" className="form-label">Bio</label>
          <textarea
            id="edit-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ceritakan sedikit tentang dirimu..."
            rows={4}
            className="form-textarea"
            maxLength={200}
          />
          <small className="form-hint">{bio.length}/200 karakter</small>
        </div>

        {feedback && (
          <p className={saved ? 'form-success' : 'form-error'}>{feedback}</p>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Batal
          </button>
          <button type="submit" className="btn btn--primary" disabled={saved}>
            {saved ? <><Check size={16} /> Tersimpan!</> : <><Save size={16} /> Simpan Profil</>}
          </button>
        </div>
      </form>
    </div>
  )
}
