import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'

export async function PATCH() {
  const user = await ensureApiUser(['ADMIN'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const prisma = getPrisma()
  const result = await prisma.adminNotification.updateMany({
    where: { readAt: null },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ updated: result.count })
}
