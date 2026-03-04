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
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        {title}
      </h2>

      <div className="space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No hay productos
          </div>
        ) : (
          products.map((product) => {
            const stock =
              location === "downstairs"
                ? product.stock_downstairs
                : product.stock_upstairs;

            const stockColor =
              stock === 0
                ? "text-red-400"
                : stock < 5
                ? "text-yellow-400"
                : "text-emerald-400";

            const amount = getAmount(product.id);

            return (
              <div
                key={product.id}
                className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-400 font-semibold">
                        ${product.price}
                      </span>

                      <span className={`font-bold ${stockColor}`}>
                        Stock: {stock}
                      </span>
                    </div>
                  </div>

                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-700"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) =>
                      setAmount(product.id, Number(e.target.value))
                    }
                    className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <button
                    onClick={() =>
                      onUpdate(product.id, location, amount, "update")
                    }
                    className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all"
                  >
                    +
                  </button>

                  <button
                    onClick={() =>
                      onUpdate(product.id, location, -amount, "update")
                    }
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all"
                  >
                    -
                  </button>

                  <button
                    onClick={() =>
                      onUpdate(product.id, location, amount, "transfer")
                    }
                    className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all"
                  >
                    {location === "downstairs" ? "Arriba" : "Abajo"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}