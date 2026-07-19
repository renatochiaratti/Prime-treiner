"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { buildSeedMovementRows } from "@/lib/movementLibrary";
import type { Athlete } from "@/lib/types";

export default function CoachDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/coach/login");
        return;
      }
      await loadAthletes();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAthletes() {
    const { data } = await supabase.from("athletes").select("*").order("created_at", { ascending: false });
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
      meses.map((mes) => ({ athlete_id: athlete.id, mes, valor: 550, status: "pendente" }))
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
          
