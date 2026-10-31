import { useState, useCallback } from 'react'
import cartService from '../services/cartService'

// ---------------------------------------------------------------------------
// useCart — reactive cart state using localStorage.
// ---------------------------------------------------------------------------

export function useCart() {
  const [items, setItems] = useState(() => cartService.getCart())

  const addToCart = useCallback((gun) => {
    const updated = cartService.addToCart(gun)
    setItems([...updated])
  }, [])

  const removeFromCart = useCallback((gunId) => {
    const updated = cartService.removeFromCart(gunId)
    setItems([...updated])
  }, [])

  const updateQty = useCallback((gunId, qty) => {
    const updated = cartService.updateQty(gunId, qty)
    setItems([...updated])
  }, [])

  const clearCart = useCallback(() => {
    const updated = cartService.clearCart()
    setItems(updated)
  }, [])

  const checkout = useCallback((waNumber) => {
    cartService.checkoutViaWA(items, waNumber)
  }, [items])

  const total = cartService.getCartTotal(items)

  return { items, total, addToCart, removeFromCart, updateQty, clearCart, checkout }
}
