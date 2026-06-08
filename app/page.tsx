"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/Product";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  LogOut,
  Search,
  X,
  AlertTriangle,
  Clock,
  ArrowLeftRight,
  Pencil,
  Trash2,
  Check,
  Box,
} from "lucide-react";

// ─── Helpers de caja ────────────────────────────────────────────────────────

const BOX_FRACTIONS = [
  { label: "Vacia", value: 0 },
  { label: "1/4",   value: 0.25 },
  { label: "1/2",   value: 0.5 },
  { label: "3/4",   value: 0.75 },
  { label: "Llena", value: 1 },
];

function stockLabel(units: number, boxSize: number): string {
  if (units === 0) return "Sin stock";
  const fullBoxes = Math.floor(units / boxSize);
  const remainder = units % boxSize;

  if (remainder === 0)
    return fullBoxes === 1 ? "1 caja" : `${fullBoxes} cajas`;

  const frac = remainder / boxSize;
  const fracLabel = frac <= 0.3 ? "¼" : frac <= 0.6 ? "½" : "¾";

  if (fullBoxes === 0) return `${fracLabel} caja`;
  return `${fullBoxes} caja${fullBoxes > 1 ? "s" : ""} + ${fracLabel}`;
}

function stockColorClass(units: number, boxSize: number): string {
  if (units === 0)             return "text-red-400";
  if (units <= boxSize * 0.25) return "text-orange-400";
  if (units < boxSize)         return "text-yellow-400";
  return "text-emerald-400";
}

function isLow(units: number, boxSize: number): boolean {
  return units < boxSize;
}

// ─── Types locales ──────────────────────────────────────────────────────────

type HistoryEntry = {
  productName: string;
  action: string;
  timestamp: Date;
};

type EditState = {
  id: string;
  name: string;
  price: string;
  box_size: string;
};

// ─── Componente principal ────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();

  const [loading, setLoading]           = useState(true);
  const [products, setProducts]         = useState<Product[]>([]);
  const [search, setSearch]             = useState("");
  const [activeTab, setActiveTab]       = useState<"downstairs" | "upstairs">("downstairs");
  const [history, setHistory]           = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory]   = useState(false);
  const [showAdd, setShowAdd]           = useState(false);
  const [editState, setEditState]       = useState<EditState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [exactInputs, setExactInputs]   = useState<Record<string, string>>({});

  // Formulario nuevo producto
  const [newName, setNewName]           = useState("");
  const [newPrice, setNewPrice]         = useState("");
  const [newBoxSize, setNewBoxSize]     = useState("12");
  const [newImageUrl, setNewImageUrl]   = useState("");

  // ── Auth ──
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      } else {
        await fetchProducts();
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Data ──
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (!error && data) setProducts(data as Product[]);
  };

  const logHistory = (productName: string, action: string) =>
    setHistory((prev) => [
      { productName, action, timestamp: new Date() },
      ...prev.slice(0, 49),
    ]);

  // ── Acciones ──

  const handleSetStock = async (
    id: string,
    location: "downstairs" | "upstairs",
    newStock: number
  ) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const update =
      location === "downstairs"
        ? { stock_downstairs: newStock, stock_upstairs: product.stock_upstairs }
        : { stock_downstairs: product.stock_downstairs, stock_upstairs: newStock };

    await supabase.from("products").update(update).eq("id", id);

    const prev = location === "downstairs" ? product.stock_downstairs : product.stock_upstairs;
    const diff = newStock - prev;
    const sign = diff >= 0 ? "+" : "";
    const loc  = location === "downstairs" ? "Abajo" : "Arriba";
    logHistory(product.name, `${loc}: ${stockLabel(newStock, product.box_size)} (${sign}${diff} u.)`);
    await fetchProducts();
  };

  const handleTransfer = async (
    id: string,
    from: "downstairs" | "upstairs"
  ) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const amount = from === "downstairs" ? product.stock_downstairs : product.stock_upstairs;
    if (amount === 0) return;

    const update =
      from === "downstairs"
        ? { stock_downstairs: 0, stock_upstairs: product.stock_upstairs + amount }
        : { stock_downstairs: product.stock_downstairs + amount, stock_upstairs: 0 };

    await supabase.from("products").update(update).eq("id", id);
    const to = from === "downstairs" ? "Arriba" : "Abajo";
    logHistory(product.name, `Transferido ${stockLabel(amount, product.box_size)} → ${to}`);
    await fetchProducts();
  };

  const handleAddProduct = async () => {
    if (!newName.trim()) return;
    await supabase.from("products").insert([{
      name:             newName.trim(),
      stock_downstairs: 0,
      stock_upstairs:   0,
      image_url:        newImageUrl.trim() || null,
      price:            Number(newPrice) || 0,
      box_size:         Number(newBoxSize) || 12,
    }]);
    logHistory(newName.trim(), "Producto creado");
    setNewName(""); setNewPrice(""); setNewBoxSize("12"); setNewImageUrl("");
    setShowAdd(false);
    await fetchProducts();
  };

  const handleEdit = async () => {
    if (!editState) return;
    await supabase
      .from("products")
      .update({
        name:     editState.name,
        price:    Number(editState.price) || 0,
        box_size: Number(editState.box_size) || 12,
      })
      .eq("id", editState.id);
    logHistory(editState.name, "Editado");
    setEditState(null);
    await fetchProducts();
  };

  const handleDelete = async (id: string) => {
    const product = products.find((p) => p.id === id);
    await supabase.from("products").delete().eq("id", id);
    if (product) logHistory(product.name, "Eliminado");
    setDeleteConfirm(null);
    await fetchProducts();
  };

  // ── Derivados ──
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockProducts = filteredProducts.filter((p) => {
    const stock = activeTab === "downstairs" ? p.stock_downstairs : p.stock_upstairs;
    return isLow(stock, p.box_size);
  });

  const hasLowInTab = (tab: "downstairs" | "upstairs") =>
    products.some((p) => {
      const stock = tab === "downstairs" ? p.stock_downstairs : p.stock_upstairs;
      return isLow(stock, p.box_size);
    });

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Box className="w-10 h-10 text-amber-400 animate-pulse" />
          <span className="text-zinc-500 font-mono text-sm">Cargando...</span>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-400" />
            <span className="font-mono font-bold text-sm tracking-widest uppercase text-zinc-200">
              Cantina SCJ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${
                showHistory
                  ? "bg-amber-400 text-zinc-950"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-zinc-800">
          {(["downstairs", "upstairs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-mono font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab
                  ? "text-amber-400 border-b-2 border-amber-400"
                  : "text-zinc-500"
              }`}
            >
              {tab === "downstairs" ? "Abajo" : "Arriba"}
              {hasLowInTab(tab) && (
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── HISTORIAL ── */}
      {showHistory && (
        <div className="mx-4 mt-4 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
              Historial
            </span>
            <button onClick={() => setShowHistory(false)} className="text-zinc-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-6 font-mono">
              Sin actividad todavía
            </p>
          ) : (
            <div className="divide-y divide-zinc-800 max-h-64 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm text-white font-medium">{h.productName}</p>
                    <p className="text-xs text-zinc-500 font-mono">{h.action}</p>
                  </div>
                  <span className="text-xs text-zinc-600 font-mono">
                    {h.timestamp.toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALERTA STOCK BAJO ── */}
      {lowStockProducts.length > 0 && (
        <div className="mx-4 mt-4 bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-red-400">
              Menos de una caja
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((p) => {
              const stock =
                activeTab === "downstairs" ? p.stock_downstairs : p.stock_upstairs;
              return (
                <span
                  key={p.id}
                  className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded-lg font-mono"
                >
                  {p.name}{" "}
                  <strong>({stockLabel(stock, p.box_size)})</strong>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BÚSQUEDA ── */}
      <div className="px-4 mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono text-sm transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── LISTA DE PRODUCTOS ── */}
      <div className="px-4 mt-4 space-y-3">
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 text-zinc-600 font-mono text-sm">
            Sin resultados
          </div>
        )}

        {filteredProducts.map((product) => {
          const stock =
            activeTab === "downstairs"
              ? product.stock_downstairs
              : product.stock_upstairs;
          const otherStock =
            activeTab === "downstairs"
              ? product.stock_upstairs
              : product.stock_downstairs;
          const otherLabel = activeTab === "downstairs" ? "Arriba" : "Abajo";

          const empty   = stock === 0;
          const low     = isLow(stock, product.box_size);
          const color   = stockColorClass(stock, product.box_size);
          const exactVal = exactInputs[product.id] ?? "";

          const isEditing  = editState?.id === product.id;
          const isDeleting = deleteConfirm === product.id;

          return (
            <div
              key={product.id}
              className={`rounded-xl border transition-all ${
                empty
                  ? "bg-red-950/30 border-red-800/50"
                  : low
                  ? "bg-orange-950/30 border-orange-800/40"
                  : "bg-zinc-900 border-zinc-800"
              }`}
            >
              {/* Info */}
              <div className="flex items-center gap-3 p-4 pb-3">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover border border-zinc-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-zinc-600" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    /* ── MODO EDICIÓN ── */
                    <div className="flex flex-col gap-1.5">
                      <input
                        value={editState.name}
                        onChange={(e) =>
                          setEditState({ ...editState, name: e.target.value })
                        }
                        placeholder="Nombre"
                        className="w-full bg-zinc-800 border border-amber-500/50 rounded-lg px-2 py-1 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">
                            $
                          </span>
                          <input
                            type="number"
                            value={editState.price}
                            onChange={(e) =>
                              setEditState({ ...editState, price: e.target.value })
                            }
                            placeholder="Precio"
                            className="w-full pl-5 pr-2 py-1 bg-zinc-800 border border-amber-500/50 rounded-lg text-sm text-amber-400 font-mono focus:outline-none"
                          />
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={editState.box_size}
                            onChange={(e) =>
                              setEditState({ ...editState, box_size: e.target.value })
                            }
                            placeholder="u/caja"
                            className="w-full pl-2 pr-11 py-1 bg-zinc-800 border border-zinc-600 rounded-lg text-sm text-blue-400 font-mono focus:outline-none focus:border-blue-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-mono">
                            u/caja
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── MODO NORMAL ── */
                    <>
                      <p className="font-bold text-white truncate text-base leading-tight">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-amber-400 font-mono font-bold text-sm">
                          ${product.price.toLocaleString("es-AR")}
                        </span>
                        <span className={`font-mono text-sm font-bold ${color}`}>
                          {empty ? "SIN STOCK" : stockLabel(stock, product.box_size)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-600 font-mono">
                          {otherLabel}:{" "}
                          {otherStock === 0
                            ? "vacío"
                            : stockLabel(otherStock, product.box_size)}
                        </span>
                        <span className="text-zinc-700 font-mono text-xs">·</span>
                        <span className="text-zinc-700 font-mono text-xs">
                          caja={product.box_size}u
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Botones editar/eliminar */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleEdit}
                        className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditState(null)}
                        className="p-2 bg-zinc-800 text-zinc-500 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : isDeleting ? (
                    <>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 text-xs font-mono"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-2 bg-zinc-800 text-zinc-500 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          setEditState({
                            id:       product.id,
                            name:     product.name,
                            price:    String(product.price),
                            box_size: String(product.box_size),
                          })
                        }
                        className="p-2 bg-zinc-800 text-zinc-500 hover:text-amber-400 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="p-2 bg-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Controles de stock */}
              {!isEditing && !isDeleting && (
                <div className="px-4 pb-4 space-y-2">

                  {/* Botones de fracción */}
                  <div className="flex gap-1.5">
                    {BOX_FRACTIONS.map((frac) => {
                      const target   = Math.round(frac.value * product.box_size);
                      const isActive = stock === target;
                      return (
                        <button
                          key={frac.label}
                          onClick={() => handleSetStock(product.id, activeTab, target)}
                          className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all border ${
                            isActive
                              ? "bg-amber-400 text-zinc-950 border-amber-400"
                              : "bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:border-amber-500/50 hover:text-amber-400"
                          }`}
                        >
                          {frac.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Input exacto + Transferir */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={0}
                        placeholder="Cantidad exacta (u.)"
                        value={exactVal}
                        onChange={(e) =>
                          setExactInputs((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        className="w-full pl-3 pr-14 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 font-mono text-sm focus:outline-none focus:border-amber-500"
                      />
                      <button
                        disabled={exactVal === ""}
                        onClick={() => {
                          const val = Number(exactVal);
                          if (!isNaN(val) && val >= 0) {
                            handleSetStock(product.id, activeTab, val);
                            setExactInputs((prev) => ({
                              ...prev,
                              [product.id]: "",
                            }));
                          }
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-400 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 rounded-md font-mono text-xs font-bold transition-colors disabled:cursor-not-allowed"
                      >
                        SET
                      </button>
                    </div>

                    <button
                      onClick={() => handleTransfer(product.id, activeTab)}
                      disabled={stock === 0}
                      className="py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-mono font-bold whitespace-nowrap"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      {activeTab === "downstairs" ? "→ Arriba" : "→ Abajo"}
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── MODAL AGREGAR PRODUCTO ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 flex items-end">
          <div className="w-full bg-zinc-900 border-t border-zinc-700 rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-mono font-bold text-amber-400 uppercase tracking-widest text-sm">
                Nuevo producto
              </h2>
              <button onClick={() => setShowAdd(false)}>
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del producto"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono text-sm"
            />

            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Precio"
                  className="w-full pl-8 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-amber-400 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono text-sm"
                />
              </div>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={newBoxSize}
                  onChange={(e) => setNewBoxSize(e.target.value)}
                  placeholder="u/caja"
                  className="w-full pl-4 pr-12 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-blue-400 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 font-mono text-xs">
                  u/caja
                </span>
              </div>
            </div>

            <input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="URL de imagen (opcional)"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono text-sm"
            />

            <button
              onClick={handleAddProduct}
              disabled={!newName.trim()}
              className="w-full py-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 font-mono font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-full shadow-lg shadow-amber-400/20 flex items-center justify-center transition-all active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}