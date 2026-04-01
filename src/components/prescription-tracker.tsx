'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'

type TrackerPrescription = {
  id: string
  status: string
  fileName: string
  mimeType: string
  fileData: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes?: string | null
  createdAt: string | Date
  pharmacyOrder?: { pharmacy: { name: string } | null } | null
  customerOrder: { orderNumber: string }
  reviewer?: { name: string } | null
}

const statuses = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const

export function PrescriptionTracker() {
  const [items, setItems] = useState<TrackerPrescription[]>([])
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('ALL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const orderNumber = String(formData.get('orderNumber') ?? '').trim()
    const customerEmail = String(formData.get('customerEmail') ?? '').trim()

    try {
      const url = new URL('/api/prescriptions/lookup', window.location.origin)
      url.searchParams.set('orderNumber', orderNumber)
      url.searchParams.set('customerEmail', customerEmail)

      const response = await fetch(url.toString())
      const result = (await response.json()) as { prescriptions?: TrackerPrescription[]; message?: string }
      if (!response.ok) {
        throw new Error(result.message ?? 'Could not find prescriptions.')
      }

      setItems(result.prescriptions ?? [])
      setStatusFilter('ALL')
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Could not search prescriptions.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = useMemo(
    () => (statusFilter === 'ALL' ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter],
  )

  function chipClass(active: boolean) {
    return active ? 'button' : 'button button-secondary'
  }

  return (
    <div className="stack">
      <form className="card form-grid" onSubmit={handleSubmit}>
        <div className="section-heading">
          <div>
            <h3>Track prescription status</h3>
            <p className="muted">Search by order number and customer email.</p>
          </div>
        </div>
        {error ? <div className="alert">{error}</div> : null}
        <div className="form-grid-2">
          <label>
            Order number
            <input name="orderNumber" required placeholder="MD-12345678" />
          </label>
          <label>
            Customer email
            <input name="customerEmail" type="email" required placeholder="ahmed@example.com" />
          </label>
        </div>
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Searching...' : 'Search prescriptions'}
        </button>
      </form>

      {items.length ? (
        <div className="stack">
          <div className="card">
            <div className="section-heading">
              <div>
                <h4>Quick filters</h4>
                <p className="muted">Switch prescription status chips instantly.</p>
              </div>
              <button type="button" className="button button-secondary" onClick={() => setStatusFilter('ALL')}>
                Clear filters
              </button>
            </div>
            <div className="hero-actions" style={{ flexWrap: 'wrap' }}>
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={chipClass(statusFilter === status)}
                  aria-pressed={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All statuses' : status}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length ? (
            filteredItems.map((item) => (
              <article className="card" key={item.id}>
                <div className="section-heading">
                  <div>
                    <span className="badge">
                      {item.pharmacyOrder?.pharmacy?.name ?? 'Marketplace'} - {item.status}
                    </span>
                    <h3>{item.customerOrder.orderNumber}</h3>
                  </div>
                  <a
                    className="button button-secondary"
                    href={`data:${item.mimeType};base64,${item.fileData}`}
                    download={item.fileName}
                  >
                    Download file
                  </a>
                </div>
                <p className="muted">
                  {item.customerName} - {item.customerEmail} - {item.customerPhone}
                </p>
                {item.reviewer ? <p className="muted">Reviewed by {item.reviewer.name}</p> : null}
                {item.notes ? <p>{item.notes}</p> : null}
              </article>
            ))
          ) : (
            <div className="empty-state compact">No prescriptions match the selected status.</div>
          )}
        </div>
      ) : (
        <div className="empty-state compact">Search to see prescription status and documents.</div>
      )}
    </div>
  )
}
