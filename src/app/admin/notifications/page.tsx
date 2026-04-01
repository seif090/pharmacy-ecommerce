import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getAdminNotifications } from '@/lib/catalog'

export default async function AdminNotificationsPage() {
  await requireUser(['ADMIN'])
  const notifications = await getAdminNotifications()

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Notifications</span>
          <h1>Admin notifications</h1>
          <p className="muted">Track pending pharmacy onboarding and marketplace alerts.</p>
        </div>
        <Link href="/admin" className="button button-secondary">
          Back to dashboard
        </Link>
      </div>

      {notifications.length ? (
        <div className="stack">
          {notifications.map((notification) => (
            <article key={notification.id} className="card">
              <div className="section-heading">
                <div>
                  <span className="badge">{notification.type.replaceAll('_', ' ')}</span>
                  <h3>{notification.title}</h3>
                </div>
                <span className="badge">{notification.readAt ? 'Read' : 'Unread'}</span>
              </div>
              <p className="muted">{notification.message}</p>
              {notification.pharmacy ? (
                <p className="muted">
                  <strong>{notification.pharmacy.name}</strong>
                  <br />
                  {notification.pharmacy.city}
                </p>
              ) : null}
              <p className="muted">Created {notification.createdAt.toLocaleString()}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No notifications yet</h2>
          <p className="muted">New pharmacy onboarding requests will appear here automatically.</p>
        </div>
      )}
    </section>
  )
}
