"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RcpCheck } from "@/lib/types";

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

const COLORS: Record<Status, { bg: string; border: string; text: string }> = {
  amarelo: { bg: "rgba(234,179,8,0.14)", border: "rgba(234,179,8,0.45)", text: "#eab308" },
  verde: { bg: "rgba(34,197,94,0.14)", border: "rgba(34,197,94,0.45)", text: "#22c55e" },
  vermelho: { bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.45)", text: "#ef4444" },
};

export default function RcpCheckPanel({ athleteId, initialChecks }: { athleteId: string; initialChecks: RcpCheck[] }) {
  const [checks, setChecks] = useState<RcpCheck[]>(initialChecks);

  function getStatus(dia: string): Status {
    return (checks.find((c) => c.dia === dia)?.status as Status) || "amarelo";
  }

  async function toggle(dia: string) {
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

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {DIAS.map((d) => {
          const status = getStatus(d.key);
          const c = COLORS[status];
          return (
            <button
              key={d.key}
              onClick={() => toggle(d.key)}
              className="py-5 rounded-xl text-[12.5px] font-extrabold"
              style={{ background: c.bg, color: c.text, border: `1.5px solid ${c.border}` }}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-4 justify-center text-[11px] font-bold" style={{ color: "#9a9a9f" }}>
        <span style={{ color: "#22c55e" }}>● Feito</span>
        <span style={{ color: "#eab308" }}>● Em espera</span>
        <span style={{ color: "#ef4444" }}>● Não feito</span>
      </div>
    </div>
  );
}
