"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Athlete, Objetivo, MovementRow, ExtraBloco, ExtraExercicio, Aula, Mensagem, Pagamento } from "@/lib/types";
import ObjetivosCard from "@/components/ObjetivosCard";
import MovementTable from "@/components/MovementTable";
import ExtrasEditor from "@/components/ExtrasEditor";
import AulasEditor from "@/components/AulasEditor";
import MensagensPanel from "@/components/MensagensPanel";
import PagamentosTable from "@/components/PagamentosTable";

const TABS = [
  { key: "levantamentos", label: "Levantamentos" },
  { key: "ginasticas", label: "Ginásticas" },
  { key: "ciclicos", label: "Cíclicos" },
  { key: "benchmarks", label: "Benchmarks" },
  { key: "extras", label: "Extras" },
  { key: "aulas", label: "Aulas" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function AthleteEditorPage({ params }: { params: { athleteId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [movementRows, setMovementRows] = useState<MovementRow[]>([]);
  const [blocos, setBlocos] = useState<(ExtraBloco & { extras_exercicios: ExtraExercicio[] })[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [tab, setTab] = useState<TabKey>("levantamentos");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/coach/login"); return; }

      const { data: a } = await supabase.from("athletes").select("*").eq("id", params.athleteId).single();
      if (!a) { router.replace("/coach/dashboard"); return; }
      setAthlete(a as Athlete);

      const [{ data: obj }, { data: mov }, { data: bl }, { data: au }, { data: msg }, { data: pay }] = await Promise.all([
        supabase.from("objetivos").select("*").eq("athlete_id", params.athleteId).order("position"),
        supabase.from("movement_rows").select("*").eq("athlete_id", params.athleteId).order("position"),
        supabase.from("extras_blocos").select("*, extras_exercicios(*)").eq("athlete_id", params.athleteId).order("position"),
        supabase.from("aulas").select("*").eq("athlete_id", params.athleteId).order("data"),
        supabase.from("mensagens").select("*").eq("athlete_id", params.athleteId).order("created_at", { ascending: false }),
        supabase.from("pagamentos").select("*").eq("athlete_id", params.athleteId).order("position", { ascending: true }),
      ]);

      setObjetivos((obj as Objetivo[]) || []);
      setMovementRows((mov as MovementRow[]) || []);
      setBlocos((bl as any) || []);
      setAulas((au as Aula[]) || []);
      setMensagens((msg as Mensagem[]) || []);
      setPagamentos((pay as Pagamento[]) || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.athleteId]);

  async function updateName(name: string) {
    if (!athlete) return;
    setAthlete({ ...athlete, name });
    await supabase.from("athletes").update({ name }).eq("id", athlete.id);
  }

  function copyShareLink() {
    if (!athlete || typeof window === "undefined") return;
    const link = `${window.location.origin}/a/${athlete.share_token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  }

  if (loading || !athlete) {
    return <div className="app-shell flex items-center justify-center" style={{ minHeight: "100vh", color: "#9a9a9f" }}>Carregando...</div>;
  }

  return (
    <div className="app-shell px-5 py-5" style={{ paddingBottom: 60 }}>
      <button onClick={() => router.push("/coach/dashboard")} className="text-xs font-bold mb-3" style={{ color: "#6c6c72" }}>
        ‹ Todos os alunos
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div
          className="rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
          style={{ width: 48, height: 48, fontSize: 18, background: "linear-gradient(135deg,#d4af37,#22c55e)", color: "#0d0d0d" }}
        >
          {initials(athlete.name)}
        </div>
        <input
          defaultValue={athlete.name}
          onBlur={(e) => updateName(e.target.value)}
          className="bg-transparent border-none font-extrabold text-[21px]"
          style={{ color: "#d4af37" }}
        />
      </div>
      <button onClick={copyShareLink} className="btn mb-5" style={{ padding: "6px 12px", fontSize: 12.5 }}>
        {copiedLink ? "✔ Link copiado!" : "🔗 Copiar link do aluno"}
      </button>

      <ObjetivosCard athleteId={athlete.id} initialObjetivos={objetivos} editable />

      <div className="mb-6">
        <div className="flex gap-1.5 overflow-x-auto mb-4 pb-0.5" style={{ borderBottom: "2px solid rgba(255,255,255,0.09)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-shrink-0 px-4 py-2.5 text-[13px] font-extrabold rounded-full"
              style={{
                background: tab === t.key ? "rgba(34,197,94,0.14)" : "#18191c",
                color: tab === t.key ? "#22c55e" : "#9a9a9f",
                border: `1px solid ${tab === t.key ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.09)"}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "extras" ? (
          <ExtrasEditor athleteId={athlete.id} initialBlocos={blocos} editable />
        ) : tab === "aulas" ? (
          <AulasEditor athleteId={athlete.id} initialAulas={aulas} editable />
        ) : (
          <MovementTable
            athleteId={athlete.id}
            categoria={tab}
            initialRows={movementRows.filter((r) => r.categoria === tab)}
            editable
          />
        )}
      </div>

      <div className="mb-6">
        <MensagensPanel athleteId={athlete.id} athleteName={athlete.name} initialMensagens={mensagens} editable />
      </div>

      <PagamentosTable initialPagamentos={pagamentos} cycleStart={athlete.cycle_start} cycleEnd={athlete.cycle_end} editable />
    </div>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
