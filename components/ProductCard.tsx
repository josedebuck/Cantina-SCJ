"use client"

import { ShoppingCart, Heart } from "lucide-react"

interface ProductCardProps {
  title: string
  price: number
  image: string
}

export default function ProductCard({
  title,
  price,
  image
}: ProductCardProps) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-md overflow-hidden transition hover:shadow-lg">
      
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-72 object-cover"
        />

        <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow active:scale-95 transition">
          <Heart size={18} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h3 className="text-base font-medium">
          {title}
        </h3>

        <p className="text-lg font-bold">
          ${price}
        </p>

        <button className="bg-black text-white py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition">
          <ShoppingCart size={18} />
          Agregar al carrito
        </button>
      </div>
    </div>
  )
}