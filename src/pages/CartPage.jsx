import { useState } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, MessageCircle, PackageOpen } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/helpers'

// WA number owner — 089506016984
const WA_NUMBER = '6289506016984'

/**
 * CartPage — Keranjang belanja dengan checkout ke WhatsApp.
 */
export default function CartPage({ onContinueShopping }) {
  const { items, total, addToCart, removeFromCart, updateQty, clearCart, checkout } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)

  const handleCheckout = () => {
    setCheckingOut(true)
    checkout(WA_NUMBER)
    setTimeout(() => setCheckingOut(false), 2000)
  }

  return (
    <div className="cart-page">
      <section className="masthead">
        <h1 className="display">
          <ShoppingCart size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Keranjang
        </h1>
        <p className="lede">
          Periksa pesananmu lalu checkout via WhatsApp.
        </p>
      </section>

      {items.length === 0 ? (
        <div className="state-box">
          <PackageOpen size={32} />
          <p>Keranjang kosong.</p>
          {onContinueShopping && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={onContinueShopping}
            >
              Lihat Katalog
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
                <img
                  className="cart-item-img"
                  src={item.image_url || item.image || '/guns/pistol.svg'}
                  alt={item.name}
                  width={72}
                  height={54}
                  loading="lazy"
                />
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-price">{formatPrice(item.price)}</p>
                </div>
                <div className="cart-item-qty">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQty(item.id, (item.qty ?? 1) - 1)}
                    aria-label="Kurangi"
                    disabled={(item.qty ?? 1) <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-val">{item.qty ?? 1}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQty(item.id, (item.qty ?? 1) + 1)}
                    aria-label="Tambah"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Hapus ${item.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>

          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span className="cart-total-val">{formatPrice(total)}</span>
            </div>

            <div className="cart-actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={clearCart}
              >
                <Trash2 size={15} /> Kosongkan
              </button>
              {onContinueShopping && (
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={onContinueShopping}
                >
                  Lanjut Belanja
                </button>
              )}
              <button
                type="button"
                className="btn btn--wa"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                <MessageCircle size={16} />
                {checkingOut ? 'Membuka WA…' : 'Checkout via WhatsApp'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
