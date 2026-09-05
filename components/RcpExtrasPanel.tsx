"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RcpExtra, RcpCheck } from "@/lib/types";

const DIAS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

type Status = "amarelo" | "verde" | "vermelho";

const NEXT: Record<Status, Status> = {
  amarelo: "verde",
  verde: "vermelho",
  vermelho: "amarelo",
};

const STATUS_COLOR: Record<Status, string> = {
  amarelo: "#eab308",
  verde: "#22c55e",
  vermelho: "#ef4444",
};

export default function RcpExtrasPanel({
  athleteId,
  initialExtras,
  initialChecks,
  editable,
  onCrossfitSaved,
}: {
  athleteId: string;
  initialExtras: RcpExtra[];
  initialChecks: RcpCheck[];
  editable: boolean;
  onCrossfitSaved?: (dia: string, texto: string) => void;
}) {
  const [extras, setExtras] = useState<RcpExtra[]>(initialExtras);
  const [checks, setChecks] = useState<RcpCheck[]>(initialChecks);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);

  function getExtra(dia: string) {
    return extras.find((e) => e.dia === dia);
  }

  async function saveField(dia: string, field: "texto" | "crossfit_texto", value: string) {
    const existing = getExtra(dia);
    if (existing) {
      setExtras((prev) => prev.map((e) => (e.id === existing.id ? { ...e, [field]: value } : e)));
      await supabase.from("rcp_extras").update({ [field]: value }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("rcp_extras")
        .insert({ athlete_id: athleteId, dia, [field]: value })
        .select()
        .single();
      if (data) setExtras((prev) => [...prev, data as RcpExtra]);
    }
    if (field === "crossfit_texto" && onCrossfitSaved) {
      onCrossfitSaved(dia, value);
    }
  }

  function getStatus(dia: string): Status {
    return (checks.find((c) => c.dia === dia)?.status as Status) || "amarelo";
  }

  async function toggleStatus(dia: string, e: React.MouseEvent) {
    e.stopPropagation();
    const existing = checks.find((c) => c.dia === dia);
    const novo = NEXT[getStatus(dia)];
    if (existing) {
      setChecks((prev) => prev.map((c) => (c.id === existing.id ? { ...c, status: novo } : c)));
      await supabase.from("rcp_checks").update({ status: novo }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("rcp_checks")
        .insert({ athlete_id: athleteId, dia, status: novo })
        .select()
        .single();
      if (data) setChecks((prev) => [...prev, data as RcpCheck]);
    }
  }

  const diaLabel = DIAS.find((d) => d.key === selectedDia)?.label;
  const extraSelecionado = selectedDia ? getExtra(selectedDia) : undefined;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {DIAS.map((d) => {
          const hasText = !!getExtra(d.key)?.texto || !!getExtra(d.key)?.crossfit_texto;
          const status = getStatus(d.key);
          return (
            <button
              key={d.key}
              onClick={() => setSelectedDia(d.key)}
              className="relative py-3 rounded-xl text-[12.5px] font-extrabold"
              style={{
                background: selectedDia === d.key ? "rgba(34,197,94,0.14)" : "#18191c",
                color: selectedDia === d.key ? "#22c55e" : hasText ? "#22c55e" : "#9a9a9f",
                border: `1.5px solid ${selectedDia === d.key ? "rgba(34,197,94,0.4)" : hasText ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.09)"}`,
              }}
            >
              <span
                onClick={(e) => toggleStatus(d.key, e)}
                className="absolute"
                style={{
                  top: 5,
                  right: 5,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: STATUS_COLOR[status],
                  cursor: "pointer",
                }}
              />
              {d.label}
            </button>
          );
        })}
      </div>

      {selectedDia ? (
        <div className="flex flex-col gap-3">
          <div className="card p-4">
            <h3 className="font-extrabold text-[14px] mb-3" style={{ color: "#ccff00" }}>
              {diaLabel} · Treino de CrossFit da semana
            </h3>
            {editable ? (
              <textarea
                key={`cf-${selectedDia}`}
                defaultValue={extraSelecionado?.crossfit_texto || ""}
                onBlur={(e) => saveField(selectedDia, "crossfit_texto", e.target.value)}
                rows={10}
                placeholder="Escreva aqui o treino de CrossFit do dia..."
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
              />
            ) : extraSelecionado?.crossfit_texto ? (
              <div className="text-sm whitespace-pre-wrap" style={{ color: "#f2f2f0" }}>
                {extraSelecionado.crossfit_texto}
              </div>
            ) : (
              <div className="text-sm" style={{ color: "#6c6c72" }}>
                Nenhum treino de CrossFit registrado para este dia.
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-extrabold text-[14px] mb-3" style={{ color: "#22c55e" }}>
              {diaLabel} · Atividades extras
            </h3>
            {editable ? (
              <textarea
                key={`ex-${selectedDia}`}
                defaultValue={extraSelecionado?.texto || ""}
                onBlur={(e) => saveField(selectedDia, "texto", e.target.value)}
                rows={8}
                placeholder="Escreva aqui as atividades extras deste dia..."
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
              />
            ) : extraSelecionado?.texto ? (
              <div className="text-sm whitespace-pre-wrap" style={{ color: "#f2f2f0" }}>
                {extraSelecionado.texto}
              </div>
            ) : (
              <div className="text-sm" style={{ color: "#6c6c72" }}>
                Nenhuma atividade extra registrada para este dia.
              </div>
            )}
            <div className="flex gap-4 justify-center text-[11px] font-bold mt-3">
              <span style={{ color: "#22c55e" }}>● Feito</span>
              <span style={{ color: "#eab308" }}>● Em espera</span>
              <span style={{ color: "#ef4444" }}>● Não feito</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-sm py-8" style={{ color: "#6c6c72" }}>
          {editable ? "Clica em um dia da semana pra escrever." : "Toque em um dia da semana pra ver."}
        </div>
      )}
    </div>
  );
}
