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
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // 🔐 Check login
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

  // 📦 Fetch products
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (!error && data) {
      setProducts(data);
    }
  };

  // ➕ Update or transfer stock
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
      if (location === "downstairs") {
        if (updatedDown >= amount) {
          updatedDown -= amount;
          updatedUp += amount;
        }
      } else {
        if (updatedUp >= amount) {
          updatedUp -= amount;
          updatedDown += amount;
        }
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

  // ➕ Add product (con URL manual)
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
      },
    ]);

    setNewProduct("");
    setImageUrl("");
    fetchProducts();
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Control de Stock</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="bg-red-600 px-3 py-1 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Add Product */}
      <div className="flex flex-col gap-3 mb-6 bg-gray-900 p-4 rounded-xl">
        <input
          value={newProduct}
          onChange={(e) => setNewProduct(e.target.value)}
          placeholder="Nombre del producto"
          className="bg-gray-800 px-3 py-2 rounded-lg"
        />

        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="URL de la imagen (opcional)"
          className="bg-gray-800 px-3 py-2 rounded-lg"
        />

        <button
          onClick={handleAddProduct}
          className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Agregar producto
        </button>
      </div>

      {/* Columns */}
      <div className="grid md:grid-cols-2 gap-6">
        <StockColumn
          title="Cantina Abajo"
          location="downstairs"
          products={products}
          onUpdate={handleUpdate}
        />
        <StockColumn
          title="Cantina Arriba"
          location="upstairs"
          products={products}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
}