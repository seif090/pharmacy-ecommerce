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
  const prescriptions = await prisma.prescription.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customerOrder: true,
      pharmacyOrder: { include: { pharmacy: true } },
      reviewer: true,
    },
  })

  const csv = toCsv(
    [
      'createdAt',
      'orderNumber',
      'customerName',
      'customerEmail',
      'customerPhone',
      'pharmacy',
      'status',
      'reviewer',
      'reviewedAt',
      'notes',
      'fileName',
    ],
    prescriptions.map((prescription) => [
      prescription.createdAt.toISOString(),
      prescription.customerOrder.orderNumber,
      prescription.customerName,
      prescription.customerEmail,
      prescription.customerPhone,
      prescription.pharmacyOrder?.pharmacy.name ?? '',
      prescription.status,
      prescription.reviewer?.name ?? '',
      prescription.reviewedAt ? prescription.reviewedAt.toISOString() : '',
      prescription.notes ?? '',
      prescription.fileName,
    ]),
  )

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="prescriptions.csv"',
    },
  })
}
