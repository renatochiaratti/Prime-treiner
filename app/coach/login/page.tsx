"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CoachLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/coach/dashboard` : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) {
      setError("Não deu pra enviar o link. Confira o e-mail e tente de novo.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="app-shell flex items-center justify-center px-5" style={{ minHeight: "100vh" }}>
      <div className="card w-full max-w-sm p-7">
        <h1 className="text-white font-extrabold text-xl mb-1">Entrar como Coach</h1>
        <p className="text-sm mb-6" style={{ color: "#9a9a9f" }}>
          Digite seu e-mail. A gente manda um link mágico — sem senha pra decorar.
        </p>

        {sent ? (
          <div className="text-sm" style={{ color: "#22c55e" }}>
            ✔ Link enviado para <b>{email}</b>. Abra seu e-mail e clique para entrar.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0
