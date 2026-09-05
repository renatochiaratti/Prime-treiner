"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Athlete, Objetivo, MovementRow, Aula, Mensagem, Pagamento, RcpExtra, RcpCheck } from "@/lib/types";
import ObjetivosCard from "@/components/ObjetivosCard";
import MovementTable from "@/components/MovementTable";
import RcpExtrasPanel from "@/components/RcpExtrasPanel";
import AulasEditor from "@/components/AulasEditor";
import MensagensPanel from "@/components/MensagensPanel";
import PagamentosTable from "@/components/PagamentosTable";

const MOV_TABS = [
  { key: "levantamentos", label: "Levantamentos" },
  { key: "ginasticas", label: "Ginásticas" },
  { key: "ciclicos", label: "Cíclicos" },
  { key: "benchmarks", label: "Benchmarks" },
] as const;
type MovTabKey = (typeof MOV_TABS)[number]["key"];
type Section = "movimentos" | "aulas" | "extras";

export default function AthleteEditorPage({ params }: { params: { athleteId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [movementRows, setMovementRows] = useState<MovementRow[]>([]);
  const [extras, setExtras] = useState<RcpExtra[]>([]);
  const [checks, setChecks] = useState<RcpCheck[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [section, setSection] = useState<Section>("movimentos");
  const [movTab, setMovTab] = useState<MovTabKey>("levantamentos");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/coach/login"); return; }

      const { data: a } = await supabase.from("athletes").select("*").eq("id", params.athleteId).single();
      if (!a) { router.replace("/coach/dashboard"); return; }
      setAthlete(a as Athlete);

      const [{ data: obj }, { data: mov }, { data: ex }, { data: ck }, { data: au }, { data: msg }, { data: pay }] = await Promise.all([
        supabase.from("objetivos").select("*").eq("athlete_id", params.athleteId).order("position"),
        supabase.from("movement_rows").select("*").eq("athlete_id", params.athleteId).order("position"),
        supabase.from("rcp_extras").select("*").eq("athlete_id", params.athleteId),
        supabase.from("rcp_checks").select("*").eq("athlete_id", params.athleteId),
        supabase.from("aulas").select("*").eq("athlete_id", params.athleteId).order("data"),
        supabase.from("mensagens").select("*").eq("athlete_id", params.athleteId).order("created_at", { ascending: false }),
        supabase.from("pagamentos").select("*").eq("athlete_id", params.athleteId).order("position", { ascending: true }),
      ]);

      setObjetivos((obj as Objetivo[]) || []);
      setMovementRows((mov as MovementRow[]) || []);
      setExtras((ex as RcpExtra[]) || []);
      setChecks((ck as RcpCheck[]) || []);
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

  async function broadcastCrossfitToAll(dia: string, texto: string) {
    const { data: allAthletes } = await supabase.from("athletes").select("id").neq("id", params.athleteId);
    if (!allAthletes) return;
    await Promise.all(
      (allAthletes as { id: string }[]).map(async (a) => {
        const { data: existing } = await supabase
          .from("rcp_extras")
          .select("id")
          .eq("athlete_id", a.id)
          .eq("dia", dia)
          .maybeSingle();
        if (existing) {
          await supabase.from("rcp_extras").update({ crossfit_texto: texto }).eq("id", existing.id);
        } else {
          await supabase.from("rcp_extras").insert({ athlete_id: a.id, dia, crossfit_texto: texto });
        }
      })
    );
  }

  if (loading || !athlete) {
    return <div className="app-shell flex items-center justify-center" style={{ minHeight: "100vh", color: "#9a9a9f" }}>Carregando...</div>;
  }

  const isRenato = athlete.name?.trim().toLowerCase() === "renato";

  return (
    <div className="app-shell px-5 py-5" style={{ paddingBottom: 60 }}>
      <button onClick={() => router.push("/coach/dashboard")} className="text-xs font-bold mb-3" style={{ color: "#6c6c72" }}>
        ‹ Todos os alunos
      </button>

      <div className="flex items-center gap-3 mb-4">
        <img
          src="/icons/icon-192.png"
          alt="Prime Trainer"
          className="rounded-full flex-shrink-0"
          style={{ width: 48, height: 48, objectFit: "cover" }}
        />
        <input
          defaultValue={athlete.name}
          onBlur={(e) => updateName(e.target.value)}
          className="bg-transparent border-none font-extrabold text-[21px]"
          style={{ color: "#d4af37" }}
        />
      </div>

      <button
        onClick={() => router.push(`/coach/rcp/${athlete.id}`)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl font-extrabold mb-5"
        style={{
          background: "#ccff00",
          color: "#0d1a00",
          padding: "11px 16px",
          fontSize: 13,
          letterSpacing: 0.3,
          boxShadow: "0 0 12px rgba(204,255,0,0.55), 0 0 0 2px rgba(204,255,0,0.2)",
          border: "none",
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>👑</span>
        MÉTODO RCP
      </button>

      <button onClick={copyShareLink} className="btn mb-5" style={{ padding: "6px 12px", fontSize: 12.5 }}>
        {copiedLink ? "✔ Link copiado!" : "🔗 Copiar link do aluno"}
      </button>

      <ObjetivosCard athleteId={athlete.id} initialObjetivos={objetivos} editable />

      <div className="mb-4 mt-5">
        <div className="grid grid-cols-2 gap-2.5 mb-3">
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
        </div>

        {section === "movimentos" && (
          <>
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
          </>
        )}

        {section === "aulas" && (
          <AulasEditor athleteId={athlete.id} initialAulas={aulas} editable />
        )}

        {section === "extras" && (
          <RcpExtrasPanel
            athleteId={athlete.id}
            initialExtras={extras}
            initialChecks={checks}
            editable
            onCrossfitSaved={isRenato ? broadcastCrossfitToAll : undefined}
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
