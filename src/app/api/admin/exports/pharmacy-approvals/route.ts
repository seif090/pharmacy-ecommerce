import { NextResponse } from 'next/server'
import { PharmacyStatus, Prisma } from '@prisma/client'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'
import { toCsv } from '@/lib/csv'

export async function GET(request: Request) {
  const user = await ensureApiUser(['ADMIN'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('approvalStatus')?.trim() ?? 'all'
  const scope = url.searchParams.get('scope') === 'current' ? 'current' : 'all'
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
  const pageSize = Math.max(1, Math.min(Number(url.searchParams.get('pageSize') ?? '8') || 8, 24))

  const prisma = getPrisma()
  const where: Prisma.PharmacyWhereInput =
    status && status !== 'all' ? { status: status as PharmacyStatus } : {}

  const pharmacies = await prisma.pharmacy.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    ...(scope === 'current'
      ? {
          skip: (page - 1) * pageSize,
          take: pageSize,
        }
      : {}),
    include: {
      _count: { select: { products: true, pharmacyOrders: true } },
      users: { select: { name: true, email: true } },
    },
  })

  const csv = toCsv(
    [
      'createdAt',
      'name',
      'city',
      'licenseNumber',
      'status',
      'products',
      'orders',
      'commissionRate',
      'rating',
      'managers',
    ],
    pharmacies.map((pharmacy) => [
      pharmacy.createdAt.toISOString(),
      pharmacy.name,
      pharmacy.city,
      pharmacy.licenseNumber,
      pharmacy.status,
      pharmacy._count.products,
      pharmacy._count.pharmacyOrders,
      pharmacy.commissionRate,
      pharmacy.rating,
      pharmacy.users.map((user) => `${user.name} <${user.email}>`).join(' | '),
    ]),
  )

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="pharmacy-approvals-${scope}.csv"`,
    },
  })
}
