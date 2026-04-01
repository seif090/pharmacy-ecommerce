import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { estimateSlaMinutes, haversineKm } from '@/lib/geo'

function toAmount(value: number) {
  return Math.round(value * 100) / 100
}

function jsonResponse(message: string, status = 400) {
  return NextResponse.json({ message }, { status })
}

function normalizeTerms(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function overlapCount(left: Set<string>, right: Set<string>) {
  let count = 0
  for (const term of left) {
    if (right.has(term)) {
      count += 1
    }
  }
  return count
}

function buildCandidateSet(values: Array<string | null | undefined>) {
  return new Set(values.flatMap((value) => normalizeTerms(value ?? '')))
}

function scoreProductCandidate({
  product,
  item,
  destinationCity,
  deliveryLatitude,
  deliveryLongitude,
}: {
  product: {
    id: string
    name: string
    routeKey: string
    scientificName: string | null
    manufacturer: string | null
    category: { name: string | null } | null
    tags: string | null
    dosage: string | null
    form: string | null
    city?: string | null
    stock: number
    pharmacyId: string
    pharmacy: {
      city?: string | null
      rating: number
      latitude: number | null
      longitude: number | null
    }
  }
  item: {
    id: string
    name: string
    routeKey: string
    pharmacyId: string
    quantity: number
  }
  destinationCity: string
  deliveryLatitude: number | null
  deliveryLongitude: number | null
}) {
  const itemTerms = buildCandidateSet([item.routeKey, item.name])
  const routeTerms = buildCandidateSet([product.routeKey])
  const nameTerms = buildCandidateSet([product.name])
  const scientificTerms = buildCandidateSet([product.scientificName])
  const manufacturerTerms = buildCandidateSet([product.manufacturer])
  const categoryTerms = buildCandidateSet([product.category?.name])
  const tagTerms = buildCandidateSet([product.tags])
  const dosageTerms = buildCandidateSet([product.dosage])
  const formTerms = buildCandidateSet([product.form])

  const exactRouteKey = product.routeKey.trim().toLowerCase() === item.routeKey.trim().toLowerCase()
  const exactName = product.name.trim().toLowerCase() === item.name.trim().toLowerCase()
  const routeOverlap = overlapCount(itemTerms, routeTerms)
  const nameOverlap = overlapCount(itemTerms, nameTerms)
  const scientificOverlap = overlapCount(itemTerms, scientificTerms)
  const manufacturerOverlap = overlapCount(itemTerms, manufacturerTerms)
  const categoryOverlap = overlapCount(itemTerms, categoryTerms)
  const tagOverlap = overlapCount(itemTerms, tagTerms)
  const dosageOverlap = overlapCount(itemTerms, dosageTerms)
  const formOverlap = overlapCount(itemTerms, formTerms)

  let score = 0
  const reasons: string[] = []

  if (exactRouteKey) {
    score += 5000
    reasons.push('exact route key')
  }
  if (exactName) {
    score += 1200
    reasons.push('exact product name')
  }
  if (routeOverlap > 0) {
    score += routeOverlap * 300
    reasons.push(`${routeOverlap} route term match${routeOverlap > 1 ? 'es' : ''}`)
  }
  if (nameOverlap > 0) {
    score += nameOverlap * 220
    reasons.push(`${nameOverlap} product name term match${nameOverlap > 1 ? 'es' : ''}`)
  }
  if (scientificOverlap > 0) {
    score += scientificOverlap * 260
    reasons.push(`${scientificOverlap} scientific name term match${scientificOverlap > 1 ? 'es' : ''}`)
  }
  if (manufacturerOverlap > 0) {
    score += manufacturerOverlap * 180
    reasons.push(`${manufacturerOverlap} manufacturer term match${manufacturerOverlap > 1 ? 'es' : ''}`)
  }
  if (categoryOverlap > 0) {
    score += categoryOverlap * 200
    reasons.push(`${categoryOverlap} category term match${categoryOverlap > 1 ? 'es' : ''}`)
  }
  if (tagOverlap > 0) {
    score += tagOverlap * 150
    reasons.push(`${tagOverlap} tag match${tagOverlap > 1 ? 'es' : ''}`)
  }
  if (dosageOverlap > 0) {
    score += dosageOverlap * 120
    reasons.push(`${dosageOverlap} dosage term match${dosageOverlap > 1 ? 'es' : ''}`)
  }
  if (formOverlap > 0) {
    score += formOverlap * 90
    reasons.push(`${formOverlap} form term match${formOverlap > 1 ? 'es' : ''}`)
  }

  if (
    destinationCity &&
    product.pharmacy.city &&
    product.pharmacy.city.trim().toLowerCase() === destinationCity.trim().toLowerCase()
  ) {
    score += 40
    reasons.push('same destination city')
  }

  score += product.pharmacy.rating * 12
  score += Math.min(product.stock, 100) * 0.5
  if (product.pharmacyId === item.pharmacyId) {
    score += 60
    reasons.push('same source pharmacy')
  }

  let distanceKm: number | null = null
  if (
    deliveryLatitude != null &&
    deliveryLongitude != null &&
    product.pharmacy.latitude != null &&
    product.pharmacy.longitude != null
  ) {
    distanceKm = haversineKm(
      deliveryLatitude,
      deliveryLongitude,
      product.pharmacy.latitude,
      product.pharmacy.longitude,
    )
    score -= distanceKm * 15
    reasons.push(`${distanceKm.toFixed(1)} km away`)
  }

  const strategy = exactRouteKey
    ? 'exact-route-match'
    : scientificOverlap > 0 || categoryOverlap > 0 || manufacturerOverlap > 0 || nameOverlap > 0
      ? 'semantic-substitute'
      : routeOverlap > 0
        ? 'route-key-substitute'
        : 'nearest-fallback'

  return {
    score,
    strategy,
    reason: reasons.length ? reasons.join(', ') : 'nearest active pharmacy fallback',
    distanceKm,
  }
}

export async function GET() {
  const prisma = getPrisma()
  const orders = await prisma.customerOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      pharmacyOrders: {
        include: {
          pharmacy: true,
          items: { include: { product: true } },
          prescription: true,
        },
      },
    },
  })

  return NextResponse.json({ orders })
}

export async function POST(request: Request) {
  const prisma = getPrisma()
  const contentType = request.headers.get('content-type') ?? ''

  let customerName = ''
  let customerEmail = ''
  let phone = ''
  let address = ''
  let city = ''
  let postalCode = ''
  let deliveryLatitude: number | null = null
  let deliveryLongitude: number | null = null
  let paymentMethod = 'cash-on-delivery'
  let items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    routeKey: string
    pharmacyId: string
    pharmacyName: string
    requiresPrescription: boolean
  }> = []
  let prescriptionFile: File | null = null
  let prescriptionNotes = ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    customerName = String(formData.get('customerName') ?? '')
    customerEmail = String(formData.get('customerEmail') ?? '')
    phone = String(formData.get('phone') ?? '')
    address = String(formData.get('address') ?? '')
    city = String(formData.get('city') ?? '')
    postalCode = String(formData.get('postalCode') ?? '')
    deliveryLatitude = Number(formData.get('deliveryLatitude') ?? '') || null
    deliveryLongitude = Number(formData.get('deliveryLongitude') ?? '') || null
    paymentMethod = String(formData.get('paymentMethod') ?? 'cash-on-delivery')
    prescriptionNotes = String(formData.get('prescriptionNotes') ?? '')
    const rawFile = formData.get('prescriptionFile') as File | null
    prescriptionFile = rawFile && rawFile.size > 0 ? rawFile : null

    try {
      items = JSON.parse(String(formData.get('items') ?? '[]')) as typeof items
    } catch {
      return jsonResponse('Invalid cart payload.')
    }
  } else {
    const body = await request.json()
    customerName = String(body.customerName ?? '')
    customerEmail = String(body.customerEmail ?? '')
    phone = String(body.phone ?? '')
    address = String(body.address ?? '')
    city = String(body.city ?? '')
    postalCode = String(body.postalCode ?? '')
    deliveryLatitude = typeof body.deliveryLatitude === 'number' ? body.deliveryLatitude : null
    deliveryLongitude = typeof body.deliveryLongitude === 'number' ? body.deliveryLongitude : null
    paymentMethod = String(body.paymentMethod ?? 'cash-on-delivery')
    items = Array.isArray(body.items) ? body.items : []
  }

  if (!customerName || !customerEmail || !phone || !address || !city || !postalCode) {
    return jsonResponse('Missing customer information.')
  }

  if (!items.length) {
    return jsonResponse('Cart is empty.')
  }

  const products = await prisma.product.findMany({
    where: {
      active: true,
      pharmacy: { status: 'ACTIVE' },
    },
    include: { pharmacy: true, category: true },
  })

  if (!products.length) {
    return jsonResponse('No active pharmacies are available right now.', 404)
  }

  const requiresPrescription = items.some((item) => item.requiresPrescription)
  if (requiresPrescription && !prescriptionFile) {
    return jsonResponse('A prescription file is required for this cart.')
  }

  const order = await prisma.$transaction(async (tx) => {
    const activeProducts = await tx.product.findMany({
      where: {
        active: true,
        pharmacy: { status: 'ACTIVE' },
      },
      include: { pharmacy: true, category: true },
    })

    const selectedItems = items.map((item) => {
      const eligible = activeProducts.filter((product) => product.stock >= item.quantity)

      if (!eligible.length) {
        throw new Error(`No pharmacy has enough stock for ${item.name}.`)
      }

      const scored = eligible
        .map((product) => ({
          product,
          ...scoreProductCandidate({
            product,
            item,
            destinationCity: city,
            deliveryLatitude,
            deliveryLongitude,
          }),
        }))
        .sort((a, b) => b.score - a.score)

      const bestMatch = scored[0]

      if (!bestMatch) {
        throw new Error(`No pharmacy has enough stock for ${item.name}.`)
      }

      return { item, product: bestMatch.product, strategy: bestMatch.strategy, reason: bestMatch.reason, score: bestMatch.score, distanceKm: bestMatch.distanceKm }
    })

    const subtotal = selectedItems.reduce((sum, entry) => {
      return sum + Number(entry.product.discountPrice ?? entry.product.price ?? 0) * entry.item.quantity
    }, 0)
    const shipping = subtotal > 150 ? 0 : 15
    const total = subtotal + shipping
    const orderNumber = `MD-${Date.now().toString().slice(-8)}`

    const createdOrder = await tx.customerOrder.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        phone,
        address,
        city,
        deliveryLatitude,
        deliveryLongitude,
        postalCode,
        paymentMethod,
        subtotal: toAmount(subtotal),
        shipping: toAmount(shipping),
        total: toAmount(total),
        status: 'PENDING',
      },
    })

    const grouped = new Map<string, typeof selectedItems>()
    for (const selected of selectedItems) {
      const current = grouped.get(selected.product.pharmacyId) ?? []
      grouped.set(selected.product.pharmacyId, [...current, selected])
    }

    for (const [pharmacyId, groupedItems] of grouped.entries()) {
      const pharmacy = groupedItems[0]?.product.pharmacy
      if (!pharmacy) {
        throw new Error('Pharmacy not found for order routing.')
      }

      const pharmacySubtotal = groupedItems.reduce((sum, item) => {
        return sum + Number(item.product.discountPrice ?? item.product.price ?? 0) * item.item.quantity
      }, 0)

      const commissionAmount = pharmacySubtotal * pharmacy.commissionRate
      const distanceKm =
        deliveryLatitude != null &&
        deliveryLongitude != null &&
        pharmacy.latitude != null &&
        pharmacy.longitude != null
          ? haversineKm(deliveryLatitude, deliveryLongitude, pharmacy.latitude, pharmacy.longitude)
          : null

      const pharmacyOrder = await tx.pharmacyOrder.create({
        data: {
          customerOrderId: createdOrder.id,
          pharmacyId,
          status: 'PENDING',
          subtotal: toAmount(pharmacySubtotal),
          shipping: 0,
          total: toAmount(pharmacySubtotal),
          commissionAmount: toAmount(commissionAmount),
          estimatedSlaMins: distanceKm != null ? estimateSlaMinutes(distanceKm) : 30,
        },
      })

      for (const item of groupedItems) {
        const unitPrice = Number(item.product.discountPrice ?? item.product.price ?? 0)

        await tx.orderItem.create({
          data: {
            pharmacyOrderId: pharmacyOrder.id,
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.item.quantity,
            unitPrice,
            lineTotal: toAmount(unitPrice * item.item.quantity),
          },
        })

        await tx.assignmentEvent.create({
          data: {
            customerOrderId: createdOrder.id,
            pharmacyOrderId: pharmacyOrder.id,
            requestedItemName: item.item.name,
            requestedRouteKey: item.item.routeKey,
            requestedPharmacyName: item.item.pharmacyName || null,
            selectedProductName: item.product.name,
            selectedRouteKey: item.product.routeKey,
            selectedPharmacyName: item.product.pharmacy.name,
            strategy: item.strategy,
            reason: item.reason,
            score: item.score,
            distanceKm: item.distanceKm,
          },
        })

        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.item.quantity } },
        })
      }

      const needsRxForThisPharmacy = groupedItems.some((item) => item.item.requiresPrescription)
      if (needsRxForThisPharmacy && prescriptionFile) {
        const buffer = Buffer.from(await prescriptionFile.arrayBuffer())
        await tx.prescription.create({
          data: {
            customerOrderId: createdOrder.id,
            pharmacyOrderId: pharmacyOrder.id,
            status: 'PENDING',
            fileName: prescriptionFile.name,
            mimeType: prescriptionFile.type || 'application/octet-stream',
            fileData: buffer.toString('base64'),
            customerName,
            customerEmail,
            customerPhone: phone,
            notes: prescriptionNotes || null,
          },
        })
      }
    }

    return createdOrder
  })

  return NextResponse.json({
    orderNumber: order.orderNumber,
    message: 'Order placed successfully.',
  })
}
