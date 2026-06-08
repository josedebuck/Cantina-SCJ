"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Box, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error al iniciar sesión"
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-amber-400/20">
            <Box className="w-8 h-8 text-zinc-950" />
          </div>
          <h1 className="font-mono font-bold text-2xl tracking-widest uppercase text-white mb-1">
            Cantina SCJ
          </h1>
          <p className="text-zinc-500 font-mono text-sm">Control de stock</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {error && (
            <div className="mb-5 p-3 bg-red-950/60 border border-red-800/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 font-mono font-bold rounded-xl shadow-lg shadow-amber-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
          >
            {loading ? "Redirigiendo..." : "Continuar con Google"}
          </button>
        </div>

      </div>
    </div>
  );
}