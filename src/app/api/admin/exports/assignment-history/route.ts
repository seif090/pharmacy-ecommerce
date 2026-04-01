import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'
import { toCsv } from '@/lib/csv'

export async function GET() {
  const user = await ensureApiUser(['ADMIN'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const prisma = getPrisma()
  const events = await prisma.assignmentEvent.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customerOrder: true,
      pharmacyOrder: { include: { pharmacy: true } },
    },
  })

  const csv = toCsv(
    [
      'createdAt',
      'customerOrderNumber',
      'customerCity',
      'pharmacyOrderStatus',
      'requestedItemName',
      'requestedRouteKey',
      'selectedProductName',
      'selectedRouteKey',
      'selectedPharmacyName',
      'strategy',
      'reason',
      'score',
      'distanceKm',
    ],
    events.map((event) => [
      event.createdAt.toISOString(),
      event.customerOrder.orderNumber,
      event.customerOrder.city,
      event.pharmacyOrder?.status ?? '',
      event.requestedItemName,
      event.requestedRouteKey,
      event.selectedProductName,
      event.selectedRouteKey,
      event.selectedPharmacyName,
      event.strategy,
      event.reason,
      event.score,
      event.distanceKm ?? '',
    ]),
  )

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="assignment-history.csv"',
    },
  })
}
