import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dbPath = path.resolve('prisma/dev.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA foreign_keys = ON;

  DROP TABLE IF EXISTS "OrderItem";
  DROP TABLE IF EXISTS "CustomerOrder";
  DROP TABLE IF EXISTS "Product";
  DROP TABLE IF EXISTS "Category";

  CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
  CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");

  CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dosage" TEXT,
    "form" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" TEXT NOT NULL,
    "discountPrice" TEXT,
    "imageUrl" TEXT,
    "requiresPrescription" INTEGER NOT NULL DEFAULT 0,
    "featured" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "categoryId" TEXT,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");

  CREATE TABLE IF NOT EXISTS "CustomerOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "subtotal" TEXT NOT NULL,
    "shipping" TEXT NOT NULL,
    "total" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "CustomerOrder_orderNumber_key" ON "CustomerOrder"("orderNumber");

  CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" TEXT NOT NULL,
    "lineTotal" TEXT NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
`)

db.close()
