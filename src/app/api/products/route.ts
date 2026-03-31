import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { productSchema } from '@/lib/validators'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const prisma = getPrisma()
  const search = searchParams.get('search')?.trim()
  const category = searchParams.get('category')?.trim()

  const products = await prisma.product.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
              { tags: { contains: search } },
            ],
          }
        : {}),
      ...(category ? { category: { slug: category } } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  const prisma = getPrisma()
  const body = await request.json()
  const parsed = productSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Invalid product payload.' },
      { status: 400 },
    )
  }

  const category = await prisma.category.findUnique({
    where: { slug: parsed.data.categorySlug },
  })

  if (!category) {
    return NextResponse.json({ message: 'Category not found.' }, { status: 404 })
  }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description,
      dosage: parsed.data.dosage,
      form: parsed.data.form,
      stock: parsed.data.stock,
      price: parsed.data.price,
      discountPrice: parsed.data.discountPrice,
      categoryId: category.id,
      imageUrl: parsed.data.imageUrl,
      requiresPrescription: parsed.data.requiresPrescription,
      featured: parsed.data.featured,
      tags: parsed.data.tags,
    },
  })

  return NextResponse.json({ product }, { status: 201 })
}
