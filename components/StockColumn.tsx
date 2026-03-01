"use client";

import { useState } from "react";
import { Product } from "@/types/Product";

type Props = {
  title: string;
  location: "downstairs" | "upstairs";
  products: Product[];
  onUpdate: (
    id: string,
    location: "downstairs" | "upstairs",
    amount: number,
    type: "update" | "transfer"
  ) => void;
};

export default function StockColumn({
  title,
  location,
  products,
  onUpdate,
}: Props) {
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const getAmount = (id: string) => amounts[id] ?? 1;

  const setAmount = (id: string, value: number) => {
    if (value < 1) return;
    setAmounts((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800">
      <h2 className="text-2xl font-semibold mb-6 text-center text-white">
        {title}
      </h2>

      <div className="space-y-4">
        {products.map((product) => {
          const stock =
            location === "downstairs"
              ? product.stock_downstairs
              : product.stock_upstairs;

          const stockColor =
            stock === 0
              ? "text-red-500"
              : stock < 5
              ? "text-yellow-400"
              : "text-green-400";

          const amount = getAmount(product.id);

          return (
            <div
              key={product.id}
              className="bg-gray-800 p-4 rounded-xl border border-gray-700"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                {/* Imagen opcional */}
                {product.image_url && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
<img
  src={product.image_url || "/no-image.png"}
  alt={product.name}
  className="w-full h-32 object-cover rounded-lg mb-3"
/>
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white">
                    {product.name}
                  </h3>
                  <span className={`text-xl font-bold ${stockColor}`}>
                    {stock}
                  </span>
                </div>
              </div>

              {/* Controles */}
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) =>
                    setAmount(product.id, Number(e.target.value))
                  }
                  className="w-20 bg-gray-700 text-white px-3 py-1 rounded-lg"
                />

                <button
                  onClick={() =>
                    onUpdate(product.id, location, amount, "update")
                  }
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-white"
                >
                  +
                </button>

                <button
                  disabled={stock === 0}
                  onClick={() =>
                    onUpdate(product.id, location, -amount, "update")
                  }
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-white disabled:opacity-50"
                >
                  -
                </button>

                <button
                  onClick={() =>
                    onUpdate(product.id, location, amount, "transfer")
                  }
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-white"
                >
                  {location === "downstairs"
                    ? "↑ Arriba"
                    : "↓ Abajo"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}