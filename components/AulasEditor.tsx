"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { weekdayName } from "@/lib/movementLibrary";
import type { Aula } from "@/lib/types";

const NEXT_STATUS: Record<Aula["status"], Aula["status"]> = {
  marcada: "dada",
  dada: "falta",
  falta: "marcada",
};
const STATUS_LABEL: Record<Aula["status"], string> = { marcada: "Marcada", dada: "Dada", falta: "Falta" };

export default function AulasEditor({
  athleteId,
  initialAulas,
  editable,
}: {
  athleteId: string;
  initialAulas: Aula[];
  editable: boolean;
}) {
  const [aulas, setAulas] = useState<Aula[]>(initialAulas);

  const dadas = aulas.filter((a) => a.status === "dada").length;
  const marcadas = aulas.filter((a) => a.status === "marcada").length;
  const faltas = aulas.filter((a) => a.status === "falta").length;

  async function updateField(aula: Aula, field: "data" | "hora" | "observacao", value: string) {
    setAulas((prev) => prev.map((a) => (a.id === aula.id ? { ...a, [field]: value } : a)));
    await supabase.from("aulas").update({ [field]: value || null }).eq("id", aula.id);
  }

  async function cycleStatus(aula: Aula) {
    const status = NEXT_STATUS[aula.status];
    setAulas((prev) => prev.map((a) => (a.id === aula.id ? { ...a, status } : a)));
    await supabase.from("aulas").update({ status }).eq("id", aula.id);
  }

  async function removeAula(aula: Aula) {
    setAulas((prev) => prev.filter((a) => a.id !== aula.id));
    await supabase.from("aulas").delete().eq("id", aula.id);
  }

  async function addAula() {
    const { data } = await supabase
      .from("aulas")
      .insert({ athlete_id: athleteId, status: "marcada" })
      .select()
      .single();
    if (data) setAulas((prev) => [...prev, data as Aula]);
  }

  return (
    <div>
      <div className="flex gap-2.5 mb-3.5">
        <StatCard label="Dadas" value={dadas} color="#22c55e" />
        <StatCard label="Marcadas" value={marcadas} color="#d4af37" />
        <StatCard label="Faltas" value={faltas} color="#ef4444" />
      </div>

      <div className="card overflow-hidden" style={{ overflowX: "auto" }}>
        <div
          className="grid items-center gap-2 px-3.5 pt-3 pb-1.5 text-[10px] uppercase font-extrabold"
          style={{ gridTemplateColumns: "60px 76px 62px 82px 1fr 20px", color: "#6c6c72", background: "#1f2024", borderBottom: "1px solid rgba(255,255,255,0.09)", minWidth: 480 }}
        >
          <span>Data</span><span>Dia</span><span>Horário</span><span>Status</span><span>Observação</span><span />
        </div>
        {aulas.length === 0 && (
          <div className="p-4 text-sm font-bold" style={{ color: "#6c6c72" }}>Nenhuma aula registrada ainda.</div>
        )}
        {aulas.map((aula) => (
          <div
            key={aula.id}
            className="grid items-center gap-2 px-3.5 py-2.5 text-[13.5px]"
            style={{ gridTemplateColumns: "60px 76px 62px 82px 1fr 20px", borderTop: "1px solid rgba(255,255,255,0.09)", minWidth: 480 }}
          >
            <input
              type="date"
              value={aula.data || ""}
              disabled={!editable}
              onChange={(e) => updateField(aula, "data", e.target.value)}
              className="bg-transparent border-none font-bold text-[12px]"
              style={{ color: "#f2f2f0", colorScheme: "dark" }}
            />
            <span className="font-extrabold text-[12.5px]" style={{ color: "#d4af37" }}>{weekdayName(aula.data) || "—"}</span>
            <input
              type="time"
              value={aula.hora || ""}
              disabled={!editable}
              onChange={(e) => updateField(aula, "hora", e.target.value)}
              className="bg-transparent border-none font-bold text-[12px]"
              style={{ color: "#f2f2f0", colorScheme: "dark" }}
            />
            <button onClick={() => editable && cycleStatus(aula)} className={`status-pill ${aula.status}`} style={{ cursor: editable ? "pointer" : "default" }}>
              {STATUS_LABEL[aula.status]}
            </button>
            <input
              value={aula.observacao || ""}
              disabled={!editable}
              placeholder="Observação"
              onChange={(e) => setAulas((prev) => prev.map((a) => (a.id === aula.id ? { ...a, observacao: e.target.value } : a)))}
              onBlur={(e) => updateField(aula, "observacao", e.target.value)}
              className="bg-transparent border-none text-[13px] font-semibold"
              style={{ color: "#f2f2f0" }}
            />
            {editable ? (
              <span onClick={() => removeAula(aula)} className="text-xs cursor-pointer text-right" style={{ color: "#6c6c72" }}>✕</span>
            ) : <span />}
          </div>
        ))}
      </div>

      {editable && (
        <>
          <button onClick={addAula} className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ border: "1.5px dashed rgba(255,255,255,0.16)", color: "#9a9a9f" }}>
            + Agendar aula
          </button>
          <p className="text-[13px] mt-3" style={{ color: "#9a9a9f" }}>
            Clique no status para alternar Marcada → Dada → Falta. O dia da semana é calculado automaticamente a partir da data.
          </p>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card flex-1 px-3.5 py-3">
      <div className="font-extrabold text-2xl leading-none mb-1" style={{ color }}>{value}</div>
      <div className="text-[10.5px] font-extrabold uppercase tracking-wide" style={{ color: "#6c6c72" }}>{label}</div>
    </div>
  );
}
