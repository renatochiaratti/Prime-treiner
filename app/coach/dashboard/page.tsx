"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { buildSeedMovementRows } from "@/lib/movementLibrary";
import type { Athlete } from "@/lib/types";

export default function CoachDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/coach/login");
        return;
      }
      await loadAthletes();
    } catch (e: any) {
      setError(e?.message || "Erro desconhecido ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAthletes() {
    const { data, error } = await supabase
      .from("athletes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setAthletes((data as Athlete[]) || []);
  }

  async function handleCreateAthlete() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: athlete, error } = await supabase
      .from("athletes")
      .insert({ coach_id: session.user.id, name })
      .select()
      .single();

    if (error || !athlete) {
      alert("Não deu pra criar o aluno.\n\nErro: " + (error?.message || "desconhecido"));
      setCreating(false);
      return;
    }

    const seedRows = buildSeedMovementRows().map((r) => ({
      athlete_id: athlete.id,
      categoria: r.categoria,
      grupo: r.grupo,
      movimento: r.movimento,
      position: r.position,
    }));
    await supabase.from("movement_rows").insert(seedRows);

    await supabase.from("objetivos").insert({ athlete_id: athlete.id, text: "Melhorar o condicionamento geral", position: 0 });
    const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    await supabase.from("pagamentos").insert(
      meses.map((mes, position) => ({ athlete_id: athlete.id, mes, valor: 550, status: "pendente", position }))
    );

    setCreating(false);
    setShowNew(false);
    setNewName("");
    router.push(`/coach/${athlete.id}`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center" style={{ minHeight: "100vh", color: "#9a9a9f" }}>
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell flex items-center justify-center px-5" style={{ minHeight: "100vh" }}>
        <div className="card p-6 max-w-sm text-center">
          <p className="text-sm mb-4" style={{ color: "#ef4444" }}>{error}</p>
          <button onClick={load} className="btn btn-gold">Tentar de novo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white font-extrabold text-xl">Seus Alunos</h1>
        <button onClick={handleLogout} className="btn" style={{ padding: "6px 12px", fontSize: 12.5 }}>
          Sair
        </button>
      </div>

      <div className="card overflow-hidden mb-4">
        {athletes.length === 0 && (
          <div className="p-5 text-sm" style={{ color: "#6c6c72" }}>
            Nenhum aluno cadastrado ainda.
          </div>
        )}
        {athletes.map((a, i) => (
          <button
            key={a.id}
            onClick={() => router.push(`/coach/${a.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
            style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.09)" }}
          >
            <div
              className="rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
              style={{ width: 36, height: 36, fontSize: 13, background: "linear-gradient(135deg,#d4af37,#22c55e)", color: "#0d0d0d" }}
            >
              {initials(a.name)}
            </div>
            <div className="flex-1 font-bold text-[14.5px] text-white">{a.name}</div>
            <div style={{ color: "#6c6c72" }}>›</div>
          </button>
        ))}
      </div>

      {showNew ? (
        <div className="card p-4">
          <input
            autoFocus
            placeholder="Nome do aluno"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-semibold mb-3"
            style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowNew(false)} className="btn flex-1" style={{ background: "transparent" }}>
              Cancelar
            </button>
            <button onClick={handleCreateAthlete} disabled={creating} className="btn btn-gold flex-1">
              {creating ? "Criando..." : "Criar perfil"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="w-full py-3 rounded-xl text-sm font-bold"
          style={{ border: "1.5px dashed rgba(255,255,255,0.16)", color: "#9a9a9f" }}
        >
          + Novo aluno
        </button>
      )}
    </div>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
