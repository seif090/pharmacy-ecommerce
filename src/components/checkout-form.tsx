'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/cart-provider'

export function CheckoutForm() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const payload = {
      customerName: String(formData.get('customerName') ?? ''),
      customerEmail: String(formData.get('customerEmail') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      address: String(formData.get('address') ?? ''),
      city: String(formData.get('city') ?? ''),
      postalCode: String(formData.get('postalCode') ?? ''),
      paymentMethod: String(formData.get('paymentMethod') ?? 'cash-on-delivery'),
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as { message?: string; orderNumber?: string }
      if (!response.ok) {
        throw new Error(result.message ?? 'Could not place order.')
      }

      clearCart()
      router.push(`/checkout/success?order=${encodeURIComponent(result.orderNumber ?? '')}`)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form-grid card" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>Delivery information</h2>
        <p className="muted">{items.length} item(s) ready for checkout</p>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="form-grid-2">
        <label>
          Full name
          <input name="customerName" required minLength={2} placeholder="Ahmed Hassan" />
        </label>
        <label>
          Email
          <input name="customerEmail" type="email" required placeholder="ahmed@example.com" />
        </label>
      </div>
      <div className="form-grid-2">
        <label>
          Phone
          <input name="phone" required placeholder="+20 10 1234 5678" />
        </label>
        <label>
          Payment method
          <select name="paymentMethod" defaultValue="cash-on-delivery">
            <option value="cash-on-delivery">Cash on delivery</option>
            <option value="card">Card</option>
          </select>
        </label>
      </div>
      <label>
        Address
        <input name="address" required placeholder="12 Ahmed Orabi St." />
      </label>
      <div className="form-grid-2">
        <label>
          City
          <input name="city" required placeholder="Cairo" />
        </label>
        <label>
          Postal code
          <input name="postalCode" required placeholder="11511" />
        </label>
      </div>
      <button type="submit" className="button button-block" disabled={loading || items.length === 0}>
        {loading ? 'Placing order...' : 'Place order'}
      </button>
      <p className="muted">
        Total before shipping: {total.toFixed(2)} USD. Orders above 150 USD get free shipping.
      </p>
    </form>
  )
}
