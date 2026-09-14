"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Athlete, Objetivo, MovementRow, Aula, Pagamento, RcpExtra, RcpCheck, AthleteFortalecimento } from "@/lib/types";
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
type Section = "objetivos" | "movimentos" | "aulas" | "extras" | "plano" | "fortalecimentos";
const EX_SLOTS = [1, 2, 3, 4, 5, 6];

export default function AthleteEditorPage({ params }: { params: { athleteId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [movementRows, setMovementRows] = useState<MovementRow[]>([]);
  const [extras, setExtras] = useState<RcpExtra[]>([]);
  const [checks, setChecks] = useState<RcpCheck[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [fortalecimentos, setFortalecimentos] = useState<AthleteFortalecimento[]>([]);
  const [section, setSection] = useState<Section | null>(null);
  const [movTab, setMovTab] = useState<MovTabKey>("levantamentos");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/coach/login"); return; }

      const { data: a } = await supabase.from("athletes").select("*").eq("id", params.athleteId).single();
      if (!a) { router.replace("/coach/dashboard"); return; }
      setAthlete(a as Athlete);

      const [{ data: obj }, { data: mov }, { data: ex }, { data: ck }, { data: au }, { data: pay }, { data: fort }] = await Promise.all([
        supabase.from("objetivos").select("*").eq("athlete_id", params.athleteId).order("position"),
        supabase.from("movement_rows").select("*").eq("athlete_id", params.athleteId).order("position"),
        supabase.from("rcp_extras").select("*").eq("athlete_id", params.athleteId),
        supabase.from("rcp_checks").select("*").eq("athlete_id", params.athleteId),
        supabase.from("aulas").select("*").eq("athlete_id", params.athleteId).order("data"),
        supabase.from("pagamentos").select("*").eq("athlete_id", params.athleteId).order("position", { ascending: true }),
        supabase.from("athlete_fortalecimentos").select("*").eq("athlete_id", params.athleteId).order("position"),
      ]);

      setObjetivos((obj as Objetivo[]) || []);
      setMovementRows((mov as MovementRow[]) || []);
      setExtras((ex as RcpExtra[]) || []);
      setChecks((ck as RcpCheck[]) || []);
      setAulas((au as Aula[]) || []);
      setPagamentos((pay as Pagamento[]) || []);
      setFortalecimentos((fort as AthleteFortalecimento[]) || []);
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

  async function updateFortalecimentoField(f: AthleteFortalecimento, campo: string, valor: string) {
    setFortalecimentos((prev) => prev.map((x) => (x.id === f.id ? { ...x, [campo]: valor } : x)));
    await supabase.from("athlete_fortalecimentos").update({ [campo]: valor }).eq("id", f.id);
  }

  if (loading || !athlete) {
    return <div className="app-shell flex items-center justify-center" style={{ minHeight: "100vh", color: "#9a9a9f" }}>Carregando...</div>;
  }

  const isRenato = athlete.name?.trim().toLowerCase() === "renato";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const pagamentoAtrasado = pagamentos.some((p) => p.status === "pendente" && p.vencimento && new Date(p.vencimento) < hoje);
  const inputStyle = { background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" };

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

      <button onClick={copyShareLink} className="btn mb-5" style={{ padding: "6px 12px", fontSize: 12.5 }}>
        {copiedLink ? "✔ Link copiado!" : "🔗 Copiar link do aluno"}
      </button>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <button
          onClick={() => setSection("movimentos")}
          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-end text-center px-3 py-2.5"
          style={{
            height: 92,
            border: `1.5px solid ${section === "movimentos" ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.09)"}`,
          }}
        >
          <img
            src="/images/movimentos-bg.jpg"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
          <div style={{ position: "relative", color: "#fff", fontWeight: 800, fontSize: 14 }}>Movimentos</div>
        </button>

        <button
          onClick={() => setSection("fortalecimentos")}
          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-end text-center px-3 py-2.5"
          style={{
            height: 92,
            border: `1.5px solid ${section === "fortalecimentos" ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.09)"}`,
          }}
        >
          <img
            src="/images/fortalecimentos-bg.jpg"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
          <div style={{ position: "relative", color: "#f97316", fontWeight: 800, fontSize: 14 }}>Fortalecimentos</div>
        </button>

        <button
          onClick={() => setSection("objetivos")}
          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-end text-center px-3 py-2.5"
          style={{
            height: 92,
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
          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-end text-center px-3 py-2.5"
          style={{
            height: 92,
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
          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-end text-center px-3 py-2.5"
          style={{
            height: 92,
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
          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-end text-center px-3 py-2.5"
          style={{
            height: 92,
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

      {section === "objetivos" && (
        <div className="mb-4">
          <ObjetivosCard athleteId={athlete.id} initialObjetivos={objetivos} editable />
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
          <AulasEditor athleteId={athlete.id} initialAulas={aulas} editable />
        </div>
      )}

      {section === "extras" && (
        <div className="mb-4">
          <RcpExtrasPanel
            athleteId={athlete.id}
            initialExtras={extras}
            initialChecks={checks}
            editable
            onCrossfitSaved={isRenato ? broadcastCrossfitToAll : undefined}
          />
        </div>
      )}

      {section === "fortalecimentos" && (
        <div className="mb-4">
          <div className="text-[11px] mb-3" style={{ color: "#6c6c72" }}>
            Vêm automaticamente da sua biblioteca (Treinador). Edite aqui só se quiser personalizar pra esse aluno.
          </div>
          {fortalecimentos.length === 0 && (
            <div className="text-center text-sm py-8" style={{ color: "#6c6c72" }}>
              Nenhum fortalecimento ainda. Adicione na sua biblioteca (Treinador) que aparece aqui automaticamente.
            </div>
          )}
          <div className="flex flex-col gap-3">
            {fortalecimentos.map((f) => (
              <div key={f.id} className="card p-4">
                <h3 className="font-extrabold text-[15px] mb-3" style={{ color: "#f97316" }}>{f.titulo}</h3>
                <input
                  defaultValue={f.descricao || ""}
                  onBlur={(e) => updateFortalecimentoField(f, "descricao", e.target.value)}
                  placeholder="Sobre o que é esse fortalecimento..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm mb-3"
                  style={inputStyle}
                />
                <div className="flex flex-col gap-2">
                  {EX_SLOTS.map((n) => (
                    <div key={n} className="p-3 rounded-lg" style={{ background: "#101012", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex gap-2 mb-2">
                        <input
                          placeholder="Séries x Reps"
                          defaultValue={(f as any)[`ex${n}_sr`] || ""}
                          onBlur={(e) => updateFortalecimentoField(f, `ex${n}_sr`, e.target.value)}
                          className="px-2 py-2 rounded-md text-xs text-center flex-shrink-0"
                          style={{ ...inputStyle, width: 96 }}
                        />
                        <input
                          placeholder={`Movimento ${n}`}
                          defaultValue={(f as any)[`ex${n}_mov`] || ""}
                          onBlur={(e) => updateFortalecimentoField(f, `ex${n}_mov`, e.target.value)}
                          className="flex-1 px-3 py-2 rounded-md text-sm"
                          style={inputStyle}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[11px] font-extrabold" style={{ color: "#9a9a9f" }}>REST</span>
                        <input
                          placeholder="0:00"
                          defaultValue={(f as any)[`ex${n}_rest`] || ""}
                          onBlur={(e) => updateFortalecimentoField(f, `ex${n}_rest`, e.target.value)}
                          className="px-2 py-2 rounded-md text-xs text-center"
                          style={{ ...inputStyle, width: 80 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "plano" && (
        <div className="mb-4">
          <PagamentosTable initialPagamentos={pagamentos} cycleStart={athlete.cycle_start} cycleEnd={athlete.cycle_end} editable />
        </div>
      )}
    </div>
  );
}
