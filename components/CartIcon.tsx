"use client"

import { ShoppingCart } from "lucide-react"

export default function CartIcon() {
  const cartCount = 2 // visual por ahora

  return (
    <div className="relative">
      <ShoppingCart size={24} />

      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {cartCount}
        </span>
      )}
    </div>
  )
}