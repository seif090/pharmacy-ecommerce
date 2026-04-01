import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await ensureApiUser(['ADMIN'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const prisma = getPrisma()
  const body = (await request.json()) as {
    status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
    rating?: number
    commissionRate?: number
  }

  const pharmacy = await prisma.pharmacy.findUnique({ where: { id } })
  if (!pharmacy) {
    return NextResponse.json({ message: 'Pharmacy not found.' }, { status: 404 })
  }

  const updated = await prisma.pharmacy.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(typeof body.rating === 'number' ? { rating: body.rating } : {}),
      ...(typeof body.commissionRate === 'number' ? { commissionRate: body.commissionRate } : {}),
    },
  })

  return NextResponse.json({ pharmacy: updated })
}
