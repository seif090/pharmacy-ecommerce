'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: { id: string; name: string; price: number }) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'medora-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    try {
      setItems(JSON.parse(raw) as CartItem[])
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue['addItem'] = (item) => {
      setItems((current) => {
        const existing = current.find((entry) => entry.id === item.id)
        if (existing) {
          return current.map((entry) =>
            entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
          )
        }

        return [...current, { ...item, quantity: 1 }]
      })
    }

    const updateQuantity: CartContextValue['updateQuantity'] = (id, quantity) => {
      setItems((current) =>
        current
          .map((entry) => (entry.id === id ? { ...entry, quantity } : entry))
          .filter((entry) => entry.quantity > 0),
      )
    }

    const removeItem: CartContextValue['removeItem'] = (id) => {
      setItems((current) => current.filter((entry) => entry.id !== id))
    }

    const clearCart = () => setItems([])

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return { items, addItem, updateQuantity, removeItem, clearCart, total }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
