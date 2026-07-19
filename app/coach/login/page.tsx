"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CoachLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError("E-mail ou senha incorretos. Confira e tente de novo.");
        return;
      }
      router.replace("/coach/dashboard");
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError("Não deu pra criar a conta: " + error.message);
      return;
    }
    if (data.session) {
      router.replace("/coach/dashboard");
      return;
    }
    setInfo("Conta criada! Se pedir confirmação, confira seu e-mail e depois volte pra entrar.");
    setMode("login");
  }

  return (
    <div className="app-shell flex items-center justify-center px-5" style={{ minHeight: "100vh" }}>
      <div className="card w-full max-w-sm p-7">
        <h1 className="text-white font-extrabold text-xl mb-1">
          {mode === "login" ? "Entrar como Coach" : "Criar conta de Coach"}
        </h1>
        <p className="text-sm mb-6" style={{ color: "#9a9a9f" }}>
          {mode === "login"
            ? "Digite seu e-mail e senha para entrar."
            : "Escolha um e-mail e uma senha para sua conta."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
          />
          {error && <div className="text-xs" style={{ color: "#ef4444" }}>{error}</div>}
          {info && <div className="text-xs" style={{ color: "#22c55e" }}>{info}</div>}
          <button type="submit" disabled={loading} className="btn btn-gold">
            {loading ? "Aguarda..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setInfo("");
          }}
          className="text-xs font-bold mt-4"
          style={{ color: "#6c6c72" }}
        >
          {mode === "login" ? "Ainda não tem conta? Criar uma" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
