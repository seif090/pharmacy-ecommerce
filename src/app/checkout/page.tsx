import { CheckoutForm } from '@/components/checkout-form'

export default function CheckoutPage() {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Checkout</span>
          <h1>Complete your order</h1>
          <p className="muted">Place an order and let the backend create items and update inventory.</p>
        </div>
      </div>
      <CheckoutForm />
    </section>
  )
}
