import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = [
    { name: 'Pain Relief', slug: 'pain-relief' },
    { name: 'Vitamins', slug: 'vitamins' },
    { name: 'Cold & Flu', slug: 'cold-flu' },
    { name: 'Personal Care', slug: 'personal-care' },
    { name: 'First Aid', slug: 'first-aid' },
    { name: 'Devices', slug: 'devices' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    })
  }

  const lookup = Object.fromEntries(
    (await prisma.category.findMany()).map((category) => [category.slug, category.id]),
  )

  const products = [
    {
      name: 'Paracetamol 500mg',
      slug: 'paracetamol-500mg',
      description: 'Fast relief for fever and mild pain.',
      dosage: '500mg',
      form: 'Tablets',
      stock: 120,
      price: 42,
      discountPrice: 36,
      featured: true,
      tags: 'pain,fever,headache',
      categorySlug: 'pain-relief',
    },
    {
      name: 'Vitamin C 1000mg',
      slug: 'vitamin-c-1000mg',
      description: 'Daily immune support with a high-potency formula.',
      dosage: '1000mg',
      form: 'Effervescent tablets',
      stock: 78,
      price: 95,
      featured: true,
      tags: 'vitamins,immunity',
      categorySlug: 'vitamins',
    },
    {
      name: 'Nasal Decongestant Spray',
      slug: 'nasal-decongestant-spray',
      description: 'Relieves blocked nose and sinus pressure.',
      form: 'Spray',
      stock: 54,
      price: 68,
      tags: 'cold,flu,nasal',
      categorySlug: 'cold-flu',
    },
    {
      name: 'Hydrocortisone Cream',
      slug: 'hydrocortisone-cream',
      description: 'Soothes irritation, itching, and minor rashes.',
      form: 'Cream',
      stock: 40,
      price: 79,
      requiresPrescription: true,
      tags: 'skin,rash,itching',
      categorySlug: 'personal-care',
    },
    {
      name: 'Antiseptic Wipes',
      slug: 'antiseptic-wipes',
      description: 'Portable sterile wipes for first response cleaning.',
      form: 'Wipes',
      stock: 160,
      price: 28,
      featured: true,
      tags: 'first-aid,cleaning',
      categorySlug: 'first-aid',
    },
    {
      name: 'Digital Thermometer',
      slug: 'digital-thermometer',
      description: 'Quick temperature checks with a clear display.',
      form: 'Device',
      stock: 33,
      price: 145,
      featured: true,
      tags: 'devices,temperature',
      categorySlug: 'devices',
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        dosage: product.dosage,
        form: product.form,
        stock: product.stock,
        price: product.price,
        discountPrice: product.discountPrice ?? null,
        featured: product.featured ?? false,
        requiresPrescription: product.requiresPrescription ?? false,
        tags: product.tags,
        categoryId: lookup[product.categorySlug],
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        dosage: product.dosage,
        form: product.form,
        stock: product.stock,
        price: product.price,
        discountPrice: product.discountPrice ?? null,
        featured: product.featured ?? false,
        requiresPrescription: product.requiresPrescription ?? false,
        tags: product.tags,
        categoryId: lookup[product.categorySlug],
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
