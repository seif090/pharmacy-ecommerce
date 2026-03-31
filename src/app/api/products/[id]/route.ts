import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const prisma = getPrisma()
  const body = (await request.json()) as Partial<{
    stock: number
    featured: boolean
    requiresPrescription: boolean
  }>

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(typeof body.stock === 'number' ? { stock: body.stock } : {}),
      ...(typeof body.featured === 'boolean' ? { featured: body.featured } : {}),
      ...(typeof body.requiresPrescription === 'boolean'
        ? { requiresPrescription: body.requiresPrescription }
        : {}),
    },
  })

  return NextResponse.json({ product })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const prisma = getPrisma()
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
