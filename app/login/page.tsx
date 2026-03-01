"use client";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <button
        onClick={handleLogin}
        className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:scale-105 transition"
      >
        Iniciar sesión con Google
      </button>
    </div>
  );
}