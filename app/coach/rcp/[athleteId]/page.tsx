"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Athlete, RcpLoadTracking, RcpAssessment, RcpExtra, RcpTreinoBloco, RcpCustomExercicio, TreinadorRcpBloco } from "@/lib/types";
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

const GRUPO_TIPOS = ["superiores1", "inferiores1"];
const CUSTOM_SLOTS = [1, 2, 3, 4];

export default function RcpAthletePage({ params }: { params: { athleteId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loadRows, setLoadRows] = useState<RcpLoadTracking[]>([]);
  const [assessments, setAssessments] = useState<RcpAssessment[]>([]);
  const [extras, setExtras] = useState<RcpExtra[]>([]);
  const [customExercicios, setCustomExercicios] = useState<RcpCustomExercicio[]>([]);
  const [blocosMap, setBlocosMap] = useState<Record<string, RcpTreinoBloco>>({});
  const [tab, setTab] = useState<
    "programa" | "carga" | "avaliacao" | "extras" | "superiores1" | "inferiores1"
  >("carga");

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase.from("athletes").select("*").eq("id", params.athleteId).single();
      setAthlete((a as Athlete) || null);

      const { data: lt } = await supabase.from("rcp_load_tracking").select("*").eq("athlete_id", params.athleteId);
      setLoadRows((lt as RcpLoadTracking[]) || []);

      const { data: as_ } = await supabase.from("rcp_assessments").select("*").eq("athlete_id", params.athleteId);
      setAssessments((as_ as RcpAssessment[]) || []);

      const { data: ex } = await supabase.from("rcp_extras").select("*").eq("athlete_id", params.athleteId);
      setExtras((ex as RcpExtra[]) || []);

      const { data: ce } = await supabase.from("rcp_custom_exercicios").select("*").eq("athlete_id", params.athleteId);
      setCustomExercicios((ce as RcpCustomExercicio[]) || []);

      const { data: blocos } = await supabase.from("rcp_treino_blocos").select("*").eq("athlete_id", params.athleteId).in("tipo", GRUPO_TIPOS);
      const map: Record<string, RcpTreinoBloco> = {};
      ((blocos as RcpTreinoBloco[]) || []).forEach((b) => {
        map[b.tipo] = b;
      });
      setBlocosMap(map);

      setLoading(false);
    })();
  }, [params.athleteId]);

  async function saveCarga(exercicio: string, semana: number, carga: string) {
    const existing = loadRows.find((r) => r.exercicio === exercicio && r.semana === semana);
    if (existing) {
      setLoadRows((prev) => prev.map((r) => (r.id === existing.id ? { ...r, carga } : r)));
      await supabase.from("rcp_load_tracking").update({ carga }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("rcp_load_tracking")
        .insert({ athlete_id: params.athleteId, exercicio, semana, carga })
        .select()
        .single();
      if (data) setLoadRows((prev) => [...prev, data as RcpLoadTracking]);
    }
  }

  function getCarga(exercicio: string, semana: number) {
    return loadRows.find((r) => r.exercicio === exercicio && r.semana === semana)?.carga || "";
  }

  function getCustomNome(slot: number) {
    return customExercicios.find((c) => c.slot === slot)?.nome || "";
  }

  async function saveCustomNome(slot: number, nome: string) {
    const existing = customExercicios.find((c) => c.slot === slot);
    if (existing) {
      setCustomExercicios((prev) => prev.map((c) => (c.id === existing.id ? { ...c, nome } : c)));
      await supabase.from("rcp_custom_exercicios").update({ nome }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("rcp_custom_exercicios")
        .insert({ athlete_id: params.athleteId, slot, nome })
        .select()
        .single();
      if (data) setCustomExercicios((prev) => [...prev, data as RcpCustomExercicio]);
    }
  }

  function getAssessment(tipo: "D1" | "D90") {
    return assessments.find((a) => a.tipo === tipo);
  }

  async function saveAssessment(tipo: "D1" | "D90", field: "peso" | "massa_muscular" | "percentual_gordura" | "observacoes", value: string) {
    const existing = getAssessment(tipo);
    if (existing) {
      setAssessments((prev) => prev.map((a) => (a.id === existing.id ? { ...a, [field]: value } : a)));
      await supabase.from("rcp_assessments").update({ [field]: value }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("rcp_assessments")
        .insert({ athlete_id: params.athleteId, tipo, [field]: value })
        .select()
        .single();
      if (data) setAssessments((prev) => [...prev, data as RcpAssessment]);
    }
  }

  function getExtra(dia: string) {
    return extras.find((e) => e.dia === dia);
  }

  async function saveExtra(dia: string, texto: string) {
    const existing = getExtra(dia);
    if (existing) {
      setExtras((prev) => prev.map((e) => (e.id === existing.id ? { ...e, texto } : e)));
      await supabase.from("rcp_extras").update({ texto }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("rcp_extras")
        .insert({ athlete_id: params.athleteId, dia, texto })
        .select()
        .single();
      if (data) setExtras((prev) => [...prev, data as RcpExtra]);
    }
  }

  async function saveBloco(tipo: string, field: string, value: string) {
    const current = blocosMap[tipo];
    if (current) {
      const updated = { ...current, [field]: value } as RcpTreinoBloco;
      setBlocosMap((prev) => ({ ...prev, [tipo]: updated }));
      await supabase.from("rcp_treino_blocos").update({ [field]: value }).eq("id", current.id);
    } else {
      const { data } = await supabase
        .from("rcp_treino_blocos")
        .insert({ athlete_id: params.athleteId, tipo, [field]: value })
        .select()
        .single();
      if (data) setBlocosMap((prev) => ({ ...prev, [tipo]: data as RcpTreinoBloco }));
    }
  }

  const inputStyle = { background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" };

  function computeSemanaAtual(inicio: string | null | undefined): number {
    if (!inicio) return 1;
    const start = new Date(inicio + "T00:00:00");
    const hoje = new Date();
    const diffDias = Math.floor((hoje.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const semana = Math.floor(diffDias / 7) + 1;
    return Math.min(12, Math.max(1, semana));
  }

  async function autoPreencherSemana(dataInicio: string) {
    const semana = computeSemanaAtual(dataInicio);
    const { data: blocos } = await supabase
      .from("treinador_rcp_blocos")
      .select("*")
      .in("grupo", ["Superior", "Inferior"])
      .eq("semana", semana);
    if (!blocos) return;

    for (const b of blocos as TreinadorRcpBloco[]) {
      const tipo = b.grupo === "Superior" ? "superiores1" : "inferiores1";
      const campos = {
        b2_mov1: b.b1_mov1 || "", b2_peso1: b.b1_peso1 || "",
        b2_mov2: b.b1_mov2 || "", b2_peso2: b.b1_peso2 || "",
        b2_mov3: b.b1_mov3 || "", b2_peso3: b.b1_peso3 || "",
        b2_mov4: b.b1_mov4 || "", b2_peso4: b.b1_peso4 || "",
        b3_mov1: b.b2_mov1 || "", b3_peso1: b.b2_peso1 || "",
        b3_mov2: b.b2_mov2 || "", b3_peso2: b.b2_peso2 || "",
        b3_mov3: b.b2_mov3 || "", b3_peso3: b.b2_peso3 || "",
        b3_mov4: b.b2_mov4 || "", b3_peso4: b.b2_peso4 || "",
      };
      const current = blocosMap[tipo];
      if (current) {
        const updated = { ...current, ...campos } as RcpTreinoBloco;
        setBlocosMap((prev) => ({ ...prev, [tipo]: updated }));
        await supabase.from("rcp_treino_blocos").update(campos).eq("id", current.id);
      } else {
        const { data } = await supabase
          .from("rcp_treino_blocos")
          .insert({ athlete_id: params.athleteId, tipo, ...campos })
          .select()
          .single();
        if (data) setBlocosMap((prev) => ({ ...prev, [tipo]: data as RcpTreinoBloco }));
      }
    }
  }

  async function saveCicloInicio(dataStr: string) {
    setAthlete((prev) => (prev ? { ...prev, rcp_ciclo_inicio: dataStr } : prev));
    await supabase.from("athletes").update({ rcp_ciclo_inicio: dataStr || null }).eq("id", params.athleteId);
    if (dataStr) await autoPreencherSemana(dataStr);
  }

  if (loading || !athlete) {
    return <div className="app-shell flex items-center justify-center" style={{ minHeight: "100vh", color: "#9a9a9f" }}>Carregando...</div>;
  }

  function renderGrupoBlocos(tipo: string) {
    const b = blocosMap[tipo];
    return (
      <div className="flex flex-col gap-4">
        <div className="card p-4">
          <h3 className="font-extrabold text-[14px] mb-3" style={{ color: "#ccff00" }}>Bloco 1 · Força</h3>
          <div className="flex gap-2">
            <input
              placeholder="Movimento"
              defaultValue={b?.b1_movimento || ""}
              onBlur={(e) => saveBloco(tipo, "b1_movimento", e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg text-sm"
              style={inputStyle}
            />
            <input
              placeholder="Peso"
              defaultValue={b?.b1_peso || ""}
              onBlur={(e) => saveBloco(tipo, "b1_peso", e.target.value)}
              className="px-3 py-2.5 rounded-lg text-sm text-center"
              style={{ ...inputStyle, width: 90 }}
            />
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-extrabold text-[14px] mb-3" style={{ color: "#ccff00" }}>Bloco 2</h3>
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder={`Movimento ${i}`}
                  defaultValue={(b as any)?.[`b2_mov${i}`] || ""}
                  onBlur={(e) => saveBloco(tipo, `b2_mov${i}`, e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm"
                  style={inputStyle}
                />
                <input
                  placeholder="Peso"
                  defaultValue={(b as any)?.[`b2_peso${i}`] || ""}
                  onBlur={(e) => saveBloco(tipo, `b2_peso${i}`, e.target.value)}
                  className="px-3 py-2.5 rounded-lg text-sm text-center"
                  style={{ ...inputStyle, width: 90 }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-extrabold text-[14px] mb-3" style={{ color: "#ccff00" }}>Bloco 3</h3>
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder={`Movimento ${i}`}
                  defaultValue={(b as any)?.[`b3_mov${i}`] || ""}
                  onBlur={(e) => saveBloco(tipo, `b3_mov${i}`, e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm"
                  style={inputStyle}
                />
                <input
                  placeholder="Peso"
                  defaultValue={(b as any)?.[`b3_peso${i}`] || ""}
                  onBlur={(e) => saveBloco(tipo, `b3_peso${i}`, e.target.value)}
                  className="px-3 py-2.5 rounded-lg text-sm text-center"
                  style={{ ...inputStyle, width: 90 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell px-5 py-5" style={{ paddingBottom: 60 }}>
      <button onClick={() => router.push(`/coach/${athlete.id}`)} className="text-xs font-bold mb-3" style={{ color: "#6c6c72" }}>
        ‹ Voltar pro perfil
      </button>

      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: 30 }}>👑</span>
        <h1 className="text-white font-extrabold text-xl">Método RCP · {athlete.name}</h1>
      </div>

      <div className="card p-4 mb-5" style={{ border: "1.5px solid rgba(212,175,55,0.35)" }}>
        <label className="text-[11px] font-bold block mb-1" style={{ color: "#d4af37" }}>
          Data de início do ciclo (Semana 1)
        </label>
        <input
          type="date"
          defaultValue={athlete.rcp_ciclo_inicio || ""}
          onBlur={(e) => saveCicloInicio(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm font-bold mb-2"
          style={inputStyle}
        />
        {athlete.rcp_ciclo_inicio && (
          <div className="text-[12px]" style={{ color: "#9a9a9f" }}>
            Semana atual: <b style={{ color: "#22c55e" }}>{computeSemanaAtual(athlete.rcp_ciclo_inicio)}</b> — abas Superiores e Inferiores preenchidas automaticamente com essa semana da biblioteca.
          </div>
        )}
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-0.5" style={{ borderBottom: "2px solid rgba(255,255,255,0.09)" }}>
        {[
          { key: "carga", label: "Carga Semanal" },
          { key: "avaliacao", label: "Avaliação D1/D90" },
          { key: "programa", label: "Programa (12 sem)" },
          { key: "extras", label: "Extras" },
          { key: "superiores1", label: "Superiores" },
          { key: "inferiores1", label: "Inferiores" },
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
        <div className="flex flex-col gap-4">
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
                        <td key={w.semana} className="text-center px-1 py-1">
                          <input
                            defaultValue={getCarga(ex, w.semana)}
                            onBlur={(e) => saveCarga(ex, w.semana, e.target.value)}
                            placeholder="—"
                            className="text-center font-mono font-bold text-[13px] bg-transparent border-none"
                            style={{ width: 44, color: "#f2f2f0" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
                  {CUSTOM_SLOTS.map((slot, i) => (
                    <tr key={slot} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.09)" }}>
                      <td className="px-2 py-2">
                        <input
                          defaultValue={getCustomNome(slot)}
                          onBlur={(e) => saveCustomNome(slot, e.target.value)}
                          placeholder={`Exercício ${slot}`}
                          className="w-full bg-transparent border-none font-bold text-[13.5px]"
                          style={{ color: "#f2f2f0", minWidth: 110 }}
                        />
                      </td>
                      {RCP_WEEKS.map((w) => (
                        <td key={w.semana} className="text-center px-1 py-1">
                          <input
                            defaultValue={getCarga(`custom_${slot}`, w.semana)}
                            onBlur={(e) => saveCarga(`custom_${slot}`, w.semana, e.target.value)}
                            placeholder="—"
                            className="text-center font-mono font-bold text-[13px] bg-transparent border-none"
                            style={{ width: 44, color: "#f2f2f0" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    <label className="text-[11px] font-bold block mb-1" style={{ color: "#6c6c72" }}>Peso (kg)</label>
                    <input
                      defaultValue={a?.peso || ""}
                      onBlur={(e) => saveAssessment(tipo, "peso", e.target.value)}
                      className="w-full px-2 py-2 rounded-lg text-sm font-bold text-center"
                      style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1" style={{ color: "#6c6c72" }}>Massa Muscular (kg)</label>
                    <input
                      defaultValue={a?.massa_muscular || ""}
                      onBlur={(e) => saveAssessment(tipo, "massa_muscular", e.target.value)}
                      className="w-full px-2 py-2 rounded-lg text-sm font-bold text-center"
                      style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1" style={{ color: "#6c6c72" }}>% Gordura</label>
                    <input
                      defaultValue={a?.percentual_gordura || ""}
                      onBlur={(e) => saveAssessment(tipo, "percentual_gordura", e.target.value)}
                      className="w-full px-2 py-2 rounded-lg text-sm font-bold text-center"
                      style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
                    />
                  </div>
                </div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: "#6c6c72" }}>Observações</label>
                <textarea
                  defaultValue={a?.observacoes || ""}
                  onBlur={(e) => saveAssessment(tipo, "observacoes", e.target.value)}
                  rows={2}
                  className="w-full px-2 py-2 rounded-lg text-sm"
                  style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
                />
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
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
          {DIAS.map((d) => (
            <div key={d.key} className="card p-3" style={{ flex: "0 0 220px" }}>
              <h3 className="font-extrabold text-[13px] mb-2" style={{ color: "#ccff00" }}>{d.label}</h3>
              <textarea
                defaultValue={getExtra(d.key)?.texto || ""}
                onBlur={(e) => saveExtra(d.key, e.target.value)}
                rows={21}
                placeholder="Escreva aqui as atividades extras deste dia..."
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
              />
            </div>
          ))}
        </div>
      )}

      {tab === "superiores1" && renderGrupoBlocos("superiores1")}
      {tab === "inferiores1" && renderGrupoBlocos("inferiores1")}
    </div>
  );
}
