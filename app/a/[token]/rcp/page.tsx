"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Athlete, RcpLoadTracking, RcpAssessment, RcpExtra } from "@/lib/types";
import { RCP_WEEKS, RCP_EXERCICIOS_CARGA } from "@/lib/rcpProgram";

const DIAS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

export default function RcpPublicPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loadRows, setLoadRows] = useState<RcpLoadTracking[]>([]);
  const [assessments, setAssessments] = useState<RcpAssessment[]>([]);
  const [extras, setExtras] = useState<RcpExtra[]>([]);
  const [tab, setTab] = useState<"carga" | "avaliacao" | "programa" | "extras">("carga");
  const [selectedDia, setSelectedDia] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase.from("athletes").select("*").eq("share_token", params.token).single();
      if (!a) { setNotFound(true); setLoading(false); return; }
      setAthlete(a as Athlete);

      const { data: lt } = await supabase.from("rcp_load_tracking").select("*").eq("athlete_id", a.id);
      setLoadRows((lt as RcpLoadTracking[]) || []);

      const { data: as_ } = await supabase.from("rcp_assessments").select("*").eq("athlete_id", a.id);
      setAssessments((as_ as RcpAssessment[]) || []);

      const { data: ex } = await supabase.from("rcp_extras").select("*").eq("athlete_id", a.id);
      setExtras((ex as RcpExtra[]) || []);

      setLoading(false);
    })();
  }, [params.token]);

  function getCarga(exercicio: string, semana: number) {
    return loadRows.find((r) => r.exercicio === exercicio && r.semana === semana)?.carga || "";
  }

  function getAssessment(tipo: "D1" | "D90") {
    return assessments.find((a) => a.tipo === tipo);
  }

  function getExtra(dia: string) {
    return extras.find((e) => e.dia === dia);
  }

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

  return (
    <div className="app-shell px-5 py-5" style={{ paddingBottom: 60 }}>
      <div className="flex items-center gap-2 mb-6">
        <span style={{ fontSize: 22 }}>👑</span>
        <h1 className="text-white font-extrabold text-lg">Método RCP · {athlete.name}</h1>
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-0.5" style={{ borderBottom: "2px solid rgba(255,255,255,0.09)" }}>
        {[
          { key: "carga", label: "Carga Semanal" },
          { key: "avaliacao", label: "Avaliação D1/D90" },
          { key: "programa", label: "Programa (12 sem)" },
          { key: "extras", label: "Extras" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className="flex-shrink-0 px-4 py-2.5 text-[13px] font-extrabold rounded-full"
            style={{
              background: tab === t.key ? "rgba(204,255,0,0.14)" : "#18191c",
              color: tab === t.key ? "#ccff00" : "#9a9a9f",
              border: `1px solid ${tab === t.key ? "rgba(204,255,0,0.35)" : "rgba(255,255,255,0.09)"}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "carga" && (
        <div className="card overflow-hidden">
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-[11px] uppercase font-extrabold" style={{ color: "#6c6c72", background: "#1f2024" }}>Exercício</th>
                  {RCP_WEEKS.map((w) => (
                    <th key={w.semana} className="text-center px-2 py-2 text-[11px] font-extrabold" style={{ color: "#6c6c72", background: "#1f2024" }}>
                      S{w.semana}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RCP_EXERCICIOS_CARGA.map((ex, i) => (
                  <tr key={ex} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.09)" }}>
                    <td className="px-3 py-2 font-bold text-[13.5px]" style={{ color: "#f2f2f0" }}>{ex}</td>
                    {RCP_WEEKS.map((w) => (
                      <td key={w.semana} className="text-center px-1 py-1 font-mono font-bold text-[13px]" style={{ color: "#f2f2f0" }}>
                        {getCarga(ex, w.semana) || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "avaliacao" && (
        <div className="flex flex-col gap-4">
          {(["D1", "D90"] as const).map((tipo) => {
            const a = getAssessment(tipo);
            return (
              <div key={tipo} className="card p-4">
                <h3 className="font-extrabold text-[15px] mb-3" style={{ color: tipo === "D1" ? "#d4af37" : "#22c55e" }}>
                  {tipo === "D1" ? "Avaliação Inicial · Dia 1" : "Avaliação Final · Dia 90"}
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-[11px] font-bold mb-1" style={{ color: "#6c6c72" }}>Peso (kg)</div>
                    <div className="font-bold text-[14px]" style={{ color: "#f2f2f0" }}>{a?.peso || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold mb-1" style={{ color: "#6c6c72" }}>Massa Muscular</div>
                    <div className="font-bold text-[14px]" style={{ color: "#f2f2f0" }}>{a?.massa_muscular || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold mb-1" style={{ color: "#6c6c72" }}>% Gordura</div>
                    <div className="font-bold text-[14px]" style={{ color: "#f2f2f0" }}>{a?.percentual_gordura || "—"}</div>
                  </div>
                </div>
                {a?.observacoes && (
                  <div>
                    <div className="text-[11px] font-bold mb-1" style={{ color: "#6c6c72" }}>Observações</div>
                    <div className="text-[13px]" style={{ color: "#9a9a9f" }}>{a.observacoes}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "programa" && (
        <div className="card overflow-hidden">
          {RCP_WEEKS.map((w, i) => (
            <div key={w.semana} className="px-4 py-3" style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.09)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-[14px]" style={{ color: "#ccff00" }}>Semana {w.semana}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.14)", color: "#d4af37" }}>{w.fase}</span>
              </div>
              <div className="text-[12.5px] mb-1" style={{ color: "#9a9a9f" }}>{w.seriesReps} · RPE {w.rpe}</div>
              <div className="text-[12.5px]" style={{ color: "#6c6c72" }}>{w.foco}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "extras" && (
        <div>
          <div className="grid grid-cols-4 gap-2 mb-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {DIAS.map((d) => {
              const hasText = !!getExtra(d.key)?.texto;
              return (
                <button
                  key={d.key}
                  onClick={() => setSelectedDia(d.key)}
                  className="py-3 rounded-xl text-[12.5px] font-extrabold"
                  style={{
                    background: selectedDia === d.key ? "rgba(204,255,0,0.14)" : "#18191c",
                    color: selectedDia === d.key ? "#ccff00" : hasText ? "#22c55e" : "#9a9a9f",
                    border: `1.5px solid ${selectedDia === d.key ? "rgba(204,255,0,0.4)" : hasText ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.09)"}`,
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {selectedDia ? (
            <div className="card p-4">
              <h3 className="font-extrabold text-[14px] mb-3" style={{ color: "#ccff00" }}>
                {DIAS.find((d) => d.key === selectedDia)?.label} · Atividades extras
              </h3>
              {getExtra(selectedDia)?.texto ? (
                <div className="text-sm whitespace-pre-wrap" style={{ color: "#f2f2f0" }}>
                  {getExtra(selectedDia)?.texto}
                </div>
              ) : (
                <div className="text-sm" style={{ color: "#6c6c72" }}>
                  Nenhuma atividade extra registrada para este dia.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm py-8" style={{ color: "#6c6c72" }}>
              Toque em um dia da semana pra ver as atividades extras.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
