"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { weekdayName } from "@/lib/movementLibrary";
import type { Athlete, Objetivo, MovementRow, Aula, Pagamento, RcpExtra, RcpCheck } from "@/lib/types";
import ObjetivosCard from "@/components/ObjetivosCard";
import MovementTable from "@/components/MovementTable";
import RcpExtrasPanel from "@/components/RcpExtrasPanel";
import AulasEditor from "@/components/AulasEditor";
import PagamentosTable from "@/components/PagamentosTable";

const MOV_TABS = [
  { key: "levantamentos", label: "Levantamentos" },
  { key: "ginasticas", label: "Ginásticas" },
  { key: "ciclicos", label: "Cíclicos" },
  { key: "benchmarks", label: "Benchmarks" },
] as const;
type MovTabKey = (typeof MOV_TABS)[number]["key"];
type Section = "objetivos" | "movimentos" | "aulas" | "extras" | "plano";

export default function AthletePublicPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [movementRows, setMovementRows] = useState<MovementRow[]>([]);
  const [extras, setExtras] = useState<RcpExtra[]>([]);
  const [checks, setChecks] = useState<RcpCheck[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [section, setSection] = useState<Section | null>(null);
  const [movTab, setMovTab] = useState<MovTabKey>("levantamentos");

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase.from("athletes").select("*").eq("share_token", params.token).single();
      if (!a) { setNotFound(true); setLoading(false); return; }
      setAthlete(a as Athlete);

      const [{ data: obj }, { data: mov }, { data: ex }, { data: ck }, { data: au }, { data: pay }] = await Promise.all([
        supabase.from("objetivos").select("*").eq("athlete_id", a.id).order("position"),
        supabase.from("movement_rows").select("*").eq("athlete_id", a.id).order("position"),
        supabase.from("rcp_extras").select("*").eq("athlete_id", a.id),
        supabase.from("rcp_checks").select("*").eq("athlete_id", a.id),
        supabase.from("aulas").select("*").eq("athlete_id", a.id).order("data"),
        supabase.from("pagamentos").select("*").eq("athlete_id", a.id),
      ]);

      setObjetivos((obj as Objetivo[]) || []);
      setMovementRows((mov as MovementRow[]) || []);
      setExtras((ex as RcpExtra[]) || []);
      setChecks((ck as RcpCheck[]) || []);
      setAulas((au as Aula[]) || []);
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
  const doneObjetivos = objetivos.filter((o) => o.done).length;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const pagamentoAtrasado = pagamentos.some((p) => p.status === "pendente" && p.vencimento && new Date(p.vencimento) < hoje);

  return (
    <div className="app-shell px-5 py-5" style={{ paddingBottom: 60 }}>
      <div className="flex items-center gap-3 mb-4">
        <img
          src="/icons/icon-192.png"
          alt="Prime Trainer"
          className="rounded-full flex-shrink-0"
          style={{ width: 48, height: 48, objectFit: "cover" }}
        />
        <div className="font-extrabold text-[19px] text-white leading-tight">{athlete.name}</div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <MiniStat label="Objetivos" value={`${doneObjetivos}/${objetivos.length}`} highlight={doneObjetivos > 0} />
        <MiniStat
          label={proximaAula?.data ? weekdayName(proximaAula.data) : "Próxima aula"}
          value={proximaAula?.data ? fmtDate(proximaAula.data) : "—"}
          highlight
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <button
          onClick={() => setSection("movimentos")}
          className="relative rounded-2xl overflow-hidden"
          style={{
            gridColumn: "1 / span 2",
            height: 112,
            border: `1.5px solid ${section === "movimentos" ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.09)"}`,
          }}
        >
          <img
            src="/images/movimentos-bg.jpg"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
          <div style={{ position: "absolute", bottom: 10, left: 14, color: "#fff", fontWeight: 800, fontSize: 16 }}>Movimentos</div>
          <div style={{ position: "absolute", bottom: 10, right: 14, color: "rgba(255,255,255,0.75)", fontSize: 10.5, textAlign: "right", maxWidth: 140 }}>
            Levantamentos · Ginásticas · Cíclicos · Benchmarks
          </div>
        </button>

        <button
          onClick={() => setSection("objetivos")}
          className="relative rounded-2xl overflow-hidden flex flex-col justify-end px-3 py-2.5"
          style={{
            height: 82,
            border: `1.5px solid ${section === "objetivos" ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.09)"}`,
          }}
        >
          <img
            src="/images/objetivos-bg.jpg"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
          <div style={{ position: "relative", color: "#a78bfa", fontWeight: 800, fontSize: 12.5 }}>Objetivos</div>
        </button>

        <button
          onClick={() => setSection("aulas")}
          className="relative rounded-2xl overflow-hidden flex flex-col justify-end px-3 py-2.5"
          style={{
            height: 82,
            border: `1.5px solid ${section === "aulas" ? "rgba(212,175,55,0.6)" : "rgba(255,255,255,0.09)"}`,
          }}
        >
          <img
            src="/images/aulas-bg.jpg"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
          <div style={{ position: "relative", color: "#d4af37", fontWeight: 800, fontSize: 12.5 }}>Aulas marcadas</div>
        </button>

        <button
          onClick={() => setSection("extras")}
          className="relative rounded-2xl overflow-hidden flex flex-col justify-end px-3 py-2.5"
          style={{
            height: 82,
            border: `1.5px solid ${section === "extras" ? "rgba(34,197,94,0.6)" : "rgba(255,255,255,0.09)"}`,
          }}
        >
          <img
            src="/images/extras-bg.jpg"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
          <div style={{ position: "relative", color: "#22c55e", fontWeight: 800, fontSize: 12.5 }}>Extras</div>
        </button>

        <button
          onClick={() => setSection("plano")}
          className="relative rounded-2xl overflow-hidden flex flex-col justify-end px-3 py-2.5"
          style={{
            height: 82,
            border: `1.5px solid ${section === "plano" ? "rgba(45,212,191,0.6)" : "rgba(255,255,255,0.09)"}`,
          }}
        >
          <img
            src="/images/plano-bg.jpg"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
          {pagamentoAtrasado && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(239,68,68,0.4)" }} />
          )}
          <div style={{ position: "relative", color: "#2dd4bf", fontWeight: 800, fontSize: 12.5 }}>Meu Plano</div>
        </button>
      </div>

      <button
        onClick={() => router.push(`/a/${athlete.share_token}/rcp`)}
        className="w-full rounded-2xl flex flex-col items-center justify-center mb-4"
        style={{
          height: 106,
          background: "#0a0a0a",
          border: "1.5px solid rgba(212,175,55,0.35)",
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 300, letterSpacing: 7, color: "#ffffff" }}>RCP</div>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 1.5, color: "#d4af37", marginTop: 6, textTransform: "uppercase" }}>
          Ressignificar · Começar · Persistir
        </div>
      </button>

      {section === "objetivos" && (
        <div className="mb-4">
          <ObjetivosCard athleteId={athlete.id} initialObjetivos={objetivos} editable={false} />
        </div>
      )}

      {section === "movimentos" && (
        <div className="mb-4">
          <div className="flex gap-1.5 overflow-x-auto mb-4 pb-0.5" style={{ borderBottom: "2px solid rgba(255,255,255,0.09)" }}>
            {MOV_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setMovTab(t.key)}
                className="flex-shrink-0 px-4 py-2.5 text-[13px] font-extrabold rounded-full"
                style={{
                  background: movTab === t.key ? "rgba(59,130,246,0.14)" : "#18191c",
                  color: movTab === t.key ? "#3b82f6" : "#9a9a9f",
                  border: `1px solid ${movTab === t.key ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.09)"}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <MovementTable
            key={movTab}
            athleteId={athlete.id}
            categoria={movTab}
            initialRows={movementRows.filter((r) => r.categoria === movTab)}
            editable
          />
        </div>
      )}

      {section === "aulas" && (
        <div className="mb-4">
          <AulasEditor athleteId={athlete.id} initialAulas={aulas} editable={false} />
        </div>
      )}

      {section === "extras" && (
        <div className="mb-4">
          <RcpExtrasPanel athleteId={athlete.id} initialExtras={extras} initialChecks={checks} editable={false} />
        </div>
      )}

      {section === "plano" && (
        <div className="mb-4">
          <PagamentosTable initialPagamentos={pagamentos} cycleStart={athlete.cycle_start} cycleEnd={athlete.cycle_end} editable={false} />
        </div>
      )}
    </div>
  );
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card px-3 py-3">
      <div className="font-extrabold text-xl leading-none mb-1" style={{ color: highlight ? "#d4af37" : "#ffffff" }}>
        {value}
      </div>
      <div className="text-[10.5px] font-extrabold uppercase" style={{ color: "#6c6c72" }}>{label}</div>
    </div>
  );
}
