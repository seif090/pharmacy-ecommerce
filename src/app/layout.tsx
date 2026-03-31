import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CartProvider } from '@/components/cart-provider'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Medora Pharmacy Commerce',
  description: 'A full-stack pharmacy ecommerce system built with Next.js and Prisma.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <div className="shell">
            <SiteHeader />
            <main className="main">
              <div className="container">{children}</div>
            </main>
            <SiteFooter />
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
