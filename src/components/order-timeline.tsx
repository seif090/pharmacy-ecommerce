export function OrderTimeline({
  events,
}: {
  events: Array<{
    label: string
    description: string
    active: boolean
  }>
}) {
  return (
    <ol className="stack">
      {events.map((event) => (
        <li key={event.label} className="cart-row">
          <div>
            <strong>{event.label}</strong>
            <p className="muted">{event.description}</p>
          </div>
          <span className={event.active ? 'badge' : 'badge badge-warn'}>{event.active ? 'Now' : 'Next'}</span>
        </li>
      ))}
    </ol>
  )
}
