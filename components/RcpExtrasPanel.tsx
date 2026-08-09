"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RcpExtra } from "@/lib/types";

const DIAS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

export default function RcpExtrasPanel({
  athleteId,
  initialExtras,
  editable,
}: {
  athleteId: string;
  initialExtras: RcpExtra[];
  editable: boolean;
}) {
  const [extras, setExtras] = useState<RcpExtra[]>(initialExtras);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);

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
        .insert({ athlete_id: athleteId, dia, texto })
        .select()
        .single();
      if (data) setExtras((prev) => [...prev, data as RcpExtra]);
    }
  }

  return (
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
                background: selectedDia === d.key ? "rgba(34,197,94,0.14)" : "#18191c",
                color: selectedDia === d.key ? "#22c55e" : hasText ? "#22c55e" : "#9a9a9f",
                border: `1.5px solid ${selectedDia === d.key ? "rgba(34,197,94,0.4)" : hasText ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.09)"}`,
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {selectedDia ? (
        <div className="card p-4">
          <h3 className="font-extrabold text-[14px] mb-3" style={{ color: "#22c55e" }}>
            {DIAS.find((d) => d.key === selectedDia)?.label} · Atividades extras
          </h3>
          {editable ? (
            <textarea
              key={selectedDia}
              defaultValue={getExtra(selectedDia)?.texto || ""}
              onBlur={(e) => saveExtra(selectedDia, e.target.value)}
              rows={8}
              placeholder="Escreva aqui as atividades extras deste dia..."
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
            />
          ) : getExtra(selectedDia)?.texto ? (
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
          {editable ? "Clica em um dia da semana pra escrever as atividades extras." : "Toque em um dia da semana pra ver as atividades extras."}
        </div>
      )}
    </div>
  );
}
