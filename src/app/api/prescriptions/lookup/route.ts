import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const orderNumber = url.searchParams.get('orderNumber')?.trim() ?? ''
  const customerEmail = url.searchParams.get('customerEmail')?.trim().toLowerCase() ?? ''

  if (!orderNumber || !customerEmail) {
    return NextResponse.json({ message: 'Order number and email are required.' }, { status: 400 })
  }

  const prisma = getPrisma()
  const prescriptions = await prisma.prescription.findMany({
    where: {
      customerEmail,
      customerOrder: {
        orderNumber,
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      customerOrder: true,
      pharmacyOrder: { include: { pharmacy: true } },
      reviewer: true,
    },
  })

  return NextResponse.json({ prescriptions })
}
