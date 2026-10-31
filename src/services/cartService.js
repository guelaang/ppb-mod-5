// ---------------------------------------------------------------------------
// cartService — Shopping cart dengan localStorage persistence.
// Checkout redirect ke WhatsApp dengan pesan pre-filled.
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'

/**
 * Get current cart items.
 */
export const getCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Save cart to localStorage.
 */
const saveCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

/**
 * Add item to cart. Increment qty if already exists.
 */
export const addToCart = (gun) => {
  const items = getCart()
  const idx = items.findIndex((i) => i.id === gun.id)
  if (idx > -1) {
    items[idx].qty = (items[idx].qty || 1) + 1
  } else {
    items.push({ ...gun, qty: 1 })
  }
  saveCart(items)
  return items
}

/**
 * Remove item from cart.
 */
export const removeFromCart = (gunId) => {
  const items = getCart().filter((i) => i.id !== gunId)
  saveCart(items)
  return items
}

/**
 * Update quantity of an item.
 */
export const updateQty = (gunId, qty) => {
  const items = getCart().map((i) =>
    i.id === gunId ? { ...i, qty: Math.max(1, qty) } : i
  )
  saveCart(items)
  return items
}

/**
 * Clear all cart items.
 */
export const clearCart = () => {
  saveCart([])
  return []
}

/**
 * Get cart total price.
 */
export const getCartTotal = (items) =>
  items.reduce((sum, i) => sum + (i.price ?? 0) * (i.qty ?? 1), 0)

/**
 * Redirect to WhatsApp checkout.
 * @param {Array} items   — cart items
 * @param {string} waNumber — WA number with country code (no + or spaces), default: owner's
 */
export const checkoutViaWA = (items, waNumber = '6281234567890') => {
  if (!items || items.length === 0) return

  const lines = items.map(
    (i) => `- ${i.name} (x${i.qty ?? 1}) @ Rp ${Number(i.price ?? 0).toLocaleString('id-ID')}`
  )
  const total = getCartTotal(items)
  const message =
    `Hi aku mau pesan 🛒\n\n` +
    lines.join('\n') +
    `\n\nTotal: Rp ${total.toLocaleString('id-ID')}\n\nMohon konfirmasi ketersediaan stok. Terima kasih!`

  const encoded = encodeURIComponent(message)
  const url = `https://wa.me/${waNumber}?text=${encoded}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default {
  getCart,
  addToCart,
  removeFromCart,
  updateQty,
  clearCart,
  getCartTotal,
  checkoutViaWA,
}
