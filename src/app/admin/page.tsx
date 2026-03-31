import { getCategories, getDashboardStats, getProducts, getRecentOrders } from '@/lib/catalog'
import { formatCurrency } from '@/lib/utils'
import { NewProductForm } from '@/components/new-product-form'
import { OrdersTable } from '@/components/orders-table'

export default async function AdminPage() {
  const [stats, products, orders, categories] = await Promise.all([
    getDashboardStats(),
    getProducts(),
    getRecentOrders(),
    getCategories(),
  ])

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Admin</span>
          <h1>Store dashboard</h1>
          <p className="muted">Track inventory, sales, and recent orders from one place.</p>
        </div>
      </div>

      <div className="grid-products" style={{ marginBottom: 18 }}>
        <article className="card">
          <span className="badge">Products</span>
          <h2>{stats.products}</h2>
          <p className="muted">Total products in catalog</p>
        </article>
        <article className="card">
          <span className="badge">Orders</span>
          <h2>{stats.orders}</h2>
          <p className="muted">Created customer orders</p>
        </article>
        <article className="card">
          <span className="badge">Revenue</span>
          <h2>{formatCurrency(stats.revenue)}</h2>
          <p className="muted">Aggregated order revenue</p>
        </article>
        <article className="card">
          <span className="badge">Low stock</span>
          <h2>{stats.lowStock}</h2>
          <p className="muted">Products with 10 items or fewer</p>
        </article>
      </div>

      <div className="two-col">
        <NewProductForm categories={categories} />
        <div className="card">
          <div className="section-heading">
            <h3>Catalog preview</h3>
            <p className="muted">Read-only list of seeded products.</p>
          </div>
          <div className="stack">
            {products.map((product) => (
              <article key={product.id} className="cart-row">
                <div>
                  <strong>{product.name}</strong>
                  <p className="muted">
                    {product.category?.name ?? 'General'} · Stock {product.stock}
                  </p>
                </div>
                <span className="badge">{formatCurrency(Number(product.discountPrice ?? product.price))}</span>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <OrdersTable orders={orders} />
      </div>
    </section>
  )
}
