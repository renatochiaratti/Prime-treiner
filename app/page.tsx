"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function GatePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAlunoLogin() {
    setError("");
    if (!email || !password) { setError("Preenche e-mail e senha."); return; }
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }
    const { data: athlete } = await supabase
      .from("athletes")
      .select("share_token")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();
    if (!athlete) {
      setError("Essa conta ainda não está vinculada a nenhum aluno. Peça o link pro seu coach pra criar seu acesso.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    router.push(`/a/${athlete.share_token}`);
  }

  return (
    <div className="app-shell flex items-center justify-center px-5 py-10" style={{ minHeight: "100vh" }}>
      <div className="w-full" style={{ maxWidth: 400 }}>
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/icons/icon-192.png"
            alt="Prime Trainer"
            className="rounded-2xl mb-4"
            style={{ width: 76, height: 76, objectFit: "cover" }}
          />
          <h1 className="font-display font-extrabold text-white" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
            PRIME TRAINER
          </h1>
          <div className="text-[13px] tracking-[0.3em] font-extrabold mt-1 mb-3" style={{ color: "#d4af37" }}>
            SEJA SUA MELHOR VERSÃO
          </div>
          <p className="text-sm" style={{ color: "#9a9a9f" }}>
            Seu treino. Sua evolução. <b style={{ color: "#22c55e" }}>Seu melhor.</b>
          </p>
        </div>

        <a
          href="/coach/login"
          className="card flex items-center gap-4 p-5 mb-4"
          style={{ border: "1.5px solid rgba(212,175,55,0.3)" }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 44, height: 44, background: "rgba(212,175,55,0.12)", fontSize: 19 }}
          >
            👑
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-[15.5px]">Área do Coach</h3>
            <p className="text-xs" style={{ color: "#9a9a9f" }}>
              Faça login para editar treinos, marcas, aulas e recados dos seus alunos.
            </p>
          </div>
          <div style={{ color: "#6c6c72" }}>›</div>
        </a>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 44, height: 44, background: "rgba(34,197,94,0.12)", fontSize: 19 }}
            >
              🏃
            </div>
            <h3 className="font-bold text-white text-[15.5px]">Área do Aluno</h3>
          </div>

          <label className="text-[11px] font-bold block mb-1" style={{ color: "#6c6c72" }}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com"
            className="w-full px-3 py-2.5 rounded-lg text-sm mb-3"
            style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
          />

          <label className="text-[11px] font-bold block mb-1" style={{ color: "#6c6c72" }}>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="w-full px-3 py-2.5 rounded-lg text-sm mb-3"
            style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
          />

          {error && (
            <div className="text-sm mb-3" style={{ color: "#ef4444" }}>{error}</div>
          )}

          <button
            onClick={handleAlunoLogin}
            disabled={loading}
            className="w-full rounded-xl font-extrabold mb-3"
            style={{ background: "#22c55e", color: "#04240f", padding: "12px 16px", fontSize: 13, border: "none" }}
          >
            {loading ? "Aguarda..." : "Entrar"}
          </button>

          <p className="text-[11px] text-center" style={{ color: "#6c6c72" }}>
            Ainda não tem conta? Seu coach te manda um link pessoal (<code style={{ color: "#d4af37" }}>/a/SEU-CODIGO</code>) pra você criar sua senha na primeira vez.
          </p>
        </div>
      </div>
    </div>
  );
}
