import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { checkoutSchema } from '@/lib/validators'

function toAmount(value: number) {
  return Math.round(value * 100) / 100
}

export async function GET() {
  const prisma = getPrisma()
  const orders = await prisma.customerOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  return NextResponse.json({ orders })
}

export async function POST(request: Request) {
  const prisma = getPrisma()
  const body = await request.json()
  const parsed = checkoutSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Invalid checkout payload.' },
      { status: 400 },
    )
  }

  const productIds = parsed.data.items.map((item) => item.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  if (products.length !== productIds.length) {
    return NextResponse.json({ message: 'One or more products were not found.' }, { status: 404 })
  }

  const subtotal = parsed.data.items.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId)
    return sum + Number(product?.discountPrice ?? product?.price ?? 0) * item.quantity
  }, 0)

  const shipping = subtotal > 150 ? 0 : 15
  const total = subtotal + shipping
  const orderNumber = `MD-${Date.now().toString().slice(-8)}`

  const order = await prisma.$transaction(async (tx) => {
    for (const item of parsed.data.items) {
      const product = products.find((entry) => entry.id === item.productId)
      if (!product) {
        throw new Error('Product not found during transaction.')
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}.`)
      }
    }

    const createdOrder = await tx.customerOrder.create({
      data: {
        orderNumber,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        phone: parsed.data.phone,
        address: parsed.data.address,
        city: parsed.data.city,
        postalCode: parsed.data.postalCode,
        paymentMethod: parsed.data.paymentMethod,
        subtotal: toAmount(subtotal),
        shipping: toAmount(shipping),
        total: toAmount(total),
        status: 'PENDING',
      },
    })

    for (const item of parsed.data.items) {
      const product = products.find((entry) => entry.id === item.productId)
      const unitPrice = Number(product?.discountPrice ?? product?.price ?? 0)
      await tx.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: item.productId,
          productName: product?.name ?? 'Unknown',
          quantity: item.quantity,
          unitPrice,
          lineTotal: toAmount(unitPrice * item.quantity),
        },
      })

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return createdOrder
  })

  return NextResponse.json({
    orderNumber: order.orderNumber,
    message: 'Order placed successfully.',
  })
}
