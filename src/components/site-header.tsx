import Link from 'next/link'
import { LayoutDashboard, Pill, ShoppingBag } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Pill size={18} />
          </span>
          <span>
            <strong>Medora</strong>
            <small>Pharmacy Commerce</small>
          </span>
        </Link>
        <nav className="nav">
          <Link href="/products">Products</Link>
          <Link href="/cart">
            <ShoppingBag size={16} />
            Cart
          </Link>
          <Link href="/admin">
            <LayoutDashboard size={16} />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
