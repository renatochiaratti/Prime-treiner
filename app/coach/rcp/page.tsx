"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { RcpAthlete } from "@/lib/types";

export default function RcpDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<RcpAthlete[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrupo, setNewGrupo] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("rcp_athletes")
      .select("*")
      .order("created_at", { ascending: false });
    setAthletes((data as RcpAthlete[]) || []);
    setLoading(false);
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("rcp_athletes")
      .insert({ name, grupo_trio: newGrupo.trim() || null })
      .select()
      .single();
    setCreating(false);
    if (error || !data) {
      alert("Não deu pra criar o aluno.\n\nErro: " + (error?.message || "desconhecido"));
      return;
    }
    setShowNew(false);
    setNewName("");
    setNewGrupo("");
    router.push(`/coach/rcp/${data.id}`);
  }

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center" style={{ minHeight: "100vh", color: "#9a9a9f" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div className="app-shell px-5 py-6">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => router.push("/coach/dashboard")} style={{ color: "#6c6c72" }} className="text-sm font-bold">
          ‹ Voltar
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <span style={{ fontSize: 22 }}>👑</span>
        <h1 className="text-white font-extrabold text-xl">Método RCP</h1>
      </div>

      <div className="card overflow-hidden mb-4">
        {athletes.length === 0 && (
          <div className="p-5 text-sm" style={{ color: "#6c6c72" }}>
            Nenhum aluno do RCP cadastrado ainda.
          </div>
        )}
        {athletes.map((a, i) => (
          <button
            key={a.id}
            onClick={() => router.push(`/coach/rcp/${a.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
            style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.09)" }}
          >
            <div
              className="rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
              style={{ width: 36, height: 36, fontSize: 13, background: "linear-gradient(135deg,#a3e635,#22c55e)", color: "#1a2e05" }}
            >
              {initials(a.name)}
            </div>
            <div className="flex-1">
              <div className="font-bold text-[14.5px] text-white">{a.name}</div>
              {a.grupo_trio && <div className="text-xs" style={{ color: "#6c6c72" }}>{a.grupo_trio}</div>}
            </div>
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
            className="w-full px-3 py-2 rounded-lg text-sm font-semibold mb-2"
            style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
          />
          <input
            placeholder="Trio / grupo (opcional)"
            value={newGrupo}
            onChange={(e) => setNewGrupo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-semibold mb-3"
            style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowNew(false)} className="btn flex-1" style={{ background: "transparent" }}>
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={creating} className="btn flex-1" style={{ background: "#a3e635", color: "#1a2e05", borderColor: "#a3e635" }}>
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
          + Novo aluno RCP
        </button>
      )}
    </div>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
