import { useState, lazy, Suspense } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import gunService from './services/gunService.js'
import archiveService from './services/archiveService.js'
import { useCart } from './hooks/useCart.js'
import './App.css'

// Lazy-loaded page components (FITUR 2: Lazy Load)
const Catalog        = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage  = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage    = lazy(() => import('./pages/ProfilePage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const CartPage       = lazy(() => import('./pages/CartPage.jsx'))
const CreateGunPage  = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage    = lazy(() => import('./pages/EditGunPage.jsx'))
const GunDetail      = lazy(() => import('./components/gun/GunDetail.jsx'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <span style={{ color: 'var(--steel)', fontSize: '0.9rem' }}>Loading…</span>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab]   = useState('Catalog')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'editProfile' | 'cart'
  const [selectedGun, setSelectedGun]   = useState(null)
  const [editingGun, setEditingGun]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const { items: cartItems } = useCart()

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
    } else if (target === 'EditProfile') {
      setMode('editProfile')
    } else if (target === 'Cart') {
      setMode('cart')
    } else {
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  const handleArchive = (gun) => {
    archiveService.archiveGun(gun)
    handleBackToList()
    setTab('Catalog')
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
        onNavigateCart={() => handleNavigate('Cart')}
        cartCount={cartItems.length}
      />

      <main className="main">
        <Suspense fallback={<PageLoader />}>
          {/* Sub-page views */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={() => { handleBackToList(); setTab('Catalog') }}
            />
          )}

          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={() => { handleBackToList(); setTab('Catalog') }}
            />
          )}

          {mode === 'detail' && selectedGun && (
            <GunDetail
              gun={selectedGun}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setDeleteTarget(g)}
              onArchive={handleArchive}
            />
          )}

          {mode === 'editProfile' && (
            <EditProfilePage
              onBack={() => { setMode('list'); setTab('Profile') }}
              onSaved={() => { setMode('list'); setTab('Profile') }}
            />
          )}

          {mode === 'cart' && (
            <CartPage
              onContinueShopping={() => { setMode('list'); setTab('Catalog') }}
            />
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Profile' && (
                <ProfilePage
                  onReplaySplash={() => setShowSplash(true)}
                  onNavigate={handleNavigate}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Global Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Hardware Record"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            await gunService.deleteGun(deleteTarget.id)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Failed to delete record.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
