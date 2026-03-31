import { formatCurrency } from '@/lib/utils'

export function OrdersTable({
  orders,
}: {
  orders: Array<{
    id: string
    orderNumber: string
    customerName: string
    status: string
    total: unknown
    paymentMethod: string
    createdAt: Date
    items: Array<{ productName: string; quantity: number }>
  }>
}) {
  if (!orders.length) {
    return <div className="empty-state compact">No orders yet.</div>
  }

  return (
    <div className="card">
      <div className="section-heading">
        <h3>Recent orders</h3>
        <p className="muted">Latest customer checkouts from the database.</p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                  <div className="muted">{order.paymentMethod}</div>
                </td>
                <td>{order.customerName}</td>
                <td>
                  <span className="badge">{order.status}</span>
                </td>
                <td>{formatCurrency(Number(order.total))}</td>
                <td>{order.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
