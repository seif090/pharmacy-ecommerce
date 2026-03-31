import Link from 'next/link'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams

  return (
    <section className="section">
      <div className="empty-state">
        <span className="badge">Order placed</span>
        <h1>Thanks, your order is confirmed.</h1>
        <p className="muted">Order number: {order || 'N/A'}</p>
        <div className="hero-actions">
          <Link href="/products" className="button">
            Continue shopping
          </Link>
          <Link href="/admin" className="button button-secondary">
            Review admin dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}
