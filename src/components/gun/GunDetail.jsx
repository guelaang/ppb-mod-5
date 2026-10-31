import { useState } from 'react'
import { ArrowLeft, Star, Send, Loader, Share2, Check, ShoppingCart, ThumbsUp, ThumbsDown, Edit, Trash2 } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import reviewService from '../../services/reviewService'
import { useCart } from '../../hooks/useCart'
import { formatPrice, averageRating } from '../../utils/helpers'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onDelete]— trigger delete flow
 * @param {Function} [props.onArchive] — soft delete/archive
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete, onArchive }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Share
  const [shared, setShared] = useState(false)
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}?gun=${gun.id || encodeURIComponent(gun.name)}`
    try {
      if (navigator.share) {
        await navigator.share({ title: gun.name, text: gun.description || '', url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setShared(true)
        setTimeout(() => setShared(false), 2500)
      }
    } catch {
      await navigator.clipboard.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 2500)
    }
  }

  // Cart
  const { addToCart } = useCart()
  const [addedToCart, setAddedToCart] = useState(false)
  const handleAddToCart = () => {
    addToCart(gun)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Review edit state
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Thumbs (stored locally per review)
  const [thumbs, setThumbs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bore_barrel_thumbs') || '{}') } catch { return {} }
  })

  const handleThumb = (reviewId, dir) => {
    const key = `${reviewId}_${dir}`
    const opposite = `${reviewId}_${dir === 'up' ? 'down' : 'up'}`
    const updated = { ...thumbs }
    if (updated[key]) {
      delete updated[key] // toggle off
    } else {
      delete updated[opposite]
      updated[key] = true
    }
    setThumbs(updated)
    localStorage.setItem('bore_barrel_thumbs', JSON.stringify(updated))
  }

  const getThumbCount = (reviewId, dir) =>
    Object.keys(thumbs).filter((k) => k === `${reviewId}_${dir}`).length

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')
    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }
    const result = await createReview(gun.id, {
      user_identifier: getUserIdentifier(),
      rating,
      comment: comment.trim(),
    })
    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.id)
    setEditRating(rev.rating)
    setEditComment(rev.comment || '')
  }

  const handleSaveEdit = async (reviewId) => {
    try {
      setEditLoading(true)
      await reviewService.updateReview(reviewId, { rating: editRating, comment: editComment })
      setEditingReviewId(null)
      refetchReviews()
    } catch {
      // silent — server may be down
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId)
      refetchReviews()
    } catch {
      // silent
    }
  }

  const myId = getUserIdentifier()

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} loading="lazy" />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />

            {/* Add to Cart */}
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleAddToCart}
            >
              {addedToCart ? <><Check size={15} /> Ditambahkan!</> : <><ShoppingCart size={15} /> Tambah ke Keranjang</>}
            </button>

            {/* Share */}
            <button type="button" className="btn btn--outline btn--sm" onClick={handleShare}>
              {shared ? <><Check size={15} /> Link Disalin!</> : <><Share2 size={15} /> Bagikan</>}
            </button>

            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Delete
              </button>
            )}
            {onArchive && (
              <button type="button" className="btn btn--outline" onClick={() => onArchive(gun)}>
                Arsip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>{step.instruction || step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <li key={rev.id} className="review-item">
                {editingReviewId === rev.id ? (
                  /* Edit mode */
                  <div className="review-edit-form">
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="star-btn"
                          onClick={() => setEditRating(n)}
                        >
                          <Star
                            size={18}
                            fill={n <= editRating ? 'var(--brass)' : 'none'}
                            stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="review-input"
                      rows={2}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      maxLength={500}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => handleSaveEdit(rev.id)}
                        disabled={editLoading}
                      >
                        {editLoading ? 'Menyimpan…' : 'Simpan'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() => setEditingReviewId(null)}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="review-head">
                      <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                      <span className="review-stars-display">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < rev.rating ? 'var(--brass)' : 'none'}
                            stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                          />
                        ))}
                      </span>
                    </div>
                    {rev.comment && <p className="review-comment">{rev.comment}</p>}

                    {/* Thumbs up / down */}
                    <div className="review-thumbs">
                      <button
                        type="button"
                        className={`thumb-btn ${thumbs[`${rev.id}_up`] ? 'active' : ''}`}
                        onClick={() => handleThumb(rev.id, 'up')}
                        title="Helpful"
                      >
                        <ThumbsUp size={14} />
                        <span>{getThumbCount(rev.id, 'up')}</span>
                      </button>
                      <button
                        type="button"
                        className={`thumb-btn ${thumbs[`${rev.id}_down`] ? 'active' : ''}`}
                        onClick={() => handleThumb(rev.id, 'down')}
                        title="Not helpful"
                      >
                        <ThumbsDown size={14} />
                        <span>{getThumbCount(rev.id, 'down')}</span>
                      </button>

                      {/* Edit/Delete — show only for own reviews (matched by user_identifier) */}
                      {(rev.user_identifier === myId || rev.user_id === myId) && (
                        <>
                          <button
                            type="button"
                            className="thumb-btn"
                            onClick={() => handleStartEdit(rev)}
                            title="Edit review"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            className="thumb-btn thumb-btn--danger"
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Delete review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
