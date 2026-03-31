import { CartClient } from '@/components/cart-client'

export default function CartPage() {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Cart</span>
          <h1>Your shopping cart</h1>
          <p className="muted">Review quantities before checkout.</p>
        </div>
      </div>
      <CartClient />
    </section>
  )
}
