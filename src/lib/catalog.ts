import 'server-only'

import { getPrisma } from '@/lib/db'

export async function getCategories() {
  const prisma = getPrisma()
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
}

export async function getProducts(options?: {
  search?: string
  category?: string
  featured?: boolean
}) {
  const prisma = getPrisma()
  const search = options?.search?.trim()

  return prisma.product.findMany({
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
      ...(options?.category ? { category: { slug: options.category } } : {}),
      ...(typeof options?.featured === 'boolean' ? { featured: options.featured } : {}),
    },
    include: { category: true },
    orderBy: [
      { featured: 'desc' },
      { stock: 'desc' },
      { createdAt: 'desc' },
    ],
  })
}

export async function getFeaturedProducts() {
  return getProducts({ featured: true })
}

export async function getProductBySlug(slug: string) {
  const prisma = getPrisma()
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  })
}

export async function getDashboardStats() {
  const prisma = getPrisma()
  const [products, categories, orders, revenueAgg, lowStock] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.customerOrder.count(),
    prisma.customerOrder.aggregate({ _sum: { total: true } }),
    prisma.product.count({ where: { stock: { lte: 10 } } }),
  ])

  return {
    products,
    categories,
    orders,
    revenue: Number(revenueAgg._sum.total ?? 0),
    lowStock,
  }
}

export async function getRecentOrders() {
  const prisma = getPrisma()
  return prisma.customerOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { items: true },
  })
}
