"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import StockColumn from "@/components/StockColumn";

type Product = {
  id: string;
  name: string;
  image_url: string | null;
  stock_downstairs: number;
  stock_upstairs: number;
  price: number;
};

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const [newProduct, setNewProduct] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
      } else {
        fetchProducts();
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (!error && data) {
      setProducts(data);
    }
  };

  const handleUpdate = async (
    id: string,
    location: "downstairs" | "upstairs",
    amount: number,
    type: "update" | "transfer"
  ) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    let updatedDown = product.stock_downstairs;
    let updatedUp = product.stock_upstairs;

    if (type === "update") {
      if (location === "downstairs") {
        updatedDown = Math.max(0, updatedDown + amount);
      } else {
        updatedUp = Math.max(0, updatedUp + amount);
      }
    }

    if (type === "transfer") {
      if (location === "downstairs" && updatedDown >= amount) {
        updatedDown -= amount;
        updatedUp += amount;
      }

      if (location === "upstairs" && updatedUp >= amount) {
        updatedUp -= amount;
        updatedDown += amount;
      }
    }

    await supabase
      .from("products")
      .update({
        stock_downstairs: updatedDown,
        stock_upstairs: updatedUp,
      })
      .eq("id", id);

    fetchProducts();
  };

  const handleAddProduct = async () => {
    if (!newProduct.trim()) {
      alert("Escribí el nombre del producto");
      return;
    }

    await supabase.from("products").insert([
      {
        name: newProduct,
        stock_downstairs: 0,
        stock_upstairs: 0,
        image_url: imageUrl.trim() || null,
        price: Number(price) || 0,
      },
    ]);

    setNewProduct("");
    setImageUrl("");
    setPrice("");
    fetchProducts();
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* HEADER */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Control de Stock
          </h1>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* SEARCH + ADD */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-8">

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Add product */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              placeholder="Nombre del producto"
              className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />

            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL de la imagen"
              className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />

            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Precio"
              className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <button
            onClick={handleAddProduct}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
          >
            Agregar producto
          </button>
        </div>

        {/* COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StockColumn
            title="Cantina Abajo"
            location="downstairs"
            products={filteredProducts}
            onUpdate={handleUpdate}
          />
          <StockColumn
            title="Cantina Arriba"
            location="upstairs"
            products={filteredProducts}
            onUpdate={handleUpdate}
          />
        </div>
      </main>
    </div>
  );
}