import 'server-only'

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export function getPrisma() {
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient()
  }

  return globalThis.prisma
}
