"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { weekdayName } from "@/lib/movementLibrary";
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

export default function AthletePublicPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [movementRows, setMovementRows] = useState<MovementRow[]>([]);
  const [blocos, setBlocos] = useState<(ExtraBloco & { extras_exercicios: ExtraExercicio[] })[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [tab, setTab] = useState<TabKey>("levantamentos");

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase.from("athletes").select("*").eq("share_token", params.token).single();
      if (!a) { setNotFound(true); setLoading(false); return; }
      setAthlete(a as Athlete);

      const [{ data: obj }, { data: mov }, { data: bl }, { data: au }, { data: msg }, { data: pay }] = await Promise.all([
        supabase.from("objetivos").select("*").eq("athlete_id", a.id).order("position"),
        supabase.from("movement_rows").select("*").eq("athlete_id", a.id).order("position"),
        supabase.from("extras_blocos").select("*, extras_exercicios(*)").eq("athlete_id", a.id).order("position"),
        supabase.from("aulas").select("*").eq("athlete_id", a.id).order("data"),
        supabase.from("mensagens").select("*").eq("athlete_id", a.id).order("created_at", { ascending: false }),
        supabase.from("pagamentos").select("*").eq("athlete_id", a.id),
      ]);

      setObjetivos((obj as Objetivo[]) || []);
      setMovementRows((mov as MovementRow[]) || []);
      setBlocos((bl as any) || []);
      setAulas((au as Aula[]) || []);
      setMensagens((msg as Mensagem[]) || []);
      setPagamentos((pay as Pagamento[]) || []);
      setLoading(false);
    })();
  }, [params.token]);

  if (loading) {
    return <div className="app-shell flex items-center justify-center" style={{ minHeight: "100vh", color: "#9a9a9f" }}>Carregando...</div>;
  }
  if (notFound || !athlete) {
    return (
      <div className="app-shell flex items-center justify-center px-5 text-center" style={{ minHeight: "100vh" }}>
        <div>
          <h1 className="text-white font-extrabold text-lg mb-2">Link não encontrado</h1>
          <p className="text-sm" style={{ color: "#9a9a9f" }}>Confira com seu coach se o link está certo.</p>
        </div>
      </div>
    );
  }

  const proximaAula = aulas.find((a) => a.status === "marcada");
  const unreadMsgs = mensagens.filter((m) => !m.lida).length;
  const doneObjetivos = objetivos.filter((o) => o.done).length;

  return (
    <div className="app-shell px-5 py-5" style={{ paddingBottom: 60 }}>
      <div className="flex items-center gap-3 mb-5">
        <div
          className="rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
          style={{ width: 48, height: 48, fontSize: 18, background: "linear-gradient(135deg,#d4af37,#22c55e)", color: "#0d0d0d" }}
        >
          {initials(athlete.name)}
        </div>
        <div>
          <div className="font-extrabold text-[19px] text-white leading-tight">{athlete.name}</div>
          <div className="text-[12.5px] font-bold" style={{ color: "#22c55e" }}>Aluno Prime Trainer</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <MiniStat label="Objetivos" value={`${doneObjetivos}/${objetivos.length}`} highlight={doneObjetivos > 0} />
        <MiniStat
          label={proximaAula?.data ? weekdayName(proximaAula.data) : "Próxima aula"}
          value={proximaAula?.data ? fmtDate(proximaAula.data) : "—"}
          highlight
        />
        <MiniStat label="Recados novos" value={String(unreadMsgs)} highlight={unreadMsgs > 0} danger={unreadMsgs > 0} />
      </div>

      <ObjetivosCard athleteId={athlete.id} initialObjetivos={objetivos} editable={false} />

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
          <ExtrasEditor athleteId={athlete.id} initialBlocos={blocos} editable={false} />
        ) : tab === "aulas" ? (
          <AulasEditor athleteId={athlete.id} initialAulas={aulas} editable={false} />
        ) : (
          <MovementTable
            key={tab}
            athleteId={athlete.id}
            categoria={tab}
            initialRows={movementRows.filter((r) => r.categoria === tab)}
            editable={false}
          />
        )}
      </div>

      <div className="mb-6">
        <MensagensPanel athleteId={athlete.id} athleteName={athlete.name} initialMensagens={mensagens} editable={false} />
      </div>

      <PagamentosTable initialPagamentos={pagamentos} cycleStart={athlete.cycle_start} cycleEnd={athlete.cycle_end} editable={false} />
    </div>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function MiniStat({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className="card px-3 py-3">
      <div className="font-extrabold text-xl leading-none mb-1" style={{ color: danger ? "#ef4444" : highlight ? "#d4af37" : "#ffffff" }}>
        {value}
      </div>
      <div className="text-[10.5px] font-extrabold uppercase" style={{ color: "#6c6c72" }}>{label}</div>
    </div>
  );
}
