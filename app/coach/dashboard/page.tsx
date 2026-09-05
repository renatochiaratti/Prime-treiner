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
      .order("position", { ascending: true });
    if (error) throw error;
    setAthletes((data as Athlete[]) || []);
  }

  async function handleCreateAthlete() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const maxPos = athletes.length > 0 ? Math.max(...athletes.map((x) => x.position || 0)) : 0;

    const { data: athlete, error } = await supabase
      .from("athletes")
      .insert({ coach_id: session.user.id, name, position: maxPos + 1 })
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

  async function toggleCrossfit(a: Athlete, e: React.MouseEvent) {
    e.stopPropagation();
    const novo = !a.crossfit_ativo;
    setAthletes((prev) => prev.map((x) => (x.id === a.id ? { ...x, crossfit_ativo: novo } : x)));
    await supabase.from("athletes").update({ crossfit_ativo: novo }).eq("id", a.id);
  }

  async function toggleRcpAtivo(a: Athlete, e: React.MouseEvent) {
    e.stopPropagation();
    const novo = !a.rcp_ativo;
    setAthletes((prev) => prev.map((x) => (x.id === a.id ? { ...x, rcp_ativo: novo } : x)));
    await supabase.from("athletes").update({ rcp_ativo: novo }).eq("id", a.id);
  }

  async function moveAthlete(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= athletes.length) return;
    const a = athletes[index];
    const b = athletes[newIndex];
    const posA = a.position;
    const posB = b.position;

    const newList = [...athletes];
    newList[index] = { ...b, position: posA };
    newList[newIndex] = { ...a, position: posB };
    setAthletes(newList);

    await supabase.from("athletes").update({ position: posB }).eq("id", a.id);
    await supabase.from("athletes").update({ position: posA }).eq("id", b.id);
  }

  async function handleDeleteAthlete(a: Athlete, e: React.MouseEvent) {
    e.stopPropagation();
    const confirmado = window.confirm(
      `Tem certeza que quer apagar o perfil de "${a.name}"?\n\nIsso remove TODOS os dados dele (treinos, pagamentos, mensagens, RCP, etc.) e não pode ser desfeito.`
    );
    if (!confirmado) return;

    await Promise.all([
      supabase.from("movement_rows").delete().eq("athlete_id", a.id),
      supabase.from("objetivos").delete().eq("athlete_id", a.id),
      supabase.from("aulas").delete().eq("athlete_id", a.id),
      supabase.from("mensagens").delete().eq("athlete_id", a.id),
      supabase.from("pagamentos").delete().eq("athlete_id", a.id),
      supabase.from("rcp_load_tracking").delete().eq("athlete_id", a.id),
      supabase.from("rcp_assessments").delete().eq("athlete_id", a.id),
      supabase.from("rcp_extras").delete().eq("athlete_id", a.id),
      supabase.from("rcp_checks").delete().eq("athlete_id", a.id),
      supabase.from("rcp_treino_blocos").delete().eq("athlete_id", a.id),
      supabase.from("rcp_exercicios").delete().eq("athlete_id", a.id),
    ]);

    await supabase.from("athletes").delete().eq("id", a.id);
    setAthletes((prev) => prev.filter((x) => x.id !== a.id));
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/coach/rcp")}
            title="Método RCP"
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              width: 38,
              height: 38,
              background: "#a3e635",
              color: "#1a2e05",
              fontSize: 18,
              boxShadow: "0 0 0 4px rgba(163,230,53,0.18)",
              border: "none",
            }}
          >
            👑
          </button>
          <button onClick={handleLogout} className="btn" style={{ padding: "6px 12px", fontSize: 12.5 }}>
            Sair
          </button>
        </div>
      </div>

      <div className="card overflow-hidden mb-4">
        {athletes.length === 0 && (
          <div className="p-5 text-sm" style={{ color: "#6c6c72" }}>
            Nenhum aluno cadastrado ainda.
          </div>
        )}
        {athletes.map((a, i) => (
          <div
            key={a.id}
            className="px-4 py-3"
            style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.09)" }}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div
                onClick={() => router.push(`/coach/${a.id}`)}
                className="flex items-center gap-3 flex-1 cursor-pointer"
              >
                <div
                  className="rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
                  style={{ width: 36, height: 36, fontSize: 13, background: "linear-gradient(135deg,#d4af37,#22c55e)", color: "#0d0d0d" }}
                >
                  {initials(a.name)}
                </div>
                <div className="flex-1 font-bold text-[14.5px] text-white">{a.name}</div>
              </div>
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); moveAthlete(i, -1); }}
                  disabled={i === 0}
                  className="leading-none px-1"
                  style={{ fontSize: 13, color: i === 0 ? "#3a3a3d" : "#9a9a9f" }}
                >
                  ▲
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveAthlete(i, 1); }}
                  disabled={i === athletes.length - 1}
                  className="leading-none px-1"
                  style={{ fontSize: 13, color: i === athletes.length - 1 ? "#3a3a3d" : "#9a9a9f" }}
                >
                  ▼
                </button>
              </div>
              <div onClick={() => router.push(`/coach/${a.id}`)} className="cursor-pointer flex-shrink-0" style={{ color: "#6c6c72" }}>
                ›
              </div>
            </div>

            <div className="flex items-center gap-2 pl-[48px]">
              <button
                onClick={(e) => toggleCrossfit(a, e)}
                className="px-2.5 py-1.5 rounded-md text-[10.5px] font-extrabold flex-shrink-0"
                style={{
                  background: a.crossfit_ativo ? "rgba(59,130,246,0.18)" : "transparent",
                  color: a.crossfit_ativo ? "#3b82f6" : "#6c6c72",
                  border: `1.5px solid ${a.crossfit_ativo ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.16)"}`,
                }}
              >
                CrossFit
              </button>
              <button
                onClick={(e) => toggleRcpAtivo(a, e)}
                className="px-2.5 py-1.5 rounded-md text-[10.5px] font-extrabold flex-shrink-0"
                style={{
                  background: a.rcp_ativo ? "rgba(34,197,94,0.18)" : "transparent",
                  color: a.rcp_ativo ? "#22c55e" : "#6c6c72",
                  border: `1.5px solid ${a.rcp_ativo ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.16)"}`,
                }}
              >
                RCP
              </button>
              <div className="flex-1" />
              <button
                onClick={(e) => handleDeleteAthlete(a, e)}
                className="text-[11px] font-bold flex-shrink-0"
                style={{ color: "#ef4444" }}
              >
                🗑 Remover
              </button>
            </div>
          </div>
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
